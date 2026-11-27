type StickerDrawing = readonly [id: string, label: string, path: string];

const collections: {
  name: string;
  paper: string;
  ink: string;
  drawings: StickerDrawing[];
}[] = [
  {
    name: "Sonhos",
    paper: "#f4dba2",
    ink: "#755023",
    drawings: [
      ["star", "Estrela", "M16 3l4 8 9 1-6 6 1 10-8-5-8 5 1-10-6-6 9-1z"],
      [
        "moon",
        "Lua",
        "M23 22A11 11 0 0 1 11 5a11 11 0 1 0 12 17z M24 4v8m-4-4h8",
      ],
      [
        "sun",
        "Sol",
        "M16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M16 3v3m0 20v3M3 16h3m20 0h3M7 7l3 3m12 12 3 3M7 25l3-3M22 10l3-3",
      ],
      [
        "rainbow",
        "Arco-íris",
        "M3 24a13 13 0 0 1 26 0M7 24a9 9 0 0 1 18 0M11 24a5 5 0 0 1 10 0M3 24h8m10 0h8",
      ],
      [
        "cloud",
        "Nuvem",
        "M9 24h15a5 5 0 0 0 0-10 8 8 0 0 0-15-3 7 7 0 0 0 0 13z",
      ],
      [
        "comet",
        "Cometa",
        "M21 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M5 26l10-10m-3 11 6-6M5 19l5-5",
      ],
      [
        "sparkles",
        "Brilhos",
        "M12 5l2 8 8 3-8 2-2 8-2-8-8-2 8-3z M25 4v8m-4-4h8m-4 12v8m-4-4h8",
      ],
      [
        "balloon",
        "Balão",
        "M16 22c-5-3-9-7-9-12a9 9 0 0 1 18 0c0 5-4 9-9 12z M16 22l-2 3h4l-2-3m0 3c4 2-3 4-1 6",
      ],
      [
        "lantern",
        "Lanterna",
        "M12 5h8l2 4 3 4-3 11H10L7 13l3-4 2-4zM10 9h12M7 13h18m-9 0v11m-5 3h10",
      ],
      [
        "planet",
        "Planeta",
        "M16 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9 10C-5 19 4 25 18 19S34 7 24 8",
      ],
    ],
  },
  {
    name: "Viagens",
    paper: "#cde5eb",
    ink: "#305763",
    drawings: [
      ["mountain", "Montanhas", "M2 26L12 7l6 11 4-8 8 16z M8 14l4 3 4-3"],
      ["plane", "Avião", "M3 19l26-15-6 24-6-8-7 6 1-9z M11 17L29 4"],
      ["suitcase", "Mala", "M6 10h20v17H6z M12 10V6h8v4m-9 1v15m10-15v15"],
      [
        "compass",
        "Bússola",
        "M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24z M22 10l-3 9-9 3 3-9z",
      ],
      [
        "map",
        "Mapa dobrado",
        "M3 8l8-4 10 4 8-4v20l-8 4-10-4-8 4z M11 4v20M21 8v20",
      ],
      [
        "camera",
        "Câmera",
        "M3 10h7l2-4h8l2 4h7v16H3z M16 13a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
      ],
      [
        "tent",
        "Barraca",
        "M3 26L16 5l13 21z M16 14l6 12H10z M16 5l-2-3m2 3 2-3",
      ],
      ["sailboat", "Veleiro", "M4 24h24l-5 5H9z M15 4v17H5z M19 10l7 11h-7z"],
      [
        "lighthouse",
        "Farol",
        "M9 28h14l-3-18h-8z M11 10V7l5-4 5 4v3M10 19h12M5 7l-3-2m3 5-3 2m25-5 3-2m-3 5 3 2",
      ],
      [
        "palm",
        "Praia",
        "M12 28c4-6 5-12 5-17m-1 0C11 3 5 5 3 10c5-2 9-1 13 1zm1 0c5-8 10-4 12 0-4-1-8-1-12 0zm0 0c0-7 2-8 5-8m-5 8c6 1 9 4 9 8-3-3-6-5-9-8z M4 28h24",
      ],
    ],
  },
  {
    name: "Natureza",
    paper: "#dce9c4",
    ink: "#435b3b",
    drawings: [
      [
        "leaf",
        "Folha",
        "M7 23C2 7 15 5 28 4c-1 16-6 24-21 19z M4 28l16-16m-7 7v-6m0 6h6",
      ],
      [
        "flower",
        "Flor",
        "M16 12c-7-12 8-12 2 0 12-7 13 8 1 6 9 9-5 15-5 2-9 10-17-3-4-5-10-6 1-15 6-3z",
      ],
      [
        "sprout",
        "Brotinho",
        "M16 27V14C6 15 4 9 4 5c9 0 12 4 12 9 0-8 6-10 12-10 0 7-4 11-12 11m-8 12h16",
      ],
      [
        "cactus",
        "Cacto",
        "M11 28v-9C4 19 3 14 3 9h5c0 4 1 5 3 5V7a4 4 0 0 1 8 0v10c4 0 5-3 5-7h5c0 8-3 12-10 12v6z",
      ],
      [
        "mushroom",
        "Cogumelo",
        "M3 17a13 13 0 0 1 26 0z M13 17l-2 11h10l-2-11M9 13h1m7-4h1m4 4h1",
      ],
      ["pine", "Pinheiro", "M16 3l7 9h-4l7 8h-5l7 6H4l7-6H6l7-8H9z M16 26v4"],
      [
        "butterfly",
        "Borboleta",
        "M16 15C3 0 0 13 9 18c-9 4 3 16 7 3 4 13 16 1 7-3 9-5 6-18-7-3zm0 0V9m0 0-4-4m4 4 4-4",
      ],
      [
        "bee",
        "Abelhinha",
        "M6 19c0-8 20-8 20 0s-20 8-20 0z M12 14v10m6-10v10m8-5h3M12 14C0 9 13 2 16 12m2 1c1-12 13-5 5 2",
      ],
      [
        "wave",
        "Onda",
        "M2 22c7 0 7-14 17-14 6 0 9 3 11 7-6-4-10-2-10 2 0 4 6 5 10 5M2 27c4 0 4-2 7-2s4 2 7 2 4-2 7-2 4 2 7 2",
      ],
      [
        "fern",
        "Samambaia",
        "M6 29C20 21 23 12 26 3M13 24C6 24 5 16 5 16c6 2 8 5 8 8zm0 0c6-4 11-2 13-2-4 4-9 4-13 2zm6-8c-6 0-8-4-9-8 6 2 9 4 9 8zm0 0c4-5 8-4 11-4-3 4-7 5-11 4z",
      ],
    ],
  },
  {
    name: "Vida e conquistas",
    paper: "#f3d4db",
    ink: "#773e53",
    drawings: [
      [
        "heart",
        "Coração",
        "M16 27C13 24 3 18 3 11 3 4 12 3 16 9c4-6 13-5 13 2 0 7-10 13-13 16z",
      ],
      ["home", "Meu lar", "M3 16L16 5l13 11M7 14v13h18V14m-12 13v-8h6v8"],
      [
        "coffee",
        "Café",
        "M5 11h18v7a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8zm18 2h3a4 4 0 0 1 0 8h-4M3 29h25M11 7c-3-3 3-3 0-6m6 6c-3-3 3-3 0-6",
      ],
      [
        "book",
        "Livro aberto",
        "M16 9C12 5 8 5 3 6v19c5-1 9-1 13 3 4-4 8-4 13-3V6c-5-1-9-1-13 3zm0 0v19M7 12l5 1m-5 4 5 1m8-5 5-1m-5 6 5-1",
      ],
      [
        "music",
        "Música",
        "M13 23V8l14-4v16M13 12l14-4M13 23c0 5-9 7-9 3s9-7 9-3zm14-3c0 5-9 7-9 3s9-7 9-3z",
      ],
      [
        "trophy",
        "Troféu",
        "M8 4h16v9a8 8 0 0 1-16 0z M8 7H3v4a6 6 0 0 0 5 6m16-10h5v4a6 6 0 0 1-5 6M16 21v6m-6 2h12",
      ],
      [
        "medal",
        "Medalha",
        "M8 3h6l3 10m7-10h-6l-3 10m-7-10 5 12m11-12-5 12M16 14a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4v8m-3-5 3-3",
      ],
      [
        "gift",
        "Presente",
        "M5 14h22v14H5z M3 9h26v5H3zm13 0v19m0-19C8 10 7 3 10 3c4 0 6 6 6 6zm0 0c8 1 9-6 6-6-4 0-6 6-6 6z",
      ],
      [
        "key",
        "Chave",
        "M10 4a7 7 0 1 0 5 12l11 11 3-3-2-2-2 2-2-2 2-2-8-8a7 7 0 0 0-7-8z M9 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
      ],
      ["flag", "Meta alcançada", "M7 29V4m0 2c7-7 12 5 20-1v14c-8 6-13-6-20 1"],
    ],
  },
  {
    name: "Recortes e fitas",
    paper: "#e6d9f2",
    ink: "#584376",
    drawings: [
      [
        "washi",
        "Fita washi",
        "M3 10l3 3-3 3 3 3-3 3h26l-3-3 3-3-3-3 3-3z M9 20l5-8m1 8 5-8m1 8 5-8",
      ],
      [
        "paperclip",
        "Clipe de papel",
        "M12 21l10-10a3 3 0 0 0-4-4L7 18a6 6 0 0 0 8 8L28 13m-12 6 9-9a6 6 0 0 0-8-8L6 13",
      ],
      [
        "pin",
        "Alfinete",
        "M14 6l12 12-5 1-4 4-8-8 4-4z M12 20l-7 7M14 6l3-3 12 12-3 3",
      ],
      [
        "frame",
        "Foto instantânea",
        "M6 3h20v26H6z M9 6h14v14H9z M9 18l5-5 3 3 2-2 4 4m-11 7h8",
      ],
      [
        "scissors",
        "Tesoura",
        "M7 18a4 4 0 1 0 6 6l15-20M7 18a4 4 0 0 1 6 6M7 14a4 4 0 1 1 6-6l15 20",
      ],
      [
        "stamp",
        "Selo postal",
        "M5 5h4l2-2 2 2h6l2-2 2 2h4v4l2 2-2 2v6l2 2-2 2v4h-4l-2 2-2-2h-6l-2 2-2-2H5v-4l-2-2 2-2v-6l-2-2 2-2z M10 21l5-8 3 5 2-3 3 6z",
      ],
      [
        "envelope",
        "Envelope",
        "M3 7h26v19H3z M4 8l12 10L28 8M4 25l9-9m6 0 9 9",
      ],
      [
        "bow",
        "Lacinho",
        "M13 13C5 5 2 7 3 15s5 8 10 3m6-5c8-8 11-6 10 2s-5 8-10 3m-6-6h6v7h-6zm1 7-5 10-3-4 4-5m8-1 5 10 3-4-4-5",
      ],
      ["arrow", "Seta desenhada", "M3 24C8 12 18 8 28 10m-8-7 8 7-7 6"],
      [
        "underline",
        "Rabisco",
        "M3 16c9-4 18-5 26-4M6 22c6-3 15-5 23-4M13 27c5-2 10-3 15-3",
      ],
    ],
  },
  {
    name: "Mesa de scrapbook",
    paper: "#f2dbcb",
    ink: "#784b52",
    drawings: [
      [
        "ticket",
        "Bilhete de cinema",
        "M2 8h28v4a4 4 0 0 0 0 8v4H2v-4a4 4 0 0 0 0-8z M22 10v2m0 3v2m0 3v2m-12-4 3-5 3 5z",
      ],
      [
        "tag",
        "Etiqueta kraft",
        "M3 13l9-9h16v16l-9 9z M19 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0z M12 13l8 8m-12-4 8 8",
      ],
      [
        "badge",
        "Selo de coração",
        "M16 2l4 3 5 0 1 5 4 3-2 5 1 5-5 1-3 5-5-2-5 2-3-5-5-1 1-5-2-5 4-3 1-5 5 0z M16 22l-6-6c-3-4 3-7 6-3 3-4 9-1 6 3z",
      ],
      [
        "letter",
        "Cartinha dobrada",
        "M7 3h13l6 6v20H7z M20 3v6h6M10 14h13m-13 4h10m-10 4h7",
      ],
      [
        "notebook",
        "Folha arrancada",
        "M6 3h23v26H6l2-4-2-4 2-4-2-4 2-4z M12 8h4m-4 5h13m-13 5h13m-13 5h8",
      ],
      [
        "tape-flower",
        "Fita de flores",
        "M2 8l3 4-3 4 3 4-3 4h28l-3-4 3-4-3-4 3-4z M12 16c-6-3 0-8 0-2 4-5 8 1 2 2 6 3 0 7-2 2-2 6-7 0 0-2z M22 12v8m-4-4h8",
      ],
      [
        "calendar",
        "Calendário de mesa",
        "M4 7h24v22H4z M4 13h24M10 3v7m12-7v7M9 18h1m5 0h1m5 0h1m-12 5h1m5 0h1m5 0h1",
      ],
      [
        "wax",
        "Lacre de carta",
        "M5 13l2-6 6-2 6-2 5 5 3 5 2 7-6 4-5 4-8-2-5-4-2-5z M19 10a7 7 0 1 0 4 10m-10-3 2 2 6-6",
      ],
      [
        "ribbon",
        "Faixa de papel",
        "M6 9h20v13H6z M6 13H2l2 5-2 5h6v-1m16 0v1h6l-2-5 2-5h-4M10 15h12m-12 3h8",
      ],
      [
        "daisies",
        "Flores prensadas",
        "M16 30c1-10-2-17-7-20m7 20c-1-9 4-12 9-16M9 12c-9 0-8-7-3-5-2-6 6-6 5-1 5-3 8 4 2 4 4 4-2 7-4 2z M23 15c-6-1-5-5-1-5-2-5 4-7 5-2 4-2 6 2 2 5 3 4-3 7-6 2z",
      ],
    ],
  },
];

