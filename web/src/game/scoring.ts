/**
 * Daily score for a win: 1000, plus up to 600 for finishing fast (one point
 * per second under 600), plus 100 for each helper use left unspent.
 * Always an integer.
 */
export function dailyScore({ seconds, unusedHelpers }: { seconds: number; unusedHelpers: number }): number {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const helpers = Math.max(0, Math.floor(unusedHelpers));
  return 1000 + Math.max(0, 600 - wholeSeconds) + 100 * helpers;
}

/**
 * Score for one level: 100 per tile taken off the board. A cleared level also
 * earns the same bonus as a daily win. Always an integer.
 */
export function levelScore({
  tilesCleared,
  won,
  seconds,
  unusedHelpers,
}: {
  tilesCleared: number;
  won: boolean;
  seconds: number;
  unusedHelpers: number;
}): number {
  const base = 100 * Math.max(0, Math.floor(tilesCleared));
  return won ? base + dailyScore({ seconds, unusedHelpers }) : base;
}

/** Points for one clear event: 100 per tile in the trio, so a match of three is +300. */
export function clearPoints(tilesCleared: number): number {
  return Math.max(0, Math.floor(tilesCleared)) * 100;
}

/** Elapsed time as `m:ss`, rounded down to whole seconds. */
export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
