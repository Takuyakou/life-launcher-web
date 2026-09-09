import { describe, expect, it } from "vitest";
import { demoReducer } from "./reducer";
import { createDemoSeed } from "./seed";
import { createTodayBuilderCandidates, todayItemFromCandidate } from "./todayBuilder";
import { loadDemoState, saveDemoState } from "./storage";

const seed = () => createDemoSeed(new Date("2026-09-09T00:00:00Z"));
describe("Today3 removal", () => {
  it("preserves sources, candidates, sessions and remaining snapshots/order", () => {
    const before = seed();
    const after = demoReducer(before, { type: "REMOVE_TODAY_ITEM", id: "today-reading" });
    expect(after.todayItems).toEqual(before.todayItems.filter(item => item.id !== "today-reading"));
    expect(after.projects).toBe(before.projects);
    expect(after.wishlist).toBe(before.wishlist);
    expect(after.sessions).toBe(before.sessions);
    expect(after.candidateExcludedSourceIds).toBe(before.candidateExcludedSourceIds);
    expect(createTodayBuilderCandidates(after)).toEqual(createTodayBuilderCandidates(before));
  });
  it("removes an adopted wishlist item without removing its source", () => {
    const before = seed();
    const candidate = createTodayBuilderCandidates(before).find(item => item.sourceType === "wishlist")!;
    const adopted = demoReducer(before, { type: "ADD_TODAY_ITEM", item: todayItemFromCandidate(candidate) });
    const target = adopted.todayItems.find(item => item.sourceId === candidate.sourceId)!;
    const after = demoReducer(adopted, { type: "REMOVE_TODAY_ITEM", id: target.id });
    expect(after.wishlist).toBe(before.wishlist);
    expect(after.todayItems).toEqual(before.todayItems);
    expect(createTodayBuilderCandidates(after)).toContainEqual(candidate);
  });
  for (const status of ["running", "paused", "finished"] as const) {
    it(`guards direct actions while ${status}, but permits other cards`, () => {
      const before = seed();
      const active = { ...before, timer: { ...before.timer, status, todayItemId: "today-reading" } };
      expect(demoReducer(active, { type: "REMOVE_TODAY_ITEM", id: "today-reading" })).toBe(active);
      expect(demoReducer(active, { type: "REMOVE_TODAY_ITEM", id: "today-stretch" }).todayItems).toHaveLength(1);
      const stopped = demoReducer(active, { type: "STOP_TIMER", now: new Date() });
      expect(demoReducer(stopped, { type: "REMOVE_TODAY_ITEM", id: "today-reading" }).todayItems).toHaveLength(1);
    });
  }
  it("allows completed cards, rejects unknown IDs and persists across reload", () => {
    const before = seed();
    expect(demoReducer(before, { type: "REMOVE_TODAY_ITEM", id: "missing" })).toBe(before);
    const after = demoReducer(before, { type: "REMOVE_TODAY_ITEM", id: "today-stretch" });
    expect(after.todayItems).toHaveLength(1);
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_key: string, v: string) => { value = v; }, removeItem: () => {} };
    expect(saveDemoState(storage, after)).toBe(true);
    expect(loadDemoState(storage, seed()).todayItems).toEqual(after.todayItems);
  });
});
