import type { Workspace } from "../data/model";
export const layouts: {
  id: Workspace["profile"]["template"];
  name: string;
  description: string;
}[] = [
  {
    id: "scrapbook",
    name: "Recortes",
    description: "Cartões com fita",
  },
  {
    id: "clean",
    name: "Essencial",
    description: "Fotos em fila",
  },
  {
    id: "polaroid",
    name: "Instantes",
    description: "Fotos com borda",
  },
  {
    id: "mosaic",
    name: "Mosaico",
    description: "Fotos de vários tamanhos",
  },
  {
    id: "editorial",
    name: "Horizonte",
    description: "Uma foto grande no alto",
  },
  {
    id: "free",
    name: "Livre",
    description: "Tudo onde você quiser",
  },
];
