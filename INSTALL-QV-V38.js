const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v38-' + timestamp());

const V37_START = '{# Veloura QV V37 product details, sticky layer and related-card width fix start #}';
const V37_END = '{# Veloura QV V37 product details, sticky layer and related-card width fix end #}';
const V38_START = '{# Veloura QV V38 product page performance hotfix start #}';
const V38_END = '{# Veloura QV V38 product page performance hotfix end #}';
const STYLE_ID = 'veloura-qv-v38-product-performance-style-2026';
const SCRIPT_ID = 'veloura-qv-v38-product-performance-runtime-2026';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMarkedBlock(content, start, end) {
  const re = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}

function backup(file, relativeName) {
  fs.mkdirSync(path.dirname(path.join(backupDir, relativeName)), { recursive: true });
  fs.copyFileSync(file, path.join(backupDir, relativeName));
}

const block = `
${V38_START}
{# V38: removes the global attribute MutationObserver and repeated zoom initialization that caused severe product-page scroll jank. #}
<style id="${STYLE_ID}">
  /* Preserve the V37 functional fixes without its continuous runtime loop. */
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"] .veloura-product-stock-radar.is-pulse .veloura-product-stock-radar__dot {
    display: inline-block !important;
    animation: veloura-stock-pulse 1.5s infinite !important;
  }

  .veloura-product-page[data-veloura-v37-stock-radar="simple"] .veloura-product-stock-radar__dot,
  .veloura-product-page .veloura-product-stock-radar.is-simple .veloura-product-stock-radar__dot {
    display: none !important;
    animation: none !important;
    box-shadow: none !important;
  }

  @media (max-width: 640px) {
    html body.veloura-is-product-page.veloura-product-sticky-active
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar {
      z-index: 2147482000 !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  }

  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v38-related-card {
    overflow: visible !important;
  }

  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v38-related-card
  .veloura-v38-related-action {
    position: relative !important;
    max-width: none !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    pointer-events: auto !important;
  }

  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v38-related-card
  .veloura-v38-related-action > *,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v38-related-card
  .veloura-v38-related-action > salla-add-product-button,
  html body.veloura-product-card-enabled
  .veloura-product-related-products
  .s-product-card-entry.veloura-v38-related-card
  .veloura-v38-related-action .veloura-quick-view-btn {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    flex: 1 1 100% !important;
    box-sizing: border-box !important;
  }

  /* Zoom is a mouse/trackpad enhancement. On touch devices, native vertical scrolling always wins. */
  @media (hover: none), (pointer: coarse) {
    .veloura-product-page salla-slider.details-slider,
    .veloura-product-page salla-slider.details-slider .swiper,
    .veloura-product-page salla-slider.details-slider .swiper-wrapper,
    .veloura-product-page salla-slider.details-slider img {
      touch-action: pan-y pinch-zoom !important;
    }
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var RELATED_SELECTOR = '.veloura-product-related-products .s-product-card-entry';
  var ACTION_SELECTOR = '.s-product-card-content-footer, .veloura-quick-view-under-cart-wrap';
  var frame = 0;
  var resizeTimer = 0;
  var relatedObserver = null;

  function number(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function syncProductSettings() {
    var page = document.querySelector('.veloura-product-page.veloura-product-enabled');
    if (!page) return;

    var slider = page.querySelector('salla-slider.details-slider.image-slider');
    var requested = page.getAttribute('data-veloura-v37-thumbs') || 'below_image';
    var desktop = window.matchMedia ? window.matchMedia('(min-width: 768px)').matches : window.innerWidth >= 768;
    var position = desktop && requested === 'right_side' ? 'right' : 'bottom';

    if (slider) {
      if (slider.getAttribute('thumbs-position') !== position) {
        slider.setAttribute('thumbs-position', position);
      }
      try {
        if (slider.thumbsPosition !== position) slider.thumbsPosition = position;
      } catch (error) {}
      slider.classList.toggle('veloura-v38-thumbs-right', position === 'right');
      slider.classList.toggle('veloura-v38-thumbs-bottom', position !== 'right');
    }

    var pulse = page.getAttribute('data-veloura-v37-stock-radar') === 'pulse';
    page.querySelectorAll('.veloura-product-stock-radar').forEach(function (radar) {
      radar.classList.toggle('is-pulse', pulse);
      radar.classList.toggle('is-simple', !pulse);
    });
  }

  function horizontalValue() {
    var rootStyle = window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null;
    return Math.max(0, number(rootStyle ? rootStyle.getPropertyValue('--veloura-v35-action-x') : 0));
  }

  function syncRelatedAction(card, row, x) {
    if (!card || !row || !window.getComputedStyle) return;

    var cardRect = card.getBoundingClientRect();
    if (cardRect.width <= 1) return;

    var targetWidth = Math.max(0, cardRect.width - (x * 2));
    var widthValue = targetWidth.toFixed(3) + 'px';

    card.classList.add('veloura-v38-related-card');
    row.classList.add('veloura-v38-related-action');
    row.classList.remove('veloura-v37-related-action');

    row.style.setProperty('transform', 'none', 'important');
    row.style.setProperty('width', widthValue, 'important');
    row.style.setProperty('max-width', widthValue, 'important');
    row.style.setProperty('min-width', '0px', 'important');
    row.style.setProperty('margin-left', '0px', 'important');
    row.style.setProperty('margin-right', '0px', 'important');
    row.style.setProperty('align-self', 'flex-start', 'important');

    var rowRect = row.getBoundingClientRect();
    var desiredLeft = cardRect.left + x;
    var delta = desiredLeft - rowRect.left;
    row.style.setProperty('transform', 'translate3d(' + delta.toFixed(3) + 'px, 0, 0)', 'important');
  }

  function syncRelated(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var cards = [];

    if (root.matches && root.matches(RELATED_SELECTOR)) cards.push(root);
    root.querySelectorAll(RELATED_SELECTOR).forEach(function (card) { cards.push(card); });

    var x = horizontalValue();
    cards.forEach(function (card) {
      card.classList.remove('veloura-v37-related-card');
      card.querySelectorAll(ACTION_SELECTOR).forEach(function (row) {
        syncRelatedAction(card, row, x);
      });
    });
  }

  function sync(scope) {
    syncProductSettings();
    syncRelated(scope || document);
    observeRelatedProducts();
  }

  function schedule(scope) {
    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      sync(scope || document);
    });
  }

  function observeRelatedProducts() {
    if (relatedObserver || !window.MutationObserver) return;
    var related = document.querySelector('.veloura-product-related-products');
    if (!related) return;

    relatedObserver = new MutationObserver(function (mutations) {
      var hasAddedNodes = mutations.some(function (mutation) {
        return mutation.addedNodes && mutation.addedNodes.length;
      });
      if (hasAddedNodes) schedule(related);
    });
    relatedObserver.observe(related, { childList: true, subtree: true });
  }

  function run() {
    sync(document);

    if (window.customElements && typeof window.customElements.whenDefined === 'function') {
      window.customElements.whenDefined('salla-slider').then(function () {
        schedule(document);
      }).catch(function () {});
    }

    [150, 650, 1600].forEach(function (delay) {
      window.setTimeout(function () { schedule(document); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () { schedule(document); }, 180);
  }, { passive: true });

  window.addEventListener('orientationchange', function () {
    window.setTimeout(function () { schedule(document); }, 250);
  }, { passive: true });

  document.addEventListener('theme::ready', function () { schedule(document); });
  document.addEventListener('salla::product.cards::loaded', function () { schedule(document); });
  document.addEventListener('salla::products::loaded', function () { schedule(document); });
})();
</script>
${V38_END}
`;

