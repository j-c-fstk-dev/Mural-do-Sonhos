import { download } from "./media";
import type { FreeItem, Workspace } from "./model";
import type { Repository } from "./repository";
import { getSticker } from "./stickers";

export const BOARD_WIDTH = 1000;
export const BOARD_HEIGHT = 750;
export const MIN_ITEM_WIDTH = 100;
export const MAX_ITEM_WIDTH = 640;
export const BOARD_PAPER = "#fcf8ee";
export const BOARD_DOT = "#d9ccb7";
export const DOT_SPACING = 25;

export function itemHeight(item: Pick<FreeItem, "kind" | "width">) {
  return item.width * (item.kind === "sticker" ? 1 : 0.75);
}

export function fitItem(
  item: FreeItem,
  x: number,
  y: number,
  width = item.width,
): FreeItem {
  const next = {
    ...item,
    width: Math.min(MAX_ITEM_WIDTH, Math.max(MIN_ITEM_WIDTH, width)),
  };
  return {
    ...next,
    x: Math.round(Math.max(0, Math.min(BOARD_WIDTH - next.width, x))),
    y: Math.round(Math.max(0, Math.min(BOARD_HEIGHT - itemHeight(next), y))),
  };
}

export function initialPlacement(item: FreeItem, existing: FreeItem[]) {
  const columns = [BOARD_WIDTH / 6, BOARD_WIDTH / 2, (BOARD_WIDTH * 5) / 6];
  const rows = [BOARD_HEIGHT / 6, BOARD_HEIGHT / 2, (BOARD_HEIGHT * 5) / 6];
  const height = itemHeight(item);
  for (const cell of [4, 0, 2, 6, 8, 1, 3, 5, 7]) {
    const next = fitItem(
      item,
      columns[cell % 3] - item.width / 2,
      rows[Math.floor(cell / 3)] - height / 2,
    );
    const overlaps = existing.some(
      (other) =>
        next.x < other.x + other.width &&
        next.x + next.width > other.x &&
        next.y < other.y + itemHeight(other) &&
        next.y + height > other.y,
    );
    if (!overlaps) return next;
  }
  const offset = (existing.length % 6) * 24 - 60;
  return fitItem(
    item,
    (BOARD_WIDTH - item.width) / 2 + offset,
    (BOARD_HEIGHT - height) / 2 + offset,
  );
}

function escapeXml(text: string) {
  return text.replace(
    // oxlint-disable-next-line no-control-regex -- XML forbids these code points.
    /[&<>\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/gu,
    (char) => {
      if (char === "&") return "&amp;";
      if (char === "<") return "&lt;";
      if (char === ">") return "&gt;";
      return "�";
    },
  );
}

export function noteImage(body: string) {
  const ctx = document.createElement("canvas").getContext("2d")!;
  // Use a single SVG for the editor and the download, so wrapping matches.
  const linesAtSize = (size: number) => {
    ctx.font = `${size}px Georgia, serif`;
    return body.split(/\r?\n/).flatMap((paragraph) => {
      const lines = [""];
      for (const word of paragraph.split(/\s+/)) {
        const index = lines.length - 1;
        const next = lines[index] ? `${lines[index]} ${word}` : word;
        if (ctx.measureText(next).width <= 262) lines[index] = next;
        else {
          if (lines[index]) lines.push("");
          for (const char of word) {
            const last = lines.length - 1;
            if (ctx.measureText(lines[last] + char).width > 262)
              lines.push(char);
            else lines[last] += char;
          }
        }
      }
      return lines;
    });
  };
  let size = 30;
  let lines = linesAtSize(size);
  while (size > 12 && lines.length * size * 1.2 > 184) {
    size -= 2;
    lines = linesAtSize(size);
  }
  const limit = Math.floor(184 / (size * 1.2));
  const visible = lines.slice(0, limit);
  if (lines.length > limit) visible[limit - 1] = "…";
  const firstBaseline =
    (240 - (visible.length - 1) * size * 1.2) / 2 + size * 0.32;
  const content = visible
    .map(
      (line, index) =>
        `<text x="160" y="${firstBaseline + index * size * 1.2}">${escapeXml(line)}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" rx="9" fill="#f7e6b9"/><path d="M18 17v206" stroke="#e3c990" stroke-width="2"/><g fill="#493741" font-family="Georgia, serif" font-size="${size}" text-anchor="middle">${content}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

async function svgImage(src: string) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export async function exportFreeMural(data: Workspace, repository: Repository) {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_WIDTH * 2;
  canvas.height = BOARD_HEIGHT * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.fillStyle = BOARD_PAPER;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  ctx.fillStyle = BOARD_DOT;
  for (let y = DOT_SPACING / 2; y < BOARD_HEIGHT; y += DOT_SPACING)
    for (let x = DOT_SPACING / 2; x < BOARD_WIDTH; x += DOT_SPACING) {
      ctx.beginPath();
      ctx.arc(x, y, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

  for (const item of data.free_items) {
    const { x, y, width } = item;
    const height = itemHeight(item);
    if (item.kind === "photo") {
      const asset = await repository.asset(item.asset_id);
      if (!asset) throw new Error("Imagem não encontrada. Revise o mural.");
      const image = await createImageBitmap(asset.blob);
      try {
        const scale = Math.min(width / image.width, height / image.height);
        ctx.fillStyle = "#fffcf6";
        ctx.fillRect(x, y, width, height);
        ctx.drawImage(
          image,
          x + (width - image.width * scale) / 2,
          y + (height - image.height * scale) / 2,
          image.width * scale,
          image.height * scale,
        );
      } finally {
        image.close();
      }
    } else {
      const src =
        item.kind === "text"
          ? noteImage(item.body)
          : getSticker(item.sticker)?.src;
      if (!src)
        throw new Error("Figurinha indisponível. Revise as camadas do mural.");
      ctx.drawImage(await svgImage(src), x, y, width, height);
    }
  }

  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao exportar o mural."));
    }, "image/png");
  });
  download(png, "meu-mural-dos-sonhos.png");
}
