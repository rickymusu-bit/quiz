'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {loadImage}=require('@napi-rs/canvas');
const motion=require('../assets/hell-motion.js');
const root={FoolLayout:require('../assets/hell-layout.js'),FoolMotion:motion,matchMedia:()=>({matches:false})};
const source=fs.readFileSync('assets/hell-race.js','utf8').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { devilFrame, devilPosition, flightPeriod };');
vm.runInNewContext(source,{window:root,document:{}});
const {devilFrame,devilPosition,flightPeriod}=root.FoolHellRace;
test('Approved atlas has eight whole frames and the GIF ping-pong timing',async()=>{
 const image=await loadImage('assets/hell-race/diavolo-flight-v1.webp');
 assert.equal(image.width,8*420);assert.equal(image.height,560);
 const metadata=JSON.parse(fs.readFileSync('assets/hell-race/diavolo-flight-v1.json'));
 let time=0;
 metadata.sequence.forEach((pose,i)=>{
  assert.equal(devilFrame((time+metadata.durationMs[i]/2)/1000),pose);
  time+=metadata.durationMs[i];
 });
 assert.equal(flightPeriod,time);assert.equal(devilFrame(time/1000),0);
 assert.equal(devilFrame(100000+0.04),devilFrame((100000+0.04)%(time/1000)));
});
test('Camera overtakes slower flyers in both world directions; depth scales displacement',()=>{
 const directions=new Set(),sizes=new Set();
 for(let i=0;i<8;i++){
  const a=devilPosition(i,768,0,0),b=devilPosition(i,768,1,motion.ROAD_SPEED);
  assert(Math.abs(a.velocity)<motion.ROAD_SPEED);
  directions.add(a.direction);sizes.add(a.width);
  const expected=(a.velocity-motion.ROAD_SPEED)*a.depth;
  const span=768+140,delta=((b.x-a.x+span/2)%span+span)%span-span/2;
  assert(Math.abs(delta-expected)<1e-9);assert(delta<0);
  assert.equal(a.direction,Math.sign(a.velocity));
  const shifted=devilPosition(i,768,0,10);
  assert(Math.abs(shifted.x-a.x+10*a.depth)<1e-9,'Use actual camera displacement');
  assert.deepEqual(devilPosition(i,768,1,48),devilPosition(i,768,1,48),'A frozen clock preserves flight');
 }
 assert.equal(directions.size,2);assert.equal(sizes.size,4);
});
