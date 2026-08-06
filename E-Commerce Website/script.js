/* script.js – Amazon Clone interactive features (~30% milestone) */

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
    const removed = this.items.find(i => i.id === id);
    this.items = this.items.filter(i => i.id !== id);
    this._sync();
    if (removed) showUndoToast(removed);
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
   Cart localStorage Persistence
   ============================================================ */
function saveCart() {
  localStorage.setItem('cart_items', JSON.stringify(cart.items));
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('cart_items') ?? '[]');
    if (Array.isArray(saved)) {
      cart.items = saved;
      cart._updateBadge();
      renderCartDrawer();
    }
  } catch { /* ignore corrupt data */ }
}

// Patch cart methods to auto-save
const _origSync = cart._sync.bind(cart);
cart._sync = function() { _origSync(); saveCart(); };

/* ============================================================
   Toast Notification
   ============================================================ */
let toastCount = 0;
function showToast(msg) {
  const container = $('#toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = `toast-${++toastCount}`;
  toast.textContent = msg;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => {
      if (toast.parentElement) toast.remove();
    });
  }, 3000);
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
  // Animate rating bars with a slight delay so CSS transition fires
  setTimeout(animateRatingBars, 80);
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

  const loadReviewsBtn = $('#modal-load-reviews');
  loadReviewsBtn?.addEventListener('click', () => {
    closeQuickView();
    if (window.openFullReviews) window.openFullReviews();
  });
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
      li.innerHTML = `
        <img src="${p.img}" alt="" class="search-thumb" />
        <span class="search-match">${p.name}</span>
        <span class="search-cat">in All Departments</span>
      `;
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
   Recommended Carousel
   ============================================================ */
function initRecommendedCarousel() {
  const track = $('#rec-track');
  const prevBtn = $('#rec-prev');
  const nextBtn = $('#rec-next');
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
   Filter & Sort Bar
   ============================================================ */
function initFilterSort() {
  const grid     = $('#product-grid');
  const sortSel  = $('#sort-select');
  if (!grid) return;

  // Store original order
  const original = $$('.product-card', grid);

  // badge map: which badge class → filter key
  const BADGE_MAP = { 'badge-prime': 'prime', 'badge-deal': 'deal', 'badge-new': 'new' };

  function getBadge(card) {
    for (const [cls, key] of Object.entries(BADGE_MAP)) {
      if (card.querySelector('.' + cls)) return key;
    }
    return null;
  }

  // Rating stars → numeric score
  function ratingOf(card) {
    const stars = card.querySelector('.stars')?.textContent ?? '';
    return (stars.match(/★/g)?.length ?? 0) + (stars.includes('½') ? 0.5 : 0);
  }

  // Discount % from the badge text
  function discountOf(card) {
    const txt = card.querySelector('.discount-badge')?.textContent ?? '0';
    return parseInt(txt) || 0;
  }

  function applyFilterSort(filter, sortKey) {
    let cards = [...original];

    // Filter
    cards.forEach(c => {
      const badge = getBadge(c);
      const show  = filter === 'all' || badge === filter;
      c.classList.toggle('hidden', !show);
      c.style.opacity   = '';
      c.style.transform = '';
    });

    // Sort visible cards
    const visible = cards.filter(c => !c.classList.contains('hidden'));
    if (sortKey === 'price-asc') {
      visible.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
    } else if (sortKey === 'price-desc') {
      visible.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
    } else if (sortKey === 'rating') {
      visible.sort((a, b) => ratingOf(b) - ratingOf(a));
    } else if (sortKey === 'discount') {
      visible.sort((a, b) => discountOf(b) - discountOf(a));
    }

    // Re-append in sorted order
    visible.forEach(c => grid.appendChild(c));
  }

  let currentFilter = 'all';
  let currentSort   = 'default';

  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      applyFilterSort(currentFilter, currentSort);
    });
  });

  sortSel?.addEventListener('change', () => {
    currentSort = sortSel.value;
    applyFilterSort(currentFilter, currentSort);
  });
}

/* ============================================================
   Deal Countdown Timers
   ============================================================ */
