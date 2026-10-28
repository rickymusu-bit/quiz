'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../assets/js/engine.js'),{createTracker,DURATION}=require('../assets/hell-tie.js');
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const entry=JSON.parse(fs.readFileSync(path.join(root,'datasets.json'))).banche[0];
const bank=F.parseDataset(fs.readFileSync(path.join(root,entry.url),'utf8')).bank;
function game(){return F.Game.start(F.prepare(bank,{names:['A','B','C'],seconds:45,bases:{facile:100,media:100,difficile:100},difficulty:'misto',questionCount:3,bonusWeights:Object.fromEntries(F.TYPES.map(k=>[k,0])),quotas:Object.fromEntries([...new Set(bank.map(q=>q.topic))].map((k,i)=>[k,i?0:3]))},()=>.25),{random:()=>.25,now:()=>100});}
function answer(g,correct=false){g.reveal();g.answer(correct?g.s.current.correct:(g.s.current.correct+1)%4);}
function ordinary(g,t){t.sync(g.s);for(let i=0;i<3;i++){answer(g);t.sync(g.s);if(i<2){g.next();t.sync(g.s);}}}
test('Only an observed ordinary-to-tie transition arms an intro; the last result waits for Next',()=>{
 const g=game(),t=createTracker();t.sync(g.s);assert(!t.sample().waiting);assert(!t.begin(g.s));ordinary(g,t);
 assert(t.sample().waiting);assert(!t.sample().blocking);const before=JSON.stringify(g.snapshot());
 assert(t.begin(g.s));assert(!t.begin(g.s));t.advance(1,{captures:true});assert.equal(t.sample().elapsed,0);
 t.advance(.5);t.sync(g.s);assert.equal(t.sample().elapsed,.5);t.togglePause();t.advance(5);assert.equal(t.sample().elapsed,.5);
 t.togglePause();t.advance(DURATION.intro);assert(!t.sample().blocking);assert(t.takeCompletion());assert.equal(t.takeCompletion(),null);
 assert.equal(JSON.stringify(g.snapshot()),before,'Presentation never writes the engine or advances a question');
});
test('A restored tie skips historical intros; reduced motion waits for an accessible continuation',()=>{
 const g=game(),t=createTracker();ordinary(g,t);const restored=createTracker();restored.sync(g.s);assert(!restored.sample().waiting);assert(!restored.begin(g.s));
 t.begin(g.s);t.advance(60,{reduced:true});assert(t.sample().blocking);t.skip(true);assert(t.sample().blocking,'Capture cannot be skipped');t.skip(false);assert(t.takeCompletion());
});
test('Each wrong tie answer has one notice; remaining players still answer and successful rounds use a short intro',()=>{
 const g=game(),t=createTracker();ordinary(g,t);t.begin(g.s);t.skip();t.takeCompletion();
 for(let i=0;i<3;i++){g.next();t.sync(g.s);answer(g,true);t.sync(g.s);}
 assert.equal(g.s.tieRound,2);assert(t.begin(g.s));assert.equal(t.sample().kind,'round');t.advance(DURATION.round);t.takeCompletion();
 g.next();t.sync(g.s);answer(g);t.sync(g.s);assert.equal(t.sample().kind,'elimination');const index=t.sample().index;
 t.advance(.5);t.sync(g.s);assert.equal(t.sample().elapsed,.5);assert.equal(t.sample().index,index);
 t.advance(DURATION.elimination);assert(!t.sample().blocking);assert.equal(g.s.phase,'pareggio');g.next();t.sync(g.s);assert.notEqual(g.s.respondent,index);
 const before=JSON.stringify(g.snapshot());t.advance(5);assert.equal(JSON.stringify(g.snapshot()),before);
});
test('A unique score leader never triggers a tie intro',()=>{
 const g=game(),t=createTracker();t.sync(g.s);for(let i=0;i<3;i++){answer(g,i===0);t.sync(g.s);if(i<2){g.next();t.sync(g.s);}}
 assert.equal(g.s.phase,'conclusa');assert(!t.begin(g.s));assert(!t.sample().waiting);
});
