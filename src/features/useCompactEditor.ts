import { useSyncExternalStore } from "react";

const query = "(max-width: 1024px), (pointer: coarse) and (max-width: 1366px)";
function subscribe(listener: () => void) {
  const media = matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
export function useCompactEditor() {
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches);
}
