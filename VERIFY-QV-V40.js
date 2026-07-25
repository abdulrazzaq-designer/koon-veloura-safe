const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');

function fail(message) {
  console.error('Verify failed: ' + message);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail('Missing file: ' + path.relative(root, file));
  return fs.readFileSync(file, 'utf8');
}
function walk(value, callback) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, callback));
    return;
  }
  if (!value || typeof value !== 'object') return;
  callback(value);
  Object.values(value).forEach((child) => walk(child, callback));
}
function findById(rootValue, id) {
  let found = null;
  walk(rootValue, (item) => { if (!found && item.id === id) found = item; });
  return found;
}

const twilightRaw = read(twilightPath);
const single = read(singlePath);
const productJs = read(productJsPath);
let twilight;
try { twilight = JSON.parse(twilightRaw); } catch (error) { fail('twilight.json is invalid JSON.'); }

if (findById(twilight, 'veloura_product_purchase_count_animated_2026')) {
  fail('Animated purchase counter setting still exists.');
}
const thumbs = findById(twilight, 'veloura_product_thumbnails_position_desktop_2026');
const couponToggle = findById(twilight, 'veloura_product_coupon_enabled_2026');
const couponCode = findById(twilight, 'veloura_product_coupon_code_2026');
if (!thumbs || !String(thumbs.description || '').includes('عمود عمودي')) fail('Thumbnail setting description was not updated.');
if (!couponToggle || !String(couponToggle.description || '').includes('كتابة كود فعلي')) fail('Coupon toggle description was not updated.');
if (!couponCode || !String(couponCode.description || '').includes('كوبونات المتجر')) fail('Coupon code guidance was not updated.');

[
  'data-veloura-thumbs-layout="{{ vpp_thumbnails_position }}"',
  "vpp_thumbnails_position == 'right_side' ? 'vertical-thumbs'",
  '{{ vpp_purchase_count_value }}'
].forEach((value) => {
  if (!single.includes(value)) fail('Missing Twig feature: ' + value);
});
[
  'thumbs-position=',
  'vpp_purchase_count_animated',
  'data-veloura-purchase-count',
  'data-count="{{ vpp_purchase_count_value }}"'
].forEach((value) => {
  if (single.includes(value)) fail('Obsolete Twig behavior remains: ' + value);
});

[
  'this.initVelouraProductThumbnails();',
  'initVelouraProductThumbnails()',
  "slider.toggleAttribute('vertical-thumbs', vertical)",
  "slider.setAttribute('thumbs-config', JSON.stringify(thumbsConfig))",
  "desktopMedia.addEventListener('change', applyLayout)"
].forEach((value) => {
  if (!productJs.includes(value)) fail('Missing product.js feature: ' + value);
});
if (productJs.includes('initVelouraPurchaseCount')) fail('Animated purchase-count runtime still exists.');

console.log('twilight.json: OK');
console.log('Quick View V40 verified successfully.');
console.log('Thumbnail placement uses the supported Salla vertical-thumbs/thumbs-config interface and updates only on breakpoint changes.');
console.log('Purchase count is static and the removed animation option no longer appears in theme settings.');
console.log('Coupon display requirements are clear in the theme panel.');
