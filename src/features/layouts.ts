import type { Workspace } from "../data/model";
export const layouts: {
  id: Workspace["profile"]["template"];
  name: string;
  description: string;
}[] = [
  {
    id: "scrapbook",
    name: "Recortes",
    description: "Cores suaves, fitas e um toque divertido.",
  },
  {
    id: "clean",
    name: "Essencial",
    description: "Uma grade simples para suas imagens brilharem.",
  },
  {
    id: "polaroid",
    name: "Instantes",
    description: "Fotos com bordas brancas e espaço para legendas.",
  },
  {
    id: "mosaic",
    name: "Mosaico",
    description: "Imagens grandes e pequenas, lado a lado.",
  },
  {
    id: "editorial",
    name: "Horizonte",
    description: "Uma imagem em destaque abre seu mural.",
  },
  {
    id: "free",
    name: "Livre",
    description: "Sobreponha fotos, frases e figurinhas onde quiser.",
  },
];
