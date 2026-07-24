const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V33 safe cart and shared spacing start #}';
const BLOCK_END = '{# Veloura QV V33 safe cart and shared spacing end #}';
const STYLE_ID = 'veloura-qv-v33-safe-cart-shared-spacing-2026';
const SCRIPT_ID = 'veloura-qv-v33-safe-card-cleanup-2026';
const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

function die(message) {
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

if (!fs.existsSync(masterPath)) die('Missing src/views/layouts/master.twig');
if (!fs.existsSync(twilightPath)) die('Missing twilight.json');

let data;
try {
  data = JSON.parse(fs.readFileSync(twilightPath, 'utf8'));
} catch (error) {
  die('twilight.json is invalid JSON: ' + error.message);
}

const master = fs.readFileSync(masterPath, 'utf8');

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) die('V33 block must exist exactly once.');
if (count(master, `id="${STYLE_ID}"`) !== 1) die('V33 style must exist exactly once.');
if (count(master, `id="${SCRIPT_ID}"`) !== 1) die('V33 cleanup script must exist exactly once.');

[
  'Veloura QV V32 shared actions bottom stack start',
  'veloura-qv-v32-card-layout-runtime-2026',
  'injectCartShadowStyle(button)',
  "button.setAttribute('width', 'wide')"
].forEach(forbidden => {
  if (master.includes(forbidden)) die('Unsafe V32 code still exists: ' + forbidden);
});

[
  '--veloura-v33-card-action-width',
  '.s-product-card-content-sub {',
  'margin-top: auto !important;',
  '.s-product-card-content-footer {',
  '.veloura-quick-view-under-cart-wrap',
  'background: var(--veloura-product-button-bg, #004d65) !important;',
  'pointer-events: auto !important;',
  'if (footer && footer.parentNode !== content) content.appendChild(footer);'
].forEach(required => {
  if (!master.includes(required)) die('Missing required V33 marker: ' + required);
});

if (master.includes("shadowRoot.appendChild(style)")) die('V33 must not inject CSS into the cart shadow root.');

const horizontal = findSettingsById(data, HORIZONTAL_SETTING_ID);
const bottom = findSettingsById(data, BOTTOM_SETTING_ID);
const oldQvBottom = findSettingsById(data, OLD_QV_BOTTOM_SETTING_ID);

if (horizontal.length !== 1) die(`${HORIZONTAL_SETTING_ID} count is ${horizontal.length}, expected 1.`);
if (bottom.length !== 1) die(`${BOTTOM_SETTING_ID} count is ${bottom.length}, expected 1.`);
if (oldQvBottom.length !== 0) die(`${OLD_QV_BOTTOM_SETTING_ID} must be removed.`);

for (const [id, setting] of [[HORIZONTAL_SETTING_ID, horizontal[0]], [BOTTOM_SETTING_ID, bottom[0]]]) {
  if (String(setting.value) !== '10') die(`${id} value must be 10.`);
  if (String(setting.default) !== '10') die(`${id} default must be 10.`);
  if (String(setting.minimum) !== '0') die(`${id} minimum must be 0.`);
  if (String(setting.maximum) !== '100') die(`${id} maximum must be 100.`);
}

console.log('twilight.json: OK');
console.log('Quick View V33 verified successfully.');
console.log('Native add-to-cart DOM is preserved; no shadow-root injection remains.');
console.log('Cart / more and under-cart quick view share one exact horizontal and bottom spacing value.');
console.log('Price is bottom-anchored inside content so missing subtitle space stays in the middle.');
