import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  ImagePlus,
  Layers,
  Minus,
  Pencil,
  Plus,
  Smile,
  Trash2,
  Type,
} from "lucide-react";
import { LocalImage } from "../components/LocalImage";
import { Feedback, Modal, Submit, type ScreenProps } from "../components/ui";
import {
  BOARD_DOT,
  BOARD_HEIGHT,
  BOARD_PAPER,
  BOARD_WIDTH,
  DOT_SPACING,
  exportFreeMural,
  fitItem,
  initialPlacement,
  itemHeight,
  MAX_ITEM_WIDTH,
  MIN_ITEM_WIDTH,
  noteImage,
} from "../data/freeBoard";
import { importGalleryPhotos, removeGalleryPhoto } from "../data/media";
import { FREE_ITEM_LIMIT, makeId, type FreeItem } from "../data/model";
import { getSticker, stickerCollections } from "../data/stickers";
import { useAction } from "../data/useAction";
import "./FreeMural.css";

type NewItem =
  | { kind: "photo"; asset_id: string }
  | { kind: "text"; body: string }
  | { kind: "sticker"; sticker: string };

type ActiveDrag = {
  pointer: number;
  item: FreeItem;
  startX: number;
  startY: number;
  moved: boolean;
};

function Note({ body }: { body: string }) {
  const src = useMemo(() => noteImage(body), [body]);
  return <img src={src} alt="" draggable={false} />;
}

