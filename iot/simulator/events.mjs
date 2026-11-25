// ============================================================
// محاكي القلم: بيعمل أحداث مسح مزيفة بنفس الشكل المتوقع من القلم الحقيقي (iot/PROTOCOL.md).
// ============================================================

export const SAMPLE_LINES = [
  {lang: 'ar', text: 'كان يا ما كان، في قديم الزمان، بومة حكيمة تسكن شجرة عالية.'},
  {lang: 'ar', text: 'القراءة كل يوم بتخلي الكلمات أسهل.'},
  {lang: 'en', text: 'The little owl opened the old book and began to read.'},
  {lang: 'en', text: 'Every page is a new adventure.'}
];

// بيعمل حدث مسح واحد. seq رقم متسلسل، والباقي اختياري
export function makeScanEvent({deviceId = 'SIM-PEN-001', seq = 1, lang = 'ar', text, confidence = 0.97, battery = 100, now = new Date()} = {}) {
  if (!text) text = SAMPLE_LINES.find(line => line.lang === lang)?.text || SAMPLE_LINES[0].text;
  return {
    version: 1,
    type: 'pen.scan',
    deviceId: String(deviceId),
    seq: Number(seq),
    ts: now.toISOString(),
    lang,
    text,
    confidence,
    battery,
    source: 'simulator'
  };
}

// بيتأكد إن الحدث شكله صح. بيرجّع قايمة أخطاء (فاضية = تمام)
export function validateEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object') return ['الحدث لازم يكون كائن JSON'];
  if (event.version !== 1) errors.push('version لازم يساوي 1');
  if (event.type !== 'pen.scan') errors.push('type لازم يساوي pen.scan');
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(String(event.deviceId || ''))) errors.push('deviceId غير صالح');
  if (!Number.isInteger(event.seq) || event.seq < 1) errors.push('seq لازم يكون رقم صحيح من 1 فما فوق');
  if (Number.isNaN(Date.parse(event.ts))) errors.push('ts لازم يكون وقت ISO');
  if (!['ar', 'en', 'fr', 'de', 'es', 'zh'].includes(event.lang)) errors.push('lang غير مدعوم');
  if (typeof event.text !== 'string' || !event.text.trim() || event.text.length > 2000) errors.push('text لازم يكون نص من 1 إلى 2000 حرف');
  if (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1) errors.push('confidence بين 0 و 1');
  return errors;
}
