const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v48-' + timestamp());

const V47_START = '{# Veloura QV V47 related desktop/order/buttons/footer start #}';
const V47_END = '{# Veloura QV V47 related desktop/order/buttons/footer end #}';
const V48_START = '{# Veloura QV V48 thumbs/buttons/order/separators start #}';
const V48_END = '{# Veloura QV V48 thumbs/buttons/order/separators end #}';

const ORDER_TITLE = 'veloura_product_details_order_title_2026';
const ORDER_INTRO = 'veloura_product_details_order_intro_2026';
const ORDER_ENABLED = 'veloura_product_details_order_enabled_2026';
const ORDER_FIELD_IDS = [
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
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function backup(file, relative) {
  fs.mkdirSync(path.dirname(path.join(backupDir, relative)), { recursive: true });
  fs.copyFileSync(file, path.join(backupDir, relative));
}
function stripMarkedBlock(source, start, end, label) {
  let result = source;
  while (result.includes(start) || result.includes(end)) {
    const a = result.indexOf(start);
    const b = result.indexOf(end);
    if (a < 0 || b < 0 || b < a) fail(`Incomplete ${label} block.`);
    result = result.slice(0, a) + result.slice(b + end.length);
  }
  return result;
}
function findAll(value, id, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item && typeof item === 'object' && item.id === id) output.push({ item, parent: value, index });
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
function condition(id, value) { return { id, operation: '=', value }; }
function setConditions(setting, conditions) {
  if (!setting || typeof setting !== 'object') return;
  setting.conditions = conditions;
}
function replaceClassMethod(content, methodName, replacement) {
  const token = `    ${methodName}(`;
  const start = content.indexOf(token);
  if (start < 0) return null;

  const brace = content.indexOf('{', start);
  if (brace < 0) fail(`Could not locate opening brace for ${methodName}().`);

  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = brace; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return content.slice(0, start) + replacement + content.slice(i + 1);
    }
  }
  fail(`Could not locate closing brace for ${methodName}().`);
}

let twilight;
try { twilight = JSON.parse(read(twilightPath)); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }
let master = read(masterPath);
let single = read(singlePath);
let productJs = read(productJsPath);

backup(twilightPath, 'twilight.json');
backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

// -----------------------------------------------------------------------------
// 1) Settings UI: a standalone title above the switch; ordering fields only
//    appear while the switch is enabled.
// -----------------------------------------------------------------------------
const productSettings = findArrayContaining(twilight, ORDER_ENABLED)
  || findArrayContaining(twilight, ORDER_TITLE)
  || findArrayContaining(twilight, ORDER_FIELD_IDS[0]);
if (!Array.isArray(productSettings)) fail('Could not locate product-detail ordering settings.');

const savedSwitch = findAll(twilight, ORDER_ENABLED)[0]?.item || {};
const titleExisting = findAll(twilight, ORDER_TITLE)[0]?.item || {};
removeIds(twilight, [ORDER_TITLE, ORDER_INTRO, ORDER_ENABLED]);

const firstOrderIndex = productSettings.findIndex(item => item && ORDER_FIELD_IDS.includes(item.id));
if (firstOrderIndex < 0) fail('Could not locate first product-detail order field.');

