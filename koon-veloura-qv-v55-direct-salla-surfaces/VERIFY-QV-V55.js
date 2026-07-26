#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
function fail(message) { console.error(`\n[V55 VERIFY] ERROR: ${message}`); process.exit(1); }
for (const f of [MASTER, SINGLE, TWILIGHT]) if (!fs.existsSync(f)) fail(`Missing ${path.relative(ROOT, f)}`);
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); } catch (e) { fail(`twilight.json invalid: ${e.message}`); }
const master = fs.readFileSync(MASTER, 'utf8');
const single = fs.readFileSync(SINGLE, 'utf8');
const checks = [
  [!master.includes('Veloura QV V54 Salla radius and card contract start'), 'V54 block still exists'],
  [(master.match(/Veloura QV V55 direct Salla surfaces start/g) || []).length === 1, 'V55 block missing or duplicated'],
  [master.includes('--salla-fast-checkout-button-border-radius'), 'Fast-checkout supported radius variable missing'],
  [master.includes('.veloura-product-page #btn-show-more'), 'Read More selector missing'],
  [master.includes('veloura-product-buttons-compact'), 'Compact sticky selector missing'],
  [master.includes('.swiper-slide-thumb-active'), 'Active thumbnail selector missing'],
  [master.includes('.veloura-product-related-products .s-product-card-entry'), 'Related card selector missing'],
  [single.includes('show-thumbs-controls="false"'), 'Thumbnail controls not disabled'],
  [single.includes('border-radius: var(--veloura-product-radius, 0px) !important'), 'Direct product radius styles missing'],
  [single.includes('--salla-fast-checkout-button-border-radius'), 'Purchase host radius variable missing']
];
for (const [ok, msg] of checks) if (!ok) fail(msg);

// Validate the embedded JS syntax independently from Twig/CSS.
const scriptMatch = master.match(/<script id="veloura-qv-v55-runtime-2026">([\s\S]*?)<\/script>/);
if (!scriptMatch) fail('V55 runtime script not found');
try { new Function(scriptMatch[1]); } catch (e) { fail(`V55 runtime syntax error: ${e.message}`); }

console.log('twilight.json: OK');
console.log('Quick View V55 verified successfully.');
console.log('V54 is absent; V55 has one bounded runtime and direct radius/spacing contracts for the requested product surfaces.');
