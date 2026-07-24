const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v37-' + timestamp());

const BLOCK_START = '{# Veloura QV V37 product details, sticky layer and related-card width fix start #}';
const BLOCK_END = '{# Veloura QV V37 product details, sticky layer and related-card width fix end #}';
const NORMALIZER_START = '{# Veloura Product Settings Normalizers V37 start #}';
const NORMALIZER_END = '{# Veloura Product Settings Normalizers V37 end #}';
const STOCK_START = '{# Veloura Stock Radar V37 start #}';
const STOCK_END = '{# Veloura Stock Radar V37 end #}';
const STYLE_ID = 'veloura-qv-v37-product-details-style-2026';
const SCRIPT_ID = 'veloura-qv-v37-product-details-runtime-2026';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}

function backup(file, relativeName) {
  fs.mkdirSync(path.dirname(path.join(backupDir, relativeName)), { recursive: true });
  fs.copyFileSync(file, path.join(backupDir, relativeName));
}

const normalizers = `${NORMALIZER_START}
    {% macro veloura_bool(raw, fallback) %}
      {# Salla settings may arrive as a primitive, {value}, {selected:{value}}, or {selected:[{value}]}. #}
      {% if raw.value is defined %}
        {% if raw.value.value is defined %}
          {% set raw = raw.value.value %}
        {% elseif raw.value is iterable and raw.value[0] is defined and raw.value[0].value is defined %}
          {% set raw = raw.value[0].value %}
        {% else %}
          {% set raw = raw.value %}
        {% endif %}
      {% elseif raw.selected is defined %}
        {% if raw.selected.value is defined %}
          {% set raw = raw.selected.value %}
        {% elseif raw.selected is iterable and raw.selected[0] is defined and raw.selected[0].value is defined %}
          {% set raw = raw.selected[0].value %}
        {% elseif raw.selected is iterable and raw.selected[0] is defined %}
          {% set raw = raw.selected[0] %}
        {% else %}
          {% set raw = raw.selected %}
        {% endif %}
      {% elseif raw is iterable and raw[0] is defined and raw[0].value is defined %}
        {% set raw = raw[0].value %}
      {% endif %}

      {% if raw == true or raw == 'true' or raw == 1 or raw == '1' or raw == 'on' or raw == 'yes' %}
        true
      {% elseif raw == false or raw == 'false' or raw == 0 or raw == '0' or raw == 'off' or raw == 'no' %}
        false
      {% else %}
        {{ fallback ? 'true' : 'false' }}
      {% endif %}
    {% endmacro %}

    {% macro veloura_select(raw, fallback) %}
      {% if raw.selected is defined %}
        {% if raw.selected.value is defined %}
          {{ raw.selected.value }}
        {% elseif raw.selected is iterable and raw.selected[0] is defined and raw.selected[0].value is defined %}
          {{ raw.selected[0].value }}
        {% elseif raw.selected is iterable and raw.selected[0] is defined %}
          {{ raw.selected[0] }}
        {% elseif raw.selected %}
          {{ raw.selected }}
        {% else %}
          {{ fallback }}
        {% endif %}
      {% elseif raw.value is defined %}
        {% if raw.value.value is defined %}
          {{ raw.value.value }}
        {% elseif raw.value is iterable and raw.value[0] is defined and raw.value[0].value is defined %}
          {{ raw.value[0].value }}
        {% elseif raw.value is iterable and raw.value[0] is defined %}
          {{ raw.value[0] }}
        {% elseif raw.value %}
          {{ raw.value }}
        {% else %}
          {{ fallback }}
        {% endif %}
      {% elseif raw is iterable and raw[0] is defined and raw[0].value is defined %}
        {{ raw[0].value }}
      {% elseif raw is iterable and raw[0] is defined %}
        {{ raw[0] }}
      {% elseif raw %}
        {{ raw }}
      {% else %}
        {{ fallback }}
      {% endif %}
    {% endmacro %}
${NORMALIZER_END}`;

