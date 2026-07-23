'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const twilightPath = path.join(root, 'twilight.json');
const cartPath = path.join(root, 'src', 'views', 'pages', 'cart.twig');
const appScssPath = path.join(root, 'src', 'assets', 'styles', 'app.scss');
const scssPath = path.join(root, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v22.scss');
const payloadPath = path.join(root, 'payload', 'cart-surfaces-settings-v22.json');
const importLine = "@import './05-utilities/veloura-cart-surfaces-v22';";
const marker = 'Veloura Cart Surfaces V2.2 settings';

const ids = [
  'veloura_cart_surfaces_enabled_2026',
  'veloura_cart_surfaces_bg_color_2026',
  'veloura_cart_surfaces_radius_2026',
  'veloura_cart_surfaces_border_enabled_2026',
  'veloura_cart_surfaces_border_color_2026',
  'veloura_cart_surfaces_shadow_enabled_2026'
];

function read(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function parse(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

const twilight = parse(read(twilightPath), 'twilight.json');
const payload = parse(read(payloadPath), 'The V2.2 payload');
if (!Array.isArray(twilight.settings)) throw new Error('twilight.json has no top-level settings array.');

for (const id of ids) {
  const matches = twilight.settings.filter((setting) => setting && setting.id === id);
  if (matches.length !== 1) throw new Error(`Invalid setting definition count for ${id}: ${matches.length}`);
}

if (twilight.settings.some((setting) => setting && setting.id === 'veloura_cart_surfaces_settings_title_2026')) {
  throw new Error('The old separate Cart Surfaces section title still exists.');
}

const titleIndex = twilight.settings.findIndex((setting) => setting && setting.id === 'veloura_cart_banners_settings_title_2026');
const itemsIndex = twilight.settings.findIndex((setting) => setting && setting.id === 'veloura_cart_banners_items_2026');
const firstNewIndex = twilight.settings.findIndex((setting) => setting && setting.id === ids[0]);
const nextSectionIndex = twilight.settings.findIndex((setting) => setting && setting.id === 'veloura_product_card_settings_title_2026');
if (!(titleIndex >= 0 && titleIndex < itemsIndex && itemsIndex < firstNewIndex)) {
  throw new Error('Cart Surfaces settings are not inside the existing cart banners section.');
}
if (nextSectionIndex >= 0 && firstNewIndex >= nextSectionIndex) {
  throw new Error('Cart Surfaces settings crossed into the next settings section.');
}

const title = twilight.settings[titleIndex];
if (!String(title.value || '').includes(payload.section_title)) {
  throw new Error('The cart section title was not renamed correctly.');
}

const newSettings = twilight.settings.filter((setting) => setting && ids.includes(setting.id));
const encodedText = JSON.stringify(newSettings);
if (/[ØÙÃÂ]/.test(encodedText)) {
  throw new Error('Mojibake was detected in the new Arabic settings text.');
}
if (!encodedText.includes('تفعيل تخصيص خلفية وحواف عناصر السلة')) {
  throw new Error('The expected Arabic switch label is missing.');
}

const bgSetting = newSettings.find((setting) => setting.id === 'veloura_cart_surfaces_bg_color_2026');
if (bgSetting.type !== 'string' || bgSetting.format !== 'color') {
  throw new Error('Background color setting must use type=string and format=color.');
}

const cart = read(cartPath);
if ((cart.match(new RegExp(marker, 'g')) || []).length !== 1) throw new Error('cart.twig marker count is invalid.');
if (!cart.includes('veloura-cart-surfaces-enabled')) throw new Error('cart.twig is missing the scoped class.');

const appScss = read(appScssPath);
if ((appScss.match(/veloura-cart-surfaces-v22/g) || []).length !== 1) throw new Error('app.scss V2.2 import count is invalid.');
if (!appScss.includes(importLine)) throw new Error('app.scss is missing the V2.2 import.');

const scss = read(scssPath);
if (!scss.includes('.veloura-cart-surfaces-enabled')) throw new Error('The V2.2 SCSS scope is missing.');

console.log('twilight.json: OK');
console.log('Arabic settings encoding: OK');
console.log('Existing cart banners section: OK');
console.log('Cart Surfaces V2.2 installation verified.');
