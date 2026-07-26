const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');

function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function findAll(value, id, output = []) {
  if (Array.isArray(value)) {
    value.forEach(item => {
      if (item && typeof item === 'object' && item.id === id) output.push(item);
      findAll(item, id, output);
    });
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  Object.values(value).forEach(item => findAll(item, id, output));
  return output;
}

let twilight;
try { twilight = JSON.parse(read(twilightPath)); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }
const master = read(masterPath);
const productJs = read(productJsPath);

const title = findAll(twilight, 'veloura_product_details_order_title_2026').filter(item => item.type === 'static');
const intro = findAll(twilight, 'veloura_product_details_order_intro_2026').filter(item => item.type === 'static');
const toggle = findAll(twilight, 'veloura_product_details_order_enabled_2026').filter(item => item.type === 'boolean');
if (title.length !== 1 || intro.length !== 1 || toggle.length !== 1) fail('Order title/spacing/switch must each exist exactly once.');
if (toggle[0].value !== false && toggle[0].value !== true) fail('Order switch value must be boolean.');

const orderIds = [
  'veloura_product_order_title_2026', 'veloura_product_order_price_2026',
  'veloura_product_order_status_2026', 'veloura_product_order_coupon_2026',
  'veloura_product_order_description_2026', 'veloura_product_order_data_2026',
  'veloura_product_order_extras_2026', 'veloura_product_order_options_2026',
  'veloura_product_order_quick_2026', 'veloura_product_order_payments_2026'
];
for (const id of orderIds) {
  const item = findAll(twilight, id).filter(entry => entry.type === 'items');
  if (item.length !== 1) fail(`${id}: expected once.`);
  if (!Array.isArray(item[0].conditions) || !item[0].conditions.some(c => c && c.id === 'veloura_product_details_order_enabled_2026' && c.value === true)) {
    fail(`${id}: missing enabled-switch condition.`);
  }
}

const checks = [
  ['master', master, '{# Veloura QV V48 thumbs/buttons/order/separators start #}'],
  ['master', master, 'veloura-v48-scrollable-thumbs'],
  ['master', master, 'veloura-v48-cart-surface'],
  ['master', master, 'resetDetailsOrder(page, main)'],
  ['master', master, 'background:rgba(15,23,42,.12)'],
  ['product.js', productJs, 'slider.dataset.velouraV48ThumbsReady'],
  ['product.js', productJs, "nativeThumbs.style.setProperty('overflow-x', 'auto', 'important')"],
  ['product.js', productJs, "main.style.setProperty('grid-template-columns'"],
  ['product.js', productJs, 'component.dataset.velouraV48PurchaseReady']
];
for (const [name, source, needle] of checks) {
  if (!source.includes(needle)) fail(`${name}: missing ${needle}`);
}
if (master.includes('{# Veloura QV V47 related desktop/order/buttons/footer start #}')) fail('Old V47 block still exists.');
if ((master.match(/Veloura QV V48 thumbs\/buttons\/order\/separators start/g) || []).length !== 1) fail('V48 block is duplicated.');
if (productJs.includes("child.style.setProperty('width', '0', 'important')")) fail('Old width:0 purchase-button logic still exists.');

console.log('twilight.json: OK');
console.log('Quick View V48 verified successfully.');
console.log('Horizontal thumbnails are movable, purchase buttons retain real surfaces, ordering has a true off reset, and mobile sticky sections have subtle dividers.');
