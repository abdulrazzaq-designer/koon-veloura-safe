const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v28-' + timestamp());

const SCRIPT_ID = 'veloura-qv-v28-layout-bottom-spacing-2026';
const STYLE_ID = 'veloura-qv-v28-layout-style-2026';
const SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';
const VAR_BLOCK_START = '{# Veloura QV V28 bottom spacing start #}';
const VAR_BLOCK_END = '{# Veloura QV V28 bottom spacing end #}';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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
  if (!fs.existsSync(backupDir)) return;
  for (const file of [masterPath, twilightPath]) {
    const source = path.join(backupDir, path.relative(root, file));
    if (fs.existsSync(source)) fs.copyFileSync(source, file);
  }
}

function stripScriptBlock(content, id) {
  const re = new RegExp(`\\n?<script[^>]*id=["']${id}["'][\\s\\S]*?<\\/script>\\n?`, 'g');
  return content.replace(re, '\n');
}

function stripMarkedBlock(content, start, end) {
  const startRe = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const endRe = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\n?${startRe}[\\s\\S]*?${endRe}\\n?`, 'g');
  return content.replace(re, '\n');
}

function removeSettingById(node, id) {
  let removed = 0;
  function walk(value) {
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const child = value[i];
        if (child && typeof child === 'object' && child.id === id && (child.type || child.format || child.label)) {
          value.splice(i, 1);
          removed++;
        } else {
          walk(child);
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

const bottomSpacingSetting = {
  id: SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة أسفل زر العرض السريع',
  description: 'يظهر هذا الخيار عندما يكون زر العرض السريع تحت زر إضافة السلة',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '0',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '40',
  conditions: [
    {
      id: 'veloura_product_card_panel_open_2026',
      operation: '=',
      value: true
    },
    {
      id: 'veloura_quick_view_enabled_2026',
      operation: '=',
      value: true
    },
    {
      id: 'veloura_quick_view_button_position_2026',
      operation: '=',
      value: 'below_add_to_cart'
    }
  ]
};

const css = `
/* ========================================================================
   Veloura QV V28 — stable product-card vertical layout and bottom spacing
   ======================================================================== */

/* الصورة والعنوان والعنوان الفرعي تبقى في أعلى البطاقة. */
html body.veloura-product-card-enabled .s-product-card-entry.s-product-card-vertical,
html body.veloura-product-card-enabled .s-product-card-entry:not(.s-product-card-horizontal):not(.s-product-card-full-image) {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image,
html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image-full {
  flex: 0 0 auto !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-main {
  flex: 0 0 auto !important;
}

/* الفراغ المرن يكون بين النصوص العلوية والسعر فقط. */
html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-sub {
  flex: 0 0 auto !important;
  margin-top: auto !important;
  width: 100% !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer,
html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap {
  flex: 0 0 auto !important;
}

/* عند إلغاء توسيط النصوص: العنوان الرئيسي والفرعي والسعر فقط يرجعون يمين. */
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-main,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-title,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-title a,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-subtitle,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-sub,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-sale-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-sale-price h4,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-sale-price span,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-starting-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-starting-price p,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-starting-price h4,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-regular-price {
  text-align: right !important;
  justify-content: flex-start !important;
  align-items: flex-start !important;
  direction: rtl !important;
}

/* أزرار إضافة السلة والعرض السريع تبقى في المنتصف حتى عند إلغاء توسيط النصوص. */
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-footer,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-footer > *,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
  text-align: center !important;
  justify-content: center !important;
  align-items: center !important;
  direction: rtl !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
}

html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer .s-button-element {
  margin-inline: auto !important;
}

/* المسافة السفلية الجديدة لزر العرض السريع عندما يكون تحت زر إضافة السلة. */
html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-under-cart-wrap {
  margin-bottom: var(--veloura-quick-view-button-margin-bottom, 0px) !important;
}

/* تأكيد عدم وجود فراغ مخفي داخل زر العرض السريع السفلي. */
html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn {
  line-height: 1 !important;
}
`;

const runtimeScript = `
<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var STYLE_ID = '${STYLE_ID}';
  var css = ${JSON.stringify(css)};

  function ensureStyle() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
    }
    if (document.head && style.parentNode !== document.head) {
      document.head.appendChild(style);
    } else if (document.head && document.head.lastElementChild !== style) {
      document.head.appendChild(style);
    }
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function syncCard(card) {
    if (!card) return;
    var content = card.querySelector('.s-product-card-content');
    var main = card.querySelector('.s-product-card-content-main');
    var price = card.querySelector('.s-product-card-content-sub');
    var footer = card.querySelector('.s-product-card-content-footer');
    var qv = card.querySelector('.veloura-quick-view-under-cart-wrap');

    if (content) content.classList.add('veloura-pc-v28-content-stack');
    if (main) main.classList.add('veloura-pc-v28-top-text');
    if (price) price.classList.add('veloura-pc-v28-bottom-price');
    if (footer) footer.classList.add('veloura-pc-v28-bottom-action');
    if (qv) qv.classList.add('veloura-pc-v28-bottom-qv');
  }

  function syncAll() {
    ensureStyle();
    document.querySelectorAll('.s-product-card-entry, product-card, custom-salla-product-card').forEach(function (node) {
      var card = node.classList && node.classList.contains('s-product-card-entry')
        ? node
        : (node.querySelector && node.querySelector('.s-product-card-entry')) || node;
      syncCard(card);
    });
  }

  ready(function () {
    syncAll();
    [120, 350, 850, 1600, 2600].forEach(function (ms) { setTimeout(syncAll, ms); });

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(syncAll, 80);
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }
  });

  document.addEventListener('theme::ready', syncAll);
  document.addEventListener('salla::product.cards::loaded', syncAll);
})();
</script>
`;

const twigVarBlock = `
${VAR_BLOCK_START}
{% set vqv_button_margin_bottom_raw = theme.settings.get('veloura_quick_view_button_margin_bottom_2026', '0') %}
{% if vqv_button_margin_bottom_raw.value is defined %}
  {% set vqv_button_margin_bottom_raw = vqv_button_margin_bottom_raw.value %}
{% endif %}
{% set vqv_button_margin_bottom = vqv_button_margin_bottom_raw + 0 %}
{% if vqv_button_margin_bottom < 0 %}
  {% set vqv_button_margin_bottom = 0 %}
{% endif %}
{% if vqv_button_margin_bottom > 40 %}
  {% set vqv_button_margin_bottom = 40 %}
{% endif %}
${VAR_BLOCK_END}
`;

try {
  JSON.parse(read(twilightPath));
  fs.mkdirSync(backupDir, { recursive: true });
  [masterPath, twilightPath].forEach(backup);

  const data = JSON.parse(read(twilightPath));
  removeSettingById(data, SETTING_ID);
  if (!insertAfterSetting(data, 'veloura_quick_view_button_height_2026', bottomSpacingSetting)) {
    throw new Error('Could not find veloura_quick_view_button_height_2026 in twilight.json.');
  }

  const settings = findSettingsById(data, SETTING_ID);
  if (settings.length !== 1) throw new Error(`Invalid ${SETTING_ID} count after insert: ${settings.length}`);

  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  master = stripScriptBlock(master, SCRIPT_ID);
  master = stripMarkedBlock(master, VAR_BLOCK_START, VAR_BLOCK_END);

  const heightAnchor = '{% set vqv_button_height = 32 + vqv_button_height_value %}';
  if (!master.includes(heightAnchor)) {
    throw new Error('Could not find quick-view height anchor in master.twig.');
  }
  master = master.replace(heightAnchor, heightAnchor + twigVarBlock);

  const cssVarAnchor = '--veloura-quick-view-button-height: {{ vqv_button_height }}px;';
  if (!master.includes(cssVarAnchor)) {
    throw new Error('Could not find quick-view height CSS variable in master.twig.');
  }
  if (!master.includes('--veloura-quick-view-button-margin-bottom: {{ vqv_button_margin_bottom }}px;')) {
    master = master.replace(cssVarAnchor, cssVarAnchor + '\n            --veloura-quick-view-button-margin-bottom: {{ vqv_button_margin_bottom }}px;');
  }

  if (!master.includes('</body>')) throw new Error('Could not find </body> in master.twig.');
  master = master.replace('</body>', runtimeScript + '\n</body>');
  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V28 installed correctly.');
  console.log('Added setting: المسافة أسفل زر العرض السريع');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
