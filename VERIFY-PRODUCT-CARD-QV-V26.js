const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const STYLE_ID = 'veloura-product-card-qv-v26-fix-2026';
const SCRIPT_ID = 'veloura-product-card-qv-v26-runtime-2026';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

try {
  JSON.parse(read(twilightPath));
  const master = read(masterPath);

  const required = [
    STYLE_ID,
    SCRIPT_ID,
    'veloura-product-image-ratio-',
    'veloura-quick-view-position-below_add_to_cart',
    'data-veloura-qv-under-cart',
    'backdrop-filter: none !important',
    's-product-card-fit-height.s-product-card-vertical .s-product-card-image'
  ];

  required.forEach(token => {
    if (!master.includes(token)) fail(`Missing required token in master.twig: ${token}`);
  });

  const styleCount = (master.match(new RegExp(STYLE_ID, 'g')) || []).length;
  const scriptCount = (master.match(new RegExp(SCRIPT_ID, 'g')) || []).length;

  if (styleCount !== 1) fail(`Invalid V26 style block count: ${styleCount}`);
  if (scriptCount !== 1) fail(`Invalid V26 runtime script count: ${scriptCount}`);

  console.log('twilight.json: OK');
  console.log('Quick View below-cart placement: OK');
  console.log('Quick View glass override: OK');
  console.log('Product image ratio stability: OK');
  console.log('Product Card Quick View V26 verified successfully.');
} catch (error) {
  fail('Verification failed: ' + error.message);
}
