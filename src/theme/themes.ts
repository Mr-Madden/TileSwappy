export interface ThemeOption {
  id: string;
  name: string;
  /** 3 representative hex colors, used for the small swatch preview in Settings. */
  swatch: [string, string, string];
}

// Swatch triplets are [navy, coral, teal] pulled directly from each
// theme's actual src/styles/themes.css values -- kept in sync so the
// picker preview always matches what selecting it really does.
export const THEMES: ThemeOption[] = [
  { id: 'current', name: 'Original', swatch: ['#0d1b2a', '#ff4c4c', '#2ec4b6'] },
  { id: 'cosmic', name: 'Cosmic', swatch: ['#121a2b', '#fb7185', '#22d3ee'] },
  { id: 'arcade', name: 'Arcade', swatch: ['#1b1140', '#ff3d81', '#35c1ff'] },
  { id: 'neon', name: 'Neon', swatch: ['#0d1417', '#ff2d6e', '#00f5d4'] },
  { id: 'retro', name: 'Retro Handheld', swatch: ['#1a1310', '#ff7a3d', '#ffa94d'] },
  { id: 'botanical', name: 'Botanical', swatch: ['#16281e', '#d98f4e', '#8fae6b'] },
  { id: 'zen', name: 'Zen', swatch: ['#eef0e6', '#b5754a', '#5f7a63'] },
  { id: 'ocean', name: 'Ocean', swatch: ['#084a50', '#ff8a65', '#4fd1c5'] },
  { id: 'desert', name: 'Desert', swatch: ['#e8c99b', '#b5562f', '#5c6b44'] },
  { id: 'ice', name: 'Ice', swatch: ['#0b1f2a', '#d88a9a', '#5fb8dc'] },
  { id: 'candy', name: 'Candy Shop', swatch: ['#ffd6ec', '#d6317f', '#2a9d6f'] },
  { id: 'autumn', name: 'Autumn', swatch: ['#4a1e1e', '#e07a3f', '#6b7a3f'] },
  { id: 'deco', name: 'Art Deco', swatch: ['#0d1f16', '#a63d4a', '#3f6b52'] },
  { id: 'mono', name: 'Monochrome', swatch: ['#0c0c0c', '#ff4c4c', '#d9d9d9'] },
];

export const DEFAULT_THEME = 'current';
