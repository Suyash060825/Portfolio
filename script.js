/* =============================================
   YASH PORTFOLIO — script.js
============================================= */

// ── LOADER ──
(function() {
  const pct = document.getElementById('loaderPct');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(100, n + Math.floor(Math.random() * 12) + 3);
    if (pct) pct.textContent = n + '%';
    if (n >= 100) clearInterval(tick);
  }, 120);
})();

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 1700);
});

// ── CUSTOM CURSOR ──
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursor-trail');
if (cursor && trail && window.innerWidth > 768) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    setTimeout(() => {
      trail.style.left = e.clientX + 'px';
      trail.style.top  = e.clientY + 'px';
    }, 80);
  });
  document.querySelectorAll('a, button, .project-card, .cert-card, .skill-chips span, .stab').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width='20px'; cursor.style.height='20px'; cursor.style.opacity='.6'; });
    el.addEventListener('mouseleave', () => { cursor.style.width='10px'; cursor.style.height='10px'; cursor.style.opacity='1'; });
  });
}

// ── GLOBAL STAR CANVAS — Performance-Optimised ──
// Key optimisations:
// 1. Canvas = viewport only (not full page height) — massive memory/GPU saving
// 2. Far stars batched into 8 opacity buckets — single arc path per bucket
// 3. Aurora pre-baked to offscreen canvas, rebuilt every 90 frames not every frame
// 4. ctx.filter REMOVED from hot path — replaced with wide-stroke soft glow
// 5. No per-frame string building — colours pre-computed at init
// 6. Low-end device detection — halves counts on mobile/weak CPUs
(function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  let W, H;

  // Low-end: ≤4 cores OR mobile
  const isLowEnd = navigator.hardwareConcurrency <= 4 ||
    /Android|iPhone|iPad/i.test(navigator.userAgent);

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight; // viewport only — not page height
  }
  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); buildNebula(); buildAurora(); scatterStars(); }, 250);
  }, { passive: true });

  // Star counts per device tier
  const FAR  = isLowEnd ? 140 : 300;
  const MID  = isLowEnd ?  55 : 120;
  const NEAR = isLowEnd ?  18 :  42;

  // Colour palette — pre-computed rgb() strings
  const TINTS = [
    'rgb(225,238,255)', 'rgb(205,222,255)', 'rgb(255,255,248)',
    'rgb(255,248,215)', 'rgb(255,225,160)', 'rgb(215,195,255)',
    'rgb(255,185,145)', 'rgb(175,230,255)',
  ];
  // RGB triplets for gradient building
  const TINT_RGB = [
    [225,238,255],[205,222,255],[255,255,248],[255,248,215],
    [255,225,160],[215,195,255],[255,185,145],[175,230,255],
  ];
  const TINT_W = [0.28,0.22,0.18,0.12,0.08,0.06,0.03,0.03];
  function pickTintIdx() {
    let r = Math.random(), c = 0;
    for (let i = 0; i < TINT_W.length; i++) { c += TINT_W[i]; if (r < c) return i; }
    return 0;
  }

  const LAYERS = [
    { count:FAR,  minSz:0.18, maxSz:0.55, minOp:0.22, maxOp:0.62, twMin:0.003, twMax:0.010 },
    { count:MID,  minSz:0.55, maxSz:1.30, minOp:0.45, maxOp:0.92, twMin:0.008, twMax:0.024 },
    { count:NEAR, minSz:1.30, maxSz:2.80, minOp:0.70, maxOp:1.00, twMin:0.015, twMax:0.042 },
  ];

  const stars = [];
  LAYERS.forEach((l, li) => {
    for (let i = 0; i < l.count; i++) {
      const sz   = l.minSz + Math.random() * (l.maxSz - l.minSz);
      const ti   = (sz > 1.5 && Math.random() > 0.4)
        ? 3 + Math.floor(Math.random() * 5) : pickTintIdx();
      const baseOp = l.minOp + Math.random() * (l.maxOp - l.minOp);
      const isTwinkler = li === 2 ? Math.random() > 0.4 : li === 1 && Math.random() > 0.8;
      const [r,g,b] = TINT_RGB[ti];

      stars.push({
        x: Math.random() * 1, y: Math.random() * 1, // 0-1 fractions
        sz, baseOp, op: baseOp,
        col:  TINTS[ti],
        // Pre-build halo rgba partial for fast string concat
        haloRGBA: `${r},${g},${b}`,
        phase:  Math.random() * Math.PI * 2,
        tSpd:   l.twMin + Math.random() * (l.twMax - l.twMin),
        phase2: Math.random() * Math.PI * 2,
        tSpd2:  (l.twMin + Math.random() * (l.twMax - l.twMin)) * 1.65,
        pulseT: 150 + Math.floor(Math.random() * 380),
        pulseOn: false, pulseOp: 0,
        layer: li,
        isTwinkler,
        hasHalo:  li > 0 && sz > 0.85,
        hasCross: li === 2 && sz > 1.5,
        hasCore:  li === 2 && sz > 1.4,
        haloR: sz * (li === 2 ? 7 : 4.5),
      });
    }
  });

  function scatterStars() {
    stars.forEach(s => { s.x = Math.random(); s.y = Math.random(); });
  }

  // ── COMETS ──
  const comets = [];
  const MAX_C  = isLowEnd ? 2 : 4;
  const C_INT  = isLowEnd ? 2800 : 1100; // ms between spawns

  function spawnComet() {
    if (comets.length < MAX_C) {
      const fast = Math.random() > 0.45;
      const spd  = fast ? 12 + Math.random() * 10 : 3 + Math.random() * 5;
      const len  = fast ? 85 + Math.random() * 85  : 180 + Math.random() * 200;
      const w    = fast ? 1.3 + Math.random() * 0.7 : 2.2 + Math.random() * 1.5;
      const fade = fast ? 0.020 + Math.random() * 0.012 : 0.007 + Math.random() * 0.005;
      const ang  = -(0.2 + Math.random() * 0.45);
      const warm = Math.random() > 0.72;
      comets.push({
        x: Math.random(), y: Math.random() * 0.45, // 0-1 fractions
        vx: Math.cos(ang) * spd, vy: Math.abs(Math.sin(ang)) * spd + (fast ? 1.2 : 0.3),
        len, w, alpha: 0, fadingIn: true, fade,
        hc: warm ? '255,242,195' : '252,252,255',
        mc: warm ? '255,175,70'  : '155,195,255',
        fast,
      });
    }
    setTimeout(spawnComet, C_INT + Math.random() * C_INT);
  }
  setTimeout(spawnComet, 500);

  // ── NEBULA (viewport-size offscreen canvas, static) ──
  let nebula = null;
  function buildNebula() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');

    // Base
    const bg = c.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'rgba(2,4,14,0.96)');
    bg.addColorStop(0.5,'rgba(4,6,18,0.82)');
    bg.addColorStop(1,'rgba(2,3,10,0.96)');
    c.fillStyle = bg; c.fillRect(0,0,W,H);

    // Blue cloud
    const bn = c.createRadialGradient(W*.38,H*.18,0, W*.38,H*.18, W*.55);
    bn.addColorStop(0,'rgba(18,38,118,0.22)');
    bn.addColorStop(0.4,'rgba(8,15,50,0.08)');
    bn.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=bn; c.fillRect(0,0,W,H);

    // Purple
    const pu = c.createRadialGradient(W*.8,H*.28,0, W*.8,H*.28, W*.38);
    pu.addColorStop(0,'rgba(72,28,162,0.13)');
    pu.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=pu; c.fillRect(0,0,W,H);

    // Milky Way amber band
    c.save(); c.globalAlpha=0.07;
    const mw = c.createLinearGradient(0,H*.35,W,H*.65);
    mw.addColorStop(0,'rgba(0,0,0,0)');
    mw.addColorStop(.2,'rgba(95,55,15,.8)');
    mw.addColorStop(.45,'rgba(175,115,35,1)');
    mw.addColorStop(.8,'rgba(55,30,8,.4)');
    mw.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=mw; c.fillRect(0,0,W,H); c.restore();

    // Red dust
    const rd = c.createRadialGradient(W*.12,H*.65,0, W*.12,H*.65, W*.28);
    rd.addColorStop(0,'rgba(125,35,15,.10)'); rd.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=rd; c.fillRect(0,0,W,H);

    // Teal
    const tl = c.createRadialGradient(W*.88,H*.75,0, W*.88,H*.75, W*.24);
    tl.addColorStop(0,'rgba(10,85,115,.10)'); tl.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=tl; c.fillRect(0,0,W,H);

    nebula = off;
  }
  buildNebula();

  // ── AURORA — offscreen, rebuilt every ~1.5s not every frame ──
  let auroraC = null, auroraOff = 0, frameN = 0;
  function buildAurora() {
    if (!auroraC) auroraC = document.createElement('canvas');
    auroraC.width = W; auroraC.height = H;
    const c = auroraC.getContext('2d');
    c.clearRect(0,0,W,H);
    [
      { yF:0.14, amp:42, freq:7e-4, col:'100,80,220', op:0.016 },
      { yF:0.50, amp:58, freq:9e-4, col:'40,130,190', op:0.014 },
      { yF:0.82, amp:38, freq:6e-4, col:'160,210,80', op:0.013 },
    ].forEach((b,ri) => {
      const ph = auroraOff + ri*2.4;
      c.save(); c.globalAlpha = b.op; c.beginPath();
      for (let x=0; x<=W; x+=14) {
        const y = H*b.yF + Math.sin(x*b.freq+ph)*b.amp + Math.sin(x*b.freq*1.8+ph*.75)*(b.amp*.35);
        x===0 ? c.moveTo(x,y) : c.lineTo(x,y);
      }
      c.lineWidth=88; c.strokeStyle=`rgb(${b.col})`;
      c.filter='blur(22px)'; c.stroke(); c.filter='none';
      c.restore();
    });
  }
  buildAurora();

  // ── MAIN DRAW ──
  const BUCKETS = 8; // opacity buckets for far-star batching

  function draw() {
    frameN++;

    // Rebuild aurora every 90 frames (~1.5s) — blur happens off-thread
    if (frameN % 90 === 0) { auroraOff += 0.22; buildAurora(); }

    ctx.clearRect(0, 0, W, H);

    // 1. Static nebula blit (essentially free)
    if (nebula) ctx.drawImage(nebula, 0, 0, W, H);

    // 2. Pre-baked aurora blit (no per-frame blur)
    if (auroraC) ctx.drawImage(auroraC, 0, 0, W, H);

    // 3. FAR STARS — opacity-bucketed batch draw
    //    All stars in same bucket drawn as one compound path
    //    = ~1 draw call per bucket vs 300 draw calls
    const buckets = Array.from({length: BUCKETS}, () => []);
    stars.forEach(s => {
      if (s.layer !== 0) return;
      s.phase += s.tSpd;
      s.op = s.baseOp * (0.55 + 0.45 * Math.sin(s.phase));
      const bi = Math.min(BUCKETS-1, Math.floor(s.op * BUCKETS));
      buckets[bi].push(s);
    });
    buckets.forEach((bk, bi) => {
      if (!bk.length) return;
      ctx.globalAlpha = (bi + 0.5) / BUCKETS;
      ctx.fillStyle   = 'rgb(210,225,255)';
      ctx.beginPath();
      bk.forEach(s => {
        const sx = s.x * W, sy = s.y * H;
        ctx.moveTo(sx + s.sz, sy);
        ctx.arc(sx, sy, s.sz, 0, 6.2832);
      });
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 4. MID + NEAR STARS — individual rendering, far fewer
    stars.forEach(s => {
      if (s.layer === 0) return;

      s.phase  += s.tSpd;
      s.phase2 += s.tSpd2;
      const tw1 = 0.5 + 0.5 * Math.sin(s.phase);
      const tw2 = 0.5 + 0.5 * Math.sin(s.phase2);
      const twinkle = s.isTwinkler
        ? tw1 * 0.5 + tw2 * 0.5
        : tw1 * 0.65 + 0.35;

      s.pulseT--;
      if (s.pulseT <= 0 && !s.pulseOn) {
        s.pulseOn = true; s.pulseOp = 0;
        s.pulseT  = 150 + Math.floor(Math.random() * 280);
      }
      let extra = 0;
      if (s.pulseOn) {
        s.pulseOp += 0.055;
        extra = Math.sin(s.pulseOp) * (s.isTwinkler ? 0.52 : 0.22);
        if (s.pulseOp >= Math.PI) { s.pulseOn = false; extra = 0; }
      }
      s.op = Math.min(1, s.baseOp * twinkle + extra);

      const sx = s.x * W, sy = s.y * H;

      // Halo (only mid/near, only when bright enough)
      if (s.hasHalo && s.op > 0.28) {
        const hg = ctx.createRadialGradient(sx,sy,0, sx,sy, s.haloR);
        const ho = s.op * (s.layer === 2 ? 0.20 : 0.09);
        hg.addColorStop(0, `rgba(${s.haloRGBA},${ho})`);
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(sx, sy, s.haloR, 0, 6.2832);
        ctx.fillStyle = hg; ctx.fill();
      }

      // Cross diffraction spikes (near large stars only)
      if (s.hasCross && s.op > 0.40) {
        const fl = s.sz * (4.5 + extra * 2.8);
        ctx.save(); ctx.globalAlpha = s.op * 0.32;
        ctx.strokeStyle = s.col; ctx.lineWidth = s.sz * 0.42;
        ctx.beginPath(); ctx.moveTo(sx-fl,sy); ctx.lineTo(sx+fl,sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx,sy-fl); ctx.lineTo(sx,sy+fl); ctx.stroke();
        ctx.restore();
      }

      // Core dot
      ctx.globalAlpha = s.op;
      ctx.fillStyle   = s.col;
      ctx.beginPath(); ctx.arc(sx, sy, s.sz, 0, 6.2832); ctx.fill();

      // White inner core (large stars)
      if (s.hasCore && s.op > 0.52) {
        ctx.globalAlpha = s.op * 0.68;
        ctx.fillStyle   = '#fff';
        ctx.beginPath(); ctx.arc(sx, sy, s.sz * 0.36, 0, 6.2832); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // 5. COMETS — NO ctx.filter anywhere (biggest perf killer removed)
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.fadingIn ? (c.alpha = Math.min(1, c.alpha + 0.055)) : (c.alpha -= c.fade);
      if (!c.fadingIn && c.alpha <= 0) { comets.splice(i,1); continue; }

      const cx = c.x * W, cy = c.y * H;
      const mag = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
      const dx = c.vx/mag, dy = c.vy/mag;
      const tx = cx - dx*c.len, ty = cy - dy*c.len;

      ctx.save(); ctx.globalAlpha = c.alpha; ctx.lineCap = 'round';

      // Main tail gradient
      const gl = ctx.createLinearGradient(cx,cy, tx,ty);
      gl.addColorStop(0,    `rgba(${c.hc},0.96)`);
      gl.addColorStop(0.08, `rgba(${c.mc},0.60)`);
      gl.addColorStop(0.30, 'rgba(175,200,255,0.20)');
      gl.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.strokeStyle = gl; ctx.lineWidth = c.w;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(tx,ty); ctx.stroke();

      // Wide soft glow — thick stroke, NO blur filter
      ctx.globalAlpha = c.alpha * 0.20;
      ctx.lineWidth   = c.w * 7;
      const gl2 = ctx.createLinearGradient(cx,cy, tx,ty);
      gl2.addColorStop(0,    `rgba(${c.hc},0.42)`);
      gl2.addColorStop(0.25, `rgba(${c.mc},0.15)`);
      gl2.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.strokeStyle = gl2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(tx,ty); ctx.stroke();

      // Head glow
      ctx.globalAlpha = c.alpha;
      const hg = ctx.createRadialGradient(cx,cy,0, cx,cy, c.w*5.5);
      hg.addColorStop(0,    `rgba(${c.hc},0.72)`);
      hg.addColorStop(0.35, `rgba(${c.mc},0.20)`);
      hg.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(cx,cy, c.w*5.5, 0, 6.2832); ctx.fill();

      // White nucleus
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx,cy, c.w*1.2, 0, 6.2832); ctx.fill();

      ctx.restore();

      // Advance in 0-1 space
      c.x += c.vx / W; c.y += c.vy / H;
      if (c.x > 1.5 || c.y > 1.4 || c.x < -0.3) comets.splice(i,1);
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

// ── NAVBAR ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('topBtn').classList.toggle('visible', window.scrollY > 400);
});

// ── MOBILE MENU ──
function toggleMenu() {
  const links  = document.getElementById('nav-links');
  const toggle = document.getElementById('menuToggle');
  links.classList.toggle('open');
  toggle.classList.toggle('open');
  document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
}
function closeMenu() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('menuToggle').classList.remove('open');
  document.body.style.overflow = '';
}
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ── SKILLS TABS ──
document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.skills-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    panel.classList.add('active');
    // Animate bars in the newly shown panel
    setTimeout(() => animateBars(panel), 50);
  });
});

