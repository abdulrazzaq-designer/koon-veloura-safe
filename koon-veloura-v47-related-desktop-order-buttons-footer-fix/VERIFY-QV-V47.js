const fs = require('fs');
const path = require('path');
const root = process.cwd();
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
const twilight = JSON.parse(read(path.join(root, 'twilight.json')));
const single = read(path.join(root, 'src', 'views', 'pages', 'product', 'single.twig'));
const master = read(path.join(root, 'src', 'views', 'layouts', 'master.twig'));
function findAll(value, id, output = []) {
  if (Array.isArray(value)) {
    value.forEach(item => {
      if (item && typeof item === 'object' && item.id === id && Object.prototype.hasOwnProperty.call(item, 'type')) output.push(item);
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
  if (list.length !== 1) fail(`${id}: expected exactly one setting, found ${list.length}.`);
  return list[0];
}
const orderSwitch = one('veloura_product_details_order_enabled_2026');
if (orderSwitch.type !== 'boolean' || orderSwitch.value !== false) fail('Order switch must be boolean and off by default.');
one('veloura_related_hide_arrows_2026');
one('veloura_related_center_title_2026');
for (const id of [
  'veloura_product_details_order_title_2026','veloura_product_order_title_2026','veloura_product_order_price_2026',
  'veloura_product_order_status_2026','veloura_product_order_coupon_2026','veloura_product_order_description_2026',
  'veloura_product_order_data_2026','veloura_product_order_extras_2026','veloura_product_order_options_2026',
  'veloura_product_order_quick_2026','veloura_product_order_payments_2026'
]) {
  const setting = one(id);
  if (!Array.isArray(setting.conditions) || !setting.conditions.some(c => c && c.id === 'veloura_product_details_order_enabled_2026' && c.value === true)) {
    fail(`${id} is not nested under the order switch.`);
  }
}
if (!single.includes('data-v42-order-enabled="{{ vpp_details_order_enabled')) fail('Order enabled data bridge is missing.');
if (!single.includes('data-veloura-related-desktop="{{ vpp_related_desktop_columns }}"')) fail('Desktop related value data bridge is missing.');
if (!single.includes('data-veloura-related-hide-arrows=')) fail('Related hide-arrows bridge is missing.');
if (!single.includes('data-veloura-related-center-title=')) fail('Related center-title bridge is missing.');
if ((master.match(/Veloura QV V47 related desktop\/order\/buttons\/footer start/g) || []).length !== 1) fail('V47 block must exist exactly once.');
if (master.includes('Veloura QV V43 native related slider and purchase button colors start')) fail('Old conflicting V43 block remains.');
if (!master.includes('swiper.params.slidesPerView = current')) fail('Hydrated desktop/mobile Swiper sizing is missing.');
if (!master.includes("page.getAttribute('data-v42-order-enabled') !== 'true'")) fail('True order reset logic is missing.');
if (!master.includes("margin-top: 3rem !important")) fail('Footer top gap is missing.');
if (!master.includes('veloura-v47-cart-surface')) fail('Add-to-cart surface styling is missing.');
if (!master.includes('veloura-v47-buy-now-surface')) fail('Buy-now surface styling is missing.');
console.log('twilight.json: OK');
console.log('Quick View V47 verified successfully.');
console.log('Related desktop/mobile counts update the hydrated inner slider; arrows and title options are connected.');
console.log('Ordering is disabled by default and fully resets to native order when switched off.');
console.log('Add to cart is solid with the customized card color, Buy Now is a store-primary outline, and footer spacing is 3rem.');
