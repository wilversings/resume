# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

A single-page, Art Deco–themed résumé/portfolio site. **Vanilla HTML/CSS/JS
only** — no framework, no package manager beyond the build tooling below.
Every source file is hand-written; there's no app framework or client-side
dependency graph to reason about.

A webpack build (`package.json`, `webpack.config.js`) exists to package the
source into a minified/obfuscated `dist/` for deployment — see "Running it
locally" and `README.md`. It's output packaging only: don't add framework
code or client-side dependencies to solve a problem plain HTML/CSS/JS
already solves.

```
index.html          all markup: nav, hero, about, experience, education,
                     portfolio, skills, connect, footer, plus a shared SVG
                     sprite (<svg class="sprite">) of decorative shapes
css/style.css        all styling — design tokens live as CSS custom
                     properties at the top of the file
js/main.js           splash-screen removal, mobile nav toggle, scroll-spy
                     nav highlighting, skill-bar reveal animation
fonts/                Monsante-Regular.otf (decorative display font, decoded
                     from the mockups' embedded base64 — see design/)
design/               source-of-truth mockups (see "Design fidelity" below)
```

Keep it this way. Don't introduce a framework or extra client-side
dependencies to solve a problem that plain HTML/CSS/JS already solves.

## Running it locally

`index.html` no longer links `css/style.css` / `js/main.js` directly —
webpack injects the bundled, hashed equivalents — so serving the repo root
raw (e.g. `python3 -m http.server`) will load unstyled and without JS. Use:

```
npm install
npm start
```

for a live-reloading dev server (`http://localhost:8080`), or

```
npm run build
```

to produce the minified/obfuscated `dist/`, then serve that folder (e.g.
`npx serve dist`) for verification against the mockups.

## Non-negotiable rules

### 1. Design fidelity — `design/` is the source of truth

- `design/empire-full-page-mockup.svg` — desktop layout (1440 viewBox width)
- `design/empire-mobile-mockup.svg` — mobile layout (390 viewBox width)
- `design/plaque.svg` — reference for the crown/plaque emblem geometry

Any visual change (new section, restyled component, new breakpoint
behavior) must be checked against these SVGs, not designed from scratch.
Colors, gradients, type scale, spacing rhythm, and the Art Deco motifs
(sunburst, ziggurat cornice, chamfered plaques, corner brackets, diamond
bullets, flanking flourishes) are all defined there — reuse the shared
sprite symbols in `index.html` (`#icon-sunburst`, `#icon-flourish`,
`#icon-ziggurat`, `#icon-corner`, `#icon-diamond`) rather than inventing new
decorative shapes. If a mockup and the live page disagree and it's not
called out as an intentional deviation, the mockup wins.

When you add a `<use href="#icon-x">` referencing a symbol whose `viewBox`
doesn't start at `0 0`, give the `<use>` explicit `x`/`y`/`width`/`height`
matching that viewBox — otherwise the browser mismaps it (this has caused a
real, dramatically-oversized-and-mispositioned rendering bug here before).

### 2. Cross-browser support beats newer features

This must render and behave the same across current Chrome, Firefox,
Safari, and Edge. When a feature choice trades broad compatibility for a
newer/nicer API, take the broadly-supported one.

- Before using a CSS or JS feature you're not sure about, check it's
  **Baseline "Widely available"** (MDN / caniuse), not just "Newly
  available" or behind a flag.
- If you do use something with uneven support, it must **degrade
  gracefully** — no visual breakage, just a missing enhancement. E.g. the
  header's `backdrop-filter: blur(6px)` is fine specifically because losing
  the blur on an unsupported browser still leaves a legible, correctly
  colored nav bar — it's not load-bearing.
- Don't rely on vendor-prefixed-only APIs, experimental JS proposals, or
  anything needing a polyfill.
- SVG `<use>` and gradient inheritance through it, `clip-path` with
  `calc()`, and CSS `inset` are all fine (well-supported) — but test any
  new SVG structure specifically, since `<use>`/viewBox interactions are
  where this codebase has actually broken before (see rule 1's callout).
- Verify visually in more than one engine when you touch layout or paint-
  heavy CSS (clip-path, gradients, custom fonts) — a Chromium screenshot
  passing is necessary but not sufficient.

### 3. Accessibility — proper ARIA, fully screen-reader usable

- Every purely decorative element (the sprite defs, sunburst, flourishes,
  ziggurat cornices, corner brackets, diamond bullets, the hero glow div)
  must be `aria-hidden="true"`. If you add a new decorative `<svg>` or
  `<use>` instance, hide it too — don't rely on it being visually subtle.
- Every icon-only interactive control needs an accessible name: use
  `aria-label` (see the mobile nav toggle, hero scroll-to-about link, and
  footer social icons for the existing pattern) when there's no visible
  text label.
- Keep the heading hierarchy intact: one `<h1>` (hero title), `<h2>` per
  section heading, `<h3>` for individual items/cards within a section.
  Don't skip levels or use headings for visual sizing alone.
- Don't suppress the focus outline (`outline: none`) without supplying a
  clearly visible replacement — none currently exists, so the browser
  default is doing that job; if you restyle focus, it must stay at least
  as visible.
- Respect `prefers-reduced-motion` for any new animation, the way the
  hero-scroll bob and sunburst spin already do.
- Interactive elements should be real `<a>`/`<button>` elements (as they
  are now), not `<div onclick>`, so they're keyboard-reachable and
  correctly announced by default.
- After a change touching structure or interactivity, tab through the page
  keyboard-only and confirm focus order is logical and every interactive
  element is reachable.

## Design tokens & conventions already in place

- Colors, gradients, and font stacks are CSS custom properties at the top
  of `css/style.css` (`--navy-dark`, `--gold`, `--gold-bright`, `--cream`,
  `--gradient-metal-shine`, `--font-display`, `--font-body`, etc.) — reuse
  them, don't hardcode new color values.
- Class naming is loosely BEM (`.timeline__item`, `.btn--outline`).
- Chamfered "plaque" borders (buttons, connect cards) are deliberately
  *not* CSS `border` + `clip-path` — a clipped rectangular border strokes
  only the box's straight edges and drops the diagonal corners entirely.
  They're built as either an SVG evenodd ring (fixed-size elements, e.g.
  buttons) or two stacked `clip-path` layers with a geometrically corrected
  inner chamfer (fluid-width elements, e.g. connect cards) — see the
  comments above `.btn` and `.connect__card` in `css/style.css` before
  changing either pattern, the naive version reintroduces a bug that's
  been fixed twice already.

## Before calling a change done

1. Serve the site locally and load it in a browser.
2. Check both the desktop (~1440px) and mobile (~390px) viewport widths
   against the corresponding `design/` mockup.
3. Check the browser console for errors/warnings.
4. Tab through any new/changed interactive elements keyboard-only.
5. If you changed decorative SVG or icon-only controls, re-check
   `aria-hidden`/`aria-label` coverage per rule 3.
