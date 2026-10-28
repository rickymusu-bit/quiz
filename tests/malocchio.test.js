'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js');
const bank=Array.from({length:24},(_,i)=>({id:'m'+i,topic:'t',topicName:'T',body:'Testo '+i,options:['A','B','C','D'],correct:0,explanation:'A',difficulty:['facile','media','difficile'][i%3]}));
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty:'misto',questionCount:9,quotas:{t:9},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});}
function peek(g,target=null,bound=null){const s=g.s,owner=s.owner,c={id:g.uid(),type:'svela',target:bound,origin:'test'};s.groups[owner].inventory.push(c);g.use(c.id,null);if(target!==null)g.pass(target);return owner;}
function wrong(g){g.answer((g.s.current.correct+1)%4);}

test('Malocchio reveals only a pending question, at a stopped timer, and persists its author',()=>{
 const g=game(),source=g.s.owner;peek(g);assert.equal(g.s.screen,'choice');assert.equal(g.running,false);assert.deepEqual(g.s.malocchio,{source,question:g.s.current.id});
 assert.equal(g.s.groups[source].inventory.length,0);assert.equal(g.s.groups[source].score.n,'0');F.Game.restore(g.snapshot());
 assert.throws(()=>g.reveal());assert.throws(()=>g.answer(0));g.pass(source);assert.equal(g.left(),30000);assert(g.running);
 assert.throws(()=>peek(g));
});
test('Wrong self and passed answers debit the actual respondent exactly, with a zero floor and unchanged lives',()=>{
 for(const targetOffset of [0,1,2])for(const [score,expected] of [[F.rational(0),'0'],[F.rational(1,3),'0'],[F.rational(300),'0'],[F.rational(1000),'700'],[F.rational(1000,3),'100/3']]){
  const g=game(),[source]=g.s.order,target=g.s.order[targetOffset];g.s.current.difficulty='difficile';g.s.bank.find(q=>q.id===g.s.current.id).difficulty='difficile';g.s.groups.forEach(p=>p.score=F.rational(900));g.s.groups[target].score=score;
  const before=g.s.groups.map(p=>F.exact(p.score));peek(g,target);wrong(g);
  assert.equal(F.exact(g.s.groups[target].score),expected);for(const i of g.s.order.filter(i=>i!==target))assert.equal(F.exact(g.s.groups[i].score),before[i]);
  assert.equal(g.s.result.base,'300');assert(g.s.result.malocchio);assert.equal(g.s.result.respondent,target);assert.equal(g.s.valid,1);
  assert(g.s.groups.every((_,i)=>F.remainingLives(g.s,i)===3));assert(!g.s.result.bonus);F.Game.restore(g.snapshot());
  g.next();assert.equal(g.s.owner,g.s.order[1]);assert.equal(g.s.malocchio,null);
 }
});
test('Timeout has the same penalty once, preserves the full confirmation timer and survives pause/restore',()=>{
 let now=100;let g=game();g.now=()=>now;const [source,,target]=g.s.order;g.s.groups[target].score=F.rational(1000);peek(g,target);const base=g.s.config.bases[g.s.current.difficulty];
 now+=1000;g.pause();const left=g.left();now+=10000;g=F.Game.restore(g.snapshot(),{now:()=>now,random:()=>.25});assert.equal(g.left(),left);assert.equal(g.s.malocchio.source,source);
 g.resume();now+=left;g.tick();assert.equal(g.s.result.option,null);assert.equal(F.exact(g.s.groups[target].score),String(1000-base));assert.equal(g.s.valid,1);
 const score=F.exact(g.s.groups[target].score);g.tick();assert.equal(F.exact(g.s.groups[target].score),score);g.next();assert.equal(g.s.owner,g.s.order[1]);
});
test('Every correct respondent keeps all base points and all independent Ammo awards, without sharing',()=>{
 for(const offset of [0,1,2]){
  const g=game(),[source,other]=g.s.order,target=g.s.order[offset];g.s.config.bonusWeights=Object.fromEntries(F.TYPES.map(t=>[t,100]));
  g.s.groups.forEach(p=>p.score=F.rational(500));g.s.effects.push({id:g.uid(),type:'ruba',source:target===source?other:source,target});
  peek(g,target);g.answer(g.s.current.correct);const base=g.s.config.bases[g.s.current.difficulty];
  assert.equal(F.exact(g.s.groups[target].score),String(500+base));for(const i of g.s.order.filter(i=>i!==target))assert.equal(F.exact(g.s.groups[i].score),'500');
  assert.deepEqual(g.s.result.beneficiaries,[]);assert.equal(g.s.result.bonuses.length,9);assert.equal(g.s.groups[target].inventory.length,9);assert.equal(g.s.effects.length,0);F.Game.restore(g.snapshot());
  g.next();assert.equal(g.s.respondent,g.s.order[1]);
 }
});
test('A normal wrong answer after Malocchio has no penalty and normal rotation resumes',()=>{
 const g=game(),[source,second,third]=g.s.order;peek(g,third);g.answer(g.s.current.correct);g.next();assert.equal(g.s.owner,second);g.s.groups[second].score=F.rational(600);g.reveal();wrong(g);
 assert.equal(F.exact(g.s.groups[second].score),'600');assert.equal(g.s.result.malocchio,null);assert.equal(g.s.result.penalty.n,'0');g.next();assert.equal(g.s.owner,third);F.Game.restore(g.snapshot());
});
test('Sigillo blocks a pass but keeps the risk on its author; legacy copy constraints only limit the recipient',()=>{
 const g=game(),[source,target,third]=g.s.order;g.s.groups[target].aura=g.s.turn;g.s.groups[source].score=F.rational(1000);peek(g,target);assert.equal(g.s.respondent,source);wrong(g);
 assert(F.compare(g.s.groups[source].score,F.rational(1000))<0);assert.equal(g.s.groups[target].score.n,'0');g.next();assert.equal(g.s.owner,target);
 const h=game();peek(h,null,h.s.order[1]);assert.throws(()=>h.pass(h.s.order[2]));assert.equal(h.s.screen,'choice');h.pass(h.s.owner);wrong(h);F.Game.restore(h.snapshot());
});
test('Eliminating a passed respondent continues from the author, respecting Catene and eliminated groups',()=>{
 for(const skip of [false,true]){
  const g=game(),[source,second,target]=g.s.order;peek(g,target);if(skip)g.s.effects.push({id:g.uid(),type:'salta',source:target,target:second});
  // A skip authored by the surviving user remains active through elimination.
  if(skip)g.s.effects[0].source=source;
  g.openSanctions();g.s.panel.counts[target]=3;g.closeSanctions(true);assert.equal(g.s.valid,0);assert.equal(g.s.owner,skip?source:second);assert.equal(g.s.malocchio,null);F.Game.restore(g.snapshot());
 }
});
test('Legacy in-flight 2.5 Malocchio saves gain the risk and rotation anchor without replaying history',()=>{
 for(const screen of ['choice','answer','result']){
  const g=game(),[source,,target]=g.s.order;g.s.groups[target].score=F.rational(1000);peek(g);if(screen!=='choice')g.pass(target);if(screen==='result')g.answer(g.s.current.correct);
  const old=g.snapshot();old.version='2.5.0';old.rules='22.0.0';delete old.malocchio;const before=F.clone(old.groups);
  const r=F.Game.restore(old);assert.deepEqual(r.s.groups,before);assert.equal(r.s.malocchio.source,source);assert.equal(r.s.current.id,old.current.id);
  if(screen==='choice')r.pass(target);if(screen!=='result'){if(r.s.paused)r.resume();wrong(r);}r.next();assert.equal(r.s.owner,r.s.order[1]);F.Game.restore(r.snapshot());
 }
});
test('Malocchio state is validated and clears on the transition to Ultimo Miglio',()=>{
 const g=game();peek(g);const old=g.snapshot();old.malocchio.source=g.s.order[2];assert.throws(()=>F.Game.restore(old),/Malocchio/);
 g.pass(g.s.owner);wrong(g);g.s.valid=8;g.next();peek(g,g.s.owner);wrong(g);assert.equal(g.s.phase,'pareggio');assert.equal(g.s.malocchio,null);F.Game.restore(g.snapshot());
});
