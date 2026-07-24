const fs=require('fs'),path=require('path');
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const write=(p,s)=>fs.writeFileSync(path.join(root,p),s,'utf8');
const files=['src/views/pages/cart.twig','src/assets/js/app.js','src/assets/styles/app.scss'];
for(const f of files) if(!fs.existsSync(path.join(root,f))) throw new Error('Missing '+f);
const backup=path.join(root,'migration-audit','before-cart-banners-v24-'+new Date().toISOString().replace(/[:.]/g,'-')); fs.mkdirSync(backup,{recursive:true});
for(const f of files){const d=path.join(backup,f);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(path.join(root,f),d)}
let cart=read(files[0]);
const inc="{% include 'components.cart.veloura-cart-banners' %}";
if(!cart.includes(inc)){const marker='{% endblock %}';const i=cart.indexOf(marker);if(i<0)throw new Error('cart.twig endblock anchor not found');cart=cart.slice(0,i)+'    '+inc+'\n'+cart.slice(i);write(files[0],cart)}
let app=read(files[1]);
if(!app.includes("./partials/veloura-cart-banners")){app="import initVelouraCartBanners from './partials/veloura-cart-banners';\n"+app;}
if(!app.includes('initVelouraCartBanners();')){app+='\n\ndocument.addEventListener(\'DOMContentLoaded\', () => initVelouraCartBanners());\n';}
write(files[1],app);
let scss=read(files[2]); if(!scss.includes("veloura-cart-banners")){scss+='\n@import \'./05-utilities/veloura-cart-banners\';\n';write(files[2],scss)}
console.log('Cart banners V2.4 installed safely.');
