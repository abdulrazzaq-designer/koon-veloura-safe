const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v39-' + timestamp());

const V37_START = '{# Veloura QV V37 product details, sticky layer and related-card width fix start #}';
const V37_END = '{# Veloura QV V37 product details, sticky layer and related-card width fix end #}';
const V38_START = '{# Veloura QV V38 product page performance hotfix start #}';
const V38_END = '{# Veloura QV V38 product page performance hotfix end #}';
const V39_START = '{# Veloura QV V39 product page final fixes start #}';
const V39_END = '{# Veloura QV V39 product page final fixes end #}';
const NORMALIZER_START = '{# Veloura Product Settings Normalizers V37 start #}';
const NORMALIZER_END = '{# Veloura Product Settings Normalizers V37 end #}';
const STYLE_ID = 'veloura-qv-v39-product-page-final-style-2026';
const SCRIPT_ID = 'veloura-qv-v39-product-page-final-runtime-2026';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}
function replaceMarkedBlock(content, start, end, replacement) {
  const re = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!re.test(content)) fail(`Required marked block was not found: ${start}`);
  return content.replace(re, replacement);
}
function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) fail(`Could not locate ${label}.`);
  return content.replace(pattern, replacement);
}
function backup(file, relativeName) {
  const destination = path.join(backupDir, relativeName);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

const normalizers = `${NORMALIZER_START}
    {% macro veloura_bool(raw, fallback) %}
      {# Saved selection must win over the schema/default value. #}
      {% if raw.selected is defined %}
        {% if raw.selected.value is defined %}
          {% set raw = raw.selected.value %}
        {% elseif raw.selected is iterable and raw.selected[0] is defined and raw.selected[0].value is defined %}
          {% set raw = raw.selected[0].value %}
        {% elseif raw.selected is iterable and raw.selected[0] is defined %}
          {% set raw = raw.selected[0] %}
        {% else %}
          {% set raw = raw.selected %}
        {% endif %}
      {% elseif raw.value is defined %}
        {% if raw.value.value is defined %}
          {% set raw = raw.value.value %}
        {% elseif raw.value is iterable and raw.value[0] is defined and raw.value[0].value is defined %}
          {% set raw = raw.value[0].value %}
        {% else %}
          {% set raw = raw.value %}
        {% endif %}
      {% elseif raw is iterable and raw[0] is defined and raw[0].value is defined %}
        {% set raw = raw[0].value %}
      {% elseif raw is iterable and raw[0] is defined %}
        {% set raw = raw[0] %}
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
        {% elseif raw.selected or raw.selected == 0 or raw.selected == '0' %}
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
        {% elseif raw.value or raw.value == 0 or raw.value == '0' %}
          {{ raw.value }}
        {% else %}
          {{ fallback }}
        {% endif %}
      {% elseif raw is iterable and raw[0] is defined and raw[0].value is defined %}
        {{ raw[0].value }}
      {% elseif raw is iterable and raw[0] is defined %}
        {{ raw[0] }}
      {% elseif raw or raw == 0 or raw == '0' %}
        {{ raw }}
      {% else %}
        {{ fallback }}
      {% endif %}
    {% endmacro %}
${NORMALIZER_END}`;

const block = `
${V39_START}
{# V39: exact related-card action width, visible stock pulse, corrected mobile stacking, and event-driven runtime only. #}
<style id="${STYLE_ID}">
  /* Visible pulse: the dot contracts while a separate ring expands. */
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"]
  .veloura-product-stock-radar.is-pulse
  .veloura-product-stock-radar__dot {
    position: relative !important;
    display: inline-block !important;
    overflow: visible !important;
    animation: veloura-v39-stock-dot 1.15s ease-in-out infinite !important;
    transform-origin: center !important;
    will-change: transform, box-shadow !important;
  }
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"]
  .veloura-product-stock-radar.is-pulse
  .veloura-product-stock-radar__dot::after {
    content: "" !important;
    position: absolute !important;
    inset: -2px !important;
    border: 2px solid currentColor !important;
    border-radius: 999px !important;
    pointer-events: none !important;
    animation: veloura-v39-stock-ring 1.15s ease-out infinite !important;
    will-change: transform, opacity !important;
  }
  .veloura-product-page[data-veloura-v37-stock-radar="simple"] .veloura-product-stock-radar__dot,
  .veloura-product-page .veloura-product-stock-radar.is-simple .veloura-product-stock-radar__dot {
    display: none !important;
    animation: none !important;
    box-shadow: none !important;
  }
  @keyframes veloura-v39-stock-dot {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
    50% { transform: scale(.72); box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent); }
  }
  @keyframes veloura-v39-stock-ring {
    0% { transform: scale(.72); opacity: .72; }
    82%, 100% { transform: scale(2.75); opacity: 0; }
  }

  /* Products you may like: every action row is measured from the visible card edge. */
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v39-related-card,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-overflow {
    overflow: visible !important;
    max-width: none !important;
    contain: none !important;
    clip-path: none !important;
  }
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v39-related-card
  .veloura-v39-related-action {
    position: relative !important;
    display: block !important;
    box-sizing: border-box !important;
    padding-inline: 0 !important;
    margin-inline: 0 !important;
    max-width: none !important;
    min-width: 0 !important;
    overflow: visible !important;
    pointer-events: auto !important;
  }
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > salla-add-product-button,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > salla-add-product-button .s-add-product-button-main,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > salla-add-product-button .s-button-element,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > salla-add-product-button .s-button-btn,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > salla-add-product-button button,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > .veloura-quick-view-btn,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .veloura-v39-related-action > * {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* The purchase bar is the top page layer, while menus/dialogs remain above it. */
  @media (max-width: 640px) {
    html body.veloura-is-product-page .veloura-v39-sticky-ancestor {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
      contain: none !important;
      isolation: auto !important;
      z-index: auto !important;
      mix-blend-mode: normal !important;
      clip-path: none !important;
      overflow: visible !important;
    }
    html body.veloura-is-product-page.veloura-product-sticky-active
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      width: 100% !important;
      max-width: none !important;
      z-index: 2147483000 !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      transform: translateZ(0) !important;
    }
    #mobile-menu,
    .mm-menu,
    .mm-wrapper__blocker,
    .mm-page__blocker,
    salla-sidebar,
    salla-modal,
    .s-modal-wrapper,
    [role="dialog"] {
      z-index: 2147483600 !important;
    }
  }

  @media (hover: none), (pointer: coarse) {
    .veloura-product-page salla-slider.details-slider,
    .veloura-product-page salla-slider.details-slider .swiper,
    .veloura-product-page salla-slider.details-slider .swiper-wrapper,
    .veloura-product-page salla-slider.details-slider img {
      touch-action: pan-y pinch-zoom !important;
    }
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var RELATED_SELECTOR = '.veloura-product-related-products .s-product-card-entry';
  var ACTION_SELECTOR = '.s-product-card-content-footer, .veloura-quick-view-under-cart-wrap';
  var frame = 0;
  var resizeTimer = 0;
  var relatedObserver = null;

  function toNumber(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function readHorizontalValue(card) {
    if (!window.getComputedStyle) return 0;
    var cardStyle = window.getComputedStyle(card);
    var cardRaw = cardStyle.getPropertyValue('--veloura-v35-action-x').trim();
    if (cardRaw !== '') return Math.max(0, toNumber(cardRaw));
    var rootRaw = window.getComputedStyle(document.documentElement).getPropertyValue('--veloura-v35-action-x').trim();
    return Math.max(0, toNumber(rootRaw));
  }

  function exposePath(row, card) {
    var current = row.parentElement;
    while (current && current !== card) {
      current.classList.add('veloura-v39-related-overflow');
      current = current.parentElement;
    }
  }

  function makeNativeButtonWide(row) {
    row.querySelectorAll('salla-add-product-button').forEach(function (button) {
      button.setAttribute('width', 'wide');
      try { button.width = 'wide'; } catch (error) {}
      button.style.setProperty('display', 'block', 'important');
      button.style.setProperty('width', '100%', 'important');
      button.style.setProperty('max-width', '100%', 'important');
    });
  }

  function syncRelatedAction(card, row) {
    if (!card || !row || !window.getComputedStyle) return;

    exposePath(row, card);
    makeNativeButtonWide(row);

    card.classList.add('veloura-v39-related-card');
    card.classList.remove('veloura-v37-related-card', 'veloura-v38-related-card');
    row.classList.add('veloura-v39-related-action');
    row.classList.remove('veloura-v37-related-action', 'veloura-v38-related-action');

    ['transform', 'width', 'max-width', 'min-width', 'margin-left', 'margin-right', 'left', 'right', 'inset-inline', 'align-self'].forEach(function (name) {
      row.style.removeProperty(name);
    });

    var cardRect = card.getBoundingClientRect();
    if (cardRect.width <= 1) return;
    var x = readHorizontalValue(card);
    var targetWidth = Math.max(0, cardRect.width - (x * 2));
    var widthValue = targetWidth.toFixed(3) + 'px';

    row.style.setProperty('position', 'relative', 'important');
    row.style.setProperty('width', widthValue, 'important');
    row.style.setProperty('max-width', widthValue, 'important');
    row.style.setProperty('min-width', '0px', 'important');
    row.style.setProperty('margin-left', '0px', 'important');
    row.style.setProperty('margin-right', '0px', 'important');
    row.style.setProperty('align-self', 'flex-start', 'important');
    row.style.setProperty('transform', 'none', 'important');

    var rowRect = row.getBoundingClientRect();
    var desiredLeft = cardRect.left + x;
    var delta = desiredLeft - rowRect.left;
    row.style.setProperty('transform', 'translate3d(' + delta.toFixed(3) + 'px,0,0)', 'important');
  }

  function syncRelated(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var cards = [];
    if (root.matches && root.matches(RELATED_SELECTOR)) cards.push(root);
    root.querySelectorAll(RELATED_SELECTOR).forEach(function (card) { cards.push(card); });
    cards.forEach(function (card) {
      card.querySelectorAll(ACTION_SELECTOR).forEach(function (row) {
        syncRelatedAction(card, row);
      });
    });
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
      try { if (slider.thumbsPosition !== position) slider.thumbsPosition = position; } catch (error) {}
    }

    var pulse = page.getAttribute('data-veloura-v37-stock-radar') === 'pulse';
    page.querySelectorAll('.veloura-product-stock-radar').forEach(function (radar) {
      radar.classList.toggle('is-pulse', pulse);
      radar.classList.toggle('is-simple', !pulse);
    });
  }

  function prepareStickyBar() {
    var bar = document.querySelector('.veloura-product-sticky-bar');
    if (!bar) return;
    var parent = bar.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      parent.classList.add('veloura-v39-sticky-ancestor');
      parent = parent.parentElement;
    }
  }

  function observeRelatedProducts() {
    if (relatedObserver || !window.MutationObserver) return;
    var related = document.querySelector('.veloura-product-related-products');
    if (!related) return;
    relatedObserver = new MutationObserver(function (mutations) {
      var added = mutations.some(function (mutation) {
        return mutation.addedNodes && mutation.addedNodes.length;
      });
      if (added) schedule(related);
    });
    relatedObserver.observe(related, { childList: true, subtree: true });
  }

  function sync(scope) {
    syncProductSettings();
    prepareStickyBar();
    syncRelated(scope || document);
    observeRelatedProducts();
  }

  function schedule(scope) {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      sync(scope || document);
    });
  }

  function run() {
    sync(document);
    if (window.customElements && typeof window.customElements.whenDefined === 'function') {
      window.customElements.whenDefined('salla-slider').then(function () { schedule(document); }).catch(function () {});
      window.customElements.whenDefined('salla-add-product-button').then(function () { schedule(document); }).catch(function () {});
    }
    [120, 500, 1400, 2600].forEach(function (delay) {
      window.setTimeout(function () { schedule(document); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () { schedule(document); }, 180);
  }, { passive: true });
  window.addEventListener('orientationchange', function () {
    window.setTimeout(function () { schedule(document); }, 250);
  }, { passive: true });
  document.addEventListener('theme::ready', function () { schedule(document); });
  document.addEventListener('salla::product.cards::loaded', function () { schedule(document); });
  document.addEventListener('salla::products::loaded', function () { schedule(document); });
})();
</script>
${V39_END}
`;

try {
  let master = read(masterPath);
  let single = read(singlePath);
  const twilight = read(twilightPath);
  const settings = JSON.parse(twilight);
  void settings;

  const requiredIds = [
    'veloura_product_coupon_enabled_2026',
    'veloura_product_coupon_title_2026',
    'veloura_product_coupon_subtitle_2026',
    'veloura_product_coupon_code_2026',
    'veloura_product_purchase_count_condition_enabled_2026',
    'veloura_product_purchase_count_min_2026',
    'veloura_product_show_stock_radar_2026',
    'veloura_product_mobile_sticky_cart_2026'
  ];
  requiredIds.forEach(id => {
    if (!twilight.includes(`"id": "${id}"`) && !twilight.includes(`"id":"${id}"`)) {
      fail(`Missing theme setting: ${id}`);
    }
  });
  if (!single.includes('data-veloura-v37-thumbs=') || !single.includes('veloura-product-sticky-bar')) {
    fail('V37 product-page structure was not found. Install V37 and V38 first.');
  }

  fs.mkdirSync(backupDir, { recursive: true });
  backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
  backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
  backup(twilightPath, 'twilight.json');

  single = replaceMarkedBlock(single, NORMALIZER_START, NORMALIZER_END, normalizers);

  if (!single.includes("vpp_coupon_title = _self.veloura_select")) {
    single = replaceRequired(
      single,
      /\{% set vpp_coupon_enabled =[\s\S]*?\{% set vpp_coupon_code = vpp_coupon_code_raw\|default\(''\)\|trim %\}/,
      `{% set vpp_coupon_enabled = _self.veloura_bool(theme.settings.get('veloura_product_coupon_enabled_2026', false), false)|trim == 'true' %}\n    {% set vpp_coupon_title = _self.veloura_select(theme.settings.get('veloura_product_coupon_title_2026', 'خصم إضافي 10%'), 'خصم إضافي 10%')|trim %}\n    {% set vpp_coupon_subtitle = _self.veloura_select(theme.settings.get('veloura_product_coupon_subtitle_2026', 'انسخ الكود واحصل على خصم إضافي عند الدفع'), 'انسخ الكود واحصل على خصم إضافي عند الدفع')|trim %}\n    {% set vpp_coupon_code = _self.veloura_select(theme.settings.get('veloura_product_coupon_code_2026', ''), '')|trim %}`,
      'the coupon settings block'
    );
  }

  if (!single.includes('vpp_purchase_count_min_raw = _self.veloura_select')) {
    single = replaceRequired(
      single,
      /\{% set vpp_purchase_count_enabled =[\s\S]*?\{% set vpp_purchase_count_animated =[^\n]*%\}/,
      `{% set vpp_purchase_count_enabled = _self.veloura_bool(theme.settings.get('veloura_product_purchase_count_condition_enabled_2026', false), false)|trim == 'true' %}\n    {% set vpp_purchase_count_min_raw = _self.veloura_select(theme.settings.get('veloura_product_purchase_count_min_2026', 10), 10)|trim %}\n    {% set vpp_purchase_count_min = vpp_purchase_count_min_raw + 0 %}\n    {% set vpp_purchase_count_animated = _self.veloura_bool(theme.settings.get('veloura_product_purchase_count_animated_2026', true), true)|trim == 'true' %}`,
      'the purchase-count settings block'
    );
  }

  if (!single.includes('(product.sold_quantity|default(0)) + 0')) {
    single = replaceRequired(
      single,
      /\{% set vpp_purchase_count_value = product\.sold_quantity\|default\(0\) %\}\s*\{% set vpp_purchase_count_min_value = vpp_purchase_count_min\|default\(0\) %\}/,
      `{% set vpp_purchase_count_value = (product.sold_quantity|default(0)) + 0 %}\n                {% set vpp_purchase_count_min_value = (vpp_purchase_count_min|default(0)) + 0 %}`,
      'the purchase-count numeric comparison'
    );
  }

  master = stripMarkedBlock(master, V37_START, V37_END);
  master = stripMarkedBlock(master, V38_START, V38_END);
  master = stripMarkedBlock(master, V39_START, V39_END);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) fail('Could not find a safe head anchor in master.twig.');
  master = master.replace(anchor, block + '\n' + anchor);

  write(masterPath, master);
  write(singlePath, single);

  console.log('twilight.json: OK');
  console.log('Quick View V39 installed correctly.');
  console.log('Related-product add-to-cart now uses the exact card-edge horizontal slider and the native wide Salla button.');
  console.log('Availability now has a visible dot-and-ring pulse.');
  console.log('The mobile purchase bar is above page content while the category menu remains above the bar.');
  console.log('Coupon and purchase-count settings now read saved selections before schema defaults.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  const restoreMap = [
    [path.join(backupDir, 'src', 'views', 'layouts', 'master.twig'), masterPath],
    [path.join(backupDir, 'src', 'views', 'pages', 'product', 'single.twig'), singlePath],
    [path.join(backupDir, 'twilight.json'), twilightPath]
  ];
  restoreMap.forEach(([from, to]) => {
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
  });
  console.error('Original files were restored when backups were available.');
  process.exit(1);
}
