const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const twilightPath = path.join(root, 'twilight.json');

const BLOCK_START = '{# Veloura QV V37 product details, sticky layer and related-card width fix start #}';
const BLOCK_END = '{# Veloura QV V37 product details, sticky layer and related-card width fix end #}';
const NORMALIZER_START = '{# Veloura Product Settings Normalizers V37 start #}';
const NORMALIZER_END = '{# Veloura Product Settings Normalizers V37 end #}';
const STOCK_START = '{# Veloura Stock Radar V37 start #}';
const STOCK_END = '{# Veloura Stock Radar V37 end #}';
const STYLE_ID = 'veloura-qv-v37-product-details-style-2026';
const SCRIPT_ID = 'veloura-qv-v37-product-details-runtime-2026';

function fail(message) {
  console.error('VERIFY FAILED: ' + message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail('Missing ' + path.relative(root, file));
  return fs.readFileSync(file, 'utf8');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

const master = read(masterPath);
const single = read(singlePath);
const productJs = read(productJsPath);
const twilight = read(twilightPath);

try { JSON.parse(twilight); } catch (error) { fail('twilight.json is invalid JSON: ' + error.message); }

[
  [master, BLOCK_START, 1],
  [master, BLOCK_END, 1],
  [master, `id="${STYLE_ID}"`, 1],
  [master, `id="${SCRIPT_ID}"`, 1],
  [single, NORMALIZER_START, 1],
  [single, NORMALIZER_END, 1],
  [single, STOCK_START, 1],
  [single, STOCK_END, 1]
].forEach(([text, needle, expected]) => {
  if (count(text, needle) !== expected) fail(`${needle} must exist exactly ${expected} time(s).`);
});

const singleRequired = [
  'raw.selected.value is defined',
  'raw.selected[0].value is defined',
  'data-veloura-v37-thumbs="{{ vpp_thumbnails_position }}"',
  'data-veloura-v37-stock-radar="{{ vpp_show_stock_radar ? \'pulse\' : \'simple\' }}"',
  '{% if vpp_show_stock_radar %}',
  'thumbs-position="{{ vpp_thumbnails_position == \'right_side\' ? \'right\' : \'bottom\' }}"'
];
singleRequired.forEach(snippet => {
  if (!single.includes(snippet)) fail('Missing single.twig logic: ' + snippet);
});

const masterRequired = [
  'z-index: 2147482000 !important;',
  'data-veloura-v37-stock-radar="simple"',
  "var RELATED_SELECTOR = '.veloura-product-related-products .s-product-card-entry';",
  "var ACTION_SELECTOR = '.s-product-card-content-footer, .veloura-quick-view-under-cart-wrap';",
  "var position = desktop && requested === 'right_side' ? 'right' : 'bottom';",
  "slider.setAttribute('thumbs-position', position)",
  "var targetWidth = Math.max(0, cardRect.width - (x * 2));",
  "var desiredLeft = cardRect.left + x;",
  "translate3d(' + delta.toFixed(3) + 'px, 0, 0)'",
  'salla::product.cards::loaded'
];
masterRequired.forEach(snippet => {
  if (!master.includes(snippet)) fail('Missing V37 master logic: ' + snippet);
});

if (!productJs.includes('Veloura V37 zoom source of truth')) fail('V37 zoom source-of-truth patch is missing.');
if (!productJs.includes("velouraProductPage.classList.contains('veloura-product-zoom-enabled')")) fail('Custom zoom setting is not read by product.js.');
if (productJs.includes('themeZoomEnabled && velouraZoomAllowed')) fail('Obsolete double zoom gate is still active.');

[
  'veloura_product_show_stock_radar_2026',
  'veloura_product_thumbnails_position_desktop_2026',
  'veloura_product_images_zoom_2026',
  'veloura_product_card_button_margin_x_2026'
].forEach(id => {
  if (!twilight.includes(`"${id}"`)) fail('Missing setting in twilight.json: ' + id);
});

if (!master.includes('veloura-qv-v35-grouped-actions-style-2026')) fail('V35 grouped actions are missing.');
if (!master.includes('veloura-qv-v36-glass-quick-icon-style-2026')) fail('V36 glass quick-view fix is missing.');

console.log('twilight.json: OK');
console.log('Quick View V37 verified successfully.');
console.log('Stock indicator, desktop thumbnail position and product zoom are connected to their current settings.');
console.log('The mobile purchase bar uses the high product-page layer.');
console.log('Related-product action rows calculate their width and position directly from the visible card edge.');
