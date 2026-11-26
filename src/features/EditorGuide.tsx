import { useEffect, useState } from "react";

const steps = [
  {
    target: "layout",
    title: "Escolha o jeito da folha",
    body: "Use Modelo da página para trocar. No modelo Livre, você pode mover tudo na folha.",
  },
  {
    target: "photos",
    title: "Coloque uma foto",
    body: "Abra Fotos, escolha uma do aparelho e toque nela para pôr na folha. Exemplo: uma foto da praia que você quer visitar.",
  },
  {
    target: "text",
    title: "Escreva uma ideia",
    body: "Abra Texto e escolha um exemplo. Toque duas vezes na caixa ou use o lápis para trocar as palavras na própria folha.",
  },
  {
    target: "stickers",
    title: "Enfeite com figurinhas",
    body: "Abra Figurinhas e toque em uma para pôr na folha. Experimente uma estrela ao lado de um sonho.",
  },
  {
    target: "sheet",
    title: "Mova o que colocou",
    body: "Arraste para mudar de lugar. Toque em uma foto: os quadradinhos mudam o tamanho e a seta redonda gira.",
  },
  {
    target: "shapes",
    title: "Desenhe com formas",
    body: "Em Formas, toque em um círculo, uma seta ou outra forma. Depois toque nela na folha para trocar a cor.",
  },
  {
    target: "format",
    title: "Mude a letra ou a cor",
    body: "Toque em um texto na folha. Em Ferramentas, abra Editar o que você escolheu e mude a letra, a cor ou o fundo do texto.",
  },
  {
    target: "layers",
    title: "Mostre o que ficou escondido",
    body: "Em Ordem na folha, escolha um item. Use Frente ou Trás se um item estiver cobrindo outro.",
  },
  {
    target: "paper",
    title: "Dê um nome e uma cor à página",
    body: "Em Título e papel, escreva um nome como “Viagem à praia”. Experimente trocar a cor ou as bolinhas do papel.",
  },
  {
    target: "pages",
    title: "Vire a página",
    body: "Use Nova página para guardar outra ideia. As setas voltam ou avançam no caderno.",
  },
] as const;

export function EditorGuide({
  free,
  onFinish,
  openMenu,
  openTools,
}: {
  free: boolean;
  onFinish: () => void;
  openMenu: () => void;
  openTools: () => void;
}) {
  const available = free
    ? steps
    : steps.filter(
        ({ target }) =>
          !["text", "stickers", "shapes", "layers", "format"].includes(target),
      );
  const [index, setIndex] = useState(0);
  const position = Math.min(index, available.length - 1);
  const step = available[position];
  const last = position === available.length - 1;
  useEffect(() => {
    if (["layout", "photos", "text", "stickers"].includes(step.target))
      openMenu();
    if (["shapes", "layers", "paper", "format"].includes(step.target))
      openTools();
    let highlighted: HTMLElement | null = null;
    const frame = requestAnimationFrame(() => {
      highlighted =
        document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`) ??
        (step.target === "format"
          ? document.getElementById("book-inspector")
          : null);
      highlighted?.setAttribute("data-guide-active", "true");
      highlighted?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => {
      cancelAnimationFrame(frame);
      highlighted?.removeAttribute("data-guide-active");
    };
  }, [step, openMenu, openTools]);

  return (
    <section
      className="editor-guide"
      aria-label="Ajuda do mural"
      onKeyDown={(event) => {
        if (event.key === "Escape") onFinish();
      }}
    >
      <div aria-live="polite">
        <p className="editor-guide-count">
          Passo {position + 1} de {available.length}
        </p>
        <h2>{step.title}</h2>
        <p>
          {!free && step.target === "sheet"
            ? "Toque em uma foto e depois no lugar onde ela deve ficar."
            : step.body}
        </p>
      </div>
      <div className="editor-guide-actions">
        <button className="text-button" type="button" onClick={onFinish}>
          {last ? "Fechar ajuda" : "Pular ajuda"}
        </button>
        {position > 0 && (
          <button
            className="text-button"
            type="button"
            onClick={() => setIndex(position - 1)}
          >
            Voltar
          </button>
        )}
        <button
          type="button"
          onClick={last ? onFinish : () => setIndex(position + 1)}
        >
          {last ? "Pronto" : "Continuar"}
        </button>
      </div>
    </section>
  );
}
