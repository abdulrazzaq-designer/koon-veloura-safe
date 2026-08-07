(function () {
  'use strict';

  var VERSION = 'v91';
  var MOBILE_QUERY = '(max-width: 767px)';
  var PANEL_SELECTOR = [
    'salla-login-modal',
    'salla-localization-modal',
    'salla-search:not([inline])'
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
    var indicatorFrame = 0;
    var boundVisibilityTargets = new WeakSet();

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
        var type = String(salla.config.get('user.type') || '').trim().toLowerCase();
        return Boolean(type && type !== 'guest' && type !== 'anonymous');
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

        var width = Math.max(18, Math.min(30, Math.round(activeRect.width * 0.25)));
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

    function ensurePanelCloseButton() {
      var button = document.querySelector('[data-vmfm-panel-close]');
      if (button) return button;

      button = document.createElement('button');
      button.type = 'button';
      button.className = 'veloura-vmfm-panel-close';
      button.setAttribute('data-vmfm-panel-close', '');
      button.setAttribute('aria-label', 'إغلاق');
      button.hidden = true;
      button.innerHTML = '<span aria-hidden="true">×</span>';
      document.body.appendChild(button);
      button.addEventListener('click', function () {
        if (currentAction) closeAction(currentAction);
      });
      return button;
    }

    var panelCloseButton = ensurePanelCloseButton();

    function syncPanelUi() {
      var opened = Boolean(currentAction);
      document.documentElement.classList.toggle('veloura-vmfm-panel-open', opened);
      if (document.body) {
        document.body.classList.toggle('veloura-vmfm-panel-open', opened);
        if (opened) document.body.setAttribute('data-vmfm-open-panel', currentAction);
        else document.body.removeAttribute('data-vmfm-open-panel');
      }

      if (panelCloseButton) {
        var showClose = currentAction === 'search';
        panelCloseButton.hidden = !showClose;
        panelCloseButton.classList.toggle('is-visible', showClose);
      }
    }

    function setAction(action, item) {
      currentAction = action || '';
      currentItem = item || null;
      if (currentItem) activate(currentItem);
      syncPanelUi();
    }

    function clearAction(action) {
      if (action && currentAction && action !== currentAction) return;
      currentAction = '';
      currentItem = null;
      syncPanelUi();
      window.setTimeout(restoreRoute, 50);
    }

    function strictOpened(event) {
      if (!event) return null;
      if (typeof event.detail === 'boolean') return event.detail;
      if (event.detail && typeof event.detail.visible === 'boolean') return event.detail.visible;
      if (event.detail && typeof event.detail.open === 'boolean') return event.detail.open;
      if (event.detail && typeof event.detail.opened === 'boolean') return event.detail.opened;
      return null;
    }

    function actionForHost(host) {
      if (!host || !host.matches) return '';
      if (host.matches('salla-login-modal')) return 'account';
      if (host.matches('salla-search:not([inline])')) return 'search';
      if (host.matches('salla-localization-modal')) return 'localization';
      return '';
    }

    function bindVisibilityTarget(target, action) {
      if (!target || boundVisibilityTargets.has(target)) return;
      boundVisibilityTargets.add(target);
      target.addEventListener('modalVisibilityChanged', function (event) {
        var opened = strictOpened(event);
        if (opened === null) return;
        if (opened) {
          var item = menu.querySelector('[data-vmfm-action="' + action + '"], [data-vmfm-match="' + action + '"]');
          setAction(action, item);
        } else {
          clearAction(action);
        }
      });
    }

    function walkShadow(root, callback) {
      if (!root || !root.querySelectorAll) return;
      var elements = root.querySelectorAll('*');
      for (var index = 0; index < elements.length; index += 1) {
        var element = elements[index];
        callback(element);
        if (element.shadowRoot) walkShadow(element.shadowRoot, callback);
      }
    }

    function bindPanel(host) {
      if (!host) return;
      var action = actionForHost(host);
      if (!action) return;
      bindVisibilityTarget(host, action);

      var finalize = function () {
        if (!host.shadowRoot) return;
        walkShadow(host.shadowRoot, function (element) {
          if (element.matches && element.matches('salla-modal, salla-sheet')) {
            bindVisibilityTarget(element, action);
          }
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
    }

    function clickFirst(selectors, root) {
      var scope = root || document;
      for (var index = 0; index < selectors.length; index += 1) {
        var element = scope.querySelector && scope.querySelector(selectors[index]);
        if (!element) continue;
        try {
          element.click();
          return true;
        } catch (error) {}
      }
      return false;
    }

    function closeHostDeep(host) {
      if (!host) return false;
      var closed = false;
      var closeElement = function (element) {
        if (!element || typeof element.close !== 'function') return;
        try {
          element.close();
          closed = true;
        } catch (error) {}
      };

      closeElement(host);
      if (host.shadowRoot) {
        walkShadow(host.shadowRoot, function (element) {
          if (element.matches && element.matches('salla-modal, salla-sheet')) closeElement(element);
        });

        if (!closed) {
          closed = clickFirst([
            '[part~="close"]',
            '[data-close]',
            '.s-modal-close',
            '.s-modal-close-button',
            '.s-search-close',
            'button[aria-label="إغلاق"]',
            'button[aria-label="Close"]'
          ], host.shadowRoot);
        }
      }
      return closed;
    }

    function openSearch(item) {
      setAction('search', item);
      if (!dispatchSalla('search::open')) {
        clickFirst(['.veloura-search-toggle', '[data-search-open]', '[data-open-search]']);
      }
      window.setTimeout(function () {
        scanPanels(document);
      }, 100);
    }

    function closeSearch() {
      var host = document.querySelector('salla-search:not([inline])');
      closeHostDeep(host);
      dispatchSalla('search::close');
      clearAction('search');
    }

    function openLogin(item) {
      if (userIsLoggedIn()) {
        window.location.assign(menu.dataset.vmfmAccountUrl || '/profile');
        return;
      }

      setAction('account', item);
      var host = document.querySelector('salla-login-modal');
      var fallback = function () {
        if (!dispatchSalla('login::open')) clearAction('account');
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
          if (result && typeof result.catch === 'function') {
            result.catch(function () {
              fallback();
            });
          }
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

      if (window.customElements && typeof customElements.whenDefined === 'function') {
        customElements.whenDefined('salla-login-modal').then(open).catch(fallback);
        return;
      }

      open();
    }

    function closeLogin() {
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
      var drawer = window.__velouraNativeMobileMenuDrawer;
      if (drawer && typeof drawer.open === 'function') {
        try {
          if (document.body) document.body.classList.add('menu-opened');
          drawer.open();
          return;
        } catch (error) {}
      }

      clickFirst([
        '.veloura-menu-trigger-mobile[href="#mobile-menu"]',
        'a.mburger[href="#mobile-menu"]',
        'a[href="#mobile-menu"]'
      ]);
    }

    function closeCategories() {
      var drawer = window.__velouraNativeMobileMenuDrawer;
      if (document.body) document.body.classList.remove('menu-opened');
      if (drawer && typeof drawer.close === 'function') {
        try {
          drawer.close();
        } catch (error) {}
      } else {
        var host = document.querySelector('.mm-ocd.mm-ocd--open, .mm-ocd');
        if (host) clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop', '.mm-ocd__close'], host);
      }
      clearAction('categories');
    }

    function openLocalization(item) {
      setAction('localization', item);
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
      closeHostDeep(document.querySelector('salla-localization-modal'));
      clearAction('localization');
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
        syncPanelUi();
        return;
      }

      /* Own action buttons in capture phase so no legacy handler can navigate/reload. */
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

      if (currentAction === action || (action === 'categories' && categoriesOpen())) {
        closeAction(action);
        return;
      }

      if (currentAction) closeAction(currentAction);
      openAction(action, item);
    }, true);

    document.addEventListener('click', function (event) {
      if (!currentAction || currentAction !== 'categories') return;
      if (!event.target.closest) return;
      if (event.target.closest('.close-mobile-menu, .mm-ocd__backdrop, .mm-ocd__close')) {
        window.setTimeout(function () {
          if (!categoriesOpen()) clearAction('categories');
        }, 0);
      }
    }, true);

    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) scanPanels(node);
          });
        });

        if (currentAction === 'categories' && !categoriesOpen()) clearAction('categories');
        updateIndicator();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'open', 'visible']
      });
    }

    if (typeof ResizeObserver === 'function') {
      var resizeObserver = new ResizeObserver(function () {
        updateIndicator();
      });
      resizeObserver.observe(menu);
      if (inner) resizeObserver.observe(inner);
    }

    window.addEventListener('resize', updateIndicator, { passive: true });
    window.addEventListener('pageshow', restoreRoute);
    window.addEventListener('popstate', restoreRoute);
    window.addEventListener('hashchange', restoreRoute);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && currentAction) closeAction(currentAction);
    });

    scanPanels(document);
    restoreRoute();
    syncPanelUi();
  }

  domReady(function () {
    if (window.salla && typeof salla.onReady === 'function') salla.onReady(boot);
    else boot();
  });
})();
