/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TileSwappy Brand Colors
        navy: {
          DEFAULT: '#0D1B2A',
          light: '#1B2B3A',
          dark: '#0A1420',
        },
        coral: {
          DEFAULT: '#FF4C4C',
          light: '#FF6B6B',
          dark: '#E63946',
        },
        teal: {
          DEFAULT: '#2EC4B6',
          light: '#4FD1C5',
          dark: '#1FA39A',
        },
        offwhite: '#F4F4F4',
        // Added for design-system consistency: replaces raw Tailwind
        // defaults (purple-500, yellow-500, gray-400, orange-600) that
        // had leaked into IdleHintsPopup/PlayerStatsModal/App.tsx.
        violet: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        gold: {
          DEFAULT: '#FBBF24',
          light: '#FDE68A',
          dark: '#D97706',
        },
        silver: '#9CA3AF',
        bronze: '#C2703D',
        // Formalizes the green edge-match color already used in
        // GameBoard.tsx/TutorialScreen.tsx -- token added now, NOT
        // adopted there this pass (that's the deferred gameplay-polish
        // scope), so those files still use raw green-500 for now.
        match: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
      },
      borderRadius: {
        '5xl': '2.5rem', // fixes HomeScreen.tsx's invalid `rounded-5xl` (previously a no-op, no such class existed)
      },
      boxShadow: {
        'coral-glow': '0 0 20px rgba(255, 76, 76, 0.5)',
        'teal-glow': '0 0 20px rgba(46, 196, 182, 0.5)',
        'gold-glow': '0 0 20px rgba(251, 191, 36, 0.6)',
      },
    },
  },
  plugins: [],
}