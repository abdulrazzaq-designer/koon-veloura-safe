#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP = path.join(ROOT, '.veloura-v54-backup');
const START = '{# Veloura QV V54 Salla radius and card contract start #}';
const END = '{# Veloura QV V54 Salla radius and card contract end #}';

function fail(message) {
  console.error(`\n[V54] ERROR: ${message}`);
  process.exit(1);
}

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
}
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  const target = path.join(BACKUP, path.basename(file));
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function removeMarkedBlock(text, start, end) {
  const re = new RegExp(`\\n?\\s*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*\\n?`, 'g');
  return text.replace(re, '\n');
}
function addOrReplaceAttr(tag, name, value) {
  const re = new RegExp(`\\s+${escapeRegExp(name)}=(?:"[^"]*"|'[^']*')`, 'g');
  tag = tag.replace(re, '');
  return tag.replace(/>$/, `\n                ${name}=${value}>`);
}

// -----------------------------------------------------------------------------
// single.twig: remove hard-coded radius utilities that fight the global setting,
// keep thumbnail arrows disabled, and keep the stable light-DOM related title.
// -----------------------------------------------------------------------------
let single = fs.readFileSync(SINGLE, 'utf8');

single = single.replace(
  /class="sticky-product-bar veloura-product-sticky-bar([^\"]*)\srounded-md"/g,
  'class="sticky-product-bar veloura-product-sticky-bar$1"'
);
single = single.replace(
  /class="object-contain w-full h-full bg-gray-100 rounded-md overflow-hidden"/g,
  'class="object-contain w-full h-full bg-gray-100 overflow-hidden"'
);

const galleryId = single.indexOf('id="details-slider-');
const galleryStart = galleryId >= 0 ? single.lastIndexOf('<salla-slider', galleryId) : -1;
const galleryEnd = galleryStart >= 0 ? single.indexOf('>', galleryStart) : -1;
if (galleryStart < 0 || galleryEnd < 0) fail('Could not isolate the product image slider opening tag.');
let galleryTag = single.slice(galleryStart, galleryEnd + 1);
galleryTag = addOrReplaceAttr(galleryTag, 'show-thumbs-controls', '"false"');
single = single.slice(0, galleryStart) + galleryTag + single.slice(galleryEnd + 1);

