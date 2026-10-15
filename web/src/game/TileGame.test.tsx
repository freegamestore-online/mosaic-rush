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
    render(<TileGame label="Level 1" board={[[["R", "O"]]]} />);

    const buttons = screen.getAllByRole("button", { name: /^Tile / });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName("Tile O, column 1, row 1");
  });

  it("moves a tapped tile into the tray and reveals the one beneath", () => {
    render(<TileGame label="Level 1" board={[[["R", "O"]]]} />);

    fireEvent.click(tapped("Tile O, column 1, row 1"));

    const tray = screen.getByLabelText("Tray, 1 of 7 tiles");
    expect(within(tray).getByText("O")).toBeInTheDocument();
    expect(tapped("Tile R, column 1, row 1")).toBeEnabled();
  });

  it("shows seven tray slots", () => {
    render(<TileGame label="Level 1" board={[[["R"]]]} />);

    const tray = screen.getByLabelText("Tray, 0 of 7 tiles");
    expect(tray.children).toHaveLength(7);
  });

  it("clears three matching tiles from the tray after a short delay", () => {
    render(<TileGame label="Level 1" board={[[["R"], ["R"], ["R"]]]} />);

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
    render(<TileGame label="Level 1" board={[[["R"], ["R"], ["R"], ["O"]]]} />);

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    fireEvent.click(tapped("Tile O, column 4, row 1"));

    expect(screen.getByLabelText("Tray, 3 of 7 tiles")).toBeInTheDocument();
  });

  it("shows game over when the tray holds seven tiles and allows a restart", () => {
    const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
    render(<TileGame label="Level 1" board={[kinds.map((kind) => [kind])]} />);

    kinds.slice(0, 7).forEach((kind, x) => {
      fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`));
    });

    expect(screen.getByRole("heading", { name: "Game over" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tray, 7 of 7 tiles")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));

    expect(screen.getByLabelText("Tray, 0 of 7 tiles")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Game over" })).not.toBeInTheDocument();
  });

  it("reports a win once and offers the next level when the board is cleared", () => {
    const onWin = vi.fn();
    const onNext = vi.fn();
    render(
      <TileGame label="Level 2" board={[[["R"], ["R"], ["R"]]]} onWin={onWin} onNext={onNext} />,
    );

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });

    expect(screen.getByText("Level 2 cleared!")).toBeInTheDocument();
    expect(onWin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Next level" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("reports a loss with the move count once the tray fills", () => {
    const onFinish = vi.fn();
    const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
    render(<TileGame label="Daily" board={[kinds.map((kind) => [kind])]} onFinish={onFinish} />);

    kinds.slice(0, 7).forEach((kind, x) => {
      fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`));
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ outcome: "lost", moves: 7 }));
  });

  it("reports a win with the move count", () => {
    const onFinish = vi.fn();
    render(<TileGame label="Daily" board={[[["R"], ["R"], ["R"]]]} onFinish={onFinish} />);

    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });

    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ outcome: "won", moves: 3 }));
  });

  it("shows helper buttons that start disabled and undo a tap", () => {
    render(<TileGame label="Level 1" board={[[["R", "O"]]]} />);

    const undo = screen.getByRole("button", { name: "Undo (3)" });
    expect(undo).toBeDisabled();
    expect(screen.getByRole("button", { name: "Shuffle (2)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Return 3 (2)" })).toBeDisabled();

    fireEvent.click(tapped("Tile O, column 1, row 1"));
    expect(screen.getByLabelText("Tray, 1 of 7 tiles")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo (3)" }));
    expect(screen.getByLabelText("Tray, 0 of 7 tiles")).toBeInTheDocument();
    expect(tapped("Tile O, column 1, row 1")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Undo (2)" })).toBeDisabled();
  });
});
