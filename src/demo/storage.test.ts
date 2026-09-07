import { describe, expect, it } from "vitest";
import { createDemoSeed } from "./seed";
import {
  clearDemoState,
  LEGACY_STORAGE_KEY,
  loadDemoState,
  saveDemoState,
  STORAGE_KEY,
  type StorageLike,
} from "./storage";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("demo storage", () => {
  it("round-trips a valid v2 state, exclusions, and resets an active timer", () => {
    const storage = new MemoryStorage();
    const seed = createDemoSeed(fixedNow);
    const running = {
      ...seed,
      candidateExcludedSourceIds: ["wishlist:wish-book"],
      timer: {
        ...seed.timer,
        status: "running" as const,
        label: "test",
        remainingSeconds: 10,
      },
    };
    expect(saveDemoState(storage, running)).toBe(true);
    expect(loadDemoState(storage, seed)).toMatchObject({
      candidateExcludedSourceIds: ["wishlist:wish-book"],
      timer: { status: "idle" },
    });
  });

  it("loads older v2 data by deriving source IDs and an empty exclusion list", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    const older = structuredClone(fallback) as Record<string, unknown>;
    delete older.candidateExcludedSourceIds;
    older.todayItems = fallback.todayItems.map((item) => ({
      id: item.id,
      label: item.label,
      projectId: item.projectId,
      completed: item.completed,
    }));
    storage.values.set(STORAGE_KEY, JSON.stringify(older));
    const loaded = loadDemoState(storage, fallback);
    expect(loaded.candidateExcludedSourceIds).toEqual([]);
    expect(loaded.todayItems.map((item) => item.sourceId)).toEqual([
      "project:exercise",
      "project:reading",
    ]);
  });

  it("falls back for malformed JSON", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    storage.values.set(STORAGE_KEY, "{");
    expect(loadDemoState(storage, fallback)).toBe(fallback);
  });

  it("safely ignores the incompatible v1 schema", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    storage.values.set(
      STORAGE_KEY,
      JSON.stringify({ ...fallback, schemaVersion: 1 }),
    );
    expect(loadDemoState(storage, fallback)).toBe(fallback);
  });

  it("falls back when storage access throws", () => {
    const fallback = createDemoSeed(fixedNow);
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadDemoState(broken, fallback)).toBe(fallback);
    expect(saveDemoState(broken, fallback)).toBe(false);
    expect(clearDemoState(broken)).toBe(false);
  });

  it("clears both current and legacy namespaced keys", () => {
    const storage = new MemoryStorage();
    storage.values.set(STORAGE_KEY, "value");
    storage.values.set(LEGACY_STORAGE_KEY, "legacy");
    expect(clearDemoState(storage)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });
});
