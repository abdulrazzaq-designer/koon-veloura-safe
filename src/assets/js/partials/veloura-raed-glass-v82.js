/* Veloura V82 — Theme Raed component bridge.
 * Keeps Salla Web Component internals aligned with the outer glass material.
 * Cart handling remains native: no proxy click and no direct cart API call.
 */
(() => {
  'use strict';

  const STYLE_ID = 'veloura-v82-component-style';
  const SEARCH_STYLE_ID = 'veloura-v82-search-style';
  const CART_STYLE_ID = 'veloura-v82-cart-style';
  const observedRoots = new WeakSet();

  const COMPONENTS = [
    'salla-search',
    'salla-login-modal',
    'salla-localization-modal',
    'salla-user-menu',
    'salla-scopes',
    'salla-modal',
    'salla-sheet',
    'salla-add-product-button'
  ];

  const SELECTOR = COMPONENTS.join(',');

  const searchCss = `
    :host([data-veloura-v82-inline-search='true']) {
      color: var(--veloura-v82-primary, #111827) !important;
      --color-text: var(--veloura-v82-primary, #111827) !important;
      --color-muted: var(--veloura-v82-secondary, #64748b) !important;
      --s-search-bg: transparent !important;
      --s-search-input-bg: transparent !important;
      --s-search-input-background: transparent !important;
      --search-background: transparent !important;
    }

    :host([data-veloura-v82-inline-search='true']),
    :host([data-veloura-v82-inline-search='true']) form,
    :host([data-veloura-v82-inline-search='true']) input,
    :host([data-veloura-v82-inline-search='true']) .s-search-input,
    :host([data-veloura-v82-inline-search='true']) .s-search-container,
    :host([data-veloura-v82-inline-search='true']) .s-search-wrapper,
    :host([data-veloura-v82-inline-search='true']) [part~='input'],
    :host([data-veloura-v82-inline-search='true']) [part~='form'],
    :host([data-veloura-v82-inline-search='true']) [part~='container'] {
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    :host([data-veloura-v82-inline-search='true']) input {
      color: var(--veloura-v82-primary, #111827) !important;
      -webkit-text-fill-color: currentColor !important;
    }

    :host([data-veloura-v82-inline-search='true']) input::placeholder {
      color: var(--veloura-v82-secondary, #64748b) !important;
      -webkit-text-fill-color: currentColor !important;
      opacity: .78 !important;
    }

    :host([data-veloura-v82-inline-search='true']) :is(
      button, i, svg, .s-search-icon, .sicon-search
    ) {
      color: var(--veloura-v82-primary, #111827) !important;
    }
  `;

  const componentCss = `
    :host([data-veloura-v82-dark='true']) {
      color: var(--veloura-v82-primary, #fff) !important;
      --color-text: var(--veloura-v82-primary, #fff) !important;
      --color-muted: var(--veloura-v82-secondary, #ccc) !important;
      --color-grey: var(--veloura-v82-secondary, #ccc) !important;
      --color-grey-dark: var(--veloura-v82-primary, #fff) !important;
      --color-grey-darker: var(--veloura-v82-primary, #fff) !important;
    }

    :host([data-veloura-v82-glass='true']) :is(
      .s-modal-wrapper,
      .s-modal-container,
      .s-modal-body,
      .s-modal-content,
      .s-sheet-wrapper,
      .s-sheet-container,
      .s-sheet-body,
      .s-user-menu-wrapper,
      .s-user-menu-dropdown,
      .s-localization-modal,
      .s-login-modal,
      [part~='dialog'],
      [part~='content'],
      [part~='body'],
      [role='dialog']
    ) {
      background: var(--veloura-v82-surface, rgba(248,249,250,.60)) !important;
      background-color: var(--veloura-v82-surface, rgba(248,249,250,.60)) !important;
      background-image: none !important;
      border-top: 1px solid var(--veloura-v82-edge-top, rgba(148,163,184,.16)) !important;
      border-bottom: 1px solid var(--veloura-v82-edge-bottom, rgba(148,163,184,.08)) !important;
      border-inline: 0 !important;
      -webkit-backdrop-filter: var(--veloura-v82-filter, blur(22px) saturate(118%)) !important;
      backdrop-filter: var(--veloura-v82-filter, blur(22px) saturate(118%)) !important;
      color: var(--veloura-v82-primary, #111827) !important;
      box-shadow: 0 8px 24px var(--veloura-v82-shadow, rgba(15,23,42,.045)) !important;
    }

    :host([data-veloura-v82-dark='true']) :is(
      h1, h2, h3, h4, h5, h6,
      .s-modal-title,
      .s-login-modal-title,
      .s-user-menu-title,
      [part~='title']
    ) {
      color: var(--veloura-v82-primary, #fff) !important;
      -webkit-text-fill-color: currentColor !important;
    }

    :host([data-veloura-v82-dark='true']) :is(
      p, small, label,
      .text-gray-400, .text-gray-500, .text-gray-600,
      .text-muted,
      [part~='description']
    ) {
      color: var(--veloura-v82-secondary, #ccc) !important;
      -webkit-text-fill-color: currentColor !important;
    }
  `;

  const cartCss = `
    :host {
      position: relative !important;
      z-index: 2 !important;
      display: flex !important;
      width: 100% !important;
      min-width: 0 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      touch-action: manipulation !important;
      isolation: isolate !important;
    }

    button,
    .s-button-element,
    .s-button-btn,
    [part~='button'],
    salla-button {
      position: relative !important;
      z-index: 3 !important;
      width: 100% !important;
      min-width: 0 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      touch-action: manipulation !important;
    }

    :is(
      button,
      .s-button-element,
      .s-button-btn,
      [part~='button'],
      salla-button
    )::before,
    :is(
      button,
      .s-button-element,
      .s-button-btn,
      [part~='button'],
      salla-button
    )::after {
      pointer-events: none !important;
    }
  `;

  function isDark() {
    const html = document.documentElement;
    const body = document.body;
    return Boolean(
      html.classList.contains('dark') ||
      body?.classList.contains('dark') ||
      html.getAttribute('data-theme') === 'dark' ||
      body?.getAttribute('data-theme') === 'dark'
    );
  }

  function glassEnabled() {
    return Boolean(
      document.body?.classList.contains('veloura-glass-effect') ||
      document.querySelector('.veloura-header-tabs-stack--blur') ||
      document.body?.classList.contains('veloura-mobile-floating-menu-glass')
    );
  }

  function rootValue(name, fallback) {
    const value = window.getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  }

  function upsertStyle(root, id, css) {
    if (!root || typeof root.querySelector !== 'function') return;
    let style = root.querySelector(`#${id}`);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      root.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }

  function syncTokens(host) {
    if (!host?.style) return;

    const dark = isDark();
    host.setAttribute('data-veloura-v82-dark', dark ? 'true' : 'false');
    host.setAttribute('data-veloura-v82-glass', glassEnabled() ? 'true' : 'false');

    host.style.setProperty(
      '--veloura-v82-primary',
      dark
        ? rootValue('--veloura-dark-primary-text', '#ffffff')
        : rootValue('--color-text', '#111827')
    );
    host.style.setProperty(
      '--veloura-v82-secondary',
      dark
        ? rootValue('--veloura-dark-secondary-text', '#cccccc')
        : rootValue('--color-grey', '#64748b')
    );
    host.style.setProperty(
      '--veloura-v82-surface',
      rootValue('--veloura-v82-surface', dark ? '#010612' : 'rgba(248,249,250,.60)')
    );
    host.style.setProperty(
      '--veloura-v82-edge-top',
      rootValue('--veloura-v82-edge-top', dark ? 'rgba(255,255,255,.12)' : 'rgba(148,163,184,.16)')
    );
    host.style.setProperty(
      '--veloura-v82-edge-bottom',
      rootValue('--veloura-v82-edge-bottom', dark ? 'rgba(255,255,255,.06)' : 'rgba(148,163,184,.08)')
    );
    host.style.setProperty('--veloura-v82-filter', rootValue('--veloura-v82-filter', 'blur(22px) saturate(118%)'));
    host.style.setProperty('--veloura-v82-shadow', rootValue('--veloura-v82-shadow', 'rgba(15,23,42,.045)'));
  }

  function observeRoot(root) {
    if (!root || observedRoots.has(root) || typeof MutationObserver !== 'function') return;

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) scan(node);
        });
      });
    });
    observer.observe(root, { childList: true, subtree: true });
    observedRoots.add(root);
  }

  function decorate(host) {
    if (!host) return;
    syncTokens(host);

    if (host.matches('salla-search')) {
      const inline = Boolean(host.closest('.veloura-search-surface'));
      host.setAttribute('data-veloura-v82-inline-search', inline ? 'true' : 'false');

      if (inline) {
        [
          '--s-search-bg',
          '--s-search-input-bg',
          '--s-search-input-background',
          '--search-background'
        ].forEach((name) => host.style.setProperty(name, 'transparent', 'important'));
      }
    }

    const applyShadow = () => {
      const root = host.shadowRoot;
      if (!root) return;

      upsertStyle(root, STYLE_ID, componentCss);
      if (host.matches('salla-search')) upsertStyle(root, SEARCH_STYLE_ID, searchCss);
      if (host.matches('salla-add-product-button')) upsertStyle(root, CART_STYLE_ID, cartCss);

      observeRoot(root);
      scan(root);
    };

    applyShadow();

    if (typeof host.componentOnReady === 'function' && !host.__velouraV82Ready) {
      host.__velouraV82Ready = true;
      Promise.resolve(host.componentOnReady())
        .then(() => {
          syncTokens(host);
          applyShadow();
        })
        .catch(() => {});
    }
  }

  function scan(scope = document) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    if (scope.matches?.(SELECTOR)) decorate(scope);
    scope.querySelectorAll(SELECTOR).forEach(decorate);
  }

  function scanSoon() {
    [0, 60, 180, 420, 900, 1800].forEach((delay) => {
      window.setTimeout(() => scan(document), delay);
    });
  }

  function registerSallaHooks() {
    const api = window.Salla || window.salla;
    if (!api?.onReady) return false;

    api.onReady(() => {
      const hooks = api.hooks;
      if (hooks?.registerHook) {
        COMPONENTS.forEach((component) => {
          try {
            hooks.registerHook(component, 'componentDidLoad', (element) => {
              decorate(element);
              scanSoon();
            });
          } catch (_) {
            /* Unsupported component hook: MutationObserver remains the fallback. */
          }
        });
      }
      scanSoon();
    });

    return true;
  }

  function init() {
    observeRoot(document.documentElement);
    registerSallaHooks();
    scanSoon();

    document.addEventListener('theme::ready', scanSoon);
    document.addEventListener('veloura:theme-changed', scanSoon);

    if (typeof MutationObserver === 'function') {
      const themeObserver = new MutationObserver(scanSoon);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
      });

      if (document.body) {
        themeObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'data-theme']
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
