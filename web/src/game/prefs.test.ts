import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, PREFS_KEY, loadPrefs, savePrefs } from "./prefs";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("prefs", () => {
  it("defaults when nothing is saved", () => {
    expect(loadPrefs(memoryStore())).toEqual(DEFAULT_PREFS);
  });

  it("round-trips through storage", () => {
    const store = memoryStore();
    savePrefs({ largeTiles: true, colorBlind: true }, store);
    expect(loadPrefs(store)).toEqual({ largeTiles: true, colorBlind: true });
  });

  it("keeps valid fields and defaults the rest", () => {
    const store = memoryStore({ [PREFS_KEY]: JSON.stringify({ largeTiles: true, colorBlind: "yes" }) });
    expect(loadPrefs(store)).toEqual({ largeTiles: true, colorBlind: false });
  });

  it("defaults on corrupt data or when storage throws", () => {
    expect(loadPrefs(memoryStore({ [PREFS_KEY]: "{nope" }))).toEqual(DEFAULT_PREFS);
    expect(loadPrefs(memoryStore({ [PREFS_KEY]: "null" }))).toEqual(DEFAULT_PREFS);
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    };
    expect(loadPrefs(blocked)).toEqual(DEFAULT_PREFS);
  });
});
