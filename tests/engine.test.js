'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'Fool.html'),'utf8')+fs.readFileSync(path.join(root,'assets/css/game.css'),'utf8')+fs.readFileSync(path.join(root,'assets/js/ui.js'),'utf8');
const F=require('../assets/js/engine.js');
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'datasets.json'),'utf8'));
const thermal=catalogue.banche.find(x=>x.id==='termologia');assert(thermal);
const bank=F.parseDataset(fs.readFileSync(path.join(root,thermal.url),'utf8')).bank,copy=x=>JSON.parse(JSON.stringify(x));
function settings(total=33,weights=30,difficulty='misto'){const topics=[...new Set(bank.map(q=>q.topic))];return {names:['A','B','C'],seconds:45,bases:{facile:100,media:200,difficile:300},difficulty,questionCount:total,bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,weights])),quotas:Object.fromEntries(topics.map((t,i)=>[t,Math.floor(total/topics.length)+(i<total%topics.length?1:0)]))}}
function game(total=33,weights=30,difficulty='misto',custom){return F.Game.start(F.prepare(bank,custom||settings(total,weights,difficulty),()=>.25),{random:()=>.25,now:()=>100})}
function reply(g,correct){g.reveal();g.answer(correct?g.s.current.correct:(g.s.current.correct+1)%4)}
function finishOrdinary(g,correct=false){const n=g.s.config.questionCount;for(let i=0;i<n;i++){reply(g,correct);if(i<n-1)g.next()}}

test('Malocchio bypasses a pending Catene once but the skipped ordinary turn remains queued',()=>{
 const g=game(33,0),[source,target,next]=g.s.order;
 g.attack('salta',source,target,g.uid());
 const c={id:g.uid(),type:'svela',target:null,origin:'test'};
 g.s.groups[source].inventory.push(c);
 g.use(c.id,null);g.pass(target);
 assert.equal(g.s.respondent,target);
 assert.equal(g.s.effects.filter(e=>e.type==='salta'&&e.target===target).length,1);
 g.answer(g.s.current.correct);
 assert.equal(g.s.valid,1);
 g.next();assert.equal(g.s.respondent,next);
 reply(g,false);g.next();assert.equal(g.s.respondent,source);
 reply(g,false);g.next();assert.equal(g.s.respondent,next);
 assert.equal(g.s.effects.filter(e=>e.type==='salta'&&e.target===target).length,0);
 assert.equal(g.s.valid,3);
 F.Game.restore(g.snapshot());
});
test('Rules and names: Tributo, Livella and no multiplier',()=>{assert.equal(F.RULES,'22.0.0');assert.equal(F.LABELS.ruba,'Tributo');assert.equal(F.LABELS.marx,'Livella');assert.equal(F.TYPES.length,9);assert.equal(F.VERSION,'2.5.0')});
test('Six unique junkpunk vehicles and backward-compatible legacy games',()=>{
 const cfg=settings();
 const selected=['ape','chopper','truck'];
 assert.deepEqual(Array.from(F.config({...cfg,vehicles:selected}).vehicles),selected);
 assert.throws(()=>F.config({...cfg,vehicles:['ape','ape','truck']}),/tre veicoli diversi/);
 assert.throws(()=>F.config({...cfg,vehicles:['motorcross','chopper','truck']}),/tre veicoli diversi/);
 assert.equal(F.config(cfg).vehicles,undefined);
 assert.match(fs.readFileSync(path.join(root,'assets/hell-race.js'),'utf8'),/vehicles-drive-v1\.webp/);
 assert.match(html,/vehicle-chooser/);
});

