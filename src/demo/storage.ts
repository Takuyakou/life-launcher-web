import { createIdleTimer } from "./seed";
import type { DemoState } from "./types";

export const STORAGE_KEY = "life-launcher-web-demo:v2";
export const LEGACY_STORAGE_KEY = "life-launcher-web-demo:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function isDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 2) return false;
  if (!isRecord(value.victory) || typeof value.victory.text !== "string") return false;
  if (typeof value.victory.completed !== "boolean" || typeof value.doNowIndex !== "number") return false;
  if (!Array.isArray(value.todayItems) || value.todayItems.length > 3 || !Array.isArray(value.projects)) return false;
  if (!Array.isArray(value.wishlist) || !Array.isArray(value.sessions)) return false;
  if (!isRecord(value.sections) || !isRecord(value.timer)) return false;
  return true;
}

export function loadDemoState(storage: StorageLike, fallback: DemoState): DemoState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoState(parsed)) return fallback;
    return { ...parsed, timer: createIdleTimer() };
  } catch {
    return fallback;
  }
}

export function saveDemoState(storage: StorageLike, state: DemoState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, timer: createIdleTimer() }));
    return true;
  } catch {
    return false;
  }
}

export function clearDemoState(storage: StorageLike): boolean {
  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
