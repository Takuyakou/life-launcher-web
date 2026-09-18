import type { DemoBuilderCandidate, DemoState, DemoTodayItem } from "./types";

export const nextStepSourceId = (projectId: string): string =>
  `nextstep:${projectId}`;

export const wishlistSourceId = (wishlistId: string): string =>
  `wishlist:${wishlistId}`;

export const sourceLockedByUnfinishedToday = (
  state: DemoState,
  sourceId: string,
): boolean =>
  state.todayItems.some(
    (item) => item.sourceId === sourceId && !item.completed,
  );

export function createTodayBuilderCandidates(
  state: DemoState,
): DemoBuilderCandidate[] {
  const excluded = new Set(state.candidateExcludedSourceIds);
  return [
    ...state.projects.map((project) => ({
      sourceId: nextStepSourceId(project.id),
      sourceType: "nextStep" as const,
      label: project.nextStep ?? "",
      projectId: project.id,
    })),
    ...state.wishlist.map((item) => ({
      sourceId: wishlistSourceId(item.id),
      sourceType: "wishlist" as const,
      label: item.label,
      projectId: item.projectId,
    })),
  ].filter(
    (candidate) => candidate.label.trim() && !excluded.has(candidate.sourceId),
  );
}

export function todayItemFromCandidate(
  candidate: DemoBuilderCandidate,
): DemoTodayItem {
  return {
    id: `today:${candidate.sourceId}`,
    sourceId: candidate.sourceId,
    label: candidate.label,
    projectId: candidate.projectId,
    completed: false,
    shortMinutes: 5,
    normalMinutes: 25,
  };
}
