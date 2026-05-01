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

// ── GLOBAL STAR CANVAS (covers entire page) ──
(function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  }
  resize();
  window.addEventListener('resize', () => { resize(); buildNebula(); });

  // ── Star layers: far / mid / close ──
  const LAYERS = [
    { count: 300, minSize: 0.2, maxSize: 0.6,  minOp: 0.15, maxOp: 0.5,  twinkleMin: 0.002, twinkleMax: 0.006 },
    { count: 130, minSize: 0.6, maxSize: 1.3,  minOp: 0.35, maxOp: 0.85, twinkleMin: 0.006, twinkleMax: 0.018 },
    { count:  45, minSize: 1.3, maxSize: 2.8,  minOp: 0.55, maxOp: 1.0,  twinkleMin: 0.012, twinkleMax: 0.030 }
  ];

  // Color tints: 0=blue-white, 1=warm white, 2=purple, 3=teal, 4=amber
  const TINTS = [
    [210, 225, 255],
    [255, 248, 230],
    [200, 180, 255],
    [180, 240, 240],
    [255, 230, 180]
  ];

  const stars = [];
  LAYERS.forEach((l, li) => {
    for (let i = 0; i < l.count; i++) {
      const size = l.minSize + Math.random() * (l.maxSize - l.minSize);
      const tint = TINTS[Math.floor(Math.random() * TINTS.length)];
      // Bigger stars more likely to be colorful
      const chosenTint = (size > 1.5 && Math.random() > 0.4)
        ? TINTS[2 + Math.floor(Math.random() * 3)]
        : tint;
      stars.push({
        x:        Math.random(),
        y:        Math.random(),
        size,
        baseOp:   l.minOp + Math.random() * (l.maxOp - l.minOp),
        op:       0,
        phase:    Math.random() * Math.PI * 2,
        tSpeed:   l.twinkleMin + Math.random() * (l.twinkleMax - l.twinkleMin),
        // Occasional "pulse" — star briefly flares brighter
        pulseTimer: 200 + Math.floor(Math.random() * 600),
        pulseActive: false,
        pulseOp:  0,
        layer:    li,
        tint:     chosenTint
      });
    }
  });

  // ── Shooting stars ──
  const shooters = [];
  function spawnShooter() {
    if (shooters.length < 3) {
      const spd = 8 + Math.random() * 10;
      const ang = -(0.3 + Math.random() * 0.4);
      shooters.push({
        x:     Math.random(),
        y:     Math.random() * 0.5,
        vx:    Math.cos(ang) * spd,
        vy:    Math.abs(Math.sin(ang)) * spd + 2,
        len:   100 + Math.random() * 80,
        alpha: 0,
        fadingIn: true,
        fade:  0.013 + Math.random() * 0.008
      });
    }
    setTimeout(spawnShooter, 3000 + Math.random() * 6000);
  }
  setTimeout(spawnShooter, 1800);

  // ── Aurora wave (drifts down through full page) ──
  let auroraOffset = 0;

  // ── Nebula offscreen canvas ──
  let nebula = null;
  function buildNebula() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');

    // Deep purple-blue core top-left
    const g1 = c.createRadialGradient(W*.25, H*.12, 0, W*.25, H*.12, W*.6);
    g1.addColorStop(0,   'rgba(14,6,40,0.6)');
    g1.addColorStop(0.5, 'rgba(8,11,22,0.3)');
    g1.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = g1; c.fillRect(0,0,W,H);

    // Purple nebula cloud mid-right
    const g2 = c.createRadialGradient(W*.78, H*.3, 0, W*.78, H*.3, W*.38);
    g2.addColorStop(0,   'rgba(80,40,160,0.10)');
    g2.addColorStop(0.6, 'rgba(50,20,100,0.04)');
    g2.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = g2; c.fillRect(0,0,W,H);

    // Teal cloud bottom-left
    const g3 = c.createRadialGradient(W*.08, H*.72, 0, W*.08, H*.72, W*.28);
    g3.addColorStop(0,   'rgba(15,90,120,0.09)');
    g3.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = g3; c.fillRect(0,0,W,H);

    // Faint center glow
    const g4 = c.createRadialGradient(W*.5, H*.5, 0, W*.5, H*.5, W*.4);
    g4.addColorStop(0,   'rgba(30,15,70,0.06)');
    g4.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = g4; c.fillRect(0,0,W,H);

    nebula = off;
  }
  buildNebula();

  let frame = 0;

  function draw() {
    // Catch page height changes (lazy-loaded content etc.)
    const liveH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    if (Math.abs(liveH - H) > 80) { H = canvas.height = liveH; buildNebula(); }

    ctx.clearRect(0, 0, W, H);

    // 1. Nebula
    if (nebula) ctx.drawImage(nebula, 0, 0, W, H);

    // 2. Aurora ribbons across full page height
    auroraOffset += 0.003;
    for (let r = 0; r < 3; r++) {
      const yBase = H * (0.15 + r * 0.35);
      const amp   = 60 + r * 30;
      const freq  = 0.0008 + r * 0.0003;
      const phase = auroraOffset + r * 2.1;
      const col   = r === 0
        ? [124, 106, 255]
        : r === 1
          ? [60, 160, 200]
          : [200, 255, 87];

      ctx.save();
      ctx.globalAlpha = 0.018 + 0.006 * Math.sin(auroraOffset * 1.3 + r);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y = yBase + Math.sin(x * freq + phase) * amp
                        + Math.sin(x * freq * 1.7 + phase * 0.8) * (amp * 0.4);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = 120 + 60 * Math.sin(auroraOffset * 0.7 + r);
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},1)`;
      ctx.filter = `blur(28px)`;
      ctx.stroke();
      ctx.filter = 'none';
      ctx.restore();
    }

    // 3. Stars
    frame++;
    stars.forEach(s => {
      s.phase += s.tSpeed;

      // Pulse logic
      s.pulseTimer--;
      if (s.pulseTimer <= 0 && !s.pulseActive) {
        s.pulseActive = true;
        s.pulseOp     = 0;
        s.pulseTimer  = 300 + Math.floor(Math.random() * 500);
      }
      let extra = 0;
      if (s.pulseActive) {
        s.pulseOp += 0.04;
        extra = Math.sin(s.pulseOp) * 0.4;
        if (s.pulseOp >= Math.PI) { s.pulseActive = false; extra = 0; }
      }

      const twinkle = 0.5 + 0.5 * Math.sin(s.phase);
      s.op = Math.min(1, s.baseOp * (0.5 + 0.5 * twinkle) + extra);

      const sx = s.x * W;
      const sy = s.y * H;
      const [r, g, b] = s.tint;

      // Cross flare on bright big stars
      if (s.size > 1.6 && s.op > 0.5) {
        const fl = s.size * (3.5 + extra * 2);
        ctx.save();
        ctx.globalAlpha = s.op * 0.3;
        ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.moveTo(sx-fl,sy); ctx.lineTo(sx+fl,sy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx,sy-fl); ctx.lineTo(sx,sy+fl); ctx.stroke();
        ctx.restore();
      }

      // Glow halo on large stars
      if (s.size > 1.8 && s.op > 0.4) {
        const grad = ctx.createRadialGradient(sx,sy,0, sx,sy, s.size*5);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${s.op*0.25})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, s.size*5, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${s.op})`;
      ctx.fill();
    });

    // 4. Shooting stars
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      if (s.fadingIn) {
        s.alpha = Math.min(1, s.alpha + 0.08);
        if (s.alpha >= 1) s.fadingIn = false;
      } else {
        s.alpha -= s.fade;
      }

      const sx = s.x * W, sy = s.y * H;
      const tailX = sx - s.vx * (s.len / 10);
      const tailY = sy - s.vy * (s.len / 10);

      ctx.save();
      ctx.globalAlpha = s.alpha;
      const gl = ctx.createLinearGradient(sx, sy, tailX, tailY);
      gl.addColorStop(0,    'rgba(255,255,245,1)');
      gl.addColorStop(0.15, 'rgba(200,255,87,0.7)');
      gl.addColorStop(0.5,  'rgba(180,160,255,0.3)');
      gl.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.strokeStyle = gl;
      ctx.lineWidth   = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      // Tiny bright head
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.restore();

      s.x += s.vx / W;
      s.y += s.vy / H;
      if (s.alpha <= 0 || s.x > 1.3 || s.y > 1.2) shooters.splice(i, 1);
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
