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

export const DEFAULT_TIMER_MINUTES = 25;

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
        // 次の一手から入れた項目なので、次の一手と同じ名前にする。
        label: "数分だけ読む",
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
        goal: "参考書を1冊終える",
      },
      {
        id: "reading",
        name: "読書",
        color: "amber",
        nextStep: "数分だけ読む",
        goal: "読みたい本を1冊読み終える",
        resumeNote: "3章のp.84から",
      },
      {
        id: "exercise",
        name: "運動",
        color: "green",
        nextStep: "ストレッチをする",
        goal: "毎日少し体を動かす",
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
    timerMinutes: DEFAULT_TIMER_MINUTES,
    // やりたいことと今日の実行は、最初は閉じておく(見出しに件数を出す)。
    sections: {
      nextStep: true,
      wishlist: false,
      activity: false,
    },
  };
}
