// ============================================================
// أكواد السكنز: كل كود بيفتح سكن واحد. المخزّن هنا هاش SHA-256 بس (الكود نفسه مش موجود في الكود ولا في الصفحة).
// الأكواد عشوائية وطويلة (حوالي 60 بت) فمينفعش تتخمّن من الهاش. لإضافة سكن: node scripts/make-skin-codes.mjs
// ============================================================
import {activationCodeHash} from './activation.js';

// الهاش وأي سكن بيفتحه
export const SKIN_CODE_HASHES = {
    '8fe56114fef42c87ddf3ef7055c581b3458a83fda57ac62f36a8b0d86d93fa07': 'doraemon',
    '5ad5562c973624066a3e3ec38595ade83d78dd3104dd9fe595021505f90ec38d': 'mickey',
    '1e639c8cd5d482af485582335cda9efc016b658011251d695b73d6970b240a24': 'anbu',
    '9d9f0cd06be0073f41752ab126e4fe7b9e3399ced98911bce8b0e0bb1387a17c': 'uchiha',
    '813a2e9dc83a2549fae2b365427aeb7bc8fb1b8b85ea502c7c88826d81ea7a2e': 'zelda',
};

// بيرجّع اسم السكن لو الكود صح، أو null لو غلط
export function skinForCode(input) {
  const hash = activationCodeHash(input);
  return (hash && SKIN_CODE_HASHES[hash]) || null;
}
