import { useAction } from "../data/useAction";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { now, rowBase, type Workspace } from "../data/model";
import { Feedback, Submit, type ScreenProps } from "../components/ui";
const questions = [
  [
    "wish",
    "O que você gostaria de viver ou construir?",
    "Não precisa encontrar as palavras perfeitas.",
  ],
  [
    "scene",
    "Como seria um dia comum dessa vida?",
    "Onde você está? O que está fazendo? Pense em uma cena.",
  ],
  [
    "feeling",
    "Como você gostaria de se sentir?",
    "Com tranquilidade, autonomia, entusiasmo… O que importa para você?",
  ],
  [
    "reason",
    "Por que esse sonho importa para você?",
    "Pense no que faz sentido para você, além das expectativas dos outros.",
  ],
  [
    "resources",
    "O que você já tem a seu favor?",
    "Uma habilidade, uma pessoa, um recurso ou algo que já aprendeu.",
  ],
  [
    "obstacle",
    "O que pode dificultar seu caminho?",
    "Escolha uma dificuldade que você possa enfrentar ou contornar.",
  ],
  [
    "time",
    "Quanto tempo cabe na sua rotina?",
    "Pode ser dez minutos. Escolha algo possível na sua vida atual.",
  ],
  [
    "goal",
    "Qual resultado mostraria um primeiro avanço?",
    "Uma meta concreta. Por exemplo: montar um portfólio com três trabalhos.",
  ],
  [
    "action",
    "Qual é o menor passo que você pode dar?",
    "Algo específico: separar três referências, escrever um parágrafo, enviar uma mensagem.",
  ],
  [
    "alternative",
    "Se a dificuldade aparecer, como você pode adaptar?",
    "Se acontecer…, então eu posso…",
  ],
  [
    "dream",
    "Como você descreveria seu sonho principal?",
    "Quero construir uma vida em que eu possa…, com mais… e espaço para…",
  ],
] as const;
function answer(data: Workspace, step: number) {
  if (!step) return data.dream.answers.start;
  const key = questions[step - 1][0];
  return key === "dream" ? data.dream.description : data.dream.answers[key];
}
export function Journey({ store }: ScreenProps) {
  const { data } = store;
  const [step, setStep] = useState(data.profile.journey_step);
  const [value, setValue] = useState(() =>
    answer(data, data.profile.journey_step),
  );
  const action = useAction();
  const [completed, setCompleted] = useState(false);
  const prompt = step ? questions[step - 1] : null;
  const adaptive =
    step === 1
      ? {
          "Tenho muitas ideias":
            "Qual ideia faria mais diferença na sua vida agora?",
          "Já comecei": "O que você está construindo e onde sente que travou?",
          "Quero descobrir":
            "O que você gostaria que tivesse mais espaço na sua vida?",
        }[data.dream.answers.start]
      : null;
  async function move(direction: number, exit = false) {
    const target = Math.max(0, Math.min(11, step + direction));
    const ok = await action.run(() =>
      store.mutate((draft) => {
        const key = step ? questions[step - 1][0] : "start";
        if (key === "dream") draft.dream.description = value.trim();
        else draft.dream.answers[key] = value.trim();
        draft.dream.updated_at = now();
        draft.profile.journey_step = target;
        if (step === 11 && direction > 0 && !exit) {
          if (!draft.profile.journey_completed) {
            const goal = {
              ...rowBase(),
              dream_id: draft.dream.id,
              title: draft.dream.answers.goal,
              target_date: null,
              obstacle: draft.dream.answers.obstacle,
              alternative: draft.dream.answers.alternative,
            };
            if (goal.title) {
              draft.goals.push(goal);
              if (draft.dream.answers.action)
                draft.tasks.push({
                  ...rowBase(),
                  goal_id: goal.id,
                  title: draft.dream.answers.action,
                  scheduled_on: null,
                  status: "pending",
                  completed_at: null,
                });
            }
          }
          draft.profile.journey_completed = true;
        }
      }),
    );
    if (!ok) return;
    if (exit) {
      location.hash = "/";
      return;
    }
    if (step === 11 && direction > 0) {
      setCompleted(true);
      return;
    }
    // Reading the committed answer from the current snapshot is safe for other steps.
    setStep(target);
    setValue(answer(data, target));
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(".journey h1")?.focus(),
    );
  }
  if (completed)
    return (
      <section className="journey completion">
        <Compass size={42} />
        <h1 tabIndex={-1}>Seu caminho já começou.</h1>
        <p>
          Sua visão está salva. Agora você pode montar o mural, ajustar as metas
          e escolher o passo de hoje.
        </p>
        <a className="button" href="#/">
          Montar meu mural <ArrowRight size={18} />
        </a>
        <a href="#/plano" className="button secondary">
          Ver meu plano
        </a>
        <p className="muted">
          Revisar as respostas não duplica suas metas. Os ajustes do plano são
          feitos em “Meu caminho”.
        </p>
      </section>
    );
  return (
    <section className="journey">
      <button
        className="text-button"
        onClick={() => void move(0, true)}
        disabled={action.pending}
      >
        <ArrowLeft size={16} /> Salvar e sair
      </button>
      <p className="eyebrow">CLAREAR · IMAGINAR · AGIR</p>
      <div className="progress-label">
        <span>Passo {step + 1} de 12</span>
        <span>{Math.round(((step + 1) / 12) * 100)}%</span>
      </div>
      <progress value={step + 1} max={12} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void move(1);
        }}
      >
        <h1 tabIndex={-1}>
          <label htmlFor="answer">
            {adaptive || prompt?.[1] || "Como você chega aqui hoje?"}
          </label>
        </h1>
        <p id="hint">
          {prompt?.[2] ||
            "Você não precisa ter tudo resolvido. Vamos encontrar uma direção que faça sentido."}
        </p>
        {step === 0 ? (
          <fieldset className="options" disabled={action.pending}>
            <legend className="sr-only">Como você chega aqui hoje?</legend>
            {[
              "Tenho um sonho",
              "Tenho muitas ideias",
              "Já comecei",
              "Quero descobrir",
            ].map((option) => (
              <label
                className={`option ${value === option ? "selected" : ""}`}
                key={option}
              >
                <input
                  type="radio"
                  name="start"
                  checked={value === option}
                  onChange={() => setValue(option)}
                />
                {option}
              </label>
            ))}
          </fieldset>
        ) : (
          <textarea
            autoFocus
            key={step}
            id="answer"
            aria-describedby="hint"
            required
            maxLength={4000}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
          />
        )}
        <Feedback action={action} />
        <div className="actions">
          <button
            type="button"
            className="secondary"
            disabled={step === 0 || action.pending}
            onClick={() => void move(-1)}
          >
            Voltar
          </button>
          <div>
            {value.trim() ? (
              <Submit pending={action.pending}>
                {step === 11 ? "Ver meu caminho" : "Continuar"}{" "}
                <ArrowRight size={17} />
              </Submit>
            ) : (
              <button disabled>
                Continuar <ArrowRight size={17} />
              </button>
            )}
          </div>
        </div>
      </form>
      {data.profile.journey_completed && (
        <p className="small muted">
          Rever respostas não altera metas existentes. Edite as metas em “Meu
          caminho”.
        </p>
      )}
    </section>
  );
}
