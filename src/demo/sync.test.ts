import { describe, expect, it } from "vitest";
import { demoReducer } from "./reducer";
import { createDemoSeed } from "./seed";
import {
  createTodayBuilderCandidates,
  todayItemFromCandidate,
} from "./todayBuilder";
import { loadDemoState, STORAGE_KEY } from "./storage";
import type { DemoState } from "./types";

const now = new Date("2026-09-09T00:00:00Z");
const start = (state: DemoState, todayItemId?: string) =>
  demoReducer(state, {
    type: "START_TIMER",
    label: "本を読む",
    projectId: "reading",
    projectName: "読書",
    durationSeconds: 300,
    todayItemId,
    now,
  });
describe("WEB11 timer identity and batches", () => {
  it("does not complete an item on early stop or paused replacement", () => {
    const running = start(createDemoSeed(now), "today-reading");
    const early = demoReducer(running, {
      type: "STOP_TIMER",
      now,
      complete: true,
    });
    expect(early.todayItems[1].completed).toBe(false);
    const paused = demoReducer(running, { type: "PAUSE_TIMER" });
    const replaced = start(paused);
    expect(replaced.todayItems[1].completed).toBe(false);
    expect(replaced.timer.status).toBe("running");
    expect(replaced.timer.todayItemId).toBeUndefined();
    expect(replaced.sessions).toHaveLength(paused.sessions.length + 1);
  });
  it("confirms once and freezes the adopted label and minutes", () => {
    let state = start(createDemoSeed(now), "today-reading");
    state = demoReducer(state, { type: "FINISH_TIMER" });
    expect(state.todayItems[1].completed).toBe(false);
    expect(state.timer.elapsedSeconds).toBe(300);
    state = demoReducer(state, {
      type: "CONFIRM_TIMER",
      now,
      nextStep: "次の章",
    });
    expect(state.todayItems[1]).toMatchObject({
      label: "本を読む",
      completed: true,
      shortMinutes: 5,
      normalMinutes: 25,
    });
    expect(state.projects.find((project) => project.id === "reading")?.nextStep).toBe("次の章");
    expect(state.sessions.at(-1)?.minutes).toBe(5);
    expect(demoReducer(state, { type: "CONFIRM_TIMER", now })).toBe(state);
  });
  it("reaches natural expiry only after every scheduled tick", () => {
    let state = start(createDemoSeed(now), "today-reading");
    for (let i = 0; i < 299; i++)
      state = demoReducer(state, { type: "TICK_TIMER" });
    expect(state.timer.status).toBe("running");
    state = demoReducer(state, { type: "TICK_TIMER" });
    expect(state.timer).toMatchObject({
      status: "finished",
      elapsedSeconds: 300,
      remainingSeconds: 0,
    });
    expect(demoReducer(state, { type: "TICK_TIMER" })).toBe(state);
  });
  it("does not complete a Today snapshot from Do Now of the same project", () => {
    let state = start(createDemoSeed(now));
    state = demoReducer(state, { type: "FINISH_TIMER" });
    state = demoReducer(state, { type: "CONFIRM_TIMER", now });
    expect(state.todayItems[1].completed).toBe(false);
  });
  it("requires exactly three completed items and preserves records in the next batch", () => {
    const seed = createDemoSeed(now);
    expect(demoReducer(seed, { type: "NEXT_TODAY_BATCH" })).toBe(seed);
    let state = demoReducer(seed, {
      type: "ADD_TODAY_ITEM",
      item: todayItemFromCandidate(
        createTodayBuilderCandidates(seed).find(
          (candidate) => candidate.sourceId === "nextstep:study",
        )!,
      ),
    });
    state = {
      ...state,
      todayItems: state.todayItems.map((item) => ({
        ...item,
        completed: true,
      })),
    };
    const next = demoReducer(state, { type: "NEXT_TODAY_BATCH" });
    expect(next.todayItems).toEqual([]);
    expect(next.sessions).toBe(state.sessions);
    expect(next.projects).toBe(state.projects);
  });
  it("refuses completed or missing Today targets and invalid durations", () => {
    const seed = createDemoSeed(now);
    expect(start(seed, "missing")).toBe(seed);
    expect(start(seed, "today-stretch")).toBe(seed);
    expect(
      demoReducer(seed, {
        type: "START_TIMER",
        label: "x",
        projectId: "reading",
        projectName: "読書",
        durationSeconds: NaN,
      }),
    ).toBe(seed);
  });
  it("guards exclusion during active and paused timers", () => {
    const running = start(createDemoSeed(now), "today-reading");
    const paused = demoReducer(running, { type: "PAUSE_TIMER" });
    for (const state of [running, paused])
      expect(
        demoReducer(state, {
          type: "EXCLUDE_TODAY_CANDIDATE",
          sourceId: "nextstep:reading",
        }),
      ).toBe(state);
  });
  it("allows same-text Wishlist sources with different stable identities", () => {
    let state = createDemoSeed(now);
    for (const id of ["a", "b"])
      state = demoReducer(state, {
        type: "ADD_WISHLIST",
        id,
        label: "同じ内容",
      });
    expect(
      createTodayBuilderCandidates(state)
        .filter((item) => item.label === "同じ内容")
        .map((item) => item.sourceId),
    ).toEqual(["wishlist:b", "wishlist:a"]);
  });
  it("locks NextStep replacement only while its source is unfinished Today3", () => {
    const seed = createDemoSeed(now);
    expect(
      demoReducer(seed, {
        type: "UPDATE_PROJECT_NEXT_STEP",
        projectId: "reading",
        nextStep: "変更できない",
      }),
    ).toBe(seed);

    const completed = {
      ...seed,
      todayItems: seed.todayItems.map((item) =>
        item.sourceId === "nextstep:reading"
          ? { ...item, completed: true }
          : item,
      ),
    };
    expect(
      demoReducer(completed, {
        type: "UPDATE_PROJECT_NEXT_STEP",
        projectId: "reading",
        nextStep: "変更できる",
      }).projects.find((project) => project.id === "reading")?.nextStep,
    ).toBe("変更できる");

    const removed = demoReducer(seed, {
      type: "REMOVE_TODAY_ITEM",
      id: "today-reading",
    });
    expect(
      demoReducer(removed, {
        type: "UPDATE_PROJECT_NEXT_STEP",
        projectId: "reading",
        nextStep: "外した後も変更できる",
      }).projects.find((project) => project.id === "reading")?.nextStep,
    ).toBe("外した後も変更できる");
  });
  it("migrates old v2 timer snapshots and next-step disclosure", () => {
    const seed = createDemoSeed(now);
    const raw = JSON.parse(JSON.stringify(seed));
    delete raw.sections.nextStep;
    delete raw.todayItems[1].shortMinutes;
    delete raw.todayItems[1].normalMinutes;
    const storage = {
      getItem: (key: string) =>
        key === STORAGE_KEY ? JSON.stringify(raw) : null,
      setItem: () => {},
      removeItem: () => {},
    };
    const loaded = loadDemoState(storage, seed);
    expect(loaded.sections.nextStep).toBe(true);
    expect(loaded.todayItems[1]).toMatchObject({
      shortMinutes: 5,
      normalMinutes: 25,
    });
  });
  it("falls back instead of rendering malformed persisted project or session entries", () => {
    const seed = createDemoSeed(now);
    for (const changes of [
      { projects: [null] },
      { sessions: [{ endedAt: "invalid" }] },
      { sections: { ...seed.sections, nextStep: "yes" } },
    ]) {
      const storage = {
        getItem: () => JSON.stringify({ ...seed, ...changes }),
        setItem: () => {},
        removeItem: () => {},
      };
      expect(loadDemoState(storage, seed)).toBe(seed);
    }
  });
});
