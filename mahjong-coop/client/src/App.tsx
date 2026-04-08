import { useEffect, useMemo, useState, useRef } from 'react';
import Board from './components/Board';
import LiveChart from './components/LiveChart';
import Lobby from './components/Lobby';
import RulesPanel from './components/RulesPanel';
import Scoreboard from './components/Scoreboard';
import { useSocket } from './hooks/useSocket';
import { useAudio } from './hooks/useAudio';
import { isSelectable as isMahjongSelectable } from './lib/mahjong';
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
  const audio = useAudio();

  const {
    gameState,
    isConnected,
    socketId,
    roomId,
    createRoom,
    joinGame,
    selectTile,
    resetGame,
    shuffleGame,
    undoMove,
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
  const [hintedTileIds, setHintedTileIds] = useState<number[]>([]);
  const [controlMessage, setControlMessage] = useState('');
  const prevGameStateRef = useRef<typeof gameState | null>(null);

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
          audio.startMusic();
          return 100;
        }

        return previous + 10;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [screen]);

  const handleConfirmName = () => {
    if (!tempName.trim()) return;
    audio.play('click');
    setPlayerName(tempName.trim());
    setScreen('menu');
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) return;

    audio.play('click');

    const nextRoomCode = await createRoom();
    const response = await joinGame(playerName, nextRoomCode);

    if (response.ok) {
      setScreen('lobby');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || inputCode.trim().length !== 6) return;

    audio.play('click');

    const normalizedCode = inputCode.trim().toUpperCase();
    const response = await joinGame(playerName, normalizedCode);

    if (response.ok) {
      setScreen('loading');
    }
  };

  const handleBackToMenu = () => {
    audio.play('click');
    leaveRoom();
    audio.stopMusic();
    setScreen('menu');
    setRoomName('');
    setInputCode('');
    setLoadingProgress(0);
  };

  const handleCopyCode = async () => {

    audio.play('click');

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

  const isSelectable = (tile: Tile) => {
    if (tile.isMatched) return false;
    if (!currentUser) return false;

    const hasLockAccess = tile.lockedBy === null || tile.lockedBy === currentUser.id;

    if (!hasLockAccess) {
      return false;
    }

    return isMahjongSelectable(tile, gameState?.tiles ?? []);
  };

  const availablePairs = useMemo(() => {
    const activeTiles = (gameState?.tiles ?? []).filter(
      (tile) => !tile.isMatched && isSelectable(tile),
    );
    let pairs = 0;
    const used = new Set<number>();

    const canMatch = (left: Tile, right: Tile) => {
      if (left.category === 'seasons' && right.category === 'seasons') return true;
      if (left.category === 'flowers' && right.category === 'flowers') return true;
      return left.label === right.label;
    };

    for (let index = 0; index < activeTiles.length; index += 1) {
      const current = activeTiles[index];

      if (!current || used.has(current.id)) continue;

      for (let nextIndex = index + 1; nextIndex < activeTiles.length; nextIndex += 1) {
        const candidate = activeTiles[nextIndex];

        if (!candidate || used.has(candidate.id)) continue;

        if (canMatch(current, candidate)) {
          used.add(current.id);
          used.add(candidate.id);
          pairs += 1;
          break;
        }
      }
    }

    return pairs;
  }, [gameState?.tiles, currentUser]);

  const currentScore = currentUser?.score ?? 0;
  const gameStatus = !isConnected ? 'Reconectando' : gameState?.isGameOver ? 'Finalizada' : 'Jugando';

  const boardTiles = useMemo(
    () =>
      (gameState?.tiles ?? []).map((tile) => ({
        ...tile,
        isHinted: hintedTileIds.includes(tile.id) || Boolean(tile.isHinted),
      })),
    [gameState?.tiles, hintedTileIds],
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

  useEffect(() => {
    if (!gameState) return;

    const prev = prevGameStateRef.current;

    if (prev) {
      const newMatches = gameState.tiles.filter(
        (t) => t.isMatched && !prev.tiles.find((p) => p.id === t.id)?.isMatched
      );
      if (newMatches.length > 0) {
        audio.play('match');
      }

      if (gameState.players.length > prev.players.length) {
        audio.play('join');
      }

      if (!prev.isGameOver && gameState.isGameOver) {
        audio.stopMusic();
        audio.play('victory');
      }
    }

    prevGameStateRef.current = gameState;
  }, [gameState, audio]);

  useEffect(() => {
    setHintedTileIds([]);
  }, [gameState]);

  useEffect(() => {
    if (!controlMessage) return;

    const timeout = window.setTimeout(() => setControlMessage(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [controlMessage]);

  const showControlMessage = (message: string) => {
    setControlMessage(message);
  };

  const handleTileSelect = (tileId: number) => {
    setHintedTileIds([]);
    audio.play('flip');
    selectTile(tileId);
  };

  const handleResetGame = async () => {
    audio.play('click');
    setHintedTileIds([]);
    const response = await resetGame();

    if (!response.ok) {
      showControlMessage(response.error ?? 'No se pudo reiniciar');
    }
  };

  const handleShuffleGame = async () => {
    audio.play('shuffle');
    setHintedTileIds([]);
    const response = await shuffleGame();

    if (!response.ok) {
      showControlMessage(response.error ?? 'No se pudo mezclar');
    }
  };

  const handleUndoMove = async () => {
    audio.play('undo');
    setHintedTileIds([]);
    const response = await undoMove();

    if (!response.ok) {
      showControlMessage(response.error ?? 'No hay movimientos para deshacer');
    }
  };

  const handleHint = () => {
    audio.play('click');
    const activeTiles = (gameState?.tiles ?? []).filter((tile) => !tile.isMatched && isSelectable(tile));

    for (let index = 0; index < activeTiles.length; index += 1) {
      const current = activeTiles[index];
      if (!current) continue;

      for (let nextIndex = index + 1; nextIndex < activeTiles.length; nextIndex += 1) {
        const candidate = activeTiles[nextIndex];
        if (!candidate) continue;

        const isMatch =
          (current.category === 'seasons' && candidate.category === 'seasons') ||
          (current.category === 'flowers' && candidate.category === 'flowers') ||
          current.label === candidate.label;

        if (isMatch) {
          setHintedTileIds([current.id, candidate.id]);
          return;
        }
      }
    }

    showControlMessage('No hay pistas disponibles');
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
            audio.play('click');
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onSelectJoin={() => {
            audio.play('click');
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onCopyCode={handleCopyCode}
          onStartMatch={() => {
            audio.play('click');
            setScreen('loading');
          }}
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
            <strong>{gameStatus}</strong>
          </div>
          <div className="game-chip">
            <span>Tiempo</span>
            <strong>{new Date(elapsedSeconds * 1000).toISOString().slice(14, 19)}</strong>
          </div>
        </div>
      </header>

      <section className="game-layout">
        <div className="game-layout__main">
          <section className="game-table">
            <div className="game-table__board">
              <section className="panel controls-card">
                <div className="panel__eyebrow">Controles</div>
                {controlMessage ? <div className="controls-message">{controlMessage}</div> : null}
                <div className="controls-row">
                  <button
                    className="control-button"
                    type="button"
                    onClick={handleResetGame}
                    disabled={!isConnected}
                  >
                    Nuevo
                  </button>
                  <button
                    className="control-button"
                    type="button"
                    onClick={handleUndoMove}
                    disabled={!isConnected}
                  >
                    Deshacer
                  </button>
                  <button
                    className="control-button control-button--accent"
                    type="button"
                    onClick={handleHint}
                    disabled={!availablePairs}
                  >
                    Pista
                  </button>
                  <button
                    className="control-button"
                    type="button"
                    onClick={handleShuffleGame}
                    disabled={!isConnected || Boolean(gameState?.isGameOver)}
                  >
                    Mezclar
                  </button>
                </div>
              </section>

              <Board
                tiles={boardTiles}
                onTileClick={handleTileSelect}
                isSelectable={isSelectable}
                theme={activeTheme}
              />
            </div>

            <aside className="game-table__sidebar">
              <Scoreboard players={standings} />

              <section className="panel sidebar-card game-summary-card">
                <div className="panel__eyebrow">Resumen</div>
                <h2>Estado de partida</h2>
                <div className="session-stats">
                  <article className="session-stat">
                    <span>Puntaje actual</span>
                    <strong>{currentScore}</strong>
                  </article>
                  <article className="session-stat">
                    <span>Jugadores conectados</span>
                    <strong>{currentPlayers}</strong>
                  </article>
                  <article className="session-stat">
                    <span>Parejas libres</span>
                    <strong>{availablePairs}</strong>
                  </article>
                </div>
              </section>
            </aside>
          </section>

          <LiveChart
            data={scoreChartData}
            currentPlayerName={currentUser?.name ?? playerName}
            opponents={chartPlayers}
          />

          <RulesPanel />
        </div>
      </section>
    </main>
  );
}

export default App;
