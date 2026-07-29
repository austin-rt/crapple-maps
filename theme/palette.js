// Single source of the semantic color palette. Consumed by BOTH:
//  - tailwind.config.js  → emits the :root / .dark CSS variables the token
//    classes (bg-surface, text-content, border-line, …) resolve against.
//  - lib/theme.tsx useColors() → the same colors for style props that can't take
//    a class (sheet/nav/tab backgrounds, icon colors, placeholders).
// RGB triples ("R G B") so Tailwind's `rgb(var(--x) / <alpha-value>)` opacity
// modifier keeps working. Change a color here and it updates everywhere.
const PALETTE = {
  light: {
    surface: '255 255 255',
    'surface-2': '245 246 248',
    'surface-3': '233 233 237',
    content: '23 23 23',
    'content-2': '100 108 120',
    line: '209 213 219',
  },
  dark: {
    surface: '19 19 20', // #131314 — matches Google Maps iOS dark bg
    'surface-2': '48 48 50', // #303032
    'surface-3': '62 62 66', // #3e3e42
    content: '250 250 250',
    'content-2': '163 163 172', // #a3a3ac
    line: '58 58 62', // #3a3a3e
  },
};

module.exports = { PALETTE };
