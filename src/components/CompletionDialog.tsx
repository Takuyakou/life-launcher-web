import { useEffect, useRef, useState } from "react";

export type CompletionMode = "resume" | "nextStep" | "plain";

export type CompletionValues = {
  resumeNote?: string;
  nextStep?: string;
};

type CompletionDialogProps = {
  open: boolean;
  mode: CompletionMode;
  projectName: string;
  hasProject: boolean;
  label: string;
  durationMinutes: number;
  initialNextStep: string;
  onExtend: (minutes: number) => void;
  onFinish: (values: CompletionValues) => void;
};

/** The minutes 「続ける」 adds when the field is empty or unreadable (Windows v1.6.3). */
const EXTEND_FALLBACK = 15;

const clampExtend = (value: number) =>
  Math.min(240, Math.max(1, Math.round(value)));

export function CompletionDialog({
  open,
  mode,
  projectName,
  hasProject,
  label,
  durationMinutes,
  initialNextStep,
  onExtend,
  onFinish,
}: CompletionDialogProps) {
  const [resumeDraft, setResumeDraft] = useState("");
  const [nextStepDraft, setNextStepDraft] = useState(initialNextStep);
  const [extendDraft, setExtendDraft] = useState(String(EXTEND_FALLBACK));
  const dialogRef = useRef<HTMLElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const parsedExtend = Number.parseInt(extendDraft, 10);
  const extendMinutes = Number.isFinite(parsedExtend)
    ? clampExtend(parsedExtend)
    : EXTEND_FALLBACK;

  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setResumeDraft("");
    setNextStepDraft(initialNextStep);
    setExtendDraft(String(EXTEND_FALLBACK));
    const frame = window.requestAnimationFrame(() => continueRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      window.requestAnimationFrame(() => {
        if (
          previous?.isConnected &&
          previous !== document.body &&
          previous !== document.documentElement
        )
          previous.focus();
        else
          document
            .querySelector<HTMLElement>(".today-section button:not([disabled])")
            ?.focus({ preventScroll: true });
      });
    };
  }, [initialNextStep, open]);

  if (!open) return null;

  const finishPlain = () => onFinish({});
  const finishWithResume = () =>
    onFinish({ resumeNote: resumeDraft.trim() || undefined });
  const finishWithNextStep = () => {
    const nextStep = nextStepDraft.trim();
    if (!nextStep) return;
    onFinish({ nextStep });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        return;
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (mode === "resume") finishWithResume();
      else finishPlain();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "input:not([disabled]), button:not([disabled])",
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

  const stepExtend = (delta: number) =>
    setExtendDraft(String(clampExtend(extendMinutes + delta)));

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
        <p className="eyebrow">Timer</p>
        <h2 id="completion-title">予定時間になりました</h2>

        <div className="completion-subject">
          {hasProject && (
            <span className="completion-project">{projectName}</span>
          )}
          <span className="completion-planned">予定 {durationMinutes}分</span>
          <strong className="completion-action">{label}</strong>
        </div>

        {mode === "resume" && (
          <>
            <label className="completion-field">
              <span>次はここから(任意)</span>
              <input
                aria-label="次はここから(任意)"
                autoComplete="off"
                maxLength={80}
                onChange={(event) => setResumeDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  if (event.nativeEvent.isComposing || event.keyCode === 229) {
                    event.preventDefault();
                    return;
                  }
                  event.preventDefault();
                  finishWithResume();
                }}
                placeholder="例: 3章の途中から"
                ref={resumeRef}
                value={resumeDraft}
              />
            </label>
            <p className="completion-hint">
              書くと、次に「今やる一手」に出たときに、行動の下に出ます。
            </p>
          </>
        )}

        {mode === "nextStep" && (
          <label className="completion-field">
            <span>次の次の一手(任意)</span>
            <input
              aria-label="次の次の一手(任意)"
              autoComplete="off"
              maxLength={120}
              onChange={(event) => setNextStepDraft(event.target.value)}
              value={nextStepDraft}
            />
          </label>
        )}

        <p className="completion-hint" id="completion-description">
          {mode === "resume"
            ? "終わったら記録します。まだ続けるなら延長できます。"
            : mode === "nextStep"
              ? "次の一手を残して終われます。変えなければ今のまま記録します。"
              : "終わったら今日の実行に記録します。まだ続けるなら延長できます。"}
        </p>

        <div className="completion-extend">
          <span className="completion-extend-label">延長分数</span>
          <div aria-label="延長分数" className="completion-stepper" role="group">
            <button
              aria-label="延長分数を5分減らす"
              className="completion-step"
              onClick={() => stepExtend(-5)}
              type="button"
            >
              −
            </button>
            <input
              aria-label="延長する分数"
              className="completion-step-input"
              inputMode="numeric"
              max={240}
              min={1}
              onBlur={() => setExtendDraft(String(extendMinutes))}
              onChange={(event) => setExtendDraft(event.target.value)}
              type="number"
              value={extendDraft}
            />
            <button
              aria-label="延長分数を5分増やす"
              className="completion-step"
              onClick={() => stepExtend(5)}
              type="button"
            >
              ＋
            </button>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            className="button button-neutral"
            onClick={() => onExtend(extendMinutes)}
            ref={continueRef}
            type="button"
          >
            続ける(+{extendMinutes}分)
          </button>
          {mode === "nextStep" && (
            <button
              className="button button-good"
              disabled={!nextStepDraft.trim()}
              onClick={finishWithNextStep}
              type="button"
            >
              保存して終わる
            </button>
          )}
          <button
            className="button button-danger"
            onClick={mode === "resume" ? finishWithResume : finishPlain}
            type="button"
          >
            終わる
          </button>
        </div>
      </section>
    </div>
  );
}
