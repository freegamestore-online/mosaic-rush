import { MATCH_SIZE, type Stack, type TileKind } from "./boardState";
import { createRng, shuffle } from "./random";
import { isSolvable } from "./solver";

export interface LevelOptions {
  cols: number;
  rows: number;
  kinds: readonly TileKind[];
  /** Number of matching trios per kind. */
  triplesPerKind: number;
}

export const DEFAULT_LEVEL_OPTIONS: LevelOptions = {
  cols: 3,
  rows: 3,
  kinds: ["R", "O", "Y", "G", "T", "B"],
  triplesPerKind: 2,
};

const MAX_ATTEMPTS = 100;

/**
 * Deal a board from `seed`. Every stack has the same height.
 * The same seed and options always give the same board.
 *
 * Each candidate is checked with `isSolvable`, and only a solvable board is
 * returned. Throws if no candidate in `MAX_ATTEMPTS` is solvable.
 */
export function generateLevel(
  seed: string,
  options: LevelOptions = DEFAULT_LEVEL_OPTIONS,
): Stack[][] {
  const { cols, rows, kinds, triplesPerKind } = options;
  const cellCount = cols * rows;
  const tiles = kinds.flatMap((kind) =>
    Array.from({ length: MATCH_SIZE * triplesPerKind }, () => kind),
  );
  if (tiles.length === 0 || tiles.length % cellCount !== 0) {
    throw new RangeError(
      `Tile count ${tiles.length} must be a non-zero multiple of ${cellCount} cells`,
    );
  }
  const height = tiles.length / cellCount;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const dealt = shuffle(tiles, createRng(`${seed}:${attempt}`));
    const cells = Array.from({ length: rows }, (_, y) =>
      Array.from({ length: cols }, (_, x) => {
        const start = (y * cols + x) * height;
        return dealt.slice(start, start + height);
      }),
    );
    if (isSolvable(cells)) return cells;
  }
  throw new Error(`No solvable level found for seed "${seed}"`);
}
