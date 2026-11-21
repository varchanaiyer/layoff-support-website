/* Layoff Support: a calm atmosphere.
   1. A soft colour aura: large, blurred pastel clouds drift very slowly behind each
      section (30–45 second cycles) and lean a few pixels toward the cursor, with heavy
      easing, so the page feels alive but never busy.
   2. A one-minute breather: any element with [data-breathe] opens a full-screen space
      with a circle to breathe with (in for 4 seconds, out for 6).
   "Reduce motion" is respected: the aura stays still, and the breather fades the words
   instead of moving the circle. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pastel pairs, one per section, cycling down the page.
  const PAIRS = [
    ['94,234,212', '196,181,253'],  // mint + lavender
    ['196,181,253', '253,186,140'], // lavender + peach
    ['253,186,140', '252,165,200'], // peach + rose
    ['147,210,250', '94,234,212'],  // sky + mint
    ['167,243,208', '147,210,250'], // green + sky
    ['252,165,200', '196,181,253'], // rose + lavender
  ];

  const STYLE =
    '.calm-host{position:relative;isolation:isolate}' +
    '.calm-aura{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none}' +
    '.calm-aura i{position:absolute;display:block;border-radius:50%;will-change:transform}' +
    '.calm-breathe-link{display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:0;font:inherit;font-size:14px;font-weight:600;color:#0f766e;cursor:pointer}' +
    '.calm-breathe-link:hover{text-decoration:underline}' +
    '.calm-breathe-link svg{flex:none}' +
    '.calm-room{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;background:radial-gradient(120% 90% at 30% 20%,#e7fbf6 0%,#efeafd 55%,#fdf1e6 100%);opacity:0;transition:opacity .8s ease}' +
    '.calm-room.is-open{opacity:1}' +
    '.calm-room[hidden]{display:none}' +
    '.calm-room__inner{display:grid;justify-items:center;gap:28px;text-align:center;padding:24px;font-family:Inter,system-ui,-apple-system,sans-serif}' +
    '.calm-room__orb{width:min(56vw,320px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.95) 0%,rgba(153,246,228,.9) 35%,rgba(45,212,191,.55) 70%,rgba(45,212,191,.15) 100%);box-shadow:0 0 80px 20px rgba(45,212,191,.25);transform:scale(.62);transition:transform 4s cubic-bezier(.45,0,.55,1)}' +
    '.calm-room__word{font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(30px,5vw,44px);font-weight:600;color:#10302b;min-height:1.2em;margin:0;transition:opacity 1s ease}' +
    '.calm-room__sub{font-size:15px;color:#4b5f5a;margin:-16px 0 0;max-width:420px;line-height:1.55}' +
    '.calm-room__done{border:1px solid rgba(15,118,110,.35);background:rgba(255,255,255,.7);color:#0f766e;font:600 15px/1 Inter,system-ui,sans-serif;padding:12px 22px;border-radius:999px;cursor:pointer}' +
    '.calm-room__done:hover{background:#fff}';

  // ---------- Aura ----------
  const ptr = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };
  window.addEventListener('pointermove', (e) => {
    ptr.x = e.clientX / window.innerWidth;
    ptr.y = e.clientY / window.innerHeight;
  }, { passive: true });

  const fields = [];
  function attach(host, i) {
    if (host.querySelector(':scope > .calm-aura')) return;
    host.classList.add('calm-host');
    const aura = document.createElement('div');
    aura.className = 'calm-aura';
    aura.setAttribute('aria-hidden', 'true');
    const [a, b] = PAIRS[i % PAIRS.length];
    // Three clouds: two colours plus a faint blend, placed to frame the content.
    const blobs = [
      { c: a, size: 62, x: i % 2 ? 78 : 18, y: 24, alpha: 0.22, period: 38000, ax: 6, ay: 5, phase: i },
      { c: b, size: 54, x: i % 2 ? 20 : 82, y: 72, alpha: 0.19, period: 46000, ax: 7, ay: 4, phase: i + 2 },
      { c: a, size: 40, x: 50, y: 50, alpha: 0.09, period: 31000, ax: 9, ay: 6, phase: i + 4 },
    ];
    blobs.forEach((bl) => {
      const el = document.createElement('i');
      el.style.width = bl.size + 'vmax';
      el.style.height = bl.size + 'vmax';
      el.style.left = 'calc(' + bl.x + '% - ' + bl.size / 2 + 'vmax)';
      el.style.top = 'calc(' + bl.y + '% - ' + bl.size / 2 + 'vmax)';
      el.style.background = 'radial-gradient(circle, rgba(' + bl.c + ',' + bl.alpha + ') 0%, rgba(' + bl.c + ',' + (bl.alpha * 0.45).toFixed(3) + ') 38%, rgba(' + bl.c + ',0) 70%)';
      bl.el = el;
      aura.appendChild(el);
    });
    host.insertBefore(aura, host.firstChild);
    const f = { host, blobs, visible: true };
    fields.push(f);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { f.visible = es[0].isIntersecting; }).observe(host);
  }

  function frame(t) {
    // Very heavy easing: the aura takes a few seconds to catch up with the cursor.
    ptr.sx += (ptr.x - ptr.sx) * 0.012;
    ptr.sy += (ptr.y - ptr.sy) * 0.012;
    const lx = (ptr.sx - 0.5) * 2, ly = (ptr.sy - 0.5) * 2; // -1..1
    if (!document.hidden) {
      fields.forEach((f) => {
        if (!f.visible) return;
        f.blobs.forEach((bl, j) => {
          const p = (t / bl.period) * Math.PI * 2 + bl.phase;
          const dx = Math.sin(p) * bl.ax + lx * (3 + j * 1.5);
          const dy = Math.cos(p * 0.8) * bl.ay + ly * (2 + j);
          const s = 1 + Math.sin(p * 0.5) * 0.05;
          bl.el.style.transform = 'translate3d(' + dx.toFixed(2) + 'vmin,' + dy.toFixed(2) + 'vmin,0) scale(' + s.toFixed(3) + ')';
        });
      });
    }
    if (!reduce) requestAnimationFrame(frame);
  }


  // ---------- Leaves that follow the cursor ----------
  // As the cursor moves, a few tiny leaves (like the logo) sprout behind it and float
  // gently down, swaying and fading. A click sends out a soft ripple and two leaves.
  function startLeaves() {
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1100';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    function fit() { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    fit(); addEventListener('resize', fit);
    const TINTS = ['20,184,166', '45,212,191', '139,124,246', '16,185,129', '244,152,96'];
    const leaves = [], rings = [];
    let lx = null, ly = null, running = false, lastSpawn = 0;
    function leaf(x, y, burst) {
      if (leaves.length > 36) leaves.shift();
      leaves.push({
        x, y, born: performance.now(), life: 2600 + Math.random() * 1200,
        vx: (Math.random() - 0.5) * (burst ? 1.4 : 0.5), vy: 0.25 + Math.random() * 0.35 - (burst ? 0.9 : 0),
        rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.03,
        size: 5 + Math.random() * 4, sway: Math.random() * Math.PI * 2,
        tint: TINTS[(Math.random() * TINTS.length) | 0],
      });
      run();
    }
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (lx !== null) {
        const d = Math.hypot(e.clientX - lx, e.clientY - ly);
        if (d > 34 && now - lastSpawn > 70) { leaf(e.clientX, e.clientY, false); lastSpawn = now; lx = e.clientX; ly = e.clientY; }
      } else { lx = e.clientX; ly = e.clientY; }
    }, { passive: true });
    addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      rings.push({ x: e.clientX, y: e.clientY, born: performance.now() });
      leaf(e.clientX, e.clientY, true); leaf(e.clientX, e.clientY, true);
    }, { passive: true });
    function drawLeaf(l, a) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      const s = l.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.15, 0, s);
      ctx.quadraticCurveTo(-s * 0.95, -s * 0.15, 0, -s);
      ctx.fillStyle = 'rgba(' + l.tint + ',' + (0.5 * a).toFixed(3) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7); ctx.lineTo(0, s * 0.85);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * a).toFixed(3) + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
    function tick(now) {
      ctx.clearRect(0, 0, W, H);
      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i], age = (now - l.born) / l.life;
        if (age >= 1) { leaves.splice(i, 1); continue; }
        l.vy = Math.min(0.75, l.vy + 0.012);          // drift down gently
        l.vx *= 0.985;
        l.x += l.vx + Math.sin(now / 650 + l.sway) * 0.35; // sway side to side
        l.y += l.vy;
        l.rot += l.spin + Math.sin(now / 900 + l.sway) * 0.004;
        const a = age < 0.15 ? age / 0.15 : 1 - (age - 0.15) / 0.85;
        drawLeaf(l, Math.max(0, a));
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i], age = (now - r.born) / 1100;
        if (age >= 1) { rings.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - age, 3);
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + e * 46, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(20,184,166,' + (0.35 * (1 - age)).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (leaves.length || rings.length) requestAnimationFrame(tick);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }
    function run() { if (!running) { running = true; requestAnimationFrame(tick); } }
  }

  // ---------- One-minute breather ----------
  let room = null, timer = null;
  function buildRoom() {
    room = document.createElement('div');
    room.className = 'calm-room';
    room.hidden = true;
    room.setAttribute('role', 'dialog');
    room.setAttribute('aria-modal', 'true');
    room.setAttribute('aria-label', 'One-minute breathing exercise');
    room.innerHTML =
      '<div class="calm-room__inner">' +
      '<div class="calm-room__orb" aria-hidden="true"></div>' +
      '<p class="calm-room__word" aria-live="polite">Get comfortable</p>' +
      '<p class="calm-room__sub"></p>' +
      '<button type="button" class="calm-room__done">I\'m done</button>' +
      '</div>';
    document.body.appendChild(room);
    room.querySelector('.calm-room__done').addEventListener('click', closeRoom);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && room && !room.hidden) closeRoom(); });
  }
  function openRoom() {
    if (!room) buildRoom();
    const orb = room.querySelector('.calm-room__orb');
    const word = room.querySelector('.calm-room__word');
    const sub = room.querySelector('.calm-room__sub');
    const btn = room.querySelector('.calm-room__done');
    const IN = 4000, OUT = 6000, ROUNDS = 6;
    let n = 0;
    function say(text) {
      if (reduce) { word.style.opacity = 0; setTimeout(() => { word.textContent = text; word.style.opacity = 1; }, 400); }
      else word.textContent = text;
    }
    function breatheIn() {
      if (n >= ROUNDS) return finish();
      n++;
      say('Breathe in');
      orb.style.transitionDuration = IN + 'ms';
      if (!reduce) orb.style.transform = 'scale(1)';
      timer = setTimeout(breatheOut, IN);
    }
    function breatheOut() {
      say('Breathe out');
      orb.style.transitionDuration = OUT + 'ms';
      if (!reduce) orb.style.transform = 'scale(.62)';
      timer = setTimeout(breatheIn, OUT);
    }
    function finish() {
      say('Well done');
      sub.textContent = 'Whenever you\'re ready. There\'s no rush.';
      btn.textContent = 'Back to the page';
    }
    clearTimeout(timer);
    orb.style.transitionDuration = '1200ms';
    orb.style.transform = 'scale(.62)';
    word.textContent = 'Get comfortable';
    sub.textContent = 'Follow the circle. Breathe in as it grows, and out as it softens. Six slow breaths, about a minute.';
    btn.textContent = 'I\'m done';
    room.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => room.classList.add('is-open'));
    btn.focus();
    timer = setTimeout(breatheIn, 2200);
  }
  function closeRoom() {
    clearTimeout(timer);
    room.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { room.hidden = true; }, 600);
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-breathe]');
    if (!el) return;
    e.preventDefault();
    openRoom();
  });
  window.Calm = { breathe: openRoom };

  function init() {
    const st = document.createElement('style');
    st.textContent = STYLE;
    document.head.appendChild(st);
    const hosts = Array.from(document.querySelectorAll('.h-hero, body > section, main > section, main.page, .dash__main, [data-waves]'))
      .filter((el) => !el.closest('footer') && !el.closest('header') && !el.parentElement.closest('.calm-host, .h-hero, main.page, .dash__main'));
    hosts.forEach((el, i) => attach(el, i));
    frame(0);
    // Leaves trail is available but switched off; call startLeaves() to turn it on.
    if (document.body.hasAttribute('data-leaves') && !reduce && window.matchMedia('(pointer: fine)').matches) startLeaves();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
