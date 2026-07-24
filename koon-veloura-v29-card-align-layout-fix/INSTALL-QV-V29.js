const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v29-' + timestamp());

const STYLE_ID = 'veloura-qv-v29-card-align-layout-fix-2026';
const BLOCK_START = '{# Veloura QV V29 card alignment layout fix start #}';
const BLOCK_END = '{# Veloura QV V29 card alignment layout fix end #}';
const BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

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

const bottomSpacingSetting = {
  id: BOTTOM_SETTING_ID,
  type: 'number',
  format: 'slider',
  label: 'المسافة أسفل زر العرض السريع',
  description: 'تتحكم بالفراغ أسفل زر العرض السريع عندما يكون تحت زر أضف للسلة',
  inputType: 'range',
  icon: 'sicon-pin',
  value: '0',
  required: false,
  step: '1',
  minimum: '0',
  maximum: '60',
  conditions: [
    { id: 'veloura_product_card_panel_open_2026', operation: '=', value: true },
    { id: 'veloura_quick_view_enabled_2026', operation: '=', value: true },
    { id: 'veloura_quick_view_button_position_2026', operation: '=', value: 'below_add_to_cart' }
  ]
};

const twigAndCssBlock = `
${BLOCK_START}
{# Normalize product-card text alignment switch #}
{% set v29_center_text_raw = theme.settings.get('veloura_product_card_center_text_2026', false) %}
{% if v29_center_text_raw.value is defined %}
  {% set v29_center_text_raw = v29_center_text_raw.value %}
{% elseif v29_center_text_raw.selected is defined %}
  {% if v29_center_text_raw.selected.value is defined %}
    {% set v29_center_text_raw = v29_center_text_raw.selected.value %}
  {% elseif v29_center_text_raw.selected is iterable and v29_center_text_raw.selected[0] is defined and v29_center_text_raw.selected[0].value is defined %}
    {% set v29_center_text_raw = v29_center_text_raw.selected[0].value %}
  {% else %}
    {% set v29_center_text_raw = v29_center_text_raw.selected %}
  {% endif %}
{% endif %}
{% set v29_center_text = v29_center_text_raw == true or v29_center_text_raw == 'true' or v29_center_text_raw == 1 or v29_center_text_raw == '1' or v29_center_text_raw == 'on' %}

{# Shared horizontal margin: add-to-cart and under-cart quick view use the same value #}
{% set v29_button_margin_x = theme.settings.get('veloura_product_card_button_margin_x_2026', 0) %}
{% if v29_button_margin_x.value is defined %}{% set v29_button_margin_x = v29_button_margin_x.value %}{% endif %}
{% set v29_button_margin_x = v29_button_margin_x + 0 %}
{% if v29_button_margin_x < 0 %}{% set v29_button_margin_x = 0 %}{% endif %}
{% if v29_button_margin_x > 60 %}{% set v29_button_margin_x = 60 %}{% endif %}

{# Under-cart quick-view bottom spacing #}
{% set v29_qv_margin_bottom = theme.settings.get('veloura_quick_view_button_margin_bottom_2026', 0) %}
{% if v29_qv_margin_bottom.value is defined %}{% set v29_qv_margin_bottom = v29_qv_margin_bottom.value %}{% endif %}
{% set v29_qv_margin_bottom = v29_qv_margin_bottom + 0 %}
{% if v29_qv_margin_bottom < 0 %}{% set v29_qv_margin_bottom = 0 %}{% endif %}
{% if v29_qv_margin_bottom > 60 %}{% set v29_qv_margin_bottom = 60 %}{% endif %}

<style id="${STYLE_ID}">
  :root {
    --veloura-v29-card-button-margin-x: {{ v29_button_margin_x }}px;
    --veloura-v29-qv-margin-bottom: {{ v29_qv_margin_bottom }}px;
  }

  /* V29: تثبيت توزيع البطاقة — الصورة والنصوص في الأعلى، والسعر والأزرار في الأسفل */
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

  /* V29: التوسيط يتحكم بالنص الرئيسي، عنوان المنتج، العنوان الفرعي، والسعر فقط */
  {% if v29_center_text %}
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

  /* V29: أزرار أضف للسلة والعرض السريع تبقى في المنتصف دائمًا ولا تتأثر بإلغاء التوسيط */
  html body .s-product-card-entry .s-product-card-content-footer,
  html body .s-product-card-entry .s-product-card-content-footer > *,
  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
  html body .s-product-card-entry .s-product-card-content-footer .s-button-element,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap,
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
    text-align: center !important;
    justify-content: center !important;
    align-items: center !important;
    direction: rtl !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  html body .s-product-card-entry .s-product-card-content-footer salla-add-product-button,
  html body .s-product-card-entry .s-product-card-content-footer .s-button-element {
    margin-left: var(--veloura-v29-card-button-margin-x) !important;
    margin-right: var(--veloura-v29-card-button-margin-x) !important;
  }

  /* V29: زر العرض السريع تحت أضف للسلة يأخذ نفس حواف العرض ونفس هامش يمين/يسار زر أضف للسلة */
  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin-bottom: var(--veloura-v29-qv-margin-bottom) !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  html body .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
  html body .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
    width: calc(100% - (var(--veloura-v29-card-button-margin-x) * 2)) !important;
    max-width: calc(100% - (var(--veloura-v29-card-button-margin-x) * 2)) !important;
    margin-left: var(--veloura-v29-card-button-margin-x) !important;
    margin-right: var(--veloura-v29-card-button-margin-x) !important;
    box-sizing: border-box !important;
    line-height: 1 !important;
  }
</style>
${BLOCK_END}
`;

try {
  JSON.parse(read(twilightPath));
  fs.mkdirSync(backupDir, { recursive: true });
  [masterPath, twilightPath].forEach(backup);

  const data = JSON.parse(read(twilightPath));
  removeSettingById(data, BOTTOM_SETTING_ID);
  if (!insertAfterSetting(data, 'veloura_quick_view_button_height_2026', bottomSpacingSetting)) {
    throw new Error('Could not find veloura_quick_view_button_height_2026 in twilight.json.');
  }
  const settings = findSettingsById(data, BOTTOM_SETTING_ID);
  if (settings.length !== 1) throw new Error(`Invalid ${BOTTOM_SETTING_ID} count after insert: ${settings.length}`);
  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  master = stripMarkedBlock(master, BLOCK_START, BLOCK_END);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(a => master.includes(a));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');
  master = master.replace(anchor, twigAndCssBlock + '\n' + anchor);

  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V29 installed correctly.');
  console.log('Added/fixed: text alignment, stable card vertical layout, under-cart quick-view width and spacing.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
