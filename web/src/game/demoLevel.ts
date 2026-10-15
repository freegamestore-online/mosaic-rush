import type { Stack } from "./boardState";

/**
 * Fixed starter board: 3×3 cells, 3 tiles per cell, 3 of each kind.
 * Placeholder until the level generator (#154) lands.
 */
const KINDS = ["R", "O", "Y", "G", "T", "B", "V", "P", "N"];
const TILES = [...KINDS, ...[...KINDS].reverse(), ...KINDS];

export const DEMO_LEVEL: Stack[][] = [0, 1, 2].map((row) =>
  [0, 1, 2].map((col) => {
    const start = (row * 3 + col) * 3;
    return TILES.slice(start, start + 3);
  }),
);
