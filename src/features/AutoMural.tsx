import { useState } from "react";
import { LocalImage } from "../components/LocalImage";
import { PhotoFrameField } from "../components/PhotoFrameField";
import { Feedback, Modal, type ScreenProps } from "../components/ui";
import { assemblePhotos } from "../data/autoMural";
import { importGalleryPhotos } from "../data/media";
import type { PhotoFrame } from "../data/model";
import { useAction } from "../data/useAction";

export function AutoMural({
  store,
  onClose,
  onComplete,
}: ScreenProps & {
  onClose: () => void;
  onComplete: (count: number) => void;
}) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [frame, setFrame] = useState<PhotoFrame>();
  const action = useAction();
  const photos = store.data.gallery;
  const free = store.data.profile.template === "free";
  const selected = photos.filter((photo) => chosen.includes(photo.id));
  const available = 40 - store.data.cards.length;
  const needed = free
    ? selected.length
    : selected.filter(
        (photo) => !store.data.cards.some((card) => card.asset_id === photo.id),
      ).length;

  return (
    <Modal title="Montar com fotos" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!needed) return;
          let count = 0;
          void action
            .run(async () => {
              const assets = await Promise.all(
                selected.map(async ({ id }) => {
                  const asset = await store.repository.asset(id);
                  if (!asset)
                    throw new Error(
                      "Uma das fotos selecionadas não está mais disponível.",
                    );
                  return asset;
                }),
              );
              await store.mutate((draft) => {
                count = assemblePhotos(draft, assets, frame);
              });
            })
            .then((ok) => {
              if (ok) onComplete(count);
            });
        }}
      >
        <p>
          Escolha as fotos. A gente coloca nos espaços livres e você pode mudar
          tudo depois.
        </p>
        <label>
          Carregar fotos para montar
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={action.pending || photos.length >= 40}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (!files.length) return;
              void action.run(async () => {
                const added = await importGalleryPhotos(files, store.mutate);
                setChosen((current) => [
                  ...new Set([...current, ...added.map((photo) => photo.id)]),
                ]);
              });
            }}
          />
        </label>
        {photos.length > 0 && (
          <>
            <div className="auto-mural-select">
              <span role="status">
                {selected.length}{" "}
                {selected.length === 1 ? "foto escolhida" : "fotos escolhidas"}
              </span>
              <button
                type="button"
                className="text-button"
                disabled={action.pending}
                onClick={() =>
                  setChosen(
                    selected.length === photos.length
                      ? []
                      : photos.map((photo) => photo.id),
                  )
                }
              >
                {selected.length === photos.length
                  ? "Limpar seleção"
                  : "Escolher todas"}
              </button>
            </div>
            <div className="auto-mural-photos">
              {photos.map((photo) => (
                <label key={photo.id} className="auto-mural-thumb">
                  <LocalImage
                    assetId={photo.id}
                    repository={store.repository}
                    alt=""
                  />
                  <input
                    type="checkbox"
                    checked={chosen.includes(photo.id)}
                    disabled={action.pending}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setChosen((current) =>
                        checked
                          ? [...current, photo.id]
                          : current.filter((id) => id !== photo.id),
                      );
                    }}
                  />
                  <span title={photo.label}>{photo.label}</span>
                </label>
              ))}
            </div>
            <PhotoFrameField
              value={frame}
              onChange={setFrame}
              fromLayout={!free}
            />
            {!free && selected.length > needed && (
              <p className="small muted">
                As fotos que já estão na folha ficam onde estão.
              </p>
            )}
            {!free && needed > available && (
              <p className="small muted">
                Há {available} espaços livres nesta página. Escolha menos fotos
                ou abra outra página.
              </p>
            )}
          </>
        )}
        <Feedback action={action} />
        <button
          type="submit"
          disabled={action.pending || !needed || (!free && needed > available)}
        >
          {action.pending ? "Preparando…" : "Montar página"}
        </button>
      </form>
    </Modal>
  );
}
