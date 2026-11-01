import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { serialize, deserialize } from 'node:v8';

// Persistent build cache (.velocita-cache/<name>.bin). Entries not touched by the
// current build are dropped on save, so the cache never grows past one build's worth.
// v8 (de)serialisation is several times faster than JSON for large string maps.
export class BuildCache {
  constructor(root, name, version) {
    this.file = join(root, '.velocita-cache', `${name}.bin`);
    this.version = version;
    this.prev = new Map();
    this.next = new Map();
    this.hits = 0;
    this.misses = 0;
    try {
      if (existsSync(this.file)) {
        const data = deserialize(readFileSync(this.file));
        if (data.version === version) this.prev = data.entries;
      }
    } catch { /* corrupt or incompatible cache: start fresh */ }
  }

  static key(...parts) {
    const h = createHash('sha1');
    for (const p of parts) h.update(String(p)).update('\0');
    return h.digest('base64url');
  }

  get(key, compute) {
    let v = this.next.get(key);
    if (v !== undefined) return v;
    v = this.prev.get(key);
    if (v !== undefined) this.hits++;
    else { v = compute(); this.misses++; }
    this.next.set(key, v);
    return v;
  }

  save() {
    // Nothing new and nothing dropped: the file on disk is already correct.
    if (this.misses === 0 && this.next.size === this.prev.size) return;
    mkdirSync(join(this.file, '..'), { recursive: true });
    writeFileSync(this.file, serialize({ version: this.version, entries: this.next }));
  }
}
