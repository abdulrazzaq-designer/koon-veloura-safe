#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER_PATH = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE_PATH = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT_PATH = path.join(ROOT, 'twilight.json');
const UNSAFE_PARTIAL_PATH = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');
const BACKUP_DIR = path.join(ROOT, '.veloura-product-ui-final-backup');

const FINAL_BLOCK = "{# Veloura Product UI Final Stable 2026 start #}\n<style id=\"veloura-product-ui-final-style-2026\">\n  :root {\n    --veloura-vpu-card-native-inline: 12px;\n  }\n\n  @media (min-width: 640px) {\n    :root {\n      --veloura-vpu-card-native-inline: 20px;\n    }\n  }\n\n  /* ================================================================\n     Product cards: one stable geometry, no measuring or resize loops.\n     ================================================================ */\n  html body.veloura-product-card-enabled :is(salla-product-card, product-card, custom-salla-product-card),\n  html body.veloura-product-card-enabled .s-product-card-entry {\n    display: block !important;\n    min-width: 0 !important;\n    max-width: 100% !important;\n    box-sizing: border-box !important;\n  }\n\n  html body.veloura-product-card-enabled :is(salla-product-card, product-card, custom-salla-product-card) {\n    height: 100% !important;\n    align-self: stretch !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry {\n    display: flex !important;\n    flex-direction: column !important;\n    width: 100% !important;\n    height: 100% !important;\n    overflow: hidden !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image,\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image > a,\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image img {\n    min-width: 0 !important;\n    max-width: 100% !important;\n    box-sizing: border-box !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image {\n    flex: 0 0 auto !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image img {\n    display: block !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content {\n    display: flex !important;\n    flex: 1 1 auto !important;\n    flex-direction: column !important;\n    width: 100% !important;\n    min-width: 0 !important;\n    min-height: 0 !important;\n    box-sizing: border-box !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-sub,\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-price,\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-price {\n    margin-top: auto !important;\n  }\n\n  /* Remove only the native lower padding when the cart action exists.\n     This makes bottom setting 0 a literal card-edge zero. */\n  html body.veloura-product-card-enabled:not(.veloura-pc-hide-cart) .s-product-card-entry .s-product-card-content:has(.s-product-card-content-footer) {\n    padding-bottom: 0 !important;\n  }\n\n  /* The native card content has 12px mobile / 20px desktop padding.\n     Compensating for it makes horizontal setting 0 touch the true card edge. */\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer,\n  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap {\n    position: relative !important;\n    display: flex !important;\n    width: calc(\n      100%\n      + (var(--veloura-vpu-card-native-inline) * 2)\n      - (var(--veloura-product-button-margin-x, 0px) * 2)\n    ) !important;\n    max-width: none !important;\n    min-width: 0 !important;\n    flex: 0 0 auto !important;\n    margin-inline: calc(\n      var(--veloura-product-button-margin-x, 0px)\n      - var(--veloura-vpu-card-native-inline)\n    ) !important;\n    padding: 0 !important;\n    box-sizing: border-box !important;\n    align-items: stretch !important;\n    justify-content: center !important;\n    transform: none !important;\n    inset: auto !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer {\n    margin-top: 10px !important;\n    margin-bottom: var(--veloura-product-button-margin-bottom, 0px) !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer:has(+ .veloura-quick-view-under-cart-wrap) {\n    margin-bottom: 0 !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap {\n    margin-top: 10px !important;\n    margin-bottom: var(--veloura-product-button-margin-bottom, 0px) !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer > *,\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button,\n  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap > *,\n  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn {\n    display: flex !important;\n    width: 100% !important;\n    max-width: 100% !important;\n    min-width: 0 !important;\n    margin: 0 !important;\n    box-sizing: border-box !important;\n    align-items: center !important;\n    justify-content: center !important;\n    transform: none !important;\n  }\n\n  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button {\n    height: var(--veloura-product-button-height, 42px) !important;\n    min-height: var(--veloura-product-button-height, 42px) !important;\n    max-height: none !important;\n    border-radius: var(--veloura-product-button-radius, 0px) !important;\n    overflow: visible !important;\n    opacity: 1 !important;\n    visibility: visible !important;\n  }\n\n  /* Related + recently viewed always use the same custom card component. */\n  html body .veloura-product-related-products,\n  html body .veloura-product-recent-products {\n    display: block !important;\n    width: 100% !important;\n    clear: both !important;\n    margin-top: 34px !important;\n    box-sizing: border-box !important;\n  }\n\n  html body .veloura-product-related-products salla-products-slider,\n  html body .veloura-product-recent-products salla-products-slider {\n    display: block !important;\n    width: 100% !important;\n    min-width: 0 !important;\n  }\n\n  html body .veloura-product-related-heading {\n    display: flex !important;\n    width: 100% !important;\n    margin: 0 0 18px !important;\n    align-items: center !important;\n    justify-content: flex-start !important;\n  }\n\n  html body .veloura-product-related-title {\n    display: block !important;\n    width: 100% !important;\n    margin: 0 !important;\n    text-align: right !important;\n    font-size: 1.35rem !important;\n    font-weight: 800 !important;\n    line-height: 1.45 !important;\n  }\n\n  html body :is(.veloura-product-related-products, .veloura-product-recent-products).is-title-centered .veloura-product-related-heading {\n    justify-content: center !important;\n  }\n\n  html body :is(.veloura-product-related-products, .veloura-product-recent-products).is-title-centered .veloura-product-related-title {\n    text-align: center !important;\n  }\n\n  html body :is(.veloura-product-related-products, .veloura-product-recent-products).is-arrows-hidden :is(\n    .s-slider-next,\n    .s-slider-prev,\n    [class*=\"slider-next\"],\n    [class*=\"slider-prev\"]\n  ) {\n    display: none !important;\n    visibility: hidden !important;\n    opacity: 0 !important;\n    pointer-events: none !important;\n  }\n\n  /* ================================================================\n     Read more: the button center sits on the description lower edge.\n     ================================================================ */\n  html body .veloura-product-page .product__description {\n    position: relative !important;\n    overflow: visible !important;\n  }\n\n  html body .veloura-product-page .product__description:has(#btn-show-more) {\n    margin-bottom: 48px !important;\n  }\n\n  html body .veloura-product-page #btn-show-more.veloura-product-read-more {\n    position: absolute !important;\n    inset-inline-start: 50% !important;\n    left: 50% !important;\n    right: auto !important;\n    bottom: 0 !important;\n    transform: translate(-50%, 50%) !important;\n    z-index: 5 !important;\n    margin: 0 !important;\n    border-radius: var(--veloura-product-radius, 0px) !important;\n    box-shadow: 0 0 0 7px var(--veloura-product-bg-inline, var(--veloura-site-bg, #fff)) !important;\n    clip-path: none !important;\n    overflow: hidden !important;\n  }\n\n  html body .veloura-product-page #btn-show-more.veloura-product-read-more > * {\n    border-radius: inherit !important;\n  }\n\n  html.dark body .veloura-product-page #btn-show-more.veloura-product-read-more,\n  html body.dark .veloura-product-page #btn-show-more.veloura-product-read-more {\n    box-shadow: 0 0 0 7px var(--veloura-product-dark-bg-inline, #010202) !important;\n  }\n\n  /* ================================================================\n     Product thumbnails: active frame inherits the global product radius.\n     ================================================================ */\n  html body .veloura-product-page .veloura-product-thumb-item,\n  html body .veloura-product-page .veloura-product-thumb-item > img,\n  html body .veloura-product-page .veloura-product-thumb-item.swiper-slide-thumb-active,\n  html body .veloura-product-page [slot=\"thumbs\"] .swiper-slide,\n  html body .veloura-product-page [slot=\"thumbs\"] .swiper-slide > *,\n  html body .veloura-product-page [slot=\"thumbs\"] img,\n  html body .veloura-product-page [slot=\"thumbs\"] .swiper-slide-thumb-active,\n  html body .veloura-product-page [slot=\"thumbs\"] .swiper-slide-thumb-active > *,\n  html body .veloura-product-page [slot=\"thumbs\"] .swiper-slide-thumb-active img {\n    border-radius: var(--veloura-product-radius, 0px) !important;\n    overflow: hidden !important;\n  }\n\n  html body .veloura-product-page .veloura-product-thumb-item::before,\n  html body .veloura-product-page .veloura-product-thumb-item::after,\n  html body .veloura-product-page .swiper-slide-thumb-active::before,\n  html body .veloura-product-page .swiper-slide-thumb-active::after {\n    border-radius: inherit !important;\n  }\n\n  /* ================================================================\n     Purchase surface: normal state is secondary and never glass.\n     ================================================================ */\n  html body .veloura-product-page .veloura-product-sticky-bar {\n    position: relative !important;\n    inset: auto !important;\n    left: auto !important;\n    right: auto !important;\n    bottom: auto !important;\n    width: 100% !important;\n    max-width: 100% !important;\n    margin: 0 !important;\n    transform: none !important;\n    background: var(--veloura-product-secondary-bg-inline, var(--veloura-site-second-bg, #f8fafc)) !important;\n    background-color: var(--veloura-product-secondary-bg-inline, var(--veloura-site-second-bg, #f8fafc)) !important;\n    background-image: none !important;\n    border-radius: var(--veloura-product-radius, 0px) !important;\n    -webkit-backdrop-filter: none !important;\n    backdrop-filter: none !important;\n    filter: none !important;\n    box-sizing: border-box !important;\n    overflow: visible !important;\n    opacity: 1 !important;\n    visibility: visible !important;\n  }\n\n  html.dark body .veloura-product-page .veloura-product-sticky-bar,\n  html body.dark .veloura-product-page .veloura-product-sticky-bar {\n    background: var(--veloura-product-dark-secondary-bg-inline, #111) !important;\n    background-color: var(--veloura-product-dark-secondary-bg-inline, #111) !important;\n  }\n\n  html body .veloura-product-page .veloura-product-sticky-bar salla-add-product-button {\n    display: block !important;\n    width: 100% !important;\n    max-width: 100% !important;\n    min-width: 0 !important;\n    height: auto !important;\n    min-height: var(--veloura-product-button-height, 42px) !important;\n    max-height: none !important;\n    margin: 0 !important;\n    padding: 0 !important;\n    border-radius: var(--veloura-product-radius, 0px) !important;\n    opacity: 1 !important;\n    visibility: visible !important;\n    overflow: visible !important;\n    box-sizing: border-box !important;\n  }\n\n  @media (max-width: 767px) {\n    html body .veloura-product-page.veloura-product-mobile-sticky-enabled .veloura-product-sticky-bar {\n      position: fixed !important;\n      top: auto !important;\n      z-index: 2147483000 !important;\n      opacity: 1 !important;\n      visibility: visible !important;\n    }\n\n    html body .veloura-product-page.veloura-product-mobile-sticky-enabled:not(.veloura-product-buttons-compact) .veloura-product-sticky-bar {\n      inset-inline: 0 !important;\n      left: 0 !important;\n      right: 0 !important;\n      bottom: 0 !important;\n      width: 100% !important;\n      max-width: 100vw !important;\n      border-start-start-radius: var(--veloura-product-radius, 0px) !important;\n      border-start-end-radius: var(--veloura-product-radius, 0px) !important;\n      border-end-start-radius: 0 !important;\n      border-end-end-radius: 0 !important;\n    }\n\n    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .veloura-product-sticky-bar {\n      inset-inline: 12px !important;\n      left: 12px !important;\n      right: 12px !important;\n      bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;\n      width: auto !important;\n      max-width: calc(100vw - 24px) !important;\n      border-radius: var(--veloura-product-radius, 0px) !important;\n    }\n\n    /* Glass is allowed only in the actually fixed mobile state. */\n    html body.veloura-glass-effect .veloura-product-page.veloura-product-mobile-sticky-enabled .veloura-product-sticky-bar {\n      background: color-mix(\n        in srgb,\n        var(--veloura-product-secondary-bg-inline, var(--veloura-site-second-bg, #f8fafc)) 68%,\n        transparent\n      ) !important;\n      background-color: color-mix(\n        in srgb,\n        var(--veloura-product-secondary-bg-inline, var(--veloura-site-second-bg, #f8fafc)) 68%,\n        transparent\n      ) !important;\n      border: 1px solid rgba(255, 255, 255, .46) !important;\n      -webkit-backdrop-filter: blur(18px) saturate(130%) !important;\n      backdrop-filter: blur(18px) saturate(130%) !important;\n      box-shadow: 0 16px 44px rgba(15, 23, 42, .22) !important;\n    }\n\n    html.dark body.veloura-glass-effect .veloura-product-page.veloura-product-mobile-sticky-enabled .veloura-product-sticky-bar,\n    html body.dark.veloura-glass-effect .veloura-product-page.veloura-product-mobile-sticky-enabled .veloura-product-sticky-bar {\n      background: color-mix(\n        in srgb,\n        var(--veloura-product-dark-secondary-bg-inline, #111) 72%,\n        transparent\n      ) !important;\n      background-color: color-mix(\n        in srgb,\n        var(--veloura-product-dark-secondary-bg-inline, #111) 72%,\n        transparent\n      ) !important;\n    }\n  }\n\n  /* Quick View modal and its controls respect their own radius settings. */\n  html body .veloura-qv-full .veloura-qv-full__dialog,\n  html body .veloura-quick-view-modal .veloura-quick-view-modal__dialog {\n    border-radius: var(--veloura-quick-view-modal-radius, 0px) !important;\n    overflow: hidden !important;\n  }\n\n  html body .veloura-qv-full :is(\n    .veloura-qv-full__circle,\n    .veloura-qv-full__add,\n    .veloura-qv-full__read-more,\n    .veloura-qv-full__close,\n    .veloura-qv-full__qty\n  ),\n  html body .veloura-quick-view-modal :is(\n    .veloura-quick-view-modal__link,\n    .veloura-quick-view-modal__close\n  ) {\n    border-radius: var(--veloura-quick-view-button-radius, 0px) !important;\n  }\n\n  /* Guaranteed clearance before the footer on product pages. */\n  html body.veloura-is-product-page #main-content {\n    padding-bottom: clamp(56px, 7vw, 96px) !important;\n  }\n</style>\n\n<script data-cfasync=\"false\" id=\"veloura-product-ui-final-runtime-2026\">\n(function () {\n  'use strict';\n\n  var MASTER_STYLE_ID = 'veloura-product-ui-final-style-2026';\n  var RECENT_KEY = 'veloura_recent_product_ids_2026';\n  var scheduled = false;\n\n  function ensureMasterStyleLast() {\n    var style = document.getElementById(MASTER_STYLE_ID);\n    if (style && document.head && document.head.lastElementChild !== style) {\n      document.head.appendChild(style);\n    }\n  }\n\n  function cssValue(name, fallback) {\n    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();\n    return value || fallback;\n  }\n\n  function ensureStyle(root, id, css) {\n    if (!root || !root.querySelector || root.querySelector('#' + id)) return;\n    var style = document.createElement('style');\n    style.id = id;\n    style.textContent = css;\n    root.appendChild(style);\n  }\n\n  function styleActionElement(element, bg, fg, radius, height, id) {\n    if (!element) return;\n    element.style.setProperty('display', 'block', 'important');\n    element.style.setProperty('width', '100%', 'important');\n    element.style.setProperty('max-width', '100%', 'important');\n    element.style.setProperty('min-width', '0', 'important');\n    element.style.setProperty('border-radius', radius, 'important');\n    element.style.setProperty('opacity', '1', 'important');\n    element.style.setProperty('visibility', 'visible', 'important');\n    element.style.setProperty('overflow', 'visible', 'important');\n\n    if (!element.shadowRoot) return;\n    ensureStyle(\n      element.shadowRoot,\n      id,\n      ':host{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;' +\n      'border-radius:' + radius + '!important;opacity:1!important;visibility:visible!important;overflow:visible!important}' +\n      'button,.s-button-element,.s-button-btn,a[role=\"button\"]{' +\n      'display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;' +\n      'height:' + height + '!important;min-height:' + height + '!important;' +\n      'align-items:center!important;justify-content:center!important;' +\n      'background:' + bg + '!important;background-color:' + bg + '!important;' +\n      'border-color:' + bg + '!important;color:' + fg + '!important;' +\n      'border-radius:' + radius + '!important;opacity:1!important;visibility:visible!important;overflow:hidden!important}' +\n      'button *,.s-button-element *,.s-button-btn *,a[role=\"button\"] *{' +\n      'color:' + fg + '!important;fill:' + fg + '!important;stroke:currentColor!important}'\n    );\n  }\n\n  function styleAddProductHost(host, context) {\n    if (!host) return;\n    host.setAttribute('width', 'wide');\n    try { host.width = 'wide'; } catch (error) {}\n\n    var cardBg = cssValue('--veloura-product-button-bg', cssValue('--color-primary', '#004d65'));\n    var cardFg = cssValue('--veloura-product-button-text', '#ffffff');\n    var cardRadius = context === 'purchase'\n      ? cssValue('--veloura-product-radius', '0px')\n      : cssValue('--veloura-product-button-radius', '0px');\n    var height = cssValue('--veloura-product-button-height', '42px');\n    var quickBg = cssValue('--color-primary', cardBg);\n    var quickFg = cssValue('--color-primary-reverse', '#ffffff');\n\n    host.style.setProperty('display', 'block', 'important');\n    host.style.setProperty('width', '100%', 'important');\n    host.style.setProperty('max-width', '100%', 'important');\n    host.style.setProperty('min-width', '0', 'important');\n    host.style.setProperty('height', 'auto', 'important');\n    host.style.setProperty('max-height', 'none', 'important');\n    host.style.setProperty('border-radius', cardRadius, 'important');\n    host.style.setProperty('opacity', '1', 'important');\n    host.style.setProperty('visibility', 'visible', 'important');\n    host.style.setProperty('overflow', 'visible', 'important');\n\n    if (!host.shadowRoot) return;\n    ensureStyle(\n      host.shadowRoot,\n      'veloura-vpu-add-host-' + context,\n      ':host{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;' +\n      'height:auto!important;max-height:none!important;border-radius:' + cardRadius + '!important;' +\n      'opacity:1!important;visibility:visible!important;overflow:visible!important}' +\n      '.s-add-product-button-main{display:flex!important;width:100%!important;max-width:100%!important;' +\n      'min-width:0!important;height:auto!important;max-height:none!important;gap:10px!important;' +\n      'align-items:stretch!important;flex-wrap:wrap!important;overflow:visible!important}' +\n      'salla-button,salla-quick-buy,salla-mini-checkout-widget{' +\n      'display:block!important;flex:1 1 140px!important;min-width:0!important;max-width:100%!important;' +\n      'border-radius:' + cardRadius + '!important;opacity:1!important;visibility:visible!important;overflow:visible!important}'\n    );\n\n    var actions = host.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget');\n    actions.forEach(function (action, index) {\n      var name = String(action.localName || '').toLowerCase();\n      var isQuick = name.indexOf('quick') !== -1 || name.indexOf('checkout') !== -1 || (context === 'purchase' && index > 0);\n      styleActionElement(\n        action,\n        isQuick ? quickBg : cardBg,\n        isQuick ? quickFg : cardFg,\n        cardRadius,\n        height,\n        'veloura-vpu-action-' + context + '-' + index\n      );\n\n      if (action.shadowRoot) {\n        action.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget').forEach(function (nested, nestedIndex) {\n          styleActionElement(\n            nested,\n            isQuick ? quickBg : cardBg,\n            isQuick ? quickFg : cardFg,\n            cardRadius,\n            height,\n            'veloura-vpu-nested-' + context + '-' + index + '-' + nestedIndex\n          );\n        });\n      }\n    });\n  }\n\n  function styleThumbSlider(slider) {\n    if (!slider || !slider.shadowRoot) return;\n    ensureStyle(\n      slider.shadowRoot,\n      'veloura-vpu-thumb-radius',\n      '.s-slider-thumbs .swiper-slide,.s-slider-thumbs .swiper-slide>*,.s-slider-thumbs img,' +\n      '[class*=\"thumb\"] .swiper-slide,[class*=\"thumb\"] .swiper-slide>*,[class*=\"thumb\"] img{' +\n      'border-radius:var(--veloura-product-radius,0px)!important;overflow:hidden!important}' +\n      '.s-slider-thumbs .swiper-slide-thumb-active,.s-slider-thumbs .swiper-slide-thumb-active>*,' +\n      '.s-slider-thumbs .swiper-slide-thumb-active img{' +\n      'border-radius:var(--veloura-product-radius,0px)!important;overflow:hidden!important}'\n    );\n  }\n\n  function hideSliderArrows(wrapper) {\n    if (!wrapper || !wrapper.classList.contains('is-arrows-hidden')) return;\n    var slider = wrapper.querySelector('salla-products-slider');\n    if (!slider || !slider.shadowRoot) return;\n    ensureStyle(\n      slider.shadowRoot,\n      'veloura-vpu-hidden-arrows',\n      '.s-slider-next,.s-slider-prev,[class*=\"slider-next\"],[class*=\"slider-prev\"]{' +\n      'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}'\n    );\n  }\n\n  function buildRecentlyViewed() {\n    var section = document.querySelector('[data-veloura-recent-products]');\n    if (!section || section.getAttribute('data-veloura-recent-built') === 'true') return;\n\n    var current = String(section.getAttribute('data-current-product-id') || '').trim();\n    if (!current) return;\n\n    var stored = [];\n    try {\n      var parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');\n      if (Array.isArray(parsed)) stored = parsed.map(String);\n    } catch (error) {}\n\n    var previous = stored.filter(function (id, index, list) {\n      return id && id !== current && list.indexOf(id) === index;\n    }).slice(0, 20);\n\n    try {\n      window.localStorage.setItem(RECENT_KEY, JSON.stringify([current].concat(previous).slice(0, 20)));\n    } catch (error) {}\n\n    section.setAttribute('data-veloura-recent-built', 'true');\n    if (!previous.length) return;\n\n    var mobile = Math.max(1, parseInt(section.getAttribute('data-mobile-columns') || '2', 10) || 2);\n    var desktop = Math.max(1, parseInt(section.getAttribute('data-desktop-columns') || '4', 10) || 4);\n    var host = section.querySelector('[data-veloura-recent-slider-host]');\n    if (!host) return;\n\n    var slider = document.createElement('salla-products-slider');\n    slider.setAttribute('source', 'selected');\n    slider.setAttribute('source-value', JSON.stringify(previous.map(function (id) {\n      return /^\\d+$/.test(id) ? Number(id) : id;\n    })));\n    slider.setAttribute('product-card-component', 'custom-salla-product-card');\n    slider.setAttribute('data-veloura-recent-slider', '');\n    slider.setAttribute('slider-config', JSON.stringify({\n      slidesPerView: mobile,\n      slidesPerGroup: 1,\n      spaceBetween: 12,\n      centeredSlides: false,\n      centeredSlidesBounds: false,\n      centerInsufficientSlides: false,\n      freeMode: false,\n      roundLengths: true,\n      slidesOffsetBefore: 0,\n      slidesOffsetAfter: 0,\n      breakpoints: {\n        768: {\n          slidesPerView: desktop,\n          slidesPerGroup: 1,\n          spaceBetween: 16,\n          centeredSlides: false,\n          freeMode: false,\n          roundLengths: true,\n          slidesOffsetBefore: 0,\n          slidesOffsetAfter: 0\n        }\n      }\n    }));\n\n    host.appendChild(slider);\n    section.hidden = false;\n  }\n\n  function scanOpenRoots(root) {\n    if (!root || !root.querySelectorAll) return;\n\n    root.querySelectorAll('salla-add-product-button').forEach(function (host) {\n      styleAddProductHost(host, host.closest('[data-veloura-purchase-bar]') ? 'purchase' : 'card');\n    });\n\n    root.querySelectorAll('.veloura-product-page salla-slider.details-slider').forEach(styleThumbSlider);\n    root.querySelectorAll('.veloura-product-related-products.is-arrows-hidden,.veloura-product-recent-products.is-arrows-hidden').forEach(hideSliderArrows);\n\n    root.querySelectorAll('*').forEach(function (element) {\n      if (element.shadowRoot) scanOpenRoots(element.shadowRoot);\n    });\n  }\n\n  function scan() {\n    ensureMasterStyleLast();\n    buildRecentlyViewed();\n    scanOpenRoots(document);\n  }\n\n  function schedule() {\n    if (scheduled) return;\n    scheduled = true;\n    window.requestAnimationFrame(function () {\n      scheduled = false;\n      scan();\n    });\n  }\n\n  function start() {\n    scan();\n    [120, 360, 800, 1500, 2600].forEach(function (delay) {\n      window.setTimeout(scan, delay);\n    });\n\n    ['salla-add-product-button', 'salla-button', 'salla-quick-buy', 'salla-products-slider', 'salla-slider', 'custom-salla-product-card'].forEach(function (name) {\n      if (window.customElements && customElements.whenDefined) {\n        customElements.whenDefined(name).then(schedule).catch(function () {});\n      }\n    });\n  }\n\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', start, { once: true });\n  } else {\n    start();\n  }\n\n  document.addEventListener('theme::ready', schedule);\n  document.addEventListener('salla::products::loaded', schedule);\n  document.addEventListener('salla::product.cards::loaded', schedule);\n  document.addEventListener('salla::product::details::loaded', schedule);\n  window.addEventListener('pageshow', schedule, { passive: true });\n})();\n</script>\n{# Veloura Product UI Final Stable 2026 end #}\n";
const RECENT_SETTINGS_TWIG = "    {# Veloura Product UI Final recently viewed settings start #}\n    {% set vpp_recent_products_enabled = _self.veloura_bool(theme.settings.get('veloura_recent_products_enabled_2026', false), false)|trim == 'true' %}\n    {% set vpp_recent_products_inherit_related = _self.veloura_bool(theme.settings.get('veloura_recent_products_inherit_related_2026', true), true)|trim == 'true' %}\n    {# Veloura Product UI Final recently viewed settings end #}\n";
const RECENT_MARKUP = "    {# Veloura Product UI Final recently viewed products start #}\n    {% if vpp_enabled and vpp_recent_products_enabled %}\n        {% set vpp_recent_mobile_columns = vpp_recent_products_inherit_related ? vpp_related_mobile_columns : 2 %}\n        {% set vpp_recent_desktop_columns = vpp_recent_products_inherit_related ? vpp_related_desktop_columns : 4 %}\n        {% set vpp_recent_hide_arrows = vpp_recent_products_inherit_related ? vpp_related_hide_arrows : false %}\n        {% set vpp_recent_center_title = vpp_recent_products_inherit_related ? vpp_related_center_title : false %}\n\n        <div hidden\n             class=\"container veloura-product-recent-products {{ vpp_recent_center_title ? 'is-title-centered' : '' }} {{ vpp_recent_hide_arrows ? 'is-arrows-hidden' : '' }}\"\n             data-veloura-recent-products\n             data-current-product-id=\"{{ product.id }}\"\n             data-mobile-columns=\"{{ vpp_recent_mobile_columns }}\"\n             data-desktop-columns=\"{{ vpp_recent_desktop_columns }}\"\n             data-inherit-related=\"{{ vpp_recent_products_inherit_related ? 'true' : 'false' }}\">\n            <div class=\"veloura-product-related-heading\">\n                <h2 class=\"veloura-product-related-title\">منتجات شاهدتها مؤخراً</h2>\n            </div>\n            <div data-veloura-recent-slider-host></div>\n        </div>\n    {% endif %}\n    {# Veloura Product UI Final recently viewed products end #}\n";

