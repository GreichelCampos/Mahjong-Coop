import React, { useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import LiveChart from './components/LiveChart';
import Lobby from './components/Lobby';
import Scoreboard from './components/Scoreboard';
import { useSocket } from './hooks/useSocket';
import type {
  Opponent,
  PlayerStanding,
  ScorePoint,
  ScreenState,
  TableTheme,
  Tile,
} from './types';
import './App.css';

const DEFAULT_THEME: TableTheme = {
  id: 'night',
  name: 'Night',
  background: 'radial-gradient(circle at top, #16314f 0%, #08152f 38%, #030b18 100%)',
  accent: '#f59e0b',
};

const PLAYER_COLORS = ['#38bdf8', '#f97316', '#22c55e', '#a78bfa', '#f43f5e'];

function App() {
  const {
    socket,
    gameState,
    isConnected,
    roomCode,
    createRoom,
    joinGame,
    selectTile,
    leaveRoom,
  } = useSocket();

  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [tempName, setTempName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [roomName, setRoomName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTheme] = useState<TableTheme>(DEFAULT_THEME);

  const currentUser = gameState?.players.find((player) => player.id === socket?.id);
  const connectedPlayers = useMemo(
    () => (gameState?.players ?? []).filter((player) => player.isConnected),
    [gameState?.players],
  );

  const currentPlayers = connectedPlayers.length;

  useEffect(() => {
    if (screen !== 'loading') return;

    setLoadingProgress(0);

    const interval = window.setInterval(() => {
      setLoadingProgress((previous) => {
        if (previous >= 100) {
          window.clearInterval(interval);
          setScreen('playing');
          return 100;
        }

        return previous + 10;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [screen]);

  const handleConfirmName = () => {
    if (!tempName.trim()) return;

    setPlayerName(tempName.trim());
    setScreen('menu');
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) return;

    const nextRoomCode = await createRoom();
    const response = await joinGame(playerName, nextRoomCode);

    if (response.ok) {
      setScreen('lobby');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || inputCode.trim().length !== 6) return;

    const normalizedCode = inputCode.trim().toUpperCase();
    const response = await joinGame(playerName, normalizedCode);

    if (response.ok) {
      setScreen('loading');
    }
  };

  const handleBackToMenu = () => {
    leaveRoom();
    setScreen('menu');
    setRoomName('');
    setInputCode('');
    setLoadingProgress(0);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  };

  const chartData = useMemo<ScorePoint[]>(() => {
    if (!gameState) return [];

    return gameState.scoreHistory.map((snapshot, index) => {
      const point: ScorePoint = { time: index + 1 };

      gameState.players.forEach((player) => {
        point[player.name] = snapshot.scores[player.id] ?? 0;
      });

      return point;
    });
  }, [gameState]);

  const standings = useMemo<PlayerStanding[]>(() => {
    return connectedPlayers.map((player, index) => ({
      name: player.name,
      score: player.score,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isCurrentPlayer: player.id === socket?.id,
    }));
  }, [connectedPlayers, socket?.id]);

  const opponents = useMemo<Opponent[]>(() => {
    return standings
      .filter((player) => !player.isCurrentPlayer)
      .map((player) => ({
        name: player.name,
        score: player.score,
        color: player.color,
      }));
  }, [standings]);

  const isSelectable = (tile: Tile) => {
    if (tile.isMatched) return false;
    if (!currentUser) return false;

    return tile.lockedBy === null || tile.lockedBy === currentUser.id;
  };

  if (screen !== 'playing') {
    return (
      <main className="app-shell app-shell--lobby">
        <Lobby
          screen={screen}
          playerName={playerName}
          tempName={tempName}
          setTempName={setTempName}
          roomName={roomName}
          setRoomName={setRoomName}
          roomCode={roomCode}
          inputCode={inputCode}
          setInputCode={setInputCode}
          playerCount={playerCount}
          setPlayerCount={setPlayerCount}
          currentPlayers={currentPlayers}
          loadingProgress={loadingProgress}
          isCopied={isCopied}
          onConfirmName={handleConfirmName}
          onSelectCreate={() => {
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onSelectJoin={() => {
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onCopyCode={handleCopyCode}
          onStartMatch={() => setScreen('loading')}
          onBackToMenu={handleBackToMenu}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="panel__eyebrow">Partida activa</div>
          <h1>Mahjong Coop React</h1>
        </div>

        <div className="topbar__status">
          <span>{currentUser?.name ?? playerName}</span>
          <strong>{!isConnected ? 'Reconectando' : gameState?.isGameOver ? 'Finalizada' : 'Jugando'}</strong>
        </div>
      </header>

      <section className="dashboard-grid">
        <div className="dashboard-grid__main">
          <Board
            tiles={gameState?.tiles ?? []}
            onTileClick={selectTile}
            isSelectable={isSelectable}
            theme={activeTheme}
          />

          <LiveChart
            data={chartData}
            currentPlayerName={currentUser?.name ?? playerName}
            opponents={opponents}
          />
        </div>

        <aside className="dashboard-grid__sidebar">
          <Scoreboard players={standings} />

          <section className="panel sidebar-card">
            <div className="panel__eyebrow">Sesion</div>
            <h2>Estado actual</h2>
            <div className="ranking-list">
              <article className="ranking-row">
                <div className="ranking-row__identity">
                  <span>Sala</span>
                </div>
                <strong>{roomCode}</strong>
              </article>

              <article className="ranking-row">
                <div className="ranking-row__identity">
                  <span>Jugadores</span>
                </div>
                <strong>{currentPlayers}</strong>
              </article>

              <article className="ranking-row">
                <div className="ranking-row__identity">
                  <span>Conexion</span>
                </div>
                <strong>{isConnected ? 'Activa' : 'Perdida'}</strong>
              </article>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default App;