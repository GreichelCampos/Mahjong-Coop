export interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface TileData {
  id: number;
  content: string;
  status: 'hidden' | 'flipped' | 'matched' | 'locked';
  lockedBy?: string;
}

export interface GameState {
  players: Player[];
  tiles: TileData[];
  isJoined: boolean;
  currentUser?: Player;
}
