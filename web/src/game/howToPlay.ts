import type { HowToPlayStep } from "../ui/HowToPlay";
import { TRAY_CAPACITY } from "./boardState";

/** Mosaic Rush's rules, in the order a player meets them. */
export const HOW_TO_PLAY: readonly HowToPlayStep[] = [
  {
    heading: "Tap a top tile",
    text: "It moves into the tray at the bottom. Only the uncovered tile on each stack can be taken.",
  },
  {
    heading: "Make a trio",
    text: "Three tiles of the same kind in the tray clear from it.",
  },
  {
    heading: "Keep the tray open",
    text: `The tray holds ${TRAY_CAPACITY} tiles. A full tray with no trio ends the level.`,
  },
  {
    heading: "Clear the board",
    text: "Take every tile off the board to win the level.",
  },
  {
    heading: "Use helpers when stuck",
    text: "Undo, Shuffle and Return 3 each have a few uses per level.",
  },
];
