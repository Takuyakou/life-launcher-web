import { createIdleTimer } from "./seed";
import type { DemoState, DemoTodayItem } from "./types";

export const STORAGE_KEY = "life-launcher-web-demo:v2";
export const LEGACY_STORAGE_KEY = "life-launcher-web-demo:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function isDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 2) return false;
  if (!isRecord(value.victory) || typeof value.victory.text !== "string")
    return false;
  if (
    typeof value.victory.completed !== "boolean" ||
    typeof value.doNowIndex !== "number"
  )
    return false;
  if (
    !Array.isArray(value.todayItems) ||
    value.todayItems.length > 3 ||
    !Array.isArray(value.projects)
  )
    return false;
  if (!Array.isArray(value.wishlist) || !Array.isArray(value.sessions))
    return false;
  if (!isRecord(value.sections) || !isRecord(value.timer)) return false;
  if (!Number.isInteger(value.doNowIndex) || (value.doNowIndex as number) < 0)
    return false;
  if (
    !value.projects.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.nextStep === "string" &&
        ["amber", "green", "blue", "violet"].includes(String(item.color)),
    )
  )
    return false;
  if (
    !value.wishlist.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.label === "string",
    )
  )
    return false;
  if (
    !value.sessions.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.projectId === "string" &&
        typeof item.projectName === "string" &&
        typeof item.label === "string" &&
        typeof item.minutes === "number" &&
        Number.isFinite(item.minutes) &&
        item.minutes >= 0 &&
        typeof item.endedAt === "string" &&
        Number.isFinite(Date.parse(item.endedAt)),
    )
  )
    return false;
  for (const key of ["todayBuilder", "wishlist", "activity"])
    if (typeof value.sections[key] !== "boolean") return false;
  if (
    value.sections.nextStep !== undefined &&
    typeof value.sections.nextStep !== "boolean"
  )
    return false;
  return true;
}

const normalizeTodayItem = (
  item: unknown,
  index: number,
): DemoTodayItem | null => {
  if (
    !isRecord(item) ||
    typeof item.id !== "string" ||
    typeof item.label !== "string"
  )
    return null;
  const projectId =
    typeof item.projectId === "string" && item.projectId
      ? item.projectId
      : undefined;
  const sourceId =
    typeof item.sourceId === "string" && item.sourceId
      ? item.sourceId
      : projectId
        ? `project:${projectId}`
        : `legacy:${item.id || index}`;
  return {
    id: item.id,
    sourceId,
    label: item.label,
    projectId,
    completed: item.completed === true,
    shortMinutes:
      typeof item.shortMinutes === "number" &&
      Number.isFinite(item.shortMinutes) &&
      item.shortMinutes >= 1 &&
      item.shortMinutes <= 120
        ? item.shortMinutes
        : 5,
    normalMinutes:
      typeof item.normalMinutes === "number" &&
      Number.isFinite(item.normalMinutes) &&
      item.normalMinutes >= 1 &&
      item.normalMinutes <= 120
        ? item.normalMinutes
        : 25,
  };
};

export function loadDemoState(
  storage: StorageLike,
  fallback: DemoState,
): DemoState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoState(parsed)) return fallback;
    const todayItems = parsed.todayItems
      .map((item, index) => normalizeTodayItem(item, index))
      .filter((item): item is DemoTodayItem => item !== null);
    const candidateExcludedSourceIds = Array.isArray(
      parsed.candidateExcludedSourceIds,
    )
      ? Array.from(
          new Set(
            parsed.candidateExcludedSourceIds.filter(
              (sourceId): sourceId is string =>
                typeof sourceId === "string" && sourceId.trim() !== "",
            ),
          ),
        )
      : [];
    return {
      ...parsed,
      todayItems,
      candidateExcludedSourceIds,
      sections: { ...fallback.sections, ...parsed.sections },
      timer: createIdleTimer(),
    };
  } catch {
    return fallback;
  }
}

export function saveDemoState(storage: StorageLike, state: DemoState): boolean {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, timer: createIdleTimer() }),
    );
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
