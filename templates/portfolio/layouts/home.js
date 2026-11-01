// Home: the page's own Markdown (hero, services), then the three latest case studies.
export default ({ page, sections, h }) => {
  const e = h.escape;
  const work = (sections.work || []).slice(0, 3);
  return `<h1>${e(page.title)}</h1>
${page.html}
${work.length ? `<h2>Recent work</h2><ul class="work">${work.map(p => `<li><span class="client">${e(p.client || '')}</span><h3><a href="${p.url}">${e(p.title)}</a></h3><p>${e(p.description)}</p></li>`).join('')}</ul><p><a href="/work/">All case studies →</a></p>` : ''}`;
};
