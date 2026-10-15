/**
 * Original tile art: one geometric shape per kind, drawn here as SVG paths.
 * The shape is a second cue beside the colour, so the kinds stay apart for
 * players who cannot rely on colour.
 */

interface TileShape {
  /** Spoken name, for documentation and tests. */
  name: string;
  /** Path in a 24×24 box, filled with the tile's text colour. */
  d: string;
}

export const TILE_SHAPES: Readonly<Record<string, TileShape>> = {
  R: { name: "circle", d: "M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14z" },
  O: { name: "square", d: "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
  Y: { name: "triangle", d: "M12 4l8.5 15h-17z" },
  G: { name: "diamond", d: "M12 3l9 9-9 9-9-9z" },
  T: {
    name: "star",
    d: "M12 3L14.35 8.76L20.56 9.22L15.8 13.24L17.29 19.28L12 16L6.71 19.28L8.2 13.24L3.44 9.22L9.65 8.76Z",
  },
  B: { name: "hexagon", d: "M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" },
  V: { name: "crescent", d: "M14.5 3.2a8.8 8.8 0 1 0 6.3 12.5A7 7 0 0 1 14.5 3.2z" },
  P: { name: "cross", d: "M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" },
  N: {
    name: "heart",
    d: "M12 20.5C5 15.8 3 12.6 3 9.2 3 6.4 5.2 4.3 7.9 4.3c1.7 0 3.3.9 4.1 2.3.8-1.4 2.4-2.3 4.1-2.3 2.7 0 4.9 2.1 4.9 4.9 0 3.4-2 6.6-9 11.3z",
  },
};

/** The kind's shape, drawn in the current text colour. Kinds without a shape show nothing. */
export function TileSymbol({ kind }: { kind: string }) {
  const shape = TILE_SHAPES[kind];
  if (!shape) return null;
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={shape.d} />
    </svg>
  );
}
