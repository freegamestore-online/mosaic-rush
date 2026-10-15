import {
  canTakeTile,
  createGame,
  isBoardCleared,
  takeTile,
  type GameState,
  type Stack,
} from "./boardState";

/** Default cap on distinct positions explored before giving up. */
export const DEFAULT_MAX_STATES = 200_000;

/**
 * Whether some order of taps clears the whole board without losing.
 *
 * Depth-first search over positions, with duplicates skipped. If the search
 * passes `maxStates` distinct positions it returns false, so a board that
 * was not decided is never treated as solvable.
 */
export function isSolvable(
  cells: readonly (readonly Stack[])[],
  maxStates = DEFAULT_MAX_STATES,
): boolean {
  const start = createGame(cells);
  const seen = new Set<string>([positionKey(start)]);
  const pending: GameState[] = [start];

  let state = pending.pop();
  while (state) {
    if (isBoardCleared(state)) return true;

    for (const [x, y] of tapTargets(state)) {
      const next = takeTile(state, x, y);
      if (next.status === "lost") continue;
      const key = positionKey(next);
      if (seen.has(key)) continue;
      if (seen.size >= maxStates) return false;
      seen.add(key);
      pending.push(next);
    }
    state = pending.pop();
  }
  return false;
}

function tapTargets(state: GameState): [number, number][] {
  const targets: [number, number][] = [];
  state.cells.forEach((row, y) =>
    row.forEach((_stack, x) => {
      if (canTakeTile(state, x, y)) targets.push([x, y]);
    }),
  );
  return targets;
}

/** Key for a position. Tray order does not affect the outcome, so the tray is sorted. */
function positionKey(state: GameState): string {
  return JSON.stringify([state.cells, [...state.tray].sort(), state.status]);
}
