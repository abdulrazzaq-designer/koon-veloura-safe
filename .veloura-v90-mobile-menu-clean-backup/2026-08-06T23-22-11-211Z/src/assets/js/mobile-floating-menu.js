(function () {
  'use strict';

  var VERSION = 'v89';
  var PANEL_STYLE_ID = 'veloura-v89-mobile-menu-panel-style';
  var MOBILE_QUERY = '(max-width: 767px)';
  var PANEL_HOST_SELECTOR = [
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
    if (!menu || menu.getAttribute('data-vmfm-v89-bound') === 'true') return;

    menu.setAttribute('data-vmfm-v89-bound', 'true');
    menu.setAttribute('data-vmfm-controller', VERSION);

    var inner = menu.querySelector('.veloura-mobile-floating-menu__inner');
    var items = Array.prototype.slice.call(menu.querySelectorAll('.veloura-mobile-floating-menu__item'));
    var activeAction = '';
    var actionRequestedOpen = false;
    var actionSeenOpen = false;
    var actionStartedAt = 0;
    var actionTimer = null;
    var fallbackTimer = null;
    var resizeObserver = null;
    var indicatorFrame = 0;
    var openPanelSources = new Set();

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

    function setPanelSource(source, open) {
      var key = String(source || 'generic');
      if (open) openPanelSources.add(key);
      else openPanelSources.delete(key);

      var hasOpenPanel = openPanelSources.size > 0;
      document.documentElement.classList.toggle('veloura-mobile-menu-panel-open', hasOpenPanel);
      if (document.body) {
        document.body.classList.toggle('veloura-mobile-menu-panel-open', hasOpenPanel);
        if (hasOpenPanel) document.body.setAttribute('data-vmfm-open-panel', Array.from(openPanelSources).join(' '));
        else document.body.removeAttribute('data-vmfm-open-panel');
      }
    }

    function measureMenuOffset() {
      var root = document.documentElement;
      var body = document.body;
      var offset = 0;

      if (isMobile() && visible(menu)) {
        var rect = menu.getBoundingClientRect();
        var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        var bottomGap = Math.max(0, Math.round(viewportHeight - rect.bottom));
        offset = Math.max(0, Math.ceil(rect.height + bottomGap + 6));
      }

      root.style.setProperty('--veloura-mobile-menu-overlay-offset', offset + 'px');
      if (body) body.style.setProperty('--veloura-mobile-menu-overlay-offset', offset + 'px');
      root.classList.toggle('veloura-mobile-menu-safe-active', offset > 0);
      if (body) body.classList.toggle('veloura-mobile-menu-safe-active', offset > 0);
      return offset;
    }

    function panelShadowCss(forceBottomSheet) {
      var forced = forceBottomSheet ? `
        .s-modal-wrapper,
        .s-modal-container,
        [part~='wrapper'],
        [part~='container'],
        [part~='dialog'] {
          align-items: flex-end !important;
          justify-content: flex-end !important;
        }

        .s-modal-body,
        .s-modal-content,
        .s-sheet-body,
        [part~='body'],
        [part~='content'],
        [part~='panel'],
        [part~='sheet'],
        [role='dialog'] {
          inset-block-end: 0 !important;
          bottom: 0 !important;
          margin-block-end: 0 !important;
          margin-bottom: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
          max-height: calc(100dvh - 8px) !important;
        }
      ` : '';

      return `
        :host {
          --veloura-v89-mobile-menu-offset: var(--veloura-mobile-menu-overlay-offset, 0px);
        }

        @media (max-width: 767px) {
          .s-modal-body,
          .s-modal-content,
          .s-sheet-body,
          [part~='body'],
          [part~='content'],
          [part~='panel'],
          [part~='sheet'],
          [role='dialog'] {
            box-sizing: border-box !important;
            margin-block-end: 0 !important;
            margin-bottom: 0 !important;
            max-height: calc(100dvh - 8px) !important;
            padding-block-end: calc(var(--veloura-v89-mobile-menu-offset) + 12px) !important;
            padding-bottom: calc(var(--veloura-v89-mobile-menu-offset) + 12px) !important;
            scroll-padding-block-end: calc(var(--veloura-v89-mobile-menu-offset) + 12px) !important;
            scroll-padding-bottom: calc(var(--veloura-v89-mobile-menu-offset) + 12px) !important;
          }

          ${forced}
        }
      `;
    }

    function injectPanelStyle(host) {
      if (!host || !host.isConnected) return;

      var apply = function () {
        var root = host.shadowRoot;
        if (!root) return;

        var forceBottomSheet = host.tagName === 'SALLA-LOGIN-MODAL' ||
          host.tagName === 'SALLA-LOCALIZATION-MODAL' ||
          (host.tagName === 'SALLA-SEARCH' && !host.hasAttribute('inline'));
        var css = panelShadowCss(forceBottomSheet);
        var style = root.getElementById(PANEL_STYLE_ID);

        if (!style) {
          style = document.createElement('style');
          style.id = PANEL_STYLE_ID;
          root.appendChild(style);
        }

        if (style.textContent !== css) style.textContent = css;
        host.setAttribute('data-veloura-mobile-menu-panel', VERSION);
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

    function decoratePanelHosts(scope) {
      var current = scope || document;
      if (current.matches && current.matches(PANEL_HOST_SELECTOR)) injectPanelStyle(current);
      if (!current.querySelectorAll) return;
      current.querySelectorAll(PANEL_HOST_SELECTOR).forEach(injectPanelStyle);
    }

    function schedulePanelSync() {
      [0, 60, 160, 360, 800].forEach(function (delay) {
        window.setTimeout(function () {
          measureMenuOffset();
          decoratePanelHosts(document);
          syncIndicator();
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

    function isLocalizationOpen() {
      return anyOpenHost('salla-localization-modal, .s-localization-modal, .localization-modal');
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
      if (action === 'localization') return isLocalizationOpen();
      return false;
    }

    function stopActionWatch() {
      if (actionTimer) window.clearInterval(actionTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      actionTimer = null;
      fallbackTimer = null;
    }

    function clearActive() {
      items.forEach(function (item) {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
    }

    function syncIndicator() {
      if (!inner) return;
      if (indicatorFrame) window.cancelAnimationFrame(indicatorFrame);
      indicatorFrame = window.requestAnimationFrame(function () {
        indicatorFrame = 0;
        var active = menu.querySelector('.veloura-mobile-floating-menu__item.is-active, .veloura-mobile-floating-menu__item[aria-current="page"]');
        if (!active || !visible(inner) || !visible(active)) {
          inner.classList.remove('has-active-indicator');
          return;
        }

        var innerRect = inner.getBoundingClientRect();
        var activeRect = active.getBoundingClientRect();
        var width = Math.max(16, Math.min(34, Math.round(activeRect.width * 0.28)));
        var left = Math.round(activeRect.left - innerRect.left + ((activeRect.width - width) / 2));
        inner.style.setProperty('--veloura-vmfm-indicator-left', left + 'px');
        inner.style.setProperty('--veloura-vmfm-indicator-width', width + 'px');
        inner.classList.add('has-active-indicator');
      });
    }

    function activateItem(item) {
      clearActive();
      if (item) {
        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');
      }
      syncIndicator();
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

    function isSafeUrl(value) {
      var text = String(value || '').trim();
      if (!text || text === '#' || /^javascript:/i.test(text)) return false;
      return /^(https?:\/\/|\/|#|mailto:|tel:|sms:|whatsapp:)/i.test(text);
    }

    function parsePayload(item) {
      var raw = item && item.getAttribute('data-vmfm-custom-payload');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (error) { return raw; }
    }

    function findUrlDeep(value, depth, seen) {
      if (depth > 8 || value === null || typeof value === 'undefined') return '';
      if (typeof value === 'string') return isSafeUrl(value) ? value.trim() : '';
      if (typeof value !== 'object') return '';
      if (seen.indexOf(value) !== -1) return '';
      seen.push(value);

      if (Array.isArray(value)) {
        for (var ai = 0; ai < value.length; ai += 1) {
          var arrayUrl = findUrlDeep(value[ai], depth + 1, seen);
          if (arrayUrl) return arrayUrl;
        }
        return '';
      }

      var priority = ['url', 'href', 'link', 'permalink', 'web_url', 'website', 'target_url'];
      for (var pi = 0; pi < priority.length; pi += 1) {
        var direct = value[priority[pi]];
        if (typeof direct === 'string' && isSafeUrl(direct)) return direct.trim();
      }

      var nestedPriority = ['selected', 'value', 'item', 'data', 'resource', 'option', 'target'];
      for (var ni = 0; ni < nestedPriority.length; ni += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, nestedPriority[ni])) continue;
        var nestedUrl = findUrlDeep(value[nestedPriority[ni]], depth + 1, seen);
        if (nestedUrl) return nestedUrl;
      }

      var keys = Object.keys(value);
      for (var ki = 0; ki < keys.length; ki += 1) {
        if (priority.indexOf(keys[ki]) !== -1 || nestedPriority.indexOf(keys[ki]) !== -1) continue;
        var found = findUrlDeep(value[keys[ki]], depth + 1, seen);
        if (found) return found;
      }
      return '';
    }

    function resolveCustomUrl(item) {
      if (!item) return '';
      var explicit = item.getAttribute('data-vmfm-custom-url') || item.getAttribute('href') || '';
      if (isSafeUrl(explicit)) return explicit.trim();
      return findUrlDeep(parsePayload(item), 0, []);
    }

    function primeCustomItems() {
      menu.querySelectorAll('[data-vmfm-custom-payload], [data-vmfm-action="custom-link"]').forEach(function (item) {
        var url = resolveCustomUrl(item);
        if (url) item.setAttribute('data-vmfm-custom-url', url);
      });
    }

    function restoreRouteActive() {
      if (activeAction && (actionRequestedOpen || actionIsOpen(activeAction))) return;

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
        var customItems = menu.querySelectorAll('[data-vmfm-custom-url], [data-vmfm-custom-payload]');
        for (var i = 0; i < customItems.length; i += 1) {
          var customUrl = resolveCustomUrl(customItems[i]);
          if (customUrl && hrefPath(customUrl) === path) {
            match = customItems[i];
            break;
          }
        }
      }

      activateItem(match);
    }

    function clearTransient(action) {
      stopActionWatch();
      if (!action || action === activeAction) {
        if (activeAction) setPanelSource(activeAction, false);
        activeAction = '';
        actionRequestedOpen = false;
        actionSeenOpen = false;
        actionStartedAt = 0;
      }
      restoreRouteActive();
    }

    function beginTransient(action, item) {
      stopActionWatch();
      activeAction = action;
      actionRequestedOpen = true;
      actionSeenOpen = false;
      actionStartedAt = Date.now();
      activateItem(item || itemForAction(action));
      setPanelSource(action, true);
      schedulePanelSync();

      actionTimer = window.setInterval(function () {
        var opened = actionIsOpen(action);
        var elapsed = Date.now() - actionStartedAt;
        if (opened) {
          actionSeenOpen = true;
          actionRequestedOpen = true;
          activateItem(item || itemForAction(action));
          setPanelSource(action, true);
          measureMenuOffset();
          return;
        }

        if (actionSeenOpen && elapsed > 220) {
          clearTransient(action);
          return;
        }

        if (!actionSeenOpen && elapsed > 6000) clearTransient(action);
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

    function readyComponent(selector, callback) {
      var host = document.querySelector(selector);
      var tagName = host ? host.localName : String(selector).split(/[\s\[\.:#]/)[0];
      var finish = function () {
        host = document.querySelector(selector);
        if (!host) { callback(null); return; }

        var done = function () {
          injectPanelStyle(host);
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

      if (!tagName || !window.customElements || typeof customElements.whenDefined !== 'function') {
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

    function closeHost(host) {
      if (!host) return false;
      var closed = false;
      if (typeof host.close === 'function') {
        try { host.close(); closed = true; } catch (error) {}
      }

      var root = host.shadowRoot || host;
      var nestedModal = root.querySelector('salla-modal, salla-sheet');
      if (nestedModal && typeof nestedModal.close === 'function') {
        try { nestedModal.close(); closed = true; } catch (error) {}
      }

      if (clickFirst([
        '[part~="close"]',
        '[data-close]',
        '.s-modal-close',
        '.s-modal-close-button',
        'button[aria-label="إغلاق"]',
        'button[aria-label="Close"]',
        '.s-modal-overlay',
        '.s-modal-backdrop'
      ], root)) closed = true;

      return closed;
    }

    function openSearch(item) {
      beginTransient('search', item);
      dispatchSalla('search::open');

      readyComponent('salla-search:not([inline])', function (modal) {
        if (!modal || isSearchOpen()) return;
        if (typeof modal.open === 'function') {
          try { modal.open(); return; } catch (error) {}
        }
        dispatchSalla('search::open');
      });

      fallbackTimer = window.setTimeout(function () {
        if (isSearchOpen()) return;
        var headerTrigger = document.querySelector('.veloura-search-toggle, [data-search-open], [data-open-search], .s-search-modal-trigger, .s-header-search');
        if (headerTrigger && headerTrigger !== item) clickElement(headerTrigger);
      }, 450);
    }

    function closeSearch() {
      actionRequestedOpen = false;
      setPanelSource('search', false);
      var modal = document.querySelector('salla-search:not([inline])');
      closeHost(modal);
      dispatchSalla('search::close');
      window.setTimeout(function () { clearTransient('search'); }, 180);
    }

    function openLogin(item) {
      beginTransient('account', item || itemForAction('account'));
      dispatchSalla('login::open');

      readyComponent('salla-login-modal', function (modal) {
        if (!modal || isLoginOpen()) return;
        if (typeof modal.open === 'function') {
          try {
            var result = modal.open();
            if (result && typeof result.catch === 'function') result.catch(function () { dispatchSalla('login::open'); });
            return;
          } catch (error) {}
        }
        clickFirst(['.veloura-login-btn', '[data-login]', '[data-open-login]', '.s-login-modal-trigger']);
      });

      fallbackTimer = window.setTimeout(function () {
        if (!isLoginOpen()) dispatchSalla('login::open');
      }, 650);
    }

    function openAccount(item) {
      if (isLoggedIn()) {
        var accountUrl = menu.getAttribute('data-vmfm-account-url') || '/profile';
        window.location.assign(accountUrl);
        return;
      }
      openLogin(item);
    }

    function closeLogin() {
      actionRequestedOpen = false;
      setPanelSource('account', false);
      var modal = document.querySelector('salla-login-modal');
      closeHost(modal);
      dispatchSalla('login::close');
      dispatchSalla('auth::close');
      window.setTimeout(function () { clearTransient('account'); }, 180);
    }

    function openCategories(item) {
      beginTransient('categories', item);
      clickFirst(['.veloura-menu-trigger-mobile[href="#mobile-menu"]', 'a.mburger[href="#mobile-menu"]', 'a[href="#mobile-menu"]', '[data-open-categories]', '[data-categories-open]']);
    }

    function closeCategories() {
      actionRequestedOpen = false;
      setPanelSource('categories', false);
      var drawer = getCategoriesDrawer();
      if (drawer) clickFirst(['.close-mobile-menu', '.mm-ocd__backdrop', '.mm-ocd__close'], drawer);
      window.setTimeout(function () { clearTransient('categories'); }, 180);
    }

    function openLocalization(item) {
      beginTransient('localization', item);
      readyComponent('salla-localization-modal', function (modal) {
        if (!modal) return;
        if (typeof modal.open === 'function') {
          try { modal.open(); return; } catch (error) {}
        }
        clickFirst(['[data-veloura-localization-trigger]', '.veloura-lang-mobile', '.veloura-lang-desktop']);
      });
    }

    function closeLocalization() {
      actionRequestedOpen = false;
      setPanelSource('localization', false);
      var modal = document.querySelector('salla-localization-modal');
      closeHost(modal);
      window.setTimeout(function () { clearTransient('localization'); }, 180);
    }

    function openAction(action, item) {
      if (action === 'search') openSearch(item);
      else if (action === 'account' || action === 'login') openAccount(item);
      else if (action === 'categories') openCategories(item);
      else if (action === 'localization') openLocalization(item);
    }

    function closeAction(action) {
      if (action === 'search') closeSearch();
      else if (action === 'account' || action === 'login') closeLogin();
      else if (action === 'categories') closeCategories();
      else if (action === 'localization') closeLocalization();
    }

    function navigateCustom(item) {
      var url = resolveCustomUrl(item);
      if (!url) return false;
      item.setAttribute('data-vmfm-custom-url', url);
      var target = item.getAttribute('target');
      if (target === '_blank') {
        window.open(new URL(url, window.location.origin).href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(new URL(url, window.location.origin).href);
      }
      return true;
    }

    menu.addEventListener('click', function (event) {
      var item = closest(event.target, '.veloura-mobile-floating-menu__item');
      if (!item) return;
      var action = item.getAttribute('data-vmfm-action');

      if (action === 'custom-link') {
        event.preventDefault();
        stopActionWatch();
        activeAction = '';
        actionRequestedOpen = false;
        navigateCustom(item);
        return;
      }

      if (!action) {
        stopActionWatch();
        activeAction = '';
        actionRequestedOpen = false;
        return;
      }

      event.preventDefault();

      var sameRequestedAction = activeAction === action && actionRequestedOpen;
      if (sameRequestedAction || actionIsOpen(action)) {
        closeAction(action);
        return;
      }

      if (activeAction && activeAction !== action) closeAction(activeAction);
      openAction(action, item);
    });

    function eventIsOpen(event) {
      if (typeof event.detail === 'boolean') return event.detail;
      if (event.detail && typeof event.detail.visible === 'boolean') return event.detail.visible;
      if (event.detail && typeof event.detail.open === 'boolean') return event.detail.open;
      return Boolean(event.detail);
    }

    function bindModalEvents(host, action, panelSource) {
      if (!host || host.getAttribute('data-vmfm-v89-events') === 'true') return;
      host.setAttribute('data-vmfm-v89-events', 'true');
      host.addEventListener('modalVisibilityChanged', function (event) {
        var opened = eventIsOpen(event);
        var source = panelSource || action || ('panel-' + host.localName);
        setPanelSource(source, opened);
        schedulePanelSync();
        if (opened && action) beginTransient(action, itemForAction(action));
        else if (!opened && action && activeAction === action) clearTransient(action);
      });
    }

    function bindKnownModals() {
      bindModalEvents(document.querySelector('salla-login-modal'), 'account', 'account');
      bindModalEvents(document.querySelector('salla-search:not([inline])'), 'search', 'search');
      bindModalEvents(
        document.querySelector('salla-localization-modal'),
        itemForAction('localization') ? 'localization' : '',
        'localization'
      );

      document.querySelectorAll('salla-modal, salla-sheet, salla-user-menu, salla-scopes').forEach(function (host, index) {
        bindModalEvents(host, '', 'generic-' + index);
      });
    }

    function refreshDetectedPanels() {
      setPanelSource('search-detected', isSearchOpen());
      setPanelSource('login-detected', isLoginOpen());
      setPanelSource('localization-detected', isLocalizationOpen());
    }

    primeCustomItems();
    decoratePanelHosts(document);
    bindKnownModals();
    schedulePanelSync();

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(function () {
        measureMenuOffset();
        syncIndicator();
      });
      resizeObserver.observe(menu);
      if (inner) resizeObserver.observe(inner);
    }

    if (typeof MutationObserver === 'function') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            decoratePanelHosts(node);
          });
        });
        bindKnownModals();
        primeCustomItems();
        measureMenuOffset();
        syncIndicator();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    window.setInterval(refreshDetectedPanels, 300);
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (activeAction) closeAction(activeAction);
      else window.setTimeout(function () { restoreRouteActive(); refreshDetectedPanels(); }, 180);
    });
    window.addEventListener('popstate', function () { clearTransient(); });
    window.addEventListener('hashchange', function () { clearTransient(); });
    window.addEventListener('pageshow', function () { restoreRouteActive(); schedulePanelSync(); });
    window.addEventListener('resize', schedulePanelSync, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', schedulePanelSync, { passive: true });
    document.addEventListener('theme::ready', function () { restoreRouteActive(); schedulePanelSync(); });

    restoreRouteActive();
  }

  domReady(function () {
    if (window.salla && typeof salla.onReady === 'function') salla.onReady(boot);
    else boot();
  });
})();
