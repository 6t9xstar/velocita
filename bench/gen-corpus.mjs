// Deterministic Markdown corpus shared by the Astro and Velocita benchmark sites.
// Usage: node bench/gen-corpus.mjs <count> <outDir>
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const count = Number(process.argv[2] ?? 1000);
const out = process.argv[3] ?? "bench/corpus";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const words = "speed static render island content search index markdown layout schema crawler sitemap cache build edge deploy image route page section".split(" ");
const sentence = (n) => {
  const w = Array.from({ length: n }, () => words[Math.floor(rnd() * words.length)]);
  w[0] = w[0][0].toUpperCase() + w[0].slice(1);
  return w.join(" ") + ".";
};
const para = () => Array.from({ length: 5 }, () => sentence(10 + Math.floor(rnd() * 8))).join(" ");

for (let i = 1; i <= count; i++) {
  const tags = [`t${i % 20}`, `t${(i * 7) % 20}`].filter((t, j, a) => a.indexOf(t) === j);
  const day = String((i % 28) + 1).padStart(2, "0");
  const month = String((i % 12) + 1).padStart(2, "0");
  const body = [
    para(),
    `## Overview ${i}`,
    para(),
    para(),
    "- First point with **bold** text\n- Second point with a [link](/blog/post-" + (((i + 1) % count) + 1) + "/)\n- Third point with `inline code`",
    `## Details`,
    para(),
    "```js\nexport function handler(req) {\n  return new Response('post " + i + "');\n}\n```",
    "| Metric | Value |\n|---|---|\n| Size | " + i + " KB |\n| Time | " + (i % 97) + " ms |",
    `### Notes`,
    para(),
    para(),
  ].join("\n\n");
  const fm = [
    "---",
    `title: "Benchmark post ${i}"`,
    `description: "Realistic benchmark post number ${i} used to compare static site generators fairly."`,
    `date: 2025-${month}-${day}`,
    `tags: [${tags.join(", ")}]`,
    "---",
  ].join("\n");
  writeFileSync(join(out, `post-${i}.md`), fm + "\n\n" + body + "\n");
}
console.log(`wrote ${count} posts to ${out}`);
