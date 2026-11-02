import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const targets = ['cloudflare', 'netlify', 'vercel', 'github'];

// Lighthouse CI budget: fail CI if any category drops below 95, on every page.
// Search and tag pages can be noindex by design (Lighthouse's SEO category penalises
// that), so they are held to every category except SEO. 404.html is skipped.
const min = { minScore: 0.95 };
const core = {
  'categories:performance': ['error', min],
  'categories:accessibility': ['error', min],
  'categories:best-practices': ['error', min],
};
const lighthouserc = {
  ci: {
    collect: { staticDistDir: './dist', numberOfRuns: 1, maxAutodiscoverUrls: 0 },
    assert: {
      assertMatrix: [
        { matchingUrlPattern: '^(?!.*(404[.]html|/search/|/tags/)).*$', assertions: { ...core, 'categories:seo': ['error', min] } },
        { matchingUrlPattern: '/(search|tags)/', assertions: core },
      ],
    },
  },
};

// Netlify/Cloudflare `_headers` → Vercel `headers` config.
function parseHeaders(text) {
  const out = [];
  let cur;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) { cur = { source: line.trim().replace(/\*/g, '(.*)'), headers: [] }; out.push(cur); continue; }
    const [k, ...v] = line.trim().split(':');
    cur?.headers.push({ key: k.trim(), value: v.join(':').trim() });
  }
  return out;
}

const parseRedirects = text => text.split(/\r?\n/).filter(Boolean).map(l => {
  const [source, destination, code] = l.trim().split(/\s+/);
  return { source, destination, permanent: code !== '302' };
});

// Writes provider config files into the site root. Returns the list of files written.
export function writeDeployConfig(root, target, { outDir = 'dist' } = {}) {
  if (!targets.includes(target)) throw new Error(`unknown deploy target "${target}". Use: ${targets.join(', ')}`);
  const files = {};
  const node = '22';
  if (target === 'netlify') {
    files['netlify.toml'] = `[build]\n  command = "npm run build"\n  publish = "${outDir}"\n\n[build.environment]\n  NODE_VERSION = "${node}"\n`;
  }
  if (target === 'cloudflare') {
    // JSON strings are valid TOML basic strings, so a quote in the name can't inject keys.
    const name = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name || 'my-site';
    files['wrangler.toml'] = `name = ${JSON.stringify(name)}\npages_build_output_dir = ${JSON.stringify('./' + outDir)}\ncompatibility_date = "${new Date().toISOString().slice(0, 10)}"\n`;
  }
  if (target === 'vercel') {
    // Vercel ignores _headers/_redirects, so translate the last build's files into vercel.json.
    const read = f => (existsSync(join(root, outDir, f)) ? readFileSync(join(root, outDir, f), 'utf8') : '');
    files['vercel.json'] = JSON.stringify({
      buildCommand: 'npm run build', outputDirectory: outDir, cleanUrls: false, trailingSlash: true,
      headers: parseHeaders(read('_headers')), redirects: parseRedirects(read('_redirects')),
    }, null, 2) + '\n';
  }
  if (target === 'github') {
    files['.github/workflows/deploy.yml'] = `name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${node}, cache: npm }
      - run: npm ci || npm install
      - run: npm run build
      - run: npx velocita check
      - name: Lighthouse CI (fails below 95 in any category)
        uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true
      - uses: actions/upload-pages-artifact@v3
        with: { path: ${outDir} }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: \${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
`;
  }
  files['lighthouserc.json'] = JSON.stringify(lighthouserc, null, 2) + '\n';
  for (const [f, content] of Object.entries(files)) {
    mkdirSync(join(root, f, '..'), { recursive: true });
    writeFileSync(join(root, f), content);
  }
  return Object.keys(files);
}

// Command that publishes dist/ with the provider's own CLI (run by `velocita deploy <target>`).
export const deployCommand = (target, outDir = 'dist') => ({
  netlify: ['npx', ['netlify-cli', 'deploy', '--prod', `--dir=${outDir}`]],
  cloudflare: ['npx', ['wrangler', 'pages', 'deploy', outDir]],
  vercel: ['npx', ['vercel', 'deploy', '--prod']],
  github: null,
}[target]);
