#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const PRODUCT_CARD = path.join(ROOT, 'src', 'assets', 'js', 'partials', 'product-card.js');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const UNSAFE_PARTIAL = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');
const LEGACY_RUNTIME_IDS = ['veloura-qv-v35-grouped-actions-runtime-2026','veloura-qv-v36-glass-quick-icon-runtime-2026','veloura-product-card-native-actions-sync-2026','veloura-product-card-qv-v26-runtime-2026','veloura-qv-v27-spacing-radius-glass-fix-2026'];
let failed = false;
function check(condition, message) { if (condition) console.log(`OK: ${message}`); else { failed = true; console.error(`ERROR: ${message}`); } }
function count(text, needle) { return text.split(needle).length - 1; }
function read(file) { check(fs.existsSync(file), `File exists: ${path.relative(ROOT, file)}`); return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
const master = read(MASTER), single = read(SINGLE), productCard = read(PRODUCT_CARD), twilightRaw = read(TWILIGHT);
check(count(master, '{# Veloura V58 stable cards and purchase surfaces start #}') === 1, 'V58 master block exists once');
check(count(master, 'id="veloura-v58-stable-product-ui-runtime-2026"') === 1, 'V58 runtime exists once');
LEGACY_RUNTIME_IDS.forEach((id) => check(!master.includes(`id="${id}"`), `Conflicting runtime removed: ${id}`));
check(!master.includes('veloura-v57-product-ui-runtime-2026'), 'V57 runtime was removed');
check(!master.includes('veloura-v56-safe-product-ui-runtime'), 'V56 runtime was removed');
check(!master.includes('veloura-qv-v55-runtime-2026'), 'V55 runtime was removed');
check(!master.includes('partials.veloura-product-ui-contract'), 'Unsafe duplicate Twig include was removed');
check(!fs.existsSync(UNSAFE_PARTIAL), 'Unsafe duplicate Twig file was removed');
const runtimeMatch = master.match(/<script[^>]*id="veloura-v58-stable-product-ui-runtime-2026"[^>]*>([\s\S]*?)<\/script>/);
check(!!runtimeMatch, 'V58 browser runtime was found');
if (runtimeMatch) {
  try { new Function(runtimeMatch[1]); check(true, 'V58 browser JavaScript syntax is valid'); } catch (error) { check(false, `V58 browser JavaScript syntax is valid: ${error.message}`); }
  check(!runtimeMatch[1].includes('ResizeObserver'), 'V58 contains no ResizeObserver feedback loop');
  check(!/\.observe\([^;]+\{[^}]*attributes\s*:/s.test(runtimeMatch[1]), 'V58 observers do not watch class/style attributes');
  check(runtimeMatch[1].includes("document.addEventListener('veloura:product-card-rendered'"), 'V58 listens to product-card render completion');
}
check(count(single, 'veloura_recent_products_enabled_2026') === 1, 'Recently viewed enable setting is read once');
check(count(single, 'veloura_recent_products_inherit_related_2026') === 1, 'Recently viewed inherit setting is read once');
check(count(single, 'data-veloura-recent-products') === 1, 'Recently viewed section exists once');
check(/<salla-products-slider\b[\s\S]*?product-card-component="custom-salla-product-card"[\s\S]*?data-veloura-related-slider/.test(single), 'Related slider explicitly uses the custom product card');
const purchaseTag = single.match(/<section\b[^>]*data-veloura-purchase-bar[^>]*>/);
check(!!purchaseTag, 'Purchase bar markup exists');
if (purchaseTag) check(!purchaseTag[0].includes('veloura-glass-surface') && !purchaseTag[0].includes('veloura-glass-sticky-product'), 'Purchase bar does not start in glass mode');
check(count(productCard, '// Veloura V58: notify stable UI after every product-card render.') === 1, 'Product-card render event exists once');
check(count(productCard, 'Veloura V58 targeted quick-view observer start') === 1, 'Targeted quick-view observer exists once');
check(!productCard.includes('new MutationObserver(scanCards)'), 'Full-page scanCards observer was removed');
const productSyntax = spawnSync(process.execPath, ['--check', PRODUCT_CARD], { encoding: 'utf8' });
check(productSyntax.status === 0, productSyntax.status === 0 ? 'product-card.js syntax is valid' : `product-card.js syntax is valid: ${(productSyntax.stderr || productSyntax.stdout || '').trim()}`);
let twilight = null;
try { twilight = JSON.parse(twilightRaw); check(true, 'twilight.json is valid JSON'); } catch (error) { check(false, `twilight.json is valid JSON: ${error.message}`); }
if (twilight && Array.isArray(twilight.settings)) ['veloura_recent_products_enabled_2026','veloura_recent_products_inherit_related_2026'].forEach((id) => check(twilight.settings.filter((item) => item && item.id === id).length === 1, `${id} exists exactly once`));
check(count(master, '{%') === count(master, '%}'), 'master.twig statement delimiters are balanced');
check(count(single, '{%') === count(single, '%}'), 'single.twig statement delimiters are balanced');
check(count(single, '{{') === count(single, '}}'), 'single.twig output delimiters are balanced');
check(master.lastIndexOf('id="veloura-v58-stable-product-ui-runtime-2026"') < master.lastIndexOf('</body>'), 'V58 runtime is before </body>');
if (failed) { console.error(''); console.error('Veloura V58 verification failed.'); process.exit(1); }
console.log(''); console.log('Veloura V58 verification completed successfully.');
