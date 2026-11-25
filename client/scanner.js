// Hikma scanner: QR codes (open a story/link) and book pages (photo -> text).
// Everything starts only from an explicit button tap; the camera stops on close.
(() => {
  const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let stream = null;
  let scanTimer = null;
  let tesseractLoading = null;
  let scannedPages = [];

  const $ = selector => document.querySelector(selector);

  function buildOverlay() {
    if ($('#scanOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'scanOverlay';
    overlay.innerHTML = `<section class="dialog narrow" role="dialog" aria-modal="true" aria-labelledby="scanTitle">
      <header class="dialog-head"><h2 id="scanTitle">مسح كتاب أو رمز QR</h2><button class="icon-button close" data-close="scanOverlay" aria-label="إغلاق">×</button></header>
      <div class="dialog-body">
        <video id="scanVideo" playsinline muted style="width:100%;border-radius:12px;background:#000;max-height:300px"></video>
        <p class="status" id="scanStatus" role="status"></p>
        <div class="modal-actions" style="flex-wrap:wrap">
          <button class="button primary" id="scanStart" type="button">تشغيل الكاميرا</button>
          <button class="button secondary" id="scanCapture" type="button" disabled>التقاط صفحة وقراءتها</button>
          <button class="button secondary" id="scanUndo" type="button" hidden>حذف آخر صفحة</button>
          <button class="button primary" id="scanFinish" type="button" hidden>إنهاء ومراجعة النص (0)</button>
          <button class="button secondary" type="button" data-close="scanOverlay">إلغاء</button>
        </div>
        <p class="voice-note">وجّه الكاميرا نحو رمز QR لفتح قصته، أو التقط صفحة كتاب لتحويلها إلى نص يُقرأ ويُترجم ويُحفظ في مكتبتك. الصور لا تغادر جهازك.</p>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    $('#scanStart').addEventListener('click', startCamera);
    $('#scanCapture').addEventListener('click', capturePage);
    $('#scanUndo').addEventListener('click', () => {
      scannedPages.pop();
      updatePageButtons();
      scanStatus(scannedPages.length ? `عندك ${scannedPages.length} صفحة محفوظة. التقط التالية أو اضغط إنهاء.` : 'وجّه الكاميرا نحو رمز QR أو صفحة كتاب.');
    });
    $('#scanFinish').addEventListener('click', finishScanning);
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('[data-close]')) { stopCamera(); resetPages(); }
    });
  }

  function buildButton() {
    const actions = document.querySelector('.top-actions');
    if (!actions || $('#scanOpen')) return;
    const button = document.createElement('button');
    button.className = 'button secondary';
    button.id = 'scanOpen';
    button.type = 'button';
    button.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.5h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.2" r="3.6"/></svg><span class="btn-label">مسح</span>';
    button.setAttribute('aria-label', 'مسح كتاب أو رمز QR');
    button.addEventListener('click', () => { buildOverlay(); openModal('scanOverlay'); scanStatus('اضغط تشغيل الكاميرا للبدء.'); });
    actions.insertBefore(button, actions.firstChild);
  }

  function scanStatus(message, isError = false) {
    const status = $('#scanStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      scanStatus('المتصفح لا يدعم الكاميرا هنا. أضف النص يدويًا من زر قصة جديدة.', true);
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false});
    } catch {
      scanStatus('تعذر فتح الكاميرا. اسمح للمتصفح باستخدامها ثم حاول مجددًا.', true);
      return;
    }
    const video = $('#scanVideo');
    video.srcObject = stream;
    await video.play().catch(() => {});
    $('#scanCapture').disabled = false;
    $('#scanStart').textContent = 'الكاميرا تعمل';
    scanStatus('وجّه الكاميرا نحو رمز QR أو صفحة كتاب.');
    startQrLoop();
  }

  function stopCamera() {
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    const video = $('#scanVideo');
    if (video) video.srcObject = null;
    const start = $('#scanStart');
    if (start) start.textContent = 'تشغيل الكاميرا';
    const capture = $('#scanCapture');
    if (capture) capture.disabled = true;
  }

  function startQrLoop() {
    if (!('BarcodeDetector' in window)) {
      scanStatus('مسح QR غير مدعوم في هذا المتصفح؛ يمكنك التقاط صفحة كتاب فقط.');
      return;
    }
    const detector = new BarcodeDetector({formats: ['qr_code']});
    const video = $('#scanVideo');
    scanTimer = setInterval(async () => {
      if (!stream || video.readyState < 2) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length) handleQr(codes[0].rawValue || '');
      } catch {}
    }, 700);
  }

  async function handleQr(value) {
    const text = String(value).trim();
    if (!text) return;
    clearInterval(scanTimer); scanTimer = null;
    const story = (state.stories || []).find(item => item.id === text);
    closeModal('scanOverlay');
    stopCamera();
    if (story) {
      document.querySelector(`[data-open="${story.id}"]`)?.click();
      return;
    }
    if (/^https?:\/\//i.test(text)) {
      scanStatus('');
      toast('تم قراءة الرمز؛ جارٍ جلب الصفحة...');
      try {
        const result = await HikmaApi.importUrl(text);
        const preview = result.preview || {};
        if (preview.text && preview.text.trim()) {
          openAddForm(preview.title || 'صفحة ممسوحة', preview.text.trim());
        } else {
          toast('لم يتمكن الخادم من استخراج النص؛ انسخه يدويًا من الصفحة.');
        }
      } catch (error) {
        toast(HikmaApi.toFriendlyMessage(error));
      }
      return;
    }
    toast('الرمز لا يشير إلى قصة أو رابط.');
  }

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    tesseractLoading ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TESSERACT_URL;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error('تعذر تحميل قارئ النص من الإنترنت.'));
      document.head.appendChild(script);
    });
    return tesseractLoading;
  }

  function updatePageButtons() {
    const count = scannedPages.length;
    const finish = $('#scanFinish');
    const undo = $('#scanUndo');
    if (finish) { finish.hidden = !count; finish.textContent = `إنهاء ومراجعة النص (${count})`; }
    if (undo) undo.hidden = !count;
  }

  function resetPages() {
    scannedPages = [];
    updatePageButtons();
  }

  function finishScanning() {
    if (!scannedPages.length) return;
    const text = scannedPages.join('\n\n');
    closeModal('scanOverlay');
    stopCamera();
    resetPages();
    openAddForm('', text);
  }

  async function capturePage() {
    const video = $('#scanVideo');
    if (!stream || !video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    scanStatus('جارٍ قراءة النص من الصفحة (قد يستغرق ثوانٍ)...');
    try {
      const Tesseract = await loadTesseract();
      const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'ara+eng');
      const text = String(result?.data?.text || '').replace(/\s+\n/g, '\n').trim();
      if (text.length < 10) {
        scanStatus('لم يُقرأ نص واضح. قرّب الكاميرا وحسّن الإضاءة ثم أعد الالتقاط.', true);
        return;
      }
      scannedPages.push(text);
      updatePageButtons();
      scanStatus(`أُضيفت الصفحة ${scannedPages.length}. التقط صفحة أخرى من نفس الكتاب، أو اضغط «إنهاء ومراجعة النص».`);
    } catch (error) {
      scanStatus(error.message || 'تعذرت قراءة الصفحة.', true);
    }
  }

  function buildAppendField() {
    if ($('#appendToStory')) return $('#appendToStory').closest('.field');
    const form = $('#storyForm');
    if (!form) return null;
    const field = document.createElement('div');
    field.className = 'field';
    field.hidden = true;
    field.innerHTML = '<label for="appendToStory">إضافة الصفحات إلى قصة موجودة (اختياري)</label><select id="appendToStory"><option value="">قصة جديدة</option></select>';
    form.insertBefore(field, form.firstChild);
    // opening the form for a brand-new story hides the append choice again
    $('#addOpen')?.addEventListener('click', () => { field.hidden = true; $('#appendToStory').value = ''; });
    return field;
  }

  function openAddForm(title, text) {
    buildOverlay();
    $('#storyTitle').value = title || '';
    $('#storyText').value = text || '';
    $('#storyTranslation').value = '';
    const field = buildAppendField();
    const select = $('#appendToStory');
    if (field && select) {
      select.innerHTML = '<option value="">قصة جديدة</option>' + (state.stories || [])
        .map(item => `<option value="${item.id}">${item.title || 'قصة بدون عنوان'}</option>`).join('');
      field.hidden = !(state.stories || []).length;
    }
    openModal('addOverlay');
    $('#formStatus').textContent = 'راجع النص الممسوح، ثم احفظه كقصة جديدة أو أضفه لقصة موجودة؛ بعدها يمكنك قراءته أو ترجمته.';
  }

  globalThis.HikmaScanner = {loadTesseract};

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton);
  } else {
    buildButton();
  }
})();
