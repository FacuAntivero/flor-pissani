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

  /* ---- Video propio: el botón grande arranca la reproducción; después quedan los controles nativos ---- */
  $$('.video-card').forEach(function (card) {
    var vid = $('video', card), btn = $('.video-play', card);
    if (!vid || !btn) return;
    btn.addEventListener('click', function () { card.classList.add('playing'); vid.play(); });
    vid.addEventListener('play', function () { card.classList.add('playing'); });
    vid.addEventListener('pause', function () { if (vid.ended || vid.currentTime === 0) card.classList.remove('playing'); });
    vid.addEventListener('ended', function () { card.classList.remove('playing'); });
  });

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
    var pop = $$('.badge-spin');
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
    // barra de progreso
    var bar = $('.progress');
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
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
