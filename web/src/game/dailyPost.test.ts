import { describe, expect, it } from "vitest";
import { DAILY_POSTED_KEY, hasPostedDaily, markPostedDaily } from "./dailyPost";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("daily post marker", () => {
  it("is set for the day it was marked and no other", () => {
    const store = memoryStore();
    expect(hasPostedDaily("2026-10-15", store)).toBe(false);

    markPostedDaily("2026-10-15", store);
    expect(store.data.get(DAILY_POSTED_KEY)).toBe("2026-10-15");
    expect(hasPostedDaily("2026-10-15", store)).toBe(true);
    expect(hasPostedDaily("2026-10-16", store)).toBe(false);
  });

  it("is treated as not posted when storage throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(hasPostedDaily("2026-10-15", blocked)).toBe(false);
    expect(() => markPostedDaily("2026-10-15", blocked)).not.toThrow();
  });
});
