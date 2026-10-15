import { describe, expect, it } from "vitest";
import { dailyScore, formatTime, levelScore } from "./scoring";

describe("levelScore", () => {
  it("is 100 per tile taken off the board when the level is lost", () => {
    expect(levelScore({ tilesCleared: 12, won: false, seconds: 30, unusedHelpers: 5 })).toBe(1200);
  });

  it("adds the daily-win bonus when the level is cleared", () => {
    const bonus = dailyScore({ seconds: 100, unusedHelpers: 2 });
    expect(levelScore({ tilesCleared: 9, won: true, seconds: 100, unusedHelpers: 2 })).toBe(900 + bonus);
  });

  it("never goes negative for odd inputs", () => {
    expect(levelScore({ tilesCleared: -3, won: false, seconds: 0, unusedHelpers: 0 })).toBe(0);
  });
});

describe("formatTime", () => {
  it("shows minutes and zero-padded seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(7)).toBe("0:07");
    expect(formatTime(75.9)).toBe("1:15");
    expect(formatTime(600)).toBe("10:00");
  });
});

describe("dailyScore", () => {
  it("is 1000 plus the time bonus plus 100 per unused helper", () => {
    expect(dailyScore({ seconds: 100, unusedHelpers: 7 })).toBe(1000 + 500 + 700);
  });

  it("gives no time bonus at 600 seconds or more", () => {
    expect(dailyScore({ seconds: 600, unusedHelpers: 0 })).toBe(1000);
    expect(dailyScore({ seconds: 9000, unusedHelpers: 0 })).toBe(1000);
  });

  it("floors fractional seconds and counts only whole helper uses", () => {
    expect(dailyScore({ seconds: 59.9, unusedHelpers: 1 })).toBe(1000 + 541 + 100);
  });

  it("always returns an integer", () => {
    for (const seconds of [0, 0.5, 12.34, 599.99, 1000]) {
      expect(Number.isInteger(dailyScore({ seconds, unusedHelpers: 3 }))).toBe(true);
    }
  });
});
