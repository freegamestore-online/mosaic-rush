import { describe, expect, it } from "vitest";
import { generateLevel, DEFAULT_LEVEL_OPTIONS } from "./levelGenerator";
import { isSolvable } from "./solver";
import { createRng, hashSeed } from "./random";

const countKinds = (cells: ReturnType<typeof generateLevel>) => {
  const counts = new Map<string, number>();
  for (const row of cells) {
    for (const stack of row) {
      for (const kind of stack) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }
  return counts;
};

describe("generateLevel", () => {
  it("is deterministic for the same seed", () => {
    expect(generateLevel("2026-10-15")).toEqual(generateLevel("2026-10-15"));
  });

  it("gives different boards for different seeds", () => {
    expect(generateLevel("alpha")).not.toEqual(generateLevel("beta"));
  });

  it("builds a grid of the configured size with equal-height stacks", () => {
    const { cols, rows } = DEFAULT_LEVEL_OPTIONS;
    const cells = generateLevel("size-check");

    expect(cells).toHaveLength(rows);
    for (const row of cells) expect(row).toHaveLength(cols);
    const heights = new Set(cells.flat().map((stack) => stack.length));
    expect(heights.size).toBe(1);
  });

  it("uses each kind in whole trios", () => {
    const counts = countKinds(generateLevel("trio-check"));

    expect(counts.size).toBe(DEFAULT_LEVEL_OPTIONS.kinds.length);
    for (const count of counts.values()) {
      expect(count % 3).toBe(0);
    }
  });

  it("returns only boards the solver confirms are completable", () => {
    for (const seed of ["one", "two", "three", "2026-10-15"]) {
      expect(isSolvable(generateLevel(seed))).toBe(true);
    }
  });

  it("rejects a tile count that does not divide into the cells", () => {
    expect(() =>
      generateLevel("bad", { cols: 2, rows: 2, kinds: ["R", "O"], triplesPerKind: 1 }),
    ).toThrow(RangeError);
  });
});

describe("seeded random", () => {
  it("hashes a seed to the same value every time", () => {
    expect(hashSeed("mosaic")).toBe(hashSeed("mosaic"));
    expect(hashSeed("mosaic")).not.toBe(hashSeed("Mosaic"));
  });

  it("produces the same sequence for the same seed", () => {
    const a = createRng("seq");
    const b = createRng("seq");
    const first = Array.from({ length: 5 }, () => a());
    expect(first).toEqual(Array.from({ length: 5 }, () => b()));
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
