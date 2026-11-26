import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  PanelRight,
  Plus,
} from "lucide-react";
import { Feedback, Modal, type ScreenProps } from "../components/ui";
import { pageStore } from "../data/book";
import { makeId, type Paper, type Workspace } from "../data/model";
import { fonts, paperPresets, textures } from "../data/paper";
import { useAction } from "../data/useAction";
import { layouts } from "./layouts";
import { Mural } from "./Mural";

export function Book({
  store,
  sidebar,
  closeMobileSidebar,
  tourSeen,
}: ScreenProps & {
  sidebar: HTMLElement | null;
  closeMobileSidebar: () => void;
  tourSeen: boolean;
}) {
  const [chooseLayout, setChooseLayout] = useState(false);
  const [showTools, setShowTools] = useState(() => window.innerWidth > 1100);
  const [inspector, setInspector] = useState<HTMLDivElement | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const action = useAction();
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const pageId = store.data.profile.active_page;
  const scoped = pageStore(store, pageId);
  const pages = [null, ...store.data.pages.map((page) => page.id)];
  const index = pages.indexOf(pageId);
  const paper = scoped.data.paper;
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

  function changePage(offset: number) {
    const target = pages[index + offset];
    if (target === undefined || action.pending) return;
    setDirection(offset > 0 ? "next" : "previous");
    void action.run(() =>
      store.mutate((data) => {
        data.profile.active_page = target;
      }),
    );
  }

  function addPage() {
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
            onClick={() => setChooseLayout(true)}
          >
            <LayoutTemplate size={17} /> Layout da página
          </button>,
          sidebar,
        )}
      {tourSeen && (chooseLayout || firstChoice) && (
        <Modal
          title="Escolha um layout"
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
                <span>
                  {layout.name}{" "}
                  {scoped.data.profile.template === layout.id && (
                    <Check size={14} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="small muted">
            Em Livre, você posiciona os elementos onde quiser. Os templates têm
            espaços prontos.
          </p>
          <Feedback action={action} />
        </Modal>
      )}
      <div className="book-toolbar">
        <div className="book-pagination" aria-label="Páginas do caderno">
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
          className="text-button"
          aria-controls="book-inspector"
          aria-expanded={showTools}
          onClick={() => setShowTools(!showTools)}
        >
          <PanelRight size={19} />{" "}
          {showTools ? "Recolher edição" : "Editar página"}
        </button>
      </div>
      <Feedback action={action} />
      <div className="book-editor">
        <div className="book-stage">
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
              showInspector={() => setShowTools(true)}
            />
          </section>
        </div>
        <aside
          id="book-inspector"
          className="book-inspector"
          hidden={!showTools}
          aria-label="Painel de edição"
        >
          <button
            className="book-close-tools text-button"
            type="button"
            onClick={() => setShowTools(false)}
          >
            Fechar painel de edição
          </button>
          <div ref={setInspector} />
          <details className="book-tool" open>
            <summary>Página e papel</summary>
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
                    updatePaper({ background: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Textura
              <select
                value={paper.texture}
                onChange={(event) =>
                  updatePaper({
                    texture: event.target.value as Paper["texture"],
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
            <div className="book-presets" aria-label="Papéis de scrapbook">
              {paperPresets.map(({ label, ...preset }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  aria-label={label}
                  data-texture={preset.texture}
                  aria-pressed={
                    preset.background === paper.background &&
                    preset.texture === paper.texture
                  }
                  style={{ backgroundColor: preset.background }}
                  onClick={() => updatePaper(preset)}
                />
              ))}
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}
