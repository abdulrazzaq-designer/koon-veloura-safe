const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v43-' + timestamp());

const V42_START = '{# Veloura QV V42 product details order, related columns and compact sticky start #}';
const V42_END = '{# Veloura QV V42 product details order, related columns and compact sticky end #}';
const V43_START = '{# Veloura QV V43 native related slider and purchase button colors start #}';
const V43_END = '{# Veloura QV V43 native related slider and purchase button colors end #}';

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3,'0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) { if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`); return fs.readFileSync(file, 'utf8'); }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function backup(file, relative) { const dst = path.join(backupDir, relative); fs.mkdirSync(path.dirname(dst), {recursive:true}); fs.copyFileSync(file, dst); }
function esc(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function stripBlock(content, start, end) { return content.replace(new RegExp(`\\n?${esc(start)}[\\s\\S]*?${esc(end)}\\n?`, 'g'), '\n'); }
function walk(value, cb) {
  if (Array.isArray(value)) { cb(value); value.forEach(v => walk(v, cb)); return; }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach(v => walk(v, cb));
}
function findSetting(value, id) {
  let result = null;
  walk(value, array => { if (!result) result = array.find(x => x && typeof x === 'object' && x.id === id) || null; });
  return result;
}

const v43Block = `${V43_START}
<style id="veloura-qv-v43-style-2026">
  /* V43 deliberately does not size the related section/container or shadow slides with CSS.
     The official slider-config is passed before Salla initializes the component. */
  .veloura-product-related-products,
  .veloura-product-related-products > salla-products-slider {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* Keep the purchase component visible; actual colors are applied to its internal buttons at runtime. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
</style>
<script data-cfasync="false" id="veloura-qv-v43-runtime-2026">
(function () {
  'use strict';

  function cssValue(element, name, fallback) {
    if (!element) return fallback;
    var value = window.getComputedStyle(element).getPropertyValue(name).trim();
    return value || fallback;
  }

  function concreteThemeColors(host) {
    var body = document.body;
    var root = document.documentElement;
    var storePrimary = cssValue(root, '--color-primary', cssValue(body, '--color-primary', '#004d65'));
    var storeText = cssValue(root, '--color-primary-reverse', cssValue(body, '--color-primary-reverse', '#ffffff'));
    var cartBg = cssValue(body, '--veloura-product-button-bg', storePrimary);
    var cartText = cssValue(body, '--veloura-product-button-text', '#ffffff');

    host.style.setProperty('--veloura-v43-cart-bg', cartBg);
    host.style.setProperty('--veloura-v43-cart-text', cartText);
    host.style.setProperty('--veloura-v43-store-bg', storePrimary);
    host.style.setProperty('--veloura-v43-store-text', storeText);
    return { storePrimary: storePrimary, storeText: storeText, cartBg: cartBg, cartText: cartText };
  }

  function injectButtonSurface(component, id, background, text, outline) {
    if (!component) return;
    component.style.setProperty('--color-primary', background);
    component.style.setProperty('--color-primary-reverse', text);
    component.style.setProperty('--button-background-color', outline ? 'transparent' : background);
    component.style.setProperty('--button-text-color', outline ? background : text);
    component.style.setProperty('--button-border-color', background);

    if (!component.shadowRoot) return;
    var style = component.shadowRoot.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      component.shadowRoot.appendChild(style);
    }
    style.textContent = outline
      ? 'button,.s-button-element,.s-button-btn{background:transparent!important;background-color:transparent!important;border-color:' + background + '!important;color:' + background + '!important}button *,.s-button-element *,.s-button-btn *{color:' + background + '!important;fill:' + background + '!important}'
      : 'button,.s-button-element,.s-button-btn{background:' + background + '!important;background-color:' + background + '!important;border-color:' + background + '!important;color:' + text + '!important}button *,.s-button-element *,.s-button-btn *{color:' + text + '!important;fill:' + text + '!important}';
  }

  function stylePurchaseButtons() {
    var page = document.querySelector('.veloura-product-page');
    var bar = page && page.querySelector('.sticky-product-bar.veloura-product-sticky-bar');
    var host = bar && bar.querySelector('salla-add-product-button');
    if (!host) return false;

    var colors = concreteThemeColors(host);
    var root = host.shadowRoot;
    if (!root) return false;

    var old = root.getElementById('veloura-v42-sticky-primary-button');
    if (old) old.remove();

    var style = root.getElementById('veloura-v43-purchase-colors');
    if (!style) {
      style = document.createElement('style');
      style.id = 'veloura-v43-purchase-colors';
      root.appendChild(style);
    }
    style.textContent = [
      '.s-add-product-button-main>salla-button{--color-primary:var(--veloura-v43-cart-bg)!important;--color-primary-reverse:var(--veloura-v43-cart-text)!important;--button-background-color:var(--veloura-v43-cart-bg)!important;--button-text-color:var(--veloura-v43-cart-text)!important}',
      '.s-add-product-button-mini-checkout,salla-quick-buy{--color-primary:var(--veloura-v43-store-bg)!important;--color-primary-reverse:var(--veloura-v43-store-text)!important;--button-background-color:transparent!important;--button-text-color:var(--veloura-v43-store-bg)!important;--button-border-color:var(--veloura-v43-store-bg)!important}'
    ].join('');

    var cart = root.querySelector('.s-add-product-button-main > salla-button');
    injectButtonSurface(cart, 'veloura-v43-cart-surface', colors.cartBg, colors.cartText, false);

    root.querySelectorAll('salla-quick-buy, .s-add-product-button-mini-checkout').forEach(function (quick) {
      injectButtonSurface(quick, 'veloura-v43-buy-now-surface', colors.storePrimary, colors.storeText, true);
    });
    return true;
  }

  function scheduleButtons() {
    [0, 80, 250, 700, 1500].forEach(function (delay) { window.setTimeout(stylePurchaseButtons, delay); });
  }

  function run() { scheduleButtons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  document.addEventListener('theme::ready', scheduleButtons);
  document.addEventListener('salla::product::details::loaded', scheduleButtons);
  document.addEventListener('product::price.updated', scheduleButtons);

  if (window.MutationObserver) {
    window.setTimeout(function () {
      var bar = document.querySelector('.sticky-product-bar.veloura-product-sticky-bar');
      if (!bar) return;
      var timer = 0;
      var observer = new MutationObserver(function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(stylePurchaseButtons, 30);
      });
      observer.observe(bar, { childList: true, subtree: true });
      window.setTimeout(function () { observer.disconnect(); }, 4000);
    }, 0);
  }
})();
</script>
${V43_END}`;

fs.mkdirSync(backupDir, {recursive:true});
[twilightPath, masterPath, singlePath].forEach(file => backup(file, path.relative(root, file)));

let twilight = JSON.parse(read(twilightPath));
['veloura_product_related_desktop_columns_2026', 'veloura_product_related_mobile_columns_2026'].forEach(id => {
  const setting = findSetting(twilight, id);
  if (!setting) fail(`Missing V42 setting: ${id}`);
  const desktop = id.includes('desktop');
  setting.type = 'number';
  setting.format = 'slider';
  setting.inputType = 'range';
  setting.value = desktop ? 4 : 2;
  setting.default = desktop ? 4 : 2;
  setting.step = 1;
  setting.minimum = desktop ? 2 : 1;
  setting.maximum = desktop ? 6 : 3;
  delete setting.minLength;
  delete setting.maxLength;
  setting.description = desktop
    ? 'عدد بطاقات المنتجات داخل السلايدر نفسه على اللابتوب — من 2 إلى 6.'
    : 'عدد بطاقات المنتجات داخل السلايدر نفسه على الجوال — من 1 إلى 3.';
});
write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');

let master = read(masterPath);
master = stripBlock(master, V43_START, V43_END);
const start = master.indexOf(V42_START);
const end = master.indexOf(V42_END);
if (start < 0 || end < 0 || end < start) fail('V42 block was not found in master.twig. Install V42 first.');
const endPos = end + V42_END.length;
let block = master.slice(start, endPos);

// Remove V42 CSS that incorrectly targeted the outer component/unknown light DOM children.
block = block.replace(/\n\s*\/\* Related products:[\s\S]*?@media \(max-width: 767px\) \{[\s\S]*?\n\s*\}\n(?=\n\s*@media \(max-width: 640px\))/m, '\n');

// Disable the old self-referential primary-color injection. V43 applies concrete values.
block = block.replace(/\n\s*function injectPrimaryButtonStyle\(bar\) \{[\s\S]*?\n\s*\}\n(?=\n\s*function clearImportant)/m,
  '\n  function injectPrimaryButtonStyle(bar) { return; }\n');

// Disable all old width/shadow-root mutation logic. The official slider-config is now server-rendered.
block = block.replace(/\n\s*function collectShadowRoots\(node, output\) \{[\s\S]*?\n\s*function scheduleRelated\(\) \{[\s\S]*?\n\s*\}\n(?=\n\s*function run\(\))/m,
  '\n  function applyRelatedColumns() { return true; }\n\n  function scheduleRelated() { return; }\n');

master = master.slice(0, start) + block + '\n' + v43Block + master.slice(endPos);
write(masterPath, master);

let single = read(singlePath);
// Remove any previous V43 config insertion before reinstalling.
single = single.replace(/\n\s*\{# Veloura V43 related slider config start #\}[\s\S]*?\{# Veloura V43 related slider config end #\}\n?/g, '\n');
single = single.replace(/\n\s*slider-config="\{\{ veloura_v43_related_slider_config\|json_encode\|e\('html_attr'\) \}\}"/g, '');

const relatedDiv = /([ \t]*)<div class="container veloura-product-related-products"([^>]*)>\s*\n\s*<salla-products-slider/;
const match = single.match(relatedDiv);
if (!match) fail('Could not locate the related products slider markup in single.twig.');
const indent = match[1];
const attrs = match[2];
const config = `${indent}{# Veloura V43 related slider config start #}\n${indent}{% set veloura_v43_related_slider_config = {\n${indent}    'slidesPerView': vpp_related_mobile_columns,\n${indent}    'spaceBetween': 12,\n${indent}    'breakpoints': {\n${indent}        '768': {\n${indent}            'slidesPerView': vpp_related_desktop_columns,\n${indent}            'spaceBetween': 16\n${indent}        }\n${indent}    }\n${indent}} %}\n${indent}{# Veloura V43 related slider config end #}\n\n${indent}<div class="container veloura-product-related-products"${attrs}>\n${indent}    <salla-products-slider`;
single = single.replace(relatedDiv, config);

single = single.replace(/(<salla-products-slider\s*[\s\S]*?data-veloura-related-slider\s*)/, '$1');
const sliderStart = /(<salla-products-slider\b(?:\s+(?!slider-config=)[^>\n]*)?\n)/;
if (!single.includes('slider-config="{{ veloura_v43_related_slider_config')) {
  single = single.replace(sliderStart, `$1${indent}        slider-config="{{ veloura_v43_related_slider_config|json_encode|e('html_attr') }}"\n`);
}
write(singlePath, single);

console.log('twilight.json: OK');
console.log('Quick View V43 installed correctly.');
console.log('Related products now use Salla slider-config on the products slider itself; no outer-container or shadow-slide widths remain.');
console.log('Add to cart uses the customized product-card button color; Buy Now uses the store primary color as an outline.');
