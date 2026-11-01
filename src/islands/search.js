// Built-in search island. Loads /search-index.json once, ranks title > tags > description,
// requires every query word to match, and filters to the page's language.
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const norm = s => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export default async function search(el, { placeholder = 'Search…', empty = 'No results.' } = {}) {
  const lang = document.documentElement.lang;
  const form = document.querySelector('form[role="search"]');
  const input = form?.querySelector('input[name="q"]');
  const out = document.createElement('ul');
  out.className = 'list';
  out.setAttribute('aria-live', 'polite');
  el.append(out);
  if (input) input.placeholder = placeholder;

  const index = (await (await fetch('/search-index.json')).json())
    .filter(d => !d.l || d.l === lang)
    .map(d => ({ ...d, nt: norm(d.t), nk: norm((d.k || []).join(' ')), nd: norm(d.d) }));

  const render = q => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) { out.innerHTML = ''; return; }
    const hits = index
      .map(d => {
        let score = 0;
        for (const w of words) {
          const s = (d.nt.includes(w) ? 3 : 0) + (d.nk.includes(w) ? 2 : 0) + (d.nd.includes(w) ? 1 : 0);
          if (!s) return null;
          score += s;
        }
        return { d, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    out.innerHTML = hits.length
      ? hits.map(({ d }) => `<li><h2><a href="${esc(d.u)}">${esc(d.t)}</a></h2><p>${esc(d.d)}</p></li>`).join('')
      : `<li>${esc(empty)}</li>`;
  };

  const q = new URLSearchParams(location.search).get('q') || '';
  if (input) {
    input.value = q;
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        render(input.value);
        history.replaceState(null, '', input.value ? `?q=${encodeURIComponent(input.value)}` : location.pathname);
      }, 80);
    });
    form.addEventListener('submit', ev => ev.preventDefault());
  }
  render(q);
}
