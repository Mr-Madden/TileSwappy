import { generatePuzzle } from "./PuzzleGenerationService";

export async function generatePuzzleBatch(
  sourceImage: string,
  count: number
) {
  const puzzles = [];

  for (let i = 0; i < count; i++) {
    try {
      const puzzle = await generatePuzzle(sourceImage);

      puzzles.push({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        status: "generated",
        ...puzzle,
      });
    } catch (err) {
      console.error(`Puzzle ${i} failed`, err);
    }
  }

  return puzzles;
}