const block = `
${BLOCK_START}
{# V37: product-page settings are reapplied after component hydration; sticky purchase bar sits above page content; related-card action rows use exact card-edge geometry. #}
<style id="${STYLE_ID}">
  /* The stock-radar switch now has a visible true/false result. */
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"] .veloura-product-stock-radar.is-pulse .veloura-product-stock-radar__dot {
    display: inline-block !important;
    animation: veloura-stock-pulse 1.5s infinite !important;
  }

  .veloura-product-page[data-veloura-v37-stock-radar="simple"] .veloura-product-stock-radar__dot,
  .veloura-product-page .veloura-product-stock-radar.is-simple .veloura-product-stock-radar__dot {
    display: none !important;
    animation: none !important;
    box-shadow: none !important;
  }

  /* Product mobile purchase bar: above images, footer and recommendations. */
  @media (max-width: 640px) {
    html body.veloura-is-product-page.veloura-product-sticky-active
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar {
      z-index: 2147482000 !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  }

  /* Related products: V37 writes exact pixel geometry from the visible card edge. */
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v37-related-card {
    overflow: visible !important;
  }

  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v37-related-card
  .veloura-v37-related-action {
    position: relative !important;
    max-width: none !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    pointer-events: auto !important;
  }

  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v37-related-card
  .veloura-v37-related-action > *,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v37-related-card
  .veloura-v37-related-action > salla-add-product-button,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v37-related-card
  .veloura-v37-related-action .veloura-quick-view-btn {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: 1 1 100% !important;
    box-sizing: border-box !important;
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var STYLE_ID = '${STYLE_ID}';
  var RELATED_SELECTOR = '.veloura-product-related-products .s-product-card-entry';
  var ACTION_SELECTOR = '.s-product-card-content-footer, .veloura-quick-view-under-cart-wrap';
  var scheduled = false;
  var headObserver = null;

  function number(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function ensureStyleLast() {
    var style = document.getElementById(STYLE_ID);
    if (style && document.head && document.head.lastElementChild !== style) {
      document.head.appendChild(style);
    }
  }

  function observeHead() {
    if (headObserver || !document.head || !window.MutationObserver) return;
    headObserver = new MutationObserver(function () {
      var style = document.getElementById(STYLE_ID);
      if (style && document.head.lastElementChild !== style) {
        window.requestAnimationFrame(ensureStyleLast);
      }
    });
    headObserver.observe(document.head, { childList: true });
  }

  function syncProductSettings() {
    var page = document.querySelector('.veloura-product-page.veloura-product-enabled');
    if (!page) return;

    var slider = page.querySelector('salla-slider.details-slider.image-slider');
    var requested = page.getAttribute('data-veloura-v37-thumbs') || 'below_image';
    var desktop = window.matchMedia ? window.matchMedia('(min-width: 768px)').matches : window.innerWidth >= 768;
    var position = desktop && requested === 'right_side' ? 'right' : 'bottom';

    if (slider) {
      if (slider.getAttribute('thumbs-position') !== position) slider.setAttribute('thumbs-position', position);
      try { slider.thumbsPosition = position; } catch (error) {}
      slider.classList.toggle('veloura-v37-thumbs-right', position === 'right');
      slider.classList.toggle('veloura-v37-thumbs-bottom', position !== 'right');
      if (slider.swiper && typeof slider.swiper.update === 'function') slider.swiper.update();
    }

    var pulse = page.getAttribute('data-veloura-v37-stock-radar') === 'pulse';
    page.querySelectorAll('.veloura-product-stock-radar').forEach(function (radar) {
      radar.classList.toggle('is-pulse', pulse);
      radar.classList.toggle('is-simple', !pulse);
    });
  }

  function horizontalValue() {
    var rootStyle = window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null;
    return Math.max(0, number(rootStyle ? rootStyle.getPropertyValue('--veloura-v35-action-x') : 0));
  }

  function syncRelatedAction(card, row, x) {
    if (!card || !row || !window.getComputedStyle) return;

    var cardRect = card.getBoundingClientRect();
    if (cardRect.width <= 1) return;

    var targetWidth = Math.max(0, cardRect.width - (x * 2));
    row.classList.add('veloura-v37-related-action');

    row.style.setProperty('width', targetWidth.toFixed(3) + 'px', 'important');
    row.style.setProperty('max-width', targetWidth.toFixed(3) + 'px', 'important');
    row.style.setProperty('min-width', '0px', 'important');
    row.style.setProperty('margin-left', '0px', 'important');
    row.style.setProperty('margin-right', '0px', 'important');
    row.style.setProperty('align-self', 'flex-start', 'important');
    row.style.setProperty('transform', 'none', 'important');

    var rowRect = row.getBoundingClientRect();
    var desiredLeft = cardRect.left + x;
    var delta = desiredLeft - rowRect.left;
    row.style.setProperty('transform', 'translate3d(' + delta.toFixed(3) + 'px, 0, 0)', 'important');
  }

  function syncRelated(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var cards = [];

    if (root.matches && root.matches(RELATED_SELECTOR)) cards.push(root);
    root.querySelectorAll(RELATED_SELECTOR).forEach(function (card) { cards.push(card); });

    var x = horizontalValue();
    cards.forEach(function (card) {
      card.classList.add('veloura-v37-related-card');
      card.querySelectorAll(ACTION_SELECTOR).forEach(function (row) {
        syncRelatedAction(card, row, x);
      });
    });
  }

  function sync(scope) {
    ensureStyleLast();
    observeHead();
    syncProductSettings();
    syncRelated(scope || document);
  }

  function schedule(scope) {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      sync(scope || document);
      window.requestAnimationFrame(function () { sync(scope || document); });
    });
  }

  function run() {
    sync(document);
    if (window.customElements && typeof window.customElements.whenDefined === 'function') {
      window.customElements.whenDefined('salla-slider').then(function () { schedule(document); }).catch(function () {});
    }
    [80, 220, 600, 1200, 2500, 4500].forEach(function (delay) {
      window.setTimeout(function () { sync(document); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      var scope = document;
      for (var i = 0; i < mutations.length; i++) {
        var target = mutations[i].target;
        if (target && target.closest) {
          scope = target.closest('.veloura-product-related-products, .veloura-product-page') || document;
          if (scope !== document) break;
        }
      }
      schedule(scope);
    });

    function startObserver() {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'thumbs-position'] });
    }

    if (document.body) startObserver();
    else document.addEventListener('DOMContentLoaded', startObserver);
  }

  window.addEventListener('resize', function () { schedule(document); }, { passive: true });
  window.addEventListener('orientationchange', function () { schedule(document); }, { passive: true });
  document.addEventListener('theme::ready', function () { schedule(document); });
  document.addEventListener('salla::product.cards::loaded', function () { schedule(document); });
  document.addEventListener('salla::products::loaded', function () { schedule(document); });
})();
</script>
${BLOCK_END}
`;

