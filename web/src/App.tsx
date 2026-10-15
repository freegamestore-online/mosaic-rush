import { useMemo, useState } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { TileGame } from "./game/TileGame";
import { levelBoard } from "./game/difficulty";
import { useProgress } from "./game/useProgress";

export default function App() {
  const { progress, complete } = useProgress();
  const [levelNumber, setLevelNumber] = useState(progress.unlocked);
  const board = useMemo(() => levelBoard(levelNumber), [levelNumber]);

  return (
    <GameShell topbar={<GameTopbar title="Mosaic Rush" score={0} />}>
      <GameAuth />
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <TileGame
          key={levelNumber}
          levelNumber={levelNumber}
          board={board}
          onWin={() => complete(levelNumber)}
          onNext={() => setLevelNumber((n) => n + 1)}
        />
      </div>
    </GameShell>
  );
}
