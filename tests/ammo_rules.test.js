'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js');
const bank=Array.from({length:18},(_,i)=>({id:'q'+i,topic:'t',topicName:'T',body:'Q'+i,options:['A','B','C','D'],correct:0,explanation:'A',difficulty:'difficile'}));
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty:'misto',questionCount:3,quotas:{t:3},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});}
function item(g,type,target=null){const c={id:g.uid(),type,target,origin:'test'};g.s.groups[g.s.owner].inventory.push(c);return c;}
function answer(g){g.reveal();g.answer(g.s.current.correct);}

test('Arsenico 30% and Sacrificio 5% use independent exact thresholds',()=>{
 for(const [type,threshold] of [['arsenico',30],['sacrificio',5]]){
  assert.equal(F.DEFAULT_BONUS_WEIGHTS[type],threshold);
  for(const [roll,awarded] of [[(threshold-.001)/100,true],[threshold/100,false]]){
   const g=game();delete g.s.config.bonusWeights[type];g.s.config=F.config(g.s.config);g.random=()=>roll;answer(g);
   assert.equal(g.s.result.bonuses.some(c=>c.type===type),awarded);assert.equal(g.s.result.bonuses.length,Number(awarded));
  }
 }
 const g=game();g.s.config.bonusWeights.arsenico=30;g.s.config.bonusWeights.sacrificio=5;g.random=()=>.049;answer(g);
 assert.deepEqual(g.s.result.bonuses.map(c=>c.type),['arsenico','sacrificio']);
});
test('Sacrificio adds 777 exactly, costs a life, consumes one copy and preserves other protections',()=>{
 const g=game(),owner=g.s.owner,target=g.s.order[1];g.s.groups[owner].score=F.rational(1,3);g.s.groups[owner].sanctions=1;g.s.groups[target].aura=3;
 const c=item(g,'sacrificio'),spare=item(g,'sacrificio'),karma=item(g,'karma');const other=F.clone(g.s.groups[target]),question=g.s.current.id;
 g.use(c.id,null);assert.equal(F.exact(g.s.groups[owner].score),'2332/3');assert.equal(F.remainingLives(g.s,owner),1);
 assert.equal(g.s.groups[owner].aura,null);assert.deepEqual(g.s.groups[owner].inventory.map(c=>c.id),[spare.id,karma.id]);
 assert.deepEqual(g.s.groups[target],other);assert.equal(g.s.owner,owner);assert.equal(g.s.current.id,question);assert.equal(g.s.valid,0);
 assert(!g.s.events.some(e=>e.type==='karma-trigger'));const r=F.Game.restore(g.snapshot());assert.equal(F.remainingLives(r.s,owner),1);
 assert.throws(()=>g.use(spare.id,target));assert(g.s.groups[owner].inventory.some(c=>c.id===spare.id));
});
test('Sacrificio on the last life still credits points but eliminates and advances or concludes normally',()=>{
 for(const revealed of [false,true])for(const survivors of [1,2]){
  const g=game(),owner=g.s.owner,other=g.s.order[1];g.s.groups[owner].damage=2;g.s.groups[owner].score=F.rational(10);
  if(survivors===1)g.eliminate(g.s.order[2],'test');const c=item(g,'sacrificio');if(revealed)g.reveal();const old=g.s.current.id;
  g.use(c.id,null);assert.equal(g.s.groups[owner].out,true);assert.equal(F.exact(g.s.groups[owner].score),'787');assert.equal(F.remainingLives(g.s,owner),0);
  assert.equal(g.s.groups[owner].inventory.length,0);assert.equal(g.s.valid,0);assert.equal(g.running,false);
  if(survivors===1){assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,other);}else {assert.notEqual(g.s.owner,owner);assert.equal(g.s.screen,'hidden');if(revealed)assert(g.s.cancelled.includes(old));}
  F.Game.restore(g.snapshot());
 }
});
test('Tributo immediately transfers exactly 33%, preserves total points and forfeits the current turn',()=>{
 for(const score of [F.rational(0),F.rational(1000),F.rational(100,3)])for(const revealed of [false,true]){
  const g=game(),[owner,target]=g.s.order;g.s.groups[owner].score=F.rational(5,7);g.s.groups[target].score=score;
  const total=F.add(g.s.groups[owner].score,score),c=item(g,'ruba');if(revealed)g.reveal();const old=g.s.current.id;
  const amount=F.rational(BigInt(score.n)*33n,BigInt(score.d)*100n);g.use(c.id,target);
  assert.deepEqual(g.s.groups[owner].score,F.add(F.rational(5,7),amount));assert.equal(F.compare(F.add(g.s.groups[owner].score,g.s.groups[target].score),total),0);
  assert.equal(F.compare(g.s.groups[target].score,F.rational(BigInt(score.n)*67n,BigInt(score.d)*100n)),0);
  assert.equal(g.s.owner,target);assert.equal(g.s.respondent,target);assert.equal(g.s.turn,2);assert.equal(g.s.valid,0);assert.equal(g.s.screen,'hidden');assert.equal(g.running,false);
  assert.equal(g.s.effects.some(e=>e.type==='ruba'),false);assert.equal(g.s.groups[owner].inventory.length,0);
  assert.equal(g.s.current.id===old,!revealed);assert.equal(g.s.cancelled.includes(old),revealed);
  const r=F.Game.restore(g.snapshot());const before=r.s.groups[target].score;answer(r);assert.deepEqual(r.s.groups[target].score,F.add(before,F.rational(300)));
 }
});
test('Sigillo blocks Tributo transfer but still charges the turn; stored Contrappasso stays unchanged',()=>{
 for(const blocked of [false,true]){
  const g=game(),[owner,target]=g.s.order;g.s.groups[target].score=F.rational(100);g.s.groups[target].aura=blocked?g.s.turn:null;
  const karma={id:g.uid(),type:'karma',target:null,origin:'test'};g.s.groups[target].inventory.push(karma);const c=item(g,'ruba');g.use(c.id,target);
  assert.equal(F.exact(g.s.groups[owner].score),blocked?'0':'33');assert.equal(F.exact(g.s.groups[target].score),blocked?'100':'67');assert.equal(g.s.owner,target);
  assert.equal(karma.type,'karma');assert.equal(karma.target,null);F.Game.restore(g.snapshot());
 }
});
test('A legacy bound Tributo respects its target and charges its user on the current total',()=>{
 const g=game(),[owner,target,third]=g.s.order;g.s.groups[owner].score=F.rational(100);g.s.groups[target].score=F.rational(100);
 g.s.groups[target].inventory.push({id:g.uid(),type:'karma',target:null,origin:'test'});g.use(item(g,'ruba').id,target);
 const c={id:g.uid(),type:'ruba',target:owner,origin:'legacy'};g.s.groups[target].inventory.push(c);assert.throws(()=>g.use(c.id,third));assert(g.s.groups[target].inventory.includes(c));
 g.use(c.id,owner);assert.equal(g.s.owner,third);assert.equal(F.exact(g.s.groups[owner].score),'8911/100');assert.equal(F.exact(g.s.groups[target].score),'11089/100');F.Game.restore(g.snapshot());
});
test('A 2.4 save keeps lives/progress, migrates default odds and settles existing deferred Tributi once',()=>{
 const g=game(),[owner,other]=g.s.order;g.s.groups[owner].damage=1;g.s.groups[owner].score=F.rational(1,3);const old=g.snapshot();old.version='2.4.0';old.rules='21.0.0';
 old.config.bonusWeights.arsenico=30;delete old.config.bonusWeights.sacrificio;old.effects.push({id:g.uid(),type:'ruba',source:other,target:owner});
 const r=F.Game.restore(old);assert.equal(r.s.config.bonusWeights.arsenico,30);assert.equal(r.s.config.bonusWeights.sacrificio,5);assert.equal(F.remainingLives(r.s,owner),2);
 answer(r);assert.equal(F.exact(r.s.groups[owner].score),'451/3');assert.equal(F.exact(r.s.groups[other].score),'150');assert.equal(r.s.effects.length,0);F.Game.restore(r.snapshot());
 old.config.bonusWeights.arsenico=17;assert.equal(F.Game.restore(old).s.config.bonusWeights.arsenico,17);
});