const RECENT_SETTINGS_JSON = [
  {
    "id": "veloura_recent_products_enabled_2026",
    "type": "boolean",
    "format": "switch",
    "icon": "sicon-history",
    "label": "تفعيل منتجات شاهدتها مؤخراً",
    "description": "يعرض آخر المنتجات التي فتحها الزائر أسفل منتجات قد تعجبك.",
    "required": false,
    "value": false,
    "selected": false,
    "conditions": [
      {
        "id": "veloura_product_page_panel_open_2026",
        "operation": "=",
        "value": true
      }
    ]
  },
  {
    "id": "veloura_recent_products_inherit_related_2026",
    "type": "boolean",
    "format": "switch",
    "icon": "sicon-link",
    "label": "ربطها بإعدادات منتجات قد تعجبك",
    "description": "تستخدم عدد الأعمدة في الجوال واللابتوب، توسيط العنوان، إخفاء الأسهم وتنسيق البطاقة نفسه.",
    "required": false,
    "value": true,
    "selected": true,
    "conditions": [
      {
        "id": "veloura_product_page_panel_open_2026",
        "operation": "=",
        "value": true
      },
      {
        "id": "veloura_recent_products_enabled_2026",
        "operation": "=",
        "value": true
      }
    ]
  }
];

function fail(message) {
  throw new Error(message);
}

