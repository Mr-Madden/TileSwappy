/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TileSwappy Brand Colors -- driven by CSS custom properties
        // (see src/styles/themes.css) so the whole app can be reskinned
        // at runtime via a `data-theme` attribute on <html>. The
        // `rgb(var(--x) / <alpha-value>)` pattern keeps opacity
        // modifiers (bg-navy/80, text-offwhite/60, ...) working per theme.
        navy: {
          DEFAULT: 'rgb(var(--color-navy) / <alpha-value>)',
          light: 'rgb(var(--color-navy-light) / <alpha-value>)',
          dark: 'rgb(var(--color-navy-dark) / <alpha-value>)',
        },
        coral: {
          DEFAULT: 'rgb(var(--color-coral) / <alpha-value>)',
          light: 'rgb(var(--color-coral-light) / <alpha-value>)',
          dark: 'rgb(var(--color-coral-dark) / <alpha-value>)',
        },
        teal: {
          DEFAULT: 'rgb(var(--color-teal) / <alpha-value>)',
          light: 'rgb(var(--color-teal-light) / <alpha-value>)',
          dark: 'rgb(var(--color-teal-dark) / <alpha-value>)',
        },
        offwhite: 'rgb(var(--color-offwhite) / <alpha-value>)',
        violet: {
          DEFAULT: 'rgb(var(--color-violet) / <alpha-value>)',
          light: 'rgb(var(--color-violet-light) / <alpha-value>)',
          dark: 'rgb(var(--color-violet-dark) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          light: 'rgb(var(--color-gold-light) / <alpha-value>)',
          dark: 'rgb(var(--color-gold-dark) / <alpha-value>)',
        },
        silver: 'rgb(var(--color-silver) / <alpha-value>)',
        bronze: 'rgb(var(--color-bronze) / <alpha-value>)',
        // Semantic state color (edge-match "correct" glow), NOT a brand
        // color -- deliberately a plain static value, never themed, so
        // "correct" always reads as green regardless of the active theme.
        match: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
      },
      borderRadius: {
        '5xl': '2.5rem', // fixes HomeScreen.tsx's invalid `rounded-5xl` (previously a no-op, no such class existed)
      },
      boxShadow: {
        'coral-glow': '0 0 20px rgb(var(--color-coral) / 0.5)',
        'teal-glow': '0 0 20px rgb(var(--color-teal) / 0.5)',
        'gold-glow': '0 0 20px rgb(var(--color-gold) / 0.6)',
      },
    },
  },
  plugins: [],
}