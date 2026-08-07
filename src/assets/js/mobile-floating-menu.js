(function () {
  'use strict';

  var VERSION = 'v92';
  var MOBILE_QUERY = '(max-width: 767px)';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  ready(function () {
    var menu = document.querySelector('.veloura-mobile-floating-menu');
    if (!menu || menu.dataset.vmfmBound === VERSION) return;

    menu.dataset.vmfmBound = VERSION;
    menu.dataset.vmfmController = VERSION;

    var inner = menu.querySelector('.veloura-mobile-floating-menu__inner');
    var indicator = menu.querySelector('.veloura-mobile-floating-menu__indicator');
    var currentAction = '';
    var currentItem = null;
    var indicatorFrame = 0;

    function isMobile() {
      return !window.matchMedia || window.matchMedia(MOBILE_QUERY).matches;
    }

    function items() {
      return Array.prototype.slice.call(menu.querySelectorAll('.veloura-mobile-floating-menu__item'));
    }

    function normalizePath(value) {
      var path = String(value || '/').split('?')[0].split('#')[0];
      path = path.replace(/\/+$/, '');
      return path || '/';
    }

    function pathFromUrl(value) {
      if (!value) return '';
      try {
        return normalizePath(new URL(value, window.location.origin).pathname);
      } catch (error) {
        return normalizePath(value);
      }
    }

    function clearActive() {
      items().forEach(function (item) {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
    }

    function updateIndicator() {
      if (!inner || !indicator || !isMobile()) return;
      if (indicatorFrame) window.cancelAnimationFrame(indicatorFrame);
      indicatorFrame = window.requestAnimationFrame(function () {
        indicatorFrame = 0;
        var active = menu.querySelector('.veloura-mobile-floating-menu__item.is-active');
        if (!active) {
          indicator.classList.remove('is-visible');
          return;
        }

        /* offsetLeft/offsetWidth intentionally ignore the active transform. */
        var width = Math.max(18, Math.min(28, Math.round(active.offsetWidth * .24)));
        var x = Math.round(active.offsetLeft + ((active.offsetWidth - width) / 2));
        indicator.style.width = width + 'px';
        indicator.style.transform = 'translate3d(' + x + 'px,0,0)';
        indicator.classList.add('is-visible');
      });
    }

    function activate(item) {
      clearActive();
      if (item) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
      updateIndicator();
    }

    function routeItem() {
      var path = normalizePath(window.location.pathname);
      var storePath = pathFromUrl(menu.dataset.vmfmStoreUrl || '/');
      var slug = String(menu.dataset.vmfmPageSlug || '').toLowerCase();
      var item = null;

      if (menu.dataset.vmfmIsHome === 'true' || slug === 'index' || slug === 'home' || path === storePath) {
        item = menu.querySelector('[data-vmfm-match="home"]');
      } else if (slug.indexOf('cart') !== -1 || path.indexOf('/cart') !== -1) {
        item = menu.querySelector('[data-vmfm-match="cart"]');
      } else if (
        slug.indexOf('category') !== -1 ||
        slug.indexOf('product.index') !== -1 ||
        path.indexOf('/categories') !== -1 ||
        path.indexOf('/category') !== -1 ||
        path.indexOf('/c/') !== -1
      ) {
        item = menu.querySelector('[data-vmfm-match="categories"]');
      } else if (slug.indexOf('search') !== -1 || path.indexOf('/search') !== -1) {
        item = menu.querySelector('[data-vmfm-match="search"]');
      } else if (
        slug.indexOf('profile') !== -1 ||
        slug.indexOf('customer') !== -1 ||
        path.indexOf('/profile') !== -1 ||
        path.indexOf('/account') !== -1
      ) {
        item = menu.querySelector('[data-vmfm-match="account"]');
      }

      if (!item) {
        var custom = menu.querySelectorAll('[data-vmfm-url]');
        for (var i = 0; i < custom.length; i += 1) {
          if (pathFromUrl(custom[i].dataset.vmfmUrl) === path) {
            item = custom[i];
            break;
          }
        }
      }

      return item;
    }

    function restoreRoute() {
      if (currentAction) return;
      activate(routeItem());
    }

    function ensureCloseButton() {
      var button = document.querySelector('[data-vmfm-panel-close]');
      if (button) return button;
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'veloura-vmfm-panel-close';
      button.setAttribute('data-vmfm-panel-close', '');
      button.setAttribute('aria-label', 'إغلاق البحث');
      button.hidden = true;
      button.innerHTML = '<span aria-hidden="true">×</span>';
      document.body.appendChild(button);
      button.addEventListener('click', function (event) {
        event.preventDefault();
        closeSearch();
      });
      return button;
    }

    var closeButton = ensureCloseButton();

    function syncCloseButton() {
      var show = currentAction === 'search';
      closeButton.hidden = !show;
      closeButton.classList.toggle('is-visible', show);
    }

    function setAction(action, item) {
      currentAction = action || '';
      currentItem = item || null;
      if (currentItem) activate(currentItem);
      syncCloseButton();
    }

    function clearAction(action) {
      if (action && currentAction && action !== currentAction) return;
      currentAction = '';
      currentItem = null;
      syncCloseButton();
      window.setTimeout(restoreRoute, 20);
    }

    function dispatchSalla(name, detail) {
      try {
        if (window.salla && salla.event && typeof salla.event.dispatch === 'function') {
          salla.event.dispatch(name, detail);
          return true;
        }
      } catch (error) {}
      return false;
    }

    function clickElement(element) {
      if (!element) return false;
      try {
        element.click();
        return true;
      } catch (error) {
        return false;
      }
    }

    function firstOutsideMenu(selectors) {
      for (var i = 0; i < selectors.length; i += 1) {
        var nodes = document.querySelectorAll(selectors[i]);
        for (var n = 0; n < nodes.length; n += 1) {
          if (!menu.contains(nodes[n])) return nodes[n];
        }
      }
      return null;
    }

    function walkShadow(root, callback) {
      if (!root || !root.querySelectorAll) return;
      var nodes = root.querySelectorAll('*');
      for (var i = 0; i < nodes.length; i += 1) {
        callback(nodes[i]);
        if (nodes[i].shadowRoot) walkShadow(nodes[i].shadowRoot, callback);
      }
    }

    function closeHostDeep(host) {
      if (!host) return false;
      var closed = false;
      function tryClose(node) {
        if (!node || typeof node.close !== 'function') return;
        try {
          node.close();
          closed = true;
        } catch (error) {}
      }
      tryClose(host);
      if (host.shadowRoot) {
        walkShadow(host.shadowRoot, function (node) {
          if (node.matches && node.matches('salla-modal, salla-sheet')) tryClose(node);
        });
        if (!closed) {
          var selectors = [
            '[part~="close"]', '[data-close]', '.s-modal-close', '.s-modal-close-button',
            '.s-search-close', 'button[aria-label="إغلاق"]', 'button[aria-label="Close"]'
          ];
          for (var i = 0; i < selectors.length && !closed; i += 1) {
            var button = host.shadowRoot.querySelector(selectors[i]);
            if (button) closed = clickElement(button);
          }
        }
      }
      return closed;
    }

    /* Search uses the exact header trigger already used by the theme. */
    function openSearch(item) {
      setAction('search', item);
      var trigger = firstOutsideMenu(['.veloura-search-toggle', '[data-search-open]', '[data-open-search]']);
      if (!clickElement(trigger)) dispatchSalla('search::open');
    }

    function closeSearch() {
      closeHostDeep(document.querySelector('salla-search:not([inline])'));
      dispatchSalla('search::close');
      clearAction('search');
    }

    /* Account deliberately never redirects. It delegates to the header login trigger. */
    function openAccount(item) {
      setAction('account', item);
      var trigger = firstOutsideMenu(['.veloura-login-btn', '[data-login]', '[data-open-login]', '.s-login-modal-trigger']);
      if (clickElement(trigger)) return;
      if (dispatchSalla('login::open')) return;

      var host = document.querySelector('salla-login-modal');
      if (host && typeof host.open === 'function') {
        try { host.open(); } catch (error) { clearAction('account'); }
      } else {
        clearAction('account');
      }
    }

    function closeAccount() {
      closeHostDeep(document.querySelector('salla-login-modal'));
      dispatchSalla('login::close');
      dispatchSalla('auth::close');
      clearAction('account');
    }

    function categoriesOpen() {
      var drawer = document.querySelector('.mm-ocd.ocd-categs, .mm-ocd--right.ocd-categs, .mm-ocd');
      return Boolean(
        (document.body && document.body.classList.contains('menu-opened')) ||
        (drawer && drawer.classList.contains('mm-ocd--open'))
      );
    }

    function openCategories(item) {
      setAction('categories', item);
      var trigger = firstOutsideMenu(['a[href="#mobile-menu"]', '.veloura-menu-trigger-mobile[href="#mobile-menu"]']);
      if (!clickElement(trigger)) clearAction('categories');
    }

    function closeCategories() {
      var close = document.querySelector('.close-mobile-menu, .mm-ocd.mm-ocd--open .mm-ocd__backdrop, .mm-ocd.mm-ocd--open .mm-ocd__close');
      if (!clickElement(close)) {
        var drawer = document.querySelector('.mm-ocd.mm-ocd--open');
        if (drawer) drawer.classList.remove('mm-ocd--open');
        if (document.body) document.body.classList.remove('menu-opened');
      }
      clearAction('categories');
    }

    function findUrl(value, depth) {
      if (depth > 7 || value == null) return '';
      if (typeof value === 'string') {
        var text = value.trim();
        if (!text) return '';
        if (/^(https?:\/\/|\/|#)/i.test(text)) return text;
        return '';
      }
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i += 1) {
          var fromArray = findUrl(value[i], depth + 1);
          if (fromArray) return fromArray;
        }
        return '';
      }
      if (typeof value === 'object') {
        var preferred = ['url', 'href', 'link', 'permalink', 'value'];
        for (var p = 0; p < preferred.length; p += 1) {
          if (Object.prototype.hasOwnProperty.call(value, preferred[p])) {
            var found = findUrl(value[preferred[p]], depth + 1);
            if (found) return found;
          }
        }
        var keys = Object.keys(value);
        for (var k = 0; k < keys.length; k += 1) {
          var nested = findUrl(value[keys[k]], depth + 1);
          if (nested) return nested;
        }
      }
      return '';
    }

    function openCustom(item) {
      var payload = item.getAttribute('data-vmfm-custom-payload') || '';
      var url = item.getAttribute('data-vmfm-url') || '';
      if (!url && payload) {
        try { url = findUrl(JSON.parse(payload), 0); } catch (error) {}
      }
      if (!url) return;
      if (/^javascript:/i.test(url)) return;
      if (item.getAttribute('data-vmfm-new-tab') === 'true') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(url);
      }
    }

    function closeCurrent() {
      if (currentAction === 'search') closeSearch();
      else if (currentAction === 'account') closeAccount();
      else if (currentAction === 'categories') closeCategories();
    }

    menu.addEventListener('click', function (event) {
      var item = event.target.closest && event.target.closest('.veloura-mobile-floating-menu__item');
      if (!item || !menu.contains(item)) return;

      var action = item.getAttribute('data-vmfm-action');
      if (!action) return; /* real links keep native navigation */

      event.preventDefault();
      event.stopPropagation();

      if (action === 'custom') {
        openCustom(item);
        return;
      }

      if (currentAction === action) {
        closeCurrent();
        return;
      }

      if (currentAction) closeCurrent();

      if (action === 'search') openSearch(item);
      else if (action === 'account') openAccount(item);
      else if (action === 'categories') openCategories(item);
    });

    /* Header drawer state is authoritative even when it is opened/closed outside this menu. */
    function syncCategoriesFromBody() {
      if (categoriesOpen()) {
        var item = menu.querySelector('[data-vmfm-action="categories"]');
        if (item && currentAction !== 'categories') setAction('categories', item);
      } else if (currentAction === 'categories') {
        clearAction('categories');
      }
    }

    if (typeof MutationObserver === 'function' && document.body) {
      var bodyObserver = new MutationObserver(function () {
        syncCategoriesFromBody();
      });
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    /* Salla's modalVisibilityChanged restores route state when a native modal closes itself. */
    function bindModalVisibility(host, action) {
      if (!host || host.dataset.vmfmVisibilityBound === VERSION) return;
      host.dataset.vmfmVisibilityBound = VERSION;
      host.addEventListener('modalVisibilityChanged', function (event) {
        var detail = event && event.detail;
        var open = typeof detail === 'boolean' ? detail : detail && (detail.visible === true || detail.open === true || detail.opened === true);
        var closed = detail === false || (detail && (detail.visible === false || detail.open === false || detail.opened === false));
        if (open) {
          var item = menu.querySelector('[data-vmfm-action="' + action + '"]');
          if (item) setAction(action, item);
        } else if (closed) {
          clearAction(action);
        }
      });
    }

    bindModalVisibility(document.querySelector('salla-login-modal'), 'account');
    bindModalVisibility(document.querySelector('salla-search:not([inline])'), 'search');

    document.addEventListener('click', function (event) {
      if (!event.target.closest) return;
      if (event.target.closest('.close-mobile-menu, .mm-ocd__backdrop, .mm-ocd__close')) {
        window.setTimeout(syncCategoriesFromBody, 30);
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && currentAction) closeCurrent();
    });

    if (typeof ResizeObserver === 'function') {
      var resizeObserver = new ResizeObserver(updateIndicator);
      resizeObserver.observe(menu);
      if (inner) resizeObserver.observe(inner);
    }

    window.addEventListener('resize', updateIndicator, { passive: true });
    window.addEventListener('pageshow', restoreRoute);
    window.addEventListener('popstate', restoreRoute);
    window.addEventListener('hashchange', restoreRoute);

    restoreRoute();
    syncCategoriesFromBody();
  });
})();
