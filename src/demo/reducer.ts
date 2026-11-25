import { createIdleTimer } from "./seed";
import {
  earlyEligible,
  earlyTarget,
  earlyThresholdSeconds,
} from "./earlyCompletion";
import type {
  DemoAction,
  DemoSession,
  DemoState,
  DemoTodayItem,
  DemoWishlistItem,
} from "./types";
import { stateFingerprint } from "./types";
import { applyDemoImport } from "./importDemo";
import {
  nextStepSourceId,
  sourceLockedByUnfinishedToday,
} from "./todayBuilder";

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "UPDATE_VICTORY":
      return { ...state, victory: { ...state.victory, text: action.text } };
    case "TOGGLE_VICTORY":
      return {
        ...state,
        victory: { ...state.victory, completed: !state.victory.completed },
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
            action.sourceId === `nextstep:${state.timer.projectId}`))
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
          {
            id: action.id,
            label: action.label.trim().slice(0, 120),
            projectId: action.projectId,
          },
          ...state.wishlist,
        ],
      };
    case "SAVE_TODAY_PICKER_DRAFT": {
      // The dialog reads the state once and saves once: anything changed meanwhile is refused
      // so a stale draft cannot overwrite newer work.
      if (stateFingerprint(state) !== action.expectedFingerprint) return state;
      const items = action.todayItems;
      if (!Array.isArray(items) || items.length > 3) return state;

      const sourceIds = new Set<string>();
      for (const item of items) {
        if (!item || typeof item.sourceId !== "string" || !item.sourceId)
          return state;
        if (sourceIds.has(item.sourceId)) return state;
        sourceIds.add(item.sourceId);
      }

      const wishlistIds = new Set(state.wishlist.map((item) => item.id));
      const addedWishlist: DemoWishlistItem[] = [];
      for (const wish of action.addedWishlist ?? []) {
        if (!wish || typeof wish.id !== "string" || !wish.id) return state;
        if (wishlistIds.has(wish.id)) return state;
        const label = typeof wish.label === "string" ? wish.label.trim() : "";
        if (!label || label.length > 120) return state;
        if (wish.projectId !== undefined && typeof wish.projectId !== "string")
          return state;
        wishlistIds.add(wish.id);
        addedWishlist.push({ id: wish.id, label, projectId: wish.projectId });
      }

      const projectIds = new Set(state.projects.map((project) => project.id));
      const existingBySource = new Map(
        state.todayItems.map((item) => [item.sourceId, item]),
      );
      const itemIds = new Set(state.todayItems.map((item) => item.id));
      const nextItems: DemoTodayItem[] = [];
      for (const item of items) {
        const existing = existingBySource.get(item.sourceId);
        if (existing) {
          // Only the order may change: keep the snapshot attributes as they were.
          nextItems.push({ ...existing });
          continue;
        }
        if (item.sourceId.startsWith("nextstep:")) {
          if (!projectIds.has(item.sourceId.slice("nextstep:".length)))
            return state;
        } else if (item.sourceId.startsWith("wishlist:")) {
          if (!wishlistIds.has(item.sourceId.slice("wishlist:".length)))
            return state;
        } else {
          return state;
        }
        const label = typeof item.label === "string" ? item.label.trim() : "";
        if (!label) return state;
        const id =
          typeof item.id === "string" && item.id
            ? item.id
            : `today:${item.sourceId}`;
        if (itemIds.has(id)) return state;
        itemIds.add(id);
        nextItems.push({
          id,
          sourceId: item.sourceId,
          label,
          projectId: item.projectId,
          completed: false,
          shortMinutes: item.shortMinutes ?? 5,
          normalMinutes: item.normalMinutes ?? 25,
        });
      }

      // The running timer keeps its card, even if the draft dropped or replaced it.
      if (state.timer.status !== "idle" && state.timer.todayItemId) {
        const before = state.todayItems.find(
          (item) => item.id === state.timer.todayItemId,
        );
        const after = nextItems.find(
          (item) => item.id === state.timer.todayItemId,
        );
        if (!before || !after || after.sourceId !== before.sourceId)
          return state;
      }

      return {
        ...state,
        todayItems: nextItems,
        wishlist: [...addedWishlist, ...state.wishlist],
      };
    }
    case "UPDATE_PROJECT_NEXT_STEP": {
      if (
        sourceLockedByUnfinishedToday(
          state,
          nextStepSourceId(action.projectId),
        )
      )
        return state;
      const nextStep = action.nextStep.trim().slice(0, 120);
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? {
                ...project,
                nextStep,
                // A new generation of the next step retires the "次はここから" note.
                ...(nextStep !== (project.nextStep ?? "")
                  ? { resumeNote: undefined }
                  : {}),
              }
            : project,
        ),
      };
    }
    case "START_TIMER": {
      if (state.timer.status === "early") return state;
      const mode = action.mode ?? "countdown";
      if (
        mode === "countdown" &&
        (!Number.isFinite(action.durationSeconds) ||
          action.durationSeconds < 60 ||
          action.durationSeconds > 7200)
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
          mode,
          todayItemId: action.todayItemId,
          label: action.label,
          projectId: action.projectId,
          projectName: action.projectName,
          durationSeconds:
            mode === "measure" ? 0 : action.durationSeconds,
          remainingSeconds: mode === "measure" ? 0 : action.durationSeconds,
          elapsedSeconds: 0,
        },
      };
    }
    case "SET_TIMER_MINUTES": {
      if (!Number.isFinite(action.minutes)) return state;
      const minutes = Math.min(240, Math.max(1, Math.round(action.minutes)));
      if (minutes === (state.timerMinutes ?? 25)) return state;
      return { ...state, timerMinutes: minutes };
    }
    case "ADVANCE_TO_EARLY_THRESHOLD": {
      if (state.timer.status !== "running" && state.timer.status !== "paused")
        return state;
      const item = earlyTarget(state);
      if (!item) return state;
      const threshold = earlyThresholdSeconds(item.shortMinutes);
      if (
        threshold >= state.timer.durationSeconds ||
        threshold <= state.timer.elapsedSeconds
      )
        return state;
      return {
        ...state,
        timer: {
          ...state.timer,
          elapsedSeconds: threshold,
          remainingSeconds: state.timer.durationSeconds - threshold,
        },
      };
    }
    case "REQUEST_STOP_TIMER": {
      if (state.timer.status !== "running" && state.timer.status !== "paused")
        return state;
      const item = earlyEligible(state);
      return item
        ? {
            ...state,
            timer: { ...state.timer, status: "early", todayItemId: item.id },
          }
        : demoReducer(state, { type: "STOP_TIMER", now: action.now });
    }
    case "CONFIRM_EARLY_TIMER":
      if (state.timer.status !== "early" || !earlyEligible(state)) return state;
      return demoReducer(state, {
        type: "STOP_TIMER",
        now: action.now,
        complete: action.complete,
      });
    case "TICK_TIMER":
      if (state.timer.status !== "running") return state;
      if (state.timer.mode === "measure")
        return {
          ...state,
          timer: {
            ...state.timer,
            elapsedSeconds: state.timer.elapsedSeconds + 1,
          },
        };
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
    case "EXTEND_TIMER": {
      if (state.timer.status !== "finished") return state;
      if (!Number.isFinite(action.minutes)) return state;
      // Windows v1.6.3 allows extending past the 2 hour start limit on purpose.
      const minutes = Math.min(240, Math.max(1, Math.round(action.minutes)));
      const deltaSeconds = minutes * 60;
      return {
        ...state,
        timer: {
          ...state.timer,
          status: "running",
          durationSeconds: state.timer.durationSeconds + deltaSeconds,
          remainingSeconds: state.timer.remainingSeconds + deltaSeconds,
        },
      };
    }
    case "CONFIRM_TIMER": {
      if (state.timer.status !== "finished") return state;
      let completed = demoReducer(state, {
        type: "STOP_TIMER",
        now: action.now,
        complete: true,
      });
      if (action.resumeNote !== undefined) {
        const resumeNote = action.resumeNote.trim().slice(0, 80) || undefined;
        completed = {
          ...completed,
          projects: completed.projects.map((project) =>
            project.id === state.timer.projectId
              ? { ...project, resumeNote }
              : project,
          ),
        };
      }
      return action.nextStep?.trim()
        ? demoReducer(completed, {
            type: "UPDATE_PROJECT_NEXT_STEP",
            projectId: state.timer.projectId,
            nextStep: action.nextStep.trim().slice(0, 120),
          })
        : completed;
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
          ((state.timer.status === "finished" &&
            state.timer.elapsedSeconds >= state.timer.durationSeconds) ||
            (state.timer.status === "early" &&
              earlyEligible(state)?.id === item.id))
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
    case "COMMIT_IMPORT": {
      if (stateFingerprint(state) !== action.expectedFingerprint) return state;
      // Re-read the current projects and wishlist: the preview may be a few seconds old.
      const { projects, wishlist } = applyDemoImport(
        state,
        action.parsed,
        action.excludedKeys,
      );
      return { ...state, projects, wishlist };
    }
    case "UNDO_IMPORT": {
      if (stateFingerprint(state) !== action.expectedFingerprint) return state;
      return { ...state, projects: action.projects, wishlist: action.wishlist };
    }
    case "RESET_DEMO":
      return action.state;
    default:
      return state;
  }
}

export function totalSessionMinutes(state: DemoState): number {
  return state.sessions.reduce((total, session) => total + session.minutes, 0);
}
