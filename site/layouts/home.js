// Landing page. Copy lives here; the FAQ comes from index.md frontmatter so the visible
// answers and the FAQPage JSON-LD are generated from one source.
const features = [
  ['⚡', 'Zero JavaScript by default', 'Pages ship HTML and ~3 KB of inlined CSS. No framework runtime, no hydration, nothing to block the main thread.'],
  ['🔎', 'SEO that is impossible to forget', 'Canonical, Open Graph, JSON-LD, sitemap, hreflang and RSS on every page. A build-time linter catches the rest.'],
  ['🤖', 'Built for AI search (GEO)', 'llms.txt, llms-full.txt and a clean Markdown copy of every page, plus a one-line AI-crawler policy.'],
  ['🏝️', 'Islands when you need them', 'Drop in an interactive component; only that page loads it, and only when it scrolls into view.'],
  ['🖼️', 'Images and social cards', 'Automatic width/height, WebP srcset, LCP priority hints and a 1200×630 OG card for every page.'],
  ['🌍', 'Multilingual out of the box', 'content/hi/… becomes /hi/… with hreflang clusters, x-default, sitemap alternates and a language switcher.'],
];

const layoutCode = `// layouts/post.js: a layout is just a function
export default ({ page, h }) => \`
  <article>
    <h1>\${h.escape(page.title)}</h1>
    <p>\${h.date(page.date)} · \${page.readingTime} min</p>
    \${page.html}
  </article>\`;`;

const seoList = [
  'Site-wide audit: broken links, #anchors, orphans, duplicates',
  'Structured data: Article, FAQ, HowTo, Product, LocalBusiness',
  'IndexNow pings for only the URLs that changed',
  'Redirects from aliases, with real 301s at the edge',
  'Lighthouse CI gate at 95+ written for you',
];

const compare = [
  ['JavaScript shipped by default', '0 KB', 'Framework runtime', '0 KB*'],
  ['Runtime dependencies', '0', 'Hundreds', 'Hundreds'],
  ['llms.txt + Markdown mirrors', 'Built in', 'Plugin', 'Plugin'],
  ['OG image per page', 'Built in', 'Library', 'Integration'],
  ['Broken-link + anchor audit', 'Built in', 'External', 'External'],
  ['hreflang + sitemap alternates', 'Built in', 'Manual', 'Integration'],
  ['IndexNow on deploy', 'Built in', 'Manual', 'Manual'],
];

