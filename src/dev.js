import { createServer } from 'node:http';
import { watch, existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { build } from './build.js';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Starts the dev server. Binds to localhost unless `host` says otherwise (e.g. '0.0.0.0'
// to test on a phone). Resolves to the http.Server; call `server.close()` to stop it.
export async function dev(root = '.', port = 3000, { host = '127.0.0.1' } = {}) {
  root = resolve(root);
  const clients = new Set();
  let out, site;
  const rebuild = async () => {
    try {
      const r = await build(root, { dev: true, url: `http://localhost:${port}` });
      out = r.out;
      site = r.site;
      console.log(`⚡ rebuilt ${r.pages} pages in ${r.ms}ms`);
      for (const c of clients) c.write('data: reload\n\n');
    } catch (err) { console.error('✖ build failed:', err.message); }
  };
  await rebuild();

  let timer;
  const watchers = [];
  // Watch the configured folders (contentDir etc.); defaults if the first build failed.
  for (const d of new Set([site?.contentDir || 'content', site?.layoutsDir || 'layouts', site?.publicDir || 'public'])) {
    const dir = join(root, d);
    if (existsSync(dir)) watchers.push(watch(dir, { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 50); }));
  }
  const cfg = join(root, 'velocita.config.js');
  if (existsSync(cfg)) watchers.push(watch(cfg, () => { clearTimeout(timer); timer = setTimeout(rebuild, 50); }));

  const server = createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (!out) { res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Build failed: see the terminal.'); return; }
    let path;
    try { path = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400).end('Bad request'); return; }
    let p = join(out, path);
    // Must stay inside dist/ itself, not merely share its prefix (dist-old/, dist2/).
    if (p !== out && !p.startsWith(out + sep)) { res.writeHead(403).end('Forbidden'); return; }
    try {
      if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
      const ok = existsSync(p);
      if (!ok) p = join(out, '404.html');
      const body = existsSync(p) ? readFileSync(p) : 'Not found';
      res.writeHead(ok ? 200 : 404, { 'X-Powered-By': 'Velocita', 'X-Content-Type-Options': 'nosniff', 'Content-Type': types[extname(p)] || 'application/octet-stream' });
      res.end(body);
    } catch (err) {
      console.error('✖ dev server:', err.message);
      if (!res.headersSent) res.writeHead(500);
      res.end('Internal error');
    }
  });
  server.on('close', () => { clearTimeout(timer); for (const w of watchers) w.close(); for (const c of clients) c.end(); });
  await new Promise((ok, fail) => server.once('error', fail).listen(port, host, ok));
  const shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
  console.log(`🚀 dev server at http://${shown}:${server.address().port}`);
  return server;
}
