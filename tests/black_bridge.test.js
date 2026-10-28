'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const B=require('../assets/hell-bridge.js'),L=require('../assets/hell-layout.js');
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
