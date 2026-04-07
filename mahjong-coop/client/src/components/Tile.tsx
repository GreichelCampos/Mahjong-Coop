import type { Tile as TileType } from '../types';

interface TileProps {
  tile: TileType;
  selectable: boolean;
  onClick: () => void;
}

const TILE_WIDTH = 62;
const TILE_HEIGHT = 82;
const DEPTH_OFFSET = 8;

function Tile({ tile, selectable, onClick }: TileProps) {
  return (
    <button
      type="button"
      className={`tile ${
        tile.isSelected ? 'tile--selected' : ''
      } ${tile.isHinted ? 'tile--hinted' : ''} ${!selectable ? 'tile--blocked' : ''}`}
      onClick={onClick}
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        left: tile.x * (TILE_WIDTH * 0.92),
        top: tile.y * (TILE_HEIGHT * 0.82) - tile.z * DEPTH_OFFSET,
        zIndex: tile.z * 100 + Math.round(tile.y * 10),
      }}
    >
      <span className="tile__shadow" />
      <span className="tile__depth" />
      <span className="tile__face">
        <strong>{tile.label}</strong>
        <small>{tile.category}</small>
      </span>
    </button>
  );
}

export default Tile;
