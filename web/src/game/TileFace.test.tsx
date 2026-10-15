import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TileFace } from "./TileGame";
import { COLORBLIND_PALETTE, DEFAULT_PALETTE, type Palette } from "./palette";

const KINDS = ["R", "O", "Y", "G", "T", "B", "V", "P", "N"];
const WHITE = "rgb(255, 255, 255)";

function faceFor(kind: string, palette: Palette): HTMLElement {
  const { container } = render(<TileFace kind={kind} palette={palette} large={false} />);
  const face = container.querySelector<HTMLElement>(".tile-face");
  if (!face) throw new Error(`no tile face rendered for ${kind}`);
  return face;
}

describe("tile face colour", () => {
  for (const [name, palette] of [
    ["default", DEFAULT_PALETTE],
    ["colour-blind", COLORBLIND_PALETTE],
  ] as const) {
    it(`paints each kind with its own palette colour (${name})`, () => {
      const colours = KINDS.map((kind) => {
        const face = faceFor(kind, palette);
        expect(face).toHaveStyle({ backgroundColor: palette[kind] });
        return face.style.backgroundColor;
      });

      expect(new Set(colours).size).toBe(KINDS.length);
      expect(colours).not.toContain(WHITE);
    });
  }

  it("keeps the fill inline, so no stylesheet can replace it", () => {
    const face = faceFor("T", DEFAULT_PALETTE);
    expect(face.style.backgroundColor).toBe("rgb(20, 184, 166)");
  });
});
