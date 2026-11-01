// Front page: the newest story as the lead, then the latest headlines from each section.
export default ({ page, site, sections, h }) => {
  const e = h.escape;
  const all = Object.values(sections).flat().sort((a, b) => b.date - a.date);
  const [lead] = all;
  const card = p => `<li><span class="kicker">${e(p.section)}</span><h3><a href="${p.url}">${e(p.title)}</a></h3><p>${e(p.description || p.excerpt)}</p><p class="meta">${h.date(p.date, site.lang)}</p></li>`;
  const blocks = Object.entries(sections).map(([name, items]) => {
    const rest = items.filter(p => p !== lead).slice(0, 6);
    if (!rest.length) return '';
    const label = site.sections?.[name]?.title || name;
    return `<div class="section-head"><h2>${e(label)}</h2><a href="/${name}/">More ${e(label.toLowerCase())} →</a></div><ul class="grid">${rest.map(card).join('')}</ul>`;
  }).join('');
  return `<h1 class="visually-hidden" style="position:absolute;left:-999px">${e(page.title)}</h1>
${lead ? `<a class="lead" href="${lead.url}"><span class="kicker">${e(lead.section)}</span><h2>${e(lead.title)}</h2><p>${e(lead.description || lead.excerpt)}</p><span class="meta">${h.date(lead.date, site.lang)} · ${lead.readingTime} min read</span></a>` : ''}
${page.html}
${blocks}`;
};
