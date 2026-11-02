# Themes

> Install a theme from npm or write your own. A theme is a plain object with CSS, layouts and config defaults that your site can still override.

Browse the [theme gallery](/themes/) to see each theme in light and dark.

## Use a theme

```sh
npm install velocita-theme-paper
```

```js
// velocita.config.js
export default { theme: 'velocita-theme-paper' };
```

`theme` can be an npm package name, a local file (`'./themes/brand.js'`), an inline object, or an array of these. Later themes override earlier ones.

## What wins

| Setting | Order (last wins) |
|---|---|
| Config | Velocita defaults → theme `config` → your `velocita.config.js` |
| Layouts | built-in → theme `layouts` → your `layouts/` folder |
| CSS | built-in theme CSS → theme `css` → your `css` |

## Write a theme

A theme is a module whose default export is an object:

```js
export default {
  name: 'brand',
  config: { themeColor: '#9c3d10', og: { accent: '#9c3d10' } }, // defaults the site can override
  css: `:root{--accent:#9c3d10} body{font-family:Georgia,serif}`,
  layouts: {
    // Same signature as files in layouts/: { page, site, pages, articles, sections, tags, h }
    list: ({ page, site, h }) => `<h1>${h.escape(page.title)}</h1>
      <ul>${page.items.map(p => `<li><a href="${p.url}">${h.escape(p.title)}</a></li>`).join('')}</ul>
      ${h.pager(page.pagination)}`,
  },
  // shell: ({ page, site, head, content }) => '<!doctype html>…', // optional: replace the whole page shell
};
```

To share it, publish it to npm as `velocita-theme-<name>` with the `velocita-theme` keyword and `velocita` as a peer dependency. [`packages/velocita-theme-paper`](https://github.com/6t9xstar/velocita/tree/main/packages/velocita-theme-paper) is a complete example.

Layouts must escape user content with `h.escape`, and should keep pages free of scripts so the zero-JS guarantee and `velocita check` still hold.
