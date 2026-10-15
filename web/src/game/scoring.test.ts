import { describe, expect, it } from "vitest";
import { dailyScore } from "./scoring";

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
