import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createDoNowCandidates } from "../demo/doNow";
import {
  nextStepSourceId,
  sourceLockedByUnfinishedToday,
  wishlistSourceId,
} from "../demo/todayBuilder";
import { earlyTarget, earlyThresholdSeconds } from "../demo/earlyCompletion";
import { DICTIONARY_TILES, launchActionsForProject } from "../demo/seed";
import type {
  DemoAction,
  DemoBuilderCandidate,
  DemoProject,
  DemoState,
  DemoTodayItem,
  DemoWishlistItem,
} from "../demo/types";
import type { ParsedDemoImport } from "../demo/importDemo";
import { DemoImportDialog } from "./DemoImportDialog";
import { DemoTimerPanel } from "./DemoTimerPanel";
import { NextStepDialog } from "./NextStepDialog";
import { TodayPicker } from "./TodayPicker";
import { WishlistDialog } from "./WishlistDialog";
import { UiIcon } from "./UiIcon";
import { DemoSearchPalette } from "./DemoSearchPalette";

type Props = {
  state: DemoState;
  dispatch: (action: DemoAction) => boolean;
  onOpenDictionary: () => void;
  onOpenReset: () => void;
  onNativeOnly: (label: string) => void;
  onStartTimer: (
    label: string,
    projectId: string,
    projectName: string,
    seconds: number,
    todayItemId?: string,
    mode?: "countdown" | "measure",
  ) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onDemoComplete: () => void;
  onAddTodayCandidate: (candidate: DemoBuilderCandidate) => boolean;
  onRemoveTodayItem: (id: string) => boolean;
  onSaveTodayPickerDraft: (
    todayItems: DemoTodayItem[],
    addedWishlist: DemoWishlistItem[],
    expectedFingerprint: string,
  ) => boolean;
  onCommitImport: (
    parsed: ParsedDemoImport,
    excludedKeys: string[],
    expectedFingerprint: string,
    selectedCount: number,
  ) => boolean;
};

