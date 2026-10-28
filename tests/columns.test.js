'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const B=require('../assets/hell-bridge.js');
test('All four native column crops contain complete illustrated silhouettes with transparent margins',async()=>{
  const art=await loadImage(B.COLUMN_ATLAS);assert.equal(art.width,1254);assert.equal(art.height,1254);
  for(const [x,y,w,h]of B.COLUMN_FRAMES){
    assert(x>=0&&y>=0&&x+w<=art.width&&y+h<=art.height);
    const ctx=createCanvas(w,h).getContext('2d');ctx.drawImage(art,x,y,w,h,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h).data;let solid=0;
    for(let py=0;py<h;py++)for(let px=0;px<w;px++){
      const alpha=pixels[(py*w+px)*4+3];if(alpha>128)solid++;
      if(px===0||py===0||px===w-1||py===h-1)assert(alpha<16,'No capital, foot or fallen shaft crosses its crop');
    }
    assert(solid>w*h*.2,'Substantial painted masonry, not an empty or wrong cell');
  }
});
test('Column proportions and world positions stay stable as the camera moves, on both edges',()=>{
  for(const near of [false,true]){
    const a=B.columnLayout(512,{distance:0},near),b=B.columnLayout(512,{distance:48},near),byId=new Map(a.map(c=>[c.id,c]));
    for(const column of b){
      const crop=B.COLUMN_FRAMES[column.frame];
      assert(Math.abs(column.width/column.height-crop[2]/crop[3])<1e-9);
      assert(column.height*3<crop[3],'Enough native detail even at the capped raster scale');
      if(near)assert(column.height<32,'Front ruins stay low for vehicle legibility');
      if(byId.has(column.id)){const old=byId.get(column.id);assert.equal(column.frame,old.frame);assert.equal(column.height,old.height);assert.equal(column.foot.y,old.foot.y);assert(Math.abs(column.x-old.x+48)<1e-9);}
    }
    assert.deepEqual(a,B.columnLayout(512,{distance:0},near));
  }
});
