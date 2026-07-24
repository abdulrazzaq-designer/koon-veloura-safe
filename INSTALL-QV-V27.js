const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v27-' + timestamp());

const SCRIPT_ID = 'veloura-qv-v27-spacing-radius-glass-fix-2026';

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

function restore() {
  if (!fs.existsSync(backupDir)) return;
  for (const file of [masterPath, twilightPath]) {
    const source = path.join(backupDir, path.relative(root, file));
    if (fs.existsSync(source)) fs.copyFileSync(source, file);
  }
}

function stripScriptBlock(content, id) {
  const re = new RegExp(`\\n?<script[^>]*id=["']${id}["'][\\s\\S]*?<\\/script>\\n?`, 'g');
  return content.replace(re, '\n');
}

function removeSettingById(node, id) {
  let removed = 0;

  function walk(value) {
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const child = value[i];
        if (child && typeof child === 'object' && child.id === id) {
          value.splice(i, 1);
          removed++;
        } else {
          walk(child);
        }
      }
      return;
    }

    if (value && typeof value === 'object') {
      Object.keys(value).forEach(key => walk(value[key]));
    }
  }

  walk(node);
  return removed;
}

function findSettingsById(node, id, results = []) {
  if (Array.isArray(node)) {
    node.forEach(item => findSettingsById(item, id, results));
    return results;
  }

  if (node && typeof node === 'object') {
    if (node.id === id && (node.type || node.format || node.label)) results.push(node);
    Object.keys(node).forEach(key => findSettingsById(node[key], id, results));
  }

  return results;
}

