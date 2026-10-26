'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'Fool.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)],script=scripts[1][1];
const engine=script.slice(0,script.indexOf("\n'use strict';\nconst F=Fool"));assert(engine.length>10000);
const context={module:{exports:{}},TextEncoder,performance};vm.runInNewContext(engine,context);const F=context.module.exports;
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'datasets.json'),'utf8'));
const thermal=catalogue.banche.find(x=>x.id==='termologia');assert(thermal);
const bank=F.parseDataset(fs.readFileSync(path.join(root,thermal.url),'utf8')).bank,copy=x=>JSON.parse(JSON.stringify(x));
function settings(total=33,weights=30,difficulty='misto'){const topics=[...new Set(bank.map(q=>q.topic))];return {names:['A','B','C'],seconds:45,bases:{facile:100,media:200,difficile:300},difficulty,questionCount:total,bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,weights])),quotas:Object.fromEntries(topics.map((t,i)=>[t,Math.floor(total/topics.length)+(i<total%topics.length?1:0)]))}}
function game(total=33,weights=30,difficulty='misto',custom){return F.Game.start(F.prepare(bank,custom||settings(total,weights,difficulty),()=>.25),{random:()=>.25,now:()=>100})}
function reply(g,correct){g.reveal();g.answer(correct?g.s.current.correct:(g.s.current.correct+1)%4)}
function finishOrdinary(g,correct=false){const n=g.s.config.questionCount;for(let i=0;i<n;i++){reply(g,correct);if(i<n-1)g.next()}}
test('Rules and names: Bullo, Marx and no multiplier',()=>{assert.equal(F.RULES,'19.2.0');assert.equal(F.LABELS.ruba,'Bullo');assert.equal(F.LABELS.marx,'Marx');assert.equal(F.TYPES.length,6);assert.equal(F.VERSION,'2.2.1')});
test('Default settings keep 33 questions and Marx at 15 percent',()=>{
 const cfg=settings();delete cfg.questionCount;delete cfg.bonusWeights.marx;
 const validated=F.config(cfg);assert.equal(validated.questionCount,33);
 assert.equal(validated.bonusWeights.marx,15);
 for(const type of F.TYPES.filter(t=>t!=='marx'))assert.equal(F.DEFAULT_BONUS_WEIGHTS[type],30);
});
test('Restore an existing 2.1.0 game while retaining chosen probabilities and points',()=>{
 const g=game(33,0);g.s.groups[0].score=F.rational(305);
 const saved=g.snapshot();saved.version='2.1.0';saved.rules='19.1.0';saved.config.bonusWeights.marx=30;
 const restored=F.Game.restore(saved);assert.equal(restored.s.version,'2.2.1');
 assert.equal(restored.s.config.bonusWeights.marx,30);assert.equal(F.exact(restored.s.groups[0].score),'305');
});
test('Each Ammo type has its own retro pixel-art sprite',()=>{
 assert.match(html,/assets\/ammo-sprites-48\.png/);
 for(const kind of F.TYPES)assert.match(html,new RegExp('\\[data-ammo="'+kind+'"\\]'));
});
test('New ordinary game starts with 33 questions even when all scores are zero',()=>{
 const g=game(33,0);assert.equal(g.s.phase,'ordinaria');assert.equal(g.s.valid,0);assert.equal(g.s.config.questionCount,33);
 assert.equal(g.s.queue.length,32);assert(g.s.groups.every(group=>F.exact(group.score)==='0'));
 for(let i=0;i<3;i++){reply(g,false);assert.equal(g.s.phase,'ordinaria');assert.equal(g.s.valid,i+1);if(i<2)g.next()}
 assert.equal(g.s.queue.length,30);assert.equal(g.s.tieRound,0);
});
test('Tiebreak requires exhaustion of ordinary questions and ignores difficulty points',()=>{
 const g=game(33,0);for(let i=0;i<33;i++){reply(g,false);if(i<32){assert.equal(g.s.phase,'ordinaria');g.next()}}
 assert.equal(g.s.valid,33);assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieRound,1);
 assert(g.s.groups.every(team=>F.exact(team.score)==='0'));
 for(let i=0;i<3;i++){g.next();const before=g.s.groups.map(team=>F.exact(team.score)).join(',');
  reply(g,true);assert.equal(g.s.result.base,null);assert.equal(g.s.result.gross.n,'0');
  assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieOrder.length,3);
  assert.equal(g.s.groups.map(team=>F.exact(team.score)).join(','),before);
 }
 assert.equal(g.s.tieRound,2);assert.equal(g.s.extra,3);assert(g.s.groups.every(team=>F.exact(team.score)==='0'));
 g.next();reply(g,false);assert.equal(g.s.groups[g.s.respondent].out,true);assert.equal(g.s.phase,'pareggio');
});
test('2.2.0 ordinary saved games restore without resetting their progress',()=>{
 const g=game(33,0);reply(g,true);const saved=g.snapshot();
 saved.version='2.2.0';saved.rules='19.2.0';
 const resumed=F.Game.restore(saved);assert.equal(resumed.s.phase,'ordinaria');
 assert.equal(resumed.s.config.questionCount,33);assert.equal(resumed.s.valid,1);assert.equal(resumed.s.version,'2.2.1');
});
test('3–99 questions: multiples of 3, unique, exact topic quotas',()=>{for(let n=3;n<=99;n+=3){const p=F.prepare(bank,settings(n));assert.equal(p.chosen.length,n);assert.equal(new Set(p.chosen.map(q=>q.id)).size,n);for(const [t,c]of Object.entries(p.config.quotas))assert.equal(p.chosen.filter(q=>q.topic===t).length,c)}});
test('Invalid counts and probabilities are rejected',()=>{for(const n of [0,1,4,100,102,3.5])assert.throws(()=>F.prepare(bank,settings(n)));for(const v of [-1,101,NaN,'30']){const cfg=settings();cfg.bonusWeights.aura=v;assert.throws(()=>F.prepare(bank,cfg))}});
test('Base points stay constant when a group answers correctly again',()=>{const g=game(33,0),first=g.s.order[0];let expected=F.rational(0);for(let n=0;n<4;n++){const q=g.s.current;if(g.s.respondent===first)expected=F.add(expected,F.rational(g.s.config.bases[q.difficulty]));reply(g,true);if(n<3)g.next()}assert.equal(F.exact(g.s.groups[first].score),F.exact(expected));assert.equal(g.s.groups[first].streak,undefined)});
test('Bullo divides only base points',()=>{const g=game(33,0),receiver=g.s.respondent,beneficiary=g.s.order[1],amount=g.s.config.bases[g.s.current.difficulty];g.s.effects.push({id:g.uid(),type:'ruba',source:beneficiary,target:receiver});reply(g,true);assert.equal(F.exact(g.s.groups[receiver].score),F.exact(F.rational(BigInt(amount),2n)));assert.equal(F.exact(g.s.groups[beneficiary].score),F.exact(F.rational(BigInt(amount),2n)))});
test('Marx redistributes all accumulated points exactly without rounding',()=>{const g=game(33,0);g.s.groups.forEach((team,i)=>team.score=F.rational([101,200,1][i]));const owner=g.s.respondent;const copy={id:g.uid(),type:'marx',target:null,origin:'test'};g.s.groups[owner].inventory.push(copy);g.use(copy.id,null);for(const team of g.s.groups)assert.equal(F.exact(team.score),'302/3');assert.equal(g.s.groups[owner].inventory.length,0);assert(g.s.events.some(e=>e.type==='marx-redistribution'));F.Game.restore(g.snapshot())});
test('Marx excludes eliminated teams and ignores Aura while keeping history',()=>{const g=game(33,0);g.s.groups[0].score=F.rational(101);g.s.groups[1].score=F.rational(200);g.s.groups[2].score=F.rational(999);g.eliminate(2,'Tre sanzioni');g.s.groups[1].aura=g.s.turn;const copy={id:g.uid(),type:'marx',target:null,origin:'test'};g.s.groups[g.s.respondent].inventory.push(copy);g.use(copy.id,null);assert.equal(F.exact(g.s.groups[0].score),'301/2');assert.equal(F.exact(g.s.groups[1].score),'301/2');assert.equal(F.exact(g.s.groups[2].score),'999');assert.equal(g.s.groups[1].aura,g.s.turn);F.Game.restore(g.snapshot())});
test('Marx awards at 100% and preserved probability is added to previous save formats',()=>{const g=game(33,100);reply(g,true);assert(g.s.result.bonuses.some(b=>b.type==='marx'));const saved=g.snapshot();saved.version='2.0.0';saved.rules='19.0.0';delete saved.config.bonusWeights.marx;const restored=F.Game.restore(saved);assert.equal(restored.s.config.bonusWeights.marx,15);assert.equal(restored.s.version,'2.2.1');assert.equal(restored.s.rules,'19.2.0')});
test('Independent bonus awards',()=>{for(const chance of [0,100]){const g=game(33,chance);reply(g,true);assert.equal(g.s.result.bonuses.length,chance===100?6:0);F.Game.restore(g.snapshot())}});
test('At the end of ordinary questions a single score leader wins without a tie',()=>{const g=game(3,0);reply(g,true);g.next();reply(g,false);g.next();reply(g,false);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[0])});
test('Only the top-score tied groups enter the elimination tie-break',()=>{const cfg=settings(3,0);cfg.bases={facile:100,media:100,difficile:100};const g=game(3,0,'misto',cfg);reply(g,true);g.next();reply(g,true);g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieOrder.length,2);assert.equal(g.s.groups[g.s.order[2]].out,true);g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[1])});
test('Last group gets its question even when first two are eliminated',()=>{const g=game(3,0);finishOrdinary(g);assert.equal(g.s.phase,'pareggio');g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[2])});
test('All groups wrong in tie-break yields Game Over only after last answer',()=>{const g=game(3,0);finishOrdinary(g);for(let i=0;i<3;i++){g.next();reply(g,false);if(i<2)assert.equal(g.s.phase,'pareggio')}assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,null)});
test('A complete successful tie round repeats with no duplicated questions or difficulty restriction',()=>{const cfg=settings(3,0,'facile');const g=game(3,0,'facile',cfg);finishOrdinary(g);const original=new Set(g.s.seen);assert(g.available().some(q=>q.difficulty!=='facile'));for(let i=0;i<3;i++){g.next();assert(!original.has(g.s.current.id));const id=g.s.current.id;reply(g,true);original.add(id)}assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieRound,2);assert.equal(g.s.tieIndex,-1);F.Game.restore(g.snapshot())});
test('Ninety-nine questions transition to tie-break only at 99',()=>{const g=game(99,0);for(let i=0;i<99;i++){reply(g,false);if(i<98){assert.equal(g.s.phase,'ordinaria');g.next()}}assert.equal(g.s.valid,99);assert.equal(g.s.phase,'pareggio');F.Game.restore(g.snapshot())});
test('Save and resume during tie-break preserves elimination and timer',()=>{const g=game(3,0);finishOrdinary(g);g.next();reply(g,false);const s=g.snapshot(),r=F.Game.restore(s);assert.equal(r.s.phase,'pareggio');assert.equal(r.s.tieIndex,0);assert.equal(r.s.groups[g.s.order[0]].out,true);r.next();assert.equal(r.s.respondent,g.s.order[1]);F.Game.restore(r.snapshot())});
test('Previous ordinary saves can be migrated without changing scores',()=>{const g=game(33,0);reply(g,true);const s=g.snapshot();s.version='1.2.0';s.rules='18.2.0';s.groups[0].streak=1;s.drawWins=[0,0,0];const r=F.Game.restore(s);assert.equal(r.s.phase,'ordinaria');assert.equal(r.s.version,'2.2.1');assert.equal(r.s.groups[0].streak,undefined);assert.equal(F.exact(r.s.groups[g.s.respondent].score),F.exact(g.s.groups[g.s.respondent].score))});
test('Two disciplinary eliminations immediately award the remaining team',()=>{const g=game();g.openSanctions();g.s.panel.counts=[3,3,0];g.closeSanctions(true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,2)});
test('One unblocked attack transforms one Karma only, preserving the remaining copies',()=>{
 const g=game(),target=g.s.order[1],source=g.s.owner,items=[0,1,2].map(()=>({id:g.uid(),type:'karma',target:null,origin:'test'}));
 g.s.groups[target].inventory.push(...items);g.attack('ruba',source,target,g.uid());
 assert.equal(g.s.groups[target].inventory.filter(c=>c.type==='karma').length,2);
 assert.equal(items[0].type,'ruba');assert.equal(items[0].target,source);
 g.attack('salta',source,target,g.uid());assert.equal(items[1].type,'salta');assert.equal(items[2].type,'karma');
 F.Game.restore(g.snapshot());
});
test('An Aura-blocked attack leaves every Karma unchanged',()=>{
 const g=game(),target=g.s.order[1];g.s.groups[target].aura=g.s.turn;
 const karma={id:g.uid(),type:'karma',target:null,origin:'test'};g.s.groups[target].inventory.push(karma);
 assert.equal(g.attack('ruba',g.s.owner,target,g.uid()),false);assert.equal(karma.type,'karma');assert.equal(g.s.effects.length,0);
});
test('Marx changes points while leaving other players Aura and Karma untouched',()=>{
 const g=game(),owner=g.s.owner,target=g.s.order[1];g.s.groups[owner].score=F.rational(90);g.s.groups[target].aura=g.s.turn;
 g.s.groups[target].inventory.push({id:g.uid(),type:'karma',target:null,origin:'test'},{id:g.uid(),type:'karma',target:null,origin:'test'});
 const marx={id:g.uid(),type:'marx',target:null,origin:'test'};g.s.groups[owner].inventory.push(marx);g.use(marx.id,null);
 assert(g.s.groups.every(team=>F.exact(team.score)==='30'));assert.equal(g.s.groups[target].aura,g.s.turn);assert(g.s.groups[target].inventory.every(c=>c.type==='karma'));F.Game.restore(g.snapshot());
});
test('Answered questions retain their displayed option order for read-only review and restore',()=>{
 const g=game(),q=copy(g.s.current);reply(g,false);const e=g.s.events.find(e=>e.outcome);assert.deepEqual(copy(e.question),q);
 assert.equal(e.question.options[e.outcome.option],q.options[(q.correct+1)%4]);g.next();const r=F.Game.restore(g.snapshot());assert.deepEqual(copy(r.s.events.find(e=>e.outcome).question),q);
});
test('Scientific notation uses fractions and subscripts without altering saved question strings',()=>{
 const value='ΔT = Q/(mc), Q1 + Q2 = 0, L0 e V0';const parts=F.scienceParts(value);assert(parts.some(p=>p.math===String.raw`\Delta T=\frac{Q}{m\,c}`));assert(parts.some(p=>p.math==='Q_1+Q_2=0'));assert.equal(value,'ΔT = Q/(mc), Q1 + Q2 = 0, L0 e V0');
});
