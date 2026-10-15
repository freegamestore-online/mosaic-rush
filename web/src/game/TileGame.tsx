import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GameButton, useGameSounds } from "@freegamestore/games";
import { TRAY_CAPACITY, canTakeTile, isBoardCleared, type GameState, type Stack } from "./boardState";
import type { DailyResult } from "./dailyResults";
import type { HelperUses } from "./helpers";
import { COLORBLIND_PALETTE, DEFAULT_PALETTE, tileColor, tileText, type Palette } from "./palette";
import { DEFAULT_PREFS, type Prefs } from "./prefs";
import { formatTime } from "./scoring";
import { TileSymbol } from "./tileArt";
import { useTileGame, type TrayTile } from "./useTileGame";
import { ResultOverlay, type ResultStat } from "../ui/ResultOverlay";
import { ParticleLayer, type ParticleLayerHandle } from "../feel/ParticleLayer";
import { flyTo, type Box } from "../motion/flight";
import { HAPTICS } from "../feel/haptics";
import { useHaptics } from "../feel/useHaptics";
import { useShake } from "../feel/useShake";
import { prefersReducedMotion } from "../motion/reducedMotion";
import type { BurstOptions } from "../feel/particles";

/** Vertical offset between tiles in one stack, in px. */
const STACK_OFFSET = 4;

/**
 * Board width: as wide as the layout allows, and no taller than the viewport
 * leaves room for the rest of the screen, so the game never scrolls.
 */
const BOARD_WIDTH = "min(24rem, 92vw, calc(100svh - 22rem))";
const BOARD_WIDTH_LARGE = "min(30rem, 92vw, calc(100svh - 22rem))";

/** A cleared trio sprays upward from each of its tray tiles. */
const CLEAR_BURST: BurstOptions = { count: 14, speed: [160, 340], size: [4, 7], life: 0.6, angle: -Math.PI / 2, spread: Math.PI * 0.9 };

/** How long a tapped tile takes to fly from the board into its tray slot. */
const FLIGHT_MS = 240;

/** A win rings out from the middle of the board. */
const WIN_BURST: BurstOptions = { count: 40, speed: [220, 460], size: [5, 9], life: 1.1 };

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

/**
 * Launch a burst from the centre of each element, in the pixel space of `root`.
 * `colours` picks the colours for each element.
 */
function burstFrom(
  root: HTMLElement,
  layer: ParticleLayerHandle | null,
  elements: Iterable<HTMLElement>,
  options: BurstOptions,
  colours: (element: HTMLElement) => readonly string[],
): void {
  if (!layer) return;
  for (const element of elements) {
    const box = boxWithin(element, root);
    layer.burst(box.left + box.width / 2, box.top + box.height / 2, colours(element), options);
  }
}

/** An element's box, measured from the top-left of `root`. */
function boxWithin(element: HTMLElement, root: HTMLElement): Box {
  const origin = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height };
}

/** What a finished game looked like, before any score is applied. */
export interface FinishStats extends DailyResult {
  /** Whole seconds from the first tap to the finish. */
  seconds: number;
  /** Helper uses left unspent. */
  unusedHelpers: number;
  /** Tiles taken off the board, including the ones cleared in trios. */
  tilesCleared: number;
}

export interface FinishInfo extends FinishStats {
  /** From `scoreOf`, when the game was given one. */
  score?: number;
}

/** The summary shown on the result overlay. Captured once, when the game finishes. */
interface Finish extends FinishInfo {
  best?: number;
  newBest: boolean;
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
  /** Score for a finished game. Omit it when the mode has no score of its own. */
  scoreOf?: (stats: FinishStats) => number;
  /** The best score on this board so far, from before this game. */
  best?: number;
}

