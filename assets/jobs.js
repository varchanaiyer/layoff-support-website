/* Layoff Support: the job board directory.
   We list the best job boards (not individual jobs) and send people to them with a
   referral tag. "Save" needs a free account; saved boards appear in Your plan. */
(function () {
  const grid = document.getElementById('bdGrid'); if (!grid || !window.LS_BOARDS) return;
  const TAGS = window.LS_BOARD_TAGS, BOARDS = window.LS_BOARDS;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  let active = '', saved = new Set();

  // Filter chips, only for groups that have at least one board
  const used = new Set(BOARDS.flatMap((b) => b.tags));
  $('bdChips').innerHTML = '<button type="button" class="bd-chip" data-tag="" aria-pressed="true">All boards</button>' +
    window.LS_BOARD_GROUPS.map(([label, keys]) => {
      const ks = keys.filter((k) => used.has(k)); if (!ks.length) return '';
      return '<span class="bd-group">' + esc(label) + '</span>' + ks.map((k) => '<button type="button" class="bd-chip bd-chip--' + k + '" data-tag="' + k + '" aria-pressed="false">' + esc(TAGS[k]) + '</button>').join('');
    }).join('');
  $('bdChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]'); if (!b) return;
    active = active === b.dataset.tag ? '' : b.dataset.tag;
    $('bdChips').querySelectorAll('[data-tag]').forEach((c) => c.setAttribute('aria-pressed', c.dataset.tag === active));
    try { history.replaceState(null, '', active ? '#for-' + active : location.pathname); } catch (e) {}
    render();
  });

  function card(b) {
    const isSaved = saved.has('board:' + b.id);
    const mono = esc(b.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2));
    const preview = b.img
      ? '<img src="assets/img/boards/' + b.img + '.jpg" alt="' + esc(b.name) + ' homepage" loading="lazy">'
      : '<span class="bd-ph"><span>' + mono + '</span><b>' + esc(b.name) + '</b></span>';
    return '<article class="bd-card">' +
      '<a class="bd-shot" href="' + esc(LS_refLink(b.url)) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><span class="bd-bar"><i></i><i></i><i></i><span>' + esc(new URL(b.url).hostname.replace(/^www\./, '')) + '</span></span>' + preview + '</a>' +
      '<div class="bd-body">' +
        '<h3>' + esc(b.name) + '</h3>' +
        '<p class="bd-for">For ' + esc(/^[A-Z][a-z]/.test(b.for) ? b.for.charAt(0).toLowerCase() + b.for.slice(1) : b.for) + '</p>' +
        '<p class="bd-why">' + esc(b.why) + '</p>' +
        '<div class="bd-tags">' + b.tags.map((t) => '<span class="bd-tag bd-tag--' + t + '">' + esc(TAGS[t]) + '</span>').join('') + '<span class="bd-tag bd-tag--free">Free</span>' + (b.where ? '<span class="bd-tag">' + esc(b.where) + '</span>' : '') + '</div>' +
        '<div class="bd-actions">' +
          '<a class="btn btn--primary btn--sm" href="' + esc(LS_refLink(b.url)) + '" target="_blank" rel="noopener">Visit ' + esc(b.name) + ' &#8599;</a>' +
          '<button type="button" class="jb-save' + (isSaved ? ' is-saved' : '') + '" data-save="' + esc(b.id) + '" aria-pressed="' + isSaved + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span>' + (isSaved ? 'Saved' : 'Save') + '</span></button>' +
        '</div>' +
      '</div></article>';
  }
  function render() {
    const list = active ? BOARDS.filter((b) => b.tags.includes(active)) : BOARDS;
    $('bdCount').textContent = active ? list.length + (list.length === 1 ? ' board' : ' boards') + ': ' + TAGS[active] : BOARDS.length + ' boards, all checked and free';
    const NOTES = {
      mental: 'Few job boards focus on mental health alone. These boards include it, so you can ask for the support you need.',
      visa: 'These help you find employers who actually sponsor visas, so you can aim your applications where they count.',
      secondchance: 'There are few trustworthy boards here, and many spammy ones. These two are the real thing.',
    };
    grid.innerHTML = (NOTES[active] ? '<p class="bd-note">' + esc(NOTES[active]) + '</p>' : '') + list.map(card).join('');
    grid.classList.remove('is-in'); void grid.offsetWidth; grid.classList.add('is-in');
  }

  // ---------- Saving boards ----------
  function savedCount() { const el = $('jbSavedLink'); el.hidden = !saved.size; el.querySelector('b').textContent = saved.size; }
  function boardRow(b) { return { kind: 'board', name: b.name, url: b.url, for: b.for, why: b.why, tags: b.tags }; }
  async function save(id) {
    const b = BOARDS.find((x) => x.id === id); if (!b) return;
    const key = 'board:' + id;
    if (!window.LS || !LS.user) {
      try { localStorage.setItem('ls_pending_board', id); } catch (e) {}
      LS.requireSignIn('Sign in to save job boards. They’ll be waiting for you in your plan.');
      return;
    }
    const on = !saved.has(key);
    if (on) saved.add(key); else saved.delete(key);
    render(); savedCount();
    const res = on
      ? await LS.db.from('member_saved_jobs').upsert({ user_id: LS.user.id, job_id: key, job: boardRow(b), saved_at: new Date().toISOString() })
      : await LS.db.from('member_saved_jobs').delete().eq('user_id', LS.user.id).eq('job_id', key);
    if (res.error) { if (on) saved.delete(key); else saved.add(key); render(); savedCount(); $('jbNote').textContent = 'Couldn’t save that just now. Please try again.'; }
    else if (on) $('jbNote').innerHTML = 'Saved ' + esc(b.name) + ' to <a href="plan.html#saved">your plan</a>.';
  }
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-save]'); if (b) save(b.dataset.save); });
  function onUser(u) {
    if (!u) { saved = new Set(); render(); savedCount(); return; }
    LS.db.from('member_saved_jobs').select('job_id').eq('user_id', u.id).then(async (r) => {
      saved = new Set((r.data || []).map((x) => x.job_id));
      let pending = null; try { pending = localStorage.getItem('ls_pending_board'); localStorage.removeItem('ls_pending_board'); } catch (e) {}
      const b = pending && BOARDS.find((x) => x.id === pending);
      if (b && !saved.has('board:' + b.id)) {
        const res = await LS.db.from('member_saved_jobs').upsert({ user_id: u.id, job_id: 'board:' + b.id, job: boardRow(b), saved_at: new Date().toISOString() });
        if (!res.error) { saved.add('board:' + b.id); $('jbNote').innerHTML = 'Saved ' + esc(b.name) + ' to <a href="plan.html#saved">your plan</a>.'; }
      }
      render(); savedCount();
    });
  }

  const start = (location.hash || '').replace(/^#for-/, '');
  if (TAGS[start]) { active = start; $('bdChips').querySelectorAll('[data-tag]').forEach((c) => c.setAttribute('aria-pressed', c.dataset.tag === active)); }
  render();
  if (window.LS) LS.onUser(onUser);
})();