// Ensure the related heading remains outside the component and is never consumed
// by salla-products-slider's internal block title.
single = single.replace(/\s+block-title=(?:"[^"]*"|'[^']*')/g, '');
if (!single.includes('class="veloura-product-related-title"')) {
  const relatedNeedle = /(<div class="container veloura-product-related-products[^\"]*">)/;
  if (!relatedNeedle.test(single)) fail('Could not locate the related-products wrapper.');
  single = single.replace(relatedNeedle, `$1\n            {% if vpp_liked_title %}\n                <div class="veloura-product-related-heading">\n                    <h2 class="veloura-product-related-title">{{ vpp_liked_title }}</h2>\n                </div>\n            {% endif %}`);
}
fs.writeFileSync(SINGLE, single);

// -----------------------------------------------------------------------------
// master.twig: replace the aggressive V53 shadow painter with a bounded V54
// contract. No MutationObserver and no recursive repaint loop.
// -----------------------------------------------------------------------------
let master = fs.readFileSync(MASTER, 'utf8');
const legacyBlocks = [
  ['{# Veloura QV V49 mobile buttons, true order off and glass dividers start #}', '{# Veloura QV V49 mobile buttons, true order off and glass dividers end #}'],
  ['{# Veloura QV V50 product page recovery start #}', '{# Veloura QV V50 product page recovery end #}'],
  ['{# Veloura QV V51 stable product controls and native thumbs start #}', '{# Veloura QV V51 stable product controls and native thumbs end #}'],
  ['{# Veloura QV V52 product finish start #}', '{# Veloura QV V52 product finish end #}'],
  ['{# Veloura QV V53 radius, related title and card-edge hotfix start #}', '{# Veloura QV V53 radius, related title and card-edge hotfix end #}'],
  [START, END]
];
legacyBlocks.forEach(([start, end]) => { master = removeMarkedBlock(master, start, end); });

const block = String.raw`
${START}
{% set v54_radius_raw = theme.settings.get('veloura_global_radius_2026', 'large') %}
{% if v54_radius_raw.selected is defined %}
  {% if v54_radius_raw.selected.value is defined %}
    {% set v54_radius_key = v54_radius_raw.selected.value %}
  {% elseif v54_radius_raw.selected is iterable and v54_radius_raw.selected[0] is defined and v54_radius_raw.selected[0].value is defined %}
    {% set v54_radius_key = v54_radius_raw.selected[0].value %}
  {% else %}
    {% set v54_radius_key = v54_radius_raw.selected %}
  {% endif %}
{% elseif v54_radius_raw.value is defined %}
  {% set v54_radius_key = v54_radius_raw.value %}
{% else %}
  {% set v54_radius_key = v54_radius_raw %}
{% endif %}
{% set v54_radius_map = {'sharp':'0px','soft':'10px','medium':'16px','large':'28px','xl':'36px'} %}
{% set v54_radius = v54_radius_map[v54_radius_key]|default('28px') %}

{% set v54_card_radius_raw = theme.settings.get('veloura_product_card_button_radius_2026', 'medium') %}
{% if v54_card_radius_raw.selected is defined and v54_card_radius_raw.selected.value is defined %}
  {% set v54_card_radius_key = v54_card_radius_raw.selected.value %}
{% elseif v54_card_radius_raw.selected is defined and v54_card_radius_raw.selected is iterable and v54_card_radius_raw.selected[0] is defined and v54_card_radius_raw.selected[0].value is defined %}
  {% set v54_card_radius_key = v54_card_radius_raw.selected[0].value %}
{% elseif v54_card_radius_raw.value is defined %}
  {% set v54_card_radius_key = v54_card_radius_raw.value %}
{% else %}
  {% set v54_card_radius_key = v54_card_radius_raw %}
{% endif %}
{% set v54_card_radius_map = {'sharp':'0px','soft':'8px','medium':'16px','large':'28px','round':'999px'} %}
{% set v54_card_radius = v54_card_radius_map[v54_card_radius_key]|default('16px') %}

{% set v54_card_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v54_card_bg.value is defined %}{% set v54_card_bg = v54_card_bg.value %}{% endif %}
{% set v54_card_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v54_card_text.value is defined %}{% set v54_card_text = v54_card_text.value %}{% endif %}
{% set v54_secondary_bg = theme.settings.get('veloura_site_second_bg_color_2026', '#f8fafc') %}
{% if v54_secondary_bg.value is defined %}{% set v54_secondary_bg = v54_secondary_bg.value %}{% endif %}

<style id="veloura-qv-v54-style-2026">
  :root {
    --veloura-v54-radius: {{ v54_radius }};
    --veloura-v54-card-button-radius: {{ v54_card_radius }};
    --veloura-v54-card-button-bg: {{ v54_card_bg }};
    --veloura-v54-card-button-text: {{ v54_card_text }};
    --veloura-v54-secondary-bg: {{ v54_secondary_bg }};
  }

  /* One literal global radius contract: sharp is exactly 0px. */
  .veloura-product-page .veloura-product-sticky-bar,
  .veloura-product-page .veloura-product-sticky-bar salla-add-product-button,
  .veloura-product-page .veloura-product-read-more,
  .veloura-product-page .veloura-product-thumb-item,
  .veloura-product-page .veloura-product-thumb-item > img,
  .veloura-product-page [slot="thumbs"] .swiper-slide,
  .veloura-product-page [slot="thumbs"] .swiper-slide > *,
  .veloura-product-page [slot="thumbs"] img,
  .veloura-product-page .s-product-options-option .s-form-control,
  .veloura-product-page .s-product-options-option select,
  .veloura-product-page .s-product-options-option input,
  .veloura-product-page .s-quantity-input-container {
    border-radius: var(--veloura-v54-radius) !important;
  }

  .veloura-product-page .veloura-product-read-more {
    overflow: hidden !important;
  }

  /* Selected thumbnail ring follows the same radius instead of keeping a pill. */
  .veloura-product-page .veloura-product-thumb-item.swiper-slide-thumb-active,
  .veloura-product-page [slot="thumbs"] .swiper-slide-thumb-active,
  .veloura-product-page [slot="thumbs"] .swiper-slide-thumb-active > *,
  .veloura-product-page [slot="thumbs"] .swiper-slide-thumb-active img {
    border-radius: var(--veloura-v54-radius) !important;
    overflow: hidden !important;
  }

  /* Thumbnail arrows are removed; touch/mouse dragging stays enabled. */
  .veloura-product-page .s-slider-thumbs .s-slider-next,
  .veloura-product-page .s-slider-thumbs .s-slider-prev,
  .veloura-product-page [class*="thumbs-next"],
  .veloura-product-page [class*="thumbs-prev"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Compact mobile purchase bar: inset inside the viewport and raised 12px. */
  @media (max-width: 640px) {
    .veloura-product-page.veloura-product-mobile-sticky-enabled .veloura-product-sticky-bar {
      z-index: 2147483000 !important;
      border-radius: var(--veloura-v54-radius) !important;
      overflow: hidden !important;
    }
    .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 12px !important;
      left: 12px !important;
      right: 12px !important;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      margin: 0 auto !important;
      padding: 14px !important;
      box-sizing: border-box !important;
    }
    .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar {
      position: relative !important;
      inset: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      transform: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
  }

  /* Stable title above related products. */
  .veloura-product-related-products .veloura-product-related-heading {
    display: flex !important;
    width: 100% !important;
    margin: 0 0 18px !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }
  .veloura-product-related-products .veloura-product-related-title {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    visibility: visible !important;
    opacity: 1 !important;
    text-align: right !important;
    font-size: 1.35rem !important;
    font-weight: 800 !important;
    line-height: 1.45 !important;
  }
  .veloura-product-related-products.is-title-centered .veloura-product-related-heading {
    justify-content: center !important;
  }
  .veloura-product-related-products.is-title-centered .veloura-product-related-title {
    text-align: center !important;
  }

  /* Every native product-card action keeps the card's own button contract. */
  .s-product-card-entry .veloura-v54-card-action-row {
    position: relative !important;
    display: flex !important;
    padding: 0 !important;
    max-width: none !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    align-items: stretch !important;
    justify-content: center !important;
    pointer-events: auto !important;
  }
  .s-product-card-entry .veloura-v54-card-action-row > *,
  .s-product-card-entry .veloura-v54-card-action-row salla-add-product-button {
    display: flex !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Category filters and sorting follow the same global radius and secondary surface. */
  #product-filter,
  .filters-trigger,
  .close-filters,
  salla-filters {
    border-radius: var(--veloura-v54-radius) !important;
  }
  #product-filter,
  .filters-trigger {
    background-color: var(--veloura-v54-secondary-bg) !important;
  }
</style>

<script data-cfasync="false" id="veloura-qv-v54-runtime-2026">
(function () {
  'use strict';

  var GLOBAL_RADIUS = {{ v54_radius|json_encode|raw }};
  var CARD_RADIUS = {{ v54_card_radius|json_encode|raw }};
  var CARD_BG = {{ v54_card_bg|json_encode|raw }};
  var CARD_TEXT = {{ v54_card_text|json_encode|raw }};
  var SECONDARY_BG = {{ v54_secondary_bg|json_encode|raw }};
  var timers = [];
  var resizeTimer = 0;
  var relatedResizeObserver = null;

  function number(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function important(element, name, value) {
    if (element && element.style) element.style.setProperty(name, value, 'important');
  }

  function ensureShadowStyle(root, id, css) {
    if (!root) return;
    var style = root.querySelector('#' + id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      root.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }

  function collectRoots(start, depth) {
    var roots = [];
    var seen = [];
    function visit(root, level) {
      if (!root || level > depth || seen.indexOf(root) !== -1) return;
      seen.push(root);
      roots.push(root);
      if (!root.querySelectorAll) return;
      root.querySelectorAll('*').forEach(function (node) {
        if (node.shadowRoot) visit(node.shadowRoot, level + 1);
      });
    }
    visit(start || document, 0);
    return roots;
  }

  function deepAll(selector, start) {
    var result = [];
    collectRoots(start || document, 7).forEach(function (root) {
      if (!root.querySelectorAll) return;
      root.querySelectorAll(selector).forEach(function (node) {
        if (result.indexOf(node) === -1) result.push(node);
      });
    });
    return result;
  }

  function styleActionComponent(component, bg, fg, radius, id, depth) {
    if (!component || depth > 3) return;
    component.style.setProperty('--color-primary', bg, 'important');
    component.style.setProperty('--color-primary-reverse', fg, 'important');
    component.style.setProperty('--button-background-color', bg, 'important');
    component.style.setProperty('--button-border-color', bg, 'important');
    component.style.setProperty('--button-text-color', fg, 'important');
    component.style.setProperty('--salla-fast-checkout-button-border-radius', radius, 'important');
    important(component, 'border-radius', radius);
    important(component, 'overflow', 'hidden');
    important(component, 'width', '100%');
    important(component, 'max-width', '100%');

    if (!component.shadowRoot) return;
    ensureShadowStyle(component.shadowRoot, id,
      ':host{display:block!important;width:100%!important;max-width:100%!important;border-radius:' + radius + '!important;overflow:hidden!important;' +
      '--color-primary:' + bg + '!important;--color-primary-reverse:' + fg + '!important;' +
      '--button-background-color:' + bg + '!important;--button-border-color:' + bg + '!important;--button-text-color:' + fg + '!important}' +
      'button,.s-button-element,.s-button-btn,[part~="button"]{' +
      'display:flex!important;width:100%!important;max-width:100%!important;min-height:44px!important;' +
      'align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;' +
      'background:' + bg + '!important;background-color:' + bg + '!important;border:1px solid ' + bg + '!important;' +
      'border-radius:' + radius + '!important;color:' + fg + '!important;opacity:1!important;visibility:visible!important}' +
      'button *,.s-button-element *,.s-button-btn *{color:' + fg + '!important;fill:' + fg + '!important;stroke:currentColor!important}'
    );

    component.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget').forEach(function (child, index) {
      styleActionComponent(child, bg, fg, radius, id + '-' + index, depth + 1);
    });
  }

  function syncPurchaseBar() {
    var bar = document.querySelector('.veloura-product-page .veloura-product-sticky-bar');
    if (!bar) return false;
    important(bar, 'border-radius', GLOBAL_RADIUS);

    var host = bar.querySelector('salla-add-product-button');
    if (!host) return false;
    important(host, 'border-radius', GLOBAL_RADIUS);
    host.style.setProperty('--salla-fast-checkout-button-border-radius', GLOBAL_RADIUS, 'important');

    if (!host.shadowRoot) return false;
    ensureShadowStyle(host.shadowRoot, 'veloura-v54-purchase-host-style',
      ':host{display:block!important;width:100%!important;max-width:100%!important;border-radius:' + GLOBAL_RADIUS + '!important}' +
      '.s-add-product-button-main{display:flex!important;width:100%!important;max-width:100%!important;gap:12px!important}' +
      'salla-button,salla-quick-buy,salla-mini-checkout-widget{flex:1 1 0!important;min-width:0!important;border-radius:' + GLOBAL_RADIUS + '!important;overflow:hidden!important}'
    );

    var actions = Array.prototype.slice.call(host.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget'));
    var rootStyle = getComputedStyle(document.documentElement);
    var primary = rootStyle.getPropertyValue('--color-primary').trim() || CARD_BG;
    var primaryText = rootStyle.getPropertyValue('--color-primary-reverse').trim() || '#ffffff';
    actions.forEach(function (action, index) {
      var quick = action.tagName.toLowerCase().indexOf('quick') !== -1 || index > 0;
      styleActionComponent(action, quick ? primary : CARD_BG, quick ? primaryText : CARD_TEXT, GLOBAL_RADIUS, 'veloura-v54-purchase-action-' + index, 0);
    });
    return actions.length > 0;
  }

  function syncThumbs() {
    var slider = document.querySelector('.veloura-product-page salla-slider.details-slider');
    if (!slider) return false;
    slider.setAttribute('show-thumbs-controls', 'false');
    try { slider.showThumbsControls = false; } catch (error) {}

    document.querySelectorAll('.veloura-product-page .veloura-product-thumb-item,.veloura-product-page .veloura-product-thumb-item>img').forEach(function (node) {
      important(node, 'border-radius', GLOBAL_RADIUS);
      important(node, 'overflow', 'hidden');
    });

    ensureShadowStyle(slider.shadowRoot, 'veloura-v54-thumbs-style',
      '.s-slider-thumbs .swiper-slide,.s-slider-thumbs .swiper-slide>*,.s-slider-thumbs img,' +
      '[class*="thumb"] .swiper-slide,[class*="thumb"] .swiper-slide>*,[class*="thumb"] img{' +
      'border-radius:' + GLOBAL_RADIUS + '!important;overflow:hidden!important}' +
      '.s-slider-thumbs .swiper-slide-thumb-active,.s-slider-thumbs .swiper-slide-thumb-active>*,.s-slider-thumbs .swiper-slide-thumb-active img{' +
      'border-radius:' + GLOBAL_RADIUS + '!important;overflow:hidden!important}' +
      '.s-slider-thumbs .s-slider-next,.s-slider-thumbs .s-slider-prev,.s-slider-thumbs [class*="slider-next"],.s-slider-thumbs [class*="slider-prev"],' +
      '[class*="thumbs-next"],[class*="thumbs-prev"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}'
    );
    return true;
  }

  function readCardX(card) {
    var style = getComputedStyle(card);
    var own = style.getPropertyValue('--veloura-v35-action-x').trim();
    if (own !== '') return Math.max(0, number(own));
    var root = getComputedStyle(document.documentElement);
    var value = root.getPropertyValue('--veloura-v35-action-x').trim() || root.getPropertyValue('--veloura-product-button-margin-x').trim();
    return Math.max(0, number(value));
  }

  function exposeBetween(row, card) {
    var current = row.parentElement;
    while (current && current !== card) {
      important(current, 'overflow', 'visible');
      important(current, 'max-width', 'none');
      current = current.parentElement;
    }
  }

  function syncCardAction(card, row) {
    if (!card || !row) return;
    var cardRect = card.getBoundingClientRect();
    if (cardRect.width < 2) return;

    card.classList.add('veloura-v35-card', 'veloura-v54-card');
    row.classList.add('veloura-v35-action-row', 'veloura-v54-card-action-row');
    exposeBetween(row, card);

    var x = readCardX(card);
    var targetWidth = Math.max(0, cardRect.width - (x * 2));
    ['width','max-width','min-width','margin-left','margin-right','left','right','inset-inline','transform','align-self'].forEach(function (name) {
      row.style.removeProperty(name);
    });
    important(row, 'width', targetWidth.toFixed(3) + 'px');
    important(row, 'max-width', targetWidth.toFixed(3) + 'px');
    important(row, 'min-width', '0px');
    important(row, 'margin-left', '0px');
    important(row, 'margin-right', '0px');
    important(row, 'align-self', 'flex-start');

    var rowRect = row.getBoundingClientRect();
    var delta = (cardRect.left + x) - rowRect.left;
    important(row, 'transform', 'translate3d(' + delta.toFixed(3) + 'px,0,0)');

    row.querySelectorAll('salla-add-product-button').forEach(function (button) {
      button.setAttribute('width', 'wide');
      try { button.width = 'wide'; } catch (error) {}
      important(button, 'width', '100%');
      important(button, 'max-width', '100%');
      styleActionComponent(button, CARD_BG, CARD_TEXT, CARD_RADIUS, 'veloura-v54-card-button', 0);
    });
  }

  function syncProductCards() {
    var cards = deepAll('.s-product-card-entry', document);
    cards.forEach(function (card) {
      var content = card.querySelector('.s-product-card-content');
      if (content) content.classList.add('veloura-v35-content');
      var rows = card.querySelectorAll('.s-product-card-content-footer,.veloura-quick-view-under-cart-wrap');
      rows.forEach(function (row) { syncCardAction(card, row); });
    });
    return cards.length > 0;
  }

  function syncRelated() {
    var wrapper = document.querySelector('.veloura-product-related-products');
    if (!wrapper) return false;
    var heading = wrapper.querySelector('.veloura-product-related-heading');
    var title = wrapper.querySelector('.veloura-product-related-title');
    if (heading) {
      important(heading, 'display', 'flex');
      important(heading, 'visibility', 'visible');
      important(heading, 'opacity', '1');
    }
    if (title) {
      important(title, 'display', 'block');
      important(title, 'visibility', 'visible');
      important(title, 'opacity', '1');
      important(title, 'text-align', wrapper.classList.contains('is-title-centered') ? 'center' : 'right');
    }

    var host = wrapper.querySelector('salla-products-slider[data-veloura-related-slider],salla-products-slider');
    if (host && !relatedResizeObserver && window.ResizeObserver) {
      relatedResizeObserver = new ResizeObserver(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(syncProductCards, 80);
      });
      relatedResizeObserver.observe(host);
    }
    return true;
  }

  function syncFilters() {
    document.querySelectorAll('#product-filter,.filters-trigger,.close-filters,salla-filters').forEach(function (node) {
      important(node, 'border-radius', GLOBAL_RADIUS);
    });
    document.querySelectorAll('#product-filter,.filters-trigger').forEach(function (node) {
      important(node, 'background-color', SECONDARY_BG);
    });
    deepAll('salla-filters', document).forEach(function (host, index) {
      ensureShadowStyle(host.shadowRoot, 'veloura-v54-filters-style-' + index,
        ':host{border-radius:' + GLOBAL_RADIUS + '!important;--veloura-v54-radius:' + GLOBAL_RADIUS + '}' +
        'button,select,input,.s-form-control,[class*="filter"],[class*="accordion"],[class*="sort"]{' +
        'border-radius:' + GLOBAL_RADIUS + '!important}'
      );
    });
  }

  function run() {
    syncPurchaseBar();
    syncThumbs();
    syncRelated();
    syncProductCards();
    syncFilters();

    timers.forEach(clearTimeout);
    timers = [80, 220, 520, 1000, 1800, 3200].map(function (delay) {
      return setTimeout(function () {
        syncPurchaseBar();
        syncThumbs();
        syncRelated();
        syncProductCards();
        syncFilters();
      }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  document.addEventListener('theme::ready', run);
  document.addEventListener('salla::products::loaded', run);
  document.addEventListener('salla::product.cards::loaded', run);
  document.addEventListener('salla::product::details::loaded', run);
  document.addEventListener('afterInit', function (event) {
    var target = event.target;
    if (target && target.matches && target.matches('salla-slider,salla-products-slider,salla-add-product-button,salla-filters')) run();
  });
  window.addEventListener('pageshow', run, { passive: true });
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(run, 180);
  }, { passive: true });
})();
</script>
${END}
`;

const hook = "{% hook 'head:end' %}";
if (!master.includes(hook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(hook, block + '\n' + hook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V54 installed correctly.');
console.log('Global radius now reaches Read More/Less, the compact mobile purchase bar, real purchase buttons, thumbnail surfaces and active thumbnail rings.');
console.log('Thumbnail arrows are removed, category filter/sort controls use the global radius, and every Salla product-card action row follows the shared card spacing/color/radius contract.');
