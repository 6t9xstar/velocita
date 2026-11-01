// Safe, fast minifiers. Preserve <pre>, <textarea>, <script>, <style> contents.
export function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}

export function minifyHtml(html) {
  const keep = [];
  html = html.replace(/<(pre|textarea|script)\b[\s\S]*?<\/\1>/gi, m => `\u0001${keep.push(m) - 1}\u0001`);
  html = html.replace(/<style>([\s\S]*?)<\/style>/gi, (_, c) => `\u0001${keep.push(`<style>${minifyCss(c)}</style>`) - 1}\u0001`);
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\s+/g, ' ')
    .replace(/\s*(<\/?(?:html|head|body|meta|link|title|div|section|article|header|footer|main|nav|ul|ol|li|p|h[1-6]|table|thead|tbody|tr|td|th|blockquote|hr|br|figure|aside)\b[^>]*>)\s*/gi, '$1').trim();
  return html.replace(/\u0001(\d+)\u0001/g, (_, n) => keep[n]);
}
