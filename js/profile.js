/* =====================================================================
   THE LAST DISK — личный кабинет (profile.html)
   Меню слева переключает экраны:
     КАБИНЕТ   — карточка профиля и «Мои заказы» (заказы / скидки / корзина)
     ИЗБРАННОЕ — избранное и последние 6 открытых товаров
     КОРЗИНА   — кабинет с открытой вкладкой «Корзина»
   Адрес помнит экран: profile.html#favorites, #cart, #discounts.
   Сервера пока нет: заказы, избранное и телефон хранятся в браузере
   (их сохраняет js/main.js), поэтому кабинет у каждого свой.
   ===================================================================== */
(function () {
  'use strict';

  var TLD = window.TLD;
  var root = document.querySelector('[data-account]');
  if (!TLD || !root) return;

  var $ = function (sel, r) { return (r || document).querySelector(sel); };
  var $$ = function (sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); };
  var esc = TLD.escapeHTML;

  var view = 'cabinet'; // cabinet | favorites
  var tab = 'orders';   // orders | discounts | cart
  var ordersEl = $('#orders', root);
  var box = $('[data-orders-box]', root);

  /* ------------------------------------------------------------------
     Переключение экранов и вкладок
     ------------------------------------------------------------------ */
  function setView(next, nextTab, scroll) {
    view = next === 'favorites' ? 'favorites' : 'cabinet';
    if (nextTab) tab = nextTab;
    $$('[data-view]', root).forEach(function (el) { el.hidden = el.dataset.view !== view; });
    $$('[data-account-view]', root).forEach(function (btn) {
      var key = btn.dataset.accountView;
      var active = key === 'favorites' ? view === 'favorites' : view === 'cabinet' && (key === 'cart') === (tab === 'cart');
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
    renderTabs();
    if (view === 'favorites') renderFavorites(); else renderBox();
    syncHash();
    if (scroll === 'orders' && ordersEl) ordersEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (scroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncHash() {
    var hash = view === 'favorites' ? '#favorites' : tab === 'orders' ? '' : '#' + tab;
    if (location.hash !== hash && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search + hash);
    }
  }

  function readHash() {
    var h = location.hash.replace('#', '');
    if (h === 'favorites') return { view: 'favorites' };
    if (h === 'cart' || h === 'discounts' || h === 'orders') return { view: 'cabinet', tab: h };
    return { view: 'cabinet', tab: 'orders' };
  }

  function renderTabs() {
    $$('[data-account-tab]', root).forEach(function (t) {
      if (!t.matches('[role="tab"]')) return;
      var on = t.dataset.accountTab === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (box) box.setAttribute('aria-labelledby', 'tab-' + tab);
  }

  /* ------------------------------------------------------------------
     Карточка профиля
     ------------------------------------------------------------------ */
  // телефон из последнего заказа, видны только две последние цифры
  function renderPhone() {
    var el = $('[data-profile-phone]', root);
    if (!el) return;
    var digits = String(TLD.phone() || '').replace(/\D/g, '');
    el.textContent = digits.length >= 10 ? '+7 ********' + digits.slice(-2) : '+7 **********';
  }

  /* ------------------------------------------------------------------
     Содержимое рамки «Мои заказы»
     ------------------------------------------------------------------ */
  var CATALOG_BTN = '<a class="green-btn" href="catalog.html">Перейти в каталог</a>';

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function ordersHTML() {
    var orders = TLD.orders();
    if (!orders.length) {
      return '<p class="box-title">Здесь появятся ваши заказы</p>' +
        '<p class="box-text">пока заказов нету:(</p>' + CATALOG_BTN;
    }
    return '<p class="box-title">Ваши заказы</p>' +
      '<ul class="order-list">' + orders.map(function (o) {
        var items = (o.items || []).map(function (it) {
          var p = TLD.byId[it.id];
          return esc(p ? p.title : it.id) + (it.qty > 1 ? ' × ' + it.qty : '');
        }).join(', ');
        return '<li class="order">' +
          '<p class="order__head">Заказ №' + esc(o.n) + ' · ' + formatDate(o.date) + '</p>' +
          '<p class="order__items">' + items + '</p>' +
          '<p class="order__total">' + TLD.formatPrice(o.total || 0) + ' ₽</p>' +
        '</li>';
      }).join('') + '</ul>';
  }

  function discountsHTML() {
    return '<p class="box-title">Скидка 50% на первый заказ</p>' +
      '<p class="box-text">Скидка действует на первый заказ в магазине.<br>Других скидок пока нет — следите за акциями в нашем Telegram.</p>' +
      CATALOG_BTN;
  }

  function cartHTML() {
    var cart = TLD.cart();
    var ids = Object.keys(cart);
    if (!ids.length) {
      return '<p class="box-title">Корзина пуста</p>' +
        '<p class="box-text">добавьте пластинки и диски из каталога</p>' + CATALOG_BTN;
    }
    return '<p class="box-title">Корзина</p>' +
      '<ul class="box-cart">' + ids.map(function (id) {
        var p = TLD.byId[id];
        return '<li class="box-cart__item">' +
          '<img src="' + p.img + '" alt="">' +
          '<div>' +
            '<p class="box-cart__title">' + esc(TLD.fullTitle(p)) + (cart[id] > 1 ? ' × ' + cart[id] : '') + '</p>' +
            '<p class="box-cart__artist">' + esc(TLD.oneLine(p.artist)) + '</p>' +
          '</div>' +
          '<p class="box-cart__price">' + (p.price ? TLD.formatPrice(p.price * cart[id]) + ' ₽' : 'FREE!') + '</p>' +
        '</li>';
      }).join('') + '</ul>' +
      '<div class="box-total">Итого <b>' + TLD.formatPrice(TLD.cartTotal()) + ' ₽</b></div>' +
      '<button class="green-btn" type="button" data-modal-open="cart" data-modal-arg="checkout">Оформить заказ</button>';
  }

  function renderBox() {
    if (!box) return;
    box.innerHTML = tab === 'discounts' ? discountsHTML() : tab === 'cart' ? cartHTML() : ordersHTML();
  }

  /* ------------------------------------------------------------------
     Избранное и недавно смотрели
     ------------------------------------------------------------------ */
  function miniHTML(p, i) {
    return '<article class="mini" style="--i:' + i + '">' +
      '<button class="mini__img" type="button" data-product-open="' + p.id + '" aria-label="Подробнее: ' + esc(TLD.fullTitle(p)) + '">' +
        '<img src="' + p.img + '" alt="" loading="lazy">' +
      '</button>' +
      '<h3 class="mini__title">' + esc(p.title) + '</h3>' +
      '<p class="mini__artist">' + esc(TLD.oneLine(p.artist)) + '</p>' +
      '<p class="mini__price">' + TLD.priceLabel(p) + '</p>' +
      '<div class="mini__actions">' +
        '<button class="mini__btn" type="button" data-cart-add="' + p.id + '"><span>В корзину</span></button>' +
        TLD.favButtonHTML(p) +
      '</div>' +
    '</article>';
  }

  function listHTML(ids, emptyText) {
    if (!ids.length) return '<p class="fav-panel__hint">' + emptyText + '</p>';
    return '<div class="mini-grid">' + ids.map(function (id, i) { return miniHTML(TLD.byId[id], i); }).join('') + '</div>';
  }

  function renderFavorites() {
    var favEl = $('[data-fav-list]', root);
    var recentEl = $('[data-recent-list]', root);
    if (favEl) favEl.innerHTML = listHTML(TLD.favs(), 'Нажмите на сердечко рядом с товаром');
    if (recentEl) recentEl.innerHTML = listHTML(TLD.recent(), 'Здесь появятся последние 6 пластинок, которые вы открывали.');
    TLD.refreshButtons();
  }

  /* ------------------------------------------------------------------
     События
     ------------------------------------------------------------------ */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-account-view], [data-account-tab]');
    if (!el) return;
    e.preventDefault();
    if (el.dataset.accountView) {
      var v = el.dataset.accountView;
      if (v === 'cart') setView('cabinet', 'cart', 'orders');
      else if (v === 'favorites') setView('favorites', null, 'top');
      else setView('cabinet', tab === 'cart' ? 'orders' : null, 'top');
      return;
    }
    var nextTab = el.dataset.accountTab;
    // кнопки «мои покупки» / «мои скидки» в карточке профиля ещё и прокручивают к рамке
    setView('cabinet', nextTab, el.matches('[role="tab"]') ? null : 'orders');
  });

  // стрелки влево/вправо переключают вкладки (как принято у role="tablist")
  var tablist = $('[role="tablist"]', root);
  if (tablist) {
    tablist.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = $$('[role="tab"]', tablist);
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      setView('cabinet', next.dataset.accountTab);
      next.focus();
    });
  }

  // данные поменялись (корзина в окне, сердечко, новый заказ) — перерисовываем
  document.addEventListener('tld:change', function (e) {
    var what = e.detail && e.detail.what;
    if (what === 'orders') renderPhone();
    if (view === 'favorites') { if (what === 'favs' || what === 'recent') renderFavorites(); }
    else if ((what === 'orders' && tab === 'orders') || (what === 'cart' && tab === 'cart')) renderBox();
  });
  window.addEventListener('hashchange', function () {
    var h = readHash();
    setView(h.view, h.tab);
  });

  /* ------------------------------------------------------------------
     Старт
     ------------------------------------------------------------------ */
  renderPhone();
  var start = readHash();
  setView(start.view, start.tab);
})();
