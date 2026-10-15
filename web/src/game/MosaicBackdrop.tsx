import { DEFAULT_PALETTE, tileColor, tileText } from "./palette";
import { TILE_SHAPES, TileSymbol } from "./tileArt";

/** The nine tile kinds in a 3×3 mosaic: the game's own art, shown behind the title. */
export function MosaicBackdrop() {
  return (
    <div className="mosaic">
      {Object.keys(TILE_SHAPES).map((kind) => {
        const fill = tileColor(DEFAULT_PALETTE, kind);
        return (
          <span key={kind} className="tile-face mosaic-tile" style={{ background: fill, color: tileText(fill) }}>
            <TileSymbol kind={kind} />
          </span>
        );
      })}
    </div>
  );
}
