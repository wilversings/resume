// The résumé document, shared verbatim by the standalone PDF and the print-only
// block injected into the page. Every selector is scoped under .resume-doc so
// one stylesheet serves both — see AGENTS.md, "The résumé".

const PDF_FILENAME = 'Marius-Aiordachioaei-Resume.pdf';
const DOC_TITLE = 'Marius Aiordăchioaei — Résumé';
const PAGE_MARGIN = '16mm';

const esc = (value) =>
  String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const bare = (url) => url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

// Deliberately undesigned: black on white, one column, a stock sans, no motifs.
// This is what applicant tracking systems can parse — see AGENTS.md.
const DOCUMENT_CSS = `
/* Injected into the live page, so it must not inherit the site's element
   resets — identical output from the PDF and from Ctrl+P depends on it. The
   reset's text-wrap: pretty alone moves line breaks by a word. */
.resume-doc,
.resume-doc *,
.resume-doc *::before,
.resume-doc *::after {
  box-sizing: content-box;
  text-wrap: wrap;
  letter-spacing: normal;
  word-spacing: normal;
  font-variant: normal;
  font-feature-settings: normal;
}

.resume-doc {
  font-family: Arial, Helvetica, "Liberation Sans", sans-serif;
  color: #000;
  background: #fff;
  font-size: 10.5pt;
  line-height: 1.4;
  text-align: left;
}
.resume-doc h1,
.resume-doc h2,
.resume-doc h3 { margin: 0; font-weight: bold; }
.resume-doc p,
.resume-doc ul { margin: 0 0 4pt; }
.resume-doc a { color: #000; text-decoration: none; }

.resume-doc h1 { font-size: 20pt; letter-spacing: 0.5pt; }
.resume-doc .role { font-size: 12pt; margin-bottom: 3pt; }
.resume-doc .contacts { margin-bottom: 12pt; }
.resume-doc .sep { padding: 0 5pt; }

.resume-doc h2 {
  font-size: 11pt;
  text-transform: uppercase;
  letter-spacing: 1pt;
  border-bottom: 1px solid #000;
  padding-bottom: 2pt;
  margin: 14pt 0 7pt;
}
.resume-doc h3 { font-size: 11pt; }
.resume-doc .meta { font-size: 10pt; }
.resume-doc .k { font-weight: bold; }

/* A CSS list marker is a painted glyph, not text — it never reaches the PDF's
   text layer, leaving a parser to infer bullets from indentation. Write it. */
.resume-doc ul { list-style: none; padding-left: 0; }
.resume-doc li { margin-bottom: 2pt; padding-left: 12pt; text-indent: -12pt; }
.resume-doc .bullet { padding-right: 5pt; }

/* Entries may split across pages — holding a whole job together strands a
   third of a page. Only headings and single bullets are kept whole. */
.resume-doc .entry { margin-bottom: 10pt; }
.resume-doc h2,
.resume-doc h3,
.resume-doc .meta { break-after: avoid; }
.resume-doc li { break-inside: avoid; }
`.trim();

function renderBody(data) {
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

  return `<div class="resume-doc">
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
</div>`;
}

function renderStandalone(data) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(DOC_TITLE)}</title>
<style>
body { margin: 0; }
${DOCUMENT_CSS}
</style>
</head>
<body>
${renderBody(data)}
</body>
</html>`;
}

module.exports = { DOCUMENT_CSS, DOC_TITLE, PDF_FILENAME, PAGE_MARGIN, renderBody, renderStandalone };
