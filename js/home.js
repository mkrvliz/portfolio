// ── fade-in карточек портфолио ──
var cardObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var card = entry.target;
      card.classList.add('visible');
      var delay = parseFloat(card.style.transitionDelay) || 0;
      setTimeout(function() { card.style.transitionDelay = '0ms'; }, delay + 500);
      cardObserver.unobserve(card);
    }
  });
}, { threshold: 0.15, rootMargin: '-53px 0px 0px 0px' });

document.querySelectorAll('.card').forEach(function(card, i) {
  card.style.transitionDelay = (i % 3) * 100 + 'ms';
  cardObserver.observe(card);
});

// ── fade-in карточек этапов работы ──
var stepObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var step = entry.target;
      stepObserver.unobserve(step);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          step.classList.add('visible');
          var delay = parseFloat(step.style.transitionDelay) || 0;
          setTimeout(function() { step.style.transitionDelay = '0ms'; }, delay + 500);
        });
      });
    }
  });
}, { threshold: 0.15, rootMargin: '-53px 0px 0px 0px' });

document.querySelectorAll('.process-step').forEach(function(step, i) {
  step.style.transitionDelay = (i % 3) * 100 + 'ms';
  stepObserver.observe(step);
});

// ── аккордеон услуг ──
document.querySelectorAll('.accordion-trigger').forEach(function(btn) {
  btn.addEventListener('click', function() {
    btn.closest('.accordion-item').classList.toggle('open');
  });
});

// ── фон: анимация символов ──
(function() {
  var canvas   = document.getElementById('hero-canvas');
  var hero     = document.getElementById('hero');
  var ctx      = canvas.getContext('2d');
  var isMobile = window.innerWidth <= 1024;
  var canvasVisible = true;
  var tickFn = null;

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
    ".service-name { font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }",
  ];

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
