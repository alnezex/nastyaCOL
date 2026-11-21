/* =====================================================================
   THE LAST DISK — общая логика всех страниц
   - корзина, избранное, недавно просмотренные, заказы (всё в localStorage)
   - всплывающие окна, в том числе карточка товара
   - поиск, мобильное меню, уведомления, анимация шапки
   - карусель «Popular collections» на главной (если она есть на странице)
   Страницы каталога и профиля дорисовывают своё в js/catalog.js и
   js/profile.js через объект window.TLD (см. конец файла).
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var PRODUCTS = window.PRODUCTS || [];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var GENRES = { rock: 'Rock', pop: 'Pop', metal: 'Metall', 'hip-hop': 'Hip-hop', electronic: 'Electronic', rap: 'Rap', jazz: 'Jazz' };
  var FORMATS = { vinyl: 'Виниловые пластинки', cd: 'CD диски', dvd: 'DVD диски' };
  var FORMAT_SHORT = { vinyl: 'Винил', cd: 'CD', dvd: 'DVD' };
  var DEFAULT_POS = { x: 34, y: 52, w: 575 };
  var RECENT_MAX = 6;

  var track = $('[data-carousel-track]'); // карусель есть только на главной

  function formatPrice(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function priceLabel(p) { return p.price === 0 ? 'FREE!' : formatPrice(p.price); }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function oneLine(s) { return String(s).replace(/\s*\n\s*/g, ' '); }
  function fullTitle(p) { return p.title + (p.edition ? ' — ' + p.edition : ''); }

  /* ------------------------------------------------------------------
     Хранилище в браузере. В приватном режиме запись может не работать —
     тогда всё живёт до перезагрузки страницы.
     ------------------------------------------------------------------ */
  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* приватный режим */ }
  }
  // сообщаем страницам, что данные поменялись: what = cart | favs | recent | orders
  function emit(what) {
    var ev;
    try { ev = new CustomEvent('tld:change', { detail: { what: what } }); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('tld:change', false, false, { what: what }); }
    document.dispatchEvent(ev);
  }
  function knownIds(list) {
    return Array.isArray(list) ? list.filter(function (id, i) { return byId[id] && list.indexOf(id) === i; }) : [];
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
    var data = load(CART_KEY, {});
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    Object.keys(data).forEach(function (id) { if (!byId[id] || !(data[id] > 0)) delete data[id]; });
    return data;
  }
  function cartCount() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }
  function cartTotal() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + byId[id].price * cart[id]; }, 0);
  }
  function setQty(id, qty) {
    if (qty > 0) cart[id] = qty; else delete cart[id];
    save(CART_KEY, cart);
    updateCartUI();
    emit('cart');
  }
  function addToCart(id) {
    setQty(id, (cart[id] || 0) + 1);
    toast('«' + byId[id].title + '» в корзине');
  }

  // кнопки «В корзину» на всех страницах: data-cart-add="id", подпись — в <span>
  function updateCartUI() {
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$('[data-cart-add]').forEach(function (btn) {
      var p = byId[btn.dataset.cartAdd];
      if (!p) return;
      var inCart = !!cart[p.id];
      var label = btn.querySelector('span') || btn;
      btn.classList.toggle('is-added', inCart);
      label.textContent = inCart ? 'В корзине' : 'В корзину';
      btn.setAttribute('aria-label', (inCart ? 'Открыть корзину: ' : 'Добавить в корзину: ') + fullTitle(p));
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
        '<div class="cart-actions">' +
          '<button class="btn" type="button" data-modal-close>Продолжить покупки</button>' +
          '<a class="btn btn--ghost" href="profile.html">Мои заказы</a>' +
        '</div>';
      return;
    }

    if (!ids.length) {
      cartBody.innerHTML =
        '<p class="cart-empty">Корзина пока пустая.</p>' +
        '<a class="btn" href="' + (track ? '#collections' : 'catalog.html') + '" data-modal-close>Перейти к альбомам</a>';
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
          '<div class="cart-item__title">' + escapeHTML(fullTitle(p)) + '</div>' +
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
      // Здесь будет отправка заказа на сервер. Пока заказ сохраняется только
      // в браузере покупателя — чтобы он появился в «Моих заказах».
      saveOrder(e.target.elements.phone.value);
      cart = {};
      save(CART_KEY, cart);
      cartView = 'done';
      updateCartUI();
      emit('cart');
      renderCart();
    });
  }

  /* ------------------------------------------------------------------
     Заказы (история в профиле)
     ------------------------------------------------------------------ */
  var ORDERS_KEY = 'tld-orders';
  var PHONE_KEY = 'tld-phone';
  var orders = load(ORDERS_KEY, []);
  if (!Array.isArray(orders)) orders = [];

  function saveOrder(phone) {
    orders.unshift({
      n: orders.length + 1,
      date: new Date().toISOString(),
      items: Object.keys(cart).map(function (id) { return { id: id, qty: cart[id], price: byId[id].price }; }),
      total: cartTotal()
    });
    save(ORDERS_KEY, orders);
    phone = String(phone || '').trim();
    if (phone) save(PHONE_KEY, phone);
    emit('orders');
  }

  /* ------------------------------------------------------------------
     Избранное и недавно просмотренные
     ------------------------------------------------------------------ */
  var FAVS_KEY = 'tld-favs';
  var RECENT_KEY = 'tld-recent';
  var favs = knownIds(load(FAVS_KEY, []));
  var recent = knownIds(load(RECENT_KEY, [])).slice(0, RECENT_MAX);

  function isFav(id) { return favs.indexOf(id) !== -1; }
  function toggleFav(id) {
    var on = !isFav(id);
    favs = on ? [id].concat(favs) : favs.filter(function (x) { return x !== id; });
    save(FAVS_KEY, favs);
    updateFavUI();
    toast(on ? '«' + byId[id].title + '» в избранном' : 'Убрано из избранного');
    emit('favs');
  }
  // сердечки на всех страницах: data-fav="id"
  function updateFavUI() {
    $$('[data-fav]').forEach(function (btn) {
      var p = byId[btn.dataset.fav];
      if (!p) return;
      var on = isFav(p.id);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', (on ? 'Убрать из избранного: ' : 'В избранное: ') + fullTitle(p));
    });
  }
  function pushRecent(id) {
    recent = [id].concat(recent.filter(function (x) { return x !== id; })).slice(0, RECENT_MAX);
    save(RECENT_KEY, recent);
    emit('recent');
  }
  // после того как страница перерисовала карточки — выставить состояния кнопок
  function refreshButtons() { updateCartUI(); updateFavUI(); }

  function favButtonHTML(p, extraClass) {
    return '<button class="fav' + (extraClass ? ' ' + extraClass : '') + '" type="button" data-fav="' + p.id + '">' +
      '<img class="fav__off" src="assets/img/heart-off.png" alt="">' +
      '<img class="fav__on" src="assets/img/heart-on.png" alt="">' +
    '</button>';
  }

  /* ------------------------------------------------------------------
     Карточка товара (окно). Открывается по data-product-open="id"
     и попадает в «Недавно смотрели».
     ------------------------------------------------------------------ */
  var productBody = $('[data-product-body]');
  function renderProduct(id) {
    var p = byId[id];
    if (!productBody || !p) return;
    var genres = p.genres.map(function (g) { return GENRES[g] || g; }).join(', ');
    productBody.innerHTML =
      '<div class="product">' +
        '<div class="product__img"><img src="' + p.img + '" alt="' + escapeHTML(p.title + ' — ' + oneLine(p.artist)) + '"></div>' +
        '<div class="product__info">' +
          '<p class="product__meta">' + escapeHTML(FORMAT_SHORT[p.format] || '') + ' · ' + escapeHTML(genres) + '</p>' +
          '<h2 class="modal__title product__title" id="product-title">' + escapeHTML(p.title) + '</h2>' +
          (p.edition ? '<p class="product__edition">' + escapeHTML(p.edition) + '</p>' : '') +
          '<p class="product__artist">' + escapeHTML(oneLine(p.artist)) + '</p>' +
          '<p class="product__price">' + priceLabel(p) + (p.price ? ' ₽' : '') + '</p>' +
          (p.gift ? '<p class="product__note">Подарок от магазина: бесплатно с любой другой покупкой.</p>' : '') +
          '<div class="product__actions">' +
            '<button class="btn" type="button" data-cart-add="' + p.id + '"><span>В корзину</span></button>' +
            favButtonHTML(p, 'fav--modal') +
          '</div>' +
        '</div>' +
      '</div>';
    refreshButtons();
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
  function openModal(name, arg) {
    var m = $('[data-modal="' + name + '"]');
    if (!m) return;
    var wasOpen = $$('[data-modal]').some(function (x) { return !x.hidden; });
    closeAllModals(true);
    closeMenu();
    if (!wasOpen) lastFocus = document.activeElement; // из окна в окно — фокус вернётся к исходной кнопке
    if (name === 'cart') { cartView = arg === 'checkout' && cartCount() ? 'checkout' : 'list'; renderCart(); }
    if (name === 'product') { renderProduct(arg); pushRecent(arg); }
    m.hidden = false;
    document.body.classList.add('is-locked');
    focusFirst(m.querySelector('.modal__panel'));
  }
  function closeAllModals(silent) {
    var any = false;
    $$('[data-modal]').forEach(function (m) { if (!m.hidden) { m.hidden = true; any = true; } });
    document.body.classList.remove('is-locked');
    if (any && !silent && lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (floatSearch && floatSearch.contains(document.activeElement)) closeSearch(true);
      closeAllModals();
      closeMenu();
    }
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

  /* ------------------------------------------------------------------
     Карусель + фильтры (только главная)
     ------------------------------------------------------------------ */
  var emptyEl = $('[data-carousel-empty]');
  var chip = $('[data-filter-chip]');
  var chipLabel = $('[data-filter-label]');
  var prevBtn = $('[data-carousel="prev"]');
  var nextBtn = $('[data-carousel="next"]');
  var currentFilter = null;

  function cardHTML(p) {
    var multi = p.artist.indexOf('\n') !== -1;
    var alt = escapeHTML(p.title + ' — ' + oneLine(p.artist));
    var img = p.pos
      ? '<img class="card__img" src="' + p.img + '" alt="' + alt + '"' +
          ' style="--x:' + p.pos.x + ';--y:' + p.pos.y + ';--w:' + p.pos.w + '" loading="lazy">'
      : '<img class="card__img card__img--fit" src="' + p.img + '" alt="' + alt + '" loading="lazy">';
    return '<article class="card" data-id="' + p.id + '">' +
      img +
      '<button class="card__open" type="button" data-product-open="' + p.id + '" aria-label="Подробнее: ' + escapeHTML(fullTitle(p)) + '"></button>' +
      '<h3 class="card__title t">' + escapeHTML(p.title) + '</h3>' +
      '<p class="card__artist t' + (multi ? ' is-multiline' : '') + '">' + escapeHTML(p.artist) + '</p>' +
      '<p class="card__price t">' + priceLabel(p) + '</p>' +
      '<button class="card__btn" type="button" data-cart-add="' + p.id + '"><span class="t">В корзину</span></button>' +
    '</article>';
  }

  // поиск: каждое слово запроса должно найтись в названии, исполнителе, жанрах или формате
  function matchesQuery(p, q) {
    var hay = [p.title, p.edition || '', p.artist,
      p.genres.map(function (g) { return (GENRES[g] || '') + ' ' + g; }).join(' '),
      (FORMATS[p.format] || '') + ' ' + (FORMAT_SHORT[p.format] || '') + ' ' + p.format
    ].join(' ').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
    return String(q).toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean).every(function (w) {
      return hay.indexOf(w) !== -1;
    });
  }

  function matches(p, f) {
    if (!f) return true;
    if (f.type === 'genre') return p.genres.indexOf(f.value) !== -1;
    if (f.type === 'query') return matchesQuery(p, f.value);
    return true;
  }

  // без фильтра карусель показывает «популярное», с фильтром — все подходящие товары
  function carouselList() {
    if (!currentFilter) {
      return PRODUCTS.filter(function (p) { return p.popular; })
        .sort(function (a, b) { return a.popular - b.popular; });
    }
    return PRODUCTS.filter(function (p) { return matches(p, currentFilter); });
  }

  function renderCards() {
    if (!track) return;
    var list = carouselList();
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
    if (!track) return;
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
  }

  /* ------------------------------------------------------------------
     Поиск. На главной фильтрует карусель, в каталоге — полки каталога
     (TLD.onSearch из js/catalog.js), на остальных страницах ведёт в каталог.
     ------------------------------------------------------------------ */
  var searchForm = $('#search-form');
  var searchInput = $('#search-input');

  // Плавающий поиск главной: свёрнут в кнопку в правом нижнем углу,
  // по нажатию поле выезжает влево, после поиска сворачивается обратно.
  var floatSearch = $('[data-float-search]');
  var floatBtn = floatSearch && $('.float-search__btn', floatSearch);

  function isSearchOpen() { return !!floatSearch && floatSearch.classList.contains('is-open'); }
  function openSearch() {
    if (!floatSearch) return;
    closeMenu();
    floatSearch.classList.add('is-open');
    floatBtn.setAttribute('aria-expanded', 'true');
    floatBtn.setAttribute('aria-label', 'Найти');
    searchInput.tabIndex = 0;
    searchInput.focus({ preventScroll: true });
  }
  function closeSearch(focusButton) {
    if (!isSearchOpen()) return;
    floatSearch.classList.remove('is-open');
    floatBtn.setAttribute('aria-expanded', 'false');
    floatBtn.setAttribute('aria-label', 'Открыть поиск');
    searchInput.tabIndex = -1;
    if (focusButton) floatBtn.focus({ preventScroll: true });
    else if (floatSearch.contains(document.activeElement)) document.activeElement.blur();
  }
  if (floatSearch) {
    floatBtn.addEventListener('click', function (e) {
      if (!isSearchOpen()) { e.preventDefault(); openSearch(); return; }
      if (!searchInput.value.trim()) { e.preventDefault(); closeSearch(true); }
      // в поле есть текст — кнопка просто отправляет форму
    });
    // нажали мимо поиска — сворачиваем
    document.addEventListener('pointerdown', function (e) {
      if (isSearchOpen() && !floatSearch.contains(e.target)) closeSearch();
    });
    // ушли из поиска клавишей Tab — тоже сворачиваем
    // (relatedTarget пустой при клике по кнопке в Safari — тогда не трогаем)
    floatSearch.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !floatSearch.contains(e.relatedTarget)) closeSearch();
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = searchInput.value.trim();
      if (track) {
        if (q || !floatSearch) setFilter(q ? { type: 'query', value: q, label: 'Поиск: ' + q } : null, true);
        else if (currentFilter && currentFilter.type === 'query') setFilter(null, false);
      }
      else if (TLD.onSearch) TLD.onSearch(q);
      else location.href = 'catalog.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      if (floatSearch) closeSearch(!q);
    });
    searchInput.addEventListener('search', function () {
      if (searchInput.value) return;
      if (track && currentFilter && currentFilter.type === 'query') setFilter(null, false);
      else if (!track && TLD.onSearch) TLD.onSearch('');
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
    var el = e.target.closest('[data-modal-open], [data-modal-close], [data-filter-genre], [data-filter-reset], [data-action], [data-cart-add], [data-fav], [data-product-open], .header__nav a');
    if (!el) return;

    if (el.matches('.header__nav a')) closeMenu();

    if (el.dataset.cartAdd) {
      if (cart[el.dataset.cartAdd]) openModal('cart');
      else addToCart(el.dataset.cartAdd);
      return;
    }
    if (el.dataset.fav) { toggleFav(el.dataset.fav); return; }
    if (el.dataset.productOpen) { openModal('product', el.dataset.productOpen); return; }

    if (el.hasAttribute('data-modal-close')) {
      closeAllModals();
      if (!el.hasAttribute('data-filter-reset') && el.getAttribute('href') === null) return;
    }

    if (el.dataset.modalOpen) {
      e.preventDefault();
      openModal(el.dataset.modalOpen, el.dataset.modalArg);
      return;
    }

    var isLink = el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) === '#';

    if (el.dataset.filterGenre) {
      var g = el.dataset.filterGenre;
      setFilter({ type: 'genre', value: g, label: GENRES[g] || g }, !isLink);
      return;
    }
    if (el.hasAttribute('data-filter-reset')) {
      if (searchInput && currentFilter && currentFilter.type === 'query') searchInput.value = '';
      setFilter(null, !isLink);
      return;
    }

    var action = el.dataset.action;
    if (action === 'focus-search') { // лупа в шапке каталога: каталог уже открыт — просто к строке поиска
      closeMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (searchInput) searchInput.focus({ preventScroll: true });
    }
    if (action === 'toggle-menu') toggleMenu();
    if (action === 'scroll-top') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (action === 'soon') { e.preventDefault(); toast((el.dataset.soon || 'Раздел') + ' скоро появятся в продаже'); }
  });

  /* ------------------------------------------------------------------
     Анимации: шапка «отдаляется» при прокрутке, кнопка «наверх»,
     блоки главной появляются при прокрутке
     ------------------------------------------------------------------ */
  var toTop = $('[data-to-top]');
  var onScroll = function () {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 30);
    if (toTop) toTop.classList.toggle('is-visible', y > 900);
    if (floatSearch) floatSearch.classList.toggle('is-dim', y > 200);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
     API для страниц каталога и профиля
     ------------------------------------------------------------------ */
  var TLD = window.TLD = {
    PRODUCTS: PRODUCTS,
    byId: byId,
    GENRES: GENRES,
    FORMAT_SHORT: FORMAT_SHORT,
    formatPrice: formatPrice,
    priceLabel: priceLabel,
    escapeHTML: escapeHTML,
    oneLine: oneLine,
    fullTitle: fullTitle,
    matchesQuery: matchesQuery,
    favButtonHTML: favButtonHTML,
    toast: toast,
    openModal: openModal,
    refreshButtons: refreshButtons,
    cart: function () { return cart; },
    cartTotal: cartTotal,
    favs: function () { return favs.slice(); },
    recent: function () { return recent.slice(); },
    orders: function () { return orders.slice(); },
    phone: function () { return load(PHONE_KEY, ''); },
    onSearch: null // каталог подставляет сюда свой поиск
  };

  /* ------------------------------------------------------------------
     Старт
     ------------------------------------------------------------------ */
  renderCards();
  refreshButtons();
  // лупа в шапке других страниц ведёт на catalog.html#search — ставим курсор в поиск
  // и убираем #search из адреса, чтобы при обновлении страницы не прыгало
  if (location.hash === '#search' && searchInput && !floatSearch) {
    searchInput.focus({ preventScroll: true });
    if (window.history && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }
  if (track && document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
})();