const pageCondition = condition('veloura_product_page_panel_open_2026', true);
const titleSetting = {
  id: ORDER_TITLE,
  type: 'static',
  format: 'title',
  value: titleExisting.value || '<div style="width:100%;padding:10px 14px;border-radius:14px;background:#eef2ff;color:#3730a3;text-align:right;font-weight:800;border-right:4px solid #6366f1"><span>ترتيب تفاصيل المنتج</span><div style="font-size:12px;font-weight:500;opacity:.8;margin-top:4px">فعّل التخصيص ثم اختر ترتيب العناصر</div></div>',
  variant: titleExisting.variant || 'h6',
  conditions: [pageCondition]
};
const introSetting = {
  id: ORDER_INTRO,
  type: 'static',
  format: 'description',
  label: ' ',
  value: '<div style="height:1px;opacity:.001;pointer-events:none"></div>',
  required: false,
  conditions: [pageCondition]
};
const switchSetting = {
  id: ORDER_ENABLED,
  type: 'boolean',
  format: 'switch',
  icon: 'sicon-toggle-off',
  label: 'تفعيل تخصيص ترتيب عناصر تفاصيل المنتج',
  description: 'عند إيقافه يُلغى تأثير الترتيب فورًا وتعود الصفحة إلى ترتيبها الأصلي.',
  required: false,
  value: savedSwitch.value === true || savedSwitch.selected === true,
  selected: savedSwitch.selected === true || savedSwitch.value === true,
  conditions: [pageCondition]
};
productSettings.splice(firstOrderIndex, 0, titleSetting, introSetting, switchSetting);

for (const id of ORDER_FIELD_IDS) {
  const entries = findAll(twilight, id);
  if (entries.length !== 1) fail(`${id}: expected exactly one setting, found ${entries.length}.`);
  setConditions(entries[0].item, [pageCondition, condition(ORDER_ENABLED, true)]);
}

// -----------------------------------------------------------------------------
// 2) Product JS: restore horizontal thumbnail movement and remove the old
//    width:0 purchase-button normalization.
// -----------------------------------------------------------------------------
const thumbsMethod = `    initVelouraProductThumbnails() {
        const page = document.querySelector('.veloura-product-page');
        const slider = page?.querySelector('salla-slider.details-slider.image-slider');
        const nativeThumbs = slider?.querySelector(':scope > [slot="thumbs"]');

        if (!page || !slider || !nativeThumbs || slider.dataset.velouraV48ThumbsReady === '1') {
            return;
        }

        slider.dataset.velouraV48ThumbsReady = '1';
        slider.dataset.velouraV42ThumbsReady = '1';
        slider.dataset.velouraThumbsReady = '1';
        nativeThumbs.hidden = false;
        nativeThumbs.classList.remove('veloura-v41-native-thumbs');
        nativeThumbs.classList.add('veloura-v42-native-thumbs', 'veloura-v48-scrollable-thumbs');

        slider.removeAttribute('vertical-thumbs');
        slider.removeAttribute('thumbs-position');
        slider.removeAttribute('data-veloura-thumbs-layout');

        const horizontalConfig = {
            direction: 'horizontal',
            slidesPerView: 'auto',
            spaceBetween: 12,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            allowTouchMove: true,
            freeMode: { enabled: true, sticky: false },
        };

        slider.setAttribute('thumbs-config', JSON.stringify(horizontalConfig));
        nativeThumbs.style.setProperty('display', 'flex', 'important');
        nativeThumbs.style.setProperty('flex-wrap', 'nowrap', 'important');
        nativeThumbs.style.setProperty('gap', '12px', 'important');
        nativeThumbs.style.setProperty('width', '100%', 'important');
        nativeThumbs.style.setProperty('max-width', '100%', 'important');
        nativeThumbs.style.setProperty('overflow-x', 'auto', 'important');
        nativeThumbs.style.setProperty('overflow-y', 'hidden', 'important');
        nativeThumbs.style.setProperty('touch-action', 'pan-x', 'important');
        nativeThumbs.style.setProperty('scroll-behavior', 'smooth', 'important');
        nativeThumbs.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        Array.from(nativeThumbs.children).forEach((thumb) => {
            thumb.style.setProperty('flex', '0 0 auto', 'important');
            thumb.style.removeProperty('transform');
        });

        let pointerDown = false;
        let moved = false;
        let startX = 0;
        let startScroll = 0;
        nativeThumbs.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            pointerDown = true;
            moved = false;
            startX = event.clientX;
            startScroll = nativeThumbs.scrollLeft;
            try { nativeThumbs.setPointerCapture(event.pointerId); } catch (error) {}
        });
        nativeThumbs.addEventListener('pointermove', (event) => {
            if (!pointerDown) return;
            const delta = event.clientX - startX;
            if (Math.abs(delta) > 4) moved = true;
            if (moved) nativeThumbs.scrollLeft = startScroll - delta;
        });
        const release = () => { pointerDown = false; };
        nativeThumbs.addEventListener('pointerup', release);
        nativeThumbs.addEventListener('pointercancel', release);
        nativeThumbs.addEventListener('pointerleave', release);
        nativeThumbs.addEventListener('click', (event) => {
            if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; }
        }, true);

        const apply = () => {
            try {
                slider.verticalThumbs = false;
                slider.thumbsConfig = horizontalConfig;
                const root = slider.shadowRoot;
                const candidates = root ? root.querySelectorAll('.swiper, [class*="thumb"] .swiper, .swiper-thumbs') : [];
                candidates.forEach((node) => {
                    const swiper = node.swiper;
                    if (!swiper || !swiper.params) return;
                    swiper.allowTouchMove = true;
                    swiper.params.allowTouchMove = true;
                    swiper.params.watchOverflow = false;
                    swiper.params.slidesPerView = 'auto';
                    swiper.params.spaceBetween = 12;
                    swiper.params.freeMode = { enabled: true, sticky: false };
                    if (swiper.originalParams) {
                        swiper.originalParams.allowTouchMove = true;
                        swiper.originalParams.watchOverflow = false;
                        swiper.originalParams.slidesPerView = 'auto';
                        swiper.originalParams.spaceBetween = 12;
                        swiper.originalParams.freeMode = { enabled: true, sticky: false };
                    }
                    if (typeof swiper.update === 'function') swiper.update();
                });
            } catch (error) {
                console.warn('Veloura horizontal thumbnails recovery failed:', error);
            }
        };

        if (window.customElements?.whenDefined) {
            window.customElements.whenDefined('salla-slider').then(() => {
                apply();
                window.setTimeout(apply, 160);
                window.setTimeout(apply, 650);
            }).catch(apply);
        } else {
            apply();
        }
    }`;

