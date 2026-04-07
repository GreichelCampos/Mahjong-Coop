import type { Tile, Player, GameState, ScoreSnapshot } from "./types";

const MAHJONG_SYMBOLS: string[] = [
  "🎋1",
  "🎋2",
  "🎋3",
  "🎋4",
  "🎋5",
  "🎋6",
  "🎋7",
  "🎋8",
  "🎋9",
  "🀇",
  "🀈",
  "🀉",
  "🀊",
  "🀋",
  "🀌",
  "🀍",
  "🀎",
  "🀏",
  "🀙",
  "🀚",
  "🀛",
  "🀜",
  "🀝",
  "🀞",
  "🀟",
  "🀠",
  "🀡",
  "🀀",
  "🀁",
  "🀂",
  "🀃",
  "🀄",
  "🀅",
  "🀆",
];

function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }

  return arr;
}

function buildTile(symbol: string, index: number): Tile {
  return {
    id: `tile-${index}`,
    symbol,
    isFlipped: false,
    isMatched: false,
    lockedBy: null,

    // Campos puente para frontend
    label: symbol,
    category: "memory",
    value: index,
    x: index % 6,
    y: Math.floor(index / 6),
    z: 0,
    isSelected: false,
    isHinted: false,
  };
}

function getTileMatchValue(tile: Tile): string {
  return tile.label ?? tile.symbol;
}

function clearTransientFlags(tile: Tile): Tile {
  return {
    ...tile,
    isSelected: false,
    isHinted: false,
  };
}

function addScoreSnapshot(state: GameState): GameState {
  const snapshot: ScoreSnapshot = {
    timestamp: Date.now(),
    scores: Object.fromEntries(
      state.players.map((player: Player) => [player.id, player.score]),
    ),
  };

  return {
    ...state,
    scoreHistory: [...state.scoreHistory, snapshot],
  };
}

function createGame(pairCount: number): GameState {
  const symbols = MAHJONG_SYMBOLS.slice(0, pairCount);
  const shuffledSymbols = shuffle([...symbols, ...symbols]);

  const tiles: Tile[] = shuffledSymbols.map((symbol: string, index: number) =>
    buildTile(symbol, index),
  );

  return {
    tiles,
    players: [],
    scoreHistory: [],
    isGameOver: false,
    startTime: null,
  };
}

function addPlayer(state: GameState, id: string, name: string): GameState {
  const alreadyExists = state.players.some(
    (player: Player) => player.id === id,
  );

  if (alreadyExists) {
    return {
      ...state,
      players: state.players.map((player: Player) =>
        player.id === id ? { ...player, isConnected: true } : player,
      ),
    };
  }

  const newPlayer: Player = {
    id,
    name,
    score: 0,
    isConnected: true,
  };

  return {
    ...state,
    players: [...state.players, newPlayer],
    startTime: state.startTime ?? Date.now(),
  };
}

function removePlayer(state: GameState, id: string): GameState {
  return {
    ...state,
    players: state.players.map((player: Player) =>
      player.id === id ? { ...player, isConnected: false } : player,
    ),
    tiles: state.tiles.map((tile: Tile) =>
      tile.lockedBy === id
        ? {
            ...clearTransientFlags(tile),
            lockedBy: null,
            isFlipped: false,
          }
        : clearTransientFlags(tile),
    ),
  };
}

function selectTile(
  state: GameState,
  tileId: string,
  playerId: string,
): { newState: GameState; event: string | null } {
  const tile = state.tiles.find(
    (currentTile: Tile) => currentTile.id === tileId,
  );

  if (!tile) {
    return { newState: state, event: "tile:invalid" };
  }

  if (tile.isMatched) {
    return { newState: state, event: "tile:already_matched" };
  }

  if (tile.lockedBy !== null && tile.lockedBy !== playerId) {
    return { newState: state, event: "tile:locked" };
  }

  const previousTile = state.tiles.find(
    (currentTile: Tile) =>
      currentTile.lockedBy === playerId && currentTile.id !== tileId,
  );

  if (previousTile) {
    const { newState, isMatch } = checkMatch(
      state,
      previousTile.id,
      tileId,
      playerId,
    );

    const stateWithHistory = addScoreSnapshot(newState);
    const event = isMatch ? "tile:match" : "tile:no_match";

    return {
      newState: checkGameOver(stateWithHistory),
      event,
    };
  }

  const newTiles = state.tiles.map((currentTile: Tile) => {
    if (currentTile.id === tileId) {
      return {
        ...currentTile,
        isFlipped: true,
        lockedBy: playerId,
        isSelected: true,
        isHinted: false,
      };
    }

    if (currentTile.lockedBy === playerId) {
      return {
        ...currentTile,
        isSelected: false,
        isHinted: false,
      };
    }

    return clearTransientFlags(currentTile);
  });

  return {
    newState: {
      ...state,
      tiles: newTiles,
    },
    event: "tile:selected",
  };
}

function checkMatch(
  state: GameState,
  t1Id: string,
  t2Id: string,
  playerId: string,
): { newState: GameState; isMatch: boolean } {
  const t1 = state.tiles.find((tile: Tile) => tile.id === t1Id);
  const t2 = state.tiles.find((tile: Tile) => tile.id === t2Id);

  if (!t1 || !t2) {
    return { newState: state, isMatch: false };
  }

  const isMatch = getTileMatchValue(t1) === getTileMatchValue(t2);

  const newTiles = state.tiles.map((tile: Tile) => {
    if (tile.id === t1Id || tile.id === t2Id) {
      if (isMatch) {
        return {
          ...tile,
          isMatched: true,
          isFlipped: true,
          lockedBy: null,
          isSelected: false,
          isHinted: false,
        };
      }

      return {
        ...tile,
        isFlipped: false,
        lockedBy: null,
        isSelected: false,
        isHinted: false,
      };
    }

    return clearTransientFlags(tile);
  });

  const newPlayers = state.players.map((player: Player) =>
    player.id === playerId && isMatch
      ? { ...player, score: player.score + 1 }
      : player,
  );

  return {
    newState: {
      ...state,
      tiles: newTiles,
      players: newPlayers,
    },
    isMatch,
  };
}

function checkGameOver(state: GameState): GameState {
  const allMatched = state.tiles.every((tile: Tile) => tile.isMatched);

  return {
    ...state,
    isGameOver: allMatched,
  };
}

export { createGame, addPlayer, removePlayer, selectTile, checkMatch };
