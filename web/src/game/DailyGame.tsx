import { useMemo } from "react";
import { useAuth, useLeaderboard } from "@freegamestore/games";
import type { Stack } from "./boardState";
import { DailyScores, LEADERBOARD_GAME_ID } from "./DailyScores";
import { dailyBoard, dailyKey } from "./daily";
import { hasPostedDaily, markPostedDaily } from "./dailyPost";
import { useDailyResults } from "./useDailyResults";
import { dailyScore } from "./scoring";
import { TileGame, type FinishInfo } from "./TileGame";
import type { Prefs } from "./prefs";

interface DailyGameProps {
  prefs?: Prefs;
  /** Overrides today's date, for tests. */
  now?: Date;
  /** Overrides the day's board, for tests. */
  board?: Stack[][];
}

/**
 * The daily puzzle. A first win on a day, while signed in, posts that day's
 * score to the leaderboard. Only one post per day per device.
 */
export function DailyGame({ prefs, now, board: boardOverride }: DailyGameProps) {
  const key = useMemo(() => dailyKey(now ?? new Date()), []);
  const board = useMemo(() => boardOverride ?? dailyBoard(key), [key, boardOverride]);
  const { results, record } = useDailyResults();
  const { user, signIn } = useAuth();
  const { topScores, recentScores, loading, submitScore } = useLeaderboard(LEADERBOARD_GAME_ID);
  const result = results[key];

  const onFinish = (finish: FinishInfo) => {
    record(key, { outcome: finish.outcome, moves: finish.moves });
    if (finish.outcome !== "won" || !user || hasPostedDaily(key)) return;

    // An "Invalid game" reply (the game is not published yet) or a network
    // failure is not shown. The score is simply not marked as posted, so a
    // later win today can try again.
    submitScore(dailyScore(finish)).then(
      (posted) => {
        if (posted.ok) markPostedDaily(key);
      },
      () => {},
    );
  };

  return (
    <>
      {result && (
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          {`${key}: ${result.outcome === "won" ? "cleared" : "lost"} in ${result.moves} moves.`}
        </p>
      )}
      <TileGame key={key} label="Daily puzzle" board={board} prefs={prefs} onFinish={onFinish} />
      <DailyScores
        user={user}
        signIn={signIn}
        topScores={topScores}
        recentScores={recentScores}
        loading={loading}
      />
    </>
  );
}
