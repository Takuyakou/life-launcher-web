import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDoNowCandidates } from "./doNow";
import { createDemoSeed } from "./seed";
import { loadDemoState, STORAGE_KEY, type StorageLike } from "./storage";
import { createTodayBuilderCandidates } from "./todayBuilder";

// tests/e2e/fixtures/v1.3-public-state.json was written by the public v1.3 build (923f072).
const raw = JSON.stringify(
  JSON.parse(readFileSync("tests/e2e/fixtures/v1.3-public-state.json", "utf8")),
);

class MemoryStorage implements StorageLike {
  writes = 0;
  values = new Map<string, string>([[STORAGE_KEY, raw]]);
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.writes += 1;
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("v3 data written by the v1.3 public build", () => {
  const storage = new MemoryStorage();
  const state = loadDemoState(
    storage,
    createDemoSeed(new Date("2026-11-02T00:00:00Z")),
  );
  const fixture = JSON.parse(raw);

  it("loads with every field unchanged and without writing", () => {
    expect(state).toEqual(fixture);
    expect(storage.writes).toBe(0);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("keeps the exclusion and does not offer the excluded source", () => {
    expect(state.candidateExcludedSourceIds).toEqual([
      "wishlist:wish-walk",
    ]);
    const labels = createTodayBuilderCandidates(state).map(
      (candidate) => candidate.sourceId,
    );
    expect(labels).not.toContain("wishlist:wish-walk");
  });

  it("does not put a completed Today 3 item first in Do Now", () => {
    const [first, second, third] = createDoNowCandidates(state);
    expect(first).toMatchObject({
      projectId: "study",
      reason: "今日の3件に入っている一手です",
    });
    expect([second.projectId, third.projectId]).toEqual(["reading", "exercise"]);
    expect(second.reason).not.toBe("今日の3件に入っている一手です");
    expect(third.reason).not.toBe("今日の3件に入っている一手です");
  });
});
