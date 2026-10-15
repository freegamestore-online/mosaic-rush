import { useMemo, useState } from "react";
import { GameShell, GameTopbar, GameAuth, GameButton, GameTextSizeToggle, GameThemeToggle } from "@freegamestore/games";
import { TileGame, type FinishStats } from "./game/TileGame";
import { levelBoard } from "./game/difficulty";
import { DailyGame } from "./game/DailyGame";
import { levelScore } from "./game/scoring";
import { useBests } from "./game/useBests";
import { useProgress } from "./game/useProgress";
import { usePrefs } from "./game/usePrefs";
import type { Prefs } from "./game/prefs";
import { HOW_TO_PLAY } from "./game/howToPlay";
import { MosaicBackdrop } from "./game/MosaicBackdrop";
import { HowToPlayList } from "./ui/HowToPlay";
import { StartScreen } from "./ui/StartScreen";

type Mode = "levels" | "daily";
type Screen = "start" | "play";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [mode, setMode] = useState<Mode>("levels");
  const { prefs, setPref } = usePrefs();
  const playing = screen === "play";

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Mosaic Rush"
          rules={playing ? <HowToPlayList steps={HOW_TO_PLAY} /> : undefined}
          about={
            <p>
              More free games at{" "}
              <a href="https://freegamestore.online" target="_blank" rel="noopener noreferrer">
                freegamestore.online
              </a>
              .
            </p>
          }
          actions={
            <>
              <GameAuth />
              <GameThemeToggle />
              <GameTextSizeToggle />
            </>
          }
        />
      }
    >
      {playing ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <GameButton variant="ghost" size="sm" onClick={() => setScreen("start")}>
              Menu
            </GameButton>
            <ModeSwitch mode={mode} onChange={setMode} />
            <PrefToggles prefs={prefs} onChange={setPref} />
          </div>
          {mode === "levels" ? <LevelsGame prefs={prefs} /> : <DailyGame prefs={prefs} />}
        </div>
      ) : (
        <StartScreen
          title="Mosaic Rush"
          tagline="Tap tiles into your tray and match three of a kind."
          backdrop={<MosaicBackdrop />}
          howToPlay={HOW_TO_PLAY}
          onPlay={() => setScreen("play")}
        />
      )}
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
      {options.map((option) => (
        <PressButton
          key={option.value}
          pressed={option.value === mode}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </PressButton>
      ))}
    </div>
  );
}

function PrefToggles({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Display">
      <PressButton pressed={prefs.largeTiles} onClick={() => onChange("largeTiles", !prefs.largeTiles)}>
        Large tiles
      </PressButton>
      <PressButton pressed={prefs.colorBlind} onClick={() => onChange("colorBlind", !prefs.colorBlind)}>
        Colour-blind palette
      </PressButton>
    </div>
  );
}

/** A toggle button. `aria-pressed` tells screen readers its state; the focus ring comes from index.css. */
function PressButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="press-toggle whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold"
    >
      {children}
    </button>
  );
}

/** A level's score, from how the game ended. Daily puzzles keep their own score. */
const scoreLevel = (stats: FinishStats) =>
  levelScore({
    tilesCleared: stats.tilesCleared,
    won: stats.outcome === "won",
    seconds: stats.seconds,
    unusedHelpers: stats.unusedHelpers,
  });

function LevelsGame({ prefs }: { prefs: Prefs }) {
  const { progress, complete } = useProgress();
  const { bests, record } = useBests();
  const [levelNumber, setLevelNumber] = useState(progress.unlocked);
  const board = useMemo(() => levelBoard(levelNumber), [levelNumber]);

  return (
    <TileGame
      key={levelNumber}
      label={`Level ${levelNumber}`}
      board={board}
      prefs={prefs}
      scoreOf={scoreLevel}
      best={bests[String(levelNumber)] ?? 0}
      onFinish={(finish) => {
        if (finish.score !== undefined) record(levelNumber, finish.score);
      }}
      onWin={() => complete(levelNumber)}
      onNext={() => setLevelNumber((n) => n + 1)}
    />
  );
}
