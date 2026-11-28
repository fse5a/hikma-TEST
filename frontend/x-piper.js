// ============================================================
// الصوت الاحتياطي الشغال بدون نت: Piper (صوت عربي واحد "كريم") بيشتغل جوه المتصفح.
// اختياري: المستخدم بينزّل النموذج مرة واحدة (حوالي ٦٣ ميجا) من الإعدادات، وبعدها يشتغل أوفلاين.
// الترتيب في الموقع: صوت السحابة الطبيعي، بعده Piper (لو نزّلته)، وآخر حل صوت الجهاز.
// ============================================================
(() => {
  const VOICE_ID = 'ar_JO-kareem-medium';
  const BASE = '/vendor/piper/';
  const FLAG = 'hikma-piper-ready';
  let lib = null, session = null, chain = Promise.resolve();

  function loadLib() {
    if (lib) return lib;
    lib = new Promise((resolve, reject) => {
      if (window.__piper) return resolve(window.__piper);
      const s = document.createElement('script');
      s.src = BASE + 'piper-bundle.js';
      s.onload = () => (window.__piper ? resolve(window.__piper) : reject(new Error('piper-missing')));
      s.onerror = () => { lib = null; reject(new Error('piper-load')); };
      document.head.appendChild(s);
    });
    return lib;
  }
  const paths = {onnxWasm: BASE, piperData: BASE + 'piper_phonemize.data', piperWasm: BASE + 'piper_phonemize.wasm'};
  async function getSession(progress) {
    if (session) return session;
    const P = await loadLib();
    session = P.TtsSession.create({voiceId: VOICE_ID, wasmPaths: paths, progress}).catch(e => { session = null; throw e; });
    return session;
  }
  const flagged = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };

  window.HikmaPiper = {
    voiceId: VOICE_ID,
    ready: () => flagged(),
    async download(onProgress) {
      await getSession(p => { try { onProgress?.(p.total ? Math.round(p.loaded * 100 / p.total) : 0); } catch {} });
      try { localStorage.setItem(FLAG, '1'); } catch {}
      return true;
    },
    async remove() {
      try { const P = await loadLib(); await P.remove(VOICE_ID); } catch {}
      session = null;
      try { localStorage.removeItem(FLAG); } catch {}
    },
    // نص قصير -> ملف صوت (واحد ورا التاني علشان الجهاز ما يتخنقش)
    synth(text) {
      const job = chain.then(async () => (await getSession()).predict(String(text)));
      chain = job.catch(() => {});
      return job;
    }
  };

  // ---- كتلة الإعدادات ----
  function mountSettings() {
    const body = document.querySelector('#settingsOverlay .dialog-body');
    if (!body || document.getElementById('piperBlock')) return;
    const box = document.createElement('div');
    box.className = 'field'; box.id = 'piperBlock';
    box.innerHTML = '<label>الصوت الاحتياطي بدون نت (اختياري)</label><p class="voice-note" id="piperState"></p><button class="button secondary" id="piperBtn" type="button"></button><p class="voice-note">صوت عربي واحد، جودته أقل من الصوت الطبيعي. بيشتغل لما النت يقطع. شغّال بمحرك Piper (رخصة MIT). بيانات تدريب صوت «كريم» رخصتها مش مؤكدة، فاستخدامه هنا تعليمي وبنذكر المصدر.</p>';
    body.append(box);
    const st = box.querySelector('#piperState'), btn = box.querySelector('#piperBtn');
    const paint = () => { const r = window.HikmaPiper.ready(); st.textContent = r ? 'جاهز. هيشتغل لما الصوت الطبيعي مش متاح.' : 'مش منزّل. التنزيل مرة واحدة حوالي ٦٣ ميجا.'; btn.textContent = r ? 'احذف الصوت الاحتياطي' : 'نزّل الصوت الاحتياطي'; btn.disabled = false; };
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      if (window.HikmaPiper.ready()) { await window.HikmaPiper.remove(); paint(); return; }
      st.textContent = 'بنزّل... 0%';
      try { await window.HikmaPiper.download(p => { st.textContent = `بنزّل... ${p}%`; }); paint(); }
      catch { st.textContent = 'التنزيل فشل. اتأكد من النت وجرّب تاني.'; btn.disabled = false; }
    });
    paint();
  }
  mountSettings();
  document.addEventListener('DOMContentLoaded', mountSettings);
})();
