import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { TileGame } from "./game/TileGame";
import { generateLevel } from "./game/levelGenerator";

/** Fixed seed for now. The daily puzzle (#157) will derive this from the date. */
const LEVEL = generateLevel("mosaic-rush");

export default function App() {
  return (
    <GameShell topbar={<GameTopbar title="Mosaic Rush" score={0} />}>
      <GameAuth />
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <TileGame level={LEVEL} />
      </div>
    </GameShell>
  );
}
