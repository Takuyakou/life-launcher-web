import { describe, expect, it } from "vitest";
import { earlyThresholdSeconds } from "./earlyCompletion";
import { demoReducer } from "./reducer";
import { createDemoSeed } from "./seed";
import { createTodayBuilderCandidates } from "./todayBuilder";

const now = new Date("2026-09-10T00:00:00Z");
function running(shortMinutes = 3, direct = true) {
  const seed = createDemoSeed(now);
  seed.todayItems[1].shortMinutes = shortMinutes;
  return demoReducer(seed, {
    type: "START_TIMER",
    todayItemId: direct ? "today-reading" : undefined,
    label: "本を読む",
    projectId: "reading",
    projectName: "読書",
    durationSeconds: 1500,
    now,
  });
}
describe("early completion", () => {
  it.each([
    [1, 60],
    [3, 180],
    [5, 300],
    [25, 300],
    [undefined, 300],
    [0, 300],
    [1.5, 300],
    [NaN, 300],
    [241, 300],
  ])("threshold %s", (value, expected) => {
    expect(earlyThresholdSeconds(value)).toBe(expected);
  });
  it.each([true, false])(
    "explicit choice %s preserves sources and records only once",
    (complete) => {
      const initial = running();
      const advanced = demoReducer(initial, {
        type: "ADVANCE_TO_EARLY_THRESHOLD",
      });
      expect(advanced.todayItems[1].completed).toBe(false);
      const pending = demoReducer(advanced, {
        type: "REQUEST_STOP_TIMER",
        now,
      });
      expect(pending.timer.status).toBe("early");
      expect(demoReducer(pending, { type: "TICK_TIMER" })).toBe(pending);
      expect(demoReducer(pending, { type: "FINISH_TIMER" })).toBe(pending);
      const result = demoReducer(pending, {
        type: "CONFIRM_EARLY_TIMER",
        now,
        complete,
      });
      expect(result.todayItems[1].completed).toBe(complete);
      expect(result.projects).toEqual(initial.projects);
      expect(result.wishlist).toEqual(initial.wishlist);
      expect(createTodayBuilderCandidates(result)).toEqual(
        createTodayBuilderCandidates(initial),
      );
      expect(result.sessions).toHaveLength(initial.sessions.length + 1);
      expect(result.sessions.at(-1)?.minutes).toBe(3);
      expect(
        demoReducer(result, { type: "CONFIRM_EARLY_TIMER", now, complete }),
      ).toBe(result);
    },
  );
  it("uses inclusive boundary and planned precedence", () => {
    const state = running();
    state.timer.elapsedSeconds = 179;
    expect(
      demoReducer(state, { type: "REQUEST_STOP_TIMER", now }).timer.status,
    ).toBe("idle");
    state.timer.elapsedSeconds = 180;
    expect(
      demoReducer(state, { type: "REQUEST_STOP_TIMER", now }).timer.status,
    ).toBe("early");
    const finished = demoReducer(state, { type: "FINISH_TIMER" });
    expect(demoReducer(finished, { type: "REQUEST_STOP_TIMER", now })).toBe(
      finished,
    );
  });
  it("matches DoNow uniquely and guards missing source", () => {
    const state = demoReducer(running(3, false), {
      type: "ADVANCE_TO_EARLY_THRESHOLD",
    });
    expect(
      demoReducer(state, { type: "REQUEST_STOP_TIMER", now }).timer.todayItemId,
    ).toBe("today-reading");
    state.timer.todayItemId = "missing";
    expect(
      demoReducer(state, { type: "REQUEST_STOP_TIMER", now }).timer.status,
    ).toBe("idle");
  });
});
