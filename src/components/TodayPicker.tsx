import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DemoBuilderCandidate,
  DemoProject,
  DemoState,
  DemoTodayItem,
  DemoWishlistItem,
} from "../demo/types";
import { stateFingerprint } from "../demo/types";
import {
  nextStepSourceId,
  todayItemFromCandidate,
  wishlistSourceId,
} from "../demo/todayBuilder";
import { ConfirmDialog } from "./ConfirmDialog";
import { UiIcon } from "./UiIcon";

type TodayPickerProps = {
  state: DemoState;
  onClose: () => void;
  onSave: (
    todayItems: DemoTodayItem[],
    addedWishlist: DemoWishlistItem[],
    expectedFingerprint: string,
  ) => boolean;
};

type FilterPill = {
  key: string;
  label: string;
  color?: DemoProject["color"];
};

const FILTER_ALL = "all";
const FILTER_UNASSIGNED = "unassigned";

export function TodayPicker({ state, onClose, onSave }: TodayPickerProps) {
  const [draftItems, setDraftItems] = useState<DemoTodayItem[]>(() =>
    state.todayItems.map((item) => ({ ...item })),
  );
  const [addedWishlist, setAddedWishlist] = useState<DemoWishlistItem[]>([]);
  const [quickText, setQuickText] = useState("");
  const [filter, setFilter] = useState<string>(FILTER_ALL);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const fingerprintRef = useRef(stateFingerprint(state));
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const wishlist = useMemo(
    () => [...addedWishlist, ...state.wishlist],
    [addedWishlist, state.wishlist],
  );

  const pills = useMemo<FilterPill[]>(() => {
    const list: FilterPill[] = [
      { key: FILTER_ALL, label: "すべて" },
      ...state.projects.map((project) => ({
        key: project.id,
        label: project.name,
        color: project.color,
      })),
    ];
    if (wishlist.some((item) => !item.projectId))
      list.push({ key: FILTER_UNASSIGNED, label: "未分類" });
    return list;
  }, [state.projects, wishlist]);

  const selectedSourceIds = useMemo(
    () => new Set(draftItems.map((item) => item.sourceId)),
    [draftItems],
  );

  const visibleNextSteps = useMemo<DemoBuilderCandidate[]>(
    () =>
      state.projects
        .filter(
          (project) =>
            Boolean(project.nextStep) &&
            (filter === FILTER_ALL || filter === project.id),
        )
        .map((project) => ({
          sourceId: nextStepSourceId(project.id),
          sourceType: "nextStep" as const,
          label: project.nextStep ?? "",
          projectId: project.id,
        })),
    [filter, state.projects],
  );

  const visibleWishlist = useMemo<DemoBuilderCandidate[]>(
    () =>
      wishlist
        .filter((item) => {
          if (filter === FILTER_ALL) return true;
          if (filter === FILTER_UNASSIGNED) return !item.projectId;
          return item.projectId === filter;
        })
        .map((item) => ({
          sourceId: wishlistSourceId(item.id),
          sourceType: "wishlist" as const,
          label: item.label,
          projectId: item.projectId,
        })),
    [filter, wishlist],
  );

  const quickProject =
    filter === FILTER_ALL || filter === FILTER_UNASSIGNED
      ? undefined
      : state.projects.find((project) => project.id === filter);
  const full = draftItems.length >= 3;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const isDirty = () =>
    addedWishlist.length > 0 ||
    quickText.trim() !== "" ||
    draftItems.length !== state.todayItems.length ||
    draftItems.some(
      (item, index) => item.sourceId !== state.todayItems[index]?.sourceId,
    );

  const requestClose = () => {
    if (discardOpen) return;
    if (isDirty()) setDiscardOpen(true);
    else onClose();
  };

  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The discard confirmation handles its own Escape.
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(".confirm-dialog")
      )
        return;
      if (document.querySelector(".confirm-dialog")) return;
      event.preventDefault();
      requestCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const addCandidate = (candidate: DemoBuilderCandidate) => {
    const item = todayItemFromCandidate(candidate);
    if (draftItems.some((entry) => entry.sourceId === candidate.sourceId))
      return;
    if (draftItems.length >= 3) {
      setNotice("今日の3件は3件埋まっています。");
      return;
    }
    setNotice(null);
    setError(null);
    setDraftItems((previous) => [...previous, item]);
  };

  const addQuickWish = () => {
    const label = quickText.trim();
    if (!label) return;
    const wish: DemoWishlistItem = {
      id: crypto.randomUUID(),
      label: label.slice(0, 120),
      ...(quickProject ? { projectId: quickProject.id } : {}),
    };
    setAddedWishlist((previous) => [...previous, wish]);
    setQuickText("");
    setError(null);
    const candidate: DemoBuilderCandidate = {
      sourceId: wishlistSourceId(wish.id),
      sourceType: "wishlist",
      label: wish.label,
      projectId: wish.projectId,
    };
    if (draftItems.length >= 3) {
      setNotice(
        "今日の3件は3件埋まっています。候補に追加してあるので、入れ替えて選べます。",
      );
      return;
    }
    setNotice(null);
    setDraftItems((previous) => [
      ...previous,
      todayItemFromCandidate(candidate),
    ]);
  };

  const moveItem = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draftItems.length) return;
    setDraftItems((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeItem = (id: string) => {
    setDraftItems((previous) => previous.filter((item) => item.id !== id));
    setNotice(null);
  };

  const timerLockedId =
    state.timer.status !== "idle" ? state.timer.todayItemId : undefined;

  const save = () => {
    const current = stateFingerprint(state);
    setError(null);
    setNotice(null);
    if (current !== fingerprintRef.current) {
      fingerprintRef.current = current;
      setDraftItems(state.todayItems.map((item) => ({ ...item })));
      setAddedWishlist([]);
      setError(
        "ほかの変更があったため、最新の状態からやり直してください。",
      );
      return;
    }
    if (onSave(draftItems, addedWishlist, fingerprintRef.current)) {
      onClose();
      return;
    }
    setError("保存できませんでした。選んだ内容は保持しています。");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const candidateRow = (candidate: DemoBuilderCandidate) => {
    const project = state.projects.find(
      (entry) => entry.id === candidate.projectId,
    );
    const selected = selectedSourceIds.has(candidate.sourceId);
    return (
      <article className="today-picker-source-row" key={candidate.sourceId}>
        <div>
          <span
            className={`project-label ${project ? `project-${project.color}` : ""}`}
          >
            <span />
            {project?.name ?? "未分類"}
          </span>
          <strong>{candidate.label}</strong>
        </div>
        {selected ? (
          <span className="today-picker-selected-status">
            <UiIcon name="check" size={13} /> 選択済み
          </span>
        ) : (
          <button
            aria-label={`${candidate.label}を今日の3件に追加`}
            className="button button-gold today-picker-add"
            disabled={full}
            onClick={() => addCandidate(candidate)}
            type="button"
          >
            ＋ 今日へ
          </button>
        )}
      </article>
    );
  };

  return (
    <>
      <div className="modal-backdrop today-picker-backdrop">
        <section
          aria-describedby="today-picker-description"
          aria-labelledby="today-picker-title"
          aria-modal="true"
          className="today-picker"
          onKeyDown={handleKeyDown}
          ref={dialogRef}
          role="dialog"
        >
          <header className="today-picker-header">
            <div>
              <p className="eyebrow">Today</p>
              <h2 id="today-picker-title">今日やるものを選ぶ</h2>
              <p id="today-picker-description">
                3件まで。決めたら、あとは始めるだけです。
              </p>
            </div>
            <button
              aria-label="今日やるものを選ぶを閉じる"
              className="icon-button today-picker-close"
              onClick={requestClose}
              ref={closeRef}
              type="button"
            >
              ×
            </button>
          </header>

          <div
            aria-label="プロジェクトで絞り込む"
            className="today-picker-pills"
            role="group"
          >
            {pills.map((pill) => (
              <button
                aria-pressed={filter === pill.key}
                className={
                  filter === pill.key
                    ? "today-picker-pill is-active"
                    : "today-picker-pill"
                }
                key={pill.key}
                onClick={() => setFilter(pill.key)}
                type="button"
              >
                {pill.color && (
                  <span
                    aria-hidden="true"
                    className={`today-picker-pill-dot project-${pill.color}`}
                  />
                )}
                {pill.label}
              </button>
            ))}
          </div>

          <div className="today-picker-body">
            <section
              aria-label="追加できるもの"
              className="today-picker-sources"
            >
              <div className="today-picker-source-group">
                <h3 className="today-picker-group-title">次の一手</h3>
                <div className="today-picker-source-list">
                  {visibleNextSteps.length === 0 ? (
                    <p className="today-picker-source-empty">
                      追加できる次の一手はありません
                    </p>
                  ) : (
                    visibleNextSteps.map(candidateRow)
                  )}
                </div>
              </div>
              <div className="today-picker-source-group">
                <h3 className="today-picker-group-title">やりたいこと</h3>
                <div className="today-picker-source-list">
                  {visibleWishlist.length === 0 ? (
                    <p className="today-picker-source-empty">
                      追加できるやりたいことはありません
                    </p>
                  ) : (
                    visibleWishlist.map(candidateRow)
                  )}
                </div>
                <form
                  className="today-picker-quick-add"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addQuickWish();
                  }}
                >
                  <input
                    aria-label={
                      quickProject
                        ? `「${quickProject.name}」のやりたいことを追加`
                        : "やりたいことを追加"
                    }
                    autoComplete="off"
                    maxLength={120}
                    onChange={(event) => setQuickText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                      ) {
                        event.preventDefault();
                        return;
                      }
                      event.preventDefault();
                      addQuickWish();
                    }}
                    placeholder={
                      quickProject
                        ? `「${quickProject.name}」のやりたいことを足して今日へ`
                        : "やりたいことを足して今日へ"
                    }
                    type="text"
                    value={quickText}
                  />
                  <button
                    className="button button-quiet today-picker-quick-add-button"
                    type="submit"
                  >
                    ＋ 追加
                  </button>
                </form>
              </div>
              {notice && (
                <p className="today-picker-notice" role="status">
                  {notice}
                </p>
              )}
              {error && (
                <p className="today-picker-error" role="alert">
                  {error}
                </p>
              )}
            </section>

            <section
              aria-label="今日の3件"
              className="today-picker-destination"
            >
              <div className="today-picker-destination-heading">
                <strong>今日の3件</strong>
                <span>{draftItems.length} / 3</span>
              </div>
              <div
                aria-label={`今日の3件の選択状況 ${draftItems.length}/3`}
                aria-valuemax={3}
                aria-valuemin={0}
                aria-valuenow={draftItems.length}
                className="today-picker-progress"
                role="progressbar"
              >
                <span
                  style={{ width: `${(draftItems.length / 3) * 100}%` }}
                />
              </div>
              <div className="today-picker-slots">
                {Array.from({ length: 3 }, (_, index) => {
                  const item = draftItems[index];
                  if (!item)
                    return (
                      <div className="today-picker-slot is-empty" key={index}>
                        <span className="today-picker-slot-index">
                          {index + 1}
                        </span>
                        <span>空けておいてもかまいません</span>
                      </div>
                    );
                  const project = state.projects.find(
                    (entry) => entry.id === item.projectId,
                  );
                  return (
                    <article
                      className={`today-picker-slot is-selected ${project ? `project-${project.color}` : ""}`}
                      key={item.id}
                    >
                      <div className="today-picker-slot-head">
                        <span className="today-picker-slot-index">
                          {index + 1}
                        </span>
                        <span
                          className={`project-label ${project ? `project-${project.color}` : ""}`}
                        >
                          <span />
                          {project?.name ?? "未分類"}
                        </span>
                        {item.completed && (
                          <span className="today-picker-selected-status">
                            <UiIcon name="check" size={12} /> 完了
                          </span>
                        )}
                      </div>
                      <strong>{item.label}</strong>
                      <div className="today-picker-slot-actions">
                        <button
                          aria-label={`${item.label}を上へ移動`}
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`${item.label}を下へ移動`}
                          disabled={index === draftItems.length - 1}
                          onClick={() => moveItem(index, 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <button
                          aria-label={`${item.label}を今日から外す`}
                          disabled={timerLockedId === item.id}
                          onClick={() => removeItem(item.id)}
                          title={
                            timerLockedId === item.id
                              ? "タイマーを停止してから外してください"
                              : undefined
                          }
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <footer className="today-picker-footer">
            <span>選んだ内容は「決定」でまとめて保存します。</span>
            <div className="today-picker-footer-actions">
              <button
                className="button button-good"
                onClick={save}
                type="button"
              >
                決定
              </button>
              <button
                className="button button-danger"
                onClick={requestClose}
                type="button"
              >
                キャンセル
              </button>
            </div>
          </footer>
        </section>
      </div>
      <ConfirmDialog
        open={discardOpen}
        title="選んだ内容を破棄しますか？"
        description="決定していない変更は保存されません。"
        confirmLabel="破棄する"
        cancelLabel="編集を続ける"
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  );
}
