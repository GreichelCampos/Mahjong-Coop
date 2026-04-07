import { Tile, Player, GameState, ScoreSnapshot } from "./types";

const MAHJONG_SYMBOLS: string[] = [
  "🎋1","🎋2","🎋3","🎋4","🎋5","🎋6","🎋7","🎋8","🎋9",
  "🀇","🀈","🀉","🀊","🀋","🀌","🀍","🀎","🀏",
  "🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠","🀡",
  "🀀","🀁","🀂","🀃",
  "🀄","🀅","🀆",
];

function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(pairCount: number): GameState {
  const symbols = MAHJONG_SYMBOLS.slice(0, pairCount);
  const shuffledSymbols = shuffle([...symbols, ...symbols]);

  const tiles: Tile[] = shuffledSymbols.map((symbol: string, index: number) => ({
    id: `tile-${index}`,
    symbol,
    isFlipped: false,
    isMatched: false,
    lockedBy: null,
  }));

  return {
    tiles,
    players: [],
    scoreHistory: [],
    isGameOver: false,
    startTime: null,
  };
}

export function addPlayer(
  state: GameState,
  id: string,
  name: string
): GameState {
  const alreadyExists = state.players.some((p: Player) => p.id === id);

  if (alreadyExists) {
    return {
      ...state,
      players: state.players.map((p: Player) =>
        p.id === id ? { ...p, isConnected: true } : p
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

export function removePlayer(state: GameState, id: string): GameState {
  return {
    ...state,
    players: state.players.map((p: Player) =>
      p.id === id ? { ...p, isConnected: false } : p
    ),
    tiles: state.tiles.map((t: Tile) =>
      t.lockedBy === id ? { ...t, lockedBy: null, isFlipped: false } : t
    ),
  };
}

export function selectTile(
  state: GameState,
  tileId: string,
  playerId: string
): { newState: GameState; event: string | null } {
  const tile = state.tiles.find((t: Tile) => t.id === tileId);

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
    (t: Tile) => t.lockedBy === playerId && t.id !== tileId
  );

  if (previousTile) {
    const { newState, isMatch } = checkMatch(
      state,
      previousTile.id,
      tileId,
      playerId
    );

    const snapshot: ScoreSnapshot = {
      timestamp: Date.now(),
      scores: Object.fromEntries(
        newState.players.map((p: Player) => [p.id, p.score])
      ),
    };

    const stateWithHistory: GameState = {
      ...newState,
      scoreHistory: [...newState.scoreHistory, snapshot],
    };

    const event = isMatch ? "tile:match" : "tile:no_match";
    return { newState: checkGameOver(stateWithHistory), event };
  }

  const newTiles = state.tiles.map((t: Tile) =>
    t.id === tileId ? { ...t, lockedBy: playerId, isFlipped: true } : t
  );

  return {
    newState: { ...state, tiles: newTiles },
    event: "tile:selected",
  };
}

export function checkMatch(
  state: GameState,
  t1Id: string,
  t2Id: string,
  playerId: string
): { newState: GameState; isMatch: boolean } {
  const t1 = state.tiles.find((t: Tile) => t.id === t1Id);
  const t2 = state.tiles.find((t: Tile) => t.id === t2Id);

  if (!t1 || !t2) {
    return { newState: state, isMatch: false };
  }

  const isMatch = t1.symbol === t2.symbol;

  const newTiles = state.tiles.map((t: Tile) => {
    if (t.id === t1Id || t.id === t2Id) {
      return isMatch
        ? { ...t, isMatched: true, isFlipped: true, lockedBy: null }
        : { ...t, isFlipped: false, lockedBy: null };
    }
    return t;
  });

  const newPlayers = state.players.map((p: Player) =>
    p.id === playerId && isMatch ? { ...p, score: p.score + 1 } : p
  );

  return {
    newState: { ...state, tiles: newTiles, players: newPlayers },
    isMatch,
  };
}

function checkGameOver(state: GameState): GameState {
  const allMatched = state.tiles.every((t: Tile) => t.isMatched);
  return { ...state, isGameOver: allMatched };
}
