import type { DemoState } from "./types";
import { nextStepSourceId } from "./todayBuilder";

export function earlyThresholdSeconds(snapshot: unknown): number {
  const minutes =
    typeof snapshot === "number" &&
    Number.isInteger(snapshot) &&
    snapshot >= 1 &&
    snapshot <= 240
      ? snapshot
      : 5;
  return Math.min(5, minutes) * 60;
}

export function earlyTarget(state: DemoState) {
  const matches = state.todayItems.filter(
    (item) =>
      !item.completed &&
      (state.timer.todayItemId
        ? item.id === state.timer.todayItemId
        : item.sourceId === nextStepSourceId(state.timer.projectId)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function earlyEligible(state: DemoState) {
  const item = earlyTarget(state);
  if (!item) return undefined;
  // 計測(時間を決めない)では満了が無いので、経過がしきい値を超えていれば聞く。
  const withinWindow =
    state.timer.mode === "measure" ||
    state.timer.elapsedSeconds < state.timer.durationSeconds;
  return state.timer.elapsedSeconds >= earlyThresholdSeconds(item.shortMinutes) &&
    withinWindow
    ? item
    : undefined;
}
