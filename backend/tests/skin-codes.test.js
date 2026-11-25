// اختبارات أكواد السكنز: الهاش بس هو المخزّن، والكود الغلط بيترفض، وكل سكن له هاش واحد.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SKIN_CODE_HASHES, skinForCode} from '../lib/skin-codes.js';
import {activationCodeHash} from '../lib/activation.js';

test('خمس سكنات لكل واحد كود مختلف', () => {
  assert.deepEqual(Object.values(SKIN_CODE_HASHES).sort(), ['anbu', 'doraemon', 'mickey', 'uchiha', 'zelda']);
});
test('الكود الغلط أو الفاضي أو القصير بيترفض', () => {
  for (const bad of ['', 'abc', 'DORA-0000-0000-0000', 'HKMA-XXXX-XXXX-XXXX', null, undefined]) assert.equal(skinForCode(bad), null);
});
test('الكود بيتطابق بالهاش وبغض النظر عن الحروف والشرطات', () => {
  const [hash] = Object.keys(SKIN_CODE_HASHES);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(activationCodeHash('ab-cd ef-gh12'), activationCodeHash('ABCDEFGH12'));
});
