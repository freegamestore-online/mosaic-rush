import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyScores } from "./DailyScores";

const base = { topScores: [], recentScores: [], loading: false };

describe("DailyScores", () => {
  it("offers Google sign-in to anonymous players and starts it on click", () => {
    const signIn = vi.fn();
    render(<DailyScores {...base} user={null} signIn={signIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in to post scores" }));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("shows the signed-in name instead of the sign-in button", () => {
    render(
      <DailyScores {...base} user={{ id: "u1", name: "Ada", avatar: "" }} signIn={vi.fn()} />,
    );

    expect(screen.getByText("Signed in as Ada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it("opens the top daily scores panel on demand", () => {
    render(
      <DailyScores
        user={null}
        signIn={vi.fn()}
        topScores={[{ player_name: "Grace", score: 2200, created_at: "2026-10-15T00:00:00Z" }]}
        recentScores={[]}
        loading={false}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Top daily scores" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Grace")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText((2200).toLocaleString())).toBeInTheDocument();
  });
});
