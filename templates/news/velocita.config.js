export default {
  title: '{{title}}',
  description: 'Independent reporting and analysis, updated daily.',
  url: 'https://example.com',
  author: 'The {{title}} newsroom',
  lang: 'en',
  nav: [{ title: 'News', url: '/news/' }, { title: 'Opinion', url: '/opinion/' }, { title: 'About', url: '/about/' }, { title: 'Search', url: '/search/' }],
  organization: { name: '{{title}}', sameAs: [] },
  // NewsArticle / OpinionNewsArticle JSON-LD instead of BlogPosting.
  sections: {
    news: { title: 'Latest news', schemaType: 'NewsArticle' },
    opinion: { title: 'Opinion', schemaType: 'OpinionNewsArticle' },
  },
  pageSize: 12,
  css: `
.lead{display:block;border-bottom:1px solid var(--line);padding-bottom:1.5rem;margin-bottom:1.5rem;text-decoration:none;color:inherit}
.lead h2{font-size:2rem;line-height:1.15;margin:.3rem 0}.lead p{font-size:1.15rem;color:var(--muted);margin:.4rem 0}
.kicker{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:700;color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1.25rem 1.5rem;padding:0;list-style:none}
.grid h3{margin:.2rem 0;font-size:1.1rem;line-height:1.3}.grid a{text-decoration:none;color:var(--fg)}.grid p{margin:.2rem 0;color:var(--muted);font-size:.95rem}
.section-head{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid var(--fg);margin-top:2.5rem;padding-top:.4rem}
.section-head h2{margin:0;font-size:1.2rem}`,
};
