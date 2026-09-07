import { useEffect, useRef, useState } from "react";
import { DO_NOW_CANDIDATES, launchActionsForProject } from "../demo/seed";
import { createTodayBuilderCandidates } from "../demo/todayBuilder";
import type {
  DemoAction,
  DemoBuilderCandidate,
  DemoState,
} from "../demo/types";
import { DemoTimer } from "./DemoTimer";
import { UiIcon } from "./UiIcon";

type DemoFrameProps = {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  onOpenDictionary: () => void;
  onOpenReset: () => void;
  onNativeOnly: (label: string) => void;
  onStartTimer: (
    label: string,
    projectId: string,
    projectName: string,
    seconds: number,
  ) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onDemoComplete: () => void;
  onAddTodayCandidate: (candidate: DemoBuilderCandidate) => void;
  onExcludeTodayCandidate: (candidate: DemoBuilderCandidate) => void;
};

const projectColorClass = (color: string) => `project-${color}`;

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
  onExcludeTodayCandidate,
}: DemoFrameProps) {
  const [editingVictory, setEditingVictory] = useState(false);
  const [victoryDraft, setVictoryDraft] = useState(state.victory.text);
  const victoryEditButtonRef = useRef<HTMLButtonElement>(null);
  const victoryInputRef = useRef<HTMLInputElement>(null);
  const doNowCandidate = DO_NOW_CANDIDATES[state.doNowIndex];
  const doNowProject = state.projects.find(
    (project) => project.id === doNowCandidate.projectId,
  );
  const doNowText = doNowProject?.nextStep ?? doNowCandidate.text;
  const launchActions =
    state.timer.status === "idle"
      ? []
      : launchActionsForProject(state.timer.projectId);
  const builderCandidates = createTodayBuilderCandidates(state);
  const builderGroups = [
    {
      id: "nextStep" as const,
      label: "次の一手",
      items: builderCandidates.filter(
        (candidate) => candidate.sourceType === "nextStep",
      ),
    },
    {
      id: "wishlist" as const,
      label: "やりたいこと",
      items: builderCandidates.filter(
        (candidate) => candidate.sourceType === "wishlist",
      ),
    },
  ];

  useEffect(() => {
    if (editingVictory) victoryInputRef.current?.focus();
  }, [editingVictory]);

  useEffect(() => setVictoryDraft(state.victory.text), [state.victory.text]);

  const finishVictoryEdit = () => {
    setEditingVictory(false);
    window.requestAnimationFrame(() => victoryEditButtonRef.current?.focus());
  };

  const saveVictory = () => {
    const trimmed = victoryDraft.trim();
    if (trimmed && trimmed !== state.victory.text)
      dispatch({ type: "UPDATE_VICTORY", text: trimmed });
    else setVictoryDraft(state.victory.text);
    finishVictoryEdit();
  };

  const projectFor = (projectId?: string) =>
    projectId
      ? state.projects.find((project) => project.id === projectId)
      : undefined;

  return (
    <div className="demo-window">
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
                      if (event.key !== "Escape") return;
                      setVictoryDraft(state.victory.text);
                      finishVictoryEdit();
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
                className={`project-label ${doNowProject ? projectColorClass(doNowProject.color) : "project-green"}`}
              >
                <span />
                今やる一手{doNowProject ? ` · ${doNowProject.name}` : ""}
              </div>
              <h2 id="do-now-heading">{doNowText}</h2>
              <p className="do-now-reason">{doNowCandidate.reason}</p>
              <p className="demo-rule-note">
                Web Demoでは固定のサンプル理由を使用
              </p>
              <button
                className="text-button"
                onClick={() => dispatch({ type: "ROTATE_DO_NOW" })}
                type="button"
              >
                <UiIcon name="rotate" size={15} /> 別の候補
              </button>
            </div>
            <div className="start-actions">
              <button
                className="button button-good"
                data-demo-do-now-short
                onClick={() =>
                  onStartTimer(
                    doNowText,
                    doNowCandidate.projectId,
                    doNowProject?.name ?? "今やる一手",
                    5 * 60,
                  )
                }
                type="button"
              >
                <UiIcon name="play" size={14} /> 5分で始める
              </button>
              <button
                className="button button-normal"
                onClick={() =>
                  onStartTimer(
                    doNowText,
                    doNowCandidate.projectId,
                    doNowProject?.name ?? "今やる一手",
                    25 * 60,
                  )
                }
                type="button"
              >
                <UiIcon name="play" size={14} /> 通常25分
              </button>
            </div>
          </section>

          {launchActions.length > 0 ? (
            <section aria-live="polite" className="launch-simulation">
              <div>
                <strong>環境を準備</strong>
                <span>Web Demo上の演出</span>
              </div>
              <ul>
                {launchActions.map((action, index) => (
                  <li
                    key={action}
                    style={{ animationDelay: `${index * 180}ms` }}
                  >
                    <UiIcon name="check" size={14} /> {action}
                  </li>
                ))}
              </ul>
              <p>
                Windows版では登録したアプリ・ファイル・URLを実際に開きます。
              </p>
            </section>
          ) : null}

          <section
            className="demo-section today-section"
            aria-labelledby="today-three-heading"
          >
            <div className="section-heading-row">
              <div>
                <h2 id="today-three-heading">今日の3件</h2>
                <p>やることを増やさず、今日やる3件だけに絞る</p>
              </div>
              <span>{state.todayItems.length}/3</span>
            </div>
            <div className="today-list">
              {state.todayItems.map((item) => {
                const project = projectFor(item.projectId);
                return (
                  <div className="today-row" key={item.id}>
                    <input
                      aria-label={`${item.label}を完了`}
                      checked={item.completed}
                      onChange={() =>
                        dispatch({ type: "TOGGLE_TODAY_ITEM", id: item.id })
                      }
                      type="checkbox"
                    />
                    <div>
                      <strong className={item.completed ? "is-complete" : ""}>
                        {item.label}
                      </strong>
                      {project ? (
                        <span
                          className={`project-label ${projectColorClass(project.color)}`}
                        >
                          <span />
                          {project.name}
                        </span>
                      ) : null}
                    </div>
                    <div className="row-actions">
                      <button
                        aria-label={`${item.label}を5分で開始`}
                        className="start-icon start-short"
                        onClick={() =>
                          onStartTimer(
                            item.label,
                            item.projectId ?? item.sourceId,
                            project?.name ?? "今日の3件",
                            5 * 60,
                          )
                        }
                        type="button"
                      >
                        <UiIcon name="play" size={14} />
                        <span>5分</span>
                      </button>
                      <button
                        aria-label={`${item.label}を25分で開始`}
                        className="start-icon start-normal"
                        onClick={() =>
                          onStartTimer(
                            item.label,
                            item.projectId ?? item.sourceId,
                            project?.name ?? "今日の3件",
                            25 * 60,
                          )
                        }
                        type="button"
                      >
                        <UiIcon name="play" size={14} />
                        <span>25分</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="demo-section compact-section builder-section">
            <button
              aria-expanded={state.sections.todayBuilder}
              className="section-toggle"
              onClick={() =>
                dispatch({ type: "TOGGLE_SECTION", section: "todayBuilder" })
              }
              type="button"
            >
              <span className="chevron" aria-hidden="true">
                ›
              </span>
              <strong>今日を組み立てる</strong>
              <small>登録した候補から今日の行動を選ぶ</small>
              <span className="section-count">
                {builderCandidates.length}件
              </span>
            </button>
            {state.sections.todayBuilder ? (
              <div className="builder-content">
                <p className="builder-intro">
                  「今日へ」で選んだ項目が、上の今日の3件に入ります。
                </p>
                {builderGroups.map((group) =>
                  group.items.length > 0 ? (
                    <section
                      aria-labelledby={`builder-${group.id}`}
                      className="builder-group"
                      key={group.id}
                    >
                      <div className="builder-group-heading">
                        <strong id={`builder-${group.id}`}>
                          {group.label}
                        </strong>
                        <span>{group.items.length}件</span>
                      </div>
                      {group.items.map((candidate) => {
                        const project = projectFor(candidate.projectId);
                        const selected = state.todayItems.some(
                          (item) => item.sourceId === candidate.sourceId,
                        );
                        const full = state.todayItems.length >= 3;
                        return (
                          <div className="builder-row" key={candidate.sourceId}>
                            <div className="builder-row-copy">
                              {project ? (
                                <span
                                  className={`project-label ${projectColorClass(project.color)}`}
                                >
                                  <span />
                                  {project.name}
                                </span>
                              ) : null}
                              <strong>{candidate.label}</strong>
                            </div>
                            <div className="builder-row-actions">
                              <button
                                aria-label={`${candidate.label}を今日の3件に追加`}
                                className="button builder-add"
                                disabled={selected || full}
                                onClick={() => onAddTodayCandidate(candidate)}
                                title={
                                  selected
                                    ? "今日に選択済み"
                                    : full
                                      ? "今日の3件は3件までです"
                                      : "今日へ"
                                }
                                type="button"
                              >
                                {selected ? "選択済み" : "今日へ"}
                              </button>
                              <button
                                aria-label={`${candidate.label}を今日の候補から外す`}
                                className="builder-exclude"
                                onClick={() =>
                                  onExcludeTodayCandidate(candidate)
                                }
                                type="button"
                              >
                                候補から外す
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  ) : null,
                )}
                {builderCandidates.length === 0 ? (
                  <p className="builder-empty">
                    候補がありません。リセットするとサンプル候補に戻ります。
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section
            className="demo-section next-section"
            aria-labelledby="next-heading"
          >
            <div className="section-heading-row">
              <div>
                <h2 id="next-heading">次の一手</h2>
                <p>今日を組み立てるための候補を登録する</p>
              </div>
              <span>{state.projects.length}件</span>
            </div>
            <div className="project-grid">
              {state.projects.map((project) => (
                <article
                  className={`project-card ${projectColorClass(project.color)}`}
                  key={project.id}
                >
                  <div>
                    <div
                      className={`project-label ${projectColorClass(project.color)}`}
                    >
                      <span />
                      {project.name}
                    </div>
                    <strong>{project.nextStep}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="demo-section compact-section">
            <button
              aria-expanded={state.sections.wishlist}
              className="section-toggle"
              onClick={() =>
                dispatch({ type: "TOGGLE_SECTION", section: "wishlist" })
              }
              type="button"
            >
              <span className="chevron" aria-hidden="true">
                ›
              </span>
              <strong>やりたいこと</strong>
              <small>あとで整理する一時置き場</small>
              <span className="section-count">{state.wishlist.length}</span>
            </button>
            {state.sections.wishlist ? (
              <ul className="simple-list">
                {state.wishlist.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="demo-section compact-section">
            <button
              aria-expanded={state.sections.activity}
              className="section-toggle"
              onClick={() =>
                dispatch({ type: "TOGGLE_SECTION", section: "activity" })
              }
              type="button"
            >
              <span className="chevron" aria-hidden="true">
                ›
              </span>
              <strong>今日の実行</strong>
              <small>タイマーで実行した内容</small>
              <span className="activity-count">
                <i />
                {state.sessions.reduce(
                  (sum, session) => sum + session.minutes,
                  0,
                )}
                分
              </span>
            </button>
            {state.sections.activity ? (
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
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
