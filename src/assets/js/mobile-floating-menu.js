(function () {
  'use strict';

  function domReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function boot() {
    var menu = document.querySelector('.veloura-mobile-floating-menu');
    if (!menu || menu.getAttribute('data-vmfm-v87-bound') === 'true') return;
    menu.setAttribute('data-vmfm-v87-bound', 'true');

    var items = Array.prototype.slice.call(menu.querySelectorAll('.veloura-mobile-floating-menu__item'));
    var activeAction = '';
    var actionSeenOpen = false;
    var actionStartedAt = 0;
    var actionTimer = null;
    var fallbackTimer = null;

    function closest(target, selector) {
      if (!target || target === document || target === window) return null;
      return target.closest ? target.closest(selector) : null;
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

    function hostLooksOpen(host) {
      if (!host || !host.isConnected) return false;
      if (host.visible === true || host.opened === true || host.open === true) return true;
      if (host.hasAttribute('open') || host.hasAttribute('opened') || host.hasAttribute('visible') || host.getAttribute('aria-hidden') === 'false' || host.classList.contains('is-open') || host.classList.contains('active') || host.classList.contains('s-modal-is-open')) return true;

      var root = host.shadowRoot || host;
      var candidates = root.querySelectorAll('[part~="dialog"], [part~="content"], [role="dialog"], .s-modal-body, .s-modal-content, .s-modal-wrapper, .s-modal-container, .s-login-modal, .s-auth-modal, .s-search-modal, .modal-content');
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
      if (action === 'login') return isLoginOpen();
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
      if (action === 'login') return menu.querySelector('[data-vmfm-action="login"], [data-vmfm-match="account"]');
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

      actionTimer = window.setInterval(function () {
        var opened = actionIsOpen(action);
        var elapsed = Date.now() - actionStartedAt;
        if (opened) {
          actionSeenOpen = true;
          activateItem(itemForAction(action));
          return;
        }
        if ((actionSeenOpen && elapsed > 220) || (!actionSeenOpen && elapsed > 4200)) clearTransient();
      }, 120);
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

    function waitForDefinition(tagName, callback) {
      if (!window.customElements || typeof customElements.whenDefined !== 'function') { callback(); return; }
      var finished = false;
      var done = function () { if (finished) return; finished = true; callback(); };
      customElements.whenDefined(tagName).then(done).catch(done);
      window.setTimeout(done, 1200);
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
        if (href) window.location.href = href;
      }, 1300);
    }

    function closeSearch() {
      var modal = document.querySelector('salla-search:not([inline])');
      if (modal && typeof modal.close === 'function') { try { modal.close(); } catch (error) {} }
      dispatchSalla('search::close');
      window.setTimeout(clearTransient, 180);
    }

    function openLogin(item) {
      beginTransient('login');
      waitForDefinition('salla-login-modal', function () {
        var modal = document.querySelector('salla-login-modal');
        if (modal && typeof modal.open === 'function') {
          try {
            var result = modal.open();
            if (result && typeof result.catch === 'function') result.catch(function () { dispatchSalla('login::open'); });
            return;
          } catch (error) {}
        }

        if (!clickFirst(['.veloura-login-btn', '[data-login]', '[data-open-login]', '.s-login-modal-trigger'])) {
          dispatchSalla('login::open');
        }
      });

      window.setTimeout(function () {
        if (isLoginOpen()) return;
        var url = menu.getAttribute('data-login-url') || (item && item.getAttribute('href')) || '/login';
        window.location.href = url;
      }, 2200);
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
      if (action === 'login') openLogin(item);
      if (action === 'categories') openCategories();
    }

    function closeAction(action) {
      if (action === 'search') closeSearch();
      if (action === 'login') closeLogin();
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

    var loginModal = document.querySelector('salla-login-modal');
    if (loginModal) loginModal.addEventListener('modalVisibilityChanged', function (event) { if (event.detail) beginTransient('login'); else clearTransient(); });
    var searchModal = document.querySelector('salla-search:not([inline])');
    if (searchModal) searchModal.addEventListener('modalVisibilityChanged', function (event) { if (event.detail) beginTransient('search'); else clearTransient(); });

    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') window.setTimeout(clearTransient, 180); });
    window.addEventListener('popstate', clearTransient);
    window.addEventListener('hashchange', clearTransient);
    window.addEventListener('pageshow', restoreRouteActive);
    document.addEventListener('theme::ready', restoreRouteActive);

    restoreRouteActive();
  }

  domReady(function () {
    if (window.salla && typeof salla.onReady === 'function') salla.onReady(boot);
    else boot();
  });
})();