function animateBars(container) {
  container.querySelectorAll('.skill-bar-fill').forEach(bar => {
    bar.classList.remove('animated');
    void bar.offsetWidth; // reflow
    bar.classList.add('animated');
  });
}
// Animate the default active panel on load
window.addEventListener('load', () => {
  const firstPanel = document.querySelector('.skills-panel.active');
  if (firstPanel) setTimeout(() => animateBars(firstPanel), 400);
});

// ── STAT COUNTER ──
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const step = 16;
  const increments = Math.ceil(duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current++;
    const progress = current / increments;
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.round(eased * target);
    if (current >= increments) { el.textContent = target; clearInterval(timer); }
  }, step);
}

// ── PROGRESS BAR ANIMATION (Currently section) ──
function animateProgressBars(container) {
  container.querySelectorAll('.progress-fill').forEach(bar => {
    bar.classList.remove('animated');
    void bar.offsetWidth;
    bar.classList.add('animated');
  });
}

// ── INTERSECTION OBSERVER ──
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');

    // Stat counters
    entry.target.querySelectorAll('.stat-number').forEach(el => animateCounter(el));

    // Skill bars (in case the default panel is visible on scroll)
    const activePanel = entry.target.querySelector('.skills-panel.active');
    if (activePanel) animateBars(activePanel);

    // Progress fills
    animateProgressBars(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.fade-section').forEach(el => sectionObs.observe(el));

// ── PROJECT FILTER ──
function filterProjects(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.project-card').forEach((card, i) => {
    const show = type === 'all' || card.dataset.cat === type;
    card.style.display = show ? 'flex' : 'none';
    if (show) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity .4s ease, transform .4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 60);
    }
  });
}

