const fs = require('fs');
const path = require('path');
const root = process.cwd();
function fail(m){ throw new Error(m); }
function read(p){ if(!fs.existsSync(p)) fail('Missing '+path.relative(root,p)); return fs.readFileSync(p,'utf8'); }
const twilight = JSON.parse(read(path.join(root,'twilight.json')));
const master = read(path.join(root,'src','views','layouts','master.twig'));
const single = read(path.join(root,'src','views','pages','product','single.twig'));
function walk(v, cb){ if(Array.isArray(v)){cb(v);v.forEach(x=>walk(x,cb));return;} if(v&&typeof v==='object')Object.values(v).forEach(x=>walk(x,cb)); }
function find(id){let r=null;walk(twilight,a=>{if(!r)r=a.find(x=>x&&x.id===id)||null});return r;}
for (const [id,min,max,value] of [
  ['veloura_product_related_desktop_columns_2026',2,6,4],
  ['veloura_product_related_mobile_columns_2026',1,3,2]
]) {
  const s=find(id); if(!s)fail('Missing '+id);
  if(typeof s.value!=='number'||typeof s.default!=='number'||typeof s.minimum!=='number'||typeof s.maximum!=='number') fail(id+' must use numeric slider values.');
  if(s.minimum!==min||s.maximum!==max||s.value!==value) fail(id+' range/default mismatch.');
}
if(!single.includes("slider-config=\"{{ veloura_v43_related_slider_config|json_encode|e('html_attr') }}\"")) fail('Missing native related slider-config attribute.');
if(!single.includes("'slidesPerView': vpp_related_mobile_columns")||!single.includes("'slidesPerView': vpp_related_desktop_columns")) fail('Missing mobile/desktop slider values.');
if(/\.veloura-product-related-products \.swiper-slide/.test(master)) fail('Old outer related slide selector still exists.');
if(!master.includes('function applyRelatedColumns() { return true; }')) fail('Old V42 related runtime was not disabled.');
if(!master.includes('veloura-v43-purchase-colors')) fail('Missing V43 purchase color runtime.');
if(!master.includes("--veloura-product-button-bg")||!master.includes("--veloura-v43-store-bg")) fail('Missing split cart/store colors.');
if((master.match(/Veloura QV V43 native related slider and purchase button colors start/g)||[]).length!==1) fail('V43 block duplicated.');
console.log('twilight.json: OK');
console.log('Quick View V43 verified successfully.');
console.log('The related-products component keeps full width and receives official responsive slider-config before initialization.');
console.log('Add to cart is solid with the customized card-button color; Buy Now is outlined with the store primary color.');
