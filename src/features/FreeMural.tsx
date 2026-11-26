import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Download,
  ImagePlus,
  Pencil,
  Layers,
  RotateCw,
  Shapes,
  Smile,
  Trash2,
  Type,
} from "lucide-react";
import { LocalImage } from "../components/LocalImage";
import { Feedback, type ScreenProps } from "../components/ui";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  drawShape,
  drawText,
  exportFreeMural,
  fitItem,
  initialPlacement,
  itemHeight,
  MIN_ITEM_WIDTH,
} from "../data/freeBoard";
import { importGalleryPhotos, removeGalleryPhoto } from "../data/media";
import { FREE_ITEM_LIMIT, makeId, type FreeItem } from "../data/model";
import { fonts, shapes } from "../data/paper";
import { getSticker, stickerCollections } from "../data/stickers";
import { useAction } from "../data/useAction";
import "./FreeMural.css";

type TextItem = Extract<FreeItem, { kind: "text" }>;
type ShapeItem = Extract<FreeItem, { kind: "shape" }>;
type Content =
  | { kind: "photo"; asset_id: string }
  | { kind: "sticker"; sticker: string }
  | Pick<ShapeItem, "kind" | "shape" | "color">
  | Pick<
      TextItem,
      | "kind"
      | "body"
      | "font"
      | "fontSize"
      | "color"
      | "bold"
      | "underline"
      | "list"
      | "curve"
      | "backgroundMode"
      | "backgroundColor"
    >;
type Geometry = Pick<FreeItem, "x" | "y" | "width" | "height" | "rotation">;
type Handle =
  "move" | "rotate" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type Drag = {
  pointer: number;
  item: FreeItem;
  handle: Handle;
  x: number;
  y: number;
  moved: boolean;
};
const handles: Exclude<Handle, "rotate" | "move">[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];
const arrows = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
} as const;
const normalizeAngle = (angle: number) =>
  ((((angle + 180) % 360) + 360) % 360) - 180;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

function transformItem(drag: Drag, x: number, y: number): FreeItem {
  const { item, handle } = drag;
  const dx = x - drag.x;
  const dy = y - drag.y;
  if (handle === "move") return fitItem(item, item.x + dx, item.y + dy);
  const height = itemHeight(item);
  const centerX = item.x + item.width / 2;
  const centerY = item.y + height / 2;
  if (handle === "rotate") {
    const start = Math.atan2(drag.y - centerY, drag.x - centerX);
    const end = Math.atan2(y - centerY, x - centerX);
    return {
      ...item,
      rotation: normalizeAngle(
        Math.round(item.rotation + ((end - start) * 180) / Math.PI),
      ),
    };
  }
  const radians = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  const horizontal = handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0;
  const vertical = handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0;
  const width = clamp(
    item.width + localX * horizontal,
    MIN_ITEM_WIDTH,
    BOARD_WIDTH,
  );
  const resized =
    item.kind === "text"
      ? { ...item, width }
      : {
          ...item,
          width,
          height: clamp(height + localY * vertical, 16, BOARD_HEIGHT),
        };
  const resizedHeight = itemHeight(resized);
  const shiftX = ((width - item.width) * horizontal) / 2;
  const shiftY =
    ((resizedHeight - height) * (item.kind === "text" ? 1 : vertical)) / 2;
  return fitItem(
    resized,
    centerX + shiftX * cos - shiftY * sin - width / 2,
    centerY + shiftX * sin + shiftY * cos - resizedHeight / 2,
  );
}

function PaintedItem({
  item,
  fontsReady,
}: {
  item: TextItem | ShapeItem;
  fontsReady: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2, 2);
    if (item.kind === "text") drawText(ctx, item);
    else drawShape(ctx, item);
    ctx.restore();
  }, [item, fontsReady]);
  return (
    <canvas
      ref={ref}
      width={Math.ceil(item.width * 2)}
      height={Math.ceil(itemHeight(item) * 2)}
      aria-hidden="true"
    />
  );
}

function InlineText({
  item,
  done,
}: {
  item: TextItem;
  done: (body?: string) => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    field.current?.focus({ preventScroll: true });
    field.current?.select();
  }, []);

  function finish(save: boolean) {
    if (finished.current) return;
    finished.current = true;
    done(save ? field.current?.value : undefined);
  }

  return (
    <div
      className="book-inline-text"
      data-up={item.y > 550}
      data-left={item.x > 600}
    >
      <textarea
        ref={field}
        defaultValue={item.body}
        maxLength={1000}
        aria-label="Escreva na folha"
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget))
            finish(true);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" ||
            (event.key === "Enter" && (event.ctrlKey || event.metaKey))
          ) {
            event.preventDefault();
            finish(event.key === "Enter");
          }
        }}
      />
      <button
        type="button"
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => finish(true)}
      >
        Pronto
      </button>
      <button
        type="button"
        className="text-button"
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => finish(false)}
      >
        Cancelar
      </button>
    </div>
  );
}

