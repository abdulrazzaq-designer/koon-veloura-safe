(function () {
  'use strict';

  var VERSION = 'v93';
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

    function setAction(action, item) {
      currentAction = action || '';
      currentItem = item || null;
      if (currentItem) activate(currentItem);
    }

    function clearAction(action) {
      if (action && currentAction && action !== currentAction) return;
      currentAction = '';
      currentItem = null;
      window.setTimeout(restoreRoute, 20);
    }

    function whenDefined(name) {
      if (!window.customElements || typeof window.customElements.whenDefined !== 'function') {
        return Promise.resolve();
      }
      return window.customElements.whenDefined(name);
    }

    function componentReady(host) {
      if (!host || typeof host.componentOnReady !== 'function') return Promise.resolve(host);
      try {
        return Promise.resolve(host.componentOnReady()).then(function () { return host; });
      } catch (error) {
        return Promise.resolve(host);
      }
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

    function findNativeModal(host) {
      if (!host) return null;

      /* Stencil private refs sometimes remain reachable on the host. */
      if (host.modal && typeof host.modal.close === 'function') return host.modal;

      var found = null;
      function inspect(root) {
        if (!root || found || !root.querySelectorAll) return;
        var direct = root.querySelector('salla-modal, salla-sheet');
        if (direct && typeof direct.close === 'function') {
          found = direct;
          return;
        }
        walkShadow(root, function (node) {
          if (found || !node || !node.matches) return;
          if (node.matches('salla-modal, salla-sheet') && typeof node.close === 'function') {
            found = node;
          }
        });
      }

      inspect(host.shadowRoot);
      return found;
    }

    function waitForNativeModal(host, timeout) {
      var limit = Date.now() + (timeout || 1600);
      return new Promise(function (resolve) {
        function check() {
          var modal = findNativeModal(host);
          if (modal || Date.now() >= limit) {
            resolve(modal || null);
            return;
          }
          window.setTimeout(check, 40);
        }
        check();
      });
    }

    function nativeCloseButton(host) {
      if (!host || !host.shadowRoot) return null;
      var found = null;
      var selectors = [
        '[part~="close"]',
        '[data-close]',
        '.s-modal-close',
        '.s-modal-close-button',
        '.s-search-close',
        'button[aria-label="إغلاق"]',
        'button[aria-label="Close"]'
      ];

      function inspect(root) {
        if (!root || found || !root.querySelectorAll) return;
        for (var i = 0; i < selectors.length; i += 1) {
          var candidate = root.querySelector(selectors[i]);
          if (candidate) {
            found = candidate;
            return;
          }
        }
        walkShadow(root, function (node) {
          if (found || !node || !node.shadowRoot) return;
          inspect(node.shadowRoot);
        });
      }

      inspect(host.shadowRoot);
      return found;
    }

    function modalLooksOpen(modal) {
      if (!modal) return false;
      if (modal.open === true || modal.opened === true || modal.visible === true) return true;
      if (modal.hasAttribute && (modal.hasAttribute('open') || modal.hasAttribute('opened'))) return true;
      if (modal.classList && (modal.classList.contains('is-open') || modal.classList.contains('s-modal-is-open'))) return true;
      try {
        var style = window.getComputedStyle(modal);
        var rect = modal.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 1 && rect.height > 1;
      } catch (error) {
        return false;
      }
    }

    function bindNativeModal(modal, action) {
      if (!modal || modal.dataset.vmfmNativeBound === VERSION) return;
      modal.dataset.vmfmNativeBound = VERSION;
      modal.addEventListener('modalVisibilityChanged', function (event) {
        var detail = event && event.detail;
        var opened = detail === true || (detail && (detail.visible === true || detail.open === true || detail.opened === true));
        var closed = detail === false || (detail && (detail.visible === false || detail.open === false || detail.opened === false));
        if (opened) {
          var item = menu.querySelector('[data-vmfm-action="' + action + '"]');
          if (item) setAction(action, item);
        } else if (closed) {
          clearAction(action);
        }
      });
    }

    function closeNativeHost(host, action) {
      if (!host) return Promise.resolve(false);
      return waitForNativeModal(host, 900).then(function (modal) {
        if (modal) {
          bindNativeModal(modal, action);
          try {
            var result = modal.close();
            return Promise.resolve(result).then(function () { return true; }, function () { return false; });
          } catch (error) {}
        }

        var button = nativeCloseButton(host);
        if (button) return clickElement(button);
        return false;
      });
    }

    /* Search: call Salla's web component directly. No synthetic X button. */
    function openSearch(item) {
      var host = document.querySelector('salla-search:not([inline])');
      if (!host) return;

      setAction('search', item);
      whenDefined('salla-search')
        .then(function () { return componentReady(host); })
        .then(function () {
          if (typeof host.open !== 'function') throw new Error('salla-search.open is unavailable');
          return host.open();
        })
        .then(function () { return waitForNativeModal(host, 1600); })
        .then(function (modal) {
          if (modal) bindNativeModal(modal, 'search');
        })
        .catch(function () {
          clearAction('search');
        });
    }

    function closeSearch() {
      var host = document.querySelector('salla-search:not([inline])');
      if (!host) {
        clearAction('search');
        return;
      }

      closeNativeHost(host, 'search').then(function (closed) {
        /* Never pretend the search closed. Clear only after a real close path. */
        if (closed) window.setTimeout(function () { clearAction('search'); }, 80);
      });
    }

    /* Account: use the documented salla-login-modal.open() API directly. */
    function openAccount(item) {
      var host = document.querySelector('salla-login-modal');
      if (!host) return;

      setAction('account', item);
      whenDefined('salla-login-modal')
        .then(function () { return componentReady(host); })
        .then(function () {
          if (typeof host.open !== 'function') throw new Error('salla-login-modal.open is unavailable');
          return host.open();
        })
        .then(function () { return waitForNativeModal(host, 1600); })
        .then(function (modal) {
          if (modal) bindNativeModal(modal, 'account');
        })
        .catch(function () {
          clearAction('account');
        });
    }

    function closeAccount() {
      var host = document.querySelector('salla-login-modal');
      if (!host) {
        clearAction('account');
        return;
      }

      closeNativeHost(host, 'account').then(function (closed) {
        if (closed) window.setTimeout(function () { clearAction('account'); }, 80);
      });
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

    /* Native modal visibility is bound lazily after each Salla component opens. */

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
