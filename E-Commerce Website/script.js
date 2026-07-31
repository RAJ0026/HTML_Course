/* script.js – Amazon Clone interactive features */

'use strict';

/* ============================================================
   Utility
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   Cart State
   ============================================================ */
const cart = {
  items: [],          // { id, name, price, qty }
  count: 0,

  add(id, name, price) {
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ id, name, price: parseFloat(price), qty: 1 });
    }
    this.count += 1;
    this._updateBadge();
    showToast(`🛒 Added "${name}" to cart`);
  },

  _updateBadge() {
    const badge = $('#cart-count');
    if (!badge) return;
    badge.textContent = this.count;
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 300);
  }
};

/* ============================================================
   Toast Notification
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  const toast = $('#cart-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ============================================================
   "Add to Cart" Buttons (delegated)
   ============================================================ */
function initCartButtons() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;

    const card = btn.closest('[data-id]');
    if (!card) return;

    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = card.dataset.price;

    cart.add(id, name, price);

    // Visual feedback on button
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1800);
  });
}

/* ============================================================
   Hero Carousel
   ============================================================ */
function initHeroCarousel() {
  const track = $('#hero-track');
  const dotsEl = $('#hero-dots');
  const prevBtn = $('#hero-prev');
  const nextBtn = $('#hero-next');
  if (!track) return;

  const slides = $$('.slide', track);
  const total = slides.length;
  let current = 0;
  let autoTimer = null;

  // Build dot indicators
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    $$('.dot', dotsEl).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });
  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });

  // Pause on hover
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.parentElement.addEventListener('mouseleave', startAuto);

  // Touch / swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    resetAuto();
  });

  function startAuto() { autoTimer = setInterval(next, 4500); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  startAuto();
}

/* ============================================================
   Deals Carousel
   ============================================================ */
function initDealsCarousel() {
  const track = $('#deals-track');
  const prevBtn = $('#deals-prev');
  const nextBtn = $('#deals-next');
  if (!track) return;

  const cards = $$('.deal-card', track);
  const cardWidth = 200 + 16;  // card width + gap (1rem)
  const visible = Math.floor(track.parentElement.offsetWidth / cardWidth);
  const maxOffset = Math.max(0, cards.length - visible);
  let offset = 0;        // in card-steps

  function update() {
    track.style.transform = `translateX(-${offset * cardWidth}px)`;
    prevBtn.disabled = offset === 0;
    nextBtn.disabled = offset >= maxOffset;
    prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
  }

  prevBtn?.addEventListener('click', () => { if (offset > 0) { offset--; update(); } });
  nextBtn?.addEventListener('click', () => { if (offset < maxOffset) { offset++; update(); } });

  update();

  // Recalculate on resize
  window.addEventListener('resize', () => {
    const vis2 = Math.floor(track.parentElement.offsetWidth / cardWidth);
    const max2 = Math.max(0, cards.length - vis2);
    if (offset > max2) offset = max2;
    update();
  });
}

/* ============================================================
   Search (client-side highlight)
   ============================================================ */
function initSearch() {
  const input = $('#search-input');
  const btn = $('#search-btn');
  if (!input) return;

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const cards = $$('.product-card, .deal-card');
    cards.forEach(card => {
      const name = card.dataset.name?.toLowerCase() ?? card.querySelector('h3,h4')?.textContent.toLowerCase() ?? '';
      const match = name.includes(q);
      card.style.opacity = match || !q ? '1' : '0.35';
      card.style.transform = match ? 'scale(1.02)' : '';
    });
  }

  btn?.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') {
      input.value = '';
      $$('.product-card, .deal-card').forEach(c => {
        c.style.opacity = '1';
        c.style.transform = '';
      });
    }
  });
}

/* ============================================================
   Keyboard Accessibility – Carousel Arrow Keys
   ============================================================ */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    const focus = document.activeElement;
    if (focus?.closest('.hero-carousel')) {
      if (e.key === 'ArrowRight') $('#hero-next')?.click();
      if (e.key === 'ArrowLeft') $('#hero-prev')?.click();
    }
  });
}

/* ============================================================
   Smooth scroll-reveal animation for product cards
   ============================================================ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const items = $$('.product-card, .deal-card, .category-tile');
  items.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => observer.observe(el));
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCartButtons();
  initHeroCarousel();
  initDealsCarousel();
  initSearch();
  initKeyboard();
  initScrollReveal();
});
