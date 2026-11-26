import type { ScreenProps } from "../components/ui";
import type { Workspace } from "./model";

export function pageStore(
  store: ScreenProps["store"],
  pageId: string | null,
): ScreenProps["store"] {
  if (!pageId) return store;

  function view(data: Workspace) {
    const page = data.pages.find((entry) => entry.id === pageId);
    if (!page) throw new Error("Página indisponível.");
    return {
      ...data,
      profile: { ...data.profile, template: page.template },
      cards: page.cards,
      free_items: page.free_items,
      paper: page.paper,
    };
  }

  return {
    ...store,
    data: view(store.data),
    mutate: (recipe, options) =>
      store.mutate((data) => {
        const page = data.pages.find((entry) => entry.id === pageId);
        if (!page) throw new Error("Página indisponível.");
        const draft = view(data);
        recipe(draft);
        page.cards = draft.cards;
        page.free_items = draft.free_items;
        page.paper = draft.paper;
        page.template = draft.profile.template;
        data.gallery = draft.gallery;
        // Gallery files belong to the entire book, including its first page.
        if (options?.removeAssets?.length) {
          const removed = new Set(options.removeAssets);
          data.cards = data.cards.filter(
            (card) => !card.asset_id || !removed.has(card.asset_id),
          );
          data.free_items = data.free_items.filter(
            (item) => item.kind !== "photo" || !removed.has(item.asset_id),
          );
        }
      }, options),
  };
}
