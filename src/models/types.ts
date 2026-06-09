// Core domain models
export interface EdgeData {
  hash: string;
  featureScore?: number;
  variance?: number;
  dominantColor?: string;
}

export interface Tile {
  id: string;
  row: number;
  col: number;
  originalRow: number;
  originalCol: number;
  imageData: string;
  rotation: number;
  tileSize: number;
  edgeHashes: {
    top: EdgeData;
    right: EdgeData;
    bottom: EdgeData;
    left: EdgeData;
  };
  visualComplexity?: number;
  uniquenessScore?: number;
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gradient: string[];
  imageUrl?: string;
}

export interface Move {
  type: 'rotate' | 'swap';
  tileId?: string;
  previousRotation?: number;
  tile1Id?: string;
  tile2Id?: string;
  tile1PrevPos?: { row: number; col: number };
  tile2PrevPos?: { row: number; col: number };
}

export interface GameState {
  status: 'start' | 'idle' | 'loading' | 'playing' | 'solved';
  tiles: Tile[];
  moves: number;
  swaps: number;
  undos: number;
  startTime: number;
  currentTime: number;
  solveTime: number | null;
  selectedTile: string | null;
  moveHistory: Move[];
  matchingEdges: Set<string>;
  isPaused: boolean;
  pausedTime: number;
}

export interface AppSettings {
  selectedLanguage: string;
  notificationsEnabled: boolean;
  vibrateEnabled: boolean;
  soundEnabled?: boolean;
}

export interface PuzzleStats {
  attempts: number;
  bestTime: number | null;
  bestMoves: number | null;
  bestSwaps: number | null;
  lastPlayedTime?: number;
  lastPlayedMoves?: number;
  lastPlayedSwaps?: number;
  completionDates: string[];
}

export interface PuzzleValidationResult {
  valid: boolean;
  solutionCount: number;
  uniquenessScore: number;
  estimatedDifficulty: number;
}

export interface DifficultyAnalysis {
  score: number;
  edgeStrength: number;
  tileUniqueness: number;
  rotationAmbiguity: number;
  visualComplexity: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface PuzzleQualityReport {
  validation: PuzzleValidationResult;
  analysis: DifficultyAnalysis;
  publishable: boolean;
  warnings: string[];
}