function sticker(
  { paper, ink }: { paper: string; ink: string },
  path: string,
  index: number,
) {
  const backing = [
    '<path d="M12 13Q20 5 39 6L65 9Q83 8 87 24L90 56Q94 73 75 83L40 90Q12 91 8 69L6 35Q4 21 12 13Z"/>',
    '<path d="M9 17L78 7Q85 6 86 13L92 73Q93 79 86 81L20 92Q13 93 12 86L4 26Q3 19 9 17Z"/>',
    '<path d="M7 44C6 19 23 7 46 7c24-2 43 10 44 32 4 28-10 46-38 49C22 92 5 74 7 44Z"/>',
  ][index % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="${paper}" stroke="#fffdf8" stroke-width="5" stroke-linejoin="round">${backing}</g><g fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round"><path d="M14 60l2 7m64-44 3 8" opacity=".35" stroke-width="1.4"/><path d="${path}" transform="translate(18 18) scale(1.875)" stroke-width="1.65"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const stickerCollections = collections.map((collection) => ({
  name: collection.name,
  stickers: collection.drawings.map(([id, label, path], index) => ({
    id,
    label,
    src: sticker(collection, path, index),
  })),
}));

const stickers = new Map(
  stickerCollections.flatMap(({ stickers }) =>
    stickers.map((item) => [item.id, item] as const),
  ),
);
export const getSticker = (id: string) => stickers.get(id);
