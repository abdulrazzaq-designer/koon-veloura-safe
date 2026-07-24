const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v32-' + timestamp());

const STYLE_ID = 'veloura-qv-v32-shared-actions-bottom-stack-2026';
const SCRIPT_ID = 'veloura-qv-v32-card-layout-runtime-2026';
const BLOCK_START = '{# Veloura QV V32 shared actions bottom stack start #}';
const BLOCK_END = '{# Veloura QV V32 shared actions bottom stack end #}';

const OLD_BLOCKS = [
  ['{# Veloura QV V29 card alignment layout fix start #}', '{# Veloura QV V29 card alignment layout fix end #}'],
  ['{# Veloura QV V30 absolute card spacing start #}', '{# Veloura QV V30 absolute card spacing end #}'],
  ['{# Veloura QV V31 linked absolute spacing start #}', '{# Veloura QV V31 linked absolute spacing end #}'],
  [BLOCK_START, BLOCK_END]
];

const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

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

const basePanelCondition = [
  { id: 'veloura_product_card_panel_open_2026', operation: '=', value: true }
];

const horizontalSpacingSetting = {
  id: HORIZONTAL_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة يمين ويسار زري البطاقة',
  description: 'القيمة النهائية بالبكسل للزرين معاً. 0 يلصق أضف للسلة والعرض السريع بحافتي البطاقة، و50 يضع 50px يميناً و50px يساراً لكليهما.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '100',
  conditions: basePanelCondition
};

const bottomSpacingSetting = {
  id: BOTTOM_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة أسفل زري البطاقة',
  description: 'القيمة النهائية بالبكسل للزرين معاً. تطبق أسفل أضف للسلة وأسفل العرض السريع؛ 0 يعني التصاقاً فعلياً بلا مسافة مخفية.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '100',
  conditions: basePanelCondition
};

