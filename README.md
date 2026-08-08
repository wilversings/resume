# Empire Résumé

A single-page Art Deco résumé site (vanilla HTML/CSS/JS — see `AGENTS.md` for
source layout and design conventions).

## Build

Source files (`index.html`, `css/style.css`, `js/main.js`, `fonts/`) are
plain and unbundled. A webpack build packages them into a minified and
obfuscated production bundle in `dist/`.

```
npm install
npm run build
```

Output goes to `dist/` (hashed, minified CSS/HTML and Terser-minified,
javascript-obfuscator-obfuscated JS). Serve that folder to deploy, e.g.:

```
npx serve dist
```

## Develop

```
npm start
```

Runs a webpack-dev-server instance at `http://localhost:8080` with live
reload against the unminified source.

## Accessibility

Audited with [axe-core](https://github.com/dequelabs/axe-core) (`npm run a11y`), covering color contrast and screen-reader/ARIA structure in both themes:

| Theme | Score | Contrast violations | Screen reader/ARIA violations |
| ----- | ----- | -------------------- | ------------------------------- |
| Dark (default) | 100/100 | 0 | 0 |
| Light | 100/100 | 0 | 0 |
