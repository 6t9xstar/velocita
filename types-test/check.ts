// Compile-only check that the public declarations are usable (npm run typecheck).
import { build, defineConfig, renderMarkdown, fromJson, type Config, type BuildResult } from '../src/index.js';

const config: Config = defineConfig({ title: 'T', url: 'https://t.example', aiCrawlers: 'search-only', sources: [fromJson({ url: 'https://x/y.json' })] });
const result: Promise<BuildResult> = build('.', { clean: true, ...config });
const html: string = renderMarkdown('# hi').html;
void result; void html;
