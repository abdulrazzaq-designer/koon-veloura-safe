const fs = require('fs');
const path = require('path');
const root = process.cwd();
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
const twilight = JSON.parse(read(path.join(root, 'twilight.json')));

function findAll(value, id, output = []) {
  if (Array.isArray(value)) {
    value.forEach(item => {
      if (item && typeof item === 'object' && item.id === id) output.push(item);
      findAll(item, id, output);
    });
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  Object.values(value).forEach(item => findAll(item, id, output));
  return output;
}
function one(id) {
  const list = findAll(twilight, id);
  if (list.length !== 1) fail(`${id} must exist exactly once; found ${list.length}.`);
  return list[0];
}

const ultraDesktop = one('ultra_desktop_columns');
const ultraMobile = one('ultra_mobile_columns');
const targets = [
  {setting: one('veloura_product_related_desktop_columns_2026'), reference: ultraDesktop, min: '2', max: '6'},
  {setting: one('veloura_product_related_mobile_columns_2026'), reference: ultraMobile, min: '1', max: '3'}
];

for (const {setting, reference, min, max} of targets) {
  for (const key of ['type', 'format', 'inputType']) {
    if (setting[key] !== reference[key]) fail(`${setting.id}.${key} must match ${reference.id}.`);
  }
  if (setting.type !== 'number' || setting.format !== 'slider' || setting.inputType !== 'range') {
    fail(`${setting.id} is not using the Ultra Square slider schema.`);
  }
  for (const key of ['value', 'step', 'minimum', 'maximum']) {
    if (typeof setting[key] !== 'string') fail(`${setting.id}.${key} must be a numeric string like Ultra Square Images.`);
  }
  if (setting.step !== String(reference.step)) fail(`${setting.id}.step must match ${reference.id}.`);
  if (setting.minimum !== min || setting.maximum !== max) fail(`${setting.id} range mismatch.`);
  const number = Number(setting.value);
  if (!Number.isFinite(number) || number < Number(min) || number > Number(max)) fail(`${setting.id}.value is outside its range.`);
  for (const forbidden of ['default','selected','minLength','maxLength','multilanguage','placeholder','validation']) {
    if (Object.prototype.hasOwnProperty.call(setting, forbidden)) fail(`${setting.id} still contains conflicting metadata: ${forbidden}`);
  }
}

console.log('twilight.json: OK');
console.log('Quick View V45 verified successfully.');
console.log('Both related-product controls exactly match the working Ultra Square Images number/slider/range schema.');
console.log('Values, step, minimum and maximum are stored as numeric strings with no text-length validation metadata.');
