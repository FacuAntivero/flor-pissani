/* Flor Pissani — animaciones. Todo el contenido es visible sin JS; GSAP solo suma movimiento. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Menú y header (siempre) ---- */
  var header = $('.site-header');
  var toggle = $('.nav-toggle');
  var nav = $('.nav');
  var lastY = window.scrollY;
  function onScroll() {
    if (!header) return;
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    var wa = $('.wa-float'); if (wa) wa.classList.toggle('show', y > 220);
    var menuOpen = nav && nav.classList.contains('open');
    if (y > 260 && y > lastY + 6 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 6 || y < 120) header.classList.remove('hide');
    lastY = y;
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---- Sin GSAP o con movimiento reducido: contenido estático ---- */
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    root.classList.remove('js', 'wipe-in', 'loader-on');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0); // las animaciones siguen el reloj real, aunque el dispositivo sea lento

  /* ---- Utilidades ---- */
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(el);
  }
  $$('[data-split]').forEach(splitWords);
  root.classList.add('gsap');
  gsap.set($$('[data-split] .wi'), { yPercent: 115 });
  gsap.set($$('[data-reveal]'), { opacity: 0, y: 26 });
  gsap.set($$('.img-reveal'), { clipPath: 'inset(0 0 100% 0)' });
  gsap.set($$('.img-reveal img'), { scale: 1.25 });
  gsap.set($$('.draw path, .draw line'), { strokeDasharray: 1, strokeDashoffset: 1 });

  var wipe = $('.wipe');
  var loader = $('.loader');
  var firstScreen = [];

  /* ---- Animaciones de la primera pantalla ---- */
  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    var split = $$('.hero-text [data-split] .wi, .svc-hero [data-split] .wi');
    if (split.length) tl.to(split, { yPercent: 0, duration: 1.2, stagger: 0.07 }, 0.05);
    var items = $$('.hero-text [data-reveal], .svc-hero .svc-text [data-reveal], .crumb [data-reveal]');
    if (items.length) tl.to(items, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.5);
    $$('.img-reveal[data-hero]').forEach(function (el, i) {
      tl.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power3.inOut' }, 0.2 + i * 0.15);
      tl.to($('img', el), { scale: 1, duration: 1.8, ease: 'power3.out' }, 0.2 + i * 0.15);
    });
    $$('.draw[data-hero] path').forEach(function (p) { tl.to(p, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0.4); });
    var pop = $$('.badge-spin');
    if (pop.length) tl.fromTo(pop, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.15 }, 1.1);
    return tl;
  }

  /* ---- Pincel de maquillaje: borra el polvo en pasadas, siguiendo el scroll ---- */
  function initBrush(el) {
    var frame = $('.rb-frame', el), cv = $('.rb-canvas', el), brush = $('.rb-brush', el);
    if (!frame || !cv || !brush) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, lastP = 0, grain = null;
    // recorrido normalizado: tres pasadas que salen del cuadro en los extremos
    var PTS = [[-0.18, 0.15], [1.18, 0.2], [1.2, 0.5], [-0.2, 0.52], [-0.2, 0.84], [1.18, 0.8]];
    var lens = [], total = 0, i;
    for (i = 1; i < PTS.length; i++) { var l = Math.hypot(PTS[i][0] - PTS[i - 1][0], (PTS[i][1] - PTS[i - 1][1]) * 0.8); lens.push(l); total += l; }
    function posAt(t) {
      t = Math.max(0, Math.min(1, t)) * total;
      for (var k = 0; k < lens.length; k++) {
        if (t <= lens[k] || k === lens.length - 1) {
          var f = lens[k] ? Math.min(1, t / lens[k]) : 0;
          f = f * f * (3 - 2 * f) * 0.35 + f * 0.65; // aceleración suave en cada pasada
          var x = PTS[k][0] + (PTS[k + 1][0] - PTS[k][0]) * f;
          var y = PTS[k][1] + (PTS[k + 1][1] - PTS[k][1]) * f + Math.sin(f * Math.PI) * 0.025 * (k % 2 ? -1 : 1);
          return [x, y];
        }
        t -= lens[k];
      }
      return PTS[PTS.length - 1];
    }
    function makeGrain() {
      var n = document.createElement('canvas'); n.width = n.height = 180;
      var nc = n.getContext('2d'), id = nc.createImageData(180, 180), d = id.data;
      for (var q = 0; q < d.length; q += 4) { var v = 190 + Math.random() * 55; d[q] = v; d[q + 1] = v - 10; d[q + 2] = v - 36; d[q + 3] = Math.random() * 75; }
      nc.putImageData(id, 0, 0); return n;
    }
    function paintPowder() {
      ctx.globalCompositeOperation = 'source-over';
      var g = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, Math.max(W, H) * 1.15);
      g.addColorStop(0, '#f8f4e6'); g.addColorStop(0.55, '#e7e2ce'); g.addColorStop(1, '#d5ccae');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (!grain) grain = makeGrain();
      ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H);
    }
    function wipeTo(a, b) {
      var R = W * 0.25;
      ctx.globalCompositeOperation = 'destination-out';
      var steps = Math.max(1, Math.ceil(Math.abs(b - a) / 0.003));
      for (var s = 0; s <= steps; s++) {
        var pt = posAt(a + (b - a) * (s / steps)), x = pt[0] * W, y = pt[1] * H;
        var g = ctx.createRadialGradient(x, y, 0, x, y, R);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
      }
    }
    function resize() {
      var r = frame.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintPowder(); lastP = 0; render(o.p, true);
    }
    var o = { p: 0 };
    function render(p, force) {
      if (!W) return;
      if (p < lastP - 0.0005 || force) { paintPowder(); lastP = 0; }
      if (p > lastP) { wipeTo(lastP, p); lastP = p; }
      cv.classList.toggle('done', p > 0.985);
      var pos = posAt(p), nxt = posAt(Math.min(1, p + 0.012)), prv = posAt(Math.max(0, p - 0.012));
      var dir = Math.tanh((nxt[0] - prv[0]) * 18);                // +1 hacia la derecha, -1 hacia la izquierda
      var ang = dir * 22 + Math.sin(p * 40) * 2.5;
      brush.style.left = (pos[0] * W).toFixed(1) + 'px';
      brush.style.top = (pos[1] * H + 14).toFixed(1) + 'px';
      brush.style.transform = 'translate(-50%,-100%) rotate(' + ang.toFixed(1) + 'deg)';
      brush.style.opacity = p > 0.985 || p < 0.004 ? '0' : '1';
    }
    resize();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    gsap.to(o, { p: 1, ease: 'none', onUpdate: function () { render(o.p); },
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 30%', scrub: 0.6 } });
  }

  /* ---- Animaciones al hacer scroll ---- */
  function scrollIn() {
    // textos con máscara
    $$('[data-split]').forEach(function (h) {
      if (h.closest('.hero-text') || h.closest('.svc-hero')) return;
      gsap.to($$('.wi', h), { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    // fundidos
    ScrollTrigger.batch($$('[data-reveal]').filter(function (e) { return !e.closest('.hero-text') && !e.closest('.svc-hero') && !e.closest('.crumb'); }), {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', overwrite: true }); }
    });
    // imágenes que se "descubren"
    ScrollTrigger.batch($$('.img-reveal').filter(function (e) { return !e.hasAttribute('data-hero'); }), {
      start: 'top 90%', once: true,
      onEnter: function (els) {
        gsap.to(els, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, stagger: 0.18, ease: 'power3.inOut' });
        gsap.to(els.map(function (e) { return $('img', e); }), { scale: 1, duration: 1.8, stagger: 0.18, ease: 'power3.out' });
      }
    });
    // trazos
    $$('.draw:not([data-hero])').forEach(function (s) {
      gsap.to($$('path, line', s), { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: s, start: 'top 85%', once: true } });
    });
    // parallax suave
    $$('[data-parallax]').forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || 40;
      gsap.to(el, { y: -k, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    // contadores
    $$('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var o = { v: 0 };
      gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: function () { el.textContent = prefix + Math.round(o.v); } });
    });
    // pincel que revela el maquillaje (scroll): barrido en zigzag sobre una capa de polvo
    $$('[data-brush]').forEach(initBrush);
    // barra de progreso
    var bar = $('.progress');
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
    // galería horizontal fijada (escritorio)
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
      var pin = $('.works-pin'), track = $('.works-track');
      if (!pin || !track) return;
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var fill = $('.works-line i'), cnt = $('.works-count b'), n = $$('.work').length;
            if (fill) fill.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')';
            if (cnt) cnt.textContent = ('0' + Math.min(n, Math.max(1, Math.ceil(self.progress * n)))).slice(-2);
          } } });
    });
  }

  /* ---- Transición entre páginas ---- */
  function pageTransitions() {
    if (!wipe) return;
    gsap.set(wipe, { yPercent: 100 });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.hash) return; // ancla en la misma página
      if (u.pathname === location.pathname && !u.hash) return;
      e.preventDefault();
      try { sessionStorage.setItem('fp-wipe', '1'); } catch (err) {}
      gsap.to(wipe, { yPercent: 0, duration: 0.65, ease: 'power4.inOut', onComplete: function () { location.href = a.href; } });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) gsap.set(wipe, { yPercent: 100 }); });
  }

  /* ---- Arranque ---- */
  function start() {
    root.classList.remove('loader-on');
    var tl = heroIn();
    scrollIn();
    // red de seguridad: si por algún motivo la primera pantalla no terminó de animarse, se completa
    setTimeout(function () { if (tl.progress() < 1) tl.progress(1); }, 6500);
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    return tl;
  }

  pageTransitions();

  if (root.classList.contains('wipe-in') && wipe) {
    gsap.set(wipe, { yPercent: 0 });
    root.classList.remove('wipe-in');
    start();
    gsap.to(wipe, { yPercent: -100, duration: 0.85, ease: 'power4.inOut', delay: 0.05 });
  } else if (root.classList.contains('loader-on') && loader) {
    try { sessionStorage.setItem('fp-intro', '1'); } catch (err) {}
    var name = $('.loader-name');
    var intro = gsap.timeline();
    intro.to($$('.loader .draw path'), { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' })
         .to(name, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.6)
         .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', delay: 0.35, onStart: function () { start(); } });
  } else {
    start();
  }
})();
