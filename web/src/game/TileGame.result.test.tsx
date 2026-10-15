import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLEAR_DELAY_MS } from "./useTileGame";
import { TileGame, type FinishStats } from "./TileGame";

const tapped = (label: string) => screen.getByRole("button", { name: label });

/** A score that is easy to read in assertions: 100 per tile taken off the board. */
const scoreOf = ({ tilesCleared }: FinishStats) => 100 * tilesCleared;

/** Stat value next to a label in the overlay. */
const stat = (label: string) => screen.getByText(label, { selector: "dt" }).nextElementSibling;

describe("TileGame result overlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function clearThreeReds(props: Partial<Parameters<typeof TileGame>[0]> = {}) {
    render(<TileGame label="Level 5" board={[[["R"], ["R"], ["R"]]]} scoreOf={scoreOf} {...props} />);
    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });
  }

  it("shows the score, tiles cleared, moves, time and helpers left on a win", () => {
    clearThreeReds({ best: 0 });

    expect(screen.getByRole("heading", { name: "Level 5 cleared!" })).toBeInTheDocument();
    expect(stat("Score")).toHaveTextContent("300");
    expect(stat("Tiles cleared")).toHaveTextContent("3");
    expect(stat("Moves")).toHaveTextContent("3");
    expect(stat("Time")).toHaveTextContent("0:00");
    expect(stat("Helpers left")).toHaveTextContent("7");
  });

  it("reports a new best when the score beats the saved best", () => {
    const onFinish = vi.fn();
    clearThreeReds({ best: 200, onFinish });

    expect(screen.getByText("New best!")).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ outcome: "won", score: 300 }));
  });

  it("shows the saved best when the score does not beat it", () => {
    clearThreeReds({ best: 500 });

    expect(screen.queryByText("New best!")).toBeNull();
    expect(screen.getByText("Best: 500")).toBeInTheDocument();
  });

  it("keeps the badge from the finish when the parent later saves a higher best", () => {
    const board = [[["R"], ["R"], ["R"]]];
    const { rerender } = render(<TileGame label="Level 5" board={board} scoreOf={scoreOf} best={200} />);
    fireEvent.click(tapped("Tile R, column 1, row 1"));
    fireEvent.click(tapped("Tile R, column 2, row 1"));
    fireEvent.click(tapped("Tile R, column 3, row 1"));
    act(() => {
      vi.advanceTimersByTime(CLEAR_DELAY_MS);
    });

    // The parent records the 300 as the new best while the overlay is open.
    rerender(<TileGame label="Level 5" board={board} scoreOf={scoreOf} best={300} />);

    expect(screen.getByText("New best!")).toBeInTheDocument();
  });

  it("leaves out the score and the best when no scoring is given", () => {
    clearThreeReds({ scoreOf: undefined, best: undefined });

    expect(screen.queryByText("Score", { selector: "dt" })).toBeNull();
    expect(screen.queryByText(/Best:/)).toBeNull();
    expect(screen.queryByText("New best!")).toBeNull();
  });

  it("offers no next level after a daily-style win with no onNext", () => {
    clearThreeReds();
    expect(screen.queryByRole("button", { name: "Next level" })).toBeNull();
  });

  it("counts tiles cleared on a loss from the board and the tray", () => {
    const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
    render(<TileGame label="Level 6" board={[kinds.map((kind) => [kind])]} scoreOf={scoreOf} />);
    kinds.slice(0, 7).forEach((kind, x) => fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`)));

    const dialog = screen.getByRole("dialog", { name: "Game over" });
    expect(within(dialog).getByText("Tiles cleared").nextElementSibling).toHaveTextContent("0");
    expect(within(dialog).queryByText("Helpers left")).toBeNull();
    expect(within(dialog).getByText("Your tray filled up.")).toBeInTheDocument();
  });
});
