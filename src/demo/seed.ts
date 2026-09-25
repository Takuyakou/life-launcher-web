import type { DemoState, DemoTimerState, DictionaryTile } from "./types";

export const LAUNCH_ACTIONS: Record<string, string[]> = {
  reading: ["読書メモを開く", "参考ページを開く", "タイマーを開始"],
  exercise: ["ストレッチ手順を開く", "タイマーを開始"],
  tidy: ["片付けメモを開く", "タイマーを開始"],
  study: ["学びノートを開く", "参考ページを開く", "タイマーを開始"],
};

export const launchActionsForProject = (projectId: string): string[] =>
  LAUNCH_ACTIONS[projectId] ?? ["登録した項目を準備", "タイマーを開始"];

export const DICTIONARY_TILES: DictionaryTile[] = [
  {
    id: "reading-note",
    label: "読書メモ",
    category: "読書",
    aliases: ["本", "メモ"],
    icon: "book",
  },
  {
    id: "stretch",
    label: "ストレッチ",
    category: "運動",
    aliases: ["体", "ほぐす"],
    icon: "activity",
  },
  {
    id: "study-note",
    label: "学習ノート",
    category: "学習",
    aliases: ["調べる", "勉強"],
    icon: "note",
  },
  {
    id: "photos",
    label: "写真",
    category: "日常",
    aliases: ["画像", "アルバム"],
    icon: "photo",
  },
  {
    id: "browser",
    label: "ブラウザ",
    category: "ツール",
    aliases: ["Web", "検索"],
    icon: "browser",
  },
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
    schemaVersion: 3,
    victory: {
      text: "後回しにしていたことを1つ終わらせる",
      completed: false,
    },
    doNowIndex: 0,
    todayItems: [
      {
        id: "today-stretch",
        sourceId: "nextstep:exercise",
        label: "ストレッチをする",
        projectId: "exercise",
        completed: true,
        shortMinutes: 5,
        normalMinutes: 25,
      },
      {
        id: "today-reading",
        sourceId: "nextstep:reading",
        label: "本を読む",
        projectId: "reading",
        completed: false,
        shortMinutes: 5,
        normalMinutes: 25,
      },
    ],
    candidateExcludedSourceIds: [],
    projects: [
      {
        id: "study",
        name: "学習",
        color: "violet",
        nextStep: "参考書を10ページ進める",
      },
      { id: "reading", name: "読書", color: "amber", nextStep: "数分だけ読む" },
      {
        id: "exercise",
        name: "運動",
        color: "green",
        nextStep: "ストレッチをする",
      },
    ],
    wishlist: [
      { id: "wish-book", label: "気になっていた本を読む", projectId: "reading" },
      { id: "wish-drawer", label: "英単語を20個復習する", projectId: "study" },
      { id: "wish-walk", label: "近所をゆっくり歩く" },
    ],
    sessions: [
      {
        id: "session-initial",
        projectId: "exercise",
        projectName: "運動",
        label: "ストレッチをする",
        minutes: 5,
        endedAt: initialEndedAt,
      },
    ],
    timer: createIdleTimer(),
    sections: {
      nextStep: true,
      wishlist: false,
      activity: true,
    },
  };
}
