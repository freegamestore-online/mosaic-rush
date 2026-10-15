import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyScores, LEADERBOARD_GAME_ID } from "./DailyScores";

// Mocked so no request goes to the live leaderboard or auth workers.
const auth = vi.hoisted(() => ({
  user: null as null | { id: string; name: string; avatar: string },
  signIn: vi.fn(),
}));
const board = vi.hoisted(() => ({
  topScores: [] as { player_name: string; score: number; created_at: string }[],
  recentScores: [] as { player_name: string; score: number; created_at: string }[],
  loading: false,
}));
const useLeaderboardMock = vi.hoisted(() => vi.fn(() => ({ ...board, submitScore: vi.fn(), refresh: vi.fn() })));

vi.mock("@freegamestore/games", async (importOriginal) => {
  const original = await importOriginal<typeof import("@freegamestore/games")>();
  return {
    ...original,
    useAuth: () => ({ user: auth.user, loading: false, signIn: auth.signIn, signOut: vi.fn() }),
    useLeaderboard: useLeaderboardMock,
  };
});

describe("DailyScores", () => {
  beforeEach(() => {
    auth.user = null;
    auth.signIn.mockClear();
    board.topScores = [];
    board.recentScores = [];
    board.loading = false;
    useLeaderboardMock.mockClear();
  });

  it("offers Google sign-in to anonymous players and starts it on click", () => {
    render(<DailyScores />);

    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google to post scores" }));
    expect(auth.signIn).toHaveBeenCalledTimes(1);
  });

  it("shows the signed-in name instead of the sign-in button", () => {
    auth.user = { id: "u1", name: "Ada", avatar: "" };
    render(<DailyScores />);

    expect(screen.getByText("Signed in as Ada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sign in/ })).not.toBeInTheDocument();
  });

  it("reads the game's leaderboard through the SDK hook", () => {
    render(<DailyScores />);
    expect(useLeaderboardMock).toHaveBeenCalledWith(LEADERBOARD_GAME_ID);
  });

  it("lists top scores from the leaderboard", () => {
    board.topScores = [{ player_name: "Grace", score: 42, created_at: "2026-10-15T00:00:00Z" }];
    board.recentScores = [{ player_name: "Linus", score: 7, created_at: "2026-10-15T01:00:00Z" }];
    render(<DailyScores />);

    expect(screen.getByRole("heading", { name: "All-time top scores" })).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
