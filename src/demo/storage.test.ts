import { describe, expect, it } from "vitest";
import { createDemoSeed } from "./seed";
import {
  clearDemoState,
  LEGACY_STORAGE_KEY,
  loadDemoState,
  migrateV2State,
  saveDemoState,
  STORAGE_KEY,
  V2_STORAGE_KEY,
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

const asV2 = () => {
  const state = structuredClone(createDemoSeed(fixedNow)) as Record<
    string,
    unknown
  >;
  state.schemaVersion = 2;
  state.todayItems = (
    state.todayItems as Array<Record<string, unknown>>
  ).map((item) => ({
    ...item,
    sourceId: String(item.sourceId).replace("nextstep:", "project:"),
  }));
  state.candidateExcludedSourceIds = ["project:study"];
  return state;
};

describe("demo storage v3", () => {
  it("round-trips v3 state, exclusions, optional Project, and resets an active timer", () => {
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
      schemaVersion: 3,
      candidateExcludedSourceIds: ["wishlist:wish-book"],
      timer: { status: "idle" },
      wishlist: [
        { id: "wish-book", projectId: "reading" },
        { id: "wish-drawer", projectId: "tidy" },
        { id: "wish-walk", projectId: undefined },
      ],
    });
  });

  it("migrates v2 without guessing Wishlist Projects or inheriting Builder state", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    fallback.sections.todayBuilder = false;
    const older = asV2();
    (older.sections as Record<string, unknown>).todayBuilder = true;
    delete older.candidateExcludedSourceIds;
    older.todayItems = (
      older.todayItems as Array<Record<string, unknown>>
    ).map((item) => {
      const legacy = { ...item };
      delete legacy.sourceId;
      delete legacy.shortMinutes;
      delete legacy.normalMinutes;
      return legacy;
    });
    storage.values.set(V2_STORAGE_KEY, JSON.stringify(older));

    const loaded = loadDemoState(storage, fallback);

    expect(loaded.schemaVersion).toBe(3);
    expect(loaded.sections.todayBuilder).toBe(false);
    expect(loaded.candidateExcludedSourceIds).toEqual([]);
    expect(loaded.todayItems.map((item) => item.sourceId)).toEqual([
      "nextstep:exercise",
      "nextstep:reading",
    ]);
    expect(loaded.todayItems[0]).toMatchObject({
      shortMinutes: 5,
      normalMinutes: 25,
    });
    expect(loaded.wishlist.every((item) => item.projectId === undefined)).toBe(
      true,
    );
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({
      schemaVersion: 3,
    });
    expect(storage.getItem(V2_STORAGE_KEY)).not.toBeNull();
  });

  it("normalizes legacy IDs and preserves same-text Wishlist identity", () => {
    const fallback = createDemoSeed(fixedNow);
    const older = asV2();
    older.wishlist = [
      { id: "a", label: "同じ内容" },
      { id: "b", label: "同じ内容" },
    ];
    const migrated = migrateV2State(older, fallback);
    expect(migrated?.candidateExcludedSourceIds).toEqual(["nextstep:study"]);
    expect(migrated?.wishlist.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("supports empty Projects, optional NextStep, and unassigned Wishlist", () => {
    const storage = new MemoryStorage();
    const state = createDemoSeed(fixedNow);
    state.projects = [];
    state.wishlist = [{ id: "wish", label: "あとでやる" }];
    state.todayItems = [];
    expect(saveDemoState(storage, state)).toBe(true);
    expect(loadDemoState(storage, createDemoSeed(fixedNow))).toMatchObject({
      projects: [],
      wishlist: [{ id: "wish", projectId: undefined }],
      todayItems: [],
    });

    const optional = createDemoSeed(fixedNow);
    optional.projects[0].nextStep = undefined;
    expect(saveDemoState(storage, optional)).toBe(true);
    expect(
      loadDemoState(storage, createDemoSeed(fixedNow)).projects[0].nextStep,
    ).toBeUndefined();
  });

  it("falls back for malformed or unsupported current data without overwriting it", () => {
    for (const value of ["{", JSON.stringify({ schemaVersion: 99 })]) {
      const storage = new MemoryStorage();
      const fallback = createDemoSeed(fixedNow);
      storage.values.set(STORAGE_KEY, value);
      expect(loadDemoState(storage, fallback)).toBe(fallback);
      expect(storage.getItem(STORAGE_KEY)).toBe(value);
    }
  });

  it("uses readable migrated data when the v3 migration write is blocked", () => {
    const fallback = createDemoSeed(fixedNow);
    const v2 = JSON.stringify(asV2());
    const storage: StorageLike = {
      getItem: (key) => (key === V2_STORAGE_KEY ? v2 : null),
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    };
    const loaded = loadDemoState(storage, fallback);
    expect(loaded.schemaVersion).toBe(3);
    expect(loaded.todayItems[0].sourceId).toBe("nextstep:exercise");
  });

  it("falls back when storage access throws and preserves save rollback", () => {
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

  it("clears v3, v2, and v1 namespaced keys", () => {
    const storage = new MemoryStorage();
    for (const key of [STORAGE_KEY, V2_STORAGE_KEY, LEGACY_STORAGE_KEY])
      storage.values.set(key, "value");
    expect(clearDemoState(storage)).toBe(true);
    for (const key of [STORAGE_KEY, V2_STORAGE_KEY, LEGACY_STORAGE_KEY])
      expect(storage.getItem(key)).toBeNull();
  });
});
