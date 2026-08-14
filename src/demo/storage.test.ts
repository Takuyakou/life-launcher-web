import { describe, expect, it } from "vitest";
import { createDemoSeed } from "./seed";
import { clearDemoState, loadDemoState, saveDemoState, STORAGE_KEY, type StorageLike } from "./storage";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("demo storage", () => {
  it("round-trips a valid state and resets an active timer", () => {
    const storage = new MemoryStorage();
    const seed = createDemoSeed(fixedNow);
    const running = {
      ...seed,
      timer: { ...seed.timer, status: "running" as const, label: "test", remainingSeconds: 10 },
    };
    expect(saveDemoState(storage, running)).toBe(true);
    expect(loadDemoState(storage, seed)).toMatchObject({ victory: seed.victory, timer: { status: "idle" } });
  });

  it("falls back for malformed JSON", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    storage.values.set(STORAGE_KEY, "{");
    expect(loadDemoState(storage, fallback)).toBe(fallback);
  });

  it("falls back for a wrong schema version", () => {
    const storage = new MemoryStorage();
    const fallback = createDemoSeed(fixedNow);
    storage.values.set(STORAGE_KEY, JSON.stringify({ ...fallback, schemaVersion: 2 }));
    expect(loadDemoState(storage, fallback)).toBe(fallback);
  });

  it("falls back when storage access throws", () => {
    const fallback = createDemoSeed(fixedNow);
    const broken: StorageLike = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(loadDemoState(broken, fallback)).toBe(fallback);
    expect(saveDemoState(broken, fallback)).toBe(false);
    expect(clearDemoState(broken)).toBe(false);
  });

  it("clears the namespaced key", () => {
    const storage = new MemoryStorage();
    storage.values.set(STORAGE_KEY, "value");
    expect(clearDemoState(storage)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
