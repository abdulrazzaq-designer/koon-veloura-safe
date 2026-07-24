const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v34-' + timestamp());

const BLOCK_START = '{# Veloura QV V34 two-zone true-zero spacing start #}';
const BLOCK_END = '{# Veloura QV V34 two-zone true-zero spacing end #}';
const STYLE_ID = 'veloura-qv-v34-two-zone-true-zero-style-2026';
const SCRIPT_ID = 'veloura-qv-v34-two-zone-true-zero-runtime-2026';

const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';
const V28_SCRIPT_ID = 'veloura-qv-v28-layout-bottom-spacing-2026';
const V28_VAR_START = '{# Veloura QV V28 bottom spacing start #}';
const V28_VAR_END = '{# Veloura QV V28 bottom spacing end #}';

const OLD_BLOCKS = [
  ['{# Veloura QV V29 card alignment layout fix start #}', '{# Veloura QV V29 card alignment layout fix end #}'],
  ['{# Veloura QV V30 absolute card spacing start #}', '{# Veloura QV V30 absolute card spacing end #}'],
  ['{# Veloura QV V31 linked absolute spacing start #}', '{# Veloura QV V31 linked absolute spacing end #}'],
  ['{# Veloura QV V32 shared actions bottom stack start #}', '{# Veloura QV V32 shared actions bottom stack end #}'],
  ['{# Veloura QV V33 safe cart and shared spacing start #}', '{# Veloura QV V33 safe cart and shared spacing end #}'],
  [BLOCK_START, BLOCK_END]
];

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

function backup(file) {
  const rel = path.relative(root, file);
  const target = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function restore() {
  for (const file of [masterPath, twilightPath]) {
    const source = path.join(backupDir, path.relative(root, file));
    if (fs.existsSync(source)) fs.copyFileSync(source, file);
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}

function stripScriptById(content, id) {
  const escaped = escapeRegExp(id);
  const re = new RegExp(`\\n?<script[^>]*id=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/script>\\n?`, 'g');
  return content.replace(re, '\n');
}

function removeSettingById(node, id) {
  let removed = 0;
  function walk(value) {
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const item = value[i];
        if (item && typeof item === 'object' && item.id === id && (item.type || item.format || item.label)) {
          value.splice(i, 1);
          removed++;
        } else {
          walk(item);
        }
      }
      return;
    }
    if (value && typeof value === 'object') Object.keys(value).forEach(key => walk(value[key]));
  }
  walk(node);
  return removed;
}

