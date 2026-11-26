import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdminCode, ADMIN_CODE_HASH} from '../lib/admin-code.js';

test('admin code is ADMIN (case-insensitive), stored as a hash, near-misses rejected', () => {
  assert.match(ADMIN_CODE_HASH, /^[0-9a-f]{64}$/);
  for (const guess of ['1234', 'demo-1234', 'ADMINN', 'ADMIN1', 'ADMN-AAAA-AAAA-AAAA-AAAA', '', null, undefined]) {
    assert.equal(isAdminCode(guess), false);
  }
  for (const ok of ['ADMIN', 'admin', 'Admin', ' admin ']) assert.equal(isAdminCode(ok), true);
});

test('admin code: every locked skin is unlocked by the gate logic', async () => {
  const {readFileSync} = await import('node:fs');
  const src = readFileSync(new URL('../../frontend/skins.js', import.meta.url), 'utf8');
  const lockedInSkins = [...src.matchAll(/^\s{4}(\w+): \{locked: true/gm)].map(m => m[1]).sort();
  const {SKIN_CODE_HASHES} = await import('../lib/skin-codes.js');
  const skinCodeTargets = Object.values(SKIN_CODE_HASHES).sort();
  assert.equal(lockedInSkins.length, 6);
  assert.deepEqual(lockedInSkins, skinCodeTargets, 'admin unlock list (all locked skins) equals every skin that has a code');
  // the client unlocks Object.keys(skins).filter(locked) when the server says admin:true
  assert.match(readFileSync(new URL('../../frontend/restored-features.js', import.meta.url), 'utf8'), /result\.admin\) settings\.unlockedSkins = Object\.keys\(skins\)\.filter\(k => skins\[k\]\.locked\)/);
});
