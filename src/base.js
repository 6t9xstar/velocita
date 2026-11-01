// Base path support: a site whose `url` has a path (e.g. https://user.github.io/repo)
// is served from /repo/, so every root-relative URL in the HTML gets that prefix.
// Content and layouts keep writing plain "/blog/" links; this runs on the final HTML.
export const basePath = url => new URL(url).pathname.replace(/\/+$/, '');

export function withBase(html, base) {
  if (!base) return html;
  return html
    .replace(/(\s(?:href|src|action|poster|data)=")\/(?!\/)/g, `$1${base}/`)
    .replace(/(\ssrcset=")([^"]*)"/g, (m, a, set) => `${a}${set.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`)}"`)
    .replace(/"\/_islands\//g, `"${base}/_islands/`)
    .replace(/(content="\d+;\s*url=)\/(?!\/)/g, `$1${base}/`);
}
