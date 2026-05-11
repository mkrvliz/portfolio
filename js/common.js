// ── прелоадер: полоска прогресса + быстрое печатание кода на фоне ──
(function() {
  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  var bg      = document.getElementById('preloader-bg');
  var barFill = document.getElementById('preloader-bar-fill');

  document.body.classList.add('preloading');

  var codeLines = [
    "body { font-family: 'Geist Mono', monospace; background-color: #F5EBE1; color: #4D4D4D; }",
    "header { position: sticky; top: 0; background: #F5EBE1; border-bottom: 1px solid #7A7A7A; z-index: 100; }",
    "#hero { display: flex; align-items: center; min-height: calc(100vh - 53px); padding: 24px 0; }",
    ".hero-inner { display: flex; align-items: center; gap: 48px; width: 100%; }",
    "h1 { font-size: clamp(40px, 8vw, 96px); font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; }",
    ".container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }",
    ".card { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease; }",
    ".card.visible { opacity: 1; transform: translateY(0); }",
    ".card:hover { transform: translateY(-8px); transition: transform 0.28s ease; }",
    "nav { display: flex; gap: 32px; }   nav a { font-size: 13px; letter-spacing: 0.03em; }",
    "section { padding: 80px 0; border-top: 1px solid #7A7A7A; }",
    "footer { border-top: 1px solid #7A7A7A; padding: 24px 0; }",
    ".logo { font-size: 14px; font-weight: 600; letter-spacing: 0.02em; }",
    ".card-image { width: 100%; aspect-ratio: 4/3; background-color: #b0b0b0; }",
    ".service-name { font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }"
  ];

  var LH = 20;
  var numLines = Math.ceil(window.innerHeight / LH) + 2;
  var targetCharsPerLine = Math.ceil(window.innerWidth / 6) + 40;

  var lines = [];
  for (var r = 0; r < numLines; r++) {
    var src = codeLines[r % codeLines.length] + '   ';
    var full = '';
    while (full.length < targetCharsPerLine) full += src;
    var el = document.createElement('span');
    el.className = 'line';
    bg.appendChild(el);
    lines.push({ el: el, full: full, chars: -1 });
  }

  var DURATION       = 4000;
  var LINE_DURATION  = 150;
  var STAGGER        = Math.max(10, (DURATION - LINE_DURATION) / Math.max(1, lines.length - 1));
  var startTime      = performance.now();

  function tick(now) {
    var elapsed  = now - startTime;
    var progress = Math.min(elapsed / DURATION, 1);
    barFill.style.width = (progress * 100).toFixed(2) + '%';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var lineStart    = i * STAGGER;
      var lineProgress = Math.max(0, Math.min((elapsed - lineStart) / LINE_DURATION, 1));
      var chars        = Math.floor(lineProgress * line.full.length);
      if (chars !== line.chars) {
        line.el.textContent = line.full.slice(0, chars);
        line.chars = chars;
      }
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      barFill.style.width = '100%';
      setTimeout(function() {
        preloader.classList.add('done');
        document.body.classList.remove('preloading');
        document.body.classList.add('loaded');
        setTimeout(function() { preloader.remove(); }, 450);
      }, 220);
    }
  }
  requestAnimationFrame(tick);
})();

// ── плавный скролл (лёрп) — только десктоп ──
if (window.innerWidth > 1024) {
  (function() {
    var scrollTarget = window.scrollY;
    var scrollCurrent = window.scrollY;
    var rafId = null;
    var EASE = 0.07;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }
    function clamp(v) { return Math.max(0, Math.min(maxScroll(), v)); }

    function tick() {
      scrollCurrent += (scrollTarget - scrollCurrent) * EASE;
      var diff = scrollTarget - scrollCurrent;
      if (Math.abs(diff) < 0.5) {
        scrollCurrent = scrollTarget;
        window.scrollTo(0, scrollTarget);
        rafId = null;
      } else {
        window.scrollTo(0, scrollCurrent);
        rafId = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('wheel', function(e) {
      e.preventDefault();
      if (!rafId) {
        scrollCurrent = window.scrollY;
        scrollTarget = scrollCurrent;
      }
      scrollTarget = clamp(scrollTarget + e.deltaY);
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    }, { passive: false });

    window.__smoothScrollTo = function(pos) {
      scrollTarget = clamp(pos);
      if (!rafId) {
        scrollCurrent = window.scrollY;
        rafId = requestAnimationFrame(tick);
      }
    };
  })();
}

// ── burger + мобильное меню ──
var burgerBtn  = document.getElementById('burger-btn');
var mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  burgerBtn.classList.remove('open');
  burgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

burgerBtn.addEventListener('click', function() {
  var isOpen = mobileMenu.classList.toggle('open');
  burgerBtn.classList.toggle('open', isOpen);
  burgerBtn.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// закрываем меню при клике на любую ссылку внутри него
mobileMenu.querySelectorAll('a').forEach(function(link) {
  link.addEventListener('click', closeMobileMenu);
});

// ── плавная прокрутка по якорям (только главная) ──
document.querySelectorAll('nav a[href^="#"], .mobile-nav a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    var targetEl = document.querySelector(this.getAttribute('href'));
    if (!targetEl) return;
    e.preventDefault();
    closeMobileMenu();
    if (window.__smoothScrollTo) {
      var top = targetEl.getBoundingClientRect().top + window.scrollY;
      window.__smoothScrollTo(top);
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
