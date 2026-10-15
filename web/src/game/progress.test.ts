import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  INITIAL_PROGRESS,
  PROGRESS_KEY,
  completeLevel,
  loadProgress,
  saveProgress,
} from "./progress";
import { useProgress } from "./useProgress";

/** In-memory stand-in for localStorage. */
function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("completeLevel", () => {
  it("unlocks the next level when the current one is cleared", () => {
    expect(completeLevel({ version: 1, unlocked: 1 }, 1)).toEqual({ version: 1, unlocked: 2 });
  });

  it("ignores a level that is not the newest unlocked one", () => {
    const progress = { version: 1 as const, unlocked: 4 };
    expect(completeLevel(progress, 2)).toBe(progress);
    expect(completeLevel(progress, 5)).toBe(progress);
  });
});

describe("loadProgress", () => {
  it("starts at level 1 when nothing is saved", () => {
    expect(loadProgress(memoryStore())).toEqual(INITIAL_PROGRESS);
  });

  it("restores saved progress", () => {
    const store = memoryStore({ [PROGRESS_KEY]: JSON.stringify({ version: 1, unlocked: 7 }) });
    expect(loadProgress(store)).toEqual({ version: 1, unlocked: 7 });
  });

  it("starts fresh on corrupt or unexpected data", () => {
    const bad = [
      "not json",
      JSON.stringify({ version: 2, unlocked: 3 }),
      JSON.stringify({ version: 1, unlocked: 0 }),
      JSON.stringify({ version: 1, unlocked: 2.5 }),
      JSON.stringify({ version: 1, unlocked: "3" }),
      "null",
    ];
    for (const raw of bad) {
      expect(loadProgress(memoryStore({ [PROGRESS_KEY]: raw }))).toEqual(INITIAL_PROGRESS);
    }
  });

  it("starts fresh when storage throws", () => {
    const store = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    };
    expect(loadProgress(store)).toEqual(INITIAL_PROGRESS);
  });
});

describe("saveProgress", () => {
  it("writes progress under the game's key", () => {
    const store = memoryStore();
    saveProgress({ version: 1, unlocked: 3 }, store);
    expect(JSON.parse(store.data.get(PROGRESS_KEY) ?? "null")).toEqual({ version: 1, unlocked: 3 });
  });

  it("does not throw when storage is full or blocked", () => {
    const store = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => saveProgress({ version: 1, unlocked: 2 }, store)).not.toThrow();
  });
});

describe("useProgress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("unlocks the next level, keeps it after a reload, and resets when storage is cleared", () => {
    const first = renderHook(() => useProgress());
    expect(first.result.current.progress.unlocked).toBe(1);

    act(() => first.result.current.complete(1));
    expect(first.result.current.progress.unlocked).toBe(2);
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "null")).toEqual({ version: 1, unlocked: 2 });

    first.unmount();
    const reloaded = renderHook(() => useProgress());
    expect(reloaded.result.current.progress.unlocked).toBe(2);
    reloaded.unmount();

    localStorage.clear();
    const reset = renderHook(() => useProgress());
    expect(reset.result.current.progress.unlocked).toBe(1);
  });
});
