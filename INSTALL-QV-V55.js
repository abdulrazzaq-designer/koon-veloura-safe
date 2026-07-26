#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP = path.join(ROOT, '.veloura-v55-backup');
const START = '{# Veloura QV V55 direct Salla surfaces start #}';
const END = '{# Veloura QV V55 direct Salla surfaces end #}';

function fail(message) {
  console.error(`\n[V55] ERROR: ${message}`);
  process.exit(1);
}

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
}
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  const rel = path.relative(ROOT, file).replace(/[\\/]/g, '__');
  const target = path.join(BACKUP, rel);
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function removeMarkedBlock(text, start, end) {
  const re = new RegExp(`\\n?\\s*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*\\n?`, 'g');
  return text.replace(re, '\n');
}
function setAttr(tag, name, quotedValue) {
  const re = new RegExp(`\\s+${escapeRegExp(name)}=(?:"[^"]*"|'[^']*')`, 'g');
  tag = tag.replace(re, '');
  const selfClosing = /\/>\s*$/.test(tag);
  tag = tag.replace(/\s*\/?>\s*$/, '');
  return `${tag}\n                                ${name}=${quotedValue}${selfClosing ? '/>' : '>'}`;
}
function setStyle(tag, declarations) {
  return setAttr(tag, 'style', `"${declarations.replace(/"/g, '&quot;')}"`);
}
function patchOpeningTag(text, needle, patcher) {
  const pos = text.indexOf(needle);
  if (pos < 0) fail(`Could not find: ${needle}`);
  const start = text.lastIndexOf('<', pos);
  const end = text.indexOf('>', pos);
  if (start < 0 || end < 0) fail(`Could not isolate opening tag for: ${needle}`);
  const tag = text.slice(start, end + 1);
  return text.slice(0, start) + patcher(tag) + text.slice(end + 1);
}

// ---------------------------------------------------------------------------
// single.twig — put the contract on the actual light-DOM surfaces and hosts.
// ---------------------------------------------------------------------------
let single = fs.readFileSync(SINGLE, 'utf8');

single = patchOpeningTag(single, 'id="details-slider-', (tag) => {
  tag = tag.replace(/\srounded-md\b/g, '');
  tag = setAttr(tag, 'show-thumbs-controls', '"false"');
  tag = setAttr(tag, 'thumbs-config', '\'{"slidesPerView":4,"slidesPerGroup":1,"spaceBetween":12,"freeMode":true,"watchSlidesProgress":true,"allowTouchMove":true}\'');
  return setStyle(tag, '--veloura-v55-radius: var(--veloura-product-radius, 0px);');
});

single = single.replace(
  /<div\b[^>]*class="[^"]*\bveloura-product-thumb-item\b[^"]*"[^>]*>/g,
  (tag) => setStyle(tag, 'border-radius: var(--veloura-product-radius, 0px) !important; overflow: hidden !important;')
);
single = single.replace(
  /<img\b[^>]*class="[^"]*object-contain w-full h-full bg-gray-100 overflow-hidden[^"]*"[^>]*>/g,
  (tag) => setStyle(tag, 'border-radius: var(--veloura-product-radius, 0px) !important;')
);
single = patchOpeningTag(single, 'id="btn-show-more"', (tag) =>
  setStyle(tag, 'border-radius: var(--veloura-product-radius, 0px) !important; overflow: hidden !important;')
);

single = patchOpeningTag(single, 'class="sticky-product-bar veloura-product-sticky-bar', (tag) =>
  setStyle(tag, 'border-radius: var(--veloura-product-radius, 0px) !important;')
);

single = patchOpeningTag(single, 'class="w-full sticky-product-bar__btn"', (tag) => {
  tag = setAttr(tag, 'width', '"wide"');
  return setStyle(
    tag,
    '--button-border-radius: var(--veloura-product-radius, 0px); --salla-fast-checkout-button-border-radius: var(--veloura-product-radius, 0px); --salla-fast-checkout-button-width: 100%; border-radius: var(--veloura-product-radius, 0px) !important; overflow: hidden !important;'
  );
});