test('A 2.4 Ultimo Miglio save retains its queued hard question and residual lives',()=>{
 const g=game();for(let i=0;i<3;i++){g.reveal();g.answer((g.s.current.correct+1)%4);if(i<2)g.next();}g.next();
 g.s.groups[g.s.respondent].damage=1;const queued=g.available()[0];g.s.queue=[F.clone(queued)];const old=g.snapshot();old.version='2.4.0';old.rules='21.0.0';
 const r=F.Game.restore(old);assert.deepEqual(r.s.queue,old.queue);assert.equal(r.s.current.id,old.current.id);assert.equal(r.s.respondent,old.respondent);
 assert.equal(F.remainingLives(r.s,r.s.respondent),2);assert.equal(r.s.tieIndex,old.tieIndex);
});
test('Tributo respects pending Catene and an already requested suspension',()=>{
 const g=game(),[owner,target,third]=g.s.order;g.s.effects.push({id:g.uid(),type:'salta',source:owner,target});
 const c=item(g,'ruba');g.reveal();g.bell();g.use(c.id,target);assert.equal(g.s.owner,third);assert.equal(g.s.suspended,true);assert.equal(g.s.suspendAfter,false);
 assert.equal(g.s.effects.length,0);assert.equal(g.running,false);F.Game.restore(g.snapshot());
});
