/* ============================================================
   Layoff Support — Shared scripts
   Everything here runs in the browser only. The site has no
   accounts and stores nothing about visitors.
   ============================================================ */

// ---------- Side navigation (rendered into #sidebar on inner pages) ----------
const NAV_ITEMS = [
  { key: 'home',        href: 'index.html',       label: 'Home',
    icon: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>' },
  { key: 'plan',        href: 'plan.html',        label: 'Your plan',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { key: 'offers',      href: 'offers.html',      label: 'Our picks',
    icon: '<path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z"/>' },
  { key: 'jobs',        href: 'jobs.html',        label: 'Job boards',
    icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
  { key: 'tools',       href: 'tools.html',       label: 'Tools',
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
  { key: 'therapists',  href: 'therapists.html',  label: 'Therapy',
    icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' },
  { key: 'mentors',     href: 'mentors.html',     label: 'Mentors',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { key: 'communities', href: 'communities.html', label: 'Communities',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
  { key: 'blog',        href: 'blog.html',        label: 'Stories',
    icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
];

function renderSidebar(active) {
  const target = document.getElementById('sidebar');
  if (!target) return;
  target.innerHTML = `
    <a href="index.html" class="logo">
      <span class="logo__mark" aria-hidden="true"><img src="assets/img/logo.avif" alt="" /></span>
      <span class="logo__text"><span>layoff</span><span>support</span></span>
    </a>
    <ul class="dash__menu">
      ${NAV_ITEMS.map(it => `
        <li>
          <a href="${it.href}" class="${it.key === active ? 'is-active' : ''}"${it.key === active ? ' aria-current="page"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${it.icon}</svg>
            ${it.label}
          </a>
        </li>`).join('')}
    </ul>
    <div class="dash__side-foot">
      <h5>Looking for work?</h5>
      <p>Members can find freelance, contract and full-time roles on the Work Board.</p>
      <a href="marketplace.html" class="btn btn--primary btn--sm">Open the Work Board</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.getAttribute('data-page');
  if (page) renderSidebar(page);
  initInsightsRail();
  initNavToggle();
  initToolSearch();
  initStackChipScroll();
});

// ---------- Mobile menu toggle on the home page header ----------
function initNavToggle() {
  const btn = document.querySelector('.site-nav__toggle');
  const nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

// ---------- Insights & Journeys rail (prev/next scroll buttons) ----------
function initInsightsRail() {
  const rail = document.querySelector('.insights__rail');
  if (!rail) return;
  const track = rail.querySelector('.insights__track');
  const prev  = rail.querySelector('.insights__btn--prev');
  const next  = rail.querySelector('.insights__btn--next');
  if (!track || !prev || !next) return;

  const stepSize = () => {
    const card = track.querySelector('.insight-card');
    if (!card) return 280;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
    return card.getBoundingClientRect().width + gap;
  };

  const updateBtns = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left:  stepSize(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateBtns, { passive: true });
  window.addEventListener('resize', updateBtns);
  updateBtns();
}

// ============================================================
// Tools page — live search + cost/category filters
// ============================================================
//
// The tools page renders a flat grid of tiles, each carrying:
//   data-tool-id="..."        unique id (verified by verify-tools-data.js)
//   data-cost="free|free-tier|unemployed"
//   data-tags="space separated category tags"
//   data-search="lowercase blob of search terms"
//
// We let the user narrow by (a) free-text search, (b) cost filter,
// (c) tag filter. All three are AND-ed. Filters are pill toggles
// inside .tool-filters; the active pill carries .is-active. Each
// cluster has data-filter-group set to "cost" or "tag" so we know
// which axis to apply.
//
function initToolSearch() {
  const grid = document.getElementById('tool-grid');
  if (!grid) return;

  const searchEl  = document.getElementById('tool-search');
  const emptyEl   = document.getElementById('tool-empty');
  const tiles     = Array.from(grid.querySelectorAll('.tile[data-tool-id]'));
  const clusters  = Array.from(document.querySelectorAll('.tool-filters[data-filter-group]'));

  // Current filter state. "all" is the wildcard for both axes.
  const state = {
    query: '',
    cost:  'all',
    tag:   'all',
  };

  function apply() {
    const q = state.query.trim().toLowerCase();
    let visible = 0;
    for (const tile of tiles) {
      const blob = (tile.getAttribute('data-search') || '').toLowerCase();
      const cost = tile.getAttribute('data-cost') || '';
      const tags = (tile.getAttribute('data-tags') || '').split(/\s+/);

      const matchesQuery = !q || blob.includes(q);
      const matchesCost  = state.cost === 'all' || cost === state.cost;
      const matchesTag   = state.tag  === 'all' || tags.includes(state.tag);

      const show = matchesQuery && matchesCost && matchesTag;
      tile.style.display = show ? '' : 'none';
      if (show) visible++;
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      state.query = searchEl.value || '';
      apply();
    });
  }

  for (const cluster of clusters) {
    const group = cluster.getAttribute('data-filter-group'); // 'cost' | 'tag'
    cluster.addEventListener('click', e => {
      const pill = e.target.closest('[data-filter]');
      if (!pill || !cluster.contains(pill)) return;
      const value = pill.getAttribute('data-filter');
      // Visual: only one pill in this cluster is active at a time.
      cluster.querySelectorAll('[data-filter]').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      state[group] = value;
      apply();
    });
  }

  apply();
}

// Stack chips on the tools page jump-scroll to the matching tool tile.
// We rely on the verifier guaranteeing every chip points at a real id.
function initStackChipScroll() {
  const chips = document.querySelectorAll('.stack-card__chip[data-tool-id]');
  if (!chips.length) return;
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-tool-id');
      const target = document.querySelector(`.tile[data-tool-id="${id}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('tile--flash');
      setTimeout(() => target.classList.remove('tile--flash'), 1400);
    });
  });
}
