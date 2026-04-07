export interface Tile {
  id: number;

  // Modelo actual del backend
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  lockedBy: string | null;

  // Campos puente para acercarlo al modelo del frontend
  x?: number;
  y?: number;
  z?: number;
  label?: string;
  category?: string;
  value?: number;
  isSelected?: boolean;
  isHinted?: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  color?: string;
}

export interface ScoreSnapshot {
  timestamp: number;
  scores: Record<string, number>;
}

export interface GameState {
  tiles: Tile[];
  players: Player[];
  scoreHistory: ScoreSnapshot[];
  isGameOver: boolean;
  startTime: number | null;
}
