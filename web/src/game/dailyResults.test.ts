import { describe, expect, it } from "vitest";
import {
  DAILY_RESULTS_KEY,
  loadDailyResults,
  recordDailyResult,
  saveDailyResults,
} from "./dailyResults";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("recordDailyResult", () => {
  it("stores a day's first result and ignores later ones", () => {
    const first = recordDailyResult({}, "2026-10-15", { outcome: "lost", moves: 12 });
    const replay = recordDailyResult(first, "2026-10-15", { outcome: "won", moves: 30 });

    expect(first).toEqual({ "2026-10-15": { outcome: "lost", moves: 12 } });
    expect(replay).toBe(first);
  });
});

describe("loadDailyResults", () => {
  it("is empty when nothing is saved", () => {
    expect(loadDailyResults(memoryStore())).toEqual({});
  });

  it("keeps valid entries and drops malformed ones", () => {
    const raw = JSON.stringify({
      "2026-10-15": { outcome: "won", moves: 9 },
      "2026-10-16": { outcome: "draw", moves: 3 },
      "not-a-date": { outcome: "won", moves: 1 },
      "2026-10-17": { outcome: "lost", moves: -2 },
    });
    expect(loadDailyResults(memoryStore({ [DAILY_RESULTS_KEY]: raw }))).toEqual({
      "2026-10-15": { outcome: "won", moves: 9 },
    });
  });

  it("starts empty on corrupt data or when storage throws", () => {
    expect(loadDailyResults(memoryStore({ [DAILY_RESULTS_KEY]: "{oops" }))).toEqual({});
    expect(loadDailyResults(memoryStore({ [DAILY_RESULTS_KEY]: "[]" }))).toEqual({});
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    };
    expect(loadDailyResults(blocked)).toEqual({});
  });
});

describe("saveDailyResults", () => {
  it("round-trips through storage", () => {
    const store = memoryStore();
    const results = { "2026-10-15": { outcome: "won" as const, moves: 7 } };
    saveDailyResults(results, store);
    expect(loadDailyResults(store)).toEqual(results);
  });

  it("does not throw when storage is full", () => {
    const store = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => saveDailyResults({}, store)).not.toThrow();
  });
});
