import type { PhotoFrame } from "./model";

const frameColors = {
  polaroid: "#fffdf8",
  album: "#fff",
  kraft: "#c7a476",
  film: "#302c32",
};

export function photoFrameColor(frame?: PhotoFrame) {
  return frame && frame !== "plain" ? frameColors[frame] : undefined;
}
