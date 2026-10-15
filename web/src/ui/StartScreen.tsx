import { useState, type CSSProperties, type ReactNode } from "react";
import { GameButton } from "@freegamestore/games";
import { HowToPlayModal, type HowToPlayStep } from "./HowToPlay";
import "./ui.css";

export interface StartScreenProps {
  /** The game's display name, set large in the display face. */
  title: string;
  /** One line under the title. */
  tagline?: string;
  /** Decorative art above the title. It is hidden from assistive technology. */
  backdrop?: ReactNode;
  /** Steps for the How to play overlay. Omit to hide the button. */
  howToPlay?: readonly HowToPlayStep[];
  /** Label for the main button. Default "Play". */
  playLabel?: string;
  onPlay: () => void;
}

/** Entrance delay for one element, so the screen rises in a sequence. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * A game's start screen: artwork, title, tagline, then Play and How to play.
 * Motion is CSS only and stops under prefers-reduced-motion.
 */
export function StartScreen({ title, tagline, backdrop, howToPlay, playLabel = "Play", onPlay }: StartScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <section className="start-screen" aria-labelledby="start-title">
      {backdrop && (
        <div className="start-backdrop start-enter" style={delay(0)} aria-hidden="true">
          <div className="start-backdrop-art">{backdrop}</div>
        </div>
      )}
      <div className="start-card start-enter" style={delay(120)}>
        <h1 id="start-title" className="start-title">
          {title}
        </h1>
        {tagline && <p className="start-tagline">{tagline}</p>}
        <div className="start-actions">
          <GameButton variant="primary" size="lg" block onClick={onPlay}>
            {playLabel}
          </GameButton>
          {howToPlay && (
            <GameButton variant="secondary" size="md" block onClick={() => setHelpOpen(true)}>
              How to play
            </GameButton>
          )}
        </div>
      </div>
      {howToPlay && <HowToPlayModal open={helpOpen} onClose={() => setHelpOpen(false)} steps={howToPlay} />}
    </section>
  );
}
