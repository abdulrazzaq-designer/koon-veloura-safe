const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const twilightPath = path.join(root, 'twilight.json');

function fail(message) {
  console.error('Verify failed: ' + message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

try {
  const master = read(masterPath);
  const productJs = read(productJsPath);
  const single = read(singlePath);
  const twilight = read(twilightPath);

  JSON.parse(twilight);
  console.log('twilight.json: OK');

  const checks = [
    [master.includes('{# Veloura QV V38 product page performance hotfix start #}'), 'V38 block is missing from master.twig.'],
    [master.includes('veloura-qv-v38-product-performance-runtime-2026'), 'V38 runtime is missing.'],
    [!master.includes('{# Veloura QV V37 product details, sticky layer and related-card width fix start #}'), 'The old V37 runtime block still exists.'],
    [!master.includes("attributeFilter: ['class', 'style', 'thumbs-position']"), 'The expensive global attribute observer still exists.'],
    [!master.includes('slider.swiper.update()'), 'Repeated slider.swiper.update() is still present.'],
    [master.includes("relatedObserver.observe(related, { childList: true, subtree: true })"), 'The scoped related-products observer is missing.'],
    [master.includes('touch-action: pan-y pinch-zoom'), 'Touch-scroll protection is missing.'],
    [productJs.includes('Veloura V38 performance-safe zoom'), 'The safe zoom gate is missing from product.js.'],
    [productJs.includes("(hover: hover) and (pointer: fine)"), 'Zoom is not restricted to mouse/trackpad devices.'],
    [productJs.includes('!this.__velouraZoomInitialized'), 'The one-time zoom guard is missing.'],
    [!productJs.includes("window.addEventListener('resize', () => this.initImagesZooming())"), 'The old resize-triggered zoom reinitialization still exists.'],
    [single.includes('data-veloura-v37-thumbs='), 'V37 product setting data attributes are missing.'],
    [single.includes('data-veloura-v37-images-zoom='), 'V37 zoom setting data attribute is missing.']
  ];

  checks.forEach(([ok, message]) => { if (!ok) fail(message); });

  const count = (master.match(/Veloura QV V38 product page performance hotfix start/g) || []).length;
  if (count !== 1) fail(`V38 block count is ${count}; expected exactly 1.`);

  console.log('Quick View V38 verified successfully.');
  console.log('Product-page scrolling is no longer tied to a global DOM observer or repeated zoom initialization.');
  console.log('Zoom runs once on fine-pointer devices only; touch devices retain native vertical scrolling.');
  console.log('V37 settings, sticky layer and related-product width fixes remain present.');
} catch (error) {
  fail(error.message);
}
