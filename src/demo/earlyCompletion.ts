import type { DemoState } from "./types";

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
        : item.sourceId === `project:${state.timer.projectId}`),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function earlyEligible(state: DemoState) {
  const item = earlyTarget(state);
  return item &&
    state.timer.elapsedSeconds >= earlyThresholdSeconds(item.shortMinutes) &&
    state.timer.elapsedSeconds < state.timer.durationSeconds
    ? item
    : undefined;
}
