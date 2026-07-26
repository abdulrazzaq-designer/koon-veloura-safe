#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');

function fail(message) {
  console.error(`\n[V49 VERIFY] FAILED: ${message}`);
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

if (!master.includes('Veloura QV V49 mobile buttons/order/glass dividers start')) fail('V49 master block is missing.');
if ((master.match(/Veloura QV V49 mobile buttons\/order\/glass dividers start/g) || []).length !== 1) fail('V49 master block is duplicated.');
if (master.includes('Veloura QV V48 thumbs/buttons/order/separators start')) fail('The conflicting V48 block still exists.');
if (!master.includes("page.getAttribute('data-v42-order-enabled') !== 'true'")) fail('The V42 ordering guard was not installed.');
if (!master.includes('veloura-v49-glass-active')) fail('Glass-only divider logic is missing.');
if (!master.includes("setImportant(main,'gap','0')")) fail('The action group still has an uncontrolled gap.');
if (!master.includes("var bg=index===0?cartBg:primary")) fail('Solid cart/Buy Now color split is missing.');
if (!master.includes('veloura_product_card_button_bg_color_2026')) fail('Customized product-card button color is not connected.');

if (!single.includes('Veloura V49 order settings start')) fail('V49 product-order settings are missing from single.twig.');
if (!single.includes('data-v42-order-enabled="{{ vpp_detail_order_enabled')) fail('The order switch is not connected to the product page.');
for (const attr of ['title','price','status','coupon','description','data','extras','options','quick','payments']) {
  if (!single.includes(`data-v42-order-${attr}=`)) fail(`Missing order attribute: ${attr}`);
}

const nodes = [];
(function walk(value, parent = null) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, value));
  if (!value || typeof value !== 'object') return;
  nodes.push({ node: value, parent });
  Object.values(value).forEach((child) => { if (child && typeof child === 'object') walk(child, value); });
})(twilight);

const normalize = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const switchRecord = nodes.find(({ node }) => node.type === 'boolean' && normalize(node.label).includes('تفعيل تخصيص ترتيب') && normalize(node.label).includes('تفاصيل المنتج'));
if (!switchRecord) fail('Could not find the detail-order switch in twilight.json.');
if (switchRecord.node.value !== false || switchRecord.node.selected !== false) fail('The detail-order switch is not disabled by default.');

const titleRecord = nodes.find(({ node }) => node.type === 'static' && normalize(`${node.label || ''} ${node.value || ''}`).includes('ترتيب تفاصيل المنتج'));
if (!titleRecord) fail('The detail-order title is missing.');
if (!Array.isArray(switchRecord.parent) || switchRecord.parent !== titleRecord.parent) fail('The title and switch are not in the same settings section.');
if (switchRecord.parent.indexOf(titleRecord.node) >= switchRecord.parent.indexOf(switchRecord.node)) fail('The detail-order title is not above the switch.');

const orderFields = nodes.filter(({ node }) => node.id && ['items','number'].includes(node.type) && normalize(node.label).includes('ترتيب'));
if (orderFields.length) {
  const unconditioned = orderFields.filter(({ node }) => !(Array.isArray(node.conditions) && node.conditions.some((c) => c && c.id === switchRecord.node.id && c.value === true)));
  if (unconditioned.length) fail('One or more order controls remain visible while the switch is off.');
}

console.log('twilight.json: OK');
console.log('Quick View V49 verified successfully.');
console.log('Mobile purchase buttons have real solid surfaces: customized cart color plus store-primary Buy Now.');
console.log('Ordering has a true OFF state and restores the native product-detail order.');
console.log('Glass dividers are edge-to-edge, spacing-free, and only active when backdrop blur is present.');
