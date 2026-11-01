// velocita-theme-paper: a calm, serif reading theme for Velocita.
// A theme is a plain object: { name, config?, css?, layouts?, shell? }.
// Layouts receive { page, site, pages, articles, sections, tags, h }, where `h`
// holds helpers (escape, date, pager, breadcrumbs) and the built-in layouts.

const css = `
:root{--bg:#fbf8f3;--fg:#24211c;--muted:#6b645a;--accent:#9c3d10;--line:#e6dfd3;--code:#f1ece3}
@media(prefers-color-scheme:dark){:root{--bg:#191714;--fg:#ece6dc;--muted:#a59c8f;--accent:#f0a46c;--line:#33302a;--code:#24211d}}
body{font:19px/1.75 Charter,"Bitstream Charter","Sitka Text",Cambria,Georgia,serif}
h1,h2,h3,.brand{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:-.01em}
.wrap{max-width:42rem}
.cards{display:grid;gap:1.25rem;padding:0;list-style:none}
.cards li{border:1px solid var(--line);border-radius:12px;padding:1.1rem 1.3rem;background:color-mix(in srgb,var(--bg) 92%,var(--fg))}
.cards h2{margin:0 0 .3rem;font-size:1.3rem}.cards h2 a{text-decoration:none;color:var(--fg)}
.cards p{margin:.3rem 0 0}
`;

export default {
  name: 'paper',
  config: {
    og: { background: '#fbf8f3', accent: '#9c3d10', color: '#24211c' },
    themeColor: '#9c3d10',
  },
  css,
  layouts: {
    list: ({ page, site, h }) => `<h1>${h.escape(page.title)}</h1>${page.html}
<ul class="cards">${page.items.map(p => `<li><h2><a href="${p.url}">${h.escape(p.title)}</a></h2><p class="meta">${h.date(p.date, site.lang)} · ${p.readingTime} min read</p><p>${h.escape(p.description || p.excerpt)}</p></li>`).join('')}</ul>
${h.pager(page.pagination)}`,
  },
};
