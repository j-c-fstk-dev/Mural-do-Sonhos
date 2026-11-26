import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Images,
  PanelRight,
} from "lucide-react";
import { Feedback, Modal } from "../components/ui";
import { useAction } from "../data/useAction";

const steps = [
  {
    icon: BookOpen,
    title: "Comece por uma página",
    body: "Escolha um template para organizar seus recortes em espaços prontos ou escolha Livre para montar a página do seu jeito. Crie novas páginas para separar sonhos, temas ou etapas.",
  },
  {
    icon: Images,
    title: "Traga sua ideia para o papel",
    body: "Abra o painel esquerdo e use a galeria, os textos e as figurinhas. No modo Livre, arraste os elementos até onde quiser e use as alças para ajustar o tamanho.",
  },
  {
    icon: PanelRight,
    title: "Ajuste os detalhes",
    body: "No painel direito, dê um título à página, mude o papel, adicione formas e organize as camadas. Ao selecionar um texto, aparecem os controles de fonte, cor e formatação.",
  },
  {
    icon: Compass,
    title: "Transforme inspiração em passos",
    body: "Use Meu caminho para criar metas e ações, Hoje para acompanhar o próximo passo e Revisão para olhar a semana. Em Dados e ajustes você pode guardar um backup do seu caderno.",
  },
];

export function Tour({ onFinish }: { onFinish: () => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const action = useAction();
  const step = steps[index];
  const last = index === steps.length - 1;
  const finish = () => void action.run(onFinish);
  return (
    <Modal title="Conheça seu caderno" onClose={finish}>
      <div className="book-tour" aria-live="polite">
        <step.icon size={28} />
        <p className="small muted">
          Passo {index + 1} de {steps.length}
        </p>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </div>
      <Feedback action={action} />
      <div className="book-tour-actions">
        <button
          className="text-button"
          onClick={index ? () => setIndex(index - 1) : finish}
          disabled={action.pending}
        >
          {index > 0 && <ArrowLeft size={16} />}{" "}
          {index ? "Voltar" : "Pular tour"}
        </button>
        <button
          onClick={last ? finish : () => setIndex(index + 1)}
          disabled={action.pending}
        >
          {last ? "Começar" : "Próximo"} <ArrowRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
