export type TimerStatus = "idle" | "running" | "paused";

export type DemoVictory = {
  text: string;
  completed: boolean;
};

export type DemoTodayItem = {
  id: string;
  sourceId: string;
  label: string;
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
  nextStep: string;
};

export type DemoWishlistItem = {
  id: string;
  label: string;
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
  label: string;
  projectId: string;
  projectName: string;
  durationSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
};

export type DemoSectionState = {
  todayBuilder: boolean;
  wishlist: boolean;
  activity: boolean;
};

export type DemoState = {
  schemaVersion: 2;
  victory: DemoVictory;
  doNowIndex: number;
  todayItems: DemoTodayItem[];
  candidateExcludedSourceIds: string[];
  projects: DemoProject[];
  wishlist: DemoWishlistItem[];
  sessions: DemoSession[];
  timer: DemoTimerState;
  sections: DemoSectionState;
};

export type DemoAction =
  | { type: "UPDATE_VICTORY"; text: string }
  | { type: "TOGGLE_VICTORY" }
  | { type: "ROTATE_DO_NOW" }
  | { type: "ADD_TODAY_ITEM"; item: DemoTodayItem }
  | { type: "EXCLUDE_TODAY_CANDIDATE"; sourceId: string }
  | { type: "TOGGLE_TODAY_ITEM"; id: string }
  | { type: "UPDATE_PROJECT_NEXT_STEP"; projectId: string; nextStep: string }
  | {
      type: "START_TIMER";
      label: string;
      projectId: string;
      projectName: string;
      durationSeconds: number;
    }
  | { type: "TICK_TIMER" }
  | { type: "PAUSE_TIMER" }
  | { type: "RESUME_TIMER" }
  | { type: "STOP_TIMER"; now: Date }
  | { type: "TOGGLE_SECTION"; section: keyof DemoSectionState }
  | { type: "RESET_DEMO"; state: DemoState };

export type DictionaryTile = {
  id: string;
  label: string;
  category: string;
  aliases: string[];
  icon: "book" | "activity" | "note" | "photo" | "browser";
};
