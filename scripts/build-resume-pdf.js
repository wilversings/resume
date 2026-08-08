// Renders index.html's content as a plain, single-column A4 PDF for the hero's
// Résumé download button. The output deliberately drops every Art Deco motif:
// applicant tracking systems read the text layer, and columns, graphics and
// decorative glyphs are what make that text come out scrambled.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { extractResume } = require('./extract-resume');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'index.html');
const OUT_DIR = path.resolve(ROOT, process.argv[2] || 'dist');
// The button opens this in a tab rather than downloading, so the file's own
// name is what a reader saves it as. index.html links it by name — keep both.
const OUT_FILE = path.join(OUT_DIR, 'Marius-Aiordachioaei-Resume.pdf');
const DOC_TITLE = 'Marius Aiordăchioaei — Résumé';

const esc = (value) =>
  String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const bare = (url) => url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

// A scrape is only as good as its selectors: if index.html renames one, the PDF
// must fail the build rather than ship a résumé that quietly lost a section.
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

function renderDocument(data) {
  const contactLine = [
    esc(data.location),
    ...data.contacts.map((c) => `<a href="${esc(c.href)}">${esc(c.value)}</a>`),
  ].join('<span class="sep">|</span>');

  const skills = data.skills
    .map(
      (group) =>
        `<p class="kv"><span class="k">${esc(group.title)}:</span> ${esc(group.items.join(', '))}</p>`
    )
    .join('\n');

  const experience = data.experience
    .map(
      (job) => `<article class="entry">
  <h3>${esc(job.title)}</h3>
  <p class="meta">${esc(job.org)}<span class="sep">|</span>${esc(job.date)}</p>
  ${job.desc ? `<p>${esc(job.desc)}</p>` : ''}
  ${job.points.length ? `<ul>${job.points.map((p) => `<li><span class="bullet">&#8226;</span>${esc(p)}</li>`).join('')}</ul>` : ''}
  ${job.stack.length ? `<p class="kv"><span class="k">Technologies:</span> ${esc(job.stack.join(', '))}</p>` : ''}
</article>`
    )
    .join('\n');

  const projects = data.projects
    .map(
      (project) => `<article class="entry">
  <h3>${esc(project.title)}</h3>
  <p class="meta">${esc(project.category)}${project.href ? `<span class="sep">|</span><a href="${esc(project.href)}">${esc(bare(project.href))}</a>` : ''}</p>
  ${project.desc ? `<p>${esc(project.desc)}</p>` : ''}
  ${project.stat ? `<p>${esc(project.stat)}</p>` : ''}
  ${project.stack.length ? `<p class="kv"><span class="k">Technologies:</span> ${esc(project.stack.join(', '))}</p>` : ''}
</article>`
    )
    .join('\n');

  const education = `<article class="entry">
  <h3>${esc(data.education[0])}</h3>
  ${data.education[1] ? `<p class="meta">${esc(data.education.slice(1).join(', '))}</p>` : ''}
</article>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(DOC_TITLE)}</title>
<style>
  /* Widely-installed sans stacks only — an embedded webfont is one more thing
     between a parser and the text layer, and buys nothing on a plain document. */
  html { font-family: Arial, Helvetica, "Liberation Sans", sans-serif; }
  body { margin: 0; color: #000; background: #fff; font-size: 10.5pt; line-height: 1.4; }
  h1, h2, h3 { margin: 0; }
  p, ul { margin: 0 0 4pt; }
  a { color: #000; text-decoration: none; }

  h1 { font-size: 20pt; letter-spacing: 0.5pt; }
  .role { font-size: 12pt; margin-bottom: 3pt; }
  .contacts { margin-bottom: 12pt; }
  .sep { padding: 0 5pt; }

  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 1pt;
    border-bottom: 1px solid #000;
    padding-bottom: 2pt;
    margin: 14pt 0 7pt;
  }
  h3 { font-size: 11pt; }
  .meta { font-size: 10pt; }
  .k { font-weight: bold; }

  /* A CSS list marker is painted glyph, not text — it never reaches the PDF's
     text layer, leaving a parser to infer bullets from indentation. Write it. */
  ul { list-style: none; padding-left: 0; }
  li { margin-bottom: 2pt; padding-left: 12pt; text-indent: -12pt; }
  .bullet { padding-right: 5pt; }

  /* Entries may split across pages — holding a whole job together strands
     a third of a page. Only headings and single bullets are kept whole. */
  .entry { margin-bottom: 10pt; }
  h2, h3, .meta { break-after: avoid; }
  li { break-inside: avoid; }
</style>
</head>
<body>
  <header>
    <h1>${esc(data.name)}</h1>
    <p class="role">${esc(data.experience[0].title)}</p>
    <p class="contacts">${contactLine}</p>
  </header>

  <section>
    <h2>Summary</h2>
    <p>${esc(data.summary)}</p>
  </section>

  <section>
    <h2>Skills</h2>
    ${skills}
  </section>

  <section>
    <h2>Experience</h2>
    ${experience}
  </section>

  <section>
    <h2>Projects</h2>
    ${projects}
  </section>

  <section>
    <h2>Education</h2>
    ${education}
  </section>
</body>
</html>`;
}

async function main() {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${SOURCE}`, { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate(extractResume);
    assertComplete(data);

    await page.setContent(renderDocument(data), { waitUntil: 'load' });

    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.pdf({
      path: OUT_FILE,
      format: 'A4',
      printBackground: false,
      margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' },
    });
  } finally {
    await browser.close();
  }

  console.log(`Résumé PDF written to ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
