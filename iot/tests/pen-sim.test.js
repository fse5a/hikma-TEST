import test from 'node:test';
import assert from 'node:assert/strict';
import {makeScanEvent, validateEvent} from '../simulator/events.mjs';
import {parseArgs, run} from '../simulator/pen-sim.mjs';

test('scan event from the simulator is valid and has the documented fields', () => {
  const event = makeScanEvent({seq: 2, lang: 'en'});
  assert.deepEqual(validateEvent(event), []);
  assert.equal(event.type, 'pen.scan');
  assert.equal(event.source, 'simulator');
  assert.equal(event.seq, 2);
});

test('validateEvent rejects bad events', () => {
  assert.ok(validateEvent({}).length > 0);
  assert.ok(validateEvent({...makeScanEvent(), text: ''}).some(error => error.includes('text')));
  assert.ok(validateEvent({...makeScanEvent(), lang: 'xx'}).some(error => error.includes('lang')));
  assert.ok(validateEvent({...makeScanEvent(), confidence: 3}).some(error => error.includes('confidence')));
});

test('run sends numbered events to the post url', async () => {
  const posted = [];
  const fetchImpl = async (url, options) => { posted.push({url, body: JSON.parse(options.body)}); return {status: 200}; };
  const options = parseArgs(['--count', '3', '--interval', '0', '--post', 'http://localhost:1/pen']);
  const events = await run(options, {log: () => {}, fetchImpl});
  assert.equal(events.length, 3);
  assert.deepEqual(posted.map(item => item.body.seq), [1, 2, 3]);
  assert.equal(posted[0].url, 'http://localhost:1/pen');
});
