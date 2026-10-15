import { Leaderboard, type LeaderboardEntry, type User } from "@freegamestore/games";

/** The one board every daily score is posted to. The platform has no per-day boards. */
export const LEADERBOARD_GAME_ID = "tile-match";

interface DailyScoresProps {
  user: User | null;
  signIn: () => void;
  topScores: LeaderboardEntry[];
  recentScores: LeaderboardEntry[];
  loading: boolean;
}

/** Sign-in status and the top daily scores, shown beside the daily puzzle. */
export function DailyScores({ user, signIn, topScores, recentScores, loading }: DailyScoresProps) {
  return (
    <section className="flex w-full flex-col items-center gap-3" aria-label="Leaderboard">
      {user ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Signed in as {user.name}
        </p>
      ) : (
        <button
          type="button"
          onClick={signIn}
          className="rounded-xl border-2 px-4 py-2 text-sm font-semibold"
          style={{ borderColor: "var(--line-strong)" }}
        >
          Sign in with Google to post scores
        </button>
      )}
      <h2 className="text-sm font-semibold">Top daily scores</h2>
      <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
    </section>
  );
}
