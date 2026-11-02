import { createServer } from 'node:http';
import { watch, existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve, sep, isAbsolute } from 'node:path';
import { build, loadConfig } from './build.js';
import { escapeHtml } from './markdown.js';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Serves one decoded URL path from the output directory `out`.
function serveFile(out, path, res) {
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
    console.error('✖ server:', err.message);
    if (!res.headersSent) res.writeHead(500);
    res.end('Internal error');
  }
}

const decode = (req, res) => {
  try { return decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400).end('Bad request'); return null; }
};

async function listen(server, port, host, label) {
  await new Promise((ok, fail) => server.once('error', fail).listen(port, host, ok));
  const shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
  console.log(`${label} at http://${shown}:${server.address().port}`);
  return server;
}

// Serves the already-built output directory: no build, no watching, no live reload.
export async function preview(root = '.', port = 4173, { host = '127.0.0.1' } = {}) {
  root = resolve(root);
  const out = resolve(root, (await loadConfig(root)).outDir);
  if (!existsSync(join(out, 'index.html'))) throw new Error(`nothing to preview in ${out}: run \`velocita build\` first`);
  const server = createServer((req, res) => { const path = decode(req, res); if (path != null) serveFile(out, path, res); });
  return listen(server, port, host, `👀 previewing ${out}`);
}

// Folders and files a rebuild depends on: the configured content, layouts and public dirs,
// the config file and local theme files. Falls back to the defaults if the config is broken.
export async function watchTargets(root) {
  root = resolve(root);
  let site = { contentDir: 'content', layoutsDir: 'layouts', publicDir: 'public' };
  try { site = await loadConfig(root); } catch { /* the build reports it */ }
  const themes = [site.theme].flat().filter(t => typeof t === 'string' && (t.startsWith('.') || isAbsolute(t)));
  const paths = [site.contentDir, site.layoutsDir, site.publicDir, 'velocita.config.js', ...themes].map(d => resolve(root, d));
  return [...new Set(paths)].filter(p => existsSync(p));
}

const errorPage = err => `<!doctype html><meta charset="utf-8"><title>Build failed</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#1b1b1f;color:#eee}main{max-width:60rem;margin:3rem auto;padding:0 1.5rem}h1{color:#ff6b6b;font-size:1.4rem}pre{background:#000;padding:1rem;overflow:auto;white-space:pre-wrap;border-left:4px solid #ff6b6b}</style>
<main><h1>✖ Build failed</h1><pre>${escapeHtml(err.stack || err.message)}</pre><p>Fix the error and save: this page reloads on its own.</p></main>
<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;

// Starts the dev server. Binds to localhost unless `host` says otherwise (e.g. '0.0.0.0'
// to test on a phone). Resolves to the http.Server; call `server.close()` to stop it.
// A failed rebuild never stops the server: the error is printed and shown in every open
// page instead, and the next successful rebuild reloads them.
export async function dev(root = '.', port = 3000, { host = '127.0.0.1' } = {}) {
  root = resolve(root);
  const clients = new Set();
  let out, error = null;
  const rebuild = async () => {
    try {
      const r = await build(root, { dev: true, url: `http://localhost:${port}` });
      out = r.out;
      error = null;
      console.log(`⚡ rebuilt ${r.pages} pages in ${r.ms}ms`);
    } catch (err) {
      error = err;
      const where = (err.stack || '').split('\n').slice(1, 4).join('\n');
      console.error(`✖ build failed: ${err.message}${where ? `\n${where}` : ''}`);
    }
    for (const c of clients) c.write('data: reload\n\n');
  };
  await rebuild();

  // Watch what the config points at; re-resolved on every change so editing contentDir etc. takes effect.
  let timer, closed = false, watched = '', watchers = [];
  const rewatch = async () => {
    const targets = await watchTargets(root);
    if (targets.join('|') === watched) return;
    watched = targets.join('|');
    for (const w of watchers) w.close();
    watchers = targets.map(p => watch(p, { recursive: statSync(p).isDirectory() }, schedule)
      .on('error', err => console.error(`✖ watcher: ${err.message}`)));
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (!closed) rewatch().catch(err => console.error(`✖ watcher: ${err.message}`)).then(rebuild); }, 50);
  };
  await rewatch();

  const server = createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    const path = decode(req, res);
    if (path == null) return;
    if (error && (path.endsWith('/') || path.endsWith('.html') || !extname(path))) {
      res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(errorPage(error));
      return;
    }
    if (!out) { res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Build failed: see the terminal.'); return; }
    serveFile(out, path, res);
  });
  server.on('close', () => { closed = true; clearTimeout(timer); for (const w of watchers) w.close(); for (const c of clients) c.end(); });
  return listen(server, port, host, '🚀 dev server');
}
