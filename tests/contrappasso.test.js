'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js');
const bank=Array.from({length:60},(_,i)=>({id:'double'+i,topic:'t',topicName:'T',body:'Q'+i,options:['A','B','C','D'],correct:0,explanation:'A',difficulty:'difficile'}));
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty:'misto',questionCount:33,quotas:{t:33},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});}
function item(g,type){const c={id:g.uid(),type,target:null,origin:'test'};g.s.groups[g.s.owner].inventory.push(c);return c;}
function activate(g){g.use(item(g,'karma').id,null);}
function answer(g,correct=false){g.reveal();g.answer(correct?g.s.current.correct:(g.s.current.correct+1)%4);}
function round(g){for(let n=0;n<3;n++){answer(g);g.next();}}

test('Contrappasso is manual, self-targeted, consumes one copy and never stacks',()=>{
 const g=game(),source=g.s.owner,c=item(g,'karma'),spare=item(g,'karma');assert.throws(()=>g.use(c.id,g.s.order[1]));assert.equal(g.s.groups[source].contrappasso,null);
 g.use(c.id,null);assert.equal(g.s.groups[source].contrappasso,3);assert.deepEqual(g.s.groups[source].inventory.map(c=>c.id),[spare.id]);
 assert.throws(()=>g.use(spare.id,null),/già attivo/);assert.equal(g.s.groups[source].inventory[0].id,spare.id);F.Game.restore(g.snapshot());
});
test('A correct answer doubles only its base points and leaves the independent Ammo awards unchanged',()=>{
 const g=game(),source=g.s.owner;g.s.groups[source].score=F.rational(1,3);g.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));activate(g);answer(g,true);
 assert.equal(F.exact(g.s.groups[source].score),'1801/3');assert.equal(g.s.result.gross.n,'600');assert.equal(g.s.result.base,'300');assert.equal(g.s.result.multiplier,2);
 assert.equal(g.s.result.bonuses.length,9);assert.equal(g.s.groups[source].inventory.length,9);assert.equal(g.s.result.bonuses.filter(c=>c.type==='karma').length,1);
 for(const i of g.s.order.slice(1))assert.equal(g.s.groups[i].score.n,'0');F.Game.restore(g.snapshot());
});
test('Wrong answers and timeouts lose twice the question value exactly once with a zero floor and no life loss',()=>{
 for(const [score,expected] of [[F.rational(0),'0'],[F.rational(1,3),'0'],[F.rational(600),'0'],[F.rational(2000,3),'200/3'],[F.rational(1000),'400']])for(const timeout of [false,true]){
  const g=game(),source=g.s.owner;g.s.groups[source].score=score;activate(g);g.reveal();g.answer(timeout?null:(g.s.current.correct+1)%4);
  assert.equal(F.exact(g.s.groups[source].score),expected);assert.equal(g.s.result.penaltyCause,'Contrappasso');assert(g.s.groups.every((_,i)=>F.remainingLives(g.s,i)===3));assert(!g.s.result.bonus);
  const before=F.clone(g.s.groups);g.tick();assert.deepEqual(g.s.groups,before);F.Game.restore(g.snapshot());
 }
});
test('Three personal turns include activation, persist as 3/2/1, and do not expire on opponents’ turns',()=>{
 let g=game(),source=g.s.owner;activate(g);
 for(const count of [3,2,1]){
  assert.equal(g.s.groups[source].contrappasso,count);g=F.Game.restore(g.snapshot());assert.equal(g.s.groups[source].contrappasso,count);
  answer(g,true);assert.equal(g.s.result.multiplier,2);g.next();assert.equal(g.s.groups[source].contrappasso,count);
  answer(g);g.next();assert.equal(g.s.groups[source].contrappasso,count);answer(g);g.next();
 }
 assert.equal(g.s.owner,source);assert.equal(g.s.groups[source].contrappasso,null);const before=g.s.groups[source].score;answer(g,true);assert.deepEqual(g.s.groups[source].score,F.add(before,F.rational(300)));assert.equal(g.s.result.multiplier,1);
});
test('Malocchio uses only the respondent’s multiplier: no transferred bonus and no triple penalty',()=>{
 for(const targetBoost of [false,true])for(const right of [false,true]){
  const g=game(),[source,,target]=g.s.order;activate(g);g.s.groups[target].contrappasso=targetBoost?3:null;g.s.groups.forEach(p=>p.score=F.rational(1000));
  g.use(item(g,'svela').id,null);g.pass(target);g.answer(right?g.s.current.correct:(g.s.current.correct+1)%4);
  assert.equal(F.exact(g.s.groups[source].score),'1000');assert.equal(F.exact(g.s.groups[target].score),String(1000+(right?1:-1)*300*(targetBoost?2:1)));
  assert.equal(g.s.result.multiplier,targetBoost?2:1);g.next();assert.equal(g.s.owner,g.s.order[1]);F.Game.restore(g.snapshot());
 }
 const g=game(),source=g.s.owner;g.s.groups[source].score=F.rational(1000);activate(g);g.use(item(g,'svela').id,null);g.pass(source);g.answer((g.s.current.correct+1)%4);assert.equal(g.s.groups[source].score.n,'400');
});
test('Sigillo blocks activation; a prior Contrappasso still doubles points/risk and does not bypass the Ammo lock',()=>{
 const a=game();a.use(item(a,'aura').id,null);assert.throws(()=>activate(a),/Sigillo attivo/);
 for(const correct of [false,true]){
  const g=game(),source=g.s.owner;g.s.groups[source].score=F.rational(1000);g.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));activate(g);g.use(item(g,'aura').id,null);answer(g,correct);
  assert.equal(g.s.groups[source].score.n,correct?'1600':'400');if(correct){assert.equal(g.s.result.ammoSuppressed,true);assert.deepEqual(g.s.result.bonuses,[]);}F.Game.restore(g.snapshot());
 }
});
test('Sacrificio, Livella, Tributo and Flagello point changes are not doubled; inventory destruction keeps the active effect',()=>{
 const g=game(),[source,opponent]=g.s.order;g.s.groups.forEach(p=>p.score=F.rational(1000));activate(g);g.use(item(g,'sacrificio').id,null);assert.equal(g.s.groups[source].score.n,'1777');
 g.use(item(g,'marx').id,null);assert.equal(F.exact(g.s.groups[source].score),'1259');g.use(item(g,'ruba').id,opponent);assert.equal(F.exact(g.s.groups[source].score),'167447/100');assert.equal(g.s.groups[source].contrappasso,3);
 g.use(item(g,'ira').id,null);assert.equal(F.exact(g.s.groups[source].score),'100847/100');assert.equal(g.s.groups[source].contrappasso,3);F.Game.restore(g.snapshot());
});
test('Elimination and Ultimo Miglio retire Contrappasso; the final ordinary answer still gets its multiplier',()=>{
 const g=game(),source=g.s.owner;activate(g);g.eliminate(source,'test');g.resolveEliminations();assert.equal(g.s.groups[source].contrappasso,null);F.Game.restore(g.snapshot());
 const h=game();h.s.valid=32;h.s.groups.forEach(p=>p.score=F.rational(0));activate(h);answer(h);assert.equal(h.s.phase,'pareggio');assert(h.s.groups.every(p=>p.contrappasso===null));F.Game.restore(h.snapshot());
});
test('A 2.7 save preserves Sigillo at 2 or 1, makes stored Contrappasso usable, and retains historical bound copies',()=>{
 for(const count of [2,1]){
  const g=game(),[source,other]=g.s.order;const c=item(g,'karma');g.s.groups[other].aura=count;const old=g.snapshot();old.version='2.7.0';old.rules='24.0.0';for(const p of old.groups)delete p.contrappasso;
  old.groups[source].inventory.push({id:g.uid(),type:'ruba',target:other,origin:'legacy'});const r=F.Game.restore(old);assert.equal(r.s.groups[other].aura,count);assert.equal(r.s.groups[source].contrappasso,null);
  assert.equal(r.s.groups[source].inventory[1].target,other);r.use(c.id,null);assert.equal(r.s.groups[source].contrappasso,3);F.Game.restore(r.snapshot());
 }
 const save=game().snapshot();save.groups[0].contrappasso=4;assert.throws(()=>F.Game.restore(save),/Contrappasso/);delete save.groups[0].contrappasso;assert.throws(()=>F.Game.restore(save),/Contrappasso/);
});

test('A legacy deferred Tributo shares its original base: only the boosted respondent’s quota doubles',()=>{
 const g=game(),[source,other]=g.s.order;g.s.effects.push({id:g.uid(),type:'ruba',source:other,target:source});activate(g);answer(g,true);
 assert.equal(g.s.groups[source].score.n,'300');assert.equal(g.s.groups[other].score.n,'150');assert.equal(g.s.result.share.n,'300');assert.equal(g.s.result.beneficiaryShare.n,'150');F.Game.restore(g.snapshot());
});
