import { Leaderboard, useAuth, useLeaderboard } from "@freegamestore/games";

/**
 * The platform leaderboard for this game. The SDK and worker key boards by
 * game only, so these are all-time scores, not a per-day board.
 */
export const LEADERBOARD_GAME_ID = "tile-match";

/** Sign-in status and the platform leaderboard, shown beside the daily puzzle. */
export function DailyScores() {
  const { user, signIn } = useAuth();
  const { topScores, recentScores, loading } = useLeaderboard(LEADERBOARD_GAME_ID);

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
      <h2 className="text-sm font-semibold">All-time top scores</h2>
      <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
    </section>
  );
}
