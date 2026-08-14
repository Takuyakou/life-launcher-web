import { useEffect, useMemo, useRef, useState } from "react";
import { filterDictionary } from "../demo/dictionary";
import { DICTIONARY_TILES } from "../demo/seed";
import { UiIcon } from "./UiIcon";

type DemoDictionaryProps = {
  open: boolean;
  onClose: () => void;
  onNativeOnly: (label: string) => void;
};

export function DemoDictionary({ open, onClose, onNativeOnly }: DemoDictionaryProps) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const filtered = useMemo(() => filterDictionary(DICTIONARY_TILES, query), [query]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    searchRef.current?.focus();
    return () => openerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
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
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        aria-labelledby="dictionary-title"
        aria-modal="true"
        className="dictionary-dialog"
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className="dictionary-header">
          <div>
            <p className="eyebrow">WEB DEMO</p>
            <h2 id="dictionary-title">辞書</h2>
          </div>
          <button aria-label="辞書を閉じる" className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </header>
        <label className="search-field">
          <UiIcon name="search" size={17} />
          <span className="sr-only">辞書を検索</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ラベル・分類・キーワードから検索"
            ref={searchRef}
            type="search"
            value={query}
          />
        </label>
        <div aria-live="polite" className="dictionary-count">
          {filtered.length}件
        </div>
        <div className="dictionary-grid">
          {filtered.map((tile) => (
            <button className="dictionary-tile" key={tile.id} onClick={() => onNativeOnly(tile.label)} type="button">
              <span className={`tile-icon tile-icon-${tile.icon}`}>
                <UiIcon name={tile.icon} size={24} />
              </span>
              <strong>{tile.label}</strong>
              <small>{tile.category}</small>
            </button>
          ))}
          {filtered.length === 0 ? <p className="dictionary-empty">一致する項目はありません。</p> : null}
        </div>
        <p className="dictionary-note">項目の登録・並べ替え・実行はWindows版で利用できます。</p>
      </section>
    </div>
  );
}
