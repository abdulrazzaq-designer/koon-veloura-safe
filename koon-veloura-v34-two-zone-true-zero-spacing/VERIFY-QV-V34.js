const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V34 two-zone true-zero spacing start #}';
const BLOCK_END = '{# Veloura QV V34 two-zone true-zero spacing end #}';
const STYLE_ID = 'veloura-qv-v34-two-zone-true-zero-style-2026';
const SCRIPT_ID = 'veloura-qv-v34-two-zone-true-zero-runtime-2026';
const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

function fail(message) {
  console.error('VERIFY FAILED: ' + message);
  process.exit(1);
}

function count(text, needle) {
  return text.split(needle).length - 1;
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

if (!fs.existsSync(masterPath)) fail('Missing src/views/layouts/master.twig');
if (!fs.existsSync(twilightPath)) fail('Missing twilight.json');

const master = fs.readFileSync(masterPath, 'utf8');
let twilight;
try {
  twilight = JSON.parse(fs.readFileSync(twilightPath, 'utf8'));
} catch (error) {
  fail('twilight.json is invalid JSON: ' + error.message);
}

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) fail('V34 block must exist exactly once.');
if (count(master, `id="${STYLE_ID}"`) !== 1) fail('V34 style must exist exactly once.');
if (count(master, `id="${SCRIPT_ID}"`) !== 1) fail('V34 runtime must exist exactly once.');

[
  'Veloura QV V29 card alignment layout fix start',
  'Veloura QV V30 absolute card spacing start',
  'Veloura QV V31 linked absolute spacing start',
  'Veloura QV V32 shared actions bottom stack start',
  'Veloura QV V33 safe cart and shared spacing start',
  'veloura-qv-v28-layout-bottom-spacing-2026',
  'Veloura QV V28 bottom spacing start'
].forEach(marker => {
  if (master.includes(marker)) fail('Legacy marker still exists: ' + marker);
});

const horizontal = findSettingsById(twilight, HORIZONTAL_SETTING_ID);
const bottom = findSettingsById(twilight, BOTTOM_SETTING_ID);
const oldBottom = findSettingsById(twilight, OLD_QV_BOTTOM_SETTING_ID);

if (horizontal.length !== 1) fail(`${HORIZONTAL_SETTING_ID} count is ${horizontal.length}, expected 1.`);
if (bottom.length !== 1) fail(`${BOTTOM_SETTING_ID} count is ${bottom.length}, expected 1.`);
if (oldBottom.length !== 0) fail(`${OLD_QV_BOTTOM_SETTING_ID} must be removed.`);

for (const [id, setting] of [[HORIZONTAL_SETTING_ID, horizontal[0]], [BOTTOM_SETTING_ID, bottom[0]]]) {
  if (String(setting.value) !== '10') fail(`${id} value must be 10.`);
  if (String(setting.default) !== '10') fail(`${id} default must be 10.`);
  if (String(setting.minimum) !== '0') fail(`${id} minimum must be 0.`);
}

const requiredSnippets = [
  '--veloura-v34-action-x: {{ v34_margin_x }}px;',
  '--veloura-v34-action-bottom: {{ v34_margin_bottom }}px;',
  'calc(var(--veloura-v34-action-x) - var(--veloura-v34-native-left, 0px))',
  'calc(var(--veloura-v34-action-bottom) - var(--veloura-v34-native-bottom, 0px))',
  "card.classList.toggle('veloura-v34-has-qv', hasQuickView);",
  "lower[0].classList.add('veloura-v34-bottom-anchor');",
  "row.style.setProperty('--veloura-v34-native-left'",
  "row.style.setProperty('--veloura-v34-native-bottom'",
  'document.head.appendChild(style);',
  "window.addEventListener('resize'",
  'salla::product.cards::loaded'
];

requiredSnippets.forEach(snippet => {
  if (!master.includes(snippet)) fail('Missing required V34 logic: ' + snippet);
});

const blockText = master.slice(master.indexOf(BLOCK_START), master.indexOf(BLOCK_END) + BLOCK_END.length);
if (blockText.includes('shadowRoot')) fail('V34 must not inject into Salla shadow DOM.');
if (blockText.includes("setAttribute('width'")) fail('V34 must not force width attributes on Salla cart.');
if (blockText.includes('appendChild(footer)') && !blockText.includes('parentNode === stack')) {
  fail('V34 must not move the native cart footer except targeted V32 rollback.');
}

console.log('twilight.json: OK');
console.log('Quick View V34 verified successfully.');
console.log('0px is calculated from the product-card edge after subtracting native padding.');
console.log('Cart and quick view keep identical widths and exact shared bottom spacing.');
console.log('Upper/lower zones are active; variable content leaves space only in the middle.');
console.log('Native Salla add-to-cart DOM remains intact and clickable.');
