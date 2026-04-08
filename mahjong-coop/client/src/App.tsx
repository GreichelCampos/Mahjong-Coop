import { useEffect, useMemo, useState, useRef } from 'react';
import type { CSSProperties } from 'react';
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
    startGame,
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
  const [lobbyMessage, setLobbyMessage] = useState('');
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
  const victoryTriggeredRef = useRef(false);
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
  }, [screen, audio]);

  const handleConfirmName = () => {
    if (!tempName.trim()) return;
    audio.play('click');
    setPlayerName(tempName.trim());
    setScreen('menu');
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) return;

    audio.play('click');

    const nextRoomCode = await createRoom(playerCount);
    const response = await joinGame(playerName, nextRoomCode);

    if (response.ok) {
      setScreen('lobby');
      setLobbyMessage('');
    } else {
      setLobbyMessage('No se pudo crear la sala');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || inputCode.trim().length !== 6) return;

    audio.play('click');

    const normalizedCode = inputCode.trim().toUpperCase();
    const response = await joinGame(playerName, normalizedCode);

    if (response.ok) {
      setScreen('lobby');
      setLobbyMessage('');
    } else {
      setLobbyMessage('No se pudo unir a la sala');
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
    setLobbyMessage('');
    setShowVictoryOverlay(false);
    victoryTriggeredRef.current = false;
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

  const finalRanking = useMemo(() => {
    return [...connectedPlayers].sort((a, b) => b.score - a.score);
  }, [connectedPlayers]);

  const winner = finalRanking[0] ?? null;

  const didCurrentUserWin = Boolean(
    winner &&
    currentUser &&
    winner.id === currentUser.id,
  );

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
  const hasActiveRoom = Boolean(roomId && gameState);

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
    if (screen === 'lobby' && gameState?.isStarted) {
      setScreen('loading');
    }
  }, [gameState?.isStarted, screen]);

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

  useEffect(() => {
    if (screen !== 'playing') {
      setShowVictoryOverlay(false);
      victoryTriggeredRef.current = false;
      return;
    }

    if (gameState?.isGameOver) {
      if (!victoryTriggeredRef.current) {
        setShowVictoryOverlay(true);
        victoryTriggeredRef.current = true;
      }
    } else {
      setShowVictoryOverlay(false);
      victoryTriggeredRef.current = false;
    }
  }, [gameState?.isGameOver, screen]);

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

  const handlePlayAgain = async () => {
    audio.play('click');
    setShowVictoryOverlay(false);
    victoryTriggeredRef.current = false;
    setHintedTileIds([]);

    const response = await resetGame();

    if (!response.ok) {
      showControlMessage(response.error ?? 'No se pudo reiniciar');
    } else if (gameState?.isStarted) {
      audio.startMusic();
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

  const handleStartMatch = async () => {
    audio.play('click');
    const response = await startGame();

    if (!response.ok) {
      setLobbyMessage(response.error ?? 'No se pudo iniciar la partida');
    } else {
      setLobbyMessage('');
    }
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
          onStartMatch={handleStartMatch}
          onBackToMenu={handleBackToMenu}
          lobbyMessage={lobbyMessage}
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

      {showVictoryOverlay && winner ? (
        <>
          <style>
            {`
              @keyframes victoryFadeInInline {
                from { opacity: 0; }
                to { opacity: 1; }
              }

              @keyframes victoryPopInInline {
                0% {
                  opacity: 0;
                  transform: scale(0.82) translateY(20px);
                }
                65% {
                  opacity: 1;
                  transform: scale(1.03) translateY(0);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }

              @keyframes confettiFallInline {
                0% {
                  transform: translateY(-14vh) rotate(0deg);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                100% {
                  transform: translateY(115vh) rotate(620deg);
                  opacity: 1;
                }
              }
            `}
          </style>

          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 50% 30%, rgba(255, 225, 138, 0.18), transparent 20%), radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.05), transparent 18%), rgba(3, 10, 7, 0.78)',
                backdropFilter: 'blur(8px)',
                animation: 'victoryFadeInInline 0.35s ease forwards',
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              {Array.from({ length: 40 }).map((_, index) => {
                const colors = [
                  'linear-gradient(180deg, #fde68a, #f59e0b)',
                  'linear-gradient(180deg, #fca5a5, #ef4444)',
                  'linear-gradient(180deg, #93c5fd, #2563eb)',
                  'linear-gradient(180deg, #86efac, #16a34a)',
                  'linear-gradient(180deg, #f9a8d4, #db2777)',
                ];

                return (
                  <span
                    key={index}
                    style={
                      {
                        position: 'absolute',
                        top: '-12%',
                        left: `${(index * 2.47) % 100}%`,
                        width: `${10 + (index % 4)}px`,
                        height: `${22 + (index % 3) * 6}px`,
                        borderRadius: '999px',
                        opacity: 0.95,
                        background: colors[index % colors.length],
                        boxShadow: '0 0 10px rgba(245, 190, 78, 0.18)',
                        animationName: 'confettiFallInline',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationDelay: `${(index % 12) * 0.12}s`,
                        animationDuration: `${3.6 + (index % 6) * 0.35}s`,
                      } as CSSProperties
                    }
                  />
                );
              })}
            </div>

            <section
              className="panel"
              style={{
                position: 'relative',
                zIndex: 2,
                width: 'min(760px, calc(100vw - 32px))',
                maxWidth: '760px',
                borderRadius: '30px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 232, 176, 0.22)',
                background: 'linear-gradient(180deg, rgba(23, 44, 32, 0.97), rgba(8, 20, 14, 0.98))',
                boxShadow:
                  '0 30px 80px rgba(0, 0, 0, 0.48), 0 0 40px rgba(245, 190, 78, 0.14), inset 0 1px 0 rgba(255, 250, 235, 0.08)',
                animation: 'victoryPopInInline 0.5s cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(circle at 50% 0%, rgba(255, 215, 92, 0.24), transparent 34%), radial-gradient(circle at 15% 15%, rgba(255, 255, 255, 0.05), transparent 20%)',
                }}
              />

              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  padding: '32px',
                  display: 'grid',
                  gap: '18px',
                }}
              >
                <div
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    fontSize: '0.72rem',
                    color: '#f4d58b',
                  }}
                >
                  Partida finalizada
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(2rem, 4vw, 3.3rem)',
                    lineHeight: 1,
                    color: '#fff7dd',
                    textShadow: '0 0 18px rgba(245, 190, 78, 0.18)',
                  }}
                >
                  {didCurrentUserWin ? '¡Ganaste!' : `Victoria de ${winner.name}`}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#dde7d8',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                  }}
                >
                  {didCurrentUserWin
                    ? 'Terminaste en el primer lugar del ranking.'
                    : `${winner.name} terminó en el primer lugar.`}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <article
                    style={{
                      minHeight: '94px',
                      padding: '14px',
                      borderRadius: '16px',
                      background: 'rgba(255, 248, 230, 0.05)',
                      border: '1px solid rgba(255, 232, 176, 0.08)',
                      display: 'grid',
                      alignContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#c6d1c3' }}>
                      Ganador
                    </span>
                    <strong style={{ fontSize: '1.08rem', color: '#fff4cf' }}>{winner.name}</strong>
                  </article>

                  <article
                    style={{
                      minHeight: '94px',
                      padding: '14px',
                      borderRadius: '16px',
                      background: 'rgba(255, 248, 230, 0.05)',
                      border: '1px solid rgba(255, 232, 176, 0.08)',
                      display: 'grid',
                      alignContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#c6d1c3' }}>
                      Puntaje ganador
                    </span>
                    <strong style={{ fontSize: '1.08rem', color: '#fff4cf' }}>{winner.score}</strong>
                  </article>

                  <article
                    style={{
                      minHeight: '94px',
                      padding: '14px',
                      borderRadius: '16px',
                      background: 'rgba(255, 248, 230, 0.05)',
                      border: '1px solid rgba(255, 232, 176, 0.08)',
                      display: 'grid',
                      alignContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#c6d1c3' }}>
                      Tu puntaje
                    </span>
                    <strong style={{ fontSize: '1.08rem', color: '#fff4cf' }}>{currentUser?.score ?? 0}</strong>
                  </article>

                  <article
                    style={{
                      minHeight: '94px',
                      padding: '14px',
                      borderRadius: '16px',
                      background: 'rgba(255, 248, 230, 0.05)',
                      border: '1px solid rgba(255, 232, 176, 0.08)',
                      display: 'grid',
                      alignContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.13em', color: '#c6d1c3' }}>
                      Tiempo total
                    </span>
                    <strong style={{ fontSize: '1.08rem', color: '#fff4cf' }}>
                      {new Date(elapsedSeconds * 1000).toISOString().slice(14, 19)}
                    </strong>
                  </article>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      color: '#e8c57b',
                    }}
                  >
                    Ranking final
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {finalRanking.map((player, index) => (
                      <article
                        key={player.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '16px',
                          background:
                            currentUser?.id === player.id
                              ? 'rgba(245, 158, 11, 0.16)'
                              : 'rgba(39, 49, 42, 0.72)',
                          border:
                            currentUser?.id === player.id
                              ? '1px solid rgba(245, 158, 11, 0.22)'
                              : '1px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#9fb0a3' }}>#{index + 1}</span>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '999px',
                              backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length],
                              display: 'inline-block',
                            }}
                          />
                          <span>{player.name}</span>
                        </div>
                        <strong>{player.score}</strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '6px',
                  }}
                >
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={handlePlayAgain}
                    style={{
                      minWidth: '220px',
                      minHeight: '52px',
                      fontSize: '1rem',
                    }}
                  >
                    Jugar otra vez
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : null}

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
                    disabled={!isConnected || !hasActiveRoom}
                  >
                    Nuevo
                  </button>
                  <button
                    className="control-button"
                    type="button"
                    onClick={handleUndoMove}
                    disabled={!isConnected || !hasActiveRoom}
                  >
                    Deshacer
                  </button>
                  <button
                    className="control-button control-button--accent"
                    type="button"
                    onClick={handleHint}
                    disabled={!hasActiveRoom || !availablePairs}
                  >
                    Pista
                  </button>
                  <button
                    className="control-button"
                    type="button"
                    onClick={handleShuffleGame}
                    disabled={!isConnected || !hasActiveRoom || Boolean(gameState?.isGameOver)}
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