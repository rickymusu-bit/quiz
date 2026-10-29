'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../assets/hell-chase.js'),M=require('../assets/hell-motion.js');
const near=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const K=require('../assets/hell-cerbero.js'),metrics=K.metrics();
function fixture(winner=0,consumed=[]){const state={winner,respondent:2,groups:[0,1,2].map(i=>({out:consumed.includes(i)}))},entry={time:10,camera:{distance:200,speed:48},demon:{...M.CHASE,runWeight:1,pose:C.pose(0)},positions:[0,1,2].map(i=>({index:i,row:i,x:[410,350,290][i],ground:270+i*25,width:[27,36,25][i],height:[25,23,30][i]}))};const p=C.plan(state,consumed,[],entry);return {state,entry,p,route:C.prepare(p,entry,metrics)};}
test('All actors retain their lanes while the hunter captures without resurrected actors',()=>{
 const {state,entry,p,route}=fixture();const before=JSON.stringify(state);assert.deepEqual(p.victims,[2,1]);
 const first=C.frame(route,0);first.positions.forEach((v,i)=>{near(v.x,entry.positions[i].x);near(v.ground,entry.positions[i].ground);});near(first.demon.left,entry.demon.left);near(first.camera.distance,entry.camera.distance);
 const line=C.frame(route,p.lineupEnd);line.positions.forEach((v,i)=>near(v.ground,entry.positions[i].ground));assert(line.positions[0].x>line.positions[1].x&&line.positions[1].x>line.positions[2].x);
 const one=fixture(0,[2]);assert.deepEqual(one.p.victims,[1]);for(let t=0;t<one.p.duration;t+=.05)assert.equal(C.frame(one.route,t).positions[2].visible,false);
 const zero=fixture(0,[1,2]);assert.equal(zero.p.victims.length,0);assert.equal(C.sample(zero.p,zero.p.captureEnd+.1).phase,'winner-chase');
 for(let t=0;t<p.duration;t+=.01)C.frame(route,t);assert.equal(JSON.stringify(state),before);
});
test('A canine mouth grips the rigid car, throws it across the parapet and submerges it',()=>{
 const {route}=fixture(),r=route.routes[0];
 const contact=C.captureFrame(r,C.T.bite);near(contact.positions[r.index].x,r.victim.x);near(contact.positions[r.index].ground,r.victim.ground);near(contact.positions[r.index].rotation,0);
 for(let t=C.T.bite;t<C.T.release;t+=.01){const f=C.captureFrame(r,t),v=f.positions[r.index],mouth=f.anchors.mouths.right;assert(f.attached);assert.equal(f.anchors.hand,undefined);
  near(v.x-Math.cos(v.rotation)*v.width*.35,mouth.x);near(v.ground-v.height/2-Math.sin(v.rotation)*v.width*.35,mouth.y);
  near(v.width,r.victim.width);near(v.height,r.victim.height);assert(v.visible);assert.equal(v.clip,undefined);}
 const released=C.captureFrame(r,C.T.release);assert(released.airborne&&!released.attached);assert.equal(released.positions[r.index].clipWater,false);
 const impact=C.captureFrame(r,C.T.impact);assert(impact.sinking);near(impact.lavaImpact.age,0);assert(impact.positions[r.index].foreground&&impact.positions[r.index].clipWater);
 assert.equal(C.captureFrame(r,C.T.hidden).positions[r.index].visible,false);
});
test('Hunter advances throughout the capture; recovery and camera never reverse world travel',()=>{
 for(const winner of [0,null]){
  const {route,p}=fixture(winner);let previous=C.frame(route,0);
  for(let t=.001;t<=p.chaseEnd;t+=.001){const f=C.frame(route,t);assert(f.demon.worldDistance>=previous.demon.worldDistance-1e-6,'Demon must not moonwalk');assert(f.camera.distance>=previous.camera.distance-1e-6);previous=f;}
  const r=route.routes[0],a=C.captureFrame(r,C.T.bite),b=C.captureFrame(r,C.T.recover);assert(b.demon.worldDistance>a.demon.worldDistance);assert(b.camera.distance>a.camera.distance);
  for(const boundary of [C.T.bite,C.T.lift,C.T.release,C.T.impact,C.T.hidden,C.T.recover,C.T.capture]){
   const a=C.captureFrame(r,boundary-1e-7),b=C.captureFrame(r,boundary);near(a.demon.left,b.demon.left,.001);near(a.demon.ground,b.demon.ground,.001);near(a.camera.distance,b.camera.distance,.001);
  }
 }
});
test('The winner is never bitten and the final pursuit closes to a visible gap before escape',()=>{
 const {route,p}=fixture();const a=C.frame(route,p.captureEnd),b=C.frame(route,p.chaseEnd);
 const gap=f=>f.positions[p.winner].x-f.positions[p.winner].width/2-f.demon.left-f.demon.width;
 assert(gap(a)>gap(b));near(gap(b),6);
 for(let t=0;t<p.duration;t+=.01){const f=C.frame(route,t);assert.notEqual(f.victim,p.winner);if(['winner-chase','rise','escape'].includes(f.phase))assert(gap(f)>=6-1e-7);}
 for(const boundary of [p.lineupEnd,p.lineupEnd+C.T.capture,p.captureEnd,p.chaseEnd,p.chaseEnd+2.2]){const a=C.frame(route,boundary-1e-7),b=C.frame(route,boundary);near(a.demon.left,b.demon.left,.001);near(a.camera.distance,b.camera.distance,.001);}
});
test('One ordinary capture preserves bystanders and returns to the exact chase geometry without rewinding the camera',()=>{
 const {entry}=fixture();for(const index of [0,1,2]){const r=C.captureRoute(entry,index,metrics),end=C.captureFrame(r,C.T.capture);near(end.demon.left,M.CHASE.left);near(end.demon.ground,M.CHASE.ground);near(end.camera.speed,48);near(end.demon.runWeight,1);
  for(let t=0;t<C.T.capture;t+=.01){const f=C.captureFrame(r,t);for(const v of f.positions)if(v.index!==index){near(v.x,entry.positions[v.index].x);near(v.ground,entry.positions[v.index].ground);}}
 }
});
test('Gait and trajectories use distance at 30/60/144 FPS; footfall tracking stays bounded and freezes',()=>{
 const {route,p}=fixture();const result=[];
 for(const fps of [30,60,144]){const tracker=new M.ContactTracker();for(let i=0;i<=Math.round(p.chaseEnd*fps);i++){const t=i/fps,f=C.frame(route,t);tracker.sample(f.time,f.demon.worldDistance);}const f=C.frame(route,p.chaseEnd);const sample=tracker.sample(f.time,f.demon.worldDistance);result.push(sample);assert(sample.footfalls.length<=7);const frozen=JSON.stringify(tracker.sample(f.time,f.demon.worldDistance));assert.equal(JSON.stringify(tracker.sample(f.time,f.demon.worldDistance)),frozen);}
 result.forEach(s=>near(s.gait.cycle,result[0].gait.cycle));
});