function insertAfterSetting(node, anchorId, setting) {
  let inserted = false;
  function walk(value) {
    if (inserted) return;
    if (Array.isArray(value)) {
      const index = value.findIndex(item => item && typeof item === 'object' && item.id === anchorId && (item.type || item.format || item.label));
      if (index !== -1) {
        value.splice(index + 1, 0, setting);
        inserted = true;
        return;
      }
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') Object.keys(value).forEach(key => walk(value[key]));
  }
  walk(node);
  return inserted;
}

function findSettingsById(node, id, results = []) {
  if (Array.isArray(node)) {
    node.forEach(item => findSettingsById(item, id, results));
    return results;
  }
  if (node && typeof node === 'object') {
    if (node.id === id && (node.type || node.format || node.label)) results.push(node);
    Object.keys(node).forEach(key => findSettingsById(node[key], id, results));
  }
  return results;
}

const conditions = [
  { id: 'veloura_product_card_panel_open_2026', operation: '=', value: true }
];

const horizontalSpacingSetting = {
  id: HORIZONTAL_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة يمين ويسار زري البطاقة',
  description: 'القيمة النهائية من حافة البطاقة نفسها لكلا الزرين. البداية 10px؛ وعند اختيار 0 يلتصق زر إضافة السلة وزر العرض السريع بحافتي البطاقة فعلياً.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '100',
  conditions
};

const bottomSpacingSetting = {
  id: BOTTOM_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة أسفل زري البطاقة',
  description: 'القيمة نفسها بين إضافة السلة والعرض السريع، وكذلك أسفل آخر زر حتى حافة البطاقة. البداية 10px؛ و0 يعني التصاقاً حقيقياً بين الزرين وبالحافة السفلية.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '100',
  conditions
};

const block = `
${BLOCK_START}
{# V34: saved slider values are final distances from the PRODUCT CARD edge, not additions to native padding. #}
{% set v34_margin_x_raw = theme.settings.get('${HORIZONTAL_SETTING_ID}', 10) %}
{% if v34_margin_x_raw.value is defined %}
  {% set v34_margin_x_raw = v34_margin_x_raw.value %}
{% elseif v34_margin_x_raw.selected is defined %}
  {% if v34_margin_x_raw.selected.value is defined %}
    {% set v34_margin_x_raw = v34_margin_x_raw.selected.value %}
  {% elseif v34_margin_x_raw.selected is iterable and v34_margin_x_raw.selected[0] is defined and v34_margin_x_raw.selected[0].value is defined %}
    {% set v34_margin_x_raw = v34_margin_x_raw.selected[0].value %}
  {% else %}
    {% set v34_margin_x_raw = v34_margin_x_raw.selected %}
  {% endif %}
{% endif %}
{% set v34_margin_x = v34_margin_x_raw + 0 %}
{% if v34_margin_x < 0 %}{% set v34_margin_x = 0 %}{% endif %}
{% if v34_margin_x > 100 %}{% set v34_margin_x = 100 %}{% endif %}

{% set v34_margin_bottom_raw = theme.settings.get('${BOTTOM_SETTING_ID}', 10) %}
{% if v34_margin_bottom_raw.value is defined %}
  {% set v34_margin_bottom_raw = v34_margin_bottom_raw.value %}
{% elseif v34_margin_bottom_raw.selected is defined %}
  {% if v34_margin_bottom_raw.selected.value is defined %}
    {% set v34_margin_bottom_raw = v34_margin_bottom_raw.selected.value %}
  {% elseif v34_margin_bottom_raw.selected is iterable and v34_margin_bottom_raw.selected[0] is defined and v34_margin_bottom_raw.selected[0].value is defined %}
    {% set v34_margin_bottom_raw = v34_margin_bottom_raw.selected[0].value %}
  {% else %}
    {% set v34_margin_bottom_raw = v34_margin_bottom_raw.selected %}
  {% endif %}
{% endif %}
{% set v34_margin_bottom = v34_margin_bottom_raw + 0 %}
{% if v34_margin_bottom < 0 %}{% set v34_margin_bottom = 0 %}{% endif %}
{% if v34_margin_bottom > 100 %}{% set v34_margin_bottom = 100 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v34-action-x: {{ v34_margin_x }}px;
    --veloura-v34-action-bottom: {{ v34_margin_bottom }}px;
  }

  /* Host + entry consume the complete equal-height grid/slide cell. */
  html body.veloura-product-card-enabled salla-product-card.veloura-v34-card-host,
  html body.veloura-product-card-enabled product-card.veloura-v34-card-host,
  html body.veloura-product-card-enabled custom-salla-product-card.veloura-v34-card-host,
  html body.veloura-product-card-enabled .veloura-v34-card-host {
    display: block !important;
    align-self: stretch !important;
    height: 100% !important;
    min-height: 100% !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card {
    display: flex !important;
    flex-direction: column !important;
    align-self: stretch !important;
    height: 100% !important;
    min-height: 100% !important;
    box-sizing: border-box !important;
  }

  /* Upper zone: product image + title + optional subtitle. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-image,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-image-full,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-content-main {
    flex: 0 0 auto !important;
  }

  /* The content is the bridge between upper and lower zones. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-content.veloura-v34-content {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    align-self: stretch !important;
    width: 100% !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    gap: 0 !important;
    row-gap: 0 !important;
    column-gap: 0 !important;
  }

  /* First visible lower-zone item receives the flexible space above it. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-v34-bottom-item {
    flex: 0 0 auto !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-v34-bottom-anchor {
    margin-top: auto !important;
  }

  /* Footer and under-cart quick view use the same exact card-edge calculation. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-v34-action-row {
    position: relative !important;
    display: flex !important;
    flex: 0 0 auto !important;
    align-items: stretch !important;
    justify-content: center !important;
    width: calc(
      100%
      + var(--veloura-v34-native-left, 0px)
      + var(--veloura-v34-native-right, 0px)
      - (var(--veloura-v34-action-x) * 2)
    ) !important;
    max-width: none !important;
    min-width: 0 !important;
    margin-left: calc(var(--veloura-v34-action-x) - var(--veloura-v34-native-left, 0px)) !important;
    margin-right: calc(var(--veloura-v34-action-x) - var(--veloura-v34-native-right, 0px)) !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    text-align: center !important;
    direction: rtl !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Slider value below cart = exact gap before quick view. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card.veloura-v34-has-qv .s-product-card-content-footer.veloura-v34-action-row {
    margin-top: 0 !important;
    margin-bottom: var(--veloura-v34-action-bottom) !important;
  }

  /* If quick view is absent, footer itself is the last action and cancels native bottom padding. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card:not(.veloura-v34-has-qv) .s-product-card-content-footer.veloura-v34-action-row {
    margin-bottom: calc(var(--veloura-v34-action-bottom) - var(--veloura-v34-native-bottom, 0px)) !important;
  }

  /* Quick view is the last action when present: exact bottom distance from the card edge. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-quick-view-under-cart-wrap.veloura-v34-action-row {
    order: initial !important;
    clear: both !important;
    margin-top: 0 !important;
    margin-bottom: calc(var(--veloura-v34-action-bottom) - var(--veloura-v34-native-bottom, 0px)) !important;
    z-index: 2 !important;
  }

  /* Both actual controls fill their identical rows; native Salla cart DOM stays untouched/clickable. */
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-content-footer.veloura-v34-action-row > *,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .s-product-card-content-footer.veloura-v34-action-row salla-add-product-button,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-quick-view-under-cart-wrap.veloura-v34-action-row > *,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-quick-view-under-cart-wrap.veloura-v34-action-row .veloura-quick-view-btn,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-quick-view-under-cart-wrap.veloura-v34-action-row button,
  html body.veloura-product-card-enabled .s-product-card-entry.veloura-v34-card .veloura-quick-view-under-cart-wrap.veloura-v34-action-row a {
    display: flex !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Text alignment affects only title/subtitle/price, never action rows. */
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-main,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-title,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-title a,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-subtitle,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-sub,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-content-price,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-price,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-sale-price,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .s-product-card-regular-price {
    width: 100% !important;
    text-align: right !important;
    justify-content: flex-start !important;
    align-items: flex-start !important;
    direction: rtl !important;
  }

  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .veloura-v34-action-row,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry.veloura-v34-card .veloura-v34-action-row * {
    text-align: center !important;
    justify-content: center !important;
    direction: rtl !important;
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var STYLE_ID = '${STYLE_ID}';
  var CARD_SELECTOR = '.s-product-card-entry';
  var HOST_SELECTOR = 'salla-product-card, product-card, custom-salla-product-card';
  var scheduled = false;
  var headObserver = null;

  function number(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function visible(element) {
    if (!element || element.hidden) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(element) : null;
    return !style || (style.display !== 'none' && style.visibility !== 'hidden');
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

  function clearLegacyV32(card) {
    if (!card || !card.querySelector) return;

    var stack = Array.prototype.find.call(card.children || [], function (child) {
      return child.classList && child.classList.contains('veloura-v32-card-actions-stack');
    });
    var content = card.querySelector('.s-product-card-content');
    var footer = card.querySelector('.s-product-card-content-footer');
    var quickView = card.querySelector('.veloura-quick-view-under-cart-wrap');

    if (stack && content) {
      if (footer && footer.parentNode === stack) content.appendChild(footer);
      if (quickView && quickView.parentNode === stack) content.appendChild(quickView);
      if (footer && quickView && footer.nextSibling !== quickView) content.insertBefore(quickView, footer.nextSibling);
      stack.remove();
    }

    card.classList.remove('veloura-v32-card-layout');
    var host = card.closest && card.closest(HOST_SELECTOR);
    if (host) host.classList.remove('veloura-v32-product-host');

    card.querySelectorAll('.veloura-v32-action-row, .veloura-v32-cart-wide, .veloura-v32-qv-wide').forEach(function (element) {
      var cartWide = element.classList.contains('veloura-v32-cart-wide');
      element.classList.remove('veloura-v32-action-row', 'veloura-v32-cart-wide', 'veloura-v32-qv-wide');
      if (cartWide && element.tagName && element.tagName.toLowerCase() === 'salla-add-product-button') {
        element.removeAttribute('width');
      }
    });
  }

  function rowMetrics(card, row) {
    if (!card || !row || !row.parentElement || !window.getComputedStyle) return;

    var parent = row.parentElement;
    var cardRect = card.getBoundingClientRect();
    var parentRect = parent.getBoundingClientRect();
    var parentStyle = window.getComputedStyle(parent);

    var left = Math.max(0,
      (parentRect.left - cardRect.left)
      + number(parentStyle.borderLeftWidth)
      + number(parentStyle.paddingLeft)
    );
    var right = Math.max(0,
      (cardRect.right - parentRect.right)
      + number(parentStyle.borderRightWidth)
      + number(parentStyle.paddingRight)
    );
    var bottom = Math.max(0,
      (cardRect.bottom - parentRect.bottom)
      + number(parentStyle.borderBottomWidth)
      + number(parentStyle.paddingBottom)
    );

    row.style.setProperty('--veloura-v34-native-left', left.toFixed(3) + 'px');
    row.style.setProperty('--veloura-v34-native-right', right.toFixed(3) + 'px');
    row.style.setProperty('--veloura-v34-native-bottom', bottom.toFixed(3) + 'px');
  }

  function syncCard(card) {
    if (!card || !card.querySelector) return;

    clearLegacyV32(card);

    var host = card.closest && card.closest(HOST_SELECTOR);
    var content = card.querySelector('.s-product-card-content');
    var main = card.querySelector('.s-product-card-content-main');
    var price = card.querySelector('.s-product-card-content-sub, .s-product-card-content-price, .s-product-card-price');
    var footer = card.querySelector('.s-product-card-content-footer');
    var quickView = card.querySelector('.veloura-quick-view-under-cart-wrap');

    card.classList.add('veloura-v34-card');
    if (host) host.classList.add('veloura-v34-card-host');
    if (content) content.classList.add('veloura-v34-content');
    if (main) main.classList.add('veloura-v34-upper-text');

    [price, footer, quickView].forEach(function (element) {
      if (!element) return;
      element.classList.add('veloura-v34-bottom-item');
      element.classList.remove('veloura-v34-bottom-anchor');
    });

    [footer, quickView].forEach(function (element) {
      if (!element) return;
      element.classList.add('veloura-v34-action-row');
    });

    var lower = [price, footer, quickView].filter(visible);
    if (lower.length) lower[0].classList.add('veloura-v34-bottom-anchor');

    var hasQuickView = visible(quickView);
    card.classList.toggle('veloura-v34-has-qv', hasQuickView);

    if (footer) rowMetrics(card, footer);
    if (quickView) rowMetrics(card, quickView);
  }

  function collect(scope) {
    var cards = [];
    if (scope && scope.matches && scope.matches(CARD_SELECTOR)) cards.push(scope);
    if (scope && scope.querySelectorAll) {
      scope.querySelectorAll(CARD_SELECTOR).forEach(function (card) { cards.push(card); });
    }
    return cards;
  }

  function sync(scope) {
    ensureStyleLast();
    observeHead();
    collect(scope || document).forEach(syncCard);
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
    [80, 220, 600, 1200, 2500].forEach(function (delay) {
      window.setTimeout(function () { sync(document); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  if (window.MutationObserver) {
    var bodyObserver = new MutationObserver(function (mutations) {
      var scope = document;
      for (var i = 0; i < mutations.length; i++) {
        var target = mutations[i].target;
        if (target && target.closest) {
          scope = target.closest(CARD_SELECTOR) || document;
          if (scope !== document) break;
        }
      }
      schedule(scope);
    });

    if (document.body) bodyObserver.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener('DOMContentLoaded', function () {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    });
  }

  window.addEventListener('resize', function () { schedule(document); }, { passive: true });
  document.addEventListener('theme::ready', function () { schedule(document); });
  document.addEventListener('salla::product.cards::loaded', function () { schedule(document); });
})();
</script>
${BLOCK_END}
`;

try {
  JSON.parse(read(twilightPath));
  fs.mkdirSync(backupDir, { recursive: true });
  [masterPath, twilightPath].forEach(backup);

  const data = JSON.parse(read(twilightPath));

  removeSettingById(data, OLD_QV_BOTTOM_SETTING_ID);
  removeSettingById(data, HORIZONTAL_SETTING_ID);
  removeSettingById(data, BOTTOM_SETTING_ID);

  if (!insertAfterSetting(data, 'veloura_product_card_button_text_color_2026', horizontalSpacingSetting)) {
    throw new Error('Could not find veloura_product_card_button_text_color_2026 in twilight.json.');
  }
  if (!insertAfterSetting(data, HORIZONTAL_SETTING_ID, bottomSpacingSetting)) {
    throw new Error(`Could not insert ${BOTTOM_SETTING_ID} after ${HORIZONTAL_SETTING_ID}.`);
  }

  const horizontalSettings = findSettingsById(data, HORIZONTAL_SETTING_ID);
  const bottomSettings = findSettingsById(data, BOTTOM_SETTING_ID);
  const oldBottomSettings = findSettingsById(data, OLD_QV_BOTTOM_SETTING_ID);

  if (horizontalSettings.length !== 1) throw new Error(`Invalid ${HORIZONTAL_SETTING_ID} count: ${horizontalSettings.length}`);
  if (bottomSettings.length !== 1) throw new Error(`Invalid ${BOTTOM_SETTING_ID} count: ${bottomSettings.length}`);
  if (oldBottomSettings.length !== 0) throw new Error(`Old quick-view-only bottom setting still exists: ${oldBottomSettings.length}`);
  if (String(horizontalSettings[0].value) !== '10' || String(horizontalSettings[0].default) !== '10') {
    throw new Error(`${HORIZONTAL_SETTING_ID} must start at 10.`);
  }
  if (String(bottomSettings[0].value) !== '10' || String(bottomSettings[0].default) !== '10') {
    throw new Error(`${BOTTOM_SETTING_ID} must start at 10.`);
  }

  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  for (const [start, end] of OLD_BLOCKS) master = stripMarkedBlock(master, start, end);

  master = stripScriptById(master, V28_SCRIPT_ID);
  master = stripMarkedBlock(master, V28_VAR_START, V28_VAR_END);
  master = master.replace(/^\s*--veloura-quick-view-button-margin-bottom:\s*\{\{\s*vqv_button_margin_bottom\s*\}\}px;\s*$/gm, '');

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');

  master = master.replace(anchor, block + '\n' + anchor);
  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V34 installed correctly.');
  console.log('Horizontal and bottom sliders start at 10px; saved 0 is a true card-edge 0px.');
  console.log('Cart and under-cart quick view share one measured card-edge width without moving Salla cart DOM.');
  console.log('Cards now use upper and lower zones; all missing-item space stays only in the middle.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
