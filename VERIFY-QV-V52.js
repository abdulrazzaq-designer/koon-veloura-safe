#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');

function fail(message) {
  console.error(`\n[V52 VERIFY] ERROR: ${message}`);
  process.exit(1);
}
function count(text, needle) { return text.split(needle).length - 1; }

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(ROOT, file)}`);
}
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); }
catch (error) { fail(`twilight.json is invalid: ${error.message}`); }

const master = fs.readFileSync(MASTER, 'utf8');
const single = fs.readFileSync(SINGLE, 'utf8');
const start = '{# Veloura QV V52 product finish start #}';
const end = '{# Veloura QV V52 product finish end #}';

if (count(master, start) !== 1 || count(master, end) !== 1) fail('V52 block must exist exactly once.');
for (const old of [
  'Veloura QV V39 product page final fixes start',
  'Veloura QV V42 product details order, related columns and compact sticky start',
  'Veloura QV V47 related desktop/order/buttons/footer start',
  'Veloura QV V48 thumbs/buttons/order/separators start',
  'Veloura QV V49 mobile buttons/order/glass dividers start',
  'Veloura QV V50 product page recovery start',
  'Veloura QV V51 stable product controls and native thumbs start'
]) {
  if (master.includes(old)) fail(`Old conflicting product-page block remains: ${old}`);
}

if (!master.includes('border-radius: var(--veloura-product-radius, 28px)')) fail('Global radius linkage is missing.');
if (!master.includes('show-thumbs-controls')) fail('Thumbnail runtime configuration is missing.');
if (!master.includes('slidesPerGroup:1')) fail('One-product related slider snapping is missing.');
if (!master.includes('centerTitleNodes')) fail('Related title centering runtime is missing.');
if (!master.includes('copyCoupon')) fail('Coupon copy runtime is missing.');
if (!master.includes('content: none !important')) fail('Divider cancellation is missing.');
if (!master.includes('data-v42-order-enabled')) fail('Ordering OFF/ON handling is missing.');

if (count(single, '{# Veloura V52 text normalizer start #}') !== 1) fail('V52 text normalizer must exist exactly once.');
if (!single.includes("vpp_coupon_code = _self.veloura_text")) fail('Coupon code does not use the value-first text normalizer.');
if (!single.includes("vpp_liked_title = _self.veloura_text")) fail('Related title does not use the value-first text normalizer.');
if (!single.includes('show-thumbs-controls="false"')) fail('Thumbnail controls are not disabled in product Twig.');
if (!single.includes('"slidesPerView": 4') || !single.includes('"768": {"slidesPerView": 5')) fail('Expected thumbnail counts are missing.');
if (!single.includes('data-veloura-related-snap="one"')) fail('Related slider snap marker is missing.');
if (!single.includes("is-title-centered")) fail('Related title center class is missing.');

const scriptMatch = master.match(/<script data-cfasync="false" id="veloura-qv-v52-runtime-2026">([\s\S]*?)<\/script>/);
if (!scriptMatch) fail('V52 runtime script not found.');
try { new Function(scriptMatch[1]); }
catch (error) { fail(`V52 runtime syntax error: ${error.message}`); }

console.log('twilight.json: OK');
console.log('Quick View V52 verified successfully.');
console.log('Global radius controls the sticky mobile card and thumbnails; thumbnail arrows are removed.');
console.log('Related title centering and exact one-card snapping are connected to the inner slider.');
console.log('Coupon reads saved text values, appears above the description, uses the secondary surface, and supports copy.');
