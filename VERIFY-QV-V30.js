const fs = require('fs');
const path = require('path');

const root = process.cwd();
const masterPath = path.join(root, 'src', 'views', 'layouts', 'master.twig');
const twilightPath = path.join(root, 'twilight.json');

const STYLE_ID = 'veloura-qv-v30-absolute-card-spacing-2026';
const HORIZONTAL_SETTING_ID = 'veloura_product_card_button_margin_x_2026';
const BOTTOM_SETTING_ID = 'veloura_product_card_button_margin_bottom_2026';
const OLD_QV_BOTTOM_SETTING_ID = 'veloura_quick_view_button_margin_bottom_2026';
const OLD_V29_STYLE_ID = 'veloura-qv-v29-card-align-layout-fix-2026';

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

  const horizontalSettings = findSettingsById(data, HORIZONTAL_SETTING_ID);
  const bottomSettings = findSettingsById(data, BOTTOM_SETTING_ID);
  const oldQuickBottomSettings = findSettingsById(data, OLD_QV_BOTTOM_SETTING_ID);

  if (horizontalSettings.length !== 1) fail(`Invalid ${HORIZONTAL_SETTING_ID} setting count: ${horizontalSettings.length}`);
  if (bottomSettings.length !== 1) fail(`Invalid ${BOTTOM_SETTING_ID} setting count: ${bottomSettings.length}`);
  if (oldQuickBottomSettings.length !== 0) fail(`${OLD_QV_BOTTOM_SETTING_ID} should be removed because V30 uses the add-to-cart bottom spacing slider.`);

  const x = horizontalSettings[0];
  const bottom = bottomSettings[0];

  if (String(x.value) !== '10' || String(x.default) !== '10') fail('Horizontal spacing initial/default value must be 10.');
  if (String(bottom.value) !== '10' || String(bottom.default) !== '10') fail('Bottom spacing initial/default value must be 10.');
  if (String(x.minimum) !== '0' || String(bottom.minimum) !== '0') fail('Spacing sliders must allow real zero.');
  if (String(x.maximum) !== '60' || String(bottom.maximum) !== '60') fail('Spacing slider maximum should be 60.');
  if (!String(x.description || '').includes('0 يعني بلا مسافة')) fail('Horizontal spacing description must explain real zero.');
  if (!String(bottom.description || '').includes('0 يعني بلا مسافة')) fail('Bottom spacing description must explain real zero.');

  if (!master.includes(STYLE_ID)) fail('V30 style block is missing from master.twig.');
  if (count(master, STYLE_ID) !== 1) fail('V30 style block appears more than once.');
  if (master.includes(OLD_V29_STYLE_ID)) fail('Old V29 style block is still present.');
  if (master.includes("theme.settings.get('veloura_quick_view_button_margin_bottom_2026'")) fail('Old quick-view-only bottom spacing reader is still present.');

  if (!master.includes("theme.settings.get('veloura_product_card_button_margin_x_2026', 10)")) fail('V30 horizontal spacing reader is missing or does not default to 10.');
  if (!master.includes("theme.settings.get('veloura_product_card_button_margin_bottom_2026', 10)")) fail('V30 bottom spacing reader is missing or does not default to 10.');
  if (!master.includes('--veloura-v30-card-button-margin-x: {{ v30_button_margin_x }}px;')) fail('V30 horizontal CSS variable is missing.');
  if (!master.includes('--veloura-v30-card-button-bottom-space: {{ v30_button_bottom_space }}px;')) fail('V30 bottom CSS variable is missing.');
  if (!master.includes('width: calc(100% - (var(--veloura-v30-card-button-margin-x) * 2)) !important;')) fail('V30 exact width rule is missing.');
  if (!master.includes('margin-bottom: var(--veloura-v30-card-button-bottom-space) !important;')) fail('V30 exact bottom spacing rule is missing.');
  if (!master.includes('gap: 0 !important;')) fail('V30 zero-gap reset is missing.');
  if (!master.includes('0px means 0px')) fail('V30 absolute-value comment is missing.');
  if (!master.includes('text-align: right !important')) fail('V30 right alignment rule is missing.');
  if (!master.includes('text-align: center !important')) fail('V30 center alignment rule is missing.');

  console.log('twilight.json: OK');
  console.log('Quick View V30 verified successfully.');
} catch (error) {
  fail('Verify failed: ' + error.message);
}
