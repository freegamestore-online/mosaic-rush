import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLEAR_DELAY_MS } from "./useTileGame";
import { TileGame } from "./TileGame";
import { COLORBLIND_PALETTE, DEFAULT_PALETTE } from "./palette";

// The SDK sound hook is mocked so the test sees which effect was requested.
// The real hook respects the platform mute toggle.
const sounds = vi.hoisted(() => ({
  playMove: vi.fn(),
  playScore: vi.fn(),
  playError: vi.fn(),
  playGameOver: vi.fn(),
  playLevelUp: vi.fn(),
  playDrop: vi.fn(),
  playClear: vi.fn(),
  playTick: vi.fn(),
}));

vi.mock("@freegamestore/games", async (importOriginal) => {
  const original = await importOriginal<typeof import("@freegamestore/games")>();
  return { ...original, useGameSounds: () => sounds };
});

const tapped = (label: string) => screen.getByRole("button", { name: label });

describe("TileGame sound", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const fn of Object.values(sounds)) fn.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays a move sound on a tap and nothing on first render", () => {
    render(<TileGame label="Level 1" board={[[["R", "O"]]]} />);
    expect(sounds.playMove).not.toHaveBeenCalled();

    fireEvent.click(tapped("Tile O, column 1, row 1"));
    expect(sounds.playMove).toHaveBeenCalledTimes(1);
    expect(sounds.playClear).not.toHaveBeenCalled();
  });

  it("plays a clear sound when three matching tiles leave the board", () => {
    render(<TileGame label="Level 1" board={[[["R"], ["R"], ["R"]]]} />);

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    expect(sounds.playClear).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });
    expect(sounds.playLevelUp).toHaveBeenCalledTimes(1);
    expect(sounds.playGameOver).not.toHaveBeenCalled();
  });

  it("plays the game-over sound when the tray fills", () => {
    const kinds = ["R", "O", "Y", "G", "T", "B", "V"];
    render(<TileGame label="Level 1" board={[kinds.concat("P").map((kind) => [kind])]} />);

    kinds.forEach((kind, x) => fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`)));

    expect(sounds.playGameOver).toHaveBeenCalledTimes(1);
    expect(sounds.playLevelUp).not.toHaveBeenCalled();
  });
});

describe("TileGame display preferences", () => {
  it("uses the colour-blind palette when asked", () => {
    render(<TileGame label="Level 1" board={[[["R"]]]} prefs={{ largeTiles: false, colorBlind: true }} />);
    const face = tapped("Tile R, column 1, row 1").querySelector("span");
    expect(face).toHaveStyle({ background: COLORBLIND_PALETTE.R });
  });

  it("uses the default palette otherwise", () => {
    render(<TileGame label="Level 1" board={[[["R"]]]} />);
    const face = tapped("Tile R, column 1, row 1").querySelector("span");
    expect(face).toHaveStyle({ background: DEFAULT_PALETTE.R });
  });

  it("enlarges tile text in large-tile mode", () => {
    render(<TileGame label="Level 1" board={[[["R"]]]} prefs={{ largeTiles: true, colorBlind: false }} />);
    const face = tapped("Tile R, column 1, row 1").querySelector("span");
    expect(face?.className).toContain("text-2xl");
  });
});
