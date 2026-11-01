// The official Velocita website: built with Velocita, zero dependencies, zero JS except two islands.
export default {
  title: 'Velocita',
  titleSeparator: '·',
  description: 'The zero-JavaScript, SEO-first static site framework. Lighthouse 100 by default, built-in GEO for AI search, 0.8 s rebuilds at 3,000 pages.',
  // `npm run deploy:demo` sets SITE_URL to the GitHub Pages address.
  url: process.env.SITE_URL || 'https://velocita.dev',
  author: 'Velocita',
  lang: 'en',
  organization: { name: 'Velocita', sameAs: ['https://github.com/6t9xstar/velocita'] },
  nav: [
    { title: 'Docs', url: '/docs/' },
    { title: 'Templates', url: '/templates/' },
    { title: 'Blog', url: '/blog/' },
    { title: 'Search', url: '/search/' },
  ],
  github: 'https://github.com/6t9xstar/velocita',
  sections: { docs: { layout: 'docs', type: 'page' } },
  og: { background: '#0b0d17', accent: '#7c5cff', color: '#ffffff' },
  css: `
:root{--bg:#ffffff;--bg2:#f6f7fb;--fg:#0f1222;--muted:#5b6078;--line:#e6e8f0;--code:#f1f2f8;--accent:#5b3df5;--accent2:#00a3ff;--glow:rgba(91,61,245,.18);--card:#ffffff}
@media(prefers-color-scheme:dark){:root{--bg:#0b0d17;--bg2:#11142a;--fg:#eceefa;--muted:#a3a8c3;--line:#23284a;--code:#161a35;--accent:#a08cff;--accent2:#52c7ff;--glow:rgba(124,92,255,.28);--card:#12152c}}
body{font-size:17px}
.wrap{max-width:72rem}
main{padding-block:0 5rem}main>:first-child:not(.hero):not(.docs){margin-top:2.5rem}
article>p,article>ul,article>ol,article>pre,article>table,article>blockquote,article>h2,article>h3,.prose{max-width:46rem}
header.site{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px)}
header.site nav{display:flex;align-items:center;gap:.25rem}header.site nav a{margin:0;padding:.4rem .7rem;border-radius:8px;color:var(--fg);font-size:.95rem}
header.site nav a:hover,header.site nav a[aria-current]{background:var(--code)}
.brand{display:flex;align-items:center;gap:.55rem;font-size:1.1rem}.logo{width:28px;height:28px;flex:none}
.gh{display:inline-flex;align-items:center;gap:.4rem;border:1px solid var(--line)}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.8rem 1.25rem;border-radius:12px;font-weight:650;text-decoration:none;border:1px solid var(--line);color:var(--fg);background:var(--card)}
.btn.primary{background:linear-gradient(135deg,#5b3df5,#0069b4);color:#fff;border:0;box-shadow:0 10px 30px -10px var(--glow)}
.btn:hover{transform:translateY(-1px)}.btn{transition:transform .15s}
.hero{position:relative;text-align:center;padding:5.5rem 0 3.5rem}
.hero:before{content:"";position:absolute;inset:-4rem -50vw auto;height:36rem;z-index:-1;background:radial-gradient(40rem 22rem at 50% 0,var(--glow),transparent 70%)}
.pill{display:inline-flex;gap:.5rem;align-items:center;font-size:.85rem;padding:.3rem .8rem;border:1px solid var(--line);border-radius:99px;color:var(--muted);text-decoration:none;background:var(--card)}
.hero h1{font-size:clamp(2.4rem,6vw,4.4rem);line-height:1.05;letter-spacing:-.035em;margin:1.2rem auto 1rem;max-width:16ch}
.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:1.25rem;color:var(--muted);max-width:40rem;margin:0 auto 2rem}
.ctas{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
.install{display:flex;align-items:center;gap:.75rem;justify-content:space-between;max-width:34rem;margin:1.75rem auto 0;padding:.6rem .6rem .6rem 1rem;border:1px solid var(--line);border-radius:12px;background:var(--code);font:15px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;text-align:left}
.install code{background:none;padding:0;overflow:auto;white-space:nowrap}
.install button,.copy{font:600 13px system-ui;padding:.45rem .7rem;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:3.5rem 0}
.stat{padding:1.25rem;border:1px solid var(--line);border-radius:16px;background:var(--card);text-align:center}
.stat b{display:block;font-size:2.1rem;letter-spacing:-.03em;line-height:1.1}.stat span{color:var(--muted);font-size:.9rem}
section.band{padding:3.5rem 0;border-top:1px solid var(--line)}
.eyebrow{color:var(--accent);font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;margin:0}
section.band h2{font-size:clamp(1.7rem,3.5vw,2.4rem);letter-spacing:-.025em;margin:.4rem 0 .6rem;line-height:1.15}
.sub{color:var(--muted);max-width:42rem;margin:0 0 2rem}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.card{padding:1.4rem;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.card h3{margin:.5rem 0 .35rem;font-size:1.08rem}.card p{margin:0;color:var(--muted);font-size:.95rem;line-height:1.6}
.icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:var(--code);font-size:1.1rem}
.split{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center}
.split pre{margin:0;border:1px solid var(--line)}
.check{list-style:none;padding:0;margin:1rem 0}.check li{padding:.35rem 0 .35rem 1.8rem;position:relative}
.check li:before{content:"✓";position:absolute;left:0;color:var(--accent);font-weight:800}
.compare th:not(:first-child),.compare td:not(:first-child){text-align:center}.compare td:nth-child(2){font-weight:650;color:var(--accent)}
.compare{font-size:.95rem}.compare thead th{background:var(--bg2)}
.meter{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-top:1rem}
.meter div{padding:1rem;border-radius:12px;background:var(--code);text-align:center}.meter b{display:block;font-size:1.5rem}.meter span{font-size:.8rem;color:var(--muted)}
details{border:1px solid var(--line);border-radius:12px;padding:.9rem 1.1rem;margin:.6rem 0;background:var(--card)}summary{cursor:pointer;font-weight:650}
details p{margin:.6rem 0 0;color:var(--muted)}
.cta{text-align:center;padding:3.5rem 1.5rem;border-radius:24px;background:radial-gradient(30rem 14rem at 50% 0,var(--glow),transparent),var(--bg2);border:1px solid var(--line)}
.page-head{padding:3.5rem 0 1rem}.page-head h1{font-size:clamp(2rem,4.5vw,3rem);letter-spacing:-.03em;margin:.3rem 0 .6rem}
footer.site{margin-top:2rem}.foot{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2rem}.foot h2{margin:0 0 .6rem;color:var(--fg);font-size:.9rem}
.foot ul{list-style:none;padding:0;margin:0}.foot li{padding:.2rem 0}.foot a{color:var(--muted);text-decoration:none}.foot a:hover{color:var(--accent)}
.docs{display:grid;grid-template-columns:15rem minmax(0,1fr);gap:3rem;padding-top:2rem}
.side{position:sticky;top:5rem;align-self:start;font-size:.93rem}.side p{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 .5rem .6rem;font-weight:700}
.side ol{list-style:none;padding:0;margin:0}.side a{display:block;padding:.38rem .6rem;border-radius:8px;text-decoration:none;color:var(--fg)}
.side a[aria-current]{background:var(--code);color:var(--accent);font-weight:650}
.prevnext{display:flex;justify-content:space-between;gap:1rem;margin-top:3rem;padding-top:1.25rem;border-top:1px solid var(--line)}
.prevnext a{text-decoration:none;font-weight:600}
@media(max-width:60rem){.grid{grid-template-columns:1fr 1fr}.split,.docs{grid-template-columns:1fr}.side{position:static}.foot{grid-template-columns:1fr 1fr}}
@media(max-width:40rem){.grid,.stats{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.hero{padding-top:3.5rem}header.site .wrap{flex-wrap:wrap;gap:.5rem}header.site nav{overflow-x:auto;max-width:100%}header.site nav a{padding:.35rem .5rem;font-size:.9rem}.gh span{display:none}.meter{grid-template-columns:1fr 1fr}}
`,
};
