#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP_DIR = path.join(ROOT, '.veloura-v49-backup');

function fail(message) {
  console.error(`\n[V49] ERROR: ${message}`);
  process.exit(1);
}

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  const target = path.join(BACKUP_DIR, path.basename(file));
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function walk(value, visitor, parent = null, key = null) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, value, index));
    return;
  }
  if (!value || typeof value !== 'object') return;
  visitor(value, parent, key);
  for (const [childKey, childValue] of Object.entries(value)) {
    if (childValue && typeof childValue === 'object') walk(childValue, visitor, value, childKey);
  }
}

function getAllNodes(root) {
  const nodes = [];
  walk(root, (node, parent, key) => nodes.push({ node, parent, key }));
  return nodes;
}

function parentArrayOf(root, target) {
  let found = null;
  walk(root, (node, parent) => {
    if (node === target && Array.isArray(parent)) found = parent;
  });
  return found;
}

function findOrderSwitch(nodes) {
  const exact = nodes.find(({ node }) => {
    if (node.type !== 'boolean') return false;
    const label = normalizeText(node.label);
    return label.includes('تفعيل تخصيص ترتيب') && label.includes('تفاصيل المنتج');
  });
  if (exact) return exact.node;
  const byId = nodes.find(({ node }) => {
    const id = String(node.id || '').toLowerCase();
    return node.type === 'boolean' && id.includes('product') && id.includes('order');
  });
  return byId && byId.node;
}

function findOrderTitle(nodes) {
  const match = nodes.find(({ node }) => {
    if (node.type !== 'static') return false;
    const text = normalizeText(`${node.label || ''} ${node.value || ''}`);
    return text.includes('ترتيب تفاصيل المنتج');
  });
  return match && match.node;
}

const groupRules = {
  title: ['اسم المنتج', 'عنوان المنتج', 'العنوان والاسم', 'الاسم والعنوان'],
  price: ['السعر والتقييم', 'ترتيب السعر', 'السعر'],
  status: ['حالة التوفر', 'التوفر والعداد', 'العداد التنازلي'],
  coupon: ['كود الخصم', 'ترتيب الخصم'],
  description: ['وصف المنتج', 'ترتيب الوصف', 'الوصف'],
  data: ['بيانات المنتج', 'مرات الشراء', 'رقم المنتج', 'الوسوم'],
  extras: ['التوفر في الفروع', 'الملفات الرقمية', 'العناصر الإضافية'],
  options: ['خيارات المنتج', 'الكمية والإضافة', 'الإضافة للسلة'],
  quick: ['الطلب السريع'],
  payments: ['طرق الدفع']
};

function classifyOrderField(node) {
  const label = normalizeText(node.label);
  if (!label.includes('ترتيب')) return '';
  for (const [group, needles] of Object.entries(groupRules)) {
    if (needles.some((needle) => label.includes(normalizeText(needle)))) return group;
  }
  return '';
}

function ensureCondition(field, switchId) {
  const conditions = Array.isArray(field.conditions) ? field.conditions.slice() : [];
  field.conditions = conditions.filter((condition) => condition && condition.id !== switchId);
  field.conditions.push({ id: switchId, operation: '=', value: true });
}

let twilight;
try {
  twilight = JSON.parse(fs.readFileSync(TWILIGHT, 'utf8'));
} catch (error) {
  fail(`twilight.json is not valid JSON: ${error.message}`);
}

let nodes = getAllNodes(twilight);
const orderSwitch = findOrderSwitch(nodes);
if (!orderSwitch || !orderSwitch.id) {
  fail('Could not locate the “تفعيل تخصيص ترتيب عناصر تفاصيل المنتج” switch in twilight.json.');
}
orderSwitch.value = false;
orderSwitch.selected = false;
orderSwitch.wide = true;
orderSwitch.description = 'عند إغلاقه يرجع ترتيب تفاصيل المنتج الأصلي بالكامل، وعند تفعيله تظهر خيارات الترتيب المخصصة.';

const switchParent = parentArrayOf(twilight, orderSwitch);
if (!switchParent) fail('Could not locate the parent settings list for the product-detail order switch.');

