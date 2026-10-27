'use strict';
// Seven independent, real pixel sprites from the same atlas used by the game.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const types=['Catene','Tributo','Malocchio','Sigillo','Contrappasso','Livella','Flagello'];
const info=['Salta un turno','Condivide punti','Passa una domanda','Blocca attacchi','Ritorce un malus','Pareggia i punti','Toglie una vita a tutti'];
(async()=>{
 const img=await loadImage(path.join(root,'assets/ammo-hellscape-v2.png'));
 assert.equal(img.width,336,'Seven 48px sprites in one horizontal atlas');
 assert.equal(img.height,48);
 const signatures=new Set();
 for(let i=0;i<7;i++){
  const sample=createCanvas(48,48),ctx=sample.getContext('2d');
  ctx.drawImage(img,i*48,0,48,48,0,0,48,48);
  const pixels=ctx.getImageData(0,0,48,48).data;
  signatures.add(crypto.createHash('sha256').update(pixels).digest('hex'));
  assert(pixels.some((v,n)=>n%4===0&&v>100),'Sprite must have visible foreground: '+types[i]);
 }
 assert.equal(signatures.size,7,'All seven ammo icons must be distinct');
 const out=createCanvas(1024,246),c=out.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#111015';c.fillRect(0,0,out.width,out.height);
 c.fillStyle='#ffaf64';c.font='bold 25px monospace';c.fillText('HELLSCAPE 3.6.0  /  LE AMMO DELL\'INFERNO',24,38);
 c.font='14px monospace';c.fillStyle='#bdb4a9';c.fillText('Le sette icone effettivamente usate nel gioco',24,64);
 for(let i=0;i<7;i++){
  const x=14+i*144;
  c.fillStyle='#21191a';c.fillRect(x,82,138,148);
  c.strokeStyle='#6d3832';c.strokeRect(x+.5,82.5,137,147);
  c.drawImage(img,24*i,0,24,24,x+21,95,96,96);
  c.fillStyle='#ff9865';c.font='bold 13px monospace';c.textAlign='center';c.fillText(types[i].toUpperCase(),x+69,205);
  c.font='10px monospace';c.fillStyle='#f0d9bc';c.fillText(info[i],x+69,221);
 }
 c.textAlign='left';fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
 fs.writeFileSync(path.join(root,'artifacts/hellscape-ammo-icons.png'),out.toBuffer('image/png'));
 console.log('PASS: 7 unique 48x48 infernal icons and matching preview screenshot');
})().catch(e=>{console.error(e);process.exitCode=1});
