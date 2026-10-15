import { describe, expect, it } from "vitest";
import { canTakeTile, createGame, takeTile, TRAY_CAPACITY } from "./boardState";

describe("createGame", () => {
  it("starts with an empty tray and a playing status", () => {
    const state = createGame([[["A"]]]);
    expect(state.tray).toEqual([]);
    expect(state.status).toBe("playing");
  });
});

describe("takeTile", () => {
  it("moves only the top tile of a stack into the tray", () => {
    const state = createGame([[["A", "B"], ["C"]]]);
    const next = takeTile(state, 0, 0);

    expect(next.tray).toEqual(["B"]);
    expect(next.cells[0]?.[0]).toEqual(["A"]);
    expect(next.cells[0]?.[1]).toEqual(["C"]);
  });

  it("reveals the tile underneath on the next take", () => {
    const state = createGame([[["A", "B"]]]);
    const next = takeTile(takeTile(state, 0, 0), 0, 0);

    expect(next.tray).toEqual(["B", "A"]);
    expect(next.cells[0]?.[0]).toEqual([]);
  });

  it("does not mutate the previous state", () => {
    const state = createGame([[["A", "B"]]]);
    takeTile(state, 0, 0);

    expect(state.tray).toEqual([]);
    expect(state.cells[0]?.[0]).toEqual(["A", "B"]);
  });

  it("ignores taps on empty or out-of-bounds cells", () => {
    const state = createGame([[[], ["A"]]]);

    expect(takeTile(state, 0, 0)).toBe(state);
    expect(takeTile(state, 5, 0)).toBe(state);
    expect(takeTile(state, 0, 3)).toBe(state);
  });

  it("reports whether a cell can be tapped", () => {
    const state = createGame([[[], ["A"]]]);

    expect(canTakeTile(state, 0, 0)).toBe(false);
    expect(canTakeTile(state, 1, 0)).toBe(true);
    expect(canTakeTile(state, 9, 9)).toBe(false);
  });

  it("clears three matching tiles once they are all in the tray", () => {
    const state = createGame([[["A"], ["A"], ["A"]]]);
    const next = [0, 1, 2].reduce((s, x) => takeTile(s, x, 0), state);

    expect(next.tray).toEqual([]);
    expect(next.status).toBe("playing");
  });

  it("removes only the three matching tiles and keeps the rest in order", () => {
    // Tray builds up as B, A, A, C, A: the third A completes the match.
    const state = createGame([[["B"], ["A", "A"], ["C"], ["A"]]]);
    const taps: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    const next = taps.reduce((s, [x, y]) => takeTile(s, x, y), state);

    expect(next.tray).toEqual(["B", "C"]);
  });

  it("does not clear two matching tiles", () => {
    const state = createGame([[["A"], ["A"]]]);
    const next = takeTile(takeTile(state, 0, 0), 1, 0);

    expect(next.tray).toEqual(["A", "A"]);
  });

  it("fills the tray up to capacity without ending the game", () => {
    const kinds = ["A", "B", "C", "D", "E", "F", "G"];
    expect(kinds).toHaveLength(TRAY_CAPACITY);
    const state = createGame([kinds.map((kind) => [kind])]);
    const next = kinds.reduce((s, _kind, x) => takeTile(s, x, 0), state);

    expect(next.tray).toEqual(kinds);
    expect(next.status).toBe("playing");
  });

  it("ends the game when a tile is added to a full tray", () => {
    const kinds = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const state = createGame([kinds.map((kind) => [kind])]);
    const full = kinds.slice(0, TRAY_CAPACITY).reduce((s, _kind, x) => takeTile(s, x, 0), state);
    const next = takeTile(full, TRAY_CAPACITY, 0);

    expect(next.status).toBe("lost");
    expect(next.tray).toEqual(full.tray);
    expect(next.cells).toEqual(full.cells);
  });

  it("ends the game on a full tray even if the new tile would complete a match", () => {
    // Tray holds A, A, B, B, C, C, D. Taking another A would form a match.
    const cells = [[["A"], ["A"], ["B"], ["B"], ["C"], ["C"], ["D"], ["A"]]];
    const state = createGame(cells);
    const full = [0, 1, 2, 3, 4, 5, 6].reduce((s, x) => takeTile(s, x, 0), state);
    const next = takeTile(full, 7, 0);

    expect(next.status).toBe("lost");
    expect(next.tray).toHaveLength(TRAY_CAPACITY);
  });

  it("ignores every move after the game is lost", () => {
    const kinds = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const state = createGame([kinds.map((kind) => [kind])]);
    const lost = takeTile(
      kinds.slice(0, TRAY_CAPACITY).reduce((s, _kind, x) => takeTile(s, x, 0), state),
      TRAY_CAPACITY,
      0,
    );

    expect(takeTile(lost, TRAY_CAPACITY, 0)).toBe(lost);
    expect(canTakeTile(lost, TRAY_CAPACITY, 0)).toBe(false);
  });
});
