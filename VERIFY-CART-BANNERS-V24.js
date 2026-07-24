const fs=require('fs');
const checks=[['src/views/pages/cart.twig',"components.cart.veloura-cart-banners"],['src/assets/js/app.js','initVelouraCartBanners'],['src/assets/styles/app.scss','veloura-cart-banners'],['src/views/components/cart/veloura-cart-banners.twig','data-veloura-cart-banners']];
for(const [f,s] of checks){if(!fs.existsSync(f)||!fs.readFileSync(f,'utf8').includes(s))throw new Error('Verification failed: '+f)}
JSON.parse(fs.readFileSync('twilight.json','utf8'));
console.log('twilight.json: OK');console.log('Cart banners V2.4 verified successfully.');
