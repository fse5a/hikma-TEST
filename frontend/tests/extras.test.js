import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// بنحمّل ملف البيانات في بيئة بدون متصفح
async function loadData() {
  const code = await readFile(new URL('../x-data.js', import.meta.url), 'utf8');
  const sandbox = {window: {}};
  vm.runInNewContext(code, sandbox);
  return sandbox.window.HXData;
}

test('quizzes have valid answer indexes and 2-4 options', async () => {
  const D = await loadData();
  const all = [...Object.values(D.seedExtras), ...D.heritage];
  for (const item of all) {
    assert.ok(item.quiz.length >= 2);
    for (const q of item.quiz) {
      assert.ok(q.o.length >= 2 && q.o.length <= 4);
      assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, q.q);
      assert.equal(new Set(q.o).size, q.o.length);
    }
  }
});

test('heritage stories have unique ids, text, and a moral', async () => {
  const D = await loadData();
  const ids = D.heritage.map(h => h.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const h of D.heritage) { assert.ok(h.text.length > 150); assert.ok(h.moral); }
});

test('branching stories have no dangling links and every node is reachable', async () => {
  const D = await loadData();
  for (const s of D.branching) {
    const seen = new Set();
    const walk = id => { if (seen.has(id)) return; seen.add(id); const n = s.nodes[id]; assert.ok(n, `${s.id}:${id}`); (n.choices || []).forEach(c => walk(c.to)); };
    walk(s.start);
    assert.deepEqual([...seen].sort(), Object.keys(s.nodes).sort());
    assert.ok(Object.values(s.nodes).some(n => n.end));
  }
});

test('personal story templates leave no template tokens for either gender', async () => {
  const D = await loadData();
  for (const key of Object.keys(D.interests)) {
    for (const g of ['m', 'f']) {
      const r = D.personal(key, 'سلمى', g);
      assert.ok(!/[{}|]/.test(r.title + r.text), key + g);
      assert.ok(r.text.includes('سلمى'));
    }
  }
});

test('new scripts are in the page and in the offline shell', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['x-data', 'x-core', 'x-reading', 'x-access', 'x-audio', 'x-content', 'x-progress', 'x-polish', 'x-web', 'x-web2', 'x-free']) {
    assert.match(html, new RegExp(`src="${f}\\.js"`));
    assert.ok(sw.includes(`'./${f}.js'`), f);
  }
  assert.match(sw, /x-extras\.css/);
  assert.match(sw, /vendor\/qrcode\.js/);
});