try {
  let master = read(masterPath);
  let single = read(singlePath);
  let productJs = read(productJsPath);
  const twilight = read(twilightPath);

  const requiredSettings = [
    'veloura_product_show_stock_radar_2026',
    'veloura_product_thumbnails_position_desktop_2026',
    'veloura_product_images_zoom_2026',
    'veloura_product_card_button_margin_x_2026'
  ];
  requiredSettings.forEach(id => {
    if (!twilight.includes(`"${id}"`)) throw new Error(`Theme setting was not found in twilight.json: ${id}`);
  });

  if (!single.includes('veloura-product-page') || !single.includes('veloura-product-related-products')) {
    throw new Error('Expected Veloura product page structure was not found in single.twig.');
  }
  if (!master.includes('veloura-qv-v35-grouped-actions-style-2026')) {
    throw new Error('V35 grouped product-card actions were not found. Install the supplied updates in order through V36 first.');
  }

  fs.mkdirSync(backupDir, { recursive: true });
  backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
  backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
  backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

  /* 1) Normalize all supported Salla setting return shapes. */
  single = single.replace(new RegExp(`\\s*${escapeRegExp(NORMALIZER_START)}\\s*`, 'g'), '\n');
  single = single.replace(new RegExp(`\\s*${escapeRegExp(NORMALIZER_END)}\\s*`, 'g'), '\n');

  const macroPattern = /\{% macro veloura_bool\(raw, fallback\) %\}[\s\S]*?\{% endmacro %\}\s*\{% macro veloura_select\(raw, fallback\) %\}[\s\S]*?\{% endmacro %\}/;
  if (!macroPattern.test(single)) throw new Error('Could not locate the product-setting normalizer macros in single.twig.');
  single = single.replace(macroPattern, normalizers);

  /* 2) Expose the resolved values for post-hydration synchronization. */
  if (!single.includes('data-veloura-v37-thumbs=')) {
    const rootNeedle = 'data-veloura-product-build="v20-marketing-related"';
    if (!single.includes(rootNeedle)) throw new Error('Could not locate the product-page root data attribute.');
    single = single.replace(
      rootNeedle,
      `${rootNeedle} data-veloura-v37-thumbs="{{ vpp_thumbnails_position }}" data-veloura-v37-stock-radar="{{ vpp_show_stock_radar ? 'pulse' : 'simple' }}" data-veloura-v37-images-zoom="{{ vpp_images_zoom ? 'true' : 'false' }}"`
    );
  }

  /* 3) The radar switch controls both the dot and its pulse, not only a subtle animation. */
  if (!single.includes(STOCK_START)) {
    const stockNeedle = '<span class="veloura-product-stock-radar__dot"></span>';
    if (!single.includes(stockNeedle)) throw new Error('Could not locate the stock-radar dot in single.twig.');
    single = single.replace(
      stockNeedle,
      `${STOCK_START}\n                        {% if vpp_show_stock_radar %}\n                            ${stockNeedle}\n                        {% endif %}\n                        ${STOCK_END}`
    );
  }

  /* 4) The new Veloura zoom switch must not depend on the obsolete global imageZoom switch. */
  if (!productJs.includes('Veloura V37 zoom source of truth')) {
    const zoomPattern = /const\s+velouraProductPage\s*=\s*document\.querySelector\(['"]\.veloura-product-page['"]\);\s*const\s+velouraZoomAllowed\s*=\s*!velouraProductPage\s*\|\|\s*velouraProductPage\.classList\.contains\(['"]veloura-product-zoom-enabled['"]\);\s*const\s+themeZoomEnabled\s*=\s*typeof\s+imageZoom\s*!==\s*['"]undefined['"]\s*&&\s*imageZoom;\s*if\s*\(themeZoomEnabled\s*&&\s*velouraZoomAllowed\)\s*\{/;
    if (!zoomPattern.test(productJs)) throw new Error('Could not locate the current product zoom gate in product.js.');
    productJs = productJs.replace(
      zoomPattern,
      `/* Veloura V37 zoom source of truth */ const velouraProductPage = document.querySelector('.veloura-product-page'); const velouraZoomControlled = Boolean(velouraProductPage && velouraProductPage.classList.contains('veloura-product-enabled')); const themeZoomEnabled = velouraZoomControlled ? velouraProductPage.classList.contains('veloura-product-zoom-enabled') : (typeof imageZoom !== 'undefined' && imageZoom); if (themeZoomEnabled) {`
    );
  }

  /* 5) Add the runtime/CSS layer after V36 and before head:end. */
  master = stripMarkedBlock(master, BLOCK_START, BLOCK_END);
  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) throw new Error('Could not find a safe head anchor in master.twig.');
  master = master.replace(anchor, block + '\n' + anchor);

  write(singlePath, single);
  write(productJsPath, productJs);
  write(masterPath, master);

  JSON.parse(twilight);
  console.log('twilight.json: OK');
  console.log('Quick View V37 installed correctly.');
  console.log('The three product-detail settings now accept every Salla value shape and reapply after slider hydration.');
  console.log('The mobile purchase bar now sits above page images, footer and related products.');
  console.log('Related-product cart and under-cart quick-view rows now use the exact card-edge horizontal slider value.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  const restoreMap = [
    [path.join(backupDir, 'src', 'views', 'layouts', 'master.twig'), masterPath],
    [path.join(backupDir, 'src', 'views', 'pages', 'product', 'single.twig'), singlePath],
    [path.join(backupDir, 'src', 'assets', 'js', 'product.js'), productJsPath]
  ];
  restoreMap.forEach(([from, to]) => {
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
  });
  console.error('Original files were restored when backups were available.');
  process.exit(1);
}
