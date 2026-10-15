import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StartScreen } from "./StartScreen";

const STEPS = [{ heading: "Tap a tile", text: "It joins the tray." }];

describe("StartScreen", () => {
  it("shows the title and calls onPlay from the Play button", () => {
    const onPlay = vi.fn();
    render(<StartScreen title="Demo Game" onPlay={onPlay} />);

    expect(screen.getByRole("heading", { level: 1, name: "Demo Game" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("uses a custom play label", () => {
    render(<StartScreen title="Demo Game" playLabel="Start" onPlay={() => {}} />);
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("hides How to play when no steps are given", () => {
    render(<StartScreen title="Demo Game" onPlay={() => {}} />);
    expect(screen.queryByRole("button", { name: "How to play" })).toBeNull();
  });

  it("opens the how-to-play overlay and closes it with the close button", () => {
    render(<StartScreen title="Demo Game" howToPlay={STEPS} onPlay={() => {}} />);
    expect(screen.queryByText("Tap a tile")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "How to play" }));
    expect(screen.getByText("Tap a tile")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Tap a tile")).toBeNull();
  });

  it("closes the overlay on Escape", () => {
    render(<StartScreen title="Demo Game" howToPlay={STEPS} onPlay={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "How to play" }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Tap a tile")).toBeNull();
  });

  it("hides the decorative backdrop from assistive technology", () => {
    render(<StartScreen title="Demo Game" backdrop={<p>artwork</p>} onPlay={() => {}} />);
    expect(screen.getByText("artwork").closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
