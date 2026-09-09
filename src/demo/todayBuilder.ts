import type { DemoBuilderCandidate, DemoState, DemoTodayItem } from "./types";

export function createTodayBuilderCandidates(
  state: DemoState,
): DemoBuilderCandidate[] {
  const excluded = new Set(state.candidateExcludedSourceIds);
  return [
    ...state.projects.map((project) => ({
      sourceId: `project:${project.id}`,
      sourceType: "nextStep" as const,
      label: project.nextStep,
      projectId: project.id,
    })),
    ...state.wishlist.map((item) => ({
      sourceId: `wishlist:${item.id}`,
      sourceType: "wishlist" as const,
      label: item.label,
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
