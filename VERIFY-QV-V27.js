const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const SCRIPT_ID = 'veloura-qv-v27-spacing-radius-glass-fix-2026';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Missing file: ${path.relative(root, file)}`);
  return fs.readFileSync(file, 'utf8');
}

function count(text, needle) {
  return (text.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

function findById(node, id, results = []) {
  if (Array.isArray(node)) {
    node.forEach(item => findById(item, id, results));
  } else if (node && typeof node === 'object') {
    if (node.id === id && (node.type || node.format || node.label)) results.push(node);
    Object.keys(node).forEach(key => findById(node[key], id, results));
  }
  return results;
}

try {
  const data = JSON.parse(read(twilightPath));
  const master = read(masterPath);

  const textSetting = findById(data, 'veloura_quick_view_product_link_text_2026');
  if (textSetting.length !== 0) {
    fail('The removed product-link text setting still exists in twilight.json.');
  }

  const glassSettings = findById(data, 'veloura_quick_view_overlay_blur_2026');
  if (!glassSettings.length) fail('Quick-view glass setting is missing.');
  if (!glassSettings.every(setting => setting.label === 'تفعيل الوضع الزجاجي')) {
    fail('Quick-view glass setting label was not updated.');
  }

  if (!master.includes(SCRIPT_ID)) fail('V27 runtime script is missing from master.twig.');
  if (!master.includes('veloura-product-card-center-text')) fail('Center-text body class is missing.');
  if (!master.includes('veloura-product-card-align-right')) fail('Align-right body class is missing.');
  if (!master.includes('veloura-qv-v27-final-style-2026')) fail('V27 runtime CSS is missing.');
  if (count(master, SCRIPT_ID) !== 1) fail('V27 runtime script appears more than once.');

  console.log('twilight.json: OK');
  console.log('Quick View V27 verified successfully.');
} catch (error) {
  fail('Verify failed: ' + error.message);
}
