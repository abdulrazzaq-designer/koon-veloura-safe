const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v31-' + timestamp());

const STYLE_ID = 'veloura-qv-v31-linked-absolute-spacing-2026';
const SCRIPT_ID = 'veloura-qv-v31-force-wide-cart-2026';
const BLOCK_START = '{# Veloura QV V31 linked absolute spacing start #}';
const BLOCK_END = '{# Veloura QV V31 linked absolute spacing end #}';

const OLD_BLOCKS = [
  ['{# Veloura QV V29 card alignment layout fix start #}', '{# Veloura QV V29 card alignment layout fix end #}'],
  ['{# Veloura QV V30 absolute card spacing start #}', '{# Veloura QV V30 absolute card spacing end #}'],
  [BLOCK_START, BLOCK_END]
];

const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

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
  label: 'المسافة يمين ويسار أزرار البطاقة',
  description: 'القيمة بالبكسل مباشرة: 0 يعني بلا مسافة. تتحكم في عرض زر أضف للسلة وزر العرض السريع تحت السلة معاً.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '60',
  conditions: basePanelCondition
};

const bottomSpacingSetting = {
  id: BOTTOM_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة أسفل أزرار البطاقة',
  description: 'القيمة بالبكسل مباشرة: 0 يعني بلا مسافة. تتحكم في المسافة أسفل أضف للسلة، العرض السريع تحت السلة، وزر عرض المزيد.',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '10',
  default: '10',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '60',
  conditions: basePanelCondition
};

