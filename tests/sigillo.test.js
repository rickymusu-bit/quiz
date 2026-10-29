'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js');
const bank=Array.from({length:60},(_,i)=>({id:'seal'+i,topic:'t',topicName:'T',body:'Q'+i,options:['A','B','C','D'],correct:0,explanation:'A',difficulty:'difficile'}));
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty:'misto',questionCount:33,quotas:{t:33},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});}
function item(g,type){const c={id:g.uid(),type,target:null,origin:'test'};g.s.groups[g.s.owner].inventory.push(c);return c;}
function answer(g,right=false){g.reveal();g.answer(right?g.s.current.correct:(g.s.current.correct+1)%4);}
function seal(g){g.use(item(g,'aura').id,null);}

test('An active Sigillo prevents every manual Ammo use, including a refresh, without consuming any copy',()=>{
 const g=game(),source=g.s.owner,target=g.s.order[1];seal(g);
 for(const type of F.TYPES){const c=item(g,type),before=F.clone(g.s.groups);assert.throws(()=>g.use(c.id,['salta','ruba','antisigillo'].includes(type)?target:null),/Sigillo attivo/);assert.deepEqual(g.s.groups,before);}
 assert.equal(g.s.events.filter(e=>e.activation).length,1);
});
test('A protected correct answer keeps all points but awards no Ammo and performs no random extraction',()=>{
 const g=game(),source=g.s.owner;g.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));seal(g);const spare=item(g,'sacrificio');let rolls=0;g.random=()=>{rolls++;return 0};
 answer(g,true);assert.equal(F.exact(g.s.groups[source].score),'300');assert.equal(g.s.result.ammoSuppressed,true);assert.deepEqual(g.s.result.bonuses,[]);assert.equal(g.s.result.bonus,null);
 assert.deepEqual(g.s.groups[source].inventory.map(c=>c.id),[spare.id]);assert.equal(rolls,0);F.Game.restore(g.snapshot());
});
test('Antisigillo removes both protection and restrictions immediately, restoring use and awards',()=>{
 const g=game(),[protectedPlayer,attacker]=g.s.order;seal(g);answer(g);g.next();g.use(item(g,'antisigillo').id,protectedPlayer);assert.equal(g.s.groups[protectedPlayer].aura,null);
 answer(g);g.next();answer(g);g.next();assert.equal(g.s.owner,protectedPlayer);
 g.use(item(g,'sacrificio').id,null);assert.equal(F.exact(g.s.groups[protectedPlayer].score),'777');
 g.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));answer(g,true);assert.equal(g.s.result.ammoSuppressed,false);assert.equal(g.s.result.bonuses.length,9);
});

test('Sigillo lasts exactly three personal turns including activation, with no reduction on others or a restored game',()=>{
 let g=game();const source=g.s.owner;seal(g);assert.equal(g.s.groups[source].aura,3);
 for(let personal=3;personal>=1;personal--){
  assert.equal(g.s.owner,source);assert.equal(g.s.groups[source].aura,personal);g=F.Game.restore(g.snapshot());assert.equal(g.s.groups[source].aura,personal);
  answer(g);g.next();assert.equal(g.s.groups[source].aura,personal);answer(g);g.next();assert.equal(g.s.groups[source].aura,personal);answer(g);g.next();
 }
 assert.equal(g.s.owner,source);assert.equal(g.s.groups[source].aura,null);g.use(item(g,'sacrificio').id,null);assert.equal(F.exact(g.s.groups[source].score),'777');F.Game.restore(g.snapshot());
});
test('Activation removes pending negative Ammo and blocks Catene, Tributo and Malocchio without reflecting them',()=>{
 const g=game(),[source,opponent]=g.s.order;g.s.groups[source].score=F.rational(1000);g.s.effects.push({id:g.uid(),type:'salta',source:opponent,target:source},{id:g.uid(),type:'ruba',source:opponent,target:source});
 seal(g);assert.equal(g.s.effects.length,0);const karma=item(g,'karma');
 for(const type of ['salta','ruba','svela']){assert.equal(g.attack(type,opponent,source,g.uid()),false);assert.equal(F.exact(g.s.groups[source].score),'1000');assert.equal(karma.type,'karma');}
 assert.equal(g.s.groups[source].aura,3);F.Game.restore(g.snapshot());
});
test('Livella excludes all protected scores from both redistribution and its cinematic target set',()=>{
 for(const points of [[101,900,202],[0,0,3]]){
  const g=game(),[source,protectedPlayer,third]=g.s.order;g.s.groups[source].score=F.rational(points[0],3);g.s.groups[protectedPlayer].score=F.rational(points[1]);g.s.groups[third].score=F.rational(points[2],3);g.s.groups[protectedPlayer].aura=3;
  const before=F.clone(g.s.groups[protectedPlayer]);g.use(item(g,'marx').id,null);const share=F.rational(points[0]+points[2],6);
  assert.deepEqual(g.s.groups[protectedPlayer],before);assert.deepEqual(g.s.groups[source].score,share);assert.deepEqual(g.s.groups[third].score,share);
  const plans=require('../assets/hell-ammo.js').plans(g.s.events,g.s),plan=plans.find(p=>p.type==='marx');assert.deepEqual(plan.targets,[source,third]);assert.equal(plan.blocked,false);F.Game.restore(g.snapshot());
 }
});
test('Flagello from an opponent ignores Sigillo, removes life/Ammo/points and retains the remaining protection',()=>{
 const g=game(),[protectedPlayer,opponent]=g.s.order;g.s.groups[protectedPlayer].score=F.rational(1000);seal(g);item(g,'karma');answer(g);g.next();g.use(item(g,'ira').id,null);
 assert.equal(g.s.groups[protectedPlayer].aura,3);assert.equal(F.remainingLives(g.s,protectedPlayer),2);assert.equal(F.exact(g.s.groups[protectedPlayer].score),'334');assert.equal(g.s.groups[protectedPlayer].inventory.length,0);F.Game.restore(g.snapshot());
});
test('A shielded legacy Malocchio recipient is immune to another author’s penalty, but self-imposed risk still applies',()=>{
 for(const self of [false,true]){
  const g=game(),[source,,target]=g.s.order;const c=item(g,'svela');g.use(c.id,null);g.pass(self?source:target);const respondent=g.s.respondent;
  g.s.groups[respondent].score=F.rational(500);g.s.groups[respondent].aura=3;g.answer((g.s.current.correct+1)%4);
  assert.equal(F.exact(g.s.groups[respondent].score),self?'200':'500');assert.equal(g.s.result.penaltyBlocked,!self);F.Game.restore(g.snapshot());
 }
});
test('A 2.6 save migrates active seals to three personal turns, removes pending maluses and does not replay points',()=>{
 const g=game(),[source,other]=g.s.order;const old=g.snapshot();old.version='2.6.0';old.rules='23.0.0';old.turn=7;old.groups[source].aura=6;old.groups[source].score=F.rational(1000);old.effects.push({id:g.uid(),type:'salta',source:other,target:source});
 const r=F.Game.restore(old);assert.equal(r.s.groups[source].aura,3);assert.equal(r.s.effects.length,0);assert.equal(F.exact(r.s.groups[source].score),'1000');F.Game.restore(r.snapshot());
 const invalid=r.snapshot();invalid.groups[source].aura=4;assert.throws(()=>F.Game.restore(invalid),/Sigillo/);
});
