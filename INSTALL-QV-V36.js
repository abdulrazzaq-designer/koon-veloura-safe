const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v36-' + timestamp());

const BLOCK_START = '{# Veloura QV V36 quick-view glass icon fix start #}';
const BLOCK_END = '{# Veloura QV V36 quick-view glass icon fix end #}';
const STYLE_ID = 'veloura-qv-v36-glass-quick-icon-style-2026';
const SCRIPT_ID = 'veloura-qv-v36-glass-quick-icon-runtime-2026';

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

const block = `
${BLOCK_START}
{# V36: product-card glass also styles the quick-view icon over the image, exactly like wishlist. Under-cart quick view remains a normal solid button. #}
<style id="${STYLE_ID}">
  /*
   * V26 intentionally forced every quick-view button back to the solid theme color.
   * This higher-specificity rule restores glass only for the image-overlay icon.
   */
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .s-product-card-image
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]),
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .veloura-quick-view-image-host
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) {
    background: rgba(255, 255, 255, .26) !important;
    background-color: rgba(255, 255, 255, .26) !important;
    background-image: none !important;
    color: #0f172a !important;
    border: 1px solid rgba(255, 255, 255, .38) !important;
    box-shadow:
      0 18px 38px rgba(15, 23, 42, .16),
      inset 0 1px 0 rgba(255, 255, 255, .55),
      inset 0 -1px 0 rgba(15, 23, 42, .06) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    filter: none !important;
  }

  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .s-product-card-image
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) *,
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .veloura-quick-view-image-host
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) * {
    color: #0f172a !important;
    fill: #0f172a !important;
    stroke: currentColor !important;
  }

  /* Keep nested native button shells transparent so the glass is visible. */
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .s-product-card-image
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) > button,
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .s-product-card-image
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) > .s-button-element,
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .veloura-quick-view-image-host
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) > button,
  html body.veloura-product-card-enabled.veloura-pc-glass
  .s-product-card-entry .veloura-quick-view-image-host
  .veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"]) > .s-button-element {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    border: 0 !important;
    box-shadow: none !important;
  }
</style>

<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var STYLE_ID = '${STYLE_ID}';
  var MARKER = 'veloura-v36-glass-quick';
  var scheduled = false;
  var headObserver = null;

  function ensureStyleLast() {
    var style = document.getElementById(STYLE_ID);
    if (style && document.head && document.head.lastElementChild !== style) {
      document.head.appendChild(style);
    }
  }

  function observeHead() {
    if (headObserver || !document.head || !window.MutationObserver) return;
    headObserver = new MutationObserver(function () {
      var style = document.getElementById(STYLE_ID);
      if (style && document.head.lastElementChild !== style) {
        window.requestAnimationFrame(ensureStyleLast);
      }
    });
    headObserver.observe(document.head, { childList: true });
  }

  function isImageOverlay(button) {
    if (!button || !button.closest) return false;
    if (button.classList.contains('is-under-cart')) return false;
    if (button.getAttribute('data-veloura-qv-under-cart') === 'true') return false;
    if (button.closest('.veloura-quick-view-under-cart-wrap')) return false;
    if (button.closest('.veloura-qv-full, .veloura-quick-view-modal')) return false;
    return !!button.closest('.s-product-card-image, .veloura-quick-view-image-host');
  }

  function sync(scope) {
    ensureStyleLast();
    observeHead();

    var root = scope && scope.querySelectorAll ? scope : document;
    var selector = [
      '.s-product-card-entry .veloura-quick-view-btn',
      '.s-product-card-entry .veloura-pc-native-quick',
      '.s-product-card-entry .veloura-quick-view-button',
      '.s-product-card-entry [data-veloura-quick-view]'
    ].join(',');

    root.querySelectorAll(selector).forEach(function (button) {
      button.classList.toggle(MARKER, isImageOverlay(button));
    });

    /* A moved under-cart button must never keep the overlay-glass marker. */
    root.querySelectorAll('.veloura-quick-view-under-cart-wrap .' + MARKER + ', .is-under-cart.' + MARKER)
      .forEach(function (button) { button.classList.remove(MARKER); });
  }

  function schedule(scope) {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      sync(scope || document);
      window.requestAnimationFrame(function () { sync(scope || document); });
    });
  }

  function run() {
    sync(document);
    [80, 250, 700, 1500, 3000].forEach(function (delay) {
      window.setTimeout(function () { sync(document); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  if (window.MutationObserver) {
    var bodyObserver = new MutationObserver(function (mutations) {
      var scope = document;
      for (var i = 0; i < mutations.length; i++) {
        var target = mutations[i].target;
        if (target && target.closest) {
          scope = target.closest('.s-product-card-entry') || document;
          if (scope !== document) break;
        }
      }
      schedule(scope);
    });

    function startBodyObserver() {
      if (document.body) bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-veloura-qv-under-cart'] });
    }

    if (document.body) startBodyObserver();
    else document.addEventListener('DOMContentLoaded', startBodyObserver);
  }

  document.addEventListener('theme::ready', function () { schedule(document); });
  document.addEventListener('salla::product.cards::loaded', function () { schedule(document); });
  window.addEventListener('resize', function () { schedule(document); }, { passive: true });
})();
</script>
${BLOCK_END}
`;

try {
  let master = read(masterPath);

  if (!master.includes('veloura-pc-glass') || !master.includes('veloura_pc_glass_2026')) {
    throw new Error('Product-card glass option was not found in src/views/layouts/master.twig.');
  }
  if (!master.includes('veloura-quick-view-btn') && !master.includes('veloura-pc-native-quick')) {
    throw new Error('Quick-view product-card implementation was not found in src/views/layouts/master.twig.');
  }

  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(masterPath, path.join(backupDir, 'master.twig'));

  master = stripMarkedBlock(master, BLOCK_START, BLOCK_END);

  const anchors = ["{% hook 'head:end' %}", '{% hook head %}', '{% block styles %}{% endblock %}'];
  const anchor = anchors.find(value => master.includes(value));
  if (!anchor) throw new Error('Could not find a safe head anchor in src/views/layouts/master.twig.');

  master = master.replace(anchor, block + '\n' + anchor);
  write(masterPath, master);

  console.log('Quick View V36 installed correctly.');
  console.log('Product-card glass now applies to the quick-view icon over the image, matching wishlist.');
  console.log('Under-cart quick view remains a normal solid button.');
  console.log('No theme settings were changed.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  const backup = path.join(backupDir, 'master.twig');
  if (fs.existsSync(backup)) fs.copyFileSync(backup, masterPath);
  console.error('Original master.twig was restored when a backup was available.');
  process.exit(1);
}
