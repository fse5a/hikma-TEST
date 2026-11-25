// Assembles the deployable static site: frontend/ (pages, scripts, PWA shell) plus design/ (stylesheet, icon)
// are flattened into dist/, which Vercel serves (outputDirectory).
import {cpSync, rmSync} from 'node:fs';

rmSync('dist', {recursive: true, force: true});
cpSync('frontend', 'dist', {recursive: true, filter: source => !source.includes('/tests')});
cpSync('design', 'dist', {recursive: true, filter: source => !source.endsWith('.md')});
console.log('Built dist/ from frontend/ and design/.');
