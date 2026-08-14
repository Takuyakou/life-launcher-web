import type { DictionaryTile } from "./types";

export function filterDictionary(tiles: DictionaryTile[], query: string): DictionaryTile[] {
  const normalized = query.trim().toLocaleLowerCase("ja");
  if (!normalized) return tiles;
  return tiles.filter((tile) =>
    [tile.label, tile.category, ...tile.aliases]
      .join(" ")
      .toLocaleLowerCase("ja")
      .includes(normalized),
  );
}
