'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const B=require('../assets/hell-bridge.js'),L=require('../assets/hell-layout.js');
const fs=require('node:fs'),vm=require('node:vm');
test('The new structural bridge has transparent arch openings and opaque load-bearing piers',async()=>{
 const img=await loadImage(B.ASSETS.bridge),ctx=createCanvas(img.width,img.height).getContext('2d');
 assert.equal(img.width,2172);assert.equal(img.height,724);ctx.drawImage(img,0,0);
 assert.equal(ctx.getImageData(450,520,1,1).data[3],0,'Lava remains a separate layer through the arch');
 assert(ctx.getImageData(190,600,1,1).data[3]>200,'A real stone support occupies the pier');
});
test('Wider 4:3 camera exposes the supporting structure while every layer retains the same world phase',()=>{
 assert.equal(L.reference.rasterWidth/L.reference.rasterHeight,4/3);
 assert(L.reference.rasterHeight>B.BOTTOM+180,'Room for masonry piers below the road');
 const first=B.tiles(768,{distance:15}),later=B.tiles(768,{distance:63}),byId=new Map(first.map(t=>[t.index,t]));
 for(const tile of later)if(byId.has(tile.index)){
  assert.equal(tile.x,byId.get(tile.index).x-48);assert.equal(tile.mirror,byId.get(tile.index).mirror);
 }
 const far=B.project(200,0,0,{distance:0}),near=B.project(200,B.DEPTH,0,{distance:0});
 assert.equal(near.y-far.y,B.DEPTH);assert(Math.abs(near.x-far.x-B.SHEAR*B.DEPTH)<1e-9);
 assert(B.FRONT_RISE>0,'Foreground curb can physically occlude vehicles');
});
test('Actual lava and masonry pixels translate together, including a change in camera speed',async()=>{
 const root={FoolMotion:require('../assets/hell-motion.js'),art:await loadImage(B.ASSETS.bridge),lake:await loadImage(B.ASSETS.sea)};
 const source=fs.readFileSync('assets/hell-bridge.js','utf8').replace('let art=null,lake=null,water=null;','let art=root.art,lake=root.lake,water=null;');
 const sandbox={document:{createElement:()=>createCanvas(1,1)},...root};vm.runInNewContext(source,sandbox);
 const bridge=sandbox.FoolBridge;
 function render(distance,effectTime){
  const c=createCanvas(768,576),ctx=c.getContext('2d');
  bridge.environment(ctx,768,576,distance/48,effectTime);bridge.draw(ctx,768,distance/48,0,null,effectTime);bridge.front(ctx,768,{distance});return ctx;
 }
 const first=render(24,.5);
 for(const [distance,effectTime]of [[72,1.5],[120,4.2]]){
  const later=render(distance,effectTime),shift=distance-24;
  for(const [y,h]of [[350,150],[540,30]]){
   assert.deepEqual(later.getImageData(160-shift,y,400,h).data,first.getImageData(160,y,400,h).data,
    'The same world patch of lava and bridge must retain its relative position');
  }
 }
});
test('Every race vehicle is twice its previous width and height, with tyre contacts on the deck',async()=>{
 const image=await loadImage('assets/hell-race/vehicles-drive-v1.webp');
 const root={FoolMotion:require('../assets/hell-motion.js'),FoolLayout:L,FoolBridge:B,__sheets:{vehicles:image},matchMedia:()=>({matches:false})};
 const source=fs.readFileSync('assets/hell-race.js','utf8').replace('const sheets = { vehicles: null, demon: null, world: null };','const sheets=root.__sheets;').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace={vehicleSize};');
 vm.runInNewContext(source,{window:root,document:{createElement:()=>createCanvas(1,1)}});
 const current=[0,1,2,3,4,5].map(row=>root.FoolHellRace.vehicleSize(row));
 root.FoolBridge={...B,RACE_SCALE:.62};
 current.forEach((size,row)=>{
  const before=root.FoolHellRace.vehicleSize(row);
  assert.equal(size.width,before.width*2);assert.equal(size.height,before.height*2);
 });
 const grounds=B.grounds(current.slice(0,3).map(s=>s.height));
 assert(grounds.every(y=>y>B.TOP&&y<B.BOTTOM));
 assert(grounds[0]<grounds[1]&&grounds[1]<grounds[2]);
});
