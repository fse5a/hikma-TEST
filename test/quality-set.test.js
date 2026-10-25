import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('speech quality set contains twenty non-empty cases per language', async () => {
  const cases = JSON.parse(await readFile(new URL('../test-sentences.json', import.meta.url), 'utf8'));
  assert.equal(cases.en.length, 20);
  assert.equal(cases.ar.length, 20);
  assert.ok([...cases.en, ...cases.ar].every(sentence => typeof sentence === 'string' && sentence.trim().length > 0));
});