const purchaseMethod = `    initVelouraPurchaseButtons() {
        const component = document.querySelector(
            '.veloura-product-page salla-add-product-button.sticky-product-bar__btn'
        );

        if (!component || component.dataset.velouraV48PurchaseReady === '1') {
            return;
        }
        component.dataset.velouraV48PurchaseReady = '1';

        let frame = 0;
        const normalize = () => {
            frame = 0;
            const root = component.shadowRoot || component;
            const main = root.querySelector('.s-add-product-button-main');
            if (!main) return;

            const children = Array.from(main.children).filter((child) => {
                const style = window.getComputedStyle(child);
                return !child.hidden && style.display !== 'none';
            });
            const columns = Math.max(1, children.length);

            main.style.setProperty('display', 'grid', 'important');
            main.style.setProperty('grid-template-columns', 'repeat(' + columns + ', minmax(0, 1fr))', 'important');
            main.style.setProperty('align-items', 'stretch', 'important');
            main.style.setProperty('width', '100%', 'important');
            main.style.setProperty('gap', '10px', 'important');
            main.style.setProperty('direction', 'rtl', 'important');

            children.forEach((child) => {
                child.style.removeProperty('flex');
                child.style.setProperty('width', '100%', 'important');
                child.style.setProperty('min-width', '0', 'important');
                child.style.setProperty('max-width', '100%', 'important');
                child.style.setProperty('opacity', '1', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
            });
        };

        const schedule = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(normalize);
        };

        normalize();
        window.setTimeout(normalize, 120);
        window.setTimeout(normalize, 500);
        window.setTimeout(normalize, 1200);

        const observeRoot = component.shadowRoot || component;
        const observer = new MutationObserver(schedule);
        observer.observe(observeRoot, { childList: true, subtree: true });
    }`;

