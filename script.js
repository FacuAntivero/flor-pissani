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
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
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
    var pop = $$('.badge-spin, .hero-tag');
    if (pop.length) tl.fromTo(pop, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.15 }, 1.1);
    return tl;
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
        scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true } });
    });
  }

  /* ---- Cursor ---- */
  function cursorFx() {
    if (!finePointer) return;
    var dot = document.createElement('div'); dot.className = 'cursor';
    var ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.innerHTML = '<span>Ver</span>';
    document.body.appendChild(ring); document.body.appendChild(dot);
    var mx = -100, my = -100, rx = -100, ry = -100, seen = false;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; dot.style.opacity = 1; ring.style.opacity = 1; }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = 0; ring.style.opacity = 0; seen = false; });
    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('a, button');
      var inList = !!(t && t.closest('.svc-list'));
      ring.classList.toggle('is-view', inList);
      ring.classList.toggle('is-link', !!t && !inList);
    });
  }

  /* ---- Botones magnéticos ---- */
  function magnetic() {
    if (!finePointer) return;
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.5)' }); });
    });
  }

  /* ---- Vista previa que sigue al cursor en la lista de servicios ---- */
  function servicePreview() {
    var list = $('.svc-list'), prev = $('.svc-preview');
    if (!list || !prev || !finePointer || window.innerWidth < 1001) return;
    var imgs = $$('img', prev);
    var x = 0, y = 0, tx = 0, ty = 0, on = false;
    var qx = gsap.quickSetter(prev, 'x', 'px'), qy = gsap.quickSetter(prev, 'y', 'px');
    list.addEventListener('mousemove', function (e) { tx = e.clientX + 36; ty = e.clientY - 165; });
    $$('li a', list).forEach(function (a, i) {
      a.addEventListener('mouseenter', function () {
        imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        if (!on) { x = tx; y = ty; on = true; }
        gsap.to(prev, { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'power3.out' });
      });
    });
    list.addEventListener('mouseleave', function () { on = false; gsap.to(prev, { opacity: 0, scale: 0.9, duration: 0.35 }); });
    gsap.set(prev, { scale: 0.9 });
    gsap.ticker.add(function () { x += (tx - x) * 0.14; y += (ty - y) * 0.14; qx(x); qy(y); });
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
    cursorFx(); magnetic(); servicePreview();
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
