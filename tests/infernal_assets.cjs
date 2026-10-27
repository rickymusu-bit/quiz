'use strict';
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith('/'))file+='index.html';res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const reduced of [false,true]){
   const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
   page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
   await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);
   await page.getByRole('button',{name:/Inizia partita/}).waitFor({timeout:7000}).catch(async e=>{console.log((await page.locator('body').innerText()).slice(-1800));await page.screenshot({path:'/tmp/infernal-debug.png'});throw e});
   await page.waitForFunction(()=>[...document.querySelectorAll('.vehicle-preview canvas')].length===3&&[...document.querySelectorAll('.vehicle-preview canvas')].every(c=>c.getContext('2d').getImageData(0,0,160,90).data.some((v,i)=>i%4===3&&v>0)));
   await page.getByRole('button',{name:/Inizia partita/}).click();
   await page.locator('.hell-race canvas').waitFor();
   await page.waitForTimeout(300);
   if(!reduced)await page.screenshot({path:'/tmp/infernal-gameplay.png'});
   const before=await page.evaluate(()=>JSON.stringify(HellscapeUI.game.snapshot()));
   const a=await page.locator('.hell-race canvas').evaluate(c=>c.toDataURL());
   await page.waitForTimeout(250);
   const b=await page.locator('.hell-race canvas').evaluate(c=>c.toDataURL());
   assert.equal(a===b,reduced,'Reduced motion must freeze the scene; normal motion must animate');
   assert.equal(await page.evaluate(()=>JSON.stringify(HellscapeUI.game.snapshot())),before,'Scenery cannot mutate match state');
   await page.evaluate(()=>{HellscapeUI.game.reveal();HellscapeUI.game.pause('test');HellscapeUI.changed()});
   await page.waitForTimeout(100);
   const paused=await page.locator('.hell-race canvas').evaluate(c=>c.toDataURL());
   await page.waitForTimeout(200);
   assert(await page.locator('.hell-race canvas').evaluate((c,p)=>c.toDataURL()===p,paused),'Paused race must remain still');
   for(const winner of [0,null]){
    await page.evaluate(w=>{HellscapeUI.game.complete(w);HellscapeUI.changed()},winner);
    await page.waitForTimeout(reduced?100:1900);
    await page.locator('.hell-race-final canvas').screenshot({path:`/tmp/infernal-${reduced?'still':'animated'}-${winner===null?'over':'win'}.png`});
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS: visible previews, animated/still frames, unchanged state, pause, victory and Game Over');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
