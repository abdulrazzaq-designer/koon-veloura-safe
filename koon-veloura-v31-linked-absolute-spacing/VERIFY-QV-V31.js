const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V31 linked absolute spacing start #}';
const BLOCK_END = '{# Veloura QV V31 linked absolute spacing end #}';
const OLD_V29_START = '{# Veloura QV V29 card alignment layout fix start #}';
const OLD_V30_START = '{# Veloura QV V30 absolute card spacing start #}';
const STYLE_ID = 'veloura-qv-v31-linked-absolute-spacing-2026';
const SCRIPT_ID = 'veloura-qv-v31-force-wide-cart-2026';

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

if (String(horizontal[0].value) !== '10') fail(`${HORIZONTAL_SETTING_ID}: initial value must be 10`);
if (String(horizontal[0].default) !== '10') fail(`${HORIZONTAL_SETTING_ID}: default must be 10`);
if (String(horizontal[0].minimum) !== '0') fail(`${HORIZONTAL_SETTING_ID}: minimum must be 0`);
if (String(bottom[0].value) !== '10') fail(`${BOTTOM_SETTING_ID}: initial value must be 10`);
if (String(bottom[0].default) !== '10') fail(`${BOTTOM_SETTING_ID}: default must be 10`);
if (String(bottom[0].minimum) !== '0') fail(`${BOTTOM_SETTING_ID}: minimum must be 0`);

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) fail('V31 block was not inserted exactly once.');
if (master.includes(OLD_V29_START)) fail('Old V29 block still exists.');
if (master.includes(OLD_V30_START)) fail('Old V30 block still exists.');
if (!master.includes(STYLE_ID)) fail('V31 style id is missing.');
if (!master.includes(SCRIPT_ID)) fail('V31 runtime script id is missing.');
if (!master.includes("button.setAttribute('width', 'wide')")) fail('V31 wide add-to-cart runtime fix is missing.');
if (!master.includes('--veloura-v31-card-action-width')) fail('V31 shared action width CSS variable is missing.');
if (!master.includes('var(--veloura-v31-card-button-margin-x)')) fail('V31 horizontal spacing variable is missing.');
if (!master.includes('var(--veloura-v31-card-button-bottom-space)')) fail('V31 bottom spacing variable is missing.');

console.log('twilight.json: OK');
console.log('Quick View V31 verified successfully.');
console.log('Add-to-cart width is forced to wide and linked with under-cart quick-view.');
console.log('Both spacing sliders start at 10 and 0 remains a true zero.');