export default ({ page, site, articles, h }) => {
  const e = h.escape;
  const faq = (page.faq || []).map(f => String(f).split('::').map(s => s.trim()));
  const latest = articles.filter(a => a.section === 'blog').slice(0, 3);
  return `
<section class="hero">
<a class="pill" href="/blog/velocita-1-0/">🎉 Velocita 1.0 is here. Read the announcement →</a>
<h1>Static sites at <span class="grad">sonic speed</span>, with SEO built in.</h1>
<p class="lead">${e(site.description)}</p>
<div class="ctas"><a class="btn primary" href="/docs/">Get started →</a><a class="btn" href="/templates/">Browse templates</a></div>
<div class="install"><code>npx github:6t9xstar/velocita new my-site</code><v-island name="copy" load="interaction" props='{"text":"npx github:6t9xstar/velocita new my-site"}'><button type="button" disabled>Copy</button></v-island></div>
</section>

<div class="stats" role="list">
<div class="stat" role="listitem"><b class="grad">100</b><span>Lighthouse in all 4 categories</span></div>
<div class="stat" role="listitem"><b class="grad">0 KB</b><span>JavaScript on content pages</span></div>
<div class="stat" role="listitem"><b class="grad">0.8 s</b><span>rebuild, 3,000 pages</span></div>
<div class="stat" role="listitem"><b class="grad">0</b><span>runtime dependencies</span></div>
</div>

<section class="band" aria-labelledby="features">
<p class="eyebrow">Why Velocita</p>
<h2 id="features">Everything other frameworks leave to plugins</h2>
<p class="sub">Performance, SEO and AI discoverability aren't add-ons here. They're the defaults, and the build fails before a regression ships.</p>
<div class="grid">${features.map(([i, t, d]) => `<div class="card"><div class="icon" aria-hidden="true">${i}</div><h3>${e(t)}</h3><p>${e(d)}</p></div>`).join('')}</div>
</section>

<section class="band split" aria-labelledby="dx">
<div>
<p class="eyebrow">Developer experience</p>
<h2 id="dx">Markdown in. Fast HTML out.</h2>
<p class="sub">Write content in Markdown, or pull it from Contentful, Sanity or any JSON API. Layouts are plain JavaScript functions, with no template language to learn and nothing to compile.</p>
<a class="btn" href="/docs/layouts/">Learn about layouts →</a>
</div>
<pre><code class="language-js">${e(layoutCode)}</code></pre>
</section>

<section class="band split" aria-labelledby="seo">
<pre><code>$ velocita audit
💡 blog/speed.md: consider linking to /blog/islands/
✖ about.md: broken link → /team/
⚠ duplicate title "Pricing" in: a.md, b.md

$ velocita check
📏 42 pages · avg HTML 2.1 KB gz · max JS 1.5 KB
   41/42 pages ship zero JS</code></pre>
<div>
<p class="eyebrow">SEO &amp; GEO</p>
<h2 id="seo">Catch SEO bugs at build time, not in Search Console</h2>
<ul class="check">${seoList.map(s => `<li>${e(s)}</li>`).join('')}</ul>
<a class="btn" href="/docs/seo/">SEO features →</a>
</div>
</section>

<section class="band" aria-labelledby="live">
<p class="eyebrow">Don't take our word for it</p>
<h2 id="live">This page, measured live in your browser</h2>
<p class="sub">Real numbers from the Performance API on the page you're reading right now.</p>
<v-island name="perf" load="idle"><div class="meter"><div><b>…</b><span>HTML transferred</span></div><div><b>…</b><span>JavaScript</span></div><div><b>…</b><span>Requests</span></div><div><b>…</b><span>Largest paint</span></div></div></v-island>
</section>

<section class="band" aria-labelledby="compare">
<p class="eyebrow">Compared</p>
<h2 id="compare">How Velocita stacks up</h2>
<table class="compare"><thead><tr><th>Out of the box</th><th>Velocita</th><th>Typical React SSG</th><th>Typical islands SSG</th></tr></thead>
<tbody>${compare.map(r => `<tr>${r.map((c, i) => (i ? `<td>${e(c)}</td>` : `<th scope="row">${e(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table>
<p class="meta">*Islands-based frameworks also ship zero JS by default. Velocita's difference is everything else on this list, with no integrations to install.</p>
</section>

${latest.length ? `<section class="band" aria-labelledby="latest">
<p class="eyebrow">From the blog</p>
<h2 id="latest">Latest writing</h2>
<div class="grid">${latest.map(a => `<a class="card" href="${a.url}" style="text-decoration:none;color:inherit"><span class="meta">${h.date(a.date, site.lang)} · ${a.readingTime} min</span><h3>${e(a.title)}</h3><p>${e(a.description)}</p></a>`).join('')}</div>
</section>` : ''}

<section class="band" aria-labelledby="faq">
<p class="eyebrow">FAQ</p>
<h2 id="faq">Questions</h2>
${faq.map(([q, a]) => `<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join('')}
</section>

<section class="band"><div class="cta">
<h2>Ship a faster site this afternoon</h2>
<p class="sub" style="margin-inline:auto">Pick a template, write Markdown, deploy anywhere. Lighthouse 100 is the starting point.</p>
<div class="ctas"><a class="btn primary" href="/docs/">Read the docs →</a><a class="btn" href="${site.github}" rel="noopener">Star on GitHub</a></div>
</div></section>`;
};
