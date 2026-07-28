// ─────────────────────────────────────────────────────────────────────────────
//  THE brand accent color. Change this ONE value to re-theme the whole app.
//  It feeds BOTH:
//    • the Tailwind `accent` color  → classes like `bg-accent` / `text-accent`
//    • the JS `ACCENT` constant (lib/tokens) → icons, SVGs, inline styles
//  (Plain CommonJS on purpose so tailwind.config.js can require it too.)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  ACCENT: '#0E7490', // teal
};
