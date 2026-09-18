import type { DemoCandidate, DemoState } from "./types";

export function createDoNowCandidates(state: DemoState): DemoCandidate[] {
  return state.projects.flatMap((project) =>
    project.nextStep
      ? [
          {
            projectId: project.id,
            text: project.nextStep,
            reason: `${project.name}に次の一手が設定されているため`,
          },
        ]
      : [],
  );
}
