import { describe, expect, it } from "vitest";
import { createDoNowCandidates } from "./doNow";
import { demoReducer } from "./reducer";
import { createDemoSeed } from "./seed";
import { nextStepSourceId, todayItemFromCandidate } from "./todayBuilder";
import type { DemoState } from "./types";

const now = new Date("2026-11-02T00:00:00Z");
const ids = (state: DemoState) =>
  createDoNowCandidates(state).map((entry) => entry.projectId);
const todayItem = (state: DemoState, projectId: string) =>
  todayItemFromCandidate({
    sourceId: nextStepSourceId(projectId),
    sourceType: "nextStep",
    label: state.projects.find((project) => project.id === projectId)!
      .nextStep!,
    projectId,
  });

describe("Do Now ordering", () => {
  it("puts unfinished Today 3 NextSteps first and keeps registration order for the rest", () => {
    const state = createDemoSeed(now);
    // seed: exercise is completed, reading is unfinished in Today 3
    expect(ids(state)).toEqual(["reading", "study", "exercise"]);
    expect(createDoNowCandidates(state)[0].reason).toBe(
      "今日の3件に入っている一手です",
    );
    expect(createDoNowCandidates(state)[1].reason).toBe(
      "学習に次の一手が設定されているため",
    );
  });

  it("does not put completed Today 3 items first", () => {
    const state = createDemoSeed(now);
    state.todayItems = [state.todayItems[0]];
    expect(ids(state)).toEqual(["study", "reading", "exercise"]);
    expect(createDoNowCandidates(state)[2].reason).toBe(
      "運動に次の一手が設定されているため",
    );
  });

  it("orders several Today 3 NextSteps by their Today 3 order", () => {
    const state = createDemoSeed(now);
    state.todayItems = [
      todayItem(state, "exercise"),
      todayItem(state, "study"),
    ];
    expect(ids(state)).toEqual(["exercise", "study", "reading"]);
  });

  it("ignores wishlist-derived Today 3 items and falls back to registration order", () => {
    const state = createDemoSeed(now);
    state.todayItems = [
      { ...state.todayItems[1], id: "w", sourceId: "wishlist:wish-book" },
    ];
    expect(ids(state)).toEqual(["study", "reading", "exercise"]);
  });

  it("follows Today 3 changes without touching the saved shape", () => {
    let state = createDemoSeed(now);
    const before = JSON.stringify(state);
    state = demoReducer(state, {
      type: "ADD_TODAY_ITEM",
      item: todayItem(state, "study"),
    });
    expect(ids(state)).toEqual(["reading", "study", "exercise"]);
    state = demoReducer(state, { type: "REMOVE_TODAY_ITEM", id: "today-reading" });
    expect(ids(state)).toEqual(["study", "reading", "exercise"]);
    expect(state.doNowIndex).toBe(0);
    expect(Object.keys(state)).toEqual(Object.keys(JSON.parse(before)));
  });
});

describe("Do Now start and completion", () => {
  const start = (state: DemoState, projectId: string, todayItemId?: string) =>
    demoReducer(state, {
      type: "START_TIMER",
      todayItemId,
      label: "x",
      projectId,
      projectName: "p",
      durationSeconds: 300,
      now,
    });
  const finishAndConfirm = (state: DemoState) =>
    demoReducer(demoReducer(state, { type: "FINISH_TIMER" }), {
      type: "CONFIRM_TIMER",
      now,
    });

  it("completes only the linked Today 3 item", () => {
    let state = createDemoSeed(now);
    state.todayItems.push({
      ...todayItem(state, "study"),
    });
    state = finishAndConfirm(start(state, "reading", "today-reading"));
    expect(state.todayItems.map((item) => item.completed)).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("leaves Today 3 unchanged when the NextStep is not in Today 3", () => {
    const state = createDemoSeed(now);
    const after = finishAndConfirm(start(state, "study"));
    expect(after.todayItems).toEqual(state.todayItems);
  });

  it("does not complete an already completed item", () => {
    const state = createDemoSeed(now);
    expect(start(state, "exercise", "today-stretch")).toBe(state);
  });

  it("does not complete a wishlist-derived item for the same project", () => {
    const state = createDemoSeed(now);
    state.todayItems = [
      {
        ...state.todayItems[1],
        id: "w",
        sourceId: "wishlist:wish-book",
      },
    ];
    const after = finishAndConfirm(start(state, "reading"));
    expect(after.todayItems).toEqual(state.todayItems);
  });

  it("moves Do Now to the next candidate after completion", () => {
    const state = createDemoSeed(now);
    const after = finishAndConfirm(start(state, "reading", "today-reading"));
    expect(ids(after)).toEqual(["study", "reading", "exercise"]);
  });
});
