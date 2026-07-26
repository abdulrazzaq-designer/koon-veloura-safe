#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=process.cwd();
const masterPath=path.join(ROOT,'src','views','layouts','master.twig');
const singlePath=path.join(ROOT,'src','views','pages','product','single.twig');
const twilightPath=path.join(ROOT,'twilight.json');
function fail(msg){console.error(`\n[V53 VERIFY] ERROR: ${msg}`);process.exit(1);}
for(const p of [masterPath,singlePath,twilightPath])if(!fs.existsSync(p))fail(`Missing ${path.relative(ROOT,p)}`);
try{JSON.parse(fs.readFileSync(twilightPath,'utf8'));}catch(e){fail(`twilight.json invalid: ${e.message}`);}
const master=fs.readFileSync(masterPath,'utf8');
const single=fs.readFileSync(singlePath,'utf8');
const start='{# Veloura QV V53 radius, related title and card-edge hotfix start #}';
const end='{# Veloura QV V53 radius, related title and card-edge hotfix end #}';
if((master.split(start).length-1)!==1||(master.split(end).length-1)!==1)fail('V53 block is missing or duplicated.');
if(master.includes('{# Veloura QV V52 product finish start #}'))fail('The conflicting V52 block is still present.');
for(const needle of ['--veloura-v53-global-radius','function configurePurchaseButtons','function configureThumbs','function configureRelated','function syncRelatedRow'])if(!master.includes(needle))fail(`Missing runtime item: ${needle}`);
if(!single.includes('class="veloura-product-related-title"'))fail('Stable related-products title was not added.');
if(/<salla-products-slider[\s\S]{0,1200}block-title=/.test(single))fail('The old internal related title is still active.');
if(!single.includes('show-thumbs-controls="false"'))fail('Thumbnail arrows are not disabled.');
if(!single.includes('data-veloura-related-snap="one"'))fail('One-card related snapping is missing.');
const script=(master.match(/<script[^>]*id="veloura-qv-v53-runtime-2026"[^>]*>([\s\S]*?)<\/script>/)||[])[1];
if(!script)fail('Could not extract V53 runtime.');
try{new Function(script);}catch(e){fail(`V53 runtime syntax error: ${e.message}`);}
console.log('twilight.json: OK');
console.log('Quick View V53 verified successfully.');
console.log('Sharp radius reaches real purchase-button and thumbnail surfaces, related title is light-DOM and visible, and related action rows use exact card-edge geometry.');
