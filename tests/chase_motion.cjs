'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bridge=require('../assets/hell-bridge.js');
const root={FoolBridge:bridge,matchMedia:()=>({matches:false})};
const source=fs.readFileSync('assets/hell-race.js','utf8').replace(
 'root.FoolHellRace = { createStage, vehiclePreview };',
 'root.MotionReview={walkSample,devilPosition,STRIDE_DISTANCE};');
vm.runInNewContext(source,{window:root});
const {walkSample,devilPosition,STRIDE_DISTANCE}=root.MotionReview;
assert.equal(bridge.distance(2)-bridge.distance(1),bridge.SPEED);
for(let cycle=0;cycle<5;cycle++){
 for(let frame=0;frame<4;frame++){
  const roadPixels=(cycle+frame/4)*STRIDE_DISTANCE;
  const sample=walkSample(roadPixels/bridge.SPEED);
  assert.equal(sample.frame,frame,'Quarter stride must advance one walking frame');
  assert.equal(sample.steps,cycle*2+Math.floor(frame/2),'Footfalls follow half-strides');
  assert.equal(sample.distance,roadPixels);
 }
}
const t=STRIDE_DISTANCE/bridge.SPEED;
assert.equal(walkSample(t).steps,2,'One cycle has two footfalls');
assert.equal(walkSample(10).stepsPerSecond,bridge.SPEED*2/STRIDE_DISTANCE);
const old=root.FoolBridge;
root.FoolBridge={SPEED:96,distance:time=>time*96};
assert.equal(walkSample(.25).frame,1);
assert.equal(walkSample(t/2).steps,2,'Twice the road speed halves gait duration');
root.FoolBridge=old;
for(const t of [0,15,100]){
 const ys=Array.from({length:8},(_,i)=>devilPosition(i,512,t).y).sort((a,b)=>a-b);
 assert(ys[7]-ys[0]>115,'Devils span the sky vertically');
 for(let i=1;i<8;i++)assert(ys[i]-ys[i-1]>13,'Vertical bands remain distinct');
}
assert(!/chaseAction|paintChaseDemon|prepareChasePoses|poseBuffer/.test(source),'Obsolete pursuit actions and crossfades must be removed');
console.log('PASS: distance-driven walking frames and footfalls, speed scaling, fixed gait only and eight sky levels');
