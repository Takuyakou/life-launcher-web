import { useEffect, useRef, useState } from "react";

export function WishlistDialog({
  onSave,
  onClose,
}: {
  onSave: (label: string) => boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    input.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-add-title"
        className="completion-dialog"
        ref={dialog}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
          if (event.key !== "Tab") return;
          const nodes = dialog.current?.querySelectorAll<HTMLElement>(
            "input, button:not(:disabled)",
          );
          if (!nodes?.length) return;
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id="wishlist-add-title">やりたいことを追加</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            if (onSave(draft.trim())) onClose();
            else setError(true);
          }}
        >
          <label className="completion-field">
            <span>やりたいこと</span>
            <input
              ref={input}
              value={draft}
              maxLength={120}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert">保存できませんでした。入力を保持しています。</p>
          )}
          <div className="dialog-actions">
            <button
              className="button button-gold"
              type="submit"
              disabled={!draft.trim()}
            >
              追加
            </button>
            <button
              className="button button-quiet"
              type="button"
              onClick={onClose}
            >
              キャンセル
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
