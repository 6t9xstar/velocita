# Layouts

> Layouts are plain JavaScript functions. Override the page shell, posts, lists or add your own with helper functions.

## A layout is a function

```js
// layouts/post.js
export default ({ page, site, articles, h }) => `
  <article>
    <h1>${h.escape(page.title)}</h1>
    ${page.html}
  </article>`;
```

Files in `layouts/` replace the built-in `page`, `post`, `list`, `search` and `notFound` layouts, or add new ones you choose with `layout:` in frontmatter.

## Helpers

| Helper | Use |
|---|---|
| `h.escape(text)` | Escape text for HTML |
| `h.date(date, lang)` | Accessible `<time>` element |
| `h.pager(page.pagination)` | Pagination links |
| `h.css(extra)` | Base theme CSS plus yours, minified |

## The shell

`layouts/shell.js` controls the whole document. This website uses a custom shell for its header and footer.

See [SEO and AI search](/docs/seo/) for what goes into `<head>` automatically.
