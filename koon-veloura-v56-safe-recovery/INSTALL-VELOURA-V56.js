'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const BAD_PARTIAL = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');
const BACKUP_ROOT = path.join(ROOT, '.veloura-v56-backup');

function fail(message) {
  throw new Error(message);
}

function readRequired(file) {
  if (!fs.existsSync(file)) fail(`Required file was not found: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function writeWithEol(file, normalizedText, originalText) {
  const eol = originalText.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(file, normalizedText.replace(/\n/g, eol), 'utf8');
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(ROOT, file);
  const destination = path.join(BACKUP_ROOT, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (!fs.existsSync(destination)) fs.copyFileSync(file, destination);
}

function removeMarkedBlock(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return text;
  const end = text.indexOf(endMarker, start);
  if (end === -1) fail(`Found ${startMarker} without its closing marker.`);
  return text.slice(0, start) + text.slice(end + endMarker.length);
}

function replaceRadiusParser(text, variableName, settingName, fallback) {
  const setLine = `{% set ${variableName} = theme.settings.get('${settingName}', '${fallback}') %}`;
  const start = text.indexOf(setLine);
  if (start === -1) fail(`Could not find the ${settingName} parser in master.twig.`);

  const probe = text.slice(start, start + 900);
  if (probe.includes(`${variableName}.selected is defined`)) return text;

  const oldEnd = text.indexOf('{% endif %}', start);
  if (oldEnd === -1) fail(`Could not find the end of the ${settingName} parser.`);

  const keyName = variableName.replace(/_raw$/, '_key');
  const replacement = `${setLine}\n` +
`{% if ${variableName}.selected is defined %}\n` +
`  {% if ${variableName}.selected.value is defined %}\n` +
`    {% set ${keyName} = ${variableName}.selected.value %}\n` +
`  {% elseif ${variableName}.selected is iterable and ${variableName}.selected[0] is defined and ${variableName}.selected[0].value is defined %}\n` +
`    {% set ${keyName} = ${variableName}.selected[0].value %}\n` +
`  {% elseif ${variableName}.selected is iterable and ${variableName}.selected[0] is defined %}\n` +
`    {% set ${keyName} = ${variableName}.selected[0] %}\n` +
`  {% else %}\n` +
`    {% set ${keyName} = ${variableName}.selected %}\n` +
`  {% endif %}\n` +
`{% elseif ${variableName}.value is defined %}\n` +
`  {% if ${variableName}.value.value is defined %}\n` +
`    {% set ${keyName} = ${variableName}.value.value %}\n` +
`  {% elseif ${variableName}.value is iterable and ${variableName}.value[0] is defined and ${variableName}.value[0].value is defined %}\n` +
`    {% set ${keyName} = ${variableName}.value[0].value %}\n` +
`  {% else %}\n` +
`    {% set ${keyName} = ${variableName}.value %}\n` +
`  {% endif %}\n` +
`{% elseif ${variableName} is iterable and ${variableName}[0] is defined and ${variableName}[0].value is defined %}\n` +
`  {% set ${keyName} = ${variableName}[0].value %}\n` +
`{% elseif ${variableName} is iterable and ${variableName}[0] is defined %}\n` +
`  {% set ${keyName} = ${variableName}[0] %}\n` +
`{% else %}\n` +
`  {% set ${keyName} = ${variableName} %}\n` +
`{% endif %}`;

  return text.slice(0, start) + replacement + text.slice(oldEnd + '{% endif %}'.length);
}

function repairStickySection(text) {
  let changed = false;
  const output = text.replace(/<section\s+class="([^"]*\bveloura-product-sticky-bar\b[^"]*)"([^>]*)>/, (full, classValue, attributes) => {
    const classes = classValue.split(/\s+/).filter(Boolean);
    for (const required of ['veloura-glass-surface', 'veloura-glass-sticky-product']) {
      if (!classes.includes(required)) classes.push(required);
    }
    let attrs = attributes;
    if (!/\bdata-veloura-purchase-bar\b/.test(attrs)) attrs += ' data-veloura-purchase-bar';
    changed = true;
    return `<section class="${classes.join(' ')}"${attrs}>`;
  });
  if (!changed) fail('Could not locate the mobile purchase bar in single.twig.');
  return output;
}

const V56_START = '{# Veloura V56 safe product UI recovery start #}';
const V56_END = '{# Veloura V56 safe product UI recovery end #}';

const V56_BLOCK = String.raw`
{# Veloura V56 safe product UI recovery start #}
<style id="veloura-v56-safe-product-ui-style">
  /* Quick View reads the settings already exposed by master.twig. */
  html body .veloura-quick-view-modal__dialog,
  html body .veloura-qv-full__dialog {
    border-radius: var(--veloura-quick-view-modal-radius, 28px) !important;
    overflow: hidden !important;
  }

  html body .veloura-quick-view-modal__media,
  html body .veloura-quick-view-modal__content,
  html body .veloura-qv-full__media,
  html body .veloura-qv-full__content {
    border-radius: var(--veloura-quick-view-modal-radius, 28px) !important;
  }

  html body .veloura-quick-view-modal__close,
  html body .veloura-quick-view-modal__link,
  html body .veloura-qv-full__close,
  html body .veloura-qv-full__circle,
  html body .veloura-qv-full__add,
  html body .veloura-qv-full__read-more,
  html body .veloura-quick-view-btn,
  html body .veloura-pc-native-quick {
    border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
  }

  html body .veloura-qv-full__qty {
    border-radius: var(--veloura-quick-view-button-radius, 999px) !important;
    overflow: hidden !important;
  }

  html body .veloura-qv-full__qty button,
  html body .veloura-qv-full__qty input {
    border-radius: 0 !important;
  }

  /* Product cards, including cards rendered in the related-products slider. */
  .s-product-card-entry .veloura-v56-action-row {
    position: relative !important;
    display: flex !important;
    min-width: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    align-items: stretch !important;
    overflow: visible !important;
  }

  .s-product-card-entry .veloura-v56-action-row > *,
  .s-product-card-entry .veloura-v56-action-row salla-add-product-button {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  /* Mobile purchase-bar states. */
  @media (max-width: 640px) {
    .veloura-product-page.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact .veloura-product-sticky-bar {
      position: fixed !important;
      inset-inline: 12px !important;
      left: 12px !important;
      right: 12px !important;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      margin: 0 auto !important;
      border-radius: var(--veloura-v54-radius, var(--veloura-product-radius, 28px)) !important;
      overflow: hidden !important;
    }

    .veloura-product-page.veloura-product-mobile-sticky-enabled:not(.veloura-product-buttons-compact) .veloura-product-sticky-bar {
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      border-start-start-radius: var(--veloura-v54-radius, var(--veloura-product-radius, 28px)) !important;
      border-start-end-radius: var(--veloura-v54-radius, var(--veloura-product-radius, 28px)) !important;
      border-end-start-radius: 0 !important;
      border-end-end-radius: 0 !important;
    }

    .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar {
      position: relative !important;
      inset: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      transform: none !important;
      opacity: 1 !important;
      visibility: visible !important;
      border-radius: var(--veloura-v54-radius, var(--veloura-product-radius, 28px)) !important;
      background: var(--veloura-product-secondary-bg-inline, var(--veloura-v54-secondary-bg, #f8fafc)) !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      filter: none !important;
      box-shadow: none !important;
    }

    html.dark .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar,
    body.dark .veloura-product-page.veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar {
      background: var(--veloura-product-dark-secondary-bg-inline, #111111) !important;
      background-image: none !important;
    }
  }
</style>

<script data-cfasync="false" id="veloura-v56-safe-product-ui-runtime">
(function () {
  'use strict';

  var scheduled = 0;
  var resizeObserver = window.ResizeObserver ? new ResizeObserver(schedule) : null;
  var observedCards = typeof WeakSet === 'function' ? new WeakSet() : null;

  function rootStyle() {
    return getComputedStyle(document.documentElement);
  }

  function css(name, fallback) {
    var value = rootStyle().getPropertyValue(name).trim();
    return value || fallback;
  }

  function number(value) {
    value = parseFloat(value);
    return Number.isFinite(value) ? value : 0;
  }

  function important(element, property, value) {
    if (element && element.style) element.style.setProperty(property, value, 'important');
  }

  function ensureStyle(root, id, content) {
    if (!root) return;
    var style = root.querySelector('#' + id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      root.appendChild(style);
    }
    if (style.textContent !== content) style.textContent = content;
  }

  function collectRoots(start) {
    var roots = [];
    var queue = [start || document];
    var seen = [];
    while (queue.length) {
      var root = queue.shift();
      if (!root || seen.indexOf(root) !== -1) continue;
      seen.push(root);
      roots.push(root);
      if (!root.querySelectorAll) continue;
      root.querySelectorAll('*').forEach(function (node) {
        if (node.shadowRoot) queue.push(node.shadowRoot);
      });
    }
    return roots;
  }

  function deepAll(selector) {
    var output = [];
    collectRoots(document).forEach(function (root) {
      if (!root.querySelectorAll) return;
      root.querySelectorAll(selector).forEach(function (node) {
        if (output.indexOf(node) === -1) output.push(node);
      });
    });
    return output;
  }

  function isVisible(element) {
    if (!element || !element.getClientRects().length) return false;
    var style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function exposeParents(row, card) {
    var parent = row.parentElement;
    while (parent && parent !== card) {
      important(parent, 'overflow', 'visible');
      important(parent, 'max-width', 'none');
      parent = parent.parentElement;
    }
  }

  function styleCartButton(host, radius, height, index) {
    if (!host) return;
    host.setAttribute('width', 'wide');
    try { host.width = 'wide'; } catch (error) {}
    important(host, 'display', 'block');
    important(host, 'width', '100%');
    important(host, 'max-width', '100%');
    important(host, 'min-width', '0');
    important(host, 'height', height);
    important(host, 'min-height', height);
    important(host, 'border-radius', radius);
    host.style.setProperty('--salla-fast-checkout-button-border-radius', radius, 'important');

    if (!host.shadowRoot) return;
    ensureStyle(host.shadowRoot, 'veloura-v56-card-button-' + index,
      ':host{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;' +
      'height:' + height + '!important;min-height:' + height + '!important;border-radius:' + radius + '!important;overflow:hidden!important}' +
      '.s-add-product-button-main,button,.s-button-element,.s-button-btn,[part~="button"]{' +
      'width:100%!important;max-width:100%!important;min-width:0!important;height:' + height + '!important;' +
      'min-height:' + height + '!important;box-sizing:border-box!important;border-radius:' + radius + '!important;overflow:hidden!important}'
    );
  }

  function syncCard(card) {
    if (!card || !card.querySelectorAll) return;
    var x = Math.max(0, number(css('--veloura-product-button-margin-x', '0px')));
    var bottom = Math.max(0, number(css('--veloura-product-button-margin-bottom', '0px')));
    var height = css('--veloura-product-button-height', '42px');
    var radius = css('--veloura-product-button-radius', '16px');
    var rows = Array.prototype.filter.call(
      card.querySelectorAll('.s-product-card-content-footer,.veloura-quick-view-under-cart-wrap'),
      isVisible
    );

    rows.forEach(function (row, rowIndex) {
      var cardRect = card.getBoundingClientRect();
      if (cardRect.width < 2) return;
      exposeParents(row, card);
      row.classList.add('veloura-v56-action-row');

      ['width','max-width','min-width','margin-left','margin-right','margin-inline','left','right','inset-inline','transform','align-self'].forEach(function (property) {
        row.style.removeProperty(property);
      });

      var targetWidth = Math.max(0, cardRect.width - (x * 2));
      important(row, 'width', targetWidth.toFixed(3) + 'px');
      important(row, 'max-width', targetWidth.toFixed(3) + 'px');
      important(row, 'min-width', '0px');
      important(row, 'margin-left', '0px');
      important(row, 'margin-right', '0px');
      important(row, 'align-self', 'flex-start');
      important(row, 'margin-bottom', rowIndex === rows.length - 1 ? bottom + 'px' : '0px');

      var rowRect = row.getBoundingClientRect();
      var delta = (cardRect.left + x) - rowRect.left;
      important(row, 'transform', 'translate3d(' + delta.toFixed(3) + 'px,0,0)');

      row.querySelectorAll('salla-add-product-button').forEach(function (button, buttonIndex) {
        styleCartButton(button, radius, height, rowIndex + '-' + buttonIndex);
      });

      row.querySelectorAll('.veloura-quick-view-btn,.veloura-pc-native-quick').forEach(function (button) {
        important(button, 'height', css('--veloura-quick-view-button-height', height));
        important(button, 'min-height', css('--veloura-quick-view-button-height', height));
        important(button, 'border-radius', css('--veloura-quick-view-button-radius', radius));
      });
    });

    if (resizeObserver && observedCards && !observedCards.has(card)) {
      observedCards.add(card);
      resizeObserver.observe(card);
    }
  }

  function syncCards() {
    deepAll('.s-product-card-entry').forEach(syncCard);
  }

  function syncQuickView() {
    var modalRadius = css('--veloura-quick-view-modal-radius', '28px');
    var buttonRadius = css('--veloura-quick-view-button-radius', '999px');
    deepAll('.veloura-quick-view-modal__dialog,.veloura-qv-full__dialog').forEach(function (element) {
      important(element, 'border-radius', modalRadius);
      important(element, 'overflow', 'hidden');
    });
    deepAll('.veloura-quick-view-modal__media,.veloura-quick-view-modal__content,.veloura-qv-full__media,.veloura-qv-full__content').forEach(function (element) {
      important(element, 'border-radius', modalRadius);
    });
    deepAll('.veloura-quick-view-modal__close,.veloura-quick-view-modal__link,.veloura-qv-full__close,.veloura-qv-full__circle,.veloura-qv-full__add,.veloura-qv-full__read-more,.veloura-quick-view-btn,.veloura-pc-native-quick').forEach(function (element) {
      important(element, 'border-radius', buttonRadius);
    });
  }

  function syncPurchaseBar() {
    var page = document.querySelector('.veloura-product-page');
    var bar = page && page.querySelector('[data-veloura-purchase-bar],.veloura-product-sticky-bar');
    if (!bar) return;

    var sticky = page.classList.contains('veloura-product-mobile-sticky-enabled');
    var glass = document.body.classList.contains('veloura-glass-effect');
    if (!sticky) {
      bar.classList.remove('veloura-glass-surface', 'veloura-glass-sticky-product');
    } else if (glass) {
      bar.classList.add('veloura-glass-surface', 'veloura-glass-sticky-product');
    }

    var radius = css('--veloura-v54-radius', css('--veloura-product-radius', '28px'));
    var host = bar.querySelector('salla-add-product-button');
    if (host) styleCartButton(host, radius, '46px', 'purchase');
  }

  function run() {
    syncQuickView();
    syncCards();
    syncPurchaseBar();
  }

  function schedule() {
    clearTimeout(scheduled);
    scheduled = setTimeout(run, 70);
  }

  function start() {
    run();
    [180, 500, 1100, 2200].forEach(function (delay) { setTimeout(run, delay); });
    if (document.body && window.MutationObserver) {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  document.addEventListener('theme::ready', schedule);
  document.addEventListener('salla::products::loaded', schedule);
  document.addEventListener('salla::product.cards::loaded', schedule);
  document.addEventListener('salla::product::details::loaded', schedule);
  window.addEventListener('pageshow', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
})();
</script>
{# Veloura V56 safe product UI recovery end #}
`;

function main() {
  const masterOriginal = readRequired(MASTER);
  const singleOriginal = readRequired(SINGLE);
  backup(MASTER);
  backup(SINGLE);
  backup(BAD_PARTIAL);

  let master = normalize(masterOriginal);
  let single = normalize(singleOriginal);

  // Remove the previous unsafe duplicate contract and its include.
  master = master.replace(/\n?\s*\{%\s*include\s+['"]partials\.veloura-product-ui-contract['"]\s*%\}\s*\n?/g, '\n');
  master = removeMarkedBlock(master, V56_START, V56_END);

  // Repair the two Quick View setting parsers in their original location.
  master = replaceRadiusParser(master, 'vqv_button_radius_raw', 'veloura_quick_view_button_radius_2026', 'round');
  master = replaceRadiusParser(master, 'vqv_modal_radius_raw', 'veloura_quick_view_modal_radius_2026', 'large');

  const bodyClose = master.lastIndexOf('</body>');
  if (bodyClose === -1) fail('master.twig does not contain </body>.');
  master = master.slice(0, bodyClose) + V56_BLOCK + '\n\n' + master.slice(bodyClose);

  single = repairStickySection(single);

  writeWithEol(MASTER, master, masterOriginal);
  writeWithEol(SINGLE, single, singleOriginal);

  if (fs.existsSync(BAD_PARTIAL)) fs.rmSync(BAD_PARTIAL, { force: true });

  console.log('Veloura V56 safe recovery was installed successfully.');
  console.log('Removed the unsafe duplicate Twig contract.');
  console.log('Fixed Quick View radius parsing, related-card spacing, and mobile purchase-bar states.');
}

main();
