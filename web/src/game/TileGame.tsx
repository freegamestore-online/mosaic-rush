import { TRAY_CAPACITY, canTakeTile, type GameState, type Stack } from "./boardState";
import { useTileGame, type TrayTile } from "./useTileGame";

const TILE_COLORS: Record<string, string> = {
  R: "#ef4444",
  O: "#f97316",
  Y: "#eab308",
  G: "#22c55e",
  T: "#14b8a6",
  B: "#3b82f6",
  V: "#8b5cf6",
  P: "#ec4899",
  N: "#92400e",
};

/** Vertical offset between tiles in one stack, in px. */
const STACK_OFFSET = 5;

function TileFace({ kind }: { kind: string }) {
  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
      style={{ background: TILE_COLORS[kind] ?? "#6b7280" }}
    >
      {kind}
    </span>
  );
}

export function TileGame({ level }: { level: Stack[][] }) {
  const { game, tray, busy, tap, restart } = useTileGame(level);
  const lost = game.status === "lost";

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <Board game={game} disabled={busy || lost} onTap={tap} />
      <Tray tiles={tray} />
      <p className="min-h-6 text-center" style={{ color: "var(--muted)" }} aria-live="polite">
        {lost ? "Tray full. Game over." : "Tap a top tile to move it to the tray."}
      </p>
      {lost && (
        <button
          type="button"
          onClick={restart}
          className="rounded-xl px-5 py-2 font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Play again
        </button>
      )}
    </div>
  );
}

function Board({
  game,
  disabled,
  onTap,
}: {
  game: GameState;
  disabled: boolean;
  onTap: (x: number, y: number) => void;
}) {
  const cols = game.cells[0]?.length ?? 0;

  return (
    <div
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {game.cells.flatMap((row, y) =>
        row.map((stack, x) => (
          <div key={`${x},${y}`} className="relative aspect-square">
            {stack.map((kind, i) => {
              const isTop = i === stack.length - 1;
              const offset = { transform: `translateY(-${i * STACK_OFFSET}px)`, zIndex: i };
              if (!isTop) {
                return (
                  <div key={i} className="absolute inset-0 opacity-40" style={offset}>
                    <TileFace kind={kind} />
                  </div>
                );
              }
              const tappable = !disabled && canTakeTile(game, x, y);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!tappable}
                  onClick={() => onTap(x, y)}
                  aria-label={`Tile ${kind}, column ${x + 1}, row ${y + 1}`}
                  className="absolute inset-0 rounded-xl transition-transform active:scale-95 disabled:cursor-default enabled:cursor-pointer"
                  style={offset}
                >
                  <TileFace kind={kind} />
                </button>
              );
            })}
          </div>
        )),
      )}
    </div>
  );
}

function Tray({ tiles }: { tiles: TrayTile[] }) {
  return (
    <div
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${TRAY_CAPACITY}, minmax(0, 1fr))` }}
      aria-label={`Tray, ${tiles.length} of ${TRAY_CAPACITY} tiles`}
    >
      {Array.from({ length: TRAY_CAPACITY }, (_, i) => {
        const tile = tiles[i];
        return (
          <div
            key={i}
            className="aspect-square rounded-lg border-2 border-dashed"
            style={{ borderColor: "var(--line)" }}
          >
            {tile && (
              <div
                className={`h-full w-full ${tile.clearing ? "tile-clear" : "tile-enter"}`}
              >
                <TileFace kind={tile.kind} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
