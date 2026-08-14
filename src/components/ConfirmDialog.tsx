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

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => previous?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section
        aria-describedby="reset-description"
        aria-labelledby="reset-title"
        aria-modal="true"
        className="confirm-dialog"
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        role="dialog"
      >
        <p className="eyebrow">WEB DEMO</p>
        <h2 id="reset-title">{title}</h2>
        <p id="reset-description">{description}</p>
        <div className="dialog-actions">
          <button className="button button-quiet" onClick={onCancel} ref={cancelRef} type="button">
            キャンセル
          </button>
          <button className="button button-danger" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
