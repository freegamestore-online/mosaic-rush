import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLEAR_DELAY_MS } from "./useTileGame";
import { TileGame } from "./TileGame";

const tapped = (label: string) => screen.getByRole("button", { name: label });

/** Live particle count, as the layer's canvas reports it. */
const liveParticles = () => Number(document.querySelector("canvas")?.dataset.particles);

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Clear a 1×3 board of reds, then run a few frames so the layer publishes its count. */
function clearThreeReds() {
  render(<TileGame label="Level 1" board={[[["R"], ["R"], ["R"]]]} />);
  fireEvent.click(tapped("Tile R, column 1, row 1"));
  fireEvent.click(tapped("Tile R, column 2, row 1"));
  fireEvent.click(tapped("Tile R, column 3, row 1"));
  act(() => {
    vi.advanceTimersByTime(CLEAR_DELAY_MS + 50);
  });
}

describe("TileGame feel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("bursts particles when a trio clears", () => {
    clearThreeReds();
    expect(liveParticles()).toBeGreaterThan(0);
  });

  it("launches nothing when the player prefers reduced motion", () => {
    setReducedMotion(true);
    clearThreeReds();
    expect(liveParticles()).toBe(0);
  });

  it("shakes the whole game once, when the tray fills", () => {
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    try {
      const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
      render(<TileGame label="Level 1" board={[kinds.map((kind) => [kind])]} />);

      kinds.slice(0, 6).forEach((kind, x) => fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`)));
      expect(animate).not.toHaveBeenCalled();

      fireEvent.click(tapped("Tile V, column 7, row 1"));
      expect(animate).toHaveBeenCalledTimes(1);
      expect(animate.mock.contexts[0]).toHaveClass("relative");
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "animate");
    }
  });

  it("pulses the device on a match clear and on game over", () => {
    const vibrate = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    try {
      clearThreeReds();
      expect(vibrate).toHaveBeenLastCalledWith([12, 40, 18]);

      vibrate.mockClear();
      cleanup();
      const kinds = ["R", "O", "Y", "G", "T", "B", "V", "P"];
      render(<TileGame label="Level 1" board={[kinds.map((kind) => [kind])]} />);
      kinds.slice(0, 7).forEach((kind, x) => fireEvent.click(tapped(`Tile ${kind}, column ${x + 1}, row 1`)));
      expect(vibrate).toHaveBeenLastCalledWith([60, 80, 120]);
    } finally {
      Reflect.deleteProperty(navigator, "vibrate");
    }
  });
});

describe("TileGame tile flight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("flies a tapped tile into its tray slot, then lets it settle", () => {
    render(<TileGame label="Level 1" board={[[["R"], ["O"]]]} />);
    fireEvent.click(tapped("Tile O, column 2, row 1"));

    const flying = () => document.querySelector<HTMLElement>('[data-slot="0"] > [data-kind]');
    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(flying()?.style.transform).not.toBe("");

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(flying()?.style.transform).toBe("");
  });

  it("does not fly tiles under reduced motion", () => {
    setReducedMotion(true);
    render(<TileGame label="Level 1" board={[[["R"], ["O"]]]} />);
    fireEvent.click(tapped("Tile O, column 2, row 1"));

    act(() => {
      vi.advanceTimersByTime(16);
    });
    expect(document.querySelector<HTMLElement>('[data-slot="0"] > [data-kind]')?.style.transform).toBe("");
  });
});
