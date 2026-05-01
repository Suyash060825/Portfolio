/* =============================================
   YASH PORTFOLIO — script.js
============================================= */

// ── LOADER ──
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 1600);
});

// ── CUSTOM CURSOR ──
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');

if (cursor && trail && window.innerWidth > 768) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    setTimeout(() => {
      trail.style.left = e.clientX + 'px';
      trail.style.top  = e.clientY + 'px';
    }, 80);
  });

  // Scale on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .project-card, .cert-card, .skill-pill');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.opacity = '0.6';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '10px';
      cursor.style.height = '10px';
      cursor.style.opacity = '1';
    });
  });
}

// ── NAVBAR ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('topBtn').classList.toggle('visible', window.scrollY > 400);
});

// ── MOBILE MENU ──
function toggleMenu() {
  const links = document.getElementById('nav-links');
  const toggle = document.getElementById('menuToggle');
  links.classList.toggle('open');
  toggle.classList.toggle('open');
  document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
}
function closeMenu() {
  const links = document.getElementById('nav-links');
  const toggle = document.getElementById('menuToggle');
  links.classList.remove('open');
  toggle.classList.remove('open');
  document.body.style.overflow = '';
}

// ── SCROLL TO TOP ──
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── INTERSECTION OBSERVER (fade-in sections) ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.fade-section').forEach(el => observer.observe(el));

// ── PROJECT FILTER ──
function filterProjects(type, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const cards = document.querySelectorAll('.project-card');
  cards.forEach(card => {
    const show = type === 'all' || card.dataset.cat === type;
    card.style.display = show ? 'flex' : 'none';

    if (show) {
      // Stagger animate in
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    }
  });
}

