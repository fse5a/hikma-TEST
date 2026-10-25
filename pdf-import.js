(() => {
  const MAX_BYTES = 50 * 1024 * 1024;
  const MAX_PAGES = 1000;
  let pdfModule;

  function codeLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const punctuation = (trimmed.match(/[{};<>()[\]=]/g) || []).length;
    return /^#include\b|^\/\/|^public:|^private:|\t/.test(trimmed) || punctuation >= Math.max(3, trimmed.length * 0.16);
  }

  function joinHyphenatedLines(lines) {
    const output = [];
    for (const line of lines) {
      if (output.length && /-$/.test(output[output.length - 1])) output[output.length - 1] = output[output.length - 1].slice(0, -1) + line.trimStart();
      else output.push(line);
    }
    return output;
  }

  function pageLines(items) {
    const positioned = items.filter(item => item.str?.trim()).map(item => ({
      text: String(item.str).replace(/\s+/g, ' ').trim(),
      y: Number(item.transform?.[5]) || 0,
      x: Number(item.transform?.[4]) || 0
    })).sort((left, right) => right.y - left.y || left.x - right.x);
    const lines = [];
    for (const item of positioned) {
      let line = lines.find(candidate => Math.abs(candidate.y - item.y) <= 3);
      if (!line) { line = {y: item.y, items: []}; lines.push(line); }
      line.items.push(item);
    }
    return lines.map(line => line.items.sort((left, right) => left.x - right.x).map(item => item.text).join(' ').replace(/\s+/g, ' ').trim()).filter(text => text && !/^\d{1,4}$/.test(text));
  }

  async function getChapterOutline(document) {
    const outline = await document.getOutline().catch(() => null);
    if (!outline) return [];
    const chapters = [];
    const visit = async (items, parentTitle = '') => {
      for (const item of items || []) {
        let page = 1;
        try {
          const destination = typeof item.dest === 'string' ? await document.getDestination(item.dest) : item.dest;
          if (destination?.[0]) page = (await document.getPageIndex(destination[0])) + 1;
        } catch {}
        const title = String(item.title || '').trim();
        if (title) chapters.push({title, page, parentTitle});
        await visit(item.items, title || parentTitle);
      }
    };
    await visit(outline);
    return chapters.sort((left, right) => left.page - right.page);
  }

  async function parse(file, {mode = 'prose', onProgress = () => {}} = {}) {
    if (!file || file.size < 8 || file.size > MAX_BYTES) throw new Error('اختر ملف PDF حجمه لا يتجاوز 50 ميغابايت.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('الملف لا يحتوي ترويسة PDF صالحة.');
    pdfModule ||= await import(new URL('vendor/pdf.min.mjs', document.baseURI).href);
    pdfModule.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf.worker.min.mjs', document.baseURI).href;
    const task = pdfModule.getDocument({data: bytes, isEvalSupported: false, enableXfa: false, useSystemFonts: false});
    const pdf = await task.promise;
    if (pdf.numPages > MAX_PAGES) { await task.destroy(); throw new Error('يتجاوز الكتاب حد 1000 صفحة.'); }
    const rawPages = [];
    const scannedPages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = pageLines(content.items || []);
      if (!lines.length) scannedPages.push(pageNumber);
      rawPages.push({pageNumber, lines});
      page.cleanup();
      onProgress({page: pageNumber, pages: pdf.numPages, percent: Math.round(pageNumber / pdf.numPages * 100)});
    }
    const headerCounts = new Map();
    const footerCounts = new Map();
    for (const page of rawPages) {
      if (page.lines[0]) headerCounts.set(page.lines[0], (headerCounts.get(page.lines[0]) || 0) + 1);
      if (page.lines.at(-1)) footerCounts.set(page.lines.at(-1), (footerCounts.get(page.lines.at(-1)) || 0) + 1);
    }
    const repetitionThreshold = Math.max(2, Math.ceil(pdf.numPages * 0.25));
    const repeatedHeaders = new Set([...headerCounts].filter(([, count]) => count >= repetitionThreshold).map(([text]) => text));
    const repeatedFooters = new Set([...footerCounts].filter(([, count]) => count >= repetitionThreshold).map(([text]) => text));
    const pages = rawPages.map(page => {
      let lines = page.lines.filter((line, index) => !(index === 0 && repeatedHeaders.has(line)) && !(index === page.lines.length - 1 && repeatedFooters.has(line)));
      lines = joinHyphenatedLines(lines);
      if (mode === 'prose') {
        let skippingCode = false;
        const prose = [];
        for (const line of lines) {
          if (codeLine(line)) {
            if (!skippingCode) prose.push('[code example skipped]');
            skippingCode = true;
          } else {
            skippingCode = false;
            prose.push(line);
          }
        }
        lines = prose;
      }
      return {...page, text: lines.join('\n')};
    });
    const outline = await getChapterOutline(pdf);
    const chapters = outline.length ? outline.map((item, index) => {
      const endPage = outline[index + 1]?.page || pdf.numPages + 1;
      const text = pages.filter(page => page.pageNumber >= item.page && page.pageNumber < endPage).map(page => page.text).filter(Boolean).join('\n\n');
      return {...item, text};
    }).filter(chapter => chapter.text.trim()) : [{title: file.name.replace(/\.pdf$/i, ''), page: 1, text: pages.map(page => page.text).filter(Boolean).join('\n\n')}];
    const metadata = await pdf.getMetadata().catch(() => null);
    const result = {title: String(metadata?.info?.Title || file.name.replace(/\.pdf$/i, '')).slice(0, 240), pages: pdf.numPages, chapters, scannedPages, needsOcr: scannedPages.length > 0, mode};
    await task.destroy();
    return result;
  }

  globalThis.HikmaPdf = {parse, maxBytes: MAX_BYTES, maxPages: MAX_PAGES};
})();