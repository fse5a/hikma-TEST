// ============================================================
// دفعة كبار السن: كلها على الجهاز ومجانية وبتشتغل على أي نص:
//  أذكار الصباح والمساء - القرآن بقارئ تختاره - الزر الكبير - قراءة الجداول والأرقام بالترتيب
//  - بياناتي (رقم البيت والعنوان) - ذكريات العيلة الصوتية - الجديد في الموقع
// ============================================================
(() => {
  'use strict';
  const HX = window.HX; if (!HX) return;
  const esc = HX.escapeHtml;
  const KEY = 'hikma-elder-v1';
  const prefs = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } })();
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {} };
  const speak = t => { try { HX.say(t, 'ar'); } catch {} };
  const religious = () => !!prefs.religious;
  HX.religiousOn = religious;
  const feat = (id, icon, name, sub, order, open, hidden) => HX.features.push({id, icon, name, sub, order, open, hidden});
  // القسم الديني (أذكار وقرآن) مقفول افتراضيًا، ويتفعّل من الإعدادات بس
  function mountToggle() {
    const body = document.querySelector('#settingsOverlay .dialog-body');
    if (!body || document.getElementById('hxReligiousOn')) return;
    const f = document.createElement('div'); f.className = 'field';
    f.innerHTML = `<label><input type="checkbox" id="hxReligiousOn" style="width:24px;height:24px;min-height:0;vertical-align:middle;margin-inline-end:8px"${religious() ? " checked" : ""}> إظهار القسم الديني (أذكار وقرآن)</label><p class="voice-note">مقفول من الأول. لما تفتحه بيظهر في قايمة حكمة+. الصوت تسجيلات بشرية حقيقية.</p>`;
    body.insertBefore(f, body.querySelector('#testVoice') || null);
  }
  document.addEventListener('change', e => { if (e.target.id === 'hxReligiousOn') { prefs.religious = e.target.checked; store(); HX.toast(prefs.religious ? 'اتفعّل القسم الديني' : 'اتقفل القسم الديني'); HX.emit('religious', {on: prefs.religious}); } });
  document.addEventListener('click', e => { if (e.target.closest('[data-open="settingsOverlay"], #settingsButton, [data-open=settings]')) setTimeout(mountToggle, 50); });
  new MutationObserver(mountToggle).observe(document.body, {childList: true, subtree: true});
  mountToggle();

  // ---------- أذكار الصباح والمساء ----------
  const ADHKAR = {
    morning: ['أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.', 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.', 'سبحان الله وبحمده، مئة مرة.', 'أعوذ بكلمات الله التامات من شر ما خلق، ثلاث مرات.', 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم، ثلاث مرات.'],
    evening: ['أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.', 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.', 'سبحان الله وبحمده، مئة مرة.', 'أعوذ بكلمات الله التامات من شر ما خلق، ثلاث مرات.', 'اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري.']
  };
  // تسجيلات حقيقية بصوت بشري (الشيخ مشاري العفاسي) من archive.org/details/AZKAR_MICHARY. مفيش صوت مولّد أبدًا للأذكار.
  const ADH_AUDIO = {morning: 'https://archive.org/download/AZKAR_MICHARY/sabah_for_mobile_64kb.mp3', evening: 'https://archive.org/download/AZKAR_MICHARY/masaa_for_mobile_64kb.mp3'};
  HX.adhkarAudio = ADH_AUDIO;
  const part = () => (new Date().getHours() < 15 ? 'morning' : 'evening');
  function openAdhkar(which = part()) {
    if (!religious()) return;
    const list = ADHKAR[which];
    HX.dialog('hxAdhkar', which === 'morning' ? 'أذكار الصباح' : 'أذكار المساء', `<div class="hx-row"><button class="button${which === 'morning' ? ' primary' : ''}" data-hx-adh="morning" type="button">الصباح</button><button class="button${which === 'evening' ? ' primary' : ''}" data-hx-adh="evening" type="button">المساء</button></div><ol class="hx-list" style="font-size:1.25em;line-height:2">${list.map(t => `<li>${esc(t)}</li>`).join('')}</ol><p class="hx-muted">الصوت تسجيل حقيقي بصوت الشيخ مشاري العفاسي (مش صوت كمبيوتر)، من أرشيف الإنترنت، ومحتاج نت.</p><audio controls preload="none" id="hxAdhAudio" src="${ADH_AUDIO[which]}" style="width:100%"></audio>`);
    HX.open('hxAdhkar');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-hx-adh]'); if (b) openAdhkar(b.dataset.hxAdh);
  });
  HX.adhkar = ADHKAR;
  feat('adhkar', '🤲', 'أذكار الصباح والمساء', 'تسجيل حقيقي', 50, () => openAdhkar(), () => !religious());

  // ---------- القرآن بقارئ تختاره (صوت من everyayah، محتاج نت) ----------
  const REC = [['Alafasy_128kbps', 'مشاري العفاسي'], ['Husary_128kbps', 'محمود خليل الحصري'], ['Minshawy_Murattal_128kbps', 'محمد صديق المنشاوي'], ['Abdul_Basit_Murattal_192kbps', 'عبد الباسط عبد الصمد']];
  const SURAHS = [[1, 'الفاتحة', 7], [112, 'الإخلاص', 4], [113, 'الفلق', 5], [114, 'الناس', 6], [108, 'الكوثر', 3], [110, 'النصر', 3], [103, 'العصر', 3], [109, 'الكافرون', 6], [105, 'الفيل', 5], [106, 'قريش', 4], [107, 'الماعون', 7], [102, 'التكاثر', 8]];
  HX.quranUrl = (rec, s, a) => `https://everyayah.com/data/${rec}/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;
  let qAudio = null;
  function openQuran() {
    if (!religious()) return;
    const rec = prefs.reciter || REC[0][0];
    HX.dialog('hxQuran', 'القرآن الكريم', `<label class="hx-muted" for="hxQRec">القارئ</label><select id="hxQRec">${REC.map(r => `<option value="${r[0]}"${r[0] === rec ? ' selected' : ''}>${r[1]}</option>`).join('')}</select><div class="hx-row" style="flex-wrap:wrap;margin-top:10px">${SURAHS.map(s => `<button class="button" data-hx-sura="${s[0]}" type="button">${s[1]}</button>`).join('')}</div><p class="hx-muted" id="hxQMsg" role="status">الصوت تلاوة حقيقية بصوت القارئ نفسه (مش صوت كمبيوتر ولا ذكاء اصطناعي). محتاج نت.</p><div class="modal-actions"><button class="button" id="hxQStop" type="button">⏹ وقّف</button></div>`);
    HX.open('hxQuran');
  }
  function playSura(n) {
    const s = SURAHS.find(x => x[0] === n); if (!s) return;
    const rec = document.getElementById('hxQRec')?.value || REC[0][0]; prefs.reciter = rec; store();
    let a = 1; const msg = document.getElementById('hxQMsg');
    if (qAudio) qAudio.pause();
    qAudio = new Audio(); qAudio.volume = HX.volumeCap ? HX.volumeCap() : 1;
    const next = () => { if (a > s[2]) { if (msg) msg.textContent = 'خلصت سورة ' + s[1]; return; } qAudio.src = HX.quranUrl(rec, n, a); if (msg) msg.textContent = `سورة ${s[1]}، آية ${a} من ${s[2]}`; qAudio.play().catch(() => { if (msg) msg.textContent = 'مقدرتش أشغّل الصوت. اتأكد من النت.'; }); a++; };
    qAudio.onended = next; qAudio.onerror = () => { if (msg) msg.textContent = 'مقدرتش أشغّل الصوت. اتأكد من النت.'; };
    next();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-hx-sura]'); if (b) playSura(+b.dataset.hxSura);
    if (e.target.closest('#hxQStop') && qAudio) qAudio.pause();
  });
  feat('quran', '📖', 'القرآن الكريم', 'اختار القارئ', 51, openQuran, () => !religious());

  // ---------- الزر الكبير ----------
  function openBig() {
    HX.dialog('hxBig', 'الزر الكبير', `<div style="display:grid;gap:14px"><button class="button primary" id="hxBigRead" type="button" style="font-size:1.6em;padding:28px">🔊 اقرأ لي</button><button class="button" id="hxBigTime" type="button" style="font-size:1.6em;padding:28px">🕒 الساعة كام؟</button>${religious() ? '<button class="button" id="hxBigAdh" type="button" style="font-size:1.6em;padding:28px">🤲 أذكار</button>' : ''}</div>`);
    HX.open('hxBig');
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#hxBigRead')) { const l = HX.lines ? HX.lines() : []; speak(l.length ? l.join(' ') : 'افتح قصة الأول وأنا أقرأها لك.'); }
    if (e.target.closest('#hxBigTime')) speak(HX.timeText ? HX.timeText() : new Date().toLocaleTimeString('ar-EG'));
    if (e.target.closest('#hxBigAdh')) openAdhkar();
  });
  feat('big', '🔘', 'الزر الكبير', 'أزرار كبيرة وبسيطة', 52, openBig);

  // ---------- قراءة الجداول والأرقام بالترتيب ----------
  HX.tableToSpeech = text => {
    const rows = String(text || '').split(/\r?\n/).map(r => r.trim()).filter(Boolean).map(r => r.split(/\t|,|،|;|\|/).map(c => c.trim()));
    if (rows.length < 2) return rows.map(r => r.join('، ')).join('. ');
    const head = rows[0];
    return rows.slice(1).map((r, i) => `الصف ${i + 1}: ` + r.map((c, j) => `${head[j] || 'العمود ' + (j + 1)} ${c}`).join('، ')).join('. ');
  };
  function openTable() {
    HX.dialog('hxTable', 'اقرأ لي الجدول', `<p class="hx-muted">الصق الجدول (كل صف في سطر، والأعمدة بفاصلة أو مسافة تاب). السطر الأول هو العناوين.</p><textarea id="hxTblIn" rows="6" style="width:100%" placeholder="الاسم، السعر، الكمية"></textarea><p id="hxTblOut" class="hx-moral-text" role="status"></p><div class="modal-actions"><button class="button primary" id="hxTblGo" type="button">🔊 اقرأ</button></div>`);
    HX.open('hxTable');
  }
  document.addEventListener('click', e => { if (e.target.closest('#hxTblGo')) { const t = HX.tableToSpeech(document.getElementById('hxTblIn').value); document.getElementById('hxTblOut').textContent = t; if (t) speak(t); } });
  feat('table', '📊', 'قراءة الجداول والأرقام', 'بالترتيب وبصوت', 53, openTable);

  // ---------- بياناتي (رقم البيت والعنوان) ----------
  function openMine() {
    const m = prefs.mine || {};
    HX.dialog('hxMine', 'بياناتي', `<p class="hx-muted">بتتحفظ على جهازك بس. اضغط "قولها" وهي تتقال.</p><label for="hxMName">اسمي</label><input id="hxMName" value="${esc(m.name || '')}"><label for="hxMPhone">رقم البيت أو موبايلي</label><input id="hxMPhone" inputmode="tel" value="${esc(m.phone || '')}"><label for="hxMAddr">عنواني</label><input id="hxMAddr" value="${esc(m.addr || '')}"><div class="modal-actions"><button class="button" id="hxMSave" type="button">حفظ</button><button class="button primary" id="hxMSay" type="button">🔊 قولها</button></div>`);
    HX.open('hxMine');
  }
  const mineText = () => { const m = prefs.mine || {}; return [m.name && 'اسمي ' + m.name, m.phone && 'رقمي ' + String(m.phone).split('').join(' '), m.addr && 'عنواني ' + m.addr].filter(Boolean).join('. '); };
  HX.mineText = mineText;
  document.addEventListener('click', e => {
    if (e.target.closest('#hxMSave')) { prefs.mine = {name: hxMName.value.trim(), phone: hxMPhone.value.trim(), addr: hxMAddr.value.trim()}; store(); HX.toast('اتحفظت بياناتك'); }
    if (e.target.closest('#hxMSay')) { prefs.mine = {name: hxMName.value.trim(), phone: hxMPhone.value.trim(), addr: hxMAddr.value.trim()}; store(); speak(mineText() || 'لسه ما كتبتش بياناتك.'); }
  });
  feat('mine', '🏠', 'بياناتي', 'رقم البيت والعنوان', 54, openMine);

  // ---------- ذكريات العيلة الصوتية (IndexedDB، على الجهاز بس) ----------
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('hikma-memories', 1); r.onupgradeneeded = () => r.result.createObjectStore('m', {keyPath: 'id'}); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('m', mode); const out = fn(t.objectStore('m')); t.oncomplete = () => res(out.result); t.onerror = () => rej(t.error); }); };
  HX.memories = {all: () => tx('readonly', s => s.getAll()), put: m => tx('readwrite', s => s.put(m)), del: id => tx('readwrite', s => s.delete(id))};
  let mrec = null, mchunks = [];
  async function openMem() {
    const ok = !!(navigator.mediaDevices && window.MediaRecorder && window.indexedDB);
    let list = []; try { list = ok ? await HX.memories.all() : []; } catch {}
    HX.dialog('hxMem', 'ذكريات العيلة', ok ? `<p class="hx-muted">سجّل حكاية أو ذكرى بصوت حد من العيلة. بتفضل على الجهاز ومش بتتبعت لأي حد.</p><label for="hxMemName">اسم الذكرى (مثلًا: حدوتة جدو)</label><input id="hxMemName"><div class="modal-actions"><button class="button primary" id="hxMemGo" type="button">⏺ سجّل</button><button class="button" id="hxMemStop" type="button" disabled>⏹ وقّف واحفظ</button></div><p id="hxMemMsg" role="status" class="hx-muted"></p><ul class="hx-list">${list.map(m => `<li>${esc(m.name)} <button class="button" data-hx-mplay="${m.id}" type="button">▶</button> <button class="button" data-hx-mdel="${m.id}" type="button">🗑</button></li>`).join('') || '<li>لسه مفيش ذكريات.</li>'}</ul>` : '<p>الجهاز ده مش بيدعم التسجيل.</p>');
    HX.open('hxMem');
  }
  document.addEventListener('click', async e => {
    const msg = () => document.getElementById('hxMemMsg');
    if (e.target.closest('#hxMemGo')) {
      try {
        const st = await navigator.mediaDevices.getUserMedia({audio: true}); mchunks = []; mrec = new MediaRecorder(st);
        mrec.ondataavailable = ev => mchunks.push(ev.data);
        mrec.onstop = async () => { st.getTracks().forEach(t => t.stop()); const name = (document.getElementById('hxMemName')?.value || '').trim() || 'ذكرى ' + new Date().toLocaleDateString('ar-EG'); await HX.memories.put({id: 'm' + Date.now(), name, blob: new Blob(mchunks, {type: mrec.mimeType || 'audio/webm'})}); HX.toast('اتحفظت الذكرى'); openMem(); };
        mrec.start(); document.getElementById('hxMemGo').disabled = true; document.getElementById('hxMemStop').disabled = false; msg().textContent = 'بيسجّل...';
      } catch { if (msg()) msg().textContent = 'مقدرتش أفتح الميكروفون. اسمح للموقع باستخدامه.'; }
    }
    if (e.target.closest('#hxMemStop') && mrec && mrec.state !== 'inactive') mrec.stop();
    const p = e.target.closest('button[data-hx-mplay]'); if (p) { const m = (await HX.memories.all()).find(x => x.id === p.dataset.hxMplay); if (m) { const a = new Audio(URL.createObjectURL(m.blob)); a.volume = HX.volumeCap ? HX.volumeCap() : 1; a.play().catch(() => {}); } }
    const d = e.target.closest('button[data-hx-mdel]'); if (d) { await HX.memories.del(d.dataset.hxMdel); openMem(); }
  });
  feat('memories', '👵', 'ذكريات العيلة', 'حكايات بصوت العيلة', 55, openMem);

  // ---------- الجديد في الموقع ----------
  const NEWS = ['بومة حكمة الجديدة بتتحرك وبتغيّر تعبيرها', 'أذكار وقرآن وزر كبير لكبار السن', 'ملخص وعبرة لأي نص، وأصوات مؤثرات للقصة', 'قراءة بطيئة جدًا وتسجيل صوت الطفل', 'صوت مختلف لكل شخصية، وجو صوتي لكل مشهد'];
  HX.changelog = NEWS;
  feat('changelog', '🆕', 'الجديد في الموقع', 'آخر التحسينات', 58, () => { HX.dialog('hxNew', 'الجديد في الموقع', `<ul class="hx-list">${NEWS.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`); HX.open('hxNew'); });

  // ---------- اقتراح الأذكار حسب الوقت (لما يفتح الموقع، والقسم متفعّل) ----------
  HX.dhikrWindow = (h = new Date().getHours()) => (h >= 4 && h < 11 ? 'morning' : h >= 16 && h < 22 ? 'evening' : null);
  setTimeout(() => {
    if (!religious()) return;
    const w = HX.dhikrWindow(); if (!w) return;
    const key = HX.today() + '-' + w;
    if (prefs.lastPrompt === key) return;
    prefs.lastPrompt = key; store();
    HX.dialog('hxAdhPrompt', w === 'morning' ? 'صباح الخير' : 'مساء الخير', `<p class="hx-moral-text" role="status">${w === 'morning' ? 'اسمع أذكار الصباح بصوت حقيقي؟' : 'اسمع أذكار المساء بصوت حقيقي؟'}</p><div class="modal-actions"><button class="button primary" id="hxAdhPromptGo" data-w="${w}" type="button">افتحها</button><button class="button" id="hxAdhPromptNo" type="button" data-close="hxAdhPrompt">مش دلوقتي</button></div>`);
    HX.open('hxAdhPrompt');
  }, 3500);
  document.addEventListener('click', e => { const g = e.target.closest('#hxAdhPromptGo'); if (g) { HX.close('hxAdhPrompt'); openAdhkar(g.dataset.w); } });
})();
