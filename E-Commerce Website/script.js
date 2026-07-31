/* script.js – Amazon Clone interactive features (~20% milestone) */

'use strict';

/* ============================================================
   Utility
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   Product Catalog (mirrors HTML data-attributes)
   ============================================================ */
const PRODUCTS = [
  { id: '1', name: 'Echo Dot (5th Gen)', price: 29.99, img: 'https://picsum.photos/200/200?random=1', stars: '★★★★½', reviews: '3,847', desc: 'The Echo Dot 5th Gen delivers rich, room-filling sound with built-in Alexa voice assistant.' },
  { id: '2', name: 'Kindle Paperwhite', price: 129.99, img: 'https://picsum.photos/200/200?random=2', stars: '★★★★★', reviews: '12,091', desc: 'The thinnest, lightest Kindle Paperwhite yet — with a flush-front design and 300 ppi glare-free display.' },
  { id: '3', name: 'Fire TV Stick 4K', price: 49.99, img: 'https://picsum.photos/200/200?random=3', stars: '★★★★½', reviews: '7,523', desc: 'Stream in crystal-clear 4K Ultra HD with support for Dolby Vision, HDR, and HDR10+.' },
  { id: '4', name: 'Ring Video Doorbell', price: 99.99, img: 'https://picsum.photos/200/200?random=20', stars: '★★★★☆', reviews: '5,204', desc: 'See, hear and speak to visitors from anywhere with the Ring Video Doorbell.' },
  { id: '5', name: 'AirPods Pro (2nd Gen)', price: 199.00, img: 'https://picsum.photos/200/200?random=21', stars: '★★★★★', reviews: '9,301', desc: 'AirPods Pro (2nd Gen) feature active noise cancellation and Adaptive Transparency for immersive audio.' },
  { id: '6', name: 'Samsung 65" QLED TV', price: 899.99, img: 'https://picsum.photos/200/200?random=22', stars: '★★★★½', reviews: '2,158', desc: 'Samsung 65" QLED TV with Quantum HDR and an ultra-slim bezel design for cinema-quality viewing.' },
  { id: 'd1', name: 'Smart Speaker Mini', price: 19.99, img: 'https://picsum.photos/180/180?random=4', stars: '★★★★☆', reviews: '980', desc: 'Compact smart speaker with powerful bass and voice-assistant support.' },
  { id: 'd2', name: 'Wireless Earbuds Pro', price: 49.99, img: 'https://picsum.photos/180/180?random=5', stars: '★★★★½', reviews: '1,450', desc: 'True wireless earbuds with 30-hour battery life and active noise cancellation.' },
  { id: 'd3', name: 'Bluetooth Speaker 360°', price: 29.99, img: 'https://picsum.photos/180/180?random=6', stars: '★★★★☆', reviews: '762', desc: '360-degree surround sound speaker, waterproof design for indoor/outdoor use.' },
  { id: 'd4', name: 'Kindle Leather Cover', price: 9.99, img: 'https://picsum.photos/180/180?random=7', stars: '★★★★☆', reviews: '2,301', desc: 'Premium leather cover for Kindle Paperwhite with auto wake/sleep feature.' },
  { id: 'd5', name: 'Amazon Gift Card $25', price: 25.00, img: 'https://picsum.photos/180/180?random=8', stars: '★★★★★', reviews: '40,000', desc: 'Give the gift of choice with an Amazon gift card, redeemable across millions of products.' },
  { id: 'd6', name: 'USB-C Fast Charger 65W', price: 14.99, img: 'https://picsum.photos/180/180?random=30', stars: '★★★★½', reviews: '5,670', desc: '65W GaN USB-C fast charger compatible with MacBook, iPad, phones, and more.' },
];

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id) ?? null;
}

/* ============================================================
   Cart State
   ============================================================ */
