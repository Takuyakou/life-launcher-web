import { createIdleTimer } from "./seed";
import type { DemoAction, DemoSession, DemoState } from "./types";

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "UPDATE_VICTORY":
      return { ...state, victory: { ...state.victory, text: action.text } };
    case "TOGGLE_VICTORY":
      return { ...state, victory: { ...state.victory, completed: !state.victory.completed } };
    case "ROTATE_DO_NOW":
      return { ...state, doNowIndex: (state.doNowIndex + 1) % 3 };
    case "TOGGLE_TODAY_ITEM":
      return {
        ...state,
        todayItems: state.todayItems.map((item) =>
          item.id === action.id ? { ...item, completed: !item.completed } : item,
        ),
      };
    case "START_TIMER":
      return {
        ...state,
        timer: {
          status: "running",
          label: action.label,
          projectId: action.projectId,
          projectName: action.projectName,
          durationSeconds: action.durationSeconds,
          remainingSeconds: action.durationSeconds,
          elapsedSeconds: 0,
        },
      };
    case "TICK_TIMER":
      if (state.timer.status !== "running") return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          remainingSeconds: Math.max(0, state.timer.remainingSeconds - 1),
          elapsedSeconds: state.timer.elapsedSeconds + 1,
        },
      };
    case "PAUSE_TIMER":
      if (state.timer.status !== "running") return state;
      return { ...state, timer: { ...state.timer, status: "paused" } };
    case "RESUME_TIMER":
      if (state.timer.status !== "paused") return state;
      return { ...state, timer: { ...state.timer, status: "running" } };
    case "STOP_TIMER": {
      if (state.timer.status === "idle") return state;
      const session: DemoSession = {
        id: `session-${action.now.getTime()}`,
        projectId: state.timer.projectId,
        projectName: state.timer.projectName || "デモ",
        label: state.timer.label,
        minutes: Math.max(1, Math.ceil(state.timer.elapsedSeconds / 60)),
        endedAt: action.now.toISOString(),
      };
      return { ...state, sessions: [...state.sessions, session], timer: createIdleTimer() };
    }
    case "TOGGLE_SECTION":
      return {
        ...state,
        sections: { ...state.sections, [action.section]: !state.sections[action.section] },
      };
    case "RESET_DEMO":
      return action.state;
    default:
      return state;
  }
}

export function totalSessionMinutes(state: DemoState): number {
  return state.sessions.reduce((total, session) => total + session.minutes, 0);
}