type MenuState = {
  kind: "today" | "nextStep" | "wishlist";
  id: string;
  x: number;
  y: number;
} | null;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${(safe % 60).toString().padStart(2, "0")}`;
};

const projectColor = (project?: DemoProject) =>
  project ? `var(--project-${project.color})` : "var(--accent)";

// Windows 版 v1.6.4 の projectIdentity.ts と同じ。アイコンの無いボタンは、
// 名前の頭文字を、id から決まる色の小さな札に入れて見せる。
const AUTO_COLORS = [
  "amber",
  "blue",
  "green",
  "violet",
  "rose",
  "cyan",
  "orange",
  "slate",
] as const;

const autoColor = (id: string) => {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `var(--project-${AUTO_COLORS[hash % AUTO_COLORS.length]})`;
};

const letterGlyph = (label: string) => {
  const first = Array.from(label.trim() || "?")[0] ?? "?";
  return /[a-z]/.test(first) ? first.toUpperCase() : first;
};

type WishlistGroup = {
  key: string;
  name: string;
  color: string;
  project?: DemoProject;
  items: DemoWishlistItem[];
};

// Windows 版 v1.6.4 の groupWishlistForDisplay と同じ並び。
// やりたいことに出てきた順にプロジェクトをまとめ、未分類は最後に置く。
const groupWishlist = (state: DemoState): WishlistGroup[] => {
  const groups = new Map<string, WishlistGroup>();
  for (const item of state.wishlist) {
    const project = state.projects.find((entry) => entry.id === item.projectId);
    const key = project?.id ?? "unassigned";
    const group = groups.get(key) ?? {
      key,
      name: project?.name ?? "未分類",
      color: project ? projectColor(project) : "var(--muted)",
      project,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  const all = [...groups.values()];
  return [
    ...all.filter((group) => group.key !== "unassigned"),
    ...all.filter((group) => group.key === "unassigned"),
  ];
};

const SOURCE_LOCK_REASON =
  "未完了の「今日の3件」に入っているため、完了または外すまで元の登録は変更できません";

export function DemoWindow({
  state,
  dispatch,
  onOpenDictionary,
  onOpenReset,
  onNativeOnly,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onDemoComplete,
  onAddTodayCandidate,
  onRemoveTodayItem,
  onSaveTodayPickerDraft,
  onCommitImport,
}: Props) {
  const [todayPickerOpen, setTodayPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(true);
  const [victoryEditing, setVictoryEditing] = useState(false);
  const [rotate, setRotate] = useState(0);
  const [menu, setMenu] = useState<MenuState>(null);
  const [nextStepEdit, setNextStepEdit] = useState<{
    projectId: string;
    value: string;
  } | null>(null);
  const menuOpenerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);

  const openDialog = useCallback(
    (event: React.MouseEvent, open: (value: boolean) => void) => {
      dialogOpenerRef.current = event.currentTarget as HTMLElement;
      open(true);
    },
    [],
  );

  const closeDialog = useCallback((close: (value: boolean) => void) => {
    close(false);
    const opener = dialogOpenerRef.current;
    dialogOpenerRef.current = null;
    window.requestAnimationFrame(() => opener?.focus());
  }, []);

  const timer = state.timer;
  const timerActive = timer.status !== "idle";
  const timerRunning = timer.status === "running";
  const candidates = createDoNowCandidates(state);
  const doNow =
    candidates.length > 0 ? candidates[rotate % candidates.length] : undefined;
  const doNowProject = state.projects.find(
    (project) => project.id === doNow?.projectId,
  );
  const doNowTodayItem = state.todayItems.find(
    (item) =>
      !item.completed &&
      doNow &&
      item.sourceId === nextStepSourceId(doNow.projectId),
  );
  const completedToday = state.todayItems.filter((item) => item.completed).length;
  const openProject = (projectId: string) => {
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) return;
    setNextStepEdit({ projectId, value: project.nextStep ?? "" });
  };

  useEffect(() => {
    if (!timerActive) return;
    // タイマーが動いている間は、開始ボタンの重複を避けるためメニューを閉じる。
    setMenu(null);
  }, [timerActive]);

  const openMenu = useCallback(
    (
      event: React.MouseEvent,
      kind: NonNullable<MenuState>["kind"],
      id: string,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      menuOpenerRef.current = event.currentTarget as HTMLElement;
      setMenu({
        kind,
        id,
        x: Math.round(rect.left),
        y: Math.round(rect.bottom + 4),
      });
    },
    [],
  );

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenu(null);
    if (restoreFocus) {
      const opener = menuOpenerRef.current;
      menuOpenerRef.current = null;
      window.requestAnimationFrame(() => opener?.focus());
    }
  }, []);

  // 画面の端では、メニューがはみ出さないように内側へ寄せる。
  useLayoutEffect(() => {
    if (!menu) return;
    const node = menuRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gutter = 8;
    const x = Math.min(Math.max(gutter, menu.x), Math.max(gutter, window.innerWidth - rect.width - gutter));
    const y = Math.min(Math.max(gutter, menu.y), Math.max(gutter, window.innerHeight - rect.height - gutter));
    if (x !== menu.x || y !== menu.y) setMenu({ ...menu, x, y });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };
    const onDown = (event: MouseEvent) => {
      const node = event.target as HTMLElement | null;
      if (node?.closest(".dl-menu")) return;
      closeMenu(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [closeMenu, menu]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = useCallback(
    (
      label: string,
      projectId: string,
      projectName: string,
      minutes: number,
      todayItemId?: string,
      mode: "countdown" | "measure" = "countdown",
    ) => {
      onStartTimer(
        label,
        projectId,
        projectName,
        mode === "measure" ? 0 : Math.round(minutes * 60),
        todayItemId,
        mode,
      );
    },
    [onStartTimer],
  );

  const startDoNow = (minutes: number, mode: "countdown" | "measure") => {
    if (!doNow || !doNowProject) return;
    start(
      doNow.text,
      doNow.projectId,
      doNowProject.name,
      minutes,
      doNowTodayItem?.id,
      mode,
    );
  };

  const startTodayItem = (
    item: DemoTodayItem,
    minutes: number,
    mode: "countdown" | "measure",
  ) => {
    const project = state.projects.find((entry) => entry.id === item.projectId);
    start(
      item.label,
      item.projectId ?? "",
      project?.name ?? "デモ",
      minutes,
      item.id,
      mode,
    );
  };

  const advanceMinutes = (() => {
    if (timer.status === "idle") return null;
    const item = earlyTarget(state);
    if (!item) return null;
    const threshold = earlyThresholdSeconds(item.shortMinutes);
    if (timer.mode === "measure") return null;
    if (threshold >= timer.durationSeconds || threshold <= timer.elapsedSeconds)
      return null;
    return threshold / 60;
  })();

  const tomorrow = new Date();
  const dateText = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`;
  const weekday = `${WEEKDAYS[tomorrow.getDay()]}曜日`;

  const victories = state.victory;
  const wishlistGroups = groupWishlist(state);
  const menuProject =
    menu?.kind === "today"
      ? state.todayItems.find((item) => item.id === menu.id)
      : undefined;
  const menuNextStep =
    menu?.kind === "nextStep"
      ? state.projects.find((project) => project.id === menu.id)
      : undefined;
  const menuWishlist =
    menu?.kind === "wishlist"
      ? state.wishlist.find((item) => item.id === menu.id)
      : undefined;

  const candidateFor = (candidate: DemoBuilderCandidate) =>
    onAddTodayCandidate(candidate);

  const todayMenuItems = (() => {
    if (!menuProject) return [];
    const project = state.projects.find(
      (entry) => entry.id === menuProject.projectId,
    );
    const lockedByTimer = timerActive && timer.todayItemId === menuProject.id;
    return [
      {
        label: "編集",
        disabled: !project || lockedByTimer,
        run: () => {
          if (project) setNextStepEdit({ projectId: project.id, value: project.nextStep ?? "" });
        },
      },
      {
        label: "今日の3件から外す",
        disabled: lockedByTimer,
        run: () => {
          onRemoveTodayItem(menuProject.id);
        },
      },
    ];
  })();

  const nextStepMenuItems = (() => {
    if (!menuNextStep) return [];
    const locked = sourceLockedByUnfinishedToday(
      state,
      nextStepSourceId(menuNextStep.id),
    );
    const inToday = state.todayItems.some(
      (item) => item.sourceId === nextStepSourceId(menuNextStep.id),
    );
    const full = state.todayItems.length >= 3;
    return [
      {
        label: "次の一手を編集",
        disabled: locked || (timerActive && timer.projectId === menuNextStep.id),
        // ロック中は、押せない理由を項目の下に出す。
        note: locked ? "未完了の今日の3件に入っているため" : undefined,
        title: locked ? SOURCE_LOCK_REASON : undefined,
        run: () =>
          setNextStepEdit({
            projectId: menuNextStep.id,
            value: menuNextStep.nextStep ?? "",
          }),
      },
      {
        label: "今日の3件に入れる",
        disabled: !menuNextStep.nextStep || inToday || full,
        run: () =>
          candidateFor({
            sourceId: nextStepSourceId(menuNextStep.id),
            sourceType: "nextStep",
            label: menuNextStep.nextStep ?? "",
            projectId: menuNextStep.id,
          }),
      },
    ];
  })();

  const wishlistMenuItems = (() => {
    if (!menuWishlist) return [];
    const inToday = state.todayItems.some(
      (item) => item.sourceId === wishlistSourceId(menuWishlist.id),
    );
    return [
      {
        label: "今日の3件に入れる",
        disabled: inToday || state.todayItems.length >= 3,
        run: () =>
          candidateFor({
            sourceId: wishlistSourceId(menuWishlist.id),
            sourceType: "wishlist",
            label: menuWishlist.label,
            projectId: menuWishlist.projectId,
          }),
      },
    ];
  })();

  const menuItems: {
    label: string;
    disabled: boolean;
    note?: string;
    title?: string;
    run: () => void;
  }[] =
    menu?.kind === "today"
      ? todayMenuItems
      : menu?.kind === "nextStep"
        ? nextStepMenuItems
        : wishlistMenuItems;

  const runMenu = (run: () => void) => {
    closeMenu(false);
    run();
  };

  return (
    <div className="dl-app" data-demo-root="true">
      <header className="dl-topbar">
        <div className="dl-brand">
          <span aria-hidden="true" className="dl-brand-icon">
            L
          </span>
          <span className="dl-brand-name">Life Launcher</span>
        </div>
        <button
          className="dl-search-button"
          onClick={() => setSearchOpen(true)}
          type="button"
        >
          <UiIcon name="search" size={18} />
          <span className="dl-search-label">検索</span>
          <kbd className="dl-key">Ctrl+F</kbd>
        </button>
        <div className="dl-pills">
          <span className="dl-demo-pill">WEB DEMO</span>
          <button className="dl-pill-button" onClick={onOpenReset} type="button">
            <UiIcon name="refresh" size={16} />
            リセット
          </button>
        </div>
      </header>

      <div className="dl-body">
        <aside className="dl-sidebar">
          <div data-zone="1">
            <button
              className="dl-dictionary-button"
              onClick={onOpenDictionary}
              type="button"
            >
              <span className="dl-dictionary-icon">
                <UiIcon name="search" size={16} />
              </span>
              <span className="dl-dictionary-label">辞書を開く</span>
              <kbd className="dl-key dl-key--accent">Ctrl+K</kbd>
            </button>

            <section className="dl-quick">
              <button
                aria-expanded={shortcutsOpen}
                className="dl-quick-head"
                onClick={() => setShortcutsOpen((open) => !open)}
                type="button"
              >
                <UiIcon name={shortcutsOpen ? "chevronDown" : "chevronRight"} size={16} />
                <strong>ショートカット</strong>
                <small>{DICTIONARY_TILES.length}件</small>
              </button>
              {shortcutsOpen ? (
                <ul className="dl-quick-list">
                  {DICTIONARY_TILES.map((tile) => (
                    <li key={tile.id}>
                      <button
                        className="dl-quick-button"
                        onClick={() => onNativeOnly(tile.label)}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="dl-letter-icon"
                          style={{ ["--project-color" as string]: autoColor(tile.id) }}
                        >
                          {letterGlyph(tile.label)}
                        </span>
                        <span>{tile.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <div className="dl-timer-slot" data-zone="6">
            <DemoTimerPanel
              advanceMinutes={advanceMinutes}
              minutes={state.timerMinutes ?? 25}
              onChangeMinutes={(minutes) =>
                dispatch({ type: "SET_TIMER_MINUTES", minutes })
              }
              onDemoComplete={onDemoComplete}
              onDemoAdvance={() =>
                dispatch({ type: "ADVANCE_TO_EARLY_THRESHOLD" })
              }
              onPause={onPauseTimer}
              onResume={onResumeTimer}
              onStop={onStopTimer}
              timer={timer}
            />
          </div>
        </aside>

        <main className="dl-main">
          <div className="dl-header-row">
            <div className="dl-date">
              <span className="dl-date-text">{dateText}</span>
              <span className="dl-weekday">{weekday}</span>
            </div>
            <div className="dl-victory" data-zone="2">
              <UiIcon name="flag" size={16} />
              <span className="dl-victory-label">今日の勝利条件</span>
              {victoryEditing ? (
                <input
                  aria-label="今日の勝利条件"
                  autoFocus
                  className="dl-victory-input"
                  onBlur={() => setVictoryEditing(false)}
                  onChange={(event) =>
                    dispatch({ type: "UPDATE_VICTORY", text: event.target.value })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape")
                      setVictoryEditing(false);
                  }}
                  value={victories.text}
                />
              ) : (
                <button
                  className="dl-victory-text"
                  data-empty={victories.text ? undefined : "true"}
                  data-done={victories.completed ? "true" : undefined}
                  onClick={() => setVictoryEditing(true)}
                  type="button"
                >
                  {victories.text || "今日はこれができれば勝ち"}
                </button>
              )}
              {victories.completed ? (
                <span className="dl-victory-badge">✓ 今日の勝利、達成</span>
              ) : null}
              <input
                aria-label="勝利条件を達成"
                checked={victories.completed}
                className="dl-check"
                disabled={!victories.text}
                onChange={() => dispatch({ type: "TOGGLE_VICTORY" })}
                type="checkbox"
              />
            </div>
          </div>

          <section aria-label="今やる一手" className="dl-donow" data-zone="3">
            {doNow && doNowProject ? (
              <div
                className="dl-donow-card"
                style={{ ["--project-color" as string]: projectColor(doNowProject) }}
              >
                <div className="dl-donow-copy">
                  <div className="dl-donow-kicker">
                    <span aria-hidden="true" className="dl-status-dot" />
                    <h2>今やる一手</h2>
                    <span className="dl-chip">{doNowProject.name}</span>
                    {timerActive && timer.projectId === doNow.projectId ? (
                      <span className="dl-pill dl-pill--running">
                        {timer.status === "paused"
                          ? "一時停止"
                          : timer.mode === "measure"
                            ? "計測中"
                            : "実行中"}
                      </span>
                    ) : null}
                    <span className="dl-donow-reason">{doNow.reason}</span>
                  </div>
                  <strong className="dl-donow-title">{doNow.text}</strong>
                  {doNowProject.resumeNote ? (
                    <p className="dl-donow-resume">
                      <span className="dl-donow-resume-label">次はここから</span>
                      <span className="dl-donow-resume-text">
                        {doNowProject.resumeNote}
                      </span>
                    </p>
                  ) : null}
                  {doNowProject.nextStep ? (
                    <div className="dl-donow-meta">
                      <span>始めると一緒に開く</span>
                      <span className="dl-donow-divider" />
                      {launchActionsForProject(doNowProject.id)
                        .slice(0, 2)
                        .map((label) => (
                          <button
                            className="dl-open-chip"
                            key={label}
                            onClick={() => onNativeOnly(label)}
                            type="button"
                          >
                            {label}
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
                <div className="dl-donow-footer">
                  {timerActive && timer.projectId === doNow.projectId ? (
                    <div className="dl-donow-actions">
                      {timer.mode === "measure" ? (
                        <span className="dl-elapsed">{formatClock(timer.elapsedSeconds)}</span>
                      ) : null}
                      <button
                        className="dl-running-pause"
                        onClick={timerRunning ? onPauseTimer : onResumeTimer}
                        type="button"
                      >
                        <UiIcon name={timerRunning ? "pause" : "play"} size={16} />
                        {timerRunning ? "一時停止" : "再開"}
                      </button>
                      <button
                        className="dl-running-stop"
                        onClick={onStopTimer}
                        type="button"
                      >
                        <UiIcon name="stop" size={16} />
                        終了
                      </button>
                    </div>
                  ) : (
                    <div className="dl-donow-actions">
                      <button
                        className="dl-start dl-start--short"
                        data-demo-do-now-short
                        onClick={() => startDoNow(5, "countdown")}
                        type="button"
                      >
                        <UiIcon name="play" size={16} />
                        <span>5分で始める</span>
                      </button>
                      <button
                        className="dl-start dl-start--normal"
                        data-demo-do-now-normal
                        onClick={() => startDoNow(25, "countdown")}
                        type="button"
                      >
                        <UiIcon name="play" size={16} />
                        <span>通常25分</span>
                      </button>
                      <button
                        className="dl-measure"
                        onClick={() => startDoNow(0, "measure")}
                        type="button"
                      >
                        <UiIcon name="clock" size={14} />
                        <span>計測</span>
                      </button>
                      <div className="dl-donow-secondary">
                        {candidates.length > 1 ? (
                          <button
                            className="dl-alternate"
                            onClick={() =>
                              setRotate((index) => (index + 1) % candidates.length)
                            }
                            type="button"
                          >
                            <UiIcon name="refresh" size={12} />
                            他の一手
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="dl-donow-empty">
                <div className="dl-empty-copy">
                  <strong>今は他に提案できる一手がありません。</strong>
                  <span>取り組んだ一手は、もう一度候補を見ると表示できます。</span>
                </div>
              </div>
            )}
          </section>

          <section className="dl-today" data-zone="4">
            <button
              aria-expanded={state.sections.nextStep === undefined ? true : undefined}
              className="dl-section-bar"
              onClick={() => dispatch({ type: "TOGGLE_SECTION", section: "nextStep" })}
              type="button"
            >
              <span className="dl-section-disclosure">
                <UiIcon
                  name={state.sections.nextStep === false ? "chevronRight" : "chevronDown"}
                  size={16}
                />
                <h2>今日の3件</h2>
              </span>
              {/* Windows 版と同じく、見えるのは片方だけ。空のときは「0件」、
                  1件以上のときは「1 / 2 完了」。もう片方は読み上げ用に残す。 */}
              <span
                className="dl-section-count"
                data-quiet={state.todayItems.length > 0 ? "true" : undefined}
              >
                {state.todayItems.length}件
              </span>
              <span
                className="dl-section-summary"
                data-quiet={state.todayItems.length === 0 ? "true" : undefined}
              >
                {completedToday} / {state.todayItems.length} 完了
              </span>
              <span className="dl-section-description">
                今日やると決めたもの。タイマーから開始します。
              </span>
            </button>

            <div className="dl-today-grid">
              {state.todayItems.map((item) => {
                const project = state.projects.find(
                  (entry) => entry.id === item.projectId,
                );
                const isCurrent =
                  !!doNow &&
                  item.sourceId === nextStepSourceId(doNow.projectId) &&
                  !item.completed;
                const itemRunning =
                  timerActive && timer.todayItemId === item.id;
                return (
                  <article
                    aria-label={item.label}
                    className="dl-today-card"
                    data-complete={item.completed ? "true" : undefined}
                    data-running={itemRunning ? "true" : undefined}
                    key={item.id}
                    style={{ ["--project-color" as string]: projectColor(project) }}
                  >
                    <span
                      className="dl-today-status"
                      data-complete={item.completed ? "true" : undefined}
                    >
                      {item.completed ? "✓" : "○"}
                    </span>
                    <div className="dl-today-copy">
                      <span className="dl-today-meta">
                        <span className="dl-identity">
                          <span aria-hidden="true" className="dl-identity-dot" />
                          {project?.name ?? "未分類"}
                        </span>
                      </span>
                      <button
                        className="dl-today-text"
                        data-done={item.completed ? "true" : undefined}
                        onClick={() => openProject(item.projectId ?? "")}
                        type="button"
                      >
                        {item.label}
                      </button>
                    </div>
                    <div className="dl-today-top-actions">
                      {isCurrent ? (
                        <span
                          aria-label="今やる一手"
                          className="dl-pill dl-pill--project"
                          role="status"
                        >
                          今やる一手
                        </span>
                      ) : null}
                      <button
                        aria-label="操作メニュー"
                        className="dl-row-menu"
                        onClick={(event) => openMenu(event, "today", item.id)}
                        title="操作メニュー"
                        type="button"
                      >
                        …
                      </button>
                    </div>
                    <div className="dl-today-footer">
                      {itemRunning ? (
                        <div className="dl-today-timer">
                          {timer.mode === "measure" ? (
                            <span className="dl-elapsed">
                              {formatClock(timer.elapsedSeconds)}
                            </span>
                          ) : null}
                          <button
                            className="dl-start dl-start--ghost"
                            onClick={timerRunning ? onPauseTimer : onResumeTimer}
                            type="button"
                          >
                            {timerRunning ? "一時停止" : "再開"}
                          </button>
                          <button
                            className="dl-start dl-start--stop"
                            onClick={onStopTimer}
                            type="button"
                          >
                            終了
                          </button>
                        </div>
                      ) : item.completed ? (
                        <span className="dl-today-complete-label">今日の分は完了</span>
                      ) : (
                        <div className="dl-today-actions">
                          <button
                            className="dl-start dl-start--short"
                            disabled={!item.label.trim()}
                            onClick={() => startTodayItem(item, item.shortMinutes ?? 5, "countdown")}
                            type="button"
                          >
                            <UiIcon name="play" size={12} />
                            <span>{item.shortMinutes ?? 5}分</span>
                          </button>
                          <button
                            className="dl-start dl-start--normal"
                            disabled={!item.label.trim()}
                            onClick={() => startTodayItem(item, item.normalMinutes ?? 25, "countdown")}
                            type="button"
                          >
                            <UiIcon name="play" size={12} />
                            <span>{item.normalMinutes ?? 25}分</span>
                          </button>
                          <button
                            aria-label="時間を決めずに計測"
                            className="dl-measure dl-measure--small"
                            disabled={!item.label.trim()}
                            onClick={() => startTodayItem(item, 0, "measure")}
                            title="時間を決めずに計測"
                            type="button"
                          >
                            <UiIcon name="clock" size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {state.todayItems.length < 3 ? (
                <button
                  className="dl-today-add"
                  onClick={(event) => openDialog(event, setTodayPickerOpen)}
                  type="button"
                >
                  <span className="dl-today-add-visual">
                    <UiIcon name="add" size={14} />
                    今日やるものを選ぶ
                  </span>
                </button>
              ) : null}
            </div>
          </section>

          <div data-zone="5">
            <section className="dl-next">
              <div className="dl-section-bar dl-section-bar--plain">
                <button
                  aria-expanded={state.sections.nextStep !== false}
                  className="dl-section-disclosure"
                  onClick={() =>
                    dispatch({ type: "TOGGLE_SECTION", section: "nextStep" })
                  }
                  type="button"
                >
                  <UiIcon
                    name={state.sections.nextStep === false ? "chevronRight" : "chevronDown"}
                    size={16}
                  />
                  <h2>次の一手</h2>
                </button>
                <span className="dl-section-count">{state.projects.length}件</span>
                <span className="dl-section-description">
                  迷ったときに戻る再開地点。プロジェクトごとに1つだけ設定。
                </span>
                <div className="dl-section-actions">
                  <button
                    className="dl-ghost-button"
                    onClick={(event) => openDialog(event, setImportOpen)}
                    title="ChatGPTやClaudeに作ってもらった内容を、まとめて足します"
                    type="button"
                  >
                    ＋ まとめて取り込む
                  </button>
                </div>
              </div>

              {state.sections.nextStep !== false ? (
                <div className="dl-next-list">
                  {state.projects.map((project) => {
                    const locked = sourceLockedByUnfinishedToday(
                      state,
                      nextStepSourceId(project.id),
                    );
                    const inToday = state.todayItems.some(
                      (item) => item.sourceId === nextStepSourceId(project.id),
                    );
                    return (
                      <article
                        className="dl-next-row"
                        key={project.id}
                        style={{ ["--project-color" as string]: projectColor(project) }}
                      >
                        <div className="dl-next-project">
                          <span className="dl-identity dl-identity--project">
                            <span aria-hidden="true" className="dl-identity-dot" />
                            {project.name}
                          </span>
                        </div>
                        <div className="dl-next-action">
                          <div className="dl-next-text">
                            {project.nextStep ? (
                              <p title={project.nextStep}>
                                {project.resumeNote ? (
                                  <span className="dl-next-resume">
                                    {project.resumeNote} ▸{" "}
                                  </span>
                                ) : null}
                                {project.nextStep}
                              </p>
                            ) : (
                              <button
                                className="dl-next-placeholder"
                                onClick={() => openProject(project.id)}
                                type="button"
                              >
                                次の一手を設定
                              </button>
                            )}
                          </div>
                          <div className="dl-next-meta">
                            {locked ? (
                              <span
                                aria-label="今日の3件で使用中のためロック中"
                                className="dl-lock"
                                tabIndex={0}
                                title={SOURCE_LOCK_REASON}
                              >
                                <UiIcon name="lock" size={16} />
                              </span>
                            ) : null}
                            {inToday ? (
                              <span className="dl-today-chip">✓ 今日の3件</span>
                            ) : null}
                            {project.nextStep && !locked ? (
                              <button
                                className="dl-small dl-next-today-add"
                                disabled={inToday || state.todayItems.length >= 3}
                                onClick={() =>
                                  candidateFor({
                                    sourceId: nextStepSourceId(project.id),
                                    sourceType: "nextStep",
                                    label: project.nextStep ?? "",
                                    projectId: project.id,
                                  })
                                }
                                title={
                                  inToday
                                    ? "今日の3件にあります"
                                    : state.todayItems.length >= 3
                                      ? "今日の3件は3件埋まっています"
                                      : "今日の3件に追加"
                                }
                                type="button"
                              >
                                ＋ 今日へ
                              </button>
                            ) : null}
                          </div>
                          <button
                            aria-label="操作メニュー"
                            className="dl-row-menu dl-row-menu--next"
                            onClick={(event) => openMenu(event, "nextStep", project.id)}
                            title="操作メニュー"
                            type="button"
                          >
                            …
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section className="dl-wishlist">
              <div className="dl-section-bar dl-section-bar--plain">
                <button
                  aria-expanded={state.sections.wishlist}
                  className="dl-section-disclosure"
                  onClick={() => dispatch({ type: "TOGGLE_SECTION", section: "wishlist" })}
                  type="button"
                >
                  <UiIcon
                    name={state.sections.wishlist ? "chevronDown" : "chevronRight"}
                    size={16}
                  />
                  <h2>やりたいこと</h2>
                </button>
                <span className="dl-section-count">{state.wishlist.length}件</span>
                {state.sections.wishlist ? (
                  <span className="dl-section-description">
                    他にやりたいこと。今日やるものは「今日の3件」から選べます。
                  </span>
                ) : (
                  <span
                    className="dl-section-description dl-group-summary"
                    title={wishlistGroups
                      .map((group) => `${group.name} ${group.items.length}件`)
                      .join("、")}
                  >
                    {wishlistGroups.map((group) => (
                      <span className="dl-group-summary-item" key={group.key}>
                        <span
                          aria-hidden="true"
                          className="dl-group-summary-dot"
                          style={{ background: group.color }}
                        />
                        {group.name} {group.items.length}件
                      </span>
                    ))}
                  </span>
                )}
                <div className="dl-section-actions">
                  <button
                    className="dl-small"
                    onClick={(event) => openDialog(event, setWishlistOpen)}
                    type="button"
                  >
                    ＋ やりたいこと
                  </button>
                </div>
              </div>

              {state.sections.wishlist ? (
                <div className="dl-wishlist-body">
                  {wishlistGroups.map((group) => (
                    <div className="dl-wishlist-group" key={group.key}>
                      <div className="dl-wishlist-head">
                        {group.project ? (
                          <span className="dl-identity">
                            <span
                              aria-hidden="true"
                              className="dl-identity-dot"
                              style={{ background: group.color }}
                            />
                            {group.name}
                          </span>
                        ) : (
                          <strong>{group.name}</strong>
                        )}
                        <span className="dl-wishlist-count">{group.items.length}件</span>
                      </div>
                      <ul className="dl-wishlist-list">
                        {group.items.map((item) => (
                          <WishlistRow
                            item={item}
                            key={item.id}
                            onMenu={openMenu}
                            projectColor={group.color}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <section className="dl-activity">
            <div className="dl-section-bar dl-section-bar--plain">
              <button
                aria-expanded={state.sections.activity}
                className="dl-section-disclosure"
                onClick={() => dispatch({ type: "TOGGLE_SECTION", section: "activity" })}
                type="button"
              >
                <UiIcon
                  name={state.sections.activity ? "chevronDown" : "chevronRight"}
                  size={16}
                />
                <h2>今日の実行</h2>
              </button>
              <span className="dl-section-count">{state.sessions.length}件</span>
              <span className="dl-section-description">タイマーで実行した内容</span>
              <span
                className="dl-pill dl-pill--good dl-auto-badge"
                title="タイマーで実行した内容を自動で記録します"
              >
                自動
              </span>
            </div>
            {state.sections.activity ? (
              <div className="dl-activity-body">
                {state.sessions.length === 0 ? (
                  <p className="dl-quiet">今日はまだ実行記録がありません。</p>
                ) : (
                  <ul className="dl-activity-list">
                    {[...state.sessions].reverse().map((session) => (
                      <li className="dl-activity-row" key={session.id}>
                        <span className="dl-activity-identity">
                          <span className="dl-identity">
                            <span aria-hidden="true" className="dl-identity-dot" />
                            {session.projectName}
                          </span>
                          <span className="dl-activity-label">{session.label}</span>
                        </span>
                        <span className="dl-activity-time">
                          {new Date(session.endedAt).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <strong>{session.minutes}分</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </section>
        </main>
      </div>

      {menu ? (
        <div
          aria-label="操作メニュー"
          className="dl-menu"
          ref={menuRef}
          role="menu"
          style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
        >
          {menuItems.map((item) => (
            <button
              className="dl-menu-item"
              disabled={item.disabled}
              key={item.label}
              onClick={() => runMenu(item.run)}
              role="menuitem"
              title={item.title}
              type="button"
            >
              <span className="dl-menu-label">{item.label}</span>
              {item.note ? <span className="dl-menu-note">{item.note}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {searchOpen ? (
        <DemoSearchPalette
          onClose={() => setSearchOpen(false)}
          onOpenDictionary={onOpenDictionary}
          onSelectNextStep={(projectId) => {
            const project = state.projects.find((entry) => entry.id === projectId);
            if (!project?.nextStep) return;
            start(project.nextStep, project.id, project.name, 5);
            setSearchOpen(false);
          }}
          onSelectWishlist={(wishlistId) => {
            const item = state.wishlist.find((entry) => entry.id === wishlistId);
            if (!item) return;
            candidateFor({
              sourceId: wishlistSourceId(item.id),
              sourceType: "wishlist",
              label: item.label,
              projectId: item.projectId,
            });
            setSearchOpen(false);
          }}
          onSelectTile={(label) => {
            onNativeOnly(label);
            setSearchOpen(false);
          }}
          state={state}
        />
      ) : null}

      {todayPickerOpen ? (
        <TodayPicker
          onClose={() => closeDialog(setTodayPickerOpen)}
          onSave={(items, added, fingerprint) =>
            onSaveTodayPickerDraft(items, added, fingerprint)
          }
          state={state}
        />
      ) : null}

      {wishlistOpen ? (
        <WishlistDialog
          onClose={() => closeDialog(setWishlistOpen)}
          onSave={(label) =>
            dispatch({
              type: "ADD_WISHLIST",
              id: `wish-${Date.now()}`,
              label,
            })
          }
        />
      ) : null}

      {nextStepEdit ? (
        <NextStepDialog
          initialValue={nextStepEdit.value}
          onClose={() => setNextStepEdit(null)}
          onSave={(value) =>
            dispatch({
              type: "UPDATE_PROJECT_NEXT_STEP",
              projectId: nextStepEdit.projectId,
              nextStep: value,
            })
          }
          projectName={
            state.projects.find((project) => project.id === nextStepEdit.projectId)
              ?.name ?? ""
          }
        />
      ) : null}

      {importOpen ? (
        <DemoImportDialog
          onClose={() => closeDialog(setImportOpen)}
          onCommit={onCommitImport}
          state={state}
        />
      ) : null}
    </div>
  );
}

function WishlistRow({
  item,
  onMenu,
  projectColor: color,
}: {
  item: DemoWishlistItem;
  onMenu: (event: React.MouseEvent, kind: "wishlist", id: string) => void;
  projectColor: string;
}) {
  return (
    <li
      className="dl-wishlist-row"
      style={{ ["--project-color" as string]: color }}
    >
      <span className="dl-wishlist-text">{item.label}</span>
      <button
        aria-label="操作メニュー"
        className="dl-row-menu dl-row-menu--wish"
        onClick={(event) => onMenu(event, "wishlist", item.id)}
        title="操作メニュー"
        type="button"
      >
        …
      </button>
    </li>
  );
}
