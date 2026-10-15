import {
  MATCH_SIZE,
  createGame,
  isBoardCleared,
  takeTile,
  type GameState,
  type Stack,
  type TileKind,
} from "./boardState";
import { shuffle, type Rng } from "./random";

export interface HelperUses {
  undo: number;
  shuffle: number;
  returnThree: number;
}

/** Uses granted for each level. Helpers cannot be bought. */
export const HELPER_LIMITS: HelperUses = { undo: 3, shuffle: 2, returnThree: 2 };

/**
 * Game state plus what the helpers need: the position before the last
 * change (for undo) and how many uses of each helper remain on this level.
 */
export interface Session {
  state: GameState;
  previous: GameState | null;
  uses: HelperUses;
}

export function startSession(cells: readonly (readonly Stack[])[]): Session {
  return { state: createGame(cells), previous: null, uses: { ...HELPER_LIMITS } };
}

/** Take a tile by tapping. Returns the same session if the tap does nothing. */
export function playTap(session: Session, x: number, y: number): Session {
  const next = takeTile(session.state, x, y);
  if (next === session.state) return session;
  return { ...session, state: next, previous: session.state };
}

/** Restore the position from before the last change. One step deep. */
export function undo(session: Session): Session {
  if (!helperAvailable(session, "undo") || session.previous === null) return session;
  return {
    state: session.previous,
    previous: null,
    uses: { ...session.uses, undo: session.uses.undo - 1 },
  };
}

/** Randomly rearrange the top tiles of the stacks. Covered tiles stay put. */
export function shuffleTop(session: Session, rng: Rng): Session {
  if (!helperAvailable(session, "shuffle")) return session;
  const { state } = session;

  const slots: { x: number; y: number; kind: TileKind }[] = [];
  state.cells.forEach((row, y) =>
    row.forEach((stack, x) => {
      const kind = stack.at(-1);
      if (kind !== undefined) slots.push({ x, y, kind });
    }),
  );
  const kinds = shuffle(
    slots.map((slot) => slot.kind),
    rng,
  );
  const newTop = new Map<string, TileKind>();
  slots.forEach((slot, i) => newTop.set(`${slot.x},${slot.y}`, kinds[i] ?? slot.kind));

  const cells = state.cells.map((row, y) =>
    row.map((stack, x) => {
      const kind = newTop.get(`${x},${y}`);
      return kind === undefined ? stack : [...stack.slice(0, -1), kind];
    }),
  );
  return spend(session, { ...state, cells }, "shuffle");
}

/**
 * Move the three most recently added tray tiles back onto the board. Each
 * tile lands on the top of a randomly chosen cell.
 */
export function returnThree(session: Session, rng: Rng): Session {
  if (!helperAvailable(session, "returnThree")) return session;
  const { state } = session;
  const rows = state.cells.length;
  const cols = state.cells[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return session;

  const returned = state.tray.slice(-MATCH_SIZE);
  let cells = state.cells;
  for (const kind of returned) {
    const x = Math.floor(rng() * cols);
    const y = Math.floor(rng() * rows);
    cells = cells.map((row, rowY) =>
      rowY !== y ? row : row.map((stack, colX) => (colX !== x ? stack : [...stack, kind])),
    );
  }
  return spend(session, { ...state, cells, tray: state.tray.slice(0, -MATCH_SIZE) }, "returnThree");
}

/** Whether a helper can be used now. Undo is off until there is something to undo. */
export function helperAvailable(session: Session, helper: keyof HelperUses): boolean {
  const { state, uses } = session;
  if (uses[helper] <= 0) return false;
  switch (helper) {
    case "undo":
      return session.previous !== null && !isBoardCleared(state);
    case "shuffle":
      return state.status === "playing" && topCount(state) >= 2;
    case "returnThree":
      return state.status === "playing" && state.tray.length >= MATCH_SIZE;
  }
}

/** Spend one use of `helper` and store the old position for undo. */
function spend(session: Session, state: GameState, helper: keyof HelperUses): Session {
  return {
    state,
    previous: session.state,
    uses: { ...session.uses, [helper]: session.uses[helper] - 1 },
  };
}

function topCount(state: GameState): number {
  return state.cells.reduce(
    (count, row) => count + row.filter((stack) => stack.length > 0).length,
    0,
  );
}
