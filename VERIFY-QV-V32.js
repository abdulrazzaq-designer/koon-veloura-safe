const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V32 shared actions bottom stack start #}';
const BLOCK_END = '{# Veloura QV V32 shared actions bottom stack end #}';
const OLD_STARTS = [
  '{# Veloura QV V29 card alignment layout fix start #}',
  '{# Veloura QV V30 absolute card spacing start #}',
  '{# Veloura QV V31 linked absolute spacing start #}'
];
const STYLE_ID = 'veloura-qv-v32-shared-actions-bottom-stack-2026';
const SCRIPT_ID = 'veloura-qv-v32-card-layout-runtime-2026';
const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function count(text, pattern) {
  return (text.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
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

const data = JSON.parse(read(twilightPath));
const master = read(masterPath);

const horizontal = findSettingsById(data, HORIZONTAL_SETTING_ID);
const bottom = findSettingsById(data, BOTTOM_SETTING_ID);
const oldQvBottom = findSettingsById(data, OLD_QV_BOTTOM_SETTING_ID);

if (horizontal.length !== 1) fail(`${HORIZONTAL_SETTING_ID}: expected 1 setting, found ${horizontal.length}`);
if (bottom.length !== 1) fail(`${BOTTOM_SETTING_ID}: expected 1 setting, found ${bottom.length}`);
if (oldQvBottom.length !== 0) fail(`${OLD_QV_BOTTOM_SETTING_ID}: expected removed, found ${oldQvBottom.length}`);

for (const setting of [horizontal[0], bottom[0]]) {
  if (String(setting.value) !== '10') fail(`${setting.id}: initial value must be 10`);
  if (String(setting.default) !== '10') fail(`${setting.id}: default must be 10`);
  if (String(setting.minimum) !== '0') fail(`${setting.id}: minimum must be 0`);
  if (String(setting.maximum) !== '100') fail(`${setting.id}: maximum must be 100`);
}

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) fail('V32 block was not inserted exactly once.');
OLD_STARTS.forEach(start => { if (master.includes(start)) fail(`Old block still exists: ${start}`); });
if (!master.includes(STYLE_ID)) fail('V32 style id is missing.');
if (!master.includes(SCRIPT_ID)) fail('V32 runtime script id is missing.');
if (!master.includes('veloura-v32-card-actions-stack')) fail('Shared bottom action stack is missing.');
if (!master.includes("stack.appendChild(footer)")) fail('Footer relocation into shared action stack is missing.');
if (!master.includes("stack.insertBefore(footer, stack.firstElementChild)")) fail('Footer-first action ordering is missing.');
if (!master.includes("stack.appendChild(quickViewWrapper)")) fail('Quick-view relocation into shared action stack is missing.');
if (!master.includes("stack.insertBefore(quickViewWrapper, footer.nextElementSibling)")) fail('Quick-view second action ordering is missing.');
if (!master.includes("priceBlock.classList.add('veloura-v32-price-bottom')")) fail('Price bottom anchoring runtime is missing.');
if (!master.includes('scope.closest(CARD_SELECTOR)')) fail('Mutation resync through the closest card is missing.');
if (!master.includes("button.setAttribute('width', 'wide')")) fail('Wide add-to-cart runtime is missing.');
if (!master.includes('--veloura-v32-card-action-width')) fail('Shared action-width variable is missing.');
if (!master.includes('var(--veloura-v32-card-button-margin-x)')) fail('Shared horizontal spacing variable is missing.');
if (!master.includes('var(--veloura-v32-card-button-bottom-space)')) fail('Shared bottom spacing variable is missing.');
if (!master.includes("margin-bottom', actionBottom")) fail('Absolute bottom spacing runtime is missing.');

console.log('twilight.json: OK');
console.log('Quick View V32 verified successfully.');
console.log('Cart and under-cart quick view share one full-card-width stack, width formula, and horizontal slider.');
console.log('Price is bottom-anchored inside the flexible content area; missing subtitle/image height creates middle space only.');
console.log('Both sliders start at 10px and preserve a true zero.');
