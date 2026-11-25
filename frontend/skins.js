// Skin definitions (owl / cat / robot), light and dark palettes, mascot art and background patterns.
// Consumed by restored-features.js (applySkin). Keep in sync with design/README.md.
(() => {
  const skins = {
    hikma: {name: 'حكمة', icon: '🦉', green: '#176b5c', dark: '#105447', mint: '#dcece1', paper: '#f5f3eb', surface: '#fffefa', ink: '#183b3b', muted: '#52615f'},
    cat: {name: 'قطة الفضاء', icon: '🐱', green: '#7c5cfa', dark: '#4b34b8', mint: '#cfc4ff', paper: '#1b1446', surface: '#2a2063', ink: '#f3eeff', muted: '#cfc4ff'},
    bot: {name: 'الروبوت الودود', icon: '🤖', green: '#4f7c96', dark: '#2f5063', mint: '#bfd6e3', paper: '#dce9f0', surface: '#fff', ink: '#12343b', muted: '#46656b'}
  };
  const palettes = {
    hikma: {
      light: {paper: '#f4f1e8', surface: '#fffdf6', ink: '#152238', muted: '#5b6b8c', line: '#e0d9c4', green: '#c99a3f', dark: '#8a6d1a', mint: '#efe7cf', on: '#221a05'},
      dark: {paper: '#0a1424', surface: '#101d33', ink: '#eef3fb', muted: '#93a5c4', line: '#22314d', green: '#e7bd72', dark: '#c99a3f', mint: '#16273f', on: '#221a05'}
    },
    cat: {
      light: {paper: '#f4f0ff', surface: '#fff', ink: '#28204b', muted: '#625b7e', line: '#ded8ef', green: '#7255c7', dark: '#5739a0', mint: '#e9e2fa', on: '#ffffff'},
      dark: {paper: '#171226', surface: '#231d36', ink: '#f5f0ff', muted: '#c2b7dc', line: '#4a4063', green: '#b3a0ff', dark: '#9078e8', mint: '#38304f', on: '#1b1446'}
    },
    bot: {
      light: {paper: '#eef4f7', surface: '#fff', ink: '#173442', muted: '#556d78', line: '#d3e0e6', green: '#426d83', dark: '#2f5063', mint: '#dce9f0', on: '#ffffff'},
      dark: {paper: '#111f27', surface: '#1c303a', ink: '#e4f3f7', muted: '#aac2cd', line: '#39525d', green: '#93c0d5', dark: '#56839a', mint: '#263d49', on: '#0f2630'}
    }
  };
  const catArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="قطة الفضاء"><polygon points="52,90 62,20 112,62" style="fill:var(--green-dark)"/><polygon points="208,90 198,20 148,62" style="fill:var(--green-dark)"/><circle cx="130" cy="140" r="86" style="fill:var(--green)"/><circle cx="130" cy="140" r="98" fill="none" stroke="#fff" stroke-width="8" opacity=".85"/><ellipse cx="130" cy="170" rx="46" ry="34" style="fill:var(--mint)"/><circle cx="98" cy="128" r="16" fill="#fff"/><circle cx="162" cy="128" r="16" fill="#fff"/><circle cx="101" cy="130" r="8" fill="#12343b"/><circle cx="165" cy="130" r="8" fill="#12343b"/><path d="M120 158h20l-10 12z" fill="#ff7ab6"/><path d="M130 170c0 12-18 14-24 6m24-6c0 12 18 14 24 6" fill="none" stroke="#12343b" stroke-width="3"/><g stroke="#12343b" stroke-width="3"><path d="m40 160 42 6m-42 16 42-6m138-10 42-6m-42 22 42 6"/></g><path d="m224 32 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ff7ab6"/></svg>`;
  const botArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="الروبوت الودود"><path d="M130 22v30" stroke="#12343b" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="20" r="12" fill="#9be15d"/><rect x="48" y="52" width="164" height="132" rx="34" style="fill:var(--green)"/><rect x="30" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="212" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="70" y="80" width="120" height="64" rx="22" fill="#12343b"/><rect x="88" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="142" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="104" y="158" width="52" height="10" rx="5" style="fill:var(--mint)"/><rect x="78" y="190" width="104" height="52" rx="18" style="fill:var(--green-dark)"/></svg>`;
  const patterns = {
    cat: 'radial-gradient(#ffffff66 1.5px,transparent 2px) 0 0/34px 34px',
    bot: 'linear-gradient(#2f506322 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,#2f506322 1px,transparent 1px) 0 0/28px 28px'
  };
  window.HikmaSkins = {skins, palettes, catArt, botArt, patterns};
})();
