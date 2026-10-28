'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js');
function question(id,difficulty='difficile'){
  return {id,topic:'t',topicName:'Test',body:'Domanda '+id,options:['Uno','Due','Tre','Quattro'],correct:0,explanation:'Uno è corretto.',difficulty};
}
function game(difficulty='facile',hard=15){
  const bank=[...Array.from({length:6},(_,i)=>question('e'+i,'facile')),...Array.from({length:hard},(_,i)=>question('h'+i))];
  return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:30,bases:{facile:100,media:200,difficile:300},difficulty,questionCount:3,quotas:{t:3},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))},()=>.25),{random:()=>.25,now:()=>100});
}
function item(g,type){const c={id:g.uid(),type,target:null,origin:'test'};g.s.groups[g.s.owner].inventory.push(c);return c;}
function answer(g,correct=false){g.reveal();g.answer(correct?g.s.current.correct:(g.s.current.correct+1)%4);}
function tie(g){for(let i=0;i<3;i++){answer(g);if(i<2)g.next();}}

test('Flagello subtracts exact rational amounts at every boundary, wipes fresh Ammo and preserves seals',()=>{
  for(const [score,expected] of [[F.rational(0),'0'],[F.rational(1,3),'0'],[F.rational(666),'0'],[F.rational(1999,3),'1/3'],[F.rational(1000),'334']]){
    const g=game();g.s.groups.forEach(p=>{p.score=F.clone(score);p.aura=g.s.turn;p.inventory.push({id:g.uid(),type:'karma',target:null,origin:'just-awarded'});});
    const c=item(g,'ira');g.use(c.id,null);
    for(let i=0;i<3;i++){assert.equal(F.exact(g.s.groups[i].score),expected);assert.equal(F.remainingLives(g.s,i),2);assert.equal(g.s.groups[i].inventory.length,0);assert.equal(g.s.groups[i].aura,g.s.turn);}
    assert(!g.s.events.some(e=>e.type==='karma-trigger'));F.Game.restore(g.snapshot());
  }
});
test('Flagello resolves a sole survivor and self-elimination after all effects, leaving the eliminated state unchanged',()=>{
  for(const lives of [1,2]){
    const g=game(),owner=g.s.owner;for(const i of g.s.order.slice(1))g.eliminate(i,'test');
    const dead=F.clone(g.s.groups[g.s.order[1]]);g.s.groups[owner].damage=3-lives;g.s.groups[owner].score=F.rational(2000);
    g.use(item(g,'ira').id,null);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,lives===1?null:owner);
    assert.equal(F.exact(g.s.groups[owner].score),'1334');assert.deepEqual(g.s.groups[g.s.order[1]],dead);F.Game.restore(g.snapshot());
  }
});
test('Antisigillo refuses unprotected, eliminated, missing and self targets without consuming Ammo',()=>{
  for(const mode of ['unprotected','out','self','missing']){
    const g=game(),target=g.s.order[1],c=item(g,'antisigillo');g.s.groups[target].aura=mode==='unprotected'?null:g.s.turn;
    if(mode==='out')g.eliminate(target,'test');
    assert.throws(()=>g.use(c.id,mode==='self'?g.s.owner:mode==='missing'?null:target));
    assert(g.s.groups[g.s.owner].inventory.some(i=>i.id===c.id));assert.equal(g.s.effects.length,0);
  }
});
test('Antisigillo dissipates only the protection, bypasses reflection and enables each later attack',()=>{
  for(const attack of ['salta','ruba','svela']){
    const g=game(),target=g.s.order[1],c=item(g,'antisigillo');g.s.groups[target].aura=g.s.turn;
    const karma={id:g.uid(),type:'karma',target:null,origin:'test'};g.s.groups[target].inventory.push(karma);
    g.s.effects.push({id:g.uid(),type:'salta',source:g.s.owner,target});const before=F.clone(g.s.groups[target]);
    g.use(c.id,target);assert.equal(g.s.groups[target].aura,null);assert.equal(karma.type,'karma');assert.equal(g.s.effects.length,1);
    assert.deepEqual(g.s.groups[target].score,before.score);assert.equal(g.s.groups[target].damage,0);
    const restored=F.Game.restore(g.snapshot());assert.equal(restored.s.groups[target].aura,null);
    assert(g.attack(attack,g.s.owner,target,g.uid()));assert.equal(karma.type,attack);
  }
});
test('Antisigillo uses an independent 30% threshold and migrates old probabilities and stored copies',()=>{
  for(const [roll,awarded] of [[.299,true],[.3,false]]){
    const g=game();delete g.s.config.bonusWeights.antisigillo;
    const old=g.snapshot();old.version='2.3.0';old.rules='20.0.0';old.config.bonusWeights.ruba=17;item(g,'antisigillo');old.groups=F.clone(g.s.groups);
    const r=F.Game.restore(old);assert.equal(r.s.config.bonusWeights.antisigillo,30);assert.equal(r.s.config.bonusWeights.ruba,17);
    r.random=()=>roll;answer(r,true);assert.equal(r.s.result.bonuses.some(c=>c.type==='antisigillo'),awarded);assert.equal(r.s.result.bonuses.length,Number(awarded));
  }
});
test('Ultimo Miglio keeps damage, sanctions and scores; timeout and wrong answer remove exactly one life',()=>{
  const g=game();g.s.groups[0].damage=1;g.s.groups[1].sanctions=1;tie(g);
  assert.deepEqual(g.s.groups.map((_,i)=>F.remainingLives(g.s,i)),[2,2,3]);
  const seen=new Set(g.s.seen),scores=F.clone(g.s.groups.map(p=>p.score));
  for(let turn=0;turn<6;turn++){
    g.next();assert.equal(g.s.current.difficulty,'difficile');assert(!seen.has(g.s.current.id));seen.add(g.s.current.id);
    const who=g.s.respondent,before=F.remainingLives(g.s,who);g.reveal();g.answer(turn===0?null:(g.s.current.correct+1)%4);
    assert.equal(F.remainingLives(g.s,who),before-1);assert.equal(g.s.groups[who].out,before===1);assert.deepEqual(g.s.groups.map(p=>p.score),scores);
    assert(g.s.groups.every(p=>!p.inventory.length));F.Game.restore(g.snapshot());
  }
  assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,2);
});
test('Ultimo Miglio completes all due questions, including the last elimination, before Game Over',()=>{
  const g=game();g.s.groups.forEach(p=>p.damage=2);tie(g);
  for(let i=0;i<3;i++){g.next();answer(g);assert.equal(g.s.extra,i+1);assert.equal(g.s.phase,i<2?'pareggio':'conclusa');}
  assert.equal(g.s.winner,null);assert.throws(()=>g.next());F.Game.restore(g.snapshot());
});
test('Exhaustion and supply never fall back to easy/medium; restore keeps the due turn and seen questions',()=>{
  let g=game('facile',1);tie(g);g.next();answer(g,true);g.next();assert.equal(g.s.screen,'supply');
  const who=g.s.respondent,seen=F.clone(g.s.seen);g=F.Game.restore(g.snapshot());
  assert.throws(()=>g.supply({bank:[question('new-easy','facile')]}),/difficili/);assert.equal(g.s.screen,'supply');
  g.supply({bank:[question('new-hard'),question('another-easy','facile')]});assert.equal(g.s.current.id,'new-hard');assert.equal(g.s.respondent,who);assert.deepEqual(g.s.seen,seen);
  g.reveal();const r=F.Game.restore(g.snapshot());assert(r.s.paused);assert.equal(r.s.current.id,'new-hard');r.resume();r.answer(r.s.current.correct);F.Game.restore(r.snapshot());
});
test('Legacy ties retain their actual one-life budget and retire non-hard open questions without replay',()=>{
  for(const screen of ['hidden','answer']){
    const g=game();tie(g);g.next();if(screen==='answer')g.reveal();const old=g.snapshot();old.version='2.3.0';old.rules='20.0.0';
    old.current=F.mix(old.bank.find(q=>q.difficulty==='facile'&&!old.seen.includes(q.id)),()=>.1);
    if(screen==='answer')old.seen.push(old.current.id);const retired=old.current.id,seen=F.clone(old.seen),respondent=old.respondent;
    old.groups[0].sanctions=1;
    const r=F.Game.restore(old);assert(r.active().every(i=>F.remainingLives(r.s,i)===1));assert.equal(r.s.current.difficulty,'difficile');assert.equal(r.s.respondent,respondent);
    assert.deepEqual(r.s.seen,seen);if(screen==='answer')assert(r.s.cancelled.includes(retired));assert.equal(r.running,false);F.Game.restore(r.snapshot());
  }
});
test('A current-format tie save rejects an easy queued question before it can bypass the hard-only reserve',()=>{
  const g=game();tie(g);const save=g.snapshot();
  save.queue=[F.mix(save.bank.find(q=>q.difficulty==='facile'&&!save.seen.includes(q.id)),()=>.25)];
  assert.throws(()=>F.Game.restore(save),/coda con domande non difficili/);
});
