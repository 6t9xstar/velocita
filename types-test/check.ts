// Compile-only check that the public declarations are usable (npm run typecheck).
import { build, defineConfig, renderMarkdown, fromJson, type Config, type BuildResult } from '../src/index.js';

const config: Config = defineConfig({ title: 'T', url: 'https://t.example', aiCrawlers: 'search-only', sources: [fromJson({ url: 'https://x/y.json' })] });
const result: Promise<BuildResult> = build('.', { clean: true, ...config });
const html: string = renderMarkdown('# hi').html;
const withSchema: Config = { collections: { blog: { schema: { title: 'string', date: 'date', tags: 'string[]?', rating: { type: 'number', required: false, validate: v => v <= 5 || 'at most 5' } } } } };
void result; void html; void withSchema;