const twigAndCssBlock = `
${BLOCK_START}
{# V31 keeps slider values absolute: 0 means 0px, 10 means 10px. #}
{% set v31_center_text_raw = theme.settings.get('veloura_product_card_center_text_2026', false) %}
{% if v31_center_text_raw.value is defined %}
  {% set v31_center_text_raw = v31_center_text_raw.value %}
{% elseif v31_center_text_raw.selected is defined %}
  {% if v31_center_text_raw.selected.value is defined %}
    {% set v31_center_text_raw = v31_center_text_raw.selected.value %}
  {% elseif v31_center_text_raw.selected is iterable and v31_center_text_raw.selected[0] is defined and v31_center_text_raw.selected[0].value is defined %}
    {% set v31_center_text_raw = v31_center_text_raw.selected[0].value %}
  {% else %}
    {% set v31_center_text_raw = v31_center_text_raw.selected %}
  {% endif %}
{% endif %}
{% set v31_center_text = v31_center_text_raw == true or v31_center_text_raw == 'true' or v31_center_text_raw == 1 or v31_center_text_raw == '1' or v31_center_text_raw == 'on' %}

{% set v31_button_margin_x_raw = theme.settings.get('veloura_product_card_button_margin_x_2026', 10) %}
{% if v31_button_margin_x_raw.value is defined %}
  {% set v31_button_margin_x_raw = v31_button_margin_x_raw.value %}
{% elseif v31_button_margin_x_raw.selected is defined %}
  {% if v31_button_margin_x_raw.selected.value is defined %}
    {% set v31_button_margin_x_raw = v31_button_margin_x_raw.selected.value %}
  {% elseif v31_button_margin_x_raw.selected is iterable and v31_button_margin_x_raw.selected[0] is defined and v31_button_margin_x_raw.selected[0].value is defined %}
    {% set v31_button_margin_x_raw = v31_button_margin_x_raw.selected[0].value %}
  {% else %}
    {% set v31_button_margin_x_raw = v31_button_margin_x_raw.selected %}
  {% endif %}
{% endif %}
{% set v31_button_margin_x = v31_button_margin_x_raw + 0 %}
{% if v31_button_margin_x < 0 %}{% set v31_button_margin_x = 0 %}{% endif %}
{% if v31_button_margin_x > 60 %}{% set v31_button_margin_x = 60 %}{% endif %}

{% set v31_button_bottom_space_raw = theme.settings.get('veloura_product_card_button_margin_bottom_2026', 10) %}
{% if v31_button_bottom_space_raw.value is defined %}
  {% set v31_button_bottom_space_raw = v31_button_bottom_space_raw.value %}
{% elseif v31_button_bottom_space_raw.selected is defined %}
  {% if v31_button_bottom_space_raw.selected.value is defined %}
    {% set v31_button_bottom_space_raw = v31_button_bottom_space_raw.selected.value %}
  {% elseif v31_button_bottom_space_raw.selected is iterable and v31_button_bottom_space_raw.selected[0] is defined and v31_button_bottom_space_raw.selected[0].value is defined %}
    {% set v31_button_bottom_space_raw = v31_button_bottom_space_raw.selected[0].value %}
  {% else %}
    {% set v31_button_bottom_space_raw = v31_button_bottom_space_raw.selected %}
  {% endif %}
{% endif %}
{% set v31_button_bottom_space = v31_button_bottom_space_raw + 0 %}
{% if v31_button_bottom_space < 0 %}{% set v31_button_bottom_space = 0 %}{% endif %}
{% if v31_button_bottom_space > 60 %}{% set v31_button_bottom_space = 60 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v31-card-button-margin-x: {{ v31_button_margin_x }}px;
    --veloura-v31-card-button-bottom-space: {{ v31_button_bottom_space }}px;
    --veloura-v31-card-action-width: calc(100% - (var(--veloura-v31-card-button-margin-x) * 2));
  }

  /* V31: توزيع البطاقة ثابت: الصورة والنصوص أعلى، والسعر والأزرار أسفل */
  html body .s-product-card-entry.s-product-card-vertical,
  html body .s-product-card-entry:not(.s-product-card-horizontal):not(.s-product-card-full-image) {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
  }

  html body .s-product-card-entry .s-product-card-image,
  html body .s-product-card-entry .s-product-card-image-full,
  html body .s-product-card-entry .s-product-card-image a,
  html body .s-product-card-entry .s-product-card-image img {
    flex: 0 0 auto !important;
  }

  html body .s-product-card-entry .s-product-card-content {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    width: 100% !important;
  }

  html body .s-product-card-entry .s-product-card-content-main {
    flex: 0 0 auto !important;
    width: 100% !important;
  }

  html body .s-product-card-entry .s-product-card-content-sub {
    flex: 0 0 auto !important;
    margin-top: auto !important;
    width: 100% !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    flex: 0 0 auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* V31: التوسيط يحرّك النصوص والسعر فقط */
  {% if v31_center_text %}
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

  /* V31: الحاويات بلا فراغات مخفية. السلايدر هو القيمة النهائية وليس قيمة مضافة */
  html body .s-product-card-entry .s-product-card-content-footer,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    display: flex !important;
    justify-content: center !important;
    align-items: stretch !important;
    text-align: center !important;
    direction: rtl !important;
    gap: 0 !important;
    row-gap: 0 !important;
    column-gap: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer {
    margin: 0 !important;
    margin-bottom: var(--veloura-v31-card-button-bottom-space) !important;
  }

  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    margin: 0 !important;
    margin-top: 0 !important;
    margin-bottom: var(--veloura-v31-card-button-bottom-space) !important;
  }

  /* V31: زر أضف للسلة يأخذ نفس عرض العرض السريع، والصفر يساوي صفر فعلي */
  html body .s-product-card-entry .s-product-card-content-footer > salla-add-product-button,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
  html body .s-product-card-entry .s-product-card-content-footer .veloura-v31-cart-full {
    display: block !important;
    flex: 0 0 var(--veloura-v31-card-action-width) !important;
    width: var(--veloura-v31-card-action-width) !important;
    max-width: var(--veloura-v31-card-action-width) !important;
    min-width: 0 !important;
    margin-left: var(--veloura-v31-card-button-margin-x) !important;
    margin-right: var(--veloura-v31-card-button-margin-x) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    box-sizing: border-box !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button[width="wide"],
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button .s-add-product-button-main,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button salla-button,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button .s-button-element,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button .s-button-btn,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button button {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* V31: العرض السريع تحت السلة مربوط بنفس سلايدر يمين/يسار ونفس عرض أضف للسلة */
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap button,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap a,
  html body .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
  html body .s-product-card-entry .veloura-v31-qv-full {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex: 0 0 var(--veloura-v31-card-action-width) !important;
    width: var(--veloura-v31-card-action-width) !important;
    max-width: var(--veloura-v31-card-action-width) !important;
    min-width: 0 !important;
    margin-left: var(--veloura-v31-card-button-margin-x) !important;
    margin-right: var(--veloura-v31-card-button-margin-x) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    box-sizing: border-box !important;
    line-height: 1 !important;
  }

  /* V31: زر عرض المزيد/تفاصيل المنتج يأخذ نفس مسافة الأسفل بدون Default مخفي */
  html body .veloura-quick-view-modal .veloura-quick-view-product-link,
  html body .veloura-quick-view-modal .veloura-quick-view-more,
  html body .veloura-quick-view-modal .veloura-qv-more,
  html body .veloura-quick-view-modal .veloura-qv-product-link,
  html body .veloura-qv-modal .veloura-quick-view-product-link,
  html body .veloura-qv-modal .veloura-qv-more,
  html body [data-veloura-qv-more],
  html body [data-veloura-quick-view-more] {
    margin-bottom: var(--veloura-v31-card-button-bottom-space) !important;
  }
</style>

<script id="${SCRIPT_ID}">
(function () {
  function markWideCartButtons(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var cartSelector = '.s-product-card-entry .s-product-card-content-footer salla-add-product-button, .s-product-card-entry salla-add-product-button, salla-product-card salla-add-product-button';
    scope.querySelectorAll(cartSelector).forEach(function (button) {
      button.setAttribute('width', 'wide');
      button.classList.add('veloura-v31-cart-full');
      try {
        var innerButton = button.querySelector && button.querySelector('salla-button');
        if (innerButton) innerButton.setAttribute('width', 'wide');
      } catch (e) {}
      try {
        if (button.shadowRoot) {
          var shadowButton = button.shadowRoot.querySelector('salla-button');
          if (shadowButton) shadowButton.setAttribute('width', 'wide');
        }
      } catch (e) {}
    });

    scope.querySelectorAll('.s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn, .s-product-card-entry .veloura-quick-view-btn.is-under-cart').forEach(function (button) {
      button.classList.add('veloura-v31-qv-full');
    });
  }

  function scheduleSync(root) {
    markWideCartButtons(root || document);
    window.requestAnimationFrame(function () { markWideCartButtons(root || document); });
    window.setTimeout(function () { markWideCartButtons(root || document); }, 250);
    window.setTimeout(function () { markWideCartButtons(root || document); }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scheduleSync(document); });
  } else {
    scheduleSync(document);
  }

  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes && mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) scheduleSync(node);
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
  console.log('Quick View V31 installed correctly.');
  console.log('Horizontal slider initial value: 10px, but 0 means 0px exactly.');
  console.log('Bottom slider initial value: 10px, but 0 means 0px exactly.');
  console.log('Add-to-cart and under-cart quick-view are linked to the same width/margins.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
