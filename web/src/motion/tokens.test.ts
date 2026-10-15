/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest does not return CSS file contents from imports, so the stylesheets are read from disk.
// Tests run from the web/ directory, so the paths are resolved from there.
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const uiCss = readFileSync(resolve(process.cwd(), "src/ui/ui.css"), "utf8");

// These tests guard the tokens and the motion-safe rules, which no component test would notice if they were lost.
/** The declarations inside the first block that starts with `selector`. */
function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return "";
  return source.slice(start, source.indexOf("}", start));
}

const BRAND_TOKENS = ["--paper", "--ink", "--muted", "--line", "--line-strong", "--panel", "--accent", "--accent-soft"];
const MOTION_TOKENS = ["--motion-fast", "--motion-base", "--motion-slow", "--motion-ease-out", "--motion-ease-spring"];

describe("brand tokens", () => {
  it.each(BRAND_TOKENS)("%s is defined for the light theme", (token) => {
    expect(block(css, ":root")).toContain(`${token}:`);
  });

  it("the neutrals and the panel have dark-theme values too", () => {
    const dark = block(css, ':root[data-theme="dark"]');
    for (const token of ["--paper", "--ink", "--muted", "--line", "--line-strong", "--panel"]) {
      expect(dark, token).toContain(`${token}:`);
    }
  });

  it("are documented above the root block", () => {
    const documented = css.slice(0, css.indexOf(":root {"));
    for (const token of BRAND_TOKENS) {
      expect(documented, token).toContain(token);
    }
  });
});

describe("motion tokens", () => {
  it.each(MOTION_TOKENS)("%s is defined on the root", (token) => {
    expect(block(css, ":root")).toContain(`${token}:`);
  });

  it("the reduced-motion block zeroes every duration token", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce) {");
    const reduced = css.slice(start, css.indexOf("\n}\n", start));
    for (const token of ["--motion-fast: 0ms", "--motion-base: 0ms", "--motion-slow: 0ms"]) {
      expect(reduced).toContain(token);
    }
  });

  it("ui.css takes its animation durations from the tokens, not from literals", () => {
    // A duration sits straight after the keyframe name. Delays come later, as offsets, and are allowed as literals.
    const literalDuration = /animation:\s*[\w-]+\s+\d+ms\b/;
    const offenders = uiCss.split("\n").filter((line: string) => literalDuration.test(line));
    expect(offenders).toEqual([]);
  });
});

describe("toggle state", () => {
  it("styles the pressed toggle from aria-pressed, not from inline styles", () => {
    expect(css).toContain('.press-toggle[aria-pressed="true"]');
  });
});
