import { useAction } from "../data/useAction";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { now, rowBase, type Workspace } from "../data/model";
import { Feedback, Submit, type ScreenProps } from "../components/ui";
const questions = [
  [
    "wish",
    "O que você quer fazer um dia?",
    "Exemplo: quero aprender a desenhar.",
  ],
  [
    "scene",
    "Como seria um dia com esse sonho realizado?",
    "Exemplo: estou no parque, desenhando as árvores.",
  ],
  [
    "feeling",
    "Como você gostaria de se sentir?",
    "Exemplo: quero me sentir feliz e tranquilo.",
  ],
  [
    "reason",
    "Por que esse sonho importa para você?",
    "Exemplo: gosto de desenhar porque posso inventar coisas.",
  ],
  [
    "resources",
    "O que já pode ajudar você?",
    "Exemplo: tenho um caderno e uma amiga que desenha.",
  ],
  [
    "obstacle",
    "O que pode atrapalhar?",
    "Exemplo: fico sem tempo durante a semana.",
  ],
  ["time", "Quanto tempo você pode usar?", "Exemplo: dez minutos no sábado."],
  [
    "goal",
    "O que você quer conseguir primeiro?",
    "Exemplo: terminar um desenho para pendurar no quarto.",
  ],
  [
    "action",
    "Qual é o primeiro passo?",
    "Exemplo: escolher um lápis e desenhar uma árvore.",
  ],
  [
    "alternative",
    "Se algo atrapalhar, o que você pode tentar?",
    "Exemplo: se chover, desenho perto da janela.",
  ],
  [
    "dream",
    "Como você contaria seu sonho a um amigo?",
    "Exemplo: quero aprender a desenhar os lugares de que gosto.",
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
          "Tenho muitas ideias": "Qual ideia você quer tentar primeiro?",
          "Já comecei": "O que você começou? O que ficou difícil?",
          "Quero descobrir": "O que você gostaria de fazer mais vezes?",
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
        <h1 tabIndex={-1}>Seu sonho está salvo</h1>
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
        <p className="muted">Para mudar suas metas, abra Metas e passos.</p>
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
      <p className="eyebrow">MEU SONHO</p>
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
            {adaptive || prompt?.[1] || "Você já tem um sonho em mente?"}
          </label>
        </h1>
        <p id="hint">
          {prompt?.[2] ||
            "Escolha a opção mais parecida com o que você sente agora."}
        </p>
        {step === 0 ? (
          <fieldset className="options" disabled={action.pending}>
            <legend className="sr-only">Você já tem um sonho em mente?</legend>
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
                {step === 11 ? "Ver metas e passos" : "Continuar"}{" "}
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
          Para mudar suas metas, abra Metas e passos.
        </p>
      )}
    </section>
  );
}
