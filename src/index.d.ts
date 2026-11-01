// Type declarations for Velocita's public API and velocita.config.js.

export interface NavLink { title: string; url: string }

export interface SectionConfig {
  title?: string;
  description?: string;
  layout?: string;
  type?: 'article' | 'page';
  schemaType?: string;
}

export interface SourceEntry {
  /** Content path, e.g. `blog/my-post.md`. Decides the URL and section. */
  path: string;
  data?: Record<string, unknown>;
  /** Markdown body. */
  body?: string;
}
export type Source = (site: ResolvedConfig) => Promise<SourceEntry[]> | SourceEntry[];

export interface Config {
  title?: string;
  description?: string;
  /** Production URL, e.g. `https://example.com` (a path prefix is supported). */
  url?: string;
  lang?: string;
  /** First entry is the default locale; others live in `content/<lang>/`. */
  locales?: string[];
  author?: string;
  authorUrl?: string;
  nav?: NavLink[] | Record<string, NavLink[]>;
  image?: string;
  twitter?: string;
  keywords?: string[];
  themeColor?: string;
  titleSeparator?: string;

  contentDir?: string;
  publicDir?: string;
  outDir?: string;
  layoutsDir?: string;

  minify?: boolean;
  /** Persistent render cache in `.velocita-cache/` (default true). */
  cache?: boolean;
  /** Items per collection/tag page; 0 disables pagination. */
  pageSize?: number;
  prefetch?: boolean;
  drafts?: boolean;
  feed?: boolean;
  feedSize?: number;
  llms?: boolean;
  markdownMirror?: boolean;
  search?: boolean;
  searchTitle?: Record<string, string>;
  audit?: boolean;
  ogImages?: boolean;
  og?: { background?: string; accent?: string; color?: string };
  manifest?: boolean;
  favicon?: string | false;

  /** `allow` | `search-only` (blocks training bots) | `block` (also answer bots). */
  aiCrawlers?: 'allow' | 'search-only' | 'block';
  contentSignal?: boolean;
  indexNowKey?: string;

  imageWidths?: number[];
  imageQuality?: number;

  sections?: Record<string, SectionConfig>;
  sources?: Source[];
  redirects?: Record<string, string>;
  budget?: { htmlKB?: number; jsKB?: number; cssKB?: number };

  organization?: { name: string; logo?: string; sameAs?: string[] };
  localBusiness?: Record<string, unknown>;
  software?: { version?: string; license?: string; repository?: string };

  /** Extra CSS appended to the inlined theme. */
  css?: string;
  /** Extra tags injected into `<head>`. */
  head?: string;
  [key: string]: unknown;
}

export type ResolvedConfig = Required<Pick<Config, 'title' | 'description' | 'url' | 'lang' | 'contentDir' | 'publicDir' | 'outDir' | 'layoutsDir'>> & Config & { root: string; base: string };

export interface BuildOptions extends Config {
  /** Delete the output directory first. */
  clean?: boolean;
  dev?: boolean;
}

export interface BuildResult {
  pages: number;
  ms: number;
  warnings: string[];
  out: string;
  audit: { errors: string[]; warnings: string[]; suggestions: string[] };
  changedUrls: string[];
  ogImages: number;
  site: ResolvedConfig;
  written: number;
  removed: number;
  unchanged: number;
}

/** Identity helper that gives `velocita.config.js` editor completion. */
export function defineConfig(config: Config): Config;

export function build(root?: string, opts?: BuildOptions): Promise<BuildResult>;
export function loadConfig(root: string): Promise<ResolvedConfig>;
/** The underlying node:http Server (typed minimally so @types/node is not required). */
export interface DevServer { address(): { address: string; port: number } | string | null; close(callback?: (err?: Error) => void): unknown }
export function dev(root?: string, port?: number, opts?: { host?: string }): Promise<DevServer>;

export interface RenderedMarkdown {
  html: string;
  toc: { level: number; id: string; text: string }[];
  text: string;
  words: number;
  readingTime: number;
}
export function renderMarkdown(md: string, opts?: { siteUrl?: string; eagerFirstImage?: boolean; image?: (src: string) => unknown }): RenderedMarkdown;
export function slugify(s: string): string;
export function escapeHtml(s: unknown): string;
export function parseFrontmatter(src: string): { data: Record<string, any>; body: string };
export function minifyHtml(html: string): string;
export function minifyCss(css: string): string;
/** Reads width/height from a PNG, JPEG, GIF or WebP file header. */
export function imageSize(file: string): { width: number; height: number } | null;

export function seoHead(page: Record<string, any>, site: ResolvedConfig): string;
export function jsonLd(page: Record<string, any>, site: ResolvedConfig, canonical: string, desc: string, image?: string): string;
export function lintPage(page: Record<string, any>): string[];
export function breadcrumbs(page: Record<string, any>): { name: string; url: string }[];

interface SourceCommon { section?: string; map?: (item: any) => SourceEntry; fetchImpl?: typeof fetch }
export function fromJson(opts: SourceCommon & ({ url: string } | { file: string })): Source;
export function fromContentful(opts: SourceCommon & { space: string; accessToken: string; contentType: string; environment?: string }): Source;
export function fromSanity(opts: SourceCommon & { projectId: string; query: string; dataset?: string; apiVersion?: string; token?: string }): Source;

/** Scaffold a new site from a starter template (`blog`, `docs`, `business`). Throws if `dir` is not empty. */
export function createSite(dir: string, opts?: { template?: string; title?: string }): { dir: string; name: string; title: string; date: string; template: string };
/** Names of the bundled starter templates. */
export function templates(): string[];

export function pingIndexNow(site: ResolvedConfig, urls: string[], opts?: { endpoint?: string; fetchImpl?: typeof fetch }): Promise<unknown>;
export function collectIslands(site: ResolvedConfig, emit: (file: string, data: string) => void): { inject(html: string): string };

export const shell: (args: Record<string, any>) => string;
export const layouts: Record<string, (args: Record<string, any>) => string>;
export const css: string;
