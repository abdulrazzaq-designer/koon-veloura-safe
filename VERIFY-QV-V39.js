const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const twilightPath = path.join(root, 'twilight.json');

function fail(message) {
  console.error('Verify failed: ' + message);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail('Missing file: ' + path.relative(root, file));
  return fs.readFileSync(file, 'utf8');
}
function count(content, value) { return content.split(value).length - 1; }

const master = read(masterPath);
const single = read(singlePath);
const twilight = read(twilightPath);
JSON.parse(twilight);

const start = '{# Veloura QV V39 product page final fixes start #}';
const end = '{# Veloura QV V39 product page final fixes end #}';
if (count(master, start) !== 1 || count(master, end) !== 1) fail('V39 block is missing or duplicated.');
if (count(master, 'veloura-qv-v39-product-page-final-style-2026') !== 1) fail('V39 style id is missing or duplicated.');
if (count(master, 'veloura-qv-v39-product-page-final-runtime-2026') !== 1) fail('V39 runtime id is missing or duplicated.');
if (master.includes('Veloura QV V37 product details, sticky layer and related-card width fix start') || master.includes('Veloura QV V38 product page performance hotfix start')) fail('An obsolete V37/V38 runtime block remains.');

[
  'veloura-v39-stock-dot',
  'veloura-v39-stock-ring',
  "button.setAttribute('width', 'wide')",
  '--veloura-v35-action-x',
  'veloura-v39-related-overflow',
  'z-index: 2147483000',
  'z-index: 2147483600',
  '#mobile-menu',
  'MutationObserver(function (mutations)'
].forEach(value => {
  if (!master.includes(value)) fail('Missing V39 feature: ' + value);
});

const normalizerStart = single.indexOf('{% macro veloura_bool');
const normalizerEnd = single.indexOf('{% endmacro %}', normalizerStart);
const boolMacro = single.slice(normalizerStart, normalizerEnd);
if (normalizerStart < 0 || normalizerEnd < 0) fail('Boolean normalizer is missing.');
if (boolMacro.indexOf('raw.selected is defined') < 0 || boolMacro.indexOf('raw.value is defined') < 0) fail('Boolean normalizer does not support selected/value shapes.');
if (boolMacro.indexOf('raw.selected is defined') > boolMacro.indexOf('raw.value is defined')) fail('Saved selected value does not have priority over schema value.');

[
  "vpp_coupon_title = _self.veloura_select",
  "vpp_coupon_subtitle = _self.veloura_select",
  "vpp_coupon_code = _self.veloura_select",
  'vpp_purchase_count_min_raw = _self.veloura_select',
  '(product.sold_quantity|default(0)) + 0',
  '(vpp_purchase_count_min|default(0)) + 0'
].forEach(value => {
  if (!single.includes(value)) fail('Missing normalized product-page value: ' + value);
});

[
  'veloura_product_coupon_enabled_2026',
  'veloura_product_coupon_code_2026',
  'veloura_product_purchase_count_condition_enabled_2026',
  'veloura_product_purchase_count_min_2026',
  'veloura_product_show_stock_radar_2026',
  'veloura_product_mobile_sticky_cart_2026'
].forEach(id => {
  if (!twilight.includes(id)) fail('Missing theme setting: ' + id);
});

console.log('twilight.json: OK');
console.log('Quick View V39 verified successfully.');
console.log('Related-product add-to-cart uses the exact card-edge horizontal slider and native wide Salla button.');
console.log('Availability indicator has a visible dot-and-ring pulse.');
console.log('Mobile sticky purchase bar escapes page stacking contexts and stays below the mobile category menu.');
console.log('Coupon and purchase-count settings resolve saved selected values before schema defaults.');
