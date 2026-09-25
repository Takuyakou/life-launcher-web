import { describe, expect, it } from "vitest";
import { filterDictionary } from "./dictionary";
import { createDoNowCandidates } from "./doNow";
import { demoReducer, totalSessionMinutes } from "./reducer";
import {
  createDemoSeed,
  DICTIONARY_TILES,
  launchActionsForProject,
} from "./seed";
import {
  createTodayBuilderCandidates,
  sourceLockedByUnfinishedToday,
  todayItemFromCandidate,
} from "./todayBuilder";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");

describe("synthetic demo seed", () => {
  it("is deterministic when now is injected", () => {
    expect(createDemoSeed(fixedNow)).toEqual(createDemoSeed(fixedNow));
  });

  it("returns deep-independent state", () => {
    const first = createDemoSeed(fixedNow);
    const second = createDemoSeed(fixedNow);
    first.todayItems[0].label = "changed";
    expect(second.todayItems[0].label).toBe("ストレッチをする");
  });
});

describe("Today Builder", () => {
  it("derives stable candidates from NextStep and Wishlist sources", () => {
    const candidates = createTodayBuilderCandidates(createDemoSeed(fixedNow));
    expect(candidates).toHaveLength(6);
    expect(candidates[0]).toMatchObject({
      sourceId: "nextstep:study",
      sourceType: "nextStep",
      label: "参考書を10ページ進める",
    });
    expect(candidates[3]).toMatchObject({
      sourceId: "wishlist:wish-book",
      sourceType: "wishlist",
    });
  });

  it("keeps duplicate Wishlist text distinct by source ID", () => {
    const state = createDemoSeed(fixedNow);
    state.wishlist = [
      { id: "wish-a", label: "同じ文面" },
      { id: "wish-b", label: "同じ文面" },
    ];
    expect(
      createTodayBuilderCandidates(state)
        .filter((item) => item.label === "同じ文面")
        .map((item) => item.sourceId),
    ).toEqual(["wishlist:wish-a", "wishlist:wish-b"]);
  });

  it("omits Projects without a NextStep and keeps Wishlist Project identity", () => {
    const state = createDemoSeed(fixedNow);
    state.projects[0].nextStep = undefined;
    const candidates = createTodayBuilderCandidates(state);
    expect(candidates.some((item) => item.sourceId === "nextstep:study")).toBe(
      false,
    );
    expect(
      candidates.find((item) => item.sourceId === "wishlist:wish-book"),
    ).toMatchObject({ projectId: "reading" });
  });

  it("derives source lock from unfinished Today identity only", () => {
    const state = createDemoSeed(fixedNow);
    expect(sourceLockedByUnfinishedToday(state, "nextstep:reading")).toBe(true);
    expect(sourceLockedByUnfinishedToday(state, "nextstep:exercise")).toBe(
      false,
    );
    const sameText = {
      ...state,
      wishlist: [
        { id: "a", label: "同じ内容" },
        { id: "b", label: "同じ内容" },
      ],
      todayItems: [
        {
          id: "today-a",
          sourceId: "wishlist:a",
          label: "同じ内容",
          completed: false,
        },
      ],
    };
    expect(sourceLockedByUnfinishedToday(sameText, "wishlist:a")).toBe(true);
    expect(sourceLockedByUnfinishedToday(sameText, "wishlist:b")).toBe(false);
    sameText.todayItems[0].completed = true;
    expect(sourceLockedByUnfinishedToday(sameText, "wishlist:a")).toBe(false);
  });
});

