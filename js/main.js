import '../css/style.css';

// Splash screen — hide once fonts + assets are ready (with a short minimum
// so it doesn't flash), so the Monsante font swap isn't visible.
const splash = document.getElementById('splash');

function hideSplash() {
  if (splash) splash.classList.add('is-hidden');
}

window.addEventListener('load', () => {
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minDisplay = new Promise((resolve) => setTimeout(resolve, 500));
  Promise.all([fontsReady, minDisplay]).then(hideSplash);
});

// Safety net: never let the splash trap the page if something stalls.
setTimeout(hideSplash, 4000);

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function setNavLinksOpen(isOpen) {
  navLinks.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  // Match max-height to the menu's real height (instead of an arbitrary cap)
  // so the open/close transition covers exactly the distance it animates.
  navLinks.style.maxHeight = isOpen ? `${navLinks.scrollHeight}px` : '0px';
}

navToggle.addEventListener('click', () => {
  setNavLinksOpen(!navLinks.classList.contains('is-open'));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setNavLinksOpen(false);
  });
});

document.addEventListener('click', (event) => {
  if (!navLinks.classList.contains('is-open')) return;
  if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
  setNavLinksOpen(false);
});

// Light-mode toggle — dark is the default regardless of OS preference (see
// the tokens.css comment on [data-theme="light"]). The initial attribute is
// already applied by the inline script in <head>; this only handles clicks.
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function syncThemeToggle() {
  const isLight = root.getAttribute('data-theme') === 'light';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', isLight ? 'Turn off light mode' : 'Turn on light mode');
}

themeToggle.addEventListener('click', () => {
  const isLight = root.getAttribute('data-theme') === 'light';
  if (isLight) {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', 'light');
  }
  try {
    localStorage.setItem('theme', isLight ? 'dark' : 'light');
  } catch (e) {}
  syncThemeToggle();
});

syncThemeToggle();

// Highlight the nav link for the section currently in view
const sections = document.querySelectorAll('section[id]');
const navLinkByHash = new Map(
  Array.from(navLinks.querySelectorAll('a')).map((a) => [a.getAttribute('href'), a])
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navLinkByHash.get(`#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.querySelectorAll('a').forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px' }
);

sections.forEach((section) => sectionObserver.observe(section));

function buildEmbedThemeParams() {
  const style = getComputedStyle(root);
  const cssVar = (name) => style.getPropertyValue(name).trim();
  return new URLSearchParams({
    theme: root.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
    primaryLight: cssVar('--accent-light'),
    secondaryLight: cssVar('--accent-strong-light'),
    primaryDark: cssVar('--accent-dark'),
    secondaryDark: cssVar('--accent-strong-dark'),
  });
}

document.querySelectorAll('[data-dialog-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (!dialog) return;
    const iframe = dialog.querySelector('iframe[data-src]');
    if (iframe) iframe.src = `${iframe.dataset.src}?${buildEmbedThemeParams()}`;
    dialog.showModal();
  });
});

// A drag on the native resize handle ends in a click on the backdrop, and a
// grab slightly outside the border does too — so ignore clicks that resized
// the dialog or landed within grabMargin of its box.
function closeOnBackdropClick(dialog) {
  const grabMargin = 16;
  let resized = false;

  new ResizeObserver(() => {
    resized = true;
  }).observe(dialog);

  dialog.addEventListener('mousedown', () => {
    resized = false;
  });

  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    if (resized) return;

    const rect = dialog.getBoundingClientRect();
    const nearOrInsideBox =
      event.clientX >= rect.left - grabMargin &&
      event.clientX <= rect.right + grabMargin &&
      event.clientY >= rect.top - grabMargin &&
      event.clientY <= rect.bottom + grabMargin;
    if (nearOrInsideBox) return;

    dialog.close();
  });
}

// Maxwell's KDE Store stat — best-effort enhancement: fetch the listing's
// love/fan count and round it down to the nearest thousand. The store's API
// contract isn't publicly documented, so this checks a few plausible field
// names and leaves the static fallback text alone on any failure (unknown
// field, CORS, network) rather than risk showing a made-up number.
const loveStat = document.getElementById('maxwellLoveStat');
if (loveStat) {
  const contentId = loveStat.dataset.kdeContentId;
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), 5000);

  fetch(`https://store.kde.org/ocs/v1/content/data/${contentId}?format=json`, {
    signal: controller.signal,
  })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
    .then((json) => {
      const data = json && json.ocs && json.ocs.data;
      const candidateKeys = [
        'fans', 'fans_count', 'loves', 'love', 'likes',
        'hearts', 'hearts_count', 'favourites', 'favorites',
      ];
      const rawCount = candidateKeys
        .map((key) => data && data[key])
        .find((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)));
      if (rawCount === undefined) return;

      const thousands = Math.floor(Number(rawCount) / 1000) * 1000;
      if (thousands < 1000) return;

      loveStat.innerHTML = `<strong>${thousands.toLocaleString('en-US')}+</strong> loves on the KDE Store`;
    })
    .catch(() => {})
    .finally(() => clearTimeout(abortTimer));
}

document.querySelectorAll('.iframe-dialog').forEach((dialog) => {
  dialog.querySelectorAll('[data-dialog-close]').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => dialog.close());
  });

  closeOnBackdropClick(dialog);

  dialog.addEventListener('close', () => {
    const iframe = dialog.querySelector('iframe[data-src]');
    if (iframe) iframe.removeAttribute('src');
  });
});
