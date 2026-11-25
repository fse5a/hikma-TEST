// بيعمل كود عشوائي لكل سكن ويطبع الأكواد (للمستخدم بس) وسطور الهاش اللي تتحط في backend/lib/skin-codes.js
// شغّله: node scripts/make-skin-codes.mjs
import {randomBytes} from 'node:crypto';
import {activationCodeHash} from '../backend/lib/activation.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const prefixes = {doraemon: 'DORA', mickey: 'MICK', anbu: 'ANBU', uchiha: 'UCHI', zelda: 'ZELD', doom: 'DOOM'};
for (const [skin, prefix] of Object.entries(prefixes)) {
  const chars = Array.from(randomBytes(12), byte => alphabet[byte % alphabet.length]);
  const code = `${prefix}-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8, 12).join('')}`;
  console.log(`CODE ${skin} ${code}`);
  console.log(`HASH   '${activationCodeHash(code)}': '${skin}',`);
}
