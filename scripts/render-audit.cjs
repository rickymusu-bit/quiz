'use strict';
// Reproducible native-source / raster / fill-rate audit. No game mutations.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
async function nativeCoverage(){
 const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('node:vm');
 const images={};for(const [key,name] of Object.entries({vehicles:'vehicles-drive-v1',world:'infernal-world-v1'}))
  images[key]=await loadImage(path.join(root,'assets/hell-race/'+name+'.webp'));
 const scene={FoolMotion:require('../assets/hell-motion.js'),FoolLayout:require('../assets/hell-layout.js'),
  FoolBridge:require('../assets/hell-bridge.js'),__sheets:images,matchMedia:()=>({matches:false})};
 const document={createElement:()=>createCanvas(1,1)};
 // Run the actual crop/size code in isolation; expose private readers only in this audit VM.
 const code=fs.readFileSync(path.join(root,'assets/hell-race.js'),'utf8')
  .replace('const sheets = { vehicles: null, world: null };','const sheets = root.__sheets;')
  .replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { createStage, vehiclePreview, vehicleRow, vehicleSize, atlasRow };');
 vm.runInNewContext(code,{window:scene,document});const api=scene.FoolHellRace;
 const rasterScaleMax=1536/scene.FoolLayout.reference.rasterWidth;
 const vehicles=['chopper','pickup','truck','coupe','offroad','ape'].map((name,row)=>{
  const frames=api.vehicleRow(row),frame=frames[0],logical=api.vehicleSize(row);
  const racePixels=logical.width*rasterScaleMax,previewPixels=logical.width*1.35/scene.FoolBridge.RACE_SCALE*2;
  return {name,frames:frames.length,native:[frame.width,frame.height],logical,racePixels,previewPixels,
   maxSourceScale:Math.max(racePixels,previewPixels)/frame.width};
 });
 if(vehicles.some(v=>v.maxSourceScale>1))throw Error('A vehicle needs more native pixels at the current race/preview sizes');
 const K=require('../assets/hell-cerbero.js'),sourceWidth=Math.min(...K.data.walk.map(f=>f.referenceWidth));
 const demonRasterWidth=scene.FoolMotion.CHASE.width*rasterScaleMax;
 return {revision,rasterScaleMax,vehicles,cerbero:{sources:K.ASSETS,native:[K.SOURCE.width,K.SOURCE.height],
  textureWidth:sourceWidth,poses:K.data.walk.length,necks:K.heads.length,tailSegments:3,
  maxRasterWidth:demonRasterWidth,maxSourceScale:demonRasterWidth/sourceWidth}};
}
(async()=>{
 const coverage=await nativeCoverage();
 const server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const samples=[];
  for(const [width,height,dpr] of [[1440,1080,1],[1440,1080,2],[667,375,2]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});
   await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);await page.getByRole('button',{name:/Inizia partita/}).click();
   await page.waitForFunction(()=>FoolEnding.prepare(FoolEnding.load(()=>{}))!==null);
   const sample=await page.evaluate(async()=>{
    await document.fonts.ready;
    const canvas=document.querySelector('.hell-race canvas'),ctx=canvas.getContext('2d'),times=[],costs=[];
    const transform=ctx.setTransform.bind(ctx),raf=window.requestAnimationFrame;
    ctx.setTransform=(...args)=>{times.push(performance.now());return transform(...args);};
    window.requestAnimationFrame=callback=>raf(time=>{const before=performance.now(),count=times.length;callback(time);if(times.length>count)costs.push(performance.now()-before);});
    const start=performance.now();await new Promise(resolve=>setTimeout(resolve,2500));const elapsed=performance.now()-start;
    window.requestAnimationFrame=raf;ctx.setTransform=transform;
    const sorted=costs.slice().sort((a,b)=>a-b),frames=FoolEnding.prepare(FoolEnding.load(()=>{}));
    const sourceFiles=['vehicles-drive-v1.webp',...FoolCerbero.ASSETS.map(p=>p.replace('assets/hell-race/','')),'arsenico-v1.png','ammo-relics-v1.webp','black-stone-bridge-v1.png','lava-sea-v2.png','portal-side-v3.png','portal-rocks-v1.png','victory-title-v1.webp','sacrificio-v1.png'];
    const sources=await Promise.all(sourceFiles.map(async name=>{const img=new Image();img.src='assets/hell-race/'+name;await img.decode();return {name,width:img.naturalWidth,height:img.naturalHeight};}));
    return {raster:[canvas.width,canvas.height],rgbaBytes:canvas.width*canvas.height*4,cssWidth:canvas.getBoundingClientRect().width,smoothing:ctx.imageSmoothingEnabled,frames:times.length,elapsedMs:elapsed,paintFPS:times.length*1000/elapsed,paintCallbackP95ms:sorted[Math.floor(sorted.length*.95)]??null,timingMetric:'RAF callback wall duration, includes scheduling and GC; not a CPU profiler',cerberoSource:[FoolCerbero.SOURCE.width,FoolCerbero.SOURCE.height],sources};
   });
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
   await page.waitForFunction(()=>[...document.querySelectorAll('.home-illustration,.home-wordmark')].every(i=>i.complete&&i.naturalWidth));
   const home=await page.locator('.home-illustration,.home-wordmark').evaluateAll(images=>images.map(img=>{
    const r=img.getBoundingClientRect();return {className:img.className,native:[img.naturalWidth,img.naturalHeight],css:[r.width,r.height],dpr:devicePixelRatio,
     physicalScale:Math.max(r.width*devicePixelRatio/img.naturalWidth,r.height*devicePixelRatio/img.naturalHeight)};
   }));
   if(home.length!==2)throw Error('Home audit must include illustration and wordmark');
   samples.push({revision,viewport:[width,height],dpr,...sample,home});await page.close();
  }
  fs.mkdirSync(path.join(root,'artifacts/v130'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/v130/native-coverage.json'),JSON.stringify(coverage,null,2)+'\n');fs.writeFileSync(path.join(root,'artifacts/v130/render-audit.json'),JSON.stringify(samples,null,2)+'\n');console.log(JSON.stringify(samples,null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
