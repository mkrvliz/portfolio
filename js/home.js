// ── фабрика fade-in наблюдателей ──
// один общий механизм для всех "появляющихся" блоков: карточки, шаги, абзацы и т.п.
// stagger — задержка появления k-го элемента относительно начала группы (ms)
// reveal  — длительность самой transition в css (ms), нужна чтобы корректно сбросить transition-delay
function fadeIn(selector, stagger, reveal) {
  var nodes = document.querySelectorAll(selector);
  if (!nodes.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      // 2 раза rAF — чтобы браузер успел применить transition-delay до добавления .visible
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          el.classList.add('visible');
          var delay = parseFloat(el.style.transitionDelay) || 0;
          setTimeout(function() { el.style.transitionDelay = '0ms'; }, delay + reveal);
        });
      });
    });
  }, { threshold: 0.15, rootMargin: '-53px 0px 0px 0px' });
  nodes.forEach(function(el, i) {
    el.style.transitionDelay = i * stagger + 'ms';
    observer.observe(el);
  });
}

// карточки в портфолио / шаги процесса — staggered по столбцам сетки (i % 3)
function fadeInGrid(selector, columns, stagger, reveal) {
  var nodes = document.querySelectorAll(selector);
  if (!nodes.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          el.classList.add('visible');
          var delay = parseFloat(el.style.transitionDelay) || 0;
          setTimeout(function() { el.style.transitionDelay = '0ms'; }, delay + reveal);
        });
      });
    });
  }, { threshold: 0.15, rootMargin: '-53px 0px 0px 0px' });
  nodes.forEach(function(el, i) {
    el.style.transitionDelay = (i % columns) * stagger + 'ms';
    observer.observe(el);
  });
}

fadeInGrid('.card',         3, 100, 900);
fadeInGrid('.process-step', 3, 100, 900);
fadeIn('#about p',          300, 900);
fadeIn('.accordion-item',   300, 900);
fadeIn('.contacts-list li', 100, 900);

// ── аккордеон услуг ──
document.querySelectorAll('.accordion-trigger').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var item = btn.closest('.accordion-item');
    var isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});

