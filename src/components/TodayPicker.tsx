import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoBuilderCandidate, DemoState } from "../demo/types";
import { UiIcon } from "./UiIcon";

type TodayPickerProps = {
  state: DemoState;
  candidates: DemoBuilderCandidate[];
  onAdd: (candidate: DemoBuilderCandidate) => boolean;
  onRemove: (id: string) => boolean;
  onClose: () => void;
};

export function TodayPicker({
  state,
  candidates,
  onAdd,
  onRemove,
  onClose,
}: TodayPickerProps) {
  const [sourceType, setSourceType] =
    useState<DemoBuilderCandidate["sourceType"]>("nextStep");
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selectedSourceIds = useMemo(
    () => new Set(state.todayItems.map((item) => item.sourceId)),
    [state.todayItems],
  );
  const available = candidates.filter(
    (candidate) => !selectedSourceIds.has(candidate.sourceId),
  );
  const visible = available.filter(
    (candidate) => candidate.sourceType === sourceType,
  );
  const counts = {
    nextStep: available.filter((candidate) => candidate.sourceType === "nextStep")
      .length,
    wishlist: available.filter((candidate) => candidate.sourceType === "wishlist")
      .length,
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])",
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

  return (
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
            <p className="eyebrow">TODAY</p>
            <h2 id="today-picker-title">今日やるものを選ぶ</h2>
            <p id="today-picker-description">
              次の一手・やりたいことから、今日取り組むものを3件まで選びます。
            </p>
          </div>
          <button
            aria-label="今日やるものを選ぶを閉じる"
            className="icon-button today-picker-close"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="today-picker-destination">
          <div className="today-picker-destination-heading">
            <strong>追加先：今日の3件</strong>
            <span>{state.todayItems.length} / 3</span>
          </div>
          <div className="today-picker-slots">
            {Array.from({ length: 3 }, (_, index) => {
              const item = state.todayItems[index];
              if (!item)
                return (
                  <div className="today-picker-slot is-empty" key={index}>
                    空き {index + 1}
                  </div>
                );
              const project = state.projects.find(
                (entry) => entry.id === item.projectId,
              );
              const status =
                state.timer.todayItemId === item.id
                  ? state.timer.status
                  : "idle";
              return (
                <article
                  className={`today-picker-slot is-selected ${project ? `project-${project.color}` : ""}`}
                  key={item.id}
                >
                  <div>
                    <span className="project-label">
                      <span />
                      {project?.name ?? "未分類"}
                    </span>
                    <span className="today-picker-selected-status">
                      <UiIcon name="check" size={13} /> 選択済み
                    </span>
                  </div>
                  <strong>{item.label}</strong>
                  <button
                    className="today-picker-remove"
                    disabled={status !== "idle"}
                    onClick={() => onRemove(item.id)}
                    title={
                      status !== "idle"
                        ? "タイマーを停止してから外してください"
                        : undefined
                    }
                    type="button"
                  >
                    <UiIcon name="back" size={14} /> 今日から外す
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="today-picker-sources">
          <div className="today-picker-source-heading">
            <span>追加元</span>
            <strong>どこから選びますか？</strong>
          </div>
          <div aria-label="追加元" className="today-picker-tabs" role="tablist">
            {(["nextStep", "wishlist"] as const).map((type) => (
              <button
                aria-controls={`today-picker-panel-${type}`}
                aria-selected={sourceType === type}
                className={sourceType === type ? "is-active" : ""}
                id={`today-picker-tab-${type}`}
                key={type}
                onClick={() => setSourceType(type)}
                role="tab"
                type="button"
              >
                {type === "nextStep" ? "次の一手" : "やりたいこと"}{" "}
                {counts[type]}件
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`today-picker-tab-${sourceType}`}
            className="today-picker-source-list"
            id={`today-picker-panel-${sourceType}`}
            role="tabpanel"
          >
            {visible.map((candidate) => {
              const project = state.projects.find(
                (entry) => entry.id === candidate.projectId,
              );
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
                  <button
                    aria-label={`${candidate.label}を今日の3件に追加`}
                    className="button button-gold today-picker-add"
                    disabled={state.todayItems.length >= 3}
                    onClick={() => {
                      const closesAtThree = state.todayItems.length === 2;
                      if (onAdd(candidate) && closesAtThree) onClose();
                    }}
                    type="button"
                  >
                    ＋ 今日へ
                  </button>
                </article>
              );
            })}
            {visible.length === 0 && (
              <p className="today-picker-source-empty">
                {sourceType === "nextStep"
                  ? "追加できる次の一手はありません"
                  : "追加できるやりたいことはありません"}
              </p>
            )}
          </div>
        </div>

        <footer className="today-picker-footer">
          <span>選んだ内容はすぐに保存されます。</span>
          <button className="button button-quiet" onClick={onClose} type="button">
            キャンセル
          </button>
        </footer>
      </section>
    </div>
  );
}
