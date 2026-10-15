import { describe, expect, it } from "vitest";
import { dailyBoard, dailyKey, dailySeed } from "./daily";
import { isSolvable } from "./solver";

describe("dailyKey", () => {
  it("uses the UTC calendar day, not the local one", () => {
    // 23:30 on the 15th in UTC-5 is already the 16th in UTC.
    expect(dailyKey(new Date("2026-10-15T23:30:00-05:00"))).toBe("2026-10-16");
    expect(dailyKey(new Date("2026-10-15T00:05:00Z"))).toBe("2026-10-15");
  });

  it("is the same for every moment in one UTC day", () => {
    expect(dailyKey(new Date("2026-10-15T00:00:00Z"))).toBe(dailyKey(new Date("2026-10-15T23:59:59Z")));
  });
});

describe("dailySeed", () => {
  it("is namespaced by date", () => {
    expect(dailySeed("2026-10-15")).toBe("mosaic-rush:daily:2026-10-15");
  });
});

describe("dailyBoard", () => {
  it("gives the same board for the same day", () => {
    expect(dailyBoard("2026-10-15")).toEqual(dailyBoard("2026-10-15"));
  });

  it("gives a different board on a different day", () => {
    expect(dailyBoard("2026-10-15")).not.toEqual(dailyBoard("2026-10-16"));
  });

  it("is solver-verified", () => {
    expect(isSolvable(dailyBoard("2026-10-15"))).toBe(true);
  });
});
