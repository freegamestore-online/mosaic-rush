import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DailyGame } from "./DailyGame";
import { DAILY_POSTED_KEY } from "./dailyPost";
import { CLEAR_DELAY_MS } from "./useTileGame";

// The SDK is mocked so no request reaches the live auth or leaderboard workers.
const sdk = vi.hoisted(() => ({
  user: null as null | { id: string; name: string; avatar: string },
  signIn: vi.fn(),
  submitScore: vi.fn(),
}));

vi.mock("@freegamestore/games", async (importOriginal) => {
  const original = await importOriginal<typeof import("@freegamestore/games")>();
  return {
    ...original,
    useAuth: () => ({ user: sdk.user, loading: false, signIn: sdk.signIn, signOut: vi.fn() }),
    useLeaderboard: () => ({
      topScores: [],
      recentScores: [],
      loading: false,
      submitScore: sdk.submitScore,
      refresh: vi.fn(),
    }),
  };
});

const NOW = new Date("2026-10-15T12:00:00Z");
const threeR = [[["R"], ["R"], ["R"]]];
const tapped = (label: string) => screen.getByRole("button", { name: label });

/** Clear the three-R board, `secondsBeforeLastTap` seconds after the first tap. */
function winThreeR(secondsBeforeLastTap: number) {
  fireEvent.click(tapped("Tile R, column 1, row 1"));
  act(() => {
    vi.advanceTimersByTime(secondsBeforeLastTap * 1000);
  });
  fireEvent.click(tapped("Tile R, column 2, row 1"));
  fireEvent.click(tapped("Tile R, column 3, row 1"));
  act(() => {
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
  });
}

describe("DailyGame score posting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T09:00:00Z"));
    localStorage.clear();
    sdk.user = { id: "u1", name: "Ada", avatar: "" };
    sdk.signIn.mockClear();
    sdk.submitScore.mockReset();
    sdk.submitScore.mockResolvedValue({ ok: true, rank: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("posts the first win of the day with its score and marks the day posted", async () => {
    render(<DailyGame now={NOW} board={threeR} />);

    // 100 seconds to the last tap, and all 7 helper uses unspent:
    // 1000 + (600 - 100) + 7 * 100 = 2200.
    winThreeR(100);
    await act(async () => {});

    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
    expect(sdk.submitScore).toHaveBeenCalledWith(2200);
    expect(localStorage.getItem(DAILY_POSTED_KEY)).toBe("2026-10-15");
  });

  it("does not post when signed out, and offers sign-in", async () => {
    sdk.user = null;
    render(<DailyGame now={NOW} board={threeR} />);

    winThreeR(10);
    await act(async () => {});

    expect(sdk.submitScore).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in to post scores" })).toBeInTheDocument();
    expect(localStorage.getItem(DAILY_POSTED_KEY)).toBeNull();
  });

  it("does not post again on a day already posted from this device", async () => {
    localStorage.setItem(DAILY_POSTED_KEY, "2026-10-15");
    render(<DailyGame now={NOW} board={threeR} />);

    winThreeR(10);
    await act(async () => {});

    expect(sdk.submitScore).not.toHaveBeenCalled();
  });

  it("does not post a loss", async () => {
    const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
    render(<DailyGame now={NOW} board={[kinds.map((kind) => [kind])]} />);

    kinds.slice(0, 7).forEach((kind, x) => {
      fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`));
    });
    await act(async () => {});

    expect(screen.getByRole("heading", { name: "Game over" })).toBeInTheDocument();
    expect(sdk.submitScore).not.toHaveBeenCalled();
  });

  it("handles an 'Invalid game' reply quietly and tries again on a later win", async () => {
    sdk.submitScore.mockResolvedValue({ ok: false });
    render(<DailyGame now={NOW} board={threeR} />);

    winThreeR(10);
    await act(async () => {});

    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DAILY_POSTED_KEY)).toBeNull();
    expect(screen.getByText("Daily puzzle cleared!")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("also ignores a post that throws", async () => {
    sdk.submitScore.mockRejectedValue(new Error("network"));
    render(<DailyGame now={NOW} board={threeR} />);

    winThreeR(10);
    await act(async () => {});

    expect(sdk.submitScore).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Daily puzzle cleared!")).toBeInTheDocument();
  });
});
