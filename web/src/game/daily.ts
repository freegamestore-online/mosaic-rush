import type { Stack } from "./boardState";
import { levelOptions } from "./difficulty";
import { generateLevel } from "./levelGenerator";

/** Difficulty of the daily board. Level 9 is 7 kinds, the same for every player. */
export const DAILY_DIFFICULTY_LEVEL = 9;

/** The calendar day in UTC, as `YYYY-MM-DD`. Every player sees the same key on the same UTC day. */
export function dailyKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Seed for the daily board. Same day, same seed, same board. */
export function dailySeed(key: string): string {
  return `mosaic-rush:daily:${key}`;
}

/** The daily board for a `YYYY-MM-DD` key. Computed on the client, no server. */
export function dailyBoard(key: string): Stack[][] {
  return generateLevel(dailySeed(key), levelOptions(DAILY_DIFFICULTY_LEVEL));
}
