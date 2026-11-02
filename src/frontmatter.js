// Minimal YAML-subset frontmatter parser: scalars, quoted strings, booleans, numbers,
// inline arrays [a, b], "- item" block lists and nested (indented) maps and lists.
// Lines it can't read are skipped, so odd frontmatter never breaks a build.
export function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const lines = [];
  for (const raw of m[1].split(/\r?\n/)) {
    const text = raw.trim();
    if (text && !text.startsWith('#')) lines.push({ ind: raw.length - raw.trimStart().length, text });
  }
  const state = { lines, i: 0 };
  const data = lines.length ? parseMap(state, lines[0].ind) : {};
  return { data, body: src.slice(m[0].length) };
}

const KEY = /^([\w-]+)\s*:\s*(.*)$/;
// In list items a key needs a space after the colon, so `- https://x` stays a string.
const ITEM_KEY = /^[\w-]+\s*:(\s|$)/;

function parseMap(s, ind) {
  const out = {};
  while (s.i < s.lines.length) {
    const line = s.lines[s.i];
    if (line.ind < ind) break;
    const kv = line.ind === ind && KEY.exec(line.text);
    s.i++;
    if (!kv) continue;
    const [, key, val = ''] = kv;
    out[key] = val.trim() === '' ? parseNested(s, ind) : scalar(val);
  }
  return out;
}

// Value of an empty `key:`: an indented map or list (or a list at the same indent), else [].
function parseNested(s, ind) {
  const next = s.lines[s.i];
  if (!next) return [];
  const isItem = /^-(\s|$)/.test(next.text);
  if (isItem && next.ind >= ind) return parseList(s, next.ind);
  if (next.ind > ind) return parseMap(s, next.ind);
  return [];
}

function parseList(s, ind) {
  const out = [];
  while (s.i < s.lines.length) {
    const line = s.lines[s.i];
    if (line.ind !== ind || !/^-(\s|$)/.test(line.text)) break;
    const content = line.text.slice(1).trimStart();
    if (!content) { s.i++; out.push(parseNested(s, ind)); continue; }
    if (ITEM_KEY.test(content)) {
      // `- key: value` starts a map whose keys line up with `key`.
      const at = ind + (line.text.length - content.length);
      s.lines[s.i] = { ind: at, text: content };
      out.push(parseMap(s, at));
      continue;
    }
    s.i++;
    out.push(scalar(content));
  }
  return out;
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
