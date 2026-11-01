import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const builtinDir = join(dirname(fileURLToPath(import.meta.url)), 'islands');

// Islands: pages stay zero-JS unless they contain <v-island name="x">. Only those pages get
// a ~600-byte inline loader, and each island's module is fetched only when it's needed:
//   load="visible" (default) | "idle" | "interaction" | "load"
// An island module exports default (element, props) => void.
export function collectIslands(site, emit) {
  const map = {};
  for (const dir of [builtinDir, join(site.root, 'islands')]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.js'))) {
      const code = readFileSync(join(dir, f));
      const name = f.slice(0, -3);
      const url = `/_islands/${name}.${createHash('sha1').update(code).digest('hex').slice(0, 8)}.js`;
      map[name] = { url, code };
    }
  }
  const used = new Set();
  return {
    names: Object.keys(map),
    inject(html) {
      const names = [...html.matchAll(/<v-island\s[^>]*name="([\w-]+)"/g)].map(m => m[1]);
      if (!names.length) return html;
      const urls = {};
      for (const n of names) {
        if (!map[n]) throw new Error(`unknown island "${n}" (add islands/${n}.js)`);
        urls[n] = map[n].url;
        if (!used.has(n)) { used.add(n); emit(map[n].url, map[n].code); }
      }
      const loader = `<style>v-island{display:block}</style><script type="module">const m=${JSON.stringify(urls)};const run=async e=>{if(e.v)return;e.v=1;const x=await import(m[e.getAttribute('name')]);x.default(e,JSON.parse(e.getAttribute('props')||'{}'))};for(const e of document.querySelectorAll('v-island')){const l=e.getAttribute('load')||'visible';if(l==='load')run(e);else if(l==='idle')(self.requestIdleCallback||setTimeout)(()=>run(e));else if(l==='interaction')for(const t of['pointerenter','focusin','touchstart'])e.addEventListener(t,()=>run(e),{once:true});else new IntersectionObserver((s,o)=>{if(s.some(i=>i.isIntersecting)){o.disconnect();run(e)}},{rootMargin:'200px'}).observe(e)}</script>`;
      return html.replace('</body>', loader + '</body>');
    },
  };
}
