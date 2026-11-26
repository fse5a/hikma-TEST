import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdminCode, ADMIN_CODE_HASH} from '../lib/admin-code.js';

test('admin code is stored only as a SHA-256 hash and rejects guessable values', () => {
  assert.match(ADMIN_CODE_HASH, /^[0-9a-f]{64}$/);
  for (const guess of ['admin', 'ADMIN', '1234', 'demo-1234', 'ADMN-AAAA-AAAA-AAAA-AAAA', '', null, undefined]) {
    assert.equal(isAdminCode(guess), false);
  }
});
