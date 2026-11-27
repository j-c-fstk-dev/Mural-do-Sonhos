import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  itemHeight,
  MIN_ITEM_WIDTH,
} from "./freeBoard";
import {
  FREE_ITEM_LIMIT,
  makeId,
  rowBase,
  type Asset,
  type Card,
  type FreeItem,
  type PhotoFrame,
  type Workspace,
} from "./model";

export const photoColors: Card["color"][] = [
  "lavender",
  "peach",
  "sage",
  "butter",
];
type Photo = Pick<Asset, "id" | "width" | "height">;
const ratioOf = (photo: Photo) => photo.width / photo.height;

export function photoCard(
  data: Workspace,
  photo: Workspace["gallery"][number],
  position: number,
  frame?: PhotoFrame,
): Card {
  return {
    ...rowBase(),
    dream_id: data.dream.id,
    goal_id: null,
    kind: "image",
    asset_id: photo.id,
    body: photo.label,
    caption: "",
    color: photoColors[position % photoColors.length],
    position,
    frame,
  };
}

export function freePhotoRatio(photo: Photo, frame?: PhotoFrame) {
  return frame === "polaroid"
    ? 0.84
    : Math.max(0.18, Math.min(5.6, ratioOf(photo)));
}

function assembleFree(data: Workspace, photos: Photo[], frame?: PhotoFrame) {
  if (data.free_items.length + photos.length > FREE_ITEM_LIMIT)
    throw new Error(
      "Esta página está cheia. Experimente montar em uma nova página.",
    );

  const blocked = data.free_items.map((item) => {
    const height = itemHeight(item);
    const angle = (item.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const width = item.width * cos + height * sin;
    const boxHeight = item.width * sin + height * cos;
    return {
      x: item.x + (item.width - width) / 2,
      y: item.y + (height - boxHeight) / 2,
      width,
      height: boxHeight,
    };
  });
  const gap = 16;
  let winner:
    | {
        area: number;
        boxes: { x: number; y: number; width: number; height: number }[];
      }
    | undefined;
  // Try different row widths. The largest combined photo area wins.
  for (let columns = 1; columns <= 10; columns++) {
    const minRows = Math.ceil(photos.length / columns);
    for (let rows = minRows; rows <= Math.min(minRows + 4, 12); rows++) {
      const cellW = (BOARD_WIDTH - gap) / columns;
      const cellH = (BOARD_HEIGHT - gap) / rows;
      const boxes = [];
      let area = 0;
      let cell = 0;
      for (const photo of photos) {
        const ratio = freePhotoRatio(photo, frame);
        const width = Math.min(cellW - gap, (cellH - gap) * ratio);
        const height = width / ratio;
        if (width < MIN_ITEM_WIDTH || height < 16) break;
        while (cell < columns * rows) {
          const row = Math.floor(cell / columns);
          const col = cell++ % columns;
          const count = Math.min(columns, photos.length - row * columns);
          const centerLast =
            !blocked.length && rows === minRows && count > 0
              ? ((columns - count) * cellW) / 2
              : 0;
          const x = gap / 2 + col * cellW + (cellW - width) / 2 + centerLast;
          const y = gap / 2 + row * cellH + (cellH - height) / 2;
          if (
            blocked.some(
              (box) =>
                x < box.x + box.width + gap / 2 &&
                x + width + gap / 2 > box.x &&
                y < box.y + box.height + gap / 2 &&
                y + height + gap / 2 > box.y,
            )
          )
            continue;
          boxes.push({ x, y, width, height });
          area += width * height;
          break;
        }
        if (cell >= columns * rows && boxes.length < photos.length) break;
      }
      if (boxes.length === photos.length && (!winner || area > winner.area))
        winner = { area, boxes };
    }
  }
  if (!winner)
    throw new Error(
      "As fotos não cabem nos espaços livres. Escolha menos fotos ou abra uma nova página.",
    );
  const items: FreeItem[] = winner.boxes.map((box, index) => ({
    ...box,
    id: makeId(),
    kind: "photo",
    asset_id: photos[index].id,
    frame,
    rotation: 0,
  }));
  data.free_items.push(...items);
}

export function assemblePhotos(
  data: Workspace,
  assets: Photo[],
  frame?: PhotoFrame,
) {
  if (!assets.length) return 0;
  const gallery = new Map(data.gallery.map((photo) => [photo.id, photo]));
  if (!assets.every((asset) => gallery.has(asset.id)))
    throw new Error("Uma foto selecionada já não está na galeria.");
  if (data.profile.template === "free") {
    assembleFree(data, assets, frame);
    return assets.length;
  }
  const placed = new Set(data.cards.map((card) => card.asset_id));
  const photos = assets.filter((asset) => !placed.has(asset.id));
  const occupied = new Set(data.cards.map((card) => card.position));
  const slots = Array.from({ length: 40 }, (_, index) => index).filter(
    (index) => !occupied.has(index),
  );
  if (photos.length > slots.length)
    throw new Error(
      `Só há ${slots.length} espaços livres. Escolha menos fotos ou abra uma nova página.`,
    );
  const count = photos.length;
  for (let index = 0; index < count; index++) {
    const slot = slots[index];
    let chosen = 0;
    const format =
      data.profile.template === "editorial" && slot === 0
        ? 3.5
        : data.profile.template === "mosaic" && slot % 6 === 0
          ? 1.25
          : null;
    if (format) {
      const distance = (photo: Photo) =>
        Math.abs(Math.log(ratioOf(photo) / format));
      for (let candidate = 1; candidate < photos.length; candidate++)
        if (distance(photos[candidate]) < distance(photos[chosen]))
          chosen = candidate;
    }
    const [photo] = photos.splice(chosen, 1);
    data.cards.push(photoCard(data, gallery.get(photo.id)!, slot, frame));
  }
  return count;
}
