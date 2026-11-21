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
    ptr.energy = Math.min(1, ptr.energy + Math.min(60, Math.hypot(dx, dy)) / 220);
    lastMove = performance.now();
  }
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });


  const STYLE = '.calm-host{position:relative;isolation:isolate}' +
    '.calm-waves{position:absolute;left:0;top:0;width:100%;z-index:-1;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 18%,#000 78%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 18%,#000 78%,transparent 100%)}' +
    '.calm-glow{position:fixed;left:0;top:0;width:520px;height:520px;border-radius:50%;pointer-events:none;z-index:2;' +
    'background:radial-gradient(circle,rgba(45,212,191,.13) 0%,rgba(167,139,250,.07) 38%,transparent 66%);mix-blend-mode:multiply;will-change:transform;transition:opacity .6s}' +
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
    const f = { host, c, ctx: c.getContext('2d'), w: 0, h: 0, visible: true, lines: opts.lines || 6, cap: opts.cap || 680 };
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

  function draw(f, t) {
    const { ctx, w, h } = f;
    ctx.clearRect(0, 0, w, h);
    const r = f.host.getBoundingClientRect();
    const mx = ptr.sx - r.left, my = ptr.sy - r.top;
    const reach = Math.max(140, Math.min(260, w * 0.18));
    for (let i = 0; i < f.lines; i++) {
      const base = h * (0.42 + (i / (f.lines - 1)) * 0.5);
      const amp = 10 + i * 3;
      const k = 0.0042 + i * 0.0006;
      const speed = 0.00016 + i * 0.00003;
      const phase = i * 1.7;
      ctx.beginPath();
      for (let x = -10; x <= w + 10; x += 6) {
        let y = base + Math.sin(x * k + t * speed + phase) * amp + Math.sin(x * k * 0.47 - t * speed * 1.6 + phase) * amp * 0.6;
        // Swell around the cursor: lines lift away from it, more when it has just moved.
        const dx = x - mx, dy = base - my;
        const d2 = dx * dx + dy * dy;
        const g = Math.exp(-d2 / (2 * reach * reach));
        if (g > 0.002) {
          const dir = dy >= 0 ? 1 : -1;
          y += dir * g * (18 + 46 * ptr.energy) + Math.sin(x * 0.03 - t * 0.006) * g * 14 * ptr.energy;
        }
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(' + COLORS[i % COLORS.length] + ',' + (0.16 + 0.05 * (i % 3)) + ')';
      ctx.lineWidth = 1.4 + (i % 2) * 0.6;
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
    ptr.sx += (ptr.x - ptr.sx) * 0.08;
    ptr.sy += (ptr.y - ptr.sy) * 0.08;
    if (performance.now() - lastMove > 120) ptr.energy *= 0.965;
    if (!document.hidden) fields.forEach((f) => { if (f.visible) draw(f, t); });
    if (glow && ptr.x > -9000) glow.style.transform = 'translate3d(' + (ptr.sx - 260) + 'px,' + (ptr.sy - 260) + 'px,0)';
    requestAnimationFrame(frame);
  }

  function init() {
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    document.querySelectorAll('.h-hero, main.page, .dash__main, [data-waves]').forEach((el) => attach(el, {}));
    if (glow) document.body.appendChild(glow);
    fields.forEach((f) => draw(f, 0));
    if (reduce) return;
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
