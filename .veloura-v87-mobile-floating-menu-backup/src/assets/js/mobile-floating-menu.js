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

    var items = Array.prototype.slice.call(
      menu.querySelectorAll('.veloura-mobile-floating-menu__item')
    );
    var activeAction = '';
    var actionStartedAt = 0;
    var actionSeenOpen = false;
    var actionTimer = null;
    var restoreTimers = [];

    function closest(target, selector) {
      if (!target || target === document || target === window) return null;
      return target.closest ? target.closest(selector) : null;
    }

    function visible(element) {
      if (!element || !element.isConnected) return false;

      try {
        var style = window.getComputedStyle(element);
        var rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0.01 &&
          rect.width > 1 &&
          rect.height > 1
        );
      } catch (error) {
        return false;
      }
    }

    function hostLooksOpen(host) {
      if (!host || !host.isConnected) return false;

      if (
        host.hasAttribute('open') ||
        host.hasAttribute('opened') ||
        host.getAttribute('aria-hidden') === 'false' ||
        host.classList.contains('is-open') ||
        host.classList.contains('active') ||
        host.classList.contains('s-modal-is-open')
      ) {
        return true;
      }

      var root = host.shadowRoot || host;
      var candidates = root.querySelectorAll([
        '[part~="dialog"]',
        '[part~="content"]',
        '[role="dialog"]',
        '.s-modal-body',
        '.s-modal-content',
        '.s-modal-wrapper',
        '.s-modal-container',
        '.s-login-modal',
        '.s-auth-modal',
        '.s-search-modal',
        '.modal-content'
      ].join(','));

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
      if (
        document.body.classList.contains('search-open') ||
        document.body.classList.contains('s-search-open') ||
        document.body.classList.contains('salla-search-open')
      ) {
        return true;
      }

      return anyOpenHost('salla-search, salla-modal[data-type="search"], .s-search-modal, .s-modal-search, .search-modal');
    }

    function isLoginOpen() {
      if (
        document.body.classList.contains('login-open') ||
        document.body.classList.contains('s-login-open') ||
        document.body.classList.contains('salla-login-open')
      ) {
        return true;
      }

      return anyOpenHost('salla-login-modal, .s-login-modal, .s-auth-modal, .login-modal, .auth-modal');
    }

    function getCategoriesDrawer() {
      return (
        document.querySelector('.mm-ocd.ocd-categs') ||
        document.querySelector('.mm-ocd--right.ocd-categs') ||
        document.querySelector('.mm-ocd')
      );
    }

    function isCategoriesOpen() {
      var drawer = getCategoriesDrawer();
      return Boolean(
        drawer &&
        (
          drawer.classList.contains('mm-ocd--open') ||
          document.body.classList.contains('menu-opened') ||
          document.body.classList.contains('mm-ocd-opened') ||
          document.body.classList.contains('veloura-ocd-bottom-active') ||
          document.body.classList.contains('veloura-side-categories-open')
        )
      );
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

    function itemForAction(action) {
      if (action === 'login') {
        return menu.querySelector('[data-vmfm-action="login"], [data-vmfm-match="account"]');
      }

      return menu.querySelector(
        '[data-vmfm-action="' + action + '"], [data-vmfm-match="' + action + '"]'
      );
    }

    function activateItem(item) {
      clearActive();
      if (!item) return;
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'page');
    }

    function restoreRouteActive() {
      var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      var match = null;

      if (path === '/') {
        match = menu.querySelector('[data-vmfm-match="home"]');
      } else if (path.indexOf('/cart') !== -1) {
        match = menu.querySelector('[data-vmfm-match="cart"]');
      } else if (
        path.indexOf('/categories') !== -1 ||
        path.indexOf('/category') !== -1 ||
        path.indexOf('/c/') !== -1
      ) {
        match = menu.querySelector('[data-vmfm-match="categories"]');
      } else if (path.indexOf('/search') !== -1) {
        match = menu.querySelector('[data-vmfm-match="search"]');
      } else if (
        path.indexOf('/account') !== -1 ||
        path.indexOf('/profile') !== -1 ||
        path.indexOf('/login') !== -1
      ) {
        match = menu.querySelector('[data-vmfm-match="account"]');
      }

      activateItem(match);
    }

    function stopActionWatch() {
      if (actionTimer) {
        window.clearInterval(actionTimer);
        actionTimer = null;
      }
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

        if ((actionSeenOpen && elapsed > 260) || (!actionSeenOpen && elapsed > 2600)) {
          clearTransient();
        }
      }, 140);
    }

    function scheduleRestore() {
      restoreTimers.forEach(window.clearTimeout);
      restoreTimers = [80, 220, 500, 900].map(function (delay) {
        return window.setTimeout(function () {
          if (!isSearchOpen() && !isLoginOpen() && !isCategoriesOpen()) {
            clearTransient();
          }
        }, delay);
      });
    }

    function dispatchSalla(eventName) {
      if (!window.salla || !window.salla.event || typeof window.salla.event.dispatch !== 'function') {
        return false;
      }

      try {
        window.salla.event.dispatch(eventName);
        return true;
      } catch (error) {
        return false;
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

    function clickFirst(selectors, root) {
      var scope = root || document;
      for (var i = 0; i < selectors.length; i += 1) {
        var element = scope.querySelector(selectors[i]);
        if (element && clickElement(element)) return true;
      }
      return false;
    }

    function clickInHostShadows(hostSelector, selectors) {
      var hosts = document.querySelectorAll(hostSelector);
      for (var i = 0; i < hosts.length; i += 1) {
        var root = hosts[i].shadowRoot;
        if (root && clickFirst(selectors, root)) return true;
      }
      return false;
    }

    function openSearch(item) {
      beginTransient('search');
      if (dispatchSalla('search::open')) return;

      if (clickFirst([
        '[data-search-open]',
        '[data-open-search]',
        '.s-search-modal-trigger',
        '.s-header-search',
        '.veloura-search-toggle',
        'button[aria-label*="بحث"]',
        'button[aria-label*="search"]'
      ])) return;

      var href = item && item.getAttribute('href');
      if (href) window.location.href = href;
    }

    function closeSearch() {
      dispatchSalla('search::close');
      clickInHostShadows('salla-search', [
        '[part~="close"]',
        '.s-modal-close',
        '.s-modal__close',
        '.sicon-cancel',
        'button[aria-label*="إغلاق"]',
        'button[aria-label*="close"]'
      ]);
      clickFirst([
        '.s-search-modal .s-modal-close',
        '.s-modal-search .s-modal-close',
        '.search-modal .modal-close',
        '.search-modal button[aria-label*="إغلاق"]'
      ]);
      scheduleRestore();
    }

    function openLogin(item) {
      beginTransient('login');
      if (dispatchSalla('login::open')) return;

      if (clickFirst([
        '.veloura-login-btn',
        '[data-login]',
        '[data-open-login]',
        '.s-login-modal-trigger',
        'button[aria-label*="تسجيل"]',
        'button[aria-label*="دخول"]',
        'button[aria-label*="login"]'
      ])) return;

      var url = menu.getAttribute('data-login-url') || '/login';
      window.location.href = url;
    }

    function closeLogin() {
      dispatchSalla('login::close');
      dispatchSalla('auth::close');
      clickInHostShadows('salla-login-modal', [
        '[part~="close"]',
        '.s-modal-close',
        '.s-modal__close',
        '.sicon-cancel',
        'button[aria-label*="إغلاق"]',
        'button[aria-label*="close"]'
      ]);
      clickFirst([
        '.s-login-modal .s-modal-close',
        '.s-auth-modal .s-modal-close',
        '.login-modal .modal-close',
        '.login-modal button[aria-label*="إغلاق"]'
      ]);
      scheduleRestore();
    }

    function openCategories() {
      beginTransient('categories');
      clickFirst([
        '.veloura-menu-trigger-mobile[href="#mobile-menu"]',
        'a.mburger[href="#mobile-menu"]',
        'a[href="#mobile-menu"]',
        '[data-open-categories]',
        '[data-categories-open]'
      ]);
    }

    function closeCategories() {
      var drawer = getCategoriesDrawer();
      if (drawer) {
        clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop'], drawer);
      }
      scheduleRestore();
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
      if (!action) {
        stopActionWatch();
        activeAction = '';
        return;
      }

      event.preventDefault();

      if ((activeAction === action && actionIsOpen(action)) || actionIsOpen(action)) {
        closeAction(action);
        return;
      }

      if (activeAction && activeAction !== action && actionIsOpen(activeAction)) {
        closeAction(activeAction);
      }

      openAction(action, item);
    });

    document.addEventListener('click', function (event) {
      if (closest(event.target, '.veloura-mobile-floating-menu')) return;

      if (closest(event.target, [
        '[data-search-open]',
        '[data-open-search]',
        '.s-search-modal-trigger',
        '.s-header-search',
        '.veloura-search-toggle',
        'button[aria-label*="بحث"]',
        'button[aria-label*="search"]'
      ].join(','))) {
        beginTransient('search');
        return;
      }

      if (closest(event.target, [
        '.veloura-login-btn',
        '[data-login]',
        '[data-open-login]',
        '.s-login-modal-trigger',
        'button[aria-label*="تسجيل"]',
        'button[aria-label*="دخول"]',
        'button[aria-label*="login"]'
      ].join(','))) {
        beginTransient('login');
        return;
      }

      if (closest(event.target, [
        '.veloura-menu-trigger-mobile[href="#mobile-menu"]',
        'a.mburger[href="#mobile-menu"]',
        'a[href="#mobile-menu"]',
        '[data-open-categories]',
        '[data-categories-open]'
      ].join(','))) {
        beginTransient('categories');
        return;
      }

      if (closest(event.target, [
        '.s-modal-close',
        '.s-modal__close',
        '.modal-close',
        '.close-mobile-menu',
        '.mm-ocd__backdrop',
        '[aria-label*="إغلاق"]',
        '[aria-label*="close"]'
      ].join(','))) {
        scheduleRestore();
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') scheduleRestore();
    });

    window.addEventListener('popstate', function () {
      clearTransient();
    });
    window.addEventListener('hashchange', function () {
      clearTransient();
    });
    window.addEventListener('pageshow', restoreRouteActive);
    document.addEventListener('theme::ready', restoreRouteActive);

    restoreRouteActive();
  });
})();
