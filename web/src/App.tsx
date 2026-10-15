import { useMemo, useState } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { TileGame } from "./game/TileGame";
import { levelBoard } from "./game/difficulty";
import { dailyBoard, dailyKey } from "./game/daily";
import { useDailyResults } from "./game/useDailyResults";
import { DailyScores } from "./game/DailyScores";
import { useProgress } from "./game/useProgress";

type Mode = "levels" | "daily";

export default function App() {
  const [mode, setMode] = useState<Mode>("levels");

  return (
    <GameShell topbar={<GameTopbar title="Mosaic Rush" score={0} />}>
      <GameAuth />
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <ModeSwitch mode={mode} onChange={setMode} />
        {mode === "levels" ? <LevelsGame /> : <DailyGame />}
      </div>
    </GameShell>
  );
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const options: { value: Mode; label: string }[] = [
    { value: "levels", label: "Levels" },
    { value: "daily", label: "Daily puzzle" },
  ];
  return (
    <div className="flex gap-2" role="group" aria-label="Game mode">
      {options.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={
              active
                ? { background: "var(--accent)", color: "#ffffff" }
                : { border: "2px solid var(--line-strong)" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LevelsGame() {
  const { progress, complete } = useProgress();
  const [levelNumber, setLevelNumber] = useState(progress.unlocked);
  const board = useMemo(() => levelBoard(levelNumber), [levelNumber]);

  return (
    <TileGame
      key={levelNumber}
      label={`Level ${levelNumber}`}
      board={board}
      onWin={() => complete(levelNumber)}
      onNext={() => setLevelNumber((n) => n + 1)}
    />
  );
}

function DailyGame() {
  const key = useMemo(() => dailyKey(new Date()), []);
  const board = useMemo(() => dailyBoard(key), [key]);
  const { results, record } = useDailyResults();
  const result = results[key];

  return (
    <>
      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        {result
          ? `Today's puzzle: ${result.outcome === "won" ? "cleared" : "lost"} in ${result.moves} moves.`
          : "Today's puzzle is the same for everyone. One result counts per day."}
      </p>
      <TileGame
        key={key}
        label={`Daily ${key}`}
        board={board}
        onFinish={(finished) => record(key, finished)}
      />
      <DailyScores />
    </>
  );
}
