import React from 'react';
import type { Player } from '../types.ts';

const Scoreboard: React.FC<{ players: Player[] }> = ({ players }) => (
  <div className="scoreboard">
    <h3>Players</h3>
    {players.sort((a,b) => b.score - a.score).map(p => (
      <div key={p.id} className="player-row">
        <span className="player-color" style={{ backgroundColor: p.color }}></span>
        <span className="player-name">{p.name}</span>
        <span className="player-score">{p.score}</span>
      </div>
    ))}
  </div>
);

export default Scoreboard;