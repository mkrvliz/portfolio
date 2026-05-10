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