const runtimeScript = `
<script data-cfasync="false" id="${SCRIPT_ID}">
(function () {
  'use strict';

  var STYLE_ID = 'veloura-qv-v27-final-style-2026';

  var css = ` + JSON.stringify(`
/* ========================================================================
   Veloura QV V27 — button width, modal radius, glass isolation
   ======================================================================== */

html body.veloura-quick-view-enabled {
  --veloura-qv-row-gap: 8px;
}

/* زر العرض السريع تحت زر السلة: نفس عرض زر إضافة السلة ونفس المسافة الجانبية. */
html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-under-cart-wrap {
  position: relative !important;
  display: block !important;
  width: calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  max-width: calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  min-width: 0 !important;
  flex: 0 0 calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  flex-basis: calc(100% - (var(--veloura-product-button-margin-x, 12px) * 2)) !important;
  box-sizing: border-box !important;
  order: 99 !important;
  clear: both !important;
  margin: var(--veloura-qv-row-gap, 8px) var(--veloura-product-button-margin-x, 12px) 0 !important;
  padding: 0 !important;
  z-index: 2 !important;
}

html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-under-cart-wrap .veloura-quick-view-btn,
html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-btn.is-under-cart,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-btn.is-under-cart {
  position: relative !important;
  inset: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  display: flex !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  height: var(--veloura-quick-view-button-height, 42px) !important;
  min-height: var(--veloura-quick-view-button-height, 42px) !important;
  margin: 0 !important;
  padding: 0 14px !important;
  box-sizing: border-box !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  flex: 0 0 auto !important;
  border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  background: var(--veloura-quick-view-button-bg, #004d65) !important;
  color: var(--veloura-quick-view-button-text, #ffffff) !important;
  border: 1px solid var(--veloura-quick-view-button-bg, #004d65) !important;
  box-shadow: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  overflow: hidden !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}

html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .s-product-card-image .veloura-quick-view-btn:not([data-veloura-qv-under-cart]),
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .s-product-card-image .veloura-quick-view-btn:not([data-veloura-qv-under-cart]),
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .s-product-card-image .veloura-quick-view-btn:not([data-veloura-qv-under-cart]),
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .s-product-card-image .veloura-quick-view-btn:not([data-veloura-qv-under-cart]),
html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .s-product-card-image .veloura-pc-native-quick,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .s-product-card-image .veloura-pc-native-quick,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .s-product-card-image .veloura-pc-native-quick,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .s-product-card-image .veloura-pc-native-quick {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-btn.is-under-cart i,
html body.veloura-product-card-enabled.veloura-quick-view-position-below_add_to_cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart span,
html body.veloura-product-card-enabled.veloura-quick-view-position-below-add-to-cart .s-product-card-entry .veloura-quick-view-btn.is-under-cart span,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside_card .s-product-card-entry .veloura-quick-view-btn.is-under-cart span,
html body.veloura-product-card-enabled.veloura-quick-view-position-inside-card .s-product-card-entry .veloura-quick-view-btn.is-under-cart span {
  color: var(--veloura-quick-view-button-text, #ffffff) !important;
  fill: var(--veloura-quick-view-button-text, #ffffff) !important;
}

/* نافذة العرض السريع لا تتأثر بخيار الزجاج العام. لها خيارها الخاص فقط. */
html body.veloura-glass-effect .veloura-qv-full .veloura-qv-full__dialog,
html body.veloura-glass-effect .veloura-quick-view-modal .veloura-quick-view-modal__dialog {
  background: var(--veloura-quick-view-modal-bg, #ffffff) !important;
  background-color: var(--veloura-quick-view-modal-bg, #ffffff) !important;
  background-image: none !important;
  color: var(--veloura-quick-view-modal-text, #111827) !important;
  border-color: transparent !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}

html body .veloura-qv-full .veloura-qv-full__overlay,
html body .veloura-quick-view-modal .veloura-quick-view-modal__overlay,
html body.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__overlay,
html body.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__overlay {
  background: rgba(15, 23, 42, .28) !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}

html body.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__dialog,
html body.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__dialog {
  background:
    linear-gradient(145deg, rgba(255,255,255,.22), rgba(229,231,235,.08)),
    var(--veloura-v15-glass-fallback, rgba(255,255,255,.64)) !important;
  background-color: var(--veloura-v15-glass-fallback, rgba(255,255,255,.64)) !important;
  border: 1px solid var(--veloura-v15-border, rgba(255,255,255,.88)) !important;
  -webkit-backdrop-filter: var(--veloura-v15-filter, blur(17px) saturate(36%) brightness(104%) contrast(98%)) !important;
  backdrop-filter: var(--veloura-v15-filter, blur(17px) saturate(36%) brightness(104%) contrast(98%)) !important;
  box-shadow:
    0 0 0 1px rgba(15,23,42,.12),
    0 28px 100px rgba(15,23,42,.24),
    inset 0 1px 0 rgba(255,255,255,.82) !important;
}

html.dark body.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__dialog,
html body.dark.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__dialog,
html.dark body.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__dialog,
html body.dark.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__dialog {
  background:
    linear-gradient(145deg, rgba(255,255,255,.08), rgba(0,0,0,.10)),
    var(--veloura-v15-glass-dark-fallback, rgba(24,24,27,.70)) !important;
  background-color: var(--veloura-v15-glass-dark-fallback, rgba(24,24,27,.70)) !important;
  border-color: rgba(255,255,255,.16) !important;
}

html body.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__media,
html body.veloura-quick-view-overlay-blur .veloura-qv-full .veloura-qv-full__content,
html body.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__media,
html body.veloura-quick-view-overlay-blur .veloura-quick-view-modal .veloura-quick-view-modal__content {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}

/* حواف أزرار النافذة من نفس حواف زر العرض السريع. */
html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__circle,
html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__add,
html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__read-more,
html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__close,
html body.veloura-quick-view-enabled .veloura-quick-view-modal .veloura-quick-view-modal__link,
html body.veloura-quick-view-enabled .veloura-quick-view-modal .veloura-quick-view-modal__close {
  border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
}

html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__qty {
  border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  overflow: hidden !important;
}

html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__qty button,
html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__qty input {
  border-radius: 0 !important;
}

html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__qty button:first-child {
  border-start-start-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  border-end-start-radius: var(--veloura-quick-view-button-radius, 999px) !important;
}

html body.veloura-quick-view-enabled .veloura-qv-full .veloura-qv-full__qty button:last-child {
  border-start-end-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  border-end-end-radius: var(--veloura-quick-view-button-radius, 999px) !important;
}

/* عند إلغاء توسيط النصوص، السعر يرجع لليمين مثل باقي النصوص. */
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-title,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-title a,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-subtitle,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-main,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-sub,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-sale-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-regular-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry [class*="price"],
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry [class*="Price"] {
  text-align: right !important;
  justify-content: flex-start !important;
  align-items: flex-start !important;
  margin-inline-start: 0 !important;
  margin-inline-end: auto !important;
  direction: rtl !important;
}

html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-sub,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-content-price,
html body.veloura-product-card-enabled.veloura-product-card-align-right .s-product-card-entry .s-product-card-price {
  display: flex !important;
  width: 100% !important;
}
`) + `;

  function ensureStyle() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
    }
    if (document.head && style.parentNode !== document.head) {
      document.head.appendChild(style);
    } else if (document.head && document.head.lastElementChild !== style) {
      document.head.appendChild(style);
    }
  }

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

  function activePosition() {
    var cfg = window.velouraQuickView || {};
    var pos = normalizePosition(cfg.buttonPosition);
    var body = document.body;
    if (!body) return pos;
    if (
      body.classList.contains('veloura-quick-view-position-below_add_to_cart') ||
      body.classList.contains('veloura-quick-view-position-below-add-to-cart') ||
      body.classList.contains('veloura-quick-view-position-inside_card') ||
      body.classList.contains('veloura-quick-view-position-inside-card')
    ) {
      pos = 'below_add_to_cart';
    }
    return pos;
  }

  function setPositionClass(pos) {
    if (!document.body) return;
    Array.prototype.slice.call(document.body.classList).forEach(function (name) {
      if (name.indexOf('veloura-quick-view-position-') === 0) {
        document.body.classList.remove(name);
      }
    });
    document.body.classList.add('veloura-quick-view-position-' + pos);
  }

  function setAlignClass() {
    if (!document.body) return;
    var centered = document.body.classList.contains('veloura-product-card-center-text');
    document.body.classList.toggle('veloura-product-card-align-right', !centered);
  }

  function getCard(node) {
    if (!node) return null;
    if (node.classList && node.classList.contains('s-product-card-entry')) return node;
    return node.closest && (node.closest('.s-product-card-entry') || node.closest('product-card'));
  }

  function labelButton(button) {
    if (!button) return;
    var cfg = window.velouraQuickView || {};
    var label = cfg.buttonText || 'عرض سريع';
    var icon = cfg.icon || 'sicon-eye';
    var showIcon = cfg.showIcon !== false && cfg.showIcon !== 'false';
    button.innerHTML = (showIcon ? '<i class="' + icon + '" aria-hidden="true"></i>' : '') + '<span>' + label + '</span>';
  }

  function allQuickButtons(card) {
    if (!card) return [];
    return Array.prototype.slice.call(card.querySelectorAll(
      '.veloura-quick-view-btn, .veloura-pc-native-quick, .veloura-quick-view-button, [data-veloura-quick-view]'
    )).filter(function (button) {
      return !button.closest('.veloura-qv-full') && !button.closest('.veloura-quick-view-modal');
    });
  }

  function ensureUnderCart(card) {
    if (!card) return;

    var buttons = allQuickButtons(card);
    if (!buttons.length) return;

    var keep = buttons.find(function (button) {
      return button.getAttribute('data-veloura-qv-under-cart') === 'true';
    }) || buttons.find(function (button) {
      return !button.closest('.s-product-card-image');
    }) || buttons[0];

    keep.classList.add('veloura-quick-view-btn', 'is-under-cart');
    keep.classList.remove('is-icon-only', 'veloura-pc-native-quick');
    keep.setAttribute('data-veloura-qv-under-cart', 'true');
    labelButton(keep);

    buttons.forEach(function (button) {
      if (button === keep) return;
      var wrapper = button.closest('.veloura-quick-view-under-cart-wrap');
      if (wrapper) wrapper.remove();
      else button.remove();
    });

    var wrapper = keep.closest('.veloura-quick-view-under-cart-wrap');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'veloura-quick-view-under-cart-wrap';
      if (keep.parentNode) keep.parentNode.removeChild(keep);
      wrapper.appendChild(keep);
    }

    var footer = card.querySelector('.s-product-card-content-footer');
    var addButton = card.querySelector('salla-add-product-button, .s-button-element, [class*="add-to-cart"], [class*="cart"]');
    var content = card.querySelector('.s-product-card-content') || card;

    if (footer && footer.parentNode) {
      if (footer.nextSibling !== wrapper) footer.parentNode.insertBefore(wrapper, footer.nextSibling);
    } else if (addButton && addButton.parentNode) {
      addButton.parentNode.insertBefore(wrapper, addButton.nextSibling);
    } else if (wrapper.parentNode !== content) {
      content.appendChild(wrapper);
    }

    var image = card.querySelector('.s-product-card-image');
    if (image) {
      Array.prototype.slice.call(image.querySelectorAll('.veloura-quick-view-btn, .veloura-pc-native-quick')).forEach(function (button) {
        if (button !== keep) button.remove();
      });
    }
  }

  function resetIconMode(card) {
    if (!card) return;
    var wrapper = card.querySelector('.veloura-quick-view-under-cart-wrap');
    if (!wrapper) return;
    var button = wrapper.querySelector('.veloura-quick-view-btn');
    if (!button) return;
    button.classList.remove('is-under-cart');
    button.classList.add('is-icon-only');
    button.removeAttribute('data-veloura-qv-under-cart');
    var image = card.querySelector('.s-product-card-image');
    if (image) {
      wrapper.remove();
      image.classList.add('veloura-quick-view-image-host');
      image.appendChild(button);
    }
  }

  function syncCard(card) {
    if (!card) return;
    var pos = activePosition();
    setPositionClass(pos);
    if (pos === 'below_add_to_cart') ensureUnderCart(card);
    else resetIconMode(card);
  }

  function syncAll() {
    ensureStyle();
    setAlignClass();
    document.querySelectorAll('.s-product-card-entry, product-card').forEach(function (node) {
      var card = node.classList && node.classList.contains('s-product-card-entry')
        ? node
        : (node.querySelector && node.querySelector('.s-product-card-entry')) || getCard(node);
      syncCard(card);
    });
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    syncAll();
    [120, 350, 850, 1600, 2600].forEach(function (ms) { setTimeout(syncAll, ms); });

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

  document.addEventListener('theme::ready', syncAll);
  document.addEventListener('salla::product.cards::loaded', syncAll);
})();
</script>
`;

