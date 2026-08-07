(function () {
  'use strict';

  var VERSION = 'v94';

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

    menu.setAttribute('data-vmfm-runtime', VERSION);

    var items = Array.prototype.slice.call(
      menu.querySelectorAll('.veloura-mobile-floating-menu__item')
    );

    var activeAction = '';
    var boundModals = typeof WeakSet === 'function' ? new WeakSet() : null;
    var stateTimer = null;

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
      var trimmed = value.trim();
      if (!trimmed || trimmed === '#') return '';
      if (/^(?:javascript|data|vbscript):/i.test(trimmed)) return '';
      return trimmed;
    }

    function resolveUrlValue(value, depth) {
      if (depth > 7 || value == null) return '';

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
        var priorityKeys = [
          'url', 'href', 'link', 'permalink', 'web_url', 'target_url',
          'selected', 'selection', 'item', 'data', 'value'
        ];

        for (var k = 0; k < priorityKeys.length; k += 1) {
          var key = priorityKeys[k];
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            var preferred = resolveUrlValue(value[key], depth + 1);
            if (preferred) return preferred;
          }
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

      var direct = safeUrl(item.getAttribute('href') || '');
      if (direct) return direct;

      var payload = item.getAttribute('data-vmfm-link-payload');
      if (!payload) return '';

      return resolveUrlValue(safeJsonParse(payload), 0);
    }

    function comparableUrl(value) {
      var url = safeUrl(value);
      if (!url) return '';

      try {
        var parsed = new URL(url, window.location.href);
        var pathname = (parsed.pathname || '/').replace(/\/{2,}/g, '/');
        if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
        return parsed.origin + pathname + (parsed.search || '');
      } catch (error) {
        return '';
      }
    }

    function sameRoute(a, b) {
      var left = comparableUrl(a);
      var right = comparableUrl(b);
      return Boolean(left && right && left === right);
    }

    function clearActive() {
      items.forEach(function (item) {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
    }

    function activateItem(item) {
      clearActive();
      if (!item) return;
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'page');
    }

    function itemForAction(action) {
      var selector = '[data-vmfm-action="' + action + '"]';
      return menu.querySelector(selector);
    }

    function routeFallbackItem() {
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

      if (/\/(?:categories?|c)(?:\/|$)/i.test(path)) {
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
      activateItem(routeFallbackItem());
    }

    function setTransient(action) {
      activeAction = action;
      activateItem(itemForAction(action));
    }

    function clearTransient(action) {
      if (!action || activeAction === action) activeAction = '';
      window.setTimeout(restoreRouteActive, 40);
    }

    function getCategoriesDrawer() {
      return (
        document.querySelector('.mm-ocd.ocd-categs') ||
        document.querySelector('.mm-ocd--right.ocd-categs') ||
        document.querySelector('.mm-ocd')
      );
    }

    function categoriesAreOpen() {
      var drawer = getCategoriesDrawer();
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

    function clickFirst(selectors, root) {
      var scope = root || document;
      for (var i = 0; i < selectors.length; i += 1) {
        var node = scope.querySelector(selectors[i]);
        if (!node) continue;
        try {
          node.click();
          return true;
        } catch (error) {
          // Continue to the next native trigger.
        }
      }
      return false;
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
      var drawer = getCategoriesDrawer();
      if (drawer) {
        clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop'], drawer);
      }
      window.setTimeout(function () {
        if (!categoriesAreOpen()) clearTransient('categories');
      }, 120);
    }

    function preferredSearchHost() {
      var hosts = Array.prototype.slice.call(document.querySelectorAll('salla-search'));
      for (var i = 0; i < hosts.length; i += 1) {
        if (!hosts[i].hasAttribute('inline')) return hosts[i];
      }
      return hosts.length ? hosts[hosts.length - 1] : null;
    }

    function loginHost() {
      return document.querySelector('salla-login-modal');
    }

    function deepFind(root, predicate, depth) {
      if (!root || depth > 7) return null;

      var nodes;
      try {
        nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
      } catch (error) {
        nodes = [];
      }

      for (var i = 0; i < nodes.length; i += 1) {
        if (predicate(nodes[i])) return nodes[i];
      }

      for (var j = 0; j < nodes.length; j += 1) {
        if (nodes[j].shadowRoot) {
          var nested = deepFind(nodes[j].shadowRoot, predicate, depth + 1);
          if (nested) return nested;
        }
      }

      return null;
    }

    function findClosableModal(host) {
      if (!host) return null;
      var root = host.shadowRoot || host;
      return deepFind(root, function (node) {
        var tag = (node.tagName || '').toLowerCase();
        return (tag === 'salla-modal' || tag === 'salla-sheet') && typeof node.close === 'function';
      }, 0);
    }

    function clickNativeClose(host) {
      if (!host) return false;
      var root = host.shadowRoot || host;
      var node = deepFind(root, function (candidate) {
        if (!candidate.matches) return false;
        return candidate.matches([
          '[part~="close"]',
          '.s-modal-close',
          '.s-modal__close',
          '.sicon-cancel',
          'button[aria-label*="إغلاق"]',
          'button[aria-label*="close" i]'
        ].join(','));
      }, 0);

      if (!node) return false;
      try {
        node.click();
        return true;
      } catch (error) {
        return false;
      }
    }

    function bindModalVisibility(action, host, attempts) {
      if (!host || attempts > 18) return;

      var modal = findClosableModal(host);
      if (!modal) {
        window.setTimeout(function () {
          bindModalVisibility(action, host, attempts + 1);
        }, 100);
        return;
      }

      if (boundModals && boundModals.has(modal)) return;
      if (boundModals) boundModals.add(modal);

      modal.addEventListener('modalVisibilityChanged', function (event) {
        var opened = event && typeof event.detail === 'boolean' ? event.detail : null;
        if (opened === false) clearTransient(action);
        if (opened === true) setTransient(action);
      });
    }

    function defineThen(tagName, callback) {
      if (!window.customElements || typeof window.customElements.whenDefined !== 'function') {
        callback();
        return;
      }

      window.customElements.whenDefined(tagName).then(callback).catch(callback);
    }

    function openSearch(item) {
      setTransient('search');

      defineThen('salla-search', function () {
        var host = preferredSearchHost();
        if (host && typeof host.open === 'function') {
          Promise.resolve(host.open()).then(function () {
            bindModalVisibility('search', host, 0);
          }).catch(function () {
            clickFirst(['.veloura-search-toggle', '[onclick*="search::open"]']);
          });
          return;
        }

        if (clickFirst(['.veloura-search-toggle', '[onclick*="search::open"]'])) return;

        var fallback = item && item.getAttribute('href');
        if (fallback) window.location.href = fallback;
      });
    }

    function closeSearch() {
      var host = preferredSearchHost();
      var modal = findClosableModal(host);

      if (modal) {
        Promise.resolve(modal.close()).finally(function () {
          clearTransient('search');
        });
        return;
      }

      if (clickNativeClose(host)) {
        window.setTimeout(function () { clearTransient('search'); }, 120);
        return;
      }

      if (window.salla && window.salla.event && typeof window.salla.event.dispatch === 'function') {
        try { window.salla.event.dispatch('search::close'); } catch (error) {}
      }
      window.setTimeout(function () { clearTransient('search'); }, 120);
    }

    function openLogin() {
      setTransient('login');

      defineThen('salla-login-modal', function () {
        var host = loginHost();
        if (!host || typeof host.open !== 'function') {
          clickFirst(['.veloura-login-btn', '[onclick*="login::open"]']);
          return;
        }

        Promise.resolve(host.open()).then(function () {
          bindModalVisibility('login', host, 0);
        }).catch(function () {
          clickFirst(['.veloura-login-btn', '[onclick*="login::open"]']);
        });
      });
    }

    function closeLogin() {
      var host = loginHost();
      var modal = findClosableModal(host);

      if (modal) {
        Promise.resolve(modal.close()).finally(function () {
          clearTransient('login');
        });
        return;
      }

      if (clickNativeClose(host)) {
        window.setTimeout(function () { clearTransient('login'); }, 120);
        return;
      }

      if (window.salla && window.salla.event && typeof window.salla.event.dispatch === 'function') {
        try { window.salla.event.dispatch('login::close'); } catch (error) {}
      }
      window.setTimeout(function () { clearTransient('login'); }, 120);
    }

    function toggleAction(action, item) {
      if (activeAction === action) {
        if (action === 'search') closeSearch();
        if (action === 'login') closeLogin();
        if (action === 'categories') closeCategories();
        return;
      }

      if (activeAction === 'search') closeSearch();
      if (activeAction === 'login') closeLogin();
      if (activeAction === 'categories' && categoriesAreOpen()) closeCategories();

      if (action === 'search') openSearch(item);
      if (action === 'login') openLogin();
      if (action === 'categories') openCategories();
    }

    menu.addEventListener('click', function (event) {
      var item = closest(event.target, '.veloura-mobile-floating-menu__item');
      if (!item) return;

      var action = item.getAttribute('data-vmfm-action');
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        toggleAction(action, item);
        return;
      }

      if (item.hasAttribute('data-vmfm-custom-link')) {
        var customUrl = resolveCustomUrl(item);
        if (!customUrl) {
          event.preventDefault();
          return;
        }

        activateItem(item);

        var directHref = safeUrl(item.getAttribute('href') || '');
        if (!directHref || directHref === '#') {
          event.preventDefault();
          if (item.getAttribute('target') === '_blank') {
            window.open(customUrl, '_blank', 'noopener');
          } else {
            window.location.href = customUrl;
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
        }, 80);
      }
    }, true);

    window.addEventListener('pageshow', function () {
      activeAction = '';
      restoreRouteActive();
    });
    window.addEventListener('popstate', function () {
      activeAction = '';
      restoreRouteActive();
    });
    window.addEventListener('hashchange', function () {
      activeAction = '';
      restoreRouteActive();
    });

    stateTimer = window.setInterval(function () {
      if (activeAction === 'categories' && !categoriesAreOpen()) {
        clearTransient('categories');
      }
    }, 350);

    window.addEventListener('beforeunload', function () {
      if (stateTimer) window.clearInterval(stateTimer);
    }, { once: true });

    restoreRouteActive();
  });
})();
