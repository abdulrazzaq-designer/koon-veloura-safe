#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const UNSAFE_PARTIAL = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');

let failed = false;

function check(condition, message) {
  if (condition) {
    console.log(`OK: ${message}`);
  } else {
    failed = true;
    console.error(`ERROR: ${message}`);
  }
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function read(file) {
  check(fs.existsSync(file), `File exists: ${path.relative(ROOT, file)}`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const master = read(MASTER);
const single = read(SINGLE);
const twilightRaw = read(TWILIGHT);

check(count(master, '{# Veloura V57 unified product UI and recently viewed products start #}') === 1,
  'V57 master block exists once');
check(count(master, 'id="veloura-v57-product-ui-runtime-2026"') === 1,
  'V57 runtime exists once');
check(!master.includes('veloura-v56-safe-product-ui-runtime'),
  'Unsafe V56 ResizeObserver runtime was removed');
check(!master.includes('veloura-qv-v55-runtime-2026'),
  'Conflicting V55 runtime was removed');
check(!master.includes('partials.veloura-product-ui-contract'),
  'Unsafe duplicate Twig contract include was removed');
check(!fs.existsSync(UNSAFE_PARTIAL),
  'Unsafe duplicate Twig contract file was removed');

check(count(single, 'veloura_recent_products_enabled_2026') === 1,
  'Recently viewed enable setting is read once');
check(count(single, 'veloura_recent_products_inherit_related_2026') === 1,
  'Recently viewed inherit setting is read once');
check(count(single, 'data-veloura-recent-products') === 1,
  'Recently viewed section exists once');
check(!single.includes('veloura-glass-surface veloura-glass-sticky-product" data-veloura-purchase-bar'),
  'Purchase bar no longer starts in glass mode');

let twilight = null;
try {
  twilight = JSON.parse(twilightRaw);
  check(true, 'twilight.json is valid JSON');
} catch (error) {
  check(false, `twilight.json is valid JSON: ${error.message}`);
}

if (twilight && Array.isArray(twilight.settings)) {
  const ids = [
    'veloura_recent_products_enabled_2026',
    'veloura_recent_products_inherit_related_2026'
  ];
  ids.forEach((id) => {
    check(twilight.settings.filter((item) => item && item.id === id).length === 1,
      `${id} exists exactly once`);
  });
  const center = twilight.settings.findIndex((item) => item && item.id === 'veloura_related_center_title_2026');
  const enable = twilight.settings.findIndex((item) => item && item.id === ids[0]);
  const inherit = twilight.settings.findIndex((item) => item && item.id === ids[1]);
  check(center >= 0 && enable === center + 1 && inherit === center + 2,
    'Recently viewed switches are directly under related-products options');
}

const scriptMatch = master.match(
  /<script[^>]*id="veloura-v57-product-ui-runtime-2026"[^>]*>([\s\S]*?)<\/script>/
);
check(!!scriptMatch, 'V57 browser JavaScript was found');
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    check(true, 'V57 browser JavaScript syntax is valid');
  } catch (error) {
    check(false, `V57 browser JavaScript syntax is valid: ${error.message}`);
  }
}

check(count(master, '{%') === count(master, '%}'), 'master.twig statement delimiters are balanced');
check(count(single, '{%') === count(single, '%}'), 'single.twig statement delimiters are balanced');
check(count(single, '{{') === count(single, '}}'), 'single.twig output delimiters are balanced');
check(master.lastIndexOf('id="veloura-v57-product-ui-runtime-2026"') < master.lastIndexOf('</body>'),
  'V57 runtime is placed before </body>');

if (failed) {
  console.error('');
  console.error('Veloura V57 verification failed.');
  process.exit(1);
}

console.log('');
console.log('Veloura V57 verification completed successfully.');
