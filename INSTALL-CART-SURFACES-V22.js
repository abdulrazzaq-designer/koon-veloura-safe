'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const twilightPath = path.join(root, 'twilight.json');
const cartPath = path.join(root, 'src', 'views', 'pages', 'cart.twig');
const appScssPath = path.join(root, 'src', 'assets', 'styles', 'app.scss');
const payloadSettingsPath = path.join(root, 'payload', 'cart-surfaces-settings-v22.json');
const payloadScssPath = path.join(root, 'payload', 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v22.scss');
const targetScssPath = path.join(root, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v22.scss');

const importLine = "@import './05-utilities/veloura-cart-surfaces-v22';";
const bannerTitleId = 'veloura_cart_banners_settings_title_2026';
const bannerItemsId = 'veloura_cart_banners_items_2026';
const nextSectionId = 'veloura_product_card_settings_title_2026';
const oldSeparateTitleId = 'veloura_cart_surfaces_settings_title_2026';
const newMarker = 'Veloura Cart Surfaces V2.2 settings';

const surfaceIds = [
  'veloura_cart_surfaces_enabled_2026',
  'veloura_cart_surfaces_bg_color_2026',
  'veloura_cart_surfaces_radius_2026',
  'veloura_cart_surfaces_border_enabled_2026',
  'veloura_cart_surfaces_border_color_2026',
  'veloura_cart_surfaces_shadow_enabled_2026'
];

const requiredPaths = [twilightPath, cartPath, appScssPath, payloadSettingsPath, payloadScssPath];
for (const filePath of requiredPaths) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file was not found: ${filePath}`);
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON. Nothing was changed. ${error.message}`);
  }
}

function countById(settings, id) {
  return settings.filter((setting) => setting && setting.id === id).length;
}

