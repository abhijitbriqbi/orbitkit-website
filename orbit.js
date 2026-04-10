// ══════════════════════════════════════════════════════
// ORBITKIT — UNIVERSE ENGINE
// ══════════════════════════════════════════════════════

(function() {

// ── CANVAS UNIVERSE ──────────────────────────────────
const canvas = document.getElementById('universe');
if (!canvas) return;
const ctx = canvas.getContext('2d');
let W, H, stars = [], nebulae = [], satellites = [], meteors = [];
let frame = 0, raf;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildScene();
}

function buildScene() {
  // Stars
  stars = [];
  const n = Math.floor((W * H) / 2200);
  for (let i = 0; i < n; i++) {
    const warmCool = Math.random();
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.15,
      a: Math.random() * 0.7 + 0.15,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      // warm = orbit orange, cool = blue, white
      hue: warmCool > 0.88 ? 22 : warmCool > 0.76 ? 210 : 0,
      sat: warmCool > 0.88 ? 80 : warmCool > 0.76 ? 60 : 0,
    });
  }

  // Orbital paths (visible arcs)
  nebulae = [
    { cx: W * 0.72, cy: H * 0.28, rx: 220, ry: 80, rot: -0.4, a: 0.04 },
    { cx: W * 0.15, cy: H * 0.65, rx: 180, ry: 60, rot: 0.6,  a: 0.03 },
    { cx: W * 0.5,  cy: H * 0.8,  rx: 300, ry: 100,rot: 0.1,  a: 0.025},
  ];

  // Satellites on paths
  satellites = nebulae.map((orb, i) => ({
    orb: i, angle: Math.random() * Math.PI * 2,
    speed: (0.004 + Math.random() * 0.003) * (i % 2 === 0 ? 1 : -1),
    r: 2.5 + Math.random() * 2,
    trail: [],
  }));

  // Meteors
  meteors = [];
}

function spawnMeteor() {
  if (meteors.length < 2 && Math.random() < 0.004) {
    const angle = Math.PI / 6 + Math.random() * Math.PI / 8;
    meteors.push({
      x: Math.random() * W * 0.6,
      y: Math.random() * H * 0.3,
      vx: Math.cos(angle) * 18,
      vy: Math.sin(angle) * 18,
      life: 1, trail: [],
    });
  }
}

function draw() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  // ── Stars ──
  for (const s of stars) {
    s.phase += s.speed;
    const a = (Math.sin(s.phase) * 0.35 + 0.65) * s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    if (s.sat > 0) {
      ctx.fillStyle = `hsla(${s.hue},${s.sat}%,88%,${a})`;
    } else {
      ctx.fillStyle = `rgba(230,228,255,${a})`;
    }
    ctx.fill();
  }

  // ── Orbital arcs ──
  for (const orb of nebulae) {
    ctx.save();
    ctx.translate(orb.cx, orb.cy);
    ctx.rotate(orb.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, orb.rx, orb.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,107,44,${orb.a})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Satellites ──
  for (const sat of satellites) {
    const orb = nebulae[sat.orb];
    sat.angle += sat.speed;
    const x = orb.cx + Math.cos(sat.angle) * orb.rx * Math.cos(orb.rot)
               - Math.sin(sat.angle) * orb.ry * Math.sin(orb.rot);
    const y = orb.cy + Math.cos(sat.angle) * orb.rx * Math.sin(orb.rot)
               + Math.sin(sat.angle) * orb.ry * Math.cos(orb.rot);

    sat.trail.push({ x, y });
    if (sat.trail.length > 18) sat.trail.shift();

    // Trail
    for (let t = 0; t < sat.trail.length - 1; t++) {
      const a = (t / sat.trail.length) * 0.5;
      ctx.beginPath();
      ctx.moveTo(sat.trail[t].x, sat.trail[t].y);
      ctx.lineTo(sat.trail[t+1].x, sat.trail[t+1].y);
      ctx.strokeStyle = `rgba(255,107,44,${a})`;
      ctx.lineWidth = sat.r * (t / sat.trail.length);
      ctx.stroke();
    }

    // Satellite dot
    ctx.beginPath();
    ctx.arc(x, y, sat.r, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B2C';
    ctx.fill();
    // Glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, sat.r * 4);
    grd.addColorStop(0, 'rgba(255,107,44,0.3)');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, sat.r * 4, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // ── Meteors ──
  spawnMeteor();
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.trail.push({ x: m.x, y: m.y });
    if (m.trail.length > 20) m.trail.shift();
    m.x += m.vx; m.y += m.vy;
    m.life -= 0.016;

    for (let t = 0; t < m.trail.length - 1; t++) {
      const a = (t / m.trail.length) * m.life * 0.85;
      ctx.beginPath();
      ctx.moveTo(m.trail[t].x, m.trail[t].y);
      ctx.lineTo(m.trail[t+1].x, m.trail[t+1].y);
      ctx.strokeStyle = `rgba(255,200,140,${a})`;
      ctx.lineWidth = (t / m.trail.length) * 2.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,180,${m.life})`;
    ctx.fill();

    if (m.life <= 0 || m.x > W + 200 || m.y > H + 200) {
      meteors.splice(i, 1);
    }
  }

  raf = requestAnimationFrame(draw);
}

window.addEventListener('resize', resize);
resize();
draw();

// ── FADE-IN OBSERVER ────────────────────────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fi').forEach(el => io.observe(el));

// ── NAV ACTIVE ───────────────────────────────────────
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});

// ── NAV SCROLL SHADOW ────────────────────────────────
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.borderBottomColor = window.scrollY > 30
      ? 'rgba(255,107,44,0.15)'
      : 'rgba(255,255,255,0.065)';
  }, { passive: true });
}

// ── COUNTER ANIMATION ────────────────────────────────
window.animateCount = function(el, target, suffix='', duration=1200) {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const val = Math.round(p * target);
    el.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Auto-animate counters when visible
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      window.animateCount(el, target, suffix);
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

// ── LEGAL SIDEBAR ACTIVE ─────────────────────────────
const legalHeadings = document.querySelectorAll('.legal-content h2[id]');
const legalLinks = document.querySelectorAll('.ls-nav a');
if (legalHeadings.length) {
  window.addEventListener('scroll', () => {
    let cur = '';
    legalHeadings.forEach(h => { if (window.scrollY >= h.offsetTop - 130) cur = h.id; });
    legalLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  }, { passive: true });
}

})();
