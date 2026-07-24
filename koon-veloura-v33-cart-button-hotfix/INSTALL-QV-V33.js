const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v33-' + timestamp());

const BLOCK_START = '{# Veloura QV V33 safe cart and shared spacing start #}';
const BLOCK_END = '{# Veloura QV V33 safe cart and shared spacing end #}';
const STYLE_ID = 'veloura-qv-v33-safe-cart-shared-spacing-2026';
const SCRIPT_ID = 'veloura-qv-v33-safe-card-cleanup-2026';

const OLD_BLOCKS = [
  ['{# Veloura QV V29 card alignment layout fix start #}', '{# Veloura QV V29 card alignment layout fix end #}'],
  ['{# Veloura QV V30 absolute card spacing start #}', '{# Veloura QV V30 absolute card spacing end #}'],
  ['{# Veloura QV V31 linked absolute spacing start #}', '{# Veloura QV V31 linked absolute spacing end #}'],
  ['{# Veloura QV V32 shared actions bottom stack start #}', '{# Veloura QV V32 shared actions bottom stack end #}'],
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
  description: 'القيمة النهائية نفسها لكلا الزرين. 10 هي البداية، و0 يلصق زر إضافة السلة وزر العرض السريع بحافتي البطاقة فعلياً.',
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
  description: 'تطبق القيمة نفسها أسفل زر إضافة السلة وأسفل زر العرض السريع أو عرض المزيد. 10 هي البداية، و0 يلغي المسافة فعلياً.',
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

const safeBlock = `
${BLOCK_START}
{# V33 hotfix: do not move or rebuild Salla's add-to-cart component. #}
{% set v33_margin_x_raw = theme.settings.get('${HORIZONTAL_SETTING_ID}', 10) %}
{% if v33_margin_x_raw.value is defined %}
  {% set v33_margin_x_raw = v33_margin_x_raw.value %}
{% elseif v33_margin_x_raw.selected is defined %}
  {% if v33_margin_x_raw.selected.value is defined %}
    {% set v33_margin_x_raw = v33_margin_x_raw.selected.value %}
  {% elseif v33_margin_x_raw.selected is iterable and v33_margin_x_raw.selected[0] is defined and v33_margin_x_raw.selected[0].value is defined %}
    {% set v33_margin_x_raw = v33_margin_x_raw.selected[0].value %}
  {% else %}
    {% set v33_margin_x_raw = v33_margin_x_raw.selected %}
  {% endif %}
{% endif %}
{% set v33_margin_x = v33_margin_x_raw + 0 %}
{% if v33_margin_x < 0 %}{% set v33_margin_x = 0 %}{% endif %}
{% if v33_margin_x > 100 %}{% set v33_margin_x = 100 %}{% endif %}

{% set v33_margin_bottom_raw = theme.settings.get('${BOTTOM_SETTING_ID}', 10) %}
{% if v33_margin_bottom_raw.value is defined %}
  {% set v33_margin_bottom_raw = v33_margin_bottom_raw.value %}
{% elseif v33_margin_bottom_raw.selected is defined %}
  {% if v33_margin_bottom_raw.selected.value is defined %}
    {% set v33_margin_bottom_raw = v33_margin_bottom_raw.selected.value %}
  {% elseif v33_margin_bottom_raw.selected is iterable and v33_margin_bottom_raw.selected[0] is defined and v33_margin_bottom_raw.selected[0].value is defined %}
    {% set v33_margin_bottom_raw = v33_margin_bottom_raw.selected[0].value %}
  {% else %}
    {% set v33_margin_bottom_raw = v33_margin_bottom_raw.selected %}
  {% endif %}
{% endif %}
{% set v33_margin_bottom = v33_margin_bottom_raw + 0 %}
{% if v33_margin_bottom < 0 %}{% set v33_margin_bottom = 0 %}{% endif %}
{% if v33_margin_bottom > 100 %}{% set v33_margin_bottom = 100 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v33-card-action-margin-x: {{ v33_margin_x }}px;
    --veloura-v33-card-action-margin-bottom: {{ v33_margin_bottom }}px;
    --veloura-v33-card-action-width: calc(100% - (var(--veloura-v33-card-action-margin-x) * 2));
  }

  /* Keep the native product-card DOM intact and use flex only for vertical distribution. */
  html body.veloura-product-card-enabled .s-product-card-entry:not(.s-product-card-horizontal):not(.s-product-card-full-image) {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
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
    width: 100% !important;
    box-sizing: border-box !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-main {
    flex: 0 0 auto !important;
    width: 100% !important;
  }

  /* The only flexible empty area is between title/subtitle and price. */
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-sub {
    flex: 0 0 auto !important;
    margin-top: auto !important;
    width: 100% !important;
  }

  /* One safe outer width for cart / more button. Do not alter Salla component internals. */
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer {
    display: flex !important;
    flex: 0 0 auto !important;
    align-items: stretch !important;
    justify-content: center !important;
    width: var(--veloura-v33-card-action-width) !important;
    max-width: var(--veloura-v33-card-action-width) !important;
    min-width: 0 !important;
    margin-top: 0 !important;
    margin-right: var(--veloura-v33-card-action-margin-x) !important;
    margin-left: var(--veloura-v33-card-action-margin-x) !important;
    margin-bottom: var(--veloura-v33-card-action-margin-bottom) !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer > *,
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer salla-add-product-button {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Restore the native clickable cart surface and its theme colors. */
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer .s-button-element,
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer button,
  html body.veloura-product-card-enabled .s-product-card-entry salla-add-product-button .s-button-element,
  html body.veloura-product-card-enabled .s-product-card-entry salla-add-product-button button {
    width: 100% !important;
    max-width: 100% !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    opacity: 1 !important;
    visibility: visible !important;
    background: var(--veloura-product-button-bg, #004d65) !important;
    border-color: var(--veloura-product-button-bg, #004d65) !important;
    color: var(--veloura-product-button-text, #ffffff) !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer .s-button-element *,
  html body.veloura-product-card-enabled .s-product-card-entry .s-product-card-content-footer button *,
  html body.veloura-product-card-enabled .s-product-card-entry salla-add-product-button .s-button-element *,
  html body.veloura-product-card-enabled .s-product-card-entry salla-add-product-button button * {
    color: var(--veloura-product-button-text, #ffffff) !important;
    fill: var(--veloura-product-button-text, #ffffff) !important;
    pointer-events: none !important;
  }

  /* Quick view under cart receives the exact same horizontal and bottom values. */
  html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
  html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
  html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap,
  html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    display: block !important;
    flex: 0 0 auto !important;
    position: relative !important;
    width: var(--veloura-v33-card-action-width) !important;
    max-width: var(--veloura-v33-card-action-width) !important;
    min-width: 0 !important;
    margin-top: 0 !important;
    margin-right: var(--veloura-v33-card-action-margin-x) !important;
    margin-left: var(--veloura-v33-card-action-margin-x) !important;
    margin-bottom: var(--veloura-v33-card-action-margin-bottom) !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap button,
  html body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-under-cart-wrap a {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    cursor: pointer !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Text alignment never changes the action controls. */
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-footer,
  html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    text-align: center !important;
    justify-content: center !important;
    align-items: stretch !important;
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var V32_PROPS = [
    'display', 'height', 'min-height', 'flex-direction', 'flex', 'width', 'max-width', 'min-width',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'gap',
    'row-gap', 'column-gap', 'box-sizing', 'align-items', 'justify-content'
  ];

  function clearV32Inline(element) {
    if (!element || !element.style) return;
    V32_PROPS.forEach(function (property) {
      element.style.removeProperty(property);
    });
  }

  function restoreCard(card) {
    if (!card || !card.querySelector) return;

    var host = card.closest && card.closest('salla-product-card');
    var content = card.querySelector('.s-product-card-content');
    var stack = Array.prototype.find.call(card.children || [], function (child) {
      return child.classList && child.classList.contains('veloura-v32-card-actions-stack');
    });

    var footer = card.querySelector('.s-product-card-content-footer');
    var quickView = card.querySelector('.veloura-quick-view-under-cart-wrap');

    /* Undo V32 re-parenting once, then leave Salla's native controls untouched. */
    if (content) {
      if (footer && footer.parentNode !== content) content.appendChild(footer);
      if (quickView && quickView.parentNode !== content) content.appendChild(quickView);
      if (footer && quickView && footer.nextSibling !== quickView) {
        content.insertBefore(quickView, footer.nextSibling);
      }
    }

    if (stack && stack.parentNode) stack.parentNode.removeChild(stack);

    if (host) {
      host.classList.remove('veloura-v32-product-host');
      clearV32Inline(host);
    }

    card.classList.remove('veloura-v32-card-layout');
    clearV32Inline(card);

    [content, card.querySelector('.s-product-card-content-sub'), footer, quickView].forEach(clearV32Inline);

    card.querySelectorAll('.veloura-v32-action-row, .veloura-v32-cart-wide, .veloura-v32-qv-wide').forEach(function (element) {
      var wasCartWide = element.classList.contains('veloura-v32-cart-wide');
      element.classList.remove('veloura-v32-action-row', 'veloura-v32-cart-wide', 'veloura-v32-qv-wide');
      clearV32Inline(element);
      if (wasCartWide && element.tagName && element.tagName.toLowerCase() === 'salla-add-product-button') {
        element.removeAttribute('width');
      }
    });

    if (footer) {
      Array.prototype.forEach.call(footer.children || [], clearV32Inline);
      footer.querySelectorAll('salla-add-product-button, salla-add-product-button salla-button').forEach(clearV32Inline);
    }

    if (quickView) {
      Array.prototype.forEach.call(quickView.children || [], clearV32Inline);
      quickView.querySelectorAll('.veloura-quick-view-btn, .veloura-quick-view-button, button, a').forEach(clearV32Inline);
    }

    card.querySelectorAll('salla-add-product-button').forEach(function (button) {
      if (button.shadowRoot) {
        var injected = button.shadowRoot.getElementById('veloura-v32-cart-wide-shadow-style');
        if (injected) injected.remove();
      }
    });
  }

  function sync(scope) {
    var cards = [];
    if (scope && scope.matches && scope.matches('.s-product-card-entry')) cards.push(scope);
    if (scope && scope.querySelectorAll) {
      scope.querySelectorAll('.s-product-card-entry').forEach(function (card) { cards.push(card); });
    }
    cards.forEach(restoreCard);
  }

  function run() {
    sync(document);
    window.requestAnimationFrame(function () { sync(document); });
    window.setTimeout(function () { sync(document); }, 250);
    window.setTimeout(function () { sync(document); }, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  document.addEventListener('theme::ready', run);
  document.addEventListener('salla::product.cards::loaded', run);
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

  if (horizontalSettings.length !== 1) throw new Error(`Invalid ${HORIZONTAL_SETTING_ID} count: ${horizontalSettings.length}`);
  if (bottomSettings.length !== 1) throw new Error(`Invalid ${BOTTOM_SETTING_ID} count: ${bottomSettings.length}`);
  if (oldQvBottomSettings.length !== 0) throw new Error(`Old quick-view bottom setting still exists: ${oldQvBottomSettings.length}`);
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

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');

  master = master.replace(anchor, safeBlock + '\n' + anchor);
  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V33 installed correctly.');
  console.log('V32 DOM moving and shadow-root injection were removed.');
  console.log('The native add-to-cart button remains clickable and keeps its background.');
  console.log('Cart / more and under-cart quick view now share the same exact width and bottom spacing.');
  console.log('Both sliders start at 10px; a saved 0 remains a true 0px.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
