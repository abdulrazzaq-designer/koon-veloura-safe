const fs = require('fs');
const path = require('path');
const root = process.cwd();
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
const twilight = JSON.parse(read(path.join(root, 'twilight.json')));
const ids = new Map([
  ['veloura_product_related_desktop_columns_2026', {min: 2, max: 6}],
  ['veloura_product_related_mobile_columns_2026', {min: 1, max: 3}]
]);
const found = new Map();
function walk(value) {
  if (Array.isArray(value)) {
    value.forEach(item => {
      if (item && typeof item === 'object' && ids.has(item.id)) {
        const list = found.get(item.id) || [];
        list.push(item);
        found.set(item.id, list);
      }
      walk(item);
    });
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach(walk);
}
walk(twilight);
for (const [id, range] of ids) {
  const list = found.get(id) || [];
  if (list.length !== 1) fail(`${id} must exist exactly once; found ${list.length}.`);
  const setting = list[0];
  if (setting.type !== 'number' || setting.format !== 'integer') fail(`${id} must use type=number and format=integer.`);
  if (typeof setting.value !== 'number') fail(`${id}.value must be numeric.`);
  if (setting.minimum !== range.min || setting.maximum !== range.max) fail(`${id} range mismatch.`);
  for (const forbidden of ['inputType','default','selected','step','minLength','maxLength']) {
    if (Object.prototype.hasOwnProperty.call(setting, forbidden)) fail(`${id} still contains unsupported/text validation key: ${forbidden}`);
  }
}
console.log('twilight.json: OK');
console.log('Quick View V44 verified successfully.');
console.log('Related desktop/mobile column controls are canonical numeric integer settings with no text-length validation or duplicates.');
