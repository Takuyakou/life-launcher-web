import { describe, expect, it } from "vitest";
import { filterDictionary } from "./dictionary";
import { demoReducer, totalSessionMinutes } from "./reducer";
import { createDemoSeed, DICTIONARY_TILES, DO_NOW_CANDIDATES } from "./seed";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");

describe("synthetic demo seed", () => {
  it("is deterministic when now is injected", () => {
    expect(createDemoSeed(fixedNow)).toEqual(createDemoSeed(fixedNow));
  });

  it("returns deep-independent state", () => {
    const first = createDemoSeed(fixedNow);
    const second = createDemoSeed(fixedNow);
    first.todayItems[0].label = "changed";
    expect(second.todayItems[0].label).toBe("本を10分読む");
  });
});

describe("demo reducer", () => {
  it("updates and toggles the victory", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, { type: "UPDATE_VICTORY", text: "散歩に出る" });
    state = demoReducer(state, { type: "TOGGLE_VICTORY" });
    expect(state.victory).toEqual({ text: "散歩に出る", completed: true });
  });

  it("rotates Do Now through the fixed candidates", () => {
    let state = createDemoSeed(fixedNow);
    for (let index = 0; index < DO_NOW_CANDIDATES.length; index += 1) {
      state = demoReducer(state, { type: "ROTATE_DO_NOW" });
    }
    expect(state.doNowIndex).toBe(0);
  });

  it("toggles one Today 3 item", () => {
    const state = createDemoSeed(fixedNow);
    const next = demoReducer(state, { type: "TOGGLE_TODAY_ITEM", id: "today-reading" });
    expect(next.todayItems[0].completed).toBe(true);
    expect(next.todayItems[1]).toEqual(state.todayItems[1]);
  });

  it("supports timer start, pause, resume, tick, and stop", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, {
      type: "START_TIMER",
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });
    state = demoReducer(state, { type: "TICK_TIMER" });
    state = demoReducer(state, { type: "PAUSE_TIMER" });
    expect(state.timer.status).toBe("paused");
    expect(state.timer.remainingSeconds).toBe(299);
    state = demoReducer(state, { type: "RESUME_TIMER" });
    state = demoReducer(state, { type: "STOP_TIMER", now: fixedNow });
    expect(state.timer.status).toBe("idle");
    expect(state.sessions).toHaveLength(2);
    expect(state.sessions[1]).toMatchObject({ label: "本を読む", minutes: 1 });
  });

  it("does not append twice when stop is repeated", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, {
      type: "START_TIMER",
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });
    state = demoReducer(state, { type: "STOP_TIMER", now: fixedNow });
    state = demoReducer(state, { type: "STOP_TIMER", now: fixedNow });
    expect(state.sessions).toHaveLength(2);
    expect(totalSessionMinutes(state)).toBe(6);
  });

  it("resets to a newly supplied seed", () => {
    const changed = demoReducer(createDemoSeed(fixedNow), { type: "TOGGLE_VICTORY" });
    const fresh = createDemoSeed(new Date("2026-08-15T09:00:00.000Z"));
    expect(demoReducer(changed, { type: "RESET_DEMO", state: fresh })).toEqual(fresh);
  });
});

describe("dictionary search", () => {
  it("matches labels, categories, and aliases", () => {
    expect(filterDictionary(DICTIONARY_TILES, "読書").map((tile) => tile.id)).toContain("reading-note");
    expect(filterDictionary(DICTIONARY_TILES, "運動").map((tile) => tile.id)).toContain("stretch");
    expect(filterDictionary(DICTIONARY_TILES, "調べる").map((tile) => tile.id)).toContain("study-note");
  });

  it("returns every tile for a blank query", () => {
    expect(filterDictionary(DICTIONARY_TILES, "  ")).toHaveLength(DICTIONARY_TILES.length);
  });
});