function TextEditor({
  item,
  update,
  previewBody,
}: {
  item: TextItem;
  update: (patch: Partial<TextItem>) => void;
  previewBody: (body: string | null) => void;
}) {
  return (
    <div className="book-text-controls">
      <label>
        O que está escrito
        <textarea
          defaultValue={item.body}
          rows={4}
          maxLength={1000}
          onChange={(event) => previewBody(event.currentTarget.value)}
          onBlur={(event) => {
            previewBody(null);
            if (event.currentTarget.value !== item.body)
              update({ body: event.currentTarget.value });
          }}
        />
      </label>
      <label>
        Letra do texto
        <select
          value={item.font}
          onChange={(event) =>
            update({ font: event.target.value as TextItem["font"] })
          }
        >
          {Object.entries(fonts).map(([key, font]) => (
            <option key={key} value={key}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
      <div className="book-field-grid">
        <label>
          Tamanho da letra
          <input
            type="number"
            min={10}
            max={120}
            value={item.fontSize}
            onChange={(event) => {
              if (event.currentTarget.value)
                update({
                  fontSize: clamp(event.currentTarget.valueAsNumber, 10, 120),
                });
            }}
          />
        </label>
        <label>
          Cor do texto{" "}
          <input
            type="color"
            value={item.color}
            onChange={(event) => update({ color: event.target.value })}
          />
        </label>
      </div>
      <label>
        Fundo do texto
        <select
          value={item.backgroundMode}
          onChange={(event) =>
            update({
              backgroundMode: event.target.value as TextItem["backgroundMode"],
            })
          }
        >
          <option value="transparent">Transparente</option>
          <option value="filled">Preenchido</option>
        </select>
      </label>
      {item.backgroundMode === "filled" && (
        <label>
          Cor do fundo do texto
          <input
            type="color"
            value={item.backgroundColor}
            onChange={(event) =>
              update({ backgroundColor: event.target.value })
            }
          />
        </label>
      )}
      <div className="book-compact-buttons">
        <button
          className="text-button"
          type="button"
          aria-pressed={item.bold}
          onClick={() => update({ bold: !item.bold })}
        >
          <b>Negrito</b>
        </button>
        <button
          className="text-button"
          type="button"
          aria-pressed={item.underline}
          onClick={() => update({ underline: !item.underline })}
        >
          <u>Sublinhado</u>
        </button>
      </div>
      <label>
        Lista
        <select
          value={item.list}
          onChange={(event) =>
            update({ list: event.target.value as TextItem["list"] })
          }
        >
          <option value="none">Sem lista</option>
          <option value="bullet">Com bolinhas</option>
          <option value="numbered">Numerada</option>
        </select>
      </label>
      <label>
        Curvar o texto
        <input
          type="range"
          min={-100}
          max={100}
          step={5}
          value={item.curve}
          onChange={(event) => update({ curve: event.target.valueAsNumber })}
        />
        <output aria-hidden="true">{item.curve}</output>
      </label>
    </div>
  );
}

export function FreeMural({
  store,
  sidebar,
  inspector,
  closeMobileSidebar,
  showInspector,
}: ScreenProps & {
  sidebar: HTMLElement | null;
  inspector: HTMLElement | null;
  closeMobileSidebar: () => void;
  showInspector: () => void;
}) {
  const [selectedId, select] = useState<string | null>(null);
  const [library, setLibrary] = useState<"photos" | "text" | "stickers" | null>(
    "photos",
  );
  const [category, setCategory] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [inlineId, setInlineId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<{
    id: string;
    body: string;
  } | null>(null);
  const [preview, setPreview] = useState<FreeItem | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const action = useAction();
  const items = store.data.free_items;
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const selected = items[selectedIndex];
  const full = items.length >= FREE_ITEM_LIMIT;

  useEffect(() => {
    let live = true;
    const loads = Object.values(fonts).flatMap(({ family }) =>
      [400, 700].map((weight) =>
        document.fonts.load(`${weight} 30px ${family}`, "Ação e sonhos"),
      ),
    );
    void Promise.allSettled(loads).then(() => {
      if (live) setFontsReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  function previewItem(item: FreeItem) {
    if (preview?.id === item.id) return preview;
    if (item.kind === "text" && draftText?.id === item.id)
      return fitItem({ ...item, body: draftText.body }, item.x, item.y);
    return item;
  }

  function label(item: FreeItem) {
    switch (item.kind) {
      case "photo":
        return (
          store.data.gallery.find((photo) => photo.id === item.asset_id)
            ?.label || "Foto"
        );
      case "text":
        return item.body.trim() || "Texto vazio";
      case "shape":
        return shapes[item.shape].label;
      case "sticker":
        return getSticker(item.sticker)?.label || "Figurinha";
    }
  }

  function add(content: Content) {
    const id = makeId();
    void action
      .run(async () => {
        const asset =
          content.kind === "photo"
            ? await store.repository.asset(content.asset_id)
            : undefined;
        const base = { id, x: 0, y: 0, rotation: 0, width: 170 };
        if (content.kind === "photo") {
          if (!asset) throw new Error("Imagem não encontrada.");
          base.width = Math.max(
            MIN_ITEM_WIDTH,
            Math.min(360, (320 * asset.width) / asset.height),
          );
        }
        const item = {
          ...base,
          ...content,
          width: content.kind === "text" ? 365 : base.width,
          height: asset
            ? clamp((base.width * asset.height) / asset.width, 16, BOARD_HEIGHT)
            : undefined,
        };
        await store.mutate((data) => {
          if (data.free_items.length >= FREE_ITEM_LIMIT)
            throw new Error("O limite desta página foi atingido.");
          data.free_items.push(initialPlacement(item, data.free_items));
        });
      })
      .then((ok) => {
        if (ok) {
          select(id);
          closeMobileSidebar();
          if (content.kind === "text") showInspector();
        }
      });
  }

  function addText(kind: "text" | "title" | "list") {
    add({
      kind: "text",
      body:
        kind === "title"
          ? "Viagem à praia"
          : kind === "list"
            ? "Escolher uma praia\nJuntar fotos\nPlanejar a viagem"
            : "Quero aprender a surfar.",
      font: kind === "title" ? "display" : "sans",
      fontSize: kind === "title" ? 48 : 28,
      color: "#493741",
      backgroundMode: "transparent",
      backgroundColor: "#f7e6b9",
      bold: kind === "title",
      underline: false,
      list: kind === "list" ? "bullet" : "none",
      curve: 0,
    });
  }

  function update(
    item: FreeItem,
    patch: Partial<Geometry> | Partial<TextItem> | Partial<ShapeItem>,
  ) {
    void action.run(() =>
      store.mutate((data) => {
        const current = data.free_items.find((entry) => entry.id === item.id);
        if (current)
          Object.assign(
            current,
            patch,
            fitItem(
              { ...current, ...patch } as FreeItem,
              patch.x ?? current.x,
              patch.y ?? current.y,
            ),
          );
      }),
    );
  }

  function reorder(offset: number) {
    if (!selected) return;
    void action.run(() =>
      store.mutate((data) => {
        const index = data.free_items.findIndex(
          (item) => item.id === selected.id,
        );
        const neighbor = data.free_items[index + offset];
        if (index < 0 || !neighbor) return;
        data.free_items[index + offset] = data.free_items[index];
        data.free_items[index] = neighbor;
      }),
    );
  }

  function keyMove(event: KeyboardEvent<HTMLButtonElement>, item: FreeItem) {
    const delta = arrows[event.key as keyof typeof arrows];
    if (!delta) return;
    event.preventDefault();
    if (action.pending) return;
    const step = event.shiftKey ? 30 : 6;
    update(item, { x: item.x + delta[0] * step, y: item.y + delta[1] * step });
  }

  function point(event: PointerEvent<HTMLButtonElement>) {
    const rect = board.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * BOARD_WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * BOARD_HEIGHT) / rect.height,
    };
  }

  function start(
    event: PointerEvent<HTMLButtonElement>,
    item: FreeItem,
    handle: Handle,
  ) {
    if (event.button !== 0 || !event.isPrimary || action.pending) return;
    event.stopPropagation();
    select(item.id);
    drag.current = {
      ...point(event),
      pointer: event.pointerId,
      item,
      handle,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointer) return;
    const { x, y } = point(event);
    if (!current.moved && Math.hypot(x - current.x, y - current.y) < 4) return;
    current.moved = true;
    setPreview(transformItem(current, x, y));
  }

  function finish(event: PointerEvent<HTMLButtonElement>, save: boolean) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointer) return;
    drag.current = null;
    setPreview(null);
    if (save && current.moved) {
      const { x: px, y: py } = point(event);
      const { x, y, width, height, rotation } = transformItem(current, px, py);
      update(current.item, { x, y, width, height, rotation });
    }
  }

  const pointerEvents = {
    onPointerMove: move,
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, true),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, false),
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) =>
      finish(event, false),
  };

  return (
    <section className="free-mural" aria-label="Editor livre">
      {sidebar &&
        createPortal(
          <div className="book-assets">
            <div className="book-insert" aria-label="Adicionar ao mural">
              <button
                type="button"
                className="text-button"
                data-guide="photos"
                aria-expanded={library === "photos"}
                onClick={() =>
                  setLibrary(library === "photos" ? null : "photos")
                }
              >
                <ImagePlus size={17} /> Fotos
              </button>
              <button
                type="button"
                className="text-button"
                data-guide="text"
                aria-expanded={library === "text"}
                onClick={() => setLibrary(library === "text" ? null : "text")}
              >
                <Type size={17} /> Texto
              </button>
              <button
                type="button"
                className="text-button"
                data-guide="stickers"
                aria-expanded={library === "stickers"}
                onClick={() =>
                  setLibrary(library === "stickers" ? null : "stickers")
                }
              >
                <Smile size={17} /> Figurinhas
              </button>
            </div>
            {library === "photos" && (
              <>
                <label className="book-upload">
                  Escolher fotos do aparelho
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={action.pending || store.data.gallery.length >= 40}
                    onChange={(event) => {
                      const files = Array.from(event.currentTarget.files ?? []);
                      event.currentTarget.value = "";
                      if (files.length)
                        void action.run(() =>
                          importGalleryPhotos(files, store.mutate),
                        );
                    }}
                  />
                </label>
                {!store.data.gallery.length && (
                  <p className="small muted">
                    Escolha uma foto do seu aparelho.
                  </p>
                )}
                <div className="free-photo-picker">
                  {store.data.gallery.map((photo) => (
                    <div key={photo.id} className="book-photo">
                      <button
                        className="free-photo-choice"
                        type="button"
                        aria-label={`Adicionar foto: ${photo.label}`}
                        disabled={full || action.pending}
                        onClick={() =>
                          add({ kind: "photo", asset_id: photo.id })
                        }
                      >
                        <LocalImage
                          assetId={photo.id}
                          repository={store.repository}
                          alt=""
                        />
                        <span>{photo.label}</span>
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Excluir foto da galeria: ${photo.label}`}
                        disabled={action.pending}
                        onClick={() => {
                          if (
                            confirm(
                              "Excluir esta foto da galeria e de todas as páginas?",
                            )
                          )
                            void action.run(() =>
                              removeGalleryPhoto(photo.id, store.mutate),
                            );
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {library === "text" && (
              <div className="book-text-insert">
                <button
                  type="button"
                  disabled={full || action.pending}
                  onClick={() => addText("title")}
                >
                  <strong>Título grande</strong>
                  <span>Viagem à praia</span>
                </button>
                <button
                  type="button"
                  disabled={full || action.pending}
                  onClick={() => addText("text")}
                >
                  <strong>Frase curta</strong>
                  <span>Quero aprender a surfar.</span>
                </button>
                <button
                  type="button"
                  disabled={full || action.pending}
                  onClick={() => addText("list")}
                >
                  <strong>Lista de ideias</strong>
                  <span>• Escolher uma praia</span>
                </button>
              </div>
            )}
            {library === "stickers" && (
              <>
                <label>
                  Categoria
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(Number(event.target.value))
                    }
                  >
                    {stickerCollections.map((collection, index) => (
                      <option key={collection.name} value={index}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="free-sticker-picker">
                  {stickerCollections[category].stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      disabled={full || action.pending}
                      onClick={() =>
                        add({ kind: "sticker", sticker: sticker.id })
                      }
                    >
                      <img src={sticker.src} alt="" draggable={false} />
                      <span>{sticker.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>,
          sidebar,
        )}
      <div className="book-paper-fit">
        <div
          className="free-paper"
          ref={board}
          data-guide="sheet"
          aria-label="Área do mural livre"
          data-texture={store.data.paper.texture}
          style={{ backgroundColor: store.data.paper.background }}
          onClick={(event) => {
            if (event.target === event.currentTarget) select(null);
          }}
        >
          {!items.length && (
            <p className="free-empty">
              Comece com uma foto, uma frase ou uma figurinha.
            </p>
          )}
          {items.map((item) => {
            const shown = previewItem(item);
            const sticker =
              shown.kind === "sticker" ? getSticker(shown.sticker) : undefined;
            return (
              <div
                className="book-element"
                key={item.id}
                style={{
                  left: `${(shown.x / BOARD_WIDTH) * 100}%`,
                  top: `${(shown.y / BOARD_HEIGHT) * 100}%`,
                  width: `${(shown.width / BOARD_WIDTH) * 100}%`,
                  height: `${(itemHeight(shown) / BOARD_HEIGHT) * 100}%`,
                  transform: `rotate(${shown.rotation}deg)`,
                }}
              >
                <button
                  className={`free-item free-item-${item.kind}`}
                  type="button"
                  aria-label={`${{ photo: "Foto", text: "Texto", shape: "Forma", sticker: "Figurinha" }[item.kind]}: ${label(item)}`}
                  aria-pressed={selectedId === item.id}
                  onClick={() => select(item.id)}
                  onDoubleClick={() =>
                    item.kind === "text"
                      ? setInlineId(item.id)
                      : showInspector()
                  }
                  onPointerDown={(event) => start(event, item, "move")}
                  onKeyDown={(event) => {
                    if (
                      item.kind === "text" &&
                      (event.key === "F2" || event.key === "Enter")
                    ) {
                      event.preventDefault();
                      select(item.id);
                      setInlineId(item.id);
                    } else keyMove(event, item);
                  }}
                  {...pointerEvents}
                >
                  {shown.kind === "photo" && (
                    <LocalImage
                      assetId={shown.asset_id}
                      repository={store.repository}
                      alt=""
                      className={shown.height ? "book-photo-resized" : ""}
                    />
                  )}
                  {(shown.kind === "text" || shown.kind === "shape") && (
                    <PaintedItem item={shown} fontsReady={fontsReady} />
                  )}
                  {sticker && (
                    <img src={sticker.src} alt="" draggable={false} />
                  )}
                </button>
              </div>
            );
          })}
          {selected?.kind === "text" && inlineId === selected.id && (
            <div
              className="book-inline-position"
              style={{
                left: `${(selected.x / BOARD_WIDTH) * 100}%`,
                top: `${(selected.y / BOARD_HEIGHT) * 100}%`,
                width: `${(selected.width / BOARD_WIDTH) * 100}%`,
              }}
            >
              <InlineText
                key={selected.id}
                item={selected}
                done={(body) => {
                  setInlineId(null);
                  if (body !== undefined && body !== selected.body)
                    update(selected, { body });
                }}
              />
            </div>
          )}
          {selected &&
            inlineId !== selected.id &&
            (() => {
              const shown = previewItem(selected);
              return (
                <div
                  className="book-transform"
                  aria-label="Mudar tamanho ou girar"
                  style={{
                    left: `${(shown.x / BOARD_WIDTH) * 100}%`,
                    top: `${(shown.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(shown.width / BOARD_WIDTH) * 100}%`,
                    height: `${(itemHeight(shown) / BOARD_HEIGHT) * 100}%`,
                    transform: `rotate(${shown.rotation}deg)`,
                  }}
                >
                  {(shown.kind === "text"
                    ? (["w", "e"] as const)
                    : handles
                  ).map((handle) => (
                    <button
                      type="button"
                      key={handle}
                      className={`book-handle handle-${handle}`}
                      aria-label={`Redimensionar ${handle}`}
                      tabIndex={-1}
                      onPointerDown={(event) => start(event, selected, handle)}
                      {...pointerEvents}
                    />
                  ))}
                  <button
                    type="button"
                    className="book-handle handle-rotate"
                    aria-label="Arraste para girar"
                    data-inside={shown.y < 45}
                    tabIndex={-1}
                    onPointerDown={(event) => start(event, selected, "rotate")}
                    {...pointerEvents}
                  >
                    <RotateCw size={14} />
                  </button>
                  {shown.kind === "text" && (
                    <button
                      type="button"
                      className="book-edit-here"
                      aria-label="Editar texto na folha"
                      data-inside={shown.y + itemHeight(shown) > 690}
                      onClick={() => setInlineId(shown.id)}
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
              );
            })()}
        </div>
      </div>
      <div className="book-page-actions">
        <button
          type="button"
          className="text-button"
          disabled={!items.length || action.pending}
          onClick={() =>
            void action.run(
              () => exportFreeMural(store.data, store.repository),
              "Imagem pronta para baixar.",
            )
          }
        >
          <Download size={17} /> Baixar mural
        </button>
      </div>
      <Feedback action={action} />
      {full && (
        <p className="small muted">
          Esta página está cheia. Abra outra ou tire algo da folha.
        </p>
      )}
      {inspector &&
        createPortal(
          <>
            {selected && (
              <details className="book-tool" open>
                <summary data-guide="format">
                  Editar o que você escolheu
                </summary>
                {selected.kind === "text" && (
                  <TextEditor
                    key={`${selected.id}:${selected.body}`}
                    item={selected}
                    update={(patch) => update(selected, patch)}
                    previewBody={(body) =>
                      setDraftText(
                        body === null ? null : { id: selected.id, body },
                      )
                    }
                  />
                )}
                {selected.kind === "shape" && (
                  <label>
                    Cor da forma{" "}
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(event) =>
                        update(selected, { color: event.target.value })
                      }
                    />
                  </label>
                )}
                <div className="book-field-grid">
                  <label>
                    Largura{" "}
                    <input
                      key={`${selected.id}:w`}
                      type="number"
                      min={32}
                      max={1000}
                      value={Math.round(selected.width)}
                      onChange={(event) => {
                        if (event.target.value)
                          update(selected, {
                            width: event.target.valueAsNumber,
                          });
                      }}
                    />
                  </label>
                  {selected.kind !== "text" && (
                    <label>
                      Altura{" "}
                      <input
                        type="number"
                        min={16}
                        max={750}
                        value={Math.round(itemHeight(selected))}
                        onChange={(event) => {
                          if (event.target.value)
                            update(selected, {
                              height: clamp(
                                event.target.valueAsNumber,
                                16,
                                BOARD_HEIGHT,
                              ),
                            });
                        }}
                      />
                    </label>
                  )}
                  <label>
                    Girar (graus){" "}
                    <input
                      type="number"
                      min={-180}
                      max={180}
                      value={selected.rotation}
                      onChange={(event) => {
                        if (event.target.value)
                          update(selected, {
                            rotation: clamp(
                              event.target.valueAsNumber,
                              -180,
                              180,
                            ),
                          });
                      }}
                    />
                  </label>
                </div>
              </details>
            )}
            <details className="book-tool" open={items.length > 0}>
              <summary data-guide="layers">
                <Layers size={17} /> Ordem na folha
              </summary>
              {selected && (
                <div className="book-compact-buttons">
                  <button
                    className="text-button"
                    aria-label="Trazer para frente"
                    disabled={
                      action.pending || selectedIndex === items.length - 1
                    }
                    onClick={() => reorder(1)}
                  >
                    <ArrowUp size={15} /> Frente
                  </button>
                  <button
                    className="text-button"
                    aria-label="Enviar para trás"
                    disabled={action.pending || selectedIndex === 0}
                    onClick={() => reorder(-1)}
                  >
                    <ArrowDown size={15} /> Trás
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Remover do mural"
                    disabled={action.pending}
                    onClick={() =>
                      void action.run(() =>
                        store.mutate((data) => {
                          data.free_items = data.free_items.filter(
                            (entry) => entry.id !== selected.id,
                          );
                        }),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <ol className="free-layer-list" aria-label="Da frente para trás">
                {items.toReversed().map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      title={label(item)}
                      aria-pressed={item.id === selectedId}
                      onClick={() => select(item.id)}
                      onKeyDown={(event) => keyMove(event, item)}
                    >
                      <span>{label(item)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </details>
            <details className="book-tool" open>
              <summary data-guide="shapes">
                <Shapes size={17} /> Formas
              </summary>
              <div className="book-shapes">
                {Object.entries(shapes).map(([key, shape]) => (
                  <button
                    className="icon-button"
                    key={key}
                    type="button"
                    title={shape.label}
                    aria-label={shape.label}
                    disabled={full || action.pending}
                    onClick={() =>
                      add({
                        kind: "shape",
                        shape: key as ShapeItem["shape"],
                        color: "#a16e82",
                      })
                    }
                  >
                    <svg
                      viewBox="0 0 100 100"
                      width="22"
                      height="22"
                      aria-hidden="true"
                    >
                      <path
                        d={shape.path}
                        fill={shape.filled ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </details>
          </>,
          inspector,
        )}
    </section>
  );
}
