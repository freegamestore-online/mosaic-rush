import { useEffect } from "react";
import { useGameSounds } from "@freegamestore/games";
import { TRAY_CAPACITY, canTakeTile, isBoardCleared, type GameState, type Stack } from "./boardState";
import type { DailyResult } from "./dailyResults";
import type { HelperUses } from "./helpers";
import { COLORBLIND_PALETTE, DEFAULT_PALETTE, tileColor, tileText, type Palette } from "./palette";
import { DEFAULT_PREFS, type Prefs } from "./prefs";
import { TileSymbol } from "./tileArt";
import { useTileGame, type TrayTile } from "./useTileGame";

/** Vertical offset between tiles in one stack, in px. */
const STACK_OFFSET = 4;

/**
 * Board width: as wide as the layout allows, and no taller than the viewport
 * leaves room for the rest of the screen, so the game never scrolls.
 */
const BOARD_WIDTH = "min(24rem, 92vw, calc(100svh - 22rem))";
const BOARD_WIDTH_LARGE = "min(30rem, 92vw, calc(100svh - 22rem))";

/**
 * A tile's face. The fill is set inline from the palette, so it always wins over
 * any stylesheet. `.tile-face` adds the raised bevel and the pressed state.
 */
export function TileFace({ kind, palette, large }: { kind: string; palette: Palette; large: boolean }) {
  const fill = tileColor(palette, kind);
  return (
    <span
      className={`tile-face flex h-full w-full items-center justify-center rounded-xl font-bold ${
        large ? "text-2xl" : "text-lg"
      }`}
      style={{ background: fill, color: tileText(fill) }}
    >
      <TileSymbol kind={kind} />
      <span className="sr-only">{kind}</span>
    </span>
  );
}

export interface FinishInfo extends DailyResult {
  /** Whole seconds from the first tap to the finish. */
  seconds: number;
  /** Helper uses left unspent. */
  unusedHelpers: number;
}

interface TileGameProps {
  /** Names the board in the status line, e.g. "Level 3" or "Daily 2026-10-15". */
  label: string;
  board: Stack[][];
  prefs?: Prefs;
  /** Called once when the board is fully cleared. */
  onWin?: () => void;
  /** Called once when the board is won or lost. */
  onFinish?: (finish: FinishInfo) => void;
  onNext?: () => void;
}

export function TileGame({ label, board, prefs = DEFAULT_PREFS, onWin, onFinish, onNext }: TileGameProps) {
  const { game, moves, startedAt, tray, busy, tap, restart, helpers, undo, shuffle, returnThree } =
    useTileGame(board);
  const sounds = useGameSounds();
  const lost = game.status === "lost";
  const won = isBoardCleared(game);
  const outcome = won ? "won" : lost ? "lost" : null;
  const palette = prefs.colorBlind ? COLORBLIND_PALETTE : DEFAULT_PALETTE;

  // Sounds follow state changes. Muting is handled by the SDK, so none of these check it.
  useEffect(() => {
    if (moves > 0) sounds.playMove();
  }, [moves]);

  useEffect(() => {
    if (busy) sounds.playClear();
  }, [busy]);

  useEffect(() => {
    if (won) onWin?.();
  }, [won]);

  useEffect(() => {
    if (won) sounds.playLevelUp();
    if (lost) sounds.playGameOver();
  }, [outcome]);

  useEffect(() => {
    if (!outcome) return;
    const seconds = startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
    const unusedHelpers = helpers.undo.remaining + helpers.shuffle.remaining + helpers.returnThree.remaining;
    onFinish?.({ outcome, moves, seconds, unusedHelpers });
  }, [outcome]);

  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{ width: prefs.largeTiles ? BOARD_WIDTH_LARGE : BOARD_WIDTH }}
    >
      <Board game={game} disabled={busy || lost || won} onTap={tap} palette={palette} large={prefs.largeTiles} />
      <Tray tiles={tray} palette={palette} large={prefs.largeTiles} />
      <HelperBar
        helpers={helpers}
        busy={busy || won}
        onUse={{ undo, shuffle, returnThree }}
      />
      <p className="min-h-6 text-center" style={{ color: "var(--muted)" }} aria-live="polite">
        {won
          ? `${label} cleared!`
          : lost
            ? "Tray full. Game over."
            : `${label}. Tap a top tile.`}
      </p>
      {lost && <ActionButton label="Play again" onClick={restart} />}
      {won && onNext && <ActionButton label="Next level" onClick={onNext} />}
    </div>
  );
}

const HELPER_LABELS: Record<keyof HelperUses, string> = {
  undo: "Undo",
  shuffle: "Shuffle",
  returnThree: "Return 3",
};

function HelperBar({
  helpers,
  busy,
  onUse,
}: {
  helpers: Record<keyof HelperUses, { available: boolean; remaining: number }>;
  busy: boolean;
  onUse: Record<keyof HelperUses, () => void>;
}) {
  return (
    <div className="flex w-full gap-2">
      {(Object.keys(HELPER_LABELS) as (keyof HelperUses)[]).map((key) => {
        const { available, remaining } = helpers[key];
        return (
          <button
            key={key}
            type="button"
            disabled={busy || !available}
            onClick={onUse[key]}
            className="flex-1 whitespace-nowrap rounded-xl border-2 px-1 py-2 text-xs font-semibold disabled:opacity-40"
            style={{ borderColor: "var(--line-strong)" }}
          >
            {`${HELPER_LABELS[key]} (${remaining})`}
          </button>
        );
      })}
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-5 py-2 font-semibold text-white"
      style={{ background: "var(--accent)" }}
    >
      {label}
    </button>
  );
}

function Board({
  game,
  disabled,
  onTap,
  palette,
  large,
}: {
  game: GameState;
  disabled: boolean;
  onTap: (x: number, y: number) => void;
  palette: Palette;
  large: boolean;
}) {
  const cols = game.cells[0]?.length ?? 0;
  // Stacks rise above their cell. Leave room for the tallest one so nothing spills over the board.
  const deepest = Math.max(1, ...game.cells.flat().map((stack) => stack.length));
  const headroom = (deepest - 1) * STACK_OFFSET;

  return (
    <div
      role="group"
      aria-label="Board"
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {game.cells.flatMap((row, y) =>
        row.map((stack, x) => (
          <div key={`${x},${y}`} className="relative aspect-square">
            {stack.map((kind, i) => {
              const isTop = i === stack.length - 1;
              const offset = {
                top: headroom,
                bottom: 0,
                left: 0,
                right: 0,
                transform: `translateY(-${i * STACK_OFFSET}px)`,
                zIndex: i,
              };
              if (!isTop) {
                return (
                  <div key={i} className="absolute opacity-40" style={offset}>
                    <TileFace kind={kind} palette={palette} large={large} />
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
                  className="absolute rounded-xl transition-transform active:scale-95 disabled:cursor-default enabled:cursor-pointer"
                  style={offset}
                >
                  <TileFace kind={kind} palette={palette} large={large} />
                </button>
              );
            })}
          </div>
        )),
      )}
    </div>
  );
}

function Tray({ tiles, palette, large }: { tiles: TrayTile[]; palette: Palette; large: boolean }) {
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
              <div className={`h-full w-full ${tile.clearing ? "tile-clear" : "tile-enter"}`}>
                <TileFace kind={tile.kind} palette={palette} large={large} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
