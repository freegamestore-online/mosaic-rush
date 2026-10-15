/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Design tokens and rules are read from the stylesheets, so a change that breaks a
// contrast pair, a tilt limit or a type token fails here rather than in review.
const root = resolve(process.cwd(), "src");
const indexCss = readFileSync(resolve(root, "index.css"), "utf8");
const uiCss = readFileSync(resolve(root, "ui/ui.css"), "utf8");
const tileGame = readFileSync(resolve(root, "game/TileGame.tsx"), "utf8");

/** The body of the first block that starts with `selector`. */
function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return "";
  return source.slice(start, source.indexOf("}", start));
}

/** A colour token's value. Dark-theme blocks fall back to the light value, as the cascade does. */
function token(theme: "light" | "dark", name: string): string {
  const dark = block(indexCss, ':root[data-theme="dark"]');
  const light = block(indexCss, ":root");
  const match = (text: string) => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(text)?.[1];
  const value = (theme === "dark" ? match(dark) : undefined) ?? match(light);
  if (!value) throw new Error(`no colour for ${name} in ${theme}`);
  return value;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe("text contrast (WCAG AA, 4.5:1)", () => {
  const TEXT_ON_SURFACE: [string, string, string][] = [
    ["ink", "paper", "primary text on the page"],
    ["ink", "panel", "primary text on cards"],
    ["muted", "paper", "secondary text on the page"],
    ["muted", "panel", "secondary text on cards"],
    ["accent-ink", "paper", "accent titles on the page"],
    ["accent-ink", "panel", "accent titles on cards"],
    ["accent-ink", "accent-soft", "badge text on the accent tint"],
  ];

  for (const theme of ["light", "dark"] as const) {
    it.each(TEXT_ON_SURFACE)(`${theme}: %s on %s passes`, (fg, bg) => {
      const ratio = contrast(token(theme, `--${fg}`), token(theme, `--${bg}`));
      expect(ratio, `${fg} on ${bg} in ${theme}`).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("the dark accent text is #60a5fa, the value checked for AA", () => {
    expect(token("dark", "--accent-ink").toLowerCase()).toBe("#60a5fa");
  });

  it("white text on the accent fill passes in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(contrast("#ffffff", token(theme, "--accent"))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("tile tilt", () => {
  const tiltRule = block(indexCss.slice(indexCss.indexOf("@media (hover: hover)")), ".tile-tilt:enabled:hover:not(:active) .tile-face");

  it("only applies for a fine pointer on a device that hovers, and never under reduced motion", () => {
    const media = indexCss.slice(indexCss.lastIndexOf("@media (hover: hover)", indexCss.indexOf(".tile-tilt")), indexCss.indexOf(".tile-tilt"));
    expect(media).toContain("(hover: hover)");
    expect(media).toContain("(pointer: fine)");
    expect(media).toContain("(prefers-reduced-motion: no-preference)");
  });

  it("caps the tilt at 6 degrees on either axis", () => {
    const angles = [...tiltRule.matchAll(/rotate[XY]\((-?\d+(?:\.\d+)?)deg\)/g)].map((m) => Math.abs(Number(m[1])));
    expect(angles.length).toBeGreaterThan(0);
    expect(Math.max(...angles)).toBeLessThanOrEqual(6);
  });

  it("leaves a pressed tile to its press transform", () => {
    expect(tiltRule).toBeTruthy();
    expect(indexCss).toContain(".tile-tilt:enabled:hover:not(:active) .tile-face");
  });

  it("is applied to the tile buttons that can be taken", () => {
    expect(tileGame).toContain("tile-tilt");
  });
});

describe("type scale", () => {
  it.each(["--font-display", "--font-body", "--text-stat", "--text-title", "--text-display"])(
    "%s is defined on the root",
    (name) => {
      expect(block(indexCss, ":root")).toContain(`${name}:`);
    },
  );

  it("the display headings and score values read the scale, not literal sizes", () => {
    const start = block(uiCss, ".start-title");
    const resultTitle = block(uiCss, ".result-title");
    const stat = block(uiCss, ".result-stat dd");
    expect(start).toContain("var(--text-display)");
    expect(resultTitle).toContain("var(--text-title)");
    expect(stat).toContain("var(--text-stat)");
  });

  it("Fraunces is named in one place only, the display token", () => {
    expect(indexCss.match(/"Fraunces"/g)?.length).toBe(1);
    expect(uiCss).not.toContain('"Fraunces"');
  });
});
