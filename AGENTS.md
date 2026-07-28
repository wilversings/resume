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
                     portfolio, connect), dialog.css (the <dialog> modal),
                     rust.css (oxidized-metal text), sunburst.css
css/layout/            section-wrappers.css (.section, cornice), header.css
css/sections/          one file per <section> in index.html: hero, about,
                     timeline (shared by experience + education), portfolio,
                     skills, connect, footer
js/main.js           splash-screen hiding, mobile nav toggle, light-mode
                     toggle, scroll-spy nav highlighting, iframe-dialog
                     open/close
fonts/                all three families, self-hosted as woff2 — nothing
                     type-related depends on a system font being installed.
                     Monsante (--font-display, decoded from the mockups'
                     embedded base64 — see design/), Jost 400/700
                     (--font-nav, a Futura revival), Gelasio 400/700/italic
                     (--font-body, metric-compatible with Georgia). The two
                     added families are SIL OFL; their licences ship
                     alongside them and must stay there.
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
- `design/og-image.svg` — source for the `images/og-image.png` social card

These mockups predate a lot of the live site and are now stale in several
places (see the skills-section example below) — don't treat them as
authoritative, and don't feel obligated to design new work from them or
reconcile the live page back to them. They're still useful as a source for
the established Art Deco motifs (sunburst, ziggurat cornice, chamfered
plaques, corner brackets, diamond bullets, flanking flourishes) and the
shared sprite symbols in `index.html` — reuse those symbols rather than
inventing new decorative shapes when a change calls for this motif language. Where the live page and a mockup disagree, that's not
automatically a bug — use judgment on whether the live page's evolution was
intentional.

The live sprite defines `#icon-flourish`, `#icon-ziggurat`, `#icon-corner`,
`#icon-diamond`, `#icon-ext-link` and the two button plaque frames
`#btn-frame` / `#btn-frame-wide`. The sunburst is *not* a sprite symbol:
it's built from `repeating-conic-gradient` wedges in
`css/components/sunburst.css`.

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
  patterns) — plain CSS variables can't reach into them. There are three
  patterns in use; copy whichever fits a new asset:
  - **Recolor via filter** (most cases): a
    `:root[data-theme="light"] <selector> { filter: url(#accentTint); }`
    override colocated with the element's own rule. `#accentTint` is
    defined in `index.html`'s sprite `<defs>` and floods the shape with
    `--accent-strong`, masked to its own alpha. It reads the token live,
    so it tracks `tokens.css`, and because filters apply to final rendered
    pixels it works on external `background-image` assets too, not just
    inline SVG. See `shared.css`, `hero.css`, `section-wrappers.css`,
    `footer.css`.
  - **Swap the asset**: the hero monument points `--monument-image` at a
    dedicated `hero-monument-light.svg`, because its "window" cutouts need
    filling with the light-mode surface color, not uniformly recoloring.
  - **Drop the effect**: `.text-rust` (`rust.css`) abandons the
    background-clip trick entirely for flat `--accent-strong` text — the
    baked oxidation doesn't survive a flat recolor.
- When picking a light-mode color for text, check it actually clears
  WCAG AA (4.5:1) against the light surface. The dark-mode gold does not —
  which is why light mode uses a **deeper antique-brass** (`--accent-light`
  / `--accent-strong-light`) rather than the dark theme's own gold. Note
  it stays gold: don't "simplify" light-mode accents to navy, which is
  reserved for `--ink` and the monument silhouette so the two keep reading
  as distinct layers.

### 5. Comments describe the code, not the change that produced it

Write for someone reading this file for the first time, who has never seen
any previous version of it. **Ideally one line; three is the hard maximum**,
including file-header blocks. If you can't say it in three lines, the code
needs the clarification, not the comment.

Never leave historical narrative. No "this used to be…", "an earlier version
did…", "this was 14px, which meant…", "changed from X because Y", no
before/after measurements, and no justifying the edit you just made. That
belongs in the commit message, where it's attached to the diff it explains
and doesn't rot. In the source it's dead weight: it describes code that no
longer exists, and it grows every time someone touches the file.

What earns a comment is a **non-obvious constraint that would otherwise get
"fixed" back into a bug** — the reason a rule can't be written the naive way.
Compare:

```css
/* BAD — narrates the edit, five lines, all of it about the past */
/* --fs-body was 14px, i.e. *below* the 16px --fs-sm that nav, buttons and
   footer links use — so the prose was the smallest text on a page whose
   whole job is to be read, and the chrome outranked the content. Body is
   16px now. --fs-sm keeps its own value but is never allowed above
   --fs-body again. */

/* GOOD — states the rule that must keep holding */
/* --fs-sm (UI text) must never exceed --fs-body, or chrome outranks copy. */
```

