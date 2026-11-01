import { readFileSync } from 'node:fs';

// A source is `async (site) => [{ path, data, body }]`. `path` decides the URL exactly
// like a file under content/ would (e.g. 'blog/my-post.md' → /blog/my-post/).
// Every adapter takes `map(item) → { path, data, body }` to fit your content model.

const defaultMap = section => item => {
  const { body = '', content, slug, path, ...data } = item;
  return { path: path || `${section}/${slug}.md`, data, body: body || content || '' };
};

async function getJson(url, { fetchImpl = fetch, headers = {} } = {}) {
  const res = await fetchImpl(url, { headers: { Accept: 'application/json', ...headers } });
  if (!res.ok) throw new Error(`source request failed: ${res.status} ${url.replace(/access_token=[^&]+/, 'access_token=***')}`);
  return res.json();
}

// Any JSON array — a local file or an HTTP endpoint.
export function fromJson({ url, file, section = 'blog', map = defaultMap(section), fetchImpl } = {}) {
  return async () => {
    const items = file ? JSON.parse(readFileSync(file, 'utf8')) : await getJson(url, { fetchImpl });
    return (Array.isArray(items) ? items : items.items || []).map(map);
  };
}

// Contentful Delivery API. Fields of each entry are passed to `map`.
export function fromContentful({ space, accessToken, environment = 'master', contentType, section = 'blog', map = defaultMap(section), fetchImpl }) {
  return async () => {
    const out = [];
    for (let skip = 0; ; skip += 1000) {
      const qs = new URLSearchParams({ limit: '1000', skip: String(skip), ...(contentType ? { content_type: contentType } : {}) });
      const res = await getJson(`https://cdn.contentful.com/spaces/${space}/environments/${environment}/entries?${qs}`,
        { fetchImpl, headers: { Authorization: `Bearer ${accessToken}` } });
      out.push(...res.items.map(e => map({ ...e.fields, updated: e.sys?.updatedAt })));
      if (skip + res.items.length >= res.total) return out;
    }
  };
}

// Sanity GROQ query, e.g. *[_type == "post"]{ title, "slug": slug.current, description, date, body }
export function fromSanity({ projectId, dataset = 'production', query, apiVersion = '2025-01-01', token, section = 'blog', map = defaultMap(section), fetchImpl }) {
  return async () => {
    const host = token ? 'api.sanity.io' : 'apicdn.sanity.io';
    const res = await getJson(`https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`,
      { fetchImpl, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.result.map(map);
  };
}