describe("demo reducer", () => {
  it("updates and toggles the victory", () => {
    let state = createDemoSeed(fixedNow);
    state = demoReducer(state, { type: "UPDATE_VICTORY", text: "散歩に出る" });
    state = demoReducer(state, { type: "TOGGLE_VICTORY" });
    expect(state.victory).toEqual({ text: "散歩に出る", completed: true });
  });

  it("derives Do Now candidates only from Projects with a NextStep", () => {
    const state = createDemoSeed(fixedNow);
    state.projects[2].nextStep = undefined;
    const candidates = createDoNowCandidates(state);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      projectId: "study",
      text: "参考書を10ページ進める",
      reason: "学習に次の一手が設定されているため",
    });
    state.projects[1].nextStep = undefined;
    expect(createDoNowCandidates(state)).toHaveLength(1);
    state.projects[0].nextStep = undefined;
    expect(createDoNowCandidates(state)).toHaveLength(0);
  });

  it("adopts only one third Builder candidate and rejects duplicate or fourth sources", () => {
    let state = createDemoSeed(fixedNow);
    const candidates = createTodayBuilderCandidates(state);
    const reading = candidates.find((item) => item.sourceId === "nextstep:reading")!;
    const study = candidates.find((item) => item.sourceId === "nextstep:study")!;
    const wishlist = candidates.find((item) => item.sourceId === "wishlist:wish-book")!;
    state = demoReducer(state, {
      type: "ADD_TODAY_ITEM",
      item: todayItemFromCandidate(study),
    });
    expect(state.todayItems).toHaveLength(3);
    state = demoReducer(state, {
      type: "ADD_TODAY_ITEM",
      item: todayItemFromCandidate(study),
    });
    state = demoReducer(state, {
      type: "ADD_TODAY_ITEM",
      item: todayItemFromCandidate(wishlist),
    });
    state = demoReducer(state, {
      type: "ADD_TODAY_ITEM",
      item: todayItemFromCandidate(reading),
    });
    expect(state.todayItems).toHaveLength(3);
    expect(
      state.todayItems.some((item) => item.sourceId === "wishlist:wish-book"),
    ).toBe(false);
  });

  it("excludes a candidate and its Today snapshot while preserving its source", () => {
    const state = createDemoSeed(fixedNow);
    const next = demoReducer(state, {
      type: "EXCLUDE_TODAY_CANDIDATE",
      sourceId: "nextstep:exercise",
    });
    expect(
      next.todayItems.some((item) => item.sourceId === "nextstep:exercise"),
    ).toBe(false);
    expect(
      next.projects.find((project) => project.id === "exercise")?.nextStep,
    ).toBe("ストレッチをする");
    expect(
      createTodayBuilderCandidates(next).some(
        (item) => item.sourceId === "nextstep:exercise",
      ),
    ).toBe(false);
  });

  it("completes only the timed Today item after confirmation", () => {
    const state = createDemoSeed(fixedNow);
    const running = demoReducer(state, {
      type: "START_TIMER",
      todayItemId: "today-reading",
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });
    const finished = demoReducer(running, { type: "FINISH_TIMER" });
    const next = demoReducer(finished, {
      type: "CONFIRM_TIMER",
      now: fixedNow,
    });
    expect(next.todayItems[1].completed).toBe(true);
    expect(next.todayItems[0]).toEqual(state.todayItems[0]);
  });

  it("updates one project next step without changing other projects", () => {
    const initial = createDemoSeed(fixedNow);
    const state = demoReducer(initial, {
      type: "REMOVE_TODAY_ITEM",
      id: "today-reading",
    });
    const next = demoReducer(state, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "reading",
      nextStep: "次の章を読む",
    });
    expect(
      next.projects.find((project) => project.id === "reading")?.nextStep,
    ).toBe("次の章を読む");
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
    let changed = demoReducer(createDemoSeed(fixedNow), {
      type: "TOGGLE_VICTORY",
    });
    changed = demoReducer(changed, {
      type: "EXCLUDE_TODAY_CANDIDATE",
      sourceId: "nextstep:exercise",
    });
    changed = demoReducer(changed, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "reading",
      nextStep: "変更した一手",
    });
    const fresh = createDemoSeed(new Date("2026-08-15T09:00:00.000Z"));
    expect(demoReducer(changed, { type: "RESET_DEMO", state: fresh })).toEqual(
      fresh,
    );
  });
});

describe("launch simulation", () => {
  it("returns a fixed, duplicate-free sequence for each project", () => {
    expect(launchActionsForProject("reading")).toEqual([
      "読書メモを開く",
      "参考ページを開く",
      "タイマーを開始",
    ]);
    expect(new Set(launchActionsForProject("reading")).size).toBe(
      launchActionsForProject("reading").length,
    );
    expect(launchActionsForProject("unknown")).toEqual([
      "登録した項目を準備",
      "タイマーを開始",
    ]);
  });
});

describe("dictionary search", () => {
  it("matches labels, categories, and aliases", () => {
    expect(
      filterDictionary(DICTIONARY_TILES, "読書").map((tile) => tile.id),
    ).toContain("reading-note");
    expect(
      filterDictionary(DICTIONARY_TILES, "運動").map((tile) => tile.id),
    ).toContain("stretch");
    expect(
      filterDictionary(DICTIONARY_TILES, "調べる").map((tile) => tile.id),
    ).toContain("study-note");
  });

  it("returns every tile for a blank query", () => {
    expect(filterDictionary(DICTIONARY_TILES, "  ")).toHaveLength(
      DICTIONARY_TILES.length,
    );
  });
});
