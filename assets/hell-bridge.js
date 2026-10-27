/* Narrow suspension deck. Geometry is shared by the race and its layout tests. */
(function(root){
  'use strict';
  const TOP=208,BOTTOM=338,GAP=4,RACE_SCALE=.62;
  const TOP_MARGIN=4,BOTTOM_MARGIN=18;
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
    const available=BOTTOM-BOTTOM_MARGIN-(TOP+TOP_MARGIN);
    let y=TOP+TOP_MARGIN+(available-occupied)/2;
    return heights.map(h=>{y+=h;const ground=y;y+=GAP;return ground;});
  }
  const PIER_SPAN = 144;
  function pillars(c, width, time, image) {
    const offset = time * 48;
    c.save();
    for (let index = Math.floor(offset / PIER_SPAN) - 1;
         index <= Math.floor((offset + width) / PIER_SPAN) + 1; index++) {
      const x = index * PIER_SPAN - offset, y = BOTTOM + 7;
      const gradient = c.createLinearGradient(x - 20, 0, x + 20, 0);
      gradient.addColorStop(0, '#161310'); gradient.addColorStop(.35, '#665644');
      gradient.addColorStop(.7, '#41382e'); gradient.addColorStop(1, '#161210');
      c.fillStyle = gradient;
      c.beginPath(); c.moveTo(x - 25, y); c.lineTo(x + 25, y);
      c.lineTo(x + 14, y + 18); c.lineTo(x + 12, 430);
      c.lineTo(x - 14, 430); c.lineTo(x - 16, y + 18); c.closePath(); c.fill();
      // Masonry continues below the screen into the lake, with corroded braces.
      c.save(); c.clip();
      if (image?.complete && image.naturalWidth) {
        c.globalAlpha = .4;
        c.drawImage(image, image.naturalWidth * .12, image.naturalHeight * .5,
          image.naturalWidth * .08, image.naturalHeight * .32, x - 25, y, 50, 85);
        c.globalAlpha = 1;
      }
      c.strokeStyle = '#1a1511'; c.lineWidth = 1;
      for (let row = 0; row < 8; row++) {
        const by = y + 6 + row * 11;
        c.beginPath(); c.moveTo(x - 25, by); c.lineTo(x + 25, by); c.stroke();
        c.beginPath(); c.moveTo(x + (row % 2 ? -5 : 6), by);
        c.lineTo(x + (row % 2 ? -5 : 6), by + 11); c.stroke();
      }
      c.fillStyle = '#a66a38'; c.fillRect(x - 12, y + 12, 2, 78);
      c.fillStyle = '#211914'; c.fillRect(x + 9, y + 12, 3, 78);
      c.restore();
    }
    c.restore();
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
    pillars(c,width,time,image);
    if(image?.complete&&image.naturalWidth){
      const tile=768,offset=(time*48)%tile,s=image.naturalHeight/672;
      for(let x=-offset;x<width;x+=tile){
        // Keep the deck and masonry fascia; neither edge has a railing.
        for(const [sy,sh,dy,dh] of [[214,123,TOP,BOTTOM-TOP],[337,260,BOTTOM,20]])
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
  const api={TOP,BOTTOM,GAP,RACE_SCALE,grounds,draw,load,TOP_MARGIN,BOTTOM_MARGIN};
  if(typeof module!=='undefined')module.exports=api;else root.FoolBridge=api;
})(globalThis);
