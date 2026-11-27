import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type EditContext =
  "paper" | "photo" | "text" | "sticker" | "shape" | "card-photo" | "card-text";
const labels = {
  paper: "Fundo",
  title: "Título",
  shapes: "Formas",
  layers: "Ordem na folha",
  frame: "Moldura",
  dimensions: "Tamanho e giro",
  body: "Editar texto",
  font: "Letra",
  size: "Tamanho",
  color: "Cor",
  style: "Estilo",
  remove: "Remover",
  card: "Editar cartão",
};
export type EditTool = keyof typeof labels;
const options: Record<EditContext, EditTool[]> = {
  paper: ["paper", "title", "shapes", "layers"],
  photo: ["frame", "layers", "remove", "dimensions"],
  text: [
    "body",
    "font",
    "size",
    "color",
    "style",
    "layers",
    "remove",
    "dimensions",
  ],
  sticker: ["layers", "remove", "dimensions"],
  shape: ["color", "layers", "remove", "dimensions"],
  "card-photo": ["frame", "card", "layers", "remove"],
  "card-text": ["card", "layers", "remove"],
};

export function EditorDock({
  context,
  tool,
  free,
  onTool,
  children,
}: {
  context: EditContext | null;
  tool: EditTool | null;
  free: boolean;
  onTool: (tool: EditTool | null) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const dock = ref.current;
    if (!viewport || !dock) return;
    const fit = () => {
      dock.style.setProperty(
        "--dock-bottom",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
      dock.style.setProperty("--dock-viewport", `${viewport.height}px`);
    };
    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
    };
  }, []);
  const available =
    context === "paper" && !free
      ? options.paper.slice(0, 2)
      : context
        ? options[context]
        : [];
  const active = tool && available.includes(tool) ? tool : null;
  function collapse() {
    ref.current
      ?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')
      ?.focus();
    onTool(null);
  }

  return (
    <aside
      ref={ref}
      className="book-mobile-dock"
      aria-label="Ferramentas do mural"
      hidden={!context}
      data-active-tool={active ?? ""}
      onKeyDown={(event) => {
        if (event.key === "Escape" && active) {
          event.stopPropagation();
          collapse();
        }
      }}
    >
      <div
        id="book-inspector"
        className="book-mobile-controls"
        aria-label="Painel de edição"
        hidden={!active}
      >
        <div className="book-mobile-heading">
          <h2>{active ? labels[active] : "Ferramentas"}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Recolher opções"
            onClick={collapse}
          >
            <ChevronDown size={19} />
          </button>
        </div>
        {children}
      </div>
      <div
        key={context}
        className="book-mobile-actions"
        role="group"
        aria-label="Opções da seleção"
      >
        {available.map((key) => (
          <button
            type="button"
            className="text-button"
            key={key}
            aria-controls="book-inspector"
            aria-expanded={active === key}
            data-guide={
              key === "paper" || key === "shapes" || key === "layers"
                ? key
                : undefined
            }
            onClick={() => onTool(active === key ? null : key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>
    </aside>
  );
}
