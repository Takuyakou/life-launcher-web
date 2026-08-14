import type { DemoState, DemoTimerState, DictionaryTile } from "./types";

export const DO_NOW_CANDIDATES = [
  "本を10分だけ読む",
  "ストレッチを5分する",
  "机の上だけ片付ける",
] as const;

export const DICTIONARY_TILES: DictionaryTile[] = [
  { id: "reading-note", label: "読書メモ", category: "読書", aliases: ["本", "メモ"], icon: "book" },
  { id: "stretch", label: "ストレッチ", category: "運動", aliases: ["体", "ほぐす"], icon: "activity" },
  { id: "study-note", label: "学習ノート", category: "学習", aliases: ["調べる", "勉強"], icon: "note" },
  { id: "photos", label: "写真", category: "日常", aliases: ["画像", "アルバム"], icon: "photo" },
  { id: "browser", label: "ブラウザ", category: "ツール", aliases: ["Web", "検索"], icon: "browser" },
];

export const createIdleTimer = (): DemoTimerState => ({
  status: "idle",
  label: "",
  projectId: "",
  projectName: "",
  durationSeconds: 0,
  remainingSeconds: 0,
  elapsedSeconds: 0,
});

export function createDemoSeed(now: Date): DemoState {
  const initialEndedAt = new Date(now.getTime() - 90 * 60 * 1000).toISOString();

  return {
    schemaVersion: 1,
    victory: {
      text: "後回しにしていたことを1つ終わらせる",
      completed: false,
    },
    doNowIndex: 0,
    todayItems: [
      { id: "today-reading", label: "本を10分読む", projectId: "reading", completed: false },
      { id: "today-stretch", label: "ストレッチを5分する", projectId: "exercise", completed: true },
      { id: "today-tidy", label: "机の上を5分片付ける", projectId: "tidy", completed: false },
    ],
    projects: [
      { id: "reading", name: "読書", color: "amber", nextStep: "本を10分だけ読む" },
      { id: "exercise", name: "運動", color: "green", nextStep: "ストレッチを5分する" },
      { id: "tidy", name: "片付け", color: "blue", nextStep: "机の上だけ片付ける" },
      { id: "study", name: "学習", color: "violet", nextStep: "気になっていたことを15分調べる" },
    ],
    wishlist: [
      { id: "wish-book", label: "気になっていた本を読む" },
      { id: "wish-drawer", label: "部屋の引き出しを整理する" },
      { id: "wish-walk", label: "近所をゆっくり歩く" },
    ],
    sessions: [
      {
        id: "session-initial",
        projectId: "exercise",
        projectName: "運動",
        label: "ストレッチを5分する",
        minutes: 5,
        endedAt: initialEndedAt,
      },
    ],
    timer: createIdleTimer(),
    sections: {
      todayBuilder: false,
      wishlist: false,
      activity: true,
    },
  };
}
