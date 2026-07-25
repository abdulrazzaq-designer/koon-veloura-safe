const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v42-' + timestamp());

const V41_START = '{# Veloura QV V41 sticky state and custom right thumbnails start #}';
const V41_END = '{# Veloura QV V41 sticky state and custom right thumbnails end #}';
const V42_START = '{# Veloura QV V42 product details order, related columns and compact sticky start #}';
const V42_END = '{# Veloura QV V42 product details order, related columns and compact sticky end #}';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function backup(file, relativeName) {
  const target = path.join(backupDir, relativeName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}
function walk(value, callback) {
  if (Array.isArray(value)) {
    callback(value);
    value.forEach(item => walk(item, callback));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach(child => walk(child, callback));
}
function removeSettingById(value, id) {
  walk(value, array => {
    for (let i = array.length - 1; i >= 0; i -= 1) {
      if (array[i] && typeof array[i] === 'object' && array[i].id === id) array.splice(i, 1);
    }
  });
}
function findSetting(value, id) {
  let result = null;
  walk(value, array => {
    if (result) return;
    const item = array.find(entry => entry && typeof entry === 'object' && entry.id === id);
    if (item) result = item;
  });
  return result;
}
function findContainer(value, id) {
  let result = null;
  walk(value, array => {
    if (result) return;
    const index = array.findIndex(entry => entry && typeof entry === 'object' && entry.id === id);
    if (index >= 0) result = { array, index };
  });
  return result;
}
function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) fail(`Could not locate ${label}.`);
  return content.replace(search, replacement);
}
function replaceMethod(content, methodName, replacement) {
  const token = `    ${methodName}() {`;
  const start = content.indexOf(token);
  if (start < 0) return null;
  const nextMethod = /^    [A-Za-z_$][\w$]*\([^\n]*\) \{/gm;
  nextMethod.lastIndex = start + token.length;
  const match = nextMethod.exec(content);
  if (!match) fail(`Could not locate the method after ${methodName}().`);
  return content.slice(0, start) + replacement + '\n' + content.slice(match.index);
}
function condition(id, value) { return { id, operation: '=', value }; }
function orderOptions() {
  return Array.from({ length: 10 }, (_, index) => ({
    label: `الترتيب ${index + 1}`,
    value: String(index + 1),
    key: `veloura-v42-order-${index + 1}-2026`,
  }));
}
function orderSetting(id, label, selectedValue) {
  const options = orderOptions();
  return {
    id,
    type: 'items',
    format: 'dropdown-list',
    label,
    description: 'اختر موضع هذا العنصر. عند تكرار رقمين يحافظ الثيم على التسلسل الأصلي بينهما بدون إخفاء أي عنصر.',
    icon: 'sicon-list',
    source: 'Manual',
    required: false,
    value: String(selectedValue),
    default: String(selectedValue),
    selected: [options[selectedValue - 1]],
    options,
    conditions: [condition('veloura_product_page_panel_open_2026', true)],
  };
}
function sliderSetting(id, label, value, minimum, maximum) {
  return {
    id,
    type: 'number',
    format: 'slider',
    inputType: 'range',
    label,
    description: 'يتحكم بعدد البطاقات الظاهرة في الصف داخل قسم منتجات قد تعجبك.',
    icon: 'sicon-grid',
    value: String(value),
    default: String(value),
    required: false,
    step: '1',
    minimum: String(minimum),
    maximum: String(maximum),
    conditions: [
      condition('veloura_product_page_panel_open_2026', true),
      condition('veloura_product_hide_liked_products_2026', false),
      condition('veloura_product_custom_related_enabled_2026', true),
    ],
  };
}

const v42Block = `${V42_START}
<style id="veloura-qv-v42-product-page-style-2026">
  /* Product details become one sortable vertical list; runtime applies the requested order. */
  .veloura-product-page.veloura-product-enabled .main-content.veloura-v42-details-order {
    display: flex !important;
    flex-direction: column !important;
    min-width: 0 !important;
  }

  /* Coupon is a normal product-detail element directly before/after other ordered blocks. */
  .veloura-product-page .veloura-product-coupon {
    width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Related products: inherited variables are also consumed by styles injected into Salla shadow roots. */
  .veloura-product-related-products {
    --veloura-v42-related-count: var(--veloura-v42-related-desktop, 4);
    --veloura-v42-related-slide-width: calc((100% - var(--veloura-v42-related-gap-total, 48px)) / var(--veloura-v42-related-count));
  }
  .veloura-product-related-products .swiper-slide,
  .veloura-product-related-products salla-products-slider > *,
  .veloura-product-related-products salla-slider [slot="items"] > * {
    width: var(--veloura-v42-related-slide-width) !important;
    max-width: var(--veloura-v42-related-slide-width) !important;
    flex: 0 0 var(--veloura-v42-related-slide-width) !important;
    box-sizing: border-box !important;
  }
  @media (max-width: 767px) {
    .veloura-product-related-products {
      --veloura-v42-related-count: var(--veloura-v42-related-mobile, 2);
    }
  }

  @media (max-width: 640px) {
    html body.veloura-v42-sticky-enabled .veloura-v42-sticky-ancestor {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
      contain: none !important;
      isolation: auto !important;
      z-index: auto !important;
      clip-path: none !important;
      overflow: visible !important;
      will-change: auto !important;
    }

    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar {
      position: fixed !important;
      top: auto !important;
      z-index: 2147483000 !important;
      isolation: isolate !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: translate3d(0,0,0) !important;
      box-sizing: border-box !important;
    }

    /* Normal sticky mode remains edge-to-edge. */
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled:not(.veloura-product-buttons-compact)
    .sticky-product-bar.veloura-product-sticky-bar {
      inset-inline: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
    }

    /* Compact mode: a floating rounded card inside the viewport/container, raised from the bottom. */
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact
    .sticky-product-bar.veloura-product-sticky-bar {
      inset-inline: 12px !important;
      left: 12px !important;
      right: 12px !important;
      bottom: max(12px, env(safe-area-inset-bottom)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      margin: 0 auto !important;
      padding: 10px !important;
      border-radius: max(var(--veloura-product-radius, 22px), 22px) !important;
      overflow: hidden !important;
      box-shadow: 0 18px 45px rgba(15, 23, 42, .22), 0 2px 10px rgba(15, 23, 42, .10) !important;
    }

    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-buttons-compact
    .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-buttons-compact
    .sticky-product-bar.veloura-product-sticky-bar .sticky-product-bar__btn {
      min-height: 44px !important;
      border-radius: max(calc(var(--veloura-product-radius, 22px) - 8px), 14px) !important;
      overflow: hidden !important;
    }

    /* The sticky add-to-cart uses the store primary color, independent from product-card button colors. */
    .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button {
      --color-primary: var(--color-primary, #004d65) !important;
      --button-background-color: var(--color-primary, #004d65) !important;
      --button-text-color: #fff !important;
      color: #fff !important;
    }
    .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button::part(button) {
      background: var(--color-primary, #004d65) !important;
      border-color: var(--color-primary, #004d65) !important;
      color: #fff !important;
    }

    /* Disabled always means normal flow inside product details. */
    html body.veloura-v42-sticky-disabled
    .veloura-product-page.veloura-product-mobile-sticky-disabled
    .sticky-product-bar.veloura-product-sticky-bar,
    html body .veloura-product-page.veloura-product-mobile-sticky-disabled
    .sticky-product-bar.veloura-product-sticky-bar {
      position: static !important;
      inset: auto !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 16px 0 0 !important;
      z-index: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
    }

    html body.veloura-v42-sticky-disabled .product-single,
    html body.veloura-v42-sticky-disabled.is-sticky-product-bar.product-single {
      padding-bottom: 0 !important;
    }
    html body.veloura-v42-sticky-enabled .product-single {
      padding-bottom: var(--veloura-v42-sticky-space, 112px) !important;
    }

    /* Menus/modals remain the only layers above the purchase bar. */
    #mobile-menu,
    .mm-menu,
    .mm-wrapper__blocker,
    .mm-page__blocker,
    salla-sidebar,
    salla-modal,
    .s-modal-wrapper,
    [role="dialog"] {
      z-index: 2147483600 !important;
    }
  }
</style>
<script data-cfasync="false" id="veloura-qv-v42-product-page-runtime-2026">
(function () {
  'use strict';

  var mobileMedia = window.matchMedia('(max-width: 640px)');
  var relatedMedia = window.matchMedia('(max-width: 767px)');

  function numberAttr(element, name, fallback, min, max) {
    var value = Number.parseInt(element && element.getAttribute(name), 10);
    if (!Number.isFinite(value)) value = fallback;
    return Math.min(max, Math.max(min, value));
  }

  function injectPrimaryButtonStyle(bar) {
    var host = bar && bar.querySelector('salla-add-product-button');
    if (!host) return;
    host.style.setProperty('--color-primary', 'var(--color-primary, #004d65)');
    host.style.setProperty('--button-background-color', 'var(--color-primary, #004d65)');
    host.style.setProperty('--button-text-color', '#fff');

    if (!host.shadowRoot || host.shadowRoot.getElementById('veloura-v42-sticky-primary-button')) return;
    var style = document.createElement('style');
    style.id = 'veloura-v42-sticky-primary-button';
    style.textContent = [
      ':host{--color-primary:var(--color-primary,#004d65);--button-background-color:var(--color-primary,#004d65);--button-text-color:#fff}',
      'button:not(.s-button-outline),.s-button-primary,.s-button-element:not(.s-button-outline){background:var(--color-primary,#004d65)!important;border-color:var(--color-primary,#004d65)!important;color:#fff!important}',
      'button:not(.s-button-outline) *,.s-button-primary *,.s-button-element:not(.s-button-outline) *{color:#fff!important;fill:#fff!important}'
    ].join('');
    host.shadowRoot.appendChild(style);
  }

  function clearImportant(element, names) {
    names.forEach(function (name) { element.style.removeProperty(name); });
  }

  function syncSticky() {
    var page = document.querySelector('.veloura-product-page');
    var bar = page && page.querySelector('.veloura-product-sticky-bar');
    if (!page || !bar || !document.body) return;

    var raw = page.getAttribute('data-veloura-v42-sticky');
    var enabled = raw === 'true' || (raw !== 'false' && page.classList.contains('veloura-product-mobile-sticky-enabled'));
    var compact = page.classList.contains('veloura-product-buttons-compact');

    document.documentElement.classList.add('veloura-is-product-page');
    document.body.classList.add('veloura-is-product-page');
    document.body.classList.toggle('veloura-v42-sticky-enabled', enabled);
    document.body.classList.toggle('veloura-v42-sticky-disabled', !enabled);
    document.body.classList.toggle('veloura-product-sticky-active', enabled);

    var button = bar.querySelector('salla-add-product-button');
    if (button) {
      if (enabled) button.setAttribute('support-sticky-bar', '');
      else button.removeAttribute('support-sticky-bar');
    }
    injectPrimaryButtonStyle(bar);

    if (!enabled || !mobileMedia.matches) {
      document.body.classList.remove('is-sticky-product-bar');
      clearImportant(bar, ['position','inset','inset-inline','left','right','top','bottom','width','max-width','margin','z-index','transform','border-radius','padding']);
      document.body.style.removeProperty('--veloura-v42-sticky-space');
      return;
    }

    var parent = bar.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      parent.classList.add('veloura-v42-sticky-ancestor');
      ['transform','filter','perspective','contain','isolation','z-index','clip-path','overflow','will-change'].forEach(function (name) {
        var value = name === 'overflow' ? 'visible' : (name === 'isolation' ? 'auto' : (name === 'z-index' ? 'auto' : 'none'));
        parent.style.setProperty(name, value, 'important');
      });
      parent = parent.parentElement;
    }

    bar.style.setProperty('position', 'fixed', 'important');
    bar.style.setProperty('z-index', '2147483000', 'important');
    bar.style.setProperty('top', 'auto', 'important');
    bar.style.setProperty('transform', 'translate3d(0,0,0)', 'important');

    if (compact) {
      bar.style.setProperty('left', '12px', 'important');
      bar.style.setProperty('right', '12px', 'important');
      bar.style.setProperty('bottom', 'max(12px, env(safe-area-inset-bottom))', 'important');
      bar.style.setProperty('width', 'auto', 'important');
      bar.style.setProperty('max-width', 'calc(100vw - 24px)', 'important');
      bar.style.setProperty('margin', '0 auto', 'important');
    } else {
      bar.style.setProperty('left', '0', 'important');
      bar.style.setProperty('right', '0', 'important');
      bar.style.setProperty('bottom', '0', 'important');
      bar.style.setProperty('width', '100vw', 'important');
      bar.style.setProperty('max-width', '100vw', 'important');
      bar.style.setProperty('margin', '0', 'important');
    }

    window.requestAnimationFrame(function () {
      var extra = compact ? 28 : 8;
      document.body.style.setProperty('--veloura-v42-sticky-space', Math.ceil(bar.getBoundingClientRect().height + extra) + 'px');
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

  function applyDetailsOrder() {
    var page = document.querySelector('.veloura-product-page.veloura-product-enabled');
    var main = page && page.querySelector('.main-content');
    if (!page || !main || main.dataset.velouraV42Ordered === '1') return;

    var orders = {
      title: numberAttr(page, 'data-v42-order-title', 1, 1, 10),
      price: numberAttr(page, 'data-v42-order-price', 2, 1, 10),
      status: numberAttr(page, 'data-v42-order-status', 3, 1, 10),
      coupon: numberAttr(page, 'data-v42-order-coupon', 4, 1, 10),
      description: numberAttr(page, 'data-v42-order-description', 5, 1, 10),
      data: numberAttr(page, 'data-v42-order-data', 6, 1, 10),
      extras: numberAttr(page, 'data-v42-order-extras', 7, 1, 10),
      options: numberAttr(page, 'data-v42-order-options', 8, 1, 10),
      quick: numberAttr(page, 'data-v42-order-quick', 9, 1, 10),
      payments: numberAttr(page, 'data-v42-order-payments', 10, 1, 10)
    };

    main.classList.add('veloura-v42-details-order');
    var lastGroup = 'title';
    Array.prototype.forEach.call(main.children, function (element, originalIndex) {
      var group = selectorGroup(element) || lastGroup;
      if (selectorGroup(element)) lastGroup = group;
      element.dataset.velouraV42OrderGroup = group;
      element.style.setProperty('order', String(orders[group] * 100 + originalIndex), 'important');
    });
    main.dataset.velouraV42Ordered = '1';
  }

  function collectShadowRoots(node, output) {
    if (!node) return;
    if (node.shadowRoot && output.indexOf(node.shadowRoot) === -1) {
      output.push(node.shadowRoot);
      collectShadowRoots(node.shadowRoot, output);
    }
    if (!node.querySelectorAll) return;
    node.querySelectorAll('*').forEach(function (child) {
      if (child.shadowRoot && output.indexOf(child.shadowRoot) === -1) {
        output.push(child.shadowRoot);
        collectShadowRoots(child.shadowRoot, output);
      }
    });
  }

  function applyRelatedColumns() {
    var container = document.querySelector('.veloura-product-related-products');
    var host = container && container.querySelector('salla-products-slider');
    if (!container || !host) return false;

    var desktop = numberAttr(container, 'data-veloura-related-desktop', 4, 2, 6);
    var mobile = numberAttr(container, 'data-veloura-related-mobile', 2, 1, 3);
    var count = relatedMedia.matches ? mobile : desktop;
    var gap = relatedMedia.matches ? 12 : 16;
    var gapTotal = gap * Math.max(0, count - 1);
    var width = 'calc((100% - ' + gapTotal + 'px) / ' + count + ')';

    container.style.setProperty('--veloura-v42-related-desktop', String(desktop));
    container.style.setProperty('--veloura-v42-related-mobile', String(mobile));
    container.style.setProperty('--veloura-v42-related-count', String(count));
    container.style.setProperty('--veloura-v42-related-gap-total', gapTotal + 'px');
    container.style.setProperty('--veloura-v42-related-slide-width', width);
    host.style.setProperty('--veloura-v42-related-slide-width', width);

    var roots = [];
    collectShadowRoots(host, roots);
    roots.forEach(function (shadowRoot) {
      if (!shadowRoot.querySelector('.swiper, .swiper-slide, salla-slider')) return;
      var style = shadowRoot.getElementById('veloura-v42-related-columns-shadow');
      if (!style) {
        style = document.createElement('style');
        style.id = 'veloura-v42-related-columns-shadow';
        shadowRoot.appendChild(style);
      }
      style.textContent = '.swiper-slide{width:var(--veloura-v42-related-slide-width)!important;max-width:var(--veloura-v42-related-slide-width)!important;flex:0 0 var(--veloura-v42-related-slide-width)!important;box-sizing:border-box!important}';

      shadowRoot.querySelectorAll('.swiper').forEach(function (element) {
        var swiper = element.swiper;
        if (!swiper || !swiper.params) return;
        swiper.params.slidesPerView = 'auto';
        swiper.params.spaceBetween = gap;
        if (swiper.originalParams) {
          swiper.originalParams.slidesPerView = 'auto';
          swiper.originalParams.spaceBetween = gap;
        }
        if (typeof swiper.update === 'function') swiper.update();
      });
    });

    if (host.swiper && host.swiper.params) {
      host.swiper.params.slidesPerView = 'auto';
      host.swiper.params.spaceBetween = gap;
      if (typeof host.swiper.update === 'function') host.swiper.update();
    }

    return roots.length > 0;
  }

  function scheduleRelated() {
    [0, 100, 350, 900, 1800].forEach(function (delay) {
      window.setTimeout(applyRelatedColumns, delay);
    });
  }

  function run() {
    syncSticky();
    applyDetailsOrder();
    scheduleRelated();
    [120, 650].forEach(function (delay) {
      window.setTimeout(function () {
        syncSticky();
        applyDetailsOrder();
      }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  document.addEventListener('theme::ready', run);
  document.addEventListener('salla::products::loaded', scheduleRelated);
  document.addEventListener('salla::product.cards::loaded', scheduleRelated);
  window.addEventListener('pageshow', syncSticky, { passive: true });

  function onMobileChange() { syncSticky(); }
  function onRelatedChange() { scheduleRelated(); }
  if (mobileMedia.addEventListener) mobileMedia.addEventListener('change', onMobileChange);
  else if (mobileMedia.addListener) mobileMedia.addListener(onMobileChange);
  if (relatedMedia.addEventListener) relatedMedia.addEventListener('change', onRelatedChange);
  else if (relatedMedia.addListener) relatedMedia.addListener(onRelatedChange);

  if (window.MutationObserver) {
    var observerStarted = false;
    function startRelatedObserver() {
      if (observerStarted) return;
      var container = document.querySelector('.veloura-product-related-products');
      if (!container) return;
      observerStarted = true;
      var observer = new MutationObserver(function () { scheduleRelated(); });
      observer.observe(container, { childList: true, subtree: true });
      window.setTimeout(function () { observer.disconnect(); }, 5000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRelatedObserver, { once: true });
    else startRelatedObserver();
  }
})();
</script>
${V42_END}`;

const stateMethod = `    initVelouraProductPageState() {
        const page = document.querySelector('.veloura-product-page');

        if (!page) {
            return;
        }

        document.documentElement.classList.add('veloura-is-product-page');
        document.body.classList.add('veloura-is-product-page');

        const rawSticky = page.getAttribute('data-veloura-v42-sticky');
        const stickyEnabled =
            rawSticky === 'true' ||
            (rawSticky !== 'false' && page.classList.contains('veloura-product-mobile-sticky-enabled'));

        document.body.classList.toggle('veloura-v42-sticky-enabled', stickyEnabled);
        document.body.classList.toggle('veloura-v42-sticky-disabled', !stickyEnabled);
        document.body.classList.toggle('veloura-product-sticky-active', stickyEnabled);

        if (!stickyEnabled) {
            document.body.classList.remove('is-sticky-product-bar');
        }
    }`;

const thumbnailsMethod = `    initVelouraProductThumbnails() {
        const page = document.querySelector('.veloura-product-page');
        const slider = page?.querySelector('salla-slider.details-slider.image-slider');
        const nativeThumbs = slider?.querySelector(':scope > [slot="thumbs"]');

        if (!page || !slider || !nativeThumbs || slider.dataset.velouraV42ThumbsReady === '1') {
            return;
        }

        slider.dataset.velouraV42ThumbsReady = '1';
        slider.dataset.velouraThumbsReady = '1';
        nativeThumbs.hidden = false;
        nativeThumbs.classList.remove('veloura-v41-native-thumbs');
        nativeThumbs.classList.add('veloura-v42-native-thumbs');

        slider.removeAttribute('vertical-thumbs');
        slider.removeAttribute('thumbs-position');
        slider.removeAttribute('data-veloura-thumbs-layout');

        const horizontalConfig = {
            direction: 'horizontal',
            slidesPerView: 'auto',
            spaceBetween: 12,
            watchSlidesProgress: true,
        };

        slider.setAttribute('thumbs-config', JSON.stringify(horizontalConfig));

        const apply = () => {
            try {
                slider.verticalThumbs = false;
                slider.thumbsConfig = horizontalConfig;
                if (typeof slider.update === 'function') slider.update();
            } catch (error) {
                console.warn('Veloura thumbnail reset failed:', error);
            }
        };

        if (window.customElements?.whenDefined) {
            window.customElements.whenDefined('salla-slider').then(apply).catch(apply);
        } else {
            apply();
        }
    }`;

try {
  const twilightRaw = read(twilightPath);
  let master = read(masterPath);
  let single = read(singlePath);
  let productJs = read(productJsPath);

  backup(twilightPath, 'twilight.json');
  backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
  backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
  backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

  let twilight;
  try { twilight = JSON.parse(twilightRaw); }
  catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

  const v42Ids = [
    'veloura_product_related_desktop_columns_2026',
    'veloura_product_related_mobile_columns_2026',
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
    'veloura_product_order_payments_2026',
  ];
  v42Ids.forEach(id => removeSettingById(twilight, id));
  removeSettingById(twilight, 'veloura_product_thumbnails_position_desktop_2026');

  const compactSetting = findSetting(twilight, 'veloura_product_mobile_buttons_compact_2026');
  if (!compactSetting) fail('Compact mobile purchase-bar setting was not found in twilight.json.');
  compactSetting.label = 'تصغير القائمة المثبتة أسفل الجوال';
  compactSetting.description = 'يجعل القائمة المثبتة بطاقة عائمة داخل حواف الشاشة، بحواف دائرية كاملة ومسافة من الجانبين والأسفل.';

  const couponToggle = findSetting(twilight, 'veloura_product_coupon_enabled_2026');
  const couponCode = findSetting(twilight, 'veloura_product_coupon_code_2026');
  if (!couponToggle || !couponCode) fail('Coupon settings were not found in twilight.json.');
  couponToggle.description = 'عند التفعيل وكتابة كود فعلي يظهر صندوق الخصم داخل تفاصيل المنتج فوق الوصف مباشرة، ويمكن للعميل نسخه.';
  couponCode.placeholder = 'اكتب الكود الفعلي، مثال: VEL10';
  couponCode.description = 'لا تكتب كلمة مثال. أنشئ الكود نفسه ضمن كوبونات المتجر، ثم اكتبه هنا ليظهر فوق وصف المنتج.';

  const orderAnchor = findContainer(twilight, 'veloura_product_purchase_count_min_2026') ||
    findContainer(twilight, 'veloura_product_coupon_code_2026');
  if (!orderAnchor) fail('Could not locate the product-details settings area in twilight.json.');
  const orderItems = [
    {
      type: 'static',
      format: 'title',
      id: 'veloura_product_details_order_title_2026',
      value: '<div style="width:100%;padding:10px 14px;border-radius:14px;background:#eef2ff;color:#3730a3;text-align:right;font-weight:800;border-right:4px solid #6366f1"><span>ترتيب تفاصيل المنتج</span><div style="font-size:12px;font-weight:500;opacity:.8;margin-top:4px">اختر ترتيب كل مجموعة من 1 إلى 10</div></div>',
      variant: 'h6',
      conditions: [condition('veloura_product_page_panel_open_2026', true)],
    },
    orderSetting('veloura_product_order_title_2026', 'ترتيب اسم المنتج والعلامة والتصنيف', 1),
    orderSetting('veloura_product_order_price_2026', 'ترتيب السعر والتقييم', 2),
    orderSetting('veloura_product_order_status_2026', 'ترتيب حالة التوفر والعداد التنازلي', 3),
    orderSetting('veloura_product_order_coupon_2026', 'ترتيب كود الخصم', 4),
    orderSetting('veloura_product_order_description_2026', 'ترتيب وصف المنتج', 5),
    orderSetting('veloura_product_order_data_2026', 'ترتيب بيانات المنتج والوسوم وعداد الشراء', 6),
    orderSetting('veloura_product_order_extras_2026', 'ترتيب التوفر بالفروع والملفات الرقمية', 7),
    orderSetting('veloura_product_order_options_2026', 'ترتيب الخيارات والسعر والكمية وأزرار الشراء', 8),
    orderSetting('veloura_product_order_quick_2026', 'ترتيب الطلب السريع', 9),
    orderSetting('veloura_product_order_payments_2026', 'ترتيب طرق الدفع والتقسيط', 10),
  ];
  orderAnchor.array.splice(orderAnchor.index + 1, 0, ...orderItems);

  const relatedAnchor = findContainer(twilight, 'veloura_product_custom_related_category_2026') ||
    findContainer(twilight, 'veloura_product_custom_related_enabled_2026');
  if (!relatedAnchor) fail('Could not locate related-products settings in twilight.json.');
  relatedAnchor.array.splice(
    relatedAnchor.index + 1,
    0,
    sliderSetting('veloura_product_related_desktop_columns_2026', 'عدد منتجات قد تعجبك في الصف — اللابتوب', 4, 2, 6),
    sliderSetting('veloura_product_related_mobile_columns_2026', 'عدد منتجات قد تعجبك في الصف — الجوال', 2, 1, 3)
  );
  write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');

  master = stripMarkedBlock(master, V41_START, V41_END);
  master = stripMarkedBlock(master, V42_START, V42_END);
  const headAnchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const headAnchor = headAnchors.find(item => master.includes(item));
  if (!headAnchor) fail('Could not find a safe head anchor in master.twig.');
  master = master.replace(headAnchor, v42Block + '\n' + headAnchor);
  write(masterPath, master);

  single = single.replace(
    /^\s*\{% set vpp_thumbnails_position = .*?%\}\s*$/m,
    "    {% set vpp_thumbnails_position = 'below_image' %}"
  );

  if (!single.includes('vpp_related_desktop_columns_raw')) {
    const likedAnchor = "    {% set vpp_liked_title = theme.settings.get('veloura_product_liked_title_2026', trans('pages.products.similar_products')) ?: trans('pages.products.similar_products') %}";
    const relatedVars = `${likedAnchor}\n\n    {% set vpp_related_desktop_columns_raw = _self.veloura_select(theme.settings.get('veloura_product_related_desktop_columns_2026', 4), 4)|trim %}\n    {% set vpp_related_desktop_columns = vpp_related_desktop_columns_raw + 0 %}\n    {% if vpp_related_desktop_columns < 2 %}{% set vpp_related_desktop_columns = 2 %}{% endif %}\n    {% if vpp_related_desktop_columns > 6 %}{% set vpp_related_desktop_columns = 6 %}{% endif %}\n    {% set vpp_related_mobile_columns_raw = _self.veloura_select(theme.settings.get('veloura_product_related_mobile_columns_2026', 2), 2)|trim %}\n    {% set vpp_related_mobile_columns = vpp_related_mobile_columns_raw + 0 %}\n    {% if vpp_related_mobile_columns < 1 %}{% set vpp_related_mobile_columns = 1 %}{% endif %}\n    {% if vpp_related_mobile_columns > 3 %}{% set vpp_related_mobile_columns = 3 %}{% endif %}`;
    single = replaceOnce(single, likedAnchor, relatedVars, 'related-products title setting');
  }

  if (!single.includes('vpp_order_title_raw')) {
    const minAnchor = '    {% set vpp_purchase_count_min = vpp_purchase_count_min_raw + 0 %}';
    const orderVars = `${minAnchor}\n\n    {# Veloura V42 sortable product-details groups #}\n    {% set vpp_order_title_raw = _self.veloura_select(theme.settings.get('veloura_product_order_title_2026', 1), 1)|trim %}\n    {% set vpp_order_price_raw = _self.veloura_select(theme.settings.get('veloura_product_order_price_2026', 2), 2)|trim %}\n    {% set vpp_order_status_raw = _self.veloura_select(theme.settings.get('veloura_product_order_status_2026', 3), 3)|trim %}\n    {% set vpp_order_coupon_raw = _self.veloura_select(theme.settings.get('veloura_product_order_coupon_2026', 4), 4)|trim %}\n    {% set vpp_order_description_raw = _self.veloura_select(theme.settings.get('veloura_product_order_description_2026', 5), 5)|trim %}\n    {% set vpp_order_data_raw = _self.veloura_select(theme.settings.get('veloura_product_order_data_2026', 6), 6)|trim %}\n    {% set vpp_order_extras_raw = _self.veloura_select(theme.settings.get('veloura_product_order_extras_2026', 7), 7)|trim %}\n    {% set vpp_order_options_raw = _self.veloura_select(theme.settings.get('veloura_product_order_options_2026', 8), 8)|trim %}\n    {% set vpp_order_quick_raw = _self.veloura_select(theme.settings.get('veloura_product_order_quick_2026', 9), 9)|trim %}\n    {% set vpp_order_payments_raw = _self.veloura_select(theme.settings.get('veloura_product_order_payments_2026', 10), 10)|trim %}\n    {% set vpp_order_title = vpp_order_title_raw + 0 %}\n    {% set vpp_order_price = vpp_order_price_raw + 0 %}\n    {% set vpp_order_status = vpp_order_status_raw + 0 %}\n    {% set vpp_order_coupon = vpp_order_coupon_raw + 0 %}\n    {% set vpp_order_description = vpp_order_description_raw + 0 %}\n    {% set vpp_order_data = vpp_order_data_raw + 0 %}\n    {% set vpp_order_extras = vpp_order_extras_raw + 0 %}\n    {% set vpp_order_options = vpp_order_options_raw + 0 %}\n    {% set vpp_order_quick = vpp_order_quick_raw + 0 %}\n    {% set vpp_order_payments = vpp_order_payments_raw + 0 %}`;
    single = replaceOnce(single, minAnchor, orderVars, 'purchase-count minimum setting');
  }

  single = single.replace(/\s+data-veloura-thumbs-layout="\{\{ vpp_thumbnails_position \}\}"/g, '');
  single = single.replace(/\s+data-veloura-v37-thumbs="\{\{ vpp_thumbnails_position \}\}"/g, '');
  single = single.replace(/veloura-product-thumbs-\{\{ vpp_thumbnails_position \}\}\s*/g, '');
  single = single.replace(/veloura-v41-native-thumbs/g, 'veloura-v42-native-thumbs');

  const rootPattern = /<div\s+data-veloura-v41-sticky="\{\{ vpp_mobile_sticky_cart \? 'true' : 'false' \}\}"/;
  if (rootPattern.test(single)) {
    single = single.replace(rootPattern, `<div data-veloura-v42-sticky="{{ vpp_mobile_sticky_cart ? 'true' : 'false' }}"\n     data-veloura-related-desktop="{{ vpp_related_desktop_columns }}"\n     data-veloura-related-mobile="{{ vpp_related_mobile_columns }}"\n     data-v42-order-title="{{ vpp_order_title }}"\n     data-v42-order-price="{{ vpp_order_price }}"\n     data-v42-order-status="{{ vpp_order_status }}"\n     data-v42-order-coupon="{{ vpp_order_coupon }}"\n     data-v42-order-description="{{ vpp_order_description }}"\n     data-v42-order-data="{{ vpp_order_data }}"\n     data-v42-order-extras="{{ vpp_order_extras }}"\n     data-v42-order-options="{{ vpp_order_options }}"\n     data-v42-order-quick="{{ vpp_order_quick }}"\n     data-v42-order-payments="{{ vpp_order_payments }}"`);
  } else if (!single.includes('data-veloura-v42-sticky=')) {
    single = single.replace(/<div\s+data-veloura-product-build=/, `<div data-veloura-v42-sticky="{{ vpp_mobile_sticky_cart ? 'true' : 'false' }}"\n     data-veloura-related-desktop="{{ vpp_related_desktop_columns }}"\n     data-veloura-related-mobile="{{ vpp_related_mobile_columns }}"\n     data-v42-order-title="{{ vpp_order_title }}"\n     data-v42-order-price="{{ vpp_order_price }}"\n     data-v42-order-status="{{ vpp_order_status }}"\n     data-v42-order-coupon="{{ vpp_order_coupon }}"\n     data-v42-order-description="{{ vpp_order_description }}"\n     data-v42-order-data="{{ vpp_order_data }}"\n     data-v42-order-extras="{{ vpp_order_extras }}"\n     data-v42-order-options="{{ vpp_order_options }}"\n     data-v42-order-quick="{{ vpp_order_quick }}"\n     data-v42-order-payments="{{ vpp_order_payments }}" data-veloura-product-build=`);
  }

  single = single.replace(
    'class="main-content md:sticky md:overflow-hidden top-24 w-full md:w-2/4 md:pb-16"',
    'class="main-content veloura-v42-details-order md:sticky md:overflow-hidden top-24 w-full md:w-2/4 md:pb-16"'
  );
  single = single.replace(
    '{% if vpp_enabled and vpp_coupon_enabled and vpp_coupon_code %}',
    '{% if vpp_coupon_enabled and vpp_coupon_code %}'
  );
  single = single.replace(
    '<div class="container veloura-product-related-products">',
    '<div class="container veloura-product-related-products" data-veloura-related-desktop="{{ vpp_related_desktop_columns }}" data-veloura-related-mobile="{{ vpp_related_mobile_columns }}">'
  );
  if (!single.includes('data-veloura-related-slider')) {
    single = single.replace('<salla-products-slider\n', '<salla-products-slider\n                data-veloura-related-slider\n');
  }
  write(singlePath, single);

  const stateReplaced = replaceMethod(productJs, 'initVelouraProductPageState', stateMethod);
  if (!stateReplaced) fail('initVelouraProductPageState() was not found in product.js.');
  productJs = stateReplaced;
  const thumbsReplaced = replaceMethod(productJs, 'initVelouraProductThumbnails', thumbnailsMethod);
  if (!thumbsReplaced) fail('initVelouraProductThumbnails() was not found in product.js.');
  productJs = thumbsReplaced;
  write(productJsPath, productJs);

  console.log('twilight.json: OK');
  console.log('Quick View V42 installed correctly.');
  console.log('The desktop side-thumbnail option was removed; product thumbnails now stay below the image.');
  console.log('The coupon appears above the description whenever its toggle is enabled and a real code is saved.');
  console.log('Related products now have independent desktop/mobile products-per-row sliders.');
  console.log('Product details can be ordered in ten groups, and compact mobile purchase mode is a rounded floating card using the store primary color.');
  console.log(`Backup: ${path.relative(root, backupDir)}`);
} catch (error) {
  console.error('Install failed: ' + error.message);
  process.exit(1);
}
