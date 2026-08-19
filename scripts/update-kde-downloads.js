// Refreshes the Maxwell "downloads on the KDE Store" figure in index.html
// from the live KDE Store API, rounded down to the nearest thousand.
//
// Uses the listing/search endpoint (content/data?search=...), not the
// per-item detail endpoint (content/data/{id}) — the two report different
// download counts for the same product (the detail endpoint lags well
// behind what KDE Plasma's "Get New Widgets" dialog shows), and the
// listing endpoint is the one that matches Plasma's own figure.
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');

const KDE_PERSON_ID = 'wilversings';
const KDE_PRODUCT_ID = 2274580;
const KDE_SEARCH_TERM = 'Maxwell';
const API_URL = `https://api.kde-look.org/ocs/v1/content/data?personid=${KDE_PERSON_ID}&search=${KDE_SEARCH_TERM}&format=json`;

const STAT_PATTERN = /(<p class="portfolio__stat"><strong>)[\d,]+\+(<\/strong> downloads on the KDE Store<\/p>)/;

async function fetchDownloadCount() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`KDE Store API request failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  const item = (body.data || []).find((entry) => Number(entry.id) === KDE_PRODUCT_ID);
  if (!item) {
    throw new Error(`Product ${KDE_PRODUCT_ID} not found in KDE Store search results`);
  }
  const downloads = Number(item.downloads);
  if (!Number.isFinite(downloads)) {
    throw new Error(`KDE Store API returned a non-numeric downloads value: ${item.downloads}`);
  }
  return downloads;
}

async function main() {
  const downloads = await fetchDownloadCount();
  const rounded = Math.floor(downloads / 1000) * 1000;
  const formatted = `${rounded.toLocaleString('en-US')}+`;

  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  if (!STAT_PATTERN.test(html)) {
    throw new Error('Could not find the Maxwell download-count markup in index.html');
  }

  const updated = html.replace(STAT_PATTERN, `$1${formatted}$2`);
  if (updated === html) {
    console.log(`No change: already showing ${formatted} (live count: ${downloads}).`);
    return;
  }

  fs.writeFileSync(INDEX_HTML, updated);
  console.log(`Updated Maxwell download count to ${formatted} (live count: ${downloads}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
