// =====================
// Edge Models
// =====================

export interface EdgeData {
  hash: string;

  matchId: string;

  variance?: number;

  featureScore?: number;

  dominantColor?: string;
}

// =====================
// Tile Models
// =====================

export interface Tile {
  id: string;

  row: number;

  col: number;

  originalRow: number;

  originalCol: number;

  imageData: string;

  rotation:
    | 0
    | 90
    | 180
    | 270;

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

// =====================
// Puzzle Models
// =====================

export type Difficulty =
  | 'Easy'
  | 'Medium'
  | 'Hard';

export type PuzzleStatus =
  | 'generated'
  | 'validated'
  | 'failed'
  | 'published';

export interface Puzzle {
  id: string;

  title: string;

  difficulty: Difficulty;

  status?: PuzzleStatus;

  gradient: string[];

  tiles?: Tile[];

  imageUrl?: string;

  sourceImage?: string;

  validated?: boolean;

  generatedAt?: string;

  createdAt?: number;

  difficultyScore?: number;

  uniquenessScore?: number;

  solutionCount?: number;

  averageEdgeStrength?: number;

  averageTileComplexity?: number;
}

// =====================
// Batch Models
// =====================

export interface PuzzleBatch {
  id: string;

  sourceImage: string;

  puzzles: Puzzle[];

  createdAt: number;

  completed: boolean;

  totalGenerated: number;

  totalValid: number;

  totalFailed: number;

  difficulty?: Difficulty;
}

// =====================
// Move Models
// =====================

export interface Move {
  type:
    | 'rotate'
    | 'swap';

  tileId?: string;

  previousRotation?:
    | 0
    | 90
    | 180
    | 270;

  tile1Id?: string;

  tile2Id?: string;

  tile1PrevPos?: {
    row: number;

    col: number;
  };

  tile2PrevPos?: {
    row: number;

    col: number;
  };
}

// =====================
// Runtime State
// =====================

export interface GameState {
  status:
    | 'start'
    | 'idle'
    | 'loading'
    | 'playing'
    | 'solved';

  tiles: Tile[];

  moves: number;

  swaps: number;

  undos: number;

  startTime: number;

  currentTime: number;

  solveTime:
    | number
    | null;

  selectedTile:
    | string
    | null;

  moveHistory: Move[];

  matchingEdges:
    Set<string>;

  isPaused: boolean;

  pausedTime: number;
}

// =====================
// Settings
// =====================

export interface AppSettings {
  selectedLanguage: string;

  notificationsEnabled: boolean;

  vibrateEnabled: boolean;

  soundEnabled?: boolean;
}

// =====================
// Stats
// =====================

export interface PuzzleStats {
  attempts: number;

  bestTime:
    | number
    | null;

  bestMoves:
    | number
    | null;

  bestSwaps:
    | number
    | null;

  lastPlayedTime?: number;

  lastPlayedMoves?: number;

  lastPlayedSwaps?: number;

  completionDates:
    string[];
}

// =====================
// Validation
// =====================

export interface PuzzleValidationResult {
  valid: boolean;

  solutionCount: number;

  uniquenessScore: number;

  estimatedDifficulty: number;

  complexityScore?: number;

  warnings?: string[];
}

export interface DifficultyAnalysis {
  score: number;

  edgeStrength: number;

  tileUniqueness: number;

  rotationAmbiguity: number;

  visualComplexity: number;

  difficulty: Difficulty;
}

export interface PuzzleQualityReport {
  validation:
    PuzzleValidationResult;

  analysis:
    DifficultyAnalysis;

  publishable: boolean;

  warnings:
    string[];
}
