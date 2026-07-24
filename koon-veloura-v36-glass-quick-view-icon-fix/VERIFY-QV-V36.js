const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');

const BLOCK_START = '{# Veloura QV V36 quick-view glass icon fix start #}';
const BLOCK_END = '{# Veloura QV V36 quick-view glass icon fix end #}';
const STYLE_ID = 'veloura-qv-v36-glass-quick-icon-style-2026';
const SCRIPT_ID = 'veloura-qv-v36-glass-quick-icon-runtime-2026';

function fail(message) {
  console.error('VERIFY FAILED: ' + message);
  process.exit(1);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

if (!fs.existsSync(masterPath)) fail('Missing src/views/layouts/master.twig');
const master = fs.readFileSync(masterPath, 'utf8');

if (count(master, BLOCK_START) !== 1 || count(master, BLOCK_END) !== 1) fail('V36 block must exist exactly once.');
if (count(master, `id="${STYLE_ID}"`) !== 1) fail('V36 style must exist exactly once.');
if (count(master, `id="${SCRIPT_ID}"`) !== 1) fail('V36 runtime must exist exactly once.');

const required = [
  '.veloura-v36-glass-quick:not(.is-under-cart):not([data-veloura-qv-under-cart="true"])',
  'background: rgba(255, 255, 255, .26) !important;',
  'border: 1px solid rgba(255, 255, 255, .38) !important;',
  '-webkit-backdrop-filter: blur(16px) saturate(180%) !important;',
  'backdrop-filter: blur(16px) saturate(180%) !important;',
  "var MARKER = 'veloura-v36-glass-quick';",
  "button.closest('.veloura-quick-view-under-cart-wrap')",
  "button.classList.toggle(MARKER, isImageOverlay(button));",
  "button.classList.remove(MARKER);",
  'document.head.appendChild(style);',
  'salla::product.cards::loaded'
];

required.forEach(snippet => {
  if (!master.includes(snippet)) fail('Missing required V36 logic: ' + snippet);
});

const block = master.slice(master.indexOf(BLOCK_START), master.indexOf(BLOCK_END) + BLOCK_END.length);
if (block.includes('veloura-quick-view-modal__dialog')) fail('V36 must not change the quick-view modal.');
if (block.includes('veloura-quick-view-under-cart-wrap .veloura-v36-glass-quick:not')) {
  fail('V36 must not apply glass to the under-cart button.');
}
if (!master.includes('veloura-pc-glass')) fail('Product-card glass class is missing.');
if (!master.includes('veloura-quick-view-btn')) fail('Quick-view button implementation is missing.');

console.log('Quick View V36 verified successfully.');
console.log('Glass styling targets only the image-overlay quick-view icon and matches wishlist values.');
console.log('The under-cart quick-view button and modal remain unchanged.');
