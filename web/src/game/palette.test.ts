import { describe, expect, it } from "vitest";
import { COLORBLIND_PALETTE, DEFAULT_PALETTE, contrastRatio, tileText } from "./palette";

const KINDS = ["R", "O", "Y", "G", "T", "B", "V", "P", "N"];

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });
});

describe("tile text", () => {
  it("meets WCAG AA (4.5:1) for every kind in both palettes", () => {
    for (const palette of [DEFAULT_PALETTE, COLORBLIND_PALETTE]) {
      for (const kind of KINDS) {
        const fill = palette[kind] ?? "";
        expect(contrastRatio(tileText(fill), fill), `${kind} ${fill}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("uses dark text on light fills and white on dark fills", () => {
    expect(tileText("#eab308")).toBe("#111111");
    expect(tileText("#1e3a8a")).toBe("#ffffff");
  });
});

describe("palettes", () => {
  it("give every kind its own colour", () => {
    for (const palette of [DEFAULT_PALETTE, COLORBLIND_PALETTE]) {
      const colours = KINDS.map((kind) => palette[kind]);
      expect(new Set(colours).size).toBe(KINDS.length);
    }
  });
});
