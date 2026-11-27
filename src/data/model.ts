import {
  brandPapers,
  DEFAULT_BRAND_PAPER,
  type BrandPaper,
} from "./brandAssets";
import { fonts, shapes, textures } from "./paper";
import { z } from "zod";

const id = z.uuid();
const text = z.string().max(4000);
const timestamp = z.iso.datetime();
const date = z.iso.date();
export const answerKeys = [
  "start",
  "wish",
  "scene",
  "feeling",
  "reason",
  "resources",
  "obstacle",
  "time",
  "goal",
  "action",
  "alternative",
] as const;
const answersSchema = z.object(
  Object.fromEntries(
    answerKeys.map((key) => [key, text.default("")]),
  ) as Record<(typeof answerKeys)[number], z.ZodDefault<z.ZodString>>,
);
const base = { id, created_at: timestamp, updated_at: timestamp };
const template = z.enum([
  "scrapbook",
  "clean",
  "polaroid",
  "mosaic",
  "editorial",
  "free",
]);
const font = z.enum(Object.keys(fonts) as (keyof typeof fonts)[]);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const photoFrame = z.enum(["plain", "polaroid"]);
export type PhotoFrame = z.infer<typeof photoFrame>;
const freeGeometry = {
  id,
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(750),
  width: z.number().min(32).max(1000),
  height: z.number().min(16).max(750).optional(),
  rotation: z.number().min(-180).max(180).default(0),
};
const freeItemSchema = z.discriminatedUnion("kind", [
  z.object({
    ...freeGeometry,
    kind: z.literal("photo"),
    asset_id: id,
    frame: photoFrame.optional(),
  }),
  z.object({
    ...freeGeometry,
    kind: z.literal("text"),
    body: z.string().max(1000),
    font: font.default("serif"),
    fontSize: z.number().min(10).max(120).default(30),
    color: color.default("#493741"),
    backgroundMode: z.enum(["transparent", "filled"]).default("filled"),
    backgroundColor: color.default("#f7e6b9"),
    bold: z.boolean().default(false),
    underline: z.boolean().default(false),
    list: z.enum(["none", "bullet", "numbered"]).default("none"),
    curve: z.number().min(-100).max(100).default(0),
  }),
  z.object({
    ...freeGeometry,
    kind: z.literal("sticker"),
    sticker: z.string().regex(/^[a-z-]{1,40}$/),
  }),
  z.object({
    ...freeGeometry,
    kind: z.literal("shape"),
    shape: z.enum(Object.keys(shapes) as (keyof typeof shapes)[]),
    color: color.default("#a16e82"),
  }),
]);
export type FreeItem = z.infer<typeof freeItemSchema>;
export const FREE_ITEM_LIMIT = 100;
const freeItems = z.array(freeItemSchema).max(FREE_ITEM_LIMIT);
const paper = z
  .object({
    title: z.string().max(4000).default(""),
    titleFont: font.default("display"),
    titleColor: color.default("#493741"),
    background: color.default("#fcf8ee"),
    patternId: id.nullable().default(null),
    brandPaper: z
      .enum(brandPapers.map(({ id }) => id) as BrandPaper[])
      .nullable()
      .default(null),
    texture: z
      .enum(Object.keys(textures) as (keyof typeof textures)[])
      .default("dots"),
  })
  .prefault({});
export type Paper = z.infer<typeof paper>;
const cards = z
  .array(
    z.object({
      ...base,
      dream_id: id,
      goal_id: id.nullable(),
      kind: z.enum(["image", "quote"]),
      asset_id: id.nullable(),
      body: text,
      caption: text,
      color: z.enum(["lavender", "peach", "sage", "butter"]),
      position: z.number().int().min(0).max(39),
      frame: photoFrame.optional(),
    }),
  )
  .max(40);

