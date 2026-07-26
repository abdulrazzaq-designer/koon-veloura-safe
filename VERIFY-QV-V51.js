#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const twilightPath = path.join(root, 'twilight.json');

function fail(message) {
  console.error(`\n[V51 VERIFY] ERROR: ${message}`);
  process.exit(1);
}
function count(text, needle) { return text.split(needle).length - 1; }
for (const file of [masterPath, singlePath, twilightPath]) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
}
try { JSON.parse(fs.readFileSync(twilightPath, 'utf8')); }
catch (error) { fail(`twilight.json is invalid: ${error.message}`); }

const master = fs.readFileSync(masterPath, 'utf8');
const single = fs.readFileSync(singlePath, 'utf8');

const start = '{# Veloura QV V51 stable product controls and native thumbs start #}';
const end = '{# Veloura QV V51 stable product controls and native thumbs end #}';
if (count(master, start) !== 1 || count(master, end) !== 1) fail('V51 block must exist exactly once.');
for (const old of [
  'Veloura QV V43 native related slider and purchase button colors start',
  'Veloura QV V47 related desktop/order/buttons/footer start',
  'Veloura QV V48 thumbs/buttons/order/separators start',
  'Veloura QV V49 mobile buttons/order/glass dividers start',
  'Veloura QV V50 product page recovery start'
]) {
  if (master.includes(old)) fail(`Old conflicting block still exists: ${old}`);
}
if (!master.includes('salla-add-product-button.sticky-product-bar__btn::part(button)')) fail('Stable native Add to Cart part styling is missing.');
if (!master.includes('--salla-fast-checkout-button-height:44px')) fail('Native Buy Now dimensions are missing.');
if (!master.includes('content:none!important')) fail('Divider cancellation is missing.');
if (master.includes('veloura-v50-action-') || master.includes('paintTree(') || master.includes('applySurface(')) fail('Shadow-DOM button rewriting still exists.');
if (!single.includes('thumbs-config=')) fail('Native thumbs-config is missing.');
if (!single.includes('"slidesPerView": 4') || !single.includes('"768": {"slidesPerView": 5')) fail('Expected mobile/desktop thumbnail counts are missing.');
if (!single.includes('<div slot="thumbs" class="veloura-product-native-thumbs">')) fail('Native thumbnail slot wrapper is not normalized.');
if (single.includes('veloura-v50-scrollable-thumbs') || single.includes('veloura-v49-scrollable-thumbs')) fail('Old custom thumbnail classes remain.');
if (!single.includes('data-veloura-related-hide-arrows=') || !single.includes('data-veloura-related-center-title=')) fail('Related controls are not exposed to runtime.');

const scriptMatch = master.match(/<script data-cfasync="false" id="veloura-qv-v51-runtime-2026">([\s\S]*?)<\/script>/);
if (!scriptMatch) fail('V51 runtime script not found.');
try { new Function(scriptMatch[1]); }
catch (error) { fail(`V51 runtime syntax error: ${error.message}`); }

console.log('twilight.json: OK');
console.log('Quick View V51 verified successfully.');
console.log('Purchase buttons use native Salla rendering, all dividers are gone, related controls are bounded, and multiple native thumbnails are configured.');
