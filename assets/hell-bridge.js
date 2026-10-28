/* Supported ruined deck. Geometry is shared by the race and its layout tests. */
(function(root){
  'use strict';
  const motion = typeof module !== 'undefined' ? require('./hell-motion.js') : root.FoolMotion;
  const TOP=228,BOTTOM=338,GAP=4,RACE_SCALE=.62;
  // Oblique deck coordinates: x along travel, depth across the deck, z up.
  // Transverse joints share the same oblique projection.
  const DEPTH=BOTTOM-TOP,SHEAR=.72;
  function project(x,depth,z,camera){return {x:x-camera.distance+SHEAR*(depth-DEPTH/2),y:TOP+depth-z};}
  function worldX(x,depth,camera){return x+camera.distance-SHEAR*(depth-DEPTH/2);}
  const COLUMN_ATLAS='assets/hell-race/gothic-columns-v1.png';
  // Native 1254×1254 art uses irregular bands, not four equal grid cells.
  // Whole silhouettes include the broken capitals, plinths and fallen shaft.
  const COLUMN_FRAMES=Object.freeze([
    Object.freeze([158,2,344,744]),Object.freeze([767,6,359,740]),
    Object.freeze([95,778,477,456]),Object.freeze([661,883,581,342]),
  ]);
  let art=null,lake=null,columnArt=null;
  function loadColumns(redraw=()=>{}){
    if(!columnArt&&typeof root.Image==='function'){
      columnArt=new root.Image();columnArt.decoding='async';
      columnArt.src=root.HellscapeOffline?.assets?.[COLUMN_ATLAS]||COLUMN_ATLAS;
      columnArt.addEventListener('load',redraw,{once:true});
    }
    return columnArt;
  }
  function load(redraw=()=>{}){
    loadColumns(redraw);
    if(!art&&typeof root.Image==='function'){
      art=new root.Image();const path='assets/hell-race/lava-bridge-v1.webp';
      art.src=root.HellscapeOffline?.assets?.[path]||path;
      art.addEventListener('load',redraw,{once:true});
    }
    if(!lake&&typeof root.Image==='function'){
      lake=new root.Image();const path='assets/hell-race/lava-lake-v1.webp';
      lake.src=root.HellscapeOffline?.assets?.[path]||path;lake.addEventListener('load',redraw,{once:true});
    }
    return art;
  }
  function grounds(heights){
    const occupied=heights.reduce((a,b)=>a+b,0)+GAP*(heights.length-1);
    let y=TOP+(BOTTOM-TOP-occupied)/2;
    return heights.map(h=>{y+=h;const ground=y;y+=GAP;return ground;});
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
  function supports(c,width,camera){
    for(let n=Math.floor((camera.distance-130)/145);n<Math.ceil((camera.distance+width+130)/145);n++){
      const x=n*145-camera.distance+20;
      const masonry=c.createLinearGradient(x-18,0,x+20,0);masonry.addColorStop(0,'#74604b');masonry.addColorStop(.3,'#3e362a');masonry.addColorStop(1,'#171614');
      c.fillStyle=masonry;polygon(c,[{x:x-17,y:351},{x:x+19,y:351},{x:x+13,y:420},{x:x-10,y:420}]);c.fill();
      c.fillStyle='#756049';c.fillRect(x-18,350,39,5);
      c.strokeStyle='#25221c';c.lineWidth=2;for(let y=364;y<420;y+=12){c.beginPath();c.moveTo(x-13,y);c.lineTo(x+16,y);c.stroke();}
    }
  }
  function columnLayout(width,camera,near){
    const columns=[],spacing=154;
    for(let n=Math.floor((camera.distance-140)/spacing);n<Math.ceil((camera.distance+width+140)/spacing);n++){
      const variation=seeded(n+(near?149:73));
      const frame=near?(variation<.5?2:3):(variation<.25?2:variation<.62?0:1);
      const height=near?(frame===2?23+variation*8:14+variation*7):(frame===2?47+variation*20:76+variation*24);
      const crop=COLUMN_FRAMES[frame],world=n*spacing+seeded(n+37)*48+(near?58:0);
      const foot=project(world,near?DEPTH+13:2,0,camera),w=height*crop[2]/crop[3];
      columns.push({id:n,near,frame,world,foot,x:foot.x-w/2,y:foot.y-height,width:w,height});
    }
    return columns;
  }
  function ruins(c,width,camera,near){
    const image=loadColumns();if(!image?.complete||!image.naturalWidth)return;
    const sx=image.naturalWidth/1254,sy=image.naturalHeight/1254;
    for(const column of columnLayout(width,camera,near)){
      const [x,y,w,h]=COLUMN_FRAMES[column.frame];
      c.save();c.fillStyle='#0b0c0bb3';c.beginPath();
      c.ellipse(column.foot.x,column.foot.y-1,column.width*.42,2,0,0,Math.PI*2);c.fill();
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.drawImage(image,x*sx,y*sy,w*sx,h*sy,column.x,column.y,column.width,column.height);
      c.restore();
    }
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
    c.save();
    c.fillStyle='#681a0c';c.fillRect(0,184,width,200);
    // A separate liquid surface remains visible on both sides of the suspended deck.
    const molten=lake?.complete&&lake.naturalWidth?lake:null;
    if(molten){
      const offset=(effectTime*9)%width;
      for(let x=-offset;x<width;x+=width)c.drawImage(molten,0,0,molten.naturalWidth,molten.naturalHeight,x,184,width,200);
    }
    // Slow molten currents and embers, without a flashing full-screen overlay.
    for(let i=0;i<36;i++){
      const x=((i*79-effectTime*13)%width+width)%width,y=190+(i*47)%190;
      c.fillStyle=i%3?'#e95d1a88':'#ffbe5288';c.fillRect(Math.round(x),y,6+i%9,1);
    }
    const camera={distance:time*motion.ROAD_SPEED};
    supports(c,width,camera);ruins(c,width,camera,false);
    layers?.behind?.();
    c.save();
    const image=load();
    if(image?.complete&&image.naturalWidth){
      const tile=768,offset=(time*motion.ROAD_SPEED)%tile,s=image.naturalHeight/672;
      for(let x=-offset;x<width;x+=tile){
        // Driveable charcoal deck and masonry fascia; no railing.
        for(const [sy,sh,dy,dh] of [[214,123,TOP,BOTTOM-TOP],[337,260,BOTTOM,18]])
          c.drawImage(image,0,sy*s,image.naturalWidth,sh*s,Math.floor(x),dy,tile+1,dh);
      }
    }else{c.fillStyle='#292722';c.fillRect(0,TOP,width,BOTTOM-TOP);}
    c.fillStyle='#0b0c0db3';c.fillRect(0,TOP,width,BOTTOM-TOP);
    // Heat eats through the deck as questions progress, retaining terrain progression.
    for(let i=0;i<12;i++)if(progress>i/15){
      const x=((i*97-time*motion.ROAD_SPEED)%width+width)%width,y=TOP+10+(i*23)%86;
      c.fillStyle='#100e0c';c.fillRect(Math.round(x),y,9,2);
      c.fillStyle='#bb491e';c.fillRect(Math.round(x)+2,y+1,3,1);
      if(progress>.6){c.fillStyle='#ff9c3e';c.fillRect(Math.round(x)+3,y-Math.round(2+Math.sin(effectTime*3+i)*2),1,2);}
    }
    c.restore();
    roadDebris(c,width,camera);ruins(c,width,camera,true);
    fractures(c,layers?.damage);layers?.above?.();debris(c,layers?.damage,false);
    c.restore();
  }
  const api={TOP,BOTTOM,GAP,RACE_SCALE,DEPTH,SHEAR,project,worldX,grounds,draw,load,debris,features,loadColumns,columnLayout,COLUMN_ATLAS,COLUMN_FRAMES};
  if(typeof module!=='undefined')module.exports=api;else root.FoolBridge=api;
})(globalThis);
