(async () => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const data = await (await fetch('data.json')).json();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = !root.classList.contains('motion');
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const today = new Date();
  const nowM = today.getFullYear() * 12 + today.getMonth();
  const toM = s => { if (!s) return nowM; const [y, m] = s.split('-').map(Number); return y * 12 + m - 1; };
  const fmt = s => { if (!s) return 'actualidad'; const [y, m] = s.split('-').map(Number); return `${MESES[m - 1]} ${y}`; };
  const yearOf = s => s ? s.slice(0, 4) : 'hoy';
  const span = (a, b) => toM(b) - toM(a) + 1;
  const dur = n => {
    const y = Math.floor(n / 12), m = n % 12, p = [];
    if (y) p.push(`${y} ${y === 1 ? 'año' : 'años'}`);
    if (m) p.push(`${m} ${m === 1 ? 'mes' : 'meses'}`);
    return p.join(' y ') || '1 mes';
  };
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const jobs = data.experiencia;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const flash = node => { node.classList.remove('flash'); void node.offsetWidth; node.classList.add('flash'); };

  /* ---------- Textos básicos ---------- */
  $$('[data-bind]').forEach(n => { n.textContent = data[n.dataset.bind] || ''; });
  const years = Math.floor(span(data.carreraDesde, null) / 12);
  $('#lede').textContent = data.resumen.replace('{años}', years);
  const current = jobs.find(j => !j.fin);
  if (current) {
    $('#now').innerHTML = `<span class="pulse" aria-hidden="true"></span><span>Ahora: <b>${esc(current.puesto)}</b> en ${esc(current.empresa)}${current.cliente ? `, cuenta de ${esc(current.cliente)}` : ''}</span>`;
  }
  $('#updated').textContent = `${MESES_L[today.getMonth()]} de ${today.getFullYear()}`;
  $$('.kbd-mod').forEach(k => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  const c = data.contacto;
  $('#cta-mail').href = `mailto:${c.email}`;
  const mail = $('#mail'); mail.href = `mailto:${c.email}`; mail.textContent = c.email;
  $('#contact-links').innerHTML = `
    <li><a href="${esc(c.linkedin)}" rel="me noopener" target="_blank">LinkedIn</a></li>
    <li><a href="tel:${esc(c.telefono.replace(/\s/g, ''))}">${esc(c.telefono)}</a></li>
    <li><span>${esc(data.ubicacion)}</span></li>`;
  $('#print-contact').innerHTML = `
    <li>${esc(data.ubicacion)}</li>
    <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
    <li>${esc(c.telefono)}</li>
    <li><a href="${esc(c.linkedin)}">${esc(c.linkedin.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>`;

  /* ---------- Trayectoria (Gantt) ---------- */
  (function gantt() {
    const startY = 2016, endY = today.getFullYear() + 1;
    const S = startY * 12, E = endY * 12, total = E - S;
    const pct = m => (m - S) / total * 100;
    const body = $('#gantt-body');
    let order = 0;
    const lanes = [
      { name: 'Experiencia', items: jobs, kind: 'work' },
      { name: 'Formación', items: data.formacion, kind: 'edu' }
    ];
    lanes.forEach(l => {
      body.appendChild(el('p', 'lane-label', l.name));
      const lane = el('div', 'lane');
      lane.style.setProperty('--years', endY - startY);
      [...l.items].sort((a, b) => toM(a.inicio) - toM(b.inicio)).forEach(it => {
        const a = toM(it.inicio), b = (it.fin ? toM(it.fin) : nowM) + 1;
        const left = pct(a), width = pct(b) - left;
        const isWork = l.kind === 'work';
        const bar = el('button', `bar ${l.kind}${it.practicas ? ' minor' : ''}${!it.fin ? ' current' : ''}${width < 7 ? ' tiny' : ''}`);
        bar.type = 'button';
        bar.style.left = left + '%';
        bar.style.width = width + '%';
        bar.style.setProperty('--i', order++);
        bar.innerHTML = `<span>${esc(it.corto || it.empresa)}</span>`;
        const title = isWork ? it.puesto : it.titulo;
        const org = isWork ? it.empresa : it.centro;
        bar.setAttribute('aria-label', `${title}, ${org}, de ${fmt(it.inicio)} a ${fmt(it.fin)}`);
        bar.dataset.title = title;
        bar.dataset.org = org;
        bar.dataset.when = `${fmt(it.inicio)} – ${fmt(it.fin)}, ${dur(span(it.inicio, it.fin))}`;
        bar.dataset.target = (isWork ? 'job-' : 'edu-') + it.id;
        lane.appendChild(bar);
      });
      body.appendChild(lane);
    });
    const t = el('div', 'today');
    t.style.left = pct(nowM + today.getDate() / 31) + '%';
    body.appendChild(t);
    const axis = el('div', 'axis');
    for (let y = startY; y < endY; y++) {
      const s = el('span', null, y);
      s.style.left = pct(y * 12) + '%';
      axis.appendChild(s);
    }
    body.appendChild(axis);

    const tip = $('#tip'), box = $('#gantt');
    const show = bar => {
      tip.innerHTML = `<b>${esc(bar.dataset.title)}</b>${esc(bar.dataset.org)}<br><span class="muted">${esc(bar.dataset.when)}</span>`;
      const r = bar.getBoundingClientRect(), g = box.getBoundingClientRect();
      tip.classList.add('show');
      const tw = tip.offsetWidth;
      let x = r.left - g.left + r.width / 2 - tw / 2;
      x = Math.max(8, Math.min(g.width - tw - 8, x));
      tip.style.left = x + 'px';
      tip.style.top = (r.top - g.top - tip.offsetHeight - 10) + 'px';
    };
    const hide = () => tip.classList.remove('show');
    body.addEventListener('pointerover', e => { const b = e.target.closest('.bar'); if (b) show(b); });
    body.addEventListener('pointerout', e => { if (e.target.closest('.bar')) hide(); });
    body.addEventListener('focusin', e => { const b = e.target.closest('.bar'); if (b) show(b); });
    body.addEventListener('focusout', hide);
    body.addEventListener('click', e => {
      const b = e.target.closest('.bar'); if (!b) return;
      const target = document.getElementById(b.dataset.target);
      if (!target) return;
      hide();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      flash(target);
    });
  })();

  /* ---------- Experiencia ---------- */
  (function experience() {
    const main = jobs.filter(j => !j.anterior);
    const before = jobs.filter(j => j.anterior);
    $('#exp-intro').textContent = `${main.length} puestos en AdTech y datos desde ${yearOf(data.carreraDesde)}, del más reciente al más antiguo. La línea de la izquierda avanza contigo.`;
    const wrap = $('#jobs');
    main.forEach(j => {
      const art = el('article', `job reveal${!j.fin ? ' current' : ''}`);
      art.id = 'job-' + j.id;
      const badge = !j.fin ? '<span class="badge-now"><span class="pulse" aria-hidden="true"></span>Ahora</span><br>' : '';
      art.innerHTML = `
        <span class="job-dot" aria-hidden="true"></span>
        <div class="job-card">
          <header class="job-head">
            <div>
              <h3>${esc(j.puesto)}</h3>
              <p class="org">${esc(j.empresa)}, ${esc(j.lugar)}${j.cliente ? `. <span class="client">Cuenta de ${esc(j.cliente)}</span>` : ''}</p>
            </div>
            <p class="period">${badge}<span>${fmt(j.inicio)} – ${fmt(j.fin)}</span> <span class="dur"><span class="paren">(</span>${dur(span(j.inicio, j.fin))}<span class="paren">)</span></span></p>
          </header>
          <ul class="achievements">${j.logros.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
          <ul class="tags" aria-label="Herramientas">${j.herramientas.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>`;
      wrap.appendChild(art);
    });
    $('#before').innerHTML = before.map(j => `
      <article class="mini reveal" id="job-${esc(j.id)}">
        <h4>${esc(j.puesto)}</h4>
        <p class="org">${esc(j.empresa)}</p>
        <p>${esc(j.logros[0] || '')}</p>
        <p class="when">${fmt(j.inicio)} – ${fmt(j.fin)}</p>
      </article>`).join('');

    // Consulta SQL que se escribe sola
    const tokens = [
      ['-- ' + main.length + ' filas, del más reciente al más antiguo\n', 'cm'],
      ['SELECT', 'kw'], [' puesto, empresa, periodo\n', ''],
      ['FROM', 'kw'], [' `jesus.experiencia`\n', 'id'],
      ['ORDER BY', 'kw'], [' inicio ', ''], ['DESC', 'kw'], [';', '']
    ];
    const sql = $('#sql');
    const full = () => { sql.innerHTML = tokens.map(([t, k]) => k ? `<span class="${k}">${esc(t)}</span>` : esc(t)).join('') + '<span class="caret"></span>'; };
    if (reduce) { full(); return; }
    sql.innerHTML = '<span class="caret"></span>';
    let started = false;
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting || started) return;
      started = true; obs.disconnect();
      let ti = 0, ci = 0, out = '';
      const tick = () => {
        if (ti >= tokens.length) { full(); return; }
        const [t, k] = tokens[ti];
        ci++;
        const partial = esc(t.slice(0, ci));
        const html = out + (k ? `<span class="${k}">${partial}</span>` : partial);
        sql.innerHTML = html + '<span class="caret"></span>';
        const ch = t[ci - 1];
        if (ci >= t.length) { out = html; ti++; ci = 0; }
        setTimeout(tick, ch === '\n' ? 160 : 24);
      };
      tick();
    }, { threshold: .6 }).observe(sql);
  })();

  /* ---------- Stack ---------- */
  (function stack() {
    const usage = name => jobs.filter(j => j.herramientas.includes(name));
    const groups = $('#groups');
    groups.innerHTML = data.stack.map(g => `
      <div class="group">
        <h3>${esc(g.grupo)}</h3>
        <div class="chips">${g.items.map(s => {
          const n = usage(s).length;
          return `<button class="chip" type="button" data-skill="${esc(s)}" aria-pressed="false">${esc(s)}${n ? `<span class="n" title="${n} ${n === 1 ? 'puesto' : 'puestos'}">${n}</span>` : ''}</button>`;
        }).join('')}</div>
      </div>`).join('');
    const panel = $('#skill-panel');
    const S = 2016 * 12, E = (today.getFullYear() + 1) * 12;
    const select = name => {
      $$('.chip', groups).forEach(ch => ch.setAttribute('aria-pressed', String(ch.dataset.skill === name)));
      const roles = usage(name);
      let html = `<h3>${esc(name)}</h3>`;
      if (roles.length) {
        const months = new Set();
        roles.forEach(r => { for (let m = toM(r.inicio); m <= toM(r.fin); m++) months.add(m); });
        html += `<p class="total">Usado durante <b>${dur(months.size)}</b> en ${roles.length === 1 ? 'un puesto' : roles.length + ' puestos'}.</p>`;
        html += `<div class="track" aria-hidden="true">${roles.map(r => {
          const l = (toM(r.inicio) - S) / (E - S) * 100, w = (toM(r.fin) + 1 - toM(r.inicio)) / (E - S) * 100;
          return `<i style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i>`;
        }).join('')}</div><div class="track-axis" aria-hidden="true"><span>2016</span><span>${today.getFullYear() + 1}</span></div>`;
        html += `<ul class="used-in">${roles.map(r => `<li><span>${esc(r.puesto)}, ${esc(r.empresa)}</span><span>${yearOf(r.inicio)}–${r.fin ? yearOf(r.fin) : 'hoy'}</span></li>`).join('')}</ul>`;
      } else {
        html += `<p class="note">Conocimiento técnico que aplico en formación y proyectos personales, sin asociarlo a un puesto concreto.</p>`;
      }
      panel.innerHTML = `<div class="swap">${html}</div>`;
    };
    groups.addEventListener('click', e => { const ch = e.target.closest('.chip'); if (ch) select(ch.dataset.skill); });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      groups.addEventListener('pointerover', e => { const ch = e.target.closest('.chip'); if (ch && ch.getAttribute('aria-pressed') !== 'true') select(ch.dataset.skill); });
    }
    select('BigQuery');
  })();

  /* ---------- Proyecto, formación, extras ---------- */
  (function rest() {
    const p = data.proyectos[0];
    $('#project-text').innerHTML = `
      <div><h3>${esc(p.nombre)}</h3><span class="status">${esc(p.estado)}</span></div>
      <div class="project-links"><a class="btn" href="${esc(p.url)}">Ver la página del proyecto</a>${p.repo ? `<a class="btn" href="${esc(p.repo)}">Código en GitHub</a>` : ''}</div>
      <p>${esc(p.descripcion)}</p>
      <ul class="tags">${p.herramientas.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`;
    $('#edu').innerHTML = data.formacion.map(f => `
      <article class="edu-card reveal" id="edu-${esc(f.id)}">
        <span class="yrs">${yearOf(f.inicio)}–${yearOf(f.fin)}</span>
        <h3>${esc(f.titulo)}</h3>
        <p>${esc(f.centro)}</p>
      </article>`).join('');
    $('#certs').innerHTML = data.certificaciones.map(x => `<li><span>${esc(x)}</span></li>`).join('');
    $('#langs').innerHTML = data.idiomas.map(x => `<li><span>${esc(x.idioma)}</span> <span>${esc(x.nivel)}</span></li>`).join('');
  })();

  /* ---------- Animación del pipeline (canvas) ---------- */
  (function flow() {
    const canvas = $('#flow');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, raf = 0, last = 0, time = 0, col = {};
    let parts = [], amber = [], spawnAcc = 0;
    const COLS = 8, ROWS = 5;
    const cells = new Array(COLS * ROWS).fill(0);
    let filled = 0, clearing = false, sinceEmit = 0, nextBar = 0;
    const bars = [.35, .5, .42, .62, .55, .7].map(v => ({ h: v, t: v, f: 0 }));

    const readColors = () => {
      const s = getComputedStyle(root), g = n => s.getPropertyValue(n).trim();
      col = { ink3: g('--ink-3'), rule: g('--rule'), signal: g('--signal'), conv: g('--conv'), surface2: g('--surface-2') };
    };
    const X = i => W * (i + .5) / 4;
    const geom = () => {
      const cy = H / 2;
      const s = Math.max(6, Math.min(11, W / 95)), gp = Math.max(2, s * .32);
      const gw = COLS * s + (COLS - 1) * gp, gh = ROWS * s + (ROWS - 1) * gp;
      const cw = Math.min(120, W * .15), ch = H * .5;
      return { cy, s, gp, gw, gh, gx: X(2) - gw / 2, gy: cy - gh / 2, cx: X(3) - cw / 2, cw, ch };
    };
    const spawn = () => {
      const cy = H / 2, y0 = cy + (Math.random() - .5) * H * .72;
      parts.push({ x: X(0), y: y0, y0, st: 0, v: (44 + Math.random() * 30) * Math.max(.6, W / 1100), ph: Math.random() * 6.28, a: 0, die: false, vy: 0, lane: Math.random() });
    };
    const absorb = G => {
      if (clearing) return;
      cells[filled] = Math.max(cells[filled], .01);
      filled++; sinceEmit++;
      if (sinceEmit >= 3) { sinceEmit = 0; amber.push({ x0: G.gx + G.gw + 4, x1: G.cx - 6, t: 0 }); }
      if (filled >= cells.length) clearing = true;
    };
    const step = dt => {
      const G = geom(), cy = G.cy, x0 = X(0), x1 = X(1);
      spawnAcc += dt * (W < 600 ? 10 : 18) * (W / 1000 + .4);
      while (spawnAcc > 1) { spawnAcc--; if (parts.length < 260) spawn(); }
      for (const p of parts) {
        if (p.die) { p.vy += 70 * dt; p.y += p.vy * dt; p.x += p.v * .25 * dt; p.a -= dt * 1.5; continue; }
        p.a = Math.min(1, p.a + dt * 3);
        p.x += p.v * dt;
        if (p.st === 0) {
          const t = Math.min(1, (p.x - x0) / (x1 - x0)), e = t * t * (3 - 2 * t);
          p.y = p.y0 + ((cy + (p.y0 - cy) * .12) - p.y0) * e + Math.sin(p.ph + p.x * .045) * 3 * (1 - e);
          if (p.x >= x1) {
            if (Math.random() < .55) { p.die = true; p.vy = (Math.random() - .4) * 30; }
            else { p.st = 1; p.y0 = p.y; p.xs = p.x; }
          }
        } else {
          const t = Math.min(1, (p.x - p.xs) / Math.max(1, G.gx - p.xs)), e = t * t * (3 - 2 * t);
          p.y = p.y0 + (G.gy + G.gh * p.lane - p.y0) * e;
          if (p.x >= G.gx) { p.gone = true; absorb(G); }
        }
      }
      parts = parts.filter(p => !p.gone && p.a > 0 && p.x < W + 10);
      for (let i = 0; i < cells.length; i++) {
        if (clearing) cells[i] = Math.max(0, cells[i] - dt * 1.4);
        else if (i < filled) cells[i] = Math.min(1, cells[i] + dt * 4);
      }
      if (clearing && cells.every(v => v === 0)) { clearing = false; filled = 0; }
      for (const a of amber) {
        a.t += dt * 200 / Math.max(60, a.x1 - a.x0);
        if (a.t >= 1 && !a.done) {
          a.done = true;
          const b = bars[nextBar]; b.t = Math.min(.95, b.t + .22); b.f = 1;
          nextBar = (nextBar + 1) % bars.length;
        }
      }
      amber = amber.filter(a => !a.done);
      for (const b of bars) {
        b.h += (b.t - b.h) * Math.min(1, dt * 5);
        if (b.t > .28) b.t -= dt * .035;
        b.f = Math.max(0, b.f - dt * 1.8);
      }
    };
    const rr = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
    const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); };
    const draw = () => {
      const G = geom(), cy = G.cy;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = col.rule; ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 7]); ctx.lineDashOffset = -time * 24;
      ctx.beginPath(); ctx.moveTo(X(0), cy); ctx.lineTo(X(3), cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = col.ink3; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(0), cy - H * .37); ctx.lineTo(X(0), cy + H * .37); ctx.stroke();
      ctx.strokeStyle = col.signal;
      ctx.beginPath(); ctx.moveTo(X(1), cy - H * .16); ctx.lineTo(X(1), cy + H * .16); ctx.stroke();
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.a) * (p.st === 0 ? .7 : 1);
        ctx.fillStyle = p.st === 1 ? col.signal : col.ink3;
        dot(p.x, p.y, p.st === 1 ? 2.4 : 1.8);
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < cells.length; i++) {
        const x = G.gx + (i % COLS) * (G.s + G.gp), y = G.gy + Math.floor(i / COLS) * (G.s + G.gp);
        ctx.fillStyle = col.surface2; rr(x, y, G.s, G.s, 2); ctx.fill();
        if (cells[i] > 0) { ctx.globalAlpha = cells[i]; ctx.fillStyle = col.signal; rr(x, y, G.s, G.s, 2); ctx.fill(); ctx.globalAlpha = 1; }
      }
      ctx.fillStyle = col.conv;
      for (const a of amber) {
        const t = Math.min(1, a.t), x = a.x0 + (a.x1 - a.x0) * t, y = cy - Math.sin(Math.PI * t) * H * .2;
        ctx.globalAlpha = .22; dot(x, y, 7);
        ctx.globalAlpha = 1; dot(x, y, 3.2);
      }
      const n = bars.length, gap = G.cw * .08, bw = (G.cw - gap * (n - 1)) / n, base = cy + G.ch / 2;
      ctx.strokeStyle = col.rule; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(G.cx - 4, base + 1); ctx.lineTo(G.cx + G.cw + 4, base + 1); ctx.stroke();
      const tops = [];
      bars.forEach((b, i) => {
        const h = b.h * G.ch, x = G.cx + i * (bw + gap);
        ctx.fillStyle = col.signal; ctx.globalAlpha = .85; rr(x, base - h, bw, h, 3); ctx.fill();
        if (b.f > 0) { ctx.globalAlpha = b.f; ctx.fillStyle = col.conv; rr(x, base - h, bw, h, 3); ctx.fill(); }
        ctx.globalAlpha = 1;
        tops.push([x + bw / 2, base - h - 8]);
      });
      ctx.strokeStyle = col.conv; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); tops.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      ctx.fillStyle = col.conv;
      tops.forEach(([x, y]) => dot(x, y, 2.6));
    };
    const warm = () => { for (let i = 0; i < 300; i++) { time += 1 / 60; step(1 / 60); } draw(); };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      parts = []; amber = [];
      warm();
    };
    const frame = t => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; time += dt;
      step(dt); draw();
    };
    const start = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    readColors();
    resize();
    let onScreen = false;
    new IntersectionObserver(e => { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (onScreen) start(); });
    new ResizeObserver(() => { if (Math.abs(canvas.getBoundingClientRect().width - W) > 1) resize(); }).observe(canvas);
    window.__flowColors = () => { readColors(); draw(); };
  })();

  /* ---------- Revelado al hacer scroll ---------- */
  if (!reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(n => io.observe(n));
    new IntersectionObserver((e, o) => {
      if (e[0].isIntersecting) { $('#gantt').classList.add('drawn'); o.disconnect(); }
    }, { threshold: .4 }).observe($('#gantt'));
  } else {
    $$('.reveal').forEach(n => n.classList.add('in'));
    $('#gantt').classList.add('drawn');
  }

  /* ---------- Scroll: progreso, nav y línea de experiencia ---------- */
  const nav = $('#nav'), jobsEl = $('#jobs');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--scroll', h > 0 ? (scrollY / h).toFixed(4) : 0);
    nav.classList.toggle('scrolled', scrollY > 8);
    const r = jobsEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height));
    jobsEl.style.setProperty('--fill', p.toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const links = $$('.nav-links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach(s => secObs.observe(s));

  /* ---------- Acciones ---------- */
  const toast = msg => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
  };
  const copy = async (text, msg) => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) { /* sin portapapeles */ }
      ta.remove();
    }
    toast(msg);
  };
  const currentTheme = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const toggleTheme = () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* almacenamiento no disponible */ }
    if (window.__flowColors) window.__flowColors();
    toast(next === 'dark' ? 'Tema oscuro' : 'Tema claro');
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (window.__flowColors) window.__flowColors(); });

  const highlight = json => esc(json).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g,
    (m, str, colon, lit) => str ? (colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`) : `<span class="${lit ? 'b' : 'n'}">${m}</span>`);
  const jsonText = JSON.stringify(data, null, 2);
  const jsonView = $('#json-view');
  const openJson = () => { $('#json-code').innerHTML = highlight(jsonText); jsonView.showModal(); };

  const palette = $('#palette'), input = $('#palette-input'), list = $('#palette-list');
  let openPalette = () => {};
  const actions = {
    pdf: () => window.print(),
    'copy-email': () => copy(c.email, 'Correo copiado'),
    theme: toggleTheme,
    json: openJson,
    'copy-json': () => copy(jsonText, 'JSON copiado'),
    'close-json': () => jsonView.close(),
    palette: () => openPalette()
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-action]');
    if (!a) return;
    e.preventDefault();
    if (actions[a.dataset.action]) actions[a.dataset.action]();
  });
  jsonView.addEventListener('click', e => { if (e.target === jsonView) jsonView.close(); });

  /* ---------- Paleta de comandos ---------- */
  const go = id => () => { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  const commands = [
    { label: 'Ir al inicio', hint: 'Sección', run: go('inicio') },
    { label: 'Ir a Trayectoria', hint: 'Sección', run: go('trayectoria') },
    { label: 'Ir a Experiencia', hint: 'Sección', run: go('experiencia') },
    { label: 'Ir a Stack técnico', hint: 'Sección', run: go('stack') },
    { label: 'Ir a Proyecto personal', hint: 'Sección', run: go('proyecto') },
    { label: 'Ir a Formación', hint: 'Sección', run: go('formacion') },
    { label: 'Ir a Contacto', hint: 'Sección', run: go('contacto') },
    { label: 'Copiar correo electrónico', hint: c.email, run: actions['copy-email'] },
    { label: 'Abrir LinkedIn', hint: 'Nueva pestaña', run: () => window.open(c.linkedin, '_blank', 'noopener') },
    { label: 'Descargar CV en PDF', hint: 'Imprimir', run: actions.pdf },
    { label: 'Cambiar entre tema claro y oscuro', hint: 'Apariencia', run: toggleTheme },
    { label: 'Ver el CV en formato JSON', hint: 'Datos', run: openJson }
  ];
  let filtered = commands, sel = 0;
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const renderList = () => {
    const q = norm(input.value.trim());
    filtered = commands.filter(cmd => !q || norm(cmd.label + ' ' + cmd.hint).includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    list.innerHTML = filtered.length
      ? filtered.map((cmd, i) => `<li role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === sel}"><span>${esc(cmd.label)}</span><span class="hint">${esc(cmd.hint)}</span></li>`).join('')
      : '<li class="empty">Sin resultados. Prueba con «experiencia» o «correo».</li>';
    input.setAttribute('aria-activedescendant', filtered.length ? 'opt-' + sel : '');
  };
  openPalette = () => { input.value = ''; sel = 0; renderList(); palette.showModal(); input.focus(); };
  const runSel = i => { const cmd = filtered[i]; if (!cmd) return; palette.close(); setTimeout(cmd.run, 30); };
  const move = d => {
    if (!filtered.length) return;
    sel = (sel + d + filtered.length) % filtered.length; renderList();
    const o = document.getElementById('opt-' + sel); if (o) o.scrollIntoView({ block: 'nearest' });
  };
  input.addEventListener('input', () => { sel = 0; renderList(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(sel); }
  });
  list.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) runSel(+li.dataset.i); });
  list.addEventListener('pointermove', e => { const li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; renderList(); } });
  palette.addEventListener('click', e => { if (e.target === palette) palette.close(); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (palette.open) palette.close(); else openPalette(); }
    else if (e.key === '/' && !palette.open && !jsonView.open && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
  });

  console.log('%cHola. Este CV está hecho a mano, sin frameworks. Pulsa Ctrl+K (o ⌘K) para navegar, o abre la vista JSON para ver los datos.', 'font: 600 13px system-ui; color: #3355FF');
})();
