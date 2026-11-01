// Site shell: sticky translucent header, logo, GitHub link, four-column footer.
const logo = id => `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b3df5"/><stop offset="1" stop-color="#00a3ff"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#${id})"/><path d="M9 9h4.2l2.8 9.6L18.8 9H23l-5 14h-4z" fill="#fff"/></svg>`;
const githubIcon = `<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;

export default ({ page, site, head, content, h }) => {
  const e = h.escape;
  const active = url => (page.url === url || (url !== '/' && page.url.startsWith(url)) ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="${e(page.lang || site.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#5b3df5">
${site.faviconHref ? `<link rel="icon" href="${site.faviconHref}">` : ''}
${head}
<style>${h.css(site.css)}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="brand" href="/" aria-label="${e(site.title)} home">${logo('lg1')}${e(site.title)}</a>
<nav aria-label="Main">${site.nav.map(n => `<a href="${n.url}"${active(n.url)}>${e(n.title)}</a>`).join('')}<a class="gh" href="${site.github}" rel="noopener" aria-label="Velocita on GitHub">${githubIcon}<span>GitHub</span></a></nav>
</div></header>
<main id="main" class="wrap">${content}</main>
<footer class="site"><div class="wrap foot">
<div><a class="brand" href="/">${logo('lg2')}${e(site.title)}</a><p>Zero-JS, SEO-first static sites.<br>MIT licensed · © ${new Date().getFullYear()}</p></div>
<div><h2>Learn</h2><ul><li><a href="/docs/">Getting started</a></li><li><a href="/docs/seo/">SEO &amp; AI search</a></li><li><a href="/docs/deploy/">Deploy</a></li></ul></div>
<div><h2>Explore</h2><ul><li><a href="/templates/">Templates</a></li><li><a href="/blog/">Blog</a></li><li><a href="/search/">Search</a></li></ul></div>
<div><h2>Machine-readable</h2><ul><li><a href="/feed.xml">RSS</a> · <a href="/feed.json">JSON Feed</a></li><li><a href="/sitemap.xml">Sitemap</a></li><li><a href="/llms.txt">llms.txt</a></li></ul></div>
</div></footer>
</body>
</html>`;
};
