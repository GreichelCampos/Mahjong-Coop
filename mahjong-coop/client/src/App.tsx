import React from 'react';
import Lobby from './components/Lobby';
import Board from './components/Board';
import Scoreboard from './components/Scoreboard';
import LiveChart from './components/LiveChart';
import { useSocket } from './hooks/useSocket';
import './App.css';

const App: React.FC = () => {
  const { socket, gameState, isConnected, joinGame, selectTile } = useSocket();

  const currentUser = gameState?.players.find(
    (player) => player.id === socket?.id
  );

  const hasJoined = Boolean(currentUser);

  if (!hasJoined) {
    return <Lobby onJoin={joinGame} />;
  }

  return (
    <div className="dashboard-layout">
      <header className="game-header">
        <h1>
          Mahjong <span>Sync</span>
        </h1>

        <div className="user-badge">
          {currentUser?.name} (You) {!isConnected && ' - reconectando...'}
        </div>
      </header>

      <main className="game-container">
        <div className="board-area">
          <Board
            tiles={gameState?.tiles ?? []}
            players={gameState?.players ?? []}
            currentPlayerId={socket?.id ?? ''}
            onSelectTile={selectTile}
          />

          <LiveChart
            scoreHistory={gameState?.scoreHistory ?? []}
            players={gameState?.players ?? []}
          />
        </div>

        <aside className="sidebar">
          <Scoreboard players={gameState?.players ?? []} />

          <div className="activity-feed">
            <h4>Live Feed</h4>
            <p>Game running in real time</p>
            <p>Connected players: {gameState?.players.length ?? 0}</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;