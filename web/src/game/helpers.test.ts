import { describe, expect, it } from "vitest";
import { createRng } from "./random";
import {
  HELPER_LIMITS,
  helperAvailable,
  playTap,
  returnThree,
  shuffleTop,
  startSession,
  undo,
  type Session,
} from "./helpers";

const board = [[["R"], ["O"], ["Y"], ["G"]]];

/** Every tile on the board and in the tray, as a sorted list. */
function allTiles(session: Session): string[] {
  const onBoard = session.state.cells.flatMap((row) => row.flat());
  return [...onBoard, ...session.state.tray].sort();
}

describe("startSession", () => {
  it("grants the full helper limits and no undo history", () => {
    const session = startSession(board);
    expect(session.uses).toEqual(HELPER_LIMITS);
    expect(session.previous).toBeNull();
  });
});

describe("undo", () => {
  it("reverses the last tile move", () => {
    const start = startSession(board);
    const moved = playTap(start, 0, 0);
    const back = undo(moved);

    expect(back.state).toEqual(start.state);
    expect(back.uses.undo).toBe(HELPER_LIMITS.undo - 1);
  });

  it("only goes back one step", () => {
    const start = startSession(board);
    const twoMoves = playTap(playTap(start, 0, 0), 1, 0);
    const back = undo(twoMoves);
    const again = undo(back);

    expect(back.state.tray).toEqual(["R"]);
    expect(again).toBe(back);
    expect(helperAvailable(back, "undo")).toBe(false);
  });

  it("is unavailable before any move and once uses run out", () => {
    const start = startSession(board);
    expect(undo(start)).toBe(start);

    const spent = { ...playTap(start, 0, 0), uses: { ...HELPER_LIMITS, undo: 0 } };
    expect(undo(spent)).toBe(spent);
  });

  it("restores the position from before a helper was used", () => {
    const wide = [[["R"], ["O"], ["Y"], ["G"], ["B"]]];
    const start = startSession(wide);
    const withTray = playTap(playTap(playTap(start, 0, 0), 1, 0), 2, 0);
    // Pick a seed whose shuffle actually changes the board, so undo has work to do.
    const changes = (seed: string) =>
      JSON.stringify(shuffleTop(withTray, createRng(seed)).state) !== JSON.stringify(withTray.state);
    const seed = ["a", "b", "c", "d", "e", "f", "g"].find(changes) ?? "a";
    const shuffled = shuffleTop(withTray, createRng(seed));
    expect(changes(seed)).toBe(true);
    const back = undo(shuffled);

    expect(back.state).toEqual(withTray.state);
  });
});

describe("playTap", () => {
  it("returns the same session when the tap takes nothing", () => {
    const start = startSession([[[], ["R"]]]);
    expect(playTap(start, 0, 0)).toBe(start);
  });
});

describe("shuffleTop", () => {
  const layout = [[["A", "B"], ["C"], ["D", "E", "F"]]];

  it("keeps covered tiles and stack heights, and permutes only the tops", () => {
    const session = startSession(layout);
    const shuffled = shuffleTop(session, createRng("shuffle-1"));
    const [row = []] = shuffled.state.cells;

    expect(row.map((stack) => stack.length)).toEqual([2, 1, 3]);
    expect(row[0]?.[0]).toBe("A");
    expect(row[2]?.slice(0, 2)).toEqual(["D", "E"]);
    expect([row[0]?.at(-1), row[1]?.at(-1), row[2]?.at(-1)].sort()).toEqual(["B", "C", "F"]);
    expect(allTiles(shuffled)).toEqual(allTiles(session));
  });

  it("is deterministic for a given rng", () => {
    const session = startSession(layout);
    expect(shuffleTop(session, createRng("same"))).toEqual(shuffleTop(session, createRng("same")));
  });

  it("is available only with at least two stacks, and spends a use", () => {
    const single = startSession([[["R"], []]]);
    expect(helperAvailable(single, "shuffle")).toBe(false);
    expect(shuffleTop(single, createRng("x"))).toBe(single);

    const session = startSession(layout);
    const shuffled = shuffleTop(session, createRng("x"));
    expect(shuffled.uses.shuffle).toBe(HELPER_LIMITS.shuffle - 1);
  });

  it("stops after the level's limit", () => {
    let session = startSession(layout);
    for (let i = 0; i < HELPER_LIMITS.shuffle; i++) {
      session = shuffleTop(session, createRng(`run-${i}`));
    }
    expect(session.uses.shuffle).toBe(0);
    expect(shuffleTop(session, createRng("extra"))).toBe(session);
  });
});

describe("returnThree", () => {
  it("is unavailable until the tray holds three tiles", () => {
    const session = playTap(playTap(startSession(board), 0, 0), 1, 0);
    expect(helperAvailable(session, "returnThree")).toBe(false);
    expect(returnThree(session, createRng("early"))).toBe(session);
  });

  it("moves the three most recent tray tiles back to the board", () => {
    const start = startSession(board);
    const full = playTap(playTap(playTap(start, 0, 0), 1, 0), 2, 0);
    const back = returnThree(full, createRng("return"));

    expect(back.state.tray).toEqual([]);
    expect(allTiles(back)).toEqual(allTiles(full));
    expect(back.uses.returnThree).toBe(HELPER_LIMITS.returnThree - 1);
  });

  it("keeps older tray tiles in place when only some are returned", () => {
    const wide = [[["R"], ["O"], ["Y"], ["G"], ["B"]]];
    const session = [0, 1, 2, 3].reduce(
      (s, x) => playTap(s, x, 0),
      startSession(wide),
    );
    const back = returnThree(session, createRng("partial"));

    expect(back.state.tray).toEqual(["R"]);
    expect(allTiles(back)).toEqual(allTiles(session));
  });

  it("is deterministic for a given rng", () => {
    const full = playTap(playTap(playTap(startSession(board), 0, 0), 1, 0), 2, 0);
    expect(returnThree(full, createRng("same"))).toEqual(returnThree(full, createRng("same")));
  });
});

describe("helperAvailable", () => {
  it("is off for every helper once a level is cleared", () => {
    const won = startSession([[["R"], ["R"], ["R"]]]);
    const cleared = [0, 1, 2].reduce((s, x) => playTap(s, x, 0), won);
    expect(cleared.state.tray).toEqual([]);
    expect(helperAvailable(cleared, "undo")).toBe(false);
  });
});