function exists(file) {
  return fs.existsSync(file);
}

function readFile(file) {
  if (!exists(file)) fail(`Required file was not found: ${file}`);
  const raw = fs.readFileSync(file, 'utf8');
  return {
    text: raw.replace(/\r\n/g, '\n'),
    eol: raw.includes('\r\n') ? '\r\n' : '\n'
  };
}

function writeFile(file, text, eol) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, eol || '\n');
  fs.writeFileSync(file, normalized, 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function removeMarkedBlock(text, startMarker, endMarker) {
  for (;;) {
    const start = text.indexOf(startMarker);
    if (start === -1) break;
    const end = text.indexOf(endMarker, start);
    if (end === -1) fail(`Found marker without its end: ${startMarker}`);
    text = text.slice(0, start) + text.slice(end + endMarker.length);
  }
  return text;
}

function backupFile(file) {
  if (!exists(file)) return;
  const target = path.join(BACKUP_DIR, path.relative(ROOT, file));
  if (exists(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function cleanBlankRuns(text) {
  return text.replace(/\n{5,}/g, '\n\n\n');
}

function findTwigIfBlockEnd(text, firstIfStart) {
  const tokenRegex = /{%\s*(if|elseif|else|endif)\b[^%]*%}/g;
  tokenRegex.lastIndex = firstIfStart;
  let depth = 0;
  let sawFirstIf = false;
  let match;

  while ((match = tokenRegex.exec(text))) {
    const token = match[1];
    if (token === 'if') {
      depth += 1;
      sawFirstIf = true;
    } else if (token === 'endif') {
      depth -= 1;
      if (sawFirstIf && depth === 0) return tokenRegex.lastIndex;
    }
  }
  return -1;
}

function normalizeSelectBlock(variable, settingId, fallback) {
  const key = variable.replace('_raw', '_key');
  return `{% set ${variable} = theme.settings.get('${settingId}', '${fallback}') %}
{% if ${variable}.selected is defined %}
  {% if ${variable}.selected.value is defined %}
    {% set ${key} = ${variable}.selected.value %}
  {% elseif ${variable}.selected is iterable and ${variable}.selected[0] is defined and ${variable}.selected[0].value is defined %}
    {% set ${key} = ${variable}.selected[0].value %}
  {% elseif ${variable}.selected is iterable and ${variable}.selected[0] is defined %}
    {% set ${key} = ${variable}.selected[0] %}
  {% else %}
    {% set ${key} = ${variable}.selected %}
  {% endif %}
{% elseif ${variable}.value is defined %}
  {% set ${key} = ${variable}.value %}
{% elseif ${variable} is iterable and ${variable}[0] is defined and ${variable}[0].value is defined %}
  {% set ${key} = ${variable}[0].value %}
{% else %}
  {% set ${key} = ${variable} %}
{% endif %}`;
}

function patchSelectParser(text, variable, settingId, fallback) {
  const startNeedle = `{% set ${variable} = theme.settings.get('${settingId}', '${fallback}') %}`;
  const start = text.indexOf(startNeedle);
  if (start === -1) fail(`Could not find parser start for ${settingId}.`);

  const firstIf = text.indexOf(`{% if ${variable}`, start + startNeedle.length);
  if (firstIf === -1) fail(`Could not find parser if-block for ${settingId}.`);
  const end = findTwigIfBlockEnd(text, firstIf);
  if (end === -1) fail(`Could not find parser end for ${settingId}.`);

  return text.slice(0, start) + normalizeSelectBlock(variable, settingId, fallback) + text.slice(end);
}

function normalizeNumericBlock(variable, settingId, fallback) {
  return `{% set ${variable} = theme.settings.get('${settingId}', '${fallback}') %}
{% if ${variable}.selected is defined %}
  {% if ${variable}.selected.value is defined %}
    {% set ${variable} = ${variable}.selected.value %}
  {% elseif ${variable}.selected is iterable and ${variable}.selected[0] is defined and ${variable}.selected[0].value is defined %}
    {% set ${variable} = ${variable}.selected[0].value %}
  {% elseif ${variable}.selected is iterable and ${variable}.selected[0] is defined %}
    {% set ${variable} = ${variable}.selected[0] %}
  {% else %}
    {% set ${variable} = ${variable}.selected %}
  {% endif %}
{% elseif ${variable}.value is defined %}
  {% set ${variable} = ${variable}.value %}
{% elseif ${variable} is iterable and ${variable}[0] is defined and ${variable}[0].value is defined %}
  {% set ${variable} = ${variable}[0].value %}
{% endif %}`;
}

function patchNumericParser(text, variable, settingId, fallback) {
  const startNeedle = `{% set ${variable} = theme.settings.get('${settingId}', '${fallback}') %}`;
  const start = text.indexOf(startNeedle);
  if (start === -1) fail(`Could not find numeric parser for ${settingId}.`);

  const firstIf = text.indexOf(`{% if ${variable}.value is defined %}`, start + startNeedle.length);
  if (firstIf === -1) {
    if (text.indexOf(`{% if ${variable}.selected is defined %}`, start + startNeedle.length) !== -1) {
      const selectedIf = text.indexOf(`{% if ${variable}.selected is defined %}`, start + startNeedle.length);
      const selectedEnd = findTwigIfBlockEnd(text, selectedIf);
      if (selectedEnd === -1) fail(`Could not find existing numeric parser end for ${settingId}.`);
      return text.slice(0, start) + normalizeNumericBlock(variable, settingId, fallback) + text.slice(selectedEnd);
    }
    fail(`Unexpected numeric parser for ${settingId}.`);
  }

  const end = findTwigIfBlockEnd(text, firstIf);
  if (end === -1) fail(`Could not find numeric parser end for ${settingId}.`);
  return text.slice(0, start) + normalizeNumericBlock(variable, settingId, fallback) + text.slice(end);
}

function updateMaster() {
  const source = readFile(MASTER_PATH);
  let text = source.text;

  const removableBlocks = [
    ['{# Veloura QV V35 grouped actions bottom spacing start #}', '{# Veloura QV V35 grouped actions bottom spacing end #}'],
    ['{# Veloura QV V54 Salla radius and card contract start #}', '{# Veloura QV V54 Salla radius and card contract end #}'],
    ['{# Veloura Product UI Final Stable 2026 start #}', '{# Veloura Product UI Final Stable 2026 end #}'],
    ['{# Veloura V57 unified product UI and recently viewed products start #}', '{# Veloura V57 unified product UI and recently viewed products end #}'],
    ['{# Veloura V58 stable cards and purchase surfaces start #}', '{# Veloura V58 stable cards and purchase surfaces end #}'],
    ['{# Veloura V56 safe product UI recovery start #}', '{# Veloura V56 safe product UI recovery end #}'],
    ['{# Veloura QV V55 direct Salla surfaces start #}', '{# Veloura QV V55 direct Salla surfaces end #}']
  ];
  removableBlocks.forEach((markers) => {
    text = removeMarkedBlock(text, markers[0], markers[1]);
  });

  text = text.replace(/\s*{%\s*include\s+['"]partials\.veloura-product-ui-contract['"]\s*%}\s*/g, '\n');

  text = patchSelectParser(text, 'vpc_card_radius_raw', 'veloura_product_card_radius_2026', 'medium');
  text = patchSelectParser(text, 'vpc_image_radius_raw', 'veloura_product_card_image_radius_2026', 'medium');
  text = patchSelectParser(text, 'vpc_button_radius_raw', 'veloura_product_card_button_radius_2026', 'medium');
  text = patchSelectParser(text, 'vqv_button_radius_raw', 'veloura_quick_view_button_radius_2026', 'round');
  text = patchSelectParser(text, 'vqv_modal_radius_raw', 'veloura_quick_view_modal_radius_2026', 'large');

  text = patchNumericParser(text, 'vpc_button_margin_x', 'veloura_product_card_button_margin_x_2026', '0');
  text = patchNumericParser(text, 'vpc_button_margin_bottom', 'veloura_product_card_button_margin_bottom_2026', '0');
  text = patchNumericParser(text, 'vpc_button_height_raw', 'veloura_product_card_button_height_2026', '10');

  const anchor = "{% hook 'head:end' %}";
  const anchorIndex = text.indexOf(anchor);
  if (anchorIndex === -1) fail("Could not find {% hook 'head:end' %} in master.twig.");

  text = text.slice(0, anchorIndex).trimEnd() + '\n\n' + FINAL_BLOCK.trim() + '\n\n' + text.slice(anchorIndex);
  text = cleanBlankRuns(text).trimEnd() + '\n';

  if (count(text, 'id="veloura-product-ui-final-runtime-2026"') !== 1) {
    fail('Final runtime was not installed exactly once.');
  }
  if (text.includes('Veloura QV V35 grouped actions bottom spacing start')) {
    fail('V35 measuring runtime is still present.');
  }
  if (text.includes('Veloura QV V54 Salla radius and card contract start')) {
    fail('V54 measuring runtime is still present.');
  }

  writeFile(MASTER_PATH, text, source.eol);
}

function updateSingle() {
  const source = readFile(SINGLE_PATH);
  let text = source.text;

  const removableBlocks = [
    ['    {# Veloura Product UI Final recently viewed settings start #}', '    {# Veloura Product UI Final recently viewed settings end #}'],
    ['    {# Veloura Product UI Final recently viewed products start #}', '    {# Veloura Product UI Final recently viewed products end #}'],
    ['    {# Veloura V57 recently viewed settings start #}', '    {# Veloura V57 recently viewed settings end #}'],
    ['    {# Veloura V57 recently viewed products section start #}', '    {# Veloura V57 recently viewed products section end #}'],
    ['    {# Veloura V58 recently viewed settings start #}', '    {# Veloura V58 recently viewed settings end #}'],
    ['    {# Veloura V58 recently viewed products section start #}', '    {# Veloura V58 recently viewed products section end #}']
  ];
  removableBlocks.forEach((markers) => {
    text = removeMarkedBlock(text, markers[0], markers[1]);
  });

  text = text.replace(/^\s*{%\s*set\s+vpp_recent_products_(?:enabled|inherit_related)\s*=.*?%}\s*$/gm, '');

  const settingsAnchor = "    {% set vpp_related_center_title = _self.veloura_bool(theme.settings.get('veloura_related_center_title_2026', false), false)|trim == 'true' %}";
  const settingsIndex = text.indexOf(settingsAnchor);
  if (settingsIndex === -1) fail('Could not find related settings anchor in single.twig.');
  const settingsAfter = settingsIndex + settingsAnchor.length;
  text = text.slice(0, settingsAfter) + '\n' + RECENT_SETTINGS_TWIG.trimEnd() + text.slice(settingsAfter);

  text = text.replace(
    /<section class="sticky-product-bar veloura-product-sticky-bar[^"]*">/,
    '<section data-veloura-purchase-bar class="sticky-product-bar veloura-product-sticky-bar bg-white p-5">'
  );
  if (!text.includes('data-veloura-purchase-bar')) fail('Purchase bar opening tag was not updated.');

  const relatedSliderNeedle = '<salla-products-slider\n                source="{{ veloura_related_source }}"';
  const relatedSliderPatchedNeedle = '<salla-products-slider\n                product-card-component="custom-salla-product-card"\n                source="{{ veloura_related_source }}"';
  if (text.includes(relatedSliderNeedle)) {
    text = text.replace(relatedSliderNeedle, relatedSliderPatchedNeedle);
  } else if (!text.includes(relatedSliderPatchedNeedle)) {
    fail('Could not find related products slider.');
  }

  const contentEndAnchor = '\n{% endblock %}\n\n{% block scripts %}';
  const contentEnd = text.lastIndexOf(contentEndAnchor);
  if (contentEnd === -1) fail('Could not find product content block end.');
  text = text.slice(0, contentEnd) + '\n' + RECENT_MARKUP.trimEnd() + text.slice(contentEnd);
  text = cleanBlankRuns(text).trimEnd() + '\n';

  if (count(text, 'veloura_recent_products_enabled_2026') !== 1) {
    fail('Recently viewed enable setting is not unique in single.twig.');
  }
  if (count(text, 'data-veloura-recent-products') !== 1) {
    fail('Recently viewed section is not unique in single.twig.');
  }
  if (count(text, 'product-card-component="custom-salla-product-card"') < 1) {
    fail('Related products slider is not using the custom card.');
  }
  if (/data-veloura-purchase-bar[^>]*(?:veloura-glass-surface|veloura-glass-sticky-product)/.test(text)) {
    fail('Glass classes are still hard-coded on the purchase bar.');
  }

  writeFile(SINGLE_PATH, text, source.eol);
}

function updateTwilight() {
  const source = readFile(TWILIGHT_PATH);
  let data;
  try {
    data = JSON.parse(source.text);
  } catch (error) {
    fail(`twilight.json is invalid before installation: ${error.message}`);
  }

  if (!Array.isArray(data.settings)) fail('twilight.json does not contain a settings array.');

  const ids = new Set(RECENT_SETTINGS_JSON.map((item) => item.id));
  data.settings = data.settings.filter((item) => !item || !ids.has(item.id));

  const anchorIndex = data.settings.findIndex(
    (item) => item && item.id === 'veloura_related_center_title_2026'
  );
  if (anchorIndex === -1) fail('Could not find veloura_related_center_title_2026 in twilight.json.');

  data.settings.splice(anchorIndex + 1, 0, ...RECENT_SETTINGS_JSON);
  const output = JSON.stringify(data, null, 2) + '\n';
  JSON.parse(output);
  writeFile(TWILIGHT_PATH, output, source.eol);
}

function main() {
  [MASTER_PATH, SINGLE_PATH, TWILIGHT_PATH].forEach((file) => {
    if (!exists(file)) fail(`Run this installer from the theme root. Missing: ${file}`);
  });

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  [MASTER_PATH, SINGLE_PATH, TWILIGHT_PATH, UNSAFE_PARTIAL_PATH].forEach(backupFile);

  updateMaster();
  updateSingle();
  updateTwilight();
  if (exists(UNSAFE_PARTIAL_PATH)) fs.rmSync(UNSAFE_PARTIAL_PATH, { force: true });

  console.log('');
  console.log('Veloura Product UI Final was installed successfully.');
  console.log('Fixed product-card zero spacing, first-load styling, purchase buttons, sticky/compact/glass states.');
  console.log('Fixed read-more position, thumbnail radius, recently viewed settings, and footer clearance.');
  console.log('Removed V35/V54 measuring loops that caused card movement.');
  console.log('Backup: .veloura-product-ui-final-backup');
  console.log('');
}

try {
  main();
} catch (error) {
  console.error('');
  console.error('INSTALL ERROR: ' + error.message);
  console.error('');
  process.exit(1);
}
