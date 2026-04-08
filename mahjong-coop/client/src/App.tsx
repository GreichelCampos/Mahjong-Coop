import { useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import LiveChart from './components/LiveChart';
import Lobby from './components/Lobby';
import RulesPanel from './components/RulesPanel';
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
  id: 'jade-classic',
  name: 'Jade Classic',
  background: 'radial-gradient(circle at 50% 30%, #2d7a4f 0%, #1d5c3b 42%, #103923 100%)',
  accent: '#86efac',
};

const PLAYER_COLORS = ['#38bdf8', '#f97316', '#22c55e', '#a78bfa', '#f43f5e'];

function App() {
  const {
    gameState,
    isConnected,
    socketId,
    roomId,
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentUser = gameState?.players.find((player) => player.id === socketId);
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
      await navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  };

  const standings = useMemo<PlayerStanding[]>(() => {
    return connectedPlayers.map((player, index) => ({
      name: player.name,
      score: player.score,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      isCurrentPlayer: player.id === socketId,
    }));
  }, [connectedPlayers, socketId]);

  const chartPlayers = useMemo<Opponent[]>(
    () =>
      connectedPlayers
        .filter((player) => player.id !== socketId)
        .map((player, index) => ({
          name: player.name,
          score: player.score,
          color: PLAYER_COLORS[(index + 1) % PLAYER_COLORS.length],
        })),
    [connectedPlayers, socketId],
  );

  const scoreChartData = useMemo<ScorePoint[]>(() => {
    if (!gameState?.scoreHistory?.length) {
      return connectedPlayers.length
        ? [
            connectedPlayers.reduce<ScorePoint>(
              (accumulator, player) => ({
                ...accumulator,
                [player.name]: player.score,
              }),
              { time: 0 },
            ),
          ]
        : [];
    }

    const startTime = gameState.startTime ?? gameState.scoreHistory[0]?.timestamp ?? Date.now();

    return gameState.scoreHistory.map((snapshot) => {
      const playerScores = connectedPlayers.reduce<Record<string, number>>((accumulator, player) => {
        accumulator[player.name] = snapshot.scores[player.id] ?? player.score;
        return accumulator;
      }, {});

      return {
        time: Math.max(0, Math.round((snapshot.timestamp - startTime) / 1000)),
        ...playerScores,
      };
    });
  }, [connectedPlayers, gameState?.scoreHistory, gameState?.startTime]);

  useEffect(() => {
    if (screen !== 'playing' || !gameState?.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const syncElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - gameState.startTime!) / 1000)));
    };

    syncElapsed();
    const interval = window.setInterval(syncElapsed, 1000);

    return () => window.clearInterval(interval);
  }, [gameState?.startTime, screen]);

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
          roomCode={roomId}
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
    <main className="app-shell app-shell--game">
      <header className="game-hud panel">
        <div className="game-hud__title">
          <div className="panel__eyebrow">Partida activa</div>
          <h1>Mahjong Coop</h1>
        </div>

        <div className="game-hud__chips">
          <div className="game-chip">
            <span>Jugador</span>
            <strong>{currentUser?.name ?? playerName}</strong>
          </div>
          <div className="game-chip">
            <span>Sala</span>
            <strong>{roomId || '------'}</strong>
          </div>
          <div className="game-chip">
            <span>Estado</span>
            <strong>{!isConnected ? 'Reconectando' : gameState?.isGameOver ? 'Finalizada' : 'Jugando'}</strong>
          </div>
          <div className="game-chip">
            <span>Tiempo</span>
            <strong>{new Date(elapsedSeconds * 1000).toISOString().slice(14, 19)}</strong>
          </div>
        </div>
      </header>

      <section className="game-table">
        <div className="game-table__board">
          <section className="panel controls-card">
            <div className="panel__eyebrow">Controles</div>
            <div className="controls-row">
              <button className="control-button" type="button" disabled title="No disponible en la capa conectada actual">
                Nuevo
              </button>
              <button className="control-button" type="button" disabled title="No disponible en la capa conectada actual">
                Deshacer
              </button>
              <button className="control-button control-button--accent" type="button" disabled title="La lógica de pista no está expuesta en el frontend conectado actual">
                Pista
              </button>
              <button className="control-button" type="button" disabled title="No disponible en la capa conectada actual">
                Mezclar
              </button>
            </div>
          </section>

          <Board
            tiles={gameState?.tiles ?? []}
            onTileClick={selectTile}
            isSelectable={isSelectable}
            theme={activeTheme}
          />

          <LiveChart
            data={scoreChartData}
            currentPlayerName={currentUser?.name ?? playerName}
            opponents={chartPlayers}
          />

          <RulesPanel />
        </div>

        <aside className="game-table__sidebar">
          <Scoreboard players={standings} />
          <section className="panel sidebar-card">
            <div className="panel__eyebrow">Sesion</div>
            <h2>Mesa</h2>
            <div className="ranking-list">
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
