'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../assets/hell-ammo.js');
const source={x:305,y:246,width:54,height:44},target={x:375,y:283,width:72,height:70};
test('Antisigillo has one protected target and enough time for contact and fracture',()=>{
 const state={groups:[{out:false},{out:false},{out:false}]};
 const plans=A.plans([{id:'anti',activation:'anti',copy:{type:'antisigillo'},source:0,target:1},{type:'seal-dispelled',source:0,target:1}],state);
 assert.equal(plans.length,1);assert.deepEqual(plans[0].targets,[1]);assert.equal(plans[0].blocked,false);assert.equal(plans[0].duration,2.6);
});
test('The wedge reaches the seal before separating it; the protection disappears after the fracture',()=>{
 const before=JSON.stringify({source,target});
 assert.deepEqual([.05,.25,.44,.65,.95].map(t=>A.antisigilloFrame(t,source,target).phase),['protected','approach','contact','fracture','dissipated']);
 const contact=A.antisigilloFrame(A.ANTI.contact,source,target);
 assert.deepEqual(contact.toolTip,contact.contact);assert.equal(contact.separation,0);
 let separation=0;
 for(let t=0;t<=1;t+=.005){
  const f=A.antisigilloFrame(t,source,target);assert(f.separation>=separation);separation=f.separation;
  if(t<A.ANTI.break)assert.equal(f.fracture,0);
  assert(f.leftAngle<=0&&f.rightAngle>=0);assert(f.toolTip.y-A.ANTI.tip.y*f.toolSize>0,'Tool remains in the scene');
 }
 const done=A.antisigilloFrame(.95,source,target);assert.equal(done.protectionAlpha,0);assert.equal(done.toolAlpha,0);
 assert.equal(JSON.stringify({source,target}),before);
});
test('The trajectory is sampled from time and does not change with frame rate or pause',()=>{
 const expected=A.antisigilloFrame(.61,source,target);
 for(const fps of [30,60,144]){
  for(let t=0;t<.61;t+=1/fps)A.antisigilloFrame(t,source,target);
  assert.deepEqual(A.antisigilloFrame(.61,source,target),expected);
 }
});
test('Native icon and rigid tool render deterministically; reduced motion is static and canvas state is restored',async()=>{
 const {loadImage,createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
 const root={__art:await loadImage('assets/hell-race/ammo-relics-v1.webp'),__icon:await loadImage(A.ANTI_ASSETS.icon),__tool:await loadImage(A.ANTI_ASSETS.tool)};
 assert(root.__icon.width>=1000&&root.__tool.width>=1000);
 const code=fs.readFileSync('assets/hell-ammo.js','utf8').replace('let art = null, antiArt = null, antiTool = null;','let art = root.__art, antiArt = root.__icon, antiTool = root.__tool;');
 vm.runInNewContext(code,root);
 const state={groups:[{name:'Fonte'},{name:'Bersaglio'},{name:'Terzo'}]},plan={type:'antisigillo',source:0,targets:[1]},positions=[source,target,{x:350,y:320,width:50,height:44}];
 const original=JSON.stringify({state,plan,positions});
 function paint(t,reduced=false){
  const canvas=createCanvas(768,576),ctx=canvas.getContext('2d');ctx.globalAlpha=.73;const alpha=ctx.globalAlpha;
  root.FoolAmmo.render(ctx,768,state,plan,t,positions,reduced);
  assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.getTransform().a,1);assert.equal(ctx.getTransform().e,0);
  return crypto.createHash('sha256').update(ctx.getImageData(0,0,768,576).data).digest('hex');
 }
 assert.equal(new Set([.08,.3,.45,.64,.95].map(t=>paint(t))).size,5);
 assert.equal(paint(.2,true),paint(.85,true));assert.equal(JSON.stringify({state,plan,positions}),original);
});
