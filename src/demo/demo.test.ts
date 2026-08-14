import { describe, expect, it } from "vitest";
import { filterDictionary } from "./dictionary";
import { demoReducer, totalSessionMinutes } from "./reducer";
import {
  createDemoSeed,
  DICTIONARY_TILES,
  DO_NOW_CANDIDATES,
  launchActionsForProject,
  TODAY_CANDIDATES,
} from "./seed";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");

describe("synthetic demo seed", () => {
  it("is deterministic when now is injected", () => {
    expect(createDemoSeed(fixedNow)).toEqual(createDemoSeed(fixedNow));
  });

  it("returns deep-independent state", () => {
    const first = createDemoSeed(fixedNow);
    const second = createDemoSeed(fixedNow);
    first.todayItems[0].label = "changed";
    expect(second.todayItems[0].label).toBe("ストレッチを5分する");
  });
});

describe("demo reducer", () => {
  it("updates and toggles the victory", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, { type: "UPDATE_VICTORY", text: "散歩に出る" });
    state = demoReducer(state, { type: "TOGGLE_VICTORY" });
    expect(state.victory).toEqual({ text: "散歩に出る", completed: true });
  });

  it("rotates Do Now text and reason together", () => {
    let state = createDemoSeed(fixedNow);
    for (let index = 0; index < DO_NOW_CANDIDATES.length; index += 1) {
      state = demoReducer(state, { type: "ROTATE_DO_NOW" });
    }
    expect(state.doNowIndex).toBe(0);
    expect(DO_NOW_CANDIDATES[state.doNowIndex]).toMatchObject({
      text: "数分だけ読む",
      reason: "今日まだ実行していないため",
    });
  });

  it("adds only one third Today item and rejects duplicates or a fourth", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, { type: "ADD_TODAY_ITEM", item: TODAY_CANDIDATES[0] });
    expect(state.todayItems).toHaveLength(3);
    state = demoReducer(state, { type: "ADD_TODAY_ITEM", item: TODAY_CANDIDATES[0] });
    state = demoReducer(state, { type: "ADD_TODAY_ITEM", item: TODAY_CANDIDATES[1] });
    expect(state.todayItems).toHaveLength(3);
    expect(state.todayItems.some((item) => item.id === "today-walk")).toBe(false);
  });

  it("toggles one Today 3 item", () => {
    const state = createDemoSeed(fixedNow);
    const next = demoReducer(state, { type: "TOGGLE_TODAY_ITEM", id: "today-reading" });
    expect(next.todayItems[1].completed).toBe(true);
    expect(next.todayItems[0]).toEqual(state.todayItems[0]);
  });

  it("updates one project next step without changing other projects", () => {
    const state = createDemoSeed(fixedNow);
    const next = demoReducer(state, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "reading",
      nextStep: "本を20分読む",
    });
    expect(next.projects.find((project) => project.id === "reading")?.nextStep).toBe("本を20分読む");
    expect(next.projects.find((project) => project.id === "exercise")).toEqual(
      state.projects.find((project) => project.id === "exercise"),
    );
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

  it("resets all added state to a newly supplied seed", () => {
    let changed = demoReducer(createDemoSeed(fixedNow), { type: "TOGGLE_VICTORY" });
    changed = demoReducer(changed, { type: "ADD_TODAY_ITEM", item: TODAY_CANDIDATES[0] });
    changed = demoReducer(changed, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "reading",
      nextStep: "変更した一手",
    });
    const fresh = createDemoSeed(new Date("2026-08-15T09:00:00.000Z"));
    expect(demoReducer(changed, { type: "RESET_DEMO", state: fresh })).toEqual(fresh);
  });
});

describe("launch simulation", () => {
  it("returns a fixed, duplicate-free sequence for each project", () => {
    expect(launchActionsForProject("reading")).toEqual([
      "読書メモを開く",
      "参考ページを開く",
      "タイマーを開始",
    ]);
    expect(new Set(launchActionsForProject("reading")).size).toBe(launchActionsForProject("reading").length);
    expect(launchActionsForProject("unknown")).toEqual(["登録した項目を準備", "タイマーを開始"]);
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
