import { download } from "./download";
import { photoFrameColor } from "./photoFrames";
import type { FreeItem, Workspace } from "./model";
import { drawPageBackground, fonts, shapes } from "./paper";
import type { Repository } from "./repository";
import { getSticker } from "./stickers";

export const BOARD_WIDTH = 1000;
export const BOARD_HEIGHT = 750;
export const MIN_ITEM_WIDTH = 32;
export const MAX_ITEM_WIDTH = BOARD_WIDTH;

type TextItem = Extract<FreeItem, { kind: "text" }>;
type ShapeItem = Extract<FreeItem, { kind: "shape" }>;

let measure: CanvasRenderingContext2D | undefined;
function textLayout(item: TextItem) {
  measure ??= document.createElement("canvas").getContext("2d")!;
  const font = `${item.bold ? 700 : 400} ${item.fontSize}px ${fonts[item.font].family}`;
  measure.font = font;
  const ctx = measure;
  const lineHeight = item.fontSize * 1.24;
  const padding = 4;
  const paragraphs = (item.body || " ").split("\n");
  const markerWidth =
    item.list === "none"
      ? 0
      : ctx.measureText(
          item.list === "bullet" ? "•  " : `${paragraphs.length}.  `,
        ).width;
  const available = Math.max(1, item.width - padding * 2 - markerWidth);
  const lines = paragraphs.flatMap((paragraph, index) => {
    const marker =
      item.list === "bullet"
        ? "•"
        : item.list === "numbered"
          ? `${index + 1}.`
          : "";
    const wrapped = [""];
    for (const word of paragraph.trim().split(/\s+/)) {
      const last = wrapped.length - 1;
      const next = wrapped[last] ? `${wrapped[last]} ${word}` : word;
      if (ctx.measureText(next).width <= available) {
        wrapped[last] = next;
      } else {
        if (wrapped[last]) wrapped.push("");
        for (const char of word) {
          const row = wrapped.length - 1;
          if (
            wrapped[row] &&
            ctx.measureText(wrapped[row] + char).width > available
          )
            wrapped.push(char);
          else wrapped[row] += char;
        }
      }
    }
    return wrapped.map((text, row) => ({
      text,
      marker: row === 0 ? marker : "",
    }));
  });
  const height = Math.min(
    BOARD_HEIGHT,
    Math.max(
      16,
      lines.length * lineHeight + padding * 2 + Math.abs(item.curve) * 2,
    ),
  );
  return { font, lineHeight, lines, markerWidth, height, padding };
}

export function itemHeight(item: FreeItem) {
  if (item.kind === "text") return textLayout(item).height;
  return item.height ?? item.width * (item.kind === "photo" ? 0.75 : 1);
}

export function fitItem(
  item: FreeItem,
  x: number,
  y: number,
  width = item.width,
): FreeItem {
  const next = {
    ...item,
    width: Math.max(MIN_ITEM_WIDTH, Math.min(MAX_ITEM_WIDTH, width)),
  };
  return {
    ...next,
    x: Math.max(0, Math.min(BOARD_WIDTH - next.width, x)),
    y: Math.max(0, Math.min(BOARD_HEIGHT - itemHeight(next), y)),
  };
}

export function initialPlacement(item: FreeItem, existing: FreeItem[]) {
  for (const cell of [4, 0, 2, 6, 8, 1, 3, 5, 7]) {
    const next = fitItem(
      item,
      (BOARD_WIDTH * (2 * (cell % 3) + 1)) / 6 - item.width / 2,
      (BOARD_HEIGHT * (2 * Math.floor(cell / 3) + 1)) / 6 -
        itemHeight(item) / 2,
    );
    if (
      !existing.some(
        (other) =>
          next.x < other.x + other.width &&
          next.x + next.width > other.x &&
          next.y < other.y + itemHeight(other) &&
          next.y + itemHeight(next) > other.y,
      )
    )
      return next;
  }
  return fitItem(
    item,
    260 + (existing.length % 6) * 24,
    260 + (existing.length % 6) * 24,
  );
}

