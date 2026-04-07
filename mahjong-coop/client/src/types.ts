export type ScreenState =
  | 'welcome'
  | 'menu'
  | 'matchmaking'
  | 'lobby'
  | 'loading'
  | 'playing';

export interface TableTheme {
  id: string;
  name: string;
  background: string;
  accent: string;
}

export interface TileSymbol {
  label: string;
  category: string;
  value: number;
}

export interface Tile {
  id: number;
  x: number;
  y: number;
  z: number;
  label: string;
  category: string;
  value: number;
  isMatched: boolean;
  isSelected: boolean;
  isHinted: boolean;
}

export interface Opponent {
  name: string;
  score: number;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  color?: string;
}

export interface ScorePoint {
  time: number;
  [key: string]: number;
}

export interface ScoreSnapshot {
  timestamp: number;
  scores: Record<string, number>;
}

export interface PlayerStanding {
  name: string;
  score: number;
  color: string;
  isCurrentPlayer?: boolean;
}

export interface GameState {
  tiles: Tile[];
  players: Player[];
  scoreHistory: ScoreSnapshot[];
  isGameOver: boolean;
  startTime: number | null;
}
