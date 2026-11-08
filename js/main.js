// Vidal Arteaga Abogados: interacción y movimiento. Sin dependencias.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const fmt = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }); // es-ES no agrupa 4 cifras por defecto

  // Navegación: se vuelve sólida al salir del hero
  const nav = $('#nav');
  const hero = $('#hero');
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-90px 0px 0px 0px' }).observe(hero);

  // Enlace activo según la sección visible
  const links = $$('.nav__pill a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const secIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => secIO.observe(s));

  // Menú móvil
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('i').className = open ? 'ph ph-x' : 'ph ph-list';
    toggle.querySelector('.sr').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 600); }
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // Contadores: de 0 al valor final con ease-out
  const countUp = el => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = fmt.format(end); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    setTimeout(() => requestAnimationFrame(tick), 700);
  };
  $$('[data-count]').forEach(countUp);

  // Revelado al entrar en vista, una sola vez
  $$('.track .svc').forEach((el, i) => el.style.setProperty('--d', `${i * 70}ms`));
  $$('.case').forEach((el, i) => el.style.setProperty('--d', `${i * 60}ms`));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal, .reveal-img, .track, .case-list, .footer__giant').forEach(el => io.observe(el));

  // Párrafo del despacho: palabras en <span> para iluminarlas con el scroll (CSS scroll-driven)
  const stmt = $('#statement');
  const words = stmt.textContent.trim().split(/\s+/);
  stmt.setAttribute('aria-label', stmt.textContent.trim());
  stmt.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--p:${(i / (words.length - 1)).toFixed(3)}">${w}</span>`).join(' ');

  // Parallax del hero con el puntero (solo ratón)
  if (finePointer && !reduce) {
    const layers = $$('[data-depth]', hero);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      layers.forEach(l => { const d = +l.dataset.depth; l.style.transform = `translate3d(${(x * d).toFixed(2)}px, ${(y * d).toFixed(2)}px, 0)`; });
      raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  // Botones magnéticos (solo ratón)
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 10}px, ${((e.clientY - r.top) / r.height - 0.5) * 8}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  // Carrusel de áreas: flechas y arrastre con ratón
  const track = $('#track');
  $$('.services [data-dir]').forEach(b => b.addEventListener('click', () => {
    const card = track.querySelector('.svc');
    track.scrollBy({ left: (card.offsetWidth + 16) * +b.dataset.dir, behavior: reduce ? 'auto' : 'smooth' });
  }));
  let drag = null;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; track.classList.add('is-dragging'); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (moved) { // vuelve a encajar en la tarjeta más cercana
      const w = track.querySelector('.svc').offsetWidth + 16;
      track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior: reduce ? 'auto' : 'smooth' });
    }
  });
  track.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    $(`.services [data-dir="${e.key === 'ArrowRight' ? 1 : -1}"]`).click();
  });

  // Método: una fila abierta cada vez (ratón al pasar, táctil y teclado al pulsar)
  const steps = $$('.step');
  const openStep = s => steps.forEach(x => {
    const on = x === s;
    x.classList.toggle('is-open', on);
    x.querySelector('.step__btn').setAttribute('aria-expanded', String(on));
  });
  steps.forEach(s => {
    s.querySelector('.step__btn').addEventListener('click', () => openStep(s));
    if (finePointer) s.addEventListener('pointerenter', () => openStep(s));
  });

  // Casos: vista previa que sigue al cursor
  const list = $('#caseList');
  const peek = $('#peek');
  const peekImg = $('img', peek);
  if (finePointer && !reduce) {
    let px = 0, py = 0, cx = 0, cy = 0, praf = 0;
    const follow = () => {
      cx += (px - cx) * 0.18; cy += (py - cy) * 0.18;
      peek.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      praf = peek.classList.contains('is-on') || Math.abs(px - cx) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    $$('.case', list).forEach(c => c.addEventListener('pointerenter', () => { peekImg.src = c.dataset.img; }));
    list.addEventListener('pointerenter', e => { cx = px = e.clientX + 150; cy = py = e.clientY; peek.classList.add('is-on'); if (!praf) praf = requestAnimationFrame(follow); });
    list.addEventListener('pointermove', e => { px = e.clientX + 150; py = e.clientY; });
    list.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
  }

  // Opiniones: pase automático con barras de progreso
  const slider = $('#slider');
  const slides = $$('.slide', slider);
  const bars = $$('.bars button', slider);
  const SLIDE_MS = 7000;
  slider.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
  let cur = 0, timer = 0, left = SLIDE_MS, started = 0;
  const show = i => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === cur));
    bars.forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === cur));
      b.classList.toggle('is-done', k < cur);
      const span = b.firstElementChild; span.replaceWith(span.cloneNode()); // reinicia la animación de la barra
    });
    schedule(SLIDE_MS);
  };
  const schedule = ms => {
    clearTimeout(timer);
    if (reduce) return;
    left = ms; started = performance.now();
    timer = setTimeout(() => show(cur + 1), ms);
  };
  const pause = () => { if (reduce || slider.classList.contains('is-paused')) return; clearTimeout(timer); left -= performance.now() - started; slider.classList.add('is-paused'); };
  const resume = () => { if (!slider.classList.contains('is-paused')) return; slider.classList.remove('is-paused'); schedule(Math.max(400, left)); };
  $$('[data-slide]', slider).forEach(b => b.addEventListener('click', () => show(cur + +b.dataset.slide)));
  bars.forEach((b, k) => b.addEventListener('click', () => show(k)));
  slider.addEventListener('pointerenter', pause);
  slider.addEventListener('pointerleave', resume);
  slider.addEventListener('focusin', pause);
  slider.addEventListener('focusout', resume);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  if (reduce) slider.classList.add('is-paused');
  show(0);

  // Formulario: validación en línea, sin envío (maqueta)
  const form = $('#form');
  const rules = {
    'f-nombre': el => el.value.trim().length >= 2 || 'Indique su nombre.',
    'f-email': el => /^\S+@\S+\.\S+$/.test(el.value.trim()) || 'Indique un correo válido, por ejemplo nombre@dominio.es.',
    'f-tel': el => /^[+\d][\d\s]{8,}$/.test(el.value.trim()) || 'Indique un teléfono de al menos 9 cifras.',
    'f-ok': el => el.checked || 'Necesitamos su permiso para contactarle.',
  };
  const check = id => {
    const el = document.getElementById(id);
    const res = rules[id](el);
    const msg = res === true ? '' : res;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    el.setAttribute('aria-describedby', id + '-err');
    document.getElementById(id + '-err').textContent = msg;
    return !msg;
  };
  ['f-nombre', 'f-email', 'f-tel'].forEach(id => document.getElementById(id).addEventListener('blur', () => check(id)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
    $('#formOk').hidden = false;
  });

  $('#year').textContent = new Date().getFullYear();
})();
