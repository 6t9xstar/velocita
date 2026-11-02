export { build, loadConfig } from './build.js';

/** Identity helper: `export default defineConfig({ ... })` gives editors the Config type. */
export const defineConfig = config => config;
export { dev, preview, watchTargets } from './dev.js';
export { doctor } from './doctor.js';
export { renderMarkdown, slugify, escapeHtml, safeUrl } from './markdown.js';
export { parseFrontmatter } from './frontmatter.js';
export { seoHead, jsonLd, lintPage, breadcrumbs } from './seo.js';
export { minifyHtml, minifyCss } from './minify.js';
export { imageSize } from './images.js';
export { fromJson, fromContentful, fromSanity } from './sources.js';
export { pingIndexNow } from './indexnow.js';
export { createSite, templates, templateInfo, askSite } from './scaffold.js';
export { collectIslands } from './islands.js';
export { shell, layouts, css } from './theme.js';
