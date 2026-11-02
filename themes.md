# Theme gallery

> Browse Velocita themes. Each one is an npm package with CSS, layouts and config defaults, in light and dark, and your site can still override all of it.

<div class="prose">
<p class="sub">A theme is a plain npm package: CSS, optional layouts and config defaults. Install one, add a line to your config, and your site still wins on every setting it defines itself.</p>
</div>

<div class="gallery">

<article class="theme">
<div class="previews">
<figure class="mock" style="--b:#ffffff;--f:#1a1a1a;--m:#5c5c5c;--a:#0b57d0;--l:#e5e5e5;font-family:system-ui,sans-serif"><div class="bar"><b>My Site</b><span>Blog · About</span></div><div class="body"><strong>Why speed matters</strong><span class="meta">Oct 20 · 4 min read</span><span>Fast pages rank better and convert better.</span><span class="link">Read more →</span></div><figcaption>Light</figcaption></figure>
<figure class="mock" style="--b:#0f1115;--f:#e8e8e8;--m:#a0a0a0;--a:#8ab4f8;--l:#2a2d33;font-family:system-ui,sans-serif"><div class="bar"><b>My Site</b><span>Blog · About</span></div><div class="body"><strong>Why speed matters</strong><span class="meta">Oct 20 · 4 min read</span><span>Fast pages rank better and convert better.</span><span class="link">Read more →</span></div><figcaption>Dark</figcaption></figure>
</div>
<h2>Default</h2>
<p>The built-in theme. A clean system-font layout, about 3 KB of inlined CSS, with every template's layouts included.</p>
<p class="tags"><span>Built in</span><span>Sans-serif</span><span>Light + dark</span></p>
<p><code>No install needed</code></p>
</article>

<article class="theme">
<div class="previews">
<figure class="mock" style="--b:#fbf8f3;--f:#24211c;--m:#6b645a;--a:#9c3d10;--l:#e6dfd3;font-family:Charter,'Bitstream Charter','Sitka Text',Cambria,Georgia,serif"><div class="bar"><b>My Site</b><span>Blog · About</span></div><div class="body"><strong>Why speed matters</strong><span class="meta">Oct 20 · 4 min read</span><span>Fast pages rank better and convert better.</span><span class="link">Read more →</span></div><figcaption>Light</figcaption></figure>
<figure class="mock" style="--b:#191714;--f:#ece6dc;--m:#a59c8f;--a:#f0a46c;--l:#33302a;font-family:Charter,'Bitstream Charter','Sitka Text',Cambria,Georgia,serif"><div class="bar"><b>My Site</b><span>Blog · About</span></div><div class="body"><strong>Why speed matters</strong><span class="meta">Oct 20 · 4 min read</span><span>Fast pages rank better and convert better.</span><span class="link">Read more →</span></div><figcaption>Dark</figcaption></figure>
</div>
<h2>Paper</h2>
<p>A calm serif reading theme on warm paper tones, with a narrow column and card-style post lists. Made for essays and long-form blogs.</p>
<p class="tags"><span>npm</span><span>Serif</span><span>Light + dark</span></p>
<p><code>npm i velocita-theme-paper</code> · <a href="https://www.npmjs.com/package/velocita-theme-paper" rel="noopener">npm page</a></p>
</article>

</div>

## Use a theme

```bash
npm install velocita-theme-paper
```

```js
// velocita.config.js
export default {
  theme: 'velocita-theme-paper',
  // Anything you set here overrides the theme's defaults.
};
```

The previews above use each theme's real colors and fonts. Theme CSS is inlined like the default theme's, so switching themes never adds a render-blocking request.

## Publish your own

1. Export a plain object `{ name, config, css, layouts }` from your package's `index.js`. See the [themes guide](/docs/themes/) for every field.
2. Name the package `velocita-theme-<name>` and add the `velocita-theme` keyword.
3. Check that a site using it still passes `velocita audit` and `velocita check`.
4. Publish it to npm, then [open an issue on GitHub](https://github.com/6t9xstar/velocita/issues/new?title=Theme%20gallery%3A%20) to get it listed here.
