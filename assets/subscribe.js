/* Layoff Support: gentle email invitations.
   - Inline: any <div class="ls-sub" data-source="..."> becomes a small form. Its title, text and button
     come from data-title, data-text and data-button. People who leave their email get the welcome letters.
   - Corner card: once per visit, only after someone has scrolled most of a page and stayed a little while.
     "Not now" keeps it away for two weeks.
   Nothing shows for signed-in members or people who've already subscribed. */
(function () {
  const KEY = 'ls_subscribed', LATER = 'ls_sub_later', SEEN = 'ls_sub_seen';
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
    set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch (e) {} },
  };
  const subscribed = () => !!store.get(KEY);
  // Remember the ad or site that brought this visitor (from ?utm_source= / ?utm_campaign= on the first page they land on)
  try {
    const q = new URLSearchParams(location.search), src = q.get('utm_source');
    if (src && src !== 'email' && !sessionStorage.getItem('ls_came_from')) {
      sessionStorage.setItem('ls_came_from', (src + (q.get('utm_campaign') ? ':' + q.get('utm_campaign') : '')).slice(0, 80));
    }
  } catch (e) {}
  const signedIn = () => !!(window.LS && window.LS.user);

  const css = document.createElement('style');
  css.textContent =
    '.ls-sub{margin:22px 0;padding:22px 24px;border-radius:18px;background:linear-gradient(135deg,#f0fdfa,#f5f3ff);border:1px solid #e2e8f0}' +
    '.ls-sub[hidden],.ls-subcard[hidden]{display:none!important}' +
    '.ls-sub__title{margin:0 0 4px;font-family:"Cormorant Garamond",Georgia,serif;font-size:24px;font-weight:600;color:#0f172a}' +
    '.ls-sub__text{margin:0 0 14px;font-size:15px;line-height:1.55;color:#475569;max-width:60ch}' +
    '.ls-sub__form{display:flex;flex-wrap:wrap;gap:10px;align-items:center}' +
    '.ls-sub__form input{flex:1 1 220px;min-width:0;max-width:340px;padding:12px 16px;border:1px solid #cbd5e1;border-radius:999px;font:inherit;font-size:15px;background:#fff}' +
    '.ls-sub__form input:focus{outline:2px solid #14b8a6;outline-offset:1px;border-color:#14b8a6}' +
    '.ls-sub__form button{padding:12px 20px;border:0;border-radius:999px;background:#0f766e;color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer}' +
    '.ls-sub__form button:disabled{opacity:.6;cursor:default}' +
    '.ls-sub__fine{margin:10px 0 0;font-size:12.5px;color:#64748b}' +
    '.ls-sub__fine a{color:#0f766e}' +
    '.ls-sub__done{margin:0;font-size:15px;line-height:1.55;color:#0f766e;font-weight:600}' +
    '.ls-sub__err{margin:8px 0 0;font-size:13px;color:#be123c}' +
    '.ls-sub--quiet{margin:14px 0 0;padding:0;background:none;border:0}' +
    '.ls-sub--quiet .ls-sub__text{margin:0 0 10px;font-size:14px}' +
    '.ls-subcard{position:fixed;right:18px;bottom:18px;z-index:900;width:min(360px,calc(100vw - 36px));padding:20px 20px 16px;border-radius:20px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 18px 50px rgba(15,23,42,.16);opacity:0;transform:translateY(12px);transition:opacity .5s ease,transform .5s ease}' +
    '.ls-subcard.is-in{opacity:1;transform:none}' +
    '.ls-subcard .ls-sub__title{font-size:22px;padding-right:28px}' +
    '.ls-subcard .ls-sub__form input{flex-basis:100%;max-width:none}' +
    '.ls-subcard .ls-sub__form button{flex:1}' +
    '.ls-subcard__close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:999px;background:transparent;color:#64748b;font-size:20px;line-height:1;cursor:pointer}' +
    '.ls-subcard__close:hover{background:#f1f5f9}' +
    '.ls-subcard__later{border:0;background:none;padding:0;margin-left:4px;font:inherit;font-size:14px;color:#64748b;cursor:pointer;text-decoration:underline}' +
    '@media (prefers-reduced-motion:reduce){.ls-subcard{transition:none}}';
  document.head.appendChild(css);

  function esc(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }

  async function save(email, source, interest) {
    if (!window.LS || !LS.ready) throw new Error('not ready');
    await LS.ready;
    if (!LS.db) throw new Error('not ready');
    const row = { email: email.trim().toLowerCase(), source };
    if (interest) row.interest = String(interest).slice(0, 80);
    const came = store.get('ls_came_from', sessionStorage);
    if (came) row.came_from = came;
    const { error } = await LS.db.from('subscribers').insert(row);
    if (error && error.code !== '23505') throw error;   // 23505: already subscribed, which is fine
    store.set(KEY, '1');
  }

  function form(source, button, interest) {
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<form class="ls-sub__form" novalidate>' +
        '<label class="sr-only" for="lsSub-' + source + '">Your email</label>' +
        '<input id="lsSub-' + source + '" type="email" name="email" autocomplete="email" placeholder="you@example.com" required>' +
        '<button type="submit">' + esc(button) + '</button>' +
      '</form>' +
      '<p class="ls-sub__fine">Free, a few short letters, and you can stop with one tap. <a href="privacy.html">Privacy</a></p>' +
      '<p class="ls-sub__err" role="alert" hidden></p>';
    const f = wrap.querySelector('form'), err = wrap.querySelector('.ls-sub__err');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = f.email.value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { err.textContent = 'That email doesn’t look quite right.'; err.hidden = false; return; }
      err.hidden = true; f.querySelector('button').disabled = true;
      try {
        await save(email, source, typeof interest === 'function' ? interest() : interest);
        wrap.innerHTML = '<p class="ls-sub__done">Done. Your first letter is on its way. Check your inbox in a minute.</p>' +
          '<p class="ls-sub__fine">Want to save your plan too? <a href="account.html" data-require-signin="Save your plan and checklist across devices. No password needed.">Sign in free</a>.</p>';
        document.querySelectorAll('.ls-sub,.ls-subcard').forEach((el) => { if (!el.contains(wrap)) el.hidden = true; });
      } catch (x) {
        f.querySelector('button').disabled = false;
        err.textContent = 'Something went wrong. Please try again in a moment.'; err.hidden = false;
      }
    });
    return wrap;
  }

  // Inline invitations
  function inline() {
    document.querySelectorAll('.ls-sub[data-source]').forEach((el) => {
      if (el.dataset.ready) return; el.dataset.ready = '1';
      const src = el.dataset.source;
      const interest = src === 'jobs' ? () => ((location.hash || '').replace(/^#for-/, '') || '') : '';
      el.innerHTML = (el.dataset.title ? '<p class="ls-sub__title">' + esc(el.dataset.title) + '</p>' : '') +
        '<p class="ls-sub__text">' + esc(el.dataset.text || '') + '</p>';
      el.appendChild(form(src, el.dataset.button || 'Send me the letters', interest));
    });
  }

  // Corner card: once per visit, after reading most of a page for a little while
  function card() {
    const page = (location.pathname.split('/').pop() || 'index.html');
    if (/^(account|email|privacy|marketplace)\.html$/.test(page)) return;
    if (store.get(SEEN, sessionStorage)) return;
    const later = +store.get(LATER) || 0;
    if (Date.now() < later) return;
    const start = Date.now();
    let shown = false;
    function check() {
      if (shown || signedIn() || subscribed()) return;
      const doc = document.documentElement;
      const depth = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      if (depth < 0.55 || Date.now() - start < 20000) return;
      shown = true; store.set(SEEN, '1', sessionStorage);
      window.removeEventListener('scroll', check);
      const el = document.createElement('aside');
      el.className = 'ls-subcard'; el.setAttribute('aria-label', 'Get our letters by email');
      el.innerHTML = '<button type="button" class="ls-subcard__close" aria-label="Close">&times;</button>' +
        '<p class="ls-sub__title">A calm letter, now and then</p>' +
        '<p class="ls-sub__text">One thing worth doing at a time, from people who’ve been through a layoff. No account needed.</p>';
      el.appendChild(form('corner', 'Send me the letters'));
      const fine = el.querySelector('.ls-sub__fine');
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ls-subcard__later'; btn.textContent = 'Not now';
      fine.appendChild(document.createTextNode(' · ')); fine.appendChild(btn);
      const away = () => { store.set(LATER, String(Date.now() + 14 * 86400000)); el.classList.remove('is-in'); setTimeout(() => el.remove(), 500); };
      el.querySelector('.ls-subcard__close').addEventListener('click', away);
      btn.addEventListener('click', away);
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    }
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 21000);
  }

  function apply() {
    const hide = signedIn() || subscribed();
    document.querySelectorAll('.ls-sub[data-source]').forEach((el) => { if (!el.querySelector('.ls-sub__done')) el.hidden = hide; });
    document.querySelectorAll('.ls-subcard').forEach((el) => { if (signedIn()) el.remove(); });
  }

  function init() {
    inline(); apply(); card();
    if (window.LS && LS.onUser) LS.onUser(apply);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
