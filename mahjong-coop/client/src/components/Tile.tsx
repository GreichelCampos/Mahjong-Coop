import React from 'react';
import type { Tile as TileType, Player } from '../types';

interface TileProps {
  tile: TileType;
  player?: Player;
}

const Tile: React.FC<TileProps> = ({ tile, player }) => {
  const isLocked = tile.lockedBy !== null && !tile.isMatched;
  const isMatched = tile.isMatched;
  const isFlipped = tile.isFlipped || isMatched;

  return (
    <div
      className={`tile-wrapper ${
        isMatched ? 'matched' : isLocked ? 'locked' : isFlipped ? 'flipped' : 'hidden'
      }`}
    >
      <div className={`tile-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="tile-front">?</div>

        <div className="tile-back">
          <span className="tile-icon">{tile.symbol}</span>

          {isLocked && player && (
            <div className="lock-label">
              {player.name}
            </div>
          )}
        </div>

        {isLocked && <div className="pulse-ring"></div>}
      </div>
    </div>
  );
};

export default Tile;