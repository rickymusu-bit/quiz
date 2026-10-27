/* Narrow suspension deck. Geometry is shared by the race and its layout tests. */
(function(root){
  'use strict';
  const TOP=228,BOTTOM=338,GAP=4,RACE_SCALE=.62;
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
  function draw(c,width,time,progress,world,effectTime=time){
    c.save();
    c.fillStyle='#681a0c';c.fillRect(0,184,width,200);
    // A separate liquid surface remains visible on both sides of the suspended deck.
    const molten=lake?.complete&&lake.naturalWidth?lake:null;
    if(molten){
      const offset=(time*9)%width;
      for(let x=-offset;x<width;x+=width)c.drawImage(molten,0,0,molten.naturalWidth,molten.naturalHeight,x,184,width,200);
    }
    // Slow molten currents and embers, without a flashing full-screen overlay.
    for(let i=0;i<36;i++){
      const x=((i*79-time*13)%width+width)%width,y=190+(i*47)%190;
      c.fillStyle=i%3?'#e95d1a88':'#ffbe5288';c.fillRect(Math.round(x),y,6+i%9,1);
    }
    const image=load();
    if(image?.complete&&image.naturalWidth){
      const tile=768,offset=(time*48)%tile,s=image.naturalHeight/672;
      for(let x=-offset;x<width;x+=tile){
        // Separate the top rail, driveable deck and suspended masonry fascia.
        for(const [sy,sh,dy,dh] of [[120,94,208,20],[214,123,TOP,BOTTOM-TOP],[337,260,BOTTOM,40]])
          c.drawImage(image,0,sy*s,image.naturalWidth,sh*s,Math.floor(x),dy,tile+1,dh);
      }
    }else{c.fillStyle='#292722';c.fillRect(0,TOP,width,BOTTOM-TOP);}
    // Heat eats through the deck as questions progress, retaining terrain progression.
    for(let i=0;i<12;i++)if(progress>i/15){
      const x=((i*97-time*48)%width+width)%width,y=TOP+10+(i*23)%86;
      c.fillStyle='#100e0c';c.fillRect(Math.round(x),y,9,2);
      c.fillStyle='#bb491e';c.fillRect(Math.round(x)+2,y+1,3,1);
      if(progress>.6){c.fillStyle='#ff9c3e';c.fillRect(Math.round(x)+3,y-Math.round(2+Math.sin(effectTime*3+i)*2),1,2);}
    }
    // Accumulating debris follows completed questions and scrolls with the masonry.
    const terrain=root.FoolTerrain;
    if(terrain){
      c.save();c.beginPath();c.rect(0,TOP,width,BOTTOM-TOP);c.clip();
      const chunk=128,offset=time*48;
      for(let tile=Math.floor(offset/chunk)-1;tile<=Math.floor((offset+width)/chunk)+1;tile++){
        for(let i=0;i<6;i++){
          const seed=tile*71+i*109;
          const alpha=Math.max(0,Math.min(1,(progress-(.12+i*.12))/.18));
          if(!alpha)continue;
          const x=tile*chunk-offset+((seed*17%113)+113)%113;
          const y=TOP+14+((seed*23%80)+80)%80;
          c.globalAlpha=alpha*.85;
          if(i%3===0)terrain.crack(c,x,y,seed,progress,effectTime);
          else if(i%3===1){terrain.bone(c,x,y,seed);if(i>2)terrain.skull(c,x+10,y-2);}
          else terrain.wreck(c,x,y,seed);
        }
      }
      c.restore();
    }
    c.restore();
  }
  const api={TOP,BOTTOM,GAP,RACE_SCALE,grounds,draw,load};
  if(typeof module!=='undefined')module.exports=api;else root.FoolBridge=api;
})(globalThis);