// ── CARD TILT ──
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * 5;
    const ry = ((e.clientX - r.left - r.width/2)  / (r.width/2))  * -5;
    card.style.transform    = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.transition   = 'transform .1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.transition = 'transform .35s cubic-bezier(0.4,0,0.2,1)';
  });
});

// ── MODAL ──
function openModal(src) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-img').src = src;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── ACTIVE NAV ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  sections.forEach(sec => {
    const top = sec.offsetTop - 130;
    const bot = top + sec.offsetHeight;
    const id  = sec.getAttribute('id');
    const link = document.querySelector(`#nav-links a[href="#${id}"]`);
    if (!link) return;
    if (scrollY >= top && scrollY < bot) {
      document.querySelectorAll('#nav-links a').forEach(a => a.style.color = '');
      link.style.color = '#c8ff57';
    }
  });
}, { passive: true });

// ── CONTACT FORM ──
function handleSubmit(e) {
  e.preventDefault();
  const btn   = document.querySelector('#contactForm button[type="submit"]');
  const msg   = document.getElementById('formMsg');
  const label = document.getElementById('btnText');

  const name  = document.getElementById('fname').value.trim();
  const email = document.getElementById('femail').value.trim();
  const text  = document.getElementById('fmsg').value.trim();

  if (!name || !email || !text) {
    msg.textContent = 'Please fill in all fields.';
    msg.className   = 'form-msg error';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email.';
    msg.className   = 'form-msg error';
    return;
  }

  btn.disabled = true;
  label.textContent = 'Sending...';

  setTimeout(() => {
    btn.disabled = false;
    label.textContent = 'Send Message';
    msg.textContent   = '✓ Message sent! I\'ll get back to you soon.';
    msg.className     = 'form-msg success';
    e.target.reset();
    setTimeout(() => { msg.textContent = ''; }, 5000);
  }, 1500);
}