const cart = {
  items: [],   // { id, name, price, img, qty }
  get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  get subtotal() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },

  add(id) {
    const p = getProduct(id);
    if (!p) return;
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ id: p.id, name: p.name, price: p.price, img: p.img, qty: 1 });
    }
    this._sync();
    showToast(`🛒 Added "${p.name}" to cart`);
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this._sync();
  },

  changeQty(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.items = this.items.filter(i => i.id !== id);
    this._sync();
  },

  clear() {
    this.items = [];
    this._sync();
  },

  _sync() {
    this._updateBadge();
    renderCartDrawer();
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
   Cart Drawer
   ============================================================ */
function openCartDrawer() {
  $('#cart-drawer')?.classList.add('open');
  $('#cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  $('#cart-drawer')?.classList.remove('open');
  $('#cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  const body = $('#cart-drawer-body');
  const emptyMsg = $('#cart-empty');
  const subtotalEl = $('#cart-subtotal');
  const drawerCount = $('#drawer-count');
  const footer = $('#cart-drawer-footer');
  if (!body) return;

  if (drawerCount) drawerCount.textContent = `(${cart.count} item${cart.count !== 1 ? 's' : ''})`;
  if (subtotalEl) subtotalEl.textContent = `$${cart.subtotal.toFixed(2)}`;

  // Remove old rows
  $$('.cart-item', body).forEach(el => el.remove());

  if (cart.items.length === 0) {
    if (emptyMsg) emptyMsg.style.display = '';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (footer) footer.style.display = '';

  cart.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img class="cart-item-img" src="${item.img}" alt="${item.name}" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${item.name}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    body.appendChild(el);
  });
}

function initCartDrawer() {
  $('#cart-link')?.addEventListener('click', e => {
    e.preventDefault();
    openCartDrawer();
  });

  $('#cart-close')?.addEventListener('click', closeCartDrawer);
  $('#cart-overlay')?.addEventListener('click', closeCartDrawer);

  $('#cart-drawer-body')?.addEventListener('click', e => {
    const qtyBtn = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.cart-item-remove');
    if (qtyBtn) {
      const delta = qtyBtn.dataset.action === 'inc' ? 1 : -1;
      cart.changeQty(qtyBtn.dataset.id, delta);
    }
    if (removeBtn) cart.remove(removeBtn.dataset.id);
  });

  $('#clear-cart-btn')?.addEventListener('click', () => {
    if (confirm('Clear all items from cart?')) cart.clear();
  });

  $('#checkout-btn')?.addEventListener('click', () => {
    showToast('🎉 Order placed! (Demo mode)');
    cart.clear();
    closeCartDrawer();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCartDrawer(); closeQuickView(); }
  });

  renderCartDrawer();
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

    cart.add(card.dataset.id);

    const original = btn.textContent;
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1800);
  });
}

/* ============================================================
   Wishlist (localStorage)
   ============================================================ */
function initWishlist() {
  const KEY = 'wishlist';
  let wishlist = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));

  function save() { localStorage.setItem(KEY, JSON.stringify([...wishlist])); }

  function applyWishlisted(btn, active) {
    const icon = btn.querySelector('i');
    if (!icon) return;
    if (active) {
      btn.classList.add('active');
      icon.classList.replace('fa-regular', 'fa-solid');
    } else {
      btn.classList.remove('active');
      icon.classList.replace('fa-solid', 'fa-regular');
    }
  }

  // Restore saved wishlist on load
  $$('.wishlist-btn').forEach(btn => {
    if (wishlist.has(btn.dataset.id)) applyWishlisted(btn, true);
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.id;
    if (wishlist.has(id)) {
      wishlist.delete(id);
      applyWishlisted(btn, false);
      showToast('💔 Removed from wishlist');
    } else {
      wishlist.add(id);
      applyWishlisted(btn, true);
      showToast('❤️ Saved to wishlist!');
    }
    save();
  });
}

/* ============================================================
   Quick-View Modal
   ============================================================ */
