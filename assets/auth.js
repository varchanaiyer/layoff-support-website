/* Layoff Support: sign-in (Supabase) shared by every page.
   - Adds a quiet "Sign in" / "Your progress" link to the menus.
   - LS.requireSignIn(reason) opens a sign-in pop-up (Google or emailed link, no passwords).
   - LS.onUser(fn) runs fn(user) now and whenever someone signs in or out.
   The publishable key below is meant to be public; row-level security in the
   database makes sure each person can only read and change their own rows. */
(function () {
  const SUPABASE_URL = 'https://iqhxtedptrjaftdunuwh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_eD-Ky1DweJKb4NMuVr_XPw_fRqHqF1f';
  const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

  const listeners = [];
  let client = null;
  let user = null;
  let readyResolve;
  let initialized = false;
  const ready = new Promise((r) => (readyResolve = r));

  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve();
      const s = document.createElement('script');
      s.src = SDK;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function emit() {
    renderNavLinks();
    if (client) syncChecklist();
    listeners.forEach((fn) => { try { fn(user); } catch (e) { console.error(e); } });
  }

  function loadCss() {
    if (document.querySelector('link[href*="assets/auth.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'assets/auth.css?v=202611281942';
    document.head.appendChild(l);
  }

  async function init() {
    loadCss();
    try {
      await loadSdk();
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      });
      const { data } = await client.auth.getSession();
      user = data.session ? data.session.user : null;
      if (user) await ensureProfile();
      client.auth.onAuthStateChange(async (_evt, session) => {
        const was = user && user.id;
        user = session ? session.user : null;
        if (user && user.id !== was) await ensureProfile();
        if ((user && user.id) !== was) emit();
      });
    } catch (e) {
      console.warn('Sign-in is unavailable right now', e);
    }
    initialized = true;
    readyResolve();
    emit();
    // Arriving from an email with ?signin=1: open sign-in straight away (if not signed in already)
    try {
      if (!user && new URLSearchParams(location.search).has('signin')) {
        const original = new URLSearchParams(location.search).has('original');
        setTimeout(() => requireSignIn(original
          ? 'Welcome back. You were one of our original members, so you\u2019re seeing this first. Sign in with the email we wrote to. No password needed.'
          : 'Welcome back. Sign in with the email we wrote to, and we\u2019ll recognise you. No password needed.'), 500);
      }
    } catch (e) {}
  }

  // Make sure a profile row exists; mark people who were members on the old site.
  async function ensureProfile() {
    try {
      const { data: existing } = await client.from('member_profiles').select('id').eq('id', user.id).maybeSingle();
      if (existing) return;
      let first = (user.user_metadata && (user.user_metadata.given_name || (user.user_metadata.full_name || '').split(' ')[0])) || null;
      let returning = false;
      const { data: legacy } = await client.rpc('my_legacy_member');
      if (legacy && legacy.length) { returning = true; first = legacy[0].first_name || first; }
      await client.from('member_profiles').insert({ id: user.id, email: user.email, first_name: first, returning_member: returning });
      try { sessionStorage.setItem('ls_open_checklist', '1'); } catch (e) {}
    } catch (e) { console.warn('Could not set up profile', e); }
  }

  // ---------- Menus ----------
  function renderNavLinks() {
    const label = user ? 'Your progress' : 'Sign in';
    const nav = document.querySelector('.site-nav');
    if (nav) {
      let a = nav.querySelector('.site-nav__signin');
      if (!a) {
        a = document.createElement('a');
        a.className = 'site-nav__signin';
        const cta = nav.querySelector('.site-nav__cta');
        nav.insertBefore(a, cta || null);
      }
      a.href = 'account.html';
      a.textContent = label;
      let out = nav.querySelector('.site-nav__signout');
      if (!out) {
        out = document.createElement('a');
        out.className = 'site-nav__signout';
        out.href = '#';
        out.textContent = 'Sign out';
        out.addEventListener('click', (e) => { e.preventDefault(); window.LS.signOut(); });
        a.insertAdjacentElement('afterend', out);
      }
      out.hidden = !user;
    }
    const side = document.querySelector('#sidebar .dash__menu');
    if (side) {
      let li = side.querySelector('.dash__signin');
      if (!li) {
        li = document.createElement('li');
        li.className = 'dash__signin';
        li.innerHTML = '<a href="account.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span></span></a>';
        side.appendChild(li);
      }
      li.querySelector('span').textContent = label;
      let outLi = side.querySelector('.dash__signout');
      if (!outLi) {
        outLi = document.createElement('li');
        outLi.className = 'dash__signout';
        outLi.innerHTML = '<a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>Sign out</a>';
        outLi.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); window.LS.signOut(); });
        side.appendChild(outLi);
      }
      outLi.hidden = !user;
      const onAcct = document.body.getAttribute('data-page') === 'account';
      li.querySelector('a').classList.toggle('is-active', onAcct);
      if (onAcct) li.querySelector('a').setAttribute('aria-current', 'page');
    }
    document.querySelectorAll('[data-signed-in]').forEach((el) => { el.hidden = !user; });
    document.querySelectorAll('[data-signed-out]').forEach((el) => { el.hidden = !!user; });
  }


  // ---------- Checklist pop-up (signed-in only) ----------
  const ITEMS = [
    ['unemployment', 'File for unemployment', 'Do it in your first week, even if you got severance.', 'https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx', "Find your state's office"],
    ['deadlines', 'Work out your deadlines', 'Severance, health coverage, visa and FSA dates, from your last day.', 'plan.html', 'Open your plan'],
    ['severance', 'Read your severance agreement before signing', "If you're 40 or over, you get at least 21 days (45 in a group layoff).", 'offers.html#legal', 'Low-cost legal help'],
    ['coverage', 'Choose your health coverage', 'You have 60 days from losing job coverage. Compare before paying for COBRA.', 'offers.html#health', 'Compare your options'],
    ['talk', 'Talk to someone', 'A friend, a support group or a counselor. Low-cost options are listed.', 'offers.html#therapy', 'Find support'],
    ['resume', 'Update your resume and LinkedIn', 'Free tools can tailor them to each job.', 'offers.html#tools', 'Free job-search tools'],
    ['mentor', 'Book a free session with a coach or mentor', 'Your local American Job Center and alumni office are free.', 'offers.html#coaching', 'Free coaching'],
    ['nextchapter', 'Set up your Work Board profile', 'Tell us the work you want, and we\'ll match you to roles and gigs.', 'marketplace.html', 'Open the Work Board'],
    ['apply', 'Send your first five applications', 'Five thoughtful ones beat fifty rushed ones.', 'jobs.html', 'Job boards'],
  ];
  let done = null, fab = null, sheet = null;

  async function loadProgress() {
    done = {};
    const { data } = await client.from('member_progress').select('item,done').eq('user_id', user.id);
    (data || []).forEach((r) => (done[r.item] = r.done));
    updateCounts();
  }
  function count() { return ITEMS.filter(([k]) => done && done[k]).length; }
  function updateCounts() {
    const n = count(), t = ITEMS.length;
    if (fab) fab.querySelector('.ls-fab__count').textContent = n + '/' + t;
    if (sheet) {
      sheet.querySelector('.ls-check__label').textContent = n + ' of ' + t + ' done';
      sheet.querySelector('.ls-check__fill').style.width = Math.round(100 * n / t) + '%';
    }
    document.dispatchEvent(new CustomEvent('ls:progress', { detail: { done: n, total: t } }));
  }
  function buildFab() {
    fab = document.createElement('button');
    fab.className = 'ls-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open your checklist');
    fab.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg><span>Checklist</span><span class="ls-fab__count">0/9</span>';
    fab.addEventListener('click', openChecklist);
    document.body.appendChild(fab);
  }
  function buildSheet() {
    sheet = document.createElement('div');
    sheet.className = 'ls-modal ls-check';
    sheet.hidden = true;
    sheet.innerHTML = '<div class="ls-modal__card ls-check__card" role="dialog" aria-modal="true" aria-labelledby="ls-check-title">' +
      '<button class="ls-modal__close" aria-label="Close">&times;</button>' +
      '<p class="ls-modal__eyebrow">Your checklist</p>' +
      '<h2 id="ls-check-title">The steps that matter most</h2>' +
      '<p class="ls-check__label">0 of 9 done</p><div class="ls-check__bar"><span class="ls-check__fill"></span></div>' +
      '<ul class="ls-check__list"></ul>' +
      '<p class="ls-modal__small">Saved to your account. <a href="account.html">Your progress page</a> &middot; <a href="#" class="ls-check__signout">Sign out</a></p></div>';
    document.body.appendChild(sheet);
    const close = () => { sheet.hidden = true; document.body.style.overflow = ''; };
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
    sheet.querySelector('.ls-modal__close').addEventListener('click', close);
    sheet.querySelector('.ls-check__signout').addEventListener('click', (e) => { e.preventDefault(); window.LS.signOut(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) close(); });
    const ul = sheet.querySelector('.ls-check__list');
    ITEMS.forEach(([key, title, detail, href, linkText]) => {
      const li = document.createElement('li');
      li.innerHTML = '<label><input type="checkbox" /><span><b></b><small></small></span></label><a></a>';
      li.querySelector('b').textContent = title;
      li.querySelector('small').textContent = detail;
      const a = li.querySelector('a'); a.href = href; a.textContent = linkText + ' →';
      if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
      const box = li.querySelector('input');
      box.dataset.key = key;
      box.addEventListener('change', async () => {
        done[key] = box.checked; li.classList.toggle('is-done', box.checked); updateCounts();
        await client.from('member_progress').upsert({ user_id: user.id, item: key, done: box.checked, updated_at: new Date().toISOString() });
      });
      ul.appendChild(li);
    });
  }
  async function openChecklist() {
    if (!user) return requireSignIn('Sign in to keep a checklist of the steps that matter, saved between visits.');
    if (!sheet) buildSheet();
    if (!done) await loadProgress();
    sheet.querySelectorAll('.ls-check__list input').forEach((box) => {
      box.checked = !!done[box.dataset.key];
      box.closest('li').classList.toggle('is-done', box.checked);
    });
    updateCounts();
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  async function syncChecklist() {
    if (user) {
      if (!fab) buildFab();
      fab.hidden = false;
      await loadProgress();
      let open = false;
      try { open = sessionStorage.getItem('ls_open_checklist') === '1'; sessionStorage.removeItem('ls_open_checklist'); } catch (e) {}
      if (open) openChecklist();
    } else {
      if (fab) fab.hidden = true;
      if (sheet) sheet.hidden = true;
      done = null;
    }
  }

  // ---------- Sign-in pop-up ----------
  let modal;
  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'ls-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ls-modal__card" role="dialog" aria-modal="true" aria-labelledby="ls-modal-title">
        <button class="ls-modal__close" aria-label="Close">&times;</button>
        <p class="ls-modal__eyebrow">Free account</p>
        <h2 id="ls-modal-title">Sign in to save your progress</h2>
        <p class="ls-modal__reason"></p>
        <button class="ls-btn ls-btn--google" type="button">
          <svg viewBox="0 0 48 48" aria-hidden="true" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>
          Continue with Google
        </button>
        <div class="ls-modal__or"><span>or</span></div>
        <form class="ls-modal__form">
          <label for="ls-email">Email</label>
          <input id="ls-email" type="email" required autocomplete="email" placeholder="you@example.com" />
          <button class="ls-btn ls-btn--primary" type="submit">Email me a sign-in link</button>
        </form>
        <p class="ls-modal__status" role="status"></p>
        <p class="ls-modal__small">No password needed. Free, and you can delete your account at any time. See our <a href="privacy.html">privacy policy</a>.</p>
      </div>`;
    document.body.appendChild(modal);
    const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('.ls-modal__close').addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
    modal.querySelector('.ls-btn--google').addEventListener('click', async () => {
      await ready;
      if (!client) return say('Sign-in is unavailable right now. Please try again later.');
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl() } });
      if (error) say('Google sign-in didn\'t work. Try the email link instead.');
    });
    modal.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await ready;
      if (!client) return say('Sign-in is unavailable right now. Please try again later.');
      const email = modal.querySelector('#ls-email').value.trim();
      const btn = modal.querySelector('.ls-btn--primary');
      btn.disabled = true;
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: returnUrl() } });
      btn.disabled = false;
      if (error) say(/rate/i.test(error.message) ? 'Too many sign-in emails just now. Please wait a few minutes and try again.' : 'That didn\'t work. Check the email address and try again.');
      else say('Check your inbox for a sign-in link from Layoff Support. It can take a minute, and may land in spam.', true);
    });
  }
  function say(msg, ok) {
    const s = modal.querySelector('.ls-modal__status');
    s.textContent = msg;
    s.className = 'ls-modal__status ' + (ok ? 'is-ok' : 'is-err');
  }
  let returnTo = null;
  function returnUrl() { return returnTo || (location.origin + location.pathname + location.hash); }

  function requireSignIn(reason, opts) {
    if (user) return Promise.resolve(user);
    if (!modal) buildModal();
    returnTo = opts && opts.returnTo ? new URL(opts.returnTo, location.href).toString() : null;
    modal.querySelector('.ls-modal__reason').textContent = reason || 'Keep your plan, deadlines and checklist in one place, and get reminders before anything is due.';
    modal.querySelector('.ls-modal__status').textContent = '';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.ls-btn--google').focus(), 30);
    return new Promise((resolve) => onUser((u) => { if (u) resolve(u); }));
  }

  function onUser(fn) { listeners.push(fn); if (initialized) fn(user); }

  // Any element with data-require-signin="reason" opens the pop-up when clicked.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-require-signin]');
    if (!el || user) return;
    e.preventDefault();
    requireSignIn(el.getAttribute('data-require-signin'), { returnTo: el.getAttribute('href') || null });
  });

  window.LS = {
    ready,
    get user() { return user; },
    get db() { return client; },
    onUser,
    requireSignIn,
    openChecklist,
    checklistItems: ITEMS,
    async signOut() { if (client) await client.auth.signOut(); location.href = 'index.html'; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
