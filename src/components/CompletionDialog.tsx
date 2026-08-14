import { useEffect, useRef, useState } from "react";

type CompletionDialogProps = {
  initialValue: string;
  open: boolean;
  projectName: string;
  onSave: (nextStep: string) => void;
  onSkip: () => void;
};

export function CompletionDialog({ initialValue, open, projectName, onSave, onSkip }: CompletionDialogProps) {
  const [draft, setDraft] = useState(initialValue);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDraft(initialValue);
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => previous?.focus();
  }, [initialValue, open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onSkip();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("input, button:not([disabled])");
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

  const submit = () => {
    const nextStep = draft.trim();
    if (nextStep) onSave(nextStep);
  };

  return (
    <div className="modal-backdrop">
      <section
        aria-describedby="completion-description"
        aria-labelledby="completion-title"
        aria-modal="true"
        className="completion-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <p className="eyebrow">TIMER COMPLETE</p>
        <h2 id="completion-title">おつかれさまでした</h2>
        <p id="completion-description">{projectName}の次にやることを、今のうちに残しますか？</p>
        <label className="completion-field">
          <span>次の一手</span>
          <input
            aria-label="次の一手"
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            ref={inputRef}
            value={draft}
          />
        </label>
        <div className="dialog-actions">
          <button className="button button-quiet" onClick={onSkip} type="button">今は変更しない</button>
          <button className="button button-gold" disabled={!draft.trim()} onClick={submit} type="button">保存</button>
        </div>
      </section>
    </div>
  );
}
