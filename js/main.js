/* =====================================================================
   THE LAST DISK — логика сайта
   - карусель «Popular collections» (рендер из js/products.js, стрелки)
   - фильтры по жанру / формату и поиск
   - корзина (хранится в localStorage), оформление заказа
   - всплывающие окна, мобильное меню, уведомления
   Анимаций пока нет — только состояния и плавная прокрутка.
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var PRODUCTS = window.PRODUCTS || [];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var GENRES = { rock: 'Rock', pop: 'Pop', metal: 'Metall', 'hip-hop': 'Hip-hop', electronic: 'Electronic', rap: 'Rap', jazz: 'Jazz' };
  var FORMATS = { vinyl: 'Виниловые пластинки', cd: 'CD диски', dvd: 'DVD диски', accessories: 'Аксессуары' };
  var DEFAULT_POS = { x: 34, y: 52, w: 575 };

  function formatPrice(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function priceLabel(p) { return p.price === 0 ? 'FREE!' : formatPrice(p.price); }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------
     Уведомление внизу экрана
     ------------------------------------------------------------------ */
  var toastEl = $('[data-toast]');
  var toastTimer;
  function toast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }

  /* ------------------------------------------------------------------
     Корзина
     ------------------------------------------------------------------ */
  var CART_KEY = 'tld-cart';
  var cart = readCart();

  function readCart() {
    try {
      var data = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      Object.keys(data).forEach(function (id) { if (!byId[id] || !(data[id] > 0)) delete data[id]; });
      return data;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* приватный режим */ }
  }
  function cartCount() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }
  function cartTotal() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + byId[id].price * cart[id]; }, 0);
  }
  function setQty(id, qty) {
    if (qty > 0) cart[id] = qty; else delete cart[id];
    saveCart();
    updateCartUI();
  }
  function addToCart(id) {
    setQty(id, (cart[id] || 0) + 1);
    toast('«' + byId[id].title + '» в корзине');
  }

  function updateCartUI() {
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$('.card__btn').forEach(function (btn) {
      var inCart = !!cart[btn.dataset.id];
      btn.classList.toggle('is-added', inCart);
      btn.querySelector('.t').textContent = inCart ? 'В корзине' : 'В корзину';
      btn.setAttribute('aria-label', (inCart ? 'Открыть корзину: ' : 'Добавить в корзину: ') + byId[btn.dataset.id].title);
    });
    if (isOpen('cart')) renderCart();
  }

  var cartBody = $('[data-cart-body]');
  var cartView = 'list'; // list | checkout | done

  function renderCart() {
    if (!cartBody) return;
    var ids = Object.keys(cart);

    if (cartView === 'done') {
      cartBody.innerHTML =
        '<p>Спасибо! Заказ принят — мы свяжемся с вами, чтобы подтвердить детали.</p>' +
        '<button class="btn" type="button" data-modal-close>Продолжить покупки</button>';
      return;
    }

    if (!ids.length) {
      cartBody.innerHTML =
        '<p class="cart-empty">Корзина пока пустая.</p>' +
        '<a class="btn" href="#collections" data-modal-close>Перейти к альбомам</a>';
      return;
    }

    if (cartView === 'checkout') {
      cartBody.innerHTML =
        '<form class="form" data-form="checkout">' +
          '<label class="form__field"><span>Имя</span><input name="name" required autocomplete="name"></label>' +
          '<label class="form__field"><span>Телефон</span><input name="phone" type="tel" required autocomplete="tel" placeholder="+7"></label>' +
          '<label class="form__field"><span>Комментарий</span><textarea name="comment" rows="3"></textarea></label>' +
          '<div class="cart-total">Итого <b>' + formatPrice(cartTotal()) + ' ₽</b></div>' +
          '<div class="cart-actions">' +
            '<button class="btn" type="submit">Подтвердить заказ</button>' +
            '<button class="btn btn--ghost" type="button" data-cart-view="list">Назад</button>' +
          '</div>' +
        '</form>';
      return;
    }

    var items = ids.map(function (id) {
      var p = byId[id];
      return '<li class="cart-item">' +
        '<img src="' + p.img + '" alt="">' +
        '<div>' +
          '<div class="cart-item__title">' + escapeHTML(p.title) + '</div>' +
          '<div class="cart-item__artist">' + escapeHTML(p.artist) + '</div>' +
          '<div class="cart-item__price">' + priceLabel(p) + (p.price ? ' ₽' : '') + '</div>' +
        '</div>' +
        '<div class="cart-item__side">' +
          '<div class="qty">' +
            '<button type="button" data-qty="-1" data-id="' + id + '" aria-label="Меньше">−</button>' +
            '<span>' + cart[id] + '</span>' +
            '<button type="button" data-qty="1" data-id="' + id + '" aria-label="Больше">+</button>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" data-remove="' + id + '">Удалить</button>' +
        '</div>' +
      '</li>';
    }).join('');

    cartBody.innerHTML =
      '<ul class="cart-list">' + items + '</ul>' +
      '<div class="cart-total">Итого <b>' + formatPrice(cartTotal()) + ' ₽</b></div>' +
      '<div class="cart-actions"><button class="btn" type="button" data-cart-view="checkout">Оформить заказ</button></div>';
  }

  if (cartBody) {
    cartBody.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.qty) setQty(t.dataset.id, (cart[t.dataset.id] || 0) + Number(t.dataset.qty));
      if (t.dataset.remove) setQty(t.dataset.remove, 0);
      if (t.dataset.cartView) { cartView = t.dataset.cartView; renderCart(); focusFirst(cartBody); }
    });
    cartBody.addEventListener('submit', function (e) {
      if (!e.target.matches('[data-form="checkout"]')) return;
      e.preventDefault();
      // Здесь будет отправка заказа на сервер.
      cart = {};
      saveCart();
      cartView = 'done';
      updateCartUI();
      renderCart();
    });
  }

  /* ------------------------------------------------------------------
     Всплывающие окна
     ------------------------------------------------------------------ */
  var lastFocus = null;

  function isOpen(name) {
    var m = $('[data-modal="' + name + '"]');
    return m && !m.hidden;
  }
  function focusFirst(root) {
    var f = root.querySelector('input, textarea, button:not(.modal__close), a[href]') || root.querySelector('button');
    if (f) f.focus({ preventScroll: true });
  }
  function openModal(name) {
    var m = $('[data-modal="' + name + '"]');
    if (!m) return;
    closeAllModals(true);
    closeMenu();
    lastFocus = document.activeElement;
    if (name === 'cart') { cartView = 'list'; renderCart(); }
    m.hidden = false;
    document.body.classList.add('is-locked');
    focusFirst(m.querySelector('.modal__panel'));
  }
  function closeAllModals(silent) {
    var any = false;
    $$('[data-modal]').forEach(function (m) { if (!m.hidden) { m.hidden = true; any = true; } });
    document.body.classList.remove('is-locked');
    if (any && !silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllModals(); closeMenu(); }
    if (e.key === 'Tab') {
      var open = $$('[data-modal]').filter(function (m) { return !m.hidden; })[0];
      if (!open) return;
      var f = $$('a[href], button:not([disabled]), input, textarea', open).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  var loginForm = $('[data-form="login"]');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('[data-form-note]', loginForm);
      note.textContent = 'Личный кабинет заработает после подключения сервера.';
      note.hidden = false;
    });
  }

  /* ------------------------------------------------------------------
     Карусель + фильтры
     ------------------------------------------------------------------ */
  var track = $('[data-carousel-track]');
  var emptyEl = $('[data-carousel-empty]');
  var chip = $('[data-filter-chip]');
  var chipLabel = $('[data-filter-label]');
  var prevBtn = $('[data-carousel="prev"]');
  var nextBtn = $('[data-carousel="next"]');
  var currentFilter = null;

  function cardHTML(p) {
    var pos = p.pos || DEFAULT_POS;
    var multi = p.artist.indexOf('\n') !== -1;
    return '<article class="card" data-id="' + p.id + '">' +
      '<img class="card__img" src="' + p.img + '" alt="' + escapeHTML(p.title + ' — ' + p.artist.replace('\n', ' ')) + '"' +
        ' style="--x:' + pos.x + ';--y:' + pos.y + ';--w:' + pos.w + '" loading="lazy">' +
      '<h3 class="card__title t">' + escapeHTML(p.title) + '</h3>' +
      '<p class="card__artist t' + (multi ? ' is-multiline' : '') + '">' + escapeHTML(p.artist) + '</p>' +
      '<p class="card__price t">' + priceLabel(p) + '</p>' +
      '<button class="card__btn" type="button" data-id="' + p.id + '"><span class="t">В корзину</span></button>' +
    '</article>';
  }

  function matches(p, f) {
    if (!f) return true;
    if (f.type === 'genre') return p.genres.indexOf(f.value) !== -1;
    if (f.type === 'format') return p.formats.indexOf(f.value) !== -1;
    if (f.type === 'query') {
      var hay = [p.title, p.artist, p.genres.map(function (g) { return GENRES[g] + ' ' + g; }).join(' '),
        p.formats.map(function (x) { return FORMATS[x] + ' ' + x; }).join(' ')].join(' ').toLowerCase().replace(/\s+/g, ' ');
      return f.value.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }
    return true;
  }

  function renderCards() {
    if (!track) return;
    var list = PRODUCTS.filter(function (p) { return matches(p, currentFilter); });
    track.innerHTML = list.map(cardHTML).join('');
    track.scrollLeft = 0;
    if (emptyEl) emptyEl.hidden = list.length > 0;
    track.hidden = list.length === 0;
    if (chip) {
      chip.hidden = !currentFilter;
      if (currentFilter) chipLabel.textContent = currentFilter.label;
    }
    $$('.genre-btn').forEach(function (b) {
      b.classList.toggle('is-active', !!currentFilter && currentFilter.type === 'genre' && currentFilter.value === b.dataset.filterGenre);
    });
    updateCartUI();
    fitTitles();
    updateArrows();
  }

  function setFilter(f, scroll) {
    currentFilter = f;
    renderCards();
    if (scroll) scrollToSection('collections');
  }

  function scrollToSection(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // длинные названия уменьшаются, чтобы влезть в карточку
  function fitTitles() {
    var u = parseFloat(getComputedStyle(track).getPropertyValue('--u')) || 1;
    $$('.card__title', track).forEach(function (el) {
      el.style.fontSize = '';
      if (el.scrollWidth > el.clientWidth + 1) {
        var base = parseFloat(getComputedStyle(el).fontSize) / u;
        var ratio = el.clientWidth / el.scrollWidth;
        el.style.fontSize = 'calc(' + (base * ratio).toFixed(2) + ' * var(--u))';
      }
    });
  }

  function stepSize() {
    var card = $('.card', track);
    if (!card) return 0;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }
  // стрелки активны всегда (как в макете): с краю карусель перескакивает в начало/конец
  function updateArrows() {
    if (!track || !prevBtn || !nextBtn) return;
    var scrollable = !track.hidden && track.scrollWidth - track.clientWidth > 2;
    prevBtn.disabled = !scrollable;
    nextBtn.disabled = !scrollable;
  }
  function slide(dir) {
    var max = track.scrollWidth - track.clientWidth;
    var left;
    if (dir > 0 && track.scrollLeft >= max - 2) left = 0;
    else if (dir < 0 && track.scrollLeft <= 2) left = max;
    else left = track.scrollLeft + dir * stepSize();
    track.scrollTo({ left: left, behavior: 'smooth' });
  }

  if (track) {
    prevBtn && prevBtn.addEventListener('click', function () { slide(-1); });
    nextBtn && nextBtn.addEventListener('click', function () { slide(1); });
    window.addEventListener('resize', updateArrows);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); slide(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slide(-1); }
    });
    track.addEventListener('click', function (e) {
      var btn = e.target.closest('.card__btn');
      if (!btn) return;
      if (cart[btn.dataset.id]) openModal('cart');
      else addToCart(btn.dataset.id);
    });
  }

  /* ------------------------------------------------------------------
     Поиск
     ------------------------------------------------------------------ */
  var searchForm = $('#search-form');
  var searchInput = $('#search-input');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = searchInput.value.trim();
      setFilter(q ? { type: 'query', value: q, label: 'Поиск: ' + q } : null, true);
    });
    searchInput.addEventListener('search', function () {
      if (!searchInput.value && currentFilter && currentFilter.type === 'query') setFilter(null, false);
    });
  }

  /* ------------------------------------------------------------------
     Мобильное меню
     ------------------------------------------------------------------ */
  var header = $('.header');
  var burger = $('.header__burger');
  function closeMenu() {
    if (!header) return;
    header.classList.remove('is-menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    var open = !header.classList.contains('is-menu-open');
    header.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  /* ------------------------------------------------------------------
     Общий обработчик кликов (data-атрибуты в разметке)
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-modal-open], [data-modal-close], [data-filter-genre], [data-filter-format], [data-filter-reset], [data-action], .header__nav a');
    if (!el) return;

    if (el.matches('.header__nav a')) closeMenu();

    if (el.hasAttribute('data-modal-close')) {
      closeAllModals();
      if (!el.hasAttribute('data-filter-reset') && el.getAttribute('href') === null) return;
    }

    if (el.dataset.modalOpen) {
      e.preventDefault();
      openModal(el.dataset.modalOpen);
      return;
    }

    var isLink = el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) === '#';

    if (el.dataset.filterGenre) {
      var g = el.dataset.filterGenre;
      setFilter({ type: 'genre', value: g, label: GENRES[g] || g }, !isLink);
      return;
    }
    if (el.dataset.filterFormat) {
      var f = el.dataset.filterFormat;
      setFilter({ type: 'format', value: f, label: FORMATS[f] || f }, !isLink);
      return;
    }
    if (el.hasAttribute('data-filter-reset')) {
      if (searchInput && currentFilter && currentFilter.type === 'query') searchInput.value = '';
      setFilter(null, !isLink);
      return;
    }

    if (el.dataset.action === 'focus-search') {
      closeMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (searchInput) searchInput.focus({ preventScroll: true });
    }
    if (el.dataset.action === 'toggle-menu') toggleMenu();
  });

  /* ------------------------------------------------------------------
     Анимации: шапка «отдаляется» при прокрутке, блоки появляются
     ------------------------------------------------------------------ */
  if (header) {
    var updateHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 30); };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');
    // Анимация проигрывается каждый раз, когда элемент попадает в экран:
    // показался хотя бы на `ratio` — запускаем, полностью ушёл — сбрасываем,
    // чтобы при возврате (прокрутка вверх или вниз) всё сыграло заново.
    var replayOnView = function (selector, ratio) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          if (entry.intersectionRatio >= ratio) {
            el.classList.add('is-in');
          } else if (!entry.isIntersecting && el.classList.contains('is-in')) {
            // сброс мгновенно, без обратной анимации — иначе при быстрой
            // прокрутке назад видно, как диски «улетают» и прилетают снова
            el.classList.add('is-resetting');
            el.classList.remove('is-in');
            void el.offsetWidth;
            requestAnimationFrame(function () { el.classList.remove('is-resetting'); });
          }
        });
      }, { threshold: [0, ratio] });
      $$(selector).forEach(function (el) { observer.observe(el); });
    };
    replayOnView('.genre-disc, .genre-title, .genre-desc', 0.2);
    replayOnView('.others', 0.3);
  }

  /* ------------------------------------------------------------------
     Старт
     ------------------------------------------------------------------ */
  renderCards();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
})();
