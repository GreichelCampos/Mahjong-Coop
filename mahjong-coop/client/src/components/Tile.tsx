import React from 'react';
import type { TileData, Player } from '../types.ts';

interface TileProps {
  tile: TileData;
  player?: Player;
}

const Tile: React.FC<TileProps> = ({ tile, player }) => {
  const isLocked = tile.status === 'locked';
  const isMatched = tile.status === 'matched';
  const isFlipped = tile.status === 'flipped' || isMatched || isLocked;

  return (
    <div className={`tile-wrapper ${tile.status}`}>
      <div 
        className={`tile-inner ${isFlipped ? 'flipped' : ''}`} 
        style={{ borderColor: isLocked ? player?.color : '' }}
      >
        <div className="tile-front">?</div>
        
        <div className="tile-back">
          <span className="tile-icon">{tile.content}</span>
          {isLocked && (
            <div 
              className="lock-label" 
              style={{ backgroundColor: player?.color }}
            >
              {player?.name}
            </div>
          )}
        </div>

        {isLocked && (
          <div 
            className="pulse-ring" 
            style={{ borderColor: player?.color }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default Tile;