// ── STARS IN SPACE CANVAS ──
(function initStars() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Star layers (parallax depths) ---
  const LAYERS = [
    { count: 220, speed: 0.008, sizeRange: [0.3, 0.8],  opacityRange: [0.3, 0.6] },
    { count: 100, speed: 0.018, sizeRange: [0.8, 1.5],  opacityRange: [0.5, 0.9] },
    { count: 35,  speed: 0.032, sizeRange: [1.5, 2.8],  opacityRange: [0.7, 1.0] }
  ];

  const stars = [];

  LAYERS.forEach((layer, li) => {
    for (let i = 0; i < layer.count; i++) {
      const size = layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]);
      stars.push({
        x:       Math.random() * 2000 - 1000,
        y:       Math.random() * 2000 - 1000,
        size,
        baseOpacity: layer.opacityRange[0] + Math.random() * (layer.opacityRange[1] - layer.opacityRange[0]),
        opacity: 0,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
        speed:   layer.speed,
        layer:   li,
        // shooting star chance only on layer 2
        isShooting: false
      });
    }
  });

  // --- Shooting stars ---
  const shooters = [];
  function spawnShooter() {
    if (shooters.length < 2 && Math.random() < 0.3) {
      const angle = -0.4 + Math.random() * -0.3; // steep diagonal
      const speed = 8 + Math.random() * 10;
      shooters.push({
        x:     Math.random() * W,
        y:     Math.random() * H * 0.5,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed + speed * 0.4,
        len:   80 + Math.random() * 100,
        alpha: 1,
        fade:  0.015 + Math.random() * 0.01
      });
    }
    setTimeout(spawnShooter, 3000 + Math.random() * 5000);
  }
  setTimeout(spawnShooter, 2000);

  // --- Nebula gradient (subtle, painted once per resize) ---
  let nebulaCache = null;
  function buildNebula() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');

    // Deep space base
    const bg = c.createRadialGradient(W*0.3, H*0.4, 0, W*0.3, H*0.4, W*0.7);
    bg.addColorStop(0,   'rgba(20, 10, 50, 0.55)');
    bg.addColorStop(0.5, 'rgba(8, 11, 20, 0.3)');
    bg.addColorStop(1,   'rgba(0, 0, 0, 0)');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // Purple nebula cloud
    const neb1 = c.createRadialGradient(W*0.65, H*0.3, 0, W*0.65, H*0.3, W*0.35);
    neb1.addColorStop(0,   'rgba(100, 60, 180, 0.12)');
    neb1.addColorStop(0.5, 'rgba(70, 30, 140, 0.05)');
    neb1.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = neb1;
    c.fillRect(0, 0, W, H);

    // Teal nebula accent
    const neb2 = c.createRadialGradient(W*0.15, H*0.7, 0, W*0.15, H*0.7, W*0.3);
    neb2.addColorStop(0,   'rgba(30, 120, 150, 0.1)');
    neb2.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = neb2;
    c.fillRect(0, 0, W, H);

    nebulaCache = off;
  }
  buildNebula();
  window.addEventListener('resize', buildNebula);

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Nebula
    if (nebulaCache) ctx.drawImage(nebulaCache, 0, 0);

    // Parallax offset from mouse
    const ox = (mouse.x / W - 0.5) * 30;
    const oy = (mouse.y / H - 0.5) * 30;

    // Stars
    stars.forEach(s => {
      // Twinkle
      s.twinklePhase += s.twinkleSpeed;
      const twinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);
      s.opacity = s.baseOpacity * (0.6 + 0.4 * twinkle);

      // Screen position with depth-scaled parallax
      const depth = (s.layer + 1) / LAYERS.length;
      const sx = ((s.x + W / 2 + ox * depth) % W + W) % W;
      const sy = ((s.y + H / 2 + oy * depth) % H + H) % H;

      // Draw star — larger stars get a subtle cross flare
      ctx.save();
      ctx.globalAlpha = s.opacity;

      if (s.size > 1.8) {
        // Cross flare
        const fLen = s.size * 3.5;
        const grad = ctx.createLinearGradient(sx - fLen, sy, sx + fLen, sy);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, `rgba(255,255,255,${s.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(sx - fLen, sy); ctx.lineTo(sx + fLen, sy); ctx.stroke();

        const grad2 = ctx.createLinearGradient(sx, sy - fLen, sx, sy + fLen);
        grad2.addColorStop(0, 'rgba(255,255,255,0)');
        grad2.addColorStop(0.5, `rgba(255,255,255,${s.opacity * 0.4})`);
        grad2.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad2;
        ctx.beginPath(); ctx.moveTo(sx, sy - fLen); ctx.lineTo(sx, sy + fLen); ctx.stroke();
      }

      // Core dot — slightly warm/cool tint variation
      const hue = s.layer === 2 ? 'rgba(220,230,255,' : s.layer === 1 ? 'rgba(255,250,240,' : 'rgba(200,210,255,';
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fillStyle = hue + s.opacity + ')';
      ctx.fill();

      ctx.restore();
    });

    // Shooting stars
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      ctx.save();
      ctx.globalAlpha = s.alpha;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 10), s.y - s.vy * (s.len / 10));
      grad.addColorStop(0, 'rgba(255,255,240,0.9)');
      grad.addColorStop(0.3, 'rgba(200,255,87,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * (s.len / 10), s.y - s.vy * (s.len / 10));
      ctx.stroke();
      ctx.restore();

      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.fade;
      if (s.alpha <= 0 || s.x > W + 200 || s.y > H + 200) shooters.splice(i, 1);
    }

    t++;
    requestAnimationFrame(draw);
  }

  draw();

  // Mouse parallax
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    hero.addEventListener('mouseleave', () => {
      mouse.x = W / 2;
      mouse.y = H / 2;
    });
  }
})();

// ── CERTIFICATE MODAL ──
function openModal(src) {
  const modal = document.getElementById('modal');
  const img   = document.getElementById('modal-img');
  img.src = src;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── CONTACT FORM ──
function handleSubmit(e) {
  e.preventDefault();
  const btn  = document.querySelector('#contactForm button');
  const msg  = document.getElementById('formMsg');
  const text = document.getElementById('btnText');

  // Simple validation
  const name  = document.getElementById('fname').value.trim();
  const email = document.getElementById('femail').value.trim();
  const msgTxt = document.getElementById('fmsg').value.trim();

  if (!name || !email || !msgTxt) {
    msg.textContent = 'Please fill in all fields.';
    msg.className   = 'form-msg error';
    return;
  }

  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailReg.test(email)) {
    msg.textContent = 'Please enter a valid email.';
    msg.className   = 'form-msg error';
    return;
  }

  // Simulate sending
  btn.disabled = true;
  text.textContent = 'Sending...';

  setTimeout(() => {
    btn.disabled = false;
    text.textContent = 'Send Message';
    msg.textContent = '✓ Message sent! I\'ll get back to you soon.';
    msg.className   = 'form-msg success';
    e.target.reset();

    setTimeout(() => { msg.textContent = ''; }, 5000);
  }, 1500);
}

// ── ACTIVE NAV LINK on scroll ──
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  sections.forEach(section => {
    const top = section.offsetTop - 120;
    const bot = top + section.offsetHeight;
    const id  = section.getAttribute('id');
    const link = document.querySelector(`#nav-links a[href="#${id}"]`);
    if (!link) return;
    if (scrollY >= top && scrollY < bot) {
      document.querySelectorAll('#nav-links a').forEach(a => a.style.color = '');
      link.style.color = '#c8ff57';
    }
  });
});

// ── CARD TILT EFFECT ──
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * 5;
    const ry = ((x - cx) / cx) * -5;
    card.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
  });
});