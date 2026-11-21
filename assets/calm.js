/* Layoff Support: calm, cursor-aware background.
   Soft wave lines behind the top of each page that drift slowly and swell
   gently around the cursor (or a finger), plus a faint glow that follows it.
   Respects "reduce motion": the waves are drawn once and stay still. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const COLORS = ['20,184,166', '167,139,250', '251,146,60', '45,212,191', '129,140,248', '20,184,166'];

  // Pointer, smoothed so the waves follow it softly rather than snapping.
  const ptr = { x: -9999, y: -9999, sx: -9999, sy: -9999, energy: 0 };
  let lastMove = 0;
  function onMove(x, y) {
    const dx = x - ptr.x, dy = y - ptr.y;
    ptr.x = x; ptr.y = y;
    if (ptr.sx < -9000) { ptr.sx = x; ptr.sy = y; }
    ptr.energy = Math.min(1, ptr.energy + Math.min(40, Math.hypot(dx, dy)) / 400);
    lastMove = performance.now();
  }
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });


  const STYLE = '.calm-host{position:relative;isolation:isolate}' +
    '.calm-waves{position:absolute;left:0;top:0;width:100%;z-index:-1;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 18%,#000 78%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 18%,#000 78%,transparent 100%)}' +
    '.calm-glow{position:fixed;left:0;top:0;width:520px;height:520px;border-radius:50%;pointer-events:none;z-index:2;' +
    'background:radial-gradient(circle,rgba(45,212,191,.09) 0%,rgba(45,212,191,.04) 40%,transparent 66%);mix-blend-mode:multiply;will-change:transform;transition:opacity .6s}' +
    '@media (prefers-reduced-motion: reduce){.calm-glow{display:none}}';

  // ---------- Waves ----------
  const fields = [];
  function attach(host, opts) {
    if (!host || host.querySelector(':scope > canvas.calm-waves')) return;
    host.classList.add('calm-host');
    const c = document.createElement('canvas');
    c.className = 'calm-waves';
    c.setAttribute('aria-hidden', 'true');
    host.insertBefore(c, host.firstChild);
    const f = { host, c, ctx: c.getContext('2d'), w: 0, h: 0, visible: false, lines: opts.lines || 4, cap: opts.cap || 680, rgb: opts.rgb || '20,184,166', offset: opts.offset || 0, band: opts.band || 0.5 };
    fields.push(f);
    size(f);
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { f.visible = es[0].isIntersecting; }).observe(host);
  }
  function size(f) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = f.host.getBoundingClientRect();
    f.w = Math.max(1, Math.round(r.width));
    f.h = Math.max(1, Math.round(Math.min(r.height, f.cap)));
    f.c.width = f.w * dpr; f.c.height = f.h * dpr;
    f.c.style.height = f.h + 'px';
    f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => fields.forEach(size));

  // Soothing waves: a few evenly spaced lines that rise and fall together at a slow
  // breathing pace (about 5.5 seconds per breath), drifting gently sideways.
  // Near the cursor they lean softly away, like water parting, then settle back.
  const BREATH_MS = 5500;
  function draw(f, t) {
    const { ctx, w, h } = f;
    ctx.clearRect(0, 0, w, h);
    const r = f.host.getBoundingClientRect();
    const mx = ptr.sx - r.left, my = ptr.sy - r.top;
    const reach = Math.max(180, Math.min(320, w * 0.22));
    const breath = (1 - Math.cos((t % BREATH_MS) / BREATH_MS * Math.PI * 2)) / 2; // 0..1..0
    const lines = f.lines;
    for (let i = 0; i < lines; i++) {
      const base = h * (f.band + i * 0.1) - breath * 10;
      const amp = 14 + breath * 6;
      const k = 0.0032;
      const drift = t * 0.00005;
      ctx.beginPath();
      for (let x = -10; x <= w + 10; x += 6) {
        let y = base + Math.sin(x * k + drift + i * 0.55 + f.offset) * amp;
        const dx = x - mx, dy = base - my;
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach));
        if (g > 0.003) y += (dy >= 0 ? 1 : -1) * g * (10 + 16 * ptr.energy);
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + f.rgb + ',' + (0.22 - i * 0.035) + ')';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  // ---------- Glow that follows the cursor ----------
  let glow = null;
  if (finePointer && !reduce) {
    glow = document.createElement('div');
    glow.className = 'calm-glow';
    glow.setAttribute('aria-hidden', 'true');
  }

  function frame(t) {
    ptr.sx += (ptr.x - ptr.sx) * 0.035;
    ptr.sy += (ptr.y - ptr.sy) * 0.035;
    if (performance.now() - lastMove > 200) ptr.energy *= 0.985;
    if (!document.hidden) fields.forEach((f) => { if (f.visible) draw(f, t); });
    if (glow && ptr.x > -9000) glow.style.transform = 'translate3d(' + (ptr.sx - 260) + 'px,' + (ptr.sy - 260) + 'px,0)';
    requestAnimationFrame(frame);
  }

  function init() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    // Soft palette that changes gently from section to section
    const PALETTE = ['20,184,166', '139,124,246', '244,152,96', '56,170,230', '16,185,129', '226,110,160'];
    const hosts = Array.from(document.querySelectorAll('.h-hero, body > section, main > section, main.page, .dash__main, [data-waves]'))
      .filter((el) => !el.closest('footer') && !el.closest('header') && !el.parentElement.closest('.calm-host, .h-hero, main.page, .dash__main'));
    hosts.forEach((el, i) => attach(el, {
      rgb: PALETTE[i % PALETTE.length],
      offset: i * 1.3,
      band: i === 0 ? 0.5 : 0.36,
      cap: i === 0 ? 680 : 1600,
    }));
    if (glow) document.body.appendChild(glow);
    fields.forEach((f) => draw(f, 0));
    if (reduce) return;
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
