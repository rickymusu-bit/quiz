/* Narrow suspension deck. Geometry is shared by the race and its layout tests. */
(function(root){
  'use strict';
  const motion = typeof module !== 'undefined' ? require('./hell-motion.js') : root.FoolMotion;
  const TOP=228,BOTTOM=338,GAP=4,RACE_SCALE=.62;
  // Oblique deck coordinates: x along travel, depth across the deck, z up.
  // Parallel rails stay horizontal; transverse joints have the same small shear.
  const DEPTH=BOTTOM-TOP,SHEAR=.72;
  function project(x,depth,z,camera){return {x:x-camera.distance+SHEAR*(depth-DEPTH/2),y:TOP+depth-z};}
  function worldX(x,depth,camera){return x+camera.distance-SHEAR*(depth-DEPTH/2);}
  let art=null,lake=null;
  function load(redraw=()=>{}){
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
  function holes(c,width,d){
    c.beginPath();c.rect(-2,0,width+4,384);
    const radius=25*d.damage;
    const regions=[[[ -radius,0,20],[radius,0,20],[radius,28,0],[-radius,28,0]],
      [[-radius,88,0],[radius,88,0],[radius,110,-40],[-radius,110,-40]]];
    if(d.collapse>0){const r=radius*d.collapse;regions.push([[-r,28,0],[r,28,0],[r-4,40,0],[r+3,55,0],[r-2,72,0],[r,88,0],[-r,88,0],[-r-4,72,0],[-r+3,55,0],[-r-3,40,0]]);}
    for(const region of regions){const points=footprint(d,region);points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
    c.clip('evenodd');
  }
  function fractures(c,d){
    if(!d||d.damage<=0)return;c.save();
    // The intact middle slab is the winner's approach, then falls after passage.
    const fall=Math.max(0,d.collapseAge||0),z=fall?2-110*fall*fall:2;
    if(z>-16){
      const plate=footprint(d,[[-31,28,z],[31,28,z],[31,88,z],[-31,88,z]]);
      polygon(c,plate);c.fillStyle='#3c3832';c.fill();c.strokeStyle='#a28d69';c.lineWidth=1;c.stroke();
      if(art?.complete&&art.naturalWidth){
        c.save();polygon(c,plate);c.clip();const xs=plate.map(p=>p.x),ys=plate.map(p=>p.y),scale=art.naturalHeight/672;
        c.drawImage(art,0,214*scale,art.naturalWidth/3,123*scale,Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));c.restore();
      }
      for(let i=0;i<2;i++){
        const edge=i?29:-29;
        const a=project(d.anchorX+edge,30,z,d.camera),b=project(d.anchorX+edge,86,z,d.camera);
        c.strokeStyle=i%2?'#24231f':'#736852';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
      }
      const sill=footprint(d,[[-4,28,z+1],[10,28,z+1],[10,88,z+1],[-4,88,z+1]]);
      polygon(c,sill);c.fillStyle='#a8a28a';c.fill();
    }
    for(let i=0;i<12;i++){
      const depth=i<6?4+i*4:90+(i-6)*3;
      const start=project(d.anchorX+(i%2?24:-24)*d.damage,depth,0,d.camera);
      const finish=project(d.anchorX+(i%2?1:-1)*(30+i%4*7)*d.damage,depth+(i%3-1)*8*d.damage,0,d.camera);
      c.strokeStyle=i%3?'#161311':'#d78443';c.lineWidth=1;c.beginPath();c.moveTo(start.x,start.y);c.lineTo((start.x+finish.x)/2+2,start.y+3);c.lineTo(finish.x,finish.y);c.stroke();
    }
    c.restore();
  }
  function debris(c,d,front=false){
    if(!d||d.damage<=0)return;c.save();
    for(let i=0;i<24;i++){
      const central=i>=14,age=(central?d.collapseAge:d.sinceImpact)-(i%7)*.024;
      const depth=central?36+(i-14)*5:i%2?100:10;
      if((depth>75)!==front||age<0||age>1.7)continue;
      const z=5+(22+i%5*4)*age-92*age*age;if(z< -18)continue;
      const point=project(d.anchorX+(i%2?1:-1)*(8+i%5*4)+(i%3-1)*age*17,depth,z,d.camera);
      c.save();c.translate(point.x,point.y);c.rotate((i%2?1:-1)*age*(1+i%3));
      c.fillStyle=i%3?'#51473c':'#8d7b60';polygon(c,[{x:-4,y:-3},{x:3,y:-4},{x:5,y:2},{x:-2,y:4}]);c.fill();
      c.fillStyle='#b59b70';c.fillRect(-3,-3,5,1);c.restore();
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
    layers?.behind?.();
    c.save();if(layers?.damage?.damage>0)holes(c,width,layers.damage);
    const image=load();
    if(image?.complete&&image.naturalWidth){
      const tile=768,offset=(time*motion.ROAD_SPEED)%tile,s=image.naturalHeight/672;
      for(let x=-offset;x<width;x+=tile){
        // Separate the top rail, driveable deck and suspended masonry fascia.
        for(const [sy,sh,dy,dh] of [[120,94,208,20],[214,123,TOP,BOTTOM-TOP],[337,260,BOTTOM,40]])
          c.drawImage(image,0,sy*s,image.naturalWidth,sh*s,Math.floor(x),dy,tile+1,dh);
      }
    }else{c.fillStyle='#292722';c.fillRect(0,TOP,width,BOTTOM-TOP);}
    // Heat eats through the deck as questions progress, retaining terrain progression.
    for(let i=0;i<12;i++)if(progress>i/15){
      const x=((i*97-time*motion.ROAD_SPEED)%width+width)%width,y=TOP+10+(i*23)%86;
      c.fillStyle='#100e0c';c.fillRect(Math.round(x),y,9,2);
      c.fillStyle='#bb491e';c.fillRect(Math.round(x)+2,y+1,3,1);
      if(progress>.6){c.fillStyle='#ff9c3e';c.fillRect(Math.round(x)+3,y-Math.round(2+Math.sin(effectTime*3+i)*2),1,2);}
    }
    c.restore();
    fractures(c,layers?.damage);layers?.above?.();debris(c,layers?.damage,false);
    c.restore();
  }
  const api={TOP,BOTTOM,GAP,RACE_SCALE,DEPTH,SHEAR,project,worldX,grounds,draw,load,debris};
  if(typeof module!=='undefined')module.exports=api;else root.FoolBridge=api;
})(globalThis);
