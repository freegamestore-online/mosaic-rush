/** Display preferences for the game board. */
export interface Prefs {
  /** Bigger board and tile text. */
  largeTiles: boolean;
  /** Colour-blind-safe tile palette. */
  colorBlind: boolean;
}

export const PREFS_KEY = "mosaic-rush:prefs";

export const DEFAULT_PREFS: Prefs = { largeTiles: false, colorBlind: false };

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** Saved preferences. Missing, corrupt or unreadable values fall back to the defaults, field by field. */
export function loadPrefs(store?: KeyValueStore): Prefs {
  try {
    const raw = (store ?? localStorage).getItem(PREFS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        const { largeTiles, colorBlind } = parsed as Record<string, unknown>;
        return {
          largeTiles: typeof largeTiles === "boolean" ? largeTiles : DEFAULT_PREFS.largeTiles,
          colorBlind: typeof colorBlind === "boolean" ? colorBlind : DEFAULT_PREFS.colorBlind,
        };
      }
    }
  } catch {
    // Storage is blocked or the value is not JSON: use the defaults.
  }
  return DEFAULT_PREFS;
}

/** Save preferences. If storage is blocked or full, they last only for this page load. */
export function savePrefs(prefs: Prefs, store?: KeyValueStore): void {
  try {
    (store ?? localStorage).setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Nothing to do: the in-memory preferences still work.
  }
}
