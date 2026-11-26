import { formatDate } from "../data/dates";
import { useAction } from "../data/useAction";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, CalendarDays } from "lucide-react";
import {
  changeTask,
  localDate,
  now,
  rowBase,
  type Goal,
  type Task,
} from "../data/model";
import {
  Empty,
  Feedback,
  Modal,
  PageTitle,
  Submit,
  type ScreenProps,
} from "../components/ui";
export function TaskEditor({
  store,
  task,
  onClose,
  defaultGoal,
}: ScreenProps & { task?: Task; defaultGoal?: string; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title || "");
  const [goalId, setGoalId] = useState(
    task?.goal_id || defaultGoal || store.data.goals[0]?.id || "",
  );
  const [date, setDate] = useState(task?.scheduled_on || "");
  const action = useAction();
  return (
    <Modal title={task ? "Editar passo" : "Novo passo"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action
            .run(() =>
              store.mutate((data) => {
                if (task) {
                  changeTask(
                    data,
                    task.id,
                    { title: title.trim(), scheduled_on: date || null },
                    date ? `Data: ${date}` : "Sem data fixa",
                  );
                  const found = data.tasks.find((row) => row.id === task.id)!;
                  found.goal_id = goalId;
                } else
                  data.tasks.push({
                    ...rowBase(),
                    goal_id: goalId,
                    title: title.trim(),
                    scheduled_on: date || null,
                    status: "pending",
                    completed_at: null,
                  });
              }),
            )
            .then((ok) => {
              if (ok) onClose();
            });
        }}
      >
        <label>
          O que você vai fazer?
          <input
            autoFocus
            required
            maxLength={500}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Para qual meta?
          <select
            required
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
          >
            {store.data.goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quando? <span className="muted">(opcional)</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <Feedback action={action} />
        <div className="actions">
          <button className="secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <Submit pending={action.pending}>Salvar passo</Submit>
        </div>
      </form>
    </Modal>
  );
}
function GoalEditor({
  store,
  goal,
  onClose,
}: ScreenProps & { goal?: Goal; onClose: () => void }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [date, setDate] = useState(goal?.target_date || "");
  const [obstacle, setObstacle] = useState(goal?.obstacle || "");
  const [alternative, setAlternative] = useState(goal?.alternative || "");
  const action = useAction();
  return (
    <Modal title={goal ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action
            .run(() =>
              store.mutate((data) => {
                if (goal)
                  Object.assign(
                    data.goals.find((row) => row.id === goal.id)!,
                    {
                      title: title.trim(),
                      target_date: date || null,
                      obstacle,
                      alternative,
                      updated_at: now(),
                    },
                  );
                else
                  data.goals.push({
                    ...rowBase(),
                    dream_id: data.dream.id,
                    title: title.trim(),
                    target_date: date || null,
                    obstacle,
                    alternative,
                  });
              }),
            )
            .then((ok) => {
              if (ok) onClose();
            });
        }}
      >
        <label>
          O que você quer conseguir?
          <input
            autoFocus
            required
            maxLength={500}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Até quando? <span className="muted">(opcional)</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label>
          O que pode dificultar?
          <textarea
            maxLength={4000}
            rows={2}
            value={obstacle}
            onChange={(event) => setObstacle(event.target.value)}
          />
        </label>
        <label>
          O que pode ajudar se isso acontecer?
          <textarea
            rows={2}
            maxLength={4000}
            value={alternative}
            onChange={(event) => setAlternative(event.target.value)}
          />
        </label>
        <Feedback action={action} />
        <Submit pending={action.pending}>Salvar meta</Submit>
      </form>
    </Modal>
  );
}
export function TaskRow({
  store,
  task,
  onEdit,
}: ScreenProps & { task: Task; onEdit: (task: Task) => void }) {
  const action = useAction();
  async function remove() {
    if (!confirm("Apagar este passo e as mudanças dele?")) return;
    await action.run(() =>
      store.mutate((data) => {
        data.tasks = data.tasks.filter((row) => row.id !== task.id);
        data.events = data.events.filter((row) => row.task_id !== task.id);
      }),
    );
  }
  return (
    <div className={`task-row ${task.status === "done" ? "is-done" : ""}`}>
      <button
        className="task-check"
        disabled={action.pending}
        aria-label={
          task.status === "done"
            ? `Reabrir: ${task.title}`
            : `Concluir: ${task.title}`
        }
        aria-pressed={task.status === "done"}
        onClick={() =>
          void action.run(() =>
            store.mutate((data) =>
              changeTask(data, task.id, {
                status: task.status === "done" ? "pending" : "done",
              }),
            ),
          )
        }
      >
        {task.status === "done" && <Check size={17} />}
      </button>
      <div className="task-body">
        <strong>{task.title}</strong>
        <span
          className={
            task.scheduled_on &&
            task.scheduled_on < localDate() &&
            task.status !== "done"
              ? "date-past"
              : ""
          }
        >
          <CalendarDays size={13} />
          {formatDate(task.scheduled_on)}
          {task.scheduled_on &&
          task.scheduled_on < localDate() &&
          task.status !== "done"
            ? " · pode replanejar"
            : ""}
        </span>
        <Feedback action={action} />
      </div>
      <div className="row-tools">
        <button
          className="icon-button"
          aria-label={`Editar: ${task.title}`}
          onClick={() => onEdit(task)}
        >
          <Pencil size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Excluir: ${task.title}`}
          disabled={action.pending}
          onClick={() => void remove()}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
export function Plan({ store }: ScreenProps) {
  const [goalEditor, setGoalEditor] = useState<Goal | "new" | null>(null);
  const [taskEditor, setTaskEditor] = useState<Task | "new" | null>(null);
  const [defaultGoal, setDefaultGoal] = useState("");
  const [editingDream, setEditingDream] = useState(false);
  const [dream, setDream] = useState(store.data.dream.description);
  const action = useAction();
  async function removeGoal(goal: Goal) {
    if (
      !confirm(
        "Apagar esta meta e todos os passos dela? As fotos vão ficar no mural.",
      )
    )
      return;
    await action.run(() =>
      store.mutate((data) => {
        const ids = new Set(
          data.tasks
            .filter((task) => task.goal_id === goal.id)
            .map((task) => task.id),
        );
        data.goals = data.goals.filter((row) => row.id !== goal.id);
        data.tasks = data.tasks.filter((task) => !ids.has(task.id));
        data.events = data.events.filter((event) => !ids.has(event.task_id));
        [data.cards, ...data.pages.map((page) => page.cards)]
          .flat()
          .forEach((card) => {
            if (card.goal_id === goal.id) {
              card.goal_id = null;
              card.updated_at = now();
            }
          });
      }),
    );
  }
  return (
    <>
      <PageTitle eyebrow="MEU PLANO" title="Metas e passos">
        Uma meta é algo que você quer conseguir. Um passo é o que você faz para
        chegar lá.
      </PageTitle>
      <section className="dream-banner">
        <span className="eyebrow">MEU SONHO PRINCIPAL</span>
        <h2>{store.data.dream.description || "Qual é o seu sonho?"}</h2>
        <div className="inline-actions">
          <button
            className="text-button"
            onClick={() => {
              setDream(store.data.dream.description);
              setEditingDream(true);
            }}
          >
            <Pencil size={15} /> Editar meu sonho
          </button>
          <a href="#/jornada">Ver perguntas sobre meu sonho →</a>
        </div>
      </section>
      <div className="section-heading">
        <h2>Minhas metas</h2>
        <button
          onClick={() => setGoalEditor("new")}
          disabled={store.data.goals.length >= 100}
        >
          <Plus size={17} /> Nova meta
        </button>
      </div>
      <Feedback action={action} />
      {!store.data.goals.length && (
        <Empty title="Crie uma meta">
          <p>
            Exemplo: se seu sonho é tocar violão, uma meta pode ser aprender uma
            música.
          </p>
          <button onClick={() => setGoalEditor("new")}>
            Criar primeira meta
          </button>
        </Empty>
      )}
      <div className="goal-list">
        {store.data.goals.map((goal) => {
          const tasks = store.data.tasks.filter(
            (task) => task.goal_id === goal.id,
          );
          const done = tasks.filter((task) => task.status === "done").length;
          return (
            <section className="goal-card" key={goal.id}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{formatDate(goal.target_date)}</p>
                  <h2>{goal.title}</h2>
                </div>
                <div className="row-tools">
                  <button
                    className="icon-button"
                    aria-label={`Editar meta: ${goal.title}`}
                    onClick={() => setGoalEditor(goal)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Excluir meta: ${goal.title}`}
                    onClick={() => void removeGoal(goal)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <p className="small muted">
                {done} de {tasks.length} passos feitos
              </p>
              {goal.obstacle && (
                <p className="obstacle">
                  <strong>O que pode atrapalhar:</strong> {goal.obstacle}
                  <br />
                  <strong>O que posso fazer:</strong>{" "}
                  {goal.alternative || "Ainda não escrevi uma ideia."}
                </p>
              )}
              <div>
                {tasks.map((task) => (
                  <TaskRow
                    store={store}
                    task={task}
                    key={task.id}
                    onEdit={setTaskEditor}
                  />
                ))}
              </div>
              <button
                className="text-button"
                disabled={store.data.tasks.length >= 2000}
                onClick={() => {
                  setDefaultGoal(goal.id);
                  setTaskEditor("new");
                }}
              >
                <Plus size={16} /> Adicionar passo
              </button>
            </section>
          );
        })}
      </div>
      {goalEditor && (
        <GoalEditor
          store={store}
          goal={goalEditor === "new" ? undefined : goalEditor}
          onClose={() => setGoalEditor(null)}
        />
      )}{" "}
      {taskEditor && (
        <TaskEditor
          store={store}
          task={taskEditor === "new" ? undefined : taskEditor}
          defaultGoal={defaultGoal}
          onClose={() => setTaskEditor(null)}
        />
      )}{" "}
      {editingDream && (
        <Modal
          title="Meu sonho principal"
          onClose={() => setEditingDream(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action
                .run(() =>
                  store.mutate((data) => {
                    data.dream.description = dream.trim();
                    data.dream.updated_at = now();
                  }),
                )
                .then((ok) => {
                  if (ok) setEditingDream(false);
                });
            }}
          >
            <label>
              O que você quer fazer um dia?
              <textarea
                autoFocus
                required
                maxLength={4000}
                rows={5}
                value={dream}
                onChange={(event) => setDream(event.target.value)}
              />
            </label>
            <Feedback action={action} />
            <Submit pending={action.pending}>Salvar sonho</Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
