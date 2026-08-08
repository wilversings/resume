// Writes the résumé PDF, the print-only block and its stylesheet into build/,
// before webpack runs. All three come from index.html's own DOM, so the page
// stays the single source of the résumé text.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { extractResume } = require('./extract-resume');
const {
  DOCUMENT_CSS,
  PDF_FILENAME,
  PAGE_MARGIN,
  renderBody,
  renderStandalone,
} = require('./resume-document');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'index.html');
const BUILD_DIR = path.join(ROOT, 'build');

// A scrape is only as good as its selectors: if index.html renames one, the
// build must fail rather than ship a résumé that quietly lost a section.
function assertComplete(data) {
  const missing = [];
  if (!data.name) missing.push('name (.site-footer__brand)');
  if (!data.summary) missing.push('summary (.about__text)');
  if (!data.location) missing.push('location (.about__meta-item)');
  if (!data.education.length) missing.push('education (.about__meta-item)');
  if (!data.contacts.length) missing.push('contacts (.connect__card)');
  if (!data.skills.length) missing.push('skills (.skills__col)');
  if (!data.experience.length) missing.push('experience (.timeline__item)');
  if (!data.projects.length) missing.push('projects (.portfolio__card)');

  data.experience.forEach((job, i) => {
    if (!job.title || !job.org || !job.date) missing.push(`experience[${i}] title/org/date`);
  });
  data.skills.forEach((group, i) => {
    if (!group.title || !group.items.length) missing.push(`skills[${i}] title/items`);
  });

  if (missing.length) {
    throw new Error(
      `Résumé extraction found nothing for:\n  - ${missing.join('\n  - ')}\n` +
        'index.html changed shape — update scripts/extract-resume.js to match.'
    );
  }
}

// Printing the site itself looks terrible, and beforeprint can't be cancelled
// to substitute a document — so every print route gets the résumé instead.
// The hide-on-screen rule must precede the @media print block: both select
// .resume-doc at equal specificity, so whichever comes last wins in print too.
function renderPrintStylesheet() {
  return `.resume-doc { display: none; }

@media print {
  @page { margin: ${PAGE_MARGIN}; }

  html, body { margin: 0; background: #fff; }

  body > *:not(.resume-doc) { display: none !important; }

  .resume-doc { display: block; }

${DOCUMENT_CSS.replace(/^/gm, '  ')}
}`;
}

// Chrome's sandbox needs unprivileged user namespaces, which Ubuntu 24.04 —
// and so GitHub's ubuntu-latest — restricts by default. Only a local file from
// this repo is ever loaded, so falling back to an unsandboxed Chrome is safe.
async function launchBrowser() {
  try {
    return await puppeteer.launch();
  } catch (error) {
    console.warn(`Sandboxed Chrome failed to launch, retrying without it:\n${error.message}\n`);
    return puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
}

async function main() {
  const browser = await launchBrowser();
  let data;
  try {
    const page = await browser.newPage();
    await page.goto(`file://${SOURCE}`, { waitUntil: 'domcontentloaded' });

    data = await page.evaluate(extractResume);
    assertComplete(data);

    fs.mkdirSync(BUILD_DIR, { recursive: true });

    await page.setContent(renderStandalone(data), { waitUntil: 'load' });
    await page.pdf({
      path: path.join(BUILD_DIR, PDF_FILENAME),
      format: 'A4',
      printBackground: false,
      margin: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(BUILD_DIR, 'resume-print.html'), renderBody(data));
  fs.writeFileSync(path.join(BUILD_DIR, 'resume-print.css'), renderPrintStylesheet());

  console.log(`Résumé artifacts written to build/ (${PDF_FILENAME}, resume-print.html/.css)`);
}

// Full stack, not just the message: a headless-Chrome launch failure carries
// its cause in the browser's stderr, and CI logs are the only place it shows.
main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
