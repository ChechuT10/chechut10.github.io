(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = !root.classList.contains('motion');
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Tema ---------- */
  $('#theme').addEventListener('click', () => {
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* sin almacenamiento */ }
  });

  /* ---------- Semana animada ---------- */
  (function week() {
    const svg = $('#week-svg'), log = $('#log'), sc = $('#week-scroll');
    const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    const X0 = 40, X1 = 980, W = X1 - X0, Y = 86;
    const xAt = h => X0 + (h / 168) * W;
    const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); svg.appendChild(n); return n; };
    for (let d = 0; d <= 7; d++) mk('line', { class: 'dayline', x1: xAt(d * 24), x2: xAt(d * 24), y1: 30, y2: 130 });
    DAYS.forEach((d, i) => { const t = mk('text', { class: 'daylbl', x: xAt(i * 24 + 12), y: 22, 'text-anchor': 'middle' }); t.textContent = d; });
    mk('line', { class: 'track', x1: X0, x2: X1, y1: Y, y2: Y });

    const events = [];
    const pad = n => String(n).padStart(2, '0');
    const add = (h, kind, y, r, msg) => events.push({ h, kind, y, r, msg });
    for (let h = 4; h < 168; h += 4) add(h, 'sync', Y, 3.5, 'sincroniza actividad, sueño y frecuencia cardíaca');
    [0, 1, 3, 4].forEach(d => add(d * 24 + 18.5, 'gym', Y - 30, 7, 'entrenamiento; las series de la hoja ajustan los kilos de la próxima vez'));
    for (let d = 0; d < 7; d++) add(d * 24 + 23, 'meal', Y + 30, 5, 'escribe las comidas del día en Google Health');
    add(6, 'weigh', Y - 30, 7, 'peso y medidas recibidos por Telegram');
    add(10, 'plan', Y + 30, 9, 'calcula calorías y kilos; la IA monta el menú, la Pi lo revisa y lo imprime');
    events.sort((a, b) => a.h - b.h);
    events.forEach(e => { e.node = mk('circle', { class: `ev ${e.kind} dim`, cx: xAt(e.h), cy: e.y, r: e.r }); });
    const head = mk('line', { class: 'playhead', x1: X0, x2: X0, y1: 30, y2: 136 });
    const cap = mk('circle', { class: 'playcap', cx: X0, cy: 30, r: 4 });

    const lines = [];
    const kindClass = { sync: 'k-sync', gym: 'k-gym', meal: '', weigh: 'k-plan', plan: 'k-plan' };
    const stamp = h => `${DAYS[Math.floor(h / 24) % 7]} ${pad(Math.floor(h % 24))}:${pad(Math.round((h % 1) * 60))}`;
    const push = e => {
      if (e.kind === 'sync' && Math.floor(e.h) % 12 !== 0) return; // no saturar el registro
      lines.push(`<div><span class="t">${stamp(e.h)}</span>  <span class="${kindClass[e.kind]}">${e.msg}</span></div>`);
      while (lines.length > (innerWidth < 640 ? 3 : 4)) lines.shift();
      log.innerHTML = lines.join('');
    };

    if (reduce) {
      events.forEach(e => e.node.classList.remove('dim'));
      head.setAttribute('x1', X1); head.setAttribute('x2', X1); cap.setAttribute('cx', X1);
      events.filter(e => e.kind === 'plan' || e.kind === 'weigh' || e.kind === 'gym').slice(-4).forEach(push);
      return;
    }
    const DURATION = 12000;
    let t0 = null, idx = 0, raf = 0, onScreen = true, pausedAt = 0;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (t0 === null) t0 = now;
      const p = ((now - t0) % (DURATION + 1500)) / DURATION;
      if (p >= 1) return; // pausa breve al final de la semana
      const h = p * 168;
      if (idx > 0 && h < events[idx - 1].h) { idx = 0; events.forEach(e => e.node.classList.add('dim')); }
      while (idx < events.length && events[idx].h <= h) { events[idx].node.classList.remove('dim'); push(events[idx]); idx++; }
      const x = xAt(h);
      if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = x * (sc.scrollWidth / 1000) - sc.clientWidth / 2;
      head.setAttribute('x1', x); head.setAttribute('x2', x); cap.setAttribute('cx', x);
    };
    const start = () => { if (!raf) { if (pausedAt && t0 !== null) t0 += performance.now() - pausedAt; raf = requestAnimationFrame(frame); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; pausedAt = performance.now(); } };
    new IntersectionObserver(e => { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(svg);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (onScreen) start(); });
  })();

  /* ---------- Validador animado ---------- */
  (function validator() {
    const pre = $('#console-json'), checks = $('#checks'), verdict = $('#verdict');
    const scenarios = [
      { json: { dia: 'lunes', kcal: 2215, proteina_g: 172, ejercicios: ['press inclinado', 'remo con apoyo'] },
        res: [['esquema JSON válido', 1], ['kcal del día dentro de ±5 %', 1], ['proteína por encima del mínimo', 1], ['ejercicios permitidos (rodilla ≤ 90°)', 1]],
        ok: true, verdict: '✓ plan aprobado' },
      { json: { dia: 'martes', kcal: 1640, proteina_g: 120, ejercicios: ['sentadilla profunda'] },
        res: [['esquema JSON válido', 1], ['kcal del día dentro de ±5 %', 0], ['proteína por encima del mínimo', 0], ['ejercicios permitidos (rodilla ≤ 90°)', 0]],
        ok: false, verdict: '✗ rechazado: se pide a la IA que lo corrija' }
    ];
    const hl = obj => JSON.stringify(obj, null, 2)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/("[^"]*")(\s*:)?/g, (m, s, c) => c ? `<span class="k">${s}</span>${c}` : `<span class="s">${s}</span>`)
      .replace(/\b(\d+)\b/g, '<span class="n">$1</span>');
    const render = (sc, n, showVerdict) => {
      checks.innerHTML = sc.res.map(([label, pass], i) => {
        if (i >= n) return `<li><span class="st"></span>${label}</li>`;
        return `<li class="${pass ? 'ok' : 'ko'}"><span class="st">${pass ? '✓' : '✗'}</span>${label}</li>`;
      }).join('');
      verdict.className = 'verdict' + (showVerdict ? (sc.ok ? ' ok' : ' ko') : '');
      verdict.textContent = showVerdict ? sc.verdict : 'validando…';
    };
    if (reduce) { pre.innerHTML = hl(scenarios[0].json); render(scenarios[0], 4, true); return; }
    let k = 0, timers = [], running = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const run = () => {
      const sc = scenarios[k % scenarios.length]; k++;
      pre.innerHTML = '<span class="k">// respuesta de la IA</span>\n' + hl(sc.json);
      render(sc, 0, false);
      for (let i = 1; i <= sc.res.length; i++) timers.push(setTimeout(() => render(sc, i, false), 500 + i * 550));
      timers.push(setTimeout(() => render(sc, sc.res.length, true), 500 + sc.res.length * 550 + 400));
      timers.push(setTimeout(run, 6200));
    };
    new IntersectionObserver(e => {
      if (e[0].isIntersecting && !running) { running = true; run(); }
      else if (!e[0].isIntersecting && running) { running = false; clear(); }
    }, { threshold: .3 }).observe($('#console'));
    pre.innerHTML = hl(scenarios[0].json); render(scenarios[0], 0, false);
  })();

  /* ---------- Revelados y scroll ---------- */
  if (!reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(n => io.observe(n));
  } else {
    $$('.reveal').forEach(n => n.classList.add('in'));
  }
  const nav = $('#nav'), road = $('#road');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--scroll', h > 0 ? (scrollY / h).toFixed(4) : 0);
    nav.classList.toggle('scrolled', scrollY > 8);
    const r = road.getBoundingClientRect();
    road.style.setProperty('--fill', Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)).toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const links = $$('.nav-links a');
  const so = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => so.observe(s));
})();
