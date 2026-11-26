import { formatDate } from "../data/dates";
import { useAction } from "../data/useAction";
import { useState } from "react";
import { monday, now, rowBase, type Review as ReviewRow } from "../data/model";
import {
  Feedback,
  PageTitle,
  Submit,
  type ScreenProps,
} from "../components/ui";
export function Review({ store }: ScreenProps) {
  const current = store.data.reviews.find((row) => row.week_of === monday());
  const [editingId, setEditingId] = useState(current?.id || "");
  const [wins, setWins] = useState(current?.wins || "");
  const [challenges, setChallenges] = useState(current?.challenges || "");
  const [next, setNext] = useState(current?.next_step || "");
  const action = useAction();
  function edit(row: ReviewRow) {
    setEditingId(row.id);
    setWins(row.wins);
    setChallenges(row.challenges);
    setNext(row.next_step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const selected = store.data.reviews.find((row) => row.id === editingId);
  return (
    <>
      <PageTitle eyebrow="COMO FOI?" title="Minha semana">
        Anote o que aconteceu e o que você quer tentar na próxima semana.
      </PageTitle>
      <div className="review-layout">
        <section className="surface">
          <p className="eyebrow">
            SEMANA DE {formatDate(selected?.week_of || monday())}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action.run(
                () =>
                  store.mutate((data) => {
                    const existing =
                      data.reviews.find((row) => row.id === editingId) ||
                      data.reviews.find((row) => row.week_of === monday());
                    if (existing)
                      Object.assign(existing, {
                        wins: wins.trim(),
                        challenges: challenges.trim(),
                        next_step: next.trim(),
                        updated_at: now(),
                      });
                    else
                      data.reviews.unshift({
                        ...rowBase(),
                        dream_id: data.dream.id,
                        week_of: monday(),
                        wins: wins.trim(),
                        challenges: challenges.trim(),
                        next_step: next.trim(),
                      });
                  }),
                "Sua semana foi salva.",
              );
            }}
          >
            <label>
              O que deu certo?
              <textarea
                required
                rows={3}
                maxLength={4000}
                value={wins}
                onChange={(event) => setWins(event.target.value)}
              />
            </label>
            <label>
              O que foi difícil?
              <textarea
                rows={3}
                maxLength={4000}
                value={challenges}
                onChange={(event) => setChallenges(event.target.value)}
              />
            </label>
            <label>
              O que você quer tentar agora?
              <textarea
                rows={3}
                maxLength={4000}
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </label>
            <p className="small muted">
              Se quiser mudar um passo, abra Metas e passos.
            </p>
            <Feedback action={action} />
            <div className="inline-actions">
              <Submit pending={action.pending}>Salvar minha semana</Submit>
              <a href="#/plano">Ver metas e passos →</a>
            </div>
          </form>
        </section>
        <aside className="surface review-history">
          <h2>Semanas passadas</h2>
          {!store.data.reviews.length && (
            <p className="muted">Suas anotações vão aparecer aqui.</p>
          )}
          {store.data.reviews.map((row) => (
            <button
              key={row.id}
              className={`review-link ${editingId === row.id ? "active" : ""}`}
              onClick={() => edit(row)}
            >
              <strong>Semana de {formatDate(row.week_of)}</strong>
              <span>{row.wins.slice(0, 90)}</span>
            </button>
          ))}
          {selected && selected.week_of !== monday() && (
            <button
              className="secondary"
              onClick={() => {
                const row = store.data.reviews.find(
                  (item) => item.week_of === monday(),
                );
                setEditingId(row?.id || "");
                setWins(row?.wins || "");
                setChallenges(row?.challenges || "");
                setNext(row?.next_step || "");
              }}
            >
              Voltar à semana atual
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
