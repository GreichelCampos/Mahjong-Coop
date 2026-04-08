import type { Opponent, TableTheme, Tile, TileSymbol } from '../types';

const SYMBOLS: TileSymbol[] = [
  ...Array.from({ length: 9 }, (_, index) => ({
    label: `D${index + 1}`,
    category: 'dots',
    value: index,
  })).flatMap((symbol) => Array.from({ length: 4 }, () => ({ ...symbol }))),
  ...Array.from({ length: 9 }, (_, index) => ({
    label: `B${index + 1}`,
    category: 'bamboo',
    value: index,
  })).flatMap((symbol) => Array.from({ length: 4 }, () => ({ ...symbol }))),
  ...Array.from({ length: 9 }, (_, index) => ({
    label: `C${index + 1}`,
    category: 'chars',
    value: index,
  })).flatMap((symbol) => Array.from({ length: 4 }, () => ({ ...symbol }))),
  ...['East', 'South', 'West', 'North'].flatMap((label, index) =>
    Array.from({ length: 4 }, () => ({ label, category: 'winds', value: index })),
  ),
  ...['Red', 'Green', 'White'].flatMap((label, index) =>
    Array.from({ length: 4 }, () => ({ label, category: 'dragons', value: index })),
  ),
  ...['Spring', 'Summer', 'Autumn', 'Winter'].map((label, index) => ({
    label,
    category: 'seasons',
    value: index,
  })),
  ...['Plum', 'Orchid', 'Chrys', 'Bamboo'].map((label, index) => ({
    label,
    category: 'flowers',
    value: index,
  })),
];

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'jade',
    name: 'Jade',
    background: 'linear-gradient(135deg, #123524 0%, #205738 48%, #0b1f17 100%)',
    accent: '#6ee7b7',
  },
  {
    id: 'night',
    name: 'Night',
    background: 'linear-gradient(135deg, #172554 0%, #1d4ed8 48%, #0f172a 100%)',
    accent: '#93c5fd',
  },
  {
    id: 'ember',
    name: 'Ember',
    background: 'linear-gradient(135deg, #451a03 0%, #b45309 45%, #2b1104 100%)',
    accent: '#fdba74',
  },
];

export function getClassicTurtlePositions() {
  const positions: Array<{ x: number; y: number; z: number }> = [];

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

function shuffle<T>(items: T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

export function createTiles() {
  const positions = getClassicTurtlePositions();
  const symbols = shuffle(SYMBOLS);

  return positions.map((position, index): Tile => ({
    id: index,
    symbol: `${symbols[index].label}`,
    isFlipped: false,
    lockedBy: null,
    isMatched: false,
    ...position,
    ...symbols[index],
    isSelected: false,
    isHinted: false,
  }));
}

export function isSelectable(tile: Tile, allTiles: Tile[]) {
  if (tile.isMatched) {
    return false;
  }

  const activeTiles = allTiles.filter((currentTile) => !currentTile.isMatched);

  const hasTop = activeTiles.some(
    (currentTile) =>
      currentTile.id !== tile.id &&
      currentTile.z! > tile.z! &&
      Math.abs(currentTile.x! - tile.x!) < 1 &&
      Math.abs(currentTile.y! - tile.y!) < 1,
  );

  if (hasTop) {
    return false;
  }

  const hasLeft = activeTiles.some(
    (currentTile) =>
      currentTile.id !== tile.id &&
      currentTile.z === tile.z &&
      currentTile.x! <= tile.x! - 1 &&
      currentTile.x! > tile.x! - 2 &&
      Math.abs(currentTile.y! - tile.y!) < 1,
  );

  const hasRight = activeTiles.some(
    (currentTile) =>
      currentTile.id !== tile.id &&
      currentTile.z === tile.z &&
      currentTile.x! >= tile.x! + 1 &&
      currentTile.x! < tile.x! + 2 &&
      Math.abs(currentTile.y! - tile.y!) < 1,
  );

  return !hasLeft || !hasRight;
}

export function areMatching(firstTile: Tile, secondTile: Tile) {
  if (firstTile.category === 'seasons' && secondTile.category === 'seasons') {
    return true;
  }

  if (firstTile.category === 'flowers' && secondTile.category === 'flowers') {
    return true;
  }

  return firstTile.label === secondTile.label;
}

export function getAvailablePairsCount(tiles: Tile[]) {
  const selectableTiles = tiles.filter((tile) => isSelectable(tile, tiles));
  let pairs = 0;
  const seenIds = new Set<number>();

  for (let firstIndex = 0; firstIndex < selectableTiles.length; firstIndex += 1) {
    const firstTile = selectableTiles[firstIndex];

    if (seenIds.has(firstTile.id)) {
      continue;
    }

    for (let secondIndex = firstIndex + 1; secondIndex < selectableTiles.length; secondIndex += 1) {
      const secondTile = selectableTiles[secondIndex];

      if (seenIds.has(secondTile.id)) {
        continue;
      }

      if (areMatching(firstTile, secondTile)) {
        pairs += 1;
        seenIds.add(firstTile.id);
        seenIds.add(secondTile.id);
        break;
      }
    }
  }

  return pairs;
}

export function createOpponents(playerCount: number): Opponent[] {
  const names = ['Sun Tzu', 'Zhuge Liang', 'Laozi'];
  const colors = ['#22c55e', '#38bdf8', '#f97316'];

  return names.slice(0, Math.max(0, playerCount - 1)).map((name, index) => ({
    name,
    score: 0,
    color: colors[index],
  }));
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function reshuffleActiveTiles(tiles: Tile[]) {
  const activeSymbols = shuffle(
    tiles.filter((tile) => !tile.isMatched).map(({ label, category, value }) => ({ label, category, value })),
  );

  let symbolIndex = 0;

  return tiles.map((tile) => {
    if (tile.isMatched) {
      return tile;
    }

    const nextSymbol = activeSymbols[symbolIndex];
    symbolIndex += 1;

    return {
      ...tile,
      ...nextSymbol,
      isSelected: false,
      isHinted: false,
    };
  });
}
