const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');
const SCRIPT_ID = 'veloura-qv-v28-layout-bottom-spacing-2026';
const STYLE_ID = 'veloura-qv-v28-layout-style-2026';
const SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';

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
  const settings = findSettingsById(data, SETTING_ID);

  if (settings.length !== 1) fail(`Invalid ${SETTING_ID} setting count: ${settings.length}`);
  if (settings[0].label !== 'المسافة أسفل زر العرض السريع') fail('Bottom spacing setting Arabic label is wrong.');
  if (String(settings[0].minimum) !== '0' || String(settings[0].maximum) !== '40') fail('Bottom spacing setting range is wrong.');

  if (!master.includes(SCRIPT_ID)) fail('V28 runtime script is missing from master.twig.');
  if (count(master, SCRIPT_ID) !== 1) fail('V28 runtime script appears more than once.');
  if (!master.includes(STYLE_ID)) fail('V28 runtime CSS style id is missing.');
  if (!master.includes("theme.settings.get('veloura_quick_view_button_margin_bottom_2026'")) fail('V28 Twig setting reader is missing.');
  if (!master.includes('--veloura-quick-view-button-margin-bottom: {{ vqv_button_margin_bottom }}px;')) fail('V28 CSS variable is missing.');
  if (!master.includes('margin-top: auto !important')) fail('V28 bottom layout CSS is missing.');
  if (!master.includes('أزرار إضافة السلة والعرض السريع تبقى في المنتصف')) fail('V28 center-button override is missing.');

  console.log('twilight.json: OK');
  console.log('Quick View V28 verified successfully.');
} catch (error) {
  fail('Verify failed: ' + error.message);
}
