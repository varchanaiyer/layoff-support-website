/* Layoff Support: "Get jobs matched to you" preferences pop-up.
   - Any element with [data-job-prefs] opens it.
   - The first time it opens it shows a short demo of filling itself in, so people feel like doing it.
   - Saving needs a free account; preferences are stored on the member's profile (job_prefs)
     and their matches appear in the Job boards section of Your plan. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CSS = `
  .jp-modal{position:fixed;inset:0;z-index:1150;display:grid;place-items:center;padding:20px;background:rgba(15,23,32,.42)}
  .jp-modal[hidden]{display:none!important}
  .jp-card{position:relative;width:min(520px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:22px;padding:28px 26px 22px;box-shadow:0 24px 60px rgba(15,23,32,.25);font-family:Inter,system-ui,-apple-system,sans-serif;color:#0f172a}
  .jp-close{position:absolute;top:12px;right:14px;border:0;background:none;font-size:26px;color:#64748b;cursor:pointer}
  .jp-eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin:0 0 6px}
  .jp-card h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;line-height:1.1;margin:0 0 6px}
  .jp-sub{font-size:15px;color:#475569;line-height:1.55;margin:0 0 18px}
  .jp-field{display:grid;gap:6px;margin-bottom:14px}
  .jp-field>span{font-size:13.5px;font-weight:600;color:#0f172a}
  .jp-field input[type=text],.jp-field select{width:100%;box-sizing:border-box;padding:11px 13px;border:1.5px solid #d5dcd9;border-radius:12px;font:inherit;font-size:15px;background:#fff;transition:border-color .3s,box-shadow .3s}
  .jp-field input[type=text]:focus,.jp-field select:focus{outline:none;border-color:#14b8a6;box-shadow:0 0 0 4px rgba(20,184,166,.12)}
  .jp-chips{display:flex;flex-wrap:wrap;gap:8px}
  .jp-chips button{padding:8px 14px;border-radius:999px;border:1.5px solid #d5dcd9;background:#fff;font:inherit;font-size:14px;font-weight:600;color:#334155;cursor:pointer;transition:all .25s}
  .jp-chips button[aria-pressed="true"]{background:#0d9488;border-color:#0d9488;color:#fff}
  .jp-range{display:flex;align-items:center;gap:12px}
  .jp-range input{flex:1;accent-color:#0d9488}
  .jp-range b{min-width:86px;text-align:right;font-size:15px;color:#0f766e}
  .jp-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#334155;margin:4px 0 16px}
  .jp-check input{width:18px;height:18px;accent-color:#0d9488;margin-top:1px}
  .jp-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .jp-save{border:0;background:#14b8a6;color:#fff;font:inherit;font-weight:600;font-size:15px;padding:12px 20px;border-radius:999px;cursor:pointer}
  .jp-save.is-pulse{animation:jp-pulse 1.6s ease-in-out infinite}
  .jp-later{border:0;background:none;font:inherit;font-size:14px;color:#64748b;cursor:pointer;padding:12px 6px}
  .jp-hint{font-size:13.5px;color:#0f766e;margin:10px 0 0;min-height:1em}
  .jp-pointer{position:absolute;left:0;top:0;z-index:3;pointer-events:none;opacity:0;transition:transform .9s cubic-bezier(.45,0,.2,1),opacity .3s;filter:drop-shadow(0 3px 6px rgba(0,0,0,.18))}
  .jp-pointer.is-on{opacity:1}
  .jp-glow{box-shadow:0 0 0 4px rgba(20,184,166,.18)!important;border-color:#14b8a6!important}
  .jp-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1160;background:#0f766e;color:#fff;padding:12px 18px;border-radius:999px;font:600 14px/1.3 Inter,system-ui,sans-serif;box-shadow:0 10px 26px rgba(15,118,110,.35)}
  .jp-toast a{color:#fff;margin-left:8px}
  @keyframes jp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(20,184,166,.45)}50%{box-shadow:0 0 0 10px rgba(20,184,166,0)}}`;

  const DEMO = { q: 'Product designer', where: 'United States', types: ['full'], min: 90000, email: true };
  let modal, demoTimers = [], demoRunning = false;
  const fmt = (n) => (n ? '$' + Math.round(n / 1000) + 'k+' : 'Any');

  function build() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    modal = document.createElement('div');
    modal.className = 'jp-modal'; modal.hidden = true;
    modal.innerHTML = `
      <div class="jp-card" role="dialog" aria-modal="true" aria-labelledby="jp-title">
        <button class="jp-close" type="button" aria-label="Close">&times;</button>
        <p class="jp-eyebrow">Jobs matched to you</p>
        <h2 id="jp-title">What kind of work are you after?</h2>
        <p class="jp-sub">Tell us once. We'll show matching jobs in your plan, and can email you new ones each week.</p>
        <label class="jp-field"><span>Role or skills</span><input type="text" id="jp-q" placeholder="e.g. Product designer, data analyst" autocomplete="off"></label>
        <label class="jp-field"><span>Where</span>
          <select id="jp-where"><option value="">Anywhere</option><option>United States</option><option>Canada</option><option>United Kingdom</option><option value="europe">Europe</option><option>India</option><option>Australia</option></select></label>
        <div class="jp-field"><span>Type of work</span>
          <div class="jp-chips" id="jp-types"><button type="button" data-t="full" aria-pressed="false">Full time</button><button type="button" data-t="contract" aria-pressed="false">Contract</button><button type="button" data-t="part" aria-pressed="false">Part time</button></div></div>
        <div class="jp-field"><span>Minimum salary</span>
          <div class="jp-range"><input type="range" id="jp-min" min="0" max="250000" step="5000" value="0"><b id="jp-minOut">Any</b></div></div>
        <label class="jp-check"><input type="checkbox" id="jp-email"> Email me new matches once a week. Unsubscribe any time.</label>
        <div class="jp-actions"><button type="button" class="jp-save" id="jp-save">Save my preferences</button><button type="button" class="jp-later">Not now</button></div>
        <p class="jp-hint" id="jp-hint" role="status"></p>
        <svg class="jp-pointer" id="jp-pointer" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 7.5-6.2 1.6L10 18.5z" fill="#fff" stroke="#0f766e" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </div>`;
    document.body.appendChild(modal);
    const $ = (id) => modal.querySelector('#' + id);
    $('jp-min').addEventListener('input', () => { $('jp-minOut').textContent = fmt(+$('jp-min').value); });
    $('jp-types').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
    modal.querySelector('.jp-close').addEventListener('click', close);
    modal.querySelector('.jp-later').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
    // any real interaction stops the demo and hands over
    ['pointerdown', 'keydown'].forEach((ev) => modal.querySelector('.jp-card').addEventListener(ev, (e) => { if (e.isTrusted && demoRunning) stopDemo(true); }, true));
    $('jp-save').addEventListener('click', save);
  }
  const el = (id) => modal.querySelector('#' + id);

  function read() {
    return {
      q: el('jp-q').value.trim(),
      where: el('jp-where').value,
      types: [...modal.querySelectorAll('#jp-types [aria-pressed="true"]')].map((b) => b.dataset.t),
      min: +el('jp-min').value || 0,
      email: el('jp-email').checked,
      updated: new Date().toISOString(),
    };
  }
  function fill(p) {
    p = p || {};
    el('jp-q').value = p.q || '';
    el('jp-where').value = p.where != null ? p.where : 'United States';
    modal.querySelectorAll('#jp-types [data-t]').forEach((b) => b.setAttribute('aria-pressed', (p.types || []).includes(b.dataset.t)));
    el('jp-min').value = p.min || 0; el('jp-minOut').textContent = fmt(p.min || 0);
    el('jp-email').checked = !!p.email;
  }

  // ---------- The little demo ----------
  function later(fn, ms) { demoTimers.push(setTimeout(fn, ms)); }
  function stopDemo(handOver) {
    demoRunning = false; demoTimers.forEach(clearTimeout); demoTimers = [];
    el('jp-pointer').classList.remove('is-on');
    modal.querySelectorAll('.jp-glow').forEach((n) => n.classList.remove('jp-glow'));
    if (handOver) el('jp-hint').textContent = 'Your turn: change anything you like, then save.';
  }
  function pointTo(node) {
    const card = modal.querySelector('.jp-card').getBoundingClientRect(), r = node.getBoundingClientRect();
    el('jp-pointer').style.transform = 'translate(' + (r.left - card.left + Math.min(r.width * 0.3, 60)) + 'px,' + (r.top - card.top + r.height * 0.6 + modal.querySelector('.jp-card').scrollTop) + 'px)';
  }
  function demo() {
    demoRunning = true; fill({ where: '' });
    const ptr = el('jp-pointer'); ptr.classList.add('is-on');
    let t = 300;
    later(() => { pointTo(el('jp-q')); el('jp-q').classList.add('jp-glow'); }, t);
    t += 900;
    [...DEMO.q].forEach((ch, i) => later(() => { el('jp-q').value = DEMO.q.slice(0, i + 1); }, t + i * 75));
    t += DEMO.q.length * 75 + 400;
    later(() => { el('jp-q').classList.remove('jp-glow'); pointTo(el('jp-where')); el('jp-where').classList.add('jp-glow'); }, t);
    t += 1000;
    later(() => { el('jp-where').value = DEMO.where; }, t);
    t += 500;
    const full = modal.querySelector('#jp-types [data-t="full"]');
    later(() => { el('jp-where').classList.remove('jp-glow'); pointTo(full); }, t);
    t += 1000;
    later(() => { full.setAttribute('aria-pressed', 'true'); }, t);
    t += 500;
    later(() => { pointTo(el('jp-min')); }, t);
    t += 900;
    for (let v = 0, k = 0; v <= DEMO.min; v += 10000, k++) later(() => { el('jp-min').value = v; el('jp-minOut').textContent = fmt(v); }, t + k * 70);
    t += 900;
    later(() => { pointTo(el('jp-email')); }, t);
    t += 900;
    later(() => { el('jp-email').checked = true; }, t);
    t += 500;
    later(() => { pointTo(el('jp-save')); }, t);
    t += 900;
    later(() => { stopDemo(false); el('jp-save').classList.add('is-pulse'); el('jp-hint').textContent = 'That’s an example. Make it yours, then save.'; }, t);
  }

  // ---------- Open / close / save ----------
  async function open(opts) {
    if (!modal) build();
    stopDemo(false);
    el('jp-hint').textContent = ''; el('jp-save').classList.remove('is-pulse');
    modal.hidden = false; document.body.style.overflow = 'hidden';
    let existing = null;
    if (window.LS && LS.user) {
      const r = await LS.db.from('member_profiles').select('job_prefs').eq('id', LS.user.id).maybeSingle();
      existing = r.data && r.data.job_prefs;
    }
    if (existing && existing.updated) { fill(existing); el('jp-hint').textContent = 'These are your saved preferences. Change anything, then save.'; }
    else if (reduce || (opts && opts.noDemo)) fill({ where: 'United States' });
    else demo();
    try { localStorage.setItem('ls_prefs_prompted', '1'); } catch (e) {}
  }
  function close() { stopDemo(false); modal.hidden = true; document.body.style.overflow = ''; }
  function toast(html) {
    const t = document.createElement('div'); t.className = 'jp-toast'; t.innerHTML = html; document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }
  async function store(prefs) {
    const r = await LS.db.from('member_profiles').update({ job_prefs: prefs, updated_at: new Date().toISOString() }).eq('id', LS.user.id);
    return !r.error;
  }
  async function save() {
    stopDemo(false);
    const prefs = read();
    if (!window.LS) return;
    if (!LS.user) {
      try { localStorage.setItem('ls_pending_prefs', JSON.stringify(prefs)); } catch (e) {}
      close();
      LS.requireSignIn('Sign in to save your job preferences. Your matches will be waiting in your plan.');
      return;
    }
    const ok = await store(prefs);
    if (ok) { close(); toast('Saved. Your matches are in your plan <a href="plan.html#saved">See them &rarr;</a>'); document.dispatchEvent(new CustomEvent('ls:jobprefs', { detail: prefs })); }
    else el('jp-hint').textContent = 'Couldn’t save that just now. Please try again in a moment.';
  }
  // finish a save someone started before signing in
  function afterSignIn(u) {
    if (!u) return;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem('ls_pending_prefs') || 'null'); localStorage.removeItem('ls_pending_prefs'); } catch (e) {}
    if (pending) store(pending).then((ok) => { if (ok) { toast('Your job preferences are saved. <a href="plan.html#saved">See your matches &rarr;</a>'); document.dispatchEvent(new CustomEvent('ls:jobprefs', { detail: pending })); } });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-job-prefs]'); if (!t) return;
    e.preventDefault(); open();
  });
  window.JobPrefs = { open };
  function init() {
    if (window.LS) LS.onUser(afterSignIn);
    // On the job board, invite people once, a few seconds after they arrive
    if (document.body.getAttribute('data-page') === 'jobs') {
      let prompted = false; try { prompted = localStorage.getItem('ls_prefs_prompted') === '1'; } catch (e) {}
      if (!prompted) setTimeout(() => { if (!(window.LS && LS.user)) open(); }, 6000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
