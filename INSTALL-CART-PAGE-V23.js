'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const twilightPath = path.join(root, 'twilight.json');
const cartPath = path.join(root, 'src', 'views', 'pages', 'cart.twig');
const appScssPath = path.join(root, 'src', 'assets', 'styles', 'app.scss');
const settingsPayloadPath = path.join(root, 'payload', 'cart-surfaces-settings-v23.json');
const partialPayloadPath = path.join(root, 'payload', 'src', 'views', 'components', 'cart', 'veloura-cart-banners.twig');
const scssPayloadPath = path.join(root, 'payload', 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v23.scss');
const partialTargetPath = path.join(root, 'src', 'views', 'components', 'cart', 'veloura-cart-banners.twig');
const scssTargetPath = path.join(root, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v23.scss');

const surfaceIds = [
  'veloura_cart_surfaces_enabled_2026',
  'veloura_cart_surfaces_bg_color_2026',
  'veloura_cart_surfaces_radius_2026',
  'veloura_cart_surfaces_border_enabled_2026',
  'veloura_cart_surfaces_border_color_2026',
  'veloura_cart_surfaces_shadow_enabled_2026'
];
const bannerTitleId = 'veloura_cart_banners_settings_title_2026';
const bannerEnabledId = 'veloura_cart_banners_enabled_2026';
const bannerItemsId = 'veloura_cart_banners_items_2026';
const oldSurfaceTitleId = 'veloura_cart_surfaces_settings_title_2026';
const importLine = "@import './05-utilities/veloura-cart-surfaces-v23';";
const markerBefore = '{# Veloura Cart Banners V2.3: before products #}';
const markerAfter = '{# Veloura Cart Banners V2.3: after products #}';
const markerCheckout = '{# Veloura Cart Banners V2.3: after checkout button #}';

function fail(message) { throw new Error(`${message} Nothing was changed.`); }
function read(file) { return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); }
function parse(text, label) { try { return JSON.parse(text); } catch (e) { fail(`${label} is invalid JSON: ${e.message}`); } }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeAtomic(file, content) {
  ensureDir(path.dirname(file));
  const temp = `${file}.v23.tmp`;
  fs.writeFileSync(temp, content, 'utf8');
  fs.renameSync(temp, file);
}
function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function countId(settings, id) { return settings.filter(x => x && x.id === id).length; }
function preserveValue(next, previous) {
  if (!previous) return next;
  if (next.type === 'boolean') {
    if (typeof previous.value === 'boolean') next.value = previous.value;
    if (typeof previous.selected === 'boolean') next.selected = previous.selected;
    else next.selected = next.value;
  } else if (next.format === 'color') {
    if (typeof previous.value === 'string' && previous.value.trim()) next.value = previous.value;
  } else if (next.format === 'dropdown-list') {
    let value = null;
    if (Array.isArray(previous.selected) && previous.selected[0]) value = previous.selected[0].value;
    else if (typeof previous.value === 'string') value = previous.value;
    const match = next.options.find(x => x.value === value);
    if (match) next.selected = [clone(match)];
  }
  return next;
}
function removeMarkerBlock(text, marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\s*${escaped}\\s*\\n\\s*\\{% include 'components/cart/veloura-cart-banners.twig' with \\{ veloura_cart_banners_target: '[^']+' \\} %\\}\\s*`, 'g'), '\n');
}

for (const file of [twilightPath, cartPath, appScssPath, settingsPayloadPath, partialPayloadPath, scssPayloadPath]) {
  if (!fs.existsSync(file)) fail(`Required file not found: ${file}`);
}

const originalTwilight = read(twilightPath);
const originalCart = read(cartPath);
const originalApp = read(appScssPath);
const twilight = parse(originalTwilight, 'twilight.json');
const payload = parse(read(settingsPayloadPath), 'settings payload');
if (!Array.isArray(twilight.settings)) fail('twilight.json has no top-level settings array.');
if (!Array.isArray(payload.settings)) fail('Settings payload is invalid.');

const previous = new Map();
for (const setting of twilight.settings) {
  if (setting && surfaceIds.includes(setting.id) && !previous.has(setting.id)) previous.set(setting.id, setting);
}

twilight.settings = twilight.settings.filter(setting => setting && setting.id !== oldSurfaceTitleId && !surfaceIds.includes(setting.id));
const titleIndex = twilight.settings.findIndex(x => x && x.id === bannerTitleId);
const enabledIndex = twilight.settings.findIndex(x => x && x.id === bannerEnabledId);
const itemsIndex = twilight.settings.findIndex(x => x && x.id === bannerItemsId);
if (titleIndex < 0 || enabledIndex < 0 || itemsIndex < 0) fail('Existing cart banners section was not found.');
if (!(titleIndex < enabledIndex && enabledIndex < itemsIndex)) fail('Cart banners settings order is unexpected.');

const title = twilight.settings[titleIndex];
title.label = ' ';
title.value = '<div class="veloura-switch-title" style="width:100%;padding:10px;border-radius:9999px;background:linear-gradient(270deg,#004d65,#006b7a,#00a6a6);color:#fff;display:flex;align-items:center;justify-content:flex-start;gap:12px;text-align:right;box-shadow:0 10px 25px rgba(49,46,129,.20)"><div style="width:45px;height:45px;border-radius:999px;background:#fff;color:#005369;display:flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0"><i class="sicon-image"></i></div><div style="flex:1"><strong style="display:block;font-size:22px;font-weight:800;line-height:1.4;text-align:right">صفحة وبنرات السلة</strong></div></div>';

const enabled = twilight.settings[enabledIndex];
enabled.label = 'تفعيل بنرات السلة';
enabled.description = 'عند التفعيل تظهر خيارات إضافة البنرات ومكان عرضها داخل صفحة السلة.';
enabled.icon = 'sicon-image';
enabled.wide = true;

const prepared = payload.settings.map(x => preserveValue(clone(x), previous.get(x.id)));
const newItemsIndex = twilight.settings.findIndex(x => x && x.id === bannerItemsId);
twilight.settings.splice(newItemsIndex + 1, 0, ...prepared);

for (const id of surfaceIds) {
  if (countId(twilight.settings, id) !== 1) fail(`Setting ${id} is not unique.`);
}
if (countId(twilight.settings, bannerItemsId) !== 1) fail('Cart banners collection is not unique.');

let cart = originalCart;
cart = removeMarkerBlock(cart, markerBefore);
cart = removeMarkerBlock(cart, markerAfter);
cart = removeMarkerBlock(cart, markerCheckout);

const hookStart = "                {% hook 'cart:items.start' %}";
const hookEnd = "                {% hook 'cart:items.end' %}";
const submitEnd = "                            {% hook 'cart:submit.end' %}";
if (!cart.includes(hookStart) || !cart.includes(hookEnd) || !cart.includes(submitEnd)) fail('Could not find safe cart banner insertion points.');
cart = cart.replace(hookStart, `${hookStart}\n\n                ${markerBefore}\n                {% include 'components/cart/veloura-cart-banners.twig' with { veloura_cart_banners_target: 'before_products' } %}`);
cart = cart.replace(hookEnd, `${hookEnd}\n\n                ${markerAfter}\n                {% include 'components/cart/veloura-cart-banners.twig' with { veloura_cart_banners_target: 'after_products' } %}`);
cart = cart.replace(submitEnd, `${submitEnd}\n\n                            ${markerCheckout}\n                            {% include 'components/cart/veloura-cart-banners.twig' with { veloura_cart_banners_target: 'after_checkout_button' } %}`);

for (const marker of [markerBefore, markerAfter, markerCheckout]) {
  if ((cart.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) fail(`Cart marker is not unique: ${marker}`);
}

let app = originalApp
  .replace(/^\s*@import\s+['"]\.\/05-utilities\/veloura-cart-surfaces-v(?:1|21|22|23)['"]\s*;\s*$/gm, '')
  .replace(/(?:\r?\n){3,}/g, '\n\n')
  .replace(/\s*$/, '');
app += `\n\n${importLine}\n`;
if ((app.match(/veloura-cart-surfaces-v23/g) || []).length !== 1) fail('V2.3 SCSS import is not unique.');

const generatedTwilight = `${JSON.stringify(twilight, null, 2)}\n`;
parse(generatedTwilight, 'Generated twilight.json');
const partial = read(partialPayloadPath).replace(/\s*$/, '') + '\n';
const scss = read(scssPayloadPath).replace(/\s*$/, '') + '\n';

const backupRoot = path.join(root, 'migration-audit', `before-cart-page-v23-${timestamp()}`);
const files = [
  [twilightPath, path.join(backupRoot, 'twilight.json')],
  [cartPath, path.join(backupRoot, 'src/views/pages/cart.twig')],
  [appScssPath, path.join(backupRoot, 'src/assets/styles/app.scss')]
];
for (const [source, destination] of files) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}
for (const target of [partialTargetPath, scssTargetPath]) {
  if (fs.existsSync(target)) {
    const destination = path.join(backupRoot, path.relative(root, target));
    ensureDir(path.dirname(destination));
    fs.copyFileSync(target, destination);
  }
}

try {
  writeAtomic(twilightPath, generatedTwilight);
  writeAtomic(cartPath, cart);
  writeAtomic(appScssPath, app);
  writeAtomic(partialTargetPath, partial);
  writeAtomic(scssTargetPath, scss);
} catch (error) {
  for (const [target, backup] of files) fs.copyFileSync(backup, target);
  throw new Error(`Installation failed and original files were restored: ${error.message}`);
}

console.log('twilight.json: OK');
console.log('Cart surface controls: merged into Page and cart banners');
console.log('Cart banner rendering: installed at all three positions');
console.log('Product options white panel: neutralized inside customized cart cards');
console.log('Cart Page V2.3 installed correctly.');
console.log(`Backup: ${backupRoot}`);
