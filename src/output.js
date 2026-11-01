import { createHash } from 'node:crypto';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const MANIFEST = '.velocita-manifest.json';
const hash = data => createHash('sha1').update(data).digest('base64url');

// Incremental output: files are collected in memory, then only changed files hit
// the disk (in parallel), and files that are no longer produced get removed.
export class Output {
  constructor(dir, { clean = false } = {}) {
    this.dir = dir;
    this.files = new Map();
    if (clean) rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const m = join(dir, MANIFEST);
    try { this.prev = existsSync(m) ? JSON.parse(readFileSync(m, 'utf8')) : {}; } catch { this.prev = {}; }
  }

  emit(rel, data) {
    this.files.set(rel.replace(/\\/g, '/').replace(/^\//, ''), data);
  }

  // Emit a file whose content is identified by `key` (e.g. a source hash). If the
  // previous build wrote the same key, `load` is never called: no read, no hash.
  emitLazy(rel, key, load) {
    this.files.set(rel.replace(/\\/g, '/').replace(/^\//, ''), { lazy: true, key: 'k:' + key, load });
  }

  async flush(concurrency = 64) {
    const next = {};
    const todo = [];
    // The manifest is trusted: use --clean if files in dist/ were changed by hand.
    for (const [rel, data] of this.files) {
      const h = data?.lazy ? data.key : hash(data);
      next[rel] = h;
      if (this.prev[rel] !== h) todo.push([rel, data]);
    }
    const stale = Object.keys(this.prev).filter(rel => !(rel in next));

    const dirs = new Set(todo.map(([rel]) => dirname(join(this.dir, rel))));
    await Promise.all([...dirs].map(d => mkdir(d, { recursive: true })));
    const jobs = [
      ...todo.map(([rel, data]) => async () => writeFile(join(this.dir, rel), data?.lazy ? await data.load() : data)),
      ...stale.map(rel => () => unlink(join(this.dir, rel)).catch(() => {})),
    ];
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
      while (i < jobs.length) await jobs[i++]();
    }));
    await writeFile(join(this.dir, MANIFEST), JSON.stringify(next));
    return { writtenFiles: todo.map(([rel]) => rel), written: todo.length, removed: stale.length, unchanged: this.files.size - todo.length };
  }
}