function newlineOf(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function timestamp() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyWithDirs(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function writeAtomic(filePath, content) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.veloura-v22.tmp`;
  fs.writeFileSync(tempPath, content, 'utf8');
  fs.renameSync(tempPath, filePath);
}

function normalizeAppScss(appScss) {
  const nl = newlineOf(appScss);
  const oldImportPattern = /^\s*@import\s+['"]\.\/05-utilities\/veloura-cart-surfaces-v(?:1|21|22)['"]\s*;\s*$/gm;
  let output = appScss.replace(oldImportPattern, '');
  output = output.replace(/(?:\r?\n){3,}/g, `${nl}${nl}`);
  output = output.replace(/[ \t]+$/gm, '');
  output = output.replace(/\s*$/, '');
  return `${output}${nl}${nl}${importLine}${nl}`;
}

function normalizeCartTwig(cart) {
  const nl = newlineOf(cart);
  const contentBlockMatch = cart.match(/\{% block content %\}\r?\n/);
  if (!contentBlockMatch || contentBlockMatch.index === undefined) {
    throw new Error('Could not find the cart content block. Nothing was changed.');
  }

  const legacyMarkers = [
    'Veloura Cart Surfaces V1 settings',
    'Veloura Cart Surfaces V2.1 settings',
    'Veloura Cart Surfaces V2.2 settings'
  ];

  let output = cart;
  for (const marker of legacyMarkers) {
    const markerIndex = output.indexOf(marker);
    if (markerIndex === -1) continue;

    const commentStart = output.lastIndexOf('{#', markerIndex);
    const containerIndex = output.indexOf('<div class="container', markerIndex);
    if (commentStart === -1 || containerIndex === -1) {
      throw new Error(`Could not safely replace the existing ${marker} block. Nothing was changed.`);
    }
    output = output.slice(0, commentStart) + output.slice(containerIndex);
    break;
  }

  const refreshedBlockMatch = output.match(/\{% block content %\}\r?\n/);
  const insertAt = refreshedBlockMatch.index + refreshedBlockMatch[0].length;
  const containerStart = output.indexOf('<div class="container', insertAt);
  if (containerStart === -1) {
    throw new Error('Could not find the main cart container. Nothing was changed.');
  }
  const containerEnd = output.indexOf('>', containerStart);
  if (containerEnd === -1) {
    throw new Error('Could not locate the end of the main cart container tag. Nothing was changed.');
  }

  const settingsBlock = [
    `    {# ${newMarker} #}`,
    "    {% set vcart_enabled_raw = theme.settings.get('veloura_cart_surfaces_enabled_2026', false) %}",
    '    {% if vcart_enabled_raw.value is defined %}',
    '        {% set vcart_enabled_raw = vcart_enabled_raw.value %}',
    '    {% elseif vcart_enabled_raw.selected is defined %}',
    '        {% set vcart_enabled_raw = vcart_enabled_raw.selected %}',
    '    {% endif %}',
    "    {% set vcart_surfaces_enabled = vcart_enabled_raw == true or vcart_enabled_raw == 'true' or vcart_enabled_raw == 1 or vcart_enabled_raw == '1' or vcart_enabled_raw == 'on' %}",
    '',
    "    {% set vcart_surface_bg = theme.settings.get('veloura_cart_surfaces_bg_color_2026', '#f3f4f6') %}",
    '    {% if vcart_surface_bg.value is defined %}',
    '        {% set vcart_surface_bg = vcart_surface_bg.value %}',
    '    {% endif %}',
    '',
    "    {% set vcart_surface_radius_raw = theme.settings.get('veloura_cart_surfaces_radius_2026', 'medium') %}",
    '    {% if vcart_surface_radius_raw is iterable and vcart_surface_radius_raw[0].value is defined %}',
    '        {% set vcart_surface_radius_key = vcart_surface_radius_raw[0].value %}',
    '    {% elseif vcart_surface_radius_raw.value is defined %}',
    '        {% set vcart_surface_radius_key = vcart_surface_radius_raw.value %}',
    '    {% else %}',
    '        {% set vcart_surface_radius_key = vcart_surface_radius_raw %}',
    '    {% endif %}',
    '',
    "    {% set vcart_border_raw = theme.settings.get('veloura_cart_surfaces_border_enabled_2026', false) %}",
    '    {% if vcart_border_raw.value is defined %}',
    '        {% set vcart_border_raw = vcart_border_raw.value %}',
    '    {% elseif vcart_border_raw.selected is defined %}',
    '        {% set vcart_border_raw = vcart_border_raw.selected %}',
    '    {% endif %}',
    "    {% set vcart_surface_border_enabled = vcart_border_raw == true or vcart_border_raw == 'true' or vcart_border_raw == 1 or vcart_border_raw == '1' or vcart_border_raw == 'on' %}",
    '',
    "    {% set vcart_surface_border_color = theme.settings.get('veloura_cart_surfaces_border_color_2026', '#e5e7eb') %}",
    '    {% if vcart_surface_border_color.value is defined %}',
    '        {% set vcart_surface_border_color = vcart_surface_border_color.value %}',
    '    {% endif %}',
    '',
    "    {% set vcart_shadow_raw = theme.settings.get('veloura_cart_surfaces_shadow_enabled_2026', false) %}",
    '    {% if vcart_shadow_raw.value is defined %}',
    '        {% set vcart_shadow_raw = vcart_shadow_raw.value %}',
    '    {% elseif vcart_shadow_raw.selected is defined %}',
    '        {% set vcart_shadow_raw = vcart_shadow_raw.selected %}',
    '    {% endif %}',
    "    {% set vcart_surface_shadow_enabled = vcart_shadow_raw == true or vcart_shadow_raw == 'true' or vcart_shadow_raw == 1 or vcart_shadow_raw == '1' or vcart_shadow_raw == 'on' %}",
    '',
    '    {% set vcart_surface_radius_map = {',
    "        'sharp': '0px',",
    "        'soft': '10px',",
    "        'medium': '16px',",
    "        'large': '24px',",
    "        'round': '32px'",
    '    } %}',
    "    {% set vcart_surface_radius = vcart_surface_radius_map[vcart_surface_radius_key]|default('16px') %}",
    ''
  ].join(nl);

  const newContainer = [
    '<div class="container{% if vcart_surfaces_enabled %} veloura-cart-surfaces-enabled{% endif %}{% if vcart_surface_border_enabled %} veloura-cart-border-enabled{% endif %}{% if vcart_surface_shadow_enabled %} veloura-cart-shadow-enabled{% endif %}"',
    '         style="--veloura-cart-surface-bg: {{ vcart_surface_bg }}; --veloura-cart-surface-radius: {{ vcart_surface_radius }}; --veloura-cart-surface-border-color: {{ vcart_surface_border_color }};">'
  ].join(nl);

  output = output.slice(0, containerStart) + newContainer + output.slice(containerEnd + 1);
  output = output.slice(0, insertAt) + settingsBlock + output.slice(insertAt);

  if ((output.match(new RegExp(newMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
    throw new Error('The normalized cart settings marker was not generated exactly once. Nothing was changed.');
  }

  return output;
}

const twilightText = readUtf8(twilightPath);
const cartText = readUtf8(cartPath);
const appScssText = readUtf8(appScssPath);
const payload = parseJson(readUtf8(payloadSettingsPath), 'The V2.2 settings payload');
const twilight = parseJson(twilightText, 'twilight.json');

if (!Array.isArray(twilight.settings)) {
  throw new Error('twilight.json has no top-level settings array. Nothing was changed.');
}
if (!payload || !Array.isArray(payload.settings)) {
  throw new Error('The V2.2 settings payload has no settings array. Nothing was changed.');
}

const payloadIds = payload.settings.map((setting) => setting.id);
if (new Set(payloadIds).size !== payloadIds.length) {
  throw new Error('The V2.2 settings payload contains duplicate IDs. Nothing was changed.');
}
for (const id of surfaceIds) {
  if (!payloadIds.includes(id)) {
    throw new Error(`The V2.2 settings payload is missing ${id}. Nothing was changed.`);
  }
}

// Preserve merchant-selected values while replacing corrupted labels and descriptions.
const previousById = new Map();
for (const setting of twilight.settings) {
  if (setting && surfaceIds.includes(setting.id) && !previousById.has(setting.id)) {
    previousById.set(setting.id, setting);
  }
}

const preparedSettings = payload.settings.map((setting) => {
  const next = JSON.parse(JSON.stringify(setting));
  const previous = previousById.get(next.id);
  if (!previous) return next;

  if (next.type === 'boolean') {
    if (typeof previous.value === 'boolean') next.value = previous.value;
    if (typeof previous.selected === 'boolean') next.selected = previous.selected;
    else next.selected = next.value;
    return next;
  }

  if (next.format === 'color') {
    if (typeof previous.value === 'string' && previous.value.trim()) {
      next.value = previous.value;
    }
    return next;
  }

  if (next.format === 'dropdown-list' && Array.isArray(next.options)) {
    let previousValue = null;
    if (Array.isArray(previous.selected) && previous.selected[0]) {
      previousValue = previous.selected[0].value;
    } else if (previous.selected && typeof previous.selected === 'object') {
      previousValue = previous.selected.value;
    } else if (typeof previous.value === 'string') {
      previousValue = previous.value;
    }
    const matched = next.options.find((option) => option.value === previousValue);
    if (matched) next.selected = [JSON.parse(JSON.stringify(matched))];
    return next;
  }

  return next;
});

// Remove every legacy Cart Surfaces definition, including corrupted labels from V2.1.
twilight.settings = twilight.settings.filter((setting) => {
  if (!setting || typeof setting !== 'object') return true;
  return setting.id !== oldSeparateTitleId && !surfaceIds.includes(setting.id);
});

const bannerTitleIndex = twilight.settings.findIndex((setting) => setting && setting.id === bannerTitleId);
const bannerItemsIndex = twilight.settings.findIndex((setting) => setting && setting.id === bannerItemsId);
const nextSectionIndexBeforeInsert = twilight.settings.findIndex((setting) => setting && setting.id === nextSectionId);

if (bannerTitleIndex === -1 || bannerItemsIndex === -1) {
  throw new Error('Could not find the existing cart banners section. Nothing was changed.');
}
if (bannerItemsIndex <= bannerTitleIndex) {
  throw new Error('The cart banners settings order is unexpected. Nothing was changed.');
}
if (nextSectionIndexBeforeInsert !== -1 && bannerItemsIndex >= nextSectionIndexBeforeInsert) {
  throw new Error('The cart banners section boundary is unexpected. Nothing was changed.');
}

const bannerTitle = twilight.settings[bannerTitleIndex];
bannerTitle.value = payload.section_title_value;
bannerTitle.label = ' ';
bannerTitle.icon = 'sicon-image';

// Insert the new controls directly after the existing cart banners collection.
twilight.settings.splice(bannerItemsIndex + 1, 0, ...preparedSettings);

for (const id of surfaceIds) {
  const count = countById(twilight.settings, id);
  if (count !== 1) {
    throw new Error(`Setting definition ${id} must appear exactly once; found ${count}. Nothing was changed.`);
  }
}
if (countById(twilight.settings, oldSeparateTitleId) !== 0) {
  throw new Error('The old separate Cart Surfaces title still exists. Nothing was changed.');
}

const newBannerTitleIndex = twilight.settings.findIndex((setting) => setting && setting.id === bannerTitleId);
const newBannerItemsIndex = twilight.settings.findIndex((setting) => setting && setting.id === bannerItemsId);
const firstSurfaceIndex = twilight.settings.findIndex((setting) => setting && setting.id === surfaceIds[0]);
const newNextSectionIndex = twilight.settings.findIndex((setting) => setting && setting.id === nextSectionId);
if (!(newBannerTitleIndex < newBannerItemsIndex && newBannerItemsIndex < firstSurfaceIndex)) {
  throw new Error('The new settings were not inserted inside the cart banners section. Nothing was changed.');
}
if (newNextSectionIndex !== -1 && firstSurfaceIndex >= newNextSectionIndex) {
  throw new Error('The new settings were inserted outside the cart banners section. Nothing was changed.');
}

const bgSetting = twilight.settings.find((setting) => setting && setting.id === 'veloura_cart_surfaces_bg_color_2026');
if (!bgSetting || bgSetting.type !== 'string' || bgSetting.format !== 'color') {
  throw new Error('The cart background color setting must use type=string and format=color. Nothing was changed.');
}

const newTwilightText = `${JSON.stringify(twilight, null, 2)}\n`;
const parsedAfter = parseJson(newTwilightText, 'Generated twilight.json');
for (const id of surfaceIds) {
  if (countById(parsedAfter.settings, id) !== 1) {
    throw new Error(`Generated twilight.json failed validation for ${id}. Nothing was changed.`);
  }
}

const newCartText = normalizeCartTwig(cartText);
const newAppScssText = normalizeAppScss(appScssText);
const newScssText = readUtf8(payloadScssPath).replace(/\s*$/, '') + '\n';

if (!newCartText.includes(newMarker) || !newCartText.includes('veloura-cart-surfaces-enabled')) {
  throw new Error('Generated cart.twig failed validation. Nothing was changed.');
}
if ((newAppScssText.match(/veloura-cart-surfaces-v22/g) || []).length !== 1) {
  throw new Error('Generated app.scss does not contain exactly one V2.2 import. Nothing was changed.');
}

const backupRoot = path.join(root, 'migration-audit', `before-cart-surfaces-v22-${timestamp()}`);
const backupFiles = [
  [twilightPath, path.join(backupRoot, 'twilight.json')],
  [cartPath, path.join(backupRoot, 'src', 'views', 'pages', 'cart.twig')],
  [appScssPath, path.join(backupRoot, 'src', 'assets', 'styles', 'app.scss')]
];
for (const [source, destination] of backupFiles) {
  copyWithDirs(source, destination);
}

const targetScssExisted = fs.existsSync(targetScssPath);
const targetScssBackup = path.join(backupRoot, 'src', 'assets', 'styles', '05-utilities', 'veloura-cart-surfaces-v22.scss');
if (targetScssExisted) {
  copyWithDirs(targetScssPath, targetScssBackup);
}

try {
  writeAtomic(twilightPath, newTwilightText);
  writeAtomic(cartPath, newCartText);
  writeAtomic(appScssPath, newAppScssText);
  writeAtomic(targetScssPath, newScssText);

  const diskTwilight = parseJson(readUtf8(twilightPath), 'On-disk twilight.json');
  for (const id of surfaceIds) {
    if (countById(diskTwilight.settings, id) !== 1) {
      throw new Error(`On-disk validation failed for ${id}.`);
    }
  }
  if (!readUtf8(cartPath).includes(newMarker)) {
    throw new Error('On-disk cart.twig validation failed.');
  }
  if (!readUtf8(appScssPath).includes(importLine)) {
    throw new Error('On-disk app.scss validation failed.');
  }
} catch (error) {
  for (const [source, backup] of backupFiles) {
    copyWithDirs(backup, source);
  }
  if (targetScssExisted) {
    copyWithDirs(targetScssBackup, targetScssPath);
  } else if (fs.existsSync(targetScssPath)) {
    fs.unlinkSync(targetScssPath);
  }
  throw new Error(`Installation failed and original files were restored. ${error.message}`);
}

console.log('twilight.json: OK');
console.log('Arabic settings encoding: OK');
console.log('Cart settings merged into: Page and cart banners');
console.log('Cart Surfaces V2.2 installed correctly.');
console.log(`Backup: ${backupRoot}`);
