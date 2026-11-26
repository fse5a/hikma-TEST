// ============================================================
// أكواد السكنز: كل كود بيفتح سكن واحد. المخزّن هنا هاش SHA-256 بس (الكود نفسه مش موجود في الكود ولا في الصفحة).
// الأكواد عشوائية وطويلة (حوالي 60 بت) فمينفعش تتخمّن من الهاش. لإضافة سكن: node scripts/make-skin-codes.mjs
// ============================================================
import {activationCodeHash} from './activation.js';

// الهاش وأي سكن بيفتحه
export const SKIN_CODE_HASHES = {
    'c723f4794b1dc2200f5abcd598c0ec90832b36338482d2a0dbc215d4c0901d2c': 'doraemon',
    '246cfc73a8a50684d7246c2ba79f9013bebcf2d3d874f2903793ee07ea78b6b5': 'mickey',
    '6e5fd5c8a4b5147b91d43a893355715e74ca0b02c8e18952962d02f0c391fee8': 'anbu',
    '6807201c60fcb133daca16a6e1fe4ef80f3813e1ec860728861a6df16330f592': 'uchiha',
    'd948b07a514a4f1b53aab02b7c07587b37507b419b7914d3eaf5c4202e6bdde1': 'zelda',
    'd9d99c9a8ce4b2cb1c7e5bd4d6dfb78434234b90a0bb0f28672c025ef695a64d': 'doom',
};

// بيرجّع اسم السكن لو الكود صح، أو null لو غلط
export function skinForCode(input) {
  const hash = activationCodeHash(input);
  return (hash && SKIN_CODE_HASHES[hash]) || null;
}
