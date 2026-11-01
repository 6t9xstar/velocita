// Live performance meter: real numbers for the current page from the Performance API.
// It loads itself after the page is idle, so the measurement doesn't include this island.
const kb = n => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

export default function perf(el) {
  const cells = [...el.querySelectorAll('b')];
  const set = (i, v) => { cells[i].textContent = v; };

  const nav = performance.getEntriesByType('navigation')[0];
  const before = performance.getEntriesByType('resource').filter(r => !r.name.includes('/_islands/'));
  const scripts = before.filter(r => r.initiatorType === 'script');
  // transferSize is 0 when served from cache; fall back to the decoded size so the number is meaningful.
  set(0, kb(nav ? nav.transferSize || nav.decodedBodySize : 0));
  set(1, kb(scripts.reduce((n, r) => n + (r.transferSize || r.decodedBodySize), 0)));
  set(2, String(1 + before.length));

  // Browsers without LCP support (e.g. Safari) keep "n/a" rather than a stand-in metric.
  set(3, 'n/a');
  try {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      set(3, `${Math.round(entries[entries.length - 1].startTime)} ms`);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* unsupported */ }
}
