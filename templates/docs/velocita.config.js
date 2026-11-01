export default {
  title: '{{title}}',
  description: 'Documentation for {{title}}.',
  url: 'https://docs.example.com',
  author: 'The {{title}} team',
  lang: 'en',
  nav: [{ title: 'Docs', url: '/docs/' }, { title: 'Search', url: '/search/' }],
  // Everything in content/docs/ uses layouts/docs.js and is a page (not a dated article).
  sections: { docs: { layout: 'docs', type: 'page' } },
  css: `
body:has(.docs) .wrap{max-width:72rem}
.docs{display:grid;grid-template-columns:14rem minmax(0,1fr);gap:2.5rem}
.side{position:sticky;top:1rem;align-self:start;font-size:.92rem}
.side ol{list-style:none;padding:0;margin:0}
.side a{display:block;padding:.3rem .6rem;border-radius:6px;text-decoration:none;color:var(--fg)}
.side a[aria-current]{background:var(--code);color:var(--accent);font-weight:600}
.prevnext{display:flex;justify-content:space-between;gap:1rem;margin-top:3rem;border-top:1px solid var(--line);padding-top:1rem}
@media(max-width:52rem){.docs{grid-template-columns:1fr}.side{position:static}}`,
};
