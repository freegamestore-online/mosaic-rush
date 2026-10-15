export const DAILY_POSTED_KEY = "mosaic-rush:daily-posted";

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** Whether this device has already posted a daily score for `key` (`YYYY-MM-DD`). */
export function hasPostedDaily(key: string, store?: KeyValueStore): boolean {
  try {
    return (store ?? localStorage).getItem(DAILY_POSTED_KEY) === key;
  } catch {
    return false;
  }
}

/** Remember that this device posted for `key`. Storage being blocked only means it may post again. */
export function markPostedDaily(key: string, store?: KeyValueStore): void {
  try {
    (store ?? localStorage).setItem(DAILY_POSTED_KEY, key);
  } catch {
    // Nothing to do.
  }
}
