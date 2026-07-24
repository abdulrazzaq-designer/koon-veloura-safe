const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const appPath = path.join(root, 'src', 'assets', 'js', 'app.js');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-product-card-qv-v26-' + timestamp());

const STYLE_ID = 'veloura-product-card-qv-v26-fix-2026';
const SCRIPT_ID = 'veloura-product-card-qv-v26-runtime-2026';
const STYLE_BLOCK = `
<style id="${STYLE_ID}">
/* ========================================================================
   Veloura Product Card Quick View V26
   - Quick View button never inherits product-card glass.
   - Under-cart position stays under add-to-cart, never absolute on image.
   - Product image ratios keep stable height even with subtitles.
   - Auto image ratio removes the empty image area under the image.
   ======================================================================== */

body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-btn,
body.veloura-product-card-enabled .s-product-card-entry .veloura-pc-native-quick,
body.veloura-product-card-enabled.veloura-pc-glass .s-product-card-entry .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-pc-glass .s-product-card-entry .veloura-pc-native-quick {
  background: var(--veloura-quick-view-button-bg, #004d65) !important;
  color: var(--veloura-quick-view-button-text, #ffffff) !important;
  border: 1px solid var(--veloura-quick-view-button-bg, #004d65) !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  filter: none !important;
}

body.veloura-product-card-enabled .s-product-card-entry .veloura-quick-view-btn *,
body.veloura-product-card-enabled .s-product-card-entry .veloura-pc-native-quick * {
  color: var(--veloura-quick-view-button-text, #ffffff) !important;
  fill: var(--veloura-quick-view-button-text, #ffffff) !important;
}

body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 100% !important;
  flex-basis: 100% !important;
  order: 99 !important;
  margin: 8px 0 0 !important;
  padding: 0 !important;
  clear: both !important;
  z-index: 1 !important;
}

body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
  position: relative !important;
  inset: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;

  width: calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  max-width: calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: var(--veloura-quick-view-button-height, 42px) !important;
  max-height: none !important;

  margin: 0 var(--veloura-product-button-margin-x, 12px) 0 !important;
  padding: 0 14px !important;
  border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  opacity: 1 !important;
  visibility: visible !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .s-product-card-image > .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .s-product-card-image > .veloura-quick-view-btn,
body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .s-product-card-image > .veloura-quick-view-btn {
  display: none !important;
}

body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-btn.is-under-cart i {
  position: static !important;
  width: auto !important;
  height: auto !important;
  font-size: 15px !important;
  line-height: 1 !important;
  margin: 0 !important;
}

/* The image must not shrink because the title/subtitle became taller. */
body.veloura-product-card-enabled .s-product-card-entry.s-product-card-fit-height.s-product-card-vertical .s-product-card-image,
body.veloura-product-card-enabled product-card.s-product-card-fit-height .s-product-card-entry .s-product-card-image {
  flex: 0 0 auto !important;
}

body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image,
body.veloura-product-card-enabled .s-product-card-entry .s-product-card-image a {
  min-height: 0 !important;
}

body.veloura-product-card-enabled:not(.veloura-product-image-ratio-auto) .s-product-card-entry .s-product-card-image {
  flex: 0 0 auto !important;
  height: auto !important;
}

body.veloura-product-card-enabled:not(.veloura-product-image-ratio-auto) .s-product-card-entry .s-product-card-image a {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  line-height: 0 !important;
}

body.veloura-product-card-enabled:not(.veloura-product-image-ratio-auto) .s-product-card-entry .s-product-card-image img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image,
body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image a,
body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image img {
  aspect-ratio: auto !important;
}

body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image {
  display: block !important;
  flex: 0 0 auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: hidden !important;
  line-height: 0 !important;
}

body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image a {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  line-height: 0 !important;
}

body.veloura-product-card-enabled.veloura-product-image-ratio-auto .s-product-card-entry .s-product-card-image img {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center !important;
}
</style>
`;

