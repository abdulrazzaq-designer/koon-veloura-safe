const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v46-' + timestamp());

const OLD_DESKTOP = 'veloura_product_related_desktop_columns_2026';
const OLD_MOBILE = 'veloura_product_related_mobile_columns_2026';
const NEW_DESKTOP = 'veloura_related_desktop_columns';
const NEW_MOBILE = 'veloura_related_mobile_columns';

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3,'0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function scalar(value) {
  if (Array.isArray(value)) return value.length ? scalar(value[0]) : undefined;
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'value')) return scalar(value.value);
    if (Object.prototype.hasOwnProperty.call(value, 'selected')) return scalar(value.selected);
  }
  return value;
}
function numericString(value, fallback, min, max) {
  const number = Number(scalar(value));
  if (!Number.isFinite(number)) return String(fallback);
  return String(Math.max(min, Math.min(max, Math.round(number))));
}
function findAll(value, ids, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item && typeof item === 'object' && ids.includes(item.id)) output.push({item, parent: value, index});
      findAll(item, ids, output);
    });
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  Object.values(value).forEach(item => findAll(item, ids, output));
  return output;
}
function removeIds(value, ids) {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];
      if (item && typeof item === 'object' && ids.includes(item.id)) value.splice(i, 1);
      else removeIds(item, ids);
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach(item => removeIds(item, ids));
}
function findArrayContaining(value, id) {
  if (Array.isArray(value)) {
    if (value.some(item => item && typeof item === 'object' && item.id === id)) return value;
    for (const item of value) {
      const found = findArrayContaining(item, id);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const item of Object.values(value)) {
    const found = findArrayContaining(item, id);
    if (found) return found;
  }
  return null;
}
function setting(id, label, value, maximum) {
  // Deliberately mirrors the proven Ultra Square Images slider schema exactly.
  return {
    id,
    type: 'number',
    format: 'slider',
    inputType: 'range',
    label,
    description: null,
    labelHTML: null,
    icon: 'sicon-pin',
    value: String(value),
    required: false,
    step: '1',
    minimum: '1',
    maximum: String(maximum)
  };
}
function replaceOnce(source, search, replacement, label) {
  const count = source.split(search).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one match, found ${count}.`);
  return source.replace(search, replacement);
}

let twilight;
try { twilight = JSON.parse(read(twilightPath)); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }
let single = read(singlePath);

fs.mkdirSync(backupDir, {recursive: true});
fs.copyFileSync(twilightPath, path.join(backupDir, 'twilight.json'));
fs.copyFileSync(singlePath, path.join(backupDir, 'single.twig'));

// Preserve valid existing choices before removing every old/new duplicate.
const existing = findAll(twilight, [NEW_DESKTOP, OLD_DESKTOP, NEW_MOBILE, OLD_MOBILE]);
let desktopValue = '4';
let mobileValue = '2';
for (const found of existing) {
  if ([NEW_DESKTOP, OLD_DESKTOP].includes(found.item.id)) desktopValue = numericString(found.item.value ?? found.item.selected, 4, 1, 6);
  if ([NEW_MOBILE, OLD_MOBILE].includes(found.item.id)) mobileValue = numericString(found.item.value ?? found.item.selected, 2, 1, 3);
}

const targetArray = findArrayContaining(twilight, 'veloura_product_custom_related_enabled_2026')
  || findArrayContaining(twilight, 'veloura_product_hide_liked_products_2026')
  || twilight.settings;
if (!Array.isArray(targetArray)) fail('Could not locate the product-page settings array.');

removeIds(twilight, [OLD_DESKTOP, OLD_MOBILE, NEW_DESKTOP, NEW_MOBILE]);

let insertAt = targetArray.findIndex(item => item && item.id === 'veloura_product_custom_related_enabled_2026');
if (insertAt < 0) insertAt = targetArray.findIndex(item => item && item.id === 'veloura_product_hide_liked_products_2026');
if (insertAt < 0) insertAt = targetArray.length - 1;
// Put the sliders immediately after the related-products controls, same style as Ultra Square Images.
targetArray.splice(insertAt + 1, 0,
  setting(NEW_MOBILE, 'عدد المنتجات في الجوال', mobileValue, 3),
  setting(NEW_DESKTOP, 'عدد المنتجات في الكمبيوتر', desktopValue, 6)
);

// Read the new short IDs. Minimum stays 1 exactly like Ultra; Twig clamps only the upper limit.
single = single.replaceAll(OLD_DESKTOP, NEW_DESKTOP).replaceAll(OLD_MOBILE, NEW_MOBILE);
single = single.replace(
  "{% if vpp_related_desktop_columns < 2 %}{% set vpp_related_desktop_columns = 2 %}{% endif %}",
  "{% if vpp_related_desktop_columns < 1 %}{% set vpp_related_desktop_columns = 1 %}{% endif %}"
);

const oldBlockStart = '{# Veloura V43 related slider config start #}';
const oldBlockEnd = '{# Veloura V43 related slider config end #}';
const startIndex = single.indexOf(oldBlockStart);
const endIndex = single.indexOf(oldBlockEnd);
if (startIndex >= 0 || endIndex >= 0) {
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) fail('Incomplete V43 related slider config block.');
  single = single.slice(0, startIndex) + single.slice(endIndex + oldBlockEnd.length);
}

// Replace any previous encoded config with the same inline slider-config pattern used by Ultra Square Images.
const encodedConfig = 'slider-config="{{ veloura_v43_related_slider_config|json_encode|e(\'html_attr\') }}"';
const ultraConfig = `slider-config='{\n                  "slidesPerView": {{ vpp_related_mobile_columns|default(2) }},\n                  "spaceBetween": 12,\n                  "breakpoints": {\n                    "768": {\n                      "slidesPerView": {{ vpp_related_desktop_columns|default(4) }},\n                      "spaceBetween": 16\n                    }\n                  }\n                }'`;
if (single.includes(encodedConfig)) {
  single = single.replace(encodedConfig, ultraConfig);
} else {
  // Handle a previously modified literal/attribute by replacing the whole opening tag section safely.
  const tagPattern = /(<salla-products-slider\s+data-veloura-related-slider\s+)(?:slider-config=(?:"[^"]*"|'[\s\S]*?')\s+)?(source="\{\{ veloura_related_source \}\}")/m;
  if (!tagPattern.test(single)) fail('Could not locate the related salla-products-slider opening tag.');
  single = single.replace(tagPattern, `$1${ultraConfig}\n                $2`);
}

// Remove stale data attributes that are no longer used to size outer containers.
single = single.replace(/\s+data-veloura-related-desktop="\{\{ vpp_related_desktop_columns \}\}"/g, '');
single = single.replace(/\s+data-veloura-related-mobile="\{\{ vpp_related_mobile_columns \}\}"/g, '');

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');
write(singlePath, single);

console.log('twilight.json: OK');
console.log('Quick View V46 installed correctly.');
console.log('Related-product sliders now use the exact Ultra Square Images number/slider/range schema with minimum 1.');
console.log('The products component receives an inline responsive slider-config, matching the working Ultra Twig pattern.');
console.log('Old long setting IDs and their text-length validation are removed.');
