import type { Stack } from "./boardState";
import { generateLevel, type LevelOptions } from "./levelGenerator";

const KIND_POOL = ["R", "O", "Y", "G", "T", "B", "V", "P", "N"];
const MIN_KINDS = 3;

/**
 * Difficulty for a 1-based level number. The board stays 3×3 with three trios
 * per kind, so the stack depth equals the kind count. Each kind added every two
 * levels raises both difficulty axes together, up to all nine kinds.
 */
export function levelOptions(level: number): LevelOptions {
  const kinds = Math.min(
    KIND_POOL.length,
    MIN_KINDS + Math.floor((Math.max(level, 1) - 1) / 2),
  );
  return {
    cols: 3,
    rows: 3,
    kinds: KIND_POOL.slice(0, kinds),
    triplesPerKind: 3,
  };
}

/** The board for a 1-based level. Deterministic for a given level number. */
export function levelBoard(level: number): Stack[][] {
  return generateLevel(`mosaic-rush:${level}`, levelOptions(level));
}
