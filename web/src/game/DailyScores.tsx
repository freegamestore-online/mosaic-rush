import { useState } from "react";
import { Leaderboard, type LeaderboardEntry, type User } from "@freegamestore/games";

/** The one board every daily score is posted to. The platform has no per-day boards. */
export const LEADERBOARD_GAME_ID = "mosaic-rush";

interface DailyScoresProps {
  user: User | null;
  signIn: () => void;
  topScores: LeaderboardEntry[];
  recentScores: LeaderboardEntry[];
  loading: boolean;
}

/**
 * Sign-in status and the top daily scores, shown beside the daily puzzle. The
 * scores open as a panel over the page, so the layout does not move.
 */
export function DailyScores({ user, signIn, topScores, recentScores, loading }: DailyScoresProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative flex items-center justify-center gap-2" aria-label="Leaderboard">
      {user ? (
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Signed in as {user.name}
        </span>
      ) : (
        <button
          type="button"
          onClick={signIn}
          className="whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-sm font-semibold"
          style={{ borderColor: "var(--line-strong)" }}
        >
          Sign in to post scores
        </button>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="whitespace-nowrap rounded-xl border-2 px-3 py-1.5 text-sm font-semibold"
        style={{ borderColor: "var(--line-strong)" }}
      >
        Top daily scores
      </button>
      {open && (
        <div
          className="absolute bottom-full z-10 mb-2 max-h-56 w-72 max-w-[92vw] overflow-y-auto rounded-xl p-2 shadow-lg"
          style={{ background: "var(--paper)", border: "2px solid var(--line-strong)" }}
        >
          <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
        </div>
      )}
    </section>
  );
}
