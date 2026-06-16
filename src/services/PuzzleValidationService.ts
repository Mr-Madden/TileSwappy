export function validateBatch(puzzles) {
  return puzzles.filter((p) => {
    const unique = new Set(
      p.tiles.map(
        t =>
          `${t.top}-${t.right}-${t.bottom}-${t.left}`
      )
    );

    return unique.size === p.tiles.length;
  });
}
