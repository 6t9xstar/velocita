export default {
  title: '{{title}}',
  description: 'A small design and engineering studio building fast, accessible websites and products.',
  url: 'https://example.com',
  author: '{{title}}',
  lang: 'en',
  nav: [{ title: 'Work', url: '/work/' }, { title: 'Services', url: '/services/' }, { title: 'About', url: '/about/' }, { title: 'Contact', url: '/contact/' }],
  organization: { name: '{{title}}', sameAs: [] },
  // Case studies are CreativeWork in JSON-LD, listed newest first at /work/.
  sections: { work: { title: 'Selected work', schemaType: 'CreativeWork' } },
  feed: false,
  css: `
.hero{padding:1rem 0 1.5rem}.hero p{font-size:1.3rem;color:var(--muted);max-width:34rem}
.btn{display:inline-block;background:var(--accent);color:var(--bg);padding:.7rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600}
.work{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1.25rem;padding:0;list-style:none;margin:1.5rem 0}
.work li{border:1px solid var(--line);border-radius:12px;padding:1.2rem}
.work h3{margin:.2rem 0 .4rem}.work a{text-decoration:none;color:var(--fg)}.work p{margin:0;color:var(--muted)}
.client{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;color:var(--accent);font-weight:700}
.stats{display:flex;flex-wrap:wrap;gap:2rem;margin:1.5rem 0}.stats strong{display:block;font-size:1.8rem;line-height:1.1}`,
};
