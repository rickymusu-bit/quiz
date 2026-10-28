'use strict';
const assert = require('node:assert/strict');
const {Clock, ROAD_SPEED, STRIDE, gait, roadTarget} = require('../assets/hell-motion.js');
const near = (a,b,tolerance=1e-7) => assert(Math.abs(a-b)<tolerance, `${a} ≠ ${b}`);
function journey(fps) {
  const clock = new Clock(); clock.rebase(0);
  const samples = [];
  for (let second=0;second<5;second++) {
    const target = [48,19.2,60,0,48][second];
    for(let f=1;f<=fps;f++) clock.advance((second+f/fps)*1000,{target});
    samples.push(clock.snapshot());
  }
  return samples;
}
const reference = journey(60);
for (const fps of [30,144]) journey(fps).forEach((sample,i)=>{
  for (const key of ['time','distance','speed']) near(sample[key],reference[i][key]);
  near(sample.gait.cycle,reference[i].gait.cycle);
  assert.deepEqual(sample.footfalls.map(e=>e.index),reference[i].footfalls.map(e=>e.index));
  sample.footfalls.forEach((e,j)=>near(e.at,reference[i].footfalls[j].at,1e-6));
});
const c=new Clock(); c.rebase(0);c.advance(100);const before=c.snapshot();
for(const options of [{blocked:true},{reduced:true},{}]) {
  c.advance(c.last+10000,options);assert.deepEqual(c.snapshot(),before,'Pause, reduced motion and abnormal gaps freeze travel');
}
c.advance(c.last+100);near(c.time,.2);near(c.distance,ROAD_SPEED*.2);
const travel=c.distance;const t=c.time;near(c.advance(c.last+100,{reduced:true}),.1);near(c.time,t+.1);near(c.distance,travel);
const active=c.time;c.rebase(c.last+60000);c.advance(c.last+100);near(c.time,active+.1);near(c.distance,travel+ROAD_SPEED*.1);
assert.equal(gait(0).frame,gait(STRIDE).frame);
near(gait(STRIDE/8).mix,.5);assert.equal(gait(STRIDE/4).frame,gait(0).next);
assert(roadTarget(false,'capture')<roadTarget(false,'race'));
assert(roadTarget(true,'escape')>roadTarget(false,'race'));assert.equal(roadTarget(true,'rage'),0);
console.log('PASS: distance, gait, acceleration and exact footfalls agree at 30/60/144 FPS; pause/long gaps freeze; reduced motion freezes travel while notices expire');
