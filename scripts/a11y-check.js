// Runs axe-core against the production build in both themes (dark is the
// site default, light is opt-in via the header toggle — see js/main.js) and
// prints a contrast-focused report plus a broader screen-reader/ARIA report.
// Chrome only ever renders a local file from this repo, so an unsandboxed
// fallback (see build-resume.js) is safe here too.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html');
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const THEMES = [
  { key: 'dark', label: 'Dark (default)', attr: null },
  { key: 'light', label: 'Light', attr: 'light' },
];

async function launchBrowser() {
  try {
    return await puppeteer.launch();
  } catch (error) {
    console.warn(`Sandboxed Chrome failed to launch, retrying without it:\n${error.message}\n`);
    return puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
}

async function auditTheme(browser, theme) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`file://${DIST_INDEX}`, { waitUntil: 'networkidle0' });
  // Without this, axe occasionally samples the page mid-font-swap, which has
  // been observed to make rule evaluation (e.g. landmark-one-main) flaky.
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));

  if (theme.attr) {
    await page.evaluate((attr) => {
      document.documentElement.setAttribute('data-theme', attr);
    }, theme.attr);
  }

  await page.evaluate(AXE_SOURCE);
  const results = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations', 'passes'] }));
  await page.close();
  return results;
}

// axe doesn't emit a single score, so this approximates the Lighthouse-style
// "percent of checks passed" from pass/violation *rule* counts (not node
// counts, so one bad element doesn't outweigh an otherwise-clean rule set).
function scoreFor(results) {
  const passed = results.passes.length;
  const failed = results.violations.length;
  const total = passed + failed;
  return total === 0 ? 100 : Math.round((passed / total) * 100);
}

function isContrastRule(id) {
  return id === 'color-contrast' || id === 'color-contrast-enhanced';
}

function formatViolation(violation) {
  const lines = [`  - [${violation.impact}] ${violation.id}: ${violation.help}`];
  violation.nodes.forEach((node) => {
    const target = node.target.join(' ');
    const summary = node.failureSummary ? node.failureSummary.replace(/\n/g, ' ') : '';
    lines.push(`      ${target}${summary ? ` — ${summary}` : ''}`);
  });
  return lines.join('\n');
}

async function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error('dist/index.html is missing — run `npm run build` first.');
  }

  const browser = await launchBrowser();
  const report = { generatedAt: new Date().toISOString(), themes: {} };

  try {
    for (const theme of THEMES) {
      console.log(`\n=== ${theme.label} theme ===`);
      const results = await auditTheme(browser, theme);
      const contrastViolations = results.violations.filter((v) => isContrastRule(v.id));
      const otherViolations = results.violations.filter((v) => !isContrastRule(v.id));

      report.themes[theme.key] = {
        label: theme.label,
        score: scoreFor(results),
        passes: results.passes.length,
        violations: results.violations.length,
        contrastViolations: contrastViolations.length,
        otherViolations: otherViolations.length,
        details: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })),
        })),
      };

      console.log(`Score: ${report.themes[theme.key].score}/100`);
      console.log(`Passed rules: ${results.passes.length}, Violated rules: ${results.violations.length}`);

      console.log(`\nContrast (color-contrast): ${contrastViolations.length} violation(s)`);
      contrastViolations.forEach((v) => console.log(formatViolation(v)));

      console.log(`\nScreen reader / ARIA / semantics: ${otherViolations.length} violation(s)`);
      otherViolations.forEach((v) => console.log(formatViolation(v)));
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(ROOT, 'a11y-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report written to ${path.relative(ROOT, reportPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
