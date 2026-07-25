import '../css/style.css';

// Splash screen — hide once fonts + assets are ready (with a short
// minimum so it doesn't flash), so the Monsante font swap isn't visible.
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

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Light-mode toggle — dark is the default regardless of OS preference
// (see the tokens.css comment on [data-theme="light"]); this button and
// localStorage are the only way to opt into the light variant. The
// initial attribute (if any) is already applied by the inline script in
// <head>, so this just keeps the button's own state in sync with it and
// handles clicks.
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
