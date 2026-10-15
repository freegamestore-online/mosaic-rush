import { describe, expect, it } from "vitest";
import { isSolvable } from "./solver";

describe("isSolvable", () => {
  it("accepts a board that clears with a single trio", () => {
    expect(isSolvable([[["R"], ["R"], ["R"]]])).toBe(true);
  });

  it("accepts a board that needs stacks taken in an interleaved order", () => {
    // Stack A = [R, O, R] and stack B = [O, O, R], tops last.
    // Take A's R, A's O, B's R, A's R (trio of R clears), then B's O, O.
    expect(isSolvable([[["R", "O", "R"], ["O", "O", "R"]]])).toBe(true);
  });

  it("rejects a board whose kinds do not come in trios", () => {
    expect(isSolvable([[["R"], ["R"]]])).toBe(false);
  });

  it("returns false rather than guessing when the search budget runs out", () => {
    expect(isSolvable([[["R"], ["R"], ["R"]]], 1)).toBe(false);
  });

  it("accepts an empty board", () => {
    expect(isSolvable([[[], []]])).toBe(true);
  });
});
