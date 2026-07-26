#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP = path.join(ROOT, '.veloura-v52-backup');

function fail(message) {
  console.error(`\n[V52] ERROR: ${message}`);
  process.exit(1);
}

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
}

try {
  JSON.parse(fs.readFileSync(TWILIGHT, 'utf8'));
} catch (error) {
  fail(`twilight.json is not valid JSON: ${error.message}`);
}

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  const target = path.join(BACKUP, path.basename(file));
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeMarkedBlock(text, start, end) {
  const pattern = new RegExp(`\\n?\\s*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*\\n?`, 'g');
  return text.replace(pattern, '\n');
}

function replaceRequired(text, pattern, replacement, label) {
  if (!pattern.test(text)) fail(`Could not locate ${label}.`);
  return text.replace(pattern, replacement);
}

// -----------------------------------------------------------------------------
// single.twig
// -----------------------------------------------------------------------------
let single = fs.readFileSync(SINGLE, 'utf8');

single = removeMarkedBlock(
  single,
  '{# Veloura V52 text normalizer start #}',
  '{# Veloura V52 text normalizer end #}'
);

const selectMacroEnd = /({%\s*macro\s+veloura_select\([\s\S]*?{%\s*endmacro\s*%})/;
if (!selectMacroEnd.test(single)) fail('Could not locate veloura_select macro.');
const textMacro = String.raw`

{# Veloura V52 text normalizer start #}
{% macro veloura_text(raw, fallback) %}
  {# Text fields may arrive in value or selected. Use the first non-empty saved value. #}
  {% set candidate = null %}
  {% if raw.value is defined %}
    {% if raw.value.value is defined %}
      {% set candidate = raw.value.value %}
    {% elseif raw.value is iterable and raw.value[0] is defined and raw.value[0].value is defined %}
      {% set candidate = raw.value[0].value %}
    {% elseif raw.value is iterable and raw.value[0] is defined %}
      {% set candidate = raw.value[0] %}
    {% else %}
      {% set candidate = raw.value %}
    {% endif %}
  {% endif %}
  {% if not candidate and candidate != 0 and candidate != '0' and raw.selected is defined %}
    {% if raw.selected.value is defined %}
      {% set candidate = raw.selected.value %}
    {% elseif raw.selected is iterable and raw.selected[0] is defined and raw.selected[0].value is defined %}
      {% set candidate = raw.selected[0].value %}
    {% elseif raw.selected is iterable and raw.selected[0] is defined %}
      {% set candidate = raw.selected[0] %}
    {% else %}
      {% set candidate = raw.selected %}
    {% endif %}
  {% endif %}
  {% if not candidate and candidate != 0 and candidate != '0' and (raw or raw == 0 or raw == '0') and raw is not iterable %}
    {% set candidate = raw %}
  {% endif %}
  {% if candidate or candidate == 0 or candidate == '0' %}
    {{ candidate }}
  {% else %}
    {{ fallback }}
  {% endif %}
{% endmacro %}
{# Veloura V52 text normalizer end #}`;
single = single.replace(selectMacroEnd, `$1${textMacro}`);

single = single.replace(
  /{%\s*set\s+vpp_coupon_title\s*=\s*_self\.veloura_(?:select|text)\([^\n]*veloura_product_coupon_title_2026[^\n]*%}/,
  "{% set vpp_coupon_title = _self.veloura_text(theme.settings.get('veloura_product_coupon_title_2026', 'خصم إضافي 10%'), 'خصم إضافي 10%')|trim %}"
);
single = single.replace(
  /{%\s*set\s+vpp_coupon_subtitle\s*=\s*_self\.veloura_(?:select|text)\([^\n]*veloura_product_coupon_subtitle_2026[^\n]*%}/,
  "{% set vpp_coupon_subtitle = _self.veloura_text(theme.settings.get('veloura_product_coupon_subtitle_2026', 'انسخ الكود واحصل على خصم إضافي عند الدفع'), 'انسخ الكود واحصل على خصم إضافي عند الدفع')|trim %}"
);
single = single.replace(
  /{%\s*set\s+vpp_coupon_code\s*=\s*_self\.veloura_(?:select|text)\([^\n]*veloura_product_coupon_code_2026[^\n]*%}/,
  "{% set vpp_coupon_code = _self.veloura_text(theme.settings.get('veloura_product_coupon_code_2026', ''), '')|trim %}"
);
single = single.replace(
  /{%\s*set\s+vpp_liked_title\s*=\s*[^\n]*veloura_product_liked_title_2026[^\n]*%}/,
  "{% set vpp_liked_title = _self.veloura_text(theme.settings.get('veloura_product_liked_title_2026', trans('pages.products.similar_products')), trans('pages.products.similar_products'))|trim %}"
);

// Native horizontal thumbnails: no thumbnail arrows, multiple movable thumbnails.
const galleryId = single.indexOf('id="details-slider-');
const galleryStart = galleryId >= 0 ? single.lastIndexOf('<salla-slider', galleryId) : -1;
if (galleryStart < 0) fail('Could not locate the product images salla-slider.');
const galleryEnd = single.indexOf('>', galleryStart);
if (galleryEnd < 0) fail('Could not isolate the product images salla-slider opening tag.');
let galleryTag = single.slice(galleryStart, galleryEnd + 1);
galleryTag = galleryTag
  .replace(/\s+(?:thumbs-config|show-thumbs-controls|vertical-thumbs|thumbs-position)=(?:"[^"]*"|'[^']*')/g, '')
  .replace(/\s+vertical-thumbs(?=\s|>)/g, '');
const thumbsConfig = `\n                        show-thumbs-controls="false"\n                        thumbs-config='{\n                          "slidesPerView": 4,\n                          "slidesPerGroup": 1,\n                          "spaceBetween": 10,\n                          "freeMode": true,\n                          "watchSlidesProgress": true,\n                          "allowTouchMove": true,\n                          "roundLengths": true,\n                          "breakpoints": {\n                            "768": {"slidesPerView": 5, "slidesPerGroup": 1, "spaceBetween": 12}\n                          }\n                        }'`;
galleryTag = galleryTag.replace(/>$/, thumbsConfig + '>');
single = single.slice(0, galleryStart) + galleryTag + single.slice(galleryEnd + 1);

single = single.replace(
  /<div\s+slot="thumbs"(?:\s+class="[^"]*")?\s*>/g,
  '<div slot="thumbs" class="veloura-product-native-thumbs">'
);

// Related section classes are rendered directly, while runtime also handles shadow DOM.
single = single.replace(
  /<div class="container veloura-product-related-products(?:\s+[^\"]*)?">/,
  '<div class="container veloura-product-related-products {{ vpp_related_center_title ? \'is-title-centered\' : \'\' }} {{ vpp_related_hide_arrows ? \'is-arrows-hidden\' : \'\' }}">'
);

if (!single.includes('data-veloura-related-snap="one"')) {
  single = single.replace(
    /(<salla-products-slider\s*[\s\S]*?data-veloura-related-slider)(\s|>)/,
    '$1\n                data-veloura-related-snap="one"$2'
  );
}

const relatedMarker = single.indexOf('data-veloura-related-slider');
const relatedStart = relatedMarker >= 0 ? single.lastIndexOf('<salla-products-slider', relatedMarker) : -1;
const relatedEnd = relatedStart >= 0 ? single.indexOf('>', relatedStart) : -1;
if (relatedStart < 0 || relatedEnd < 0) fail('Could not isolate the related products slider opening tag.');
let relatedTag = single.slice(relatedStart, relatedEnd + 1);
relatedTag = relatedTag.replace(/\s+slider-config='[\s\S]*?'/g, '');
const relatedConfig = `\n                slider-config='{\n                  "slidesPerView": {{ vpp_related_mobile_columns|default(2) }},\n                  "slidesPerGroup": 1,\n                  "spaceBetween": 12,\n                  "centeredSlides": false,\n                  "freeMode": false,\n                  "roundLengths": true,\n                  "slidesOffsetBefore": 0,\n                  "slidesOffsetAfter": 0,\n                  "breakpoints": {\n                    "768": {\n                      "slidesPerView": {{ vpp_related_desktop_columns|default(4) }},\n                      "slidesPerGroup": 1,\n                      "spaceBetween": 16,\n                      "centeredSlides": false,\n                      "freeMode": false,\n                      "roundLengths": true,\n                      "slidesOffsetBefore": 0,\n                      "slidesOffsetAfter": 0\n                    }\n                  }\n                }'`;
relatedTag = relatedTag.replace(/(\n\s*source=)/, relatedConfig + '$1');
single = single.slice(0, relatedStart) + relatedTag + single.slice(relatedEnd + 1);

fs.writeFileSync(SINGLE, single);

// -----------------------------------------------------------------------------
// master.twig: remove overlapping product-page patches and install one runtime.
// -----------------------------------------------------------------------------
let master = fs.readFileSync(MASTER, 'utf8');
const oldBlocks = [
  ['{# Veloura QV V39 product page final fixes start #}', '{# Veloura QV V39 product page final fixes end #}'],
  ['{# Veloura QV V42 product details order, related columns and compact sticky start #}', '{# Veloura QV V42 product details order, related columns and compact sticky end #}'],
  ['{# Veloura QV V43 native related slider and purchase button colors start #}', '{# Veloura QV V43 native related slider and purchase button colors end #}'],
  ['{# Veloura QV V47 related desktop/order/buttons/footer start #}', '{# Veloura QV V47 related desktop/order/buttons/footer end #}'],
  ['{# Veloura QV V48 thumbs/buttons/order/separators start #}', '{# Veloura QV V48 thumbs/buttons/order/separators end #}'],
  ['{# Veloura QV V49 mobile buttons/order/glass dividers start #}', '{# Veloura QV V49 mobile buttons/order/glass dividers end #}'],
  ['{# Veloura QV V50 product page recovery start #}', '{# Veloura QV V50 product page recovery end #}'],
  ['{# Veloura QV V51 stable product controls and native thumbs start #}', '{# Veloura QV V51 stable product controls and native thumbs end #}'],
  ['{# Veloura QV V52 product finish start #}', '{# Veloura QV V52 product finish end #}']
];
for (const [start, end] of oldBlocks) master = removeMarkedBlock(master, start, end);

const v52 = String.raw`
{# Veloura QV V52 product finish start #}
{% set v52_cart_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v52_cart_bg.value is defined %}{% set v52_cart_bg = v52_cart_bg.value %}{% endif %}
{% set v52_cart_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v52_cart_text.value is defined %}{% set v52_cart_text = v52_cart_text.value %}{% endif %}
<style id="veloura-qv-v52-style-2026">
  /* One global radius source for the floating purchase card and product thumbs. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar,
  .veloura-product-page .veloura-product-thumb-item,
  .veloura-product-page .veloura-product-thumb-item > img {
    border-radius: var(--veloura-product-radius, 28px) !important;
  }
  .veloura-product-page .veloura-product-thumb-item,
  .veloura-product-page .veloura-product-thumb-item > img {
    overflow: hidden !important;
  }

  /* Thumbnail arrows are intentionally removed; touch/mouse dragging remains enabled. */
  .veloura-product-page .veloura-product-native-thumbs .s-slider-next,
  .veloura-product-page .veloura-product-native-thumbs .s-slider-prev,
  .veloura-product-page .veloura-product-native-thumbs [class*="thumbs-next"],
  .veloura-product-page .veloura-product-native-thumbs [class*="thumbs-prev"] {
    display: none !important;
  }

  /* Coupon: real saved text, secondary surface and the global radius. */
  .veloura-product-page .veloura-product-coupon {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    margin: 0 0 16px !important;
    padding: 14px 16px !important;
    border-radius: var(--veloura-product-radius, 28px) !important;
    background: var(--veloura-product-secondary-bg-inline, #f8fafc) !important;
    border: 1px solid color-mix(in srgb, currentColor 10%, transparent) !important;
  }
  .veloura-product-page .veloura-product-coupon > div {
    display: grid !important;
    gap: 3px !important;
    min-width: 0 !important;
  }
  .veloura-product-page .veloura-product-coupon__code {
    flex: 0 0 auto !important;
    min-height: 40px !important;
    padding: 8px 14px !important;
    border-radius: var(--veloura-product-radius, 28px) !important;
    background: var(--color-primary, #004d65) !important;
    border: 1px solid var(--color-primary, #004d65) !important;
    color: var(--color-primary-reverse, #fff) !important;
    font-weight: 800 !important;
    cursor: pointer !important;
  }

  /* Stable purchase controls; no Shadow-DOM observers or repeated rewriting. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    color: {{ v52_cart_text }} !important;
    --color-primary: {{ v52_cart_bg }} !important;
    --color-primary-reverse: {{ v52_cart_text }} !important;
    --button-background-color: {{ v52_cart_bg }} !important;
    --button-border-color: {{ v52_cart_bg }} !important;
    --button-text-color: {{ v52_cart_text }} !important;
    --salla-fast-checkout-button-height: 44px;
    --salla-fast-checkout-button-width: 100%;
    --salla-fast-checkout-button-border-radius: var(--veloura-product-radius, 28px);
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn::part(button) {
    display: flex !important;
    width: 100% !important;
    min-height: 44px !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px !important;
    box-sizing: border-box !important;
    background: {{ v52_cart_bg }} !important;
    border: 1px solid {{ v52_cart_bg }} !important;
    border-radius: var(--veloura-product-radius, 28px) !important;
    color: {{ v52_cart_text }} !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-mini-checkout-widget,
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-quick-buy {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
    --salla-fast-checkout-button-height: 44px;
    --salla-fast-checkout-button-width: 100%;
    --salla-fast-checkout-button-border-radius: var(--veloura-product-radius, 28px);
  }

  /* Dividers from previous revisions are permanently cancelled. */
  .sticky-product-bar.veloura-product-sticky-bar > .veloura-product-cart-price-row::after,
  .sticky-product-bar.veloura-product-sticky-bar > .sticky-product-bar__quantity::after,
  .sticky-product-bar.veloura-product-sticky-bar::before,
  .sticky-product-bar.veloura-product-sticky-bar::after {
    content: none !important;
    display: none !important;
  }

  /* Ordering is opt-in only. OFF means native document order. */
  .veloura-product-page .main-content.veloura-v52-details-order {
    display: flex !important;
    flex-direction: column !important;
  }

  /* Related products: full-width host, no partial side offsets. */
  .veloura-product-related-products,
  .veloura-product-related-products > salla-products-slider {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  .veloura-product-related-products.is-title-centered .s-slider-block__title,
  .veloura-product-related-products.is-title-centered [class*="slider-block__title"],
  .veloura-product-related-products.is-title-centered [class*="block-title"] {
    width: 100% !important;
    justify-content: center !important;
    text-align: center !important;
    margin-inline: auto !important;
  }
  .veloura-product-related-products.is-arrows-hidden .s-slider-next,
  .veloura-product-related-products.is-arrows-hidden .s-slider-prev,
  .veloura-product-related-products.is-arrows-hidden [class*="slider-next"],
  .veloura-product-related-products.is-arrows-hidden [class*="slider-prev"] {
    display: none !important;
  }

  /* Visible stock pulse retained from the product-page customization. */
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"] .veloura-product-stock-radar.is-pulse .veloura-product-stock-radar__dot {
    position: relative !important;
    display: inline-block !important;
    overflow: visible !important;
    animation: veloura-v52-stock-dot 1.15s ease-in-out infinite !important;
    transform-origin: center !important;
  }
  .veloura-product-page[data-veloura-v37-stock-radar="pulse"] .veloura-product-stock-radar.is-pulse .veloura-product-stock-radar__dot::after {
    content: "" !important;
    position: absolute !important;
    inset: -2px !important;
    border: 2px solid currentColor !important;
    border-radius: 999px !important;
    animation: veloura-v52-stock-ring 1.15s ease-out infinite !important;
    pointer-events: none !important;
  }
  .veloura-product-page[data-veloura-v37-stock-radar="simple"] .veloura-product-stock-radar__dot,
  .veloura-product-page .veloura-product-stock-radar.is-simple .veloura-product-stock-radar__dot {
    display: none !important;
    animation: none !important;
  }
  @keyframes veloura-v52-stock-dot {
    0%,100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
    50% { transform: scale(.72); box-shadow: 0 0 0 3px color-mix(in srgb,currentColor 20%,transparent); }
  }
  @keyframes veloura-v52-stock-ring {
    0% { transform: scale(.72); opacity: .72; }
    82%,100% { transform: scale(2.75); opacity: 0; }
  }

  #app > footer,
  #app .store-footer,
  footer.store-footer { margin-top: 3rem !important; }

  @media (max-width: 640px) {
    html body.veloura-v52-sticky-enabled .veloura-v52-sticky-ancestor {
      transform: none !important;
      filter: none !important;
      perspective: none !important;
      contain: none !important;
      isolation: auto !important;
      z-index: auto !important;
      clip-path: none !important;
      overflow: visible !important;
    }
    html body.veloura-v52-sticky-enabled .veloura-product-page.veloura-product-mobile-sticky-enabled .sticky-product-bar.veloura-product-sticky-bar {
      position: fixed !important;
      top: auto !important;
      z-index: 2147483000 !important;
      isolation: isolate !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      transform: translateZ(0) !important;
      border-radius: var(--veloura-product-radius, 28px) !important;
    }
    html body.veloura-v52-sticky-enabled.veloura-v52-sticky-compact .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar {
      left: 12px !important;
      right: 12px !important;
      bottom: max(12px, env(safe-area-inset-bottom)) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      margin: 0 auto !important;
    }
    html body.veloura-v52-sticky-enabled:not(.veloura-v52-sticky-compact) .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar {
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
    }
    html body.veloura-v52-sticky-disabled .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar {
      position: relative !important;
      inset: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 16px 0 0 !important;
      z-index: auto !important;
      transform: none !important;
    }
    html body.veloura-v52-sticky-enabled .product-single {
      padding-bottom: var(--veloura-v52-sticky-space, 112px) !important;
    }
    html body.veloura-v52-sticky-disabled .product-single {
      padding-bottom: 0 !important;
    }
    #mobile-menu,.mm-menu,.mm-wrapper__blocker,.mm-page__blocker,salla-sidebar,salla-modal,.s-modal-wrapper,[role="dialog"] {
      z-index: 2147483600 !important;
    }
  }
</style>
<script data-cfasync="false" id="veloura-qv-v52-runtime-2026">
(function(){
  'use strict';
  var desktop=window.matchMedia('(min-width:768px)');
  var mobile=window.matchMedia('(max-width:640px)');
  var timers=[];
  var resizeTimer=0;

  function intAttr(el,name,fallback,min,max){
    var value=parseInt(el&&el.getAttribute(name),10);
    if(!Number.isFinite(value))value=fallback;
    return Math.min(max,Math.max(min,value));
  }
  function findInnerSlider(host){
    return host&&((host.shadowRoot&&host.shadowRoot.querySelector('salla-slider'))||host.querySelector('salla-slider'));
  }
  function styleRoot(root,id,css){
    if(!root)return;
    var style=root.querySelector&&root.querySelector('#'+id);
    if(!style){style=document.createElement('style');style.id=id;root.appendChild(style);}
    if(style.textContent!==css)style.textContent=css;
  }
  function getSwiper(slider){
    var node=slider&&slider.shadowRoot&&slider.shadowRoot.querySelector('.swiper');
    return slider&&(slider.swiper||slider.swiperInstance||(node&&node.swiper));
  }

  function configureThumbs(){
    var slider=document.querySelector('.veloura-product-page salla-slider.details-slider');
    if(!slider)return false;
    var config={slidesPerView:4,slidesPerGroup:1,spaceBetween:10,freeMode:true,watchSlidesProgress:true,allowTouchMove:true,roundLengths:true,breakpoints:{768:{slidesPerView:5,slidesPerGroup:1,spaceBetween:12}}};
    slider.setAttribute('show-thumbs-controls','false');
    slider.setAttribute('thumbs-config',JSON.stringify(config));
    try{slider.showThumbsControls=false;slider.thumbsConfig=config;}catch(error){}
    var css='.s-slider-thumbs .s-slider-next,.s-slider-thumbs .s-slider-prev,.s-slider-thumbs [class*="slider-next"],.s-slider-thumbs [class*="slider-prev"],[class*="thumbs-next"],[class*="thumbs-prev"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
    styleRoot(slider.shadowRoot,'veloura-v52-thumbs-style',css);
    return true;
  }

  function titleCss(center,hide){
    var css='';
    if(hide)css+='button.s-slider-next,button.s-slider-prev,.s-slider-next,.s-slider-prev,.swiper-button-next,.swiper-button-prev,[class*="slider-next"],[class*="slider-prev"],[class*="slider-arrows"],[class*="slider-nav"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
    if(center)css+='header,.s-slider-block__title,.s-slider-block__title-right,.s-slider-block__title-left,.s-block__title,[class*="slider-block__title"],[class*="products-slider__title"],[class*="block-title"]{width:100%!important;max-width:100%!important;display:flex!important;justify-content:center!important;align-items:center!important;text-align:center!important;margin-inline:auto!important}.s-slider-block__title h2,.s-slider-block__title h3,.s-block__title h2,.s-block__title h3,[class*="block-title"] h2,[class*="block-title"] h3{text-align:center!important;margin-inline:auto!important}';
    return css;
  }
  function centerTitleNodes(root){
    if(!root||!root.querySelectorAll)return;
    root.querySelectorAll('header,.s-slider-block__title,.s-slider-block__title-right,.s-slider-block__title-left,.s-block__title,[class*="slider-block__title"],[class*="products-slider__title"],[class*="block-title"]').forEach(function(node){
      node.style.setProperty('width','100%','important');
      node.style.setProperty('max-width','100%','important');
      node.style.setProperty('justify-content','center','important');
      node.style.setProperty('align-items','center','important');
      node.style.setProperty('text-align','center','important');
      node.style.setProperty('margin-left','auto','important');
      node.style.setProperty('margin-right','auto','important');
      node.querySelectorAll('h1,h2,h3,h4,a,span').forEach(function(child){child.style.setProperty('text-align','center','important');});
    });
  }

  function configureRelated(){
    var host=document.querySelector('.veloura-product-related-products salla-products-slider[data-veloura-related-slider]');
    if(!host)return false;
    var slider=findInnerSlider(host);
    if(!slider)return false;
    var mobileCount=intAttr(host,'data-veloura-related-mobile',2,1,3);
    var desktopCount=intAttr(host,'data-veloura-related-desktop',4,1,6);
    var current=desktop.matches?desktopCount:mobileCount;
    var gap=desktop.matches?16:12;
    var hide=host.getAttribute('data-veloura-related-hide-arrows')==='true';
    var center=host.getAttribute('data-veloura-related-center-title')==='true';
    var config={slidesPerView:mobileCount,slidesPerGroup:1,spaceBetween:12,centeredSlides:false,centeredSlidesBounds:false,centerInsufficientSlides:false,freeMode:false,roundLengths:true,watchOverflow:true,loop:false,slidesOffsetBefore:0,slidesOffsetAfter:0,breakpoints:{768:{slidesPerView:desktopCount,slidesPerGroup:1,spaceBetween:16,centeredSlides:false,freeMode:false,roundLengths:true,slidesOffsetBefore:0,slidesOffsetAfter:0}}};

    slider.setAttribute('slider-config',JSON.stringify(config));
    slider.setAttribute('slides-per-view',String(current));
    if(hide)slider.setAttribute('show-controls','false');else slider.setAttribute('show-controls','true');
    try{slider.sliderConfig=config;slider.slidesPerView=String(current);slider.showControls=!hide;}catch(error){}

    var swiper=getSwiper(slider);
    if(swiper&&swiper.params){
      var target={slidesPerView:current,slidesPerGroup:1,spaceBetween:gap,centeredSlides:false,centeredSlidesBounds:false,centerInsufficientSlides:false,roundLengths:true,watchOverflow:true,loop:false,slidesOffsetBefore:0,slidesOffsetAfter:0};
      Object.keys(target).forEach(function(key){swiper.params[key]=target[key];if(swiper.originalParams)swiper.originalParams[key]=target[key];});
      if(swiper.params.freeMode&&typeof swiper.params.freeMode==='object')swiper.params.freeMode.enabled=false;else swiper.params.freeMode=false;
      if(swiper.originalParams){if(swiper.originalParams.freeMode&&typeof swiper.originalParams.freeMode==='object')swiper.originalParams.freeMode.enabled=false;else swiper.originalParams.freeMode=false;}
      swiper.params.breakpoints=undefined;
      if(swiper.originalParams)swiper.originalParams.breakpoints=undefined;
      if(typeof swiper.updateSize==='function')swiper.updateSize();
      if(typeof swiper.updateSlides==='function')swiper.updateSlides();
      if(typeof swiper.updateProgress==='function')swiper.updateProgress();
      if(typeof swiper.updateSlidesClasses==='function')swiper.updateSlidesClasses();
      if(typeof swiper.update==='function')swiper.update();
      var maxIndex=Math.max(0,(swiper.slides?swiper.slides.length:0)-current);
      var index=Math.min(maxIndex,Math.max(0,swiper.activeIndex||0));
      if(typeof swiper.slideTo==='function')swiper.slideTo(index,0,false);
    }

    var css=titleCss(center,hide);
    styleRoot(host.shadowRoot,'veloura-v52-related-host-style',css);
    styleRoot(slider.shadowRoot,'veloura-v52-related-slider-style',css);
    if(center){centerTitleNodes(host.shadowRoot);centerTitleNodes(slider.shadowRoot);}
    return true;
  }

  function selectorGroup(element){
    if(element.matches('.product-brand,h1,.veloura-product-category-under-title,.product-entry__sub-title'))return 'title';
    if(element.matches('.veloura-product-header-price,salla-rating-stars,small.color-grey'))return 'price';
    if(element.matches('.veloura-product-stock-radar,.veloura-product-discount-countdown'))return 'status';
    if(element.matches('.veloura-product-coupon'))return 'coupon';
    if(element.matches('.product__description'))return 'description';
    if(element.matches('.veloura-product-original-purchase-count,.veloura-product-sku-card,salla-metadata'))return 'data';
    if(element.matches('form.product-form'))return 'options';
    if(element.matches('salla-quick-order'))return 'quick';
    if(element.matches('.veloura-product-payment-methods'))return 'payments';
    if(element.matches('digital-files-settings'))return 'extras';
    if(element.matches('section')&&element.querySelector('[onclick*="scopes::open"]'))return 'extras';
    if(element.matches('.mb-3')&&element.querySelector('a[href]'))return 'data';
    return '';
  }
  function clearOrder(main){
    main.classList.remove('veloura-v42-details-order','veloura-v52-details-order');
    main.removeAttribute('data-veloura-v42-ordered');
    delete main.dataset.velouraV42Ordered;
    Array.prototype.forEach.call(main.children,function(el){el.style.removeProperty('order');delete el.dataset.velouraV42OrderGroup;});
  }
  function applyOrder(){
    var page=document.querySelector('.veloura-product-page.veloura-product-enabled');
    var main=page&&page.querySelector('.main-content');
    if(!page||!main)return;
    if(page.getAttribute('data-v42-order-enabled')!=='true'){clearOrder(main);return;}
    clearOrder(main);
    var orders={title:intAttr(page,'data-v42-order-title',1,1,10),price:intAttr(page,'data-v42-order-price',2,1,10),status:intAttr(page,'data-v42-order-status',3,1,10),coupon:intAttr(page,'data-v42-order-coupon',4,1,10),description:intAttr(page,'data-v42-order-description',5,1,10),data:intAttr(page,'data-v42-order-data',6,1,10),extras:intAttr(page,'data-v42-order-extras',7,1,10),options:intAttr(page,'data-v42-order-options',8,1,10),quick:intAttr(page,'data-v42-order-quick',9,1,10),payments:intAttr(page,'data-v42-order-payments',10,1,10)};
    main.classList.add('veloura-v52-details-order');
    var last='title';
    Array.prototype.forEach.call(main.children,function(el,index){var found=selectorGroup(el);var group=found||last;if(found)last=found;el.dataset.velouraV42OrderGroup=group;el.style.setProperty('order',String(orders[group]*100+index),'important');});
  }

  function syncSticky(){
    var page=document.querySelector('.veloura-product-page');
    var bar=page&&page.querySelector('.veloura-product-sticky-bar');
    if(!page||!bar||!document.body)return;
    var raw=page.getAttribute('data-veloura-v42-sticky');
    var enabled=raw==='true'||(raw!=='false'&&page.classList.contains('veloura-product-mobile-sticky-enabled'));
    var compact=page.classList.contains('veloura-product-buttons-compact');
    var active=enabled&&mobile.matches;
    document.body.classList.toggle('veloura-v52-sticky-enabled',active);
    document.body.classList.toggle('veloura-v52-sticky-disabled',!active);
    document.body.classList.toggle('veloura-v52-sticky-compact',active&&compact);
    document.body.classList.toggle('veloura-product-sticky-active',active);
    var button=bar.querySelector('salla-add-product-button');
    if(button){if(active)button.setAttribute('support-sticky-bar','');else button.removeAttribute('support-sticky-bar');}
    document.querySelectorAll('.veloura-v52-sticky-ancestor').forEach(function(el){el.classList.remove('veloura-v52-sticky-ancestor');});
    if(active){
      var parent=bar.parentElement;
      while(parent&&parent!==document.body&&parent!==document.documentElement){parent.classList.add('veloura-v52-sticky-ancestor');parent=parent.parentElement;}
      window.requestAnimationFrame(function(){document.body.style.setProperty('--veloura-v52-sticky-space',Math.ceil(bar.getBoundingClientRect().height+(compact?28:8))+'px');});
    }else document.body.style.removeProperty('--veloura-v52-sticky-space');
  }

  function copyCoupon(event){
    var button=event.target&&event.target.closest&&event.target.closest('.veloura-product-coupon__code');
    if(!button)return;
    var code=(button.getAttribute('data-code')||button.textContent||'').trim();
    if(!code)return;
    var old=button.textContent;
    function done(){button.textContent='تم النسخ';button.classList.add('is-copied');window.setTimeout(function(){button.textContent=old;button.classList.remove('is-copied');},1400);}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).then(done).catch(function(){});
    else{var area=document.createElement('textarea');area.value=code;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{document.execCommand('copy');done();}catch(error){}area.remove();}
  }

  function run(){
    syncSticky();
    applyOrder();
    configureThumbs();
    configureRelated();
    timers.forEach(clearTimeout);
    timers=[120,420,900,1700].map(function(delay){return setTimeout(function(){configureThumbs();configureRelated();},delay);});
  }

  document.addEventListener('click',copyCoupon);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('theme::ready',run);
  document.addEventListener('salla::products::loaded',run);
  document.addEventListener('salla::product.cards::loaded',run);
  document.addEventListener('afterInit',function(event){var target=event.target;if(target&&target.matches&&target.matches('salla-slider')){configureThumbs();configureRelated();}});
  window.addEventListener('pageshow',run,{passive:true});
  window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(run,180);},{passive:true});
  function mediaChange(){run();}
  if(desktop.addEventListener)desktop.addEventListener('change',mediaChange);else if(desktop.addListener)desktop.addListener(mediaChange);
  if(mobile.addEventListener)mobile.addEventListener('change',mediaChange);else if(mobile.addListener)mobile.addListener(mediaChange);
})();
</script>
{# Veloura QV V52 product finish end #}
`;

const hook = "{% hook 'head:end' %}";
if (!master.includes(hook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(hook, v52 + '\n' + hook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V52 installed correctly.');
console.log('Global radius now controls the mobile purchase card and product thumbnails; thumbnail arrows are hidden.');
console.log('Related title centering and one-product snapping are applied to the hydrated inner slider.');
console.log('Coupon text now reads the saved value, renders above the description, uses the secondary background, and can be copied.');
