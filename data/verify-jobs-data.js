#!/usr/bin/env node
/* ============================================================
   verify-jobs-data.js
   ------------------------------------------------------------
   Anti-hallucination test for the job board page.

   Reads:
     - website/jobs.html
     - website/data/jobs-data.json

   Verifies, in order:

     1. Every company referenced on jobs.html (in job cards, priority
        cards, soft-landing tiles, no-ghost wall, and karma leaderboard)
        exists in jobs-data.json. Companies that aren't in the data file
        are flagged as unverified.

     2. Every external careers URL on jobs.html points at a careers
        page listed in the data file for that company. This catches
        the case where someone keeps the company name but swaps in a
        wrong / made-up URL.

     3. No fabricated metric patterns appear in the page. We do not
        have a backend yet, so anything that looks like a precise
        statistic ("Posted 4d ago", "38 applicants", "Kept 94% of
        the time", "Decision in 9 days", "Kindness 96", a fake "247
        open roles" stat-strip number) must not ship until it's
        backed by real data.

     4. Every block of placeholder/illustrative copy (vouches,
        hiring-manager notes, success stories) is explicitly marked
        with data-illustrative="true" so users can see the disclosure
        and so we don't accidentally pass off invented quotes as real
        community feedback.

   Exit code:
     0 → all checks pass
     1 → at least one violation; details printed to stderr

   Run:
     node website/data/verify-jobs-data.js
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'jobs.html');
const DATA_PATH = path.join(__dirname, 'jobs-data.json');

function fail(msg) {
  console.error('verify-jobs-data: ' + msg);
  process.exit(2);
}

if (!fs.existsSync(HTML_PATH)) fail('jobs.html not found at ' + HTML_PATH);
if (!fs.existsSync(DATA_PATH)) fail('jobs-data.json not found at ' + DATA_PATH);

const html = fs.readFileSync(HTML_PATH, 'utf8');
let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  fail('jobs-data.json is not valid JSON: ' + e.message);
}

if (!Array.isArray(data.companies)) {
  fail('jobs-data.json must have a top-level "companies" array.');
}

// Build lookup tables.
const verifiedByName = new Map();
const verifiedUrls   = new Set();
for (const c of data.companies) {
  if (!c.name)        fail('A company entry is missing "name".');
  if (!c.careers_url) fail(`Company "${c.name}" is missing "careers_url".`);
  verifiedByName.set(normalize(c.name), c);
  verifiedUrls.add(c.careers_url);
}
for (const b of data.external_boards || []) {
  if (b.url) verifiedUrls.add(b.url);
}

function normalize(s) {
  return s.toLowerCase()
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();
}

const errors = [];
const passes = [];

// ------------------------------------------------------------
// Check 1: every company name on the page is in the data file.
// ------------------------------------------------------------
const companyExtractors = [
  {
    label: 'job-card / priority-card title',
    // matches: <div class="job-card__title">Role · Company</div>
    //          <div class="priority-card__title">Role · Company</div>
    re: /<div class="(?:job-card__title|priority-card__title)">[^<]*?·\s*([^<]+?)<\/div>/g,
  },
  {
    label: 'soft-landing tile',
    re: /<h3 class="tile__title">([^<]+)<\/h3>/g,
  },
  {
    label: 'no-ghost pledge wall',
    re: /<div class="pledge-card__company">([^<]+)<\/div>/g,
  },
  {
    label: 'karma leaderboard',
    re: /<div class="karma-row__company">([^<]+)<\/div>/g,
  },
];

let companyMentions = 0;
for (const ex of companyExtractors) {
  for (const m of html.matchAll(ex.re)) {
    companyMentions++;
    const name = m[1].trim();
    if (!verifiedByName.has(normalize(name))) {
      errors.push(`[${ex.label}] references unverified company: "${name}"`);
    } else {
      passes.push(`[${ex.label}] ${name}`);
    }
  }
}

// ------------------------------------------------------------
// Check 2: external careers URLs that look like company careers
// pages must match the URL we have on file for that company.
// ------------------------------------------------------------
// Strategy: pull every <a href="https://..."> on the page that's
// inside a tile / pledge / job card and check it against the
// allow-list of URLs we trust.
const externalLinkRe = /href="(https?:\/\/[^"]+)"/g;
let externalLinkCount = 0;
for (const m of html.matchAll(externalLinkRe)) {
  const url = m[1];
  externalLinkCount++;
  // Skip the crisis lifeline (988) and any link clearly from the
  // external_boards section — they're either generic resources or
  // already trusted via verifiedUrls.
  if (url.startsWith('https://988')) continue;
  if (verifiedUrls.has(url)) continue;
  errors.push(`Untrusted external URL on page: ${url}`);
}

// ------------------------------------------------------------
// Check 3: no fabricated-stat patterns ship in the markup.
// ------------------------------------------------------------
const fabricationPatterns = [
  { name: '"Posted Nd ago"',                    re: /Posted \d+\s*d\s*ago/i },
  { name: '"N applicants"',                     re: /\b\d+\s+applicants\b/i },
  { name: '"Kept N% of the time"',              re: /Kept \d+%\s+of the time/i },
  { name: '"Median Kindness" stat',             re: /Median\s+Kindness/i },
  { name: '"Median Decision Time" stat',        re: /Median\s+Decision\s+Time/i },
  { name: '"Kindness NN" badge',                re: /Kindness\s+\d{2,3}\b/ },
  { name: '"Decision in N days" promise',       re: /Decision in \d+\s*days?/i },
  { name: '"Reply in N days" promise',          re: /Reply in \d+\s*days?/i },
  { name: '"reply Nd, decision Nd" promise',    re: /reply \d+\s*d\s*,\s*decision \d+\s*d/i },
  { name: 'fabricated stat-strip "247 roles"',  re: /<div class="stat__value">\s*247\s*</ },
  { name: 'fake "$NNNk–$NNNk" salary band',     re: /\$\d{2,3}k\s*[–-]\s*\$\d{2,3}k/i },
  { name: 'fake "N weeks severance"',           re: /\b\d+\s+weeks?\s+severance\b/i },
  { name: 'fake "Kept N%"',                     re: /Kept\s+\d+%/i },
];
for (const p of fabricationPatterns) {
  if (p.re.test(html)) {
    errors.push(`Fabricated-stat pattern still present in jobs.html: ${p.name}`);
  }
}

// ------------------------------------------------------------
// Check 4: any illustrative tone-of-voice copy must be marked
// with data-illustrative="true" so users see a disclosure and
// so we never accidentally pass invented quotes off as real.
// ------------------------------------------------------------
const illustrativeRules = [
  { sel: 'blockquote.vouch',         re: /<blockquote\s+class="vouch"(?![^>]*data-illustrative)/i },
  { sel: 'div.job-card__hm-note',    re: /<div\s+class="job-card__hm-note"(?![^>]*data-illustrative)/i },
  { sel: 'article.story',            re: /<article\s+class="story"(?![^>]*data-illustrative)/i },
];
for (const r of illustrativeRules) {
  if (r.re.test(html)) {
    errors.push(`Illustrative element <${r.sel}> is missing data-illustrative="true". Either delete it or mark it.`);
  }
}

// ------------------------------------------------------------
// Report
// ------------------------------------------------------------
const line = '─'.repeat(64);
console.log('\n' + line);
console.log(' Job board data verification — ' + new Date().toISOString().slice(0, 10));
console.log(line);
console.log(` Companies in data file:        ${data.companies.length}`);
console.log(` Company mentions on page:      ${companyMentions}`);
console.log(` External links checked:        ${externalLinkCount}`);
console.log(` Verified mentions:             ${passes.length}`);
console.log(` Violations:                    ${errors.length}`);
console.log(line);

if (errors.length === 0) {
  console.log(' PASS — every claim on the job board is sourced or marked illustrative.\n');
  process.exit(0);
}

console.error('\n FAIL — fix the following before shipping:\n');
for (const e of errors) console.error('  ✗ ' + e);
console.error('');
process.exit(1);
