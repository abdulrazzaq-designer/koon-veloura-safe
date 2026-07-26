#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');

function fail(message) {
  console.error(`\n[V50 VERIFY] FAILED: ${message}`);
  process.exit(1);
}
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(ROOT, file)}`);
}
const master = fs.readFileSync(MASTER, 'utf8');
const single = fs.readFileSync(SINGLE, 'utf8');
let twilight;
try { twilight = JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); }
catch (error) { fail(`twilight.json is invalid: ${error.message}`); }

function count(text, token) { return text.split(token).length - 1; }
if (count(master, '{# Veloura QV V50 product page recovery start #}') !== 1) fail('V50 master block is missing or duplicated.');
if (master.includes('{# Veloura QV V49 mobile buttons/order/glass dividers start #}')) fail('The freezing V49 block still exists.');
const v50Start = master.indexOf('{# Veloura QV V50 product page recovery start #}');
const v50End = master.indexOf('{# Veloura QV V50 product page recovery end #}');
const v50 = master.slice(v50Start, v50End);
if (v50.includes('MutationObserver')) fail('V50 must not install a MutationObserver.');
if (!v50.includes('veloura-v50-scrollable-thumbs')) fail('Horizontal thumbnail recovery is missing.');
if (!v50.includes('veloura-v50-glass-active')) fail('Glass-only dividers are missing.');
if (!v50.includes('veloura_product_card_button_bg_color_2026')) fail('The customized cart color is not connected.');
if (!v50.includes("scheduled=[120,450,1000]")) fail('The bounded hydration retries are missing.');

const scriptMatch = v50.match(/<script[^>]*id="veloura-qv-v50-runtime-2026"[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) fail('V50 runtime script is missing.');
try { new Function(scriptMatch[1]); }
catch (error) { fail(`V50 JavaScript syntax error: ${error.message}`); }

if (single.includes('{# Veloura V49 order settings start #}')) fail('Duplicate V49 order settings remain in single.twig.');
if (single.includes('veloura_top_border_style_2026')) fail('The incorrect options-order setting ID remains.');
if (!single.includes('data-v42-order-enabled="{{ vpp_details_order_enabled')) fail('The canonical order switch is not connected.');
if (!single.includes('data-veloura-v50-recovered="true"')) fail('The recovered product root marker is missing.');
if (/class="main-content\s+veloura-v42-details-order/.test(single)) fail('The sortable class is still hard-coded while the switch is OFF.');

if (count(master, '{%') !== count(master, '%}')) fail('Unbalanced Twig statement delimiters in master.twig.');
if (count(single, '{%') !== count(single, '%}')) fail('Unbalanced Twig statement delimiters in single.twig.');
if (count(single, '{{') !== count(single, '}}')) fail('Unbalanced Twig output delimiters in single.twig.');

const nodes = [];
(function walk(value, parent = null) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, value));
  if (!value || typeof value !== 'object') return;
  nodes.push({ node: value, parent });
  Object.values(value).forEach((child) => { if (child && typeof child === 'object') walk(child, value); });
})(twilight);
const normalize = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const switchRecord = nodes.find(({ node }) => node.type === 'boolean' && (node.id === 'veloura_product_details_order_enabled_2026' || (normalize(node.label).includes('تفعيل تخصيص ترتيب') && normalize(node.label).includes('تفاصيل المنتج'))));
if (switchRecord) {
  if (switchRecord.node.value !== false || switchRecord.node.selected !== false) fail('The detail-order switch is not OFF by default.');
  const titleRecord = nodes.find(({ node }) => node.type === 'static' && normalize(`${node.label || ''} ${node.value || ''}`).includes('ترتيب تفاصيل المنتج'));
  if (!titleRecord) fail('The ordering title is missing.');
  if (Array.isArray(switchRecord.parent) && switchRecord.parent === titleRecord.parent && switchRecord.parent.indexOf(titleRecord.node) >= switchRecord.parent.indexOf(switchRecord.node)) fail('The ordering title is not above the switch.');
}

console.log('twilight.json: OK');
console.log('Quick View V50 recovery verified successfully.');
console.log('No recursive observer remains; product Twig/JavaScript delimiters and V50 runtime syntax are valid.');
console.log('Ordering is native while OFF, and the requested button, thumbnail and glass-divider fixes are preserved.');
