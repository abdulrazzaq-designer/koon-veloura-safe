(function () {
  'use strict';

  var VERSION = 'v90';
  var MOBILE_QUERY = '(max-width: 767px)';
  var SAFE_STYLE_ID = 'veloura-v90-menu-safe-space';
  var PANEL_SELECTOR = [
    'salla-login-modal',
    'salla-localization-modal',
    'salla-search:not([inline])',
    'salla-modal',
    'salla-sheet',
    'salla-user-menu',
    'salla-scopes'
  ].join(',');

  function domReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function boot() {
    var menu = document.querySelector('.veloura-mobile-floating-menu');
    if (!menu || menu.dataset.vmfmBound === VERSION) return;

    menu.dataset.vmfmBound = VERSION;
    menu.dataset.vmfmController = VERSION;

    var inner = menu.querySelector('.veloura-mobile-floating-menu__inner');
    var indicator = menu.querySelector('.veloura-mobile-floating-menu__indicator');
    var currentAction = '';
    var currentItem = null;
    var actionResetTimer = 0;
    var indicatorFrame = 0;
    var panelOpenKeys = new Set();
    var boundPanels = new WeakSet();

    function isMobile() {
      return window.matchMedia ? window.matchMedia(MOBILE_QUERY).matches : window.innerWidth <= 767;
    }

    function dispatchSalla(name, detail) {
      if (!window.salla || !salla.event || typeof salla.event.dispatch !== 'function') return false;
      try {
        salla.event.dispatch(name, detail);
        return true;
      } catch (error) {
        return false;
      }
    }

    function normalizePath(value) {
      var path = String(value || '/').split('?')[0].split('#')[0];
      path = path.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
      return path || '/';
    }

    function pathFromUrl(value) {
      try {
        return normalizePath(new URL(value || '/', window.location.href).pathname);
      } catch (error) {
        return normalizePath(value);
      }
    }

    function userIsLoggedIn() {
      try {
        if (!window.salla || !salla.config || typeof salla.config.get !== 'function') return false;
        var type = String(salla.config.get('user.type') || '').toLowerCase();
        var id = salla.config.get('user.id');
        var logged = salla.config.get('user.is_logged_in');
        return Boolean(
          id ||
          logged === true || logged === 'true' || logged === 1 || logged === '1' ||
          type === 'user' || type === 'customer' || type === 'member'
        );
      } catch (error) {
        return false;
      }
    }

    function allItems() {
      return Array.prototype.slice.call(menu.querySelectorAll('.veloura-mobile-floating-menu__item'));
    }

    function clearActive() {
      allItems().forEach(function (item) {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
    }

    function updateIndicator() {
      if (!inner || !indicator) return;
      if (indicatorFrame) window.cancelAnimationFrame(indicatorFrame);

      indicatorFrame = window.requestAnimationFrame(function () {
        indicatorFrame = 0;
        var active = menu.querySelector('.veloura-mobile-floating-menu__item.is-active');
        if (!active || !isMobile()) {
          indicator.classList.remove('is-visible');
          return;
        }

        var innerRect = inner.getBoundingClientRect();
        var activeRect = active.getBoundingClientRect();
        if (!innerRect.width || !activeRect.width) {
          indicator.classList.remove('is-visible');
          return;
        }

        var width = Math.max(16, Math.min(28, Math.round(activeRect.width * 0.24)));
        var x = Math.round(activeRect.left - innerRect.left + ((activeRect.width - width) / 2));
        indicator.style.width = width + 'px';
        indicator.style.transform = 'translate3d(' + x + 'px, 0, 0)';
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
        slug.indexOf('login') !== -1 ||
        path.indexOf('/profile') !== -1 ||
        path.indexOf('/account') !== -1 ||
        path.indexOf('/login') !== -1
      ) {
        item = menu.querySelector('[data-vmfm-match="account"]');
      }

      if (!item) {
        var customItems = menu.querySelectorAll('[data-vmfm-url]');
        for (var index = 0; index < customItems.length; index += 1) {
          if (pathFromUrl(customItems[index].getAttribute('data-vmfm-url')) === path) {
            item = customItems[index];
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

    function syncPanelClass() {
      var opened = panelOpenKeys.size > 0;
      document.documentElement.classList.toggle('veloura-vmfm-panel-open', opened);
      if (document.body) {
        document.body.classList.toggle('veloura-vmfm-panel-open', opened);
        if (opened) document.body.setAttribute('data-vmfm-open-panels', Array.from(panelOpenKeys).join(' '));
        else document.body.removeAttribute('data-vmfm-open-panels');
      }
    }

    function markPanel(key, opened) {
      if (opened) panelOpenKeys.add(key);
      else panelOpenKeys.delete(key);
      syncPanelClass();
    }

    function syncOverlap() {
      if (!inner || !isMobile()) return;
      var rect = inner.getBoundingClientRect();
      var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var overlap = rect.width && rect.height ? Math.max(0, Math.ceil(viewportHeight - rect.top + 8)) : 0;
      document.documentElement.style.setProperty('--veloura-vmfm-panel-overlap', overlap + 'px');
      if (document.body) document.body.style.setProperty('--veloura-vmfm-panel-overlap', overlap + 'px');
      document.querySelectorAll(PANEL_SELECTOR).forEach(function (host) {
        host.style.setProperty('--veloura-vmfm-panel-overlap', overlap + 'px');
      });
    }

    function eventOpened(event) {
      if (typeof event.detail === 'boolean') return event.detail;
      if (event.detail && typeof event.detail.visible === 'boolean') return event.detail.visible;
      if (event.detail && typeof event.detail.open === 'boolean') return event.detail.open;
      return Boolean(event.detail);
    }

    function panelKey(host) {
      if (!host) return 'panel';
      if (host.matches('salla-login-modal')) return 'account';
      if (host.matches('salla-search:not([inline])')) return 'search';
      if (host.matches('salla-localization-modal')) return 'localization';
      return 'panel-' + host.localName;
    }

    function actionForPanel(host) {
      var key = panelKey(host);
      return key === 'account' || key === 'search' || key === 'localization' ? key : '';
    }

    function injectSafeSpace(host) {
      if (!host || !host.shadowRoot) return;
      var root = host.shadowRoot;
      var style = root.getElementById(SAFE_STYLE_ID);
      if (!style) {
        style = document.createElement('style');
        style.id = SAFE_STYLE_ID;
        root.appendChild(style);
      }
      style.textContent = [
        '@media (max-width: 767px) {',
        '  salla-modal::part(body),',
        '  salla-modal::part(content),',
        '  salla-sheet::part(body),',
        '  salla-sheet::part(content),',
        '  [part~="body"],',
        '  .s-salla-modal-body,',
        '  .s-modal-body,',
        '  .s-sheet-body {',
        '    box-sizing: border-box !important;',
        '    padding-bottom: calc(var(--veloura-vmfm-panel-overlap, 0px) + 12px) !important;',
        '    scroll-padding-bottom: calc(var(--veloura-vmfm-panel-overlap, 0px) + 12px) !important;',
        '  }',
        '}'
      ].join('\n');
    }

    function bindPanel(host) {
      if (!host || boundPanels.has(host)) return;
      boundPanels.add(host);

      var key = panelKey(host);
      var action = actionForPanel(host);
      var listener = function (event) {
        var opened = eventOpened(event);
        markPanel(key, opened);
        syncOverlap();

        if (opened && action) {
          currentAction = action;
          currentItem = menu.querySelector('[data-vmfm-action="' + action + '"], [data-vmfm-match="' + action + '"]');
          activate(currentItem);
        } else if (!opened && action && currentAction === action) {
          currentAction = '';
          currentItem = null;
          restoreRoute();
        }
      };

      host.addEventListener('modalVisibilityChanged', listener);

      var finalize = function () {
        injectSafeSpace(host);
        var root = host.shadowRoot;
        if (!root) return;
        root.querySelectorAll('salla-modal, salla-sheet').forEach(function (nested) {
          if (boundPanels.has(nested)) return;
          boundPanels.add(nested);
          nested.addEventListener('modalVisibilityChanged', listener);
        });
      };

      finalize();
      if (typeof host.componentOnReady === 'function') {
        try {
          var ready = host.componentOnReady();
          if (ready && typeof ready.then === 'function') ready.then(finalize).catch(function () {});
        } catch (error) {}
      }
      if (window.customElements && typeof customElements.whenDefined === 'function') {
        customElements.whenDefined(host.localName).then(finalize).catch(function () {});
      }
    }

    function scanPanels(scope) {
      var root = scope || document;
      if (root.matches && root.matches(PANEL_SELECTOR)) bindPanel(root);
      if (root.querySelectorAll) root.querySelectorAll(PANEL_SELECTOR).forEach(bindPanel);
      syncOverlap();
    }

    function beginAction(action, item) {
      if (actionResetTimer) window.clearTimeout(actionResetTimer);
      currentAction = action;
      currentItem = item;
      activate(item);
      markPanel(action, true);
      syncOverlap();
      actionResetTimer = window.setTimeout(function () {
        if (currentAction !== action) return;
        markPanel(action, false);
        currentAction = '';
        currentItem = null;
        restoreRoute();
      }, 10000);
    }

    function finishAction(action) {
      if (actionResetTimer) window.clearTimeout(actionResetTimer);
      actionResetTimer = 0;
      markPanel(action, false);
      if (!action || currentAction === action) {
        currentAction = '';
        currentItem = null;
      }
      window.setTimeout(restoreRoute, 120);
    }

    function clickFirst(selectors, scope) {
      var root = scope || document;
      for (var index = 0; index < selectors.length; index += 1) {
        var element = root.querySelector(selectors[index]);
        if (!element) continue;
        try {
          element.click();
          return true;
        } catch (error) {}
      }
      return false;
    }

    function closeHost(host) {
      if (!host) return false;
      var closed = false;

      if (typeof host.close === 'function') {
        try {
          host.close();
          closed = true;
        } catch (error) {}
      }

      var root = host.shadowRoot || host;
      root.querySelectorAll('salla-modal, salla-sheet').forEach(function (nested) {
        if (typeof nested.close !== 'function') return;
        try {
          nested.close();
          closed = true;
        } catch (error) {}
      });

      if (!closed) {
        closed = clickFirst([
          '[part~="close"]',
          '[data-close]',
          '.s-modal-close',
          '.s-modal-close-button',
          'button[aria-label="إغلاق"]',
          'button[aria-label="Close"]'
        ], root);
      }

      return closed;
    }

    function openSearch(item) {
      beginAction('search', item);
      if (!dispatchSalla('search::open')) {
        clickFirst(['.veloura-search-toggle', '[data-search-open]', '[data-open-search]']);
      }
    }

    function closeSearch() {
      closeHost(document.querySelector('salla-search:not([inline])'));
      dispatchSalla('search::close');
      finishAction('search');
    }

    function openLogin(item) {
      if (userIsLoggedIn()) {
        window.location.assign(menu.dataset.vmfmAccountUrl || '/profile');
        return;
      }

      beginAction('account', item);
      var host = document.querySelector('salla-login-modal');
      var fallback = function () {
        if (!dispatchSalla('login::open')) clickFirst(['.veloura-login-btn', '[data-login]', '[data-open-login]']);
      };

      if (!host) {
        fallback();
        return;
      }

      var open = function () {
        if (typeof host.open !== 'function') {
          fallback();
          return;
        }
        try {
          var result = host.open();
          if (result && typeof result.catch === 'function') result.catch(fallback);
        } catch (error) {
          fallback();
        }
      };

      if (typeof host.componentOnReady === 'function') {
        try {
          var ready = host.componentOnReady();
          if (ready && typeof ready.then === 'function') {
            ready.then(open).catch(fallback);
            return;
          }
        } catch (error) {}
      }
      open();
    }

    function closeLogin() {
      closeHost(document.querySelector('salla-login-modal'));
      dispatchSalla('login::close');
      dispatchSalla('auth::close');
      finishAction('account');
    }

    function getCategoriesDrawer() {
      return document.querySelector('.mm-ocd.ocd-categs, .mm-ocd--right.ocd-categs, .mm-ocd');
    }

    function categoriesOpen() {
      var drawer = getCategoriesDrawer();
      return Boolean(drawer && drawer.classList.contains('mm-ocd--open'));
    }

    function openCategories(item) {
      beginAction('categories', item);
      clickFirst([
        '.veloura-menu-trigger-mobile[href="#mobile-menu"]',
        'a.mburger[href="#mobile-menu"]',
        'a[href="#mobile-menu"]'
      ]);
    }

    function closeCategories() {
      var drawer = getCategoriesDrawer();
      if (drawer) clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop', '.mm-ocd__close'], drawer);
      finishAction('categories');
    }

    function openLocalization(item) {
      beginAction('localization', item);
      var host = document.querySelector('salla-localization-modal');
      if (host && typeof host.open === 'function') {
        try {
          host.open();
          return;
        } catch (error) {}
      }
      clickFirst(['[data-veloura-localization-trigger]', '.veloura-lang-mobile', '.veloura-lang-desktop']);
    }

    function closeLocalization() {
      closeHost(document.querySelector('salla-localization-modal'));
      finishAction('localization');
    }

    function closeAction(action) {
      if (action === 'search') closeSearch();
      else if (action === 'account') closeLogin();
      else if (action === 'categories') closeCategories();
      else if (action === 'localization') closeLocalization();
    }

    function openAction(action, item) {
      if (action === 'search') openSearch(item);
      else if (action === 'account') openLogin(item);
      else if (action === 'categories') openCategories(item);
      else if (action === 'localization') openLocalization(item);
    }

    menu.addEventListener('click', function (event) {
      var item = event.target.closest && event.target.closest('.veloura-mobile-floating-menu__item');
      if (!item || !menu.contains(item)) return;

      var action = item.dataset.vmfmAction || '';
      if (!action) {
        currentAction = '';
        currentItem = null;
        return;
      }

      event.preventDefault();

      if (currentAction === action || (action === 'categories' && categoriesOpen())) {
        closeAction(action);
        return;
      }

      if (currentAction) closeAction(currentAction);
      openAction(action, item);
    });

    document.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('[data-veloura-localization-trigger]')) {
        markPanel('localization', true);
        syncOverlap();
      }
    }, true);

    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) scanPanels(node);
          });
        });

        if (currentAction === 'categories' && !categoriesOpen()) finishAction('categories');
        updateIndicator();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'open', 'visible'] });
    }

    if (typeof ResizeObserver === 'function') {
      var resizeObserver = new ResizeObserver(function () {
        updateIndicator();
        syncOverlap();
      });
      resizeObserver.observe(menu);
      if (inner) resizeObserver.observe(inner);
    }

    window.addEventListener('resize', function () {
      updateIndicator();
      syncOverlap();
    }, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', syncOverlap, { passive: true });
    window.addEventListener('pageshow', restoreRoute);
    window.addEventListener('popstate', restoreRoute);
    window.addEventListener('hashchange', restoreRoute);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && currentAction) closeAction(currentAction);
    });

    scanPanels(document);
    restoreRoute();
    syncOverlap();
  }

  domReady(function () {
    if (window.salla && typeof salla.onReady === 'function') salla.onReady(boot);
    else boot();
  });
})();
