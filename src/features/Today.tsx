import { formatDate } from "../data/dates";
import { useAction } from "../data/useAction";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Plus, Sparkles } from "lucide-react";
import { changeTask, localDate, monday, type Task } from "../data/model";
import { Feedback, PageTitle, type ScreenProps } from "../components/ui";
import { TaskEditor, TaskRow } from "./Plan";
import { LocalImage } from "./Mural";
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
        title="Um passo no que importa."
      >
        Seu ritmo pode mudar. Seu caminho também.
      </PageTitle>
      {!store.data.profile.journey_completed && (
        <div className="welcome-note">
          <Sparkles size={23} />
          <div>
            <strong>
              {store.data.profile.journey_step
                ? "Seu caminho está esperando por você."
                : "Vamos encontrar uma direção?"}
            </strong>
            <p>
              Responda às perguntas para conectar seu sonho ao primeiro passo.
            </p>
          </div>
          <a href="#/jornada" className="button">
            {store.data.profile.journey_step
              ? "Continuar jornada"
              : "Começar jornada"}{" "}
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
                  Esse passo ficou para trás. Você pode adaptar a data ou a
                  ação.
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
                      "Passo registrado. Reconheça esse avanço!",
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
                      "Passo reagendado para amanhã.",
                    );
                  }}
                >
                  Deixar para amanhã
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>O que cabe no seu dia?</h2>
              <p>
                {doneToday.length
                  ? "Você já registrou um avanço. Se fizer sentido, escolha outro passo — ou encerre por hoje."
                  : "Escolha uma ação possível. Você não precisa preencher o dia inteiro."}
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
              "O futuro ganha forma quando você encontra uma direção."}
          </p>
          <a href="#/">Visitar meu mural →</a>
        </aside>
      </div>
      {due.length > 1 && (
        <section className="surface">
          <h2>Outros passos disponíveis</h2>
          <p className="muted">
            Escolha o que faz sentido. Não é uma obrigação concluir todos.
          </p>
          {due.slice(1).map((task) => (
            <TaskRow key={task.id} store={store} task={task} onEdit={setEdit} />
          ))}
        </section>
      )}
      <section className="surface">
        <div className="section-heading">
          <h2>Passos sem data fixa</h2>
          <a href="#/plano">Ver meu caminho →</a>
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
          <h2>Um recorte do seu amanhã</h2>
          <p>
            Reúna imagens das experiências e dos lugares que você quer viver.
          </p>
          <a href="#/">Visitar meu mural →</a>
        </article>
        <article className="card sage">
          <p className="eyebrow">REVISÃO SEMANAL</p>
          <h2>{review ? "Seu caminho pode mudar" : "Como foi sua semana?"}</h2>
          <p>
            {review
              ? "Você já registrou uma revisão nesta semana. Pode revisitar ou atualizar quando quiser."
              : "Reconheça avanços e encontre um ajuste possível, sem cobrança."}
          </p>
          <a href="#/revisao">
            {review ? "Ver minha revisão" : "Fazer uma revisão"} →
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
          <p>Uma pausa também pode fazer parte do caminho.</p>
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
    completed: "Passo concluído",
    reopened: "Passo reaberto",
    rescheduled: "Data ajustada",
    adapted: "Ação adaptada",
  };
  return (
    <>
      <PageTitle eyebrow="CADA AVANÇO TEM UMA HISTÓRIA" title="Meu percurso">
        Registros das ações que você concluiu, adaptou ou reagendou.
      </PageTitle>
      <div className="surface">
        {!store.data.events.length ? (
          <p>Seus registros aparecem aqui conforme você usa o plano.</p>
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
