import { useAction } from "../data/useAction";
import { useRef, useState, type PointerEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Grip,
  ImagePlus,
  Images,
  LayoutTemplate,
  Pencil,
  Plus,
  Quote,
  Trash2,
  X,
} from "lucide-react";
import {
  exportMural,
  importGalleryPhotos,
  removeGalleryPhoto,
  sortedCards,
} from "../data/media";
import { now, rowBase, type Card, type Workspace } from "../data/model";
import { LocalImage } from "../components/LocalImage";
import { FreeMural } from "./FreeMural";
import {
  Feedback,
  Modal,
  PageTitle,
  Submit,
  type ScreenProps,
} from "../components/ui";
const layouts: {
  id: Workspace["profile"]["template"];
  name: string;
  description: string;
}[] = [
  {
    id: "scrapbook",
    name: "Recortes",
    description: "Cores suaves, fitas e um toque divertido.",
  },
  {
    id: "clean",
    name: "Essencial",
    description: "Uma grade simples para suas imagens brilharem.",
  },
  {
    id: "polaroid",
    name: "Instantes",
    description: "Fotos com bordas brancas e espaço para legendas.",
  },
  {
    id: "mosaic",
    name: "Mosaico",
    description: "Imagens grandes e pequenas, lado a lado.",
  },
  {
    id: "editorial",
    name: "Horizonte",
    description: "Uma imagem em destaque abre seu mural.",
  },
  {
    id: "free",
    name: "Livre",
    description: "Sobreponha fotos, frases e figurinhas onde quiser.",
  },
];
type Placement = { kind: "photo" | "card"; id: string };
function CardEditor({
  store,
  card,
  onClose,
}: ScreenProps & { card: Card | null; onClose: () => void }) {
  const [body, setBody] = useState(card?.body || "");
  const [caption, setCaption] = useState(card?.caption || "");
  const [color, setColor] = useState<Card["color"]>(card?.color || "lavender");
  const [goalId, setGoalId] = useState(card?.goal_id || "");
  const action = useAction();
  return (
    <Modal
      title={card ? "Editar recorte" : "Uma frase para o mural"}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action
            .run(() =>
              store.mutate((data) => {
                if (card)
                  Object.assign(
                    data.cards.find((row) => row.id === card.id)!,
                    {
                      body: body.trim(),
                      caption: caption.trim(),
                      color,
                      goal_id: goalId || null,
                      updated_at: now(),
                    },
                  );
                else {
                  if (data.cards.length >= 40)
                    throw new Error("O limite desta versão é de 40 recortes.");
                  const position = Array.from(
                    { length: 40 },
                    (_, index) => index,
                  ).find(
                    (index) =>
                      !data.cards.some((row) => row.position === index),
                  )!;
                  data.cards.push({
                    ...rowBase(),
                    dream_id: data.dream.id,
                    kind: "quote",
                    asset_id: null,
                    body: body.trim(),
                    caption: caption.trim(),
                    color,
                    goal_id: goalId || null,
                    position,
                  });
                }
              }),
            )
            .then((ok) => {
              if (ok) onClose();
            });
        }}
      >
        <label>
          {card?.kind === "image"
            ? "Descrição da imagem (acessibilidade)"
            : "Sua frase"}
          <textarea
            autoFocus
            required
            maxLength={1000}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <label>
          Legenda <span className="muted">(opcional)</span>
          <input
            maxLength={250}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </label>
        <label>
          Cor do recorte
          <select
            value={color}
            onChange={(event) => setColor(event.target.value as Card["color"])}
          >
            <option value="lavender">Lavanda</option>
            <option value="peach">Pêssego</option>
            <option value="sage">Sálvia</option>
            <option value="butter">Amarelo suave</option>
          </select>
        </label>
        {store.data.goals.length > 0 && (
          <label>
            Relacionar a uma meta
            <select
              value={goalId}
              onChange={(event) => setGoalId(event.target.value)}
            >
              <option value="">Meu sonho como um todo</option>
              {store.data.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <Feedback action={action} />
        <Submit pending={action.pending}>Salvar recorte</Submit>
      </form>
    </Modal>
  );
}
export function Mural({ store }: ScreenProps) {
  const [editor, setEditor] = useState<Card | "quote" | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(store.data.dream.description);
  const [selection, setSelection] = useState<Placement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pointerDrag, setPointerDrag] = useState(false);
  const [extraSlots, setExtraSlots] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragged = useRef<Placement | null>(null);
  const action = useAction();
  const cards = sortedCards(store.data.cards);
  const slotCount = Math.min(
    40,
    Math.max(6, Math.ceil(((cards.at(-1)?.position ?? -1) + 1) / 6) * 6) +
      extraSlots,
  );
  function place(item: Placement, position: number) {
    void action
      .run(
        () =>
          store.mutate((data) => {
            const target = data.cards.find(
              (card) => card.position === position,
            );
            if (item.kind === "card") {
              const source = data.cards.find((card) => card.id === item.id);
              if (!source || source.position === position) return;
              if (target) {
                target.position = source.position;
                target.updated_at = now();
              }
              source.position = position;
              source.updated_at = now();
            } else {
              const photo = data.gallery.find((photo) => photo.id === item.id);
              if (!photo) throw new Error("Foto não encontrada na galeria.");
              const existing = data.cards.find(
                (card) => card.asset_id === item.id,
              );
              if (existing) {
                if (target && target.id !== existing.id) {
                  target.position = existing.position;
                  target.updated_at = now();
                }
                existing.position = position;
                existing.updated_at = now();
              } else if (target)
                Object.assign(target, {
                  kind: "image",
                  asset_id: photo.id,
                  body: photo.label,
                  caption: "",
                  updated_at: now(),
                });
              else
                data.cards.push({
                  ...rowBase(),
                  dream_id: data.dream.id,
                  goal_id: null,
                  kind: "image",
                  asset_id: photo.id,
                  body: photo.label,
                  caption: "",
                  color: ["lavender", "peach", "sage", "butter"][
                    position % 4
                  ] as Card["color"],
                  position,
                });
            }
          }),
        "Recorte posicionado.",
      )
      .then((ok) => {
        if (ok) setSelection(null);
      });
    setHover(null);
  }
  async function upload(files: File[]) {
    await action.run(
      async () => {
        const photos = await importGalleryPhotos(files, store.mutate);
        if (photos[0]) setSelection({ kind: "photo", id: photos[0].id });
      },
      `${files.length} ${files.length === 1 ? "foto adicionada" : "fotos adicionadas"}. Escolha uma foto e toque em um espaço do mural.`,
    );
  }
  function removePhoto(id: string) {
    if (
      !confirm("Excluir esta foto da galeria, dos templates e do mural livre?")
    )
      return;
    void action
      .run(() => removeGalleryPhoto(id, store.mutate))
      .then((ok) => {
        if (ok) setSelection(null);
      });
  }
  function pointerDown(
    event: PointerEvent<HTMLButtonElement>,
    item: Placement,
  ) {
    if (event.button !== 0) return;
    dragged.current = item;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPointerDrag(true);
    setSelection(item);
  }
  function slotAt(event: PointerEvent<HTMLButtonElement>) {
    // Pointer capture keeps events on the handle. Match client coordinates to
    // DOM rectangles, including when the mobile visual viewport is offset.
    return [...document.querySelectorAll<HTMLElement>("[data-slot]")].find(
      (slot) => {
        const rect = slot.getBoundingClientRect();
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      },
    );
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragged.current) return;
    const slot = slotAt(event);
    setHover(slot ? Number(slot.dataset.slot) : null);
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!dragged.current) return;
    const slot = slotAt(event);
    if (slot) place(dragged.current, Number(slot.dataset.slot));
    dragged.current = null;
    setPointerDrag(false);
    setHover(null);
  }
  const free = store.data.profile.template === "free";
  function editTitle() {
    setTitle(store.data.dream.description);
    setEditingTitle(true);
  }

  return (
    <>
      <PageTitle
        eyebrow="ESCOLHA · ADICIONE · ORGANIZE"
        title="Seu sonho, do seu jeito."
      >
        Monte seu mural em poucos passos. Só você decide o que entra nele.
      </PageTitle>
      <section className="layout-picker" aria-label="Escolha o layout do mural">
        <div className="section-heading">
          <h2>
            <LayoutTemplate size={20} /> 1. Escolha um layout
          </h2>
          <span className="small muted">
            A galeria de fotos é a mesma em todos os layouts.
          </span>
        </div>
        <div className="layout-options">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              className={`layout-option ${layout.id === store.data.profile.template ? "active" : ""}`}
              aria-pressed={layout.id === store.data.profile.template}
              title={layout.description}
              disabled={action.pending}
              onClick={() =>
                void action
                  .run(() =>
                    store.mutate((data) => {
                      data.profile.template = layout.id;
                    }),
                  )
                  .then((ok) => {
                    if (ok) setSelection(null);
                  })
              }
            >
              <span
                className={`layout-preview ${layout.id}`}
                aria-hidden="true"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <span>
                {layout.name}
                {layout.id === store.data.profile.template && (
                  <Check size={14} />
                )}
              </span>
            </button>
          ))}
        </div>
      </section>
      {free ? (
        <FreeMural store={store} onEditTitle={editTitle} />
      ) : (
        <div className="mural-workspace">
          <aside className="gallery surface">
            <h2>
              <Images size={20} /> 2. Suas fotos
            </h2>
            <p className="small muted">
              Arraste uma foto para o mural. Ou toque nela e depois no espaço
              escolhido.
            </p>
            <button
              className="upload-button"
              onClick={() => fileInput.current?.click()}
              disabled={action.pending || store.data.gallery.length >= 40}
            >
              <ImagePlus size={20} /> Subir da galeria
            </button>
            <input
              className="sr-only"
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Selecionar fotos da galeria"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                if (files.length) void upload(files);
              }}
            />
            <p className="small muted">
              JPG, PNG ou WebP · até 10 MB por foto
              <br />
              {store.data.gallery.length}/40 fotos · salvas neste aparelho
            </p>
            <div className="gallery-grid">
              {store.data.gallery.map((photo) => (
                <div
                  className={`gallery-photo ${selection?.id === photo.id ? "selected" : ""}`}
                  key={photo.id}
                >
                  <button
                    className="photo-select"
                    aria-label={`Selecionar foto: ${photo.label}`}
                    aria-pressed={selection?.id === photo.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-mural",
                        JSON.stringify({ kind: "photo", id: photo.id }),
                      );
                      event.dataTransfer.effectAllowed = "move";
                      setSelection({ kind: "photo", id: photo.id });
                    }}
                    onClick={() =>
                      setSelection({ kind: "photo", id: photo.id })
                    }
                  >
                    <LocalImage
                      assetId={photo.id}
                      repository={store.repository}
                      alt={photo.label}
                    />
                  </button>
                  <div className="gallery-photo-tools">
                    <button
                      className="drag-handle icon-button"
                      aria-label={`Arrastar foto: ${photo.label}`}
                      onPointerDown={(event) =>
                        pointerDown(event, { kind: "photo", id: photo.id })
                      }
                      onPointerMove={pointerMove}
                      onPointerUp={pointerUp}
                      onPointerCancel={() => {
                        dragged.current = null;
                        setPointerDrag(false);
                        setHover(null);
                      }}
                    >
                      <Grip size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Excluir foto: ${photo.label}`}
                      disabled={action.pending}
                      onClick={() => removePhoto(photo.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!store.data.gallery.length && (
              <div className="gallery-empty">
                <Images size={28} />
                <p>
                  Fotos de lugares, momentos e experiências que você quer viver.
                </p>
              </div>
            )}
            <button
              className="text-button"
              onClick={() => setEditor("quote")}
              disabled={cards.length >= 40}
            >
              <Quote size={17} /> Adicionar uma frase
            </button>
            <a className="small" href="#/prompts">
              Precisa de ideias para imagens? →
            </a>
          </aside>
          <section className="board-area">
            <div className="board-title">
              <div>
                <p className="eyebrow">3. MONTE SEU MURAL</p>
                <h2>
                  {store.data.dream.description || "Meu próximo capítulo"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Editar título do mural"
                onClick={editTitle}
              >
                <Pencil size={18} />
              </button>
            </div>
            {selection && (
              <div className="selection-note" role="status">
                <span>
                  {pointerDrag
                    ? "Solte no espaço escolhido."
                    : "Toque em um espaço para posicionar. Em um espaço ocupado, a foto será trocada."}
                </span>
                <button
                  className="icon-button"
                  aria-label="Cancelar seleção"
                  onClick={() => setSelection(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <Feedback action={action} />
            <div
              className={`mural-grid ${store.data.profile.template} ${selection ? "placing" : ""}`}
            >
              {Array.from({ length: slotCount }, (_, position) => {
                const card = cards.find((row) => row.position === position);
                return (
                  <div
                    key={position}
                    className={`board-slot ${hover === position ? "drop-hover" : ""} ${card ? "filled" : "vacant"}`}
                    data-slot={position}
                    onDragOver={(event) => {
                      if (
                        event.dataTransfer.types.includes("application/x-mural")
                      ) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setHover(position);
                      }
                    }}
                    onDragLeave={() => setHover(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      try {
                        const item = JSON.parse(
                          event.dataTransfer.getData("application/x-mural"),
                        ) as Placement;
                        if (
                          (item.kind === "card" || item.kind === "photo") &&
                          typeof item.id === "string"
                        )
                          place(item, position);
                      } catch {
                        setHover(null);
                      }
                    }}
                  >
                    {card ? (
                      <article
                        className={`mural-card ${card.color}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "application/x-mural",
                            JSON.stringify({ kind: "card", id: card.id }),
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <span className="tape" aria-hidden="true" />
                        {card.asset_id ? (
                          <LocalImage
                            assetId={card.asset_id}
                            repository={store.repository}
                            alt={card.body}
                          />
                        ) : (
                          <blockquote>{card.body}</blockquote>
                        )}
                        {card.caption && (
                          <p className="card-caption">{card.caption}</p>
                        )}
                        {card.goal_id && (
                          <a className="goal-link" href="#/plano">
                            {
                              store.data.goals.find(
                                (goal) => goal.id === card.goal_id,
                              )?.title
                            }
                          </a>
                        )}
                        <div className="card-tools">
                          <button
                            className="drag-handle icon-button"
                            aria-label={`Arrastar recorte ${position + 1}`}
                            onPointerDown={(event) =>
                              pointerDown(event, { kind: "card", id: card.id })
                            }
                            onPointerMove={pointerMove}
                            onPointerUp={pointerUp}
                            onPointerCancel={() => {
                              dragged.current = null;
                              setPointerDrag(false);
                              setHover(null);
                            }}
                          >
                            <Grip size={17} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Mover recorte ${position + 1} para trás`}
                            disabled={position === 0 || action.pending}
                            onClick={() =>
                              place({ kind: "card", id: card.id }, position - 1)
                            }
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Mover recorte ${position + 1} para frente`}
                            disabled={position >= 39 || action.pending}
                            onClick={() =>
                              place({ kind: "card", id: card.id }, position + 1)
                            }
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Editar recorte ${position + 1}`}
                            onClick={() => setEditor(card)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Retirar recorte ${position + 1} do mural`}
                            onClick={() => {
                              if (
                                !confirm(
                                  "Retirar este recorte? A foto continuará na galeria.",
                                )
                              )
                                return;
                              void action.run(() =>
                                store.mutate((data) => {
                                  data.cards = data.cards.filter(
                                    (row) => row.id !== card.id,
                                  );
                                }),
                              );
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </article>
                    ) : (
                      <button
                        className="empty-slot"
                        aria-label={`Adicionar foto ao espaço ${position + 1}`}
                        onClick={() => {
                          if (selection) place(selection, position);
                          else if (store.data.gallery.length)
                            document
                              .querySelector<HTMLElement>(".photo-select")
                              ?.focus();
                          else fileInput.current?.click();
                        }}
                      >
                        <Plus size={23} />
                        <span>
                          {selection ? "Colocar aqui" : "Seu próximo sonho"}
                        </span>
                      </button>
                    )}
                    {selection && card && (
                      <button
                        className="place-overlay"
                        aria-label={`Posicionar no espaço ${position + 1}`}
                        onClick={() => place(selection, position)}
                      >
                        Colocar aqui
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="toolbar">
              <button
                className="text-button"
                disabled={slotCount >= 40}
                onClick={() => setExtraSlots((value) => value + 6)}
              >
                <Plus size={17} /> Mais espaços
              </button>
              <button
                disabled={!cards.length || action.pending}
                onClick={() =>
                  void action.run(
                    () => exportMural(store.data, store.repository),
                    "Mural preparado para download.",
                  )
                }
              >
                <Download size={17} /> Baixar mural
              </button>
            </div>
            <p className="small muted">
              Suas fotos ficam neste navegador. Faça um backup para guardar uma
              cópia ou transferir para outro aparelho.
            </p>
          </section>
        </div>
      )}
      {editor && (
        <CardEditor
          store={store}
          card={editor === "quote" ? null : editor}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {editingTitle && (
        <Modal
          title="Uma frase para o seu futuro"
          onClose={() => setEditingTitle(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action
                .run(() =>
                  store.mutate((data) => {
                    data.dream.description = title.trim();
                    data.dream.updated_at = now();
                  }),
                )
                .then((ok) => {
                  if (ok) setEditingTitle(false);
                });
            }}
          >
            <label>
              O que você quer viver?
              <textarea
                autoFocus
                maxLength={4000}
                rows={3}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Uma vida com mais liberdade para criar e viajar…"
              />
            </label>
            <Feedback action={action} />
            <Submit pending={action.pending}>Salvar título</Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