let orderTitle = findOrderTitle(nodes);
if (!orderTitle) {
  orderTitle = {
    type: 'static',
    format: 'title',
    id: 'veloura_product_details_order_title_v49_2026',
    value: '<div style="width:100%;padding:10px 14px;border-radius:14px;background:#eef2ff;color:#3730a3;text-align:right;font-weight:800;border-right:4px solid #6366f1;box-shadow:inset 0 0 0 1px rgba(99,102,241,.10)"><strong style="display:block;font-size:18px">ترتيب تفاصيل المنتج</strong><span style="display:block;margin-top:4px;font-size:13px;font-weight:500;color:#6366a0">اختر ترتيب كل مجموعة من 1 إلى 10</span></div>',
    variant: 'h6',
    conditions: [{ id: 'veloura_product_page_panel_open_2026', operation: '=', value: true }]
  };
}

// Keep the title directly above the switch, never embedded below it.
for (const array of getAllNodes(twilight).map(({ parent }) => parent).filter(Array.isArray)) {
  const index = array.indexOf(orderTitle);
  if (index >= 0) array.splice(index, 1);
}
const switchIndex = switchParent.indexOf(orderSwitch);
switchParent.splice(Math.max(0, switchIndex), 0, orderTitle);

nodes = getAllNodes(twilight);
const fieldMap = {};
const orderCandidates = [];
for (const { node } of nodes) {
  if (!node.id || node === orderSwitch || node === orderTitle) continue;
  const label = normalizeText(node.label);
  const id = String(node.id).toLowerCase();
  if ((label.includes('ترتيب') || id.includes('order')) && ['items', 'number'].includes(node.type)) {
    orderCandidates.push(node);
    const group = classifyOrderField(node);
    if (group && !fieldMap[group]) fieldMap[group] = node;
  }
}

const orderedGroups = ['title', 'price', 'status', 'coupon', 'description', 'data', 'extras', 'options', 'quick', 'payments'];
const unclassified = orderCandidates.filter((field) => !Object.values(fieldMap).includes(field));
for (const group of orderedGroups) {
  if (!fieldMap[group] && unclassified.length) fieldMap[group] = unclassified.shift();
}
for (const field of Object.values(fieldMap)) ensureCondition(field, orderSwitch.id);

const fallbackIds = {
  title: 'veloura_product_detail_order_title_2026',
  price: 'veloura_product_detail_order_price_2026',
  status: 'veloura_product_detail_order_status_2026',
  coupon: 'veloura_product_detail_order_coupon_2026',
  description: 'veloura_product_detail_order_description_2026',
  data: 'veloura_product_detail_order_data_2026',
  extras: 'veloura_product_detail_order_extras_2026',
  options: 'veloura_product_detail_order_options_2026',
  quick: 'veloura_product_detail_order_quick_2026',
  payments: 'veloura_product_detail_order_payments_2026'
};
const orderIds = {};
for (const group of orderedGroups) orderIds[group] = fieldMap[group]?.id || fallbackIds[group];

fs.writeFileSync(TWILIGHT, JSON.stringify(twilight, null, 2) + '\n');

