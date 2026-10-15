import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultOverlay, type ResultOverlayProps } from "./ResultOverlay";

const BASE: ResultOverlayProps = {
  tone: "win",
  eyebrow: "Level 4",
  title: "Level 4 cleared!",
  stats: [
    { label: "Moves", value: "12" },
    { label: "Time", value: "0:42" },
  ],
  badge: "New best!",
  action: { label: "Next level", onClick: () => {} },
};

describe("ResultOverlay", () => {
  it("shows the eyebrow, the title as a heading, the stats and the badge", () => {
    render(<ResultOverlay {...BASE} />);

    expect(screen.getByText("Level 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Level 4 cleared!" })).toBeInTheDocument();
    expect(screen.getByText("Moves").nextElementSibling).toHaveTextContent("12");
    expect(screen.getByText("Time").nextElementSibling).toHaveTextContent("0:42");
    expect(screen.getByText("New best!")).toBeInTheDocument();
  });

  it("is a labelled modal dialog", () => {
    render(<ResultOverlay {...BASE} />);
    const dialog = screen.getByRole("dialog", { name: "Level 4 cleared!" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("focuses the action when it opens", () => {
    render(<ResultOverlay {...BASE} />);
    expect(screen.getByRole("button", { name: "Next level" })).toHaveFocus();
  });

  it("calls the action once when it is pressed", () => {
    const onClick = vi.fn();
    render(<ResultOverlay {...BASE} action={{ label: "Play again", onClick }} />);

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders no button when there is no action", () => {
    render(<ResultOverlay {...BASE} action={undefined} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("adds decorative confetti for a win, and none for a loss", () => {
    const { container, rerender } = render(<ResultOverlay {...BASE} />);
    const confetti = container.querySelector(".confetti");
    expect(confetti).toHaveAttribute("aria-hidden", "true");
    expect(confetti?.querySelectorAll(".confetti-piece").length).toBeGreaterThan(0);

    rerender(<ResultOverlay {...BASE} tone="lose" />);
    expect(container.querySelector(".confetti")).toBeNull();
  });
});
