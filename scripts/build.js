// Assembles the deployable static site: frontend/ (pages, scripts, PWA shell) plus design/ (stylesheet, icon)
// are flattened into dist/, which Vercel serves (outputDirectory).
// ============================================================
// البناء: يدمج مجلدات frontend و design داخل dist الذي ينشره Vercel.
// ============================================================
import {cpSync, rmSync} from 'node:fs';

rmSync('dist', {recursive: true, force: true});
cpSync('frontend', 'dist', {recursive: true, filter: source => !source.includes('/tests')});
cpSync('design', 'dist', {recursive: true, filter: source => !source.endsWith('.md')});
console.log('Built dist/ from frontend/ and design/.');

// Stamp the service worker with a build id so every deploy changes sw.js and browsers update automatically.
import {readFileSync, writeFileSync} from 'node:fs';
const buildId = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 12);
const worker = readFileSync('dist/sw.js', 'utf8').replace('__BUILD_ID__', buildId);
writeFileSync('dist/sw.js', worker);
console.log(`Service worker build id: ${buildId}`);
