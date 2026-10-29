'use strict';
// Reproducible native-source / raster / fill-rate audit. No game mutations.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const samples=[];
  for(const [width,height,dpr] of [[1440,1080,1],[390,844,2]]){
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
    const sourceFiles=['vehicles-drive-v1.webp','demon-actions-v1.webp','demon-ending-v1.webp','ammo-relics-v1.webp','black-stone-bridge-v1.png','lava-sea-v2.png','portal-side-v3.png','portal-rocks-v1.png','victory-title-v1.webp'];
    const sources=await Promise.all(sourceFiles.map(async name=>{const img=new Image();img.src='assets/hell-race/'+name;await img.decode();return {name,width:img.naturalWidth,height:img.naturalHeight};}));
    return {raster:[canvas.width,canvas.height],rgbaBytes:canvas.width*canvas.height*4,cssWidth:canvas.getBoundingClientRect().width,smoothing:ctx.imageSmoothingEnabled,frames:times.length,elapsedMs:elapsed,paintFPS:times.length*1000/elapsed,cpuP95ms:sorted[Math.floor(sorted.length*.95)]??null,endingCrop:[frames[0].canvas.width,frames[0].canvas.height],sources};
   });samples.push({viewport:[width,height],dpr,...sample});await page.close();
  }
  fs.mkdirSync(path.join(root,'artifacts/v130'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/v130/render-audit.json'),JSON.stringify(samples,null,2)+'\n');console.log(JSON.stringify(samples,null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
