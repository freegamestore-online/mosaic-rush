import type { CSSProperties } from "react";
import "./ui.css";

const PIECES = 30;

/** Platform tokens, so confetti follows the theme. */
const DEFAULT_COLOURS = ["var(--accent)", "var(--success)", "var(--warning)", "var(--error)"];

/**
 * Falling confetti for a win. Each piece's position and timing come from its
 * index, so the render is the same every time. Hidden under prefers-reduced-motion.
 */
export function Confetti({ colours = DEFAULT_COLOURS }: { colours?: readonly string[] }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              "--x": `${(i * 37) % 100}%`,
              "--drift": `${((i * 53) % 41) - 20}px`,
              "--spin": `${((i * 97) % 720) - 360}deg`,
              "--delay": `${(i % 7) * 70}ms`,
              "--duration": `${1500 + (i % 5) * 200}ms`,
              "--colour": colours[i % colours.length],
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