try {
  JSON.parse(read(twilightPath));
  fs.mkdirSync(backupDir, { recursive: true });
  [masterPath, twilightPath].forEach(backup);

  const data = JSON.parse(read(twilightPath));
  const removed = removeSettingById(data, 'veloura_quick_view_product_link_text_2026');
  const glassSettings = findSettingsById(data, 'veloura_quick_view_overlay_blur_2026');
  if (!glassSettings.length) {
    throw new Error('Could not find veloura_quick_view_overlay_blur_2026 in twilight.json.');
  }

  glassSettings.forEach(setting => {
    setting.label = 'تفعيل الوضع الزجاجي';
    setting.description = 'عند التفعيل تصبح نافذة العرض السريع بلورية بنفس خامة زجاج الهيدر، بدون تغبيش خلفية الصفحة.';
  });

  write(twilightPath, JSON.stringify(data, null, 2) + '\n');
  JSON.parse(read(twilightPath));

  let master = read(masterPath);
  master = stripScriptBlock(master, SCRIPT_ID);

  if (!master.includes("veloura-product-card-center-text")) {
    const anchor = "{{ vpc_enabled ? ' veloura-product-card-enabled' : '' }}";
    if (!master.includes(anchor)) {
      throw new Error('Could not find product card body class anchor.');
    }
    master = master.replace(anchor, anchor + "\n  {{ vpc_enabled and vpc_center_text ? ' veloura-product-card-center-text' : '' }}\n  {{ vpc_enabled and not vpc_center_text ? ' veloura-product-card-align-right' : '' }}");
  }

  if (master.includes("productLinkText: {{ vqv_product_link_text|json_encode|raw }},")) {
    master = master.replace("        productLinkText: {{ vqv_product_link_text|json_encode|raw }},\n", '');
  }

  if (!master.includes('</body>')) {
    throw new Error('Could not find </body> in master.twig.');
  }

  master = master.replace('</body>', runtimeScript + '\n</body>');
  write(masterPath, master);

  console.log('twilight.json: OK');
  console.log('Quick View V27 installed correctly.');
  console.log('Removed product-link text setting count: ' + removed);
  console.log('Quick-view glass label updated.');
  console.log('Backup created at: ' + path.relative(root, backupDir));
} catch (error) {
  console.error('Install failed: ' + error.message);
  restore();
  console.error('Original files were restored from backup.');
  process.exit(1);
}
