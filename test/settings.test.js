import test from 'node:test';
import assert from 'node:assert/strict';
import '../settings.js';

const settings = globalThis.HikmaSettings;

test('new speech settings use the shared defaults and required bounds', () => {
  assert.equal(settings.defaults.rate, 1);
  assert.equal(settings.defaults.pitch, 0);
  assert.equal(settings.clampRate(0.25), 0.5);
  assert.equal(settings.clampRate(2.5), 2);
  assert.equal(settings.clampPitch(-9), -6);
  assert.equal(settings.clampPitch(9), 6);
});

test('legacy saved rate is retained and pitch ratio migrates to semitones', () => {
  const migrated = settings.normalize({rate: 0.92, pitch: 0.98});
  assert.equal(migrated.rate, 0.92);
  assert.ok(Math.abs(migrated.pitch - 12 * Math.log2(0.98)) < 1e-10);
  assert.equal(migrated.schemaVersion, 1);
});

test('out-of-range saved values are clamped during normalization', () => {
  const normalized = settings.normalize({schemaVersion: 1, rate: 9, pitch: -12});
  assert.equal(normalized.rate, 2);
  assert.equal(normalized.pitch, -6);
});