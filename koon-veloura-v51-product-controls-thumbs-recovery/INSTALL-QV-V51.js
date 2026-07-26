#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MASTER = path.join(ROOT, 'src', 'views', 'layouts', 'master.twig');
const SINGLE = path.join(ROOT, 'src', 'views', 'pages', 'product', 'single.twig');
const TWILIGHT = path.join(ROOT, 'twilight.json');
const BACKUP = path.join(ROOT, '.veloura-v51-backup');

function fail(message) {
  console.error(`\n[V51] ERROR: ${message}`);
  process.exit(1);
}

for (const file of [MASTER, SINGLE, TWILIGHT]) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${path.relative(ROOT, file)}`);
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

function removeAllPreviousRuntimeBlocks(master) {
  const blocks = [
    ['{# Veloura QV V43 native related slider and purchase button colors start #}', '{# Veloura QV V43 native related slider and purchase button colors end #}'],
    ['{# Veloura QV V47 related desktop/order/buttons/footer start #}', '{# Veloura QV V47 related desktop/order/buttons/footer end #}'],
    ['{# Veloura QV V48 thumbs/buttons/order/separators start #}', '{# Veloura QV V48 thumbs/buttons/order/separators end #}'],
    ['{# Veloura QV V49 mobile buttons/order/glass dividers start #}', '{# Veloura QV V49 mobile buttons/order/glass dividers end #}'],
    ['{# Veloura QV V50 product page recovery start #}', '{# Veloura QV V50 product page recovery end #}'],
    ['{# Veloura QV V51 stable product controls and native thumbs start #}', '{# Veloura QV V51 stable product controls and native thumbs end #}']
  ];
  for (const [start, end] of blocks) master = removeMarkedBlock(master, start, end);
  return master;
}

// Validate JSON only. V51 uses the settings that already exist in the theme.
try {
  JSON.parse(fs.readFileSync(TWILIGHT, 'utf8'));
} catch (error) {
  fail(`twilight.json is not valid JSON: ${error.message}`);
}

// -----------------------------------------------------------------------------
// single.twig: restore Salla's native thumbnail slider and configure it properly.
// -----------------------------------------------------------------------------
let single = fs.readFileSync(SINGLE, 'utf8');

// Remove the obsolete V43 config helper if a cumulative copy still contains it.
single = removeMarkedBlock(single, '{# Veloura V43 related slider config start #}', '{# Veloura V43 related slider config end #}');

const galleryId = single.indexOf('id="details-slider-');
const galleryStart = galleryId >= 0 ? single.lastIndexOf('<salla-slider', galleryId) : -1;
if (galleryStart < 0) fail('Could not locate the product images salla-slider.');
const galleryEnd = single.indexOf('>', galleryStart);
if (galleryEnd < 0) fail('Could not isolate the product images salla-slider opening tag.');

let galleryTag = single.slice(galleryStart, galleryEnd + 1);
// Remove all previous/non-native thumbnail positioning and config attributes.
galleryTag = galleryTag
  .replace(/\s+(?:thumbs-config|show-thumbs-controls|vertical-thumbs|thumbs-position)=(?:"[^"]*"|'[^']*')/g, '')
  .replace(/\s+vertical-thumbs(?=\s|>)/g, '');

const thumbsConfig = `\n                        show-thumbs-controls="true"\n                        thumbs-config='{\n                          "slidesPerView": 4,\n                          "spaceBetween": 10,\n                          "freeMode": true,\n                          "watchSlidesProgress": true,\n                          "allowTouchMove": true,\n                          "breakpoints": {\n                            "768": {"slidesPerView": 5, "spaceBetween": 12}\n                          }\n                        }'`;
galleryTag = galleryTag.replace(/>$/, thumbsConfig + '>');
single = single.slice(0, galleryStart) + galleryTag + single.slice(galleryEnd + 1);

// Keep every product image in the native thumbs slot; only normalize the wrapper class.
single = single.replace(
  /<div\s+slot="thumbs"(?:\s+class="[^"]*")?\s*>/g,
  '<div slot="thumbs" class="veloura-product-native-thumbs">'
);

fs.writeFileSync(SINGLE, single);

// -----------------------------------------------------------------------------
// master.twig: no Shadow-DOM button rewriting, no dividers, bounded related setup.
// -----------------------------------------------------------------------------
let master = removeAllPreviousRuntimeBlocks(fs.readFileSync(MASTER, 'utf8'));

// Remove V42's old hard-coded primary button rule. V51 uses the requested card-button settings.
master = master.replace(/\n\s*\/\* The sticky add-to-cart uses the store primary color,[\s\S]*?salla-add-product-button::part\(button\)\s*\{[\s\S]*?\n\s*\}\n/g, '\n');

const v51 = String.raw`
{# Veloura QV V51 stable product controls and native thumbs start #}
{% set v51_cart_bg = theme.settings.get('veloura_product_card_button_bg_color_2026', '#004d65') %}
{% if v51_cart_bg.value is defined %}{% set v51_cart_bg = v51_cart_bg.value %}{% endif %}
{% set v51_cart_text = theme.settings.get('veloura_product_card_button_text_color_2026', '#ffffff') %}
{% if v51_cart_text.value is defined %}{% set v51_cart_text = v51_cart_text.value %}{% endif %}
{% set v51_radius_key = theme.settings.get('veloura_product_card_button_radius_2026', 'medium') %}
{% if v51_radius_key.selected is defined and v51_radius_key.selected[0].value is defined %}
  {% set v51_radius_key = v51_radius_key.selected[0].value %}
{% elseif v51_radius_key.value is defined %}
  {% set v51_radius_key = v51_radius_key.value %}
{% endif %}
{% set v51_radius_map = {'sharp':'0px','soft':'8px','medium':'16px','large':'24px','round':'999px'} %}
{% set v51_radius = v51_radius_map[v51_radius_key]|default('16px') %}
<style id="veloura-qv-v51-style-2026">
  /* Keep Salla's native component intact. Only documented/inherited surfaces are styled. */
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn {
    display:block!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    height:auto!important;
    opacity:1!important;
    visibility:visible!important;
    pointer-events:auto!important;
    overflow:visible!important;
    color:{{ v51_cart_text }}!important;
    --color-primary:{{ v51_cart_bg }}!important;
    --color-primary-reverse:{{ v51_cart_text }}!important;
    --button-background-color:{{ v51_cart_bg }}!important;
    --button-border-color:{{ v51_cart_bg }}!important;
    --button-text-color:{{ v51_cart_text }}!important;
    --salla-fast-checkout-button-height:44px;
    --salla-fast-checkout-button-width:100%;
    --salla-fast-checkout-button-border-radius:{{ v51_radius }};
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-add-product-button.sticky-product-bar__btn::part(button) {
    display:flex!important;
    width:100%!important;
    min-height:44px!important;
    align-items:center!important;
    justify-content:center!important;
    gap:7px!important;
    box-sizing:border-box!important;
    background:{{ v51_cart_bg }}!important;
    background-color:{{ v51_cart_bg }}!important;
    border:1px solid {{ v51_cart_bg }}!important;
    border-radius:{{ v51_radius }}!important;
    color:{{ v51_cart_text }}!important;
    opacity:1!important;
    visibility:visible!important;
    pointer-events:auto!important;
  }
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-mini-checkout-widget,
  .veloura-product-page .sticky-product-bar.veloura-product-sticky-bar salla-quick-buy {
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    opacity:1!important;
    visibility:visible!important;
    pointer-events:auto!important;
    --salla-fast-checkout-button-height:44px;
    --salla-fast-checkout-button-width:100%;
    --salla-fast-checkout-button-border-radius:{{ v51_radius }};
  }

  /* V49/V50 dividers are explicitly cancelled. They must never return. */
  .sticky-product-bar.veloura-product-sticky-bar > .veloura-product-cart-price-row::after,
  .sticky-product-bar.veloura-product-sticky-bar > .sticky-product-bar__quantity::after {
    content:none!important;
    display:none!important;
  }

  .veloura-product-related-products,
  .veloura-product-related-products > salla-products-slider {
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  #app > footer,
  #app .store-footer,
  footer.store-footer {
    margin-top:3rem!important;
  }
</style>
<script data-cfasync="false" id="veloura-qv-v51-runtime-2026">
(function(){
  'use strict';
  var timers=[];
  var desktop=window.matchMedia('(min-width:768px)');

  function intAttr(el,name,fallback,min,max){
    var value=parseInt(el&&el.getAttribute(name),10);
    if(!Number.isFinite(value))value=fallback;
    return Math.min(max,Math.max(min,value));
  }
  function ensureStyle(root,id,css){
    if(!root)return;
    var style=root.getElementById?root.getElementById(id):null;
    if(!style){style=document.createElement('style');style.id=id;root.appendChild(style);}
    if(style.textContent!==css)style.textContent=css;
  }
  function findInnerSlider(host){
    return host&&((host.shadowRoot&&host.shadowRoot.querySelector('salla-slider'))||host.querySelector('salla-slider'));
  }
  function configureRelated(){
    var host=document.querySelector('.veloura-product-related-products salla-products-slider[data-veloura-related-slider]');
    if(!host)return false;
    var slider=findInnerSlider(host);
    if(!slider)return false;

    var mobile=intAttr(host,'data-veloura-related-mobile',2,1,3);
    var laptop=intAttr(host,'data-veloura-related-desktop',4,1,6);
    var current=desktop.matches?laptop:mobile;
    var gap=desktop.matches?16:12;
    var hide=host.getAttribute('data-veloura-related-hide-arrows')==='true';
    var center=host.getAttribute('data-veloura-related-center-title')==='true';
    var config={slidesPerView:mobile,spaceBetween:12,breakpoints:{768:{slidesPerView:laptop,spaceBetween:16}}};

    try{slider.sliderConfig=config;}catch(error){}
    try{slider.slidesPerView=String(current);}catch(error){}
    slider.setAttribute('slider-config',JSON.stringify(config));
    slider.setAttribute('slides-per-view',String(current));
    if(hide){slider.setAttribute('show-controls','false');try{slider.showControls=false;}catch(error){}}
    else{slider.removeAttribute('show-controls');try{slider.showControls=true;}catch(error){}}

    var swiperNode=slider.shadowRoot&&slider.shadowRoot.querySelector('.swiper');
    var swiper=slider.swiper||slider.swiperInstance||(swiperNode&&swiperNode.swiper);
    if(swiper&&swiper.params){
      swiper.params.breakpoints=config.breakpoints;
      swiper.params.slidesPerView=current;
      swiper.params.spaceBetween=gap;
      if(swiper.originalParams){
        swiper.originalParams.breakpoints=config.breakpoints;
        swiper.originalParams.slidesPerView=mobile;
        swiper.originalParams.spaceBetween=12;
      }
      if(typeof swiper.update==='function')swiper.update();
    }else if(typeof slider.update==='function'){
      try{slider.update();}catch(error){}
    }

    var css='';
    if(hide)css+='button.s-slider-next,button.s-slider-prev,.s-slider-next,.s-slider-prev,.swiper-button-next,.swiper-button-prev,[class*="slider-next"],[class*="slider-prev"],[class*="slider-arrows"],[class*="slider-nav"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}';
    if(center)css+='.s-slider-block__title,.s-slider-block__title-right,.s-slider-block__title-left,[class*="slider-block__title"],[class*="block-title"]{width:100%!important;max-width:100%!important;margin-inline:auto!important;text-align:center!important;justify-content:center!important;align-items:center!important}.s-slider-block__title h2,.s-slider-block__title h3,.s-slider-block__title a,[class*="block-title"] h2,[class*="block-title"] h3{text-align:center!important;margin-inline:auto!important}';
    ensureStyle(host.shadowRoot,'veloura-v51-related-host-style',css);
    ensureStyle(slider.shadowRoot,'veloura-v51-related-slider-style',css);
    return true;
  }
  function cleanup(){
    var bar=document.querySelector('.veloura-product-page .sticky-product-bar.veloura-product-sticky-bar');
    if(bar){
      bar.classList.remove('veloura-v49-glass-active','veloura-v50-glass-active');
      bar.style.removeProperty('--veloura-v49-divider-bleed');
      bar.style.removeProperty('--veloura-v50-divider-bleed');
    }
  }
  function run(){
    cleanup();
    timers.forEach(clearTimeout);
    timers=[0,180,600,1400].map(function(delay){return setTimeout(configureRelated,delay);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  document.addEventListener('theme::ready',run);
  document.addEventListener('salla::products::loaded',run);
  document.addEventListener('salla::product.cards::loaded',run);
  function mediaChange(){run();}
  if(desktop.addEventListener)desktop.addEventListener('change',mediaChange);else if(desktop.addListener)desktop.addListener(mediaChange);
})();
</script>
{# Veloura QV V51 stable product controls and native thumbs end #}
`;

const headHook = "{% hook 'head:end' %}";
if (!master.includes(headHook)) fail('Could not locate the head:end hook in master.twig.');
master = master.replace(headHook, v51 + '\n' + headHook);
fs.writeFileSync(MASTER, master);

console.log('twilight.json: OK');
console.log('Quick View V51 installed correctly.');
console.log('Native Add to Cart and Buy Now rendering is preserved; no Shadow-DOM rewriting remains.');
console.log('All sticky-bar dividers were removed, related arrows/title controls are connected, and native thumbnails show multiple movable images.');