const twigAndCssBlock = `
${BLOCK_START}
{# V32: both sliders are absolute. Their default is 10px; a saved zero remains a real zero. #}
{% set v32_center_text_raw = theme.settings.get('veloura_product_card_center_text_2026', false) %}
{% if v32_center_text_raw.value is defined %}
  {% set v32_center_text_raw = v32_center_text_raw.value %}
{% elseif v32_center_text_raw.selected is defined %}
  {% if v32_center_text_raw.selected.value is defined %}
    {% set v32_center_text_raw = v32_center_text_raw.selected.value %}
  {% elseif v32_center_text_raw.selected is iterable and v32_center_text_raw.selected[0] is defined and v32_center_text_raw.selected[0].value is defined %}
    {% set v32_center_text_raw = v32_center_text_raw.selected[0].value %}
  {% else %}
    {% set v32_center_text_raw = v32_center_text_raw.selected %}
  {% endif %}
{% endif %}
{% set v32_center_text = v32_center_text_raw == true or v32_center_text_raw == 'true' or v32_center_text_raw == 1 or v32_center_text_raw == '1' or v32_center_text_raw == 'on' %}

{% set v32_button_margin_x_raw = theme.settings.get('veloura_product_card_button_margin_x_2026', 10) %}
{% if v32_button_margin_x_raw.value is defined %}
  {% set v32_button_margin_x_raw = v32_button_margin_x_raw.value %}
{% elseif v32_button_margin_x_raw.selected is defined %}
  {% if v32_button_margin_x_raw.selected.value is defined %}
    {% set v32_button_margin_x_raw = v32_button_margin_x_raw.selected.value %}
  {% elseif v32_button_margin_x_raw.selected is iterable and v32_button_margin_x_raw.selected[0] is defined and v32_button_margin_x_raw.selected[0].value is defined %}
    {% set v32_button_margin_x_raw = v32_button_margin_x_raw.selected[0].value %}
  {% else %}
    {% set v32_button_margin_x_raw = v32_button_margin_x_raw.selected %}
  {% endif %}
{% endif %}
{% set v32_button_margin_x = v32_button_margin_x_raw + 0 %}
{% if v32_button_margin_x < 0 %}{% set v32_button_margin_x = 0 %}{% endif %}
{% if v32_button_margin_x > 100 %}{% set v32_button_margin_x = 100 %}{% endif %}

{% set v32_button_bottom_space_raw = theme.settings.get('veloura_product_card_button_margin_bottom_2026', 10) %}
{% if v32_button_bottom_space_raw.value is defined %}
  {% set v32_button_bottom_space_raw = v32_button_bottom_space_raw.value %}
{% elseif v32_button_bottom_space_raw.selected is defined %}
  {% if v32_button_bottom_space_raw.selected.value is defined %}
    {% set v32_button_bottom_space_raw = v32_button_bottom_space_raw.selected.value %}
  {% elseif v32_button_bottom_space_raw.selected is iterable and v32_button_bottom_space_raw.selected[0] is defined and v32_button_bottom_space_raw.selected[0].value is defined %}
    {% set v32_button_bottom_space_raw = v32_button_bottom_space_raw.selected[0].value %}
  {% else %}
    {% set v32_button_bottom_space_raw = v32_button_bottom_space_raw.selected %}
  {% endif %}
{% endif %}
{% set v32_button_bottom_space = v32_button_bottom_space_raw + 0 %}
{% if v32_button_bottom_space < 0 %}{% set v32_button_bottom_space = 0 %}{% endif %}
{% if v32_button_bottom_space > 100 %}{% set v32_button_bottom_space = 100 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v32-card-button-margin-x: {{ v32_button_margin_x }}px;
    --veloura-v32-card-button-bottom-space: {{ v32_button_bottom_space }}px;
    --veloura-v32-card-action-width: calc(100% - (var(--veloura-v32-card-button-margin-x) * 2));
  }

  /* Make every marked product-card host and its vertical entry consume the full available card height. */
  html body salla-product-card.veloura-v32-product-host {
    display: block !important;
    height: 100% !important;
    min-height: 100% !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
    box-sizing: border-box !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-image,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-image-full,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-image a,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-image img {
    flex: 0 0 auto !important;
  }

  /* The title area stays at the top. The price block is pushed to the bottom of the content area. */
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-main {
    flex: 0 0 auto !important;
    width: 100% !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-sub,
  html body .s-product-card-entry.veloura-v32-card-layout .veloura-v32-price-bottom {
    flex: 0 0 auto !important;
    margin-top: auto !important;
    width: 100% !important;
  }

  /* Footer and under-cart quick view become one direct, full-card-width action stack. */
  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack {
    display: flex !important;
    flex: 0 0 auto !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: flex-start !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    gap: 0 !important;
    row-gap: 0 !important;
    column-gap: 0 !important;
    box-sizing: border-box !important;
  }

  /* Both rows use the exact same final width and the exact same left/right value. */
  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack > .s-product-card-content-footer,
  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack > .veloura-quick-view-under-cart-wrap,
  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack > .veloura-v32-action-row {
    display: flex !important;
    flex: 0 0 auto !important;
    align-items: stretch !important;
    justify-content: center !important;
    width: var(--veloura-v32-card-action-width) !important;
    max-width: var(--veloura-v32-card-action-width) !important;
    min-width: 0 !important;
    margin-top: 0 !important;
    margin-right: var(--veloura-v32-card-button-margin-x) !important;
    margin-left: var(--veloura-v32-card-button-margin-x) !important;
    padding: 0 !important;
    gap: 0 !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack > .s-product-card-content-footer {
    margin-bottom: var(--veloura-v32-card-button-bottom-space) !important;
  }

  html body .s-product-card-entry.veloura-v32-card-layout > .veloura-v32-card-actions-stack > .veloura-quick-view-under-cart-wrap {
    margin-bottom: var(--veloura-v32-card-button-bottom-space) !important;
  }

  /* Every actual control fills its shared row. This removes the native fixed/max-content cart width. */
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer > *,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer salla-add-product-button,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer salla-button,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer .s-add-product-button-main,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer .s-button-element,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer .s-button-btn,
  html body .s-product-card-entry.veloura-v32-card-layout .s-product-card-content-footer button,
  html body .s-product-card-entry.veloura-v32-card-layout .veloura-quick-view-under-cart-wrap > *,
  html body .s-product-card-entry.veloura-v32-card-layout .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body .s-product-card-entry.veloura-v32-card-layout .veloura-quick-view-under-cart-wrap button,
  html body .s-product-card-entry.veloura-v32-card-layout .veloura-quick-view-under-cart-wrap a {
    display: flex !important;
    flex: 1 1 100% !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }

  /* Centering changes product text and price only; the two action rows remain centered by construction. */
  {% if v32_center_text %}
  html body .s-product-card-entry .s-product-card-content-main,
  html body .s-product-card-entry .s-product-card-content-title,
  html body .s-product-card-entry .s-product-card-content-title a,
  html body .s-product-card-entry .s-product-card-content-subtitle,
  html body .s-product-card-entry .s-product-card-content-sub,
  html body .s-product-card-entry .s-product-card-content-price,
  html body .s-product-card-entry .s-product-card-price,
  html body .s-product-card-entry .s-product-card-sale-price,
  html body .s-product-card-entry .s-product-card-sale-price h4,
  html body .s-product-card-entry .s-product-card-sale-price span,
  html body .s-product-card-entry .s-product-card-starting-price,
  html body .s-product-card-entry .s-product-card-starting-price p,
  html body .s-product-card-entry .s-product-card-starting-price h4,
  html body .s-product-card-entry .s-product-card-regular-price {
    text-align: center !important;
    justify-content: center !important;
    align-items: center !important;
  }
  {% else %}
  html body .s-product-card-entry .s-product-card-content-main,
  html body .s-product-card-entry .s-product-card-content-title,
  html body .s-product-card-entry .s-product-card-content-title a,
  html body .s-product-card-entry .s-product-card-content-subtitle,
  html body .s-product-card-entry .s-product-card-content-sub,
  html body .s-product-card-entry .s-product-card-content-price,
  html body .s-product-card-entry .s-product-card-price,
  html body .s-product-card-entry .s-product-card-sale-price,
  html body .s-product-card-entry .s-product-card-sale-price h4,
  html body .s-product-card-entry .s-product-card-sale-price span,
  html body .s-product-card-entry .s-product-card-starting-price,
  html body .s-product-card-entry .s-product-card-starting-price p,
  html body .s-product-card-entry .s-product-card-starting-price h4,
  html body .s-product-card-entry .s-product-card-regular-price {
    text-align: right !important;
    justify-content: flex-start !important;
    align-items: flex-start !important;
    direction: rtl !important;
  }
  {% endif %}
</style>

<script id="${SCRIPT_ID}">
(function () {
  var CARD_SELECTOR = '.s-product-card-entry';
  var ACTION_STACK_CLASS = 'veloura-v32-card-actions-stack';
  var ACTION_ROW_CLASS = 'veloura-v32-action-row';
  var SHADOW_STYLE_ID = 'veloura-v32-cart-wide-shadow-style';
  var actionWidth = 'calc(100% - (var(--veloura-v32-card-button-margin-x) * 2))';
  var actionMargin = 'var(--veloura-v32-card-button-margin-x)';
  var actionBottom = 'var(--veloura-v32-card-button-bottom-space)';

  function setImportant(element, property, value) {
    if (!element || !element.style) return;
    element.style.setProperty(property, value, 'important');
  }

  function makeFullWidth(element) {
    if (!element) return;
    setImportant(element, 'width', '100%');
    setImportant(element, 'max-width', '100%');
    setImportant(element, 'min-width', '0');
    setImportant(element, 'margin', '0');
    setImportant(element, 'box-sizing', 'border-box');
  }

  function injectCartShadowStyle(button) {
    if (!button || !button.shadowRoot) return;
    var old = button.shadowRoot.getElementById(SHADOW_STYLE_ID);
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = SHADOW_STYLE_ID;
    style.textContent = ':host{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important}' +
      'salla-button,.s-add-product-button-main,.s-button-element,.s-button-btn,button{display:flex!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;box-sizing:border-box!important}';
    button.shadowRoot.appendChild(style);
  }

  function forceCartWide(footer) {
    if (!footer) return;
    footer.querySelectorAll('salla-add-product-button').forEach(function (button) {
      button.setAttribute('width', 'wide');
      button.classList.add('veloura-v32-cart-wide');
      makeFullWidth(button);
      try {
        var inner = button.querySelector('salla-button');
        if (inner) {
          inner.setAttribute('width', 'wide');
          makeFullWidth(inner);
        }
      } catch (error) {}
      try { injectCartShadowStyle(button); } catch (error) {}
      if (typeof button.componentOnReady === 'function' && button.dataset.velouraV32ReadyWatch !== '1') {
        button.dataset.velouraV32ReadyWatch = '1';
        button.componentOnReady().then(function () {
          injectCartShadowStyle(button);
          makeFullWidth(button);
        }).catch(function () {});
      }
    });
    Array.prototype.forEach.call(footer.children || [], makeFullWidth);
  }

  function forceQuickViewWide(wrapper) {
    if (!wrapper) return;
    wrapper.querySelectorAll('.veloura-quick-view-btn, .veloura-quick-view-button, [data-veloura-quick-view], button, a').forEach(function (button) {
      button.classList.add('veloura-v32-qv-wide');
      makeFullWidth(button);
      setImportant(button, 'display', 'flex');
      setImportant(button, 'align-items', 'center');
      setImportant(button, 'justify-content', 'center');
    });
  }

  function styleActionRow(row, isFooter) {
    if (!row) return;
    row.classList.add(ACTION_ROW_CLASS);
    setImportant(row, 'display', 'flex');
    setImportant(row, 'width', actionWidth);
    setImportant(row, 'max-width', actionWidth);
    setImportant(row, 'min-width', '0');
    setImportant(row, 'margin-top', '0');
    setImportant(row, 'margin-right', actionMargin);
    setImportant(row, 'margin-left', actionMargin);
    setImportant(row, 'margin-bottom', actionBottom);
    setImportant(row, 'padding', '0');
    setImportant(row, 'gap', '0');
    setImportant(row, 'box-sizing', 'border-box');
    setImportant(row, 'align-items', 'stretch');
    setImportant(row, 'justify-content', 'center');
    if (isFooter) forceCartWide(row); else forceQuickViewWide(row);
  }

  function findOrCreateQuickViewWrapper(entry, host) {
    var scope = host || entry;
    var wrapper = entry.querySelector('.veloura-quick-view-under-cart-wrap') ||
      (scope && scope.querySelector ? scope.querySelector('.veloura-quick-view-under-cart-wrap') : null);
    if (wrapper) return wrapper;

    var button = entry.querySelector('.veloura-quick-view-btn.is-under-cart, .veloura-quick-view-button.is-under-cart') ||
      (scope && scope.querySelector ? scope.querySelector('.veloura-quick-view-btn.is-under-cart, .veloura-quick-view-button.is-under-cart') : null);
    if (!button || !button.parentNode) return null;

    wrapper = document.createElement('div');
    wrapper.className = 'veloura-quick-view-under-cart-wrap veloura-v32-created-qv-wrap';
    button.parentNode.insertBefore(wrapper, button);
    wrapper.appendChild(button);
    return wrapper;
  }

  function syncCard(entry) {
    if (!entry || !entry.querySelector || entry.classList.contains('s-product-card-horizontal')) return;
    var content = entry.querySelector('.s-product-card-content');
    if (!content) return;

    var host = entry.closest('salla-product-card');
    if (host) {
      host.classList.add('veloura-v32-product-host');
      setImportant(host, 'display', 'block');
      setImportant(host, 'height', '100%');
      setImportant(host, 'min-height', '100%');
    }

    entry.classList.add('veloura-v32-card-layout');
    setImportant(entry, 'display', 'flex');
    setImportant(entry, 'flex-direction', 'column');
    setImportant(entry, 'height', '100%');
    setImportant(entry, 'min-height', '100%');

    setImportant(content, 'display', 'flex');
    setImportant(content, 'flex-direction', 'column');
    setImportant(content, 'flex', '1 1 auto');
    setImportant(content, 'min-height', '0');
    setImportant(content, 'width', '100%');

    var priceBlock = content.querySelector('.s-product-card-content-sub');
    if (priceBlock) {
      priceBlock.classList.add('veloura-v32-price-bottom');
      setImportant(priceBlock, 'margin-top', 'auto');
      setImportant(priceBlock, 'width', '100%');
    }

    var stack = Array.prototype.find.call(entry.children || [], function (child) {
      return child.classList && child.classList.contains(ACTION_STACK_CLASS);
    });
    if (!stack) {
      stack = document.createElement('div');
      stack.className = ACTION_STACK_CLASS;
      entry.appendChild(stack);
    }

    setImportant(stack, 'display', 'flex');
    setImportant(stack, 'flex-direction', 'column');
    setImportant(stack, 'width', '100%');
    setImportant(stack, 'max-width', '100%');
    setImportant(stack, 'min-width', '0');
    setImportant(stack, 'margin', '0');
    setImportant(stack, 'padding', '0');
    setImportant(stack, 'gap', '0');
    setImportant(stack, 'box-sizing', 'border-box');

    var footer = entry.querySelector('.s-product-card-content-footer');
    if (footer) {
      if (footer.parentNode !== stack) stack.appendChild(footer);
      if (stack.firstElementChild !== footer) stack.insertBefore(footer, stack.firstElementChild);
    }

    var quickViewWrapper = findOrCreateQuickViewWrapper(entry, host);
    if (quickViewWrapper) {
      if (quickViewWrapper.parentNode !== stack) stack.appendChild(quickViewWrapper);
      if (footer && footer.nextElementSibling !== quickViewWrapper) {
        stack.insertBefore(quickViewWrapper, footer.nextElementSibling);
      }
    }

    styleActionRow(footer, true);
    styleActionRow(quickViewWrapper, false);
  }

  function collectCards(scope) {
    var cards = [];
    if (scope && scope.nodeType === 1 && scope.matches && scope.matches(CARD_SELECTOR)) cards.push(scope);
    if (scope && scope.nodeType === 1 && scope.closest) {
      var closestCard = scope.closest(CARD_SELECTOR);
      if (closestCard && cards.indexOf(closestCard) === -1) cards.push(closestCard);
    }
    if (scope && scope.querySelectorAll) {
      scope.querySelectorAll(CARD_SELECTOR).forEach(function (entry) { if (cards.indexOf(entry) === -1) cards.push(entry); });
    }
    return cards;
  }

  function sync(scope) {
    collectCards(scope || document).forEach(syncCard);
  }

  function schedule(scope) {
    sync(scope || document);
    window.requestAnimationFrame(function () { sync(scope || document); });
    window.setTimeout(function () { sync(scope || document); }, 120);
    window.setTimeout(function () { sync(scope || document); }, 450);
    window.setTimeout(function () { sync(document); }, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { schedule(document); });
  } else {
    schedule(document);
  }

  document.addEventListener('theme::ready', function () { schedule(document); });
  window.addEventListener('load', function () { schedule(document); }, { once: true });

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes && mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) schedule(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
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
  const oldQvBottomSettings = findSettingsById(data, OLD_QV_BOTTOM_SETTING_ID);
  if (horizontalSettings.length !== 1) throw new Error(`Invalid ${HORIZONTAL_SETTING_ID} count after insert: ${horizontalSettings.length}`);
  if (bottomSettings.length !== 1) throw new Error(`Invalid ${BOTTOM_SETTING_ID} count after insert: ${bottomSettings.length}`);
  if (oldQvBottomSettings.length !== 0) throw new Error(`Old quick-view bottom setting still exists: ${oldQvBottomSettings.length}`);
  if (String(horizontalSettings[0].value) !== '10') throw new Error(`${HORIZONTAL_SETTING_ID} initial value is not 10.`);
  if (String(bottomSettings[0].value) !== '10') throw new Error(`${BOTTOM_SETTING_ID} initial value is not 10.`);

  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  for (const [start, end] of OLD_BLOCKS) master = stripMarkedBlock(master, start, end);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(a => master.includes(a));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');
  master = master.replace(anchor, twigAndCssBlock + '\n' + anchor);

  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V32 installed correctly.');
  console.log('Both action rows now share one full-card-width stack and one horizontal slider.');
  console.log('The price remains inside the flexible content area; cart and quick view stay fixed at the bottom.');
  console.log('Both sliders start at 10px, while 0 remains a true 0px.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
