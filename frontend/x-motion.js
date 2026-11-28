// حركات خفيفة مستوحاة من مواقع البورتفوليو: بومة بتتجمّع من نقط، عنوان كبير بيدخل ناعم،
// وانتقال ناعم بين الفاتح والداكن. كله بدون مكتبات، بيقف مع تقليل الحركة، وما بيأخرش القراءة.
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = () => root.dataset.reducedMotion === 'true' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const css = document.createElement('style');
  css.textContent = `
  html.hx-fade, html.hx-fade *, html.hx-fade *::before, html.hx-fade *::after { transition: background-color .5s ease, color .5s ease, border-color .5s ease, box-shadow .5s ease, fill .5s ease !important; }
  .welcome h1 { font-size: clamp(34px, 6.4vw, 64px); font-weight: 900; line-height: 1.12; letter-spacing: -0.01em; }
  .welcome-copy { max-width: 40rem; background: color-mix(in srgb, var(--surface) 78%, transparent); padding: 14px 20px; border-radius: 20px; backdrop-filter: blur(6px); }
  html:not([data-reduced-motion="true"]) .welcome h1 { animation: hx-rise .9s cubic-bezier(.2,.8,.2,1) both; }
  html:not([data-reduced-motion="true"]) .welcome p { animation: hx-rise .9s .18s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hx-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .welcome h1, .welcome p { animation: none !important; } }
  @media (max-width: 760px) { .welcome h1 { font-size: clamp(30px, 9vw, 44px); } }
  .hx-dots { position: absolute; pointer-events: none; z-index: 2; }
  .welcome .owl { transition: opacity .5s ease; }`;
  document.head.appendChild(css);

  // انتقال الثيم
  let t = 0;
  new MutationObserver(() => {
    if (reduced()) return;
    root.classList.add('hx-fade'); clearTimeout(t); t = setTimeout(() => root.classList.remove('hx-fade'), 650);
  }).observe(root, {attributes: true, attributeFilter: ['data-theme']});

  // بومة من نقط (مرة واحدة في الجلسة، وبس على الصورة الأصلية)
  function dots() {
    const img = document.querySelector('.welcome img.owl');
    if (!img || reduced() || sessionStorage.getItem('hx-dots') || !localStorage.getItem('hikma-dot-intro')) return; // المقدمة بالنقط متقفلة: كانت بتخلّي البومة تبان مكسورة
    if (!/mascots\/hikma|assets\/owl\//.test(img.getAttribute('src') || '')) return;
    const go = () => {
      const w = img.clientWidth, h = img.clientHeight; if (!w || !h) return;
      sessionStorage.setItem('hx-dots', '1');
      const R = Math.min(2, window.devicePixelRatio || 1);
      const off = document.createElement('canvas'); const S = 96; off.width = S; off.height = Math.round(S * h / w);
      const ox = off.getContext('2d', {willReadFrequently: true}); ox.drawImage(img, 0, 0, off.width, off.height);
      let data; try { data = ox.getImageData(0, 0, off.width, off.height).data; } catch { return; }
      const P = [];
      for (let y = 0; y < off.height; y += 2) for (let x = 0; x < off.width; x += 2) {
        const i = (y * off.width + x) * 4; if (data[i + 3] < 140) continue;
        P.push({tx: x / off.width * w, ty: y / off.height * h, x: Math.random() * w * 3 - w, y: Math.random() * h * 3 - h, c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, d: Math.random() * 0.35});
      }
      const cv = document.createElement('canvas'); cv.className = 'hx-dots'; cv.setAttribute('aria-hidden', 'true');
      const hr = img.getBoundingClientRect(), pr = img.offsetParent.getBoundingClientRect();
      Object.assign(cv.style, {left: (hr.left - pr.left) + 'px', top: (hr.top - pr.top) + 'px', width: w + 'px', height: h + 'px'});
      cv.width = w * R; cv.height = h * R; img.parentElement.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(R, R); img.style.opacity = '0';
      let mx = -999, my = -999;
      const mv = e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; };
      addEventListener('pointermove', mv, {passive: true});
      const T0 = performance.now(), DUR = 1700; let done = false;
      const end = () => { if (done) return; done = true; removeEventListener('pointermove', mv); img.style.opacity = ''; cv.style.transition = 'opacity .5s'; cv.style.opacity = '0'; setTimeout(() => cv.remove(), 600); };
      const frame = now => {
        if (done) return; const k = (now - T0) / DUR; if (k >= 1.15 || document.hidden) return end();
        g.clearRect(0, 0, w, h);
        for (const p of P) {
          const e = Math.min(1, Math.max(0, (k - p.d) / (1 - p.d))), q = 1 - Math.pow(1 - e, 3);
          let x = p.x + (p.tx - p.x) * q, y = p.y + (p.ty - p.y) * q;
          const dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
          if (dd < 2500 && dd > 0) { const f = (1 - Math.sqrt(dd) / 50) * 14; const L = Math.sqrt(dd); x += dx / L * f; y += dy / L * f; }
          g.fillStyle = p.c; g.beginPath(); g.arc(x, y, 1.9, 0, 6.3); g.fill();
        }
        if (k > 0.85) cv.style.opacity = '1'; requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame); setTimeout(end, 3500);
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, {once: true});
  }

  // البومة بتميل ناحية المؤشر (بس على الأجهزة اللي فيها ماوس)
  function follow() {
    if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    addEventListener('pointermove', e => {
      if (reduced() || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const img = document.querySelector('.welcome img.owl'); if (!img) return;
        const b = img.getBoundingClientRect(); if (!b.width) return;
        const dx = (e.clientX - (b.left + b.width / 2)) / innerWidth, dy = (e.clientY - (b.top + b.height / 2)) / innerHeight;
        img.style.rotate = (dx * 10).toFixed(2) + 'deg'; img.style.translate = (dx * 8).toFixed(1) + 'px ' + (dy * 5).toFixed(1) + 'px';
      });
    }, {passive: true});
  }
  const start = () => { try { dots(); } catch {} follow(); };
  if (document.readyState === 'complete') setTimeout(start, 200); else addEventListener('load', () => setTimeout(start, 200));
})();
