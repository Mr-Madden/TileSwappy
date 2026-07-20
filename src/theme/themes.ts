export interface ThemeOption {
  id: string;
  name: string;
  /** 3 representative hex colors, used for the small swatch preview in Settings. */
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: 'current', name: 'Current', swatch: ['#0D1B2A', '#FF4C4C', '#2EC4B6'] },
  { id: 'cosmic', name: 'Cosmic', swatch: ['#0a0e1a', '#7c5cff', '#22d3ee'] },
  { id: 'arcade', name: 'Arcade', swatch: ['#1b1140', '#ff3d81', '#ffc93c'] },
  { id: 'neon', name: 'Neon', swatch: ['#05070a', '#ff2d6e', '#00f5d4'] },
  { id: 'retro', name: 'Retro Handheld', swatch: ['#1a1310', '#ffa94d', '#ff7a3d'] },
  { id: 'botanical', name: 'Botanical', swatch: ['#16281e', '#d98f4e', '#8fae6b'] },
  { id: 'zen', name: 'Zen', swatch: ['#eef0e6', '#8fa693', '#d9a37b'] },
  { id: 'ocean', name: 'Ocean', swatch: ['#063a3f', '#ff8a65', '#4fd1c5'] },
  { id: 'desert', name: 'Desert', swatch: ['#e8c99b', '#b5562f', '#7a8b5e'] },
  { id: 'ice', name: 'Ice', swatch: ['#0b1f2a', '#5fb8dc', '#eaf8ff'] },
  { id: 'candy', name: 'Candy Shop', swatch: ['#ffd6ec', '#ff5fa2', '#d9c6ff'] },
  { id: 'autumn', name: 'Autumn', swatch: ['#4a1e1e', '#d4a24c', '#e07a3f'] },
  { id: 'deco', name: 'Art Deco', swatch: ['#0a1410', '#d4af6a', '#3f6b52'] },
  { id: 'mono', name: 'Monochrome', swatch: ['#0c0c0c', '#ffffff', '#FF4C4C'] },
];

export const DEFAULT_THEME = 'current';