export function drawText(ctx: CanvasRenderingContext2D, item: TextItem) {
  const { font, lines, lineHeight, markerWidth, padding, height } =
    textLayout(item);
  if (item.backgroundMode === "filled") {
    ctx.fillStyle = item.backgroundColor;
    ctx.fillRect(0, 0, item.width, height);
  }
  ctx.font = font;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = item.color;
  ctx.lineWidth = Math.max(1, item.fontSize / 15);
  ctx.textBaseline = "alphabetic";
  const start = padding + markerWidth;
  lines.forEach(({ text, marker }, index) => {
    const y =
      padding + item.fontSize + index * lineHeight + Math.abs(item.curve);
    if (marker) ctx.fillText(marker, padding, y);
    if (!text) return;
    if (!item.curve) {
      ctx.fillText(text, start, y);
      if (item.underline) {
        ctx.beginPath();
        ctx.moveTo(start, y + 3);
        ctx.lineTo(start + ctx.measureText(text).width, y + 3);
        ctx.stroke();
      }
      return;
    }
    const width = Math.max(50, ctx.measureText(text).width);
    let x = 0;
    for (const char of text) {
      const advance = ctx.measureText(char).width;
      const t = (x + advance / 2) / width;
      const offset = item.curve * (4 * t * (1 - t) - 0.5);
      const slope = (item.curve * (4 - 8 * t)) / width;
      ctx.save();
      ctx.translate(start + x + advance / 2, y + offset);
      ctx.rotate(Math.atan(slope));
      ctx.fillText(char, -advance / 2, 0);
      if (item.underline) {
        ctx.beginPath();
        ctx.moveTo(-advance / 2, 3);
        ctx.lineTo(advance / 2, 3);
        ctx.stroke();
      }
      ctx.restore();
      x += advance;
    }
  });
}

export function drawShape(ctx: CanvasRenderingContext2D, item: ShapeItem) {
  const preset = shapes[item.shape];
  const path = new Path2D(preset.path);
  ctx.save();
  ctx.scale(item.width / 100, itemHeight(item) / 100);
  ctx.fillStyle = item.color;
  ctx.strokeStyle = item.color;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (preset.filled) ctx.fill(path);
  else ctx.stroke(path);
  ctx.restore();
}

export async function exportFreeMural(data: Workspace, repository: Repository) {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_WIDTH * 2;
  canvas.height = BOARD_HEIGHT * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  await drawPageBackground(
    ctx,
    data.paper,
    BOARD_WIDTH,
    BOARD_HEIGHT,
    repository,
  );
  await drawBoardItems(ctx, data.free_items, repository);
  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao exportar o mural."));
    }, "image/png");
  });
  download(png, "meu-mural-dos-sonhos.png");
}

export async function drawBoardItems(
  ctx: CanvasRenderingContext2D,
  items: FreeItem[],
  repository: Repository,
) {
  await Promise.allSettled(
    items.flatMap((item) =>
      item.kind === "text"
        ? [
            document.fonts.load(
              `${item.bold ? 700 : 400} ${item.fontSize}px ${fonts[item.font].family}`,
              item.body,
            ),
          ]
        : [],
    ),
  );
  for (const item of items) {
    const height = itemHeight(item);
    ctx.save();
    ctx.translate(item.x + item.width / 2, item.y + height / 2);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.translate(-item.width / 2, -height / 2);
    ctx.beginPath();
    ctx.rect(0, 0, item.width, height);
    ctx.clip();
    if (item.kind === "text") drawText(ctx, item);
    if (item.kind === "shape") drawShape(ctx, item);
    if (item.kind === "sticker") {
      const src = getSticker(item.sticker)?.src;
      if (!src) throw new Error("Figurinha indisponível.");
      const image = new Image();
      image.src = src;
      await image.decode();
      ctx.drawImage(image, 0, 0, item.width, height);
    }
    if (item.kind === "photo") {
      const asset = await repository.asset(item.asset_id);
      if (!asset) throw new Error("Imagem não encontrada. Revise o mural.");
      const image = await createImageBitmap(asset.blob);
      try {
        const frameColor = photoFrameColor(item.frame);
        if (frameColor) {
          ctx.fillStyle = frameColor;
          ctx.fillRect(0, 0, item.width, height);
          const x = item.width * 0.065;
          const y = height * 0.06;
          const w = item.width * 0.87;
          const h = height * (item.frame === "polaroid" ? 0.755 : 0.88);
          const scale = Math.max(w / image.width, h / image.height);
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(
            image,
            x + (w - image.width * scale) / 2,
            y + (h - image.height * scale) / 2,
            image.width * scale,
            image.height * scale,
          );
        } else if (item.height) ctx.drawImage(image, 0, 0, item.width, height);
        else {
          const scale = Math.min(
            item.width / image.width,
            height / image.height,
          );
          const w = image.width * scale;
          const h = image.height * scale;
          ctx.fillStyle = "#fffcf6";
          ctx.fillRect(0, 0, item.width, height);
          ctx.drawImage(image, (item.width - w) / 2, (height - h) / 2, w, h);
        }
      } finally {
        image.close();
      }
    }
    ctx.restore();
  }
}
