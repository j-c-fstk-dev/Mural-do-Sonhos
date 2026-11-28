import { useEffect, useState } from "react";

const steps = [
  {
    target: "first-title",
    title: "Dê um nome à página",
    body: "Escreva em Título da página, por exemplo “Minha viagem dos sonhos”. Aí você também pode mudar a letra e a cor do título.",
    hint: "Escreva um título e toque fora do campo para salvar.",
  },
  {
    target: "first-paper",
    title: "Escolha o fundo",
    body: "Toque numa cor, num papel pronto ou numa estampa para vestir a folha.",
    hint: "Escolha um fundo para continuar.",
  },
  {
    target: "assemble",
    title: "Monte com fotos",
    body: "Escolha uma ou mais fotos, com ou sem moldura, e toque em Montar página. Depois, toque numa foto para mudar a moldura.",
    hint: "Use Montar com fotos para continuar.",
  },
  {
    target: "stickers",
    title: "Cole uma figurinha",
    body: "Abra Figurinhas e escolha uma. Na folha, arraste para mover ou abra Tamanho e giro para ajustar.",
    hint: "Cole uma figurinha para continuar.",
  },
  {
    target: "text",
    title: "Escreva na folha",
    body: "Abra Texto e escolha um exemplo. Use o lápis na folha ou Editar texto para escrever do seu jeito. Nas ferramentas você também muda letra, tamanho, cor e fundo.",
    hint: "Coloque uma caixa de texto para continuar.",
  },
  {
    target: "first-new-page",
    title: "A primeira página está pronta!",
    body: "Agora crie uma folha nova e experimente montar do seu jeito.",
    hint: "",
  },
] as const;

export type FirstMuralTarget = (typeof steps)[number]["target"];

export function FirstMuralGuide({
  completed,
  hidden,
  pending,
  onSkip,
  onTarget,
  onAssemble,
  onNewPage,
}: {
  completed: boolean[];
  hidden: boolean;
  pending: boolean;
  onSkip: () => void;
  onTarget: (target: FirstMuralTarget) => void;
  onAssemble: () => void;
  onNewPage: () => void;
}) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  useEffect(() => {
    onTarget(step.target);
    let target: HTMLElement | undefined;
    let frame = 0;
    let attempts = 0;
    const highlight = () => {
      target = [
        ...document.querySelectorAll<HTMLElement>(
          `[data-guide="${step.target}"]`,
        ),
      ].find((element) => element.getClientRects().length > 0);
      if (!target && attempts++ < 12) {
        frame = requestAnimationFrame(highlight);
        return;
      }
      if (!target) return;
      target.setAttribute("data-guide-active", "true");
      const sidebar = target.closest(".book-sidebar");
      if (sidebar) {
        sidebar.scrollTop +=
          target.getBoundingClientRect().top -
          sidebar.getBoundingClientRect().top -
          66;
      }
    };
    frame = requestAnimationFrame(highlight);
    return () => {
      cancelAnimationFrame(frame);
      target?.removeAttribute("data-guide-active");
    };
  }, [step, onTarget]);

  return (
    <section
      className="first-mural-guide"
      aria-label="Ajuda do mural"
      hidden={hidden}
    >
      <div aria-live="polite">
        <p className="editor-guide-count">
          Passo {index + 1} de {steps.length}
        </p>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
      </div>
      <div className="editor-guide-actions">
        <button type="button" className="text-button" onClick={onSkip}>
          Pular ajuda
        </button>
        {step.target === "assemble" && !completed[index] && (
          <button type="button" onClick={onAssemble}>
            Escolher fotos
          </button>
        )}
        {(step.target !== "assemble" || completed[index]) && (
          <button
            type="button"
            data-guide={last ? "first-new-page" : undefined}
            disabled={pending || (!last && !completed[index])}
            onClick={last ? onNewPage : () => setIndex(index + 1)}
          >
            {last ? "Criar página 2" : "Continuar"}
          </button>
        )}
      </div>
      {!last && !completed[index] && <p className="small muted">{step.hint}</p>}
    </section>
  );
}
