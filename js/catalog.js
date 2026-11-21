/* =====================================================================
   THE LAST DISK — страница каталога (catalog.html)
   - полки «Винил», «CD», «DVD» с карточками из js/products.js
   - фильтр по жанрам и сортировка (общие для всех полок)
   - поиск из строки вверху (адрес вида catalog.html?q=metallica)
   - «Листать дальше» показывает следующие PAGE товаров полки
   Корзина, избранное и окно товара — в js/main.js (объект TLD).
   ===================================================================== */
(function () {
  'use strict';

  var TLD = window.TLD;
  var root = document.querySelector('[data-catalog]');
  if (!TLD || !root) return;

  var $ = function (sel, r) { return (r || document).querySelector(sel); };
  var $$ = function (sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); };
  var esc = TLD.escapeHTML;

  var PAGE = 8; // сколько карточек полки показывать сразу и добавлять по «Листать дальше»
  var SORTS = [
    { id: 'default', label: 'По умолчанию' },
    { id: 'cheap', label: 'Сначала дешёвые' },
    { id: 'expensive', label: 'Сначала дорогие' },
    { id: 'title', label: 'По названию' }
  ];
  // жанры для фильтра — только те, что есть среди товаров
  var GENRE_IDS = Object.keys(TLD.GENRES).filter(function (g) {
    return TLD.PRODUCTS.some(function (p) { return p.genres.indexOf(g) !== -1; });
  });

  var state = { q: '', genres: [], sort: 'default', shown: {} };
  var shelves = $$('[data-shelf]', root);
  var searchInput = $('#search-input');
  var chipsEl = $('[data-catalog-chips]', root);
  var popover = $('[data-popover]');
  var popoverFor = null; // кнопка, под которой открыто окошко

  /* ------------------------------------------------------------------
     Отбор и сортировка
     ------------------------------------------------------------------ */
  function passes(p) {
    if (state.genres.length && !p.genres.some(function (g) { return state.genres.indexOf(g) !== -1; })) return false;
    if (state.q && !TLD.matchesQuery(p, state.q)) return false;
    return true;
  }
  function sorted(list) {
    var arr = list.slice();
    if (state.sort === 'cheap') arr.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'expensive') arr.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'title') arr.sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
    return arr;
  }
  function isFiltered() { return !!(state.q || state.genres.length); }

  /* ------------------------------------------------------------------
     Разметка карточек
     ------------------------------------------------------------------ */
  function cardHTML(p, i) {
    var name = esc(TLD.fullTitle(p) + ' — ' + TLD.oneLine(p.artist));
    return '<article class="pcard' + (p.edition ? ' has-edition' : '') + '" style="--i:' + i + '">' +
      '<button class="pcard__img" type="button" data-product-open="' + p.id + '" aria-label="Подробнее: ' + name + '">' +
        '<img src="' + p.img + '" alt="" loading="lazy">' +
      '</button>' +
      '<div class="pcard__info">' +
        '<h3 class="pcard__title">' + esc(p.title) + '</h3>' +
        (p.edition ? '<p class="pcard__edition">' + esc(p.edition) + '</p>' : '') +
        '<p class="pcard__artist">' + esc(p.artist) + '</p>' +
        '<p class="pcard__price">' + TLD.priceLabel(p) + '</p>' +
      '</div>' +
      '<div class="pcard__actions">' +
        '<button class="pcard__btn" type="button" data-cart-add="' + p.id + '"><span>В корзину</span></button>' +
        TLD.favButtonHTML(p) +
      '</div>' +
    '</article>';
  }

  function giftHTML(p) {
    return '<div class="gift">' +
      '<article class="gift__card">' +
        '<button class="gift__img" type="button" data-product-open="' + p.id + '" aria-label="Подробнее: ' + esc(p.title) + '">' +
          '<img src="' + p.img + '" alt="">' +
        '</button>' +
        '<h3 class="gift__title t">' + esc(p.title) + '</h3>' +
        '<p class="gift__artist t">' + esc(TLD.oneLine(p.artist)) + '</p>' +
        '<p class="gift__price t">' + TLD.priceLabel(p) + '</p>' +
        '<button class="gift__btn" type="button" data-cart-add="' + p.id + '"><span>В корзину</span></button>' +
        TLD.favButtonHTML(p) +
      '</article>' +
      '<p class="gift__note-title t">Подарок специально от магазина!</p>' +
      '<p class="gift__note t">купи бесплатно с любой другой покупкой!</p>' +
    '</div>';
  }

  /* ------------------------------------------------------------------
     Отрисовка полок
     ------------------------------------------------------------------ */
  // товары полки: подарок всегда первый и не занимает место в «странице» обычных карточек
  function shelfItems(format) {
    var all = TLD.PRODUCTS.filter(function (p) { return p.format === format && passes(p); });
    return {
      gift: all.filter(function (p) { return p.gift; })[0],
      items: sorted(all.filter(function (p) { return !p.gift; }))
    };
  }

  function renderShelf(shelf) {
    var format = shelf.dataset.shelf;
    var data = shelfItems(format);
    var limit = state.shown[format] || PAGE;

    $('[data-shelf-grid]', shelf).innerHTML =
      (data.gift ? giftHTML(data.gift) : '') +
      data.items.slice(0, limit).map(cardHTML).join('');
    $('[data-shelf-empty]', shelf).hidden = !!(data.gift || data.items.length);
    $('[data-shelf-more]', shelf).hidden = data.items.length <= limit;
  }

  // «Листать дальше»: дописываем следующую порцию, уже показанные карточки не трогаем
  function showMore(shelf) {
    var format = shelf.dataset.shelf;
    var data = shelfItems(format);
    var before = state.shown[format] || PAGE;
    state.shown[format] = before + PAGE;
    var grid = $('[data-shelf-grid]', shelf);
    grid.insertAdjacentHTML('beforeend', data.items.slice(before, before + PAGE).map(cardHTML).join(''));
    $('[data-shelf-more]', shelf).hidden = data.items.length <= before + PAGE;
    TLD.refreshButtons();
    fitTitles();
    // фокус на первую новую карточку, чтобы с клавиатуры не возвращаться к началу полки
    var first = $$('.pcard', grid)[before];
    if (first) first.querySelector('button').focus({ preventScroll: true });
  }

  function renderAll() {
    shelves.forEach(function (s) { renderShelf(s); });
    renderBars();
    renderChips();
    TLD.refreshButtons();
    fitTitles();
  }

  // подписи на кнопках панели (у каждой полки своя панель, состояние общее)
  function renderBars() {
    var sortLabel = SORTS.filter(function (s) { return s.id === state.sort; })[0].label;
    $$('[data-sort-label]', root).forEach(function (el) { el.textContent = sortLabel; });
    $$('[data-filter-count]', root).forEach(function (el) {
      el.textContent = state.genres.length;
      el.hidden = !state.genres.length;
    });
  }

  // активные фильтры рядом с заголовком — нажатие убирает фильтр
  function renderChips() {
    if (!chipsEl) return;
    var chips = [];
    if (state.q) chips.push('<button class="cat-chip" type="button" data-chip-query>Поиск: ' + esc(state.q) + ' <span aria-hidden="true">✕</span></button>');
    state.genres.forEach(function (g) {
      chips.push('<button class="cat-chip" type="button" data-chip-genre="' + g + '" aria-label="Убрать фильтр ' + esc(TLD.GENRES[g]) + '">' +
        esc(TLD.GENRES[g]) + ' <span aria-hidden="true">✕</span></button>');
    });
    if (chips.length > 1) chips.push('<button class="cat-chip cat-chip--reset" type="button" data-catalog-reset>Сбросить всё</button>');
    chipsEl.innerHTML = chips.join('');
    chipsEl.hidden = !chips.length;
  }

  // длинное название уменьшается до одной строки, а совсем длинное — переносится на две
  function fitTitles() {
    $$('.pcard__title', root).forEach(function (el) {
      el.classList.remove('is-long');
      el.style.fontSize = '';
      if (el.scrollWidth <= el.clientWidth + 1) return;
      var ratio = el.clientWidth / el.scrollWidth;
      if (ratio < 0.72) { el.classList.add('is-long'); return; }
      var u = parseFloat(getComputedStyle(el).getPropertyValue('--u')) || 1;
      var base = parseFloat(getComputedStyle(el).fontSize) / u;
      el.style.fontSize = 'calc(' + (base * ratio * 0.98).toFixed(2) + ' * var(--u))';
    });
  }

  /* ------------------------------------------------------------------
     Изменение состояния
     ------------------------------------------------------------------ */
  function resetPages() { state.shown = {}; }

  function setQuery(q, scroll) {
    state.q = q;
    if (searchInput && searchInput.value !== q) searchInput.value = q;
    resetPages();
    renderAll();
    syncURL();
    if (scroll && q) scrollToResults();
  }

  function toggleGenre(g) {
    var i = state.genres.indexOf(g);
    if (i === -1) state.genres.push(g); else state.genres.splice(i, 1);
    resetPages();
    renderAll();
  }

  function resetAll() {
    state.q = '';
    state.genres = [];
    if (searchInput) searchInput.value = '';
    resetPages();
    closePopover();
    renderAll();
    syncURL();
  }

  // первая полка, где что-то нашлось
  function scrollToResults() {
    var target = shelves.filter(function (s) { return $('[data-shelf-empty]', s).hidden; })[0] || shelves[0];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function syncURL() {
    if (!window.history || !history.replaceState) return;
    var url = location.pathname + (state.q ? '?q=' + encodeURIComponent(state.q) : '') + location.hash;
    history.replaceState(null, '', url);
  }

  /* ------------------------------------------------------------------
     Окошко фильтров / сортировки
     ------------------------------------------------------------------ */
  function popoverHTML(kind) {
    if (kind === 'sort') {
      return '<p class="popover__title">Сортировка</p>' +
        '<div class="popover__list" role="radiogroup" aria-label="Сортировка">' +
          SORTS.map(function (s) {
            return '<button class="pop-opt" type="button" role="radio" aria-checked="' + (s.id === state.sort) + '" data-sort="' + s.id + '">' + esc(s.label) + '</button>';
          }).join('') +
        '</div>';
    }
    return '<p class="popover__title">Жанры</p>' +
      '<div class="popover__list">' +
        GENRE_IDS.map(function (g) {
          return '<button class="pop-opt" type="button" aria-pressed="' + (state.genres.indexOf(g) !== -1) + '" data-genre="' + g + '">' + esc(TLD.GENRES[g]) + '</button>';
        }).join('') +
      '</div>' +
      (state.genres.length ? '<div class="popover__foot"><button class="popover__reset" type="button" data-genres-reset>Сбросить жанры</button></div>' : '');
  }

  function openPopover(btn) {
    var bar = btn.closest('.shelf__bar');
    var kind = btn.dataset.catalogPop;
    closePopover();
    popover.className = 'popover popover--' + kind;
    popover.setAttribute('aria-label', kind === 'sort' ? 'Сортировка' : 'Фильтры');
    popover.innerHTML = popoverHTML(kind);
    bar.appendChild(popover);
    popover.hidden = false;
    var left = Math.min(btn.offsetLeft, bar.clientWidth - popover.offsetWidth);
    popover.style.left = Math.max(0, left) + 'px';
    popover.style.top = (btn.offsetTop + btn.offsetHeight + 8) + 'px';
    popoverFor = btn;
    btn.setAttribute('aria-expanded', 'true');
    var first = popover.querySelector('.pop-opt');
    if (first) first.focus({ preventScroll: true });
  }

  function closePopover(returnFocus) {
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    if (popoverFor) {
      popoverFor.setAttribute('aria-expanded', 'false');
      if (returnFocus) popoverFor.focus({ preventScroll: true });
    }
    popoverFor = null;
  }

  function refreshPopover() {
    if (!popoverFor || popover.hidden) return;
    var focusedKey = document.activeElement && (document.activeElement.dataset.genre || document.activeElement.dataset.sort);
    popover.innerHTML = popoverHTML(popoverFor.dataset.catalogPop);
    var again = focusedKey && popover.querySelector('[data-genre="' + focusedKey + '"], [data-sort="' + focusedKey + '"]');
    if (again) again.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------
     События
     ------------------------------------------------------------------ */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-catalog-pop], [data-genre], [data-sort], [data-genres-reset], [data-chip-query], [data-chip-genre], [data-catalog-reset], [data-shelf-more]');
    if (!el) return;

    if (el.dataset.catalogPop) {
      if (popoverFor === el) closePopover(); else openPopover(el);
      return;
    }
    if (el.dataset.genre) { toggleGenre(el.dataset.genre); refreshPopover(); return; }
    if (el.hasAttribute('data-genres-reset')) { state.genres = []; resetPages(); renderAll(); refreshPopover(); return; }
    if (el.dataset.sort) {
      state.sort = el.dataset.sort;
      resetPages();
      renderAll();
      closePopover(true);
      return;
    }
    if (el.hasAttribute('data-chip-query')) { setQuery('', false); return; }
    if (el.dataset.chipGenre) { toggleGenre(el.dataset.chipGenre); return; }
    if (el.hasAttribute('data-catalog-reset')) { resetAll(); return; }

    if (el.hasAttribute('data-shelf-more')) showMore(el.closest('[data-shelf]'));
  });

  // клик мимо окошка и Esc закрывают его. composedPath, а не contains: кнопки внутри
  // окошка перерисовываются по клику и к этому моменту уже вынуты из документа
  document.addEventListener('click', function (e) {
    if (!popover || popover.hidden) return;
    var path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(popover) !== -1 || e.target.closest('[data-catalog-pop]')) return;
    closePopover();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popover && !popover.hidden) closePopover(true);
  });

  // поиск из строки вверху страницы (форму обрабатывает js/main.js)
  TLD.onSearch = function (q) { setQuery(q, true); };

  window.addEventListener('resize', fitTitles);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);

  /* ------------------------------------------------------------------
     Старт: запрос из адреса (?q=...) и первая отрисовка
     ------------------------------------------------------------------ */
  var params = new URLSearchParams(location.search);
  state.q = (params.get('q') || '').trim();
  if (searchInput) searchInput.value = state.q;
  renderAll();
})();
