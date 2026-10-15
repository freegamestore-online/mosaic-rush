/** Which levels the player can reach. Level 1 is always unlocked. */
export interface Progress {
  version: 1;
  /** Highest playable level, 1-based. */
  unlocked: number;
}

export const PROGRESS_KEY = "mosaic-rush:progress";

export const INITIAL_PROGRESS: Progress = { version: 1, unlocked: 1 };

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** Clearing a level unlocks the next. Replaying an earlier level changes nothing. */
export function completeLevel(progress: Progress, level: number): Progress {
  return level === progress.unlocked
    ? { ...progress, unlocked: progress.unlocked + 1 }
    : progress;
}

/**
 * Read saved progress. A missing, corrupt or unreadable value starts fresh,
 * so clearing localStorage also resets progress.
 */
export function loadProgress(store?: KeyValueStore): Progress {
  try {
    const raw = (store ?? localStorage).getItem(PROGRESS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isProgress(parsed)) return parsed;
    }
  } catch {
    // Storage is blocked or the value is not JSON: play from level 1.
  }
  return INITIAL_PROGRESS;
}

/** Save progress. If storage is blocked or full, progress lasts only for this page load. */
export function saveProgress(progress: Progress, store?: KeyValueStore): void {
  try {
    (store ?? localStorage).setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Nothing to do: the in-memory progress still works.
  }
}

function isProgress(value: unknown): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const { version, unlocked } = value as Record<string, unknown>;
  return version === 1 && typeof unlocked === "number" && Number.isInteger(unlocked) && unlocked >= 1;
}
