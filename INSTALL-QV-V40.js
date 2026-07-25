const fs = require('fs');
const path = require('path');

const root = process.cwd();
const twilightPath = path.join(root, 'twilight.json');
const singlePath = path.join(root, 'src', 'views', 'pages', 'product', 'single.twig');
const productJsPath = path.join(root, 'src', 'assets', 'js', 'product.js');
const backupDir = path.join(root, 'migration-audit', 'before-qv-v40-' + timestamp());

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}
function fail(message) { throw new Error(message); }
function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function backup(file, relativeName) {
  const target = path.join(backupDir, relativeName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function walkSettings(value, callback) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkSettings(item, callback));
    return;
  }
  if (!value || typeof value !== 'object') return;
  callback(value);
  Object.values(value).forEach((child) => walkSettings(child, callback));
}
function removeSettingById(value, id) {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const item = value[i];
      if (item && typeof item === 'object' && item.id === id) {
        value.splice(i, 1);
      } else {
        removeSettingById(item, id);
      }
    }
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.values(value).forEach((child) => removeSettingById(child, id));
}
function findSetting(rootValue, id) {
  let found = null;
  walkSettings(rootValue, (item) => {
    if (!found && item.id === id) found = item;
  });
  return found;
}
function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) fail(`Could not locate ${label}.`);
  return content.replace(search, replacement);
}
function removeMethod(content, methodName, nextMethodName) {
  const startToken = `    ${methodName}() {`;
  const endToken = `    ${nextMethodName}() {`;
  const start = content.indexOf(startToken);
  if (start < 0) return content;
  const end = content.indexOf(endToken, start);
  if (end < 0) fail(`Could not locate method after ${methodName}.`);
  return content.slice(0, start) + content.slice(end);
}

const twilightRaw = read(twilightPath);
const singleRaw = read(singlePath);
const productJsRaw = read(productJsPath);

backup(twilightPath, 'twilight.json');
backup(singlePath, path.join('src', 'views', 'pages', 'product', 'single.twig'));
backup(productJsPath, path.join('src', 'assets', 'js', 'product.js'));

// 1) Theme settings: remove the animated counter option and clarify coupon/thumbnail behavior.
let twilight;
try {
  twilight = JSON.parse(twilightRaw);
} catch (error) {
  fail(`twilight.json is not valid JSON: ${error.message}`);
}

removeSettingById(twilight, 'veloura_product_purchase_count_animated_2026');

const thumbsSetting = findSetting(twilight, 'veloura_product_thumbnails_position_desktop_2026');
if (!thumbsSetting) fail('Thumbnail position setting was not found in twilight.json.');
thumbsSetting.description = 'في اللابتوب: أسفل الصورة أو عمود عمودي على الجانب الأيمن. في الجوال تبقى الصور المصغرة أسفل الصورة.';

const couponToggle = findSetting(twilight, 'veloura_product_coupon_enabled_2026');
const couponCode = findSetting(twilight, 'veloura_product_coupon_code_2026');
if (!couponToggle || !couponCode) fail('Coupon settings were not found in twilight.json.');
couponToggle.description = 'يظهر صندوق الكوبون داخل تفاصيل المنتج فقط بعد تفعيل الخيار وكتابة كود فعلي في خانة كود الخصم.';
couponCode.placeholder = 'مثال: VEL10 — اكتب الكود الفعلي هنا';
couponCode.description = 'هذه الخانة تعرض الكود وتنسخه للعميل فقط. أنشئ الكود نفسه مسبقاً ضمن كوبونات المتجر ليعمل عند الدفع.';

write(twilightPath, JSON.stringify(twilight, null, 2) + '\n');

// 2) Product Twig: use supported Salla slider controls and make the purchase count static.
let single = singleRaw;
single = single.replace(/^\s*\{% set vpp_purchase_count_animated[^\n]*\}\s*\r?\n/m, '');
single = single.replace(/\s+thumbs-position="[^"]*"/g, '');

if (!single.includes('data-veloura-thumbs-layout="{{ vpp_thumbnails_position }}"')) {
  single = replaceOnce(
    single,
    'class="details-slider rounded-md image-slider"',
    'class="details-slider rounded-md image-slider"\n                        data-veloura-thumbs-layout="{{ vpp_thumbnails_position }}"',
    'product details slider class'
  );
}

