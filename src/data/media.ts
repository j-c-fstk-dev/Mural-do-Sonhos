import { drawPaper, fonts } from "./paper";
import {
  makeId,
  now,
  type Asset,
  type Card,
  type Workspace,
  workspaceSchema,
} from "./model";
import type { Store } from "./useWorkspace";
import type { Repository } from "./repository";
import { z } from "zod";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export async function compressImage(file: Blob): Promise<Asset> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (file.size > MAX_IMAGE_SIZE)
    throw new Error("A imagem deve ter no máximo 10 MB.");
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new Error("Não foi possível abrir essa imagem.");
  });
  try {
    if (bitmap.width * bitmap.height > 50_000_000)
      throw new Error(
        "A imagem é grande demais. Reduza a resolução e tente novamente.",
      );
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("Falha ao preparar a imagem.")),
        "image/jpeg",
        0.8,
      ),
    );
    if (blob.size > 2 * 1024 * 1024)
      throw new Error(
        "A imagem ainda está muito grande. Tente uma imagem menor.",
      );
    return {
      id: makeId(),
      blob,
      width: canvas.width,
      height: canvas.height,
      created_at: now(),
    };
  } finally {
    bitmap.close();
  }
}
export async function importGalleryPhotos(
  files: File[],
  mutate: Store["mutate"],
) {
  if (files.length > 40) throw new Error("A galeria comporta até 40 fotos.");
  const assets: Asset[] = [];
  // Decode one photo at a time to limit memory use on mobile.
  for (const file of files) assets.push(await compressImage(file));
  const photos = assets.map((asset, index) => ({
    id: asset.id,
    label:
      files[index].name.replace(/\.[^.]+$/, "").slice(0, 500) ||
      "Imagem do meu sonho",
    created_at: asset.created_at,
  }));
  await mutate(
    (data) => {
      if (data.gallery.length + photos.length > 40)
        throw new Error(
          "A galeria comporta até 40 fotos. Libere espaço para adicionar mais.",
        );
      data.gallery.push(...photos);
    },
    { assets },
  );
  return photos;
}