try {
  let master = read(masterPath);
  let productJs = read(productJsPath);
  const single = read(singlePath);
  const twilight = read(twilightPath);

  if (!single.includes('data-veloura-v37-thumbs=') || !single.includes('data-veloura-v37-images-zoom=')) {
    throw new Error('V37 product setting data attributes were not found. Install V37 first.');
  }
  if (!master.includes(V37_START) && !master.includes(V38_START)) {
    throw new Error('V37/V38 product detail runtime was not found. Install V37 first.');
  }

  fs.mkdirSync(backupDir, { recursive: true });
  backup(masterPath, path.join('src', 'views', 'layouts', 'master.twig'));
  backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

  master = stripMarkedBlock(master, V37_START, V37_END);
  master = stripMarkedBlock(master, V38_START, V38_END);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) throw new Error('Could not find a safe head anchor in master.twig.');
  master = master.replace(anchor, block + '\n' + anchor);

  const v37ZoomPattern = /\/\* Veloura V37 zoom source of truth \*\/\s*const velouraProductPage = document\.querySelector\('\.veloura-product-page'\);\s*const velouraZoomControlled = Boolean\(velouraProductPage && velouraProductPage\.classList\.contains\('veloura-product-enabled'\)\);\s*const themeZoomEnabled = velouraZoomControlled \? velouraProductPage\.classList\.contains\('veloura-product-zoom-enabled'\) : \(typeof imageZoom !== 'undefined' && imageZoom\);\s*if \(themeZoomEnabled\) \{\s*this\.initImagesZooming\(\);\s*window\.addEventListener\('resize', \(\) => this\.initImagesZooming\(\)\);\s*\}/;

  const v38ZoomPattern = /\/\* Veloura V38 performance-safe zoom \*\/[\s\S]*?this\.initImagesZooming\(\);\s*\}/;

  const safeZoom = `/* Veloura V38 performance-safe zoom */ const velouraProductPage = document.querySelector('.veloura-product-page'); const velouraZoomControlled = Boolean(velouraProductPage && velouraProductPage.classList.contains('veloura-product-enabled')); const themeZoomEnabled = velouraZoomControlled ? velouraProductPage.classList.contains('veloura-product-zoom-enabled') : (typeof imageZoom !== 'undefined' && imageZoom); const velouraFinePointer = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches; if (themeZoomEnabled && velouraFinePointer && !this.__velouraZoomInitialized) { this.__velouraZoomInitialized = true; this.initImagesZooming(); }`;

  if (v37ZoomPattern.test(productJs)) {
    productJs = productJs.replace(v37ZoomPattern, safeZoom);
  } else if (v38ZoomPattern.test(productJs)) {
    productJs = productJs.replace(v38ZoomPattern, safeZoom);
  } else if (!productJs.includes('Veloura V38 performance-safe zoom')) {
    throw new Error('Could not locate the V37 product zoom code in product.js.');
  }

  write(masterPath, master);
  write(productJsPath, productJs);

  JSON.parse(twilight);
  console.log('twilight.json: OK');
  console.log('Quick View V38 installed correctly.');
  console.log('The global attribute observer and repeated slider updates were removed.');
  console.log('Image zoom now initializes once and only on fine-pointer devices, so touch scrolling remains native and smooth.');
  console.log('V37 stock, sticky-bar and related-product fixes remain active with an event-driven runtime.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  const restoreMap = [
    [path.join(backupDir, 'src', 'views', 'layouts', 'master.twig'), masterPath],
    [path.join(backupDir, 'src', 'assets', 'js', 'product.js'), productJsPath]
  ];
  restoreMap.forEach(([from, to]) => {
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
  });
  console.error('Original files were restored when backups were available.');
  process.exit(1);
}
