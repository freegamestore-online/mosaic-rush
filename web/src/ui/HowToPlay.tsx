import type { CSSProperties } from "react";
import { GameModal } from "@freegamestore/games";
import "./ui.css";

export interface HowToPlayStep {
  heading: string;
  text: string;
}

/** The numbered steps of a game's rules. Used inside the overlay and the SDK topbar rules panel. */
export function HowToPlayList({ steps }: { steps: readonly HowToPlayStep[] }) {
  return (
    <ol className="how-to-steps">
      {steps.map((step, i) => (
        <li key={step.heading} style={{ "--i": i } as CSSProperties}>
          <span className="how-to-num" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <strong>{step.heading}</strong>
            <p>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Fullscreen "How to play" overlay. Closes on the close button, the backdrop or Escape. */
export function HowToPlayModal({
  open,
  onClose,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  steps: readonly HowToPlayStep[];
}) {
  return (
    <GameModal open={open} onClose={onClose} title="How to play">
      <HowToPlayList steps={steps} />
    </GameModal>
  );
}