export function removeGalleryPhoto(id: string, mutate: Store["mutate"]) {
  return mutate(
    (data) => {
      data.gallery = data.gallery.filter((photo) => photo.id !== id);
      for (const page of [data, ...data.pages]) {
        page.cards = page.cards.filter((card) => card.asset_id !== id);
        page.free_items = page.free_items.filter(
          (item) => item.kind !== "photo" || item.asset_id !== id,
        );
      }
    },
    { removeAssets: [id] },
  );
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function base64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export async function exportBackup(data: Workspace, repository: Repository) {
  const ids = new Set(data.gallery.map((photo) => photo.id));
  const assets = await repository.assets();
  if ([...ids].some((id) => !assets.some((asset) => asset.id === id)))
    throw new Error(
      "Uma imagem não foi encontrada. Corrija o mural antes de exportar.",
    );
  const encoded = await Promise.all(
    assets
      .filter((asset) => ids.has(asset.id))
      .map(async (asset) => ({
        id: asset.id,
        width: asset.width,
        height: asset.height,
        created_at: asset.created_at,
        type: asset.blob.type,
        data: await base64(asset.blob),
      })),
  );
  const file = new Blob(
    [
      JSON.stringify({
        format: "mural-dos-sonhos",
        version: 2,
        exported_at: now(),
        workspace: data,
        assets: encoded,
      }),
    ],
    { type: "application/json" },
  );
  if (file.size > 60 * 1024 * 1024)
    throw new Error(
      "O backup excede 60 MB. Reduza o número de imagens antes de exportar.",
    );
  download(file, "mural-dos-sonhos-backup.json");
}
const backupSchema = z.object({
  format: z.literal("mural-dos-sonhos"),
  version: z.literal(2),
  workspace: workspaceSchema,
  assets: z
    .array(
      z.object({
        id: z.uuid(),
        width: z.number().int().positive().max(1600),
        height: z.number().int().positive().max(1600),
        created_at: z.iso.datetime(),
        type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        data: z
          .string()
          .max(3_000_000)
          .regex(/^[A-Za-z0-9+/]*={0,2}$/),
      }),
    )
    .max(40),
});
export async function readBackup(file: File) {
  if (file.size > 60 * 1024 * 1024)
    throw new Error("O backup deve ter no máximo 60 MB.");
  const parsed = backupSchema.safeParse(JSON.parse(await file.text()));
  if (!parsed.success)
    throw new Error(
      "Esse arquivo não é um backup válido da versão atual do Mural dos Sonhos.",
    );
  const { workspace, assets: encoded } = parsed.data;
  if (new Set(encoded.map((asset) => asset.id)).size !== encoded.length)
    throw new Error("O backup contém imagens duplicadas.");
  const assets: Asset[] = [];
  for (const asset of encoded) {
    const bytes = Uint8Array.from(atob(asset.data), (char) =>
      char.charCodeAt(0),
    );
    const blob = new Blob([bytes], { type: asset.type });
    const image = await createImageBitmap(blob).catch(() => {
      throw new Error("O backup contém uma imagem inválida.");
    });
    const valid =
      image.width === asset.width &&
      image.height === asset.height &&
      blob.size <= 2 * 1024 * 1024;
    image.close();
    if (!valid) throw new Error("O backup contém uma imagem fora dos limites.");
    assets.push({
      id: asset.id,
      width: asset.width,
      height: asset.height,
      created_at: asset.created_at,
      blob,
    });
  }
  if (
    workspace.gallery.some(
      (photo) => !assets.some((asset) => asset.id === photo.id),
    )
  )
    throw new Error("O backup está incompleto: uma imagem está faltando.");
  return { workspace, assets };
}
const palette = {
  lavender: "#e8dff2",
  peach: "#f7dfcf",
  sage: "#e0e8da",
  butter: "#f6edc8",
};
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.replace(/\n/g, " ").split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    // Break long strings too, so user text never crosses the card boundary.
    for (const part of word.match(/.{1,24}/gu) || [""]) {
      const next = line ? `${line} ${part}` : part;
      if (ctx.measureText(next).width > width && line) {
        lines.push(line);
        line = part;
      } else line = next;
    }
  }
  if (line) lines.push(line);
  lines
    .slice(0, maxLines)
    .forEach((value, index) =>
      ctx.fillText(
        index === maxLines - 1 && lines.length > maxLines
          ? value.slice(0, -1) + "…"
          : value,
        x,
        y + index * lineHeight,
      ),
    );
}
export async function exportMural(data: Workspace, repository: Repository) {
  const cards = sortedCards(data.cards);
  const template = data.profile.template;
  const columns = template === "mosaic" ? 4 : 3;
  const gap = template === "mosaic" ? 14 : 20;
  const unitWidth = (1000 - (columns - 1) * gap) / columns;
  const unitHeight = template === "mosaic" ? 270 : 335;
  const occupied = new Set<string>();
  const slots: {
    x: number;
    y: number;
    w: number;
    h: number;
    card?: Card;
    position: number;
  }[] = [];
  const count = Math.max(6, (cards.at(-1)?.position ?? -1) + 1);
  let cursorRow = 0,
    cursorColumn = 0;
  for (let position = 0; position < count; position++) {
    const wide =
      template === "editorial" && position === 0
        ? columns
        : template === "mosaic" && position % 6 === 0
          ? 2
          : 1;
    const tall = template === "mosaic" && position % 6 === 0 ? 2 : 1;
    while (true) {
      if (cursorColumn + wide > columns) {
        cursorColumn = 0;
        cursorRow++;
        continue;
      }
      let free = true;
      for (let dy = 0; dy < tall; dy++)
        for (let dx = 0; dx < wide; dx++)
          if (occupied.has(`${cursorRow + dy}:${cursorColumn + dx}`))
            free = false;
      if (free) break;
      cursorColumn++;
    }
    for (let dy = 0; dy < tall; dy++)
      for (let dx = 0; dx < wide; dx++)
        occupied.add(`${cursorRow + dy}:${cursorColumn + dx}`);
    slots.push({
      x: 40 + cursorColumn * (unitWidth + gap),
      y: 235 + cursorRow * (unitHeight + gap),
      w: unitWidth * wide + gap * (wide - 1),
      h: unitHeight * tall + gap * (tall - 1),
      card: cards.find((card) => card.position === position),
      position,
    });
    cursorColumn += wide;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = Math.max(...slots.map((slot) => slot.y + slot.h)) + 65;
  const ctx = canvas.getContext("2d")!;
  drawPaper(ctx, data.paper, canvas.width, canvas.height);
  ctx.fillStyle = "#463c53";
  ctx.font = "bold 37px Georgia";
  ctx.fillText("Mural dos Sonhos", 40, 65);
  ctx.fillStyle = data.paper.titleColor;
  ctx.font = `24px ${fonts[data.paper.titleFont].family}`;
  await document.fonts.load(ctx.font).catch(() => []);
  wrap(
    ctx,
    data.paper.title || data.dream.description || "Mural dos Sonhos",
    40,
    112,
    1000,
    32,
    3,
  );
  for (const { x, y, w, h, card, position } of slots) {
    if (!card) continue;
    ctx.save();
    if (template === "scrapbook") {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((position % 2 ? 1 : -1) * 0.022);
      ctx.translate(-x - w / 2, -y - h / 2);
    }
    ctx.fillStyle =
      template === "polaroid" || template === "clean"
        ? "#fffdf9"
        : palette[card.color];
    ctx.fillRect(x, y, w, h);
    const imageHeight = h - 95;
    if (card.asset_id) {
      const asset = await repository.asset(card.asset_id);
      if (!asset) throw new Error("Imagem não encontrada. Revise o mural.");
      const image = await createImageBitmap(asset.blob);
      const scale = Math.max(
        (w - 28) / image.width,
        imageHeight / image.height,
      );
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 14, y + 14, w - 28, imageHeight);
      ctx.clip();
      ctx.drawImage(
        image,
        x + w / 2 - (image.width * scale) / 2,
        y + 14 + imageHeight / 2 - (image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
      );
      ctx.restore();
      image.close();
    } else {
      ctx.fillStyle = "#463c53";
      ctx.font = `${w > 500 ? 32 : 25}px Georgia`;
      wrap(
        ctx,
        card.body,
        x + 22,
        y + 50,
        w - 44,
        35,
        Math.floor((imageHeight - 30) / 35),
      );
    }
    ctx.fillStyle = "#463c53";
    ctx.font = "19px sans-serif";
    wrap(ctx, card.caption, x + 16, y + h - 50, w - 32, 25, 2);
    if (template === "scrapbook") {
      ctx.fillStyle = "#dfcda9b0";
      ctx.translate(x + w / 2, y);
      ctx.rotate(-0.1);
      ctx.fillRect(-37, -9, 74, 23);
    }
    ctx.restore();
  }
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#6c6074";
  ctx.fillText("Um pequeno passo também é caminho.", 40, canvas.height - 20);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("Falha ao exportar o mural.")),
      "image/png",
    ),
  );
  download(blob, "meu-mural-dos-sonhos.png");
}
export function sortedCards(cards: Card[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}
