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
css/style.css        entry point only — @imports every partial below, in
                     cascade order. Don't add rules directly to this file.
css/base/             tokens.css (CSS custom properties + @font-face),
                     reset.css (browser-default normalization)
css/components/       reusable pieces referenced from more than one section:
                     splash.css, shared.css (icons/corners), section-
                     heading.css, buttons.css (.btn — used in hero,
                     portfolio, connect)
css/layout/            section-wrappers.css (.section, cornice), header.css
css/sections/          one file per <section> in index.html: hero, about,
                     timeline (shared by experience + education), portfolio,
                     skills, connect, footer
js/main.js           splash-screen removal, mobile nav toggle, scroll-spy
                     nav highlighting
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

### 1. Design fidelity — `design/` is historical reference, not a spec to match

- `design/empire-full-page-mockup.svg` — desktop layout (1440 viewBox width)
- `design/empire-mobile-mockup.svg` — mobile layout (390 viewBox width)
- `design/plaque.svg` — reference for the crown/plaque emblem geometry

These mockups predate a lot of the live site and are now stale in several
places (see the skills-section example below) — don't treat them as
authoritative, and don't feel obligated to design new work from them or
reconcile the live page back to them. They're still useful as a source for
the established Art Deco motifs (sunburst, ziggurat cornice, chamfered
plaques, corner brackets, diamond bullets, flanking flourishes) and the
shared sprite symbols in `index.html` (`#icon-sunburst`, `#icon-flourish`,
`#icon-ziggurat`, `#icon-corner`, `#icon-diamond`) — reuse those symbols
rather than inventing new decorative shapes when a change calls for this
motif language. Where the live page and a mockup disagree, that's not
automatically a bug — use judgment on whether the live page's evolution was
intentional.

**Example — the skills section.** The mockups still show the original
percentage bars. Those were removed on purpose (self-rated "90%" bars read
as unfalsifiable), first for chamfered chips and now for medallion bubbles
sized by emphasis. The live page is correct here and the mockup is simply
outdated; don't "restore" the bars.

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

### 4. Every change must work in both dark and light mode

The site is designed dark-first — light mode is an accessibility opt-in,
off by default regardless of OS/browser `prefers-color-scheme`, toggled by
the sun icon button in the header (`.theme-toggle` in `index.html`/
`header.css`). `js/main.js` sets `data-theme="light"` on `<html>` and
remembers the choice in `localStorage`; there's an inline script in
`<head>` that re-applies it before first paint. This does not make light
mode optional to maintain: **any visual change must be checked in both
modes before it's done**, not just the mode you happened to be looking at.

- Reach for the semantic tokens in `css/base/tokens.css` — `--surface`,
  `--surface-alt`, `--ink`, `--ink-muted`, `--accent`, `--accent-strong` —
  for anything that should repaint between themes (section/card
  backgrounds, body text, headings/links/labels). They default to the
  dark palette and are overridden under `:root[data-theme="light"]`.
- The raw palette (`--navy-dark`, `--gold`, `--gold-bright`, `--cream`,
  `--bronze`, etc.) never changes with theme. It's what a few spots
  deliberately keep using instead of the semantic tokens: gold-plated
  badges/buttons (`.btn--solid`, `.portfolio__num`, `.connect__card`,
  `.skill-bubble`) pair a literal gold plate with `--on-accent` (a fixed
  dark ink) so their text stays legible regardless of theme. Don't
  "fix" these onto the semantic tokens — that's what breaks their
  contrast in light mode.
- Some decorative elements are baked gold/rust SVG assets or hardcoded
  presentation attributes inside `<use>`-referenced sprite symbols
  (`icon-flourish`, the ziggurat cornices, the hero/footer wallpaper
  patterns) — plain CSS variables can't reach into them. These get a
  `:root[data-theme="light"] <selector> { filter: url(#navyTint); }`
  override colocated with the element's own rule, using the shared
  `#navyTint` filter defined in `index.html`'s sprite `<defs>` (floods the
  shape with navy, masked to its own alpha). The hero monument instead
  swaps to a dedicated `hero-monument-light.svg` via the `--monument-image`
  token, because its "window" cutouts need to be filled with the
  light-mode surface color, not just uniformly recolored — copy whichever
  pattern fits a new asset.
- When picking a light-mode color for text, check it actually clears
  WCAG AA (4.5:1) against the light surface — the dark-mode gold does
  not, which is why light mode's accent color is navy ink instead of a
  gold variant.

## Design tokens & conventions already in place

- Colors, gradients, and font stacks are CSS custom properties in
  `css/base/tokens.css` (`--navy-dark`, `--gold`, `--gold-bright`, `--cream`,
  `--gradient-metal-shine`, `--font-display`, `--font-body`, etc.) — reuse
  them, don't hardcode new color values.
- CSS is split into partials under `css/`, all pulled in by `css/style.css`
  — see the file tree above for what lives where. Add new rules to the
  partial that already owns that selector/section rather than growing
  `style.css` itself or creating a stray new file; if a rule is shared by
  more than one section (like `.btn`), it belongs in `css/components/`.
- Class naming is loosely BEM (`.timeline__item`, `.btn--outline`).
- Chamfered "plaque" borders (buttons, connect cards) are deliberately
  *not* CSS `border` + `clip-path` — a clipped rectangular border strokes
  only the box's straight edges and drops the diagonal corners entirely.
  They're built as either an SVG evenodd ring (fixed-size elements, e.g.
  buttons) or two stacked `clip-path` layers with a geometrically corrected
  inner chamfer (fluid-width elements, e.g. connect cards) — see the
  comments above `.btn` in `css/components/buttons.css` and
  `.connect__card` in `css/sections/connect.css` before changing either
  pattern, the naive version reintroduces a bug that's been fixed twice
  already.

## Before calling a change done

1. Serve the site locally and load it in a browser.
2. Check both the desktop (~1440px) and mobile (~390px) viewport widths
   render cleanly.
3. Click the header's light-mode toggle and check the change in both
   modes — see rule 4.
4. Check the browser console for errors/warnings.
5. Tab through any new/changed interactive elements keyboard-only.
6. If you changed decorative SVG or icon-only controls, re-check
   `aria-hidden`/`aria-label` coverage per rule 3.