function initDealCountdowns() {
  $$('.deal-card[data-ends]').forEach(card => {
    let seconds = parseInt(card.dataset.ends, 10);
    const display = card.querySelector('.countdown-time');
    if (!display || isNaN(seconds)) return;

    function tick() {
      if (seconds <= 0) {
        display.textContent = 'Expired';
        display.closest('.deal-countdown').style.background = '#f3f4f6';
        display.closest('.deal-countdown').style.color = '#9ca3af';
        return;
      }
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      display.textContent = `${h}:${m}:${s}`;
      seconds--;
    }

    tick();
    setInterval(tick, 1000);
  });
}

/* ============================================================
   Recently Viewed
   ============================================================ */
function initRecentlyViewed() {
  const KEY      = 'recently_viewed';
  const section  = $('#recently-viewed-section');
  const gridEl   = $('#recently-viewed-grid');
  const clearBtn = $('#clear-rv-btn');
  if (!section || !gridEl) return;

  let history = [];
  try { history = JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { history = []; }

  function saveHistory() {
    localStorage.setItem(KEY, JSON.stringify(history));
  }

  function renderHistory() {
    gridEl.innerHTML = '';
    if (history.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';
    history.forEach(id => {
      const p = getProduct(id);
      if (!p) return;
      const card = document.createElement('div');
      card.className = 'rv-card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <div class="rv-card-body">
          <div class="rv-card-name">${p.name}</div>
          <div class="rv-card-price">$${p.price.toFixed(2)}</div>
        </div>
      `;
      card.addEventListener('click', () => openQuickView(p.id));
      gridEl.appendChild(card);
    });
  }

  // Track views: hook into openQuickView via product thumbnail clicks
  document.addEventListener('click', e => {
    const thumb = e.target.closest('.product-thumb');
    if (!thumb) return;
    const card = thumb.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    history = history.filter(i => i !== id);
    history.unshift(id);
    if (history.length > 8) history = history.slice(0, 8);
    saveHistory();
    renderHistory();
  });

  clearBtn?.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  renderHistory();
}

/* ============================================================
   Promo Code
   ============================================================ */
const PROMO_CODES = {
  'SAVE10':  { type: 'percent', value: 10,   label: '10% off applied! 🎉' },
  'SAVE20':  { type: 'percent', value: 20,   label: '20% off applied! 🎉' },
  'FLAT5':   { type: 'flat',    value: 5,    label: '$5 off applied! 🎉' },
  'PRIME':   { type: 'percent', value: 15,   label: 'Prime 15% off applied! 🎉' },
};

let activePromo = null;

function applyPromoToDrawer() {
  const subtotalEl   = $('#cart-subtotal');
  const savingsRow   = $('#cart-savings');
  const savingsEl    = $('#savings-amount');
  if (!subtotalEl) return;

  const rawTotal = cart.subtotal;
  let discount   = 0;

  if (activePromo) {
    if (activePromo.type === 'percent') {
      discount = rawTotal * (activePromo.value / 100);
    } else {
      discount = Math.min(activePromo.value, rawTotal);
    }
  }

  const finalTotal = Math.max(0, rawTotal - discount);
  subtotalEl.textContent = `$${finalTotal.toFixed(2)}`;

  if (discount > 0 && savingsRow && savingsEl) {
    savingsRow.style.display = '';
    savingsEl.textContent    = `-$${discount.toFixed(2)}`;
  } else if (savingsRow) {
    savingsRow.style.display = 'none';
  }
}

function initPromoCode() {
  const input    = $('#promo-input');
  const applyBtn = $('#promo-apply');
  const feedback = $('#promo-feedback');
  if (!input || !applyBtn) return;

  applyBtn.addEventListener('click', () => {
    const code = input.value.trim().toUpperCase();
    feedback.className = 'promo-feedback';
    if (!code) {
      feedback.textContent = 'Please enter a promo code.';
      feedback.classList.add('error');
      return;
    }
    const promo = PROMO_CODES[code];
    if (promo) {
      activePromo            = promo;
      feedback.textContent   = promo.label;
      feedback.classList.add('success');
      input.value            = '';
      input.disabled         = true;
      applyBtn.disabled      = true;
      applyBtn.textContent   = '✓';
      applyPromoToDrawer();
    } else {
      activePromo          = null;
      feedback.textContent = 'Invalid code. Try SAVE10 or PRIME.';
      feedback.classList.add('error');
      applyPromoToDrawer();
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyBtn.click();
  });
}

// Patch renderCartDrawer to also run promo recalc
const _origRenderCart = renderCartDrawer;
function renderCartDrawer() {
  _origRenderCart();
  applyPromoToDrawer();
}

/* ============================================================
   Newsletter Form
   ============================================================ */
function initNewsletter() {
  const form   = $('#newsletter-form');
  const input  = $('#newsletter-email');
  const btn    = $('#newsletter-submit');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = input?.value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRe.test(email)) {
      input.style.borderColor = '#e53935';
      input.focus();
      return;
    }

    input.style.borderColor = '';
    btn.textContent = '✓ Subscribed!';
    btn.classList.add('subscribed');
    btn.disabled = true;
    input.disabled = true;
    showToast('📧 Thanks for subscribing!');
  });

  input?.addEventListener('input', () => {
    input.style.borderColor = '';
  });
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadCart();            // restore persisted cart first
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
  initFilterSort();      // new
  initDealCountdowns();  // new
  initRecentlyViewed();  // new
  initPromoCode();       // new
  initNewsletter();      // new
});

/* ============================================================
   Sticky Shrinking Header
   ============================================================ */
function initStickyHeader() {
  const header = $('#site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ============================================================
   Mobile Navigation Drawer
   ============================================================ */
function initMobileNav() {
  const hamburger = $('#hamburger-btn');
  const mobileNav = $('#mobile-nav');
  const overlay   = $('#mobile-nav-overlay');
  const closeBtn  = $('#mobile-nav-close');
  if (!hamburger || !mobileNav) return;

  function openNav() {
    mobileNav.classList.add('open');
    overlay?.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });

  closeBtn?.addEventListener('click', closeNav);
  overlay?.addEventListener('click', closeNav);

  // Close on any mobile-nav link click
  $$('.mobile-nav-link', mobileNav).forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeNav();
  });
}

/* ============================================================
   Wishlist Header Badge
   ============================================================ */
function updateWishlistBadge(count) {
  const badge = $('#wishlist-count');
  if (!badge) return;
  badge.textContent = count;
  badge.setAttribute('aria-label', `${count} item${count !== 1 ? 's' : ''} in wishlist`);
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 300);
}

/* patch initWishlist to also update header badge */
const _patchWishlistBadge = initWishlist;
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

  $$('.wishlist-btn').forEach(btn => {
    if (wishlist.has(btn.dataset.id)) applyWishlisted(btn, true);
  });
  updateWishlistBadge(wishlist.size);

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
    updateWishlistBadge(wishlist.size);
  });
}

/* ============================================================
   Card Qty Stepper
   ============================================================ */
function initCardQtyStepper() {
  // Read qty from the display next to the clicked Add-to-Cart button
  // Override add behavior: use card's qty display value
  document.addEventListener('click', e => {
    // Handle card-qty-btn clicks
    const qtyBtn = e.target.closest('.card-qty-btn');
    if (qtyBtn) {
      const row     = qtyBtn.closest('.card-qty-row');
      const display = row?.querySelector('.card-qty-display');
      if (!display) return;
      let val = parseInt(display.textContent) || 1;
      if (qtyBtn.dataset.action === 'inc') val = Math.min(val + 1, 10);
      if (qtyBtn.dataset.action === 'dec') val = Math.max(val - 1, 1);
      display.textContent = val;
    }
  });
}

// Override ATC to respect the card qty stepper
function initCartButtonsWithQty() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn || btn.id === 'modal-atc') return;  // modal handled separately
    const card = btn.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;

    // Get qty from stepper if present
    const qtyDisplay = card.querySelector('.card-qty-display');
    const qty = qtyDisplay ? (parseInt(qtyDisplay.textContent) || 1) : 1;

    for (let i = 0; i < qty; i++) cart.add(id);
    if (qty > 1) showToast(`🛒 Added ${qty}× ${getProduct(id)?.name ?? ''} to cart`);

    // Reset stepper to 1
    if (qtyDisplay) qtyDisplay.textContent = '1';

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
   Undo Remove Toast
   ============================================================ */
let undoTimer  = null;
let undoItem   = null;

function injectUndoToast() {
  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.id = 'undo-toast';
  el.innerHTML = `
    <span id="undo-msg">Item removed</span>
    <button class="undo-toast-btn" id="undo-btn">Undo</button>
  `;
  document.body.appendChild(el);

  $('#undo-btn')?.addEventListener('click', () => {
    if (undoItem) {
      // Re-add at original qty
      const existing = cart.items.find(i => i.id === undoItem.id);
      if (existing) {
        existing.qty += undoItem.qty;
        cart._sync();
      } else {
        cart.items.push({ ...undoItem });
        cart._sync();
      }
      showToast(`↔️ "${undoItem.name}" restored`);
    }
    hideUndoToast();
  });
}

function showUndoToast(item) {
  undoItem = { ...item };
  const toast  = $('#undo-toast');
  const msg    = $('#undo-msg');
  if (!toast) return;
  if (msg) msg.textContent = `“${item.name}” removed`;
  toast.classList.add('show');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndoToast, 5000);
}

function hideUndoToast() {
  $('#undo-toast')?.classList.remove('show');
  undoItem = null;
}

/* ============================================================
   Rating Bars Animation (triggers on quick-view open)
   ============================================================ */
function animateRatingBars() {
  const bars = $$('.rb-bar', $('#quick-view-modal'));
  // Force a reflow, then restore the target width
  bars.forEach(bar => {
    const target = bar.style.width;
    bar.style.width = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = target;
      });
    });
  });
}

/* ============================================================
   Auth & Checkout Modals (Completion Phase)
   ============================================================ */
function initAuthModal() {
  const authLink = $('#signin-link');
  const authModal = $('#auth-modal');
  const authOverlay = $('#auth-overlay');
  const authClose = $('#auth-close');
  const authForm = $('#auth-form');

  function openAuth() {
    authModal?.classList.add('open');
    authOverlay?.classList.add('open');
  }
  function closeAuth() {
    authModal?.classList.remove('open');
    authOverlay?.classList.remove('open');
  }

  authLink?.addEventListener('click', e => { e.preventDefault(); openAuth(); });
  authClose?.addEventListener('click', closeAuth);
  authOverlay?.addEventListener('click', closeAuth);

  authForm?.addEventListener('submit', e => {
    e.preventDefault();
    authLink.innerHTML = 'Hello, User<span class="nav-sub">Account &amp; Lists</span>';
    showToast('🎉 Successfully signed in!');
    closeAuth();
  });
}

function initCheckoutModal() {
  const checkoutBtn = $('#checkout-btn');
  const checkoutModal = $('#checkout-modal');
  const checkoutOverlay = $('#checkout-overlay');
  const checkoutClose = $('#checkout-close');

  function openCheckout() {
    if (cart.count === 0) { showToast('🛒 Your cart is empty!'); return; }
    checkoutModal?.classList.add('open');
    checkoutOverlay?.classList.add('open');
    closeCartDrawer();
  }
  function closeCheckout() {
    checkoutModal?.classList.remove('open');
    checkoutOverlay?.classList.remove('open');
  }

  checkoutBtn?.addEventListener('click', e => { e.preventDefault(); openCheckout(); });
  checkoutClose?.addEventListener('click', closeCheckout);
  checkoutOverlay?.addEventListener('click', closeCheckout);

  const checkoutForm = $('#checkout-form');
  checkoutForm?.addEventListener('submit', e => {
    e.preventDefault();
    if (!checkoutForm.checkValidity()) {
      showToast('⚠️ Please fill out all fields correctly.');
      return;
    }
    closeCheckout();
    $('#order-overlay')?.classList.add('open');
    $('#order-modal')?.classList.add('open');
    $('#order-items-count').textContent = `${cart.count} items`;
    $('#order-total-display').textContent = `$${cart.subtotal.toFixed(2)}`;
    cart.clear();
    closeCartDrawer();
  });
  
  const promoBtn = $('#chk-promo-btn');
  const promoInput = $('#chk-promo');
  promoBtn?.addEventListener('click', () => {
    if (promoInput && promoInput.value.trim() !== '') {
      showToast(`🎟️ Promo code '${promoInput.value}' applied successfully!`);
      promoInput.value = '';
    } else {
      showToast('⚠️ Please enter a valid promo code.');
    }
  });

  // Update original order modal handlers
  $('#order-continue')?.addEventListener('click', () => {
    $('#order-overlay')?.classList.remove('open');
    $('#order-modal')?.classList.remove('open');
  });
}

function initDarkMode() {
  const toggleInput = $('#dark-mode-toggle');
  if (!toggleInput) return;

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    toggleInput.checked = true;
  }

  toggleInput.addEventListener('change', () => {
    if (toggleInput.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });
}

function initOrdersModal() {
  const ordersLink = $('#orders-link');
  const ordersModal = $('#orders-list-modal');
  const ordersOverlay = $('#orders-overlay');
  const ordersClose = $('#orders-close');
  const startShoppingBtn = $('#start-shopping-btn');

  function openOrders() {
    ordersModal?.classList.add('open');
    ordersOverlay?.classList.add('open');
  }
  function closeOrders() {
    ordersModal?.classList.remove('open');
    ordersOverlay?.classList.remove('open');
  }

  ordersLink?.addEventListener('click', e => { e.preventDefault(); openOrders(); });
  ordersClose?.addEventListener('click', closeOrders);
  ordersOverlay?.addEventListener('click', closeOrders);
  startShoppingBtn?.addEventListener('click', () => {
    closeOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initAddressModal() {
  const addressLink = $('#nav-address');
  const addressModal = $('#address-modal');
  const addressOverlay = $('#address-overlay');
  const addressClose = $('#address-close');

  function openAddress() {
    addressModal?.classList.add('open');
    addressOverlay?.classList.add('open');
  }
  function closeAddress() {
    addressModal?.classList.remove('open');
    addressOverlay?.classList.remove('open');
  }

  addressLink?.addEventListener('click', e => { e.preventDefault(); openAddress(); });
  addressClose?.addEventListener('click', closeAddress);
  addressOverlay?.addEventListener('click', closeAddress);

  const autoDetectBtn = $('#auto-detect-btn');
  const addressSelect = $('#address-select');
  autoDetectBtn?.addEventListener('click', () => {
    showToast('📍 Detecting your location...');
    setTimeout(() => {
      // simulate location detect to US
      if (addressSelect) addressSelect.value = 'US';
      showToast('✅ Location set to United States.');
      setTimeout(closeAddress, 1000);
    }, 1500);
  });
}

function initLangModal() {
  const langLink = $('#nav-lang');
  const langModal = $('#lang-modal');
  const langOverlay = $('#lang-overlay');
  const langClose = $('#lang-close');
  const langSaveBtn = $('#lang-save-btn');

  function openLang() {
    langModal?.classList.add('open');
    langOverlay?.classList.add('open');
  }
  function closeLang() {
    langModal?.classList.remove('open');
    langOverlay?.classList.remove('open');
  }

  langLink?.addEventListener('click', e => { e.preventDefault(); openLang(); });
  langClose?.addEventListener('click', closeLang);
  langOverlay?.addEventListener('click', closeLang);

  langSaveBtn?.addEventListener('click', () => {
    const selected = document.querySelector('input[name="lang"]:checked').value;
    langLink.innerHTML = `<img src="https://flagcdn.com/w20/${selected === 'en' ? 'us' : (selected === 'es' ? 'es' : (selected === 'zh' ? 'cn' : (selected === 'de' ? 'de' : 'pt')))}.png" alt="${selected} flag" style="width:16px; margin-right:4px;"> <b>${selected.toUpperCase()}</b> <i class="fa-solid fa-caret-down"></i>`;
    showToast('🌐 Language updated successfully!');
    closeLang();
  });
}

function initCSModal() {
  const csLink = $('#nav-cs');
  const csModal = $('#cs-modal');
  const csOverlay = $('#cs-overlay');
  const csClose = $('#cs-close');
  const csOptions = $$('.cs-option-btn');

  function openCS() {
    csModal?.classList.add('open');
    csOverlay?.classList.add('open');
  }
  function closeCS() {
    csModal?.classList.remove('open');
    csOverlay?.classList.remove('open');
  }

  csLink?.addEventListener('click', e => { e.preventDefault(); openCS(); });
  csClose?.addEventListener('click', closeCS);
  csOverlay?.addEventListener('click', closeCS);
  csOptions.forEach(btn => btn.addEventListener('click', () => {
    showToast('📞 Connecting you to an agent...');
    closeCS();
  }));
}

function initSellModal() {
  const sellLink = $('#nav-sell');
  const sellModal = $('#sell-modal');
  const sellOverlay = $('#sell-overlay');
  const sellClose = $('#sell-close');

  function openSell() {
    sellModal?.classList.add('open');
    sellOverlay?.classList.add('open');
  }
  function closeSell() {
    sellModal?.classList.remove('open');
    sellOverlay?.classList.remove('open');
  }

  sellLink?.addEventListener('click', e => { e.preventDefault(); openSell(); });
  sellClose?.addEventListener('click', closeSell);
  sellOverlay?.addEventListener('click', closeSell);
}

function initGCModal() {
  const gcLink = $('#nav-gc');
  const gcModal = $('#gc-modal');
  const gcOverlay = $('#gc-overlay');
  const gcClose = $('#gc-close');

  function openGC() {
    gcModal?.classList.add('open');
    gcOverlay?.classList.add('open');
  }
  function closeGC() {
    gcModal?.classList.remove('open');
    gcOverlay?.classList.remove('open');
  }

  gcLink?.addEventListener('click', e => { e.preventDefault(); openGC(); });
  gcClose?.addEventListener('click', closeGC);
  gcOverlay?.addEventListener('click', closeGC);
}

function initRegModal() {
  const regLink = $('#nav-registry');
  const regModal = $('#reg-modal');
  const regOverlay = $('#reg-overlay');
  const regClose = $('#reg-close');

  function openReg() {
    regModal?.classList.add('open');
    regOverlay?.classList.add('open');
  }
  function closeReg() {
    regModal?.classList.remove('open');
    regOverlay?.classList.remove('open');
  }

  regLink?.addEventListener('click', e => { e.preventDefault(); openReg(); });
  regClose?.addEventListener('click', closeReg);
  regOverlay?.addEventListener('click', closeReg);
}

function initHistoryModal() {
  const historyLink = $('#nav-history');
  const historyModal = $('#history-modal');
  const historyOverlay = $('#history-overlay');
  const historyClose = $('#history-close');

  function openHistory() {
    historyModal?.classList.add('open');
    historyOverlay?.classList.add('open');
  }
  function closeHistory() {
    historyModal?.classList.remove('open');
    historyOverlay?.classList.remove('open');
  }

  historyLink?.addEventListener('click', e => { e.preventDefault(); openHistory(); });
  historyClose?.addEventListener('click', closeHistory);
  historyOverlay?.addEventListener('click', closeHistory);
}

function initWishlistModal() {
  const wlLink = $('#wishlist-header-btn');
  const wlModal = $('#wishlist-modal');
  const wlOverlay = $('#wishlist-overlay');
  const wlClose = $('#wishlist-close');

  function openWL() {
    wlModal?.classList.add('open');
    wlOverlay?.classList.add('open');
  }
  function closeWL() {
    wlModal?.classList.remove('open');
    wlOverlay?.classList.remove('open');
  }

  wlLink?.addEventListener('click', e => { e.preventDefault(); openWL(); });
  wlClose?.addEventListener('click', closeWL);
  wlOverlay?.addEventListener('click', closeWL);
}

function initNewsletter() {
  const form = $('#newsletter-form');
  const input = $('#newsletter-email');
  
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input && input.checkValidity() && input.value.trim() !== '') {
      showToast('✉️ Thanks for subscribing! You will receive our next newsletter.');
      input.value = '';
    } else {
      showToast('⚠️ Please enter a valid email address.');
    }
  });
}

/* ============================================================
   Product Reviews Modal
   ============================================================ */
function initReviewsModal() {
  const reviewsModal = $('#reviews-modal');
  const reviewsOverlay = $('#reviews-overlay');
  const reviewsClose = $('#reviews-close');
  const list = $('#full-reviews-list');

  function openReviews() {
    reviewsModal?.classList.add('open');
    reviewsOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Inject mock reviews
    if (list && list.children.length === 0) {
      const mockReviews = [
        { stars: '★★★★★', title: 'Great product, definitely recommend!', author: 'Verified Purchaser', text: 'This met all my expectations and then some. The quality is fantastic for the price.' },
        { stars: '★★★★☆', title: 'Good value', author: 'Amazon Customer', text: 'Works well, but packaging was slightly damaged.' },
        { stars: '★★★★★', title: 'Five Stars', author: 'Jane D.', text: 'Absolutely love this! Bought it for my husband and he uses it every day.' },
        { stars: '★★★☆☆', title: 'It is okay', author: 'Mike R.', text: 'Does what it says, but feels a bit cheap.' },
        { stars: '★★★★★', title: 'Best purchase of the year', author: 'Sarah W.', text: 'I have tried many alternatives but this one is the best by far.' }
      ];
      mockReviews.forEach(r => {
        const div = document.createElement('div');
        div.className = 'review-item-full';
        div.innerHTML = `
          <div class="stars">${r.stars}</div>
          <div class="title">${r.title}</div>
          <div class="author">${r.author}</div>
          <div class="text">${r.text}</div>
        `;
        list.appendChild(div);
      });
    }
  }

  function closeReviews() {
    reviewsModal?.classList.remove('open');
    reviewsOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  reviewsClose?.addEventListener('click', closeReviews);
  reviewsOverlay?.addEventListener('click', closeReviews);

  // Expose for Quick View to call
  window.openFullReviews = openReviews;
}

/* ============================================================
   Profile Modal
   ============================================================ */
function initProfileModal() {
  const profileLink = $('#nav-profile');
  const profileModal = $('#profile-modal');
  const profileOverlay = $('#profile-overlay');
  const profileClose = $('#profile-close');
  
  function openProfile() {
    profileModal?.classList.add('open');
    profileOverlay?.classList.add('open');
  }
  function closeProfile() {
    profileModal?.classList.remove('open');
    profileOverlay?.classList.remove('open');
  }
  
  profileLink?.addEventListener('click', e => { e.preventDefault(); openProfile(); });
  profileClose?.addEventListener('click', closeProfile);
  profileOverlay?.addEventListener('click', closeProfile);
  
  // Intercept profile links
  $$('.profile-links a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showToast(`Redirecting to ${link.textContent.trim()}...`);
      closeProfile();
    });
  });
}

/* ============================================================
   Top Promo Banner
   ============================================================ */
function initPromoBanner() {
  const banner = $('#top-promo-banner');
  const closeBtn = $('#promo-close');
  if (!banner || !closeBtn) return;
  
  if (sessionStorage.getItem('promoDismissed')) {
    banner.classList.add('hidden');
    return;
  }
  
  closeBtn.addEventListener('click', () => {
    banner.classList.add('hidden');
    sessionStorage.setItem('promoDismissed', 'true');
  });
}

/* ============================================================
   About Us Modal
   ============================================================ */
function initAboutModal() {
  const aboutLink = $('#footer-about-link');
  const aboutModal = $('#about-modal');
  const aboutOverlay = $('#about-overlay');
  const aboutClose = $('#about-close');
  const aboutOk = $('#about-ok');
  
  if (!aboutLink || !aboutModal) return;
  
  function openAbout() {
    aboutModal.classList.add('open');
    aboutOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeAbout() {
    aboutModal.classList.remove('open');
    aboutOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  
  aboutLink.addEventListener('click', e => { e.preventDefault(); openAbout(); });
  aboutClose?.addEventListener('click', closeAbout);
  aboutOk?.addEventListener('click', closeAbout);
  aboutOverlay?.addEventListener('click', closeAbout);
}

/* ============================================================
   Sidebar Filters (Sprint 5)
   ============================================================ */
function initSidebarFilters() {
  const filterLinks = $$('.filter-list a');
  filterLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      // Remove active state from horizontal buttons for visual sync
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      $('#filter-all')?.classList.add('active'); // fallback

      const rating = link.dataset.rating;
      const price = link.dataset.price;
      let msg = 'Filtering by: ';
      if (rating) msg += rating + ' Stars & Up';
      else if (price) msg += 'Price ' + price.replace('-', ' ');
      
      showToast(msg);
      
      // In a real app, you'd filter the grid items here.
      // We will just shuffle or dim items to simulate filtering
      $$('.product-card').forEach(card => {
        card.style.opacity = '0.5';
        setTimeout(() => { card.style.opacity = '1'; }, 300);
      });
    });
  });
}

/* ============================================================
   Pagination Logic (Sprint 5)
   ============================================================ */
function initPagination() {
  const pageBtns = $$('.pagination-list .page-btn');
  const prevBtn = $('.page-prev');
  const nextBtn = $('.page-next');
  
  if (!pageBtns.length) return;
  
  let currentPage = 1;
  const maxPage = 10;
  
  function updatePagination() {
    pageBtns.forEach(btn => btn.classList.remove('active'));
    
    // Find the number button that matches currentPage
    const activeBtn = Array.from(pageBtns).find(b => b.textContent == currentPage);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Disable prev/next if at boundaries
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === maxPage);
  }
  
  pageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('page-prev')) {
        if (currentPage > 1) currentPage--;
      } else if (btn.classList.contains('page-next')) {
        if (currentPage < maxPage) currentPage++;
      } else {
        const pageNum = parseInt(btn.textContent);
        if (!isNaN(pageNum)) currentPage = pageNum;
      }
      
      updatePagination();
      showToast(`Navigating to Page ${currentPage}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   Cookie Consent Banner (Sprint 5)
   ============================================================ */
function initCookieBanner() {
  const banner = $('#cookie-banner');
  const acceptBtn = $('#cookie-accept');
  const declineBtn = $('#cookie-decline');
  
  if (!banner || !acceptBtn || !declineBtn) return;
  
  const cookiePref = localStorage.getItem('cookieConsent');
  if (!cookiePref) {
    // Show banner after a short delay
    setTimeout(() => {
      banner.classList.add('show');
    }, 1000);
  }
  
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.classList.remove('show');
  });
  
  declineBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    banner.classList.remove('show');
  });
}

/* ============================================================
   Live Chat Widget (Sprint 5)
   ============================================================ */
function initLiveChat() {
  const chatToggle = $('#chat-toggle');
  const chatWindow = $('#chat-window');
  const chatClose = $('#chat-close');
  const chatInput = $('#chat-input');
  const chatSend = $('#chat-send');
  const chatBody = $('#chat-body');
  
  if (!chatToggle || !chatWindow) return;
  
  chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
  });
  
  chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });
  
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user-msg';
    userMsg.textContent = text;
    chatBody.appendChild(userMsg);
    
    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Simulate bot response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg bot-msg';
      botMsg.textContent = 'Thanks for reaching out! A representative will be with you shortly.';
      chatBody.appendChild(botMsg);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
  }
  
  chatSend?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  injectUndoToast();     // inject before other inits
  loadCart();
  initCartDrawer();
  initCartButtons();     // kept as base (modal ATC)
  initCartButtonsWithQty(); // new: cards with stepper
  initWishlist();        // overridden above to include badge
  initQuickView();
  initSearch();
  initHeroCarousel();
  initDealsCarousel();
  initBackToTop();
  initKeyboard();
  initScrollReveal();
  initFilterSort();
  initDealCountdowns();
  initRecentlyViewed();
  initPromoCode();
  initNewsletter();
  initStickyHeader();    // new
  initMobileNav();       // new
  initCardQtyStepper();  // new
  initAuthModal();       // completion phase
  initCheckoutModal();   // completion phase
  initDarkMode();        // completion phase
  initOrdersModal();     // completion phase
  initAddressModal();    // completion phase
  initLangModal();       // completion phase
  initCSModal();         // completion phase
  initSellModal();       // completion phase
  initGCModal();         // completion phase
  initRegModal();        // completion phase
  initHistoryModal();    // completion phase
  initWishlistModal();   // completion phase
  initReviewsModal();    // Sprint 4
  initProfileModal();    // Sprint 4
  initRecommendedCarousel(); // Sprint 4
  initPromoBanner();     // Sprint 4
  initAboutModal();      // Sprint 4
  initSidebarFilters();  // Sprint 5
  initPagination();      // Sprint 5
  initCookieBanner();    // Sprint 5
  initLiveChat();        // Sprint 5

  // Extended goal reached: 83 incremental commits running.
});
