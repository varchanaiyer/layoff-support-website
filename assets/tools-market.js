/* Layoff Support: the tools marketplace.
   Cards for genuinely useful tools, with their deals for people who've been laid off
   (free plans, job-seeker offers, codes, hardship pricing) and a real public review.
   Data lives in assets/tools-data.js (window.LS_TOOLS). Extras (runway calculator,
   copy-paste prompts) sit at the end of the page. */
(function () {
  const grid = document.getElementById('tmGrid'); if (!grid || !window.LS_TOOLS) return;
  const TOOLS = window.LS_TOOLS;
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  const $ = (id) => document.getElementById(id);
  const DEALS = { all: 'All', free: 'Free for you', jobseeker: 'Laid-off discount', code: 'Has a code', hardship: 'Ask for hardship pricing' };
  const TASKS = { all: 'Everything', resume: 'Getting my resume ready', interview: 'Interviews coming up', track: 'Keeping track of it all', money: 'Money is tight', learn: 'Learning something new', wellbeing: 'Looking after myself' };
  let deal = 'all', task = 'all';

  function chips(el, map, cur, attr) {
    el.innerHTML = Object.entries(map).filter(([k]) => k === 'all' || TOOLS.some((t) => attr === 'deal' ? (t.deals || []).includes(k) : (t.tasks || []).includes(k)))
      .map(([k, v]) => '<button type="button" class="tm-chip" data-' + attr + '="' + k + '" aria-pressed="' + (k === cur) + '">' + esc(v) + '</button>').join('');
  }
  function dealBox(t) {
    if (!t.offer) return '';
    const code = t.offer.code ? '<span class="tm-code"><b>' + esc(t.offer.code) + '</b><button type="button" class="tm-copy" data-code="' + esc(t.offer.code) + '">Copy</button></span>' : '';
    return '<div class="tm-offer tm-offer--' + esc(t.offer.kind || 'deal') + '"><p class="tm-offer__label">' + esc(t.offer.label || 'Deal') + '</p><p>' + esc(t.offer.text) + '</p>' + code +
      (t.offer.how ? '<p class="tm-offer__how">' + esc(t.offer.how) + '</p>' : '') + '</div>';
  }
  function review(t) {
    if (t.review && t.review.quote) {
      return '<blockquote class="tm-review"><p>“' + esc(t.review.quote) + '”</p><footer>' + esc(t.review.who || 'Reviewer') +
        (t.review.source ? ', <a href="' + esc(t.review.source) + '" target="_blank" rel="noopener">' + esc(t.review.where || 'source') + '</a>' : '') + '</footer></blockquote>';
    }
    return t.take ? '<p class="tm-take"><b>Our take:</b> ' + esc(t.take) + '</p>' : '';
  }
  function card(t) {
    const host = (() => { try { return new URL(t.url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })();
    const mono = esc(t.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2));
    const shot = t.img ? '<img src="assets/img/tools/' + esc(t.img) + '.jpg" alt="' + esc(t.name) + '" loading="lazy">' : '<span class="bd-ph"><span>' + mono + '</span><b>' + esc(t.name) + '</b></span>';
    const badges = (t.deals || []).filter((d) => d !== 'trial' || !(t.deals || []).includes('free')).map((d) => '<span class="tm-badge tm-badge--' + d + '">' + esc({ free: 'Free', jobseeker: 'Laid-off discount', code: 'Code', hardship: 'Hardship pricing', trial: 'Free trial' }[d]) + '</span>').join('');
    return '<article class="tm-card">' +
      '<a class="bd-shot" href="' + esc(t.url) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><span class="bd-bar"><i></i><i></i><i></i><span>' + esc(host) + '</span></span>' + shot + '</a>' +
      '<div class="tm-body">' +
        '<div class="tm-top"><h3>' + esc(t.name) + '</h3><span class="tm-price">' + esc(t.price || '') + '</span></div>' +
        '<div class="tm-badges">' + badges + '</div>' +
        '<p class="tm-best"><b>Why it helps right now:</b> ' + esc(t.best) + '</p>' +
        dealBox(t) + review(t) +
        (t.catch ? '<p class="tm-catch"><b>Watch out:</b> ' + esc(t.catch) + '</p>' : '') +
        '<a class="btn btn--primary btn--sm tm-go" href="' + esc(t.url) + '" target="_blank" rel="noopener">Get ' + esc(t.name) + ' &#8599;</a>' +
      '</div></article>';
  }
  function render() {
    const rank = (t) => ((t.deals || []).includes('jobseeker') ? 0 : (t.deals || []).includes('code') ? 1 : (t.deals || []).includes('hardship') ? 2 : 3);
    const list = TOOLS.slice().sort((a, b) => rank(a) - rank(b)).filter((t) => (deal === 'all' || (t.deals || []).includes(deal)) && (task === 'all' || (t.tasks || []).includes(task)));
    $('tmCount').textContent = list.length + (list.length === 1 ? ' tool' : ' tools') + ', picked for people who’ve been laid off';
    grid.innerHTML = list.length ? list.map(card).join('') : '<div class="jb-empty"><p>Nothing matches both filters yet. Try another combination.</p></div>';
    // After the tools: our own free pick for that task, at the end of the list
    const PICK = {
      resume: ['Rewrite your bullets yourself, free', 'Copy our prompt into any free AI assistant. It tailors your bullets to a job without inventing anything.', '#pr-resume', 'Get the prompt'],
      interview: ['Practise out loud, free', 'Copy our mock-interview prompt into any free AI assistant and answer three questions out loud.', '#pr-interview', 'Get the prompt'],
      money: ['See how long your money lasts', 'Our runway calculator works as you type, and nothing leaves your device.', '#runway-panel', 'Open the calculator'],
    };
    const pk = PICK[task];
    if (pk) grid.insertAdjacentHTML('beforeend', '<a class="tm-pick" href="' + pk[2] + '"><span class="tm-pick__label">Our free pick</span><b>' + esc(pk[0]) + '</b><span>' + esc(pk[1]) + '</span><span class="tm-pick__go">' + esc(pk[3]) + ' &darr;</span></a>');
    grid.classList.remove('is-in'); void grid.offsetWidth; grid.classList.add('is-in');
  }
  function bindChips(el, attr, set) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-' + attr + ']'); if (!b) return;
      set(b.dataset[attr]);
      el.querySelectorAll('[data-' + attr + ']').forEach((c) => c.setAttribute('aria-pressed', c === b));
      render();
    });
  }
  chips($('tmDeals'), DEALS, deal, 'deal'); chips($('tmTasks'), TASKS, task, 'task');
  bindChips($('tmDeals'), 'deal', (v) => { deal = v; }); bindChips($('tmTasks'), 'task', (v) => { task = v; });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-code],[data-copy-text]'); if (!b) return;
    const text = b.dataset.code || document.getElementById(b.dataset.copyText).textContent;
    try { await navigator.clipboard.writeText(text); const o = b.textContent; b.textContent = 'Copied'; setTimeout(() => (b.textContent = o), 1600); } catch (err) {}
  });
  const h = (location.hash || '').replace('#', '');
  if (TASKS[h]) { task = h; chips($('tmTasks'), TASKS, task, 'task'); }
  render();

  // ---------- Claim these first: the strongest offers for laid-off people ----------
  const first = TOOLS.filter((t) => t.first);
  if (first.length) {
    document.getElementById('tmFirstList').innerHTML = first.map((t) => '<a class="tm-first__item" href="' + esc(t.url) + '" target="_blank" rel="noopener"><b>' + esc(t.name) + '</b><span>' + esc(t.first) + '</span></a>').join('');
    document.getElementById('tmFirst').hidden = false;
  }

  // ---------- Extras: runway calculator ----------
  const out = $('rw-out'); if (!out) return;
  function calc() {
    const v = (id) => +($(id).value || 0);
    const save = v('rw-save') + v('rw-sev'), ui = v('rw-ui'), weeks = v('rw-weeks'), cost = v('rw-cost');
    try { localStorage.setItem('ls_runway', JSON.stringify({ save: v('rw-save'), sev: v('rw-sev'), ui, weeks, cost })); } catch (e) {}
    if (!cost) { out.innerHTML = '<p>Add your essential monthly costs (rent, food, bills, insurance) to see your runway.</p>'; return; }
    const uiMonth = ui * 52 / 12, uiMonths = weeks * 12 / 52;
    let money = save, months = 0;
    while (months < 60) {
      const income = months < uiMonths ? uiMonth * Math.min(1, uiMonths - months) : 0;
      const need = cost - income;
      if (need <= 0) { months += 1; continue; }
      if (money >= need) { money -= need; months += 1; } else { months += money / need; break; }
    }
    const m = Math.floor(months), until = new Date(); until.setMonth(until.getMonth() + m);
    const big = months >= 60 ? '5+ years' : (m + (months - m >= 0.5 ? '½' : '') + (m === 1 ? ' month' : ' months'));
    const note = months < 3 ? 'That’s tight, and it’s good you know now. Check whether you qualify for Medicaid, ask lenders and your landlord about hardship plans, and look at <a href="offers.html">our low-cost picks</a>.'
      : months < 6 ? 'You have some room to breathe. Cut one or two costs now, keep applying steadily, and consider a short contract to stretch it.'
      : 'That’s a real cushion. You can be choosy about the next role. Still worth checking your health coverage options.';
    out.innerHTML = '<p class="runway__big">' + big + '</p><p class="runway__sub">' + (months < 60 ? 'Your money lasts until about <b>' + until.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b>.' : '') + '</p><p class="runway__note">' + note + '</p>';
  }
  try { const r = JSON.parse(localStorage.getItem('ls_runway') || 'null'); if (r) { $('rw-save').value = r.save || ''; $('rw-sev').value = r.sev || ''; $('rw-ui').value = r.ui || ''; $('rw-weeks').value = r.weeks || 26; $('rw-cost').value = r.cost || ''; } } catch (e) {}
  $('runway').addEventListener('input', calc); calc();
  // Arriving from an email answer: tools.html?runway=short#runway-panel
  const gut = new URLSearchParams(location.search).get('runway');
  const GUT = { short: 'You said under 3 months. That\u2019s a lot to carry, and you\u2019re doing the right thing by looking. Let\u2019s check it together.', mid: 'You said 3 to 6 months. Let\u2019s see if the numbers agree, and where there\u2019s room to stretch it.', long: 'You said more than 6 months. Good. Let\u2019s confirm it, so you can be choosy about what comes next.' };
  if (GUT[gut]) {
    const n = document.createElement('p'); n.className = 'runway__gut'; n.textContent = GUT[gut];
    n.style.cssText = 'margin:0 0 14px;padding:12px 14px;border-radius:12px;background:#f0fdfa;color:#0f766e;font-weight:600';
    $('runway-panel').insertBefore(n, $('runway-panel').firstChild);
  }
  if (gut !== null || location.hash === '#runway-panel') setTimeout(() => { $('runway-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); const f = $('rw-save'); if (f && !f.value) f.focus({ preventScroll: true }); }, 500);
})();
