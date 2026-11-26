import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Compass,
  Images,
} from "lucide-react";
import { Feedback, Modal } from "../components/ui";
import { useAction } from "../data/useAction";

const steps = [
  {
    icon: Images,
    title: "Junte ideias no mural",
    body: "Em Meu mural, coloque uma foto, uma frase e uma figurinha. Exemplo: uma foto da praia e a frase «Quero aprender a surfar».",
  },
  {
    icon: BookOpen,
    title: "Use uma folha para cada ideia",
    body: "Toque em Nova página para começar outra folha. As setas viram as páginas do caderno.",
  },
  {
    icon: Compass,
    title: "Escolha algo para fazer",
    body: "Abra Metas e passos. Se seu sonho é aprender violão, uma meta pode ser tocar uma música. O primeiro passo pode ser aprender um acorde.",
  },
  {
    icon: CalendarCheck,
    title: "Veja como foi",
    body: "Em Hoje, marque o passo que você fez. Em Minha semana, escreva o que deu certo e o que quer tentar depois.",
  },
];

export function Tour({ onFinish }: { onFinish: () => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const action = useAction();
  const step = steps[index];
  const last = index === steps.length - 1;
  const finish = () => void action.run(onFinish);
  return (
    <Modal title="Conheça o app" onClose={finish}>
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
          {index ? "Voltar" : "Pular apresentação"}
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
