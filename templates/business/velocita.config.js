export default {
  title: '{{title}}',
  description: '{{title}}: friendly, fast, local service. Book online today.',
  url: 'https://example.com',
  lang: 'en',
  nav: [{ title: 'Services', url: '/services/' }, { title: 'About', url: '/about/' }, { title: 'Contact', url: '/contact/' }],
  organization: { name: '{{title}}', sameAs: [] },
  // Emits LocalBusiness JSON-LD on the home page. Fill in real details for Google Maps / the local pack.
  localBusiness: {
    type: 'LocalBusiness',
    telephone: '+1-555-0100',
    email: 'hello@example.com',
    priceRange: '$$',
    address: { street: '1 Main Street', city: 'Springfield', region: 'IL', postalCode: '62701', country: 'US' },
    geo: { lat: 39.7817, lng: -89.6501 },
    openingHours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-14:00'],
  },
  feed: false,
  search: false,
  css: `
.hero{padding:0 0 1rem}.hero p{font-size:1.25rem;color:var(--muted)}
.btn{display:inline-block;background:var(--accent);color:var(--bg);padding:.7rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1rem;margin:2rem 0}
.card{border:1px solid var(--line);border-radius:10px;padding:1rem 1.2rem}.card h3{margin-top:0}`,
};
