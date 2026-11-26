import type { Paper } from "./model";

export const fonts = {
  sans: { label: "DM Sans", family: '"DM Sans Variable", sans-serif' },
  display: {
    label: "Playfair Display",
    family: '"Playfair Display Variable", Georgia, serif',
  },
  handwritten: { label: "Caveat", family: '"Caveat Variable", cursive' },
  serif: { label: "Fraunces", family: '"Fraunces Variable", Georgia, serif' },
  mono: {
    label: "JetBrains Mono",
    family: '"JetBrains Mono Variable", monospace',
  },
};

export const shapes = {
  line: { label: "Linha reta", path: "M5 50H95", filled: false },
  sketch: {
    label: "Linha à mão",
    path: "M4 59Q19 25 33 55T58 51T78 51Q88 65 96 40",
    filled: false,
  },
  star: {
    label: "Estrela",
    path: "M50 5 63 35 95 39 72 62 78 95 50 79 22 95 28 62 5 39 37 35Z",
    filled: true,
  },
  circle: { label: "Círculo", path: "M50 5a45 45 0 1 0 .01 0Z", filled: true },
  square: { label: "Quadrado", path: "M5 5H95V95H5Z", filled: true },
  triangle: { label: "Triângulo", path: "M50 5 95 95H5Z", filled: true },
  diamond: { label: "Losango", path: "M50 5 95 50 50 95 5 50Z", filled: true },
  hexagon: {
    label: "Hexágono",
    path: "M25 7H75L99 50 75 93H25L1 50Z",
    filled: true,
  },
  heart: {
    label: "Coração",
    path: "M50 91C42 85 5 59 5 32 5 9 33 3 50 25 67 3 95 9 95 32 95 59 58 85 50 91Z",
    filled: true,
  },
  arrow: { label: "Seta", path: "M6 50H92M64 22 92 50 64 78", filled: false },
};

export const textures = {
  plain: "Liso",
  dots: "Pontilhado",
  grid: "Quadriculado",
  ruled: "Pautado",
  gingham: "Xadrez",
};

export const paperPresets = [
  { label: "Caderno", background: "#fcf8ee", texture: "dots" },
  { label: "Papel kraft", background: "#e8d0a8", texture: "plain" },
  { label: "Papel de carta", background: "#f8e4eb", texture: "ruled" },
  { label: "Piquenique", background: "#fbefd7", texture: "gingham" },
  { label: "Papel milimetrado", background: "#e6efe5", texture: "grid" },
] as const;

const INK = "#493741";
export function drawPaper(
  ctx: CanvasRenderingContext2D,
  paper: Paper,
  width: number,
  height: number,
  spacing = 25,
) {
  ctx.fillStyle = paper.background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = INK + "26";
  if (paper.texture === "dots") {
    for (let y = spacing / 2; y < height; y += spacing)
      for (let x = spacing / 2; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, 2 * Math.PI);
        ctx.fill();
      }
  }
  if (
    paper.texture === "grid" ||
    paper.texture === "ruled" ||
    paper.texture === "gingham"
  ) {
    const step = paper.texture === "gingham" ? spacing * 2 : spacing;
    const thickness = paper.texture === "gingham" ? spacing : 1;
    for (let y = 0; y < height; y += step) ctx.fillRect(0, y, width, thickness);
    if (paper.texture !== "ruled")
      for (let x = 0; x < width; x += step)
        ctx.fillRect(x, 0, thickness, height);
  }
}
