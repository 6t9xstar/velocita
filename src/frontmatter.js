// Minimal YAML-ish frontmatter parser: scalars, quoted strings, booleans,
// numbers, inline arrays [a, b] and "- item" block lists.
export function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data = {};
  let listKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = /^\s*-\s+(.*)$/.exec(raw);
    if (item && listKey) { data[listKey].push(scalar(item[1])); continue; }
    const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(raw);
    if (!kv) continue;
    const [, key, val] = kv;
    if (val === '') { data[key] = []; listKey = key; continue; }
    listKey = null;
    data[key] = scalar(val);
  }
  return { data, body: src.slice(m[0].length) };
}

function scalar(v) {
  v = v.trim();
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map(s => scalar(s)).filter(s => s !== '');
  if (/^(['"]).*\1$/.test(v)) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}
