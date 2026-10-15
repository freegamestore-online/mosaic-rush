import { useEffect, useId, useRef, type CSSProperties } from "react";
import { GameButton } from "@freegamestore/games";
import { Confetti } from "./Confetti";
import "./ui.css";

export interface ResultStat {
  label: string;
  value: string;
}

export interface ResultOverlayProps {
  /** Win shows confetti. Lose shows the card without it. */
  tone: "win" | "lose";
  /** Small line above the title, e.g. the level name. */
  eyebrow?: string;
  /** The headline, set large in the display face. */
  title: string;
  /** One line under the title. */
  message?: string;
  stats: readonly ResultStat[];
  /** A highlight line under the stats, e.g. "New best!". */
  badge?: string;
  /** The primary action. Focused when the overlay opens. Omit for no button. */
  action?: { label: string; onClick: () => void };
}

/** Entrance delay for the nth stat, after the title has landed. */
const statDelay = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Full-area result overlay for a finished game. It covers its nearest positioned
 * ancestor, so place it inside a `position: relative` container. Motion is CSS
 * only and stops under prefers-reduced-motion.
 */
export function ResultOverlay({ tone, eyebrow, title, message, stats, badge, action }: ResultOverlayProps) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus the action so keyboard and screen-reader users land on the next step.
  useEffect(() => {
    cardRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);

  return (
    <div className={`result-overlay result-${tone}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {tone === "win" && <Confetti />}
      <div className="result-card" ref={cardRef}>
        {eyebrow && <p className="result-eyebrow">{eyebrow}</p>}
        <h2 id={titleId} className="result-title">
          {title}
        </h2>
        {message && <p className="result-message">{message}</p>}
        <dl className="result-stats">
          {stats.map((stat, i) => (
            <div key={stat.label} className="result-stat" style={statDelay(i)}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        {badge && <p className="result-badge">{badge}</p>}
        {action && (
          <div className="result-actions">
            <GameButton variant="primary" size="lg" block onClick={action.onClick}>
              {action.label}
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
}
