// ── fade-in фото на скролле ──
var screenObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      screenObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.screen-placeholder').forEach(function(el, i) {
  el.style.transitionDelay = (i % 3) * 80 + 'ms';
  screenObserver.observe(el);
});

// ── слайдер ──
function initSlider(wrap) {
  var viewport = wrap.querySelector('.slider-viewport');
  var track    = wrap.querySelector('.slider-track');
  var items    = Array.from(track.querySelectorAll('.screen-placeholder'));
  var prevBtn  = wrap.querySelector('.slider-prev');
  var nextBtn  = wrap.querySelector('.slider-next');
  var gap      = 16;
  var current  = 0;
  var total    = items.length;

  function getVisible() { return window.innerWidth <= 768 ? 1 : 3; }

  function itemWidth() {
    var v = getVisible();
    return (viewport.offsetWidth - gap * (v - 1)) / v;
  }

  function setWidths() {
    var w = itemWidth();
    items.forEach(function(el) { el.style.width = w + 'px'; });
  }

  function update() {
    var v = getVisible();
    if (current > total - v) current = Math.max(0, total - v);
    track.style.transform = 'translateX(-' + (current * (itemWidth() + gap)) + 'px)';
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= total - v;
  }

  function revealAt(idx) {
    if (items[idx] && !items[idx].classList.contains('visible')) {
      items[idx].style.transitionDelay = '0ms';
      items[idx].classList.add('visible');
    }
  }

  prevBtn.addEventListener('click', function() { if (current > 0) { current--; update(); } });
  nextBtn.addEventListener('click', function() {
    var v = getVisible();
    if (current < total - v) {
      current++;
      update();
      revealAt(current + v - 1);
    }
  });

  setWidths(); update();
  window.addEventListener('resize', function() { setWidths(); update(); });
}

document.querySelectorAll('.slider-wrap').forEach(initSlider);

// мобильный: конвертировать .stage-screens в слайдеры
if (window.innerWidth <= 768) {
  document.querySelectorAll('.stage-screens').forEach(function(screens) {
    var items = Array.from(screens.querySelectorAll('.screen-placeholder'));
    if (items.length === 0) return;

    var wrap = document.createElement('div');
    wrap.className = 'slider-wrap';
    wrap.innerHTML =
      '<div class="slider-viewport"><div class="slider-track"></div></div>' +
      '<div class="slider-controls">' +
        '<button class="slider-arrow slider-prev" aria-label="назад" disabled>←</button>' +
        '<button class="slider-arrow slider-next" aria-label="вперёд">→</button>' +
      '</div>';

    var track = wrap.querySelector('.slider-track');
    items.forEach(function(item) { track.appendChild(item); });

    screens.parentNode.replaceChild(wrap, screens);
    initSlider(wrap);
  });
}

// ── лайтбокс ──
var lightbox      = document.getElementById('lightbox');
var lightboxImg   = document.getElementById('lightbox-img');
var lightboxClose = document.getElementById('lightbox-close');
var lightboxPrev  = document.getElementById('lightbox-prev');
var lightboxNext  = document.getElementById('lightbox-next');
var magnifier     = document.getElementById('lightbox-magnifier');

var stageImgs    = [];
var currentIndex = 0;

function openLightbox(imgs, index) {
  stageImgs = imgs;
  currentIndex = index;
  lightboxImg.src = stageImgs[currentIndex].src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  lightboxImg.src = '';
  magnifier.style.display = 'none';
}

function go(delta) {
  currentIndex = (currentIndex + delta + stageImgs.length) % stageImgs.length;
  lightboxImg.src = stageImgs[currentIndex].src;
}

document.querySelectorAll('.stage').forEach(function(stage) {
  var imgs = Array.from(stage.querySelectorAll('.screen-placeholder img'));
  imgs.forEach(function(img, i) {
    img.addEventListener('click', function() { openLightbox(imgs, i); });
  });
});

lightboxPrev.addEventListener('click', function() { go(-1); });
lightboxNext.addEventListener('click', function() { go(1); });
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', function(e) {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
});

// лупа (только без тача)
var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouch) {
  var mw = 300, mh = 190, zoom = 2.5;

  lightboxImg.addEventListener('mousemove', function(e) {
    var rect = lightboxImg.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      magnifier.style.display = 'none'; return;
    }
    var bgW = rect.width * zoom;
    var bgH = rect.height * zoom;
    var bgX = Math.max(0, Math.min(x * zoom - mw / 2, bgW - mw));
    var bgY = Math.max(0, Math.min(y * zoom - mh / 2, bgH - mh));
    magnifier.style.display            = 'block';
    magnifier.style.left               = (e.clientX - mw / 2) + 'px';
    magnifier.style.top                = (e.clientY - mh / 2) + 'px';
    magnifier.style.backgroundImage    = 'url(' + lightboxImg.src + ')';
    magnifier.style.backgroundSize     = bgW + 'px ' + bgH + 'px';
    magnifier.style.backgroundPosition = '-' + bgX + 'px -' + bgY + 'px';
  });

  lightboxImg.addEventListener('mouseleave', function() {
    magnifier.style.display = 'none';
  });
}