export function TileGame({
  label,
  board,
  prefs = DEFAULT_PREFS,
  onWin,
  onFinish,
  onNext,
  scoreOf,
  best,
}: TileGameProps) {
  const { game, moves, startedAt, tray, busy, tap, restart, helpers, undo, shuffle, returnThree } =
    useTileGame(board);
  const sounds = useGameSounds();
  const [finish, setFinish] = useState<Finish | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const shakeScreen = useShake(rootRef);
  const haptics = useHaptics();
  const particlesRef = useRef<ParticleLayerHandle>(null);
  /** Where the tile just tapped sat, so its flight into the tray can start there. */
  const flightFrom = useRef<Box | null>(null);
  const cancelFlight = useRef<(() => void) | null>(null);
  const lost = game.status === "lost";
  const won = isBoardCleared(game);
  const outcome = won ? "won" : lost ? "lost" : null;
  const palette = prefs.colorBlind ? COLORBLIND_PALETTE : DEFAULT_PALETTE;
  const totalTiles = useMemo(() => board.flat().reduce((n, stack) => n + stack.length, 0), [board]);

  const tapTile = (x: number, y: number, element: HTMLElement) => {
    const root = rootRef.current;
    flightFrom.current = root && !prefersReducedMotion() ? boxWithin(element, root) : null;
    tap(x, y);
  };

  // The tapped tile flies from the board into its new tray slot. Runs only when the tray grows.
  useLayoutEffect(() => {
    const from = flightFrom.current;
    flightFrom.current = null;
    const root = rootRef.current;
    const last = tray.length - 1;
    const slot = root?.querySelector<HTMLElement>(`[data-slot="${last}"]`);
    const tile = slot?.firstElementChild as HTMLElement | null | undefined;
    if (!from || !root || !slot || !tile || tray[last]?.clearing) return;
    cancelFlight.current?.();
    cancelFlight.current = flyTo(tile, from, boxWithin(slot, root), { duration: FLIGHT_MS });
  }, [tray.length]);

  useEffect(() => () => cancelFlight.current?.(), []);

  // Sounds follow state changes. Muting is handled by the SDK, so none of these check it.
  useEffect(() => {
    if (moves > 0) sounds.playMove();
  }, [moves]);

  useEffect(() => {
    if (!busy) return;
    sounds.playClear();
    haptics.pulse(HAPTICS.clear);
    // Each tile of the trio that is clearing sprays in its own colour.
    const root = rootRef.current;
    if (root) {
      burstFrom(root, particlesRef.current, root.querySelectorAll<HTMLElement>(".tile-clear"), CLEAR_BURST, (el) => [
        tileColor(palette, el.dataset.kind ?? ""),
      ]);
    }
  }, [busy]);

  useEffect(() => {
    if (won) onWin?.();
  }, [won]);

  useEffect(() => {
    const root = rootRef.current;
    const board = root?.querySelector<HTMLElement>('[role="group"][aria-label="Board"]');
    if (won && root && board) burstFrom(root, particlesRef.current, [board], WIN_BURST, () => Object.values(palette));
  }, [won]);

  useEffect(() => {
    if (won) sounds.playLevelUp();
    if (lost) {
      sounds.playGameOver();
      // The tray is full: the whole game jolts once, and the device pulses.
      shakeScreen();
      haptics.pulse(HAPTICS.gameOver);
    }
  }, [outcome]);

  useEffect(() => {
    if (!outcome) {
      setFinish(null);
      return;
    }
    const seconds = startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
    const unusedHelpers = helpers.undo.remaining + helpers.shuffle.remaining + helpers.returnThree.remaining;
    const remaining = game.cells.flat().reduce((n, stack) => n + stack.length, 0) + game.tray.length;
    const stats: FinishStats = {
      outcome,
      moves,
      seconds,
      unusedHelpers,
      tilesCleared: totalTiles - remaining,
    };
    const score = scoreOf?.(stats);
    onFinish?.({ ...stats, score });
    setFinish({
      ...stats,
      score,
      best,
      newBest: score !== undefined && best !== undefined && score > best,
    });
  }, [outcome]);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col items-center gap-3"
      style={{ width: prefs.largeTiles ? BOARD_WIDTH_LARGE : BOARD_WIDTH }}
    >
      <Board game={game} disabled={busy || lost || won} onTap={tapTile} palette={palette} large={prefs.largeTiles} />
      <Tray tiles={tray} palette={palette} large={prefs.largeTiles} />
      <HelperBar
        helpers={helpers}
        busy={busy || won}
        onUse={{ undo, shuffle, returnThree }}
      />
      <p className="min-h-6 text-center" style={{ color: "var(--muted)" }} aria-live="polite">
        {finish ? "" : `${label}. Tap a top tile.`}
      </p>
      {finish && <Result finish={finish} label={label} onRestart={restart} onNext={onNext} />}
      <ParticleLayer ref={particlesRef} />
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
          <div key={key} className="flex-1">
            <GameButton variant="secondary" size="sm" block disabled={busy || !available} onClick={onUse[key]}>
              {`${HELPER_LABELS[key]} (${remaining})`}
            </GameButton>
          </div>
        );
      })}
    </div>
  );
}

/** The win or loss overlay, with the stats and the one action that moves the player on. */
function Result({
  finish,
  label,
  onRestart,
  onNext,
}: {
  finish: Finish;
  label: string;
  onRestart: () => void;
  onNext?: () => void;
}) {
  const won = finish.outcome === "won";
  const stats: ResultStat[] = [
    ...(finish.score === undefined ? [] : [{ label: "Score", value: finish.score.toLocaleString() }]),
    { label: "Tiles cleared", value: String(finish.tilesCleared) },
    { label: "Moves", value: String(finish.moves) },
    { label: "Time", value: formatTime(finish.seconds) },
    ...(won ? [{ label: "Helpers left", value: String(finish.unusedHelpers) }] : []),
  ];
  const badge = finish.newBest
    ? "New best!"
    : finish.best !== undefined && finish.best > 0
      ? `Best: ${finish.best.toLocaleString()}`
      : undefined;
  const action = won ? (onNext && { label: "Next level", onClick: onNext }) : { label: "Play again", onClick: onRestart };

  return (
    <ResultOverlay
      tone={won ? "win" : "lose"}
      eyebrow={label}
      title={won ? `${label} cleared!` : "Game over"}
      message={won ? undefined : "Your tray filled up."}
      stats={stats}
      badge={badge}
      action={action}
    />
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
  onTap: (x: number, y: number, element: HTMLElement) => void;
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
                  onClick={(event) => onTap(x, y, event.currentTarget)}
                  aria-label={`Tile ${kind}, column ${x + 1}, row ${y + 1}`}
                  className="tile-reveal absolute rounded-xl transition-transform active:scale-95 disabled:cursor-default enabled:cursor-pointer"
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
            data-slot={i}
            className="aspect-square rounded-lg border-2 border-dashed"
            style={{ borderColor: "var(--line)" }}
          >
            {tile && (
              <div
                className={`h-full w-full ${tile.clearing ? "tile-clear" : ""}`}
                data-kind={tile.kind}
              >
                <TileFace kind={tile.kind} palette={palette} large={large} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