let replaced = replaceClassMethod(productJs, 'initVelouraProductThumbnails', thumbsMethod);
if (replaced) productJs = replaced;
else {
  const anchor = '    initProductOptionValidations() {';
  if (!productJs.includes(anchor)) fail('Could not add initVelouraProductThumbnails() to product.js.');
  productJs = productJs.replace(anchor, thumbsMethod + '\n\n' + anchor);
}
if (!productJs.includes('this.initVelouraProductThumbnails();')) {
  const stateCall = '        this.initVelouraProductPageState();';
  if (!productJs.includes(stateCall)) fail('Could not add thumbnail initialization call.');
  productJs = productJs.replace(stateCall, stateCall + '\n        this.initVelouraProductThumbnails();');
}
replaced = replaceClassMethod(productJs, 'initVelouraPurchaseButtons', purchaseMethod);
if (!replaced) fail('Could not replace initVelouraPurchaseButtons() in product.js.');
productJs = replaced;

// -----------------------------------------------------------------------------
// 3) Master runtime: robust button colors/surfaces, true order reset, scrollable
//    thumbnail CSS, and subtle separators in the mobile sticky purchase bar.
// -----------------------------------------------------------------------------
master = stripMarkedBlock(master, V47_START, V47_END, 'V47');
master = stripMarkedBlock(master, V48_START, V48_END, 'V48');

