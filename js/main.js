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

// The open/close max-height only means anything for the mobile dropdown;
// applying it on desktop clips .nav__links to that inline height and throws
// off its vertical centering in the (non-collapsing) flex row.
const desktopBreakpoint = window.matchMedia('(min-width: 950.02px)');

function setNavLinksOpen(isOpen) {
  navLinks.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  if (desktopBreakpoint.matches) return;
  // Match max-height to the menu's real height (instead of an arbitrary cap)
  // so the open/close transition covers exactly the distance it animates.
  navLinks.style.maxHeight = isOpen ? `${navLinks.scrollHeight}px` : '0px';
}

navToggle.addEventListener('click', () => {
  setNavLinksOpen(!navLinks.classList.contains('is-open'));
});

// Drop any leftover inline height from the mobile dropdown once resizing
// crosses into the desktop breakpoint, where it no longer applies.
desktopBreakpoint.addEventListener('change', (event) => {
  if (!event.matches) return;
  setNavLinksOpen(false);
  navLinks.style.maxHeight = '';
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

// Native share — progressive enhancement, so the buttons only appear where
// navigator.share actually exists rather than opening a dead click.
document.querySelectorAll('[data-share-button]').forEach((button) => {
  if (!navigator.share) {
    button.closest('li')?.remove();
    return;
  }
  button.addEventListener('click', async () => {
    if (button === document.getElementById('navShareBtn')) {
      setNavLinksOpen(false);
    }
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  });
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
