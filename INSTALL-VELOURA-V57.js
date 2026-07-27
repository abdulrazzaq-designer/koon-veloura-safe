#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER_PATH = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE_PATH = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT_PATH = path.join(ROOT, 'twilight.json');
const UNSAFE_PARTIAL_PATH = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');
const BACKUP_DIR = path.join(ROOT, '.veloura-v57-backup');

const V57_BLOCK = String.raw`{# Veloura V57 unified product UI and recently viewed products start #}
<style id="veloura-v57-product-ui-style-2026">
  /* Read-more button: a separated 7px frame using the actual site background. */
  html body .veloura-product-page .product__description {
    overflow: visible !important;
  }

  html body .veloura-product-page #btn-show-more.veloura-product-read-more {
    position: relative !important;
    z-index: 2 !important;
    margin: 12px auto 16px !important;
    border-radius: var(--veloura-product-radius, 0px) !important;
    box-shadow: 0 0 0 7px var(--veloura-product-bg-inline, var(--veloura-site-bg, #ffffff)) !important;
    overflow: hidden !important;
    clip-path: none !important;
  }

  html body .veloura-product-page #btn-show-more.veloura-product-read-more,
  html body .veloura-product-page #btn-show-more.veloura-product-read-more > * {
    border-radius: var(--veloura-product-radius, 0px) !important;
  }

  html.dark body .veloura-product-page #btn-show-more.veloura-product-read-more,
  html body.dark .veloura-product-page #btn-show-more.veloura-product-read-more {
    box-shadow: 0 0 0 7px var(--veloura-product-dark-bg-inline, #010202) !important;
  }

  /* Product thumbnails and the active thumbnail ring use the global product radius. */
  html body .veloura-product-page .veloura-product-thumb-item,
  html body .veloura-product-page .veloura-product-thumb-item > img,
  html body .veloura-product-page [slot="thumbs"] > *,
  html body .veloura-product-page [slot="thumbs"] > * > img,
  html body .veloura-product-page .swiper-slide-thumb-active,
  html body .veloura-product-page [aria-current="true"] {
    border-radius: var(--veloura-product-radius, 0px) !important;
    overflow: hidden !important;
  }

  html body .veloura-product-page .veloura-product-thumb-item::before,
  html body .veloura-product-page .veloura-product-thumb-item::after,
  html body .veloura-product-page .swiper-slide-thumb-active::before,
  html body .veloura-product-page .swiper-slide-thumb-active::after,
  html body .veloura-product-page [aria-current="true"]::before,
  html body .veloura-product-page [aria-current="true"]::after {
    border-radius: inherit !important;
  }

  /* Product cards: one width/height/color contract everywhere without resize feedback loops. */
  html body.veloura-product-card-enabled product-card,
  html body.veloura-product-card-enabled salla-product-card,
  html body.veloura-product-card-enabled custom-salla-product-card,
  html body.veloura-product-card-enabled .s-product-card-entry,
  html body.veloura-product-card-enabled .s-product-card-image,
  html body.veloura-product-card-enabled .s-product-card-image > a,
  html body.veloura-product-card-enabled .s-product-card-image img {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  html body.veloura-product-card-enabled .s-product-card-image img {
    display: block !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v35-card .veloura-v35-last-action {
    margin-bottom: calc(
      var(--veloura-product-button-margin-bottom, 0px)
      - var(--veloura-v35-native-bottom, 0px)
    ) !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer,
  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    padding-bottom: 0 !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    min-height: var(--veloura-product-button-height, 42px) !important;
    margin: 0 !important;
    padding: 0 !important;
    opacity: 1 !important;
    visibility: visible !important;
    border-radius: var(--veloura-product-button-radius, 0px) !important;
    overflow: visible !important;
    --veloura-v57-button-bg: var(--veloura-product-button-bg, var(--color-primary, #004d65));
    --veloura-v57-button-text: var(--veloura-product-button-text, var(--color-primary-reverse, #ffffff));
    --veloura-v57-button-radius: var(--veloura-product-button-radius, 0px);
    --veloura-v57-button-height: var(--veloura-product-button-height, 42px);
    --button-border-radius: var(--veloura-product-button-radius, 0px);
    --salla-button-border-radius: var(--veloura-product-button-radius, 0px);
    --salla-fast-checkout-button-border-radius: var(--veloura-product-button-radius, 0px);
    --salla-fast-checkout-button-width: 100%;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button::part(button) {
    width: 100% !important;
    min-height: var(--veloura-product-button-height, 42px) !important;
    background: var(--veloura-product-button-bg, var(--color-primary, #004d65)) !important;
    border-color: var(--veloura-product-button-bg, var(--color-primary, #004d65)) !important;
    color: var(--veloura-product-button-text, var(--color-primary-reverse, #ffffff)) !important;
    border-radius: var(--veloura-product-button-radius, 0px) !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Product-page Add to cart / Buy now: always visible and colored. */
  html body .veloura-product-page .veloura-product-sticky-bar salla-add-product-button {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    min-height: 46px !important;
    margin: 0 !important;
    opacity: 1 !important;
    visibility: visible !important;
    border-radius: var(--veloura-product-radius, 0px) !important;
    overflow: visible !important;
    --veloura-v57-button-bg: var(--color-primary, #004d65);
    --veloura-v57-button-text: var(--color-primary-reverse, #ffffff);
    --veloura-v57-button-radius: var(--veloura-product-radius, 0px);
    --veloura-v57-button-height: 46px;
    --button-border-radius: var(--veloura-product-radius, 0px);
    --salla-button-border-radius: var(--veloura-product-radius, 0px);
    --salla-fast-checkout-button-border-radius: var(--veloura-product-radius, 0px);
    --salla-fast-checkout-button-width: 100%;
  }

  html body .veloura-product-page .veloura-product-sticky-bar salla-add-product-button::part(button) {
    width: 100% !important;
    min-height: 46px !important;
    background: var(--color-primary, #004d65) !important;
    border-color: var(--color-primary, #004d65) !important;
    color: var(--color-primary-reverse, #ffffff) !important;
    border-radius: var(--veloura-product-radius, 0px) !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Quick View radius: modal and its buttons are independent and deterministic. */
  html body .veloura-qv-full .veloura-qv-full__dialog,
  html body .veloura-quick-view-modal .veloura-quick-view-modal__dialog {
    border-radius: var(--veloura-quick-view-modal-radius, 28px) !important;
    overflow: hidden !important;
  }

  html body .veloura-qv-full .veloura-qv-full__media,
  html body .veloura-qv-full .veloura-qv-full__content,
  html body .veloura-quick-view-modal .veloura-quick-view-modal__media,
  html body .veloura-quick-view-modal .veloura-quick-view-modal__content {
    border-radius: var(--veloura-quick-view-modal-radius, 28px) !important;
  }

  html body .veloura-qv-full .veloura-qv-full__circle,
  html body .veloura-qv-full .veloura-qv-full__add,
  html body .veloura-qv-full .veloura-qv-full__read-more,
  html body .veloura-qv-full .veloura-qv-full__close,
  html body .veloura-quick-view-modal .veloura-quick-view-modal__link,
  html body .veloura-quick-view-modal .veloura-quick-view-modal__close,
  html body .veloura-quick-view-btn,
  html body .veloura-pc-native-quick {
    border-radius: var(--veloura-quick-view-button-radius, 0px) !important;
  }

  /* Mobile purchase-bar states. Glass is allowed only while the bar is sticky. */
  @media (max-width: 640px) {
    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 12px !important;
      left: 12px !important;
      right: 12px !important;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      margin: 0 auto !important;
      padding: 8px 12px !important;
      box-sizing: border-box !important;
      border-radius: var(--veloura-product-radius, 0px) !important;
      overflow: hidden !important;
      z-index: 2147483000 !important;
    }

    html body .veloura-product-page.veloura-product-mobile-sticky-enabled:not(.veloura-product-buttons-compact) .veloura-product-sticky-bar {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      border-start-start-radius: var(--veloura-product-radius, 0px) !important;
      border-start-end-radius: var(--veloura-product-radius, 0px) !important;
      border-end-start-radius: 0 !important;
      border-end-end-radius: 0 !important;
      overflow: hidden !important;
      z-index: 2147483000 !important;
    }

    html body .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar {
      position: relative !important;
      inset: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      transform: none !important;
      opacity: 1 !important;
      visibility: visible !important;
      border-radius: var(--veloura-product-radius, 0px) !important;
      background: var(--veloura-product-secondary-bg-inline, #f8fafc) !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      filter: none !important;
      box-shadow: none !important;
    }

    html.dark body .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar,
    html body.dark .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar {
      background: var(--veloura-product-dark-secondary-bg-inline, #111111) !important;
    }
  }

  /* Recently viewed products inherit the related-products presentation when requested. */
  html body .veloura-product-recent-products[hidden] {
    display: none !important;
  }

  html body .veloura-product-recent-products {
    margin-top: 28px;
  }

  html body .veloura-product-recent-products.is-title-centered .veloura-product-related-heading,
  html body .veloura-product-recent-products.is-title-centered .veloura-product-related-title {
    width: 100%;
    text-align: center !important;
    justify-content: center !important;
  }

  html body .veloura-product-recent-products.is-arrows-hidden .s-slider-next,
  html body .veloura-product-recent-products.is-arrows-hidden .s-slider-prev,
  html body .veloura-product-recent-products.is-arrows-hidden [class*="slider-next"],
  html body .veloura-product-recent-products.is-arrows-hidden [class*="slider-prev"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
</style>

<script data-cfasync="false" id="veloura-v57-product-ui-runtime-2026">
(function () {
  'use strict';

  var scheduled = 0;
  var started = false;
  var BUTTON_STYLE_ID = 'veloura-v57-button-shadow-style';
  var THUMB_STYLE_ID = 'veloura-v57-thumb-shadow-style';
  var CARD_STYLE_ID = 'veloura-v57-card-shadow-style';
  var RECENT_STYLE_ID = 'veloura-v57-recent-shadow-style';

  var BUTTON_SHADOW_CSS =
    ':host{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;' +
    'min-height:var(--veloura-v57-button-height,42px)!important;opacity:1!important;visibility:visible!important;' +
    'border-radius:var(--veloura-v57-button-radius,0px)!important;overflow:visible!important}' +
    '.s-add-product-button-main,button,.s-button-element,.s-button-btn,[part~="button"]{' +
    'display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;' +
    'min-height:var(--veloura-v57-button-height,42px)!important;box-sizing:border-box!important;' +
    'align-items:center!important;justify-content:center!important;opacity:1!important;visibility:visible!important;' +
    'background:var(--veloura-v57-button-bg,var(--color-primary,#004d65))!important;' +
    'background-color:var(--veloura-v57-button-bg,var(--color-primary,#004d65))!important;' +
    'border-color:var(--veloura-v57-button-bg,var(--color-primary,#004d65))!important;' +
    'color:var(--veloura-v57-button-text,var(--color-primary-reverse,#fff))!important;' +
    'border-radius:var(--veloura-v57-button-radius,0px)!important;overflow:visible!important}' +
    '.s-add-product-button-main *,button *,.s-button-element *,.s-button-btn *,[part~="button"] *{' +
    'color:var(--veloura-v57-button-text,var(--color-primary-reverse,#fff))!important;' +
    'fill:var(--veloura-v57-button-text,var(--color-primary-reverse,#fff))!important}' +
    'salla-mini-checkout-widget,[class*="fast-checkout"],[class*="quick-buy"],[class*="quick_buy"]{' +
    'display:block!important;width:100%!important;max-width:100%!important;opacity:1!important;visibility:visible!important}';

  var THUMB_SHADOW_CSS =
    ':host{--veloura-v57-thumb-radius:var(--veloura-product-radius,0px)}' +
    '.swiper-slide-thumb-active,.s-slider-thumbs .swiper-slide-thumb-active,' +
    '.s-slider-thumbs .swiper-slide,.s-slider-thumbs img,[aria-current="true"],[class*="thumb"]{' +
    'border-radius:var(--veloura-v57-thumb-radius,0px)!important;overflow:hidden!important}' +
    '.swiper-slide-thumb-active::before,.swiper-slide-thumb-active::after,' +
    '.s-slider-thumbs .swiper-slide::before,.s-slider-thumbs .swiper-slide::after,' +
    '[aria-current="true"]::before,[aria-current="true"]::after{' +
    'border-radius:inherit!important}';

  var CARD_SHADOW_CSS =
    '.s-product-card-entry.veloura-v35-card{display:flex!important;flex-direction:column!important;' +
    'height:100%!important;min-height:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}' +
    '.s-product-card-entry.veloura-v35-card .s-product-card-content.veloura-v35-content{' +
    'display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;min-width:0!important;min-height:0!important;gap:0!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-bottom-item{flex:0 0 auto!important;margin-bottom:0!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-bottom-anchor{margin-top:auto!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-lower-gap{margin-top:var(--veloura-v35-lower-gap,10px)!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-action-row{' +
    'position:relative!important;display:flex!important;align-items:stretch!important;justify-content:center!important;' +
    'width:calc(100% + var(--veloura-v35-native-left,0px) + var(--veloura-v35-native-right,0px) - (var(--veloura-product-button-margin-x,0px) * 2))!important;' +
    'max-width:none!important;min-width:0!important;' +
    'margin-left:calc(var(--veloura-product-button-margin-x,0px) - var(--veloura-v35-native-left,0px))!important;' +
    'margin-right:calc(var(--veloura-product-button-margin-x,0px) - var(--veloura-v35-native-right,0px))!important;' +
    'margin-bottom:0!important;padding:0!important;box-sizing:border-box!important;opacity:1!important;visibility:visible!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-last-action{' +
    'margin-bottom:calc(var(--veloura-product-button-margin-bottom,0px) - var(--veloura-v35-native-bottom,0px))!important}' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-action-row>*,' +
    '.s-product-card-entry.veloura-v35-card .veloura-v35-action-row salla-add-product-button{' +
    'display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;' +
    'align-items:center!important;justify-content:center!important;opacity:1!important;visibility:visible!important}' +
    '.s-product-card-entry,.s-product-card-image,.s-product-card-image>a,.s-product-card-image img{' +
    'min-width:0!important;max-width:100%!important;box-sizing:border-box!important}';

  var RECENT_SHADOW_CSS =
    '.s-slider-next,.s-slider-prev,[class*="slider-next"],[class*="slider-prev"]{' +
    'display:none!important;visibility:hidden!important;pointer-events:none!important}';

  function ensureStyle(root, id, text) {
    if (!root || !root.querySelector || !root.appendChild) return;
    var style = root.querySelector('#' + id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      root.appendChild(style);
    }
    if (style.textContent !== text) style.textContent = text;
  }

  function roots() {
    var output = [document];
    var queue = [document];
    var seen = [];
    while (queue.length) {
      var root = queue.shift();
      if (!root || seen.indexOf(root) !== -1) continue;
      seen.push(root);
      if (!root.querySelectorAll) continue;
      root.querySelectorAll('*').forEach(function (node) {
        if (node.shadowRoot && output.indexOf(node.shadowRoot) === -1) {
          output.push(node.shadowRoot);
          queue.push(node.shadowRoot);
        }
      });
    }
    return output;
  }

  function visible(element) {
    if (!element || element.hidden) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(element) : null;
    return !style || (style.display !== 'none' && style.visibility !== 'hidden');
  }

  function metric(card, row) {
    if (!card || !row || !row.parentElement || !window.getComputedStyle) return;
    var parent = row.parentElement;
    var cardRect = card.getBoundingClientRect();
    var parentRect = parent.getBoundingClientRect();
    if (!cardRect.width || !parentRect.width) return;
    var parentStyle = window.getComputedStyle(parent);
    var number = function (value) {
      value = parseFloat(value);
      return Number.isFinite(value) ? value : 0;
    };
    var left = Math.max(0,
      (parentRect.left - cardRect.left) +
      number(parentStyle.borderLeftWidth) +
      number(parentStyle.paddingLeft)
    );
    var right = Math.max(0,
      (cardRect.right - parentRect.right) +
      number(parentStyle.borderRightWidth) +
      number(parentStyle.paddingRight)
    );
    var bottom = Math.max(0,
      (cardRect.bottom - parentRect.bottom) +
      number(parentStyle.borderBottomWidth) +
      number(parentStyle.paddingBottom)
    );
    row.style.setProperty('--veloura-v35-native-left', left.toFixed(3) + 'px');
    row.style.setProperty('--veloura-v35-native-right', right.toFixed(3) + 'px');
    row.style.setProperty('--veloura-v35-native-bottom', bottom.toFixed(3) + 'px');
  }

  function syncCard(card) {
    if (!card || !card.querySelector) return;
    var root = card.getRootNode ? card.getRootNode() : document;
    if (root && root !== document) ensureStyle(root, CARD_STYLE_ID, CARD_SHADOW_CSS);

    var content = card.querySelector('.s-product-card-content');
    var main = card.querySelector('.s-product-card-content-main');
    var price = card.querySelector('.s-product-card-content-sub,.s-product-card-content-price,.s-product-card-price');
    var footer = card.querySelector('.s-product-card-content-footer');
    var quick = card.querySelector('.veloura-quick-view-under-cart-wrap');

    card.classList.add('veloura-v35-card');
    card.style.setProperty('min-width', '0', 'important');
    card.style.setProperty('max-width', '100%', 'important');
    card.style.setProperty('--veloura-v35-lower-gap', '10px');

    if (content) content.classList.add('veloura-v35-content');
    if (main) main.classList.add('veloura-v35-upper-text');

    [price, footer, quick].forEach(function (item) {
      if (!item) return;
      item.classList.add('veloura-v35-bottom-item');
      item.classList.remove('veloura-v35-bottom-anchor', 'veloura-v35-lower-gap', 'veloura-v35-last-action');
    });

    [footer, quick].forEach(function (item) {
      if (item) item.classList.add('veloura-v35-action-row');
    });

    var lower = [price, footer, quick].filter(visible);
    if (lower.length) {
      lower[0].classList.add('veloura-v35-bottom-anchor');
      for (var i = 1; i < lower.length; i += 1) lower[i].classList.add('veloura-v35-lower-gap');
    }

    var actions = [footer, quick].filter(visible);
    if (actions.length) actions[actions.length - 1].classList.add('veloura-v35-last-action');

    if (footer) metric(card, footer);
    if (quick) metric(card, quick);
  }

  function styleButtonHost(host) {
    if (!host || !host.style) return;
    var inCard = !!(host.closest && host.closest('.s-product-card-entry'));
    var inPurchase = !!(host.closest && host.closest('.veloura-product-sticky-bar'));

    if (!inCard && !inPurchase) return;

    host.setAttribute('width', 'wide');
    host.style.setProperty('display', 'block', 'important');
    host.style.setProperty('width', '100%', 'important');
    host.style.setProperty('max-width', '100%', 'important');
    host.style.setProperty('min-width', '0', 'important');
    host.style.setProperty('opacity', '1', 'important');
    host.style.setProperty('visibility', 'visible', 'important');
    host.style.setProperty('margin', '0', 'important');

    if (inPurchase) {
      host.style.setProperty('--veloura-v57-button-bg', 'var(--color-primary, #004d65)');
      host.style.setProperty('--veloura-v57-button-text', 'var(--color-primary-reverse, #ffffff)');
      host.style.setProperty('--veloura-v57-button-radius', 'var(--veloura-product-radius, 0px)');
      host.style.setProperty('--veloura-v57-button-height', '46px');
    } else {
      host.style.setProperty('--veloura-v57-button-bg', 'var(--veloura-product-button-bg, var(--color-primary, #004d65))');
      host.style.setProperty('--veloura-v57-button-text', 'var(--veloura-product-button-text, var(--color-primary-reverse, #ffffff))');
      host.style.setProperty('--veloura-v57-button-radius', 'var(--veloura-product-button-radius, 0px)');
      host.style.setProperty('--veloura-v57-button-height', 'var(--veloura-product-button-height, 42px)');
    }

    var queue = [];
    if (host.shadowRoot) queue.push(host.shadowRoot);
    var seen = [];
    while (queue.length) {
      var root = queue.shift();
      if (!root || seen.indexOf(root) !== -1) continue;
      seen.push(root);
      ensureStyle(root, BUTTON_STYLE_ID, BUTTON_SHADOW_CSS);
      if (!root.querySelectorAll) continue;
      root.querySelectorAll('*').forEach(function (node) {
        if (node.shadowRoot) queue.push(node.shadowRoot);
      });
    }
  }

  function styleThumbnails() {
    var page = document.querySelector('.veloura-product-page');
    if (!page) return;
    var radius = window.getComputedStyle(page).getPropertyValue('--veloura-product-radius').trim() || '0px';
    page.querySelectorAll('.veloura-product-thumb-item,.veloura-product-thumb-item img').forEach(function (node) {
      node.style.setProperty('border-radius', radius, 'important');
      node.style.setProperty('overflow', 'hidden', 'important');
    });

    page.querySelectorAll('salla-slider[id^="details-slider-"]').forEach(function (slider) {
      slider.style.setProperty('--veloura-v57-thumb-radius', radius);
      if (!slider.shadowRoot) return;
      var queue = [slider.shadowRoot];
      var seen = [];
      while (queue.length) {
        var root = queue.shift();
        if (!root || seen.indexOf(root) !== -1) continue;
        seen.push(root);
        ensureStyle(root, THUMB_STYLE_ID, THUMB_SHADOW_CSS);
        if (!root.querySelectorAll) continue;
        root.querySelectorAll('*').forEach(function (node) {
          if (node.shadowRoot) queue.push(node.shadowRoot);
        });
      }
    });
  }

  function styleQuickView() {
    var rootStyle = window.getComputedStyle(document.documentElement);
    var modalRadius = rootStyle.getPropertyValue('--veloura-quick-view-modal-radius').trim() || '28px';
    var buttonRadius = rootStyle.getPropertyValue('--veloura-quick-view-button-radius').trim() || '0px';
    document.querySelectorAll('.veloura-qv-full__dialog,.veloura-quick-view-modal__dialog').forEach(function (node) {
      node.style.setProperty('border-radius', modalRadius, 'important');
      node.style.setProperty('overflow', 'hidden', 'important');
    });
    document.querySelectorAll(
      '.veloura-qv-full__circle,.veloura-qv-full__add,.veloura-qv-full__read-more,.veloura-qv-full__close,' +
      '.veloura-quick-view-modal__link,.veloura-quick-view-modal__close,.veloura-quick-view-btn,.veloura-pc-native-quick'
    ).forEach(function (node) {
      node.style.setProperty('border-radius', buttonRadius, 'important');
    });
  }

  function syncPurchaseGlass() {
    var page = document.querySelector('.veloura-product-page');
    var bar = page && page.querySelector('.veloura-product-sticky-bar');
    if (!page || !bar) return;
    var sticky = page.classList.contains('veloura-product-mobile-sticky-enabled');
    var glass = document.body.classList.contains('veloura-glass-effect');
    bar.classList.toggle('veloura-glass-surface', sticky && glass);
    bar.classList.toggle('veloura-glass-sticky-product', sticky && glass);
  }

  function buildRecentlyViewed() {
    var section = document.querySelector('[data-veloura-recent-products]');
    if (!section || section.getAttribute('data-veloura-recent-built') === 'true') return;

    var current = String(section.getAttribute('data-current-product-id') || '').trim();
    if (!current) return;

    var key = 'veloura_recent_product_ids_2026';
    var stored = [];
    try {
      var parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
      if (Array.isArray(parsed)) stored = parsed.map(String);
    } catch (error) {
      stored = [];
    }

    var previous = stored.filter(function (id, index, list) {
      return id && id !== current && list.indexOf(id) === index;
    }).slice(0, 20);

    try {
      window.localStorage.setItem(key, JSON.stringify([current].concat(previous).slice(0, 20)));
    } catch (error) {}

    section.setAttribute('data-veloura-recent-built', 'true');
    if (!previous.length) return;

    var mobile = Math.max(1, parseInt(section.getAttribute('data-mobile-columns') || '2', 10) || 2);
    var desktop = Math.max(1, parseInt(section.getAttribute('data-desktop-columns') || '4', 10) || 4);
    var host = section.querySelector('[data-veloura-recent-slider-host]');
    if (!host) return;

    var slider = document.createElement('salla-products-slider');
    slider.setAttribute('source', 'selected');
    var selectedIds = previous.map(function (id) { return /^\d+$/.test(id) ? Number(id) : id; });
    slider.setAttribute('source-value', JSON.stringify(selectedIds));
    slider.setAttribute('data-veloura-recent-slider', '');
    slider.setAttribute('slider-config', JSON.stringify({
      slidesPerView: mobile,
      slidesPerGroup: 1,
      spaceBetween: 12,
      centeredSlides: false,
      centeredSlidesBounds: false,
      centerInsufficientSlides: false,
      freeMode: false,
      roundLengths: true,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      breakpoints: {
        768: {
          slidesPerView: desktop,
          slidesPerGroup: 1,
          spaceBetween: 16,
          centeredSlides: false,
          freeMode: false,
          roundLengths: true,
          slidesOffsetBefore: 0,
          slidesOffsetAfter: 0
        }
      }
    }));
    host.appendChild(slider);
    section.hidden = false;
  }

  function styleRecentlyViewed() {
    document.querySelectorAll('.veloura-product-recent-products.is-arrows-hidden salla-products-slider').forEach(function (slider) {
      if (!slider.shadowRoot) return;
      var queue = [slider.shadowRoot];
      var seen = [];
      while (queue.length) {
        var root = queue.shift();
        if (!root || seen.indexOf(root) !== -1) continue;
        seen.push(root);
        ensureStyle(root, RECENT_STYLE_ID, RECENT_SHADOW_CSS);
        if (!root.querySelectorAll) continue;
        root.querySelectorAll('*').forEach(function (node) {
          if (node.shadowRoot) queue.push(node.shadowRoot);
        });
      }
    });
  }

  function run() {
    roots().forEach(function (root) {
      if (!root.querySelectorAll) return;
      root.querySelectorAll('.s-product-card-entry').forEach(syncCard);
      root.querySelectorAll('salla-add-product-button').forEach(styleButtonHost);
    });
    styleThumbnails();
    styleQuickView();
    syncPurchaseGlass();
    buildRecentlyViewed();
    styleRecentlyViewed();
  }

  function schedule() {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(run, 90);
  }

  function start() {
    if (started) return;
    started = true;
    run();
    [180, 500, 1100, 2200].forEach(function (delay) {
      window.setTimeout(run, delay);
    });
    if (document.body && window.MutationObserver) {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  document.addEventListener('theme::ready', schedule);
  document.addEventListener('afterInit', schedule);
  document.addEventListener('salla::products::loaded', schedule);
  document.addEventListener('salla::product.cards::loaded', schedule);
  document.addEventListener('salla::product::details::loaded', schedule);
  window.addEventListener('pageshow', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
})();
</script>
{# Veloura V57 unified product UI and recently viewed products end #}`;
const RECENT_SETTINGS_TWIG = String.raw`
    {# Veloura V57 recently viewed settings start #}
    {% set vpp_recent_products_enabled = _self.veloura_bool(theme.settings.get('veloura_recent_products_enabled_2026', false), false)|trim == 'true' %}
    {% set vpp_recent_products_inherit_related = _self.veloura_bool(theme.settings.get('veloura_recent_products_inherit_related_2026', true), true)|trim == 'true' %}
    {# Veloura V57 recently viewed settings end #}
`;
const RECENT_MARKUP = String.raw`
    {# Veloura V57 recently viewed products section start #}
    {% if vpp_enabled and vpp_recent_products_enabled %}
        {% set vpp_recent_mobile_columns = vpp_recent_products_inherit_related ? vpp_related_mobile_columns : 2 %}
        {% set vpp_recent_desktop_columns = vpp_recent_products_inherit_related ? vpp_related_desktop_columns : 4 %}
        {% set vpp_recent_hide_arrows = vpp_recent_products_inherit_related ? vpp_related_hide_arrows : false %}
        {% set vpp_recent_center_title = vpp_recent_products_inherit_related ? vpp_related_center_title : false %}

        <div hidden
             class="container veloura-product-recent-products {{ vpp_recent_center_title ? 'is-title-centered' : '' }} {{ vpp_recent_hide_arrows ? 'is-arrows-hidden' : '' }}"
             data-veloura-recent-products
             data-current-product-id="{{ product.id }}"
             data-mobile-columns="{{ vpp_recent_mobile_columns }}"
             data-desktop-columns="{{ vpp_recent_desktop_columns }}"
             data-inherit-related="{{ vpp_recent_products_inherit_related ? 'true' : 'false' }}">
            <div class="veloura-product-related-heading">
                <h2 class="veloura-product-related-title">منتجات شاهدتها مؤخراً</h2>
            </div>
            <div data-veloura-recent-slider-host></div>
        </div>
    {% endif %}
    {# Veloura V57 recently viewed products section end #}
`;
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
    "description": "تستخدم نفس عدد المنتجات في الجوال والكمبيوتر، الأسهم، توسيط العنوان وتنسيق بطاقات المنتجات.",
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
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  return { text: raw.replace(/\r\n/g, '\n'), eol };
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
    if (end === -1) fail(`Found "${startMarker}" without its end marker.`);
    const after = end + endMarker.length;
    text = text.slice(0, start) + text.slice(after);
  }
  return text;
}

