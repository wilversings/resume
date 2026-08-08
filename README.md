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

## Accessibility audit

```
npm run a11y
```

Builds the production bundle, then runs [axe-core](https://github.com/dequelabs/axe-core)
(via Puppeteer) against `dist/index.html` twice — once in dark, the site's
default theme, and once in light, the header toggle's theme — since color
contrast only evaluates against whatever's actually rendered. Each run
prints a pass/violation score plus two breakdowns: `color-contrast` rule
violations (contrast), and everything else (labels, landmarks, ARIA — the
structural checks a screen reader depends on). A full machine-readable
report is written to `a11y-report.json` (gitignored).

Automated checks only catch what's mechanically detectable — they're not a
substitute for testing with a real screen reader (NVDA, VoiceOver).

Latest results (Chromium via Puppeteer, 1280×900 viewport):

| Theme | Score | Contrast violations | Other (screen reader/ARIA) violations |
| ----- | ----- | -------------------- | -------------------------------------- |
| Dark (default) | 97/100 | 0 | 1 |
| Light | 97/100 | 0 | 1 |

Both themes pass every `color-contrast` check. The one recurring finding
(moderate, both themes) is `region`: most of the page's content sits
outside any landmark region — the site has no `<main>` (or equivalent
`role="main"`) wrapping the sections between the header and footer, so
screen reader users lose the "skip to main content" / landmark-navigation
shortcut. Worth addressing separately.
