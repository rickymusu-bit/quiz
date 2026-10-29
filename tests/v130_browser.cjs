'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/v130');fs.mkdirSync(out,{recursive:true});
(async()=>{
  const server=http.createServer((req,res)=>{
    try{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith('/'))file+='index.html';
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
    }catch{res.writeHead(404).end();}
  });await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  const report={revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),checks:[],screenshots:[],errors:[]};
  try{
    for(const [width,height,dpr] of [[1440,1080,1],[390,844,2],[844,390,2]]){
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});page.on('pageerror',e=>report.errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);await page.getByRole('button',{name:/Inizia partita/}).click();
      await page.waitForFunction(()=>FoolEnding.prepare(FoolEnding.load(()=>{}))&&FoolPortal.load()?.complete);
      await page.evaluate(()=>document.fonts.ready);await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));
      async function reset(){await page.evaluate(()=>{
        const old=HellscapeUI.game,F=Fool,c={...old.s.config,questionCount:3,seconds:45,difficulty:'facile',quotas:{...old.s.config.quotas},bonusWeights:Object.fromEntries(F.TYPES.map(t=>[t,0]))};
        Object.keys(c.quotas).forEach((k,i)=>c.quotas[k]=i?0:3);
        const g=F.Game.start(F.prepare(old.s.bank,c,()=>.25),{random:()=>.25});g.s.id+='-v130-'+(++window.__v130Serial|| (window.__v130Serial=1));
        HellscapeUI.game=g;HellscapeUI.changed();
      });await page.clock.runFor(100);}
      async function shot(name){const file=`${name}-${width}x${height}-dpr${dpr}.png`;await page.screenshot({path:path.join(out,file)});report.screenshots.push({file,viewport:[width,height],dpr});console.log("Screenshot:",file);}
      await reset();await page.clock.runFor(500);await shot('ordinary');
      const raster=await page.locator('.hell-race canvas').evaluate(c=>({width:c.width,height:c.height,css:c.getBoundingClientRect().width,smoothing:c.getContext('2d').imageSmoothingEnabled}));
      assert(raster.width>=512&&raster.width<=1536);assert(raster.smoothing);assert(Math.abs(raster.width/raster.height-4/3)<.005);
      // Malocchio is exercised through the real inventory and confirmation UI.
      await page.evaluate(()=>{const g=HellscapeUI.game;g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'svela',target:null,origin:'browser'});HellscapeUI.changed();});await page.clock.runFor(100);
      await page.getByRole('button',{name:'Inventario',exact:true}).click();await page.locator('#dialog [data-ammo="svela"]').click();await page.locator('#ammo-info').getByRole('button',{name:'Usa',exact:true}).click();await page.locator('#dialog').getByRole('button',{name:'Conferma uso',exact:true}).click();
      await page.clock.runFor(2500);assert.equal(await page.locator('.answers,.answer').count(),0);assert.equal(await page.locator('.question').count(),1);assert.match(await page.locator('.question-points').innerText(),/100 punti/);
      const held=await page.evaluate(()=>HellscapeUI.game.left());await page.keyboard.press('a');await page.keyboard.press('Enter');await page.clock.runFor(2000);
      assert.equal(await page.evaluate(()=>HellscapeUI.game.s.screen),'choice');assert.equal(await page.evaluate(()=>HellscapeUI.game.left()),held);
      const q=await page.evaluate(()=>HellscapeUI.game.s.current.options);const accessible=await page.locator('.operation-body').ariaSnapshot();q.forEach(option=>assert(!accessible.includes(option)));
      await shot('malocchio');const target=await page.evaluate(()=>HellscapeUI.game.s.order[1]);await page.getByRole('button',{name:await page.evaluate(i=>'Passa a '+HellscapeUI.game.s.groups[i].name,target),exact:true}).click();
      await page.clock.runFor(100);assert.equal(await page.locator('.answer').count(),4);assert(await page.evaluate(()=>HellscapeUI.game.running));assert.equal(await page.evaluate(()=>HellscapeUI.game.s.respondent),target);
      await reset();
      // Antisigillo UI offers only active protected opponents.
      await page.evaluate(()=>{const g=HellscapeUI.game;g.s.groups[g.s.order[1]].aura=g.s.turn;g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'antisigillo',target:null,origin:'browser'});HellscapeUI.changed();});await page.clock.runFor(100);
      await page.getByRole('button',{name:'Inventario',exact:true}).click();await page.locator('#dialog [data-ammo="antisigillo"]').click();await shot('antisigillo');
      await page.locator('#ammo-info').getByRole('button',{name:'Usa',exact:true}).click();assert.equal(await page.locator('#bonus-target option').count(),1);await page.locator('#dialog').getByRole('button',{name:'Conferma uso',exact:true}).click();
      assert.equal(await page.evaluate(()=>HellscapeUI.game.s.groups[HellscapeUI.game.s.order[1]].aura),null);await page.clock.runFor(2000);
      await page.evaluate(()=>{const g=HellscapeUI.game;g.s.groups.forEach((p,i)=>{p.score=Fool.rational([2000,666,1][i],i===2?3:1);p.inventory.push({id:g.uid(),type:'aura',target:null,origin:'fresh'});p.aura=g.s.turn;});g.s.groups[g.s.owner].inventory.push({id:g.uid(),type:'ira',target:null,origin:'browser'});HellscapeUI.changed();});await page.clock.runFor(5000);
      await page.getByRole('button',{name:'Inventario',exact:true}).click();await page.locator('#dialog [data-ammo="ira"]').click();await page.locator('#ammo-info').getByRole('button',{name:'Usa',exact:true}).click();await shot('flagello-confirm');await page.locator('#dialog').getByRole('button',{name:'Conferma uso',exact:true}).click();await page.clock.runFor(2300);
      assert.deepEqual(await page.evaluate(()=>HellscapeUI.game.s.groups.map(p=>[Fool.exact(p.score),p.damage,p.inventory.length,p.aura!==null])),[['1334',1,0,true],['0',1,0,true],['0',1,0,true]]);await shot('flagello-result');
      await reset();await page.evaluate(()=>{const g=HellscapeUI.game;g.s.groups[0].damage=1;for(let i=0;i<3;i++){g.reveal();g.answer((g.s.current.correct+1)%4);if(i<2)g.next();}g.next();g.reveal();g.pause('browser');HellscapeUI.changed();});await page.clock.runFor(100);
      assert.equal(await page.evaluate(()=>HellscapeUI.game.s.current.difficulty),'difficile');assert.equal(await page.locator('.turn-order .heart:not(.lost)').count(),8);assert.equal(await page.locator('.turn-order .heart').count(),9);assert.match(await page.locator('.question-points').innerText(),/Ultimo Miglio/);await shot('ultimo-miglio');
      await reset();await page.evaluate(()=>{const g=HellscapeUI.game;g.eliminate(g.s.order[1],'browser');HellscapeUI.changed();});
      await page.clock.runFor(500);await shot('capture-flame');const positions=[];for(const delta of [16,33,17,50,16,33,20]){await page.clock.runFor(delta);positions.push(await page.evaluate(()=>FoolHellRace.presentationSnapshot().frame));}
      for(let i=1;i<positions.length;i++){const a=positions[i-1],b=positions[i];assert(b.camera.distance>=a.camera.distance);if(b.time>a.time)assert(b.camera.distance>a.camera.distance);assert(Math.abs(b.demon.left-a.demon.left)<25);for(const p of b.positions)if(p.index!==b.victim)assert.equal(p.ground,positions[0].positions[p.index].ground);}
      await page.clock.runFor(5500);assert.equal(await page.evaluate(()=>FoolHellRace.presentationSnapshot().consumed.length),1);
      await reset();await page.evaluate(()=>{const g=HellscapeUI.game;g.eliminate(1,'prior');g.eliminate(2,'prior');g.complete(0);HellscapeUI.changed();});await page.clock.runFor(100);
      const plan=await page.evaluate(()=>FoolHellRace.presentationSnapshot().plan),before=await page.evaluate(()=>JSON.stringify(HellscapeUI.game.snapshot()));
      // The public snapshot's frame time gives elapsed relative to its plan entry.
      async function at(offset){const wanted=plan.chaseEnd+offset;const actual=await page.evaluate(()=>{const s=FoolHellRace.presentationSnapshot();return s.frame.time-s.plan.entry.time;});await page.clock.runFor(Math.max(0,Math.round((wanted-actual)*1000)));}
      await at(1.35);await shot('portal-descent');await at(2.25);await shot('portal-impact');await at(2.85);await shot('portal-crossing');await at(5.5);await shot('portal-rubble');
      const end=await page.evaluate(()=>FoolHellRace.presentationSnapshot().frame);assert(end.bridge.rubble&&end.bridge.damage===1);assert(!end.portal.visible);assert(end.cleared);assert.equal(await page.evaluate(()=>JSON.stringify(HellscapeUI.game.snapshot())),before);
      report.checks.push({viewport:[width,height],dpr,raster,malocchio:'PASS',antisigillo:'PASS',flagello:'PASS',ultimoMiglio:'PASS',capture:'PASS',portal:'PASS'});await page.close();
    }
    assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.checks,null,2));
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
