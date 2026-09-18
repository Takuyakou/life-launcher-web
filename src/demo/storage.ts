import { createIdleTimer } from "./seed";
import { nextStepSourceId } from "./todayBuilder";
import type {
  DemoProject,
  DemoState,
  DemoTodayItem,
  DemoWishlistItem,
} from "./types";

export const STORAGE_KEY = "life-launcher-web-demo:v3";
export const V2_STORAGE_KEY = "life-launcher-web-demo:v2";
export const LEGACY_STORAGE_KEY = "life-launcher-web-demo:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PROJECT_COLORS = ["amber", "green", "blue", "violet"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(value.filter((item): item is string => nonEmptyString(item))),
      )
    : [];

const normalizeLegacySourceId = (sourceId: string): string =>
  sourceId.startsWith("project:")
    ? nextStepSourceId(sourceId.slice("project:".length))
    : sourceId;

const normalizeTodayItem = (
  item: unknown,
  index: number,
): DemoTodayItem | null => {
  if (
    !isRecord(item) ||
    !nonEmptyString(item.id) ||
    !nonEmptyString(item.label)
  )
    return null;
  const projectId = nonEmptyString(item.projectId)
    ? item.projectId
    : undefined;
  const sourceId = nonEmptyString(item.sourceId)
    ? normalizeLegacySourceId(item.sourceId)
    : projectId
      ? nextStepSourceId(projectId)
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

const normalizeProjects = (value: unknown): DemoProject[] | null => {
  if (!Array.isArray(value)) return null;
  const projects: DemoProject[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !nonEmptyString(item.id) ||
      !nonEmptyString(item.name) ||
      !PROJECT_COLORS.includes(
        item.color as (typeof PROJECT_COLORS)[number],
      ) ||
      ids.has(item.id) ||
      (item.nextStep !== undefined && typeof item.nextStep !== "string")
    )
      return null;
    ids.add(item.id);
    const nextStep =
      typeof item.nextStep === "string" && item.nextStep.trim()
        ? item.nextStep.trim().slice(0, 120)
        : undefined;
    projects.push({
      id: item.id,
      name: item.name.trim().slice(0, 60),
      color: item.color as DemoProject["color"],
      nextStep,
    });
  }
  return projects;
};

const normalizeWishlist = (
  value: unknown,
  projectIds: Set<string>,
  preserveProject: boolean,
): DemoWishlistItem[] | null => {
  if (!Array.isArray(value)) return null;
  const wishlist: DemoWishlistItem[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      !nonEmptyString(item.id) ||
      !nonEmptyString(item.label) ||
      ids.has(item.id)
    )
      return null;
    ids.add(item.id);
    const projectId =
      preserveProject &&
      nonEmptyString(item.projectId) &&
      projectIds.has(item.projectId)
        ? item.projectId
        : undefined;
    wishlist.push({
      id: item.id,
      label: item.label.trim().slice(0, 120),
      projectId,
    });
  }
  return wishlist;
};

const normalizeState = (
  value: unknown,
  fallback: DemoState,
  sourceVersion: 2 | 3,
): DemoState | null => {
  if (!isRecord(value) || value.schemaVersion !== sourceVersion) return null;
  if (
    !isRecord(value.victory) ||
    typeof value.victory.text !== "string" ||
    typeof value.victory.completed !== "boolean" ||
    !Number.isInteger(value.doNowIndex) ||
    (value.doNowIndex as number) < 0 ||
    !Array.isArray(value.todayItems) ||
    value.todayItems.length > 3 ||
    !Array.isArray(value.sessions) ||
    !isRecord(value.sections) ||
    !isRecord(value.timer)
  )
    return null;

  const projects = normalizeProjects(value.projects);
  if (!projects) return null;
  const projectIds = new Set(projects.map((project) => project.id));
  const wishlist = normalizeWishlist(
    value.wishlist,
    projectIds,
    sourceVersion === 3,
  );
  if (!wishlist) return null;
  const todayItems = value.todayItems.map(normalizeTodayItem);
  if (todayItems.some((item) => item === null)) return null;
  if (
    new Set(todayItems.map((item) => item!.sourceId)).size !==
    todayItems.length
  )
    return null;
  if (
    !value.sessions.every(
      (item) =>
        isRecord(item) &&
        nonEmptyString(item.id) &&
        typeof item.projectId === "string" &&
        typeof item.projectName === "string" &&
        nonEmptyString(item.label) &&
        typeof item.minutes === "number" &&
        Number.isFinite(item.minutes) &&
        item.minutes >= 0 &&
        typeof item.endedAt === "string" &&
        Number.isFinite(Date.parse(item.endedAt)),
    )
  )
    return null;
  for (const key of ["wishlist", "activity"])
    if (typeof value.sections[key] !== "boolean") return null;
  if (
    value.sections.nextStep !== undefined &&
    typeof value.sections.nextStep !== "boolean"
  )
    return null;

  return {
    schemaVersion: 3,
    victory: {
      text: value.victory.text,
      completed: value.victory.completed,
    },
    doNowIndex: value.doNowIndex as number,
    todayItems: todayItems as DemoTodayItem[],
    candidateExcludedSourceIds: uniqueStrings(
      value.candidateExcludedSourceIds,
    ).map(normalizeLegacySourceId),
    projects,
    wishlist,
    sessions: value.sessions as DemoState["sessions"],
    timer: createIdleTimer(),
    sections: {
      nextStep:
        typeof value.sections.nextStep === "boolean"
          ? value.sections.nextStep
          : fallback.sections.nextStep,
      // The old permanent Builder open state is deliberately not migrated.
      todayBuilder: fallback.sections.todayBuilder,
      wishlist: value.sections.wishlist as boolean,
      activity: value.sections.activity as boolean,
    },
  };
};

export function isDemoState(value: unknown): value is DemoState {
  const fallback = {
    sections: {
      nextStep: true,
      todayBuilder: true,
      wishlist: false,
      activity: true,
    },
  } as DemoState;
  return normalizeState(value, fallback, 3) !== null;
}

export function migrateV2State(
  value: unknown,
  fallback: DemoState,
): DemoState | null {
  return normalizeState(value, fallback, 2);
}

const parseStored = (raw: string | null): unknown | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export function loadDemoState(
  storage: StorageLike,
  fallback: DemoState,
): DemoState {
  try {
    const current = normalizeState(
      parseStored(storage.getItem(STORAGE_KEY)),
      fallback,
      3,
    );
    if (current) return current;

    const migrated = migrateV2State(
      parseStored(storage.getItem(V2_STORAGE_KEY)),
      fallback,
    );
    if (!migrated) return fallback;
    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...migrated, timer: createIdleTimer() }),
      );
    } catch {
      // Keep the readable v2 source untouched and use the migrated state now.
    }
    return migrated;
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
    storage.removeItem(V2_STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