const v48 = String.raw`
{# Veloura QV V48 thumbs/buttons/order/separators start #}
<style id="veloura-qv-v48-style-2026">
  /* Native horizontal thumbnail track: mouse, touch and trackpad remain movable. */
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v48-scrollable-thumbs {
    display: flex !important;
    flex-wrap: nowrap !important;
    gap: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    touch-action: pan-x !important;
    overscroll-behavior-inline: contain !important;
    scroll-behavior: smooth !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v48-scrollable-thumbs::-webkit-scrollbar {
    display: none !important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v48-scrollable-thumbs > * {
    flex: 0 0 auto !important;
    cursor: grab !important;
    user-select: none !important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v48-scrollable-thumbs:active > * {
    cursor: grabbing !important;
  }

  /* Full-width, visible and clickable purchase component. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    overflow: visible !important;
  }

  /* A hard native-order reset whenever customization is disabled. */
  .veloura-product-page[data-v42-order-enabled="false"] .main-content:not(.veloura-v42-details-order) {
    display: block !important;
  }

  /* Breathing space before the footer. */
  #app > footer,
  #app .store-footer,
  footer.store-footer {
    margin-top: 3rem !important;
  }

  /* Soft section dividers only in the fixed mobile purchase bar. */
  @media (max-width: 640px) {
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar > .veloura-product-cart-price-row,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar > .sticky-product-bar__quantity {
      position: relative !important;
      padding-bottom: 10px !important;
      margin-bottom: 10px !important;
    }
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar > .veloura-product-cart-price-row::after,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar > .sticky-product-bar__quantity::after {
      content: "" !important;
      position: absolute !important;
      inset-inline: 3% !important;
      bottom: 0 !important;
      height: 1px !important;
      background: rgba(15, 23, 42, .10) !important;
      pointer-events: none !important;
    }
  }
</style>
<script data-cfasync="false" id="veloura-qv-v48-runtime-2026">
(function () {
  'use strict';

  var orderFrame = 0;
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

  function normalizeColor(value, fallback) {
    value = String(value || '').trim();
    if (!value) return fallback;
    if (/^(#|rgb\(|rgba\(|hsl\(|hsla\(|lab\(|lch\(|oklab\(|oklch\(|color\(|var\()/i.test(value)) return value;
    if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%(?:\s*\/\s*[\d.]+%?)?$/.test(value)) return 'hsl(' + value + ')';
    if (/^[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+/.test(value)) return 'rgb(' + value + ')';
    return fallback;
  }

  function themeColors() {
    var style = getComputedStyle(document.body || document.documentElement);
    var primary = normalizeColor(style.getPropertyValue('--color-primary'), '#004d65');
    return {
      cartBg: normalizeColor(style.getPropertyValue('--veloura-product-button-bg'), primary),
      cartText: normalizeColor(style.getPropertyValue('--veloura-product-button-text'), '#ffffff'),
      primary: primary,
      primaryText: normalizeColor(style.getPropertyValue('--color-primary-reverse'), '#ffffff'),
      radius: style.getPropertyValue('--veloura-product-button-radius').trim() || '16px'
    };
  }

  function paintSallaButton(button, id, background, text, outline, radius) {
    if (!button) return;
    var surface = outline ? 'transparent' : background;
    var foreground = outline ? background : text;
    button.style.setProperty('--color-primary', background, 'important');
    button.style.setProperty('--color-primary-reverse', text, 'important');
    button.style.setProperty('--button-background-color', surface, 'important');
    button.style.setProperty('--button-text-color', foreground, 'important');
    button.style.setProperty('--button-border-color', background, 'important');
    button.style.setProperty('display', 'block', 'important');
    button.style.setProperty('width', '100%', 'important');
    button.style.setProperty('min-width', '0', 'important');
    button.style.setProperty('max-width', '100%', 'important');
    button.style.setProperty('opacity', '1', 'important');
    button.style.setProperty('visibility', 'visible', 'important');
    button.style.setProperty('pointer-events', 'auto', 'important');
    button.style.setProperty('border-radius', radius, 'important');

    if (!button.shadowRoot) return;
    var css = [
      ':host{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}',
      'button,.s-button-element,.s-button-btn,.s-button-wrap{display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:44px!important;align-items:center!important;justify-content:center!important;gap:7px!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;cursor:pointer!important;box-sizing:border-box!important;background:' + surface + '!important;background-color:' + surface + '!important;border:1px solid ' + background + '!important;border-radius:' + radius + '!important;color:' + foreground + '!important}',
      'button *,.s-button-element *,.s-button-btn *,.s-button-wrap *{color:' + foreground + '!important;fill:' + foreground + '!important}',
      'button[disabled],.s-button-element[disabled]{opacity:.55!important;cursor:not-allowed!important}'
    ].join('');
    styleInRoot(button.shadowRoot, id, css);
  }

  function configurePurchaseButtons() {
    var host = document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn');
    if (!host) return false;
    var colors = themeColors();
    var root = host.shadowRoot;

    host.style.setProperty('display', 'block', 'important');
    host.style.setProperty('width', '100%', 'important');
    host.style.setProperty('min-width', '0', 'important');
    host.style.setProperty('max-width', '100%', 'important');
    host.style.setProperty('opacity', '1', 'important');
    host.style.setProperty('visibility', 'visible', 'important');
    host.style.setProperty('pointer-events', 'auto', 'important');

    if (!root) return false;
    var main = root.querySelector('.s-add-product-button-main');
    if (main) {
      var visible = Array.prototype.filter.call(main.children, function (child) {
        return !child.hidden && getComputedStyle(child).display !== 'none';
      });
      main.style.setProperty('display', 'grid', 'important');
      main.style.setProperty('grid-template-columns', 'repeat(' + Math.max(1, visible.length) + ', minmax(0, 1fr))', 'important');
      main.style.setProperty('gap', '10px', 'important');
      main.style.setProperty('width', '100%', 'important');
      main.style.setProperty('align-items', 'stretch', 'important');
      visible.forEach(function (child) {
        child.style.removeProperty('flex');
        child.style.setProperty('width', '100%', 'important');
        child.style.setProperty('min-width', '0', 'important');
        child.style.setProperty('max-width', '100%', 'important');
        child.style.setProperty('opacity', '1', 'important');
        child.style.setProperty('visibility', 'visible', 'important');
      });
    }

    styleInRoot(root, 'veloura-v48-purchase-root',
      '.s-add-product-button-main{display:grid!important;width:100%!important;grid-auto-columns:minmax(0,1fr)!important;align-items:stretch!important;gap:10px!important;opacity:1!important;visibility:visible!important}' +
      '.s-add-product-button-main>*{width:100%!important;min-width:0!important;max-width:100%!important;opacity:1!important;visibility:visible!important}' +
      '@media(max-width:640px){.s-add-product-button-main>*+*{position:relative!important}.s-add-product-button-main>*+*::before{content:""!important;position:absolute!important;inset-block:18%!important;inset-inline-start:-5px!important;width:1px!important;background:rgba(15,23,42,.12)!important;pointer-events:none!important}}'
    );

    var buttons = Array.prototype.slice.call(root.querySelectorAll('salla-button'));
    if (buttons.length) paintSallaButton(buttons[0], 'veloura-v48-cart-surface', colors.cartBg, colors.cartText, false, colors.radius);
    buttons.slice(1).forEach(function (button, index) {
      paintSallaButton(button, 'veloura-v48-buy-surface-' + index, colors.primary, colors.primaryText, true, colors.radius);
    });

    root.querySelectorAll('salla-mini-checkout-widget, salla-quick-buy, .s-add-product-button-mini-checkout').forEach(function (button, index) {
      paintSallaButton(button, 'veloura-v48-mini-checkout-' + index, colors.primary, colors.primaryText, true, colors.radius);
    });
    return true;
  }

  function scheduleButtons() {
    buttonTimers.forEach(window.clearTimeout);
    buttonTimers = [0, 80, 220, 650, 1400].map(function (delay) {
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

  function resetDetailsOrder(page, main) {
    main.classList.remove('veloura-v42-details-order');
    main.removeAttribute('data-veloura-v42-ordered');
    delete main.dataset.velouraV42Ordered;
    Array.prototype.forEach.call(main.children, function (element) {
      element.style.removeProperty('order');
      delete element.dataset.velouraV42OrderGroup;
    });
  }

  function syncDetailsOrder() {
    orderFrame = 0;
    var page = document.querySelector('.veloura-product-page');
    var main = page && page.querySelector('.main-content');
    if (!page || !main) return;

    resetDetailsOrder(page, main);
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

  function scheduleOrder() {
    if (orderFrame) return;
    orderFrame = window.requestAnimationFrame(syncDetailsOrder);
  }

  function run() {
    scheduleOrder();
    scheduleButtons();
    window.setTimeout(scheduleOrder, 120);
    window.setTimeout(scheduleOrder, 550);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  document.addEventListener('theme::ready', run);
  document.addEventListener('salla::product::details::loaded', run);
  document.addEventListener('product::price.updated', scheduleButtons);

  var page = document.querySelector('.veloura-product-page');
  if (page) {
    var observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) {
        return mutation.type === 'attributes' && mutation.attributeName === 'data-v42-order-enabled';
      })) scheduleOrder();
    });
    observer.observe(page, { attributes: true, attributeFilter: ['data-v42-order-enabled'] });
  }
})();
</script>
{# Veloura QV V48 thumbs/buttons/order/separators end #}
`;

const hook = "{% hook 'head:end' %}";
if (!master.includes(hook)) fail("Could not locate head:end hook in master.twig.");
master = master.replace(hook, v48 + '\n' + hook);

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');
write(masterPath, master);
write(singlePath, single);
write(productJsPath, productJs);

console.log('twilight.json: OK');
console.log('Quick View V48 installed correctly.');
console.log('Product thumbnails are horizontally movable again by touch, mouse drag and trackpad.');
console.log('Add to cart keeps its customized background, radius and centered text; Buy Now remains a primary outline.');
console.log('Turning off detail ordering fully restores native order, and the section title stays above the switch.');
console.log('The fixed mobile purchase bar now has subtle section and tab dividers.');
