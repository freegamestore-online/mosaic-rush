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
