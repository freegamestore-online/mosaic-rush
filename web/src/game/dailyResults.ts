/** How a daily puzzle ended, and in how many taps. */
export interface DailyResult {
  outcome: "won" | "lost";
  moves: number;
}

/** Results keyed by `YYYY-MM-DD`. */
export type DailyResults = Record<string, DailyResult>;

export const DAILY_RESULTS_KEY = "mosaic-rush:daily-results";

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/**
 * Record a day's result. The first result for a day is kept, so replaying
 * today's puzzle cannot change it. Returns the same object if nothing changed.
 */
export function recordDailyResult(results: DailyResults, key: string, result: DailyResult): DailyResults {
  if (key in results) return results;
  return { ...results, [key]: result };
}

/**
 * Read saved results. Missing, corrupt or unreadable data gives an empty record,
 * and malformed entries are dropped one by one.
 */
export function loadDailyResults(store?: KeyValueStore): DailyResults {
  try {
    const raw = (store ?? localStorage).getItem(DAILY_RESULTS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).filter(([key, value]) => isDailyKey(key) && isDailyResult(value)),
        );
      }
    }
  } catch {
    // Storage is blocked or the value is not JSON: start with no results.
  }
  return {};
}

/** Save results. If storage is blocked or full, results last only for this page load. */
export function saveDailyResults(results: DailyResults, store?: KeyValueStore): void {
  try {
    (store ?? localStorage).setItem(DAILY_RESULTS_KEY, JSON.stringify(results));
  } catch {
    // Nothing to do: the in-memory results still work.
  }
}

function isDailyKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function isDailyResult(value: unknown): value is DailyResult {
  if (typeof value !== "object" || value === null) return false;
  const { outcome, moves } = value as Record<string, unknown>;
  return (outcome === "won" || outcome === "lost") && typeof moves === "number" && Number.isInteger(moves) && moves >= 0;
}
