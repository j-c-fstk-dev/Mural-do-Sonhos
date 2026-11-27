import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Images,
  PanelRight,
  Plus,
} from "lucide-react";
import { Feedback, Modal, type ScreenProps } from "../components/ui";
import { useAssetImage } from "../data/useAssetImage";
import { compressImage } from "../data/media";
import { AutoMural } from "./AutoMural";
import { pageStore } from "../data/book";
import { makeId, type Paper, type Workspace } from "../data/model";
import { fonts, paperPresets, textures } from "../data/paper";
import { useAction } from "../data/useAction";
import { layouts } from "./layouts";
import { Mural } from "./Mural";
import { EditorGuide } from "./EditorGuide";

export function Book({
  store,
  sidebar,
  closeMobileSidebar,
  tourSeen,
  openMenu,
  rememberMenu,
}: ScreenProps & {
  sidebar: HTMLElement | null;
  closeMobileSidebar: () => void;
  tourSeen: boolean;
  openMenu: () => void;
  rememberMenu: () => void;
}) {
  const [compose, setCompose] = useState(false);
  const [assembled, setAssembled] = useState("");
  const [chooseLayout, setChooseLayout] = useState(false);
  const [showTools, setShowTools] = useState(
    () => !store.data.profile.editor_guide_seen || window.innerWidth > 900,
  );
  const [replayGuide, setReplayGuide] = useState(false);
  const openTools = useCallback(() => setShowTools(true), []);
  const stage = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const [inspector, setInspector] = useState<HTMLDivElement | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const action = useAction();
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const pageId = store.data.profile.active_page;
  const scoped = pageStore(store, pageId);
  const pages = [null, ...store.data.pages.map((page) => page.id)];
  const index = pages.indexOf(pageId);
  const paper = scoped.data.paper;
  const { url: patternUrl } = useAssetImage(paper.patternId, store.repository);
  const title =
    paper.title ||
    (!pageId ? store.data.dream.description : "") ||
    `Página ${index + 1}`;
  const firstChoice =
    !store.data.profile.layout_chosen &&
    !pageId &&
    !store.data.cards.length &&
    !store.data.free_items.length &&
    store.data.profile.template === "scrapbook";

  const template = scoped.data.profile.template;
  const guiding =
    tourSeen &&
    !chooseLayout &&
    !compose &&
    !firstChoice &&
    (replayGuide || !store.data.profile.editor_guide_seen);
  useEffect(() => {
    const stageElement = stage.current;
    const editorElement = editor.current;
    const sheet = stageElement?.querySelector(".free-paper, .mural-grid");
    if (!sheet || !stageElement || !editorElement) return;
    const measure = () => {
      editorElement.style.setProperty(
        "--sheet-height",
        `${sheet.getBoundingClientRect().height}px`,
      );
      editorElement.style.setProperty(
        "--sheet-top",
        `${Math.max(0, sheet.getBoundingClientRect().top - stageElement.getBoundingClientRect().top)}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(stageElement);
    stageElement.addEventListener("animationend", measure);
    measure();
    return () => {
      observer.disconnect();
      stageElement.removeEventListener("animationend", measure);
    };
  }, [pageId, template]);

  function finishGuide() {
    rememberMenu();
    setReplayGuide(false);
    if (!store.data.profile.editor_guide_seen)
      void action.run(() =>
        store.mutate((data) => {
          data.profile.editor_guide_seen = true;
        }),
      );
  }

  function changePage(offset: number) {
    const target = pages[index + offset];
    if (target === undefined || action.pending) return;
    setAssembled("");
    setDirection(offset > 0 ? "next" : "previous");
    void action.run(() =>
      store.mutate((data) => {
        data.profile.active_page = target;
      }),
    );
  }

  function addPage() {
    setAssembled("");
    setDirection("next");
    void action.run(() =>
      store.mutate((data) => {
        const id = makeId();
        data.pages.push({
          id,
          template: "free",
          cards: [],
          free_items: [],
          paper: { ...paper, title: "" },
        });
        data.profile.active_page = id;
      }),
    );
  }

  function selectLayout(template: Workspace["profile"]["template"]) {
    void action
      .run(() =>
        store.mutate((data) => {
          if (pageId)
            data.pages.find((page) => page.id === pageId)!.template = template;
          else data.profile.template = template;
          data.profile.layout_chosen = true;
        }),
      )
      .then((ok) => {
        if (ok) {
          setChooseLayout(false);
          closeMobileSidebar();
        }
      });
  }

  function importPattern(file: File) {
    void action.run(async () => {
      const asset = await compressImage(file);
      await store.mutate(
        (data) => {
          if (data.patterns.length >= 40)
            throw new Error(
              "Você já guardou 40 estampas. Apague uma para colocar outra.",
            );
          const active = pageId
            ? data.pages.find((page) => page.id === pageId)
            : data;
          if (!active) throw new Error("Esta página não está mais disponível.");
          data.patterns.push({
            id: asset.id,
            label:
              file.name.replace(/\.[^.]+$/, "").slice(0, 500) ||
              "Minha estampa",
          });
          active.paper.patternId = asset.id;
        },
        { assets: [asset] },
      );
    }, "Estampa aplicada à folha.");
  }

  function deletePattern(id: string) {
    if (
      !confirm(
        "Apagar esta estampa? As folhas que usam o desenho voltam ao papel anterior.",
      )
    )
      return;
    void action.run(
      () =>
        store.mutate(
          (data) => {
            data.patterns = data.patterns.filter(
              (pattern) => pattern.id !== id,
            );
            for (const page of [data, ...data.pages])
              if (page.paper.patternId === id) page.paper.patternId = null;
          },
          { removeAssets: [id] },
        ),
      "Estampa apagada.",
    );
  }

  function updatePaper(patch: Partial<Paper>) {
    void action.run(() =>
      scoped.mutate((data) => Object.assign(data.paper, patch)),
    );
  }

  return (
    <>
      {sidebar &&
        createPortal(
          <button
            type="button"
            className="book-layout-button text-button"
            data-guide="layout"
            onClick={() => setChooseLayout(true)}
          >
            <LayoutTemplate size={17} /> Modelo da página
          </button>,
          sidebar,
        )}
      {tourSeen && (chooseLayout || firstChoice) && (
        <Modal
          title="Escolha um modelo"
          onClose={() => {
            if (firstChoice) selectLayout(scoped.data.profile.template);
            else setChooseLayout(false);
          }}
        >
          <div className="book-layout-options layout-options">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                className={`layout-option ${scoped.data.profile.template === layout.id ? "active" : ""}`}
                aria-label={layout.name}
                aria-description={layout.description}
                aria-pressed={scoped.data.profile.template === layout.id}
                type="button"
                disabled={action.pending}
                onClick={() => selectLayout(layout.id)}
              >
                <span
                  className={`layout-preview ${layout.id}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 6 }, (_, marker) => (
                    <i key={marker} />
                  ))}
                </span>
                <span className="book-layout-name">
                  {layout.name}{" "}
                  {scoped.data.profile.template === layout.id && (
                    <Check size={14} />
                  )}
                </span>
                <small>{layout.description}</small>
              </button>
            ))}
          </div>
          <p className="small muted">
            Use Livre para montar a folha do seu jeito. Nos outros modelos, é só
            preencher os espaços.
          </p>
          <Feedback action={action} />
        </Modal>
      )}
      {compose && (
        <AutoMural
          store={scoped}
          onClose={() => setCompose(false)}
          onComplete={(count) => {
            setCompose(false);
            setAssembled(
              count === 1
                ? "Uma foto colocada na folha."
                : count
                  ? `${count} fotos colocadas na folha.`
                  : "As fotos escolhidas já estão na folha.",
            );
            closeMobileSidebar();
          }}
        />
      )}
      <div className="book-toolbar">
        <div
          className="book-pagination"
          data-guide="pages"
          aria-label="Páginas do caderno"
        >
          <button
            className="icon-button"
            aria-label="Página anterior"
            disabled={index === 0 || action.pending}
            onClick={() => changePage(-1)}
          >
            <ChevronLeft size={21} />
          </button>
          <span role="status">
            Página {index + 1} de {pages.length}
          </span>
          <button
            className="icon-button"
            aria-label="Próxima página"
            disabled={index >= pages.length - 1 || action.pending}
            onClick={() => changePage(1)}
          >
            <ChevronRight size={21} />
          </button>
          <button
            className="text-button"
            disabled={action.pending}
            onClick={addPage}
          >
            <Plus size={17} /> Nova página
          </button>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setAssembled("");
            setCompose(true);
          }}
        >
          <Images size={17} /> Montar com fotos
        </button>
        <button
          type="button"
          className="text-button book-help-button"
          aria-expanded={guiding}
          onClick={() => setReplayGuide(true)}
        >
          Ajuda do mural
        </button>
        <button
          className="text-button"
          aria-controls="book-inspector"
          aria-expanded={showTools}
          onClick={() => setShowTools(!showTools)}
        >
          <PanelRight size={19} />{" "}
          {showTools ? "Fechar ferramentas" : "Abrir ferramentas"}
        </button>
      </div>
      <Feedback action={action} />
      {assembled && (
        <p role="status" className="notice success book-assembled">
          {assembled}
        </p>
      )}
      <div className="book-editor" ref={editor}>
        <div className="book-stage" ref={stage}>
          <section
            onTouchStart={(event) => {
              const target = event.target as HTMLElement;
              if (
                event.touches.length !== 1 ||
                target.closest("button, input, select, textarea, a")
              )
                return;
              const touch = event.touches[0];
              swipe.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchCancel={() => {
              swipe.current = null;
            }}
            onTouchEnd={(event) => {
              const start = swipe.current;
              swipe.current = null;
              const end = event.changedTouches[0];
              if (!start || !end) return;
              const dx = end.clientX - start.x;
              if (
                Math.abs(dx) > 60 &&
                Math.abs(end.clientY - start.y) < Math.abs(dx) / 2
              )
                changePage(dx < 0 ? 1 : -1);
            }}
            key={pageId ?? "first"}
            className={`book-leaf book-leaf-${direction}`}
            data-pattern={!!patternUrl}
            style={
              patternUrl
                ? ({
                    "--page-pattern": `url("${patternUrl}")`,
                  } as CSSProperties)
                : undefined
            }
            aria-label={`Página ${index + 1}`}
          >
            <h1
              className="book-page-title"
              tabIndex={-1}
              style={{
                fontFamily: fonts[paper.titleFont].family,
                color: paper.titleColor,
              }}
            >
              {title}
            </h1>
            <Mural
              key={scoped.data.profile.template}
              store={scoped}
              sidebar={sidebar}
              inspector={inspector}
              closeMobileSidebar={closeMobileSidebar}
              showInspector={openTools}
            />
          </section>
        </div>
        <aside
          id="book-inspector"
          className="book-inspector"
          hidden={!showTools}
          aria-label="Painel de edição"
        >
          <h2 className="book-tools-heading">Ferramentas</h2>
          <div ref={setInspector} />
          <details className="book-tool" open>
            <summary data-guide="paper">Título e papel</summary>
            <label>
              Título da página
              <input
                key={pageId ?? "first"}
                defaultValue={
                  paper.title || (!pageId ? store.data.dream.description : "")
                }
                maxLength={4000}
                onBlur={(event) => {
                  const value = event.currentTarget.value.trim();
                  if (value !== paper.title) updatePaper({ title: value });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </label>
            <label>
              Fonte do título
              <select
                value={paper.titleFont}
                onChange={(event) =>
                  updatePaper({
                    titleFont: event.target.value as Paper["titleFont"],
                  })
                }
              >
                {Object.entries(fonts).map(([key, choice]) => (
                  <option key={key} value={key}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="book-colors">
              <label>
                Cor do título{" "}
                <input
                  type="color"
                  value={paper.titleColor}
                  onChange={(event) =>
                    updatePaper({ titleColor: event.target.value })
                  }
                />
              </label>
              <label>
                Cor do fundo{" "}
                <input
                  type="color"
                  value={paper.background}
                  onChange={(event) =>
                    updatePaper({
                      background: event.target.value,
                      patternId: null,
                    })
                  }
                />
              </label>
            </div>
            <label>
              Desenho do papel
              <select
                value={paper.texture}
                onChange={(event) =>
                  updatePaper({
                    texture: event.target.value as Paper["texture"],
                    patternId: null,
                  })
                }
              >
                {Object.entries(textures).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="book-presets" aria-label="Ideias de papel">
              {paperPresets.map(({ label, ...preset }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  aria-label={label}
                  data-texture={preset.texture}
                  aria-pressed={
                    !paper.patternId &&
                    preset.background === paper.background &&
                    preset.texture === paper.texture
                  }
                  style={{ backgroundColor: preset.background }}
                  onClick={() => updatePaper({ ...preset, patternId: null })}
                />
              ))}
            </div>
            <label>
              Colocar uma estampa
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={action.pending || store.data.patterns.length >= 40}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) importPattern(file);
                }}
              />
            </label>
            {store.data.patterns.length > 0 && (
              <>
                <label>
                  Estampas guardadas
                  <select
                    value={paper.patternId ?? ""}
                    disabled={action.pending}
                    onChange={(event) =>
                      updatePaper({ patternId: event.target.value || null })
                    }
                  >
                    <option value="">Sem estampa</option>
                    {store.data.patterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.label}
                      </option>
                    ))}
                  </select>
                </label>
                {paper.patternId && (
                  <button
                    className="text-button"
                    type="button"
                    disabled={action.pending}
                    onClick={() => deletePattern(paper.patternId!)}
                  >
                    Apagar esta estampa
                  </button>
                )}
              </>
            )}
          </details>
        </aside>
      </div>
      {guiding && (
        <EditorGuide
          free={template === "free"}
          onFinish={finishGuide}
          openMenu={openMenu}
          openTools={openTools}
        />
      )}
    </>
  );
}
