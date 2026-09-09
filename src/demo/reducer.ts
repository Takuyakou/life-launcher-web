import { createIdleTimer, DO_NOW_CANDIDATES } from "./seed";
import type { DemoAction, DemoSession, DemoState } from "./types";

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "UPDATE_VICTORY":
      return { ...state, victory: { ...state.victory, text: action.text } };
    case "TOGGLE_VICTORY":
      return {
        ...state,
        victory: { ...state.victory, completed: !state.victory.completed },
      };
    case "ROTATE_DO_NOW":
      return {
        ...state,
        doNowIndex: (state.doNowIndex + 1) % DO_NOW_CANDIDATES.length,
      };
    case "ADD_TODAY_ITEM":
      if (
        state.todayItems.length >= 3 ||
        state.todayItems.some((item) => item.sourceId === action.item.sourceId)
      )
        return state;
      return {
        ...state,
        todayItems: [...state.todayItems, { ...action.item }],
      };
    case "REMOVE_TODAY_ITEM":
      if (
        !state.todayItems.some((item) => item.id === action.id) ||
        (state.timer.status !== "idle" && state.timer.todayItemId === action.id)
      )
        return state;
      return {
        ...state,
        todayItems: state.todayItems.filter((item) => item.id !== action.id),
      };
    case "EXCLUDE_TODAY_CANDIDATE":
      if (
        state.timer.status !== "idle" &&
        (state.todayItems.some(
          (item) =>
            item.sourceId === action.sourceId &&
            item.id === state.timer.todayItemId,
        ) ||
          (!state.timer.todayItemId &&
            action.sourceId === `project:${state.timer.projectId}`))
      )
        return state;
      return {
        ...state,
        todayItems: state.todayItems.filter(
          (item) => item.sourceId !== action.sourceId,
        ),
        candidateExcludedSourceIds: Array.from(
          new Set([...state.candidateExcludedSourceIds, action.sourceId]),
        ),
      };
    case "OPEN_BUILDER":
      return { ...state, sections: { ...state.sections, todayBuilder: true } };
    case "NEXT_TODAY_BATCH":
      if (
        state.timer.status !== "idle" ||
        state.todayItems.length !== 3 ||
        !state.todayItems.every((item) => item.completed)
      )
        return state;
      return {
        ...state,
        todayItems: [],
        sections: { ...state.sections, todayBuilder: true },
      };
    case "ADD_WISHLIST":
      if (
        !action.label.trim() ||
        state.wishlist.some((item) => item.id === action.id)
      )
        return state;
      return {
        ...state,
        wishlist: [
          { id: action.id, label: action.label.trim().slice(0, 120) },
          ...state.wishlist,
        ],
      };
    case "UPDATE_PROJECT_NEXT_STEP":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? { ...project, nextStep: action.nextStep }
            : project,
        ),
      };
    case "START_TIMER": {
      if (
        !Number.isFinite(action.durationSeconds) ||
        action.durationSeconds < 60 ||
        action.durationSeconds > 7200
      )
        return state;
      if (
        action.todayItemId &&
        !state.todayItems.some(
          (item) => item.id === action.todayItemId && !item.completed,
        )
      )
        return state;
      const previous =
        state.timer.status === "idle"
          ? state
          : demoReducer(state, {
              type: "STOP_TIMER",
              now: action.now ?? new Date(),
            });
      return {
        ...previous,
        timer: {
          status: "running",
          todayItemId: action.todayItemId,
          label: action.label,
          projectId: action.projectId,
          projectName: action.projectName,
          durationSeconds: action.durationSeconds,
          remainingSeconds: action.durationSeconds,
          elapsedSeconds: 0,
        },
      };
    }
    case "TICK_TIMER":
      if (state.timer.status !== "running") return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          status: state.timer.remainingSeconds <= 1 ? "finished" : "running",
          remainingSeconds: Math.max(0, state.timer.remainingSeconds - 1),
          elapsedSeconds: Math.min(
            state.timer.durationSeconds,
            state.timer.elapsedSeconds + 1,
          ),
        },
      };
    case "FINISH_TIMER":
      if (state.timer.status !== "running" && state.timer.status !== "paused")
        return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          status: "finished",
          remainingSeconds: 0,
          elapsedSeconds: state.timer.durationSeconds,
        },
      };
    case "CONFIRM_TIMER": {
      if (state.timer.status !== "finished") return state;
      const updated = action.nextStep?.trim()
        ? demoReducer(state, {
            type: "UPDATE_PROJECT_NEXT_STEP",
            projectId: state.timer.projectId,
            nextStep: action.nextStep.trim().slice(0, 120),
          })
        : state;
      return demoReducer(updated, {
        type: "STOP_TIMER",
        now: action.now,
        complete: true,
      });
    }
    case "PAUSE_TIMER":
      if (state.timer.status !== "running") return state;
      return { ...state, timer: { ...state.timer, status: "paused" } };
    case "RESUME_TIMER":
      if (state.timer.status !== "paused") return state;
      return { ...state, timer: { ...state.timer, status: "running" } };
    case "STOP_TIMER": {
      if (state.timer.status === "idle") return state;
      const session: DemoSession = {
        id: `session-${action.now.getTime()}-${state.sessions.length}`,
        projectId: state.timer.projectId,
        projectName: state.timer.projectName || "デモ",
        label: state.timer.label,
        minutes: Math.max(1, Math.ceil(state.timer.elapsedSeconds / 60)),
        endedAt: action.now.toISOString(),
      };
      return {
        ...state,
        sessions: [...state.sessions, session],
        todayItems: state.todayItems.map((item) =>
          item.id === state.timer.todayItemId &&
          action.complete &&
          state.timer.status === "finished" &&
          state.timer.elapsedSeconds >= state.timer.durationSeconds
            ? { ...item, completed: true }
            : item,
        ),
        timer: createIdleTimer(),
      };
    }
    case "TOGGLE_SECTION":
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.section]: !state.sections[action.section],
        },
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
