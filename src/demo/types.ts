import type { ParsedDemoImport } from "./importDemo";

export type TimerStatus = "idle" | "running" | "paused" | "finished" | "early";

export type DemoVictory = {
  text: string;
  completed: boolean;
};

export type DemoTodayItem = {
  id: string;
  sourceId: string;
  label: string;
  shortMinutes?: number;
  normalMinutes?: number;
  projectId?: string;
  completed: boolean;
};

export type DemoBuilderCandidate = {
  sourceId: string;
  sourceType: "nextStep" | "wishlist";
  label: string;
  projectId?: string;
};

export type DemoCandidate = {
  projectId: string;
  text: string;
  reason: string;
};

export type DemoProject = {
  id: string;
  name: string;
  color: "amber" | "green" | "blue" | "violet";
  nextStep?: string;
  /** v1.6.3: what the project is aiming for (60 chars). */
  goal?: string;
  /** v1.6.3: where to pick the work up next ("次はここから", 80 chars). */
  resumeNote?: string;
};

export type DemoWishlistItem = {
  id: string;
  label: string;
  projectId?: string;
};

export type DemoSession = {
  id: string;
  projectId: string;
  projectName: string;
  label: string;
  minutes: number;
  endedAt: string;
};

export type DemoTimerState = {
  status: TimerStatus;
  /** countdown = 5分/25分のタイマー。measure = 時間を決めずに数える計測。省略時は countdown。 */
  mode?: "countdown" | "measure";
  todayItemId?: string;
  label: string;
  projectId: string;
  projectName: string;
  durationSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
};

export type DemoSectionState = {
  /** 今日の3件の開閉。保存されたデータに無いときは開いている(W21-07)。 */
  today: boolean;
  nextStep: boolean;
  wishlist: boolean;
  activity: boolean;
};

export type DemoState = {
  schemaVersion: 3;
  victory: DemoVictory;
  doNowIndex: number;
  todayItems: DemoTodayItem[];
  candidateExcludedSourceIds: string[];
  projects: DemoProject[];
  wishlist: DemoWishlistItem[];
  sessions: DemoSession[];
  timer: DemoTimerState;
  /** 左の列のタイマーに入れる分数。無いときは 25 と同じに動く。 */
  timerMinutes?: number;
  sections: DemoSectionState;
};

/**
 * Identifies the persisted part of the state. The running timer and the view state
 * (sections, doNowIndex) are left out, so a reload or a repaint never looks like a change.
 * Key order is fixed here so the same data always yields the same string.
 */
export function stateFingerprint(state: DemoState): string {
  return JSON.stringify({
    victory: { text: state.victory.text, completed: state.victory.completed },
    projects: state.projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      nextStep: project.nextStep ?? null,
      goal: project.goal ?? null,
      resumeNote: project.resumeNote ?? null,
    })),
    wishlist: state.wishlist.map((item) => ({
      id: item.id,
      label: item.label,
      projectId: item.projectId ?? null,
    })),
    todayItems: state.todayItems.map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      label: item.label,
      projectId: item.projectId ?? null,
      completed: item.completed,
      shortMinutes: item.shortMinutes ?? null,
      normalMinutes: item.normalMinutes ?? null,
    })),
    candidateExcludedSourceIds: state.candidateExcludedSourceIds,
    sessions: state.sessions.map((session) => ({
      id: session.id,
      projectId: session.projectId,
      projectName: session.projectName,
      label: session.label,
      minutes: session.minutes,
      endedAt: session.endedAt,
    })),
  });
}

export type DemoAction =
  | { type: "UPDATE_VICTORY"; text: string }
  | { type: "TOGGLE_VICTORY" }
  | { type: "ADD_TODAY_ITEM"; item: DemoTodayItem }
  | { type: "REMOVE_TODAY_ITEM"; id: string }
  | { type: "EXCLUDE_TODAY_CANDIDATE"; sourceId: string }
  | { type: "NEXT_TODAY_BATCH" }
  | { type: "ADD_WISHLIST"; id: string; label: string; projectId?: string }
  | {
      type: "SAVE_TODAY_PICKER_DRAFT";
      todayItems: DemoTodayItem[];
      addedWishlist: DemoWishlistItem[];
      expectedFingerprint: string;
    }
  | { type: "UPDATE_PROJECT_NEXT_STEP"; projectId: string; nextStep: string }
  | {
      type: "START_TIMER";
      /** 省略すると 5分/25分のタイマー。measure は時間を決めずに数える。 */
      mode?: "countdown" | "measure";
      todayItemId?: string;
      now?: Date;
      label: string;
      projectId: string;
      projectName: string;
      durationSeconds: number;
    }
  | { type: "SET_TIMER_MINUTES"; minutes: number }
  | { type: "TICK_TIMER" }
  | { type: "ADVANCE_TO_EARLY_THRESHOLD" }
  | { type: "REQUEST_STOP_TIMER"; now: Date }
  | { type: "CONFIRM_EARLY_TIMER"; now: Date; complete: boolean }
  | { type: "FINISH_TIMER" }
  | { type: "EXTEND_TIMER"; minutes: number }
  | {
      type: "CONFIRM_TIMER";
      now: Date;
      nextStep?: string;
      resumeNote?: string;
    }
  | { type: "PAUSE_TIMER" }
  | { type: "RESUME_TIMER" }
  | { type: "STOP_TIMER"; now: Date; complete?: boolean }
  | {
      type: "COMMIT_IMPORT";
      parsed: ParsedDemoImport;
      excludedKeys: string[];
      expectedFingerprint: string;
    }
  | {
      type: "UNDO_IMPORT";
      projects: DemoProject[];
      wishlist: DemoWishlistItem[];
      expectedFingerprint: string;
    }
  | { type: "TOGGLE_SECTION"; section: keyof DemoSectionState }
  | { type: "RESET_DEMO"; state: DemoState };

export type DictionaryTile = {
  id: string;
  label: string;
  category: string;
  aliases: string[];
  icon: "book" | "activity" | "note" | "photo" | "browser";
};
