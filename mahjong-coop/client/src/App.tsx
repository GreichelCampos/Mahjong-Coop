import { useCallback, useEffect, useMemo, useState } from 'react';
import Board from './components/Board';
import ControlBar from './components/ControlBar';
import LiveChart from './components/LiveChart';
import Lobby from './components/Lobby';
import RulesPanel from './components/RulesPanel';
import Scoreboard from './components/Scoreboard';
import StatCards from './components/StatCards';
import './App.css';
import {
  TABLE_THEMES,
  areMatching,
  createOpponents,
  createTiles,
  formatTime,
  getAvailablePairsCount,
  isSelectable,
  reshuffleActiveTiles,
} from './lib/mahjong';
import type { Opponent, ScorePoint, ScreenState, TableTheme, Tile } from './types';

function App() {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [tempName, setTempName] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [currentPlayers, setCurrentPlayers] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [history, setHistory] = useState<Tile[][]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [matches, setMatches] = useState(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScorePoint[]>([]);
  const [activeTheme, setActiveTheme] = useState<TableTheme>(TABLE_THEMES[0]);

  const displayName = playerName || 'Tu';

  const gameOver = useMemo<'win' | 'lose' | null>(() => {
    if (screen !== 'playing' || tiles.length === 0) {
      return null;
    }

    const remainingActiveTiles = tiles.filter((tile) => !tile.isMatched);

    if (remainingActiveTiles.length === 0) {
      return 'win';
    }

    const selectableTiles = remainingActiveTiles.filter((tile) => isSelectable(tile, tiles));
    const hasMoves = selectableTiles.some((firstTile, firstIndex) =>
      selectableTiles.slice(firstIndex + 1).some((secondTile) => areMatching(firstTile, secondTile)),
    );

    return hasMoves ? null : 'lose';
  }, [screen, tiles]);

  const startNewGame = useCallback(() => {
    const nextTiles = createTiles();
    const nextOpponents = createOpponents(playerCount);
    const initialScorePoint = nextOpponents.reduce<ScorePoint>(
      (accumulator, opponent) => ({ ...accumulator, [opponent.name]: 0 }),
      { time: 0, [displayName]: 0 },
    );

    setTiles(nextTiles);
    setSelectedTileId(null);
    setHistory([]);
    setScore(0);
    setTime(0);
    setCombo(0);
    setClicks(0);
    setMatches(0);
    setOpponents(nextOpponents);
    setScoreHistory([initialScorePoint]);
  }, [displayName, playerCount]);

  useEffect(() => {
    if (screen === 'lobby' && currentPlayers < playerCount) {
      const timer = window.setTimeout(() => {
        setCurrentPlayers((previous) => previous + 1);
      }, 1400);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [screen, currentPlayers, playerCount]);

  useEffect(() => {
    if (screen !== 'loading') {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setLoadingProgress((previous) => {
        if (previous >= 100) {
          window.clearInterval(interval);
          startNewGame();
          setScreen('playing');
          return 100;
        }

        return previous + 10;
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [screen, startNewGame]);

  useEffect(() => {
    if (screen !== 'playing' || gameOver) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTime((previous) => {
        const nextTime = previous + 1;

        if (nextTime % 2 === 0) {
          const point = opponents.reduce<ScorePoint>(
            (accumulator, opponent) => ({ ...accumulator, [opponent.name]: opponent.score }),
            { time: nextTime, [displayName]: score },
          );

          setScoreHistory((previousHistory) => {
            if (previousHistory.at(-1)?.time === nextTime) {
              return previousHistory;
            }

            return [...previousHistory.slice(-29), point];
          });
        }

        return nextTime;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, gameOver, displayName, score, opponents]);

  useEffect(() => {
    if (screen !== 'playing' || gameOver || opponents.length === 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setOpponents((previous) =>
        previous.map((opponent) => ({
          ...opponent,
          score: opponent.score + Math.floor(Math.random() * 26),
        })),
      );
    }, 2800);

    return () => window.clearInterval(interval);
  }, [screen, opponents.length, gameOver]);

  const handleConfirmName = () => {
    if (!tempName.trim()) {
      return;
    }

    setPlayerName(tempName.trim());
    setScreen('menu');
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      return;
    }

    const nextCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoomCode(nextCode);
    setCurrentPlayers(1);
    setScreen('lobby');
  };

  const handleJoinRoom = () => {
    if (inputCode.trim().length !== 6) {
      return;
    }

    setRoomCode(inputCode.trim().toUpperCase());
    setRoomName('Sala sincronizada');
    setCurrentPlayers(playerCount);
    setScreen('lobby');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
    setRoomCode('');
    setRoomName('');
    setInputCode('');
    setLoadingProgress(0);
    setCurrentPlayers(1);
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

  const clearHints = () => {
    setTiles((previous) => previous.map((tile) => ({ ...tile, isHinted: false })));
  };

  const handleTileClick = (tileId: number) => {
    if (gameOver) {
      return;
    }

    const targetTile = tiles.find((tile) => tile.id === tileId);

    if (!targetTile || !isSelectable(targetTile, tiles)) {
      clearHints();
      return;
    }

    if (selectedTileId === null) {
      setClicks((previous) => previous + 1);
      setSelectedTileId(tileId);
      setTiles((previous) =>
        previous.map((tile) => ({
          ...tile,
          isSelected: tile.id === tileId,
          isHinted: false,
        })),
      );
      return;
    }

    if (selectedTileId === tileId) {
      setSelectedTileId(null);
      setTiles((previous) => previous.map((tile) => ({ ...tile, isSelected: false, isHinted: false })));
      return;
    }

    const selectedTile = tiles.find((tile) => tile.id === selectedTileId);

    if (!selectedTile) {
      setSelectedTileId(null);
      return;
    }

    setClicks((previous) => previous + 1);

    if (areMatching(selectedTile, targetTile)) {
      const nextCombo = combo + 1;

      setHistory((previous) => [[...tiles], ...previous.slice(0, 19)]);
      setTiles((previous) =>
        previous.map((tile) =>
          tile.id === tileId || tile.id === selectedTileId
            ? { ...tile, isMatched: true, isSelected: false, isHinted: false }
            : { ...tile, isSelected: false, isHinted: false },
        ),
      );
      setMatches((previous) => previous + 1);
      setCombo(nextCombo);
      setScore((previous) => previous + 100 + combo * 20);
      setSelectedTileId(null);
      return;
    }

    setCombo(0);
    setSelectedTileId(tileId);
    setTiles((previous) =>
      previous.map((tile) => ({
        ...tile,
        isSelected: tile.id === tileId,
        isHinted: false,
      })),
    );
  };

  const handleUndo = () => {
    if (history.length === 0) {
      return;
    }

    setTiles(history[0]);
    setHistory((previous) => previous.slice(1));
    setSelectedTileId(null);
    setCombo(0);
    setScore((previous) => Math.max(0, previous - 50));
  };

  const handleHint = () => {
    const selectableTiles = tiles.filter((tile) => isSelectable(tile, tiles));

    for (let firstIndex = 0; firstIndex < selectableTiles.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < selectableTiles.length; secondIndex += 1) {
        if (areMatching(selectableTiles[firstIndex], selectableTiles[secondIndex])) {
          const pairIds = new Set([selectableTiles[firstIndex].id, selectableTiles[secondIndex].id]);

          setTiles((previous) =>
            previous.map((tile) => ({
              ...tile,
              isHinted: pairIds.has(tile.id),
            })),
          );
          return;
        }
      }
    }
  };

  const handleShuffle = () => {
    setTiles((previous) => reshuffleActiveTiles(previous));
    setSelectedTileId(null);
    setCombo(0);
  };

  const accuracy = clicks > 0 ? Math.round((matches * 2 * 100) / clicks) : 0;
  const remainingTiles = useMemo(() => tiles.filter((tile) => !tile.isMatched).length, [tiles]);
  const availablePairs = useMemo(() => getAvailablePairsCount(tiles), [tiles]);
  const standings = useMemo(
    () => [{ name: displayName, score, color: activeTheme.accent, isCurrentPlayer: true }, ...opponents],
    [displayName, score, activeTheme.accent, opponents],
  );

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
            setRoomCode('');
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onSelectJoin={() => {
            setRoomCode('');
            setRoomName('');
            setInputCode('');
            setScreen('matchmaking');
          }}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onCopyCode={handleCopyCode}
          onStartMatch={() => {
            setLoadingProgress(0);
            setScreen('loading');
          }}
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
          <span>{displayName}</span>
          <strong>{gameOver ? (gameOver === 'win' ? 'Victoria' : 'Sin movimientos') : 'Jugando'}</strong>
        </div>
      </header>

      <StatCards
        remainingTiles={remainingTiles}
        availablePairs={availablePairs}
        combo={combo}
        accuracy={accuracy}
        score={score}
        timeLabel={formatTime(time)}
      />

      <section className="dashboard-grid">
        <div className="dashboard-grid__main">
          <Board
            tiles={tiles}
            onTileClick={handleTileClick}
            isSelectable={(tile) => isSelectable(tile, tiles)}
            theme={activeTheme}
          />
          <LiveChart data={scoreHistory} currentPlayerName={displayName} opponents={opponents} />
          {gameOver ? (
            <section className="panel gameover-card">
              <div className="panel__eyebrow">Resultado</div>
              <h2>{gameOver === 'win' ? 'Tablero completado' : 'No quedan parejas'}</h2>
              <p>
                {gameOver === 'win'
                  ? `Limpiaste la mesa en ${formatTime(time)}.`
                  : 'Puedes mezclar las fichas restantes o iniciar una nueva partida.'}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="dashboard-grid__sidebar">
          <Scoreboard players={standings} />
          <ControlBar
            themes={TABLE_THEMES}
            activeThemeId={activeTheme.id}
            onNewGame={startNewGame}
            onUndo={handleUndo}
            onHint={handleHint}
            onShuffle={handleShuffle}
            onBackToMenu={handleBackToMenu}
            canUndo={history.length > 0}
            onThemeChange={setActiveTheme}
          />
          <RulesPanel />
        </aside>
      </section>
    </main>
  );
}

export default App;
