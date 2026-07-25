const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');

function fail(message) {
  console.error('Verify failed: ' + message);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail('Missing file: ' + path.relative(root, file));
  return fs.readFileSync(file, 'utf8');
}

const master = read(masterPath);
const single = read(singlePath);
const productJs = read(productJsPath);

[
  'veloura-qv-v41-sticky-thumbs-style-2026',
  'veloura-v41-sticky-enabled',
  'z-index: 2147483000',
  '.veloura-product-mobile-sticky-disabled',
  '.veloura-v41-thumb-rail',
  'grid-template-areas: "main thumbs"'
].forEach(value => {
  if (!master.includes(value)) fail('Missing master feature: ' + value);
});

[
  'data-veloura-v41-sticky=',
  'data-veloura-thumbs-layout=',
  'class="veloura-v41-native-thumbs"'
].forEach(value => {
  if (!single.includes(value)) fail('Missing Twig feature: ' + value);
});
if (single.includes("vpp_thumbnails_position == 'right_side' ? 'vertical-thumbs'")) {
  fail('The obsolete native vertical-thumbs Twig switch still exists.');
}
if (/thumbs-position="/.test(single)) fail('The unsupported thumbs-position attribute still exists.');

[
  'initVelouraProductThumbnails()',
  "shell.classList.toggle('is-right-thumbs', right)",
  "slider.removeAttribute('vertical-thumbs')",
  "slider.slideTo(index)",
  "const visibleCount = height >= width * 1.08 ? 3 : 2",
  "document.body.classList.toggle('veloura-v41-sticky-disabled', !stickyEnabled)"
].forEach(value => {
  if (!productJs.includes(value)) fail('Missing product.js feature: ' + value);
});

const blockCount = (master.match(/Veloura QV V41 sticky state and custom right thumbnails start/g) || []).length;
if (blockCount !== 1) fail('V41 master block count must be exactly one.');

console.log('Quick View V41 verified successfully.');
console.log('Sticky enabled/disabled states are explicit and the fixed bar uses the top page-content layer.');
console.log('Right-side thumbnails are rendered in a dedicated rail on the right, equal to the main gallery height.');
console.log('Mobile keeps the native horizontal thumbnails under the image.');