export function FreeMural({
  store,
  onEditTitle,
}: ScreenProps & { onEditTitle: () => void }) {
  const [selectedId, select] = useState<string | null>(null);
  const [picker, setPicker] = useState<"photos" | "stickers" | "text" | null>(
    null,
  );
  const [category, setCategory] = useState(0);
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<FreeItem | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<ActiveDrag | null>(null);
  const action = useAction();
  const items = store.data.free_items;
  const selected = items.find((item) => item.id === selectedId);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const full = items.length >= FREE_ITEM_LIMIT;

  function label(item: FreeItem) {
    switch (item.kind) {
      case "photo":
        return (
          store.data.gallery.find((photo) => photo.id === item.asset_id)
            ?.label ?? "Foto"
        );
      case "sticker":
        return getSticker(item.sticker)?.label ?? "Figurinha";
      case "text":
        return item.body;
    }
  }

  function add(content: NewItem) {
    const width = content.kind === "sticker" ? 170 : 320;
    const item = { ...content, id: makeId(), width, x: 0, y: 0 };
    void action
      .run(() =>
        store.mutate((data) => {
          if (data.free_items.length >= FREE_ITEM_LIMIT)
            throw new Error(
              `O mural comporta até ${FREE_ITEM_LIMIT} elementos.`,
            );
          data.free_items.push(initialPlacement(item, data.free_items));
        }),
      )
      .then((ok) => {
        if (ok) {
          select(item.id);
          setPicker(null);
        }
      });
  }

  function update(
    item: FreeItem,
    patch: Partial<Pick<FreeItem, "x" | "y" | "width">>,
  ) {
    void action.run(() =>
      store.mutate((data) => {
        const current = data.free_items.find((row) => row.id === item.id);
        if (current) Object.assign(current, patch);
      }),
    );
  }

  function moveWithKeys(
    event: KeyboardEvent<HTMLButtonElement>,
    item: FreeItem,
  ) {
    const move = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!move) return;
    event.preventDefault();
    if (action.pending) return;
    select(item.id);
    const step = event.shiftKey ? 40 : 10;
    const { x, y } = fitItem(
      item,
      item.x + move[0] * step,
      item.y + move[1] * step,
    );
    update(item, { x, y });
  }

  function reorder(direction: -1 | 1) {
    if (!selected) return;
    void action.run(() =>
      store.mutate((data) => {
        const index = data.free_items.findIndex(
          (item) => item.id === selected.id,
        );
        const neighbor = data.free_items[index + direction];
        if (index < 0 || !neighbor) return;
        data.free_items[index + direction] = data.free_items[index];
        data.free_items[index] = neighbor;
      }),
    );
  }

  function openText(item?: FreeItem) {
    setEditingId(item?.kind === "text" ? item.id : null);
    setBody(item?.kind === "text" ? item.body : "");
    setPicker("text");
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, item: FreeItem) {
    if (event.button !== 0 || !event.isPrimary || action.pending) return;
    select(item.id);
    drag.current = {
      pointer: event.pointerId,
      item,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function draggedPosition(
    event: PointerEvent<HTMLButtonElement>,
    current: ActiveDrag,
  ) {
    const rect = board.current!.getBoundingClientRect();
    return fitItem(
      current.item,
      current.item.x +
        ((event.clientX - current.startX) / rect.width) * BOARD_WIDTH,
      current.item.y +
        ((event.clientY - current.startY) / rect.height) * BOARD_HEIGHT,
    );
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    if (
      !current.moved &&
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      ) < 4
    )
      return;
    current.moved = true;
    setPreview(draggedPosition(event, current));
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>, save: boolean) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
    setPreview(null);
    if (save && current.moved) {
      const { x, y } = draggedPosition(event, current);
      update(current.item, { x, y });
    }
  }

  function resize(delta: number) {
    if (!selected) return;
    const next = fitItem(
      selected,
      selected.x,
      selected.y,
      selected.width + delta,
    );
    const { x, y, width } = fitItem(
      next,
      selected.x + (selected.width - next.width) / 2,
      selected.y + (itemHeight(selected) - itemHeight(next)) / 2,
    );
    update(selected, { x, y, width });
  }

  return (
    <section className="free-mural" aria-label="Editor livre">
      <div className="free-heading">
        <div className="board-title">
          <h2>{store.data.dream.description || "Meu próximo capítulo"}</h2>
          <button
            className="icon-button"
            aria-label="Editar título do mural"
            onClick={onEditTitle}
          >
            <Pencil size={18} />
          </button>
        </div>
        <button
          className="free-download"
          disabled={!items.length || action.pending}
          onClick={() =>
            void action.run(
              () => exportFreeMural(store.data, store.repository),
              "Mural preparado para download.",
            )
          }
        >
          <Download size={17} /> Baixar mural
        </button>
      </div>
      <div className="free-add" aria-label="Adicionar ao mural">
        <button
          type="button"
          disabled={action.pending || full}
          onClick={() => setPicker("photos")}
        >
          <ImagePlus size={18} /> Foto
        </button>
        <button
          type="button"
          disabled={action.pending || full}
          onClick={() => openText()}
        >
          <Type size={18} /> Texto
        </button>
        <button
          type="button"
          disabled={action.pending || full}
          onClick={() => setPicker("stickers")}
        >
          <Smile size={18} /> Figurinhas
        </button>
      </div>
      {full && (
        <p className="small muted">
          Limite de {FREE_ITEM_LIMIT} elementos atingido.
        </p>
      )}
      {!picker && <Feedback action={action} />}
      <div className="free-workspace">
        <div className="free-board-area">
          <div
            className="free-paper"
            ref={board}
            aria-label="Área do mural livre"
            style={{
              aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
              backgroundColor: BOARD_PAPER,
              backgroundImage: `radial-gradient(circle, ${BOARD_DOT} 0.1cqw, transparent 0.15cqw)`,
              backgroundSize: `${(DOT_SPACING / BOARD_WIDTH) * 100}% ${(DOT_SPACING / BOARD_HEIGHT) * 100}%`,
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) select(null);
            }}
          >
            {!items.length && (
              <p className="free-empty">
                Adicione uma foto, um texto ou uma figurinha para começar.
              </p>
            )}
            {items.map((item) => {
              const shown = preview?.id === item.id ? preview : item;
              const sticker =
                item.kind === "sticker" && getSticker(item.sticker);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`free-item free-item-${item.kind}`}
                  style={{
                    left: `${(shown.x / BOARD_WIDTH) * 100}%`,
                    top: `${(shown.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(shown.width / BOARD_WIDTH) * 100}%`,
                    height: `${(itemHeight(shown) / BOARD_HEIGHT) * 100}%`,
                  }}
                  aria-label={`${{ photo: "Foto", text: "Texto", sticker: "Figurinha" }[item.kind]}: ${label(item)}`}
                  aria-pressed={selectedId === item.id}
                  onClick={() => select(item.id)}
                  onPointerDown={(event) => startDrag(event, item)}
                  onPointerMove={moveDrag}
                  onPointerUp={(event) => finishDrag(event, true)}
                  onPointerCancel={(event) => finishDrag(event, false)}
                  onLostPointerCapture={(event) => finishDrag(event, false)}
                  onKeyDown={(event) => moveWithKeys(event, item)}
                >
                  {item.kind === "photo" && (
                    <LocalImage
                      assetId={item.asset_id}
                      repository={store.repository}
                      alt=""
                    />
                  )}
                  {item.kind === "text" && <Note body={item.body} />}
                  {item.kind === "sticker" &&
                    (sticker ? (
                      <img src={sticker.src} alt="" draggable={false} />
                    ) : (
                      <span>Figurinha indisponível</span>
                    ))}
                </button>
              );
            })}
          </div>
          {items.length > 0 && (
            <p className="free-hint small muted">
              Arraste os elementos no mural. Pelo teclado, selecione um elemento
              e use as setas.
            </p>
          )}
        </div>
        <aside className="free-layers surface" aria-label="Camadas do mural">
          <h3>
            <Layers size={18} /> Camadas
          </h3>
          {selected && (
            <div
              className="free-layer-tools"
              aria-label="Ações da camada selecionada"
            >
              <button
                type="button"
                title="Trazer para frente"
                aria-label="Trazer para frente"
                disabled={action.pending || selectedIndex === items.length - 1}
                onClick={() => reorder(1)}
              >
                <ArrowUp size={18} /> Frente
              </button>
              <button
                type="button"
                title="Enviar para trás"
                aria-label="Enviar para trás"
                disabled={action.pending || selectedIndex === 0}
                onClick={() => reorder(-1)}
              >
                <ArrowDown size={18} /> Trás
              </button>
              <button
                type="button"
                title="Diminuir"
                aria-label="Diminuir"
                disabled={action.pending || selected.width <= MIN_ITEM_WIDTH}
                onClick={() => resize(-40)}
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                title="Aumentar"
                aria-label="Aumentar"
                disabled={action.pending || selected.width >= MAX_ITEM_WIDTH}
                onClick={() => resize(40)}
              >
                <Plus size={18} />
              </button>
              {selected.kind === "text" && (
                <button
                  type="button"
                  title="Editar texto"
                  aria-label="Editar texto"
                  disabled={action.pending}
                  onClick={() => openText(selected)}
                >
                  <Pencil size={16} />
                </button>
              )}
              <button
                type="button"
                title="Remover do mural"
                aria-label="Remover do mural"
                disabled={action.pending}
                onClick={() =>
                  void action
                    .run(() =>
                      store.mutate((data) => {
                        data.free_items = data.free_items.filter(
                          (item) => item.id !== selected.id,
                        );
                      }),
                    )
                    .then((ok) => {
                      if (ok) select(null);
                    })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
          {items.length > 0 ? (
            <ol className="free-layer-list" aria-label="Da frente para trás">
              {items.toReversed().map((item) => {
                const Icon = { photo: ImagePlus, text: Type, sticker: Smile }[
                  item.kind
                ];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      title={label(item)}
                      aria-pressed={item.id === selectedId}
                      onClick={() => select(item.id)}
                      onKeyDown={(event) => moveWithKeys(event, item)}
                    >
                      <Icon size={17} aria-hidden="true" />{" "}
                      <span>{label(item)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="small muted">
              Aqui você organiza o que fica na frente e atrás no mural.
            </p>
          )}
        </aside>
      </div>

      {picker === "photos" && (
        <Modal title="Suas fotos" onClose={() => setPicker(null)}>
          <label>
            Adicionar fotos à galeria
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={action.pending || store.data.gallery.length >= 40}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length)
                  void action.run(
                    () => importGalleryPhotos(files, store.mutate),
                    "Toque em uma foto para colocá-la no mural.",
                  );
              }}
            />
          </label>
          <p className="small muted">
            JPG, PNG ou WebP · até 10 MB por foto · {store.data.gallery.length}
            /40
          </p>
          <Feedback action={action} />
          <div className="free-photo-picker">
            {store.data.gallery.map((photo) => (
              <div className="free-gallery-photo" key={photo.id}>
                <button
                  className="free-photo-choice"
                  type="button"
                  aria-label={`Adicionar foto: ${photo.label}`}
                  disabled={action.pending || full}
                  onClick={() => add({ kind: "photo", asset_id: photo.id })}
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
                        "Excluir esta foto da galeria, dos templates e do mural livre?",
                      )
                    )
                      void action.run(() =>
                        removeGalleryPhoto(photo.id, store.mutate),
                      );
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {picker === "stickers" && (
        <Modal title="Figurinhas" onClose={() => setPicker(null)}>
          <div
            className="free-categories"
            aria-label="Categorias de figurinhas"
          >
            {stickerCollections.map((collection, index) => (
              <button
                type="button"
                key={collection.name}
                aria-pressed={category === index}
                onClick={() => setCategory(index)}
              >
                {collection.name}
              </button>
            ))}
          </div>
          <Feedback action={action} />
          <div className="free-sticker-picker">
            {stickerCollections[category].stickers.map((sticker) => (
              <button
                type="button"
                key={sticker.id}
                disabled={action.pending || full}
                onClick={() => add({ kind: "sticker", sticker: sticker.id })}
              >
                <img src={sticker.src} alt="" draggable={false} />
                <span>{sticker.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {picker === "text" && (
        <Modal
          title={editingId ? "Editar texto" : "Adicionar texto"}
          onClose={() => setPicker(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const value = body.trim();
              if (!value) return;
              if (!editingId) {
                add({ kind: "text", body: value });
                return;
              }
              void action
                .run(() =>
                  store.mutate((data) => {
                    const item = data.free_items.find(
                      (row) => row.id === editingId,
                    );
                    if (item?.kind === "text") item.body = value;
                  }),
                )
                .then((ok) => {
                  if (ok) setPicker(null);
                });
            }}
          >
            <label>
              Texto do mural
              <textarea
                autoFocus
                required
                rows={4}
                maxLength={180}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>
            <p className="small muted">{body.length}/180 caracteres</p>
            <Feedback action={action} />
            <Submit pending={action.pending}>
              {editingId ? "Salvar texto" : "Colocar no mural"}
            </Submit>
          </form>
        </Modal>
      )}
    </section>
  );
}
