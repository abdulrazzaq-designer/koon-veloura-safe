const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v30-' + timestamp());

const STYLE_ID = 'veloura-qv-v30-absolute-card-spacing-2026';
const BLOCK_START = '{# Veloura QV V30 absolute card spacing start #}';
const BLOCK_END = '{# Veloura QV V30 absolute card spacing end #}';
const OLD_V29_START = '{# Veloura QV V29 card alignment layout fix start #}';
const OLD_V29_END = '{# Veloura QV V29 card alignment layout fix end #}';

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
  label: 'المسافة يمين ويسار زر أضف للسلة',
  description: 'القيمة بالبكسل مباشرة: 0 يعني بلا مسافة، و10 يعني 10px. تتحكم بعرض زر أضف للسلة وزر العرض السريع عندما يكون تحت السلة.',
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
  description: 'القيمة بالبكسل مباشرة: 0 يعني بلا مسافة. تطبق على أضف للسلة، العرض السريع تحت السلة، وزر عرض المزيد.',
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
{# Normalize product-card text alignment switch #}
{% set v30_center_text_raw = theme.settings.get('veloura_product_card_center_text_2026', false) %}
{% if v30_center_text_raw.value is defined %}
  {% set v30_center_text_raw = v30_center_text_raw.value %}
{% elseif v30_center_text_raw.selected is defined %}
  {% if v30_center_text_raw.selected.value is defined %}
    {% set v30_center_text_raw = v30_center_text_raw.selected.value %}
  {% elseif v30_center_text_raw.selected is iterable and v30_center_text_raw.selected[0] is defined and v30_center_text_raw.selected[0].value is defined %}
    {% set v30_center_text_raw = v30_center_text_raw.selected[0].value %}
  {% else %}
    {% set v30_center_text_raw = v30_center_text_raw.selected %}
  {% endif %}
{% endif %}
{% set v30_center_text = v30_center_text_raw == true or v30_center_text_raw == 'true' or v30_center_text_raw == 1 or v30_center_text_raw == '1' or v30_center_text_raw == 'on' %}

{# Horizontal spacing is absolute: 0px means 0px. No hidden base value is added. #}
{% set v30_button_margin_x_raw = theme.settings.get('veloura_product_card_button_margin_x_2026', 10) %}
{% if v30_button_margin_x_raw.value is defined %}
  {% set v30_button_margin_x_raw = v30_button_margin_x_raw.value %}
{% elseif v30_button_margin_x_raw.selected is defined %}
  {% if v30_button_margin_x_raw.selected.value is defined %}
    {% set v30_button_margin_x_raw = v30_button_margin_x_raw.selected.value %}
  {% elseif v30_button_margin_x_raw.selected is iterable and v30_button_margin_x_raw.selected[0] is defined and v30_button_margin_x_raw.selected[0].value is defined %}
    {% set v30_button_margin_x_raw = v30_button_margin_x_raw.selected[0].value %}
  {% else %}
    {% set v30_button_margin_x_raw = v30_button_margin_x_raw.selected %}
  {% endif %}
{% endif %}
{% set v30_button_margin_x = v30_button_margin_x_raw + 0 %}
{% if v30_button_margin_x < 0 %}{% set v30_button_margin_x = 0 %}{% endif %}
{% if v30_button_margin_x > 60 %}{% set v30_button_margin_x = 60 %}{% endif %}

{# Bottom spacing is absolute: 0px means 0px. It controls cart, under-cart quick view, and more/details buttons. #}
{% set v30_button_bottom_space_raw = theme.settings.get('veloura_product_card_button_margin_bottom_2026', 10) %}
{% if v30_button_bottom_space_raw.value is defined %}
  {% set v30_button_bottom_space_raw = v30_button_bottom_space_raw.value %}
{% elseif v30_button_bottom_space_raw.selected is defined %}
  {% if v30_button_bottom_space_raw.selected.value is defined %}
    {% set v30_button_bottom_space_raw = v30_button_bottom_space_raw.selected.value %}
  {% elseif v30_button_bottom_space_raw.selected is iterable and v30_button_bottom_space_raw.selected[0] is defined and v30_button_bottom_space_raw.selected[0].value is defined %}
    {% set v30_button_bottom_space_raw = v30_button_bottom_space_raw.selected[0].value %}
  {% else %}
    {% set v30_button_bottom_space_raw = v30_button_bottom_space_raw.selected %}
  {% endif %}
{% endif %}
{% set v30_button_bottom_space = v30_button_bottom_space_raw + 0 %}
{% if v30_button_bottom_space < 0 %}{% set v30_button_bottom_space = 0 %}{% endif %}
{% if v30_button_bottom_space > 60 %}{% set v30_button_bottom_space = 60 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v30-card-button-margin-x: {{ v30_button_margin_x }}px;
    --veloura-v30-card-button-bottom-space: {{ v30_button_bottom_space }}px;
  }

  /* V30: تثبيت توزيع البطاقة — الصورة والنصوص في الأعلى، والسعر والأزرار في الأسفل */
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
  }

  /* V30: التوسيط يتحكم بالنص الرئيسي، عنوان المنتج، العنوان الفرعي، والسعر فقط */
  {% if v30_center_text %}
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

  /* V30: الأزرار تبقى في المنتصف دائمًا ولا تتأثر بإلغاء توسيط النص */
  html body .s-product-card-entry .s-product-card-content-footer,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
    direction: rtl !important;
    gap: 0 !important;
    row-gap: 0 !important;
    column-gap: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 0 !important;
    box-sizing: border-box !important;
  }

  /* V30: المسافة أسفل أضف للسلة قيمة مباشرة وليست مضافة فوق قيمة افتراضية */
  html body .s-product-card-entry .s-product-card-content-footer {
    margin-bottom: var(--veloura-v30-card-button-bottom-space) !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
  html body .s-product-card-entry .s-product-card-content-footer .s-button-element,
  html body .s-product-card-entry .s-product-card-content-footer .s-button-btn,
  html body .s-product-card-entry .s-product-card-content-footer button,
  html body .s-product-card-entry .s-product-card-content-footer a[class*="button"],
  html body .s-product-card-entry .s-product-card-content-footer a[class*="btn"] {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: calc(100% - (var(--veloura-v30-card-button-margin-x) * 2)) !important;
    max-width: calc(100% - (var(--veloura-v30-card-button-margin-x) * 2)) !important;
    min-width: 0 !important;
    margin-left: var(--veloura-v30-card-button-margin-x) !important;
    margin-right: var(--veloura-v30-card-button-margin-x) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    box-sizing: border-box !important;
  }

  /* V30: العرض السريع تحت السلة يأخذ نفس عرض أضف للسلة ونفس المسافة يمين/يسار */
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    margin-top: 0 !important;
    margin-bottom: var(--veloura-v30-card-button-bottom-space) !important;
  }

  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap button,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap a,
  html body .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: calc(100% - (var(--veloura-v30-card-button-margin-x) * 2)) !important;
    max-width: calc(100% - (var(--veloura-v30-card-button-margin-x) * 2)) !important;
    min-width: 0 !important;
    margin-left: var(--veloura-v30-card-button-margin-x) !important;
    margin-right: var(--veloura-v30-card-button-margin-x) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    box-sizing: border-box !important;
    line-height: 1 !important;
  }

  /* V30: زر عرض المزيد/تفاصيل المنتج يأخذ نفس مسافة الأسفل المباشرة بدون قيمة مخفية */
  html body .veloura-quick-view-modal .veloura-quick-view-product-link,
  html body .veloura-quick-view-modal .veloura-quick-view-more,
  html body .veloura-quick-view-modal .veloura-qv-more,
  html body .veloura-quick-view-modal .veloura-qv-product-link,
  html body .veloura-qv-modal .veloura-quick-view-product-link,
  html body .veloura-qv-modal .veloura-qv-more,
  html body [data-veloura-qv-more],
  html body [data-veloura-quick-view-more] {
    margin-bottom: var(--veloura-v30-card-button-bottom-space) !important;
  }
</style>
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
  if (horizontalSettings.length !== 1) throw new Error(`Invalid ${HORIZONTAL_SETTING_ID} count after insert: ${horizontalSettings.length}`);
  if (bottomSettings.length !== 1) throw new Error(`Invalid ${BOTTOM_SETTING_ID} count after insert: ${bottomSettings.length}`);

  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  master = stripMarkedBlock(master, BLOCK_START, BLOCK_END);
  master = stripMarkedBlock(master, OLD_V29_START, OLD_V29_END);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(a => master.includes(a));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');
  master = master.replace(anchor, twigAndCssBlock + '\n' + anchor);

  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V30 installed correctly.');
  console.log('Horizontal spacing and bottom spacing are absolute values: 0 means 0px, 10 means 10px.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
