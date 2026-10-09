export type Difficulty = 'explorer' | 'survivor' | 'nightmare';

export type GameState = 'menu' | 'playing' | 'paused' | 'reading_note' | 'jumpscare' | 'game_over' | 'victory';

export interface ItemCollectible {
  id: string;
  type: 'tape' | 'water' | 'note';
  x: number;
  z: number;
  title: string;
  content?: string;
  collected: boolean;
}

export interface PlayerStats {
  stamina: number; // 0 - 100
  maxStamina: number;
  sanity: number; // 0 - 100
  tapesCollected: number;
  totalTapes: number;
  notesCollected: number;
}

export interface EntityState {
  x: number;
  z: number;
  rotationY: number;
  state: 'idle' | 'patrol' | 'investigate' | 'chase' | 'attack';
  speed: number;
  distanceToPlayer: number;
  hasLineOfSight: boolean;
  alertLevel: number; // 0 - 1
}

export interface NoteLog {
  id: string;
  title: string;
  author: string;
  date: string;
  text: string;
}
