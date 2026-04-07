import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Board from './components/Board';
import Scoreboard from './components/Scoreboard';
import LiveChart from './components/LiveChart';
import type { GameState, Player, TileData } from './types';
import './App.css';

const MOCK_TILES: string[] = ['🀀', '🀁', '🀂', '🀃', '🀆', '🀅', '🀄', '🀇', '🀏', '🀐', '🀘', '🀙'];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: '1', name: 'Alex', score: 12, color: '#3b82f6' },
      { id: '2', name: 'Jordan', score: 8, color: '#ec4899' },
    ],
    tiles: [],
    isJoined: false,
  });

  const handleJoin = (name: string) => {
    const newUser: Player = { id: 'me', name, score: 0, color: '#10b981' };
    
    // Generate pair-based grid
    const initialTiles: TileData[] = [...MOCK_TILES, ...MOCK_TILES]
      .sort(() => Math.random() - 0.5)
      .map((content, idx) => ({
        id: idx,
        content,
        status: idx % 7 === 0 ? 'locked' : idx % 5 === 0 ? 'matched' : 'hidden',
        lockedBy: idx % 7 === 0 ? '2' : undefined
      }));

    setGameState((prev: GameState) => ({
      ...prev,
      isJoined: true,
      currentUser: newUser,
      players: [...prev.players, newUser],
      tiles: initialTiles
    }));
  };

  if (!gameState.isJoined) {
    return <Lobby onJoin={handleJoin} />;
  }

  return (
    <div className="dashboard-layout">
      <header className="game-header">
        <h1>Mahjong <span>Sync</span></h1>
        <div className="user-badge">{gameState.currentUser?.name} (You)</div>
      </header>
      
      <main className="game-container">
        <div className="board-area">
          <Board tiles={gameState.tiles} players={gameState.players} />
          <LiveChart />
        </div>
        
        <aside className="sidebar">
          <Scoreboard players={gameState.players} />
          <div className="activity-feed">
            <h4>Live Feed</h4>
            <p><span>Jordan</span> matched 🀄 Pair!</p>
            <p><span>Alex</span> is looking at a tile...</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;