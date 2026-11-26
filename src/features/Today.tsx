import { formatDate } from "../data/dates";
import { useAction } from "../data/useAction";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Plus, Sparkles } from "lucide-react";
import { changeTask, localDate, monday, type Task } from "../data/model";
import { Feedback, PageTitle, type ScreenProps } from "../components/ui";
import { TaskEditor, TaskRow } from "./Plan";
import { LocalImage } from "../components/LocalImage";
export function Today({ store }: ScreenProps) {
  const [date, setDate] = useState(localDate);
  const [edit, setEdit] = useState<Task | "new" | null>(null);
  const action = useAction();
  useEffect(() => {
    const timer = setInterval(() => setDate(localDate()), 30000);
    const wake = () => setDate(localDate());
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  const pending = store.data.tasks.filter((task) => task.status === "pending");
  const due = pending
    .filter((task) => task.scheduled_on && task.scheduled_on <= date)
    .sort((a, b) => (a.scheduled_on || "").localeCompare(b.scheduled_on || ""));
  const unscheduled = pending.filter((task) => !task.scheduled_on);
  const next = due[0];
  const image = store.data.cards.find((card) => card.kind === "image");
  const doneToday = store.data.tasks.filter(
    (task) =>
      task.status === "done" &&
      task.completed_at &&
      localDate(new Date(task.completed_at)) === date,
  );
  const review = store.data.reviews.some((row) => row.week_of === monday());
  return (
    <>
      <PageTitle
        eyebrow={new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="O que vou fazer hoje?"
      >
        Escolha um passo pequeno para chegar mais perto do seu sonho.
      </PageTitle>
      {!store.data.profile.journey_completed && (
        <div className="welcome-note">
          <Sparkles size={23} />
          <div>
            <strong>
              {store.data.profile.journey_step
                ? "Quer continuar as perguntas?"
                : "Qual é o seu sonho?"}
            </strong>
            <p>
              Responda a algumas perguntas para pensar em um sonho e no que
              fazer primeiro.
            </p>
          </div>
          <a href="#/jornada" className="button">
            {store.data.profile.journey_step
              ? "Continuar perguntas"
              : "Responder perguntas"}{" "}
            <ArrowRight size={17} />
          </a>
        </div>
      )}
      <div className="today-grid">
        <section className="today-focus">
          <span className="eyebrow">MEU PASSO DE HOJE</span>
          {next ? (
            <>
              <h2>{next.title}</h2>
              <p>
                {
                  store.data.goals.find((goal) => goal.id === next.goal_id)
                    ?.title
                }
              </p>
              {next.scheduled_on && next.scheduled_on < date && (
                <p className="small">
                  A data passou. Você pode marcar outro dia ou mudar o passo.
                </p>
              )}
              <div className="inline-actions">
                <button
                  disabled={action.pending}
                  onClick={() =>
                    void action.run(
                      () =>
                        store.mutate((data) =>
                          changeTask(data, next.id, { status: "done" }),
                        ),
                      "Passo marcado como feito.",
                    )
                  }
                >
                  <Check size={17} /> Fiz esse passo
                </button>
                <button className="secondary" onClick={() => setEdit(next)}>
                  Adaptar
                </button>
                <button
                  className="text-button"
                  disabled={action.pending}
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    void action.run(
                      () =>
                        store.mutate((data) =>
                          changeTask(
                            data,
                            next.id,
                            { scheduled_on: localDate(tomorrow) },
                            "Deixei para amanhã.",
                          ),
                        ),
                      "Passo marcado para amanhã.",
                    );
                  }}
                >
                  Deixar para amanhã
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Quer escolher um passo?</h2>
              <p>
                {doneToday.length
                  ? "Você já deu um passo. Pode escolher outro ou parar por hoje."
                  : "Escolha algo que você consiga fazer hoje."}
              </p>
              {!store.data.goals.length ? (
                <a href="#/plano" className="button">
                  Criar minha primeira meta
                </a>
              ) : (
                <button onClick={() => setEdit("new")}>
                  <Plus size={17} /> Criar um passo
                </button>
              )}
            </>
          )}
          <Feedback action={action} />
        </section>
        <aside className="vision-peek">
          {image?.asset_id ? (
            <LocalImage
              assetId={image.asset_id}
              repository={store.repository}
              alt={image.body}
            />
          ) : (
            <span className="vision-star" aria-hidden="true">
              ✳
            </span>
          )}
          <p>
            {store.data.dream.description ||
              "Coloque na folha algo que você quer fazer um dia."}
          </p>
          <a href="#/">Visitar meu mural →</a>
        </aside>
      </div>
      {due.length > 1 && (
        <section className="surface">
          <h2>Outros passos para hoje</h2>
          <p className="muted">Escolha o que quiser fazer.</p>
          {due.slice(1).map((task) => (
            <TaskRow key={task.id} store={store} task={task} onEdit={setEdit} />
          ))}
        </section>
      )}
      <section className="surface">
        <div className="section-heading">
          <h2>Passos sem data</h2>
          <a href="#/plano">Ver metas e passos →</a>
        </div>
        {unscheduled.length ? (
          unscheduled.map((task) => (
            <div className="pick-task" key={task.id}>
              <span>{task.title}</span>
              <button
                className="secondary"
                disabled={action.pending}
                onClick={() =>
                  void action.run(
                    () =>
                      store.mutate((data) =>
                        changeTask(
                          data,
                          task.id,
                          { scheduled_on: date },
                          "Escolhi para hoje.",
                        ),
                      ),
                    "Passo escolhido para hoje.",
                  )
                }
              >
                Escolher para hoje
              </button>
              <button
                className="icon-button"
                aria-label={`Editar: ${task.title}`}
                onClick={() => setEdit(task)}
              >
                ↗
              </button>
            </div>
          ))
        ) : (
          <p className="muted">
            Nenhum passo sem data. Você pode criar ou ajustar ações no seu
            caminho.
          </p>
        )}
      </section>
      <section className="cards">
        <article className="card lavender">
          <p className="eyebrow">MEU MURAL</p>
          <h2>Suas ideias na folha</h2>
          <p>Junte fotos dos lugares e das coisas que você quer conhecer.</p>
          <a href="#/">Visitar meu mural →</a>
        </article>
        <article className="card sage">
          <p className="eyebrow">REVISÃO SEMANAL</p>
          <h2>
            {review
              ? "Você já escreveu sobre esta semana"
              : "Como foi sua semana?"}
          </h2>
          <p>
            {review
              ? "Você pode ler ou mudar o que escreveu."
              : "Escreva o que deu certo, o que foi difícil e o que quer fazer depois."}
          </p>
          <a href="#/revisao">
            {review ? "Ler minha semana" : "Escrever sobre a semana"} →
          </a>
        </article>
        <article className="card peach">
          <p className="eyebrow">MEUS REGISTROS</p>
          <h2>
            {doneToday.length}{" "}
            {doneToday.length === 1
              ? "passo realizado hoje"
              : "passos realizados hoje"}
          </h2>
          <p>Veja o que você já fez ou mudou.</p>
          <a href="#/historico">Ver histórico →</a>
        </article>
      </section>
      <p className="footer-note">{store.data.profile.intention}</p>
      {edit && (
        <TaskEditor
          store={store}
          task={edit === "new" ? undefined : edit}
          onClose={() => setEdit(null)}
        />
      )}
    </>
  );
}
export function History({ store }: ScreenProps) {
  const labels = {
    completed: "Passo feito",
    reopened: "Passo a fazer",
    rescheduled: "Mudou de dia",
    adapted: "Passo mudou",
  };
  return (
    <>
      <PageTitle eyebrow="HISTÓRICO" title="O que já fiz">
        Veja os passos que você fez, mudou ou deixou para outro dia.
      </PageTitle>
      <div className="surface">
        {!store.data.events.length ? (
          <p>Seus passos vão aparecer aqui quando você fizer ou mudar algum.</p>
        ) : (
          <ol className="timeline">
            {store.data.events.map((event) => (
              <li key={event.id}>
                <span className="timeline-dot" />
                <div>
                  <span className="eyebrow">{labels[event.kind]}</span>
                  <h3>{event.title}</h3>
                  {event.detail && <p>{event.detail}</p>}
                  <time dateTime={event.created_at}>
                    {formatDate(localDate(new Date(event.created_at)))} ·{" "}
                    {new Date(event.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
