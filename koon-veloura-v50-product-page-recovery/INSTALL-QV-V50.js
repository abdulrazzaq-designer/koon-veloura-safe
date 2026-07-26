#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP_DIR = path.join(ROOT, '.veloura-v50-backup');

function fail(message) {
  console.error(`\n[V50] ERROR: ${message}`);
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

function normalize(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function walk(value, visitor, parent = null) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visitor, value));
    return;
  }
  if (!value || typeof value !== 'object') return;
  visitor(value, parent);
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') walk(child, visitor, value);
  });
}

function allNodes(root) {
  const list = [];
  walk(root, (node, parent) => list.push({ node, parent }));
  return list;
}

function removeMarkedBlock(text, start, end) {
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\n?\\s*${escapedStart}[\\s\\S]*?${escapedEnd}\\s*\\n?`, 'g'), '\n');
}

// ---------------- twilight.json: one clean OFF-by-default ordering section ----------------
let twilight;
try {
  twilight = JSON.parse(fs.readFileSync(TWILIGHT, 'utf8'));
} catch (error) {
  fail(`twilight.json is not valid JSON: ${error.message}`);
}

let records = allNodes(twilight);
let switchRecord = records.find(({ node }) =>
  node && node.type === 'boolean' && (
    node.id === 'veloura_product_details_order_enabled_2026' ||
    (normalize(node.label).includes('تفعيل تخصيص ترتيب') && normalize(node.label).includes('تفاصيل المنتج'))
  )
);

if (switchRecord) {
  const orderSwitch = switchRecord.node;
  orderSwitch.value = false;
  orderSwitch.selected = false;
  orderSwitch.wide = true;
  orderSwitch.description = 'عند إغلاقه يبقى ترتيب صفحة المنتج الأصلي دون أي تأثير. فعّله فقط لإظهار خيارات الترتيب المخصصة.';

  const parent = Array.isArray(switchRecord.parent) ? switchRecord.parent : null;
  if (parent) {
    records = allNodes(twilight);
    let titleRecord = records.find(({ node }) =>
      node && node.type === 'static' && normalize(`${node.label || ''} ${node.value || ''}`).includes('ترتيب تفاصيل المنتج')
    );
    let title = titleRecord && titleRecord.node;
    if (!title) {
      title = {
        id: 'veloura_product_details_order_title_2026',
        type: 'static',
        format: 'title',
        value: '<div style="width:100%;padding:10px 14px;border-radius:14px;background:#eef2ff;color:#3730a3;text-align:right;font-weight:800;border-right:4px solid #6366f1"><strong style="display:block;font-size:18px">ترتيب تفاصيل المنتج</strong><span style="display:block;margin-top:4px;font-size:13px;font-weight:500;color:#6366a0">يظهر التخصيص فقط بعد تفعيل الزر أدناه</span></div>',
        variant: 'h6'
      };
    }

    // Remove duplicate copies of the title, then place exactly one directly above the switch.
    walk(twilight, (node, candidateParent) => {
      if (!Array.isArray(candidateParent)) return;
      for (let i = candidateParent.length - 1; i >= 0; i -= 1) {
        const item = candidateParent[i];
        if (item === title || (item && item.type === 'static' && normalize(`${item.label || ''} ${item.value || ''}`).includes('ترتيب تفاصيل المنتج'))) {
          candidateParent.splice(i, 1);
        }
      }
    });
    const switchIndex = parent.indexOf(orderSwitch);
    parent.splice(Math.max(0, switchIndex), 0, title);

    // Ordering controls are visible only when the switch is ON.
    records = allNodes(twilight);
    for (const { node } of records) {
      if (!node || !node.id || node === orderSwitch || node === title) continue;
      const id = String(node.id).toLowerCase();
      const label = normalize(node.label);
      const isOrderField = id.startsWith('veloura_product_order_') || (label.includes('ترتيب') && ['items', 'number'].includes(node.type));
      if (!isOrderField) continue;
      const conditions = Array.isArray(node.conditions) ? node.conditions.filter((c) => c && c.id !== orderSwitch.id) : [];
      conditions.push({ id: orderSwitch.id, operation: '=', value: true });
      node.conditions = conditions;
    }
  }
}

fs.writeFileSync(TWILIGHT, JSON.stringify(twilight, null, 2) + '\n');

// ---------------- single.twig: remove duplicated/broken V49 ordering injection ----------------
let single = fs.readFileSync(SINGLE, 'utf8');
single = removeMarkedBlock(single, '{# Veloura V49 order settings start #}', '{# Veloura V49 order settings end #}');

// The native V42 settings already exist and use the correct IDs. Keep only those.
single = single.replace(/\bvpp_detail_order_enabled\b/g, 'vpp_details_order_enabled');

// The sortable flex class must not exist in the HTML while the switch is OFF.
single = single.replace(/class="main-content\s+veloura-v42-details-order\s+/g, 'class="main-content ');
single = single.replace(/class="main-content\s+veloura-v42-details-order"/g, 'class="main-content"');

// Rebuild the product root attributes once, using the canonical V42 variables.
const buildMarker = 'data-veloura-product-build=';
const markerIndex = single.indexOf(buildMarker);
if (markerIndex < 0) fail('Could not locate the product page root in single.twig.');
const tagStart = single.lastIndexOf('<div', markerIndex);
const tagEnd = single.indexOf('>', markerIndex);
if (tagStart < 0 || tagEnd < 0) fail('Could not isolate the product page opening tag in single.twig.');
let openingTag = single.slice(tagStart, tagEnd + 1);
openingTag = openingTag.replace(/\sdata-v42-order-(?:enabled|title|price|status|coupon|description|data|extras|options|quick|payments)="[^"]*"/g, '');
openingTag = openingTag.replace(/\sdata-veloura-v50-recovered="[^"]*"/g, '');
const orderAttributes = `
  data-veloura-v50-recovered="true"
  data-v42-order-enabled="{{ vpp_details_order_enabled ? 'true' : 'false' }}"
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
openingTag = openingTag.replace(/^<div/, '<div' + orderAttributes);
openingTag = openingTag.replace(/\n\s*\n+/g, '\n');
single = single.slice(0, tagStart) + openingTag + single.slice(tagEnd + 1);

// Remove the old erroneous setting reference if it survived in any cumulative copy.
single = single.replace(/theme\.settings\.get\('veloura_top_border_style_2026',\s*8\)/g, "theme.settings.get('veloura_product_order_options_2026', 8)");
fs.writeFileSync(SINGLE, single);

// ---------------- master.twig: remove the freezing V49 runtime and install a bounded recovery ----------------
let master = fs.readFileSync(MASTER, 'utf8');
master = removeMarkedBlock(master, '{# Veloura QV V49 mobile buttons/order/glass dividers start #}', '{# Veloura QV V49 mobile buttons/order/glass dividers end #}');
master = removeMarkedBlock(master, '{# Veloura QV V50 product page recovery start #}', '{# Veloura QV V50 product page recovery end #}');

// Remove V42's single-color override; V50 assigns cart and Buy Now independently.
master = master.replace(/\n\s*\/\* The sticky add-to-cart uses the store primary color,[\s\S]*?salla-add-product-button::part\(button\)\s*\{[\s\S]*?\n\s*\}\n/g, '\n');

const v50Block = String.raw`
{# Veloura QV V50 product page recovery start #}
{% set v50_cart_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v50_cart_bg.value is defined %}{% set v50_cart_bg = v50_cart_bg.value %}{% endif %}
{% set v50_cart_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v50_cart_text.value is defined %}{% set v50_cart_text = v50_cart_text.value %}{% endif %}
{% set v50_radius_key = theme.settings.get('veloura_product_card_button_radius_2026', 'medium') %}
{% if v50_radius_key.selected is defined and v50_radius_key.selected[0].value is defined %}
  {% set v50_radius_key = v50_radius_key.selected[0].value %}
{% elseif v50_radius_key.value is defined %}
  {% set v50_radius_key = v50_radius_key.value %}
{% endif %}
{% set v50_radius_map = {'sharp':'0px','soft':'8px','medium':'16px','large':'24px','round':'999px'} %}
{% set v50_button_radius = v50_radius_map[v50_radius_key]|default('16px') %}
<style id="veloura-qv-v50-style-2026">
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar {
    --veloura-v50-cart-bg: {{ v50_cart_bg }};
    --veloura-v50-cart-text: {{ v50_cart_text }};
    --veloura-v50-button-radius: {{ v50_button_radius }};
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
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn::part(button) {
    display:flex!important;
    width:100%!important;
    align-items:center!important;
    justify-content:center!important;
    background:var(--veloura-v50-cart-bg)!important;
    border-color:var(--veloura-v50-cart-bg)!important;
    color:var(--veloura-v50-cart-text)!important;
    border-radius:var(--veloura-v50-button-radius)!important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v50-scrollable-thumbs {
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
    scroll-snap-type:x proximity!important;
    scrollbar-width:none!important;
  }
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v50-scrollable-thumbs::-webkit-scrollbar{display:none!important}
  .veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"].veloura-v50-scrollable-thumbs > *{
    flex:0 0 auto!important;
    scroll-snap-align:start!important;
    cursor:grab!important;
    user-select:none!important;
  }
  @media (max-width:640px) {
    /* Glass dividers are visual only: no margin, padding, height or gap is added. */
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v50-glass-active > .veloura-product-cart-price-row,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v50-glass-active > .sticky-product-bar__quantity {
      position:relative!important;
    }
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v50-glass-active > .veloura-product-cart-price-row::after,
    html body.veloura-v42-sticky-enabled
    .veloura-product-page.veloura-product-mobile-sticky-enabled
    .sticky-product-bar.veloura-product-sticky-bar.veloura-v50-glass-active > .sticky-product-bar__quantity::after {
      content:""!important;
      position:absolute!important;
      left:calc(-1 * var(--veloura-v50-divider-bleed, 0px))!important;
      right:calc(-1 * var(--veloura-v50-divider-bleed, 0px))!important;
      bottom:0!important;
      height:1px!important;
      margin:0!important;
      padding:0!important;
      background:rgba(15,23,42,.11)!important;
      pointer-events:none!important;
    }
  }
</style>
<script data-cfasync="false" id="veloura-qv-v50-runtime-2026">
(function(){
  'use strict';
  var scheduled=[];
  function setImportant(el,name,value){if(el&&el.style)el.style.setProperty(name,value,'important');}
  function cssValue(el,name,fallback){var value=el?getComputedStyle(el).getPropertyValue(name).trim():'';return value||fallback;}
  function ensureShadowStyle(root,id,css){
    if(!root)return;
    var style=root.getElementById?root.getElementById(id):null;
    if(!style){style=document.createElement('style');style.id=id;root.appendChild(style);}
    if(style.textContent!==css)style.textContent=css;
  }
  function deepText(el){
    if(!el)return'';
    var text=(el.textContent||'').trim();
    if(el.shadowRoot)text+=' '+(el.shadowRoot.textContent||'').trim();
    return text.replace(/\\s+/g,' ').toLowerCase();
  }
  function applySurface(action,bg,fg,radius,id){
    if(!action)return;
    setImportant(action,'--color-primary',bg);
    setImportant(action,'--color-primary-reverse',fg);
    setImportant(action,'--button-background-color',bg);
    setImportant(action,'--button-text-color',fg);
    setImportant(action,'--button-border-color',bg);
    setImportant(action,'color',fg);
    setImportant(action,'border-radius',radius);
    setImportant(action,'opacity','1');
    setImportant(action,'visibility','visible');
    setImportant(action,'pointer-events','auto');
    var css=':host{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;--color-primary:'+bg+'!important;--color-primary-reverse:'+fg+'!important;--button-background-color:'+bg+'!important;--button-text-color:'+fg+'!important;--button-border-color:'+bg+'!important}' +
      'button,.s-button-element,.s-button-btn,.s-button-wrap,[part~="button"]{display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:44px!important;align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;background:'+bg+'!important;background-color:'+bg+'!important;border:1px solid '+bg+'!important;border-radius:'+radius+'!important;color:'+fg+'!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;cursor:pointer!important}' +
      'button *,.s-button-element *,.s-button-btn *,.s-button-wrap *{color:'+fg+'!important;fill:'+fg+'!important;stroke:currentColor!important}';
    if(action.shadowRoot){
      ensureShadowStyle(action.shadowRoot,id,css);
      Array.prototype.forEach.call(action.shadowRoot.querySelectorAll('salla-button'),function(button,index){
        setImportant(button,'--color-primary',bg);setImportant(button,'--color-primary-reverse',fg);
        if(button.shadowRoot)ensureShadowStyle(button.shadowRoot,id+'-nested-'+index,css);
      });
    }
  }
  function isGlass(bar){
    var style=getComputedStyle(bar);
    var blur=(style.backdropFilter||style.webkitBackdropFilter||'').trim();
    return !!blur&&blur!=='none'&&blur!=='blur(0px)';
  }
  function stylePurchaseButtons(){
    var bar=document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar');
    var host=bar&&bar.querySelector('salla-add-product-button.sticky-product-bar__btn');
    if(!bar||!host)return;
    var cartBg=cssValue(bar,'--veloura-v50-cart-bg','#004d65');
    var cartText=cssValue(bar,'--veloura-v50-cart-text','#ffffff');
    var radius=cssValue(bar,'--veloura-v50-button-radius','16px');
    var rootStyle=getComputedStyle(document.documentElement);
    var primary=rootStyle.getPropertyValue('--color-primary').trim()||'#004d65';
    var primaryText=rootStyle.getPropertyValue('--color-primary-reverse').trim()||'#ffffff';
    setImportant(host,'display','block');setImportant(host,'width','100%');setImportant(host,'opacity','1');setImportant(host,'visibility','visible');setImportant(host,'pointer-events','auto');
    var glass=isGlass(bar);
    bar.classList.toggle('veloura-v50-glass-active',glass);
    var barStyle=getComputedStyle(bar);
    bar.style.setProperty('--veloura-v50-divider-bleed',Math.max(parseFloat(barStyle.paddingLeft)||0,parseFloat(barStyle.paddingRight)||0)+'px');
    host.toggleAttribute('data-v50-glass',glass);
    if(!host.shadowRoot)return;
    var main=host.shadowRoot.querySelector('.s-add-product-button-main');
    var actions=[];
    if(main){
      actions=Array.prototype.filter.call(main.children,function(child){return !child.hidden&&getComputedStyle(child).display!=='none';});
      setImportant(main,'display','grid');
      setImportant(main,'grid-template-columns','repeat('+Math.max(1,actions.length)+',minmax(0,1fr))');
      setImportant(main,'gap','0');
      setImportant(main,'width','100%');
    }
    if(!actions.length)actions=Array.prototype.slice.call(host.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget'));
    var hostCss=':host{display:block!important;width:100%!important}' +
      '.s-add-product-button-main{display:grid!important;grid-template-columns:repeat('+Math.max(1,actions.length)+',minmax(0,1fr))!important;gap:0!important;width:100%!important}' +
      ':host([data-v50-glass]) .s-add-product-button-main>*:not(:first-child){border-inline-start:1px solid rgba(15,23,42,.11)!important}';
    ensureShadowStyle(host.shadowRoot,'veloura-v50-host-style',hostCss);
    var cartAssigned=false;
    actions.forEach(function(action,index){
      var text=deepText(action);
      var buy=/اشتر|اشتري|buy now|quick buy/.test(text);
      var cart=/إضافة|اضافة|السلة|add to cart/.test(text);
      if(!buy&&!cart){cart=!cartAssigned;buy=cartAssigned;}
      if(cart)cartAssigned=true;
      applySurface(action,buy?primary:cartBg,buy?primaryText:cartText,radius,'veloura-v50-action-'+index);
    });
    if(!actions.length)applySurface(host,cartBg,cartText,radius,'veloura-v50-host-fallback');
  }
  function syncThumbs(){
    var thumbs=document.querySelector('.veloura-product-page salla-slider.details-slider.image-slider > [slot="thumbs"]');
    if(thumbs)thumbs.classList.add('veloura-v50-scrollable-thumbs');
  }
  function resetOrderWhenOff(){
    var page=document.querySelector('.veloura-product-page');
    var main=page&&page.querySelector('.main-content');
    if(!page||!main||page.getAttribute('data-v42-order-enabled')==='true')return;
    main.classList.remove('veloura-v42-details-order');
    main.removeAttribute('data-veloura-v42-ordered');
    delete main.dataset.velouraV42Ordered;
    Array.prototype.forEach.call(main.children,function(el){el.style.removeProperty('order');delete el.dataset.velouraV42OrderGroup;});
  }
  function run(){
    syncThumbs();resetOrderWhenOff();stylePurchaseButtons();
    scheduled.forEach(clearTimeout);
    scheduled=[120,450,1000].map(function(delay){return setTimeout(function(){syncThumbs();resetOrderWhenOff();stylePurchaseButtons();},delay);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('theme::ready',run);
  document.addEventListener('salla::product::details::loaded',run);
  document.addEventListener('product::price.updated',run);
  window.addEventListener('pageshow',run,{passive:true});
})();
</script>
{# Veloura QV V50 product page recovery end #}
`;

const headHook = "{% hook 'head:end' %}";
if (!master.includes(headHook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(headHook, v50Block + '\n' + headHook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V50 recovery installed correctly.');
console.log('The recursive V49 Shadow-DOM observer was removed, so the product page can open normally.');
console.log('Cart/Buy Now colors, horizontal thumbnails, glass-only edge dividers and the true ordering OFF state remain active.');
