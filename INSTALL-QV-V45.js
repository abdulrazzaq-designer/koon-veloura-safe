const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v45-' + timestamp());

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
function findAll(rootValue, id) {
  const found = [];
  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item && typeof item === 'object' && item.id === id) found.push({item, parent: value});
        visit(item);
      });
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.values(value).forEach(visit);
  }
  visit(rootValue);
  return found;
}
function findOne(rootValue, id) {
  const list = findAll(rootValue, id);
  return list.length ? list[0].item : null;
}
function deduplicate(rootValue, id) {
  const list = findAll(rootValue, id);
  if (!list.length) return null;
  const first = list[0].item;
  for (let i = list.length - 1; i >= 1; i -= 1) {
    const {item, parent} = list[i];
    const index = parent.indexOf(item);
    if (index >= 0) parent.splice(index, 1);
  }
  return first;
}
function normalizedValue(setting, fallback, min, max) {
  const candidates = [setting.selected, setting.value, setting.default];
  for (const candidate of candidates) {
    const number = Number(scalar(candidate));
    if (Number.isFinite(number)) {
      return String(Math.max(min, Math.min(max, Math.round(number))));
    }
  }
  return String(fallback);
}
function applyUltraSquareSliderSchema(setting, reference, options) {
  const {fallback, min, max, label, description} = options;
  const value = normalizedValue(setting, fallback, min, max);

  // Copy the exact working schema used by Ultra Square Images fields.
  setting.type = reference.type;
  setting.format = reference.format;
  setting.inputType = reference.inputType;
  setting.label = label;
  setting.description = description;
  setting.value = value;
  setting.required = reference.required === true;
  setting.step = String(reference.step || '1');
  setting.minimum = String(min);
  setting.maximum = String(max);

  // Ultra Square sliders do not use these text/integer/default metadata keys.
  [
    'default', 'selected', 'minLength', 'maxLength', 'multilanguage',
    'placeholder', 'pattern', 'rows', 'validation', 'min_length', 'max_length'
  ].forEach(key => delete setting[key]);
}

let twilight;
try { twilight = JSON.parse(read(twilightPath)); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

fs.mkdirSync(backupDir, {recursive: true});
fs.copyFileSync(twilightPath, path.join(backupDir, 'twilight.json'));

const ultraDesktop = findOne(twilight, 'ultra_desktop_columns');
const ultraMobile = findOne(twilight, 'ultra_mobile_columns');
if (!ultraDesktop || !ultraMobile) {
  fail('Ultra Square Images slider references were not found in twilight.json.');
}
if (ultraDesktop.type !== 'number' || ultraDesktop.format !== 'slider' || ultraDesktop.inputType !== 'range') {
  fail('ultra_desktop_columns does not use the expected working slider schema.');
}
if (ultraMobile.type !== 'number' || ultraMobile.format !== 'slider' || ultraMobile.inputType !== 'range') {
  fail('ultra_mobile_columns does not use the expected working slider schema.');
}

const desktop = deduplicate(twilight, 'veloura_product_related_desktop_columns_2026');
const mobile = deduplicate(twilight, 'veloura_product_related_mobile_columns_2026');
if (!desktop || !mobile) fail('Related-product column settings were not found. Install V42/V43 first.');

applyUltraSquareSliderSchema(desktop, ultraDesktop, {
  fallback: 4,
  min: 2,
  max: 6,
  label: 'عدد منتجات قد تعجبك في الصف — اللابتوب',
  description: 'سلايدر مطابق لطريقة Ultra Square Images؛ اختر من منتجين إلى 6 منتجات في الصف.'
});
applyUltraSquareSliderSchema(mobile, ultraMobile, {
  fallback: 2,
  min: 1,
  max: 3,
  label: 'عدد منتجات قد تعجبك في الصف — الجوال',
  description: 'سلايدر مطابق لطريقة Ultra Square Images؛ اختر من منتج واحد إلى 3 منتجات في الصف.'
});

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');

console.log('twilight.json: OK');
console.log('Quick View V45 installed correctly.');
console.log('Related-products desktop/mobile controls now copy the exact working Ultra Square Images slider schema.');
console.log('Range values are stored as numeric strings, and all V43/V44 text/integer metadata was removed.');
