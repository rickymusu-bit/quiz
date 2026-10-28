/* Marble architecture on the bridge's transverse world plane; no screen anchor. */
(function(root){
  'use strict';
  const B=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const F=typeof module!=='undefined'?require('./hell-epilogue.js'):root.FoolEpilogue;
  let art=null;
  function load(redraw=()=>{}){
    if(!art&&typeof root.Image==='function'){
      art=new root.Image();art.decoding='async';const path='assets/hell-race/portal-marble-v1.webp';
      art.src=root.HellscapeOffline?.assets?.[path]||path;
      art.addEventListener('load',redraw,{once:true});art.addEventListener('error',()=>{art.failed=true;redraw();},{once:true});
    }return art;
  }
  // Clip in world height before projection. Foundations stay submerged while
  // the same rigid structure rises/sinks, including its extruded side walls.
  function aboveWater(vertices,water){
    const out=[];
    for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=a.z>=water,next=b.z>=water;
      if(inside)out.push(a);
      if(inside!==next){const t=(water-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*t,depth:a.depth+(b.depth-a.depth)*t,z:water});}
    }return out;
  }
  function vertices(p,points){return aboveWater(points.map(([x,depth,z])=>({x:p.anchorX+x,depth,z:z-p.offset})),-p.geometry.water).map(v=>B.project(v.x,v.depth,v.z,p.camera));}
  function path(c,points){c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();}
  function polygon(c,p,points,color){const v=vertices(p,points);if(v.length<3)return;path(c,v);c.fillStyle=color;c.fill();}
  function face(c,p,near){
    const g=p.geometry,mid=B.DEPTH/2,far=near?mid:g.far,last=near?g.near:mid;
    const clip=vertices(p,[[0,far,g.height-g.water],[0,last,g.height-g.water],[0,last,-g.water],[0,far,-g.water]]);
    if(clip.length<3)return;
    const image=load();c.save();path(c,clip);c.clip();
    if(image?.complete&&image.naturalWidth){
      const origin=B.project(p.anchorX,g.far,g.height-g.water-p.offset,p.camera),span=g.near-g.far;
      c.transform(B.SHEAR*span/image.naturalWidth,span/image.naturalWidth,0,g.height/image.naturalHeight,origin.x,origin.y);
      c.drawImage(image,0,0);
    }else{
      // Coherent geometric fallback, including the aperture and a pediment.
      for(const [a,b]of [[g.far,g.openingFar],[g.openingNear,g.near]])polygon(c,p,[[0,a,-g.water],[0,b,-g.water],[0,b,138],[0,a,138]],'#ded6bd');
      polygon(c,p,[[0,g.far,138],[0,g.near,138],[0,g.near,166],[0,g.far,166]],'#e5d5a6');
      polygon(c,p,[[0,g.far,166],[0,g.near,166],[0,mid,204]],'#e9e4d4');
    }c.restore();
  }
  function sides(c,p,near){
    const g=p.geometry,d=near?g.near:g.far,mid=B.DEPTH/2;
    polygon(c,p,[[0,d,-g.water],[g.thickness,d,-g.water],[g.thickness,d,164],[0,d,164]],near?'#958b72':'#827c70');
    const image=load(),side=vertices(p,[[0,d,-g.water],[g.thickness,d,-g.water],[g.thickness,d,164],[0,d,164]]);
    if(side.length>=3&&image?.complete&&image.naturalWidth){
      c.save();path(c,side);c.clip();const at=B.project(p.anchorX,d,164-p.offset,p.camera);
      c.drawImage(image,image.naturalWidth*.84,image.naturalHeight*.18,image.naturalWidth*.11,image.naturalHeight*.82,at.x,at.y,g.thickness,180);
      c.globalAlpha=.27;c.fillStyle='#29251c';c.fillRect(at.x,at.y,g.thickness,180);c.restore();
    }
    for(const z of [0,18,132,143,157,164])polygon(c,p,[[0,d,z],[g.thickness,d,z],[g.thickness,d,z+3],[0,d,z+3]],'#d4b76a');
    const a=near?mid:g.far,b=near?g.near:mid;
    const za=near?204:166,zb=near?166:204;
    polygon(c,p,[[0,a,za],[g.thickness,a,za],[g.thickness,b,zb],[0,b,zb]],'#cbbd91');
  }
  function water(c,p,near){
    const g=p.geometry,depth=near?g.near-9:g.far+9,point=B.project(p.anchorX+g.thickness/2,depth,-g.water,p.camera);
    const energy=Math.max(.15,Math.min(1,Math.abs(p.offset-g.bury)*.015+p.opening*.3));
    c.save();
    for(let ring=0;ring<3;ring++){
      const phase=(p.time*.7+ring/3)%1,radius=8+phase*23;c.globalAlpha=(1-phase)*energy*.6;
      c.strokeStyle=ring%2?'#ffd07a':'#ed6c28';c.lineWidth=1;c.beginPath();c.ellipse(point.x,point.y+1,radius,radius*.16,0,0,Math.PI*2);c.stroke();
    }
    // A liquid lip occludes the bottom of each foundation, never its cornice.
    c.globalAlpha=.8;c.fillStyle='#e97d35';c.fillRect(Math.round(point.x-9),Math.round(point.y-1),18,2);
    for(let i=0;i<8;i++){
      const phase=(p.time*1.5+i*.137)%1,x=point.x+(i-3.5)*3+Math.sin(i*5)*phase*5;
      const y=point.y-Math.sin(phase*Math.PI)*energy*(7+i%3*3);c.globalAlpha=(1-phase)*energy;c.fillStyle=i%3?'#e88230':'#ffd784';c.fillRect(Math.round(x),Math.round(y),2,2);
    }c.restore();
  }
  function back(c,p){if(!p?.visible)return;sides(c,p,false);face(c,p,false);water(c,p,false);}
  function surface(c,p){
    if(!p?.visible||p.opening<=0)return;
    const g=p.geometry,h=g.openingHeight*p.opening,points=vertices(p,[[0,g.openingFar,0],[0,g.openingNear,0],[0,g.openingNear,h],[0,g.openingFar,h]]);
    if(points.length<3)return;c.save();path(c,points);c.clip();
    const left=B.project(p.anchorX,g.openingFar,0,p.camera),right=B.project(p.anchorX,g.openingNear,0,p.camera);
    const glow=c.createLinearGradient(left.x,left.y,right.x,right.y);glow.addColorStop(0,'#2456a8');glow.addColorStop(.18,'#77ceff');glow.addColorStop(.48,'#f5ffff');glow.addColorStop(.7,'#c9f5ff');glow.addColorStop(1,'#3878ce');
    c.fillStyle=glow;c.fillRect(0,0,512,384);
    for(let i=0;i<10;i++){
      const depth=g.openingFar+((i*11+p.time*3)%(g.openingNear-g.openingFar));
      const a=B.project(p.anchorX,depth,0,p.camera),b=B.project(p.anchorX,depth,h,p.camera);
      c.strokeStyle=i%3?'#b8eaff22':'#ffffff33';c.lineWidth=1;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
    }c.restore();
  }
  function front(c,p){if(!p?.visible)return;sides(c,p,true);face(c,p,true);water(c,p,true);}
  const api={load,aboveWater,vertices,back,surface,front,geometry:F.GATE};
  if(typeof module!=='undefined')module.exports=api;else root.FoolPortal=api;
})(globalThis);
