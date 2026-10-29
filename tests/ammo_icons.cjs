'use strict';
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const F=require('../assets/js/core.js'),root=path.join(__dirname,'..');
const cells={salta:[0,0],ruba:[0,2],svela:[1,1],aura:[0,1],karma:[2,1],marx:[1,2],ira:[2,2]};
(async()=>{
 const atlas=await loadImage(path.join(root,'assets/hell-race/ammo-relics-v1.webp'));
 const sacrifice=await loadImage(path.join(root,'assets/hell-race/sacrificio-v1.png'));
 const anti=await loadImage(path.join(root,'assets/hell-race/antisigillo-icon-v1.png'));
 assert(atlas.width/3>=400&&atlas.height/3>=390,'Native icon cells support 88px at DPR 3');
 const css=fs.readFileSync(path.join(root,'assets/css/game.css'),'utf8'),signatures=new Set();
 const out=createCanvas(1152,256),c=out.getContext('2d');c.fillStyle='#111015';c.fillRect(0,0,1024,256);
 c.font='bold 24px monospace';c.fillStyle='#dfc59a';c.fillText('HELLSCAPE / NOVE ARTEFATTI',24,38);
 for(let i=0;i<F.TYPES.length;i++){
  const type=F.TYPES[i],sample=createCanvas(48,48),ctx=sample.getContext('2d');ctx.imageSmoothingEnabled=true;
  assert(css.includes('[data-ammo="'+type+'"]'));
  if(type==='sacrificio')ctx.drawImage(sacrifice,0,0,48,48);
  else if(type==='antisigillo')ctx.drawImage(anti,0,0,48,48);
  else{const [col,row]=cells[type];ctx.drawImage(atlas,col*atlas.width/3,row*atlas.height/3,atlas.width/3,atlas.height/3,0,0,48,48);}
  const pixels=ctx.getImageData(0,0,48,48).data;assert(pixels.some((v,n)=>n%4===3&&v>100),'Visible artifact: '+type);
  signatures.add(crypto.createHash('sha256').update(pixels).digest('hex'));c.drawImage(sample,16+i*126,75,96,96);
  c.font='bold 12px monospace';c.fillStyle='#dfc59a';c.fillText(F.LABELS[type],16+i*126,200,120);
 }
 assert.equal(signatures.size,9);fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/hellscape-ammo-icons.png'),out.toBuffer('image/png'));
 console.log('PASS: nine distinct 48px artifacts, native 400px+ relic cells and illustrated Antisigillo');
})().catch(e=>{console.error(e);process.exitCode=1});