/* =============================================
   ADVANCED FEATURES — appended
============================================= */

// ── FEATURE 1: READING PROGRESS BAR ──
(function() {
  const bar = document.getElementById('readingProgress');
  if (!bar) return;
  function updateProgress() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width  = Math.min(100, pct) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();

// ── FEATURE 2: ANIMATED STAT COUNTERS (fix: was defined but not triggered properly) ──
// Already hooked into sectionObs above — but add suffix support here
(function() {
  const SUFFIXES = { 400: '+', 3: '', 5: '', 8: '+' };
  // Override animateCounter to add suffixes
  window.animateCounter = function(el) {
    const target   = parseInt(el.dataset.target);
    if (isNaN(target)) return;
    const suffix   = el.dataset.suffix || (target >= 100 ? '+' : '');
    const duration = 1800;
    const steps    = Math.ceil(duration / 16);
    let   current  = 0;
    const timer = setInterval(() => {
      current++;
      const t = current / steps;
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = Math.round(eased * target) + suffix;
      if (current >= steps) { el.textContent = target + suffix; clearInterval(timer); }
    }, 16);
  };
})();

// ── FEATURE 3: COMMAND PALETTE ──
(function() {
  const COMMANDS = [
    // Navigation
    { group: 'Navigate', label: 'About Me',           desc: 'Who I am',               icon: 'fas fa-user',             action: () => scrollTo('#about') },
    { group: 'Navigate', label: 'Skills',             desc: 'My tech stack',           icon: 'fas fa-code',             action: () => scrollTo('#skills') },
    { group: 'Navigate', label: 'Education',          desc: 'Where I studied',         icon: 'fas fa-graduation-cap',   action: () => scrollTo('#education') },
    { group: 'Navigate', label: 'Projects',           desc: 'Things I have built',     icon: 'fas fa-folder-open',      action: () => scrollTo('#projects') },
    { group: 'Navigate', label: 'GitHub Activity',    desc: 'My open source work',     icon: 'fab fa-github',           action: () => scrollTo('#github') },
    { group: 'Navigate', label: 'Testimonials',       desc: 'What others say',         icon: 'fas fa-quote-right',      action: () => scrollTo('#testimonials') },
    { group: 'Navigate', label: 'How I Work',         desc: 'My process',              icon: 'fas fa-cogs',             action: () => scrollTo('#process') },
    { group: 'Navigate', label: 'Certificates',       desc: 'My credentials',          icon: 'fas fa-certificate',      action: () => scrollTo('#certificates') },
    { group: 'Navigate', label: 'Contact',            desc: 'Get in touch',            icon: 'fas fa-envelope',         action: () => scrollTo('#contact') },
    // Actions
    { group: 'Actions',  label: 'Download Resume',    desc: 'Get my PDF resume',       icon: 'fas fa-download',         action: () => { const a = document.createElement('a'); a.href='resume.pdf'; a.download='Yash_Resume.pdf'; a.click(); } },
    { group: 'Actions',  label: 'Open GitHub',        desc: 'github.com/YOUR_USERNAME',icon: 'fab fa-github',           action: () => window.open('https://github.com/YOUR_GITHUB_USERNAME', '_blank') },
    { group: 'Actions',  label: 'Open LinkedIn',      desc: 'Connect with me',         icon: 'fab fa-linkedin',         action: () => window.open('https://linkedin.com/in/YOUR_USERNAME', '_blank') },
    { group: 'Actions',  label: 'Send Email',         desc: 'Open email client',       icon: 'fas fa-envelope',         action: () => window.location.href='mailto:your@email.com' },
    { group: 'Actions',  label: 'Scroll to Top',      desc: 'Back to the start',       icon: 'fas fa-arrow-up',         action: () => window.scrollTo({top:0,behavior:'smooth'}) },
    // Filter
    { group: 'Projects', label: 'Show All Projects',  desc: 'Remove filter',           icon: 'fas fa-th',               action: () => { scrollTo('#projects'); setTimeout(()=>filterProjects('all', document.querySelector('.filter-btn')),400); } },
    { group: 'Projects', label: 'Show Web Projects',  desc: 'Filter: Web',             icon: 'fas fa-globe',            action: () => { scrollTo('#projects'); setTimeout(()=>filterProjects('web', document.querySelectorAll('.filter-btn')[1]),400); } },
    { group: 'Projects', label: 'Show AI Projects',   desc: 'Filter: AI / ML',         icon: 'fas fa-brain',            action: () => { scrollTo('#projects'); setTimeout(()=>filterProjects('ai', document.querySelectorAll('.filter-btn')[2]),400); } },
  ];

  function scrollTo(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const overlay    = document.getElementById('cmdOverlay');
  const input      = document.getElementById('cmdInput');
  const results    = document.getElementById('cmdResults');
  let   activeIdx  = 0;
  let   filtered   = [];

  window.openCmd = function() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    renderResults('');
    setTimeout(() => input.focus(), 50);
  };

  function closeCmd() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    filtered = q
      ? COMMANDS.filter(c =>
          c.label.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q)  ||
          c.group.toLowerCase().includes(q)
        )
      : COMMANDS;

    if (!filtered.length) {
      results.innerHTML = `<div class="cmd-empty">No results for "${query}"</div>`;
      return;
    }

    // Group by category
    const groups = {};
    filtered.forEach(c => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });

    let html = '';
    let idx  = 0;
    for (const [group, items] of Object.entries(groups)) {
      html += `<div class="cmd-group-label">${group}</div>`;
      items.forEach(cmd => {
        const i = filtered.indexOf(cmd);
        html += `
          <div class="cmd-item${i === activeIdx ? ' selected' : ''}" data-idx="${i}" role="option" aria-selected="${i === activeIdx}">
            <div class="cmd-item-icon"><i class="${cmd.icon}"></i></div>
            <div class="cmd-item-text">
              <div class="cmd-item-label">${cmd.label}</div>
              <div class="cmd-item-desc">${cmd.desc}</div>
            </div>
          </div>`;
        idx++;
      });
    }
    results.innerHTML = html;

    // Click handlers
    results.querySelectorAll('.cmd-item').forEach(item => {
      item.addEventListener('click', () => {
        const i = parseInt(item.dataset.idx);
        filtered[i].action();
        closeCmd();
      });
      item.addEventListener('mouseenter', () => {
        activeIdx = parseInt(item.dataset.idx);
        renderResults(input.value);
      });
    });
  }

  input.addEventListener('input', e => { activeIdx = 0; renderResults(e.target.value); });

  document.addEventListener('keydown', e => {
    // Open with Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? closeCmd() : openCmd();
      return;
    }
    if (!overlay.classList.contains('open')) return;

    if (e.key === 'Escape')    { closeCmd(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx+1, filtered.length-1); renderResults(input.value); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); activeIdx = Math.max(activeIdx-1, 0); renderResults(input.value); }
    if (e.key === 'Enter' && filtered[activeIdx]) {
      filtered[activeIdx].action();
      closeCmd();
    }
  });

  // Click outside to close
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCmd(); });
  document.getElementById('cmdEsc')?.addEventListener('click', closeCmd);
})();

