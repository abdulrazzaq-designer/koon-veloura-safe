const fs = require('fs');
const path = require('path');
const root = process.cwd();
const OLD_IDS = ['veloura_product_related_desktop_columns_2026', 'veloura_product_related_mobile_columns_2026'];
const NEW_DESKTOP = 'veloura_related_desktop_columns';
const NEW_MOBILE = 'veloura_related_mobile_columns';
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
const twilightText = read(path.join(root, 'twilight.json'));
const twilight = JSON.parse(twilightText);
const single = read(path.join(root, 'src', 'views', 'pages', 'product', 'single.twig'));
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
for (const id of OLD_IDS) {
  if (findAll(twilight, id).length) fail(`Old invalid setting still exists: ${id}`);
  if (single.includes(id)) fail(`single.twig still references old setting: ${id}`);
}
const controls = [
  {setting: one(NEW_MOBILE), value: '2', max: '3'},
  {setting: one(NEW_DESKTOP), value: '4', max: '6'}
];
for (const {setting, max} of controls) {
  const exact = {
    type: 'number', format: 'slider', inputType: 'range', description: null,
    labelHTML: null, icon: 'sicon-pin', required: false,
    step: '1', minimum: '1', maximum: max
  };
  for (const [key, expected] of Object.entries(exact)) {
    if (setting[key] !== expected) fail(`${setting.id}.${key} mismatch; expected ${JSON.stringify(expected)}, got ${JSON.stringify(setting[key])}.`);
  }
  if (typeof setting.value !== 'string' || !/^\d+$/.test(setting.value)) fail(`${setting.id}.value must be a numeric string.`);
  if (Number(setting.value) < 1 || Number(setting.value) > Number(max)) fail(`${setting.id}.value outside range.`);
  for (const forbidden of ['conditions','default','selected','minLength','maxLength','validation','placeholder']) {
    if (Object.prototype.hasOwnProperty.call(setting, forbidden)) fail(`${setting.id} contains forbidden metadata: ${forbidden}`);
  }
}
if (!single.includes("theme.settings.get('veloura_related_mobile_columns'")) fail('Mobile related setting is not read in single.twig.');
if (!single.includes("theme.settings.get('veloura_related_desktop_columns'")) fail('Desktop related setting is not read in single.twig.');
if (!single.includes("slider-config='{\n                  \"slidesPerView\": {{ vpp_related_mobile_columns|default(2) }}")) fail('Inline Ultra-style mobile slider-config is missing.');
if (!single.includes('"slidesPerView": {{ vpp_related_desktop_columns|default(4) }}')) fail('Inline Ultra-style desktop breakpoint is missing.');
if (single.includes('veloura_v43_related_slider_config|json_encode')) fail('Old encoded V43 config remains.');
if ((single.match(/data-veloura-related-slider/g) || []).length !== 1) fail('Related products slider marker must exist exactly once.');

console.log('twilight.json: OK');
console.log('Quick View V46 verified successfully.');
console.log('Both controls exactly follow the working Ultra Square Images slider schema and use minimum 1, so no text-length validation is triggered.');
console.log('Related products use the same inline mobile/breakpoint slider-config pattern as Ultra Square Images.');
console.log('The old long IDs and V43 encoded config are gone.');