if (!single.includes("vpp_thumbnails_position == 'right_side' ? 'vertical-thumbs'")) {
  single = replaceOnce(
    single,
    'loop="false"',
    'loop="false"\n                        {{ vpp_thumbnails_position == \'right_side\' ? \'vertical-thumbs\' : \'\' }}',
    'slider loop attribute'
  );
}

single = single.replace(
  /class="veloura-product-original-purchase-count\s+\{\{\s*vpp_purchase_count_animated\s*\?\s*'is-animated'\s*:\s*''\s*\}\}"/g,
  'class="veloura-product-original-purchase-count"'
);
single = single.replace(/^\s*data-veloura-purchase-count\s*\r?\n/gm, '');
single = single.replace(/^\s*data-count="\{\{\s*vpp_purchase_count_value\s*\}\}">\s*\r?\n/gm, '>\n');
single = single.replace(
  /\{\{\s*vpp_purchase_count_animated\s*\?\s*0\s*:\s*vpp_purchase_count_value\s*\}\}/g,
  '{{ vpp_purchase_count_value }}'
);
write(singlePath, single);

// 3) Product JS: remove count animation and initialize thumbnails once, with no scroll/DOM-wide observer.
let productJs = productJsRaw;
productJs = productJs.replace(/^\s*this\.initVelouraPurchaseCount\(\);\s*\r?\n/m, '');
productJs = removeMethod(productJs, 'initVelouraPurchaseCount', 'initVelouraPurchaseButtons');

if (!productJs.includes('this.initVelouraProductThumbnails();')) {
  productJs = replaceOnce(
    productJs,
    '        this.initVelouraProductPageState();',
    '        this.initVelouraProductPageState();\n        this.initVelouraProductThumbnails();',
    'product-page initialization call'
  );
}

if (!productJs.includes('    initVelouraProductThumbnails() {')) {
  const method = `    initVelouraProductThumbnails() {\n        const page = document.querySelector('.veloura-product-page');\n        const slider = page?.querySelector('salla-slider.details-slider.image-slider');\n\n        if (!page || !slider || slider.dataset.velouraThumbsReady === '1') {\n            return;\n        }\n\n        slider.dataset.velouraThumbsReady = '1';\n\n        const selectedLayout =\n            slider.getAttribute('data-veloura-thumbs-layout') ||\n            page.getAttribute('data-veloura-v37-thumbs') ||\n            'below_image';\n        const desktopMedia = window.matchMedia('(min-width: 768px)');\n\n        const applyLayout = async () => {\n            const vertical = selectedLayout === 'right_side' && desktopMedia.matches;\n            const thumbsConfig = {\n                direction: vertical ? 'vertical' : 'horizontal',\n                slidesPerView: 'auto',\n                spaceBetween: 12,\n                watchSlidesProgress: true,\n            };\n\n            slider.removeAttribute('thumbs-position');\n            slider.toggleAttribute('vertical-thumbs', vertical);\n            slider.setAttribute('thumbs-config', JSON.stringify(thumbsConfig));\n\n            try {\n                slider.verticalThumbs = vertical;\n                slider.thumbsConfig = thumbsConfig;\n\n                if (typeof slider.update === 'function') {\n                    await slider.update();\n                }\n            } catch (error) {\n                console.warn('Veloura thumbnail layout update failed:', error);\n            }\n        };\n\n        const initialize = () => {\n            applyLayout();\n            window.setTimeout(applyLayout, 120);\n        };\n\n        if (window.customElements?.whenDefined) {\n            window.customElements\n                .whenDefined('salla-slider')\n                .then(initialize)\n                .catch(initialize);\n        } else {\n            initialize();\n        }\n\n        if (typeof desktopMedia.addEventListener === 'function') {\n            desktopMedia.addEventListener('change', applyLayout);\n        } else if (typeof desktopMedia.addListener === 'function') {\n            desktopMedia.addListener(applyLayout);\n        }\n    }\n\n`;
  productJs = replaceOnce(
    productJs,
    '    initProductOptionValidations() {',
    method + '    initProductOptionValidations() {',
    'product option validation method'
  );
}

write(productJsPath, productJs);

console.log('twilight.json: OK');
console.log('Quick View V40 installed correctly.');
console.log('Desktop thumbnail position now uses Salla vertical-thumbs/thumbs-config; mobile remains horizontal.');
console.log('The animated purchase counter setting and animation runtime were removed; the real count renders immediately.');
console.log('Coupon settings now explain that a non-empty, real store coupon code is required.');
console.log(`Backup: ${path.relative(root, backupDir)}`);
