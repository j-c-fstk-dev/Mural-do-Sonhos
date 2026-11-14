import { openDB, type DBSchema } from "idb";
import {
  freshWorkspace,
  migrateLegacy,
  workspaceSchema,
  type Asset,
  type Workspace,
} from "./model";

export interface Repository {
  load(): Promise<Workspace>;
  save(
    data: Workspace,
    options?: { assets?: Asset[]; removeAssets?: string[] },
  ): Promise<void>;
  asset(id: string): Promise<Asset | undefined>;
  assets(): Promise<Asset[]>;
  replace(data: Workspace, assets: Asset[]): Promise<void>;
  clear(): Promise<Workspace>;
}
interface LocalDatabase extends DBSchema {
  workspace: { key: string; value: Workspace };
  assets: { key: string; value: Asset };
}
const legacyKey = "mural-dos-sonhos:v1";
function connect() {
  return openDB<LocalDatabase>("mural-dos-sonhos", 1, {
    upgrade(db) {
      db.createObjectStore("workspace");
      db.createObjectStore("assets", { keyPath: "id" });
    },
  });
}
export const localRepository: Repository = {
  async load() {
    const db = await connect();
    const saved = await db.get("workspace", "current");
    if (saved) return workspaceSchema.parse(saved);
    // A corrupt legacy record must never be silently overwritten.
    const raw = localStorage.getItem(legacyKey);
    const data = raw ? migrateLegacy(JSON.parse(raw)) : freshWorkspace();
    await this.save(data);
    if (raw) localStorage.removeItem(legacyKey);
    return data;
  },
  async save(data, options = {}) {
    const valid = workspaceSchema.parse(data);
    const db = await connect();
    const tx = db.transaction(["workspace", "assets"], "readwrite");
    await tx.objectStore("workspace").put(valid, "current");
    for (const asset of options.assets || [])
      await tx.objectStore("assets").put(asset);
    for (const id of options.removeAssets || [])
      await tx.objectStore("assets").delete(id);
    await tx.done;
  },
  async asset(id) {
    return (await connect()).get("assets", id);
  },
  async assets() {
    return (await connect()).getAll("assets");
  },
  async replace(data, assets) {
    const valid = workspaceSchema.parse(data);
    const db = await connect();
    const tx = db.transaction(["workspace", "assets"], "readwrite");
    await tx.objectStore("assets").clear();
    for (const asset of assets) await tx.objectStore("assets").put(asset);
    await tx.objectStore("workspace").put(valid, "current");
    await tx.done;
    localStorage.removeItem(legacyKey);
  },
  async clear() {
    const data = freshWorkspace();
    await this.replace(data, []);
    return data;
  },
};
