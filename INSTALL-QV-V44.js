const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v44-' + timestamp());

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
function numericValue(setting, fallback, min, max) {
  const candidates = [setting.selected, setting.value, setting.default];
  for (const candidate of candidates) {
    const n = Number(scalar(candidate));
    if (Number.isFinite(n)) return Math.max(min, Math.min(max, Math.round(n)));
  }
  return fallback;
}
function findAndDeduplicate(rootValue, id) {
  let first = null;
  function visit(value) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const item = value[i];
        if (item && typeof item === 'object' && item.id === id) {
          if (!first) {
            first = item;
          } else {
            value.splice(i, 1);
            i -= 1;
            continue;
          }
        }
        visit(item);
      }
      return;
    }
    if (!value || typeof value !== 'object') return;
    Object.values(value).forEach(visit);
  }
  visit(rootValue);
  return first;
}
function canonicalizeNumber(setting, {fallback, min, max, description}) {
  const value = numericValue(setting, fallback, min, max);
  setting.type = 'number';
  setting.format = 'integer';
  setting.value = value;
  setting.required = false;
  setting.minimum = min;
  setting.maximum = max;
  setting.description = description;

  // Remove unsupported/text-field metadata. `format: slider` made the Partners
  // validator treat the setting as text and apply a two-character rule.
  [
    'inputType', 'default', 'selected', 'step',
    'minLength', 'maxLength', 'multilanguage',
    'placeholder', 'pattern', 'rows'
  ].forEach(key => delete setting[key]);
}

const raw = read(twilightPath);
let twilight;
try { twilight = JSON.parse(raw); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

fs.mkdirSync(backupDir, {recursive: true});
fs.copyFileSync(twilightPath, path.join(backupDir, 'twilight.json'));

const desktop = findAndDeduplicate(twilight, 'veloura_product_related_desktop_columns_2026');
const mobile = findAndDeduplicate(twilight, 'veloura_product_related_mobile_columns_2026');
if (!desktop || !mobile) fail('V42/V43 related-product column settings were not found. Install V43 first.');

canonicalizeNumber(desktop, {
  fallback: 4,
  min: 2,
  max: 6,
  description: 'عدد المنتجات الظاهرة في الصف داخل منتجات قد تعجبك على اللابتوب — قيمة رقمية من 2 إلى 6.'
});
canonicalizeNumber(mobile, {
  fallback: 2,
  min: 1,
  max: 3,
  description: 'عدد المنتجات الظاهرة في الصف داخل منتجات قد تعجبك على الجوال — قيمة رقمية من 1 إلى 3.'
});

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');

console.log('twilight.json: OK');
console.log('Quick View V44 installed correctly.');
console.log('The two related-product column controls now use Salla numeric integer fields, not an unsupported text-like slider format.');
console.log('Duplicate definitions and text-length validation metadata were removed.');