fs.writeFileSync(SINGLE, single);

// ---------------------------------------------------------------------------
// master.twig — remove the failed V54 painter and place V55 last in <head>.
// ---------------------------------------------------------------------------
let master = fs.readFileSync(MASTER, 'utf8');
master = removeMarkedBlock(master,
  '{# Veloura QV V54 Salla radius and card contract start #}',
  '{# Veloura QV V54 Salla radius and card contract end #}'
);
master = removeMarkedBlock(master, START, END);

const block = String.raw`
${START}
{% set v55_radius_raw = theme.settings.get('veloura_global_radius_2026', 'large') %}
{% if v55_radius_raw.selected is defined %}
  {% if v55_radius_raw.selected.value is defined %}
    {% set v55_radius_key = v55_radius_raw.selected.value %}
  {% elseif v55_radius_raw.selected is iterable and v55_radius_raw.selected[0] is defined and v55_radius_raw.selected[0].value is defined %}
    {% set v55_radius_key = v55_radius_raw.selected[0].value %}
  {% else %}
    {% set v55_radius_key = v55_radius_raw.selected %}
  {% endif %}
{% elseif v55_radius_raw.value is defined %}
  {% set v55_radius_key = v55_radius_raw.value %}
{% else %}
  {% set v55_radius_key = v55_radius_raw %}
{% endif %}
{% set v55_radius_map = {'sharp':'0px','soft':'10px','medium':'16px','large':'28px','xl':'36px'} %}
{% set v55_radius = v55_radius_map[v55_radius_key]|default('28px') %}

<style id="veloura-qv-v55-style-2026">
  :root { --veloura-v55-global-radius: {{ v55_radius }}; }

  /* Exact light-DOM product surfaces. */
  html body .veloura-product-page #btn-show-more,
  html body .veloura-product-page .veloura-product-read-more,
  html body .veloura-product-page .veloura-product-read-more__text,
  html body .veloura-product-page .veloura-product-sticky-bar,
  html body .veloura-product-page .veloura-product-sticky-bar salla-add-product-button,
  html body .veloura-product-page .veloura-product-thumb-item,
  html body .veloura-product-page .veloura-product-thumb-item > img,
  html body .veloura-product-page [slot="thumbs"] > *,
  html body .veloura-product-page [slot="thumbs"] > * > img {
    border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius)) !important;
  }

  html body .veloura-product-page #btn-show-more,
  html body .veloura-product-page .veloura-product-read-more,
  html body .veloura-product-page .veloura-product-thumb-item,
  html body .veloura-product-page [slot="thumbs"] > * {
    overflow: hidden !important;
    clip-path: inset(0 round var(--veloura-product-radius, var(--veloura-v55-global-radius))) !important;
  }

  /* The selected thumbnail ring is drawn on the selected slide itself. */
  html body .veloura-product-page .veloura-product-thumb-item.swiper-slide-thumb-active,
  html body .veloura-product-page [slot="thumbs"] > .swiper-slide-thumb-active,
  html body .veloura-product-page [slot="thumbs"] .swiper-slide-thumb-active,
  html body .veloura-product-page [slot="thumbs"] [aria-current="true"] {
    border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius)) !important;
    outline-offset: 0 !important;
    overflow: hidden !important;
  }

  /* Salla hosts: radius variables cross the component boundary. */
  html body .veloura-product-page .sticky-product-bar salla-add-product-button {
    --button-border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius));
    --salla-button-border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius));
    --salla-fast-checkout-button-border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius));
    --salla-fast-checkout-button-width: 100%;
    width: 100% !important;
    max-width: 100% !important;
    border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius)) !important;
    overflow: hidden !important;
  }
  html body .veloura-product-page .sticky-product-bar salla-add-product-button::part(button) {
    border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius)) !important;
  }

  /* Compact sticky bar: a real inset card, not a full-width slab. */
  @media (max-width: 640px) {
    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .sticky-product-bar.veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 12px !important;
      left: 12px !important;
      right: 12px !important;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      min-height: 0 !important;
      margin: 0 auto !important;
      padding: 8px 12px !important;
      gap: 5px !important;
      box-sizing: border-box !important;
      border-radius: var(--veloura-product-radius, var(--veloura-v55-global-radius)) !important;
      overflow: hidden !important;
      z-index: 2147483000 !important;
    }
    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .veloura-product-cart-price-row,
    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .sticky-product-bar__quantity {
      min-height: 32px !important;
      margin: 0 !important;
      padding-block: 2px !important;
    }
    html body .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .sticky-product-bar__btn {
      min-height: 42px !important;
      margin: 0 !important;
    }
    html body .veloura-product-page.veloura-product-mobile-sticky-disabled .sticky-product-bar.veloura-product-sticky-bar {
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
    }
  }

  /* Hide thumbnail arrows while preserving drag/swipe. */
  html body .veloura-product-page .s-slider-thumbs .s-slider-next,
  html body .veloura-product-page .s-slider-thumbs .s-slider-prev,
  html body .veloura-product-page [class*="thumbs-next"],
  html body .veloura-product-page [class*="thumbs-prev"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* Category sort/filter controls share the global radius. */
  html body #product-filter,
  html body .filters-trigger,
  html body .close-filters,
  html body salla-filters {
    border-radius: var(--veloura-v55-global-radius) !important;
  }

  /* All product-card actions, including related products, keep the card contract. */
  html body.veloura-product-card-enabled .veloura-product-related-products .s-product-card-entry .s-product-card-content-footer,
  html body.veloura-product-card-enabled .veloura-product-related-products .s-product-card-entry salla-add-product-button {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    transform: none !important;
    width: calc(100% - (var(--veloura-product-button-margin-x, 0px) * 2)) !important;
    max-width: calc(100% - (var(--veloura-product-button-margin-x, 0px) * 2)) !important;
    min-width: 0 !important;
    margin-inline: auto !important;
    box-sizing: border-box !important;
  }
  html body.veloura-product-card-enabled .veloura-product-related-products .s-product-card-entry salla-add-product-button {
    --button-border-radius: var(--veloura-product-button-radius, 0px);
    --salla-button-border-radius: var(--veloura-product-button-radius, 0px);
    width: 100% !important;
    max-width: 100% !important;
    border-radius: var(--veloura-product-button-radius, 0px) !important;
    overflow: hidden !important;
  }
  html body.veloura-product-card-enabled .veloura-product-related-products .s-product-card-entry salla-add-product-button::part(button) {
    width: 100% !important;
    border-radius: var(--veloura-product-button-radius, 0px) !important;
    background: var(--veloura-product-button-bg) !important;
    color: var(--veloura-product-button-text) !important;
  }
</style>

<script id="veloura-qv-v55-runtime-2026">
(function () {
  'use strict';
  var MAX_RUNS = 6;
  var runs = 0;

  function radiusOfProductPage() {
    var page = document.querySelector('.veloura-product-page');
    if (!page) return getComputedStyle(document.documentElement).getPropertyValue('--veloura-v55-global-radius').trim() || '0px';
    return getComputedStyle(page).getPropertyValue('--veloura-product-radius').trim() || '0px';
  }

  function setRadius(node, radius) {
    if (!node || !node.style) return;
    node.style.setProperty('border-radius', radius, 'important');
  }

  function walkOpenRoots(root, callback) {
    if (!root) return;
    callback(root);
    var nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
    nodes.forEach(function (node) {
      if (node.shadowRoot) walkOpenRoots(node.shadowRoot, callback);
    });
  }

  function paintPurchaseButtons() {
    var radius = radiusOfProductPage();
    document.querySelectorAll('.veloura-product-page .sticky-product-bar salla-add-product-button').forEach(function (host) {
      host.style.setProperty('--button-border-radius', radius);
      host.style.setProperty('--salla-button-border-radius', radius);
      host.style.setProperty('--salla-fast-checkout-button-border-radius', radius);
      host.style.setProperty('--salla-fast-checkout-button-width', '100%');
      setRadius(host, radius);
      walkOpenRoots(host.shadowRoot, function (root) {
        root.querySelectorAll('button,salla-button,salla-mini-checkout-widget,.s-button-element,[part~="button"]').forEach(function (node) {
          setRadius(node, radius);
          node.style.setProperty('--button-border-radius', radius);
          node.style.setProperty('--salla-button-border-radius', radius);
          node.style.setProperty('--salla-fast-checkout-button-border-radius', radius);
        });
      });
    });
  }

  function paintThumbs() {
    var radius = radiusOfProductPage();
    var slider = document.querySelector('.veloura-product-page salla-slider[id^="details-slider-"]');
    if (!slider) return;
    slider.setAttribute('show-thumbs-controls', 'false');
    document.querySelectorAll('.veloura-product-page .veloura-product-thumb-item,.veloura-product-page .veloura-product-thumb-item img').forEach(function (node) {
      setRadius(node, radius);
    });
    walkOpenRoots(slider.shadowRoot, function (root) {
      root.querySelectorAll('.swiper-slide-thumb-active,.s-slider-thumbs .swiper-slide,.s-slider-thumbs img,[class*="thumb"]').forEach(function (node) {
        setRadius(node, radius);
      });
      root.querySelectorAll('.s-slider-thumbs .s-slider-next,.s-slider-thumbs .s-slider-prev,[class*="thumbs-next"],[class*="thumbs-prev"]').forEach(function (node) {
        node.style.setProperty('display', 'none', 'important');
      });
    });
  }

  function paintRelatedCards() {
    document.querySelectorAll('.veloura-product-related-products .s-product-card-entry').forEach(function (card) {
      var footer = card.querySelector('.s-product-card-content-footer');
      var button = card.querySelector('salla-add-product-button');
      if (!footer || !button) return;
      var styles = getComputedStyle(document.body);
      var x = styles.getPropertyValue('--veloura-product-button-margin-x').trim() || '0px';
      footer.style.setProperty('width', 'calc(100% - (' + x + ' * 2))', 'important');
      footer.style.setProperty('max-width', 'calc(100% - (' + x + ' * 2))', 'important');
      footer.style.setProperty('margin-inline', 'auto', 'important');
      footer.style.setProperty('transform', 'none', 'important');
      button.setAttribute('width', 'wide');
      button.style.setProperty('width', '100%', 'important');
      button.style.setProperty('max-width', '100%', 'important');
      var r = styles.getPropertyValue('--veloura-product-button-radius').trim() || '0px';
      button.style.setProperty('--button-border-radius', r);
      setRadius(button, r);
    });
  }

  function run() {
    runs += 1;
    paintPurchaseButtons();
    paintThumbs();
    paintRelatedCards();
  }

  function schedule() {
    if (runs >= MAX_RUNS) return;
    run();
    [120, 350, 800, 1600, 2800].forEach(function (delay) {
      setTimeout(function () { if (runs < MAX_RUNS) run(); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
  document.addEventListener('afterInit', function (event) {
    var target = event.target;
    if (target && target.matches && target.matches('salla-slider,salla-add-product-button,salla-products-slider')) run();
  });
})();
</script>
${END}
`;

const headEnd = master.lastIndexOf('</head>');
if (headEnd < 0) fail('Could not find </head> in master.twig.');
master = master.slice(0, headEnd) + '\n' + block + '\n' + master.slice(headEnd);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V55 installed correctly.');
console.log('V54 recursive painting was removed. V55 targets the exact product-page light DOM, supported Salla radius variables, and bounded open Shadow DOM surfaces.');
console.log('Compact sticky bar, Read More/Less, thumbnail active ring, category controls and related-card action width now share their intended radius/spacing contracts.');
