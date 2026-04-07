import React from 'react';
import Tile from './Tile';
import type { TileData, Player } from '../types.ts';

interface BoardProps {
  tiles: TileData[];
  players: Player[];
}

const Board: React.FC<BoardProps> = ({ tiles, players }) => {
  return (
    <div className="board-grid">
      {tiles.map(tile => (
        <Tile 
          key={tile.id} 
          tile={tile} 
          player={players.find(p => p.id === tile.lockedBy)} 
        />
      ))}
    </div>
  );
};

export default Board;