import { useEffect, useRef, useState } from "react";

type NextStepDialogProps = {
  initialValue?: string;
  projectName: string;
  onClose: () => void;
  onSave: (value: string) => boolean;
};

export function NextStepDialog({
  initialValue = "",
  projectName,
  onClose,
  onSave,
}: NextStepDialogProps) {
  const [draft, setDraft] = useState(initialValue);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    inputRef.current?.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="next-step-dialog-title"
        aria-modal="true"
        className="completion-dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
          if (event.key !== "Tab") return;
          const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
            "input, button:not(:disabled)",
          );
          if (!nodes?.length) return;
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        ref={dialogRef}
        role="dialog"
      >
        <h2 id="next-step-dialog-title">
          {initialValue ? "次の一手を変更" : "次の一手を設定"}
        </h2>
        <p className="dialog-context">Project: {projectName}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = draft.trim();
            if (!value) return;
            if (onSave(value)) onClose();
            else setError(true);
          }}
        >
          <label className="completion-field">
            <span>次の一手</span>
            <input
              maxLength={120}
              onChange={(event) => setDraft(event.target.value)}
              ref={inputRef}
              value={draft}
            />
          </label>
          {error && (
            <p role="alert">保存できませんでした。入力を保持しています。</p>
          )}
          <div className="dialog-actions">
            <button
              className="button button-good"
              disabled={!draft.trim()}
              type="submit"
            >
              保存
            </button>
            <button
              className="button button-quiet"
              onClick={onClose}
              type="button"
            >
              キャンセル
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
