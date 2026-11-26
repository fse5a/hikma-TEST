// ============================================================
// كود العرض (للأدمن): كود عشوائي قصير (8 حروف وأرقام، سهل في الكتابة) مخزّن كهاش SHA-256 بس (الكود نفسه مش في الكود).
// وظيفته الوحيدة: يدخّل صاحب العرض ويفتح كل السكنز. مفيش وصول لبيانات أي مستخدم.
// ============================================================
import {activationCodeHash} from './activation.js';

export const ADMIN_CODE_HASH = 'b9901e3b9f6e306d7d110b515e17500a14f7edd7507c0b35cadff9a41c04f578';

// بيرجّع true لو الكود هو كود العرض
export function isAdminCode(input) {
  const hash = activationCodeHash(input);
  return Boolean(hash) && hash === ADMIN_CODE_HASH;
}
