/* Layoff Support: searchable job board.
   Jobs come from data/live-jobs.json (refreshed daily from Himalayas, with credit).
   "Save" needs a free account; saved jobs appear in Your plan. */
(function () {
  const $ = (id) => document.getElementById(id);
  const list = $('jbList'); if (!list) return;
  const EUROPE = ['United Kingdom','Ireland','Germany','France','Spain','Portugal','Italy','Netherlands','Belgium','Luxembourg','Switzerland','Austria','Poland','Czechia','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Greece','Croatia','Slovenia','Denmark','Sweden','Norway','Finland','Iceland','Estonia','Latvia','Lithuania','Ukraine','Serbia','Cyprus','Malta'];
  const PAGE = 20;
  let all = [], shown = PAGE, saved = new Set(), source = { name: 'Himalayas', url: 'https://himalayas.app' };

  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  function ago(ts) {
    if (!ts) return '';
    const d = Math.floor((Date.now() / 1000 - ts) / 86400);
    return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 7 ? d + ' days ago' : d < 14 ? 'Last week' : Math.floor(d / 7) + ' weeks ago';
  }
  function money(j) {
    if (!j.min && !j.max) return '';
    const f = (n) => n >= 1000 ? Math.round(n / 1000) + 'k' : n;
    const cur = j.cur === 'USD' ? '$' : j.cur === 'GBP' ? '£' : j.cur === 'EUR' ? '€' : (j.cur ? j.cur + ' ' : '');
    const per = j.per && /hour/i.test(j.per) ? ' an hour' : j.per && /month/i.test(j.per) ? ' a month' : ' a year';
    return cur + (j.min ? f(j.min) : '') + (j.min && j.max && j.max !== j.min ? '–' + f(j.max) : '') + per;
  }
  function whereText(w) {
    if (!w || !w.length) return 'Remote, anywhere';
    if (w.length > 3) return 'Remote, ' + w.slice(0, 2).join(', ') + ' + ' + (w.length - 2) + ' more';
    return 'Remote, ' + w.join(', ');
  }
  function matches(j, q, loc, type, pay) {
    if (pay && !j.min && !j.max) return false;
    if (type && !(j.type || '').toLowerCase().includes(type)) return false;
    if (loc) {
      const w = j.where || [];
      if (w.length) {
        if (loc === 'europe') { if (!w.some((c) => EUROPE.includes(c))) return false; }
        else if (!w.includes(loc)) return false;
      }
    }
    if (q) {
      const hay = (j.title + ' ' + j.company + ' ' + (j.cats || []).join(' ') + ' ' + (j.level || []).join(' ') + ' ' + j.about).toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }
  function filtered() {
    const q = $('jbQ').value.trim().toLowerCase(), loc = $('jbLoc').value, type = $('jbType').value, pay = $('jbPay').checked;
    let r = all.filter((j) => matches(j, q, loc, type, pay));
    if ($('jbSort').value === 'pay') r = r.slice().sort((a, b) => (b.max || b.min || 0) - (a.max || a.min || 0));
    return r;
  }
  function card(j) {
    const isSaved = saved.has(j.id);
    const mono = esc((j.company || '?').replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase());
    const logo = j.logo ? '<img src="' + esc(j.logo) + '" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'jb-mono\',textContent:\'' + mono + '\'}))">' : '<span class="jb-mono">' + mono + '</span>';
    const pay = money(j);
    return '<article class="jb-card" data-id="' + esc(j.id) + '">' +
      '<div class="jb-card__logo">' + logo + '</div>' +
      '<div class="jb-card__main">' +
        '<h3>' + esc(j.title) + '</h3>' +
        '<p class="jb-card__co">' + esc(j.company) + '</p>' +
        '<p class="jb-card__meta"><span>' + esc(whereText(j.where)) + '</span>' + (j.type ? '<span>' + esc(j.type) + '</span>' : '') + (pay ? '<span class="jb-pay">' + esc(pay) + '</span>' : '') + '<span>' + esc(ago(j.date)) + '</span></p>' +
        (j.about ? '<p class="jb-card__about">' + esc(j.about) + '</p>' : '') +
      '</div>' +
      '<div class="jb-card__actions">' +
        '<button type="button" class="jb-save' + (isSaved ? ' is-saved' : '') + '" data-save="' + esc(j.id) + '" aria-pressed="' + isSaved + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span>' + (isSaved ? 'Saved' : 'Save') + '</span></button>' +
        '<a class="jb-apply" href="' + esc(j.link) + '" target="_blank" rel="noopener">Apply on Himalayas &#8599;</a>' +
      '</div></article>';
  }
  function render() {
    const r = filtered();
    $('jbCount').textContent = r.length ? 'Showing ' + Math.min(shown, r.length) + ' of ' + r.length.toLocaleString() + ' jobs' : '';
    list.innerHTML = r.length ? r.slice(0, shown).map(card).join('') :
      '<div class="jb-empty"><p><b>No jobs match that yet.</b></p><p>Try fewer words, or widen the location.</p></div>';
    $('jbMore').hidden = shown >= r.length;
  }
  let t;
  ['jbQ'].forEach((id) => $(id).addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { shown = PAGE; render(); }, 180); }));
  ['jbLoc', 'jbType', 'jbPay', 'jbSort'].forEach((id) => $(id).addEventListener('change', () => { shown = PAGE; render(); }));
  $('jbForm').addEventListener('submit', (e) => { e.preventDefault(); shown = PAGE; render(); });
  $('jbMore').addEventListener('click', () => { shown += PAGE; render(); });

  // ---------- Saving ----------
  function savedCount() {
    const n = saved.size, el = $('jbSavedLink');
    el.hidden = !n; el.querySelector('b').textContent = n;
  }
  async function save(id) {
    const job = all.find((j) => j.id === id); if (!job) return;
    if (!window.LS || !LS.user) {
      try { localStorage.setItem('ls_pending_save', JSON.stringify(job)); } catch (e) {}
      LS.requireSignIn('Sign in to save jobs. They’ll be waiting for you in your plan.');
      return;
    }
    const on = !saved.has(id);
    if (on) saved.add(id); else saved.delete(id);
    render(); savedCount();
    const res = on
      ? await LS.db.from('member_saved_jobs').upsert({ user_id: LS.user.id, job_id: id, job: job, saved_at: new Date().toISOString() })
      : await LS.db.from('member_saved_jobs').delete().eq('user_id', LS.user.id).eq('job_id', id);
    if (res.error) { if (on) saved.delete(id); else saved.add(id); render(); savedCount(); $('jbNote').textContent = 'Couldn’t save that just now. Please try again.'; }
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-save]'); if (b) save(b.dataset.save); });

  function onUser(u) {
    if (!u) { saved = new Set(); render(); savedCount(); return; }
    LS.db.from('member_saved_jobs').select('job_id').eq('user_id', u.id).then(async (r) => {
      saved = new Set((r.data || []).map((x) => x.job_id));
      // finish a save someone started before signing in
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem('ls_pending_save') || 'null'); localStorage.removeItem('ls_pending_save'); } catch (e) {}
      if (pending && !saved.has(pending.id)) {
        const res = await LS.db.from('member_saved_jobs').upsert({ user_id: u.id, job_id: pending.id, job: pending, saved_at: new Date().toISOString() });
        if (!res.error) { saved.add(pending.id); $('jbNote').textContent = 'Saved “' + pending.title + '” to your plan.'; }
      }
      render(); savedCount();
    });
  }

  fetch('data/live-jobs.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => {
    all = d.jobs || [];
    const up = d.updated ? new Date(d.updated * 1000) : null;
    $('jbUpdated').textContent = up ? 'Updated ' + up.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : '';
    render();
    if (window.LS) LS.onUser(onUser);
  }).catch(() => { list.innerHTML = '<div class="jb-empty"><p>Jobs couldn’t load just now. Please refresh in a moment.</p></div>'; });
})();
