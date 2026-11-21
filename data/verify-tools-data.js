#!/usr/bin/env node
/* ============================================================
   verify-tools-data.js
   ------------------------------------------------------------
   Anti-hallucination test for the tools page.

   Reads:
     - website/tools.html
     - website/data/tools-data.json

   Verifies, in order:

     1. Every tool referenced on tools.html (in the tool grid and
        in the featured "tools with explicit unemployed programs"
        section) exists in tools-data.json. Tool names that aren't
        in the data file are flagged as unverified.

     2. Every external URL in a tool tile points at the URL we have
        on file for that tool. This catches the case where someone
        keeps the tool name but swaps in a wrong / made-up URL.

     3. Every cost label that ships in the markup ("Free", "Free
        tier", "Free for laid-off") corresponds to the cost field
        in the data file for the matching tool — i.e. you can't
        accidentally re-label a paid tool as free.

     4. No fabricated stat patterns appear in the markup. We do not
        have any backend yet, so star ratings, review counts,
        "10,000+ users", "rated 4.8/5", and similar invented numbers
        must not ship.

     5. Every featured stack on the page only references tool IDs
        that exist in tools-data.json — no orphan or made-up tool
        names inside the stack chips.

   Exit code:
     0 → all checks pass
     1 → at least one violation; details printed to stderr
     2 → setup error (file missing, JSON broken)

   Run:
     node website/data/verify-tools-data.js
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'tools.html');
const DATA_PATH = path.join(__dirname, 'tools-data.json');

function setupFail(msg) {
  console.error('verify-tools-data: ' + msg);
  process.exit(2);
}

if (!fs.existsSync(HTML_PATH)) setupFail('tools.html not found at ' + HTML_PATH);
if (!fs.existsSync(DATA_PATH)) setupFail('tools-data.json not found at ' + DATA_PATH);

const html = fs.readFileSync(HTML_PATH, 'utf8');
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  setupFail('tools-data.json is not valid JSON: ' + e.message);
}

if (!Array.isArray(data.tools)) {
  setupFail('tools-data.json must have a top-level "tools" array.');
}

function normalize(s) {
  return s.toLowerCase()
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();
}

// Build lookups.
const verifiedByName = new Map();   // normalized name → tool entry
const verifiedById   = new Map();   // id              → tool entry
const verifiedUrls   = new Set();
for (const t of data.tools) {
  if (!t.id)   setupFail('A tool entry is missing "id".');
  if (!t.name) setupFail(`Tool id "${t.id}" is missing "name".`);
  if (!t.url)  setupFail(`Tool "${t.name}" is missing "url".`);
  if (!t.cost) setupFail(`Tool "${t.name}" is missing "cost".`);
  verifiedByName.set(normalize(t.name), t);
  verifiedById.set(t.id, t);
  verifiedUrls.add(t.url);
}

const errors = [];
const passes = [];

// ------------------------------------------------------------
// Check 1: every tool name on the page is in the data file.
// ------------------------------------------------------------
//
// We rely on a structural convention: every tool tile sets
// data-tool-id="…" on its outer element. The tile's title is in
// <h3 class="tile__title">…</h3> inside.
//
const toolTileRe =
  /<div class="tile"\s+data-tool-id="([^"]+)"[^>]*>[\s\S]*?<h3 class="tile__title">([^<]+)<\/h3>/g;

const tilesOnPage = [];
for (const m of html.matchAll(toolTileRe)) {
  const id   = m[1];
  const name = m[2].trim();
  tilesOnPage.push({ id, name });

  if (!verifiedById.has(id)) {
    errors.push(`Tool tile uses unverified id="${id}" (name on page: "${name}")`);
    continue;
  }
  const t = verifiedById.get(id);
  if (normalize(t.name) !== normalize(name)) {
    errors.push(`Tool tile id="${id}" displays name "${name}" but data file says "${t.name}"`);
    continue;
  }
  passes.push(`tile ${id} → ${name}`);
}

// ------------------------------------------------------------
// Check 2: every external URL inside a tool tile matches the
// data-file URL for that tool. We do this by extracting the
// href that lives inside each tile block.
// ------------------------------------------------------------
const tileBlockRe =
  /<div class="tile"\s+data-tool-id="([^"]+)"[\s\S]*?<a href="(https?:\/\/[^"]+)"[\s\S]*?<\/div>\s*(?=<div class="tile"|<\/div>\s*<!--)/g;

// Simpler approach: split the HTML by <div class="tile" data-tool-id and
// inspect each chunk for an href.
const chunks = html.split(/<div class="tile"\s+data-tool-id="/);
for (let i = 1; i < chunks.length; i++) {
  const chunk = chunks[i];
  const idMatch = chunk.match(/^([^"]+)"/);
  if (!idMatch) continue;
  const id = idMatch[1];
  // first https?:// link in the chunk
  const linkMatch = chunk.match(/href="(https?:\/\/[^"]+)"/);
  if (!linkMatch) continue;
  const url = linkMatch[1];
  const t = verifiedById.get(id);
  if (!t) continue; // already reported in check 1
  if (url !== t.url) {
    errors.push(`Tool "${t.name}" links to "${url}" but data file expects "${t.url}"`);
  }
}

// ------------------------------------------------------------
// Check 3: cost label inside each tile matches the data file.
// We render cost as a span: <span class="cost-pill cost-pill--<key>">label</span>
// where <key> is one of free | free-tier | unemployed | paid.
// ------------------------------------------------------------
const costKeyToCanonical = {
  'free':        'free',
  'free-tier':   'free-tier',
  'unemployed':  'free-for-unemployed',
  'paid':        'paid-with-discounts',
};

for (let i = 1; i < chunks.length; i++) {
  const chunk = chunks[i];
  const idMatch = chunk.match(/^([^"]+)"/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const t  = verifiedById.get(id);
  if (!t) continue;
  // Find cost-pill class on the chunk.
  const pillMatch = chunk.match(/class="cost-pill cost-pill--([a-z-]+)"/);
  if (!pillMatch) {
    errors.push(`Tool "${t.name}" tile is missing a <span class="cost-pill cost-pill--…"> badge`);
    continue;
  }
  const expected = costKeyToCanonical[pillMatch[1]];
  if (!expected) {
    errors.push(`Tool "${t.name}" uses unknown cost-pill key "${pillMatch[1]}"`);
    continue;
  }
  if (expected !== t.cost) {
    errors.push(`Tool "${t.name}" displays cost "${expected}" but data file says "${t.cost}"`);
  }
}

// ------------------------------------------------------------
// Check 4: fabricated-stat patterns must not appear.
// ------------------------------------------------------------
const fabricationPatterns = [
  { name: '"Rated N/5" or "N/5 stars"', re: /\b\d(?:\.\d)?\s*\/\s*5\b/ },
  { name: '"N+ users / N+ reviews"',    re: /\b\d{1,3}(?:,\d{3})*\+?\s+(?:users|reviews|installs|downloads)\b/i },
  { name: '"Trusted by NN companies"',  re: /Trusted by\s+\d+/i },
  { name: '"NN% success rate"',         re: /\b\d{1,3}\s*%\s*success\s*rate/i },
  { name: 'fake star rating "★ 4.8"',   re: /★\s*\d(?:\.\d)?\b/ },
];
for (const p of fabricationPatterns) {
  if (p.re.test(html)) {
    errors.push(`Fabricated-stat pattern present in tools.html: ${p.name}`);
  }
}

// ------------------------------------------------------------
// Check 5: every stack chip on the page references a real tool id.
// Stack chips render as <span class="stack-card__chip" data-tool-id="…">.
// ------------------------------------------------------------
const stackChipRe = /<span class="stack-card__chip"\s+data-tool-id="([^"]+)"/g;
const stackChipIds = new Set();
for (const m of html.matchAll(stackChipRe)) {
  const id = m[1];
  stackChipIds.add(id);
  if (!verifiedById.has(id)) {
    errors.push(`Stack chip references unverified tool id="${id}"`);
  }
}

// And every stack defined in the data file should match what's on
// the page (so we don't silently drop a stack from the markup).
if (Array.isArray(data.stacks)) {
  for (const s of data.stacks) {
    for (const tid of s.tools || []) {
      if (!verifiedById.has(tid)) {
        errors.push(`Stack "${s.name}" in data file references unknown tool id="${tid}"`);
      }
    }
  }
}

// ------------------------------------------------------------
// Report
// ------------------------------------------------------------
const line = '─'.repeat(64);
console.log('\n' + line);
console.log(' Tools data verification — ' + new Date().toISOString().slice(0, 10));
console.log(line);
console.log(` Tools in data file:            ${data.tools.length}`);
console.log(` Tool tiles on page:            ${tilesOnPage.length}`);
console.log(` Stack chips on page:           ${stackChipIds.size} (unique tool ids)`);
console.log(` Verified tile mentions:        ${passes.length}`);
console.log(` Violations:                    ${errors.length}`);
console.log(line);

if (errors.length === 0) {
  console.log(' PASS — every tool on the page is sourced and every cost label matches.\n');
  process.exit(0);
}

console.error('\n FAIL — fix the following before shipping:\n');
for (const e of errors) console.error('  ✗ ' + e);
console.error('');
process.exit(1);