// ── FEATURE 4: SMART CURSOR PER SECTION/ELEMENT ──
(function() {
  if (window.innerWidth <= 768) return;
  const cursor = document.getElementById('cursor');
  const trail  = document.getElementById('cursor-trail');
  const label  = document.getElementById('cursorLabel');
  if (!cursor) return;

  let mx = -100, my = -100;
  let tx = -100, ty = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  // Smooth trail with rAF
  function animateTrail() {
    tx += (mx - tx) * 0.1;
    ty += (my - ty) * 0.1;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Project cards → expand with VIEW
  document.querySelectorAll('.project-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.className = 'cursor-view';
      if (label) label.textContent = 'VIEW';
      trail.style.opacity = '0';
    });
    el.addEventListener('mouseleave', () => {
      cursor.className = '';
      if (label) label.textContent = '';
      trail.style.opacity = '1';
    });
  });

  // Links and buttons → purple ring
  document.querySelectorAll('a, button, .cert-card, .stab, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (!cursor.classList.contains('cursor-view')) cursor.className = 'cursor-link';
    });
    el.addEventListener('mouseleave', () => {
      if (!cursor.classList.contains('cursor-view')) cursor.className = '';
    });
  });

  // Text areas → text cursor
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.className = 'cursor-text'; trail.style.opacity = '0'; });
    el.addEventListener('mouseleave', () => { cursor.className = ''; trail.style.opacity = '1'; });
  });

  // Hero section → keep default but larger trail
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => { trail.style.width = '48px'; trail.style.height = '48px'; });
    hero.addEventListener('mouseleave', () => { trail.style.width = '36px'; trail.style.height = '36px'; });
  }
})();

