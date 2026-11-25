# Design

- `style.css` - the whole stylesheet. Colors come only from CSS variables (`--paper --surface --ink --muted --line --green --green-dark --mint --on-accent`), set at runtime by `applySkin()` in `frontend/restored-features.js`. Do not hard-code colors in components.
- `icon.svg` - app icon.
- Skins: `hikma` (owl, gold on navy/cream), `cat` (space cat, violet), `bot` (friendly robot, steel blue). Each has a light and a dark palette (the `palettes` object in `restored-features.js`).
- Mobile header: brand on its own row, then a row of 44px icon buttons (SVG icons, not emoji, so they render the same on every phone).
- `build.js` copies this folder into `dist/` next to the frontend files.
