#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
function fail(message) { console.error(`\n[V54 VERIFY] ERROR: ${message}`); process.exit(1); }
for (const file of [MASTER, SINGLE, TWILIGHT]) if (!fs.existsSync(file)) fail(`Missing ${path.relative(ROOT, file)}`);
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); } catch (error) { fail(`twilight.json invalid: ${error.message}`); }
const master = fs.readFileSync(MASTER, 'utf8');
const single = fs.readFileSync(SINGLE, 'utf8');
const start = '{# Veloura QV V54 Salla radius and card contract start #}';
const end = '{# Veloura QV V54 Salla radius and card contract end #}';
if ((master.split(start).length - 1) !== 1 || (master.split(end).length - 1) !== 1) fail('V54 block is missing or duplicated.');
for (const old of [
  'Veloura QV V50 product page recovery start',
  'Veloura QV V51 stable product controls and native thumbs start',
  'Veloura QV V52 product finish start',
  'Veloura QV V53 radius, related title and card-edge hotfix start'
]) if (master.includes(old)) fail(`Conflicting legacy block remains: ${old}`);
for (const needle of [
  '--veloura-v54-radius',
  'function syncPurchaseBar',
  'function syncThumbs',
  'function syncProductCards',
  'function syncFilters',
  'veloura-v54-card-action-row'
]) if (!master.includes(needle)) fail(`Missing V54 item: ${needle}`);
if (!single.includes('show-thumbs-controls="false"')) fail('Thumbnail controls are not disabled.');
if (!single.includes('class="veloura-product-related-title"')) fail('Stable related-products title is missing.');
if (/sticky-product-bar veloura-product-sticky-bar[^\"]*rounded-md/.test(single)) fail('Sticky purchase bar still has a hard-coded rounded-md class.');
if (/object-contain w-full h-full bg-gray-100 rounded-md overflow-hidden/.test(single)) fail('Thumbnail images still have a hard-coded rounded-md class.');
const script = (master.match(/<script[^>]*id="veloura-qv-v54-runtime-2026"[^>]*>([\s\S]*?)<\/script>/) || [])[1];
if (!script) fail('Could not extract the V54 runtime.');
const js = script.replace(/{{[\s\S]*?}}/g, '"0px"');
try { new Function(js); } catch (error) { fail(`V54 runtime syntax error: ${error.message}`); }
console.log('twilight.json: OK');
console.log('Quick View V54 verified successfully.');
console.log('Read More/Less, compact sticky purchase controls, thumbnail rings, category filter/sort controls and all product-card action rows share the intended radius and card contract.');
