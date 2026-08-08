(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  ready(function () {
    var menu = document.querySelector('.veloura-mobile-floating-menu');
    if (!menu) return;

    var inner = menu.querySelector('.veloura-mobile-floating-menu__inner');
    var indicator = menu.querySelector('.veloura-mobile-floating-menu__indicator');
    var items = Array.prototype.slice.call(
      menu.querySelectorAll('.veloura-mobile-floating-menu__item')
    );

    var activeAction = '';
    var searchOpened = false;
    var searchReadyPromise = null;

    function closest(target, selector) {
      if (!target || target === document || target === window) return null;
      return target.closest ? target.closest(selector) : null;
    }

    function safeJsonParse(value) {
      if (!value || typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }

    function safeUrl(value) {
      if (typeof value !== 'string') return '';
      var url = value.trim();
      if (!url || url === '#') return '';
      if (/^(?:javascript|data|vbscript):/i.test(url)) return '';
      return url;
    }

    function resolveUrlValue(value, depth) {
      if (value == null || depth > 7) return '';

      if (typeof value === 'string') {
        var parsed = safeJsonParse(value);
        if (parsed !== value) return resolveUrlValue(parsed, depth + 1);
        return safeUrl(value);
      }

      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i += 1) {
          var fromArray = resolveUrlValue(value[i], depth + 1);
          if (fromArray) return fromArray;
        }
        return '';
      }

      if (typeof value === 'object') {
        var preferredKeys = [
          'url', 'href', 'link', 'permalink', 'web_url', 'target_url',
          'selected', 'selection', 'item', 'data', 'value'
        ];

        for (var k = 0; k < preferredKeys.length; k += 1) {
          var key = preferredKeys[k];
          if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
          var preferred = resolveUrlValue(value[key], depth + 1);
          if (preferred) return preferred;
        }

        var keys = Object.keys(value);
        for (var j = 0; j < keys.length; j += 1) {
          var nested = resolveUrlValue(value[keys[j]], depth + 1);
          if (nested) return nested;
        }
      }

      return '';
    }

    function resolveCustomUrl(item) {
      if (!item) return '';

      var direct = safeUrl(
        item.getAttribute('data-vmfm-custom-url') ||
        item.getAttribute('href') ||
        ''
      );
      if (direct) return direct;

      var payload = item.getAttribute('data-vmfm-link-payload');
      return payload ? resolveUrlValue(safeJsonParse(payload), 0) : '';
    }

    function comparableUrl(value) {
      var url = safeUrl(value);
      if (!url) return '';

      try {
        var parsed = new URL(url, window.location.href);
        var path = (parsed.pathname || '/').replace(/\/{2,}/g, '/');
        if (path.length > 1) path = path.replace(/\/+$/, '');
        return parsed.origin + path + (parsed.search || '');
      } catch (error) {
        return '';
      }
    }

    function sameRoute(a, b) {
      var left = comparableUrl(a);
      var right = comparableUrl(b);
      return Boolean(left && right && left === right);
    }

    function updateIndicator(item) {
      if (!indicator || !inner) return;

      if (!item) {
        indicator.classList.remove('is-visible');
        return;
      }

      window.requestAnimationFrame(function () {
        var itemRect = item.getBoundingClientRect();
        var innerRect = inner.getBoundingClientRect();
        var center = itemRect.left - innerRect.left + (itemRect.width / 2);

        indicator.style.setProperty('--vmfm-indicator-left', center + 'px');
        indicator.classList.add('is-visible');
      });
    }

    function clearActive() {
      items.forEach(function (item) {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
    }

    function activateItem(item) {
      clearActive();

      if (!item) {
        updateIndicator(null);
        return;
      }

      item.classList.add('is-active');
      item.setAttribute('aria-current', 'page');
      updateIndicator(item);
    }

    function itemForAction(action) {
      return menu.querySelector('[data-vmfm-action="' + action + '"]');
    }

    function currentRouteItem() {
      var currentHref = window.location.href;
      var customItems = menu.querySelectorAll('[data-vmfm-custom-link]');

      for (var i = 0; i < customItems.length; i += 1) {
        var customUrl = resolveCustomUrl(customItems[i]);
        if (customUrl && sameRoute(customUrl, currentHref)) return customItems[i];
      }

      if (menu.getAttribute('data-vmfm-is-home') === 'true') {
        return menu.querySelector('[data-vmfm-match="home"]');
      }

      var homeUrl = menu.getAttribute('data-vmfm-home-url') || '';
      if (homeUrl && sameRoute(homeUrl, currentHref)) {
        return menu.querySelector('[data-vmfm-match="home"]');
      }

      var pageSlug = (menu.getAttribute('data-vmfm-page-slug') || '').toLowerCase();
      var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';

      if (/\/(?:cart)(?:\/|$)/i.test(path)) {
        return menu.querySelector('[data-vmfm-match="cart"]');
      }

      if (/\/(?:search)(?:\/|$)/i.test(path)) {
        return menu.querySelector('[data-vmfm-match="search"]');
      }

      if (/\/(?:account|profile|login)(?:\/|$)/i.test(path)) {
        return menu.querySelector('[data-vmfm-match="account"]');
      }

      if (/category|categories/.test(pageSlug) || /\/(?:categories?|c)(?:\/|$)/i.test(path)) {
        return menu.querySelector('[data-vmfm-match="categories"]');
      }

      return null;
    }

    function restoreRouteActive() {
      if (activeAction) {
        var transient = itemForAction(activeAction);
        if (transient) {
          activateItem(transient);
          return;
        }
      }

      activateItem(currentRouteItem());
    }

    function setTransient(action) {
      activeAction = action;
      activateItem(itemForAction(action));
    }

    function clearTransient(action) {
      if (!action || activeAction === action) activeAction = '';
      restoreRouteActive();
    }

    function clickFirst(selectors, root) {
      var scope = root || document;

      for (var i = 0; i < selectors.length; i += 1) {
        var node = scope.querySelector(selectors[i]);
        if (!node) continue;

        try {
          node.click();
          return true;
        } catch (error) {}
      }

      return false;
    }

    function categoriesDrawer() {
      return (
        document.querySelector('.mm-ocd.ocd-categs') ||
        document.querySelector('.mm-ocd--right.ocd-categs') ||
        document.querySelector('.mm-ocd')
      );
    }

    function categoriesAreOpen() {
      var drawer = categoriesDrawer();
      return Boolean(
        drawer && (
          drawer.classList.contains('mm-ocd--open') ||
          document.body.classList.contains('menu-opened') ||
          document.body.classList.contains('mm-ocd-opened') ||
          document.body.classList.contains('veloura-ocd-bottom-active') ||
          document.body.classList.contains('veloura-side-categories-open')
        )
      );
    }

    function openCategories() {
      setTransient('categories');
      clickFirst([
        '.veloura-menu-trigger-mobile[href="#mobile-menu"]',
        'a.mburger[href="#mobile-menu"]',
        'a[href="#mobile-menu"]'
      ]);
    }

    function closeCategories() {
      var drawer = categoriesDrawer();
      if (drawer) clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop'], drawer);

      window.setTimeout(function () {
        if (!categoriesAreOpen()) clearTransient('categories');
      }, 80);
    }

    function getSearchHost() {
      var hosts = Array.prototype.slice.call(document.querySelectorAll('salla-search'));

      for (var i = hosts.length - 1; i >= 0; i -= 1) {
        if (!hosts[i].hasAttribute('inline')) return hosts[i];
      }

      return null;
    }

    function getSearchModal(host) {
      var search = host || getSearchHost();
      if (!search) return null;

      if (search.modal && typeof search.modal.close === 'function') {
        return search.modal;
      }

      try {
        var direct = search.querySelector('salla-modal.s-search-modal, salla-modal, salla-sheet');
        if (direct && typeof direct.close === 'function') return direct;
      } catch (error) {}

      try {
        var root = search.shadowRoot;
        var shadowModal = root && root.querySelector('salla-modal.s-search-modal, salla-modal, salla-sheet');
        if (shadowModal && typeof shadowModal.close === 'function') return shadowModal;
      } catch (error) {}

      return null;
    }

    function prepareSearch() {
      if (searchReadyPromise) return searchReadyPromise;

      var host = getSearchHost();
      if (!host) return Promise.resolve(null);

      searchReadyPromise = Promise.resolve()
        .then(function () {
          if (window.customElements && typeof window.customElements.whenDefined === 'function') {
            return window.customElements.whenDefined('salla-search');
          }
        })
        .then(function () {
          if (typeof host.componentOnReady === 'function') return host.componentOnReady();
        })
        .then(function () { return host; })
        .catch(function () { return host; });

      return searchReadyPromise;
    }

    function openSearch() {
      if (searchOpened) return;

      setTransient('search');
      searchOpened = true;

      var host = getSearchHost();

      if (host && typeof host.open === 'function') {
        try {
          Promise.resolve(host.open()).catch(function () {
            searchOpened = false;
            clearTransient('search');
          });
          return;
        } catch (error) {}
      }

      if (window.salla && window.salla.event && typeof window.salla.event.emit === 'function') {
        try {
          window.salla.event.emit('search::open');
          prepareSearch();
          return;
        } catch (error) {}
      }

      prepareSearch().then(function (readyHost) {
        if (!readyHost || typeof readyHost.open !== 'function') {
          searchOpened = false;
          clearTransient('search');
          return;
        }

        return Promise.resolve(readyHost.open()).catch(function () {
          searchOpened = false;
          clearTransient('search');
        });
      });
    }

    function closeSearch() {
      var host = getSearchHost();
      var modal = getSearchModal(host);

      function finish() {
        searchOpened = false;
        clearTransient('search');
      }

      if (modal && typeof modal.close === 'function') {
        try {
          Promise.resolve(modal.close()).then(finish, finish);
          return;
        } catch (error) {}
      }

      prepareSearch().then(function (readyHost) {
        var readyModal = getSearchModal(readyHost);
        if (readyModal && typeof readyModal.close === 'function') {
          try {
            Promise.resolve(readyModal.close()).then(finish, finish);
            return;
          } catch (error) {}
        }
        finish();
      });
    }

    function getLoginHost() {
      return document.querySelector('salla-login-modal');
    }

    function openLogin() {
      var host = getLoginHost();
      setTransient('login');

      if (host && typeof host.open === 'function') {
        try {
          Promise.resolve(host.open()).catch(function () {
            clearTransient('login');
          });
          return;
        } catch (error) {}
      }

      if (window.salla && window.salla.event && typeof window.salla.event.emit === 'function') {
        try {
          window.salla.event.emit('login::open');
          return;
        } catch (error) {}
      }

      clearTransient('login');
    }

    function handleAction(action) {
      if (action === 'categories') {
        if (categoriesAreOpen() || activeAction === 'categories') closeCategories();
        else openCategories();
        return;
      }

      if (action === 'search') {
        if (searchOpened || activeAction === 'search') closeSearch();
        else openSearch();
        return;
      }

      if (action === 'login') {
        if (activeAction !== 'login') openLogin();
      }
    }

    menu.addEventListener('click', function (event) {
      var item = closest(event.target, '.veloura-mobile-floating-menu__item');
      if (!item) return;

      var action = item.getAttribute('data-vmfm-action');
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        handleAction(action);
        return;
      }

      if (item.hasAttribute('data-vmfm-custom-link')) {
        var customUrl = resolveCustomUrl(item);
        if (!customUrl) {
          event.preventDefault();
          return;
        }

        activeAction = '';
        activateItem(item);

        var href = safeUrl(item.getAttribute('href') || '');
        if (!href) {
          event.preventDefault();
          if (item.getAttribute('target') === '_blank') {
            window.open(customUrl, '_blank', 'noopener');
          } else {
            window.location.assign(customUrl);
          }
        }
        return;
      }

      activeAction = '';
      activateItem(item);
    });

    var bodyObserver = new MutationObserver(function () {
      if (activeAction === 'categories' && !categoriesAreOpen()) {
        clearTransient('categories');
      }
    });

    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    document.addEventListener('click', function (event) {
      if (closest(event.target, '.veloura-mobile-floating-menu')) return;

      if (closest(event.target, '.veloura-menu-trigger-mobile[href="#mobile-menu"], a.mburger[href="#mobile-menu"]')) {
        window.setTimeout(function () {
          if (categoriesAreOpen()) setTransient('categories');
        }, 60);
      }
    }, true);

    if (window.salla && window.salla.event && typeof window.salla.event.on === 'function') {
      try {
        window.salla.event.on('modalClosed', function () {
          if (activeAction === 'search') {
            searchOpened = false;
            clearTransient('search');
          } else if (activeAction === 'login') {
            clearTransient('login');
          }
        });
      } catch (error) {}
    }

    window.addEventListener('pageshow', function () {
      activeAction = '';
      searchOpened = false;
      restoreRouteActive();
    });

    window.addEventListener('popstate', function () {
      activeAction = '';
      searchOpened = false;
      restoreRouteActive();
    });

    window.addEventListener('hashchange', function () {
      activeAction = '';
      searchOpened = false;
      restoreRouteActive();
    });

    window.addEventListener('resize', function () {
      var active = menu.querySelector('.veloura-mobile-floating-menu__item.is-active');
      updateIndicator(active);
    }, { passive: true });

    prepareSearch();
    restoreRouteActive();
  });
})();
