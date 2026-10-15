import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { TileGame } from "./game/TileGame";

export default function App() {
  return (
    <GameShell topbar={<GameTopbar title="Mosaic Rush" score={0} />}>
      <GameAuth />
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <TileGame />
      </div>
    </GameShell>
  );
}