// ── фон: анимация символов ──
(function() {
  var canvas   = document.getElementById('hero-canvas');
  var hero     = document.getElementById('hero');
  if (!canvas || !hero) return;
  var ctx      = canvas.getContext('2d');
  var isMobile = window.innerWidth <= 1024;
  var canvasVisible = true;
  var tickFn = null;

  // строки кода для отрисовки — общий массив, объявлен в common.js
  var codeLines = window.__codeLines || [];

  if (isMobile) {
    // ── бегущая строка по всему фону (мобильный / планшет) ──
    var FS = 11, LH = 20;
    var CW, rowStrs = [];
    var speed = 25;
    var offset = 0, lastTs = null;
    var safeZone = { x: 0, y: 0, w: 0, h: 0 };

    function updateSafeZone() {
      var cr = canvas.getBoundingClientRect();
      var ir = hero.querySelector('.hero-inner').getBoundingClientRect();
      var pad = 40;
      safeZone.x = ir.left - cr.left - pad;
      safeZone.y = ir.top  - cr.top  - pad;
      safeZone.w = ir.width  + pad * 2;
      safeZone.h = ir.height + pad * 2;
    }

    function build() {
      rowStrs = [];
      ctx.font = FS + 'px "Geist Mono", monospace';
      CW = ctx.measureText('x').width;
      var cols    = Math.ceil(canvas.width / CW) + 2;
      var numRows = Math.floor(canvas.height / LH);
      for (var r = 0; r < numRows; r++) {
        var src = codeLines[r % codeLines.length] + '   ';
        var str = '';
        while (str.length < cols) str += src;
        rowStrs.push(str);
      }
    }

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      build();
      updateSafeZone();
    }

    function tick(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min((ts - lastTs) / 1000, 0.1);
      lastTs = ts;
      offset += speed * dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = FS + 'px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(77,77,77,0.22)';

      var sz   = safeZone;
      var strW = rowStrs[0] ? rowStrs[0].length * CW : canvas.width;

      for (var ri = 0; ri < rowStrs.length; ri++) {
        var by = ri * LH + LH;
        var x = (ri % 2 === 0) ? -(offset % strW) : (offset % strW) - strW;
        var rowInSafe = by > sz.y && by < sz.y + sz.h;

        if (!rowInSafe) {
          ctx.fillText(rowStrs[ri], x,        by);
          ctx.fillText(rowStrs[ri], x + strW, by);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0,           by - LH, sz.x,                         LH + 4);
          ctx.rect(sz.x + sz.w, by - LH, canvas.width - sz.x - sz.w,  LH + 4);
          ctx.clip();
          ctx.fillText(rowStrs[ri], x,        by);
          ctx.fillText(rowStrs[ri], x + strW, by);
          ctx.restore();
        }
      }

      if (canvasVisible) requestAnimationFrame(tick);
    }

    tickFn = tick;
    window.addEventListener('resize', resize);
    document.fonts.ready.then(function() {
      resize();
      requestAnimationFrame(tick);
    });

  } else {
    // ── отталкивание от курсора (десктоп) ──
    var FS = 11, LH = 20;
    var CW, rows2d = [], rowStrs = [];
    var mouseX = -9999, mouseY = -9999;
    var R = 60, K = 5.5, SP = 0.07, DM = 0.70;
    var safeZone = { x: 0, y: 0, w: 0, h: 0 };

    function updateSafeZone() {
      var cr = canvas.getBoundingClientRect();
      var ir = hero.querySelector('.hero-inner').getBoundingClientRect();
      var pad = 80;
      safeZone.x = ir.left - cr.left - pad;
      safeZone.y = ir.top  - cr.top  - pad;
      safeZone.w = ir.width  + pad * 2;
      safeZone.h = ir.height + pad * 2;
    }

    function build() {
      rows2d = []; rowStrs = [];
      ctx.font = FS + 'px "Geist Mono", monospace';
      CW = ctx.measureText('x').width;
      var cols = Math.ceil(canvas.width / CW) + 2;
      var numRows = Math.floor(canvas.height / LH);
      for (var r = 0; r < numRows; r++) {
        var src = codeLines[r % codeLines.length] + '   ';
        var str = '';
        while (str.length < cols) str += src;
        str = str.slice(0, cols);
        rowStrs.push(str);
        var row = [];
        for (var c = 0; c < cols; c++) {
          row.push({ ch: str[c], bx: c * CW, by: r * LH + LH, x: c * CW, y: r * LH + LH, vx: 0, vy: 0 });
        }
        rows2d.push(row);
      }
    }

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      build();
      updateSafeZone();
    }

    function applyPhysics(p) {
      var dx = p.x - mouseX, dy = p.y - mouseY;
      var d2 = dx * dx + dy * dy;
      if (d2 < R * R && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var f = (R - d) / R * K;
        p.vx += dx / d * f;
        p.vy += dy / d * f;
      }
      p.vx += (p.bx - p.x) * SP;
      p.vy += (p.by - p.y) * SP;
      p.vx *= DM;
      p.vy *= DM;
      p.x += p.vx;
      p.y += p.vy;
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font      = FS + 'px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(77,77,77,0.22)';

      var sz = safeZone;
      for (var ri = 0; ri < rows2d.length; ri++) {
        var row = rows2d[ri];
        var by  = row[0].by;
        var rowInSafe = by > sz.y && by < sz.y + sz.h;

        if (!rowInSafe) {
          var moved = false;
          for (var ci = 0; ci < row.length; ci++) {
            applyPhysics(row[ci]);
            if (Math.abs(row[ci].x - row[ci].bx) > 0.3 || Math.abs(row[ci].y - row[ci].by) > 0.3) moved = true;
          }
          if (!moved) {
            ctx.fillText(rowStrs[ri], 0, by);
          } else {
            for (var ci2 = 0; ci2 < row.length; ci2++) {
              ctx.fillText(row[ci2].ch, row[ci2].x, row[ci2].y);
            }
          }
        } else {
          for (var ci = 0; ci < row.length; ci++) {
            var p = row[ci];
            if (p.bx >= sz.x && p.bx <= sz.x + sz.w) continue;
            applyPhysics(p);
            ctx.fillText(p.ch, p.x, p.y);
          }
        }
      }
      if (canvasVisible) requestAnimationFrame(tick);
    }

    hero.addEventListener('mousemove', function(e) {
      var r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', function() { mouseX = mouseY = -9999; });

    tickFn = tick;
    document.fonts.ready.then(function() {
      resize();
      requestAnimationFrame(tick);
    });
    window.addEventListener('resize', resize);
  }

  // останавливаем анимацию когда hero вне вьюпорта
  new IntersectionObserver(function(entries) {
    var wasVisible = canvasVisible;
    canvasVisible = entries[0].isIntersecting;
    if (canvasVisible && !wasVisible && tickFn) requestAnimationFrame(tickFn);
  }, { threshold: 0 }).observe(canvas);

})();