function openQuickView(id) {
  const p = getProduct(id);
  if (!p) return;

  const img = $('#modal-img');
  const name = $('#modal-name');
  const stars = $('#modal-stars');
  const desc = $('#modal-desc');
  const price = $('#modal-price');
  const atc = $('#modal-atc');

  if (img) { img.src = p.img; img.alt = p.name; }
  if (name) name.textContent = p.name;
  if (stars) stars.textContent = `${p.stars} (${p.reviews} reviews)`;
  if (desc) desc.textContent = p.desc;
  if (price) price.textContent = `$${p.price.toFixed(2)}`;
  if (atc) atc.dataset.id = id;

  $('#modal-overlay')?.classList.add('open');
  $('#quick-view-modal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  $('#modal-overlay')?.classList.remove('open');
  $('#quick-view-modal')?.classList.remove('open');
  if (!$('#cart-drawer')?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function initQuickView() {
  document.addEventListener('click', e => {
    const thumb = e.target.closest('.product-thumb');
    if (thumb) {
      const card = thumb.closest('[data-id]');
      if (card) openQuickView(card.dataset.id);
    }
  });
  $('#modal-close')?.addEventListener('click', closeQuickView);
  $('#modal-overlay')?.addEventListener('click', closeQuickView);
}

/* ============================================================
   Search Autocomplete
   ============================================================ */
function initSearch() {
  const input = $('#search-input');
  const btn = $('#search-btn');
  const dropdown = $('#search-dropdown');
  if (!input || !dropdown) return;

  let activeIdx = -1;

  function getSuggestions(q) {
    if (!q.trim()) return [];
    return PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  }

  function renderDropdown(suggestions) {
    dropdown.innerHTML = '';
    activeIdx = -1;
    if (!suggestions.length) { dropdown.classList.remove('open'); return; }
    suggestions.forEach(p => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.innerHTML = `<i class="fa-solid fa-magnifying-glass suggestion-icon"></i> ${p.name}`;
      li.addEventListener('mousedown', () => {
        input.value = p.name;
        dropdown.classList.remove('open');
        doFilter(p.name);
      });
      dropdown.appendChild(li);
    });
    dropdown.classList.add('open');
  }

  function doFilter(q) {
    const query = q.trim().toLowerCase();
    $$('.product-card, .deal-card').forEach(card => {
      const name = (card.dataset.name ?? '').toLowerCase();
      const match = !query || name.includes(query);
      card.style.opacity = match ? '1' : '0.3';
      card.style.transform = (match && query) ? 'scale(1.02)' : '';
    });
  }

  input.addEventListener('input', () => {
    renderDropdown(getSuggestions(input.value));
    doFilter(input.value);
  });

  input.addEventListener('keydown', e => {
    const items = $$('li', dropdown);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      items.forEach((li, i) => li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      items.forEach((li, i) => li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false'));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && items[activeIdx]) {
        input.value = items[activeIdx].textContent.trim();
        dropdown.classList.remove('open');
        doFilter(input.value);
      } else {
        doFilter(input.value);
        dropdown.classList.remove('open');
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('open');
      input.value = '';
      doFilter('');
    }
  });

  btn?.addEventListener('click', () => { dropdown.classList.remove('open'); doFilter(input.value); });

  document.addEventListener('click', e => {
    if (!e.target.closest('.header-center')) dropdown.classList.remove('open');
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

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
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

  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.parentElement.addEventListener('mouseleave', startAuto);

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
  const cardWidth = 200 + 16;   // card flex-basis + gap
  let offset = 0;

  function getMax() {
    return Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));
  }

  function update() {
    const max = getMax();
    offset = Math.min(offset, max);
    track.style.transform = `translateX(-${offset * cardWidth}px)`;
    prevBtn.disabled = offset === 0;
    nextBtn.disabled = offset >= max;
    prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
  }

  prevBtn?.addEventListener('click', () => { if (offset > 0) { offset--; update(); } });
  nextBtn?.addEventListener('click', () => { if (offset < getMax()) { offset++; update(); } });

  update();
  window.addEventListener('resize', update);
}

/* ============================================================
   Back-to-Top Button
   ============================================================ */
function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   Keyboard Accessibility
   ============================================================ */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (document.activeElement?.closest('.hero-carousel')) {
      if (e.key === 'ArrowRight') $('#hero-next')?.click();
      if (e.key === 'ArrowLeft') $('#hero-prev')?.click();
    }
  });
}

/* ============================================================
   Scroll Reveal Animation
   ============================================================ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const items = $$('.product-card, .deal-card, .category-tile');
  items.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(24px)'; });

  const observer = new IntersectionObserver(entries => {
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
  initCartDrawer();
  initCartButtons();
  initWishlist();
  initQuickView();
  initSearch();
  initHeroCarousel();
  initDealsCarousel();
  initBackToTop();
  initKeyboard();
  initScrollReveal();
});
