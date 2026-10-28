/* Exercise actual Ammo controls, frame timing, pause/reload and offline export. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(__dirname, '..'), offline = process.argv.includes('--offline');
const types = ['salta','ruba','svela','aura','marx','ira','sacrificio','karma'];
const selected = process.argv.find(arg=>arg.startsWith('--case='))?.split('=')[1];
const modes = ['shield','lethal','timer','reduced'];
assert(!selected||[...types,...modes,'reload'].includes(selected),'Unknown Ammo test case');
(async () => {
  fs.mkdirSync(path.join(root,'artifacts'), {recursive:true});
  const server = http.createServer((req,res)=>{
    const file = path.join(root,decodeURIComponent(req.url.split('?')[0]));
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
    try {res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
    catch {res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const errors=[], checks=[];
  async function start(width=1440,height=900,reduced=false) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
    page.on('pageerror',e=>errors.push(e.message));
    let view=page;
    if(offline){
      const bytes=fs.readFileSync(path.join(root,'dist/Hellscape-offline.html'),'utf8');
      await page.context().setOffline(true);
      await page.route('**/*',route=>route.request().url()==='http://offline.test/preview'
        ? route.fulfill({contentType:'text/html',body:bytes}) : route.abort());
      await page.goto('http://offline.test/preview');
      await page.frameLocator('iframe').getByRole('link',{name:'Nuova partita',exact:true}).click();
      view=page.frames()[1];
    } else await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);
    await view.getByRole('button',{name:/Inizia partita/}).click();
    await view.waitForFunction('FoolEnding.prepare(FoolEnding.load(()=>{}))!==null');
    await view.evaluate('document.fonts.ready');
    await page.clock.install();await page.clock.pauseAt(await page.evaluate('Date.now()+100'));
    await view.evaluate(()=>{const g=HellscapeUI.game;g.s.groups.forEach((v,i)=>v.score=Fool.rational(200+i*400));HellscapeUI.changed()});
    await page.clock.runFor(2000);
    return {page,view};
  }
  async function use(view,type,{answer=false,shield=false,lethal=false}={}) {
    const target = await view.evaluate(({type,shield,lethal})=>{
      const g=HellscapeUI.game,s=g.s,target=s.order.find(i=>i!==s.owner);
      s.groups[s.owner].inventory=[{id:g.uid(),type,target:null,origin:'test'}];
      if(shield)s.groups[target].aura=s.turn;
      if(lethal)s.groups.forEach(v=>v.damage=2);
      HellscapeUI.changed();
      return target;
    },{type,shield,lethal});
    if(answer)await view.getByRole('button',{name:'Svela e avvia il tempo',exact:true}).click();
    if(answer)await view.locator('body').press('i');
    else await view.getByRole('button',{name:'Inventario',exact:true}).click();
    await view.locator(`#dialog [data-ammo="${type}"]`).click();
    await view.locator('#ammo-info').getByRole('button',{name:'Usa',exact:true}).click();
    if(await view.locator('#bonus-target').count())await view.locator('#bonus-target').selectOption(String(target));
    await view.locator('#dialog').getByRole('button',{name:'Conferma uso',exact:true}).click();
  }
  try {
    for(const [width,height] of [[1440,900],[667,375],[844,390]]) {
      for(const type of types.filter(type=>!selected||selected===type)){
        const {page,view}=await start(width,height);await use(view,type);
        await page.clock.runFor(650);
        assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),type);
        assert.equal(await view.locator('.operation-body').isVisible(),false);
        const snapshot=await view.evaluate('JSON.stringify({groups:HellscapeUI.game.s.groups,events:HellscapeUI.game.s.events})');
        await page.screenshot({path:`artifacts/ammo-motion-${type}-${width}${offline?'-offline':''}.png`});
        await page.keyboard.press('Enter');await page.clock.runFor(200);
        assert.equal(await view.evaluate('JSON.stringify({groups:HellscapeUI.game.s.groups,events:HellscapeUI.game.s.events})'),snapshot);
        await page.clock.runFor(2600);
        assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),'');
        assert.equal(await view.locator('.operation-body').isVisible(),true);
        await view.evaluate('HellscapeUI.changed()');await page.clock.runFor(100);
        assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),'');
        await page.close();
      }
      if(!selected||types.includes(selected))checks.push({viewport:[width,height],activations:types.filter(type=>!selected||selected===type),result:'PASS'});
    }
    for(const mode of modes.filter(mode=>!selected||selected===mode)){
      const {page,view}=await start(1440,900,mode==='reduced');
      await use(view,mode==='lethal'?'ira':mode==='timer'||mode==='reduced'?'aura':'salta',
        {shield:mode==='shield',lethal:mode==='lethal',answer:mode==='timer'});
      if(mode==='timer'){
        await page.clock.runFor(250);assert.equal(await view.evaluate('HellscapeUI.game.running'),false);
        const left=await view.evaluate('HellscapeUI.game.left()');
        await page.keyboard.press('p');await page.clock.runFor(100);
        const frame=await view.locator('.hell-race canvas').evaluate(c=>c.toDataURL());
        await page.clock.runFor(1800);
        assert.equal(await view.locator('.hell-race canvas').evaluate(c=>c.toDataURL()),frame);
        assert.equal(await view.evaluate('HellscapeUI.game.left()'),left);
        await page.keyboard.press('p');await page.clock.runFor(2000);
        assert.equal(await view.evaluate('HellscapeUI.game.running'),true);
      }else if(mode==='reduced'){
        await page.clock.runFor(100);const frame=await view.locator('.hell-race canvas').evaluate(c=>c.toDataURL());
        await page.clock.runFor(150);assert.equal(await view.locator('.hell-race canvas').evaluate(c=>c.toDataURL()),frame);
        await page.clock.runFor(350);assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),'');
      }else{
        await page.clock.runFor(650);
        const type=mode==='shield'?'salta':'ira';
        assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),type);
        if(mode==='shield')assert.match(await view.locator('.ammo-status').textContent(),/bloccato/);
        if(mode==='lethal')assert.equal(await view.locator('.hell-race').getAttribute('data-ending-phase'),'ammo');
        await page.screenshot({path:`artifacts/ammo-motion-${mode}${offline?'-offline':''}.png`});
        await page.clock.runFor(mode==='lethal'?Math.ceil((await view.evaluate('FoolHellRace.presentationSnapshot().plan.duration')+3)*1000):3000);
        assert.equal(await view.locator('.hell-race').getAttribute('data-ammo'),'');
        if(mode==='lethal')assert.equal(await view.locator('.hell-race').getAttribute('data-ending-phase'),'done');
      }
      await page.close();checks.push({mode,result:'PASS'});
    }
    // A reload during an attack must not consume the Ammo or its effects again.
    if(!offline&&(!selected||selected==='reload')){
      const {page,view}=await start();await use(view,'salta');await page.clock.runFor(400);
      const saved=await view.evaluate('JSON.stringify(HellscapeUI.game.s.effects)');
      await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?resume=1`);await page.clock.runFor(100);
      assert.equal(await page.locator('.hell-race').getAttribute('data-ammo'),'');
      assert.equal(await page.evaluate('JSON.stringify(HellscapeUI.game.s.effects)'),saved);
      await page.close();checks.push({mode:'reload',result:'PASS'});
    }
    assert.deepEqual(errors,[]);console.log(JSON.stringify({offline,checks,errors},null,2));
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
