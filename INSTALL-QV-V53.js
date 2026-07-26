#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP = path.join(ROOT, '.veloura-v53-backup');
const START = '{# Veloura QV V53 radius, related title and card-edge hotfix start #}';
const END = '{# Veloura QV V53 radius, related title and card-edge hotfix end #}';

function fail(message) {
  console.error(`\n[V53] ERROR: ${message}`);
  process.exit(1);
}
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
}
try { JSON.parse(fs.readFileSync(TWILIGHT, 'utf8')); }
catch (error) { fail(`twilight.json is not valid JSON: ${error.message}`); }

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of [MASTER, SINGLE, TWILIGHT]) {
  const target = path.join(BACKUP, path.basename(file));
  if (!fs.existsSync(target)) fs.copyFileSync(file, target);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function removeMarkedBlock(text, start, end) {
  const re = new RegExp(`\\n?\\s*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*\\n?`, 'g');
  return text.replace(re, '\n');
}
function addAttr(tag, attr) {
  return tag.replace(/>$/, `\n                ${attr}>`);
}

// -----------------------------------------------------------------------------
// single.twig: native thumbs, own related heading, clean slider config.
// -----------------------------------------------------------------------------
let single = fs.readFileSync(SINGLE, 'utf8');

// A non-empty title is always available. V52's text normalizer is kept when present.
single = single.replace(/^\s*{%\s*if\s+not\s+vpp_liked_title\s*%}{%\s*set\s+vpp_liked_title\s*=\s*trans\('pages\.products\.similar_products'\)\s*%}{%\s*endif\s*%}\s*$/gm, '');
single = single.replace(
  /{%\s*set\s+vpp_liked_title\s*=\s*[^\n]*veloura_product_liked_title_2026[^\n]*%}/,
  "{% set vpp_liked_title = _self.veloura_text(theme.settings.get('veloura_product_liked_title_2026', trans('pages.products.similar_products')), trans('pages.products.similar_products'))|trim %}"
);
const likedSetLine = "{% set vpp_liked_title = _self.veloura_text(theme.settings.get('veloura_product_liked_title_2026', trans('pages.products.similar_products')), trans('pages.products.similar_products'))|trim %}";
if (single.includes(likedSetLine)) {
  single = single.replace(likedSetLine, likedSetLine + "\n    {% if not vpp_liked_title %}{% set vpp_liked_title = trans('pages.products.similar_products') %}{% endif %}");
}

// Product image slider: several horizontal thumbs, no arrows.
const galleryId = single.indexOf('id="details-slider-');
const galleryStart = galleryId >= 0 ? single.lastIndexOf('<salla-slider', galleryId) : -1;
const galleryEnd = galleryStart >= 0 ? single.indexOf('>', galleryStart) : -1;
if (galleryStart < 0 || galleryEnd < 0) fail('Could not isolate the product image slider opening tag.');
let galleryTag = single.slice(galleryStart, galleryEnd + 1);
galleryTag = galleryTag
  .replace(/\s+(?:thumbs-config|show-thumbs-controls|vertical-thumbs|thumbs-position)=(?:"[^"]*"|'[^']*')/g, '')
  .replace(/\s+vertical-thumbs(?=\s|>)/g, '');
galleryTag = addAttr(galleryTag, `show-thumbs-controls="false"\n                thumbs-config='{\n                  "slidesPerView": 4,\n                  "slidesPerGroup": 1,\n                  "spaceBetween": 10,\n                  "freeMode": true,\n                  "watchSlidesProgress": true,\n                  "allowTouchMove": true,\n                  "roundLengths": true,\n                  "breakpoints": {\n                    "768": {"slidesPerView": 5, "slidesPerGroup": 1, "spaceBetween": 12}\n                  }\n                }'`);
single = single.slice(0, galleryStart) + galleryTag + single.slice(galleryEnd + 1);
single = single.replace(
  /<div\s+slot="thumbs"(?:\s+class="[^"]*")?\s*>/g,
  '<div slot="thumbs" class="veloura-product-native-thumbs">'
);

// Own visible title outside the web component. This cannot disappear inside Shadow DOM.
const relatedWrapperRe = /<div class="container veloura-product-related-products(?:\s+[^\"]*)?">\s*(?:{%\s*if\s+vpp_liked_title[\s\S]*?{%\s*endif\s*%}\s*)?(?:<div class="veloura-product-related-heading"[\s\S]*?<\/div>\s*)?/;
const relatedWrapper = `<div class="container veloura-product-related-products {{ vpp_related_center_title|default(false) ? 'is-title-centered' : '' }} {{ vpp_related_hide_arrows|default(false) ? 'is-arrows-hidden' : '' }}">\n            {% if vpp_liked_title %}\n                <div class="veloura-product-related-heading">\n                    <h2 class="veloura-product-related-title">{{ vpp_liked_title }}</h2>\n                </div>\n            {% endif %}\n            `;
if (!relatedWrapperRe.test(single)) fail('Could not locate the related-products wrapper.');
single = single.replace(relatedWrapperRe, relatedWrapper);

const relatedWrapperPos = single.indexOf('class="container veloura-product-related-products');
const relatedStart = relatedWrapperPos >= 0 ? single.indexOf('<salla-products-slider', relatedWrapperPos) : -1;
const relatedEnd = relatedStart >= 0 ? single.indexOf('>', relatedStart) : -1;
if (relatedStart < 0 || relatedEnd < 0) fail('Could not isolate the related-products slider opening tag.');
let relatedTag = single.slice(relatedStart, relatedEnd + 1);
relatedTag = relatedTag
  .replace(/\s+block-title=(?:"[^"]*"|'[^']*')/g, '')
  .replace(/\s+slider-config='[\s\S]*?'/g, '')
  .replace(/\s+data-veloura-related-(?:slider|mobile|desktop|hide-arrows|center-title|snap)(?:=(?:"[^"]*"|'[^']*'))?/g, '');
relatedTag = relatedTag.replace(/>$/, `\n                data-veloura-related-slider\n                data-veloura-related-mobile="{{ vpp_related_mobile_columns|default(2) }}"\n                data-veloura-related-desktop="{{ vpp_related_desktop_columns|default(4) }}"\n                data-veloura-related-hide-arrows="{{ vpp_related_hide_arrows|default(false) ? 'true' : 'false' }}"\n                data-veloura-related-center-title="{{ vpp_related_center_title|default(false) ? 'true' : 'false' }}"\n                data-veloura-related-snap="one"\n                slider-config='{\n                  "slidesPerView": {{ vpp_related_mobile_columns|default(2) }},\n                  "slidesPerGroup": 1,\n                  "spaceBetween": 12,\n                  "centeredSlides": false,\n                  "centeredSlidesBounds": false,\n                  "centerInsufficientSlides": false,\n                  "freeMode": false,\n                  "roundLengths": true,\n                  "slidesOffsetBefore": 0,\n                  "slidesOffsetAfter": 0,\n                  "breakpoints": {\n                    "768": {\n                      "slidesPerView": {{ vpp_related_desktop_columns|default(4) }},\n                      "slidesPerGroup": 1,\n                      "spaceBetween": 16,\n                      "centeredSlides": false,\n                      "freeMode": false,\n                      "roundLengths": true,\n                      "slidesOffsetBefore": 0,\n                      "slidesOffsetAfter": 0\n                    }\n                  }\n                }'>`);
single = single.slice(0, relatedStart) + relatedTag + single.slice(relatedEnd + 1);
fs.writeFileSync(SINGLE, single);

// -----------------------------------------------------------------------------
// master.twig: replace V52's product finish runtime with a bounded V53 hotfix.
// -----------------------------------------------------------------------------
let master = fs.readFileSync(MASTER, 'utf8');
master = removeMarkedBlock(master, '{# Veloura QV V52 product finish start #}', '{# Veloura QV V52 product finish end #}');
master = removeMarkedBlock(master, START, END);

const block = String.raw`
${START}
{% set v53_radius_raw = theme.settings.get('veloura_global_radius_2026', 'large') %}
{% if v53_radius_raw.selected is defined %}
  {% if v53_radius_raw.selected.value is defined %}
    {% set v53_radius_key = v53_radius_raw.selected.value %}
  {% elseif v53_radius_raw.selected is iterable and v53_radius_raw.selected[0] is defined and v53_radius_raw.selected[0].value is defined %}
    {% set v53_radius_key = v53_radius_raw.selected[0].value %}
  {% else %}
    {% set v53_radius_key = v53_radius_raw.selected %}
  {% endif %}
{% elseif v53_radius_raw.value is defined %}
  {% set v53_radius_key = v53_radius_raw.value %}
{% else %}
  {% set v53_radius_key = v53_radius_raw %}
{% endif %}
{% set v53_radius_map = {'sharp':'0px','soft':'10px','medium':'16px','large':'28px','xl':'36px'} %}
{% set v53_radius = v53_radius_map[v53_radius_key]|default('28px') %}
{% set v53_cart_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v53_cart_bg.value is defined %}{% set v53_cart_bg = v53_cart_bg.value %}{% endif %}
{% set v53_cart_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v53_cart_text.value is defined %}{% set v53_cart_text = v53_cart_text.value %}{% endif %}
<style id="veloura-qv-v53-style-2026">
  .veloura-product-page {
    --veloura-v53-global-radius: {{ v53_radius }};
    --veloura-v53-cart-bg: {{ v53_cart_bg }};
    --veloura-v53-cart-text: {{ v53_cart_text }};
  }

  /* The global radius is literal: sharp = 0px, with no minimum radius. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar,
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button,
  .veloura-product-page .veloura-product-native-thumbs .veloura-product-thumb-item,
  .veloura-product-page .veloura-product-native-thumbs .veloura-product-thumb-item > img,
  .veloura-product-page [slot="thumbs"] .veloura-product-thumb-item,
  .veloura-product-page [slot="thumbs"] .veloura-product-thumb-item > img {
    border-radius: var(--veloura-v53-global-radius) !important;
  }
  .veloura-product-page .veloura-product-native-thumbs .veloura-product-thumb-item,
  .veloura-product-page .veloura-product-native-thumbs .veloura-product-thumb-item > img,
  .veloura-product-page [slot="thumbs"] .veloura-product-thumb-item,
  .veloura-product-page [slot="thumbs"] .veloura-product-thumb-item > img {
    overflow: hidden !important;
  }

  /* No thumbnail arrows. Dragging remains available. */
  .veloura-product-page .veloura-product-native-thumbs .s-slider-next,
  .veloura-product-page .veloura-product-native-thumbs .s-slider-prev,
  .veloura-product-page [slot="thumbs"] .s-slider-next,
  .veloura-product-page [slot="thumbs"] .s-slider-prev,
  .veloura-product-page [class*="thumbs-next"],
  .veloura-product-page [class*="thumbs-prev"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* A stable, light-DOM title for related products. */
  .veloura-product-related-products .veloura-product-related-heading {
    display: flex !important;
    width: 100% !important;
    margin: 0 0 18px !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }
  .veloura-product-related-products .veloura-product-related-title {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    text-align: right !important;
    font-size: 1.35rem !important;
    font-weight: 800 !important;
    line-height: 1.45 !important;
  }
  .veloura-product-related-products.is-title-centered .veloura-product-related-heading {
    justify-content: center !important;
  }
  .veloura-product-related-products.is-title-centered .veloura-product-related-title {
    text-align: center !important;
  }
  .veloura-product-related-products,
  .veloura-product-related-products > salla-products-slider {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Related cards: the action row is allowed to reach the visible card edge. */
  .veloura-product-related-products .s-product-card-entry.veloura-v53-related-card,
  .veloura-product-related-products .veloura-v53-related-overflow {
    overflow: visible !important;
    max-width: none !important;
    contain: none !important;
    clip-path: none !important;
  }
  .veloura-product-related-products .veloura-v53-related-action {
    position: relative !important;
    display: flex !important;
    padding: 0 !important;
    max-width: none !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    align-items: stretch !important;
    justify-content: center !important;
    pointer-events: auto !important;
  }
  .veloura-product-related-products .veloura-v53-related-action > *,
  .veloura-product-related-products .veloura-v53-related-action salla-add-product-button,
  .veloura-product-related-products .veloura-v53-related-action button,
  .veloura-product-related-products .veloura-v53-related-action a {
    display: flex !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    align-items: center !important;
    justify-content: center !important;
  }
</style>
<script data-cfasync="false" id="veloura-qv-v53-runtime-2026">
(function(){
  'use strict';
  var desktop=window.matchMedia('(min-width:768px)');
  var timers=[];
  var resizeTimer=0;
  var RADIUS='{{ v53_radius }}';
  var CART_BG='{{ v53_cart_bg }}';
  var CART_TEXT='{{ v53_cart_text }}';

  function num(value){value=parseFloat(value);return Number.isFinite(value)?value:0;}
  function intAttr(el,name,fallback,min,max){var n=parseInt(el&&el.getAttribute(name),10);if(!Number.isFinite(n))n=fallback;return Math.min(max,Math.max(min,n));}
  function setImportant(el,name,value){if(el&&el.style)el.style.setProperty(name,value,'important');}
  function ensureStyle(root,id,css){if(!root)return;var style=root.querySelector('#'+id);if(!style){style=document.createElement('style');style.id=id;root.appendChild(style);}if(style.textContent!==css)style.textContent=css;}
  function findInnerSlider(host){return host&&((host.shadowRoot&&host.shadowRoot.querySelector('salla-slider'))||host.querySelector('salla-slider'));}
  function getSwiper(slider){var node=slider&&slider.shadowRoot&&slider.shadowRoot.querySelector('.swiper');return slider&&(slider.swiper||slider.swiperInstance||(node&&node.swiper));}

  function paintTree(element,bg,fg,radius,id,depth){
    if(!element||depth>5)return;
    setImportant(element,'display','block');
    setImportant(element,'width','100%');
    setImportant(element,'max-width','100%');
    setImportant(element,'min-width','0');
    setImportant(element,'opacity','1');
    setImportant(element,'visibility','visible');
    setImportant(element,'pointer-events','auto');
    element.style.setProperty('--color-primary',bg,'important');
    element.style.setProperty('--color-primary-reverse',fg,'important');
    element.style.setProperty('--button-background-color',bg,'important');
    element.style.setProperty('--button-border-color',bg,'important');
    element.style.setProperty('--button-text-color',fg,'important');
    element.style.setProperty('--salla-fast-checkout-button-border-radius',radius,'important');
    if(!element.shadowRoot)return;
    ensureStyle(element.shadowRoot,id,
      ':host{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;--color-primary:'+bg+'!important;--color-primary-reverse:'+fg+'!important;--button-background-color:'+bg+'!important;--button-border-color:'+bg+'!important;--button-text-color:'+fg+'!important;--salla-fast-checkout-button-border-radius:'+radius+'!important}' +
      'button,.s-button-element,.s-button-btn,.s-button-wrap,[part~="button"]{display:flex!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:44px!important;align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;background:'+bg+'!important;background-color:'+bg+'!important;border:1px solid '+bg+'!important;border-radius:'+radius+'!important;color:'+fg+'!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;cursor:pointer!important}' +
      'button *,.s-button-element *,.s-button-btn *,.s-button-wrap *{color:'+fg+'!important;fill:'+fg+'!important;stroke:currentColor!important}'
    );
    Array.prototype.forEach.call(element.shadowRoot.querySelectorAll('*'),function(child){if(child.shadowRoot)paintTree(child,bg,fg,radius,id+'-'+child.tagName.toLowerCase(),depth+1);});
  }

  function configurePurchaseButtons(){
    var host=document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn');
    if(!host)return false;
    setImportant(host,'border-radius',RADIUS);
    if(!host.shadowRoot)return false;
    var main=host.shadowRoot.querySelector('.s-add-product-button-main');
    var actions=main?Array.prototype.filter.call(main.children,function(child){return !child.hidden&&getComputedStyle(child).display!=='none';}):[];
    if(main){setImportant(main,'width','100%');setImportant(main,'gap','12px');}
    if(!actions.length)actions=Array.prototype.slice.call(host.shadowRoot.querySelectorAll('salla-button,salla-quick-buy,salla-mini-checkout-widget'));
    var rootStyle=getComputedStyle(document.documentElement);
    var primary=rootStyle.getPropertyValue('--color-primary').trim()||CART_BG;
    var primaryText=rootStyle.getPropertyValue('--color-primary-reverse').trim()||'#ffffff';
    actions.forEach(function(action,index){paintTree(action,index===0?CART_BG:primary,index===0?CART_TEXT:primaryText,RADIUS,'veloura-v53-action-'+index,0);});
    if(!actions.length)paintTree(host,CART_BG,CART_TEXT,RADIUS,'veloura-v53-cart-host',0);
    return true;
  }

  function configureThumbs(){
    var slider=document.querySelector('.veloura-product-page salla-slider.details-slider');
    if(!slider)return false;
    var config={slidesPerView:4,slidesPerGroup:1,spaceBetween:10,freeMode:true,watchSlidesProgress:true,allowTouchMove:true,roundLengths:true,breakpoints:{768:{slidesPerView:5,slidesPerGroup:1,spaceBetween:12}}};
    slider.setAttribute('show-thumbs-controls','false');
    slider.setAttribute('thumbs-config',JSON.stringify(config));
    try{slider.showThumbsControls=false;slider.thumbsConfig=config;}catch(error){}
    document.querySelectorAll('.veloura-product-page .veloura-product-thumb-item,.veloura-product-page .veloura-product-thumb-item>img').forEach(function(node){setImportant(node,'border-radius',RADIUS);setImportant(node,'overflow','hidden');});
    ensureStyle(slider.shadowRoot,'veloura-v53-thumbs-style',
      '.s-slider-thumbs .swiper-slide,.s-slider-thumbs .swiper-slide>*,.s-slider-thumbs img,[class*="thumb"] .swiper-slide,[class*="thumb"] img{border-radius:'+RADIUS+'!important;overflow:hidden!important}' +
      '.s-slider-thumbs .s-slider-next,.s-slider-thumbs .s-slider-prev,.s-slider-thumbs [class*="slider-next"],.s-slider-thumbs [class*="slider-prev"],[class*="thumbs-next"],[class*="thumbs-prev"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}'
    );
    return true;
  }

  function rootsUnder(node){
    var roots=[];var seen=[];
    function visit(root){if(!root||seen.indexOf(root)!==-1)return;seen.push(root);roots.push(root);if(!root.querySelectorAll)return;root.querySelectorAll('*').forEach(function(el){if(el.shadowRoot)visit(el.shadowRoot);});}
    visit(node);return roots;
  }
  function readHorizontal(card){
    var own=getComputedStyle(card).getPropertyValue('--veloura-v35-action-x').trim();
    if(own!=='')return Math.max(0,num(own));
    var root=getComputedStyle(document.documentElement).getPropertyValue('--veloura-v35-action-x').trim();
    return Math.max(0,num(root));
  }
  function expose(row,card){var current=row.parentElement;while(current&&current!==card){current.classList.add('veloura-v53-related-overflow');current=current.parentElement;}}
  function syncRelatedRow(card,row){
    if(!card||!row)return;
    var rect=card.getBoundingClientRect();if(rect.width<=1)return;
    expose(row,card);card.classList.add('veloura-v53-related-card');row.classList.add('veloura-v53-related-action');
    row.querySelectorAll('salla-add-product-button').forEach(function(button){button.setAttribute('width','wide');try{button.width='wide';}catch(error){}setImportant(button,'width','100%');setImportant(button,'max-width','100%');});
    ['transform','width','max-width','min-width','margin-left','margin-right','left','right','inset-inline','align-self'].forEach(function(name){row.style.removeProperty(name);});
    var x=readHorizontal(card);var width=Math.max(0,rect.width-x*2);setImportant(row,'width',width.toFixed(3)+'px');setImportant(row,'max-width',width.toFixed(3)+'px');setImportant(row,'min-width','0px');setImportant(row,'margin-left','0px');setImportant(row,'margin-right','0px');setImportant(row,'align-self','flex-start');setImportant(row,'transform','none');
    var rowRect=row.getBoundingClientRect();var delta=(rect.left+x)-rowRect.left;setImportant(row,'transform','translate3d('+delta.toFixed(3)+'px,0,0)');
  }

  function configureRelated(){
    var host=document.querySelector('.veloura-product-related-products salla-products-slider[data-veloura-related-slider]');
    if(!host)return false;
    var slider=findInnerSlider(host);if(!slider)return false;
    var mobile=intAttr(host,'data-veloura-related-mobile',2,1,3);var laptop=intAttr(host,'data-veloura-related-desktop',4,1,6);var current=desktop.matches?laptop:mobile;var gap=desktop.matches?16:12;var hide=host.getAttribute('data-veloura-related-hide-arrows')==='true';
    var config={slidesPerView:mobile,slidesPerGroup:1,spaceBetween:12,centeredSlides:false,centeredSlidesBounds:false,centerInsufficientSlides:false,freeMode:false,roundLengths:true,watchOverflow:true,loop:false,slidesOffsetBefore:0,slidesOffsetAfter:0,breakpoints:{768:{slidesPerView:laptop,slidesPerGroup:1,spaceBetween:16,centeredSlides:false,freeMode:false,roundLengths:true,slidesOffsetBefore:0,slidesOffsetAfter:0}}};
    slider.setAttribute('slider-config',JSON.stringify(config));slider.setAttribute('slides-per-view',String(current));slider.setAttribute('show-controls',hide?'false':'true');
    try{slider.sliderConfig=config;slider.slidesPerView=String(current);slider.showControls=!hide;}catch(error){}
    var swiper=getSwiper(slider);if(swiper&&swiper.params){
      var target={slidesPerView:current,slidesPerGroup:1,spaceBetween:gap,centeredSlides:false,centeredSlidesBounds:false,centerInsufficientSlides:false,roundLengths:true,watchOverflow:true,loop:false,slidesOffsetBefore:0,slidesOffsetAfter:0};
      Object.keys(target).forEach(function(key){swiper.params[key]=target[key];if(swiper.originalParams)swiper.originalParams[key]=target[key];});
      if(swiper.params.freeMode&&typeof swiper.params.freeMode==='object')swiper.params.freeMode.enabled=false;else swiper.params.freeMode=false;
      if(swiper.originalParams){if(swiper.originalParams.freeMode&&typeof swiper.originalParams.freeMode==='object')swiper.originalParams.freeMode.enabled=false;else swiper.originalParams.freeMode=false;swiper.originalParams.breakpoints=undefined;}
      swiper.params.breakpoints=undefined;
      if(typeof swiper.update==='function')swiper.update();
    }
    var arrowCss='button.s-slider-next,button.s-slider-prev,.s-slider-next,.s-slider-prev,.swiper-button-next,.swiper-button-prev,[class*="slider-next"],[class*="slider-prev"],[class*="slider-arrows"]{'+(hide?'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important':'')+'}';
    ensureStyle(host.shadowRoot,'veloura-v53-related-host-style',arrowCss);ensureStyle(slider.shadowRoot,'veloura-v53-related-slider-style',arrowCss);
    rootsUnder(host).forEach(function(root){if(!root.querySelectorAll)return;root.querySelectorAll('.s-product-card-entry').forEach(function(card){card.querySelectorAll('.s-product-card-content-footer,.veloura-quick-view-under-cart-wrap').forEach(function(row){syncRelatedRow(card,row);});});});
    return true;
  }

  function run(){
    configurePurchaseButtons();configureThumbs();configureRelated();
    timers.forEach(clearTimeout);timers=[100,300,700,1400,2400].map(function(delay){return setTimeout(function(){configurePurchaseButtons();configureThumbs();configureRelated();},delay);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('theme::ready',run);
  document.addEventListener('salla::products::loaded',run);
  document.addEventListener('salla::product.cards::loaded',run);
  document.addEventListener('salla::product::details::loaded',run);
  document.addEventListener('afterInit',function(event){var target=event.target;if(target&&target.matches&&target.matches('salla-slider,salla-products-slider,salla-add-product-button'))run();});
  window.addEventListener('pageshow',run,{passive:true});
  window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(run,180);},{passive:true});
  if(desktop.addEventListener)desktop.addEventListener('change',run);else if(desktop.addListener)desktop.addListener(run);
})();
</script>
${END}
`;

const hook = "{% hook 'head:end' %}";
if (!master.includes(hook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(hook, block + '\n' + hook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V53 installed correctly.');
console.log('Global radius now reaches the real mobile purchase buttons and every native product thumbnail; sharp is a literal 0px.');
console.log('Related products use a stable visible heading, exact one-card snapping, and card-edge action width from the existing horizontal slider.');
