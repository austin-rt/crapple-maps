// Single source of the semantic color palette. Consumed by BOTH:
//  - tailwind.config.js  → emits the :root / .dark CSS variables the token
//    classes (bg-surface, text-content, border-line, …) resolve against.
//  - lib/theme.tsx useColors() → the same colors for style props that can't take
//    a class (sheet/nav/tab backgrounds, icon colors, placeholders).
// RGB triples ("R G B") so Tailwind's `rgb(var(--x) / <alpha-value>)` opacity
// modifier keeps working. Change a color here and it updates everywhere.
//
// The dark palette is deliberately COOL, not neutral grey. It matches the
// marketing site (crapplemaps.com/info), which is built on #0a0e11 / #121a20
// with teal-tinted hairlines. The app previously used neutral greys (#131314,
// #303032, #3a3a3e), which read as a different product sitting next to it. Same
// darkness, different temperature.
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
    surface: '10 14 17', // #0a0e11 — marketing --bg
    'surface-2': '18 26 32', // #121a20 — marketing --panel
    'surface-3': '27 34 40', // #1b2228 — marketing panel gradient top
    content: '232 238 242', // #e8eef2 — cool white, was pure #fafafa
    'content-2': '159 178 191', // #9fb2bf — blue-grey, was neutral #a3a3ac
    line: '38 52 60', // #26343c — teal-tinted hairline, was neutral #3a3a3e
  },
};

module.exports = { PALETTE };
