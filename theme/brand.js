// ─────────────────────────────────────────────────────────────────────────────
//  THE brand accent color. Change this ONE value to re-theme the whole app.
//  It feeds BOTH:
//    • the Tailwind `accent` color  → classes like `bg-accent` / `text-accent`
//    • the JS `ACCENT` constant (lib/tokens) → icons, SVGs, inline styles
//  (Plain CommonJS on purpose so tailwind.config.js can require it too.)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // TEMPORARY SANITY CHECK — deliberately unmissable so a TestFlight build
  // proves the preview lane is delivering new code. Revert to #22B8CF before
  // merging develop into main.
  ACCENT: '#FF3D57', // was #22B8CF (teal — matches the marketing site's --teal).
  // Was #0E7490, which scored only 3.47:1 on the dark surface (below AA).
  // #22B8CF is 6.6:1 there and is the same teal crapplemaps.com/info uses.
};
