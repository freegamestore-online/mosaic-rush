/** Identity of a tile. Three tiles of the same kind in the tray clear. */
export type TileKind = string;

/** One board cell: tiles stacked bottom to top. Only the last tile can be taken. */
export type Stack = readonly TileKind[];

export const TRAY_CAPACITY = 7;
export const MATCH_SIZE = 3;

export interface GameState {
  /** `cells[y][x]` is the stack at column `x`, row `y`. */
  readonly cells: readonly (readonly Stack[])[];
  /** Tiles taken off the board, in the order they were taken. */
  readonly tray: readonly TileKind[];
  readonly status: "playing" | "lost";
}

/** Start a game from a grid of stacks (bottom to top in each stack). */
export function createGame(cells: readonly (readonly Stack[])[]): GameState {
  return { cells, tray: [], status: "playing" };
}

/** The stack at column `x`, row `y`, or `undefined` if out of bounds. */
export function getStack(state: GameState, x: number, y: number): Stack | undefined {
  return state.cells[y]?.[x];
}

/** Every tile is off the board and the tray is empty. */
export function isBoardCleared(state: GameState): boolean {
  return state.tray.length === 0 && state.cells.every((row) => row.every((stack) => stack.length === 0));
}

/** Whether a tap on column `x`, row `y` would take a tile. */
export function canTakeTile(state: GameState, x: number, y: number): boolean {
  return state.status === "playing" && (getStack(state, x, y)?.length ?? 0) > 0;
}

/**
 * Take the top tile of the stack at column `x`, row `y` into the tray.
 *
 * Taking from an empty or out-of-bounds cell, or after the game is lost,
 * returns the state unchanged. Otherwise the tile joins the tray, any
 * `MATCH_SIZE` tiles of the taken kind are cleared, and the game is lost
 * if the tray then holds `TRAY_CAPACITY` tiles.
 */
export function takeTile(state: GameState, x: number, y: number): GameState {
  const top = getStack(state, x, y)?.at(-1);
  if (state.status !== "playing" || top === undefined) return state;

  const cells = state.cells.map((row, rowY) =>
    rowY !== y
      ? row
      : row.map((stack, colX) => (colX !== x ? stack : stack.slice(0, -1))),
  );
  const tray = clearMatch([...state.tray, top], top);
  const status = tray.length >= TRAY_CAPACITY ? "lost" : "playing";
  return { cells, tray, status };
}

/** Remove the first `MATCH_SIZE` tiles of `kind` once the tray holds that many. */
function clearMatch(tray: readonly TileKind[], kind: TileKind): TileKind[] {
  if (tray.filter((tile) => tile === kind).length < MATCH_SIZE) return [...tray];

  let toRemove = MATCH_SIZE;
  return tray.filter((tile) => {
    if (tile === kind && toRemove > 0) {
      toRemove -= 1;
      return false;
    }
    return true;
  });
}
