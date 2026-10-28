'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../assets/hell-chase.js'),M=require('../assets/hell-motion.js');
const near=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const metrics=Array.from({length:16},(_,i)=>({height:.6,hand:{x:[.92,.88,.85,.83,.78][Math.min(i,4)],y:[.5,.5,.4,.3,.27][Math.min(i,4)]},mouth:{x:.74,y:.28}}));
function fixture(winner=0,consumed=[]){const state={winner,respondent:2,groups:[0,1,2].map(i=>({out:consumed.includes(i)}))},entry={time:10,camera:{distance:200,speed:48},demon:{...M.CHASE,runWeight:1,pose:C.pose(0)},positions:[0,1,2].map(i=>({index:i,row:i,x:[410,350,290][i],ground:270+i*25,width:[27,36,25][i],height:[25,23,30][i]}))};const p=C.plan(state,consumed,[],entry);return {state,entry,p,route:C.prepare(p,entry,metrics)};}
test('Winner leads the single file; actual rearmost remaining loser is first, with no resurrected actors',()=>{
 const {state,entry,p,route}=fixture();const before=JSON.stringify(state);assert.deepEqual(p.victims,[2,1]);
 const first=C.frame(route,0);first.positions.forEach((v,i)=>{near(v.x,entry.positions[i].x);near(v.ground,entry.positions[i].ground);});near(first.demon.left,entry.demon.left);near(first.camera.distance,entry.camera.distance);
 const line=C.frame(route,p.lineupEnd);near(line.positions[0].ground,line.positions[1].ground);near(line.positions[1].ground,line.positions[2].ground);assert(line.positions[0].x>line.positions[1].x&&line.positions[1].x>line.positions[2].x);
 const one=fixture(0,[2]);assert.deepEqual(one.p.victims,[1]);for(let t=0;t<one.p.duration;t+=.05)assert.equal(C.frame(one.route,t).positions[2].visible,false);
 const zero=fixture(0,[1,2]);assert.equal(zero.p.victims.length,0);assert.equal(C.sample(zero.p,zero.p.captureEnd+.1).phase,'winner-chase');
 for(let t=0;t<p.duration;t+=.01)C.frame(route,t);assert.equal(JSON.stringify(state),before);
});
test('Grip matches the actual hand, feeding reaches the mouth before geometric occlusion hides the vehicle',()=>{
 const {route}=fixture(),r=route.routes[0];
 const contact=C.captureFrame(r,C.T.grip);near(contact.positions[r.index].x,r.victim.x);near(contact.positions[r.index].ground,r.victim.ground);
 for(let t=C.T.grip;t<C.T.mouth;t+=.01){const f=C.captureFrame(r,t),v=f.positions[r.index];near(v.x,f.anchors.hand.x);near(v.ground-v.height/2,f.anchors.hand.y);assert(v.visible);assert.equal(v.clip,undefined);}
 const mouth=C.captureFrame(r,C.T.swallow),v=mouth.positions[r.index];near(v.x-v.width/2,mouth.anchors.mouth.x);near(v.ground-v.height/2,mouth.anchors.mouth.y);
 const almost=C.captureFrame(r,C.T.hidden-.001);assert(almost.positions[r.index].x+v.width/2<almost.anchors.mouth.x+.01);
 assert.equal(C.captureFrame(r,C.T.hidden).positions[r.index].visible,false);
});
test('Feet plant in world coordinates while the bridge keeps moving; recovery and camera never reverse world travel',()=>{
 for(const winner of [0,null]){
  const {route,p}=fixture(winner);let previous=C.frame(route,0);
  for(let t=.001;t<=p.chaseEnd;t+=.001){const f=C.frame(route,t);assert(f.demon.worldDistance>=previous.demon.worldDistance-1e-6,'Demon must not moonwalk');assert(f.camera.distance>=previous.camera.distance-1e-6);previous=f;}
  const r=route.routes[0],a=C.captureFrame(r,C.T.grip),b=C.captureFrame(r,C.T.recover);near(a.demon.worldDistance,b.demon.worldDistance);assert(b.camera.distance>a.camera.distance);
  for(const boundary of [C.T.grip,C.T.lift,C.T.mouth,C.T.swallow,C.T.hidden,C.T.recover,C.T.capture]){
   const a=C.captureFrame(r,boundary-1e-7),b=C.captureFrame(r,boundary);near(a.demon.left,b.demon.left,.001);near(a.demon.ground,b.demon.ground,.001);near(a.camera.distance,b.camera.distance,.001);
  }
 }
});
test('The winner is never gripped and the final pursuit closes to a visible gap before escape',()=>{
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
