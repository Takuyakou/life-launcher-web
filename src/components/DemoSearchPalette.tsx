import { useEffect, useMemo, useRef, useState } from "react";
import { DICTIONARY_TILES } from "../demo/seed";
import type { DemoState } from "../demo/types";
import { UiIcon } from "./UiIcon";

type Props = {
  state: DemoState;
  onClose: () => void;
  onSelectNextStep: (projectId: string) => void;
  onSelectWishlist: (wishlistId: string) => void;
  onSelectTile: (label: string) => void;
  onOpenDictionary: () => void;
};

type Result = {
  key: string;
  group: string;
  title: string;
  meta: string;
  hint: string;
  run: () => void;
};

const KATAKANA = /[\u30a1-\u30f6]/g;

const normalizeSearch = (value: string) =>
  value
    .normalize("NFKC")
    .replace(KATAKANA, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60),
    )
    .toLocaleLowerCase();

export function DemoSearchPalette({
  state,
  onClose,
  onSelectNextStep,
  onSelectWishlist,
  onSelectTile,
  onOpenDictionary,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo<Result[]>(() => {
    const needle = normalizeSearch(query.trim());
    if (!needle) return [];
    const list: Result[] = [];
    for (const project of state.projects) {
      if (!project.nextStep) continue;
      const haystack = normalizeSearch(`${project.name}\n${project.nextStep}`);
      if (!haystack.includes(needle)) continue;
      list.push({
        key: `nextstep-${project.id}`,
        group: "次の一手",
        title: project.nextStep,
        meta: project.name,
        hint: "5分で始める",
        run: () => onSelectNextStep(project.id),
      });
    }
    for (const item of state.wishlist) {
      const project = state.projects.find((entry) => entry.id === item.projectId);
      const haystack = normalizeSearch(`${item.label}\n${project?.name ?? ""}`);
      if (!haystack.includes(needle)) continue;
      list.push({
        key: `wishlist-${item.id}`,
        group: "やりたいこと",
        title: item.label,
        meta: project?.name ?? "未分類",
        hint: "今日の3件に入れる",
        run: () => onSelectWishlist(item.id),
      });
    }
    for (const tile of DICTIONARY_TILES) {
      const haystack = normalizeSearch(
        [tile.label, tile.category, ...tile.aliases].join("\n"),
      );
      if (!haystack.includes(needle)) continue;
      list.push({
        key: `tile-${tile.id}`,
        group: "辞書",
        title: tile.label,
        meta: tile.category,
        hint: "開く",
        run: () => onSelectTile(tile.label),
      });
    }
    return list;
  }, [onSelectNextStep, onSelectTile, onSelectWishlist, query, state]);

  useEffect(() => {
    setSelected((current) =>
      results.length === 0 ? 0 : Math.min(current, results.length - 1),
    );
  }, [results.length]);

  const run = (result: Result | undefined) => {
    if (!result) return;
    onClose();
    result.run();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => Math.min(results.length - 1, current + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => Math.max(0, current - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      run(results[selected]);
    }
  };

  let lastGroup = "";

  return (
    <div
      className="dl-palette-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div aria-label="検索" aria-modal="true" className="dl-palette" role="dialog">
        <div className="dl-palette-input-row">
          <UiIcon name="search" size={18} />
          <input
            aria-label="一手・やりたいこと・辞書を検索"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="一手・やりたいこと・辞書を検索"
            ref={inputRef}
            value={query}
          />
          <kbd className="dl-key">Esc</kbd>
        </div>
        <div className="dl-palette-list">
          {query.trim() === "" ? (
            <p className="dl-palette-empty">
              言葉を入れると、次の一手・やりたいこと・辞書から探します。
            </p>
          ) : results.length === 0 ? (
            <p className="dl-palette-empty">
              見つかりませんでした。別の言葉で試してください。
            </p>
          ) : (
            results.map((result, index) => {
              const showGroup = result.group !== lastGroup;
              lastGroup = result.group;
              return (
                <div key={result.key}>
                  {showGroup ? (
                    <p className="dl-palette-group">{result.group}</p>
                  ) : null}
                  <button
                    className="dl-palette-item"
                    data-selected={index === selected ? "true" : undefined}
                    onClick={() => run(result)}
                    onMouseEnter={() => setSelected(index)}
                    type="button"
                  >
                    <span className="dl-palette-title">{result.title}</span>
                    <span className="dl-palette-meta">{result.meta}</span>
                    <span className="dl-palette-hint">{result.hint}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="dl-palette-footer">
          <button className="dl-palette-dict" onClick={onOpenDictionary} type="button">
            辞書を開く
          </button>
          <span>↑↓ 選ぶ ・ Enter 開く</span>
        </div>
      </div>
    </div>
  );
}
