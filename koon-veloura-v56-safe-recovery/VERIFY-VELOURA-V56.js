'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const BAD_PARTIAL = path.join(ROOT, 'src', 'views', 'partials', 'veloura-product-ui-contract.twig');

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK: ${message}`);
}

const master = fs.readFileSync(MASTER, 'utf8');
const single = fs.readFileSync(SINGLE, 'utf8');

check(!master.includes("partials.veloura-product-ui-contract"), 'unsafe contract include is removed');
check(!fs.existsSync(BAD_PARTIAL), 'unsafe contract file is removed');
check((master.match(/Veloura V56 safe product UI recovery start/g) || []).length === 1, 'V56 block exists exactly once');
check(master.includes('vqv_button_radius_raw.selected is defined'), 'Quick View button radius reads selected.value');
check(master.includes('vqv_modal_radius_raw.selected is defined'), 'Quick View modal radius reads selected.value');
check(master.includes('var(--veloura-product-button-margin-x'), 'product-card horizontal spacing is connected');
check(master.includes('veloura-product-mobile-sticky-enabled:not(.veloura-product-buttons-compact)'), 'full-width sticky state has separate corners');
check(master.includes('veloura-product-mobile-sticky-disabled .veloura-product-sticky-bar'), 'static purchase-bar state is isolated from glass');
check(/veloura-product-sticky-bar[^\"]*veloura-glass-surface[^\"]*veloura-glass-sticky-product/.test(single), 'purchase bar retains glass hooks for sticky mode');
check(single.includes('data-veloura-purchase-bar'), 'purchase bar has the V56 runtime hook');
check(master.trimEnd().endsWith('</html>'), 'master.twig still ends with </html>');

console.log('\nVeloura V56 verification completed successfully.');
