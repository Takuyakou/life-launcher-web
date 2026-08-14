export type TimerStatus = "idle" | "running" | "paused";

export type DemoVictory = {
  text: string;
  completed: boolean;
};

export type DemoTodayItem = {
  id: string;
  label: string;
  projectId: string;
  completed: boolean;
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
  schemaVersion: 1;
  victory: DemoVictory;
  doNowIndex: number;
  todayItems: DemoTodayItem[];
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
  | { type: "TOGGLE_TODAY_ITEM"; id: string }
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
