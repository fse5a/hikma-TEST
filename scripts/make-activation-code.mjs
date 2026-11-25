// بيعمل كود تفعيل عشوائي ويطبع أمر SQL لإضافته (الهاش بس). شغّله: node scripts/make-activation-code.mjs [عدد_الاستخدامات] [أيام_الصلاحية]
import {randomBytes} from 'node:crypto';
import {activationCodeHash} from '../backend/lib/activation.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const maxUses = Math.max(1, Number(process.argv[2]) || 1);
const days = Number(process.argv[3]) || 0;
const chars = Array.from(randomBytes(12), byte => alphabet[byte % alphabet.length]);
const code = `HKMA-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`;
const expires = days ? `now() + interval '${days} days'` : 'null';

console.log(`الكود (اديه للمستخدم، مش هيتخزن): ${code}\n`);
console.log('-- شغّل ده في Supabase SQL Editor:');
console.log(`insert into public.activation_codes (code_hash, max_uses, expires_at) values ('${activationCodeHash(code)}', ${maxUses}, ${expires});`);
