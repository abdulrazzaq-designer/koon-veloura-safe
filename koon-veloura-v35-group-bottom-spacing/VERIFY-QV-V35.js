const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V35 grouped actions bottom spacing start #}';
const BLOCK_END = '{# Veloura QV V35 grouped actions bottom spacing end #}';
const STYLE_ID = 'veloura-qv-v35-grouped-actions-style-2026';
const SCRIPT_ID = 'veloura-qv-v35-grouped-actions-runtime-2026';
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

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) fail('V35 block must exist exactly once.');
if (count(master, `id="${STYLE_ID}"`) !== 1) fail('V35 style must exist exactly once.');
if (count(master, `id="${SCRIPT_ID}"`) !== 1) fail('V35 runtime must exist exactly once.');

[
  'Veloura QV V29 card alignment layout fix start',
  'Veloura QV V30 absolute card spacing start',
  'Veloura QV V31 linked absolute spacing start',
  'Veloura QV V32 shared actions bottom stack start',
  'Veloura QV V33 safe cart and shared spacing start',
  'Veloura QV V34 two-zone true-zero spacing start',
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

if (!String(bottom[0].label || '').includes('مجموعة')) fail('Bottom slider label must describe the action group.');

const requiredSnippets = [
  '--veloura-v35-action-x: {{ v35_margin_x }}px;',
  '--veloura-v35-action-bottom: {{ v35_margin_bottom }}px;',
  '.veloura-v35-lower-gap',
  'margin-top: var(--veloura-v35-lower-gap, var(--veloura-v35-fallback-lower-gap)) !important;',
  '.veloura-v35-last-action',
  'margin-bottom: calc(var(--veloura-v35-action-bottom) - var(--veloura-v35-native-bottom, 0px)) !important;',
  "for (var i = 1; i < lower.length; i++) lower[i].classList.add('veloura-v35-lower-gap');",
  "if (actions.length) actions[actions.length - 1].classList.add('veloura-v35-last-action');",
  "card.style.setProperty('--veloura-v35-lower-gap'",
  "row.style.setProperty('--veloura-v35-native-bottom'",
  'document.head.appendChild(style);',
  "window.addEventListener('resize'",
  'salla::product.cards::loaded'
];

requiredSnippets.forEach(snippet => {
  if (!master.includes(snippet)) fail('Missing required V35 logic: ' + snippet);
});

const blockText = master.slice(master.indexOf(BLOCK_START), master.indexOf(BLOCK_END) + BLOCK_END.length);
if (blockText.includes('shadowRoot')) fail('V35 must not inject into Salla shadow DOM.');
if (blockText.includes("setAttribute('width'")) fail('V35 must not force width attributes on Salla cart.');
if (blockText.includes('margin-bottom: var(--veloura-v35-action-bottom)')) {
  fail('Bottom slider must not be applied between the buttons.');
}
if (blockText.includes("card.classList.toggle('veloura-v35-has-qv'")) {
  fail('V35 must target the last visible action instead of branching button-gap behavior by quick-view presence.');
}

console.log('twilight.json: OK');
console.log('Quick View V35 verified successfully.');
console.log('Bottom slider applies once to the last visible action, so both buttons move as one group.');
console.log('Price-to-cart and cart-to-quick-view use one fixed equal gap independent from the slider.');
console.log('Without quick view, the cart becomes the last action and receives the bottom slider value.');
console.log('Native Salla add-to-cart DOM remains intact and clickable.');
