import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TILE_SHAPES, TileSymbol } from "./tileArt";

const KINDS = ["R", "O", "Y", "G", "T", "B", "V", "P", "N"];

describe("tile art", () => {
  it("gives every kind its own shape", () => {
    const paths = KINDS.map((kind) => TILE_SHAPES[kind]?.d);
    expect(paths.every((d) => typeof d === "string" && d.length > 0)).toBe(true);
    expect(new Set(paths).size).toBe(KINDS.length);
    expect(new Set(KINDS.map((kind) => TILE_SHAPES[kind]?.name)).size).toBe(KINDS.length);
  });

  it("renders a decorative SVG for a kind", () => {
    const { container } = render(<TileSymbol kind="T" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelector("path")).toHaveAttribute("d", TILE_SHAPES.T?.d);
  });

  it("renders nothing for an unknown kind", () => {
    const { container } = render(<TileSymbol kind="?" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
