/* White marble/azure gateway: world geometry, contact, textured collapse. */
(function(root){
  'use strict';
  const B=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const F=typeof module!=='undefined'?require('./hell-epilogue.js'):root.FoolEpilogue;
  const ASSET='assets/hell-race/portal-side-v3.png';
  // Landmarks belong to the native oblique drawing. Never shear the complete sprite.
  const SPRITE=Object.freeze({width:1024,height:1536,anchorX:484,anchorY:1360,rise:1352,
    opening:[[344,1230],[574,1520],[574,620],[344,330]],
    near:[[495,0],[1024,0],[1024,1536],[440,1536],[440,1330],[475,1200],[520,1130],[520,600],[495,540]],
    feet:[[[186,1142],[280,1222],[343,1233],[451,1155]],[[456,1417],[579,1526],[648,1514],[692,1518],[850,1451],[850,1428]]],
    fragments:[[1,262,104,79,88],[2,341,8,171,184],[3,512,86,145,106],[7,226,192,115,192],[8,341,192,171,192],[9,512,192,170,192],[10,682,210,136,174],[13,230,384,111,192],[14,341,384,171,192],[15,512,384,170,192],[16,682,384,137,192],[19,252,576,89,192],[20,341,576,89,192],[21,528,576,154,192],[22,682,576,118,192],[25,195,768,146,192],[26,341,768,89,192],[27,539,768,143,192],[28,682,768,118,192],[31,186,960,155,192],[32,341,960,111,192],[33,513,960,169,192],[34,682,960,128,192],[37,191,1152,150,81],[38,341,1152,171,192],[39,512,1152,170,192],[40,682,1152,156,192],[44,455,1344,57,120],[45,512,1344,170,184],[46,682,1344,169,176]]});
  let art=null;
  function load(redraw=()=>{}){
    if(!art&&typeof root.Image==='function'){
      art=new root.Image();art.decoding='async';art.src=root.HellscapeOffline?.assets?.[ASSET]||ASSET;
      art.addEventListener('load',redraw,{once:true});art.addEventListener('error',()=>{art.failed=true;redraw();},{once:true});
    }return art;
  }
  function aboveWater(vertices,water){
    const out=[];
    for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=a.z>=water,next=b.z>=water;
      if(inside)out.push(a);
      if(inside!==next){const t=(water-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*t,depth:a.depth+(b.depth-a.depth)*t,z:water});}
    }return out;
  }
  function point(p,x,depth,z){
    const g=p.geometry,mid=(g.far+g.near)/2;
    return B.project(p.anchorX+x+g.skew*(depth-mid),depth,z-p.offset,p.camera);
  }
  function vertices(p,points){
    const g=p.geometry,mid=(g.far+g.near)/2;
    return aboveWater(points.map(([x,depth,z])=>({x:p.anchorX+x+g.skew*(depth-mid),depth,z:z-p.offset})),-g.water)
      .map(v=>B.project(v.x,v.depth,v.z,p.camera));
  }
  function path(c,points){c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function spriteFrame(p){
    const g=p.geometry,anchor=point(p,0,(g.far+g.near)/2,0),scale=g.height/SPRITE.rise;
    return {x:anchor.x-SPRITE.anchorX*scale,y:anchor.y-SPRITE.anchorY*scale,scale,width:SPRITE.width*scale,height:SPRITE.height*scale};
  }
  function spritePoint(p,x,y){const f=spriteFrame(p);return {x:f.x+x*f.scale,y:f.y+y*f.scale};}
  function spritePath(c,p,points){path(c,points.map(([x,y])=>spritePoint(p,x,y)));}
  function drawSprite(c,p,near){
    const image=load(),f=spriteFrame(p);
    if(!image?.complete||!image.naturalWidth)return;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(near){spritePath(c,p,SPRITE.near);c.clip();}
    c.drawImage(image,f.x,f.y,f.width,f.height);c.restore();
  }
  function seed(i){return ((Math.imul(i+17,1103515245)>>>0)%997)/997;}
  function pieces(p){
    const g=p.geometry,mid=(g.far+g.near)/2,scale=g.height/SPRITE.rise;
    return SPRITE.fragments.map(([id,sx,sy,sw,sh])=>{
      const age=Math.max(0,Math.min(1.65,p.collapseAge)-Math.floor(id/6)*.022-seed(id)*.08);
      const width=sw*scale,height=sh*scale,centerX=sx+sw/2,centerY=sy+sh/2;
      const initialDepth=g.far+Math.max(0,Math.min(1,(centerX-186)/(851-186)))*(g.near-g.far);
      const initialX=(centerX-SPRITE.anchorX)*scale-(B.SHEAR+g.skew)*(initialDepth-mid);
      const initialZ=initialDepth-mid-(centerY-SPRITE.anchorY)*scale;
      const settledZ=height*.16,z=Math.max(settledZ,initialZ-220*age*age),fall=Math.min(1,age/1.1);
      const padding=Math.hypot(width,height)/2+2,targetDepth=Math.max(padding,Math.min(B.DEPTH-padding,initialDepth+(seed(id+7)-.5)*30));
      return {id,sx,sy,sw,sh,near:centerX>=495,width,height,
        depth:initialDepth+(targetDepth-initialDepth)*fall,
        x:initialX+((seed(id+13)-.5)*62-initialX)*fall,z,
        angle:(seed(id+23)-.5)*3*Math.min(1,age*2),settled:z===settledZ};
    });
  }
  function rubble(c,p,near){
    const image=load();
    for(const piece of pieces(p).filter(v=>v.near===near).sort((a,b)=>a.depth-b.depth)){
      if(piece.settled){block(c,p,piece,image);continue;}
      const at=point({...p,offset:0},piece.x,piece.depth,piece.z);
      c.save();c.translate(at.x,at.y);c.rotate(piece.angle);
      if(image?.complete&&image.naturalWidth)
        c.drawImage(image,piece.sx,piece.sy,piece.sw,piece.sh,-piece.width/2,-piece.height/2,piece.width,piece.height);
      c.restore();
    }
  }
  function block(c,p,piece,image){
    const g=p.geometry,cos=Math.cos(piece.angle),sin=Math.sin(piece.angle),length=piece.height*.84,width=piece.width;
    const height=4+seed(piece.id+41)*5;
    const at=(x,depth,z)=>point({...p,offset:0},piece.x+x*cos-depth*sin,piece.depth+x*sin+depth*cos,z);
    const a=at(-length/2,-width/2,height),b=at(length/2,-width/2,height),d=at(-length/2,width/2,height),e=at(length/2,width/2,height);
    const floorB=at(length/2,-width/2,0),floorD=at(-length/2,width/2,0),floorE=at(length/2,width/2,0);
    c.save();path(c,[at(-length/2,-width/2,0),floorB,floorE,floorD]);c.fillStyle='#0a111955';c.fill();
    path(c,[b,e,floorE,floorB]);c.fillStyle='#a5b3b6';c.fill();
    path(c,[d,e,floorE,floorD]);c.fillStyle='#d1dbd9';c.fill();
    path(c,[a,b,e,d]);c.fillStyle=piece.id%3?'#e8ece4':'#86b6c7';c.fill();c.strokeStyle='#566166';c.lineWidth=.5;c.stroke();
    if(image?.complete&&image.naturalWidth){
      path(c,[a,b,e,d]);c.clip();
      c.transform((B.SHEAR+g.skew)*cos-sin,cos,(B.SHEAR+g.skew)*sin+cos,sin,a.x,a.y);
      c.drawImage(image,piece.sx,piece.sy,piece.sw,piece.sh,0,0,width,length);
    }c.restore();
  }
  function ground(c,p){
    const g=p.geometry,floor={...p,offset:0},contact=Math.max(0,Math.min(1,p.descent));
    c.save();c.globalAlpha=contact*contact*.36*(1-p.collapse);
    for(const foot of SPRITE.feet){spritePath(c,floor,foot);c.fillStyle='#03080a';c.fill();}
    c.globalAlpha=p.damage??0;
    spritePath(c,floor,[[266,1224],[577,1524],[589,1514],[278,1214]]);c.fillStyle='#06090c';c.fill();
    if(p.opening>0){
      c.globalAlpha=p.opening*.24;
      spritePath(c,floor,[[184,1230],[414,1520],[574,1520],[344,1230]]);c.fillStyle='#a2edff';c.fill();
    }
    const age=p.sinceImpact;
    if(age>=0&&age<.8){
      for(let i=0;i<22;i++){
        const depth=g.far+seed(i)*((g.near-g.far)),at=point(floor,(seed(i+5)-.5)*age*65,depth,Math.sin(age/.8*Math.PI)*(4+seed(i+9)*16));
        c.globalAlpha=(1-age/.8)*.42;c.fillStyle=i%3?'#a89d8a':'#e3e9df';c.beginPath();c.ellipse(at.x,at.y,2+age*5,1+age*2,0,0,Math.PI*2);c.fill();
      }
    }c.restore();
  }
  function surface(c,p){
    if(!p?.visible||p.opening<=0||p.collapse>0)return;
    const points=SPRITE.opening.map(([x,y])=>spritePoint(p,x,y)),left=spritePoint(p,429,0),right=spritePoint(p,540,0);
    c.save();path(c,points);c.clip();
    const glow=c.createLinearGradient(left.x,0,right.x,0);
    glow.addColorStop(0,'#4b9bd1');glow.addColorStop(.22,'#acebff');glow.addColorStop(.5,'#f8ffff');glow.addColorStop(.8,'#d6f7ff');glow.addColorStop(1,'#659fcf');
    c.globalAlpha=p.opening;c.fillStyle=glow;path(c,points);c.fill();
    for(let i=0;i<12;i++){
      const at=spritePoint(p,433+(i+.5)*104/12,550+((i*77+p.time*85)%660));
      c.globalAlpha=p.opening*(.18+.2*seed(i));c.fillStyle='#ffffff';c.beginPath();c.ellipse(at.x,at.y,.7,5+i%3,0,0,Math.PI*2);c.fill();
    }c.restore();
  }
  function architecture(c,p,near){
    if(p.collapse>0){rubble(c,p,near);return;}
    if(p.visible)drawSprite(c,p,near);
  }
  function back(c,p){if(!p)return;ground(c,p);surface(c,p);architecture(c,p,false);}
  function front(c,p){if(p)architecture(c,p,true);}
  const api={load,ASSET,SPRITE,spriteFrame,aboveWater,vertices,point,pieces,back,front,geometry:F.GATE};
  if(typeof module!=='undefined')module.exports=api;else root.FoolPortal=api;
})(globalThis);
