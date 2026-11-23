import { describe, expect, it } from "vitest";
import { filterDictionary } from "./dictionary";
import { createDoNowCandidates } from "./doNow";
import { demoReducer, totalSessionMinutes } from "./reducer";
import {
  createDemoSeed,
  DICTIONARY_TILES,
  launchActionsForProject,
} from "./seed";
import { stateFingerprint } from "./types";
import type { ParsedDemoImport } from "./importDemo";
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
    state.todayItems = [];
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

describe("v1.6.3 timer and memo rules", () => {
  const start = (state: ReturnType<typeof createDemoSeed>, todayItemId?: string) =>
    demoReducer(state, {
      type: "START_TIMER",
      todayItemId,
      now: fixedNow,
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });

  it("extends only a finished timer and clamps the minutes to 1..240", () => {
    let state = start(createDemoSeed(fixedNow), "today-reading");
    state = demoReducer(state, { type: "FINISH_TIMER" });
    const extended = demoReducer(state, { type: "EXTEND_TIMER", minutes: 10 });
    expect(extended.timer.status).toBe("running");
    expect(extended.timer.durationSeconds).toBe(900);
    expect(extended.timer.remainingSeconds).toBe(600);
    expect(demoReducer(extended, { type: "EXTEND_TIMER", minutes: 5 })).toBe(
      extended,
    );

    const high = demoReducer(state, { type: "EXTEND_TIMER", minutes: 999 });
    expect(high.timer.durationSeconds).toBe(300 + 240 * 60);
    const low = demoReducer(state, { type: "EXTEND_TIMER", minutes: 0 });
    expect(low.timer.durationSeconds).toBe(360);
    expect(demoReducer(state, { type: "EXTEND_TIMER", minutes: Number.NaN })).toBe(
      state,
    );
  });

  it("keeps the completion working after the extension", () => {
    let state = start(createDemoSeed(fixedNow), "today-reading");
    state = demoReducer(state, { type: "FINISH_TIMER" });
    state = demoReducer(state, { type: "EXTEND_TIMER", minutes: 5 });
    state = demoReducer(state, { type: "FINISH_TIMER" });
    state = demoReducer(state, { type: "CONFIRM_TIMER", now: fixedNow });
    expect(
      state.todayItems.find((item) => item.id === "today-reading")?.completed,
    ).toBe(true);
    expect(state.timer.status).toBe("idle");
  });

  it("stores 次はここから on confirmation and drops it with a new next step", () => {
    let state = start(createDemoSeed(fixedNow));
    state = demoReducer(state, { type: "FINISH_TIMER" });
    state = demoReducer(state, {
      type: "CONFIRM_TIMER",
      now: fixedNow,
      resumeNote: "  3章の途中から  ",
    });
    expect(
      state.projects.find((project) => project.id === "reading")?.resumeNote,
    ).toBe("3章の途中から");

    let next = start(createDemoSeed(fixedNow), "today-reading");
    next = demoReducer(next, { type: "FINISH_TIMER" });
    next = demoReducer(next, {
      type: "CONFIRM_TIMER",
      now: fixedNow,
      nextStep: "次の章を開く",
      resumeNote: "消えるはず",
    });
    const reading = next.projects.find((project) => project.id === "reading")!;
    expect(reading.nextStep).toBe("次の章を開く");
    expect(reading.resumeNote).toBeUndefined();
  });

  it("clears the memo only when the next step text actually changes", () => {
    const initial = createDemoSeed(fixedNow);
    const withNote = {
      ...initial,
      projects: initial.projects.map((project) =>
        project.id === "exercise" ? { ...project, resumeNote: "続きから" } : project,
      ),
    };
    const same = demoReducer(withNote, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "exercise",
      nextStep: "ストレッチをする",
    });
    expect(
      same.projects.find((project) => project.id === "exercise")?.resumeNote,
    ).toBe("続きから");
    const changed = demoReducer(withNote, {
      type: "UPDATE_PROJECT_NEXT_STEP",
      projectId: "exercise",
      nextStep: "肩を回す",
    });
    expect(
      changed.projects.find((project) => project.id === "exercise")?.resumeNote,
    ).toBeUndefined();
  });
});

