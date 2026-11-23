import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDemoImportPlan,
  buildImportCurrentState,
  demoImportGroupCount,
  extractImportJson,
  IMPORT_PROMPT_FIRST,
  IMPORT_PROMPT_REPEAT,
  parseDemoImport,
  SAMPLE_IMPORT_RESPONSE,
  type DemoImportPlan,
  type ParsedDemoImport,
} from "../demo/importDemo";
import type { DemoState } from "../demo/types";

type DemoImportDialogProps = {
  state: DemoState;
  onClose: () => void;
  onCommit: (
    parsed: ParsedDemoImport,
    excludedKeys: string[],
    expectedFingerprint: string,
    selectedCount: number,
  ) => boolean;
};

const AUTO_READ_DELAY_MS = 300;

type CopyStatus = { tone: "ok" | "error"; message: string } | null;

export function DemoImportDialog({
  state,
  onClose,
  onCommit,
}: DemoImportDialogProps) {
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<DemoImportPlan | null>(null);
  const [parsed, setParsed] = useState<ParsedDemoImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [reading, setReading] = useState(false);
  const [folded, setFolded] = useState(false);
  const [projectOff, setProjectOff] = useState<ReadonlySet<string>>(new Set());
  const [rowOff, setRowOff] = useState<ReadonlySet<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyFirstRef = useRef<HTMLButtonElement>(null);
  const repasteRef = useRef<HTMLButtonElement>(null);
  const readTimerRef = useRef<number | null>(null);
  const readSequenceRef = useRef(0);

  const currentState = useMemo(() => buildImportCurrentState(state), [state]);

  const groups = plan?.groups ?? [];
  const total = groups.reduce(
    (sum, group) => sum + demoImportGroupCount(group, false, new Set()),
    0,
  );
  const selected = groups.reduce(
    (sum, group) =>
      sum +
      demoImportGroupCount(
        group,
        group.key !== null && projectOff.has(group.key),
        rowOff,
      ),
    0,
  );
  const projectCount = groups.filter((group) => group.key !== null).length;
  const stepCount = groups.reduce(
    (count, group) =>
      count + group.rows.filter((row) => row.kind === "step").length,
    0,
  );
  const wishCount = groups.reduce(
    (count, group) =>
      count + group.rows.filter((row) => row.kind === "wish").length,
    0,
  );

  const clearReadTimer = () => {
    if (readTimerRef.current !== null) {
      window.clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
  };

  const runPreview = (source: string) => {
    const sequence = (readSequenceRef.current += 1);
    const extracted = extractImportJson(source);
    if (!extracted.ok) {
      setPlan(null);
      setParsed(null);
      setFolded(false);
      setReading(false);
      setError(extracted.error);
      return;
    }
    const result = parseDemoImport(extracted.json);
    if (!result.ok) {
      setPlan(null);
      setParsed(null);
      setFolded(false);
      setReading(false);
      setError(result.error);
      return;
    }
    if (sequence !== readSequenceRef.current) return;
    const nextPlan = buildDemoImportPlan(state, result.parsed, []);
    setParsed(result.parsed);
    setPlan(nextPlan);
    setProjectOff(new Set());
    setRowOff(new Set());
    setError(null);
    setReading(false);
    setFolded(true);
    const focused = document.activeElement;
    const fromField =
      focused === textareaRef.current ||
      focused === document.body ||
      focused === null;
    window.requestAnimationFrame(() => {
      if (fromField) repasteRef.current?.focus();
    });
  };

  const scheduleRead = (value: string, immediately: boolean) => {
    clearReadTimer();
    readSequenceRef.current += 1;
    setPlan(null);
    setParsed(null);
    setError(null);
    setFolded(false);
    if (!value.trim()) {
      setReading(false);
      return;
    }
    setReading(true);
    if (immediately) {
      runPreview(value);
      return;
    }
    readTimerRef.current = window.setTimeout(() => {
      readTimerRef.current = null;
      runPreview(value);
    }, AUTO_READ_DELAY_MS);
  };

  useEffect(() => {
    copyFirstRef.current?.focus();
    return clearReadTimer;
  }, []);

  const repaste = () => {
    clearReadTimer();
    readSequenceRef.current += 1;
    setFolded(false);
    setPlan(null);
    setParsed(null);
    setProjectOff(new Set());
    setRowOff(new Set());
    setError(null);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const copyPrompt = async (value: string) => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard API is not available");
      await navigator.clipboard.writeText(value);
      setCopyStatus({ tone: "ok", message: "コピーしました" });
    } catch {
      setCopyStatus({
        tone: "error",
        message: "コピーできませんでした。手動で選択してコピーしてください。",
      });
    }
  };

  const toggleProject = (key: string) =>
    setProjectOff((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleRow = (key: string) =>
    setRowOff((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleLooseGroup = (rows: { key: string }[]) => {
    setRowOff((previous) => {
      const next = new Set(previous);
      const allOn = rows.every((row) => !next.has(row.key));
      for (const row of rows) {
        if (allOn) next.add(row.key);
        else next.delete(row.key);
      }
      return next;
    });
  };

  const collectExcluded = () => {
    const keys: string[] = [];
    for (const group of groups) {
      if (group.key !== null && projectOff.has(group.key)) {
        keys.push(group.key);
        continue;
      }
      for (const row of group.rows) if (rowOff.has(row.key)) keys.push(row.key);
    }
    return keys;
  };

  const commit = () => {
    if (!plan || !parsed || saving || selected === 0) return;
    setSaving(true);
    const excluded = collectExcluded();
    const ok = onCommit(parsed, excluded, plan.fingerprint, selected);
    setSaving(false);
    if (ok) {
      onClose();
      return;
    }
    // Stale fingerprint or a failed save: re-read the current state, keep the ticks.
    setPlan(buildDemoImportPlan(state, parsed, excluded));
    setError(
      "保存できませんでした。最新の内容でプレビューを作り直しました。もう一度お試しください。",
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && !saving) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), textarea:not([disabled]), input:not([disabled])",
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
    <div className="modal-backdrop demo-import-backdrop">
      <section
        aria-describedby="demo-import-description"
        aria-labelledby="demo-import-title"
        aria-modal="true"
        className="demo-import-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className="demo-import-header">
          <div>
            <h2 id="demo-import-title">まとめて取り込む</h2>
            <p id="demo-import-description">
              プロジェクト・次の一手・やりたいことを、まとめて足します。今あるものは上書きしません。
            </p>
          </div>
          <button
            aria-label="まとめて取り込むを閉じる"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="demo-import-body">
          <section className="demo-import-step">
            <span
              className="demo-import-step-number"
              data-state="active"
            >
              1
            </span>
            <div className="demo-import-step-content">
              <div className="demo-import-step-head">
                <h3>AI に聞く</h3>
                <span>コピーして、ChatGPT や Claude にそのまま貼って送ります。</span>
              </div>
              <div className="demo-import-copy-row">
                <button
                  className="button button-quiet"
                  onClick={() => void copyPrompt(IMPORT_PROMPT_FIRST)}
                  ref={copyFirstRef}
                  type="button"
                >
                  初回作成用をコピー
                </button>
                <button
                  className="button button-quiet"
                  onClick={() =>
                    void copyPrompt(
                      IMPORT_PROMPT_REPEAT.replace(
                        "{CURRENT_STATE}",
                        currentState,
                      ),
                    )
                  }
                  type="button"
                >
                  追加・見直し用をコピー
                </button>
              </div>
              {copyStatus && (
                <p
                  className={
                    copyStatus.tone === "ok"
                      ? "demo-import-copy-status"
                      : "demo-import-copy-status is-error"
                  }
                  role="status"
                >
                  {copyStatus.message}
                </p>
              )}
              <p className="demo-import-privacy">
                コピー内容には現在のプロジェクトや行動が含まれます。外部AIに送る前に内容を確認してください。
              </p>
            </div>
          </section>

          <section className="demo-import-step">
            <span
              className="demo-import-step-number"
              data-state={folded ? "done" : "pending"}
            >
              2
            </span>
            <div className="demo-import-step-content">
              <div className="demo-import-step-head">
                <h3>答えを貼る</h3>
                {reading ? (
                  <span>読み込み中…</span>
                ) : folded ? null : (
                  <span>貼ると、取り込む中身が下に出ます。</span>
                )}
              </div>
              {folded && plan ? (
                <div className="demo-import-read-line">
                  <strong>✓ 読み取りました</strong>
                  <span>
                    プロジェクト {projectCount}・次の一手 {stepCount}・やりたいこと{" "}
                    {wishCount}
                  </span>
                  <button
                    className="button button-quiet"
                    onClick={repaste}
                    ref={repasteRef}
                    type="button"
                  >
                    貼り直す
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    aria-label="取り込みのJSON"
                    autoComplete="off"
                    className="demo-import-textarea"
                    onChange={(event) => {
                      setText(event.target.value);
                      scheduleRead(event.target.value, false);
                    }}
                    onPaste={() => {
                      window.setTimeout(() => {
                        const value = textareaRef.current?.value ?? "";
                        setText(value);
                        scheduleRead(value, true);
                      }, 0);
                    }}
                    placeholder="AI の答えを、ここに貼ります(Ctrl+V)。"
                    ref={textareaRef}
                    value={text}
                  />
                  <button
                    className="button button-quiet demo-import-sample"
                    onClick={() => {
                      clearReadTimer();
                      setText(SAMPLE_IMPORT_RESPONSE);
                      scheduleRead(SAMPLE_IMPORT_RESPONSE, true);
                    }}
                    type="button"
                  >
                    サンプルの AI 回答を貼ってみる
                  </button>
                </>
              )}
              {error && (
                <p className="demo-import-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </section>

          <section className="demo-import-step">
            <span
              className="demo-import-step-number"
              data-state={folded ? "active" : "pending"}
            >
              3
            </span>
            <div className="demo-import-step-content">
              <div className="demo-import-step-head">
                <h3>取り込むものを選ぶ</h3>
                <span>
                  {folded
                    ? "いらないものは、チェックを外します。今あるものは上書きしません。"
                    : "答えを貼ると、ここに出ます。"}
                </span>
              </div>

              {plan && (
                <div className="demo-import-preview">
                  {plan.ignoredFields.length > 0 && (
                    <p className="demo-import-note">
                      Web Demo では反映されない項目（きっかけ・タイマー分数設定は
                      Windows 版で反映されます）:{" "}
                      {Array.from(new Set(plan.ignoredFields)).join("、")}
                    </p>
                  )}
                  {groups.map((group) => {
                    const off =
                      group.key !== null && projectOff.has(group.key);
                    const allOn = group.rows.every(
                      (row) => !rowOff.has(row.key),
                    );
                    return (
                      <section
                        className={`demo-import-group${off ? " is-off" : ""}${group.color ? ` project-${group.color}` : ""}`}
                        data-project-color={group.color}
                        key={group.key ?? "none"}
                      >
                        <div className="demo-import-group-head">
                          <input
                            aria-label={`「${group.name}」を取り込む`}
                            checked={group.key === null ? allOn : !off}
                            onChange={() =>
                              group.key === null
                                ? toggleLooseGroup(group.rows)
                                : toggleProject(group.key)
                            }
                            type="checkbox"
                          />
                          <span
                            aria-hidden="true"
                            className={`demo-import-dot ${group.color ? `project-${group.color}` : ""}`}
                          />
                          <strong>{group.name}</strong>
                          {group.key !== null && (
                            <span
                              className={
                                group.isNew
                                  ? "demo-import-tag is-new"
                                  : "demo-import-tag"
                              }
                            >
                              {group.isNew
                                ? "新しいプロジェクト"
                                : "今あるプロジェクト"}
                            </span>
                          )}
                          {group.note && (
                            <span className="demo-import-note">
                              {group.note}
                            </span>
                          )}
                        </div>
                        {group.rows.length === 0 && group.isNew && (
                          <p className="demo-import-empty-row">
                            プロジェクトだけ作ります
                          </p>
                        )}
                        {group.rows.map((row) => {
                          const rowOffNow = off || rowOff.has(row.key);
                          return (
                            <label
                              className={
                                rowOffNow
                                  ? "demo-import-row is-off"
                                  : "demo-import-row"
                              }
                              key={row.key}
                            >
                              <input
                                aria-label={`「${row.text}」を取り込む`}
                                checked={!rowOff.has(row.key)}
                                disabled={off}
                                onChange={() => toggleRow(row.key)}
                                type="checkbox"
                              />
                              <span
                                className={
                                  row.kind === "step"
                                    ? "demo-import-kind is-step"
                                    : "demo-import-kind"
                                }
                              >
                                {row.kind === "step"
                                  ? "次の一手"
                                  : "やりたいこと"}
                              </span>
                              <span className="demo-import-row-text">
                                <span>{row.text}</span>
                                {row.reason && <small>{row.reason}</small>}
                              </span>
                            </label>
                          );
                        })}
                      </section>
                    );
                  })}
                  {total === 0 && (
                    <p className="demo-import-error">
                      取り込める項目がありません。内容を確かめてください。
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="demo-import-footer">
          <span>
            {plan && selected < total
              ? `${total}件のうち ${selected}件を取り込みます`
              : ""}
          </span>
          <div className="demo-import-footer-actions">
            <button
              className="button button-good"
              disabled={!plan || selected === 0 || saving}
              onClick={commit}
              type="button"
            >
              {saving ? "取り込んでいます…" : `取り込む(${selected}件)`}
            </button>
            <button
              className="button button-danger"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              キャンセル
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
