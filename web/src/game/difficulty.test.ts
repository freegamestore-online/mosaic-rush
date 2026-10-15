import { describe, expect, it } from "vitest";
import { levelBoard, levelOptions } from "./difficulty";
import { isBoardCleared, createGame } from "./boardState";
import { isSolvable } from "./solver";

describe("levelOptions", () => {
  it("adds a kind every two levels, capped at nine", () => {
    const kinds = (level: number) => levelOptions(level).kinds.length;

    expect(kinds(1)).toBe(3);
    expect(kinds(2)).toBe(3);
    expect(kinds(3)).toBe(4);
    expect(kinds(9)).toBe(7);
    expect(kinds(13)).toBe(9);
    expect(kinds(50)).toBe(9);
  });

  it("makes stacks deeper as kinds are added", () => {
    for (const level of [1, 5, 13]) {
      const { kinds, cols, rows, triplesPerKind } = levelOptions(level);
      const tiles = kinds.length * 3 * triplesPerKind;
      expect(tiles / (cols * rows)).toBe(kinds.length);
    }
  });
});

describe("levelBoard", () => {
  it("is deterministic for a level number", () => {
    expect(levelBoard(4)).toEqual(levelBoard(4));
  });

  it("gives a different board for a different level", () => {
    expect(levelBoard(1)).not.toEqual(levelBoard(2));
  });

  it("produces solver-verified boards across the early and late curve", () => {
    for (const level of [1, 2, 3, 6, 9, 12, 13, 20, 40]) {
      const cells = levelBoard(level);
      expect(isSolvable(cells)).toBe(true);
      expect(isBoardCleared(createGame(cells))).toBe(false);
    }
  });
});
