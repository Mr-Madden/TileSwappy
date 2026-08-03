// Shared between TileMascot.tsx and MascotNarrator.tsx -- split out so
// neither has to import the other just to get at these, which would
// create a circular import (MascotNarrator already imports the
// TileMascot component itself).
export type MascotExpression =
  | 'happy'
  | 'excited'
  | 'wink'
  | 'sleepy'
  | 'surprised'
  | 'thinking'
  | 'laughing'
  | 'love'
  | 'confused';

export interface MascotLine {
  text: string;
  /** Overrides the narrator's default `expression` for just this line -- lets specific lines land with a wink/laugh/heart-eyes instead of the generic default. */
  expression?: MascotExpression;
}