export const workspaceSchema = z
  .object({
    schema_version: z.literal(2),
    profile: z.object({
      id,
      age_confirmed: z.boolean(),
      journey_step: z.number().int().min(0).max(11),
      journey_completed: z.boolean(),
      template,
      tour_seen: z.boolean().default(false),
      editor_guide_seen: z.boolean().default(false),
      layout_chosen: z.boolean().default(false),
      active_page: id.nullable().default(null),
      intention: text,
    }),
    dream: z.object({ ...base, description: text, answers: answersSchema }),
    goals: z
      .array(
        z.object({
          ...base,
          dream_id: id,
          title: text.min(1),
          target_date: date.nullable(),
          obstacle: text,
          alternative: text,
        }),
      )
      .max(100),
    tasks: z
      .array(
        z.object({
          ...base,
          goal_id: id,
          title: text.min(1),
          scheduled_on: date.nullable(),
          status: z.enum(["pending", "done"]),
          completed_at: timestamp.nullable(),
        }),
      )
      .max(2000),
    gallery: z
      .array(z.object({ id, label: text, created_at: timestamp }))
      .max(40)
      .default([]),
    patterns: z
      .array(z.object({ id, label: text }))
      .max(40)
      .default([]),
    cards,
    free_items: freeItems.default([]),
    paper,
    pages: z
      .array(
        z.object({
          id,
          template,
          paper,
          cards,
          free_items: freeItems,
        }),
      )
      .default([]),
    events: z
      .array(
        z.object({
          id,
          task_id: id,
          kind: z.enum(["completed", "reopened", "rescheduled", "adapted"]),
          title: text,
          detail: text,
          created_at: timestamp,
        }),
      )
      .max(10000),
    reviews: z
      .array(
        z.object({
          ...base,
          dream_id: id,
          week_of: date,
          wins: text,
          challenges: text,
          next_step: text,
        }),
      )
      .max(1000),
  })
  .superRefine((data, ctx) => {
    const groups = [
      data.goals,
      data.tasks,
      data.cards,
      data.free_items,
      data.pages,
      data.patterns,
      ...data.pages.flatMap((page) => [page.cards, page.free_items]),
      data.events,
      data.reviews,
    ];
    for (const group of groups)
      if (new Set(group.map((row) => row.id)).size !== group.length)
        ctx.addIssue({
          code: "custom",
          message: "Identificadores duplicados.",
        });
    const boards = [data, ...data.pages];
    const patterns = new Set(data.patterns.map((pattern) => pattern.id));
    if (
      boards.some(
        ({ paper }) => paper.patternId && !patterns.has(paper.patternId),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Estampa da folha não encontrada.",
      });
    const allCards = boards.flatMap((board) => board.cards);
    const allFreeItems = boards.flatMap((board) => board.free_items);
    if (
      data.profile.active_page &&
      !data.pages.some((page) => page.id === data.profile.active_page)
    )
      ctx.addIssue({ code: "custom", message: "Página ativa inválida." });
    const goals = new Set(data.goals.map((goal) => goal.id));
    const tasks = new Set(data.tasks.map((task) => task.id));
    if (
      data.goals.some((goal) => goal.dream_id !== data.dream.id) ||
      allCards.some((card) => card.dream_id !== data.dream.id) ||
      data.reviews.some((review) => review.dream_id !== data.dream.id)
    )
      ctx.addIssue({
        code: "custom",
        message: "Sonho de referência inválido.",
      });
    if (
      data.tasks.some((task) => !goals.has(task.goal_id)) ||
      allCards.some((card) => card.goal_id && !goals.has(card.goal_id))
    )
      ctx.addIssue({ code: "custom", message: "Meta de referência inválida." });
    if (data.events.some((event) => !tasks.has(event.task_id)))
      ctx.addIssue({ code: "custom", message: "Ação de referência inválida." });
    if (
      data.tasks.some(
        (task) => (task.status === "done") !== (task.completed_at !== null),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Conclusão de ação inconsistente.",
      });
    const gallery = new Set(data.gallery.map((photo) => photo.id));
    if (
      gallery.size !== data.gallery.length ||
      allCards.some((card) => card.asset_id && !gallery.has(card.asset_id)) ||
      allFreeItems.some(
        (item) => item.kind === "photo" && !gallery.has(item.asset_id),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Galeria de imagens inconsistente.",
      });
    if (
      boards.some(
        ({ cards }) =>
          new Set(cards.map((card) => card.position)).size !== cards.length,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Dois recortes ocupam o mesmo espaço.",
      });
    if (
      allCards.some(
        (card) => (card.kind === "image") !== (card.asset_id !== null),
      )
    )
      ctx.addIssue({ code: "custom", message: "Imagem de cartão inválida." });
  });
