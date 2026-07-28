const { ACCENT } = require('./theme/brand');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Class strategy so the manual theme lever (colorScheme.set) drives dark mode,
  // not just the system setting.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Single accent — sourced from theme/brand.js (change it there).
        accent: {
          DEFAULT: ACCENT,
          fg: '#FFFFFF',
          muted: '#C4B5FD',
        },
        // Semantic tokens — resolve to CSS vars that flip in .dark (see global.css).
        // Use these instead of `bg-white dark:bg-neutral-950` so light/dark is automatic.
        surface: 'rgb(var(--surface) / <alpha-value>)', // primary background
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)', // subtle background
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)', // raised / chips
        content: 'rgb(var(--content) / <alpha-value>)', // primary text
        'content-2': 'rgb(var(--content-2) / <alpha-value>)', // secondary text
        line: 'rgb(var(--line) / <alpha-value>)', // borders
      },
    },
  },
  plugins: [],
};
