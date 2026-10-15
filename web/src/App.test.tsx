import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import App from "./App";

// jsdom has no matchMedia. The SDK theme toggle reads the system colour scheme through it.
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

// The account hook talks to the platform. The start flow does not need an account.
vi.mock("@freegamestore/games", async (importOriginal) => {
  const original = await importOriginal<typeof import("@freegamestore/games")>();
  return {
    ...original,
    useAuth: () => ({ user: null, loading: false, signIn: vi.fn(), signOut: vi.fn() }),
  };
});

describe("App", () => {
  it("opens on the start screen, and Play reveals the first level", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Mosaic Rush" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Game mode" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("group", { name: "Game mode" })).toBeInTheDocument();
    expect(screen.getByText("Level 1. Tap a top tile.")).toBeInTheDocument();
  });

  it("Menu returns from play to the start screen", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Game mode" })).toBeNull();
  });
});
