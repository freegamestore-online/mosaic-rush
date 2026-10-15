/** Fill colour for each tile kind. */
export type Palette = Readonly<Record<string, string>>;

/** Colours for kinds the palette does not name. */
const FALLBACK_TILE = "#6b7280";

export const DEFAULT_PALETTE: Palette = {
  R: "#ef4444",
  O: "#f97316",
  Y: "#eab308",
  G: "#22c55e",
  T: "#14b8a6",
  B: "#3b82f6",
  V: "#7c3aed",
  P: "#ec4899",
  N: "#92400e",
};

/** Okabe-Ito colours plus black and grey, which stay distinct under the common colour-vision deficiencies. */
export const COLORBLIND_PALETTE: Palette = {
  R: "#d55e00",
  O: "#e69f00",
  Y: "#f0e442",
  G: "#009e73",
  T: "#56b4e9",
  B: "#0072b2",
  V: "#cc79a7",
  P: "#000000",
  N: "#6b7280",
};

export function tileColor(palette: Palette, kind: string): string {
  return palette[kind] ?? FALLBACK_TILE;
}

/** Label colour for a tile fill: white or near-black, whichever contrasts more. */
export function tileText(background: string): string {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#111111") ? "#ffffff" : "#111111";
}

/** WCAG 2.x contrast ratio between two `#rrggbb` colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
