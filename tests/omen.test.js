'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js'),A=require('../assets/hell-ammo.js');
const bank=Array.from({length:100},(_,i)=>({id:'omen'+i,topic:'t',topicName:'T',body:'Q'+i,options:['A','B','C','D'],correct:0,explanation:'A',difficulty:'difficile'}));
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty:'misto',questionCount:99,quotas:{t:99},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});}
function item(g,type){const c={id:g.uid(),type,target:null,origin:'test'};g.s.groups[g.s.owner].inventory.push(c);return c;}
function next(g){g.reveal();g.answer((g.s.current.correct+1)%4);g.next();}
function poison(g,target){g.use(item(g,'arsenico').id,target);}

test('Catene charges its author exactly 11% at zero, fractional and normal scores, even when blocked',()=>{
 for(const score of [F.rational(0),F.rational(1,3),F.rational(1000)])for(const blocked of [false,true]){
  const g=game(),[source,target,third]=g.s.order;g.s.groups[source].score=score;g.s.groups[target].aura=blocked?3:null;
  g.use(item(g,'salta').id,target);assert.deepEqual(g.s.groups[source].score,F.rational(BigInt(score.n)*89n,BigInt(score.d)*100n));
  assert.equal(F.exact(g.s.groups[target].score),'0');assert.equal(g.s.owner,source);
  assert.equal(g.s.effects.filter(e=>e.type==='salta').length,blocked?0:1);
  next(g);assert.equal(g.s.owner,blocked?target:third);assert.equal(g.s.valid,1);F.Game.restore(g.snapshot());
 }
});
test('Arsenico forfeits only the current turn, retains unseen questions and retires seen ones',()=>{
 for(const revealed of [false,true]){
  const g=game(),[source,target,third]=g.s.order,question=g.s.current.id;g.s.groups[target].score=F.rational(1000);
  if(revealed)g.reveal();const rev=g.s.revision;g.use(item(g,'arsenico').id,target,rev);
  assert.equal(g.s.owner,target);assert.equal(g.s.turn,2);assert.equal(g.s.valid,0);assert.equal(g.running,false);
  assert.equal(F.exact(g.s.groups[target].score),'890');assert.equal(g.s.effects[0].remaining,2);
  assert.equal(g.s.current.id===question,!revealed);assert.equal(g.s.cancelled.includes(question),revealed);
  assert.throws(()=>g.use('missing',target,rev),/già elaborato/);
  next(g);assert.equal(g.s.owner,third);next(g);assert.equal(g.s.owner,source);F.Game.restore(g.snapshot());
 }
});
test('Three compound reductions tick once at personal turn entry and survive repeated restore/pause/reveal',()=>{
 let g=game();const target=g.s.order[1];g.s.groups[target].score=F.rational(1000);poison(g,target);
 for(const [n,score] of ['890','7921/10','704969/1000'].entries()){
  assert.equal(g.s.owner,target);assert.equal(F.exact(g.s.groups[target].score),score);
  for(let repeat=0;repeat<3;repeat++){g=F.Game.restore(g.snapshot());assert.equal(F.exact(g.s.groups[target].score),score);}
  g.reveal();g.pause();g=F.Game.restore(g.snapshot());g.resume();g.answer((g.s.current.correct+1)%4);
  assert.equal(F.exact(g.s.groups[target].score),score);assert.equal(g.s.events.filter(e=>e.type==='arsenico-tick').length,n+1);
  if(n<2){g.next();next(g);next(g);}
 }
 assert(!g.s.effects.some(e=>e.type==='arsenico'));g.next();next(g);next(g);
 assert.equal(F.exact(g.s.groups[target].score),'704969/1000');
});
test('Catene ticks Arsenico before skipping a target, including multiple consecutive skips',()=>{
 const g=game(),[source,target,third]=g.s.order;g.s.groups[target].score=F.rational(1000);
 for(let i=0;i<3;i++)g.s.effects.push({id:g.uid(),type:'salta',source,target});
 poison(g,target);assert.equal(g.s.owner,third);assert.equal(F.exact(g.s.groups[target].score),'890');
 for(let i=0;i<2;i++){next(g);next(g);assert.equal(g.s.owner,third);}
 assert.equal(F.exact(g.s.groups[target].score),'704969/1000');assert.equal(g.s.events.filter(e=>e.type==='turn-skipped').length,3);
 assert(!g.s.effects.length);F.Game.restore(g.snapshot());
});
test('Arsenico rejects a second dose before consuming a copy and never stacks or refreshes',()=>{
 const g=game(),[source,target,third]=g.s.order;poison(g,target);next(g);const c=item(g,'arsenico'),before=F.clone(g.s.effects);
 assert.throws(()=>g.use(c.id,target),/già attivo/);assert(g.s.groups[third].inventory.includes(c));assert.deepEqual(g.s.effects,before);
 assert.equal(g.s.owner,third);F.Game.restore(g.snapshot());
});
test('Arsenico zero/fractional boundaries are exact and Sigillo blocks or removes the effect',()=>{
 for(const score of [F.rational(0),F.rational(1,3),F.rational(1,1000000)]){
  const g=game(),target=g.s.order[1];g.s.groups[target].score=score;poison(g,target);
  assert.deepEqual(g.s.groups[target].score,F.rational(BigInt(score.n)*89n,BigInt(score.d)*100n));
  g.use(item(g,'aura').id,null);assert(!g.s.effects.length);F.Game.restore(g.snapshot());
 }
 const g=game(),target=g.s.order[1];g.s.groups[target].score=F.rational(1000);g.s.groups[target].aura=3;poison(g,target);
 assert.equal(g.s.owner,target);assert.equal(F.exact(g.s.groups[target].score),'1000');assert(!g.s.effects.length);
 assert(g.s.events.some(e=>e.type==='aura-block'&&e.ammo==='arsenico'));
});
test('Malocchio, supply and restores do not create additional personal turn entries',()=>{
 const g=game(),[source,target,third]=g.s.order;g.s.groups[target].score=F.rational(1000);poison(g,target);
 next(g);const before=F.clone(g.s.effects);g.use(item(g,'svela').id,null);g.pass(target);g.answer((g.s.current.correct+1)%4);
 assert.deepEqual(g.s.effects,before);assert.equal(g.s.events.filter(e=>e.type==='arsenico-tick').length,1);
 g.next();g.s.queue=[];g.s.bank=g.s.bank.filter(q=>g.s.seen.includes(q.id)||q.id===g.s.current.id);next(g);
 assert.equal(g.s.screen,'supply');const loss=g.s.events.filter(e=>e.type==='arsenico-tick').length;
 g.supply({bank:[{...bank[0],id:'supplied'}]});assert.equal(g.s.events.filter(e=>e.type==='arsenico-tick').length,loss);
});
test('Antisigillo is unobtainable and legacy inventories, drafts and rewards migrate without replacement',()=>{
 assert(!F.TYPES.includes('antisigillo'));assert.equal(F.LABELS.antisigillo,undefined);assert(!A.labels.antisigillo);
 for(const [version,rules] of [['2.8.0','25.0.0'],['2.4.0','21.0.0']]){
  const g=game(),source=g.s.owner,removed=item(g,'antisigillo'),kept=item(g,'karma');g.s.groups[source].score=F.rational(100,3);g.s.groups[source].damage=1;
  const old=g.snapshot();old.version=version;old.rules=rules;old.config.bonusWeights.antisigillo=100;delete old.config.bonusWeights.arsenico;
  old.draftBonus={copyId:removed.id,target:null};const r=F.Game.restore(old);
  assert.deepEqual(r.s.groups[source].inventory,[kept]);assert.equal(F.exact(r.s.groups[source].score),'100/3');assert.equal(F.remainingLives(r.s,source),2);
  assert.equal(r.s.draftBonus,null);assert.equal(r.s.config.bonusWeights.antisigillo,undefined);assert.equal(r.s.config.bonusWeights.arsenico,30);
  r.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));r.reveal();r.answer(r.s.current.correct);
  assert.equal(r.s.result.bonuses.length,9);assert(!r.s.result.bonuses.some(c=>c.type==='antisigillo'));
  const save=r.snapshot();save.version='2.8.0';save.rules='25.0.0';save.result.bonuses.push(removed);save.result.bonus=removed;
  save.events.find(e=>e.outcome).outcome.bonuses.push(removed);
  const restored=F.Game.restore(save);assert.equal(restored.s.result.bonus,null);assert(!restored.s.result.bonuses.some(c=>c.type==='antisigillo'));F.Game.restore(restored.snapshot());
 }
 const g=game();assert.throws(()=>g.use(item(g,'antisigillo').id,g.s.order[1]),/non disponibile/);
 assert.throws(()=>g.attack('antisigillo',g.s.owner,g.s.order[1],g.uid()),/non valido/);
});
test('Arsenico effect validation rejects malformed countdowns, losses and duplicate targets',()=>{
 const g=game();poison(g,g.s.order[2]);const base=g.snapshot();
 for(const remaining of [0,4,1.5,undefined]){const s=F.clone(base);s.effects[0].remaining=remaining;assert.throws(()=>F.Game.restore(s),/Arsenico/);}
 const s=F.clone(base);s.effects.push({...s.effects[0],id:'duplicate'});assert.throws(()=>F.Game.restore(s),/duplicato/);
});
test('Elimination and the ordinary-to-tie boundary remove Arsenico without changing historical scores',()=>{
 const g=game(),[source,target]=g.s.order;poison(g,target);const score=F.clone(g.s.groups[target].score);g.eliminate(source,'test');assert(!g.s.effects.length);assert.deepEqual(g.s.groups[target].score,score);
 const h=game();h.s.config.questionCount=3;h.s.config.quotas.t=3;poison(h,h.s.order[2]);for(let i=0;i<3;i++){h.reveal();h.answer((h.s.current.correct+1)%4);if(i<2)h.next();}
 assert.equal(h.s.phase,'pareggio');assert(!h.s.effects.length);F.Game.restore(h.snapshot());
});
