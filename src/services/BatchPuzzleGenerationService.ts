import { PuzzleGenerationService } from './PuzzleGenerationService';

type Difficulty =
  | 'Easy'
  | 'Medium'
  | 'Hard';

interface GeneratedPuzzle {
  id: string;

  createdAt: number;

  status:
    | 'generated'
    | 'failed';

  difficulty: Difficulty;

  tiles: any[];

  sourceImage: string;
}

export async function generatePuzzleBatch(
  sourceImage: string,

  count: number,

  difficulty: Difficulty =
    'Medium'
): Promise<
  GeneratedPuzzle[]
> {
  const puzzles:
    GeneratedPuzzle[] =
    [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    try {
      const gradient =
        createGradientSeed(
          sourceImage,

          i
        );

      const tiles =
        PuzzleGenerationService.generateValidatedPuzzle(
          gradient,

          difficulty
        );

      puzzles.push({
        id:
          crypto.randomUUID(),

        createdAt:
          Date.now(),

        status:
          'generated',

        difficulty,

        sourceImage,

        tiles
      });
    } catch (
      err
    ) {
      console.error(
        `Puzzle ${i} failed`,
        err
      );

      puzzles.push({
        id:
          crypto.randomUUID(),

        createdAt:
          Date.now(),

        status:
          'failed',

        difficulty,

        sourceImage,

        tiles:
          []
      });
    }
  }

  return puzzles.filter(
    (
      p
    ) =>
      p.status ===
      'generated'
  );
}

function createGradientSeed(
  sourceImage:
    string,

  seed:
    number
): string[] {
  const hash =
    (
      sourceImage.length *
      (
        seed +
        1
      )
    )
      .toString(
        16
      )
      .padStart(
        6,

        '0'
      );

  return [
    `#${hash.slice(
      0,
      6
    )}`,

    `#${hash
      .split('')
      .reverse()
      .join('')
      .slice(
        0,
        6
      )}`,

    '#ffffff'
  ];
}
