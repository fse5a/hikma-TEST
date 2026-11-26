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
    doraemon: {locked: true, name: 'دورايمون', icon: '🔔', green: '#1565c0', dark: '#0d47a1', mint: '#d7ecff', paper: '#eef7ff', surface: '#fff', ink: '#0e2a47', muted: '#4a6784'},
    mickey: {locked: true, name: 'ميكي', icon: '🎀', green: '#c8102e', dark: '#8f0b21', mint: '#f7dcdf', paper: '#f6f1ee', surface: '#fff', ink: '#1a1a1a', muted: '#5c5555'},
    anbu: {locked: true, name: 'أنبو', icon: '🎭', green: '#3a3f4f', dark: '#20232d', mint: '#e0e2e8', paper: '#efeff0', surface: '#fff', ink: '#16161a', muted: '#5a5a63'},
    uchiha: {locked: true, name: 'أوتشيها', icon: '🔥', green: '#1f2d6b', dark: '#131d4a', mint: '#dde2f5', paper: '#eef0f8', surface: '#fff', ink: '#141b3a', muted: '#55608a'},
    zelda: {locked: true, name: 'لينك', icon: '🗡️', green: '#2f7d3e', dark: '#1f5a2b', mint: '#e1efc9', paper: '#f3f1e1', surface: '#fffdf3', ink: '#1d3322', muted: '#5a6b55'},
    doom: {locked: true, name: 'دكتور دوم', icon: '🛡️', green: '#2f6b3a', dark: '#1b4a26', mint: '#d6e6d8', paper: '#eaf0ea', surface: '#fbfdfb', ink: '#0f1f14', muted: '#4c5f50'}
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
      light: {paper: '#eef7ff', surface: '#ffffff', ink: '#0e2a47', muted: '#4a6784', line: '#cfe3f5', green: '#1565c0', dark: '#0d47a1', mint: '#d7ecff', on: '#ffffff'},
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
    doom: {
      light: {paper: '#eaf0ea', surface: '#fbfdfb', ink: '#0f1f14', muted: '#4c5f50', line: '#cddacf', green: '#2f6b3a', dark: '#1b4a26', mint: '#d6e6d8', on: '#ffffff'},
      dark: {paper: '#070f09', surface: '#0f1c13', ink: '#e8f3ea', muted: '#9db8a2', line: '#223a28', green: '#5fc473', dark: '#3a9a4d', mint: '#15281a', on: '#04140a'}
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
  const doraemonArt = svg('دورايمون', '<circle cx="130" cy="118" r="98" fill="#1e9be8" stroke="#0b4f86" stroke-width="4"/><circle cx="130" cy="140" r="74" fill="#fff" stroke="#0b4f86" stroke-width="2"/><ellipse cx="106" cy="84" rx="19" ry="25" fill="#fff" stroke="#111" stroke-width="3.5"/><ellipse cx="154" cy="84" rx="19" ry="25" fill="#fff" stroke="#111" stroke-width="3.5"/><circle cx="114" cy="90" r="7" fill="#111"/><circle cx="146" cy="90" r="7" fill="#111"/><circle cx="116" cy="87" r="2.4" fill="#fff"/><circle cx="148" cy="87" r="2.4" fill="#fff"/><circle cx="130" cy="112" r="11" fill="#e8281e" stroke="#7a1010" stroke-width="2"/><circle cx="126" cy="108" r="3.5" fill="#fff" opacity=".85"/><path d="M130 123v26" stroke="#111" stroke-width="3" fill="none"/><path d="M78 146Q130 232 182 146Z" fill="#c62828" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/><path d="M104 190Q130 172 156 190Q130 212 104 190Z" fill="#ff8a80"/><g stroke="#111" stroke-width="3" stroke-linecap="round" fill="none"><path d="M52 128l34 6M50 148l36-2M54 168l32-10M208 128l-34 6M210 148l-36-2M206 168l-32-10"/></g><rect x="62" y="206" width="136" height="18" rx="9" fill="#e8281e" stroke="#7a1010" stroke-width="2.5"/><circle cx="130" cy="236" r="15" fill="#ffc83d" stroke="#8a6a00" stroke-width="2.5"/><path d="M118 234h24M130 236v8" stroke="#8a6a00" stroke-width="2.5"/>');
  const mickeyArt = svg('ميكي', '<circle cx="88" cy="32" r="26" fill="#111"/><circle cx="172" cy="32" r="26" fill="#111"/><circle cx="130" cy="74" r="44" fill="#111"/><path d="M92 80Q94 62 112 66Q130 58 148 66Q166 62 168 80Q166 112 130 114Q94 112 92 80Z" fill="#f6d2ad"/><ellipse cx="116" cy="62" rx="10" ry="15" fill="#fff" stroke="#111" stroke-width="2"/><ellipse cx="144" cy="62" rx="10" ry="15" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="118" cy="66" r="5.5" fill="#111"/><circle cx="142" cy="66" r="5.5" fill="#111"/><ellipse cx="130" cy="84" rx="11" ry="8" fill="#111"/><path d="M104 94Q130 124 156 94Q130 102 104 94Z" fill="#7a1c1c" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/><path d="M114 104Q130 116 146 104Q130 110 114 104Z" fill="#ff7a8a"/><path d="M112 118Q130 122 148 118L152 146H108Z" fill="#111"/><path d="M110 142H150L170 196H90Z" fill="#e0212f" stroke="#111" stroke-width="2"/><circle cx="116" cy="158" r="6" fill="#ffd23f"/><circle cx="144" cy="158" r="6" fill="#ffd23f"/><path d="M118 126L74 104M142 126L188 96" stroke="#111" stroke-width="11" stroke-linecap="round"/><circle cx="68" cy="100" r="15" fill="#fff" stroke="#111" stroke-width="2.5"/><circle cx="194" cy="92" r="15" fill="#fff" stroke="#111" stroke-width="2.5"/><path d="M110 194v26M150 194v26" stroke="#111" stroke-width="11" stroke-linecap="round"/><path d="M84 238Q82 218 112 220Q130 224 118 242Q98 246 84 238ZM176 238Q178 218 148 220Q130 224 142 242Q162 246 176 238Z" fill="#ffd23f" stroke="#111" stroke-width="2.5"/>');
  const anbuArt = svg('أنبو', '<circle cx="130" cy="130" r="108" fill="#161821"/><circle cx="130" cy="124" r="62" fill="#c8102e"/><path d="M30 252Q22 96 130 24Q238 96 230 252Z" fill="#2b2e3a"/><path d="M78 98L74 52L106 72L112 40L130 66L148 40L154 72L186 52L182 98Z" fill="#a9acb5"/><path d="M70 92L84 44L114 70Q130 64 146 70L176 44L190 92Q198 150 130 224Q62 150 70 92Z" fill="#f4f2ec" stroke="#14151b" stroke-width="3.5" stroke-linejoin="round"/><path d="M84 44L90 72L106 74ZM176 44L170 72L154 74Z" fill="#c8102e"/><path d="M92 112Q104 104 118 114Q104 124 92 112ZM168 112Q156 104 142 114Q156 124 168 112Z" fill="#111"/><path d="M80 104Q74 140 92 160M180 104Q186 140 168 160" fill="none" stroke="#c8102e" stroke-width="8" stroke-linecap="round"/><path d="M130 74v42M112 176Q130 192 148 176" fill="none" stroke="#c8102e" stroke-width="8" stroke-linecap="round"/><path d="M118 142l12 14 12-14" fill="none" stroke="#14151b" stroke-width="3.5" stroke-linecap="round"/><path d="M56 236Q130 196 204 236L208 252H52Z" fill="#14151b"/>');
  const uchihaArt = svg('أوتشيها', '<circle cx="130" cy="130" r="108" fill="#1a1f2e"/><path d="M130 18a100 100 0 0 1 0 128H130" fill="none"/><path d="M130 24a98 98 0 0 0-98 98h196a98 98 0 0 0-98-98z" fill="#e0212f" stroke="#fff" stroke-width="5"/><path d="M130 122h98a98 98 0 0 1-30 70l-26-22-12 66h-60l-12-66-26 22a98 98 0 0 1-30-70z" fill="none"/><path d="M96 126h68l-8 90h-52z" fill="#fff" opacity=".18"/><path d="M52 252Q56 196 130 190Q204 196 208 252Z" fill="#14151b"/><path d="M96 196L130 232L164 196L156 184H104Z" fill="#2a2d3a"/><path d="M64 122L52 72L80 80L70 36L100 58L112 22L130 54L150 22L160 58L190 36L180 80L208 72L196 122Q194 170 186 212Q174 170 174 122L86 122Q86 170 74 212Q66 170 64 122Z" fill="#101116"/><path d="M84 96Q84 66 130 62Q176 66 176 96Q176 150 130 196Q84 150 84 96Z" fill="#f1cfb0"/><path d="M80 70Q130 44 180 70L180 86Q130 70 80 86Z" fill="#101116"/><rect x="82" y="84" width="96" height="22" rx="4" fill="#2d3550" stroke="#0c0d12" stroke-width="2"/><rect x="112" y="86" width="36" height="18" rx="3" fill="#c9d0e0"/><path d="M130 88l10 8-10 8-10-8z" fill="none" stroke="#2d3550" stroke-width="2.5"/><path d="M98 134Q110 128 120 136Q110 142 98 134ZM162 134Q150 128 140 136Q150 142 162 134Z" fill="#fff" stroke="#101116" stroke-width="2"/><circle cx="109" cy="135" r="5.5" fill="#e0212f"/><circle cx="151" cy="135" r="5.5" fill="#e0212f"/><circle cx="109" cy="135" r="1.8" fill="#111"/><circle cx="151" cy="135" r="1.8" fill="#111"/><path d="M104 152Q112 164 108 172M156 152Q148 164 152 172" stroke="#b98c6e" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M118 176Q130 180 142 176" stroke="#8a5a45" stroke-width="3" fill="none" stroke-linecap="round"/>');
  const zeldaArt = svg('لينك', '<circle cx="130" cy="130" r="108" fill="#1f5a2b"/><path d="M52 126Q64 30 150 26Q214 22 238 78Q200 58 172 76Q194 96 204 126Z" fill="#3f9a2f" stroke="#164a1c" stroke-width="3.5" stroke-linejoin="round"/><path d="M60 118Q130 92 206 118L206 134Q130 110 60 134Z" fill="#2f7d2a" stroke="#164a1c" stroke-width="3"/><path d="M66 130L28 152L70 166ZM194 130L232 152L190 166Z" fill="#f4cfae" stroke="#7a4b2a" stroke-width="2.5" stroke-linejoin="round"/><path d="M64 126Q130 100 196 126Q202 192 130 214Q58 192 64 126Z" fill="#f4cfae" stroke="#7a4b2a" stroke-width="3"/><path d="M64 126Q80 160 98 152Q102 134 130 130Q158 134 162 152Q180 160 196 126Q130 96 64 126Z" fill="#e0a93a" stroke="#8a5f12" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="104" cy="164" rx="12" ry="15" fill="#fff" stroke="#14202a" stroke-width="2.5"/><ellipse cx="156" cy="164" rx="12" ry="15" fill="#fff" stroke="#14202a" stroke-width="2.5"/><circle cx="106" cy="166" r="8" fill="#2f78d0"/><circle cx="154" cy="166" r="8" fill="#2f78d0"/><circle cx="106" cy="166" r="3.6" fill="#0b1c33"/><circle cx="154" cy="166" r="3.6" fill="#0b1c33"/><circle cx="103" cy="162" r="2.2" fill="#fff"/><circle cx="151" cy="162" r="2.2" fill="#fff"/><path d="M88 146Q104 138 118 146M142 146Q156 138 172 146" stroke="#8a5f12" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M120 194Q130 200 140 194" stroke="#8a4b3a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M70 252Q76 214 130 212Q184 214 190 252Z" fill="#3f9a2f" stroke="#164a1c" stroke-width="3"/><path d="M100 214L130 244L160 214" fill="none" stroke="#f1e3b0" stroke-width="5"/><path d="M130 22l9 15h-18z" fill="#f2cb42" stroke="#8a6a00" stroke-width="1.5"/>');
  const doomArt = svg('دكتور دوم', '<circle cx="130" cy="130" r="108" fill="#0c1a10"/><path d="M130 14Q38 44 28 252H232Q222 44 130 14Z" fill="#2f8a43" stroke="#0f3a1c" stroke-width="3.5" stroke-linejoin="round"/><path d="M130 14Q70 50 66 150Q64 210 52 252M130 14Q190 50 194 150Q196 210 208 252" fill="none" stroke="#1d6a30" stroke-width="5"/><path d="M130 44Q70 66 74 138Q80 200 130 214Q180 200 186 138Q190 66 130 44Z" fill="#071108"/><path d="M130 54Q84 70 88 132Q94 188 130 202Q166 188 172 132Q176 70 130 54Z" fill="#aab2b8" stroke="#3f464b" stroke-width="3"/><path d="M130 54Q170 74 170 120Q150 90 130 96Q110 90 90 120Q90 74 130 54Z" fill="#d4dade" opacity=".7"/><path d="M96 112L124 120L118 132L96 126ZM164 112L136 120L142 132L164 126Z" fill="#0a0d0e"/><path d="M130 124v34l-8 6h16z" fill="#7d868c" stroke="#3f464b" stroke-width="2"/><path d="M112 178h36M114 186h32M118 194h24" stroke="#3f464b" stroke-width="3" stroke-linecap="round"/><circle cx="96" cy="150" r="3" fill="#6b747a"/><circle cx="164" cy="150" r="3" fill="#6b747a"/><path d="M60 236Q130 206 200 236L204 254H56Z" fill="#1d6a30"/><circle cx="76" cy="236" r="15" fill="#e0b13c" stroke="#7a5b0a" stroke-width="3"/><circle cx="184" cy="236" r="15" fill="#e0b13c" stroke="#7a5b0a" stroke-width="3"/><path d="M76 236Q130 252 184 236" fill="none" stroke="#e0b13c" stroke-width="3" stroke-dasharray="5 4"/>');
  const imgArt = (file, name) => `<img class="owl" src="assets/mascots/${file}.webp" alt="${name}" draggable="false" decoding="async">`;
  const art = {doom: imgArt('doom', 'دكتور دوم'), cat: catArt, bot: botArt, doraemon: imgArt('doraemon', 'دورايمون'), mickey: imgArt('mickey', 'ميكي'), anbu: imgArt('anbu', 'أنبو'), uchiha: imgArt('uchiha', 'أوتشيها'), zelda: imgArt('zelda', 'لينك')};
  // جمل الشخصية لما تتلمس (كل سكن له كلامه)
  const lines = {
    hikma: ['أهلاً! أنا بومة حكمة. تعالى نقرأ قصة.', 'القراءة كل يوم بتخلّيك أذكى.', 'اختار قصة وأنا أقرأها معاك.'],
    cat: ['ميو! جاهز لرحلة فضائية في القصص؟', 'اختار قصة ونطير بيها للنجوم.'],
    bot: ['بيب بوب! أنا الروبوت الودود. جاهز أقرأ معاك.', 'جهازي كله شغال. اختار قصة.'],
    doraemon: ['أهلاً يا صاحبي! جيبت لك جيب سحري مليان قصص.', 'اختار قصة وهنسافر بيها في أي مكان.'],
    mickey: ['هاي! يلا نبدأ القراءة ونضحك مع بعض.', 'القصة دي هتعجبك، جرّبها.'],
    anbu: ['في صمت وتركيز. جاهز للمهمة؟ المهمة هي القراءة.', 'أي مهمة تبدأ بصفحة واحدة.'],
    uchiha: ['التركيز هو سر القوة. اقرأ بتركيز.', 'كل قصة تدريب جديد لعقلك.'],
    zelda: ['هاي! أنا لينك. جاهز لمغامرة جديدة؟', 'كل قصة هي رحلة في هايرول. يلا نبدأ.'],
    doom: ['أنا دكتور دوم. القراءة هي أقوى سلاح.', 'اختار قصة. لا أحد يقرأ مثلي.']
  };
  // خلفيات الزخرفة لكل سكن
  const patterns = {
    cat: 'radial-gradient(#ffffff66 1.5px,transparent 2px) 0 0/34px 34px',
    bot: 'linear-gradient(#2f506322 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,#2f506322 1px,transparent 1px) 0 0/28px 28px',
    doraemon: 'radial-gradient(#1e88e522 2px,transparent 3px) 0 0/30px 30px',
    mickey: 'radial-gradient(#c8102e1f 8px,transparent 9px) 0 0/48px 48px',
    anbu: 'repeating-linear-gradient(135deg,#3a3f4f12 0 2px,transparent 2px 22px)',
    uchiha: 'radial-gradient(#e5393522 3px,transparent 4px) 0 0/36px 36px',
    doom: 'radial-gradient(#2f6b3a22 3px,transparent 4px) 0 0/34px 34px',
    zelda: 'linear-gradient(60deg,#e6c05022 1px,transparent 1px) 0 0/40px 70px,linear-gradient(120deg,#e6c05022 1px,transparent 1px) 0 0/40px 70px'
  };
  window.HikmaSkins = {skins, palettes, catArt, botArt, patterns, art, lines};
})();
