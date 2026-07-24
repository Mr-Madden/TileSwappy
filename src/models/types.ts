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

// Raw, as-stored tile data for a Factory-generated puzzle (Supabase
// puzzle_tiles rows) -- deliberately NOT the game-runtime Tile shape
// (no row/col/rotation/edgeHashes yet): useGameState.startGame is what
// turns these into real, shuffled, playable Tile[] objects.
export interface FactoryTile {
  tileIndex: number;

  imageUrl: string;

  correctPosition: number;

  correctRotation: 0 | 90 | 180 | 270;
}

// One difficulty tier's full puzzle content for a given calendar date
// (db/migrations/0006_puzzle_calendar_per_difficulty.sql lets up to 3 of
// these -- Easy/Medium/Hard -- exist for the same date).
export interface FactoryDifficultyVariant {
  difficulty: string;

  image_url?: string;

  themeName?: string;

  themeCategory?: string;

  themeStyleTag?: string;

  tiles: FactoryTile[];
}

export interface Puzzle {
  id: string;

  title: string;

  difficulty: Difficulty;

  status?: PuzzleStatus;

  gradient: string[];

  tiles?: FactoryTile[];

  // Factory theme metadata (Supabase themes table), used for the
  // post-solve "You solved: X" reveal -- deliberately not shown
  // anywhere before a puzzle is solved.
  themeName?: string;

  themeCategory?: string;

  themeStyleTag?: string;

  // All Easy/Medium/Hard variants published for this puzzle's date, if
  // this puzzle came from getFactoryPuzzlesForDateRange -- powers the
  // HomeScreen difficulty picker.
  difficultyVariants?: Record<string, FactoryDifficultyVariant>;

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

  // Practice-puzzle gradient rendering (ArchiveModal's built-in catalog).
  // Optional because Factory/daily puzzles never set these -- they render
  // from real tile images instead. See PuzzleGenerationService.createPuzzleFromGradient,
  // which is the actual canvas the tiles get cut from: it must honor these
  // the same way ArchiveModal's own browse-thumbnail preview does, or the
  // played puzzle silently becomes a different image than the one the
  // player picked.
  pattern?: string;

  direction?: string;
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
  notificationsEnabled: boolean;

  vibrateEnabled: boolean;

  soundEnabled?: boolean;

  soundStyle?: 'bowl' | 'wood' | 'glass' | 'arcade';

  soundVolume?: number;

  theme?: string;
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
