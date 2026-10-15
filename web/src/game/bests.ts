/** The best score on each level, keyed by level number. */
export type Bests = Readonly<Record<string, number>>;

export const BESTS_KEY = "mosaic-rush:bests";

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** Keep `score` as the best for `level` if it beats the saved one. Returns the same object if it does not. */
export function recordBest(bests: Bests, level: number, score: number): Bests {
  const current = bests[String(level)] ?? 0;
  if (score <= current) return bests;
  return { ...bests, [String(level)]: score };
}

/**
 * Read saved bests. Missing, corrupt or unreadable data gives an empty record,
 * and malformed entries are dropped one by one.
 */
export function loadBests(store?: KeyValueStore): Bests {
  try {
    const raw = (store ?? localStorage).getItem(BESTS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const bests: Record<string, number> = {};
        for (const [level, score] of Object.entries(parsed)) {
          if (/^[1-9]\d*$/.test(level) && typeof score === "number" && Number.isInteger(score) && score >= 0) {
            bests[level] = score;
          }
        }
        return bests;
      }
    }
  } catch {
    // Storage is blocked or the value is not JSON: start with no bests.
  }
  return {};
}

/** Save bests. If storage is blocked or full, they last only for this page load. */
export function saveBests(bests: Bests, store?: KeyValueStore): void {
  try {
    (store ?? localStorage).setItem(BESTS_KEY, JSON.stringify(bests));
  } catch {
    // Nothing to do: the in-memory bests still work.
  }
}
