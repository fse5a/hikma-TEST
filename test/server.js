import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

const root = resolve('.');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    let filePath = resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) throw new Error('invalid path');
    try {
      if (!(await stat(filePath)).isFile()) throw new Error('not a file');
    } catch {
      filePath = resolve(root, 'public', relativePath);
      if (!filePath.startsWith(`${root}${sep}`) || !(await stat(filePath)).isFile()) throw new Error('not a file');
    }
    response.writeHead(200, {'Content-Type': types[extname(filePath)] || 'application/octet-stream'});
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not found');
  }
}).listen(4173, '127.0.0.1');