Don't comment what the declaration already says (`/* 12px gold text */`
above `font-size: 12px; color: var(--gold);` earns nothing). Do keep the
`/* ===== Section ===== */` banners — they're navigation, not narration.

### 6. When a change contradicts this file, update this file in the same commit

This document only works if it describes the code as it actually is. A rule
that has quietly gone false is worse than no rule: the next agent follows it
and writes something broken. This has already happened here — rule 4 spent
several revisions telling agents to use a `#navyTint` filter that doesn't
exist, and to make light-mode accents navy when the code deliberately keeps
them gold.

So: **if your change makes anything here inaccurate, fix it as part of the
same change** — not as a follow-up, not as a TODO. This is not optional
tidying, and it applies whether the drift is a rule, a code example, an
identifier, or the file tree above.

- Renamed or removed something this file names (a token, filter, sprite
  symbol, class, file)? Grep this file for the old name and update it.
- Changed *why* a rule exists, or made it obsolete? Rewrite or delete the
  rule. Don't leave it standing with a stale justification.
- Added a convention worth following (a new pattern, a constraint that bit
  you)? Add it here, subject to rule 5 — concise, about the code as it
  stands, not a changelog of how it got here.
- If you're unsure whether a rule still holds, verify it against the source
  rather than assuming. Facts here are checkable; check them.

Rule 5 governs source comments. This rule is its counterpart: durable
project-level context belongs *here*, where it's maintained, rather than
accreting in the source files as narrative.

### 7. Define an SVG shape once — reuse it, don't paste it

Decorative shapes live in the sprite `<defs>` at the top of `index.html` and
are instantiated with `<use href="#icon-…">`. **Never copy SVG path data
into a second place in the markup.** A pasted copy is a shape that will
drift: the next edit fixes one instance and silently leaves the others
wrong, and nothing about the markup makes those other copies discoverable.

This matters more here than in most codebases because the geometry is
genuinely hard to re-derive — the chamfered plaque frames encode the
corrected inner-chamfer erosion described in the conventions section below,
and an eyeballed copy reintroduces a bug that's already been fixed twice.

- Adding a decorative shape used more than once? Put a `<symbol>` in the
  sprite and reference it. Don't inline it twice and plan to unify later.
- Editing a shape? Fix the `<symbol>`, then confirm no hand-pasted copy of
  the same geometry is still lying around (`grep` for a distinctive path
  substring — the sprite is the only place that data should appear).
- Mind rule 1's `<use>`/viewBox gotcha: if the symbol's `viewBox` doesn't
  start at `0 0`, the `<use>` needs explicit `x`/`y`/`width`/`height`.
- A genuinely single-use icon (the theme-toggle sun, the nav hamburger, the
  dialog close X, the hero scroll chevron) may stay inline — one use is not
  duplication. Promote it to the sprite the moment a second use appears.

**Styling `<use>` content:** CSS selectors do not cross into a `<use>` shadow
tree, so `.btn--outline .btn__plate-ring { … }` matches nothing. Only
inherited values get in. Symbols therefore either hardcode their paint
(`#icon-ziggurat`) or read custom properties the caller sets — `#btn-frame`
takes `--btn-plate-fill`, `--btn-plate-filter`, `--btn-clean-opacity`,
`--btn-ring-fill`, `--btn-ring-filter`, `--btn-molding-fill` and
`--btn-molding-opacity`, which `.btn--solid` / `.btn--outline` redefine in
`css/components/buttons.css`. Skin a variant there; don't add classes inside
the symbol.

**Two button frames, not three sizes:** `.btn` (184x46) and the
`.portfolio__action` miniature (144x36) are both 4:1, so one `#btn-frame`
covers both — the browser scales every point by the same 78.26% the
miniature was hand-authored at. Only `#btn-frame-wide` (320x46) is a second
shape, because it keeps the 8px chamfer and lengthens only the straight
edges. Don't stretch one symbol across both aspect ratios: the chamfers
would shear.

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
- Desktop sections share one three-column module: they span
  `--content-width` and divide it with `--grid-gutter`. Portfolio, skills
  and connect are literal `repeat(3, 1fr)` grids; the timeline divides the
  same module 1 + 2 (date rail, then card). A section may use a different
  column *count* — About is 2-up — but it should still start and end on the
  content-width edges, and any internal division should land on a module
  line. Don't give a grid its own gutter value; that's what left the three
  grids at 40/56/30px with no shared column line.
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
7. Re-read any comment you added or touched: three lines maximum, and
   nothing in it about how the code used to be — see rule 5.
8. Check whether your change contradicts anything in this file — names,
   examples, the file tree, a rule's rationale — and update it here in the
   same commit if so, per rule 6.
9. If you added or edited an SVG shape, confirm its path data appears in
   exactly one place — the sprite `<defs>` — per rule 7.
