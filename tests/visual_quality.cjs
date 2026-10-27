"use strict";
const {chromium}=require("playwright"),fs=require("node:fs"),assert=require("node:assert/strict");
(async()=>{
 fs.mkdirSync("artifacts",{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||"/usr/bin/chromium",args:["--no-sandbox"]});
 try{
  for(const [width,height] of [[1440,900],[844,390]]){
   const context=await browser.newContext({viewport:{width,height},offline:true});
   const requests=[],errors=[];
   await context.route("**/*",route=>{
    if(route.request().url()==="http://quality.test/")route.fulfill({contentType:"text/html",body:fs.readFileSync("dist/Hellscape-offline.html","utf8")});
    else{requests.push(route.request().url());route.abort();}
   });
   const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
   await page.goto("http://quality.test/");
   await page.frameLocator("iframe").getByRole("link",{name:"Nuova partita",exact:true}).click();
   const frame=page.frames()[1];
   await frame.locator("#vehicle1").selectOption("truck");
   await frame.getByRole("button",{name:/^Inizia partita/}).click();
   await frame.waitForFunction(()=>document.querySelector(".hell-race canvas")?.width>=1024);
   await frame.evaluate(()=>{
    const g=HellscapeUI.game;
    g.s.groups.forEach((p,i)=>p.score=Fool.rational([101,200,1][i]));
    const item={id:g.uid(),type:"marx",target:null,origin:"test"};
    g.s.groups[g.s.respondent].inventory.push(item);g.use(item.id,null);HellscapeUI.changed();
   });
   await frame.waitForFunction(()=>[...document.querySelectorAll(".player-points")].every(p=>p.textContent==="101 pt"));
   assert(await frame.evaluate(()=>HellscapeUI.game.s.groups.every(p=>Fool.exact(p.score)==="302/3")));
   await frame.waitForFunction(()=>document.querySelector('.hell-race')?.dataset.ammo==='' && !document.body.classList.contains('showing-cinematic'));
   await page.screenshot({path:`artifacts/quality-integer-${width}.png`});
   const source=fs.readFileSync("assets/hell-race.js","utf8").replace(
    "root.FoolHellRace = { createStage, vehiclePreview };",
    "root.QualityRace = { scene, chaseAction, ready:()=>Object.values(sheets).every(imageReady) };");
   await frame.addScriptTag({content:source});
   await frame.waitForFunction(()=>QualityRace.ready()&&FoolBridge.load()?.complete&&FoolEnding.load(()=>{})?.complete);
   await frame.evaluate(()=>{
    const canvas=document.createElement("canvas");canvas.id="quality-scene";
    canvas.width=1536;canvas.height=1152;
    canvas.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100vw,133.333vh);height:min(100vh,75vw);z-index:1000";
    document.body.append(canvas);
   });
   const stateBefore=await frame.evaluate(()=>JSON.stringify(HellscapeUI.game.s));
   for(const [name,progress,time] of [["start",0,0],["ruins",1,0],["reach",.5,8],["fire",.5,26]]){
    const result=await frame.evaluate(({progress,time})=>{
     const s=Fool.clone(HellscapeUI.game.s);s.valid=progress*s.config.questionCount;
     const c=document.querySelector("#quality-scene").getContext("2d");
     c.setTransform(3,0,0,3,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
     QualityRace.scene(c,512,s,2,false,null,false,time);
     return QualityRace.chaseAction(time).mode;
    },{progress,time});
    if(name==="reach"||name==="fire")assert.equal(result,name);
    await page.screenshot({path:`artifacts/quality-${name}-${width}.png`});
   }
   assert.equal(await frame.evaluate(()=>JSON.stringify(HellscapeUI.game.s)),stateBefore,"Scenery cannot change game state");
   await frame.evaluate(()=>document.querySelector("#quality-scene").remove());
   const paused=await frame.evaluate(()=>{
    HellscapeUI.game.s.suspended=true;HellscapeUI.changed();
    return JSON.stringify(HellscapeUI.game.s.groups);
   });
   await page.waitForTimeout(350);
   assert.equal(await frame.evaluate(()=>JSON.stringify(HellscapeUI.game.s.groups)),paused);
   await page.emulateMedia({reducedMotion:"reduce"});
   await frame.evaluate(()=>{HellscapeUI.game.s.suspended=false;HellscapeUI.changed();});await page.waitForTimeout(250);
   const still=await frame.locator(".hell-race canvas").evaluate(c=>c.toDataURL());
   await page.waitForTimeout(200);
   assert.equal(await frame.locator(".hell-race canvas").evaluate(c=>c.toDataURL()),still);
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
   await context.close();console.log("PASS integer scores, high resolution, bridge progression, near misses, pause and reduced motion",width);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
