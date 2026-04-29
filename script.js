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

// ── PARTICLE CANVAS ──
(function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = window.innerWidth < 768 ? 40 : 80;
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      dx:   (Math.random() - 0.5) * 0.4,
      dy:   (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(200, 255, 87, ${0.04 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 255, 87, ${p.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(drawParticles);
  }

  drawParticles();

  // Mouse interaction — subtle repulsion
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      particles.forEach(p => {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      });
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