function backupFile(file) {
  if (!exists(file)) return;
  const relative = path.relative(ROOT, file);
  const target = path.join(BACKUP_DIR, relative);
  if (exists(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function cleanBlankRuns(text) {
  return text.replace(/\n{5,}/g, '\n\n\n');
}

function updateMaster() {
  const source = readFile(MASTER_PATH);
  let text = source.text;

  text = removeMarkedBlock(
    text,
    '{# Veloura QV V55 direct Salla surfaces start #}',
    '{# Veloura QV V55 direct Salla surfaces end #}'
  );
  text = removeMarkedBlock(
    text,
    '{# Veloura V56 safe product UI recovery start #}',
    '{# Veloura V56 safe product UI recovery end #}'
  );
  text = removeMarkedBlock(
    text,
    '{# Veloura V57 unified product UI and recently viewed products start #}',
    '{# Veloura V57 unified product UI and recently viewed products end #}'
  );

  text = text.replace(
    /\s*\{\%\s*include\s+['"]partials\.veloura-product-ui-contract['"]\s*\%\}\s*/g,
    '\n'
  );

  const closeBody = text.lastIndexOf('</body>');
  if (closeBody === -1) fail('master.twig does not contain </body>.');

  text = text.slice(0, closeBody).trimEnd() + '\n\n' + V57_BLOCK.trim() + '\n\n' + text.slice(closeBody);
  text = text.trimEnd() + '\n';

  if (count(text, 'id="veloura-v57-product-ui-runtime-2026"') !== 1) {
    fail('V57 runtime was not installed exactly once.');
  }
  if (text.includes('veloura-v56-safe-product-ui-runtime')) {
    fail('The unsafe V56 runtime is still present.');
  }
  if (text.includes('veloura-qv-v55-runtime-2026')) {
    fail('The conflicting V55 runtime is still present.');
  }

  writeFile(MASTER_PATH, text, source.eol);
}

function updateSingle() {
  const source = readFile(SINGLE_PATH);
  let text = source.text;

  text = removeMarkedBlock(
    text,
    '    {# Veloura V57 recently viewed settings start #}',
    '    {# Veloura V57 recently viewed settings end #}'
  );
  text = removeMarkedBlock(
    text,
    '    {# Veloura V57 recently viewed products section start #}',
    '    {# Veloura V57 recently viewed products section end #}'
  );

  const settingsAnchor =
    "    {% set vpp_related_center_title = _self.veloura_bool(theme.settings.get('veloura_related_center_title_2026', false), false)|trim == 'true' %}";
  const settingsIndex = text.indexOf(settingsAnchor);
  if (settingsIndex === -1) {
    fail('Could not find the related-products settings anchor in single.twig.');
  }
  const settingsAfter = settingsIndex + settingsAnchor.length;
  text = text.slice(0, settingsAfter) + '\n' + RECENT_SETTINGS_TWIG.trimEnd() + text.slice(settingsAfter);

  text = text.replace(
    'class="sticky-product-bar veloura-product-sticky-bar bg-white p-5 veloura-glass-surface veloura-glass-sticky-product"',
    'class="sticky-product-bar veloura-product-sticky-bar bg-white p-5"'
  );

  text = text.replace(
    '--salla-fast-checkout-button-width: 100%; border-radius: var(--veloura-product-radius, 0px) !important; overflow: hidden !important;',
    '--salla-fast-checkout-button-width: 100%; border-radius: var(--veloura-product-radius, 0px) !important; overflow: visible !important;'
  );

  const scriptsAnchor = '\n{% endblock %}\n\n{% block scripts %}';
  const scriptsIndex = text.lastIndexOf(scriptsAnchor);
  if (scriptsIndex === -1) {
    fail('Could not find the final content block boundary in single.twig.');
  }
  text = text.slice(0, scriptsIndex) + '\n' + RECENT_MARKUP.trimEnd() + text.slice(scriptsIndex);
  text = text.trimEnd() + '\n';

  if (count(text, 'veloura_recent_products_enabled_2026') !== 1) {
    fail('Recently viewed enable setting was not added exactly once to single.twig.');
  }
  if (count(text, 'data-veloura-recent-products') !== 1) {
    fail('Recently viewed section was not added exactly once to single.twig.');
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
  if (anchorIndex === -1) {
    fail('Could not find veloura_related_center_title_2026 in twilight.json.');
  }

  data.settings.splice(anchorIndex + 1, 0, ...RECENT_SETTINGS_JSON);

  const duplicates = RECENT_SETTINGS_JSON.filter((wanted) =>
    data.settings.filter((item) => item && item.id === wanted.id).length !== 1
  );
  if (duplicates.length) fail('A recently viewed setting was duplicated.');

  const text = JSON.stringify(data, null, 2) + '\n';
  JSON.parse(text);
  writeFile(TWILIGHT_PATH, text, source.eol);
}

function removeUnsafePartial() {
  if (exists(UNSAFE_PARTIAL_PATH)) fs.rmSync(UNSAFE_PARTIAL_PATH, { force: true });
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
  removeUnsafePartial();

  console.log('');
  console.log('Veloura V57 was installed successfully.');
  console.log('Fixed: read-more frame, thumbnail radius, cart/quick-buy colors, true zero bottom spacing.');
  console.log('Removed: V56 resize feedback loop that caused category product images to grow continuously.');
  console.log('Added: recently viewed products with enable and inherit-related-settings switches.');
  console.log('');
  console.log('Now run: node .\\VERIFY-VELOURA-V57.js');
}

try {
  main();
} catch (error) {
  console.error('');
  console.error('V57 INSTALLATION FAILED');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}
