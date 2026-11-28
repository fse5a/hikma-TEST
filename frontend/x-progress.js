// ============================================================
// التقدم: هدف يومي، تحدي الأسبوع، حديقة حكمة، شهادة إنجاز، تقرير أسبوعي، حد وقت يومي (برقم الأهل)، قصة اليوم
// ============================================================
(() => {
  'use strict';
  const HX = window.HX, esc = HX.escapeHtml;
  const minutesToday = () => Math.floor(HX.secondsToday() / 60);
  const weekSum = (fn) => HX.weekDays().reduce((a, d) => a + fn(d), 0);
  const storiesOn = d => HX.finishedOn(d).length;

  // ---------- 18) هدف يومي ----------
  function goalProgress() {
    const g = HX.profile.goal;
    const val = g.type === 'minutes' ? minutesToday() : storiesOn(HX.today());
    return {val, target: g.target, done: val >= g.target, pct: Math.min(100, Math.round(val / g.target * 100)), unit: g.type === 'minutes' ? 'دقيقة' : 'قصة'};
  }
  function ring(pct, label) {
    const r = 42, c = 2 * Math.PI * r;
    return `<svg class="hx-ring" viewBox="0 0 100 100" role="img" aria-label="${esc(label)}"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--green)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="var(--ink)">${pct}%</text></svg>`;
  }
  function checkGoal() {
    const g = goalProgress(), p = HX.profile, day = HX.today();
    if (g.done && p.goalDay !== day) { p.goalDay = day; HX.award(2, 'goal'); HX.badge('goal', 'حققت هدف اليوم'); HX.toast('🎯 حققت هدف النهاردة! +2 نجمة'); HX.save(); }
  }
  HX.on('finished', checkGoal); HX.on('tick', () => { if (HX.profile.goal.type === 'minutes') checkGoal(); });

  // ---------- 19) تحدي الأسبوع ----------
  const CHALLENGES = [
    {id: 'c-stories', name: 'اقرأ ٥ قصص هذا الأسبوع', target: 5, val: () => weekSum(storiesOn)},
    {id: 'c-days', name: 'اقرأ في ٤ أيام مختلفة', target: 4, val: () => HX.weekDays().filter(d => storiesOn(d) > 0 || (HX.profile.seconds[d] || 0) > 60).length},
    {id: 'c-minutes', name: 'اقرأ ٣٠ دقيقة هذا الأسبوع', target: 30, val: () => Math.floor(weekSum(d => HX.profile.seconds[d] || 0) / 60)},
    {id: 'c-words', name: 'احفظ ٥ كلمات جديدة', target: 5, val: () => Math.min(5, HX.profile.cards.length)},
    {id: 'c-quiz', name: 'جاوب على أسئلة ٣ قصص', target: 3, val: () => Math.min(3, HX.profile.quizzes || 0)}
  ];
  const weekIndex = () => Math.floor(HX.weekStart().getTime() / 604800000);
  const challenge = () => CHALLENGES[weekIndex() % CHALLENGES.length];
  function challengeState() {
    const c = challenge(), v = c.val();
    return {c, v: Math.min(v, c.target), done: v >= c.target};
  }
  function checkChallenge() {
    const s = challengeState(), key = HX.today(HX.weekStart());
    if (s.done && HX.profile.weekly[key] !== true) { HX.profile.weekly[key] = true; HX.award(3, 'weekly'); HX.badge('week-' + key, 'تحدي الأسبوع'); HX.save(); }
  }
  HX.on('finished', checkChallenge);

  // ---------- 17) حديقة حكمة ----------
  const FLOWERS = ['#e8728a', '#f2b632', '#8b6cd8', '#4aa3df', '#f08a4b', '#5fbf7a'];
  function gardenSvg() {
    const plants = HX.profile.plants.slice(-24);
    const cols = 6, w = 330, h = 40 + Math.ceil(Math.max(1, plants.length) / cols) * 70;
    const items = plants.map((pl, i) => {
      const x = 30 + (i % cols) * 54, y = h - 22 - Math.floor(i / cols) * 66, col = FLOWERS[pl.kind % 6], sz = 9 + (i % 3) * 2;
      if (pl.kind % 6 === 5) return `<g><rect x="${x - 2}" y="${y - 30}" width="4" height="30" fill="#6b4a2b"/><circle cx="${x}" cy="${y - 36}" r="16" fill="#3f9b57"/><circle cx="${x - 9}" cy="${y - 28}" r="10" fill="#4aa86a"/></g>`;
      return `<g><path d="M${x} ${y} V${y - 28}" stroke="#3f9b57" stroke-width="3"/><circle cx="${x}" cy="${y - 32}" r="${sz}" fill="${col}"/><circle cx="${x}" cy="${y - 32}" r="${sz / 3}" fill="#fff6c9"/></g>`;
    }).join('');
    return `<svg class="hx-garden" viewBox="0 0 ${w} ${h}" role="img" aria-label="حديقة فيها ${HX.profile.plants.length} نبتة"><rect width="${w}" height="${h}" rx="18" fill="color-mix(in srgb, var(--mint) 80%, #cfeecf)"/><rect y="${h - 16}" width="${w}" height="16" fill="#79b46a" opacity=".6"/>${items}</svg>`;
  }

  // ---------- 20) شهادة إنجاز ----------
  async function makeCertificate() {
    const p = HX.profile;
    if (p.name === 'أنا') { const n = (prompt('اكتب الاسم اللي هيظهر على الشهادة') || '').trim().slice(0, 24); if (n) { p.name = n; HX.save(); HX.refreshHub(); } }
    const c = document.createElement('canvas');
    c.width = 1400; c.height = 990;
    const g = c.getContext('2d'), cs = getComputedStyle(document.documentElement);
    const col = n => cs.getPropertyValue(n).trim() || '#c99a3f';
    try { await document.fonts.load('800 60px Tajawal'); await document.fonts.load('400 30px Tajawal'); } catch {}
    g.fillStyle = col('--surface') || '#fffdf6'; g.fillRect(0, 0, 1400, 990);
    g.strokeStyle = col('--green'); g.lineWidth = 14; g.strokeRect(36, 36, 1328, 918);
    g.lineWidth = 3; g.strokeRect(62, 62, 1276, 866);
    g.direction = 'rtl'; g.textAlign = 'center';
    g.fillStyle = col('--ink') || '#152238';
    g.font = '800 78px Tajawal, Cairo, sans-serif'; g.fillText('شهادة إنجاز في القراءة', 700, 230);
    g.font = '400 38px Tajawal, Cairo, sans-serif'; g.fillStyle = col('--muted') || '#555'; g.fillText('تُمنح هذه الشهادة إلى', 700, 340);
    g.fillStyle = col('--green-dark') || col('--green'); g.font = '800 120px Tajawal, Cairo, sans-serif'; g.fillText(p.name, 700, 490);
    g.fillStyle = col('--ink'); g.font = '400 44px Tajawal, Cairo, sans-serif';
    g.fillText(`لإتمام قراءة ${p.finished.length} قصة، وجمع ${p.stars} نجمة`, 700, 600);
    g.fillText(`وقراءة ${HX.streak()} يوم متتالي`, 700, 670);
    g.font = '400 32px Tajawal, Cairo, sans-serif'; g.fillStyle = col('--muted') || '#555';
    g.fillText(new Date().toLocaleDateString('ar-EG', {year: 'numeric', month: 'long', day: 'numeric'}), 700, 810);
    g.font = '800 40px Tajawal, Cairo, sans-serif'; g.fillStyle = col('--green-dark') || col('--green'); g.fillText('حِكمة · نقرأها سوا', 700, 880);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }
  async function certificate(action) {
    const blob = await makeCertificate();
    if (action === 'share' && navigator.canShare?.({files: [new File([blob], 'hikma-certificate.png', {type: 'image/png'})]})) {
      try { await navigator.share({files: [new File([blob], 'hikma-certificate.png', {type: 'image/png'})], title: 'شهادة حكمة'}); return; } catch { return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hikma-certificate.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  HX.makeCertificate = makeCertificate;

  // ---------- نافذة الإنجازات ----------
  function openProgress() {
    const p = HX.profile, g = goalProgress(), ch = challengeState();
    HX.dialog('hxProgress', 'إنجازاتي', `
      <div class="hx-stats"><div><strong>${p.stars}</strong><span>نجمة</span></div><div><strong>${HX.streak()}</strong><span>يوم متتالي</span></div><div><strong>${p.finished.length}</strong><span>قصة</span></div></div>
      <section class="hx-sec"><h3>🎯 هدف النهاردة</h3><div class="hx-goal">${ring(g.pct, `تقدم الهدف ${g.pct} في المية`)}<div><p><strong>${g.val} من ${g.target} ${g.unit}</strong></p><div class="hx-row start"><label class="sr-only" for="hxGoalType">نوع الهدف</label><select id="hxGoalType"><option value="stories">قصص</option><option value="minutes">دقائق</option></select><label class="sr-only" for="hxGoalN">العدد</label><input id="hxGoalN" type="number" min="1" max="120" value="${p.goal.target}" class="hx-num"></div></div></div></section>
      <section class="hx-sec"><h3>🏆 تحدي الأسبوع</h3><p>${esc(ch.c.name)}</p><div class="hx-bar-track" role="progressbar" aria-label="تقدم تحدي الأسبوع" aria-valuemin="0" aria-valuemax="${ch.c.target}" aria-valuenow="${ch.v}"><span style="width:${Math.round(ch.v / ch.c.target * 100)}%"></span></div><p class="hx-muted">${ch.v} من ${ch.c.target}${ch.done ? ' ✅ خلصت التحدي!' : ''}</p></section>
      <section class="hx-sec"><h3>🌱 حديقة حكمة</h3>${gardenSvg()}<p class="hx-muted">كل قصة بتخلّصها بتزرع نبتة جديدة.</p></section>
      <section class="hx-sec"><h3>🏅 الشارات</h3>${p.badges.length ? `<ul class="hx-badges">${p.badges.map(b => `<li>🏅 ${esc(b.title)}</li>`).join('')}</ul>` : '<p class="hx-muted">لسه مفيش شارات. كمّل قراءة!</p>'}</section>
      <div class="hx-row"><button class="button primary" id="hxCertDl" type="button">🎓 نزّل شهادة إنجاز</button>${navigator.canShare ? '<button class="button secondary" id="hxCertShare" type="button">📤 شاركها</button>' : ''}</div>`, {wide: true});
    document.getElementById('hxGoalType').value = p.goal.type;
    HX.open('hxProgress');
  }
  document.addEventListener('change', e => {
    if (e.target.id === 'hxGoalType') { HX.profile.goal.type = e.target.value; HX.profile.goal.target = e.target.value === 'minutes' ? 10 : 1; HX.save(); openProgress(); }
    if (e.target.id === 'hxGoalN') { HX.profile.goal.target = Math.max(1, Math.min(120, Number(e.target.value) || 1)); HX.save(); openProgress(); }
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#hxCertDl')) certificate('download');
    if (e.target.closest('#hxCertShare')) certificate('share');
  });
  HX.features.push({id: 'progress', icon: '🌟', name: 'إنجازاتي', sub: 'هدف يومي، تحدي، حديقة', order: 30, open: openProgress});

  // ---------- 22) تقرير أسبوعي ----------
  function reportData() {
    const p = HX.profile, days = HX.weekDays();
    return {
      name: p.name,
      from: days[0], to: days[6],
      stories: weekSum(storiesOn),
      minutes: Math.floor(weekSum(d => p.seconds[d] || 0) / 60),
      daysRead: days.filter(d => storiesOn(d) > 0 || (p.seconds[d] || 0) > 60).length,
      words: p.cards.length,
      titles: [...new Set(days.flatMap(d => HX.finishedOn(d).map(f => f.title)))],
      stars: p.stars, streak: HX.streak(),
      perDay: days.map(d => ({d, n: storiesOn(d), m: Math.floor((p.seconds[d] || 0) / 60)}))
    };
  }
  const reportText = r => `تقرير حكمة الأسبوعي لـ ${r.name}\n${r.from} إلى ${r.to}\n\n- قصص اتقرأت: ${r.stars >= 0 ? r.stories : 0}\n- دقائق قراءة: ${r.minutes}\n- أيام قراءة: ${r.daysRead} من 7\n- كلمات محفوظة: ${r.words}\n- أيام متتالية: ${r.streak}\n${r.titles.length ? '\nالقصص:\n' + r.titles.map(t => '• ' + t).join('\n') : ''}`;
  function openReport() {
    const r = reportData(), max = Math.max(1, ...r.perDay.map(x => x.m));
    const names = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    HX.dialog('hxReport', 'التقرير الأسبوعي', `<div class="hx-report" id="hxReportBody"><h3>${esc(r.name)} · الأسبوع ${esc(r.from)} ← ${esc(r.to)}</h3><div class="hx-stats"><div><strong>${r.stories}</strong><span>قصة</span></div><div><strong>${r.minutes}</strong><span>دقيقة</span></div><div><strong>${r.daysRead}/7</strong><span>أيام قراءة</span></div></div><div class="hx-days" role="img" aria-label="دقائق القراءة في كل يوم">${r.perDay.map((x, i) => `<div><span class="hx-day-bar" style="height:${Math.max(4, Math.round(x.m / max * 70))}px"></span><small>${names[i]}</small><small>${x.m}د</small></div>`).join('')}</div>${r.titles.length ? `<h4>القصص</h4><ul class="hx-list">${r.titles.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="hx-muted">مفيش قصص مكتملة الأسبوع ده لسه.</p>'}</div><div class="hx-row"><button class="button primary" id="hxRepCopy" type="button">📋 انسخ التقرير</button><button class="button secondary" id="hxRepPrint" type="button">🖨️ اطبع</button></div><p class="voice-note">التقرير من بيانات جهازك بس، ومبيتبعتش لأي مكان.</p>`, {wide: true});
    HX.open('hxReport');
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('#hxRepCopy')) { try { await navigator.clipboard.writeText(reportText(reportData())); HX.toast('اتنسخ التقرير'); } catch { HX.toast('تعذر النسخ'); } }
    if (e.target.closest('#hxRepPrint')) { const w = window.open('', '_blank'); if (!w) { HX.toast('اسمح بالنوافذ المنبثقة'); return; } w.document.write(`<meta charset="utf-8"><title>تقرير حكمة</title><body dir="rtl" style="font-family:sans-serif;padding:24px;white-space:pre-wrap">${esc(reportText(reportData()))}</body>`); w.document.close(); w.print(); }
  });

  // ---------- 24) حد وقت يومي (برقم الأهل) ----------
  const limit = () => HX.prefs.dailyLimit || 0;
  let locked = false;
  function openLimit() {
    HX.dialog('hxLimit', 'حد الوقت اليومي', `<p class="voice-note" style="margin-top:0">لما الوقت يخلص، القراءة بتقف لحد ما حد من الأهل يكتب الرقم السري. التغيير هنا محتاج رقم الأهل لو متفعّل.</p><div class="hx-field"><label for="hxLimitSel">الحد اليومي</label><select id="hxLimitSel"><option value="0">من غير حد</option><option value="15">١٥ دقيقة</option><option value="30">٣٠ دقيقة</option><option value="45">٤٥ دقيقة</option><option value="60">ساعة</option></select></div><p class="hx-muted">قرأت النهاردة ${minutesToday()} دقيقة.</p>`);
    document.getElementById('hxLimitSel').value = String(limit());
    HX.open('hxLimit');
  }
  document.addEventListener('change', async e => {
    if (e.target.id !== 'hxLimitSel') return;
    const ok = window.hikmaAskParentPin ? await window.hikmaAskParentPin() : true;
    if (!ok) { e.target.value = String(limit()); return; }
    HX.prefs.dailyLimit = Number(e.target.value); HX.save(); HX.toast(limit() ? `الحد اليومي ${limit()} دقيقة` : 'اتلغى الحد اليومي');
  });
  HX.on('tick', async () => {
    if (!limit() || locked || HX.secondsToday() / 60 < limit() + (HX.prefs.extraMin?.[HX.today()] || 0)) return;
    locked = true;
    window.hikmaReader?.stop?.(); try { window.HikmaSpeak.stop(); } catch {}
    HX.ambient?.stop();
    HX.dialog('hxTimeUp', 'وقت الراحة 🌙', `<div class="hx-result"><div class="hx-big" aria-hidden="true">🌙</div><h3>خلص وقت القراءة النهاردة</h3><p>خد استراحة، وبكرة نكمل.</p><div class="modal-actions"><button class="button primary" id="hxTimeOk" type="button">تمام</button><button class="button secondary" id="hxTimeMore" type="button">زيادة وقت (الأهل)</button></div></div>`);
    HX.open('hxTimeUp');
  });
  document.addEventListener('click', async e => {
    if (e.target.closest('#hxTimeOk')) { HX.close('hxTimeUp'); HX.close('readerOverlay'); locked = false; HX.prefs.lockedUntilNextTick = true; }
    if (e.target.closest('#hxTimeMore')) {
      const ok = window.hikmaAskParentPin ? await window.hikmaAskParentPin() : true;
      if (!ok) return;
      HX.prefs.extraMin = HX.prefs.extraMin || {}; HX.prefs.extraMin[HX.today()] = (HX.prefs.extraMin[HX.today()] || 0) + 15; HX.save(); locked = false; HX.close('hxTimeUp'); HX.toast('اتزوّد ١٥ دقيقة');
    }
  });
  // لو الحد خلص ولسه فاتح قصة جديدة، منمنعش القراءة بدون ما نبيّن السبب
  document.addEventListener('click', e => {
    if (!limit() || !e.target.closest('[data-open]')) return;
    if (HX.secondsToday() / 60 >= limit() + (HX.prefs.extraMin?.[HX.today()] || 0)) { e.stopImmediatePropagation(); e.preventDefault(); locked = false; HX.emit('tick'); }
  }, true);

  // ---------- 30) قصة اليوم (بدون إشعارات خارجية) ----------
  function storyOfDay() {
    const list = state.stories;
    if (!list.length) return null;
    const n = Math.floor(new Date().setHours(12, 0, 0, 0) / 86400000);
    return list[n % list.length];
  }
  function dailyCard() {
    const s = storyOfDay(), welcome = document.querySelector('.welcome');
    if (!s || !welcome) return;
    let card = document.getElementById('hxDaily');
    if (!card) { card = document.createElement('section'); card.id = 'hxDaily'; card.className = 'hx-daily'; welcome.insertAdjacentElement('afterend', card); }
    const read = HX.finishedOn(HX.today()).some(f => f.id === s.id);
    card.innerHTML = `<span class="hx-daily-ico" aria-hidden="true">${esc(s.icon || '📖')}</span><div><strong>قصة النهاردة</strong><span>${esc(s.title)}${read ? ' ✔' : ''}</span></div><button class="button primary" data-open="${esc(s.id)}" type="button">${read ? 'اقراها تاني' : 'ابدأ القراءة'}</button>`;
  }
  dailyCard();
  HX.on('finished', dailyCard); HX.on('profile', dailyCard);
  new MutationObserver(dailyCard).observe(document.getElementById('library') || document.body, {childList: true});

  HX.features.push({id: 'report', icon: '📊', name: 'تقرير أسبوعي', sub: 'قراءة الأسبوع', order: 31, open: openReport});
  HX.features.push({id: 'limit', icon: '⏳', name: 'حد الوقت', sub: 'برقم الأهل', order: 32, open: openLimit});
})();
