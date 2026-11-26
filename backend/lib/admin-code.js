// ============================================================
// كود العرض (للأدمن): الكلمة ADMIN (اختيار صاحب العرض)، من غير حساسية لحالة الحروف.
// بيدخّل ويفتح كل السكنز بس. مفيش وصول لبيانات أي مستخدم. بيتفحص على السيرفر بالهاش.
// تنبيه: الكلمة سهلة التخمين، فالفحص بعد حد المحاولات، وبيفتح السكنز بس (مفيش بيانات).
// ============================================================
import {createHash} from 'node:crypto';

export const ADMIN_CODE_HASH = '835d6dc88b708bc646d6db82c853ef4182fabbd4a8de59c213f2b5ab3ae7d9be';

// بيرجّع true لو الكود هو كود العرض (أحرف وأرقام بس، من غير مسافات أو شرطات)
export function isAdminCode(input) {
  const clean = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean || clean.length > 32) return false;
  return createHash('sha256').update(clean).digest('hex') === ADMIN_CODE_HASH;
}
