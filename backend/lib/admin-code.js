// ============================================================
// كود العرض (للأدمن): كود عشوائي طويل مخزّن كهاش SHA-256 بس (الكود نفسه مش في الكود).
// وظيفته الوحيدة: يدخّل صاحب العرض ويفتح كل السكنز. مفيش وصول لبيانات أي مستخدم.
// ============================================================
import {activationCodeHash} from './activation.js';

export const ADMIN_CODE_HASH = 'fff00060676852eb168d8d9e050772f156d89081e0580a43c074e8c3e836a95d';

// بيرجّع true لو الكود هو كود العرض
export function isAdminCode(input) {
  const hash = activationCodeHash(input);
  return Boolean(hash) && hash === ADMIN_CODE_HASH;
}
