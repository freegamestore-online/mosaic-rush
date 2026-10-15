import { useEffect, useState } from "react";
import {
  createGame,
  getStack,
  takeTile,
  type GameState,
  type Stack,
  type TileKind,
} from "./boardState";

/** How long a matched trio stays in the tray, marked as clearing, before it is removed. */
export const CLEAR_DELAY_MS = 350;

export interface TrayTile {
  kind: TileKind;
  clearing: boolean;
}

interface PendingClear {
  next: GameState;
  tray: TrayTile[];
}

/** Game state plus tap handling. Taps are ignored while a match is clearing. */
export function useTileGame(level: readonly (readonly Stack[])[]) {
  const [game, setGame] = useState(() => createGame(level));
  const [pending, setPending] = useState<PendingClear | null>(null);

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setGame(pending.next);
      setPending(null);
    }, CLEAR_DELAY_MS);
    return () => clearTimeout(id);
  }, [pending]);

  const tap = (x: number, y: number) => {
    if (pending) return;
    const top = getStack(game, x, y)?.at(-1);
    const next = takeTile(game, x, y);
    if (top === undefined || next === game) return;

    if (next.tray.length <= game.tray.length) {
      // A match cleared. Show the taken tile and the trio before removing them.
      const tray = [...game.tray, top].map((kind) => ({
        kind,
        clearing: kind === top,
      }));
      setPending({ next, tray });
    } else {
      setGame(next);
    }
  };

  const restart = () => {
    setPending(null);
    setGame(createGame(level));
  };

  const tray: TrayTile[] =
    pending?.tray ?? game.tray.map((kind) => ({ kind, clearing: false }));

  return { game, tray, busy: pending !== null, tap, restart };
}
