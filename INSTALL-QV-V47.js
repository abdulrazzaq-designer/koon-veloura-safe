const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v47-' + timestamp());

const ORDER_ENABLED = 'veloura_product_details_order_enabled_2026';
const RELATED_HIDE_ARROWS = 'veloura_related_hide_arrows_2026';
const RELATED_CENTER_TITLE = 'veloura_related_center_title_2026';
const ORDER_IDS = [
  'veloura_product_details_order_title_2026',
  'veloura_product_order_title_2026',
  'veloura_product_order_price_2026',
  'veloura_product_order_status_2026',
  'veloura_product_order_coupon_2026',
  'veloura_product_order_description_2026',
  'veloura_product_order_data_2026',
  'veloura_product_order_extras_2026',
  'veloura_product_order_options_2026',
  'veloura_product_order_quick_2026',
  'veloura_product_order_payments_2026'
];

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3,'0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function findAll(value, id, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item && typeof item === 'object' && item.id === id) output.push({item, parent: value, index});
      findAll(item, id, output);
    });
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  Object.values(value).forEach(item => findAll(item, id, output));
  return output;
}
function removeIds(value, ids) {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];
      if (item && typeof item === 'object' && ids.includes(item.id)) value.splice(i, 1);
      else removeIds(item, ids);
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach(item => removeIds(item, ids));
}
function findArrayContaining(value, id) {
  if (Array.isArray(value)) {
    if (value.some(item => item && typeof item === 'object' && item.id === id)) return value;
    for (const item of value) {
      const found = findArrayContaining(item, id);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const item of Object.values(value)) {
    const found = findArrayContaining(item, id);
    if (found) return found;
  }
  return null;
}
function removeMarkedBlock(source, start, end, label) {
  let result = source;
  while (result.includes(start) || result.includes(end)) {
    const a = result.indexOf(start);
    const b = result.indexOf(end);
    if (a < 0 || b < 0 || b < a) fail(`Incomplete ${label} block.`);
    result = result.slice(0, a) + result.slice(b + end.length);
  }
  return result;
}
function addCondition(setting, id) {
  if (!setting || typeof setting !== 'object') return;
  const conditions = Array.isArray(setting.conditions) ? setting.conditions : [];
  setting.conditions = conditions.filter(c => !(c && c.id === id));
  setting.conditions.push({id, operation: '=', value: true});
}

let twilight;
try { twilight = JSON.parse(read(twilightPath)); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }
let single = read(singlePath);
let master = read(masterPath);

fs.mkdirSync(backupDir, {recursive: true});
fs.copyFileSync(twilightPath, path.join(backupDir, 'twilight.json'));
fs.copyFileSync(singlePath, path.join(backupDir, 'single.twig'));
fs.copyFileSync(masterPath, path.join(backupDir, 'master.twig'));

// -----------------------------------------------------------------------------
// twilight.json: explicit opt-in ordering + related navigation/title controls.
// -----------------------------------------------------------------------------
removeIds(twilight, [ORDER_ENABLED, RELATED_HIDE_ARROWS, RELATED_CENTER_TITLE]);
const productSettings = findArrayContaining(twilight, 'veloura_product_details_order_title_2026')
  || findArrayContaining(twilight, 'veloura_product_custom_related_enabled_2026')
  || twilight.settings;
if (!Array.isArray(productSettings)) fail('Could not locate product-page settings array.');

let orderTitleIndex = productSettings.findIndex(item => item && item.id === 'veloura_product_details_order_title_2026');
if (orderTitleIndex < 0) fail('Could not locate product details order settings.');
productSettings.splice(orderTitleIndex, 0, {
  id: ORDER_ENABLED,
  type: 'boolean',
  format: 'switch',
  label: 'تفعيل تخصيص ترتيب عناصر تفاصيل المنتج',
  description: 'مغلق افتراضيًا. عند إيقافه يرجع ترتيب صفحة المنتج الأصلي مباشرة.',
  value: false,
  conditions: [{id: 'veloura_product_page_panel_open_2026', operation: '=', value: true}]
});
for (const id of ORDER_IDS) {
  const entries = findAll(twilight, id);
  if (entries.length !== 1) fail(`${id}: expected exactly one setting, found ${entries.length}.`);
  addCondition(entries[0].item, ORDER_ENABLED);
}

let relatedDesktopIndex = productSettings.findIndex(item => item && item.id === 'veloura_related_desktop_columns');
if (relatedDesktopIndex < 0) fail('Could not locate related desktop columns setting.');
productSettings.splice(relatedDesktopIndex + 1, 0,
  {
    id: RELATED_HIDE_ARROWS,
    type: 'boolean',
    format: 'switch',
    label: 'إخفاء أسهم التنقل في منتجات قد تعجبك',
    description: 'يخفي سهمي السابق والتالي مع بقاء السحب باللمس أو الماوس.',
    value: false
  },
  {
    id: RELATED_CENTER_TITLE,
    type: 'boolean',
    format: 'switch',
    label: 'توسيط عنوان منتجات قد تعجبك',
    description: 'يوسّط عنوان القسم دون تغيير محاذاة بطاقات المنتجات.',
    value: false
  }
);

// -----------------------------------------------------------------------------
// single.twig: read settings and expose exact values to the targeted runtime.
// -----------------------------------------------------------------------------
const relatedReadAnchor = "{% if vpp_related_mobile_columns > 3 %}{% set vpp_related_mobile_columns = 3 %}{% endif %}";
if (!single.includes("theme.settings.get('veloura_related_hide_arrows_2026'")) {
  if (!single.includes(relatedReadAnchor)) fail('Could not locate related columns normalizer in single.twig.');
  single = single.replace(relatedReadAnchor, relatedReadAnchor + `\n    {% set vpp_related_hide_arrows = _self.veloura_bool(theme.settings.get('veloura_related_hide_arrows_2026', false), false)|trim == 'true' %}\n    {% set vpp_related_center_title = _self.veloura_bool(theme.settings.get('veloura_related_center_title_2026', false), false)|trim == 'true' %}`);
}

const orderAnchor = '{# Veloura V42 sortable product-details groups #}';
if (!single.includes("theme.settings.get('veloura_product_details_order_enabled_2026'")) {
  if (!single.includes(orderAnchor)) fail('Could not locate product order group in single.twig.');
  single = single.replace(orderAnchor, `{% set vpp_details_order_enabled = _self.veloura_bool(theme.settings.get('veloura_product_details_order_enabled_2026', false), false)|trim == 'true' %}\n    ${orderAnchor}`);
}

single = single.replace(
  'data-v42-order-payments="{{ vpp_order_payments }}"',
  'data-v42-order-payments="{{ vpp_order_payments }}" data-v42-order-enabled="{{ vpp_details_order_enabled ? \'true\' : \'false\' }}"'
);
if (!single.includes('data-v42-order-enabled=')) fail('Could not add order-enabled data attribute.');

// Replace related opening marker/config area with a version that carries explicit data values.
const relatedTagPattern = /<salla-products-slider\s+data-veloura-related-slider[\s\S]*?\n\s*source="\{\{ veloura_related_source \}\}"/m;
if (!relatedTagPattern.test(single)) fail('Could not locate related products slider opening tag.');
const relatedTag = `<salla-products-slider\n                data-veloura-related-slider\n                data-veloura-related-mobile="{{ vpp_related_mobile_columns }}"\n                data-veloura-related-desktop="{{ vpp_related_desktop_columns }}"\n                data-veloura-related-hide-arrows="{{ vpp_related_hide_arrows ? 'true' : 'false' }}"\n                data-veloura-related-center-title="{{ vpp_related_center_title ? 'true' : 'false' }}"\n                slider-config='{\n                  "slidesPerView": {{ vpp_related_mobile_columns|default(2) }},\n                  "spaceBetween": 12,\n                  "breakpoints": {\n                    "768": {\n                      "slidesPerView": {{ vpp_related_desktop_columns|default(4) }},\n                      "spaceBetween": 16\n                    }\n                  }\n                }'\n                source="{{ veloura_related_source }}"`;
single = single.replace(relatedTagPattern, relatedTag);

// -----------------------------------------------------------------------------
// master.twig: replace V43 with one deterministic V47 runtime.
// -----------------------------------------------------------------------------
master = removeMarkedBlock(master,
  '{# Veloura QV V43 native related slider and purchase button colors start #}',
  '{# Veloura QV V43 native related slider and purchase button colors end #}',
  'V43');
master = removeMarkedBlock(master,
  '{# Veloura QV V47 related desktop/order/buttons/footer start #}',
  '{# Veloura QV V47 related desktop/order/buttons/footer end #}',
  'V47');

const v47 = String.raw`
{# Veloura QV V47 related desktop/order/buttons/footer start #}
<style id="veloura-qv-v47-style-2026">
  .veloura-product-related-products,
  .veloura-product-related-products > salla-products-slider {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* A consistent breathing space before the footer, regardless of the last page section. */
  #app > footer,
  #app .store-footer,
  footer.store-footer {
    margin-top: 3rem !important;
  }

  /* The product purchase component always remains a full, visible interactive control. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    text-align: center !important;
    border-radius: var(--veloura-product-button-radius, 16px) !important;
    overflow: hidden !important;
    --color-primary: var(--veloura-product-button-bg, var(--color-primary, #004d65)) !important;
    --color-primary-reverse: var(--veloura-product-button-text, #ffffff) !important;
    --button-background-color: var(--veloura-product-button-bg, var(--color-primary, #004d65)) !important;
    --button-text-color: var(--veloura-product-button-text, #ffffff) !important;
  }
</style>
<script data-cfasync="false" id="veloura-qv-v47-runtime-2026">
(function () {
  'use strict';

  var desktopMedia = window.matchMedia('(min-width: 768px)');
  var relatedTimers = [];
  var buttonTimers = [];

  function intAttr(element, name, fallback, min, max) {
    var value = Number.parseInt(element && element.getAttribute(name), 10);
    if (!Number.isFinite(value)) value = fallback;
    return Math.min(max, Math.max(min, value));
  }

  function styleInRoot(root, id, css) {
    if (!root) return;
    var style = root.getElementById ? root.getElementById(id) : null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      root.appendChild(style);
    }
    style.textContent = css;
  }

  function innerSlider(host) {
    if (!host) return null;
    return (host.shadowRoot && host.shadowRoot.querySelector('salla-slider'))
      || host.querySelector('salla-slider')
      || null;
  }

  function configureSwiper(slider, current, config, space) {
    if (!slider) return false;

    try { slider.sliderConfig = config; } catch (e) {}
    try { slider.slidesPerView = String(current); } catch (e) {}
    slider.setAttribute('slider-config', JSON.stringify(config));
    slider.setAttribute('slides-per-view', String(current));

    var swiperNode = slider.shadowRoot && slider.shadowRoot.querySelector('.swiper');
    var swiper = slider.swiper || slider.swiperInstance || (swiperNode && swiperNode.swiper);
    if (swiper && swiper.params) {
      swiper.params.breakpoints = config.breakpoints;
      swiper.params.slidesPerView = current;
      swiper.params.spaceBetween = space;
      if (swiper.originalParams) {
        swiper.originalParams.breakpoints = config.breakpoints;
        swiper.originalParams.slidesPerView = config.slidesPerView;
        swiper.originalParams.spaceBetween = config.spaceBetween;
      }
      if (typeof swiper.setBreakpoint === 'function') {
        swiper.currentBreakpoint = false;
        swiper.setBreakpoint();
        // Force the saved current viewport value after Swiper resolves its breakpoint.
        swiper.params.slidesPerView = current;
        swiper.params.spaceBetween = space;
      }
      if (typeof swiper.update === 'function') swiper.update();
    }
    if (typeof slider.update === 'function') {
      try { slider.update(); } catch (e) {}
    }
    return true;
  }

  function configureRelated() {
    var host = document.querySelector('.veloura-product-related-products salla-products-slider[data-veloura-related-slider]');
    if (!host) return false;

    var mobile = intAttr(host, 'data-veloura-related-mobile', 2, 1, 3);
    var desktop = intAttr(host, 'data-veloura-related-desktop', 4, 1, 6);
    var hideArrows = host.getAttribute('data-veloura-related-hide-arrows') === 'true';
    var centerTitle = host.getAttribute('data-veloura-related-center-title') === 'true';
    var current = desktopMedia.matches ? desktop : mobile;
    var space = desktopMedia.matches ? 16 : 12;
    var config = {
      slidesPerView: mobile,
      spaceBetween: 12,
      breakpoints: {768: {slidesPerView: desktop, spaceBetween: 16}}
    };

    var slider = innerSlider(host);
    if (!slider) return false;

    slider.showControls = !hideArrows;
    if (hideArrows) slider.setAttribute('show-controls', 'false');
    else slider.removeAttribute('show-controls');

    configureSwiper(slider, current, config, space);

    var rootCss = '';
    if (hideArrows) {
      rootCss += '.swiper-button-next,.swiper-button-prev,.s-slider-next,.s-slider-prev,[class*="slider-next"],[class*="slider-prev"],[class*="slider-arrows"]{display:none!important;visibility:hidden!important}';
    }
    if (centerTitle) {
      rootCss += '.s-slider-block__title{justify-content:center!important;text-align:center!important}.s-slider-block__title h2,.s-slider-block__title-left{margin-inline:auto!important;text-align:center!important;justify-content:center!important}';
    }
    styleInRoot(host.shadowRoot, 'veloura-v47-related-host-style', rootCss);
    styleInRoot(slider.shadowRoot, 'veloura-v47-related-slider-style', rootCss);
    host.classList.toggle('veloura-related-title-centered', centerTitle);
    host.classList.toggle('veloura-related-arrows-hidden', hideArrows);
    return true;
  }

  function scheduleRelated() {
    relatedTimers.forEach(window.clearTimeout);
    relatedTimers = [0, 80, 220, 600, 1300].map(function (delay) {
      return window.setTimeout(configureRelated, delay);
    });
  }

  function colorValue(style, name, fallback) {
    var value = style.getPropertyValue(name).trim();
    return value || fallback;
  }

  function injectButton(button, id, background, text, outline, radius) {
    if (!button) return;
    button.style.setProperty('--color-primary', background, 'important');
    button.style.setProperty('--color-primary-reverse', text, 'important');
    button.style.setProperty('--button-background-color', outline ? 'transparent' : background, 'important');
    button.style.setProperty('--button-text-color', outline ? background : text, 'important');
    button.style.setProperty('--button-border-color', background, 'important');
    button.style.setProperty('width', '100%', 'important');
    button.style.setProperty('display', 'block', 'important');
    button.style.setProperty('border-radius', radius, 'important');
    if (!button.shadowRoot) return;
    var css = outline
      ? 'button,.s-button-element,.s-button-btn{display:flex!important;width:100%!important;justify-content:center!important;align-items:center!important;background:transparent!important;background-color:transparent!important;border:1px solid ' + background + '!important;border-radius:' + radius + '!important;color:' + background + '!important;opacity:1!important;visibility:visible!important}button *,.s-button-element *,.s-button-btn *{color:' + background + '!important;fill:' + background + '!important}'
      : 'button,.s-button-element,.s-button-btn{display:flex!important;width:100%!important;justify-content:center!important;align-items:center!important;background:' + background + '!important;background-color:' + background + '!important;border:1px solid ' + background + '!important;border-radius:' + radius + '!important;color:' + text + '!important;opacity:1!important;visibility:visible!important}button *,.s-button-element *,.s-button-btn *{color:' + text + '!important;fill:' + text + '!important}';
    styleInRoot(button.shadowRoot, id, css);
  }

  function configurePurchaseButtons() {
    var host = document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button');
    if (!host) return false;

    var bodyStyle = getComputedStyle(document.body);
    var cartBg = colorValue(bodyStyle, '--veloura-product-button-bg', colorValue(bodyStyle, '--color-primary', '#004d65'));
    var cartText = colorValue(bodyStyle, '--veloura-product-button-text', '#ffffff');
    var storeBg = colorValue(bodyStyle, '--color-primary', '#004d65');
    var storeText = colorValue(bodyStyle, '--color-primary-reverse', '#ffffff');
    var radius = colorValue(bodyStyle, '--veloura-product-button-radius', '16px');

    host.style.setProperty('--color-primary', cartBg, 'important');
    host.style.setProperty('--color-primary-reverse', cartText, 'important');
    host.style.setProperty('--button-background-color', cartBg, 'important');
    host.style.setProperty('--button-text-color', cartText, 'important');
    host.style.setProperty('border-radius', radius, 'important');

    var root = host.shadowRoot;
    if (!root) return false;
    styleInRoot(root, 'veloura-v47-purchase-layout',
      '.s-add-product-button-main{display:block!important;width:100%!important;opacity:1!important;visibility:visible!important}' +
      '.s-add-product-button-main>salla-button{display:block!important;width:100%!important;min-height:44px!important;opacity:1!important;visibility:visible!important}' +
      'salla-quick-buy:not([hidden]),.s-add-product-button-mini-checkout:not([hidden]){width:100%!important;min-height:44px!important;opacity:1!important;visibility:visible!important;margin-top:8px!important}'
    );

    var cart = root.querySelector('.s-add-product-button-main > salla-button');
    injectButton(cart, 'veloura-v47-cart-surface', cartBg, cartText, false, radius);

    root.querySelectorAll('salla-quick-buy, .s-add-product-button-mini-checkout').forEach(function (quick) {
      injectButton(quick, 'veloura-v47-buy-now-surface', storeBg, storeText, true, radius);
    });
    return true;
  }

  function scheduleButtons() {
    buttonTimers.forEach(window.clearTimeout);
    buttonTimers = [0, 80, 220, 600, 1300].map(function (delay) {
      return window.setTimeout(configurePurchaseButtons, delay);
    });
  }

  function selectorGroup(element) {
    if (element.matches('.product-brand, h1, .veloura-product-category-under-title, .product-entry__sub-title')) return 'title';
    if (element.matches('.veloura-product-header-price, salla-rating-stars, small.color-grey')) return 'price';
    if (element.matches('.veloura-product-stock-radar, .veloura-product-discount-countdown')) return 'status';
    if (element.matches('.veloura-product-coupon')) return 'coupon';
    if (element.matches('.product__description')) return 'description';
    if (element.matches('.veloura-product-original-purchase-count, .veloura-product-sku-card, salla-metadata')) return 'data';
    if (element.matches('form.product-form')) return 'options';
    if (element.matches('salla-quick-order')) return 'quick';
    if (element.matches('.veloura-product-payment-methods')) return 'payments';
    if (element.matches('digital-files-settings')) return 'extras';
    if (element.matches('section') && element.querySelector('[onclick*="scopes::open"]')) return 'extras';
    if (element.matches('.mb-3') && element.querySelector('a[href]')) return 'data';
    return '';
  }

  function syncDetailsOrder() {
    var page = document.querySelector('.veloura-product-page');
    var main = page && page.querySelector('.main-content');
    if (!page || !main) return;

    // Always remove V42's previous result first. This makes the switch a true reset.
    main.classList.remove('veloura-v42-details-order');
    main.removeAttribute('data-veloura-v42-ordered');
    delete main.dataset.velouraV42Ordered;
    Array.prototype.forEach.call(main.children, function (element) {
      element.style.removeProperty('order');
      delete element.dataset.velouraV42OrderGroup;
    });

    if (page.getAttribute('data-v42-order-enabled') !== 'true') return;

    var orders = {
      title: intAttr(page, 'data-v42-order-title', 1, 1, 10),
      price: intAttr(page, 'data-v42-order-price', 2, 1, 10),
      status: intAttr(page, 'data-v42-order-status', 3, 1, 10),
      coupon: intAttr(page, 'data-v42-order-coupon', 4, 1, 10),
      description: intAttr(page, 'data-v42-order-description', 5, 1, 10),
      data: intAttr(page, 'data-v42-order-data', 6, 1, 10),
      extras: intAttr(page, 'data-v42-order-extras', 7, 1, 10),
      options: intAttr(page, 'data-v42-order-options', 8, 1, 10),
      quick: intAttr(page, 'data-v42-order-quick', 9, 1, 10),
      payments: intAttr(page, 'data-v42-order-payments', 10, 1, 10)
    };

    main.classList.add('veloura-v42-details-order');
    var lastGroup = 'title';
    Array.prototype.forEach.call(main.children, function (element, index) {
      var explicit = selectorGroup(element);
      var group = explicit || lastGroup;
      if (explicit) lastGroup = explicit;
      element.dataset.velouraV42OrderGroup = group;
      element.style.setProperty('order', String(orders[group] * 100 + index), 'important');
    });
    main.dataset.velouraV42Ordered = '1';
  }

  function run() {
    syncDetailsOrder();
    scheduleRelated();
    scheduleButtons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once: true});
  else run();
  document.addEventListener('theme::ready', run);
  document.addEventListener('salla::products::loaded', scheduleRelated);
  document.addEventListener('salla::product.cards::loaded', scheduleRelated);
  document.addEventListener('salla::product::details::loaded', scheduleButtons);
  document.addEventListener('product::price.updated', scheduleButtons);

  function onDesktopChange() { scheduleRelated(); }
  if (desktopMedia.addEventListener) desktopMedia.addEventListener('change', onDesktopChange);
  else if (desktopMedia.addListener) desktopMedia.addListener(onDesktopChange);
})();
</script>
{# Veloura QV V47 related desktop/order/buttons/footer end #}
`;

const hook = "{% hook 'head:end' %}";
if (!master.includes(hook)) fail("Could not locate head:end hook in master.twig.");
master = master.replace(hook, v47 + '\n' + hook);

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');
write(singlePath, single);
write(masterPath, master);

console.log('twilight.json: OK');
console.log('Quick View V47 installed correctly.');
console.log('Desktop and mobile related-product counts are applied to the hydrated inner Salla slider and its Swiper instance.');
console.log('Product-detail ordering is opt-in and disabling its switch restores the native order.');
console.log('Related arrows/title controls, purchase button surfaces and a 3rem footer gap are active.');
