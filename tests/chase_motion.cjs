'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root={matchMedia:()=>({matches:false})};
const source=fs.readFileSync('assets/hell-race.js','utf8').replace(
 'root.FoolHellRace = { createStage, vehiclePreview };',
 'root.MotionReview={demonMotion,devilPosition};');
vm.runInNewContext(source,{window:root});
const {demonMotion,devilPosition}=root.MotionReview;
for(let cycle=0;cycle<4;cycle++){
 for(const age of [0,.65,1.15,2.7,3.5,4.8]){
  const t=cycle*18+7+age,a=demonMotion(t-.0001),b=demonMotion(t+.0001);
  for(const key of ['settle','attack','lunge','closed'])
   assert(Math.abs(a[key]-b[key])<.002,'Motion stays continuous at '+t+' / '+key);
 }
}
assert.equal(demonMotion(8.9).mode,'reach');assert.equal(demonMotion(26.9).mode,'fire');
assert(demonMotion(2.5).closed>.99,'Mouth closes during normal pursuit');
assert.equal(demonMotion(26.9,true).mode,'chase');
for(let t=0;t<72;t+=.07){const pose=demonMotion(t);for(const key of ['settle','attack','lunge','closed'])assert(pose[key]>=0&&pose[key]<=1);}
for(const t of [0,15,100]){
 const ys=Array.from({length:8},(_,i)=>devilPosition(i,512,t).y).sort((a,b)=>a-b);
 assert(ys[7]-ys[0]>115,'Devils span the sky vertically');
 for(let i=1;i<8;i++)assert(ys[i]-ys[i-1]>13,'Vertical bands remain distinct');
}
console.log('PASS: continuous chase/wind-up/attack/recovery, closing mouth, reduced motion and eight sky levels');
