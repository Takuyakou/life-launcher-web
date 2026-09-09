import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <section
        aria-describedby="reset-description"
        aria-labelledby="reset-title"
        aria-modal="true"
        className="confirm-dialog"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
            return;
          }
          if (event.key !== "Tab") return;
          const buttons =
            dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
          if (!buttons?.length) return;
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        role="dialog"
      >
        <p className="eyebrow">WEB DEMO</p>
        <h2 id="reset-title">{title}</h2>
        <p id="reset-description">{description}</p>
        <div className="dialog-actions">
          <button
            className="button button-danger"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
          <button
            className="button button-quiet"
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            キャンセル
          </button>
        </div>
      </section>
    </div>
  );
}
