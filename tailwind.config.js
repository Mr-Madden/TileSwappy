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
      },
      boxShadow: {
        'coral-glow': '0 0 20px rgba(255, 76, 76, 0.5)',
        'teal-glow': '0 0 20px rgba(46, 196, 182, 0.5)',
      },
    },
  },
  plugins: [],
}