const SCRIPT_BLOCK = `
<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  function normalizePosition(value) {
    value = String(value || '').trim();
    if (
      value === 'below_add_to_cart' ||
      value === 'below-add-to-cart' ||
      value === 'inside_card' ||
      value === 'inside-card'
    ) {
      return 'below_add_to_cart';
    }
    return 'wishlist_icon';
  }

  function currentPosition() {
    var config = window.velouraQuickView || {};
    var position = normalizePosition(config.buttonPosition);

    if (
      document.body.classList.contains('veloura-quick-view-position-below_add_to_cart') ||
      document.body.classList.contains('veloura-quick-view-position-below-add-to-cart') ||
      document.body.classList.contains('veloura-quick-view-position-inside_card')
    ) {
      position = 'below_add_to_cart';
    }

    return position;
  }

  function setPositionClass(position) {
    Array.prototype.slice.call(document.body.classList).forEach(function (name) {
      if (name.indexOf('veloura-quick-view-position-') === 0) {
        document.body.classList.remove(name);
      }
    });
    document.body.classList.add('veloura-quick-view-position-' + position);
  }

  function getCard(node) {
    if (!node) return null;
    if (node.classList && node.classList.contains('s-product-card-entry')) return node;
    if (node.closest) return node.closest('.s-product-card-entry');
    return null;
  }

  function ensureUnderCartButton(card, button) {
    if (!card || !button) return;

    button.classList.add('is-under-cart');
    button.classList.remove('is-icon-only');
    button.classList.remove('veloura-pc-native-quick');
    button.setAttribute('data-veloura-qv-under-cart', 'true');

    var config = window.velouraQuickView || {};
    var label = config.buttonText || 'عرض سريع';
    var icon = config.icon || 'sicon-eye';
    var showIcon = config.showIcon !== false && config.showIcon !== 'false';

    if (!button.querySelector('span')) {
      button.innerHTML = (showIcon ? '<i class="' + icon + '" aria-hidden="true"></i>' : '') + '<span>' + label + '</span>';
    }

    var wrapper = button.closest('.veloura-quick-view-under-cart-wrap');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'veloura-quick-view-under-cart-wrap';
      button.parentNode && button.parentNode.removeChild(button);
      wrapper.appendChild(button);
    }

    var footer = card.querySelector('.s-product-card-content-footer');
    var content = card.querySelector('.s-product-card-content') || card;

    if (footer && footer.parentNode) {
      if (footer.nextSibling !== wrapper) {
        footer.parentNode.insertBefore(wrapper, footer.nextSibling);
      }
    } else if (content && wrapper.parentNode !== content) {
      content.appendChild(wrapper);
    }
  }

  function ensureIconButton(card, button) {
    if (!card || !button) return;

    button.classList.add('is-icon-only');
    button.classList.remove('is-under-cart');
    button.removeAttribute('data-veloura-qv-under-cart');

    var wrapper = button.closest('.veloura-quick-view-under-cart-wrap');
    var image = card.querySelector('.s-product-card-image');

    if (image && button.parentElement !== image) {
      if (wrapper) {
        wrapper.parentNode && wrapper.parentNode.removeChild(wrapper);
      }
      image.classList.add('veloura-quick-view-image-host');
      image.appendChild(button);
    }
  }

  function syncCard(card) {
    if (!card) return;

    var button = card.querySelector('.veloura-quick-view-btn');
    if (!button) return;

    var position = currentPosition();
    setPositionClass(position);

    if (position === 'below_add_to_cart') {
      ensureUnderCartButton(card, button);
    } else {
      ensureIconButton(card, button);
    }
  }

  function syncAll() {
    document.querySelectorAll('.s-product-card-entry, product-card').forEach(function (node) {
      var card = node.classList && node.classList.contains('s-product-card-entry')
        ? node
        : node.querySelector && node.querySelector('.s-product-card-entry');
      syncCard(card || getCard(node));
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    syncAll();
    setTimeout(syncAll, 250);
    setTimeout(syncAll, 800);
    setTimeout(syncAll, 1600);

    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(syncAll, 80);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  });

  document.addEventListener('theme::ready', function () {
    syncAll();
    setTimeout(syncAll, 300);
  });
})();
</script>
`;

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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

function backup(file) {
  const rel = path.relative(root, file);
  const target = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function stripBlock(content, id) {
  const styleRe = new RegExp(`\\n?<style[^>]*id=["']${id}["'][\\s\\S]*?<\\/style>\\n?`, 'g');
  const scriptRe = new RegExp(`\\n?<script[^>]*id=["']${id}["'][\\s\\S]*?<\\/script>\\n?`, 'g');
  return content.replace(styleRe, '\n').replace(scriptRe, '\n');
}

try {
  JSON.parse(read(twilightPath));

  fs.mkdirSync(backupDir, { recursive: true });
  [masterPath, appPath, twilightPath].forEach(backup);

  let master = read(masterPath);

  master = stripBlock(master, STYLE_ID);
  master = stripBlock(master, SCRIPT_ID);

  if (!master.includes("veloura-product-image-ratio-")) {
    const anchor = "{{ vpc_enabled and vpc_image_outside ? ' veloura-product-card-image-outside' : '' }}";
    if (!master.includes(anchor)) {
      throw new Error('Could not find body class anchor for product image ratio.');
    }
    master = master.replace(anchor, anchor + "\n  {{ vpc_enabled ? ' veloura-product-image-ratio-' ~ vpc_image_ratio : '' }}");
  }

  if (!master.includes('</head>')) {
    throw new Error('Could not find </head> in master.twig.');
  }
  master = master.replace('</head>', STYLE_BLOCK + '\n</head>');

  if (!master.includes('</body>')) {
    throw new Error('Could not find </body> in master.twig.');
  }
  master = master.replace('</body>', SCRIPT_BLOCK + '\n</body>');

  write(masterPath, master);

  // Keep app.js untouched except backing it up. The runtime fix is inline in master.twig and runs after existing scripts.

  JSON.parse(read(twilightPath));

  console.log('twilight.json: OK');
  console.log('Product Card Quick View V26 installed correctly.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);

  if (fs.existsSync(backupDir)) {
    for (const file of [masterPath, appPath, twilightPath]) {
      const rel = path.relative(root, file);
      const source = path.join(backupDir, rel);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, file);
      }
    }
    console.error('Original files were restored from backup.');
  }

  process.exit(1);
}
