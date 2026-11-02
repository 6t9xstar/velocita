# Islands and search

> Add interactive components that load only where and when they are needed, and use the built-in search page.

## Write an island

```js
// islands/counter.js
export default function counter(el, { start = 0 }) {
  el.innerHTML = '<button>0</button>';
}
```

## Use it in Markdown

```html
<v-island name="counter" load="visible" props='{"start":3}'>Fallback HTML</v-island>
```

| `load` | Loads when |
|---|---|
| `visible` | It scrolls into view (default) |
| `idle` | The browser is idle |
| `interaction` | First hover, focus or touch |
| `load` | Immediately |

Only pages with an island get the small loader. The install box and the live performance meter on the [home page](/) are islands.

## Search

`/search/` is generated for every language. It is a small island over a prebuilt index, so it needs no server or third-party service.

Next: [multilingual sites](/docs/i18n/).
