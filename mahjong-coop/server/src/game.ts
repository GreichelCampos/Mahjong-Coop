import type { Tile, Player, GameState, ScoreSnapshot } from "./types";

type TileSeed = {
  symbol: string;
  label: string;
  category: string;
  value: number;
};

type Position = {
  x: number;
  y: number;
  z: number;
};

const SUIT_SYMBOLS = {
  dots: ["🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"],
  bamboo: ["🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘"],
  chars: ["🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏"],
  winds: ["🀀", "🀁", "🀂", "🀃"],
  dragons: ["🀄", "🀅", "🀆"],
  seasons: ["春", "夏", "秋", "冬"],
  flowers: ["梅", "蘭", "菊", "竹"],
} as const;

const MAHJONG_TILE_SEEDS: TileSeed[] = [
  ...(["dots", "bamboo", "chars"] as const).flatMap((category) =>
    SUIT_SYMBOLS[category].flatMap((symbol, value) =>
      Array.from({ length: 4 }, () => ({
        symbol,
        label: symbol,
        category,
        value,
      })),
    ),
  ),
  ...SUIT_SYMBOLS.winds.flatMap((symbol, value) =>
    Array.from({ length: 4 }, () => ({
      symbol,
      label: symbol,
      category: "winds",
      value,
    })),
  ),
  ...SUIT_SYMBOLS.dragons.flatMap((symbol, value) =>
    Array.from({ length: 4 }, () => ({
      symbol,
      label: symbol,
      category: "dragons",
      value,
    })),
  ),
  ...SUIT_SYMBOLS.seasons.map((symbol, value) => ({
    symbol,
    label: symbol,
    category: "seasons",
    value,
  })),
  ...SUIT_SYMBOLS.flowers.map((symbol, value) => ({
    symbol,
    label: symbol,
    category: "flowers",
    value,
  })),
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

function getClassicTurtlePositions(): Position[] {
  const positions: Position[] = [];

  for (let y = 1; y <= 6; y += 1) {
    for (let x = 2; x <= 13; x += 1) {
      positions.push({ x, y, z: 0 });
    }
  }

  for (let x = 4; x <= 9; x += 1) {
    positions.push({ x, y: 0, z: 0 });
    positions.push({ x, y: 7, z: 0 });
  }

  positions.push({ x: 1, y: 3.5, z: 0 });
  positions.push({ x: 14, y: 3.5, z: 0 });
  positions.push({ x: 15, y: 3.5, z: 0 });

  for (let y = 1; y <= 6; y += 1) {
    for (let x = 4; x <= 9; x += 1) {
      positions.push({ x: x + 0.5, y: y + 0.5, z: 1 });
    }
  }

  for (let y = 2; y <= 5; y += 1) {
    for (let x = 5; x <= 8; x += 1) {
      positions.push({ x: x + 1, y: y + 1, z: 2 });
    }
  }

  for (let y = 3; y <= 4; y += 1) {
    for (let x = 6; x <= 7; x += 1) {
      positions.push({ x: x + 1.5, y: y + 1.5, z: 3 });
    }
  }

  positions.push({ x: 8, y: 4.5, z: 4 });

  return positions.slice(0, 144);
}

function buildTile(seed: TileSeed, index: number, position: Position): Tile {
  return {
    id: index,
    symbol: seed.symbol,
    label: seed.label,
    category: seed.category,
    value: seed.value,
    isFlipped: false,
    isMatched: false,
    lockedBy: null,
    x: position.x,
    y: position.y,
    z: position.z,
    isSelected: false,
    isHinted: false,
  };
}

function getTileMatchValue(tile: Tile): string {
  if (tile.category === "seasons") {
    return "seasons";
  }

  if (tile.category === "flowers") {
    return "flowers";
  }

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

function createGame(_pairCount: number): GameState {
  const shuffledSeeds = shuffle(MAHJONG_TILE_SEEDS);
  const positions = getClassicTurtlePositions();

  const tiles: Tile[] = positions.map((position, index) =>
    buildTile(shuffledSeeds[index]!, index, position),
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
  tileId: number,
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
  t1Id: number,
  t2Id: number,
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
