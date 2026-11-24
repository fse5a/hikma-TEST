// Copies the static frontend from client/ to dist/ for Vercel's outputDirectory.
import {cpSync, rmSync} from 'node:fs';

rmSync('dist', {recursive: true, force: true});
cpSync('client', 'dist', {recursive: true});
console.log('Built dist/ from client/.');
