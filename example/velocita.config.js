import { fromJson } from '../src/index.js';

export default {
  title: 'Velocita Demo',
  description: 'Demo content site built with Velocita: zero JS, perfect SEO, instant navigation.',
  url: 'https://velocita.example.com',
  author: 'Velocita Team',
  lang: 'en',
  locales: ['en', 'hi'],
  nav: {
    en: [{ title: 'Blog', url: '/blog/' }, { title: 'News', url: '/news/' }, { title: 'About', url: '/about/' }, { title: 'Search', url: '/search/' }],
    hi: [{ title: 'ब्लॉग', url: '/hi/blog/' }, { title: 'परिचय', url: '/hi/about/' }, { title: 'खोजें', url: '/hi/search/' }],
  },
  searchTitle: { hi: 'खोजें' },
  // Content from a headless source: swap fromJson for fromContentful / fromSanity.
  sources: [fromJson({ file: new URL('./data/news.json', import.meta.url), section: 'news' })],
  redirects: { '/rss/': '/feed.xml' },
  aiCrawlers: 'allow',
};
