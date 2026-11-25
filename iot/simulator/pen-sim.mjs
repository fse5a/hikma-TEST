#!/usr/bin/env node
// ============================================================
// محاكي القلم (سطر أوامر): بيطبع أحداث مسح مزيفة، وممكن يبعتها لرابط (--post).
// أمثلة:
//   node iot/simulator/pen-sim.mjs
//   node iot/simulator/pen-sim.mjs --count 5 --interval 1000 --lang en
//   node iot/simulator/pen-sim.mjs --text "جملة من عندي" --post http://localhost:4000/pen
// ============================================================
import {makeScanEvent, validateEvent, SAMPLE_LINES} from './events.mjs';

// بيقرا الخيارات من سطر الأوامر
export function parseArgs(argv) {
  const options = {count: 3, interval: 800, lang: 'ar', device: 'SIM-PEN-001'};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--count') { options.count = Math.max(1, Number(value) || 1); i += 1; }
    else if (key === '--interval') { options.interval = Math.max(0, Number(value) || 0); i += 1; }
    else if (key === '--lang') { options.lang = value; i += 1; }
    else if (key === '--text') { options.text = value; i += 1; }
    else if (key === '--device') { options.device = value; i += 1; }
    else if (key === '--post') { options.post = value; i += 1; }
    else if (key === '--help') options.help = true;
  }
  return options;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// بيشغّل المحاكي: بيعمل الأحداث ويطبعها (وبيبعتها لو فيه --post)
export async function run(options, {log = console.log, fetchImpl = globalThis.fetch} = {}) {
  const lines = SAMPLE_LINES.filter(line => line.lang === options.lang);
  const sent = [];
  for (let seq = 1; seq <= options.count; seq += 1) {
    const line = lines.length ? lines[(seq - 1) % lines.length] : SAMPLE_LINES[0];
    const event = makeScanEvent({deviceId: options.device, seq, lang: options.lang, text: options.text || line.text, battery: Math.max(5, 100 - seq)});
    const errors = validateEvent(event);
    if (errors.length) throw new Error(errors.join(' | '));
    log(JSON.stringify(event));
    if (options.post) {
      const response = await fetchImpl(options.post, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(event)});
      log(`-> ${response.status}`);
    }
    sent.push(event);
    if (seq < options.count) await sleep(options.interval);
  }
  return sent;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) console.log('الخيارات: --count N --interval ms --lang ar|en --text "..." --device ID --post URL');
  else run(options).catch(error => { console.error(error.message); process.exit(1); });
}