describe("Today picker draft", () => {
  const state = () => createDemoSeed(fixedNow);
  const draftWith = (base: ReturnType<typeof createDemoSeed>, wishId: string) => [
    ...base.todayItems.map((item) => ({ ...item })),
    todayItemFromCandidate({
      sourceId: `wishlist:${wishId}`,
      sourceType: "wishlist",
      label: "新しいやりたいこと",
      projectId: "reading",
    }),
  ];

  it("saves the order and the new Wishlist items in one step", () => {
    const base = state();
    const items = draftWith(base, "w-new");
    const next = demoReducer(base, {
      type: "SAVE_TODAY_PICKER_DRAFT",
      todayItems: [...items].reverse(),
      addedWishlist: [
        { id: "w-new", label: "新しいやりたいこと", projectId: "reading" },
      ],
      expectedFingerprint: stateFingerprint(base),
    });
    expect(next.todayItems.map((item) => item.sourceId)).toEqual([
      "wishlist:w-new",
      "nextstep:reading",
      "nextstep:exercise",
    ]);
    expect(next.wishlist[0]).toMatchObject({ id: "w-new" });
  });

  it("refuses a stale fingerprint, duplicates, and four items", () => {
    const base = state();
    const items = draftWith(base, "w-new");
    expect(
      demoReducer(base, {
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems: items,
        addedWishlist: [],
        expectedFingerprint: "stale",
      }),
    ).toBe(base);
    expect(
      demoReducer(base, {
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems: [base.todayItems[0], base.todayItems[0]],
        addedWishlist: [],
        expectedFingerprint: stateFingerprint(base),
      }),
    ).toBe(base);
    expect(
      demoReducer(base, {
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems: [
          ...base.todayItems,
          todayItemFromCandidate({
            sourceId: "nextstep:study",
            sourceType: "nextStep",
            label: "参考書",
            projectId: "study",
          }),
          todayItemFromCandidate({
            sourceId: "wishlist:wish-walk",
            sourceType: "wishlist",
            label: "散歩",
          }),
        ],
        addedWishlist: [],
        expectedFingerprint: stateFingerprint(base),
      }),
    ).toBe(base);
  });

  it("keeps the snapshot attributes of items that already exist", () => {
    const base = state();
    const next = demoReducer(base, {
      type: "SAVE_TODAY_PICKER_DRAFT",
      todayItems: [
        {
          ...base.todayItems[1],
          id: "hacked-id",
          label: "書き換え",
          completed: true,
          shortMinutes: 99,
          normalMinutes: 120,
        },
        base.todayItems[0],
      ],
      addedWishlist: [],
      expectedFingerprint: stateFingerprint(base),
    });
    expect(next.todayItems[0]).toEqual(base.todayItems[1]);
    expect(next.todayItems[1]).toEqual(base.todayItems[0]);
  });

  it("protects the item the running timer points at", () => {
    const base = state();
    const running = demoReducer(base, {
      type: "START_TIMER",
      todayItemId: "today-reading",
      now: fixedNow,
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });
    const fingerprint = stateFingerprint(running);
    expect(
      demoReducer(running, {
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems: running.todayItems.filter(
          (item) => item.id !== "today-reading",
        ),
        addedWishlist: [],
        expectedFingerprint: fingerprint,
      }),
    ).toBe(running);
    expect(
      demoReducer(running, {
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems: [
          running.todayItems[0],
          {
            ...running.todayItems[1],
            sourceId: "nextstep:study",
            projectId: "study",
          },
        ],
        addedWishlist: [],
        expectedFingerprint: fingerprint,
      }),
    ).toBe(running);
  });

  it("refuses invalid or colliding Wishlist additions", () => {
    const base = state();
    const items = draftWith(base, "w-new");
    for (const wish of [
      { id: "w-new", label: "   " },
      { id: "wish-book", label: "重複" },
      { id: "w-new", label: "あ".repeat(121) },
    ]) {
      expect(
        demoReducer(base, {
          type: "SAVE_TODAY_PICKER_DRAFT",
          todayItems: items,
          addedWishlist: [wish],
          expectedFingerprint: stateFingerprint(base),
        }),
      ).toBe(base);
    }
  });
});

describe("bulk import", () => {
  const parsed: ParsedDemoImport = {
    projects: [
      {
        name: "英語",
        color: "blue",
        goal: "仕事で使える英語",
        nextStep: "単語を20個音読する",
        wishes: ["体験レッスンを予約する"],
      },
    ],
    wishes: ["記事を1本読む"],
    ignoredFields: [],
  };

  it("applies an import without touching the timer, Today 3 or sessions", () => {
    let base = createDemoSeed(fixedNow);
    base = demoReducer(base, {
      type: "START_TIMER",
      todayItemId: "today-reading",
      now: fixedNow,
      label: "本を読む",
      projectId: "reading",
      projectName: "読書",
      durationSeconds: 300,
    });
    const next = demoReducer(base, {
      type: "COMMIT_IMPORT",
      parsed,
      excludedKeys: [],
      expectedFingerprint: stateFingerprint(base),
    });
    expect(next.projects.some((project) => project.name === "英語")).toBe(true);
    expect(next.timer).toEqual(base.timer);
    expect(next.todayItems).toEqual(base.todayItems);
    expect(next.sessions).toEqual(base.sessions);
  });

  it("refuses a stale import and a stale undo", () => {
    const base = createDemoSeed(fixedNow);
    expect(
      demoReducer(base, {
        type: "COMMIT_IMPORT",
        parsed,
        excludedKeys: [],
        expectedFingerprint: "stale",
      }),
    ).toBe(base);
    expect(
      demoReducer(base, {
        type: "UNDO_IMPORT",
        projects: base.projects,
        wishlist: base.wishlist,
        expectedFingerprint: "stale",
      }),
    ).toBe(base);
  });

  it("undo restores only projects and Wishlist", () => {
    const base = createDemoSeed(fixedNow);
    const committed = demoReducer(base, {
      type: "COMMIT_IMPORT",
      parsed,
      excludedKeys: [],
      expectedFingerprint: stateFingerprint(base),
    });
    const undone = demoReducer(committed, {
      type: "UNDO_IMPORT",
      projects: base.projects,
      wishlist: base.wishlist,
      expectedFingerprint: stateFingerprint(committed),
    });
    expect(undone.projects).toEqual(base.projects);
    expect(undone.wishlist).toEqual(base.wishlist);
    expect(undone.sessions).toEqual(committed.sessions);
  });
});
