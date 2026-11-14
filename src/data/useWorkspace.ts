import { useEffect, useRef, useState } from "react";
import { localRepository, type Repository } from "./repository";
import type { Asset, Workspace } from "./model";

export function useWorkspace(repository: Repository = localRepository) {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useRef<Workspace | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let live = true;
    repository
      .load()
      .then((value) => {
        if (live) {
          current.current = value;
          setData(value);
        }
      })
      .catch(() => {
        if (live)
          setError(
            "Não foi possível abrir o armazenamento. Verifique se o navegador permite salvar dados e tente recarregar. Seus dados não foram apagados.",
          );
      });
    return () => {
      live = false;
    };
  }, [repository]);
  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const next = queue.current
      .catch(() => {})
      .then(async () => {
        setBusy(true);
        try {
          const result = await work();
          setError("");
          return result;
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível salvar. Tente novamente.",
          );
          throw cause;
        } finally {
          setBusy(false);
        }
      });
    queue.current = next;
    return next;
  }
  async function mutate(
    recipe: (draft: Workspace) => void,
    options?: { assets?: Asset[]; removeAssets?: string[] },
  ) {
    return enqueue(async () => {
      if (!current.current) throw new Error("Aguarde o carregamento.");
      const next = structuredClone(current.current);
      recipe(next);
      await repository.save(next, options);
      current.current = next;
      setData(next);
    });
  }
  async function replace(next: Workspace, assets: Asset[]) {
    return enqueue(async () => {
      await repository.replace(next, assets);
      current.current = next;
      setData(next);
    });
  }
  async function clear() {
    return enqueue(async () => {
      const next = await repository.clear();
      current.current = next;
      setData(next);
    });
  }
  return { data, error, busy, mutate, replace, clear, repository };
}
export type Store = ReturnType<typeof useWorkspace>;
