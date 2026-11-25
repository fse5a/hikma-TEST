// Skin definitions (owl / cat / robot), light and dark palettes, mascot art and background patterns.
// Consumed by restored-features.js (applySkin). Keep in sync with design/README.md.
// ============================================================
// السكنز: أشكال التطبيق (بومة، قطة الفضاء، الروبوت، وخمس سكنات أقلام مقفولة بكود) وألوان كل واحد (فاتح وداكن) ورسومات الشخصيات.
// ============================================================
(() => {
  // أسماء السكنز وأيقوناتها وألوانها الأساسية
  const skins = {
    hikma: {name: 'حكمة', icon: '🦉', green: '#176b5c', dark: '#105447', mint: '#dcece1', paper: '#f5f3eb', surface: '#fffefa', ink: '#183b3b', muted: '#52615f'},
    cat: {name: 'قطة الفضاء', icon: '🐱', green: '#7c5cfa', dark: '#4b34b8', mint: '#cfc4ff', paper: '#1b1446', surface: '#2a2063', ink: '#f3eeff', muted: '#cfc4ff'},
    bot: {name: 'الروبوت الودود', icon: '🤖', green: '#4f7c96', dark: '#2f5063', mint: '#bfd6e3', paper: '#dce9f0', surface: '#fff', ink: '#12343b', muted: '#46656b'},
    // سكنز الأقلام المقفولة: بتظهر بعد إدخال كودها (locked) والكود بيتفحص على السيرفر
    doraemon: {locked: true, name: 'القط الأزرق', icon: '🔔', green: '#1e88e5', dark: '#0d5ea8', mint: '#d7ecff', paper: '#eef7ff', surface: '#fff', ink: '#0e2a47', muted: '#4a6784'},
    mickey: {locked: true, name: 'الفأر الأحمر', icon: '🎀', green: '#c8102e', dark: '#8f0b21', mint: '#f7dcdf', paper: '#f6f1ee', surface: '#fff', ink: '#1a1a1a', muted: '#5c5555'},
    anbu: {locked: true, name: 'الظل المقنّع', icon: '🎭', green: '#3a3f4f', dark: '#20232d', mint: '#e0e2e8', paper: '#efeff0', surface: '#fff', ink: '#16161a', muted: '#5a5a63'},
    uchiha: {locked: true, name: 'المروحة القرمزية', icon: '🔥', green: '#1f2d6b', dark: '#131d4a', mint: '#dde2f5', paper: '#eef0f8', surface: '#fff', ink: '#141b3a', muted: '#55608a'},
    zelda: {locked: true, name: 'مملكة الذهب', icon: '🔺', green: '#2f7d3e', dark: '#1f5a2b', mint: '#e1efc9', paper: '#f3f1e1', surface: '#fffdf3', ink: '#1d3322', muted: '#5a6b55'}
  };
  // ألوان كل سكن في الوضع الفاتح والداكن
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
    },
    doraemon: {
      light: {paper: '#eef7ff', surface: '#ffffff', ink: '#0e2a47', muted: '#4a6784', line: '#cfe3f5', green: '#1e88e5', dark: '#0d5ea8', mint: '#d7ecff', on: '#ffffff'},
      dark: {paper: '#0b1a2b', surface: '#132b45', ink: '#eaf4ff', muted: '#9fc0e0', line: '#28496b', green: '#6ab7ff', dark: '#3d92e0', mint: '#1b3a5c', on: '#06213d'}
    },
    mickey: {
      light: {paper: '#f6f1ee', surface: '#ffffff', ink: '#1a1a1a', muted: '#5c5555', line: '#e3d8d4', green: '#c8102e', dark: '#8f0b21', mint: '#f7dcdf', on: '#ffffff'},
      dark: {paper: '#111111', surface: '#1c1c1c', ink: '#f5f1f0', muted: '#bdb3b0', line: '#3a3030', green: '#ff5468', dark: '#e03048', mint: '#3a1a1f', on: '#1a0508'}
    },
    anbu: {
      light: {paper: '#efeff0', surface: '#ffffff', ink: '#16161a', muted: '#5a5a63', line: '#d9d9de', green: '#3a3f4f', dark: '#20232d', mint: '#e0e2e8', on: '#ffffff'},
      dark: {paper: '#0d0e12', surface: '#171920', ink: '#f1f1f4', muted: '#a9acb8', line: '#2c2f3a', green: '#e04a5c', dark: '#c0283c', mint: '#2a1d22', on: '#1a0508'}
    },
    uchiha: {
      light: {paper: '#eef0f8', surface: '#ffffff', ink: '#141b3a', muted: '#55608a', line: '#d5daee', green: '#1f2d6b', dark: '#131d4a', mint: '#dde2f5', on: '#ffffff'},
      dark: {paper: '#0a0e24', surface: '#121a3b', ink: '#eceffd', muted: '#9ca8d6', line: '#25305f', green: '#ff5a5f', dark: '#d93a40', mint: '#1c2550', on: '#1f0508'}
    },
    zelda: {
      light: {paper: '#f3f1e1', surface: '#fffdf3', ink: '#1d3322', muted: '#5a6b55', line: '#ddd9b8', green: '#2f7d3e', dark: '#1f5a2b', mint: '#e1efc9', on: '#ffffff'},
      dark: {paper: '#0e1a10', surface: '#16281a', ink: '#f3f0d8', muted: '#b5c4a6', line: '#2d4a32', green: '#e6c050', dark: '#c9a22e', mint: '#223a25', on: '#1c1604'}
    }
  };
  // رسمة القطة
  const catArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="قطة الفضاء"><polygon points="52,90 62,20 112,62" style="fill:var(--green-dark)"/><polygon points="208,90 198,20 148,62" style="fill:var(--green-dark)"/><circle cx="130" cy="140" r="86" style="fill:var(--green)"/><circle cx="130" cy="140" r="98" fill="none" stroke="#fff" stroke-width="8" opacity=".85"/><ellipse cx="130" cy="170" rx="46" ry="34" style="fill:var(--mint)"/><circle cx="98" cy="128" r="16" fill="#fff"/><circle cx="162" cy="128" r="16" fill="#fff"/><circle cx="101" cy="130" r="8" fill="#12343b"/><circle cx="165" cy="130" r="8" fill="#12343b"/><path d="M120 158h20l-10 12z" fill="#ff7ab6"/><path d="M130 170c0 12-18 14-24 6m24-6c0 12 18 14 24 6" fill="none" stroke="#12343b" stroke-width="3"/><g stroke="#12343b" stroke-width="3"><path d="m40 160 42 6m-42 16 42-6m138-10 42-6m-42 22 42 6"/></g><path d="m224 32 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ff7ab6"/></svg>`;
  // رسمة الروبوت
  const botArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="الروبوت الودود"><path d="M130 22v30" stroke="#12343b" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="20" r="12" fill="#9be15d"/><rect x="48" y="52" width="164" height="132" rx="34" style="fill:var(--green)"/><rect x="30" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="212" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="70" y="80" width="120" height="64" rx="22" fill="#12343b"/><rect x="88" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="142" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="104" y="158" width="52" height="10" rx="5" style="fill:var(--mint)"/><rect x="78" y="190" width="104" height="52" rx="18" style="fill:var(--green-dark)"/></svg>`;
  // رسومات الشخصيات الجديدة (رسومات أصلية بسيطة مبنية على ألوان وشعار كل سكن، تتبدّل بالرسمة الرسمية لما تتوفر)
  const svg = (label, inner) => `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="${label}">${inner}</svg>`;
  const doraemonArt = svg('القط الأزرق', '<circle cx="130" cy="130" r="100" fill="#1e88e5"/><ellipse cx="130" cy="148" rx="74" ry="64" fill="#fff"/><circle cx="104" cy="104" r="22" fill="#fff" stroke="#0d5ea8" stroke-width="4"/><circle cx="156" cy="104" r="22" fill="#fff" stroke="#0d5ea8" stroke-width="4"/><circle cx="110" cy="108" r="8" fill="#0e2a47"/><circle cx="150" cy="108" r="8" fill="#0e2a47"/><circle cx="130" cy="128" r="12" fill="#e53935"/><path d="M130 140v26M96 176c20 20 48 20 68 0" fill="none" stroke="#0e2a47" stroke-width="4" stroke-linecap="round"/><g stroke="#0e2a47" stroke-width="3" stroke-linecap="round"><path d="M66 140l28 6M64 160l30-2M194 146l28-6M196 158l30 2"/></g><rect x="86" y="214" width="88" height="14" rx="7" fill="#e53935"/><circle cx="130" cy="232" r="13" fill="#ffc83d"/>');
  const mickeyArt = svg('الفأر الأحمر', '<circle cx="62" cy="62" r="46" fill="#111"/><circle cx="198" cy="62" r="46" fill="#111"/><circle cx="130" cy="140" r="90" fill="#111"/><ellipse cx="130" cy="164" rx="62" ry="50" fill="#f3d3b3"/><circle cx="104" cy="118" r="16" fill="#fff"/><circle cx="156" cy="118" r="16" fill="#fff"/><circle cx="108" cy="122" r="7" fill="#111"/><circle cx="152" cy="122" r="7" fill="#111"/><ellipse cx="130" cy="146" rx="13" ry="9" fill="#111"/><path d="M96 170c18 26 50 26 68 0" fill="#7a1c1c" stroke="#111" stroke-width="3"/><path d="M96 224l34-14 34 14-34 12z" fill="#c8102e"/>');
  const anbuArt = svg('الظل المقنّع', '<circle cx="130" cy="130" r="104" fill="#20232d"/><path d="M62 96c0-44 30-68 68-68s68 24 68 68v50c0 40-30 76-68 84-38-8-68-44-68-84z" fill="#f4f1ea"/><path d="M70 100c10 6 22 10 34 10M190 100c-10 6-22 10-34 10" fill="none" stroke="#c8102e" stroke-width="7" stroke-linecap="round"/><ellipse cx="102" cy="124" rx="14" ry="10" fill="#111"/><ellipse cx="158" cy="124" rx="14" ry="10" fill="#111"/><path d="M130 52v46M100 178c18 12 42 12 60 0" fill="none" stroke="#c8102e" stroke-width="7" stroke-linecap="round"/>');
  const uchihaArt = svg('المروحة القرمزية', '<circle cx="130" cy="130" r="104" fill="#131d4a"/><path d="M130 38a92 92 0 0 1 0 184c-26 0-44-18-44-44 0-30 26-34 26-62 0-24-12-40 18-78z" fill="#e53935"/><path d="M130 38a92 92 0 0 0 0 184c26 0 44-18 44-44 0-30-26-34-26-62 0-24 12-40-18-78z" fill="#fff" opacity=".12"/><rect x="118" y="188" width="24" height="48" rx="8" fill="#f4f1ea"/><circle cx="130" cy="120" r="14" fill="#fff"/>');
  const zeldaArt = svg('مملكة الذهب', '<circle cx="130" cy="130" r="104" fill="#1f5a2b"/><circle cx="130" cy="130" r="92" fill="none" stroke="#e6c050" stroke-width="5"/><path d="M130 52l44 76h-88z" fill="#e6c050"/><path d="M86 128l44 76h-88z" fill="#e6c050"/><path d="M174 128l44 76h-88z" fill="#e6c050"/><path d="M130 128l-22 38h44z" fill="#1f5a2b"/>');
  const art = {cat: catArt, bot: botArt, doraemon: doraemonArt, mickey: mickeyArt, anbu: anbuArt, uchiha: uchihaArt, zelda: zeldaArt};
  // جمل الشخصية لما تتلمس (كل سكن له كلامه)
  const lines = {
    hikma: ['أهلاً! أنا بومة حكمة. تعالى نقرأ قصة.', 'القراءة كل يوم بتخلّيك أذكى.', 'اختار قصة وأنا أقرأها معاك.'],
    cat: ['ميو! جاهز لرحلة فضائية في القصص؟', 'اختار قصة ونطير بيها للنجوم.'],
    bot: ['بيب بوب! أنا الروبوت الودود. جاهز أقرأ معاك.', 'جهازي كله شغال. اختار قصة.'],
    doraemon: ['أهلاً يا صاحبي! جيبت لك جيب سحري مليان قصص.', 'اختار قصة وهنسافر بيها في أي مكان.'],
    mickey: ['هاي! يلا نبدأ القراءة ونضحك مع بعض.', 'القصة دي هتعجبك، جرّبها.'],
    anbu: ['في صمت وتركيز. جاهز للمهمة؟ المهمة هي القراءة.', 'أي مهمة تبدأ بصفحة واحدة.'],
    uchiha: ['التركيز هو سر القوة. اقرأ بتركيز.', 'كل قصة تدريب جديد لعقلك.'],
    zelda: ['السلام يا بطل. المغامرة بتبدأ بقصة.', 'اختار قصتك وكمّل رحلتك.']
  };
  // خلفيات الزخرفة لكل سكن
  const patterns = {
    cat: 'radial-gradient(#ffffff66 1.5px,transparent 2px) 0 0/34px 34px',
    bot: 'linear-gradient(#2f506322 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,#2f506322 1px,transparent 1px) 0 0/28px 28px',
    doraemon: 'radial-gradient(#1e88e522 2px,transparent 3px) 0 0/30px 30px',
    mickey: 'radial-gradient(#c8102e1f 8px,transparent 9px) 0 0/48px 48px',
    anbu: 'repeating-linear-gradient(135deg,#3a3f4f12 0 2px,transparent 2px 22px)',
    uchiha: 'radial-gradient(#e5393522 3px,transparent 4px) 0 0/36px 36px',
    zelda: 'linear-gradient(60deg,#e6c05022 1px,transparent 1px) 0 0/40px 70px,linear-gradient(120deg,#e6c05022 1px,transparent 1px) 0 0/40px 70px'
  };
  window.HikmaSkins = {skins, palettes, catArt, botArt, patterns, art, lines};
})();
