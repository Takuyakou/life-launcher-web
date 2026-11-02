import type { DemoCandidate, DemoState } from "./types";
import { nextStepSourceId } from "./todayBuilder";

export function createDoNowCandidates(state: DemoState): DemoCandidate[] {
  return state.projects
    .flatMap((project, order) => {
      if (!project.nextStep) return [];
      const today = state.todayItems.findIndex(
        (item) =>
          !item.completed && item.sourceId === nextStepSourceId(project.id),
      );
      return [
        {
          rank: today >= 0 ? today : state.todayItems.length + order,
          candidate: {
            projectId: project.id,
            text: project.nextStep,
            reason:
              today >= 0
                ? "今日の3件に入っている一手です"
                : `${project.name}に次の一手が設定されているため`,
          },
        },
      ];
    })
    .sort((a, b) => a.rank - b.rank)
    .map(({ candidate }) => candidate);
}
