#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { build } from '../src/build.js';
import { dev, preview } from '../src/dev.js';
import { doctor } from '../src/doctor.js';
import { pingIndexNow } from '../src/indexnow.js';
import { createSite, templates, askSite } from '../src/scaffold.js';
import { checkSite } from '../src/check.js';
import { writeDeployConfig, deployCommand, targets } from '../src/deploy.js';

const args = process.argv.slice(2);
const VALUE_FLAGS = ['--port', '--host', '--template', '--title'];
const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const has = n => args.includes(n);
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const [cmd = 'help', ...rest] = positional;
const fail = msg => { console.error(`✖ ${msg}`); process.exit(1); };

async function runBuild(dir) {
  const r = await build(dir, has('--clean') ? { clean: true } : {});
  for (const w of r.warnings) console.warn(`⚠ SEO: ${w}`);
  for (const w of r.audit.warnings) console.warn(`⚠ audit: ${w}`);
  for (const e of r.audit.errors) console.error(`✖ audit: ${e}`);
  return r;
}

function printCheck(r) {
  const c = checkSite(r.out, r.site.budget);
  const s = c.summary;
  for (const p of c.failures) console.error(`✖ ${p.url}: ${p.issues.join('; ')}`);
  console.log(`📏 ${s.pages} pages · avg HTML ${s.avgHtmlKB.toFixed(1)} KB gz · max JS ${s.maxJsKB.toFixed(1)} KB · max CSS ${s.maxCssKB.toFixed(1)} KB · ${s.zeroJsPages}/${s.pages} pages ship zero JS`);
  return c;
}

if (cmd === 'build' || cmd === 'audit') {
  const r = await runBuild(rest[0] || '.');
  if (cmd === 'audit') {
    for (const s of r.audit.suggestions) console.log(`💡 ${s}`);
    console.log(`\n${r.audit.errors.length} errors, ${r.audit.warnings.length + r.warnings.length} warnings, ${r.audit.suggestions.length} link suggestions`);
  } else {
    console.log(`⚡ built ${r.pages} pages in ${r.ms}ms (${r.written} written, ${r.unchanged} unchanged, ${r.removed} removed${r.ogImages ? `, ${r.ogImages} OG images` : ''}) → ${r.out}`);
  }
  let failed = (has('--strict') || cmd === 'audit') && r.audit.errors.length > 0;
  if (has('--check') && printCheck(r).failures.length) failed = true;
  if (has('--indexnow')) {
    const res = await pingIndexNow(r.site, r.changedUrls);
    console.log(res.skipped ? `IndexNow skipped: ${res.skipped}` : `🔔 IndexNow: submitted ${res.submitted} changed URLs (HTTP ${res.status.join(', ')})`);
  }
  if (failed) process.exit(1);
} else if (cmd === 'check') {
  const r = await runBuild(rest[0] || '.');
  if (printCheck(r).failures.length) process.exit(1);
} else if (cmd === 'dev') {
  await dev(rest[0] || '.', Number(flag('--port')) || 3000, { host: flag('--host') || '127.0.0.1' });
} else if (cmd === 'preview') {
  try { await preview(rest[0] || '.', Number(flag('--port')) || 4173, { host: flag('--host') || '127.0.0.1' }); } catch (err) { fail(err.message); }
} else if (cmd === 'doctor') {
  const r = await doctor(rest[0] || '.');
  const icon = { ok: '✔', warn: '⚠', error: '✖' };
  for (const c of r.checks) (c.status === 'error' ? console.error : console.log)(`${icon[c.status]} ${c.name}: ${c.message}`);
  if (!r.ok) process.exit(1);
} else if (cmd === 'new') {
  try {
    // Interactive in a terminal when something is missing; --yes takes the defaults.
    const given = { dir: rest[0], template: flag('--template'), title: flag('--title') };
    const a = has('--yes') ? given : await askSite(given);
    const dir = a.dir || 'my-site';
    const s = createSite(dir, { template: a.template || 'blog', title: a.title });
    console.log(`✔ created ${s.template} site "${s.title}" in ${s.dir}\n\n  cd ${dir}\n  npm install\n  npm run dev`);
  } catch (err) { fail(err.message); }
} else if (cmd === 'deploy') {
  // velocita deploy init <target> [dir]   → write provider config + lighthouserc.json
  // velocita deploy <target> [dir]        → build, audit, check, then publish with the provider CLI
  const init = rest[0] === 'init';
  const target = init ? rest[1] : rest[0];
  const dir = (init ? rest[2] : rest[1]) || '.';
  if (!targets.includes(target)) fail(`usage: velocita deploy [init] <${targets.join('|')}> [dir]`);
  if (init) {
    if (target === 'vercel') await runBuild(dir); // vercel.json is generated from the build's headers/redirects
    try { console.log(`✔ wrote ${writeDeployConfig(dir, target).join(', ')}`); } catch (err) { fail(err.message); }
  } else {
    const r = await runBuild(dir);
    if (r.audit.errors.length) fail('fix broken links before deploying');
    if (printCheck(r).failures.length) fail('performance budget exceeded');
    const command = deployCommand(target);
    if (!command) { console.log('GitHub Pages deploys from CI: run `velocita deploy init github`, commit, and push to main.'); process.exit(0); }
    const [bin, cmdArgs] = command;
    console.log(`🚀 ${bin} ${cmdArgs.join(' ')}`);
    const res = spawnSync(bin, cmdArgs, { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
    process.exit(res.status ?? 1);
  }
} else {
  console.log(`velocita: sonic-speed, SEO-first static sites

  velocita new   [dir] [--template ${templates().join('|')}] [--title "My Site"] [--yes]
                                        asks for anything missing when run in a terminal
  velocita dev   [dir] [--port N] [--host H]  dev server with live reload (localhost only unless --host 0.0.0.0)
  velocita preview [dir] [--port N] [--host H]
                                        serve the built dist/ as is (no rebuild), port 4173
  velocita doctor [dir]                 check Node version, config, folders, themes and sharp
  velocita build [dir] [--clean] [--strict] [--check] [--indexnow]
                                        production build to dist/ (incremental)
                                        --strict    fail on broken links/anchors
                                        --check     fail if the performance budget is exceeded
                                        --indexnow  ping IndexNow with changed URLs
  velocita audit [dir]                  full SEO audit incl. internal-link suggestions
  velocita check [dir]                  performance budget: page weight, JS/CSS, CWV hazards
  velocita deploy init <${targets.join('|')}> [dir]
                                        write host config + Lighthouse CI budget
  velocita deploy <netlify|cloudflare|vercel> [dir]
                                        build, audit, check, then publish`);
}
