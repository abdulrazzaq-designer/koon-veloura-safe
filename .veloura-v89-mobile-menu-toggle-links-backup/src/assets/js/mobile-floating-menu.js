(function () {
  'use strict';

  var VERSION = 'v88';
  var SAFE_STYLE_ID = 'veloura-v88-mobile-menu-safe-style';
  var MOBILE_QUERY = '(max-width: 767px)';
  var SAFE_HOST_SELECTOR = [
    'salla-login-modal',
    'salla-localization-modal',
    'salla-modal',
    'salla-sheet',
    'salla-search',
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
    if (!menu || menu.getAttribute('data-vmfm-v88-bound') === 'true') return;

    menu.setAttribute('data-vmfm-v88-bound', 'true');
    menu.setAttribute('data-vmfm-controller', VERSION);

    var items = Array.prototype.slice.call(menu.querySelectorAll('.veloura-mobile-floating-menu__item'));
    var activeAction = '';
    var actionSeenOpen = false;
    var actionStartedAt = 0;
    var actionTimer = null;
    var fallbackTimer = null;
    var resizeObserver = null;

    function closest(target, selector) {
      if (!target || target === document || target === window) return null;
      return target.closest ? target.closest(selector) : null;
    }

    function isMobile() {
      return window.matchMedia ? window.matchMedia(MOBILE_QUERY).matches : window.innerWidth <= 767;
    }

    function visible(element) {
      if (!element || !element.isConnected) return false;
      try {
        var style = window.getComputedStyle(element);
        var rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.01 && rect.width > 1 && rect.height > 1;
      } catch (error) {
        return false;
      }
    }

    function measureSafeOffset() {
      var root = document.documentElement;
      var body = document.body;
      var offset = 0;

      if (isMobile() && visible(menu)) {
        var rect = menu.getBoundingClientRect();
        var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        var bottomGap = Math.max(0, Math.round(viewportHeight - rect.bottom));
        offset = Math.max(0, Math.ceil(rect.height + bottomGap + 8));
      }

      root.style.setProperty('--veloura-mobile-menu-overlay-offset', offset + 'px');
      if (body) body.style.setProperty('--veloura-mobile-menu-overlay-offset', offset + 'px');
      root.classList.toggle('veloura-mobile-menu-safe-active', offset > 0);
      if (body) body.classList.toggle('veloura-mobile-menu-safe-active', offset > 0);

      return offset;
    }

    function safeShadowCss(forceBottomPanel) {
      var forced = forceBottomPanel ? `
        .s-modal-body,
        .s-sheet-body,
        [part~='body'],
        [part~='panel'],
        [part~='sheet'] {
          margin-bottom: var(--veloura-v88-mobile-menu-offset) !important;
          max-height: calc(100dvh - var(--veloura-v88-mobile-menu-offset) - 8px) !important;
        }
      ` : '';

      return `
        :host {
          --veloura-v88-mobile-menu-offset: var(--veloura-mobile-menu-overlay-offset, 0px);
        }

        @media (max-width: 767px) {
          .s-modal-align-bottom .s-modal-body,
          .s-modal-align-bottom .s-sheet-body,
          .s-modal-align-bottom [part~='body'],
          .s-modal-align-bottom [part~='panel'],
          .s-modal-align-bottom [part~='sheet'],
          .s-sheet-body,
          [data-position='bottom'] [part~='body'],
          [data-position='bottom'] [part~='panel'] {
            margin-bottom: var(--veloura-v88-mobile-menu-offset) !important;
            max-height: calc(100dvh - var(--veloura-v88-mobile-menu-offset) - 8px) !important;
          }

          .s-modal-body,
          .s-sheet-body,
          [part~='body'],
          [part~='panel'],
          [part~='sheet'] {
            box-sizing: border-box !important;
            scroll-padding-bottom: var(--veloura-v88-mobile-menu-offset) !important;
          }

          ${forced}
        }
      `;
    }

    function injectSafeStyle(host) {
      if (!host || !host.isConnected) return;

      var apply = function () {
        var root = host.shadowRoot;
        if (!root) return;

        var forceBottomPanel = host.tagName === 'SALLA-LOGIN-MODAL' || host.tagName === 'SALLA-LOCALIZATION-MODAL';
        var css = safeShadowCss(forceBottomPanel);
        var style = root.getElementById(SAFE_STYLE_ID);

        if (!style) {
          style = document.createElement('style');
          style.id = SAFE_STYLE_ID;
          root.appendChild(style);
        }

        if (style.textContent !== css) style.textContent = css;
        host.setAttribute('data-veloura-mobile-menu-safe', VERSION);
      };

      apply();

      if (typeof host.componentOnReady === 'function') {
        try {
          var ready = host.componentOnReady();
          if (ready && typeof ready.then === 'function') ready.then(apply).catch(function () {});
        } catch (error) {}
      }

      if (window.customElements && typeof customElements.whenDefined === 'function') {
        customElements.whenDefined(host.localName).then(apply).catch(function () {});
      }
    }

    function decorateSafeHosts(scope) {
      var current = scope || document;
      if (current.matches && current.matches(SAFE_HOST_SELECTOR)) injectSafeStyle(current);
      if (!current.querySelectorAll) return;
      current.querySelectorAll(SAFE_HOST_SELECTOR).forEach(injectSafeStyle);
    }

    function scheduleSafeSync() {
      [0, 80, 220, 500, 1000].forEach(function (delay) {
        window.setTimeout(function () {
          measureSafeOffset();
          decorateSafeHosts(document);
        }, delay);
      });
    }

    function hostLooksOpen(host) {
      if (!host || !host.isConnected) return false;
      if (host.visible === true || host.opened === true || host.open === true) return true;
      if (host.hasAttribute('open') || host.hasAttribute('opened') || host.hasAttribute('visible') || host.getAttribute('aria-hidden') === 'false' || host.classList.contains('is-open') || host.classList.contains('active') || host.classList.contains('s-modal-is-open')) return true;

      var root = host.shadowRoot || host;
      var candidates = root.querySelectorAll('[part~="dialog"], [part~="content"], [part~="body"], [part~="panel"], [role="dialog"], .s-modal-body, .s-modal-content, .s-modal-wrapper, .s-modal-container, .s-login-modal, .s-auth-modal, .s-search-modal, .modal-content');
      for (var i = 0; i < candidates.length; i += 1) {
        if (visible(candidates[i])) return true;
      }
      return false;
    }

    function anyOpenHost(selectors) {
      var hosts = document.querySelectorAll(selectors);
      for (var i = 0; i < hosts.length; i += 1) {
        if (hostLooksOpen(hosts[i])) return true;
      }
      return false;
    }

    function isSearchOpen() {
      if (document.body.classList.contains('search-open') || document.body.classList.contains('s-search-open') || document.body.classList.contains('salla-search-open')) return true;
      return anyOpenHost('salla-search:not([inline]), salla-modal[data-type="search"], .s-search-modal, .s-modal-search, .search-modal');
    }

    function isLoginOpen() {
      if (document.body.classList.contains('login-open') || document.body.classList.contains('s-login-open') || document.body.classList.contains('salla-login-open')) return true;
      return anyOpenHost('salla-login-modal, .s-login-modal, .s-auth-modal, .login-modal, .auth-modal');
    }

    function getCategoriesDrawer() {
      return document.querySelector('.mm-ocd.ocd-categs') || document.querySelector('.mm-ocd--right.ocd-categs') || document.querySelector('.mm-ocd');
    }

    function isCategoriesOpen() {
      var drawer = getCategoriesDrawer();
      return Boolean(drawer && (drawer.classList.contains('mm-ocd--open') || document.body.classList.contains('menu-opened') || document.body.classList.contains('mm-ocd-opened') || document.body.classList.contains('veloura-ocd-bottom-active') || document.body.classList.contains('veloura-side-categories-open')));
    }

    function actionIsOpen(action) {
      if (action === 'search') return isSearchOpen();
      if (action === 'account' || action === 'login') return isLoginOpen();
      if (action === 'categories') return isCategoriesOpen();
      return false;
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
      if (action === 'account' || action === 'login') return menu.querySelector('[data-vmfm-action="account"], [data-vmfm-action="login"], [data-vmfm-match="account"]');
      return menu.querySelector('[data-vmfm-action="' + action + '"], [data-vmfm-match="' + action + '"]');
    }

    function normalizePath(value) {
      var result = String(value || '/').split('?')[0].split('#')[0];
      result = result.replace(/\/+/g, '/').replace(/\/+$/, '');
      return result || '/';
    }

    function hrefPath(href) {
      try {
        return normalizePath(new URL(href, window.location.origin).pathname);
      } catch (error) {
        return normalizePath(href);
      }
    }

    function getPageSlug() {
      var slug = menu.getAttribute('data-vmfm-page-slug') || '';
      try {
        if (!slug && window.salla && salla.config && typeof salla.config.get === 'function') slug = salla.config.get('page.slug') || '';
      } catch (error) {}
      return String(slug || '').toLowerCase();
    }

    function getUserType() {
      var type = '';
      try {
        if (window.salla && salla.config && typeof salla.config.get === 'function') type = salla.config.get('user.type') || '';
      } catch (error) {}
      return String(type || '').toLowerCase();
    }

    function isLoggedIn() {
      var type = getUserType();
      return type === 'user' || type === 'customer' || type === 'member';
    }

    function restoreRouteActive() {
      if (activeAction && actionIsOpen(activeAction)) return;

      var path = normalizePath(window.location.pathname);
      var storePath = hrefPath(menu.getAttribute('data-vmfm-store-url') || '/');
      var slug = getPageSlug();
      var match = null;

      if (document.body.classList.contains('veloura-page-index') || slug === 'index' || slug === 'home' || path === storePath) {
        match = menu.querySelector('[data-vmfm-match="home"]');
      } else if (slug.indexOf('cart') !== -1 || path.indexOf('/cart') !== -1) {
        match = menu.querySelector('[data-vmfm-match="cart"]');
      } else if (slug.indexOf('categor') !== -1 || slug.indexOf('product.index') !== -1 || path.indexOf('/categories') !== -1 || path.indexOf('/category') !== -1 || path.indexOf('/c/') !== -1) {
        match = menu.querySelector('[data-vmfm-match="categories"]');
      } else if (slug.indexOf('search') !== -1 || path.indexOf('/search') !== -1) {
        match = menu.querySelector('[data-vmfm-match="search"]');
      } else if (slug.indexOf('customer') !== -1 || slug.indexOf('profile') !== -1 || slug.indexOf('login') !== -1 || path.indexOf('/account') !== -1 || path.indexOf('/profile') !== -1 || path.indexOf('/login') !== -1) {
        match = menu.querySelector('[data-vmfm-match="account"]');
      }

      if (!match) {
        var customItems = menu.querySelectorAll('[data-vmfm-custom-url]');
        for (var i = 0; i < customItems.length; i += 1) {
          if (hrefPath(customItems[i].getAttribute('data-vmfm-custom-url')) === path) {
            match = customItems[i];
            break;
          }
        }
      }

      activateItem(match);
    }

    function stopActionWatch() {
      if (actionTimer) window.clearInterval(actionTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      actionTimer = null;
      fallbackTimer = null;
    }

    function clearTransient() {
      stopActionWatch();
      activeAction = '';
      actionSeenOpen = false;
      actionStartedAt = 0;
      restoreRouteActive();
    }

    function beginTransient(action) {
      stopActionWatch();
      activeAction = action;
      actionSeenOpen = false;
      actionStartedAt = Date.now();
      activateItem(itemForAction(action));
      scheduleSafeSync();

      actionTimer = window.setInterval(function () {
        var opened = actionIsOpen(action);
        var elapsed = Date.now() - actionStartedAt;
        if (opened) {
          actionSeenOpen = true;
          activateItem(itemForAction(action));
          measureSafeOffset();
          return;
        }
        if ((actionSeenOpen && elapsed > 220) || (!actionSeenOpen && elapsed > 5200)) clearTransient();
      }, 140);
    }

    function dispatchSalla(eventName) {
      if (!window.salla || !salla.event || typeof salla.event.dispatch !== 'function') return false;
      try {
        salla.event.dispatch(eventName);
        return true;
      } catch (error) {
        return false;
      }
    }

    function clickElement(element) {
      if (!element) return false;
      try { element.click(); return true; } catch (error) { return false; }
    }

    function clickFirst(selectors, root) {
      var scope = root || document;
      for (var i = 0; i < selectors.length; i += 1) {
        var element = scope.querySelector(selectors[i]);
        if (element && clickElement(element)) return true;
      }
      return false;
    }

    function readyComponent(tagName, callback) {
      var finish = function () {
        var host = document.querySelector(tagName);
        if (!host) { callback(null); return; }

        var done = function () {
          injectSafeStyle(host);
          callback(host);
        };

        if (typeof host.componentOnReady === 'function') {
          try {
            var ready = host.componentOnReady();
            if (ready && typeof ready.then === 'function') {
              ready.then(done).catch(done);
              return;
            }
          } catch (error) {}
        }
        done();
      };

      if (!window.customElements || typeof customElements.whenDefined !== 'function') {
        finish();
        return;
      }

      var settled = false;
      var once = function () {
        if (settled) return;
        settled = true;
        finish();
      };

      customElements.whenDefined(tagName).then(once).catch(once);
      window.setTimeout(once, 1800);
    }

    function focusInlineSearch() {
      var hosts = document.querySelectorAll('salla-search[inline]');
      for (var i = 0; i < hosts.length; i += 1) {
        var host = hosts[i];
        if (!visible(host)) continue;
        var root = host.shadowRoot || host;
        var input = root.querySelector('input[type="search"], input, [contenteditable="true"]');
        if (input) {
          try { input.focus(); input.click(); return true; } catch (error) {}
        }
        if (clickElement(host)) return true;
      }
      return false;
    }

    function openSearch(item) {
      beginTransient('search');

      var headerTrigger = document.querySelector('.veloura-search-toggle, [data-search-open], [data-open-search], .s-search-modal-trigger, .s-header-search');
      if (headerTrigger && headerTrigger !== item) clickElement(headerTrigger);

      fallbackTimer = window.setTimeout(function () {
        if (isSearchOpen()) return;
        var modal = document.querySelector('salla-search:not([inline])');
        if (modal && typeof modal.open === 'function') {
          try { modal.open(); return; } catch (error) {}
        }
        dispatchSalla('search::open');
        focusInlineSearch();
      }, 280);

      window.setTimeout(function () {
        if (isSearchOpen()) return;
        var href = item && item.getAttribute('href');
        if (href) window.location.assign(href);
      }, 1500);
    }

    function closeSearch() {
      var modal = document.querySelector('salla-search:not([inline])');
      if (modal && typeof modal.close === 'function') { try { modal.close(); } catch (error) {} }
      dispatchSalla('search::close');
      window.setTimeout(clearTransient, 180);
    }

    function openLogin() {
      beginTransient('account');
      measureSafeOffset();
      decorateSafeHosts(document);

      // This is the same native event used by the working header login button.
      dispatchSalla('login::open');

      readyComponent('salla-login-modal', function (modal) {
        if (!modal || isLoginOpen()) return;
        if (typeof modal.open === 'function') {
          try {
            var result = modal.open();
            if (result && typeof result.catch === 'function') {
              result.catch(function () { dispatchSalla('login::open'); });
            }
            return;
          } catch (error) {}
        }

        clickFirst(['.veloura-login-btn', '[data-login]', '[data-open-login]', '.s-login-modal-trigger']);
      });

      // No redirect to /login: keep the customer on the current store page.
      window.setTimeout(function () {
        if (!isLoginOpen()) dispatchSalla('login::open');
      }, 700);
    }

    function openAccount() {
      if (isLoggedIn()) {
        var accountUrl = menu.getAttribute('data-vmfm-account-url') || '/profile';
        window.location.assign(accountUrl);
        return;
      }
      openLogin();
    }

    function closeLogin() {
      var modal = document.querySelector('salla-login-modal');
      if (modal && typeof modal.close === 'function') { try { modal.close(); } catch (error) {} }
      dispatchSalla('login::close');
      dispatchSalla('auth::close');
      window.setTimeout(clearTransient, 180);
    }

    function openCategories() {
      beginTransient('categories');
      clickFirst(['.veloura-menu-trigger-mobile[href="#mobile-menu"]', 'a.mburger[href="#mobile-menu"]', 'a[href="#mobile-menu"]', '[data-open-categories]', '[data-categories-open]']);
    }

    function closeCategories() {
      var drawer = getCategoriesDrawer();
      if (drawer) clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop'], drawer);
      window.setTimeout(clearTransient, 180);
    }

    function openAction(action, item) {
      if (action === 'search') openSearch(item);
      if (action === 'account' || action === 'login') openAccount();
      if (action === 'categories') openCategories();
    }

    function closeAction(action) {
      if (action === 'search') closeSearch();
      if (action === 'account' || action === 'login') closeLogin();
      if (action === 'categories') closeCategories();
    }

    menu.addEventListener('click', function (event) {
      var item = closest(event.target, '.veloura-mobile-floating-menu__item');
      if (!item) return;
      var action = item.getAttribute('data-vmfm-action');
      if (!action) { stopActionWatch(); activeAction = ''; return; }

      event.preventDefault();
      if ((activeAction === action && actionIsOpen(action)) || actionIsOpen(action)) { closeAction(action); return; }
      if (activeAction && activeAction !== action && actionIsOpen(activeAction)) closeAction(activeAction);
      openAction(action, item);
    });

    function bindModalEvents(host, action) {
      if (!host || host.getAttribute('data-vmfm-v88-events') === 'true') return;
      host.setAttribute('data-vmfm-v88-events', 'true');
      host.addEventListener('modalVisibilityChanged', function (event) {
        scheduleSafeSync();
        if (event.detail) beginTransient(action);
        else clearTransient();
      });
    }

    function bindKnownModals() {
      bindModalEvents(document.querySelector('salla-login-modal'), 'account');
      bindModalEvents(document.querySelector('salla-search:not([inline])'), 'search');
      var localization = document.querySelector('salla-localization-modal');
      if (localization && localization.getAttribute('data-vmfm-v88-events') !== 'true') {
        localization.setAttribute('data-vmfm-v88-events', 'true');
        localization.addEventListener('modalVisibilityChanged', scheduleSafeSync);
      }
    }

    decorateSafeHosts(document);
    bindKnownModals();
    scheduleSafeSync();

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(scheduleSafeSync);
      resizeObserver.observe(menu);
    }

    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            decorateSafeHosts(node);
          });
        });
        bindKnownModals();
        measureSafeOffset();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') window.setTimeout(clearTransient, 180); });
    window.addEventListener('popstate', clearTransient);
    window.addEventListener('hashchange', clearTransient);
    window.addEventListener('pageshow', function () { restoreRouteActive(); scheduleSafeSync(); });
    window.addEventListener('resize', scheduleSafeSync, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleSafeSync, { passive: true });
    document.addEventListener('theme::ready', function () { restoreRouteActive(); scheduleSafeSync(); });

    restoreRouteActive();
  }

  domReady(function () {
    if (window.salla && typeof salla.onReady === 'function') salla.onReady(boot);
    else boot();
  });
})();
