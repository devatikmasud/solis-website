import { Engine } from './three/Engine.js';
import { CHAPTERS } from './three/SceneManager.js';

/* ============================== WebGL engine ============================== */
const canvas = document.getElementById('webgl-canvas');
let engine = null;

const CHAPTER_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const CHAPTER_NAME = ['Overture', 'Manufacturing', 'Power Generation', 'Data Centers', 'Recycling', 'Project Solis', 'Convergence'];

const railEl = document.querySelector('.scroll-rail');
const railPct = document.querySelector('.scroll-rail-pct');
const chapterRoman = document.querySelector('.chapter-indicator .roman');
const chapterName = document.querySelector('.chapter-indicator .name');

if (canvas) {
  engine = new Engine(canvas, {
    onSectionChange: (index) => {
      const i = Math.max(0, Math.min(CHAPTER_ROMAN.length - 1, index));
      if (chapterRoman) chapterRoman.textContent = CHAPTER_ROMAN[i];
      if (chapterName) chapterName.textContent = CHAPTER_NAME[i];
      if (railEl) {
        railEl.querySelectorAll('.scroll-rail-dot').forEach((dot, di) => {
          dot.classList.toggle('active', di === i);
        });
      }
    },
    onProgress: (p) => {
      if (railPct) railPct.textContent = Math.round(p * 100).toString().padStart(2, '0');
    },
  });
  engine.start();

  // Build the rail dots once, matching CHAPTERS
  if (railEl) {
    CHAPTERS.forEach((c, i) => {
      const dot = document.createElement('div');
      dot.className = 'scroll-rail-dot' + (i === 0 ? ' active' : '');
      dot.title = c.id;
      railEl.insertBefore(dot, railPct || null);
    });
  }

  // Scroll -> engine progress
  const onScroll = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - window.innerHeight;
    const p = max > 0 ? el.scrollTop / max : 0;
    engine.setProgress(p);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================== Nav ============================== */
const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
const mobileDrawer = document.querySelector('.mobile-drawer');
const closeBtn = document.querySelector('.drawer-close');

window.addEventListener('scroll', () => {
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

if (menuBtn && mobileDrawer) {
  menuBtn.addEventListener('click', () => {
    mobileDrawer.classList.add('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
  });
}
if (closeBtn && mobileDrawer) {
  closeBtn.addEventListener('click', () => {
    mobileDrawer.classList.remove('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
  });
}
document.querySelectorAll('.mobile-drawer a').forEach((a) => {
  a.addEventListener('click', () => {
    mobileDrawer?.classList.remove('is-open');
    mobileDrawer?.setAttribute('aria-hidden', 'true');
  });
});

/* ============================== Reveal on scroll ============================== */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ============================== Contact form ============================== */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const note = document.getElementById('contact-note');
    if (!data.get('name') || !data.get('email') || !data.get('message')) {
      if (note) {
        note.textContent = 'Please fill in your name, email, and message.';
        note.classList.add('is-visible');
      }
      return;
    }
    contactForm.reset();
    if (note) {
      note.textContent = 'Thank you \u2014 your message has been received.';
      note.classList.add('is-visible');
    }
  });
}

/* ============================== Footer year ============================== */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
