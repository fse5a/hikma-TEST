// ============================================================
// المحتوى: مكتبة التراث، قصص اختار نهايتك، مشاركة قصة برابط وQR، صور القصص، علامات وملاحظات الدراسة،
// واستقبال النصوص المشاركة من تطبيقات أخرى
// ============================================================
(() => {
  'use strict';
  const HX = window.HX, D = window.HXData, esc = HX.escapeHtml;

  // المكتبة الافتراضية: القصص الحقيقية بس. بنشيل قصتي التجربة القديمتين مرة واحدة، ونضيف القصص الحقيقية.
  (function seedRealStories() {
    if (state.settings.realStoriesV2) return;
    state.stories = state.stories.filter(s => s.id !== 'seed-2' && !(s.id === 'seed-1' && /الأرنب/.test(s.title)) && !['wor-twain-fence','wor-aesop-crow','wor-clason-purse','bk-little-prince'].includes(s.id));
    const real = D.heritage.filter(h => ['classic', 'myth', 'lore', 'books'].includes(h.group)).reverse();
    real.forEach(h => { if (!state.stories.some(s => s.id === h.id)) state.stories.unshift({id: h.id, title: h.title, text: h.text, lang: 'ar', translation: '', progress: 0, icon: h.icon, moral: h.moral, quiz: h.quiz}); });
    state.settings.realStoriesV2 = true;
    save();
    renderLibrary();
  })();

  // ---------- 8) مكتبة التراث ----------
  function openHeritage() {
    const groups = {kalila: 'كليلة ودمنة', juha: 'جحا', myth: 'أساطير (يونانية، إسكندنافية، مصرية)', lore: 'ألعاب وكرتون (ملخص بصياغتنا)', books: 'كتب وأدب (ملخصات بصياغتنا)', classic: 'حكايات ملك عام'};
    const html = Object.entries(groups).map(([g, name]) => `<h3 class="hx-h3">${name}</h3><ul class="hx-cards">${D.heritage.filter(h => h.group === g).map(h => {
      const has = state.stories.some(s => s.id === h.id);
      return `<li class="hx-card"><span class="hx-card-ico" aria-hidden="true">${h.icon}</span><div><strong>${esc(h.title)}</strong><span class="hx-muted">${h.text.split(/\s+/).length} كلمة · أسئلة وعبرة</span>${h.source ? `<span class="hx-muted">المصدر: ${esc(h.source)}</span>` : ''}</div><button class="button ${has ? 'secondary' : 'primary'}" data-hx-her="${h.id}" type="button" ${has ? 'disabled' : ''}>${has ? 'في مكتبتك ✔' : 'أضف'}</button></li>`;
    }).join('')}</ul>`).join('');
    HX.dialog('hxHeritage', 'مكتبة التراث', `<p class="voice-note" style="margin-top:0">حكايات وأساطير وملخصات بصياغتنا، كل واحدة معاها المصدر وأسئلة وعبرة.</p>${html}`, {wide: true});
    HX.open('hxHeritage');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hx-her]');
    if (!b) return;
    const h = D.heritage.find(x => x.id === b.dataset.hxHer);
    if (!h || state.stories.some(s => s.id === h.id)) return;
    HX.addStory({id: h.id, title: h.title, text: h.text, lang: 'ar', icon: h.icon, extra: {moral: h.moral, quiz: h.quiz}});
    b.disabled = true; b.textContent = 'في مكتبتك ✔'; b.className = 'button secondary';
    HX.toast('اتضافت «' + h.title + '»');
  });

  // ---------- 9) قصص اختار نهايتك ----------
  let br = null;
  function openBranching() {
    const p = HX.profile;
    p.endings = p.endings || [];
    HX.dialog('hxBranch', 'اختار نهايتك', `<ul class="hx-cards">${D.branching.map(s => {
      const total = Object.values(s.nodes).filter(n => n.end).length;
      const seen = p.endings.filter(k => k.startsWith(s.id + ':')).length;
      return `<li class="hx-card"><span class="hx-card-ico" aria-hidden="true">${s.icon}</span><div><strong>${esc(s.title)}</strong><span class="hx-muted">${seen} من ${total} نهايات</span></div><button class="button primary" data-hx-branch="${s.id}" type="button">ابدأ</button></li>`;
    }).join('')}</ul>`);
    HX.open('hxBranch');
  }
  function renderBranch() {
    const s = br.story, node = s.nodes[br.at];
    const choices = node.end ? `<div class="hx-moral"><strong>🏁 النهاية</strong></div><div class="hx-row"><button class="button secondary" data-hx-branch="${s.id}" type="button">🔁 ابدأ من جديد</button><button class="button primary" id="hxBranchList" type="button">قصص تانية</button></div>` : `<div class="hx-options" role="group" aria-label="اختار">${node.choices.map(c => `<button class="hx-option" data-hx-pick="${c.to}" type="button">${esc(c.t)}</button>`).join('')}</div>`;
    HX.dialog('hxBranch', s.title, `<p class="hx-branch-text" id="hxBranchText" dir="rtl">${esc(node.text)}</p><div class="hx-row"><button class="button secondary" id="hxBranchSay" type="button">🔊 اسمع</button></div>${choices}`);
    document.getElementById('hxBranchText').focus?.();
    if (HX.prefs.announce) HX.announce(node.text);
  }
  document.addEventListener('click', e => {
    const start = e.target.closest('[data-hx-branch]');
    if (start) { br = {story: D.branching.find(s => s.id === start.dataset.hxBranch)}; br.at = br.story.start; renderBranch(); return; }
    const pick = e.target.closest('[data-hx-pick]');
    if (pick && br) {
      br.at = pick.dataset.hxPick;
      const node = br.story.nodes[br.at];
      if (node.end) {
        const p = HX.profile; p.endings = p.endings || [];
        const key = br.story.id + ':' + br.at;
        if (!p.endings.includes(key)) { p.endings.push(key); HX.award(1, 'ending'); HX.save(); }
      }
      renderBranch(); return;
    }
    if (e.target.closest('#hxBranchSay') && br) { HX.say(br.story.nodes[br.at].text, 'ar'); return; }
    if (e.target.closest('#hxBranchList')) openBranching();
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-close="hxBranch"]')) { try { speechSynthesis.cancel(); } catch {} } });

  // ---------- 23 + 25) رابط مشاركة القصة وكود QR ----------
  const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  async function pipe(bytes, stream) {
    const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
    return new Uint8Array(await res.arrayBuffer());
  }
  async function encodeStory(s) {
    const raw = new TextEncoder().encode(JSON.stringify({t: s.title, x: s.text, l: s.lang, m: s.moral || undefined, i: s.icon || undefined}));
    const out = window.CompressionStream ? await pipe(raw, new CompressionStream('deflate-raw')) : raw;
    return (window.CompressionStream ? 'z' : 'r') + b64(out);
  }
  async function decodeStory(code) {
    const kind = code[0], bytes = unb64(code.slice(1));
    const raw = kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    const o = JSON.parse(new TextDecoder().decode(raw));
    if (typeof o.t !== 'string' || typeof o.x !== 'string' || o.x.length > 20000) throw new Error('bad');
    return {title: o.t.slice(0, 90), text: o.x, lang: o.l === 'en' ? 'en' : 'ar', moral: typeof o.m === 'string' ? o.m.slice(0, 140) : '', icon: typeof o.i === 'string' ? o.i.slice(0, 4) : '📖'};
  }
  HX.encodeStory = encodeStory; HX.decodeStory = decodeStory;
  const baseUrl = () => location.origin + location.pathname;
  function qrSvg(text) {
    if (!window.qrcode) return '';
    const q = qrcode(0, 'L'); q.addData(text); q.make();
    const n = q.getModuleCount(), cell = 4, size = (n + 8) * cell;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${(c + 4) * cell} ${(r + 4) * cell}h${cell}v${cell}h-${cell}z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="رمز QR للقصة" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  HX.qrSvg = qrSvg;
  async function openShare(s) {
    if (!s) return;
    const code = await encodeStory(s), link = `${baseUrl()}#s=${code}`;
    let qr = '', note = '';
    try { if (link.length <= 2300) qr = qrSvg(link); else note = 'القصة طويلة على كود QR واحد. استخدم الرابط، أو قسّمها لقصتين.'; } catch { note = 'القصة طويلة على كود QR واحد. استخدم الرابط.'; }
    HX.dialog('hxShare', 'شارك القصة', `<p class="voice-note" style="margin-top:0">الرابط بيحتوي على القصة نفسها، فمفيش حاجة بتترفع لأي سيرفر. أي حد يفتحه هيقدر يضيفها لمكتبته.</p>${qr ? `<figure class="hx-qr" id="hxQrFig">${qr}<figcaption>${esc(s.title)}</figcaption></figure>` : `<p class="hx-muted">${note}</p>`}<div class="hx-row"><button class="button primary" id="hxCopyLink" type="button">📋 انسخ الرابط</button>${navigator.share ? '<button class="button secondary" id="hxNativeShare" type="button">📤 مشاركة</button>' : ''}${qr ? '<button class="button secondary" id="hxQrDownload" type="button">⬇️ نزّل الكود</button><button class="button secondary" id="hxQrPrint" type="button">🖨️ اطبع</button>' : ''}</div><textarea class="hx-link" id="hxLinkBox" readonly rows="3" aria-label="رابط القصة">${esc(link)}</textarea>`);
    HX.open('hxShare');
  }
  document.addEventListener('click', async e => {
    const box = document.getElementById('hxLinkBox');
    if (e.target.closest('#hxCopyLink')) { try { await navigator.clipboard.writeText(box.value); HX.toast('اتنسخ الرابط'); } catch { box.select(); document.execCommand('copy'); HX.toast('اتنسخ الرابط'); } }
    else if (e.target.closest('#hxNativeShare')) { navigator.share({title: 'قصة من حكمة', url: box.value}).catch(() => {}); }
    else if (e.target.closest('#hxQrDownload')) {
      const svg = document.querySelector('#hxQrFig svg').outerHTML, img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 720; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 720, 720); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 720, 720); c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'hikma-story-qr.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } else if (e.target.closest('#hxQrPrint')) {
      const w = window.open('', '_blank'); if (!w) { HX.toast('اسمح بالنوافذ المنبثقة للطباعة'); return; }
      w.document.write(`<title>QR</title><body style="text-align:center;font-family:sans-serif"><div style="width:320px;margin:30px auto">${document.getElementById('hxQrFig').innerHTML}</div></body>`); w.document.close(); w.focus(); w.print();
    }
  });
  HX.addReaderTool({id: 'share', icon: '🔗', label: 'رابط وQR', order: 40, onClick: openShare});

  // استقبال رابط مشاركة (#s=...) أو نص مشارك من تطبيق آخر
  async function importFromLocation() {
    if (location.hash.startsWith('#s=')) {
      const code = location.hash.slice(3);
      history.replaceState(null, '', location.pathname + location.search);
      try {
        const o = await decodeStory(code);
        HX.dialog('hxImport', 'قصة مشاركة', `<h3>${esc(o.title)}</h3><p class="hx-muted">${esc(o.text.slice(0, 160))}…</p><div class="modal-actions"><button class="button primary" id="hxImportYes" type="button">أضفها لمكتبتي</button><button class="button secondary" data-close="hxImport" type="button">لا، شكرًا</button></div>`);
        HX.open('hxImport');
        document.getElementById('hxImportYes').addEventListener('click', () => { HX.addStory({title: o.title, text: o.text, lang: o.lang, icon: o.icon, extra: o.moral ? {moral: o.moral} : {}}); HX.close('hxImport'); HX.toast('اتضافت القصة'); });
      } catch { HX.toast('رابط القصة مش صالح'); }
      return;
    }
    const q = new URLSearchParams(location.search);
    const text = [q.get('text'), q.get('url')].filter(Boolean).join('\n').trim();
    if (text) {
      history.replaceState(null, '', location.pathname);
      document.getElementById('storyTitle').value = (q.get('title') || '').slice(0, 90);
      document.getElementById('storyText').value = text;
      HX.open('addOverlay');
      HX.toast('النص المشارك جاهز. اضغط حفظ لإضافته.');
    }
  }
  window.addEventListener('hashchange', importFromLocation);
  // زر «لصق من الحافظة» في نافذة إضافة قصة
  const addBody = document.querySelector('#addOverlay .dialog-body');
  if (addBody && navigator.clipboard?.readText) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'button secondary'; b.id = 'hxPaste'; b.textContent = '📋 الصق من الحافظة';
    b.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t.trim()) { document.getElementById('storyText').value = t.trim(); HX.toast('اتلصق النص'); } } catch { HX.toast('المتصفح منع قراءة الحافظة. الصق يدويًا.'); } });
    addBody.insertAdjacentElement('afterbegin', b);
  }

  // ---------- 7) صورة للقصة (من الجهاز، مع وصف لقارئ الشاشة) ----------
  const art = () => HX.X.art || (HX.X.art = {});
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.72);
    } finally { URL.revokeObjectURL(url); }
  }
  function openArt(s) {
    if (!s) return;
    const a = art()[s.id];
    HX.dialog('hxArt', 'صورة القصة', `<div class="hx-field"><label for="hxArtFile">اختار صورة أو ارسم/صوّر</label><input id="hxArtFile" type="file" accept="image/*"></div>${a ? `<img class="hx-art-prev" src="${a.src}" alt="${esc(a.alt || '')}">` : '<p class="hx-muted">مفيش صورة للقصة دي لسه.</p>'}<div class="hx-field"><label for="hxArtAlt">وصف الصورة (لقارئ الشاشة)</label><input id="hxArtAlt" class="hx-dlg-input" maxlength="140" placeholder="مثلًا: بومة على غصن شجرة" value="${esc(a?.alt || '')}"></div><div class="modal-actions"><button class="button primary" id="hxArtSave" type="button">حفظ الوصف</button>${a ? '<button class="button secondary" id="hxArtDel" type="button">حذف الصورة</button>' : ''}</div><p class="voice-note">الصورة بتتحفظ على جهازك بس.</p>`);
    HX.open('hxArt');
  }
  document.addEventListener('change', async e => {
    if (e.target.id !== 'hxArtFile' || !e.target.files[0]) return;
    const s = window.hikmaReader?.story; if (!s) return;
    try { art()[s.id] = {src: await shrink(e.target.files[0]), alt: art()[s.id]?.alt || ''}; HX.save(); openArt(s); renderArtInReader(); } catch { HX.toast('الصورة دي مش مدعومة'); }
  });
  document.addEventListener('click', e => {
    const s = window.hikmaReader?.story;
    if (e.target.closest('#hxArtSave') && s && art()[s.id]) { art()[s.id].alt = document.getElementById('hxArtAlt').value.trim(); HX.save(); renderArtInReader(); HX.toast('اتحفظ الوصف'); }
    if (e.target.closest('#hxArtDel') && s) { delete art()[s.id]; HX.save(); openArt(s); renderArtInReader(); }
  });
  function renderArtInReader() {
    const main = document.querySelector('#readerContent .reader-main'), s = window.hikmaReader?.story;
    if (!main || !s) return;
    main.querySelector('.hx-art')?.remove();
    const a = art()[s.id];
    if (!a) return;
    const fig = document.createElement('figure');
    fig.className = 'hx-art';
    fig.innerHTML = `<img src="${a.src}" alt="${esc(a.alt || '')}">`;
    (main.querySelector('.reader-details') || main.firstChild).insertAdjacentElement('afterend', fig);
  }
  HX.on('barmounted', renderArtInReader);
  HX.addReaderTool({id: 'art', icon: '🖼️', label: 'صورة', order: 41, onClick: openArt});

  // ---------- علامات وملاحظات للدراسة ----------
  const marks = s => s.marks || (s.marks = []);
  function openNotes(s) {
    if (!s) return;
    const list = marks(s);
    const r = window.hikmaReader;
    const cur = HX.lines()[r.index] || '';
    const rows = list.map((m, i) => `<li class="hx-note"><q>${esc(m.t)}</q><label class="sr-only" for="hxN${i}">ملاحظتك</label><input id="hxN${i}" class="hx-dlg-input" data-hx-note="${i}" value="${esc(m.n || '')}" placeholder="اكتب ملاحظتك" maxlength="200"><button class="icon-button" data-hx-note-del="${i}" aria-label="احذف العلامة" type="button">🗑</button></li>`).join('');
    HX.dialog('hxNotes', 'علاماتي وملاحظاتي', `<div class="hx-row"><button class="button primary" id="hxMarkAdd" type="button" ${cur ? '' : 'disabled'}>📌 علّم الجملة الحالية</button></div><p class="voice-note" style="margin-top:0">الجملة الحالية: ${esc(cur.slice(0, 80))}</p>${list.length ? `<ul class="hx-list hx-notes">${rows}</ul><div class="hx-row"><button class="button secondary" id="hxNotesCopy" type="button">📋 انسخ الكل</button><button class="button secondary" id="hxNotesDl" type="button">⬇️ نزّل كملف</button></div>` : '<p class="hx-muted">مفيش علامات. علّم الجمل المهمة وهتلاقيها هنا، وتقدر تنسخها لمذكراتك.</p>'}`, {wide: true});
    HX.open('hxNotes');
  }
  const notesText = s => `${s.title}\n\n` + marks(s).map((m, i) => `${i + 1}. ${m.t}${m.n ? `\n   ملاحظة: ${m.n}` : ''}`).join('\n\n');
  document.addEventListener('click', async e => {
    const s = window.hikmaReader?.story; if (!s) return;
    if (e.target.closest('#hxMarkAdd')) { const t = HX.lines()[window.hikmaReader.index]; if (t && !marks(s).some(m => m.t === t)) { marks(s).push({t, n: ''}); save(); } openNotes(s); }
    const del = e.target.closest('[data-hx-note-del]');
    if (del) { marks(s).splice(Number(del.dataset.hxNoteDel), 1); save(); openNotes(s); }
    if (e.target.closest('#hxNotesCopy')) { try { await navigator.clipboard.writeText(notesText(s)); HX.toast('اتنسخت الملاحظات'); } catch { HX.toast('تعذر النسخ'); } }
    if (e.target.closest('#hxNotesDl')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([notesText(s)], {type: 'text/plain;charset=utf-8'})); a.download = 'hikma-notes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  });
  document.addEventListener('input', e => { const i = e.target.dataset?.hxNote; const s = window.hikmaReader?.story; if (i !== undefined && s) { marks(s)[Number(i)].n = e.target.value; save(); } });
  HX.addReaderTool({id: 'notes', icon: '📌', label: 'علامات', order: 15, onClick: openNotes});

  // ---------- تسجيل في قائمة حكمة+ ----------
  HX.features.push({id: 'heritage', icon: '🏺', name: 'مكتبة التراث', sub: 'كليلة ودمنة وجحا وأساطير وكتب', order: 10, open: openHeritage});
  HX.features.push({id: 'branch', icon: '🔀', name: 'اختار نهايتك', sub: 'قصص تفاعلية', order: 11, open: openBranching});
  importFromLocation();
})();
