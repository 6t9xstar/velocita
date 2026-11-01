import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { imageSize } from './images.js';

const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tiff']);

// Image pipeline:
// - always: width/height for zero CLS, and images next to Markdown files are copied to /_img/
// - if the optional `sharp` package is installed: WebP variants + srcset, cached across builds
export async function createImagePipeline(site, output) {
  const emit = output.emit.bind(output);
  let sharp = null;
  if (site.images !== false) {
    try { sharp = (await import('sharp')).default; } catch { /* optional peer dependency */ }
  }
  const widths = site.imageWidths || [480, 960, 1600];
  const cacheDir = join(site.root, '.velocita-cache', 'img');
  const jobs = new Map();
  const seen = new Map();

  function process(src, file) {
    if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return { src };
    if (seen.has(file)) return seen.get(file);
    if (!existsSync(file)) return { src };
    const buf = readFileSync(file);
    const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
    const dims = imageSize(file);
    const result = { src, ...(dims || {}) };

    if (!src.startsWith('/')) {
      result.src = `/_img/${hash}-${basename(file)}`;
      emit(result.src, buf);
    }
    if (sharp && dims && RASTER.has(extname(file).toLowerCase())) {
      const ws = [...new Set([...widths.filter(w => w < dims.width), Math.min(dims.width, Math.max(...widths))])];
      result.srcset = ws.map(w => {
        const out = `/_img/${hash}-${w}.webp`;
        jobs.set(out, { buf, w, key: `${hash}-${w}-${site.imageQuality || 78}`, cache: join(cacheDir, `${hash}-${w}.webp`) });
        return `${out} ${w}w`;
      }).join(', ');
      result.sizes = site.imageSizes || '(max-width: 46rem) 100vw, 46rem';
    }
    seen.set(file, result);
    return result;
  }

  async function flush() {
    if (!jobs.size) return;
    mkdirSync(cacheDir, { recursive: true });
    for (const [out, { buf, w, key, cache }] of jobs) output.emitLazy(out, key, async () => {
      if (existsSync(cache)) return readFileSync(cache);
      const data = await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: site.imageQuality || 78 }).toBuffer();
      writeFileSync(cache, data);
      return data;
    });
  }

  return { process, flush, enabled: !!sharp };
}
