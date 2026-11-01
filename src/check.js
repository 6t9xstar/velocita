import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

export const defaultBudget = { htmlKB: 30, jsKB: 20, cssKB: 20 }; // gzipped, per page

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const gz = s => gzipSync(s).length;

// Static performance budget over built HTML: page weight, JS/CSS weight (gzipped),
// render-blocking resources and Core Web Vitals hazards. Runs in milliseconds, no browser.
export function checkSite(out, budget = {}) {
  const b = { ...defaultBudget, ...budget };
  const pages = [];
  const failures = [];
  for (const file of walk(out).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    if (/http-equiv="refresh"/.test(html)) continue; // redirect fallbacks
    const url = '/' + relative(out, file).replace(/\\/g, '/').replace(/index\.html$/, '');
    const head = html.slice(0, html.indexOf('</head>') + 1 || html.length);

    const inlineJs = [...html.matchAll(/<script(?![^>]*type="(?:application\/ld\+json|speculationrules)")[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('');
    let js = inlineJs ? gz(inlineJs) : 0;
    for (const [, src] of html.matchAll(/<script[^>]*\ssrc="(\/[^"]+)"/g)) if (existsSync(join(out, src))) js += gz(readFileSync(join(out, src)));
    for (const [, src] of html.matchAll(/"(\/_islands\/[^"]+\.js)"/g)) if (existsSync(join(out, src))) js += gz(readFileSync(join(out, src)));
    let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + gz(m[1]), 0);
    for (const [, href] of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="(\/[^"]+)"/g)) if (existsSync(join(out, href))) css += gz(readFileSync(join(out, href)));

    const p = { url, htmlKB: gz(html) / 1024, jsKB: js / 1024, cssKB: css / 1024, issues: [] };
    if (p.htmlKB > b.htmlKB) p.issues.push(`HTML ${p.htmlKB.toFixed(1)} KB gz > ${b.htmlKB} KB`);
    if (p.jsKB > b.jsKB) p.issues.push(`JS ${p.jsKB.toFixed(1)} KB gz > ${b.jsKB} KB`);
    if (p.cssKB > b.cssKB) p.issues.push(`CSS ${p.cssKB.toFixed(1)} KB gz > ${b.cssKB} KB`);
    if (/<link[^>]*rel="stylesheet"/.test(head)) p.issues.push('render-blocking stylesheet in <head>');
    if (/<script(?![^>]*\b(async|defer|type="(module|application\/ld\+json|speculationrules)"))[^>]*\ssrc=/.test(head)) p.issues.push('render-blocking script in <head>');
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
    const unsized = imgs.filter(i => !/\swidth=/.test(i) || !/\sheight=/.test(i)).length;
    if (unsized) p.issues.push(`${unsized} image(s) without width/height (layout shift)`);
    if (imgs[0] && /loading="lazy"/.test(imgs[0])) p.issues.push('first image is lazy-loaded (slows LCP)');
    if (!/<html[^>]*\slang="/.test(html)) p.issues.push('missing <html lang>');
    if (!/name="viewport"/.test(head)) p.issues.push('missing viewport meta');
    pages.push(p);
    if (p.issues.length) failures.push(p);
  }
  const max = k => Math.max(0, ...pages.map(p => p[k]));
  const avg = k => pages.reduce((n, p) => n + p[k], 0) / (pages.length || 1);
  return {
    pages, failures, budget: b,
    summary: { pages: pages.length, avgHtmlKB: avg('htmlKB'), maxHtmlKB: max('htmlKB'), maxJsKB: max('jsKB'), maxCssKB: max('cssKB'), zeroJsPages: pages.filter(p => !p.jsKB).length },
  };
}
