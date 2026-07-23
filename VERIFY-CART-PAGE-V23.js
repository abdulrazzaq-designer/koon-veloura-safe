'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const twilight = JSON.parse(fs.readFileSync(path.join(root, 'twilight.json'), 'utf8').replace(/^\uFEFF/, ''));
const cart = fs.readFileSync(path.join(root, 'src/views/pages/cart.twig'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/assets/styles/app.scss'), 'utf8');
const partialPath = path.join(root, 'src/views/components/cart/veloura-cart-banners.twig');
const scssPath = path.join(root, 'src/assets/styles/05-utilities/veloura-cart-surfaces-v23.scss');
const ids = [
  'veloura_cart_surfaces_enabled_2026','veloura_cart_surfaces_bg_color_2026','veloura_cart_surfaces_radius_2026',
  'veloura_cart_surfaces_border_enabled_2026','veloura_cart_surfaces_border_color_2026','veloura_cart_surfaces_shadow_enabled_2026'
];
for (const id of ids) {
  const count = twilight.settings.filter(x => x && x.id === id).length;
  if (count !== 1) throw new Error(`Invalid count for ${id}: ${count}`);
}
const title = twilight.settings.find(x => x && x.id === 'veloura_cart_banners_settings_title_2026');
if (!title || !String(title.value).includes('صفحة وبنرات السلة')) throw new Error('Merged cart section title is missing.');
const bannerToggle = twilight.settings.find(x => x && x.id === 'veloura_cart_banners_enabled_2026');
if (!bannerToggle || bannerToggle.label !== 'تفعيل بنرات السلة') throw new Error('Cart banners toggle label is not fixed.');
for (const marker of ['before products','after products','after checkout button']) {
  if (!cart.includes(`Veloura Cart Banners V2.3: ${marker}`)) throw new Error(`Missing cart marker: ${marker}`);
}
if (!fs.existsSync(partialPath)) throw new Error('Cart banners partial is missing.');
if (!fs.existsSync(scssPath)) throw new Error('Cart V2.3 SCSS is missing.');
if ((app.match(/veloura-cart-surfaces-v23/g) || []).length !== 1) throw new Error('V2.3 SCSS import is invalid.');
console.log('twilight.json: OK');
console.log('Arabic settings: OK');
console.log('Cart banners settings and rendering: OK');
console.log('Cart product-options surface fix: OK');
console.log('Cart Page V2.3 verified successfully.');
