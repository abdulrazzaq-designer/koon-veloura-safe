const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const STYLE_ID = 'veloura-qv-v29-card-align-layout-fix-2026';
const BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

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

function findSettingsById(node, id, results = []) {
  if (Array.isArray(node)) {
    node.forEach(item => findSettingsById(item, id, results));
    return results;
  }
  if (node && typeof node === 'object') {
    if (node.id === id && (node.type || node.format || node.label)) results.push(node);
    Object.keys(node).forEach(key => findSettingsById(node[key], id, results));
  }
  return results;
}

try {
  const data = JSON.parse(read(twilightPath));
  const master = read(masterPath);
  const settings = findSettingsById(data, BOTTOM_SETTING_ID);

  if (settings.length !== 1) fail(`Invalid ${BOTTOM_SETTING_ID} setting count: ${settings.length}`);
  if (settings[0].label !== 'المسافة أسفل زر العرض السريع') fail('Quick-view bottom spacing Arabic label is wrong.');
  if (String(settings[0].minimum) !== '0' || String(settings[0].maximum) !== '60') fail('Quick-view bottom spacing range is wrong.');

  if (!master.includes(STYLE_ID)) fail('V29 style block is missing from master.twig.');
  if (count(master, STYLE_ID) !== 1) fail('V29 style block appears more than once.');
  if (!master.includes("theme.settings.get('veloura_product_card_center_text_2026'")) fail('V29 center-text reader is missing.');
  if (!master.includes("theme.settings.get('veloura_product_card_button_margin_x_2026'")) fail('V29 button horizontal margin reader is missing.');
  if (!master.includes("theme.settings.get('veloura_quick_view_button_margin_bottom_2026'")) fail('V29 quick-view bottom margin reader is missing.');
  if (!master.includes('margin-top: auto !important')) fail('V29 stable bottom layout rule is missing.');
  if (!master.includes('width: calc(100% - (var(--veloura-v29-card-button-margin-x) * 2)) !important;')) fail('V29 equal quick-view/add-to-cart width rule is missing.');
  if (!master.includes('أزرار أضف للسلة والعرض السريع تبقى في المنتصف دائمًا')) fail('V29 center-buttons rule marker is missing.');
  if (!master.includes('text-align: right !important')) fail('V29 right alignment rule is missing.');
  if (!master.includes('text-align: center !important')) fail('V29 center alignment rule is missing.');

  console.log('twilight.json: OK');
  console.log('Quick View V29 verified successfully.');
} catch (error) {
  fail('Verify failed: ' + error.message);
}
