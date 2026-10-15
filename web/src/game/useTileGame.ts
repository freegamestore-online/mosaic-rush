import { useEffect, useState } from "react";
import { getStack, type Stack, type TileKind } from "./boardState";
import {
  helperAvailable,
  playTap,
  returnThree,
  shuffleTop,
  startSession,
  undo,
  type HelperUses,
  type Session,
} from "./helpers";

/** How long a matched trio stays in the tray, marked as clearing, before it is removed. */
export const CLEAR_DELAY_MS = 350;

export interface TrayTile {
  kind: TileKind;
  clearing: boolean;
}

interface PendingClear {
  next: Session;
  tray: TrayTile[];
}

/** Game session plus tap and helper handling. Input is ignored while a match is clearing. */
export function useTileGame(level: readonly (readonly Stack[])[]) {
  const [session, setSession] = useState(() => startSession(level));
  const [pending, setPending] = useState<PendingClear | null>(null);
  const { state: game } = session;

  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => {
      setSession(pending.next);
      setPending(null);
    }, CLEAR_DELAY_MS);
    return () => clearTimeout(id);
  }, [pending]);

  const tap = (x: number, y: number) => {
    if (pending) return;
    const top = getStack(game, x, y)?.at(-1);
    const next = playTap(session, x, y);
    if (top === undefined || next === session) return;

    if (next.state.tray.length <= game.tray.length) {
      // A match cleared. Show the taken tile and the trio before removing them.
      const tray = [...game.tray, top].map((kind) => ({
        kind,
        clearing: kind === top,
      }));
      setPending({ next, tray });
    } else {
      setSession(next);
    }
  };

  const useHelper = (apply: (current: Session) => Session) => {
    if (pending) return;
    setSession(apply(session));
  };

  const restart = () => {
    setPending(null);
    setSession(startSession(level));
  };

  const tray: TrayTile[] =
    pending?.tray ?? game.tray.map((kind) => ({ kind, clearing: false }));

  const helpers: Record<keyof HelperUses, { available: boolean; remaining: number }> = {
    undo: { available: helperAvailable(session, "undo"), remaining: session.uses.undo },
    shuffle: { available: helperAvailable(session, "shuffle"), remaining: session.uses.shuffle },
    returnThree: {
      available: helperAvailable(session, "returnThree"),
      remaining: session.uses.returnThree,
    },
  };

  return {
    game,
    tray,
    busy: pending !== null,
    tap,
    restart,
    helpers,
    undo: () => useHelper(undo),
    shuffle: () => useHelper((s) => shuffleTop(s, Math.random)),
    returnThree: () => useHelper((s) => returnThree(s, Math.random)),
  };
}
