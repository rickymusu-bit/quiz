'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../assets/hell-chase.js'),F=require('../assets/hell-epilogue.js'),B=require('../assets/hell-bridge.js'),P=require('../assets/hell-portal.js');
const near=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
function fixture(width=36,ground=300){
 const e={time:8,camera:{distance:170,speed:80},demon:{left:410-width/2-221-6,width:221,ground:303,pose:C.pose(8),runWeight:1},positions:[{index:0,row:0,x:410,width,height:32,ground}]};
 return F.prepare(e,0);
}
test('Portal occupies a single lane in its shared transverse projection and stays anchored to the world',()=>{
 assert(F.GATE.near-F.GATE.far<B.DEPTH);assert(F.GATE.openingNear-F.GATE.openingFar<40);
 const a=B.project(900,72,0,{distance:200}),b=B.project(900,72,0,{distance:235});near(a.x-b.x,35);near(a.y,b.y);
 near(B.worldX(a.x,72,{distance:200}),900);
 const far=B.project(900,F.GATE.far,0,{distance:200}),last=B.project(900,F.GATE.near,0,{distance:200});
 near((last.x-far.x)/(last.y-far.y),B.SHEAR);
});
test('All six full-size silhouettes cross one plane; no fade, scale, turn or premature sinking',()=>{
 for(const width of [27.28,35.96,38.44,33.48,34.72,24.8,50]){
  const route=fixture(width);let prev=F.frame(route,0);
  for(let t=0;t<=F.T.duration;t+=.01){
   const f=F.frame(route,t),v=f.positions[0];near(v.width,width);near(v.height,32);near(v.ground,300);
   assert(v.worldX>=prev.positions[0].worldX-1e-7);assert(f.camera.distance>=prev.camera.distance-1e-7);
   near(v.clipRight,B.project(route.gateX,route.depth,0,f.camera).x);
   assert(!('opacity' in v));assert(!v.rotation);
   if(f.portal.sink>0||f.bridge.collapse>0)assert(f.cleared,'Entire vehicle must clear the rear of the structure before sinking');
   if(v.visible)assert(v.x-v.width/2<v.clipRight+1e-7);
   if(t<F.T.openEnd)assert(v.visible,'The winner cannot disappear before the doorway is open');
   prev=f;
  }
 }
});
test('Architecture keeps its proportions during both vertical movements; complete framing at full emergence',()=>{
 const r=fixture(),a=F.frame(r,F.T.riseEnd),b=F.frame(r,F.T.closeEnd+.7);
 const model=[[0,F.GATE.far,0],[0,F.GATE.near,0],[0,F.GATE.near,150],[0,F.GATE.far,150]];
 const pa=P.vertices(a.portal,model),pb=P.vertices({...b.portal,offset:0},model);
 near(pa[1].x-pa[0].x,pb[1].x-pb[0].x);near(pa[0].y-pa[3].y,150);
 const full=P.vertices(a.portal,[[0,F.GATE.far,204],[F.GATE.thickness,F.GATE.near,204],[F.GATE.thickness,F.GATE.near,-16],[0,F.GATE.far,-16]]);
 for(const p of full)assert(p.x>=0&&p.x<=512&&p.y>=0&&p.y<=384,JSON.stringify(p));
});
test('Water clipping occurs in world height, including the extruded foundations',()=>{
 const clipped=P.aboveWater([{x:0,depth:20,z:10},{x:16,depth:20,z:10},{x:16,depth:20,z:-30},{x:0,depth:20,z:-30}],-16);
 assert.equal(clipped.length,4);assert(clipped.every(v=>v.z>=-16));assert.equal(clipped.filter(v=>v.z===-16).length,2);
});
test('Impact grooves the deck; the architecture collapses after passage and leaves permanent rubble',()=>{
 const r=fixture();assert.equal(F.frame(r,F.IMPACT-.01).bridge.damage,0);assert(F.frame(r,F.IMPACT+.2).bridge.damage>0);
 assert(F.portalAt(0).offset<0);near(F.portalAt(F.IMPACT).offset,0);
 for(let t=F.IMPACT;t<F.T.escapeEnd;t+=.01)assert.equal(F.frame(r,t).bridge.collapse,0);
 const end=F.frame(r,F.T.duration);assert.equal(end.bridge.damage,1);assert.equal(end.bridge.collapse,1);assert.equal(end.portal.visible,false);
});
test('The old roar is replaced by planted fists, one flame and exhaustion before the title',()=>{
 const r=fixture(),order=[];
 for(let t=0;t<F.T.duration;t+=.01){const f=F.frame(r,t);if(order.at(-1)!==f.phase)order.push(f.phase);if(f.phase==='rage')assert(!f.portal.visible);}
 assert.deepEqual(order,['descent','open','escape','close','collapse','rage','fire','exhausted']);
 for(const t of [.46,1.46,2.46]){const f=F.frame(r,F.T.sinkEnd+t);assert(f.impact>.99);near(f.demon.ground,303);}
 const fire=F.frame(r,F.T.rageEnd+.8);assert(fire.fireAge>0);assert(fire.demon.runWeight>0);
 const done=F.frame(r,F.T.duration);assert.equal(done.phase,'done');assert.equal(done.fireAge,null);assert(done.demon.runWeight>0);
});
test('Sampling preserves the incoming state and is independent of frame rate, pause and seeking',()=>{
 const r=fixture(),before=JSON.stringify(r);const reference=F.frame(r,F.T.escapeEnd);
 for(const fps of [30,60,144]){for(let t=0;t<F.T.escapeEnd;t+=1/fps)F.frame(r,t);assert.deepEqual(F.frame(r,F.T.escapeEnd),reference);}
 assert.equal(JSON.stringify(r),before);assert.deepEqual(F.frame(r,4),F.frame(r,4));
});
test('Game Over never acquires a portal or a damaged bridge',()=>{
 const state={winner:null,respondent:2,groups:[{out:true},{out:true},{out:true}]},p=C.plan(state,[0,1],[2]),r=C.prepare(p,C.defaultEntry(state));
 for(let t=0;t<=p.duration;t+=.01){const f=C.frame(r,t);assert.equal(f.portal,undefined);assert.equal(f.bridge,undefined);}
});
test('The environment continues after the verdict; rubble and grooves remain in world coordinates',()=>{
 const r=fixture(),a=F.frame(r,F.T.duration),b=F.frame(r,F.T.duration+2);
 assert(b.camera.distance>a.camera.distance);assert.equal(b.bridge.anchorX,a.bridge.anchorX);
 assert.equal(b.bridge.damage,1);assert(b.bridge.rubble);assert(!b.portal.visible);
 assert(b.demon.left+b.camera.distance+b.demon.width<r.gateX);
});
test('Seeded roadway features preserve their world positions as the camera advances',()=>{
 const a=B.features(0,512),b=B.features(48,512),byId=new Map(a.map(f=>[f.id,f]));
 for(const f of b)if(byId.has(f.id))assert.deepEqual(f,byId.get(f.id));
 assert.deepEqual(a,B.features(0,512));assert(a.some(f=>f.kind===0));
});
