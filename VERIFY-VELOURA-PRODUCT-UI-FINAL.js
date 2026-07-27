#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER_PATH = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE_PATH = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT_PATH = path.join(ROOT, 'twilight.json');
const UNSAFE_PARTIAL_PATH = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');

function fail(message) {
  console.error('FAIL: ' + message);
  process.exitCode = 1;
}

function ok(message) {
  console.log('OK: ' + message);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function checkUnique(text, needle, label) {
  const found = count(text, needle);
  if (found === 1) ok(label);
  else fail(`${label} (expected 1, found ${found})`);
}

function checkBalancedTwig(text, label) {
  const pairs = [
    [/{%\s*if\b/g, /{%\s*endif\b/g, 'if'],
    [/{%\s*for\b/g, /{%\s*endfor\b/g, 'for'],
    [/{%\s*block\b/g, /{%\s*endblock\b/g, 'block'],
    [/{%\s*macro\b/g, /{%\s*endmacro\b/g, 'macro']
  ];
  let good = true;
  pairs.forEach(([start, end, name]) => {
    const a = (text.match(start) || []).length;
    const b = (text.match(end) || []).length;
    if (a !== b) {
      fail(`${label}: unbalanced Twig ${name} (${a}/${b})`);
      good = false;
    }
  });
  if (good) ok(`${label}: Twig blocks are balanced`);
}

const master = read(MASTER_PATH);
const single = read(SINGLE_PATH);
const twilightRaw = read(TWILIGHT_PATH);

checkUnique(master, '{# Veloura Product UI Final Stable 2026 start #}', 'Final master block is unique');
checkUnique(master, 'id="veloura-product-ui-final-runtime-2026"', 'Final runtime is unique');
checkUnique(single, '{# Veloura Product UI Final recently viewed settings start #}', 'Recently viewed Twig settings are unique');
checkUnique(single, 'data-veloura-recent-products', 'Recently viewed section is unique');
checkUnique(single, 'data-veloura-purchase-bar', 'Purchase bar marker is unique');

if (!master.includes('Veloura QV V35 grouped actions bottom spacing start')) {
  ok('V35 measuring loop was removed');
} else {
  fail('V35 measuring loop is still present');
}

if (!master.includes('Veloura QV V54 Salla radius and card contract start')) {
  ok('V54 resize/measurement loop was removed');
} else {
  fail('V54 resize/measurement loop is still present');
}

if (!fs.existsSync(UNSAFE_PARTIAL_PATH)) {
  ok('Unsafe duplicate Twig partial is absent');
} else {
  fail('Unsafe duplicate Twig partial still exists');
}

const finalStart = master.indexOf('{# Veloura Product UI Final Stable 2026 start #}');
const finalEnd = master.indexOf('{# Veloura Product UI Final Stable 2026 end #}', finalStart);
if (finalStart !== -1 && finalEnd !== -1) {
  const finalBlock = master.slice(finalStart, finalEnd);
  ['MutationObserver', 'ResizeObserver', 'getBoundingClientRect', 'translate3d'].forEach((token) => {
    if (finalBlock.includes(token)) fail(`Final block contains forbidden layout loop token: ${token}`);
    else ok(`Final block does not use ${token}`);
  });

  const scriptMarker = 'id="veloura-product-ui-final-runtime-2026"';
  const markerIndex = finalBlock.indexOf(scriptMarker);
  const scriptOpen = finalBlock.lastIndexOf('<script', markerIndex);
  const scriptBody = finalBlock.indexOf('>', scriptOpen) + 1;
  const scriptClose = finalBlock.indexOf('</script>', scriptBody);
  if (scriptOpen !== -1 && scriptBody > 0 && scriptClose !== -1) {
    const runtime = finalBlock.slice(scriptBody, scriptClose);
    try {
      new Function(runtime);
      ok('Final browser runtime JavaScript parses successfully');
    } catch (error) {
      fail('Final browser runtime has a syntax error: ' + error.message);
    }
  } else {
    fail('Could not extract final browser runtime');
  }
} else {
  fail('Could not locate the complete final master block');
}

[
  '--veloura-vpu-card-native-inline',
  'var(--veloura-product-button-margin-x, 0px)',
  'var(--veloura-product-button-margin-bottom, 0px)',
  '.s-product-card-content:has(.s-product-card-content-footer)',
  'padding-bottom: 0 !important',
  'box-shadow: 0 0 0 7px',
  'var(--veloura-product-radius, 0px)',
  '.veloura-product-mobile-sticky-enabled.veloura-product-buttons-compact',
  'body.veloura-glass-effect .veloura-product-page.veloura-product-mobile-sticky-enabled',
  'padding-bottom: clamp(56px, 7vw, 96px)',
  "slider.setAttribute('source', 'selected')",
  "slider.setAttribute('product-card-component', 'custom-salla-product-card')"
].forEach((needle) => {
  if (master.includes(needle)) ok(`Required contract found: ${needle}`);
  else fail(`Missing required contract: ${needle}`);
});

[
  'vpc_card_radius_raw.selected is defined',
  'vpc_image_radius_raw.selected is defined',
  'vpc_button_radius_raw.selected is defined',
  'vpc_button_margin_x.selected is defined',
  'vpc_button_margin_bottom.selected is defined',
  'vqv_button_radius_raw.selected is defined',
  'vqv_modal_radius_raw.selected is defined'
].forEach((needle) => {
  if (master.includes(needle)) ok(`Settings parser supports saved selection: ${needle.split('.')[0]}`);
  else fail(`Saved-selection parser is missing: ${needle}`);
});

if (single.includes('product-card-component="custom-salla-product-card"')) {
  ok('Related products use the custom product card');
} else {
  fail('Related products do not use the custom product card');
}

if (/data-veloura-purchase-bar[^>]*(?:veloura-glass-surface|veloura-glass-sticky-product)/.test(single)) {
  fail('Purchase bar still has permanent glass classes');
} else {
  ok('Purchase bar has no permanent glass classes');
}

if (single.includes("theme.settings.get('veloura_recent_products_enabled_2026'")) {
  ok('Recently viewed enable switch is connected to Twig');
} else {
  fail('Recently viewed enable switch is not connected to Twig');
}

if (single.includes("theme.settings.get('veloura_recent_products_inherit_related_2026'")) {
  ok('Recently viewed inherit switch is connected to Twig');
} else {
  fail('Recently viewed inherit switch is not connected to Twig');
}

let twilight;
try {
  twilight = JSON.parse(twilightRaw);
  ok('twilight.json parses successfully');
} catch (error) {
  fail('twilight.json is invalid: ' + error.message);
}

if (twilight && Array.isArray(twilight.settings)) {
  const ids = twilight.settings.map((item) => item && item.id);
  const enabledCount = ids.filter((id) => id === 'veloura_recent_products_enabled_2026').length;
  const inheritCount = ids.filter((id) => id === 'veloura_recent_products_inherit_related_2026').length;
  const anchor = ids.indexOf('veloura_related_center_title_2026');
  const enabled = ids.indexOf('veloura_recent_products_enabled_2026');
  const inherit = ids.indexOf('veloura_recent_products_inherit_related_2026');

  if (enabledCount === 1) ok('Recently viewed enable switch is unique in twilight.json');
  else fail(`Recently viewed enable switch count is ${enabledCount}`);

  if (inheritCount === 1) ok('Recently viewed inherit switch is unique in twilight.json');
  else fail(`Recently viewed inherit switch count is ${inheritCount}`);

  if (anchor !== -1 && enabled === anchor + 1 && inherit === anchor + 2) {
    ok('Both recent switches are directly below related-products settings');
  } else {
    fail('Recent switches are not directly below the related title setting');
  }
} else if (twilight) {
  fail('twilight.json does not contain a settings array');
}

checkBalancedTwig(master, 'master.twig');
checkBalancedTwig(single, 'single.twig');

if (process.exitCode) {
  console.error('');
  console.error('Veloura Product UI Final verification failed.');
  process.exit(1);
}

console.log('');
console.log('Veloura Product UI Final verification completed successfully.');
console.log('');