let single = fs.readFileSync(SINGLE, 'utf8');
single = single.replace(/\n?\s*\{# Veloura V49 order settings start #\}[\s\S]*?\{# Veloura V49 order settings end #\}\s*\n?/g, '\n');

const settingsBlock = `
    {# Veloura V49 order settings start #}
    {% set vpp_detail_order_enabled = _self.veloura_bool(theme.settings.get('${orderSwitch.id}', false), false)|trim == 'true' %}
    {% set vpp_order_title = (_self.veloura_select(theme.settings.get('${orderIds.title}', 1), 1)|trim) + 0 %}
    {% set vpp_order_price = (_self.veloura_select(theme.settings.get('${orderIds.price}', 2), 2)|trim) + 0 %}
    {% set vpp_order_status = (_self.veloura_select(theme.settings.get('${orderIds.status}', 3), 3)|trim) + 0 %}
    {% set vpp_order_coupon = (_self.veloura_select(theme.settings.get('${orderIds.coupon}', 4), 4)|trim) + 0 %}
    {% set vpp_order_description = (_self.veloura_select(theme.settings.get('${orderIds.description}', 5), 5)|trim) + 0 %}
    {% set vpp_order_data = (_self.veloura_select(theme.settings.get('${orderIds.data}', 6), 6)|trim) + 0 %}
    {% set vpp_order_extras = (_self.veloura_select(theme.settings.get('${orderIds.extras}', 7), 7)|trim) + 0 %}
    {% set vpp_order_options = (_self.veloura_select(theme.settings.get('${orderIds.options}', 8), 8)|trim) + 0 %}
    {% set vpp_order_quick = (_self.veloura_select(theme.settings.get('${orderIds.quick}', 9), 9)|trim) + 0 %}
    {% set vpp_order_payments = (_self.veloura_select(theme.settings.get('${orderIds.payments}', 10), 10)|trim) + 0 %}
    {# Veloura V49 order settings end #}
`;

const settingsAnchor = '{# ألوان/تدوير عام من الإعدادات العامة #}';
if (single.includes(settingsAnchor)) {
  single = single.replace(settingsAnchor, settingsBlock + '    ' + settingsAnchor);
} else {
  const rootAnchor = '<div data-veloura-product-build=';
  if (!single.includes(rootAnchor)) fail('Could not locate the product page root in single.twig.');
  single = single.replace(rootAnchor, settingsBlock + rootAnchor);
}

const buildMarker = 'data-veloura-product-build=';
const markerIndex = single.indexOf(buildMarker);
if (markerIndex < 0) fail('Could not locate data-veloura-product-build in single.twig.');
const tagStart = single.lastIndexOf('<div', markerIndex);
const tagEnd = single.indexOf('>', markerIndex);
if (tagStart < 0 || tagEnd < 0) fail('Could not isolate the product page opening tag in single.twig.');
let openingTag = single.slice(tagStart, tagEnd + 1);
openingTag = openingTag.replace(/\sdata-v(?:42|49)-order-(?:enabled|title|price|status|coupon|description|data|extras|options|quick|payments)="[^"]*"/g, '');
const attrs = `
  data-v42-order-enabled="{{ vpp_detail_order_enabled ? 'true' : 'false' }}"
  data-v42-order-title="{{ vpp_order_title }}"
  data-v42-order-price="{{ vpp_order_price }}"
  data-v42-order-status="{{ vpp_order_status }}"
  data-v42-order-coupon="{{ vpp_order_coupon }}"
  data-v42-order-description="{{ vpp_order_description }}"
  data-v42-order-data="{{ vpp_order_data }}"
  data-v42-order-extras="{{ vpp_order_extras }}"
  data-v42-order-options="{{ vpp_order_options }}"
  data-v42-order-quick="{{ vpp_order_quick }}"
  data-v42-order-payments="{{ vpp_order_payments }}"`;
openingTag = openingTag.replace(/^<div/, '<div' + attrs);
single = single.slice(0, tagStart) + openingTag + single.slice(tagEnd + 1);
fs.writeFileSync(SINGLE, single);

let master = fs.readFileSync(MASTER, 'utf8');
master = master.replace(/\n?\s*\{# Veloura QV V49 mobile buttons\/order\/glass dividers start #\}[\s\S]*?\{# Veloura QV V49 mobile buttons\/order\/glass dividers end #\}\s*\n?/g, '\n');
master = master.replace(/\n?\s*\{# Veloura QV V48 thumbs\/buttons\/order\/separators start #\}[\s\S]*?\{# Veloura QV V48 thumbs\/buttons\/order\/separators end #\}\s*\n?/g, '\n');

const oldGuard = "if (!page || !main || main.dataset.velouraV42Ordered === '1') return;";
const newGuard = `if (!page || !main) return;
    if (page.getAttribute('data-v42-order-enabled') !== 'true') {
      main.classList.remove('veloura-v42-details-order');
      main.removeAttribute('data-veloura-v42-ordered');
      delete main.dataset.velouraV42Ordered;
      Array.prototype.forEach.call(main.children, function (element) {
        element.style.removeProperty('order');
        delete element.dataset.velouraV42OrderGroup;
      });
      return;
    }
    if (main.dataset.velouraV42Ordered === '1') return;`;
if (master.includes(oldGuard)) master = master.replace(oldGuard, newGuard);

const v49Block = String.raw`
{# Veloura QV V49 mobile buttons/order/glass dividers start #}
{% set v49_cart_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v49_cart_bg.value is defined %}{% set v49_cart_bg = v49_cart_bg.value %}{% endif %}
{% set v49_cart_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v49_cart_text.value is defined %}{% set v49_cart_text = v49_cart_text.value %}{% endif %}
{% set v49_radius_key = theme.settings.get('veloura_product_card_button_radius_2026', 'medium') %}
{% if v49_radius_key.selected is defined and v49_radius_key.selected[0].value is defined %}
  {% set v49_radius_key = v49_radius_key.selected[0].value %}
{% elseif v49_radius_key.value is defined %}
  {% set v49_radius_key = v49_radius_key.value %}
{% endif %}
{% set v49_radius_map = {'sharp':'0px','soft':'8px','medium':'16px','large':'24px','round':'999px'} %}
{% set v49_button_radius = v49_radius_map[v49_radius_key]|default('16px') %}
<style id="veloura-qv-v49-style-2026">
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar {
    --veloura-v49-cart-bg: {{ v49_cart_bg }};
    --veloura-v49-cart-text: {{ v49_cart_text }};
    --veloura-v49-button-radius: {{ v49_button_radius }};
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn {
    display:block!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    opacity:1!important;
    visibility:visible!important;
    pointer-events:auto!important;
    overflow:visible!important;
    --color-primary:var(--veloura-v49-cart-bg)!important;
    --color-primary-reverse:var(--veloura-v49-cart-text)!important;
    --button-background-color:var(--veloura-v49-cart-bg)!important;
    --button-text-color:var(--veloura-v49-cart-text)!important;
    --button-border-color:var(--veloura-v49-cart-bg)!important;
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn::part(button) {
    display:flex!important;
    width:100%!important;
    align-items:center!important;
    justify-content:center!important;
    background:var(--veloura-v49-cart-bg)!important;
    border-color:var(--veloura-v49-cart-bg)!important;
    color:var(--veloura-v49-cart-text)!important;
    border-radius:var(--veloura-v49-button-radius)!important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v49-scrollable-thumbs {
    display:flex!important;
    flex-wrap:nowrap!important;
    gap:12px!important;
    width:100%!important;
    max-width:100%!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    touch-action:pan-x!important;
    overscroll-behavior-inline:contain!important;
    -webkit-overflow-scrolling:touch!important;
    scrollbar-width:none!important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v49-scrollable-thumbs::-webkit-scrollbar {display:none!important}
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v49-scrollable-thumbs > * {
    flex:0 0 auto!important;
    cursor:grab!important;
    user-select:none!important;
  }
  @media (max-width:640px) {
    /* Dividers are only active when the sticky card is actually glass/blurred. */
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v49-glass-active > .veloura-product-cart-price-row,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v49-glass-active > .sticky-product-bar__quantity {
      position:relative!important;
    }
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v49-glass-active > .veloura-product-cart-price-row::after,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v49-glass-active > .sticky-product-bar__quantity::after {
      content:""!important;
      position:absolute!important;
      inset-inline:calc(-1 * var(--veloura-v49-divider-bleed, 0px))!important;
      bottom:0!important;
      height:1px!important;
      background:rgba(15,23,42,.11)!important;
      pointer-events:none!important;
    }
  }
</style>
<script data-cfasync="false" id="veloura-qv-v49-runtime-2026">
(function(){
  'use strict';
  var timers=[];
  var hostObserver=null;
  var hostObserverTimer=0;
  function cssValue(element,name,fallback){
    var value=getComputedStyle(element).getPropertyValue(name).trim();
    return value||fallback;
  }
  function ensureStyle(root,id,css){
    if(!root)return;
    var style=root.getElementById?root.getElementById(id):null;
    if(!style){style=document.createElement('style');style.id=id;root.appendChild(style);}
    style.textContent=css;
  }
  function setImportant(element,name,value){
    if(element&&element.style)element.style.setProperty(name,value,'important');
  }
  function paintTree(element,bg,fg,radius,id){
    if(!element)return;
    ['--color-primary','--button-background-color','--button-border-color'].forEach(function(name){setImportant(element,name,bg);});
    ['--color-primary-reverse','--button-text-color'].forEach(function(name){setImportant(element,name,fg);});
    setImportant(element,'color',fg);
    setImportant(element,'border-radius',radius);
    setImportant(element,'opacity','1');
    setImportant(element,'visibility','visible');
    setImportant(element,'pointer-events','auto');
    if(element.shadowRoot){
      ensureStyle(element.shadowRoot,id,
        ':host{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;--color-primary:'+bg+'!important;--color-primary-reverse:'+fg+'!important;--button-background-color:'+bg+'!important;--button-text-color:'+fg+'!important;--button-border-color:'+bg+'!important}' +
        'button,.s-button-element,.s-button-btn,.s-button-wrap,[part~="button"]{display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:44px!important;align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;background:'+bg+'!important;background-color:'+bg+'!important;border:1px solid '+bg+'!important;border-radius:'+radius+'!important;color:'+fg+'!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;cursor:pointer!important}' +
        'button *,.s-button-element *,.s-button-btn *,.s-button-wrap *{color:'+fg+'!important;fill:'+fg+'!important;stroke:currentColor!important}'
      );
      Array.prototype.forEach.call(element.shadowRoot.querySelectorAll('*'),function(child){
        if(child.shadowRoot)paintTree(child,bg,fg,radius,id+'-'+child.tagName.toLowerCase());
      });
    }
  }
  function glassActive(bar){
    var style=getComputedStyle(bar);
    var blur=(style.backdropFilter||style.webkitBackdropFilter||'').trim();
    return !!blur&&blur!=='none'&&blur!=='blur(0px)';
  }
  function syncGlass(bar,actions){
    var active=glassActive(bar);
    bar.classList.toggle('veloura-v49-glass-active',active);
    var style=getComputedStyle(bar);
    var bleed=Math.max(parseFloat(style.paddingLeft)||0,parseFloat(style.paddingRight)||0);
    bar.style.setProperty('--veloura-v49-divider-bleed',bleed+'px');
    actions.forEach(function(action,index){
      setImportant(action,'margin','0');
      if(index>0&&active)setImportant(action,'border-inline-start','1px solid rgba(15,23,42,.11)');
      else if(index>0)action.style.removeProperty('border-inline-start');
    });
  }
  function configureButtons(){
    var bar=document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar');
    var host=bar&&bar.querySelector('salla-add-product-button.sticky-product-bar__btn');
    if(!bar||!host)return false;
    var cartBg=cssValue(bar,'--veloura-v49-cart-bg','#004d65');
    var cartText=cssValue(bar,'--veloura-v49-cart-text','#ffffff');
    var radius=cssValue(bar,'--veloura-v49-button-radius','16px');
    var bodyStyle=getComputedStyle(document.body||document.documentElement);
    var primary=bodyStyle.getPropertyValue('--color-primary').trim()||'#004d65';
    var primaryText=bodyStyle.getPropertyValue('--color-primary-reverse').trim()||'#ffffff';
    setImportant(host,'display','block');setImportant(host,'width','100%');setImportant(host,'opacity','1');setImportant(host,'visibility','visible');setImportant(host,'pointer-events','auto');
    if(!host.shadowRoot)return false;
    var main=host.shadowRoot.querySelector('.s-add-product-button-main');
    var actions=main?Array.prototype.filter.call(main.children,function(child){return !child.hidden&&getComputedStyle(child).display!=='none';}):[];
    if(main){
      setImportant(main,'display','grid');
      setImportant(main,'grid-template-columns','repeat('+Math.max(1,actions.length)+',minmax(0,1fr))');
      setImportant(main,'gap','0');
      setImportant(main,'width','100%');
    }
    if(!actions.length)actions=Array.prototype.slice.call(host.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget'));
    actions.forEach(function(action,index){
      var bg=index===0?cartBg:primary;
      var fg=index===0?cartText:primaryText;
      paintTree(action,bg,fg,radius,'veloura-v49-action-'+index);
    });
    if(!actions.length)paintTree(host,cartBg,cartText,radius,'veloura-v49-host');
    syncGlass(bar,actions);
    return true;
  }
  function selectorGroup(element){
    if(element.matches('.product-brand,h1,.veloura-product-category-under-title,.product-entry__sub-title'))return'title';
    if(element.matches('.veloura-product-header-price,salla-rating-stars,small.color-grey'))return'price';
    if(element.matches('.veloura-product-stock-radar,.veloura-product-discount-countdown'))return'status';
    if(element.matches('.veloura-product-coupon'))return'coupon';
    if(element.matches('.product__description'))return'description';
    if(element.matches('.veloura-product-original-purchase-count,.veloura-product-sku-card,salla-metadata'))return'data';
    if(element.matches('form.product-form'))return'options';
    if(element.matches('salla-quick-order'))return'quick';
    if(element.matches('.veloura-product-payment-methods'))return'payments';
    if(element.matches('digital-files-settings'))return'extras';
    if(element.matches('section')&&element.querySelector('[onclick*="scopes::open"]'))return'extras';
    if(element.matches('.mb-3')&&element.querySelector('a[href]'))return'data';
    return'';
  }
  function intAttr(page,name,fallback){var n=parseInt(page.getAttribute(name),10);return Number.isFinite(n)?Math.min(10,Math.max(1,n)):fallback;}
  function resetOrder(main){
    main.classList.remove('veloura-v42-details-order');
    main.removeAttribute('data-veloura-v42-ordered');
    delete main.dataset.velouraV42Ordered;
    Array.prototype.forEach.call(main.children,function(element){element.style.removeProperty('order');delete element.dataset.velouraV42OrderGroup;});
  }
  function syncOrder(){
    var page=document.querySelector('.veloura-product-page');
    var main=page&&page.querySelector('.main-content');
    if(!page||!main)return;
    resetOrder(main);
    if(page.getAttribute('data-v42-order-enabled')!=='true')return;
    var orders={title:intAttr(page,'data-v42-order-title',1),price:intAttr(page,'data-v42-order-price',2),status:intAttr(page,'data-v42-order-status',3),coupon:intAttr(page,'data-v42-order-coupon',4),description:intAttr(page,'data-v42-order-description',5),data:intAttr(page,'data-v42-order-data',6),extras:intAttr(page,'data-v42-order-extras',7),options:intAttr(page,'data-v42-order-options',8),quick:intAttr(page,'data-v42-order-quick',9),payments:intAttr(page,'data-v42-order-payments',10)};
    main.classList.add('veloura-v42-details-order');
    var last='title';
    Array.prototype.forEach.call(main.children,function(element,index){var explicit=selectorGroup(element);var group=explicit||last;if(explicit)last=explicit;element.dataset.velouraV42OrderGroup=group;element.style.setProperty('order',String(orders[group]*100+index),'important');});
    main.dataset.velouraV42Ordered='1';
  }
  function syncThumbs(){var thumbs=document.querySelector('.veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"]');if(thumbs)thumbs.classList.add('veloura-v49-scrollable-thumbs');}
  function startHostObserver(){
    var host=document.querySelector('.veloura-product-page salla-add-product-button.sticky-product-bar__btn');
    if(!host||hostObserver||!window.MutationObserver)return;
    hostObserver=new MutationObserver(function(){configureButtons();});
    hostObserver.observe(host,{childList:true,subtree:true});
    clearTimeout(hostObserverTimer);
    hostObserverTimer=setTimeout(function(){if(hostObserver){hostObserver.disconnect();hostObserver=null;}},5000);
  }
  function run(){
    syncThumbs();syncOrder();configureButtons();startHostObserver();
    timers.forEach(clearTimeout);
    timers=[80,220,550,1000,1800].map(function(delay){return setTimeout(function(){syncThumbs();syncOrder();configureButtons();},delay);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('theme::ready',run);
  document.addEventListener('salla::product::details::loaded',run);
  document.addEventListener('product::price.updated',run);
  window.addEventListener('pageshow',run,{passive:true});
})();
</script>
{# Veloura QV V49 mobile buttons/order/glass dividers end #}
`;

const headHook = "{% hook 'head:end' %}";
if (!master.includes(headHook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(headHook, v49Block + '\n' + headHook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V49 installed correctly.');
console.log('Mobile Add to Cart now uses the customized product-card color, and Buy Now uses the solid store-primary color.');
console.log('Product-detail ordering is truly disabled when its switch is off, with the title kept above the switch.');
console.log('Sticky-card dividers add no spacing, reach the card edges, and appear only when the bar is actually blurred/glass.');
