'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const appJsPath = path.join(root, 'src', 'assets', 'js', 'app.js');
const appScssPath = path.join(root, 'src', 'assets', 'styles', 'app.scss');
const cartPath = path.join(root, 'src', 'views', 'pages', 'cart.twig');
const payloadRoot = __dirname;
const targetTwigPath = path.join(root, 'src', 'views', 'components', 'cart', 'veloura-cart-banners.twig');
const targetScssPath = path.join(root, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-banners.scss');
const targetJsPath = path.join(root, 'src', 'assets', 'js', 'partials', 'veloura-cart-banners.js');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function fail(message) { throw new Error(`${message} Nothing was changed.`); }
function ensure(file) { if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(root, file)}`); }
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

for (const file of [twilightPath, appJsPath, appScssPath, cartPath]) ensure(file);

let twilight;
try {
  twilight = JSON.parse(read(twilightPath).replace(/^\uFEFF/, ''));
} catch (error) {
  fail(`twilight.json is invalid JSON: ${error.message}`);
}
if (!Array.isArray(twilight.settings)) fail('twilight.json does not contain a settings array.');

const columnsId = 'veloura_cart_banners_columns_2026';
const definitions = twilight.settings.filter((item) => item && item.id === columnsId);
if (definitions.length > 1) fail(`${columnsId} has duplicate definitions: ${definitions.length}`);

if (definitions.length === 0) {
  const gapIndex = twilight.settings.findIndex((item) => item && item.id === 'veloura_cart_banners_gap_2026');
  const itemsIndex = twilight.settings.findIndex((item) => item && item.id === 'veloura_cart_banners_items_2026');
  if (gapIndex < 0 || itemsIndex < 0) fail('Existing cart-banner settings were not found.');

  const columnsSetting = {
    id: columnsId,
    type: 'number',
    format: 'slider',
    label: 'عدد البنرات في الصف',
    description: 'اختر من بنر واحد إلى ثلاثة بنرات في الصف',
    inputType: 'range',
    icon: 'sicon-grid',
    value: '2',
    required: false,
    step: '1',
    minimum: '1',
    maximum: '3',
    conditions: [
      {
        id: 'veloura_cart_banners_enabled_2026',
        operation: '=',
        value: true
      }
    ]
  };

  twilight.settings.splice(gapIndex + 1, 0, columnsSetting);
}

const backupRoot = path.join(root, 'migration-audit', `before-cart-banners-v25-${stamp()}`);
const files = [twilightPath, appJsPath, appScssPath, cartPath, targetTwigPath, targetScssPath, targetJsPath];
fs.mkdirSync(backupRoot, { recursive: true });
const manifest = [];
for (const file of files) {
  const rel = path.relative(root, file);
  const existed = fs.existsSync(file);
  manifest.push({ rel, existed });
  if (existed) {
    const dest = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }
}

try {
  fs.writeFileSync(twilightPath, `${JSON.stringify(twilight, null, 2)}\n`, 'utf8');

  fs.mkdirSync(path.dirname(targetTwigPath), { recursive: true });
  fs.mkdirSync(path.dirname(targetScssPath), { recursive: true });
  fs.mkdirSync(path.dirname(targetJsPath), { recursive: true });
  fs.copyFileSync(path.join(payloadRoot, 'src', 'views', 'components', 'cart', 'veloura-cart-banners.twig'), targetTwigPath);
  fs.copyFileSync(path.join(payloadRoot, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-banners.scss'), targetScssPath);
  fs.copyFileSync(path.join(payloadRoot, 'src', 'assets', 'js', 'partials', 'veloura-cart-banners.js'), targetJsPath);

  let appJs = read(appJsPath);
  if (!appJs.includes("./partials/veloura-cart-banners")) {
    appJs = `import initVelouraCartBanners from './partials/veloura-cart-banners';\n${appJs}`;
  }
  if (!appJs.includes('initVelouraCartBanners();')) {
    appJs += "\n\ndocument.addEventListener('DOMContentLoaded', () => initVelouraCartBanners());\n";
  }
  fs.writeFileSync(appJsPath, appJs, 'utf8');

  let appScss = read(appScssPath);
  if (!appScss.includes("'./05-utilities/veloura-cart-banners'")) {
    appScss += "\n@import './05-utilities/veloura-cart-banners';\n";
  }
  fs.writeFileSync(appScssPath, appScss, 'utf8');

  let cart = read(cartPath);
  const include = "{% include 'components.cart.veloura-cart-banners' %}";
  if (!cart.includes(include)) {
    const marker = '{% endblock %}';
    const index = cart.indexOf(marker);
    if (index < 0) throw new Error('cart.twig endblock anchor was not found.');
    cart = `${cart.slice(0, index)}    ${include}\n${cart.slice(index)}`;
    fs.writeFileSync(cartPath, cart, 'utf8');
  }
} catch (error) {
  for (const entry of manifest) {
    const target = path.join(root, entry.rel);
    const backup = path.join(backupRoot, entry.rel);
    if (entry.existed && fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(backup, target);
    } else if (!entry.existed && fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
  throw error;
}

console.log('twilight.json: OK');
console.log('Cart banner columns slider: 1 to 3');
console.log('Checkout-button banner spacing: fixed');
console.log(`Backup: ${backupRoot}`);
console.log('Cart Banners V2.5 installed correctly.');
