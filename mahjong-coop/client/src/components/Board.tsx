import type { CSSProperties } from 'react';
import Tile from './Tile';
import type { TableTheme, Tile as TileType } from '../types';

interface BoardProps {
  tiles: TileType[];
  onTileClick: (id: string) => void;
  isSelectable: (tile: TileType) => boolean;
  theme: TableTheme;
}

function Board({ tiles, onTileClick, isSelectable, theme }: BoardProps) {
  return (
    <section className="table-shell" style={{ '--table-accent': theme.accent } as CSSProperties}>
      <div className="table-shell__frame" style={{ background: theme.background }}>
        <div className="table-shell__glow" />
        <div className="board-canvas">
          {tiles.map((tile) =>
            tile.isMatched ? null : (
              <Tile
                key={tile.id}
                tile={tile}
                selectable={isSelectable(tile)}
                onClick={() => onTileClick(tile.id)}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export default Board;