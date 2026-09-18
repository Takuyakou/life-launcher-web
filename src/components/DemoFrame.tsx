import { useCallback, useEffect, useRef, useState } from "react";
import { DO_NOW_CANDIDATES, launchActionsForProject } from "../demo/seed";
import {
  createTodayBuilderCandidates,
  nextStepSourceId,
  sourceLockedByUnfinishedToday,
  wishlistSourceId,
} from "../demo/todayBuilder";
import { earlyTarget, earlyThresholdSeconds } from "../demo/earlyCompletion";
import type {
  DemoAction,
  DemoBuilderCandidate,
  DemoSectionState,
  DemoState,
} from "../demo/types";
import { DemoTimer } from "./DemoTimer";
import { NextStepDialog } from "./NextStepDialog";
import { TimerActions } from "./TimerActions";
import { TodayPicker } from "./TodayPicker";
import { WishlistDialog } from "./WishlistDialog";
import { UiIcon } from "./UiIcon";

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
  ) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onDemoComplete: () => void;
  onAddTodayCandidate: (candidate: DemoBuilderCandidate) => boolean;
  onRemoveTodayItem: (id: string) => boolean;
};

export function DemoFrame({
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
}: Props) {
  const [editingVictory, setEditingVictory] = useState(false);
  const [victoryDraft, setVictoryDraft] = useState(state.victory.text);
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [todayPickerOpen, setTodayPickerOpen] = useState(false);
  const [editingNextStepId, setEditingNextStepId] = useState<string | null>(
    null,
  );
  const victoryEditButtonRef = useRef<HTMLButtonElement>(null);
  const victoryInputRef = useRef<HTMLInputElement>(null);
  const wishlistAddRef = useRef<HTMLButtonElement>(null);
  const todayPickerTriggerRef = useRef<HTMLButtonElement>(null);
  const doNowCandidate =
    DO_NOW_CANDIDATES[state.doNowIndex % DO_NOW_CANDIDATES.length] ??
    DO_NOW_CANDIDATES[0];
  const doNowProject = state.projects.find(
    (project) => project.id === doNowCandidate.projectId,
  );
  const doNowText = doNowProject?.nextStep ?? doNowCandidate.text;
  const doNowStatus =
    !state.timer.todayItemId &&
    state.timer.projectId === doNowCandidate.projectId
      ? state.timer.status
      : "idle";
  const candidates = createTodayBuilderCandidates(state);
  const selectedSourceIds = new Set(
    state.todayItems.map((item) => item.sourceId),
  );
  const editingNextStepProject = state.projects.find(
    (project) => project.id === editingNextStepId,
  );
  const wishlistGroups = [
    ...state.projects
      .map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        items: state.wishlist.filter((item) => item.projectId === project.id),
      }))
      .filter((group) => group.items.length > 0),
    {
      id: "unassigned",
      name: "未分類",
      color: undefined,
      items: state.wishlist.filter((item) => !item.projectId),
    },
  ].filter((group) => group.items.length > 0);
  const completedCount = state.todayItems.filter(
    (item) => item.completed,
  ).length;
  const allThreeCompleted =
    state.todayItems.length === 3 && completedCount === 3;
  const launchActions =
    state.timer.status === "idle"
      ? []
      : launchActionsForProject(state.timer.projectId);
  const timerHandlers = {
    onPause: onPauseTimer,
    onResume: onResumeTimer,
    onStop: onStopTimer,
  };
  useEffect(() => {
    if (editingVictory) victoryInputRef.current?.focus();
  }, [editingVictory]);
  useEffect(() => setVictoryDraft(state.victory.text), [state.victory.text]);
  const finishVictoryEdit = () => {
    setEditingVictory(false);
    requestAnimationFrame(() => victoryEditButtonRef.current?.focus());
  };
  const saveVictory = () => {
    const text = victoryDraft.trim();
    if (
      text &&
      text !== state.victory.text &&
      !dispatch({ type: "UPDATE_VICTORY", text })
    )
      return;
    setVictoryDraft(text || state.victory.text);
    finishVictoryEdit();
  };
  const openTodayPicker = (nextBatch = false) => {
    if (nextBatch && !dispatch({ type: "NEXT_TODAY_BATCH" })) return;
    setTodayPickerOpen(true);
  };
  const closeTodayPicker = useCallback(() => {
    setTodayPickerOpen(false);
    requestAnimationFrame(() => todayPickerTriggerRef.current?.focus());
  }, []);
  const sectionToggle = (
    section: keyof DemoSectionState,
    title: string,
    count: string,
    description: string,
  ) => (
    <button
      type="button"
      className="section-toggle"
      aria-expanded={state.sections[section]}
      aria-controls={`section-${section}`}
      onClick={() => dispatch({ type: "TOGGLE_SECTION", section })}
    >
      <span className="chevron" aria-hidden="true">
        ›
      </span>
      <strong>{title}</strong>
      <span className="section-count">{count}</span>
      <small>{description}</small>
    </button>
  );

  return (
    <div
      className="demo-window sync-demo"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k" &&
          event.target instanceof HTMLElement &&
          !event.target.closest(
            'input, textarea, [contenteditable="true"], [role="dialog"]',
          )
        ) {
          event.preventDefault();
          onOpenDictionary();
        }
      }}
    >
      <header className="demo-titlebar">
        <div className="demo-brand">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>Life Launcher</span>
        </div>
        <div className="demo-toolbar">
          <span className="demo-badge">WEB DEMO</span>
          <button
            className="toolbar-button"
            onClick={onOpenDictionary}
            type="button"
          >
            <UiIcon name="book" size={16} /> 辞書
          </button>
          <button
            className="toolbar-button"
            onClick={onOpenReset}
            type="button"
          >
            <UiIcon name="reset" size={16} /> リセット
          </button>
        </div>
      </header>
      <div className="demo-layout">
        <aside className="quick-sidebar">
          <div className="quick-heading">
            <small>Life Launcher</small>
            <strong>Quick</strong>
          </div>
          <button
            className="dictionary-open"
            onClick={onOpenDictionary}
            type="button"
          >
            辞書を開く <kbd>Ctrl+K</kbd>
          </button>
          <div className="quick-group">
            <p>
              ショートカット <span>3</span>
            </p>
            {["ブラウザ", "メモ", "写真"].map((label, index) => (
              <button
                key={label}
                onClick={() => onNativeOnly(label)}
                type="button"
              >
                <span
                  className={`quick-symbol quick-symbol-${index + 1}`}
                  aria-hidden="true"
                />
                {label}
              </button>
            ))}
          </div>
          <DemoTimer
            onDemoAdvance={() =>
              dispatch({ type: "ADVANCE_TO_EARLY_THRESHOLD" })
            }
            canAdvance={
              Boolean(earlyTarget(state)) &&
              earlyThresholdSeconds(earlyTarget(state)?.shortMinutes) <
                state.timer.durationSeconds &&
              state.timer.elapsedSeconds <
                earlyThresholdSeconds(earlyTarget(state)?.shortMinutes)
            }
            onDemoComplete={onDemoComplete}
            onPause={onPauseTimer}
            onResume={onResumeTimer}
            onStop={onStopTimer}
            timer={state.timer}
          />
        </aside>
        <main className="demo-main">
          <div className="demo-day-header">
            <div>
              <span>今日</span>
              <strong>
                {state.sessions.reduce(
                  (sum, session) => sum + session.minutes,
                  0,
                )}
                分
              </strong>
            </div>
            <time dateTime={new Date().toISOString().slice(0, 10)}>
              {new Intl.DateTimeFormat("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              }).format(new Date())}
            </time>
          </div>
          <section className="victory-card" aria-labelledby="victory-heading">
            <div className="victory-icon" aria-hidden="true">
              🏆
            </div>
            <input
              aria-label="今日の勝利条件を完了"
              checked={state.victory.completed}
              onChange={() => dispatch({ type: "TOGGLE_VICTORY" })}
              type="checkbox"
            />
            <div className="victory-content">
              <div className="section-kicker" id="victory-heading">
                今日の勝利条件
              </div>
              {editingVictory ? (
                <form
                  className="victory-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveVictory();
                  }}
                >
                  <input
                    aria-label="勝利条件"
                    maxLength={120}
                    onChange={(event) => setVictoryDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setVictoryDraft(state.victory.text);
                        finishVictoryEdit();
                      }
                    }}
                    ref={victoryInputRef}
                    value={victoryDraft}
                  />
                  <button className="button button-gold" type="submit">
                    保存
                  </button>
                </form>
              ) : (
                <div className="victory-value-row">
                  <strong
                    className={state.victory.completed ? "is-complete" : ""}
                  >
                    {state.victory.text}
                  </strong>
                  <button
                    aria-label="勝利条件を編集"
                    className="icon-button"
                    onClick={() => setEditingVictory(true)}
                    ref={victoryEditButtonRef}
                    type="button"
                  >
                    <UiIcon name="edit" size={15} />
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="do-now-card" aria-labelledby="do-now-heading">
            <div className="do-now-copy">
              <div
                className={`project-label project-${doNowProject?.color ?? "green"}`}
              >
                <span />
                今やる一手 · {doNowProject?.name}
              </div>
              <h2 id="do-now-heading">{doNowText}</h2>
              <p className="do-now-reason">{doNowCandidate.reason}</p>
              <p className="demo-rule-note">
                Web Demoでは固定のサンプル理由を使用
              </p>
              {doNowStatus !== "idle" && (
                <span role="status" className="sync-running">
                  {doNowStatus === "running"
                    ? "実行中"
                    : doNowStatus === "paused"
                      ? "一時停止"
                      : "満了"}
                </span>
              )}
              <button
                className="text-button"
                onClick={() => dispatch({ type: "ROTATE_DO_NOW" })}
                type="button"
              >
                <UiIcon name="rotate" size={15} /> 別の候補
              </button>
            </div>
            <TimerActions
              label={doNowText}
              status={doNowStatus}
              primary
              onStart={(minutes) =>
                onStartTimer(
                  doNowText,
                  doNowCandidate.projectId,
                  doNowProject?.name ?? "今やる一手",
                  minutes * 60,
                )
              }
              {...timerHandlers}
            />
          </section>
          {launchActions.length > 0 && (
            <section aria-live="polite" className="launch-simulation">
              <div>
                <strong>環境を準備</strong>
                <span>Web Demo上の演出</span>
              </div>
              <ul>
                {launchActions.map((action) => (
                  <li key={action}>
                    <UiIcon name="check" size={14} /> {action}
                  </li>
                ))}
              </ul>
              <p>
                Web
                Demoでは起動動作を演出しています。Windows版では登録したアプリ・ファイル・URLを実際に開きます。
              </p>
            </section>
          )}
          <section
            className="demo-section today-section"
            aria-labelledby="today-three-heading"
            tabIndex={-1}
          >
            <div className="sync-heading">
              <h2 id="today-three-heading">今日の3件</h2>
              <span>{state.todayItems.length}件</span>
              <span
                role="status"
                className={allThreeCompleted ? "sync-complete" : ""}
              >
                {completedCount} / {state.todayItems.length} 完了
              </span>
            </div>
            <div className="today-list">
              {state.todayItems.map((item) => {
                const project = state.projects.find(
                  (entry) => entry.id === item.projectId,
                );
                const status =
                  state.timer.todayItemId === item.id
                    ? state.timer.status
                    : "idle";
                return (
                  <article
                    className={`today-row ${project ? `project-${project.color}` : ""} ${item.completed ? "today-completed" : ""}`}
                    key={item.id}
                    aria-label={item.label}
                  >
                    <div className="sync-card-header">
                      <span className="project-label">
                        <span />
                        {project?.name ?? "やりたいこと"}
                      </span>
                      <span
                        className="sync-completion-mark"
                        role="status"
                        aria-label={`${item.label}：${item.completed ? "完了" : "未完了"}`}
                      >
                        {item.completed ? (
                          <UiIcon name="check" size={14} />
                        ) : (
                          "○"
                        )}
                      </span>
                    </div>
                    <strong className="sync-card-title">{item.label}</strong>
                    <div className="sync-card-footer">
                      <button
                        type="button"
                        className="today-remove-button"
                        disabled={status !== "idle"}
                        title={
                          status !== "idle"
                            ? "タイマーを停止してから外してください"
                            : undefined
                        }
                        onClick={() => onRemoveTodayItem(item.id)}
                      >
                        <UiIcon name="back" size={16} />
                        今日の3件から外す
                      </button>
                      {item.completed ? (
                        <span className="sync-complete">予定時間まで完了</span>
                      ) : (
                        <>
                          <span className="sync-running" role="status">
                            {status === "running"
                              ? "実行中"
                              : status === "paused"
                                ? "一時停止"
                                : status === "finished"
                                  ? "満了"
                                  : ""}
                          </span>
                          <TimerActions
                            label={item.label}
                            status={status}
                            shortMinutes={item.shortMinutes}
                            normalMinutes={item.normalMinutes}
                            onStart={(minutes) =>
                              onStartTimer(
                                item.label,
                                item.projectId ?? item.sourceId,
                                project?.name ?? "やりたいこと",
                                minutes * 60,
                                item.id,
                              )
                            }
                            {...timerHandlers}
                          />
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {state.todayItems.length < 3 && (
              <button
                type="button"
                className="button button-gold today-picker-trigger"
                onClick={() => openTodayPicker()}
                ref={todayPickerTriggerRef}
              >
                ＋ 今日やるものを選ぶ
              </button>
            )}
            {allThreeCompleted && (
              <button
                type="button"
                className="button button-good sync-next-batch"
                disabled={state.timer.status !== "idle"}
                onClick={() => openTodayPicker(true)}
              >
                次の3件を選ぶ
              </button>
            )}
          </section>
          <section className="demo-section compact-section next-section">
            {sectionToggle(
              "nextStep",
              "次の一手",
              `${state.projects.length}件`,
              "各プロジェクトの、次回すぐ再開するための一手",
            )}
            <div id="section-nextStep" hidden={!state.sections.nextStep}>
              <ul className="sync-source-list">
                {state.projects.map((project) => {
                  const sourceId = nextStepSourceId(project.id);
                  const selected = selectedSourceIds.has(sourceId);
                  const locked = sourceLockedByUnfinishedToday(state, sourceId);
                  return (
                    <li
                      className={`source-row ${locked ? "is-locked" : ""}`}
                      key={project.id}
                    >
                      <div className="source-row-copy">
                        <span
                          className={`project-label project-${project.color}`}
                        >
                          <span />
                          {project.name}
                          {locked && (
                            <b
                              aria-label="今日の3件で使用中"
                              className="source-lock"
                              role="img"
                            >
                              <UiIcon name="lock" size={13} />
                            </b>
                          )}
                        </span>
                        {project.nextStep ? (
                          <strong>{project.nextStep}</strong>
                        ) : (
                          <span className="source-empty">
                            まだ次の一手がありません
                          </span>
                        )}
                      </div>
                      <div className="source-row-actions">
                        {selected ? (
                          <span className="source-selected-status">
                            <UiIcon name="check" size={13} /> 今日の3件
                          </span>
                        ) : (
                          project.nextStep && (
                            <button
                              aria-label={`${project.nextStep}を今日の3件に追加`}
                              className="button button-gold source-add"
                              onClick={() =>
                                onAddTodayCandidate({
                                  sourceId,
                                  sourceType: "nextStep",
                                  label: project.nextStep!,
                                  projectId: project.id,
                                })
                              }
                              type="button"
                            >
                              ＋ 今日へ
                            </button>
                          )
                        )}
                        <button
                          className="button button-quiet source-change"
                          disabled={locked}
                          onClick={() => setEditingNextStepId(project.id)}
                          title={
                            locked
                              ? "今日の3件を完了するか外してから変更できます"
                              : undefined
                          }
                          type="button"
                        >
                          {project.nextStep ? "変更" : "次の一手を設定"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
          <section className="demo-section compact-section wishlist-section">
            <div className="sync-disclosure-header">
              {sectionToggle(
                "wishlist",
                "やりたいこと",
                `${state.wishlist.length}件`,
                "あとで整理する一時置き場",
              )}
              <button
                ref={wishlistAddRef}
                type="button"
                className="icon-button"
                aria-label="やりたいことを追加"
                title="やりたいことを追加"
                onClick={() => setAddingWishlist(true)}
              >
                +
              </button>
            </div>
            <div id="section-wishlist" hidden={!state.sections.wishlist}>
              <div className="wishlist-groups">
                {wishlistGroups.map((group) => (
                  <section className="wishlist-group" key={group.id}>
                    <h3
                      className={
                        group.color
                          ? `project-label project-${group.color}`
                          : "project-label"
                      }
                    >
                      <span />
                      {group.name}
                    </h3>
                    <ul>
                      {group.items.map((item) => {
                        const sourceId = wishlistSourceId(item.id);
                        const selected = selectedSourceIds.has(sourceId);
                        const locked = sourceLockedByUnfinishedToday(
                          state,
                          sourceId,
                        );
                        return (
                          <li
                            className={`wishlist-row ${locked ? "is-locked" : ""}`}
                            key={item.id}
                          >
                            <strong>
                              {locked && (
                                <b
                                  aria-label="今日の3件で使用中"
                                  className="source-lock"
                                  role="img"
                                >
                                  <UiIcon name="lock" size={13} />
                                </b>
                              )}
                              {item.label}
                            </strong>
                            <div className="source-row-actions">
                              {selected ? (
                                <span className="source-selected-status">
                                  <UiIcon name="check" size={13} /> 今日の3件
                                </span>
                              ) : (
                                <button
                                  aria-label={`${item.label}を今日の3件に追加`}
                                  className="button button-gold source-add"
                                  onClick={() =>
                                    onAddTodayCandidate({
                                      sourceId,
                                      sourceType: "wishlist",
                                      label: item.label,
                                      projectId: item.projectId,
                                    })
                                  }
                                  type="button"
                                >
                                  ＋ 今日へ
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </section>
          <section className="demo-section compact-section activity-section">
            {sectionToggle(
              "activity",
              "今日の実行",
              `${state.sessions.length}件`,
              "タイマーで実行した内容",
            )}
            <div id="section-activity" hidden={!state.sections.activity}>
              <ul className="activity-list" aria-live="polite">
                {state.sessions.map((session) => (
                  <li key={session.id}>
                    <div>
                      <strong>{session.label}</strong>
                      <span>{session.projectName}</span>
                    </div>
                    <div>
                      <time>
                        {new Intl.DateTimeFormat("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(session.endedAt))}
                      </time>
                      <strong>{session.minutes}分</strong>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
      {addingWishlist && (
        <WishlistDialog
          onClose={() => setAddingWishlist(false)}
          onSave={(label) =>
            dispatch({ type: "ADD_WISHLIST", id: crypto.randomUUID(), label })
          }
        />
      )}
      {editingNextStepProject && (
        <NextStepDialog
          initialValue={editingNextStepProject.nextStep}
          onClose={() => setEditingNextStepId(null)}
          onSave={(nextStep) =>
            dispatch({
              type: "UPDATE_PROJECT_NEXT_STEP",
              projectId: editingNextStepProject.id,
              nextStep,
            })
          }
          projectName={editingNextStepProject.name}
        />
      )}
      {todayPickerOpen && (
        <TodayPicker
          candidates={candidates}
          onAdd={onAddTodayCandidate}
          onClose={closeTodayPicker}
          onRemove={onRemoveTodayItem}
          state={state}
        />
      )}
    </div>
  );
}
