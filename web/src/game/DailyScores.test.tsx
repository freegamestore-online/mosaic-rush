import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DailyScores } from "./DailyScores";

const base = { topScores: [], recentScores: [], loading: false };

describe("DailyScores", () => {
  it("offers Google sign-in to anonymous players and starts it on click", () => {
    const signIn = vi.fn();
    render(<DailyScores {...base} user={null} signIn={signIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google to post scores" }));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("shows the signed-in name instead of the sign-in button", () => {
    render(
      <DailyScores {...base} user={{ id: "u1", name: "Ada", avatar: "" }} signIn={vi.fn()} />,
    );

    expect(screen.getByText("Signed in as Ada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it("labels the board Top daily scores and lists its entries", () => {
    render(
      <DailyScores
        user={null}
        signIn={vi.fn()}
        topScores={[{ player_name: "Grace", score: 2200, created_at: "2026-10-15T00:00:00Z" }]}
        recentScores={[]}
        loading={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Top daily scores" })).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText((2200).toLocaleString())).toBeInTheDocument();
  });
});