test('Default settings keep 33 questions and Livella at 15 percent',()=>{
 const cfg=settings();delete cfg.questionCount;delete cfg.bonusWeights.marx;
 const validated=F.config(cfg);assert.equal(validated.questionCount,33);
 assert.equal(validated.bonusWeights.marx,15);
 for(const type of F.TYPES.filter(t=>!['marx','ira','antisigillo','sacrificio'].includes(t)))assert.equal(F.DEFAULT_BONUS_WEIGHTS[type],30);
});
test('Restore an existing 2.1.0 game while retaining chosen probabilities and points',()=>{
 const g=game(33,0);g.s.groups[0].score=F.rational(305);
 const saved=g.snapshot();saved.version='2.1.0';saved.rules='19.1.0';saved.config.bonusWeights.marx=30;
 const restored=F.Game.restore(saved);assert.equal(restored.s.version,F.VERSION);
 assert.equal(restored.s.config.bonusWeights.marx,30);assert.equal(F.exact(restored.s.groups[0].score),'305');
});
test('Each Ammo type has its own distinct high-resolution artifact',()=>{
 assert.match(html,/ammo-relics-v1\.webp/);
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
 g.next();reply(g,false);assert.equal(F.remainingLives(g.s,g.s.respondent),2);assert.equal(g.s.phase,'pareggio');
});
test('2.2.0 ordinary saved games restore without resetting their progress',()=>{
 const g=game(33,0);reply(g,true);const saved=g.snapshot();
 saved.version='2.2.0';saved.rules='19.2.0';
 const resumed=F.Game.restore(saved);assert.equal(resumed.s.phase,'ordinaria');
 assert.equal(resumed.s.config.questionCount,33);assert.equal(resumed.s.valid,1);assert.equal(resumed.s.version,F.VERSION);
});
test('3–99 questions: multiples of 3, unique, exact topic quotas',()=>{for(let n=3;n<=99;n+=3){const p=F.prepare(bank,settings(n));assert.equal(p.chosen.length,n);assert.equal(new Set(p.chosen.map(q=>q.id)).size,n);for(const [t,c]of Object.entries(p.config.quotas))assert.equal(p.chosen.filter(q=>q.topic===t).length,c)}});
test('Invalid counts and probabilities are rejected',()=>{for(const n of [0,1,4,100,102,3.5])assert.throws(()=>F.prepare(bank,settings(n)));for(const v of [-1,101,NaN,'30']){const cfg=settings();cfg.bonusWeights.aura=v;assert.throws(()=>F.prepare(bank,cfg))}});
test('Base points stay constant when a group answers correctly again',()=>{const g=game(33,0),first=g.s.order[0];let expected=F.rational(0);for(let n=0;n<4;n++){const q=g.s.current;if(g.s.respondent===first)expected=F.add(expected,F.rational(g.s.config.bases[q.difficulty]));reply(g,true);if(n<3)g.next()}assert.equal(F.exact(g.s.groups[first].score),F.exact(expected));assert.equal(g.s.groups[first].streak,undefined)});
test('Livella redistributes all accumulated points exactly without rounding',()=>{const g=game(33,0);g.s.groups.forEach((team,i)=>team.score=F.rational([101,200,1][i]));const owner=g.s.respondent;const copy={id:g.uid(),type:'marx',target:null,origin:'test'};g.s.groups[owner].inventory.push(copy);g.use(copy.id,null);for(const team of g.s.groups)assert.equal(F.exact(team.score),'302/3');assert.equal(g.s.groups[owner].inventory.length,0);assert(g.s.events.some(e=>e.type==='marx-redistribution'));F.Game.restore(g.snapshot())});
test('Livella excludes eliminated teams and ignores Sigillo while keeping history',()=>{const g=game(33,0);g.s.groups[0].score=F.rational(101);g.s.groups[1].score=F.rational(200);g.s.groups[2].score=F.rational(999);g.eliminate(2,'Tre sanzioni');g.s.groups[1].aura=g.s.turn;const copy={id:g.uid(),type:'marx',target:null,origin:'test'};g.s.groups[g.s.respondent].inventory.push(copy);g.use(copy.id,null);assert.equal(F.exact(g.s.groups[0].score),'301/2');assert.equal(F.exact(g.s.groups[1].score),'301/2');assert.equal(F.exact(g.s.groups[2].score),'999');assert.equal(g.s.groups[1].aura,g.s.turn);F.Game.restore(g.snapshot())});
test('Livella awards at 100% and preserved probability is added to previous save formats',()=>{const g=game(33,100);reply(g,true);assert(g.s.result.bonuses.some(b=>b.type==='marx'));const saved=g.snapshot();saved.version='2.0.0';saved.rules='19.0.0';delete saved.config.bonusWeights.marx;const restored=F.Game.restore(saved);assert.equal(restored.s.config.bonusWeights.marx,15);assert.equal(restored.s.version,F.VERSION);assert.equal(restored.s.rules,F.RULES)});
test('Independent bonus awards',()=>{for(const chance of [0,100]){const g=game(33,chance);reply(g,true);assert.equal(g.s.result.bonuses.length,chance===100?9:0);F.Game.restore(g.snapshot())}});
test('At the end of ordinary questions a single score leader wins without a tie',()=>{const g=game(3,0);reply(g,true);g.next();reply(g,false);g.next();reply(g,false);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[0])});
test('Only the top-score tied groups enter the elimination tie-break',()=>{const cfg=settings(3,0);cfg.bases={facile:100,media:100,difficile:100};const g=game(3,0,'misto',cfg);g.s.groups.forEach(t=>t.damage=2);reply(g,true);g.next();reply(g,true);g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieOrder.length,2);assert.equal(g.s.groups[g.s.order[2]].out,true);g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[1])});
test('Last group gets its question even when first two are eliminated',()=>{const g=game(3,0);g.s.groups.forEach(t=>t.damage=2);finishOrdinary(g);assert.equal(g.s.phase,'pareggio');g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,false);assert.equal(g.s.phase,'pareggio');g.next();reply(g,true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,g.s.order[2])});
test('All groups wrong in tie-break yields Game Over only after last answer',()=>{const g=game(3,0);g.s.groups.forEach(t=>t.damage=2);finishOrdinary(g);for(let i=0;i<3;i++){g.next();reply(g,false);if(i<2)assert.equal(g.s.phase,'pareggio')}assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,null)});
test('A complete successful Ultimo Miglio round uses unseen difficult questions',()=>{const cfg=settings(3,0,'facile');const g=game(3,0,'facile',cfg);finishOrdinary(g);const original=new Set(g.s.seen);assert(g.available().every(q=>q.difficulty==='difficile'));for(let i=0;i<3;i++){g.next();assert.equal(g.s.current.difficulty,'difficile');assert(!original.has(g.s.current.id));const id=g.s.current.id;reply(g,true);original.add(id)}assert.equal(g.s.phase,'pareggio');assert.equal(g.s.tieRound,2);assert.equal(g.s.tieIndex,-1);F.Game.restore(g.snapshot())});
test('Ninety-nine questions transition to tie-break only at 99',()=>{const g=game(99,0);for(let i=0;i<99;i++){reply(g,false);if(i<98){assert.equal(g.s.phase,'ordinaria');g.next()}}assert.equal(g.s.valid,99);assert.equal(g.s.phase,'pareggio');F.Game.restore(g.snapshot())});
test('Save and resume during tie-break preserves elimination and timer',()=>{const g=game(3,0);g.s.groups.forEach(t=>t.damage=2);finishOrdinary(g);g.next();reply(g,false);const s=g.snapshot(),r=F.Game.restore(s);assert.equal(r.s.phase,'pareggio');assert.equal(r.s.tieIndex,0);assert.equal(r.s.groups[g.s.order[0]].out,true);r.next();assert.equal(r.s.respondent,g.s.order[1]);F.Game.restore(r.snapshot())});
test('Previous ordinary saves can be migrated without changing scores',()=>{const g=game(33,0);reply(g,true);const s=g.snapshot();s.version='1.2.0';s.rules='18.2.0';s.groups[0].streak=1;s.drawWins=[0,0,0];const r=F.Game.restore(s);assert.equal(r.s.phase,'ordinaria');assert.equal(r.s.version,F.VERSION);assert.equal(r.s.groups[0].streak,undefined);assert.equal(F.exact(r.s.groups[g.s.respondent].score),F.exact(g.s.groups[g.s.respondent].score))});
test('Two disciplinary eliminations immediately award the remaining team',()=>{const g=game();g.openSanctions();g.s.panel.counts=[3,3,0];g.closeSanctions(true);assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,2)});
test('One unblocked attack transforms one Contrappasso only, preserving the remaining copies',()=>{
 const g=game(),target=g.s.order[1],source=g.s.owner,items=[0,1,2].map(()=>({id:g.uid(),type:'karma',target:null,origin:'test'}));
 g.s.groups[target].inventory.push(...items);g.attack('ruba',source,target,g.uid());
 assert.equal(g.s.groups[target].inventory.filter(c=>c.type==='karma').length,2);
 assert.equal(items[0].type,'ruba');assert.equal(items[0].target,source);
 g.attack('salta',source,target,g.uid());assert.equal(items[1].type,'salta');assert.equal(items[2].type,'karma');
 F.Game.restore(g.snapshot());
});
test('An Sigillo-blocked attack leaves every Contrappasso unchanged',()=>{
 const g=game(),target=g.s.order[1];g.s.groups[target].aura=g.s.turn;
 const karma={id:g.uid(),type:'karma',target:null,origin:'test'};g.s.groups[target].inventory.push(karma);
 assert.equal(g.attack('ruba',g.s.owner,target,g.uid()),false);assert.equal(karma.type,'karma');assert.equal(g.s.effects.length,0);
});
test('Livella changes points while leaving other players Sigillo and Contrappasso untouched',()=>{
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
test('Ultimo Miglio preserves sanctions and removes one remaining life per error',()=>{
 const g=game(3,0);g.s.groups.forEach((team,i)=>team.sanctions=i);finishOrdinary(g);
 assert.deepEqual(g.s.groups.map((team,i)=>F.remainingLives(g.s,i)),[3,2,1]);
 g.next();const loser=g.s.respondent,before=F.remainingLives(g.s,loser);reply(g,false);
 assert.equal(F.remainingLives(g.s,loser),before-1);assert.equal(g.s.groups[loser].out,before===1);
 const restored=F.Game.restore(g.snapshot());assert.deepEqual(restored.s.groups,g.s.groups);
});
test('Only tied leaders retain their residual hearts',()=>{
 const cfg=settings(3,0);cfg.bases={facile:100,media:100,difficile:100};const g=game(3,0,'misto',cfg);reply(g,true);g.next();reply(g,true);g.next();reply(g,false);
 assert.equal(g.s.phase,'pareggio');for(const i of g.s.order)assert.equal(F.remainingLives(g.s,i),g.s.tieOrder.includes(i)?3:0);
});
test('Removed refusal methods are unavailable and pending legacy requests restore the same question',()=>{
 const g=game();assert.equal(g.refuse,undefined);assert.equal(g.decideRefusal,undefined);g.reveal();const saved=g.snapshot(),id=saved.current.id,remaining=saved.remaining;
 saved.panel={type:'refusal',from:'answer',wasRunning:true,reason:'non svolto'};const r=F.Game.restore(saved);
 assert.equal(r.s.panel,null);assert.equal(r.s.current.id,id);assert.equal(r.s.remaining,remaining);assert.equal(r.s.paused,true);assert.equal(r.running,false);assert.equal(r.s.valid,0);
});

test('Timer preserves exact remaining time across pause and restored games, then expires once',()=>{
 let now=100;const g=game(33,0);g.now=()=>now;g.reveal();
 now+=1234;g.pause();assert.equal(g.left(),45000-1234);
 now+=9000;assert.equal(g.left(),45000-1234);
 const saved=g.snapshot(),restored=F.Game.restore(saved,{now:()=>now});
 assert.equal(restored.running,false);assert.equal(restored.left(),45000-1234);
 restored.resume();now+=45000-1234;restored.tick();
 assert.equal(restored.s.screen,'result');assert.equal(restored.s.result.option,null);
 assert.equal(restored.s.valid,1);restored.tick();assert.equal(restored.s.valid,1);
});

function wrath(g){const item={id:g.uid(),type:'ira',target:null,origin:'test'};g.s.groups[g.s.owner].inventory.push(item);return item}
test('Flagello defaults to 5 percent, with an independent exact threshold',()=>{
 for(const [random,awarded] of [[.049,true],[.05,false]]){const cfg=settings(33,0);delete cfg.bonusWeights.ira;const g=game(33,0,'misto',cfg);g.random=()=>random;reply(g,true);assert.equal(g.s.config.bonusWeights.ira,5);assert.equal(g.s.result.bonuses.some(c=>c.type==='ira'),awarded);assert.equal(g.s.result.bonuses.length,Number(awarded));}
});
test('Flagello hits everyone, preserves active seals and destroys inventories and low scores',()=>{
 const g=game(33,0),owner=g.s.owner;g.s.groups.forEach((team,i)=>{team.score=F.rational(i+1,3);team.aura=g.s.turn;team.inventory.push({id:g.uid(),type:'karma',target:null,origin:'test'})});const before=g.s.groups.map(t=>F.exact(t.score));const item=wrath(g);g.use(item.id,null);
 assert.deepEqual(g.s.groups.map((t,i)=>F.remainingLives(g.s,i)),[2,2,2]);assert.deepEqual(g.s.groups.map(t=>t.sanctions),[0,0,0]);assert.deepEqual(g.s.groups.map(t=>F.exact(t.score)),['0','0','0']);assert(g.s.groups.every(t=>t.aura===g.s.turn&&t.inventory.length===0));assert.equal(g.s.owner,owner);F.Game.restore(g.snapshot());
});
test('Three uses remove all players simultaneously with no premature winner',()=>{
 const g=game(33,0);for(let n=0;n<3;n++){const item=wrath(g);g.use(item.id,null);if(n<2)assert.equal(g.s.phase,'ordinaria')}
 assert.equal(g.s.phase,'conclusa');assert.equal(g.s.winner,null);assert(g.s.groups.every(t=>t.out));F.Game.restore(g.snapshot());
});
test('A self-eliminating Flagello cancels an open question and advances safely',()=>{
 const g=game(33,0),owner=g.s.owner;g.s.groups[owner].sanctions=2;const item=wrath(g);g.reveal();const question=g.s.current.id;g.use(item.id,null);
 assert(g.s.groups[owner].out);assert.notEqual(g.s.respondent,owner);assert.equal(g.s.screen,'hidden');assert.equal(g.s.valid,0);assert(g.s.cancelled.includes(question));assert.equal(g.running,false);F.Game.restore(g.snapshot());
});
test('Flagello awards the sole survivor after every victim has been processed',()=>{
 const g=game(33,0),winner=g.s.order[2];g.s.groups.forEach(t=>t.sanctions=2);g.s.groups[winner].sanctions=0;const item=wrath(g);g.use(item.id,null);assert.equal(g.s.winner,winner);assert.equal(g.s.phase,'conclusa');assert.equal(F.remainingLives(g.s,winner),2);F.Game.restore(g.snapshot());
});
test('Flagello skips eliminated players and damage combines with later sanctions',()=>{
 const g=game(33,0),owner=g.s.owner,dead=g.s.order[2];g.eliminate(dead,'test');let item=wrath(g);g.use(item.id,null);assert.equal(g.s.groups[dead].damage,0);assert.equal(g.s.groups[owner].sanctions,0);g.openSanctions();g.s.panel.counts[owner]=2;g.closeSanctions(true);assert(g.s.groups[owner].out);assert.equal(g.s.groups[owner].sanctions,2);assert.equal(g.s.groups[owner].damage,1);F.Game.restore(g.snapshot());
});
test('Legacy 2.2.1 saves gain the new Ammo without changing lives, points or chosen settings',()=>{
 const g=game(33,0);g.s.groups[0].sanctions=1;g.s.groups[0].score=F.rational(100,3);const save=g.snapshot();save.version='2.2.1';save.rules='19.2.0';delete save.config.bonusWeights.ira;for(const team of save.groups)delete team.damage;
 const r=F.Game.restore(save);assert.equal(r.s.config.bonusWeights.ira,5);assert.equal(r.s.config.bonusWeights.marx,0);assert.equal(F.remainingLives(r.s,0),2);assert.equal(F.exact(r.s.groups[0].score),'100/3');assert(r.s.groups.every(t=>t.damage===0));
});
test('Persisted Ira damage survives restore and rejects malformed life counters',()=>{
 const g=game(33,0),item=wrath(g);g.use(item.id,null);const saved=g.snapshot();const r=F.Game.restore(saved);assert(r.s.groups.every(t=>t.damage===1));
 for(const value of [undefined,-1,null,1.5,4]){const bad=copy(saved);bad.groups[0].damage=value;assert.throws(()=>F.Game.restore(bad));}
 const bad=copy(saved);bad.groups[0].damage=3;assert.throws(()=>F.Game.restore(bad));
});
test('Ultimo Miglio preserves ordinary damage and forbids Ammo',()=>{
 const g=game(3,0),item=wrath(g);g.use(item.id,null);finishOrdinary(g);assert.equal(g.s.phase,'pareggio');assert(g.s.groups.every(t=>t.damage===1));assert.deepEqual(g.s.groups.map((t,i)=>F.remainingLives(g.s,i)),[2,2,2]);g.next();const illegal=wrath(g);assert.throws(()=>g.use(illegal.id,null));g.s.groups[g.s.owner].inventory=[];F.Game.restore(g.snapshot());
});
test('Flagello has no target and validates before consuming a copy',()=>{const g=game(33,0),item=wrath(g);assert.throws(()=>g.use(item.id,g.s.order[1]));assert(g.s.groups[g.s.owner].inventory.some(c=>c.id===item.id));assert(g.s.groups.every(t=>t.damage===0));});

test('A sanction always removes exactly one life, including the last tie-break heart',()=>{
 const g=game(3,0);g.s.groups.forEach(t=>t.damage=2);finishOrdinary(g);g.next();const owner=g.s.respondent;assert.equal(F.remainingLives(g.s,owner),1);g.openSanctions();g.s.panel.counts[owner]=1;g.closeSanctions(true);assert.equal(F.remainingLives(g.s,owner),0);assert(g.s.groups[owner].out);assert.equal(g.s.groups[owner].sanctions,1);F.Game.restore(g.snapshot());
});
