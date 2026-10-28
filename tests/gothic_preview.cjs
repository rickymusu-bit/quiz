const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],requests=[];
 try{
  for(const [width,height] of [[1280,1100],[390,844],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},offline:true});
   await context.route('**/*',r=>{if(r.request().url()==='http://preview.test/')r.fulfill({contentType:'text/html',body:fs.readFileSync('dist/Hellscape-Ammo.html','utf8')});else{requests.push(r.request().url());r.abort()}});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://preview.test/');
   await page.waitForFunction('FoolAmmo.load().complete && FoolBridge.load().complete');
   const epoch=new Date('2026-10-28T00:00:00Z');
   await page.clock.install({time:epoch});
   // A controlled origin avoids racing a 100 ms deadline across browser round trips.
   await page.clock.pauseAt(new Date(epoch.getTime()+60000));
   for(const label of ['Catene','Tributo','Malocchio','Sigillo','Contrappasso','Livella','Flagello']){
    await page.getByRole('button',{name:label,exact:true}).click();await page.clock.runFor(650);
    assert.match(await page.locator('#effect-description').innerText(),new RegExp(label));
    const before=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.clock.runFor(200);
    assert.notEqual(await page.locator('canvas').evaluate(c=>c.toDataURL()),before,'The material effect must animate');
    if(width===1280)await page.screenshot({path:`artifacts/gothic-${label.toLowerCase()}.png`});
    await page.clock.runFor(1900);
   }
   await page.locator('#vehicles').selectOption('large');await page.clock.runFor(100);
   await page.screenshot({path:`artifacts/gothic-bridge-${width}.png`});
   assert(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'));
   await page.getByRole('button',{name:'Riproduci tutte',exact:true}).click();await page.clock.runFor(3000);
   assert.match(await page.locator('#effect-description').innerText(),/Tributo/);
   await page.getByRole('button',{name:'Guarda il ponte',exact:true}).click();await page.clock.runFor(3500);
   assert.match(await page.locator('#effect-description').innerText(),/Il ponte stretto/);
   await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Sigillo',exact:true}).click();await page.clock.runFor(100);
   const still=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.clock.runFor(150);
   assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),still);
   await context.close();console.log('PASS offline material demo',width,height);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
