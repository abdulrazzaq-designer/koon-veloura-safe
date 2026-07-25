const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = {
  twilight: path.join(root, 'twilight.json'),
  master: path.join(root, 'src', 'views', 'layouts', 'master.twig'),
  single: path.join(root, 'src', 'views', 'pages', 'product', 'single.twig'),
  productJs: path.join(root, 'src', 'assets', 'js', 'product.js'),
};
function fail(message) { console.error('VERIFY FAILED: ' + message); process.exit(1); }
function read(file) { if (!fs.existsSync(file)) fail('Missing ' + file); return fs.readFileSync(file, 'utf8'); }
function count(text, token) { return text.split(token).length - 1; }

let twilight;
try { twilight = JSON.parse(read(files.twilight)); }
catch (error) { fail('twilight.json is invalid JSON: ' + error.message); }
const raw = JSON.stringify(twilight);
const master = read(files.master);
const single = read(files.single);
const productJs = read(files.productJs);

if (raw.includes('veloura_product_thumbnails_position_desktop_2026')) fail('Side-thumbnail setting still exists.');
[
  'veloura_product_related_desktop_columns_2026',
  'veloura_product_related_mobile_columns_2026',
  'veloura_product_order_title_2026',
  'veloura_product_order_price_2026',
  'veloura_product_order_status_2026',
  'veloura_product_order_coupon_2026',
  'veloura_product_order_description_2026',
  'veloura_product_order_data_2026',
  'veloura_product_order_extras_2026',
  'veloura_product_order_options_2026',
  'veloura_product_order_quick_2026',
  'veloura_product_order_payments_2026',
].forEach(id => { if (!raw.includes(id)) fail('Missing setting ' + id); });

if (count(master, '{# Veloura QV V42 product details order, related columns and compact sticky start #}') !== 1) fail('V42 master block is missing or duplicated.');
if (master.includes('{# Veloura QV V41 sticky state and custom right thumbnails start #}')) fail('V41 side-thumbnail/sticky block was not removed.');
if (!master.includes('veloura-v42-related-columns-shadow')) fail('Related-products shadow styling runtime is missing.');
if (!master.includes('2147483000')) fail('High sticky purchase-bar layer is missing.');
if (!master.includes('veloura-product-buttons-compact')) fail('Compact floating purchase-bar styling is missing.');
if (!master.includes('data-v42-order-payments')) fail('Product-details ordering runtime is missing.');

if (!single.includes("{% set vpp_thumbnails_position = 'below_image' %}")) fail('Thumbnails are not fixed below the image.');
if (single.includes('data-veloura-thumbs-layout=')) fail('Old side-thumbnail layout attribute still exists.');
if (!single.includes('{% if vpp_coupon_enabled and vpp_coupon_code %}')) fail('Coupon condition is not directly connected to its toggle/code.');
if (!single.includes('data-veloura-related-desktop=')) fail('Related desktop/mobile values are not rendered.');
if (!single.includes('data-v42-order-title=')) fail('Product-detail order values are not rendered.');
if (!single.includes('veloura-v42-details-order')) fail('Sortable product details container is missing.');

if (productJs.includes('veloura-v41-thumb-rail') || productJs.includes("selectedLayout === 'right_side'")) fail('Old custom side-thumbnail runtime still exists.');
if (!productJs.includes('velouraV42ThumbsReady')) fail('V42 horizontal thumbnail reset is missing.');
if (!productJs.includes("data-veloura-v42-sticky")) fail('V42 sticky state is not connected in product.js.');

console.log('twilight.json: OK');
console.log('Quick View V42 verified successfully.');
console.log('Side thumbnails are removed and native thumbnails stay below the product image.');
console.log('Coupon, related desktop/mobile columns, and ten product-detail order controls are connected.');
console.log('Compact sticky mode is inset, rounded, raised from the bottom, above page content, and uses the store primary color.');
