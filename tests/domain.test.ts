import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changeTask,
  freshWorkspace,
  localDate,
  migrateLegacy,
  monday,
  rowBase,
  workspaceSchema,
} from "../src/data/model";
import { localRepository } from "../src/data/repository";

const map = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => map.get(key) || null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  },
});

test("legacy migration preserves dream, editable plan and completion", () => {
  const data = migrateLegacy({
    dream: "Viver do meu trabalho criativo",
    goal: "Criar portfólio",
    action: "Escolher três trabalhos",
    done: true,
    obstacle: "Tempo",
  });
  assert.equal(data.dream.description, "Viver do meu trabalho criativo");
  assert.equal(data.tasks[0].goal_id, data.goals[0].id);
  assert.equal(data.tasks[0].status, "done");
  assert.ok(data.tasks[0].completed_at);
  assert.equal(data.goals[0].obstacle, "Tempo");
});
test("completion, reopening and rescheduling keep distinct dated events", () => {
  const data = migrateLegacy({
    goal: "Meu portfólio",
    action: "Escolher trabalhos",
  });
  const task = data.tasks[0];
  changeTask(data, task.id, { status: "done" });
  changeTask(data, task.id, { status: "pending" });
  changeTask(data, task.id, { scheduled_on: "2026-12-01" });
  assert.deepEqual(
    data.events.map((event) => event.kind),
    ["rescheduled", "reopened", "completed"],
  );
  assert.equal(task.completed_at, null);
  assert.equal(task.scheduled_on, "2026-12-01");
  assert.ok(workspaceSchema.safeParse(data).success);
});
test("rejects orphaned relations, duplicate placement and inconsistent completions", () => {
  const data = migrateLegacy({ goal: "Meta", action: "Ação" });
  data.tasks[0].goal_id = crypto.randomUUID();
  assert.equal(workspaceSchema.safeParse(data).success, false);
  data.tasks[0].goal_id = data.goals[0].id;
  data.tasks[0].status = "done";
  assert.equal(workspaceSchema.safeParse(data).success, false);
  data.tasks[0].status = "pending";
  const quote = {
    ...rowBase(),
    dream_id: data.dream.id,
    goal_id: null,
    kind: "quote" as const,
    asset_id: null,
    body: "Um passo",
    caption: "",
    color: "sage" as const,
    position: 0,
  };
  data.cards.push(quote, { ...quote, id: crypto.randomUUID() });
  assert.equal(workspaceSchema.safeParse(data).success, false);
});
test("local dates and weekly reviews respect local calendar boundaries", () => {
  assert.equal(localDate(new Date(2026, 10, 14, 23, 59)), "2026-11-14");
  assert.equal(monday(new Date(2026, 10, 15)), "2026-11-09");
  assert.equal(monday(new Date(2026, 10, 16)), "2026-11-16");
});
test("IndexedDB repository keeps photos, replaces atomically, rejects invalid data and clears all records", async () => {
  const data = freshWorkspace();
  const asset = {
    id: crypto.randomUUID(),
    blob: new Blob(["photo"], { type: "image/jpeg" }),
    width: 20,
    height: 20,
    created_at: new Date().toISOString(),
  };
  data.gallery.push({
    id: asset.id,
    label: "Minha foto",
    created_at: asset.created_at,
  });
  await localRepository.replace(data, [asset]);
  assert.equal((await localRepository.load()).gallery[0].id, asset.id);
  assert.equal(
    await (await localRepository.asset(asset.id))?.blob.text(),
    "photo",
  );
  const bad = structuredClone(data);
  bad.schema_version = 3 as 2;
  await assert.rejects(() => localRepository.replace(bad, []));
  assert.ok(
    await localRepository.asset(asset.id),
    "Invalid replacement must preserve existing photos",
  );
  await localRepository.clear();
  assert.equal((await localRepository.assets()).length, 0);
  assert.equal((await localRepository.load()).gallery.length, 0);
});