// ── FEATURE 5: MOBILE CAROUSEL DOTS ──
(function() {
  if (window.innerWidth > 768) return;
  const carousel = document.getElementById('projectsCarousel');
  const grid     = document.getElementById('projectsGrid');
  if (!carousel || !grid) return;

  const cards = grid.querySelectorAll('.project-card');
  if (!cards.length) return;

  // Insert dots
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'carousel-dots';
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dotsWrap.appendChild(dot);
  });
  carousel.after(dotsWrap);

  // Update active dot on scroll
  carousel.addEventListener('scroll', () => {
    const scrollLeft = carousel.scrollLeft;
    const cardWidth  = cards[0].offsetWidth + 16;
    const idx        = Math.round(scrollLeft / cardWidth);
    dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }, { passive: true });
})();

// ── FEATURE 7: KEYBOARD NAVIGATION FOR SKILLS TABS ──
(function() {
  const tabs = document.querySelectorAll('.stab');
  tabs.forEach((tab, i) => {
    tab.addEventListener('keydown', e => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[i + 1] || tabs[0];
      if (e.key === 'ArrowLeft')  next = tabs[i - 1] || tabs[tabs.length - 1];
      if (next) { next.focus(); next.click(); }
    });

    // Update aria-selected on click
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
    });
  });

  // Filter buttons aria-pressed
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
    });
  });
})();
