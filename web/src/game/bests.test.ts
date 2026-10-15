import { describe, expect, it } from "vitest";
import { BESTS_KEY, loadBests, recordBest, saveBests } from "./bests";

function memoryStore(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[BESTS_KEY, initial]]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("recordBest", () => {
  it("keeps a score only when it beats the saved best for that level", () => {
    const first = recordBest({}, 3, 500);
    expect(first).toEqual({ "3": 500 });
    expect(recordBest(first, 3, 400)).toBe(first);
    expect(recordBest(first, 3, 500)).toBe(first);
    expect(recordBest(first, 3, 900)).toEqual({ "3": 900 });
  });

  it("tracks each level separately", () => {
    expect(recordBest({ "1": 700 }, 2, 300)).toEqual({ "1": 700, "2": 300 });
  });
});

describe("loadBests and saveBests", () => {
  it("round-trips the bests through storage", () => {
    const store = memoryStore();
    saveBests({ "1": 1200, "4": 300 }, store);
    expect(loadBests(store)).toEqual({ "1": 1200, "4": 300 });
  });

  it("starts empty when nothing is saved", () => {
    expect(loadBests(memoryStore())).toEqual({});
  });

  it("starts empty when the saved value is not JSON", () => {
    expect(loadBests(memoryStore("{nope"))).toEqual({});
  });

  it("drops entries that are not whole, non-negative scores on a real level", () => {
    const raw = JSON.stringify({ "1": 800, "2": -5, "3": 1.5, "0": 100, x: 9, "4": "900" });
    expect(loadBests(memoryStore(raw))).toEqual({ "1": 800 });
  });

  it("ignores a saved array", () => {
    expect(loadBests(memoryStore("[1,2,3]"))).toEqual({});
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadBests(blocked)).toEqual({});
    expect(() => saveBests({ "1": 5 }, blocked)).not.toThrow();
  });
});
