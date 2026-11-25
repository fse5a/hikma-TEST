// ============================================================
// أكواد التفعيل: تنضيف الكود وعمل الهاش (SHA-256). الكود نفسه مش بيتخزّن في الداتابيز.
// ============================================================
import {createHash} from 'node:crypto';

// بينضّف الكود (حروف كبيرة وأرقام بس) ويرجّع الهاش، أو null لو الشكل غلط
export function activationCodeHash(input) {
  const clean = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 8 || clean.length > 32) return null;
  return createHash('sha256').update(clean).digest('hex');
}
