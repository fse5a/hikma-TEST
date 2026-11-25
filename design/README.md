# Design

- `style.css`: the whole stylesheet. Colors come from CSS variables (`--paper`, `--ink`, `--green`...) that `applySkin()` sets at runtime. Don't hard-code colors.
- `icon.svg`: app icon.
- `fonts/`: Cairo and Tajawal, self-hosted (OFL).
- Skins: `hikma` (owl), `cat` (space cat), `bot` (robot). Each has a light and a dark palette.
- Mobile header: brand on one row, then a row of 44px SVG icon buttons (SVG because emoji show as boxes on some phones).
- `scripts/build.js` copies this folder into `dist/`.
