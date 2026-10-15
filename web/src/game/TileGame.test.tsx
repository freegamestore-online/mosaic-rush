import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLEAR_DELAY_MS } from "./useTileGame";
import { TileGame } from "./TileGame";

const tapped = (label: string) => screen.getByRole("button", { name: label });

describe("TileGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only makes the top tile of each stack tappable", () => {
    render(<TileGame level={[[["R", "O"]]]} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName("Tile O, column 1, row 1");
  });

  it("moves a tapped tile into the tray and reveals the one beneath", () => {
    render(<TileGame level={[[["R", "O"]]]} />);

    fireEvent.click(tapped("Tile O, column 1, row 1"));

    const tray = screen.getByLabelText("Tray, 1 of 7 tiles");
    expect(within(tray).getByText("O")).toBeInTheDocument();
    expect(tapped("Tile R, column 1, row 1")).toBeEnabled();
  });

  it("shows seven tray slots", () => {
    render(<TileGame level={[[["R"]]]} />);

    const tray = screen.getByLabelText("Tray, 0 of 7 tiles");
    expect(tray.children).toHaveLength(7);
  });

  it("clears three matching tiles from the tray after a short delay", () => {
    render(<TileGame level={[[["R"], ["R"], ["R"]]]} />);

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));

    const tray = screen.getByLabelText("Tray, 3 of 7 tiles");
    expect(tray.querySelectorAll(".tile-clear")).toHaveLength(3);

    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });

    expect(screen.getByLabelText("Tray, 0 of 7 tiles")).toBeInTheDocument();
  });

  it("ignores taps while a match is clearing", () => {
    render(<TileGame level={[[["R"], ["R"], ["R"], ["O"]]]} />);

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    fireEvent.click(tapped("Tile O, column 4, row 1"));

    expect(screen.getByLabelText("Tray, 3 of 7 tiles")).toBeInTheDocument();
  });

  it("shows game over when the tray holds seven tiles and allows a restart", () => {
    const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
    render(<TileGame level={[kinds.map((kind) => [kind])]} />);

    kinds.slice(0, 7).forEach((kind, x) => {
      fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`));
    });

    expect(screen.getByText("Tray full. Game over.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tray, 7 of 7 tiles")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));

    expect(screen.getByLabelText("Tray, 0 of 7 tiles")).toBeInTheDocument();
    expect(screen.queryByText("Tray full. Game over.")).not.toBeInTheDocument();
  });
});
