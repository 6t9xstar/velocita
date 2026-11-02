// Astro vs Velocita: clean build, no-op rebuild, one-file-edit rebuild, output weight.
// Usage: node bench/bench.mjs [counts=1000,5000] [runs=3] [profiles=full]
// profiles: comma-separated Velocita output profiles (minimal,standard,ai,full); Astro runs once per count.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const counts = (process.argv[2] ?? "1000,5000").split(",").map(Number);
const runs = Number(process.argv[3] ?? 3);
const profiles = (process.argv[4] ?? "full").split(",");
const astro = join(here, "astro-site");
const vel = join(here, "velocita-site");
const velBin = join(here, "..", "bin", "velocita.js");
const astroBin = join(astro, "node_modules", "astro", "bin", "astro.mjs");

const time = (fn) => { const t = performance.now(); fn(); return (performance.now() - t) / 1000; };
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: "pipe" });

const fw = {
  astro: {
    clean() { for (const d of ["dist", ".astro", "node_modules/.astro"]) rmSync(join(astro, d), { recursive: true, force: true }); },
    build() { run([astroBin, "build", "--silent"], astro); },
    dist: join(astro, "dist"),
    post: (n) => join(astro, "dist", "blog", `post-${n}`, "index.html"),
  },
  velocita: {
    clean() { for (const d of ["dist", ".velocita-cache"]) rmSync(join(vel, d), { recursive: true, force: true }); },
    build() { run([velBin, "build", vel], here); },
    configure(profile) {
      const file = join(vel, "velocita.config.js");
      const src = readFileSync(file, "utf8").replace(/^\s*profile: .*\n/m, "");
      writeFileSync(file, src.replace("export default {\n", `export default {\n  profile: '${profile}',\n`));
    },
    dist: join(vel, "dist"),
    post: (n) => join(vel, "dist", "blog", `post-${n}`, "index.html"),
  },
};

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    e.isDirectory() ? walk(p, acc) : acc.push(p);
  }
  return acc;
}

function weigh(f) {
  const files = walk(f.dist);
  const by = (ext) => files.filter((p) => extname(p) === ext);
  const sum = (list) => list.reduce((a, p) => a + statSync(p).size, 0);
  const post = readFileSync(f.post(1));
  const postJs = (post.toString().match(/<script[^>]*src=/g) || []).length;
  return {
    files: files.length,
    htmlPages: by(".html").length,
    totalMB: +(sum(files) / 1e6).toFixed(1),
    jsKB: +(sum(by(".js")) / 1e3).toFixed(1),
    cssFiles: by(".css").length,
    postHtmlKB: +(post.length / 1e3).toFixed(1),
    postHtmlGzKB: +(gzipSync(post).length / 1e3).toFixed(1),
    postExternalScripts: postJs,
    postExternalCss: (post.toString().match(/<link[^>]*stylesheet/g) || []).length,
  };
}

if (!existsSync(astroBin)) console.error("astro not installed in bench/astro-site: skipping Astro (run npm install there)");
const results = [];
for (const n of counts) {
  run([join(here, "gen-corpus.mjs"), String(n), join(here, "corpus")], here);
  rmSync(join(vel, "content"), { recursive: true, force: true });
  mkdirSync(join(vel, "content"), { recursive: true });
  cpSync(join(here, "corpus"), join(vel, "content", "blog"), { recursive: true });
  writeFileSync(join(vel, "content", "index.md"), "---\ntitle: Bench site\ndescription: Velocita benchmark site home page.\n---\n\n[Blog](/blog/)\n");

  const jobs = [...(existsSync(astroBin) ? [["astro", fw.astro, null]] : []),...profiles.map((p) => ["velocita", fw.velocita, p])];
  for (const [name, f, profile] of jobs) {
    if (profile) f.configure(profile);
    f.clean(); f.build(); // warm the OS file cache and JIT-independent disk state
    const clean = [], noop = [], edit = [];
    for (let i = 0; i < runs; i++) {
      f.clean();
      clean.push(time(() => f.build()));
      noop.push(time(() => f.build()));
      const src = name === "astro" ? join(here, "corpus", "post-1.md") : join(vel, "content", "blog", "post-1.md");
      appendFileSync(src, `\nEdited ${Date.now()}.\n`);
      edit.push(time(() => f.build()));
    }
    const r = { framework: name, ...(profile ? { profile } : {}), posts: n, cleanS: median(clean), noopS: median(noop), editOneS: median(edit), runs: { clean, noop, edit }, ...weigh(f) };
    console.log(JSON.stringify(r));
    results.push(r);
  }
}
fw.velocita.configure("full");
writeFileSync(join(here, "results.json"), JSON.stringify({ date: new Date().toISOString(), node: process.version, results }, null, 2));