export type Workspace = z.infer<typeof workspaceSchema>;
export type Goal = Workspace["goals"][number];
export type Task = Workspace["tasks"][number];
export type Card = Workspace["cards"][number];
export type Review = Workspace["reviews"][number];
export type Asset = {
  id: string;
  blob: Blob;
  width: number;
  height: number;
  created_at: string;
};
export const now = () => new Date().toISOString();
export const makeId = () => crypto.randomUUID();
export function rowBase() {
  return { id: makeId(), created_at: now(), updated_at: now() };
}
export function localDate(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
export function monday(value = new Date()) {
  const copy = new Date(value);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return localDate(copy);
}
export function freshWorkspace(): Workspace {
  return workspaceSchema.parse({
    schema_version: 2,
    profile: {
      id: makeId(),
      age_confirmed: false,
      journey_step: 0,
      journey_completed: false,
      template: "scrapbook",
      intention: "Posso começar com o que tenho hoje.",
    },
    paper: { brandPaper: DEFAULT_BRAND_PAPER },
    dream: { ...rowBase(), description: "", answers: {} },
    goals: [],
    tasks: [],
    cards: [],
    gallery: [],
    events: [],
    reviews: [],
  });
}
export function migrateLegacy(value: unknown): Workspace {
  const data = freshWorkspace();
  if (!value || typeof value !== "object" || Array.isArray(value)) return data;
  const old = value as Record<string, unknown>;
  const get = (key: string) =>
    typeof old[key] === "string" ? (old[key] as string).slice(0, 4000) : "";
  for (const key of answerKeys) data.dream.answers[key] = get(key);
  data.dream.description = get("dream");
  data.profile.journey_completed = !!data.dream.description;
  if (get("goal") || get("action")) {
    const goal: Goal = {
      ...rowBase(),
      dream_id: data.dream.id,
      title: get("goal") || "Meu primeiro avanço",
      target_date: null,
      obstacle: get("obstacle"),
      alternative: get("alternative"),
    };
    data.goals.push(goal);
    if (get("action"))
      data.tasks.push({
        ...rowBase(),
        goal_id: goal.id,
        title: get("action"),
        scheduled_on: null,
        status: old.done === true ? "done" : "pending",
        completed_at: old.done === true ? now() : null,
      });
  }
  return workspaceSchema.parse(data);
}
export function changeTask(
  data: Workspace,
  taskId: string,
  patch: Partial<Pick<Task, "title" | "scheduled_on" | "status">>,
  detail = "",
) {
  const task = data.tasks.find((row) => row.id === taskId);
  if (!task) throw new Error("Ação não encontrada.");
  let kind: Workspace["events"][number]["kind"] | undefined;
  if (patch.status && patch.status !== task.status) {
    kind = patch.status === "done" ? "completed" : "reopened";
    task.completed_at = patch.status === "done" ? now() : null;
  } else if (
    patch.scheduled_on !== undefined &&
    patch.scheduled_on !== task.scheduled_on
  )
    kind = "rescheduled";
  else if (patch.title !== undefined && patch.title !== task.title)
    kind = "adapted";
  Object.assign(task, patch, { updated_at: now() });
  if (kind)
    data.events.unshift({
      id: makeId(),
      task_id: task.id,
      title: task.title,
      kind,
      detail,
      created_at: now(),
    });
}
