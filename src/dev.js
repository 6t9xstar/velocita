import { createServer } from 'node:http';
import { watch, existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { build } from './build.js';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

export async function dev(root = '.', port = 3000) {
  root = resolve(root);
  const clients = new Set();
  let out;
  const rebuild = async () => {
    try {
      const r = await build(root, { dev: true, url: `http://localhost:${port}` });
      out = r.out;
      console.log(`⚡ rebuilt ${r.pages} pages in ${r.ms}ms`);
      for (const c of clients) c.write('data: reload\n\n');
    } catch (err) { console.error('✖ build failed:', err.message); }
  };
  await rebuild();

  let timer;
  for (const d of ['content', 'layouts', 'public']) {
    const dir = join(root, d);
    if (existsSync(dir)) watch(dir, { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 50); });
  }
  const cfg = join(root, 'velocita.config.js');
  if (existsSync(cfg)) watch(cfg, () => { clearTimeout(timer); timer = setTimeout(rebuild, 50); });

  createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let p = join(out, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(out)) { res.writeHead(403).end(); return; }
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    const ok = existsSync(p);
    if (!ok) p = join(out, '404.html');
    res.writeHead(ok ? 200 : 404, { 'Content-Type': types[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  }).listen(port, () => console.log(`🚀 dev server at http://localhost:${port}`));
}
