/* Supported ruined deck. Geometry is shared by the race and its layout tests. */
(function(root){
  'use strict';
  const motion = typeof module !== 'undefined' ? require('./hell-motion.js') : root.FoolMotion;
  const TOP=228,BOTTOM=338,GAP=4,RACE_SCALE=1.24;
  // Oblique deck coordinates: x along travel, depth across the deck, z up.
  // Transverse joints share the same oblique projection.
  const DEPTH=BOTTOM-TOP,SHEAR=.72;
  function project(x,depth,z,camera){return {x:x-camera.distance+SHEAR*(depth-DEPTH/2),y:TOP+depth-z};}
  function worldX(x,depth,camera){return x+camera.distance-SHEAR*(depth-DEPTH/2);}
  const TILE=768,ROAD_TOP=110,ROAD_BOTTOM=180,FRONT_RISE=12;
  const ASSETS=Object.freeze({bridge:'assets/hell-race/black-stone-bridge-v1.png',sea:'assets/hell-race/lava-sea-v2.png'});
  let art=null,lake=null,water=null;
  function load(redraw=()=>{}){
    if(!art&&typeof root.Image==='function'){
      art=new root.Image();const path=ASSETS.bridge;
      art.src=root.HellscapeOffline?.assets?.[path]||path;
      art.addEventListener('load',redraw,{once:true});
    }
    if(!lake&&typeof root.Image==='function'){
      lake=new root.Image();const path=ASSETS.sea;
      lake.src=root.HellscapeOffline?.assets?.[path]||path;lake.addEventListener('load',redraw,{once:true});
    }
    return art;
  }
  function grounds(heights){
    // Lane depth locates tyre contacts, not the top of a tall vehicle.
    // Bodies can overlap in projection; paint far-to-near instead of shrinking them.
    return heights.map((_,index)=>TOP+DEPTH*(index+.5)/heights.length);
  }
  function polygon(c,points){c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function footprint(d,points){return points.map(([x,depth,z=0])=>project(d.anchorX+x,depth,z,d.camera));}
  // Stable world features: hashing the world tile keeps debris reproducible.
  function seeded(n){let x=Math.imul(n^0x5f3759df,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
  function features(distance,width){
    const result=[];for(let n=Math.floor((distance-160)/72);n<Math.ceil((distance+width+160)/72);n++){
      result.push({id:n,x:n*72+seeded(n)*31,depth:8+seeded(n+67)*94,kind:n%5,height:8+seeded(n+19)*5});
    }return result;
  }
  function tiles(width,camera){
    const result=[];
    for(let index=Math.floor((camera.distance-DEPTH*SHEAR)/TILE)-1;index<=Math.ceil((camera.distance+width+DEPTH*SHEAR)/TILE);index++)
      result.push({index,x:index*TILE-camera.distance,mirror:Math.abs(index%2)===1});
    return result;
  }
  function texture(c,image,tile,x,y,w,h,sx,sy,sw,sh){
    c.save();c.translate(x+(tile.mirror?w:0),y);if(tile.mirror)c.scale(-1,1);
    c.drawImage(image,sx,sy,sw,sh,0,0,w,h);c.restore();
  }
  function environment(c,width,height,time,effectTime=time){
    load();if(!lake?.complete||!lake.naturalWidth)return false;
    if(!water&&typeof document!=='undefined'){
      water=document.createElement('canvas');water.width=lake.naturalWidth;water.height=lake.naturalHeight;
      const ctx=water.getContext('2d');ctx.drawImage(lake,0,0);ctx.globalCompositeOperation='destination-in';
      const fade=ctx.createLinearGradient(0,water.height*.17,0,water.height*.32);
      fade.addColorStop(0,'#0000');fade.addColorStop(1,'#000');ctx.fillStyle=fade;ctx.fillRect(0,0,water.width,water.height);
    }
    const skyCamera={distance:time*motion.ROAD_SPEED*.035};
    for(const tile of tiles(width,skyCamera))texture(c,lake,tile,tile.x,0,TILE,height,0,0,lake.naturalWidth,lake.naturalHeight);
    if(water){
      // Lava and piers share world coordinates. Independent horizontal drift
      // makes the bridge look as though it is sliding across its foundations.
      const seaCamera={distance:time*motion.ROAD_SPEED};
      for(const tile of tiles(width,seaCamera))texture(c,water,tile,tile.x,0,TILE,height,0,0,water.width,water.height);
    }
    return true;
  }
  function front(c,width,camera){
    if(!art?.complete||!art.naturalWidth)return;
    const scale=TILE/art.naturalWidth,sourceY=ROAD_BOTTOM*art.naturalHeight/724;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    for(const tile of tiles(width,camera))
      texture(c,art,tile,tile.x+SHEAR*DEPTH/2,BOTTOM-FRONT_RISE,TILE,(art.naturalHeight-sourceY)*scale,0,sourceY,art.naturalWidth,art.naturalHeight-sourceY);
    c.restore();
  }
  function roadDebris(c,width,camera){
    for(const f of features(camera.distance,width)){
      const p=project(f.x,f.depth,0,camera);c.save();c.translate(p.x,p.y);c.transform(1,0,SHEAR,.4,0,0);c.rotate(seeded(f.id+2)*2);
      c.fillStyle='#0d0e0d';c.beginPath();c.ellipse(1,2,7,3,0,0,Math.PI*2);c.fill();
      if(Math.abs(f.kind)<2){
        c.strokeStyle='#b4a486';c.lineWidth=2;c.beginPath();c.moveTo(-5,-2);c.lineTo(5,1);c.stroke();
        for(const x of [-5,5]){c.fillStyle='#c1b295';c.beginPath();c.arc(x,x<0?-2:1,2,0,Math.PI*2);c.fill();}
        if(f.kind===0){c.fillStyle='#c5b89b';c.beginPath();c.ellipse(0,-3,4,5,0,0,Math.PI*2);c.fill();c.fillStyle='#28251e';c.fillRect(-2,-5,1.5,2);c.fillRect(1,-5,1.5,2);}
      }else if(Math.abs(f.kind)===2){c.strokeStyle='#947457';c.lineWidth=1.5;c.strokeRect(-5,-3,9,5);c.beginPath();c.moveTo(-6,3);c.lineTo(5,-4);c.stroke();}
      else {polygon(c,[{x:-5,y:2},{x:-3,y:-4},{x:3,y:-3},{x:6,y:2}]);c.fillStyle='#716650';c.fill();c.fillStyle='#a08b69';c.fillRect(-2,-3,4,1);}
      c.restore();
    }
  }
  function fractures(c,d){
    if(!d||d.damage<=0)return;c.save();c.globalAlpha=d.damage;
    for(let i=0;i<18;i++){
      const depth=d.depth-18+(i%6)*7,side=i%2?1:-1;
      const a=project(d.anchorX+side*3,depth,0,d.camera),b=project(d.anchorX+side*(14+i%5*5),depth+(i%3-1)*7,0,d.camera);
      c.strokeStyle='#131413';c.lineWidth=2;c.beginPath();c.moveTo(a.x,a.y);c.lineTo((a.x+b.x)/2+3,(a.y+b.y)/2);c.lineTo(b.x,b.y);c.stroke();
      c.strokeStyle='#9a8e71';c.lineWidth=.6;c.stroke();
    }c.restore();
  }
  function debris(c,d,front=false){
    if(!d||d.damage<=0)return;c.save();
    for(let i=0;i<24;i++){
      const age=d.sinceImpact-(i%7)*.024;if(age<0)continue;
      const depth=d.depth-24+(i%8)*7;if((depth>d.depth)!==front)continue;
      const airborne=Math.min(age,.65),z=Math.max(0,5+(22+i%5*4)*airborne-92*airborne*airborne);
      const point=project(d.anchorX+(i%2?1:-1)*(8+i%5*4)+(i%3-1)*Math.min(age,.7)*17,depth,z,d.camera);
      c.save();c.translate(point.x,point.y);
      if(z===0){c.fillStyle='#080909bb';c.beginPath();c.ellipse(2,2,7,2,0,0,Math.PI*2);c.fill();c.transform(1,0,SHEAR,.5,0,0);}
      c.rotate((i%2?1:-1)*Math.min(age,1)*(1+i%3));
      c.fillStyle=d.rubble?'#d7d5c1':i%3?'#51473c':'#8d7b60';polygon(c,[{x:-4,y:-3},{x:3,y:-4},{x:5,y:2},{x:-2,y:4}]);c.fill();
      c.fillStyle=d.rubble?'#bda55b':'#b59b70';c.fillRect(-3,-3,5,1);c.restore();
    }c.restore();
  }
  function draw(c,width,time,progress,world,effectTime=time,layers=null){
    const camera={distance:time*motion.ROAD_SPEED},image=load();
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(image?.complete&&image.naturalWidth){
      const backHeight=ROAD_TOP*image.naturalHeight/724,scale=TILE/image.naturalWidth;
      for(const tile of tiles(width,camera))
        texture(c,image,tile,tile.x-SHEAR*DEPTH/2,TOP-backHeight*scale,TILE,backHeight*scale,0,0,image.naturalWidth,backHeight);
      layers?.behind?.();
      c.save();c.beginPath();c.rect(0,TOP,width,DEPTH);c.clip();
      for(const tile of tiles(width,camera)){
        c.save();c.translate(tile.x-SHEAR*DEPTH/2,TOP);c.transform(1,0,SHEAR,1,0,0);
        texture(c,image,tile,0,0,TILE,DEPTH,0,backHeight,image.naturalWidth,(ROAD_BOTTOM-ROAD_TOP)*image.naturalHeight/724);
        c.restore();
      }
      c.restore();
    }else{
      layers?.behind?.();c.fillStyle='#171918';c.fillRect(0,TOP,width,DEPTH);
    }
    roadDebris(c,width,camera);fractures(c,layers?.damage);layers?.above?.();debris(c,layers?.damage,false);
    c.restore();
  }
  const api={TOP,BOTTOM,GAP,RACE_SCALE,DEPTH,SHEAR,project,worldX,grounds,draw,load,debris,features,environment,front,tiles,ASSETS,TILE,FRONT_RISE};
  if(typeof module!=='undefined')module.exports=api;else root.FoolBridge=api;
})(globalThis);
