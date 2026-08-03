import type { MascotLine } from './types';

const POKE_COUNT_KEY = 'tileswappy_mascot_poke_count';

// A quiet easter egg -- most players will never notice this exists, and
// that's the point. Counts every poke across every Tilo instance in the
// app (start screen, menus, tutorial, ...) since it's a single shared
// localStorage counter, not scoped per-component.
export function incrementPokeCount(): number {
  const current = parseInt(localStorage.getItem(POKE_COUNT_KEY) || '0', 10);
  const next = current + 1;
  try {
    localStorage.setItem(POKE_COUNT_KEY, String(next));
  } catch {
    // ignore -- worst case the count just doesn't persist this session
  }
  return next;
}

const POKE_MILESTONES: Record<number, MascotLine> = {
  10: { text: "10 pokes?! Okay, I see you.", expression: 'surprised' },
  50: { text: "50 pokes. We're basically best friends now.", expression: 'love' },
  100: { text: "100 pokes! You really have nothing better to do, huh? I love it.", expression: 'laughing' },
  250: { text: "250 pokes. I'm both flattered and a little concerned.", expression: 'confused' },
  500: { text: "500. At this point you should just adopt me.", expression: 'love' }
};

export function getPokeMilestoneLine(count: number): MascotLine | null {
  return POKE_MILESTONES[count] ?? null;
}
