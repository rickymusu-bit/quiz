'use strict';
const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const images={};for(const [key,file] of Object.entries({vehicles:'vehicles-drive-v1',demon:'demon-actions-v1',world:'infernal-world-v1',portal:'portal-flames-v1'}))images[key]=await loadImage('assets/hell-race/'+file+'.webp');
 const root={__sheets:images,matchMedia:()=>({matches:false})},document={createElement:()=>createCanvas(1,1)};
 const source=fs.readFileSync('assets/hell-race.js','utf8').replace('const sheets = { vehicles: null, demon: null, world: null, portal: null };','const sheets = root.__sheets;').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { createStage, vehiclePreview, drawVehicle, nameTag, lanes };');
 vm.runInNewContext(source,{window:root,document});const api=root.FoolHellRace;
 function visible(canvas){const {data}=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,right=-1,top=canvas.height,bottom=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}return {left,right,top,bottom,width:right-left+1,height:bottom-top+1}}
 const sizes=[];
 for(const scale of [2,1]){
  const widths=[];
  for(let row=0;row<6;row++){
   widths[row]=[];
   for(let frame=0;frame<8;frame++){
    const canvas=createCanvas(200,130),ctx=canvas.getContext('2d');
    const bounds=api.drawVehicle(ctx,row,frame,100,110,scale),pixels=visible(canvas);widths[row].push(pixels.width);
    assert(pixels.width>15&&pixels.height>12);assert(pixels.left>0&&pixels.right<199&&pixels.top>0&&pixels.bottom<129);
    // Inspect the actual tag rectangle from the rendering command, not a copied formula.
    const rectangles=[],fill=ctx.fillRect.bind(ctx);ctx.fillRect=(...args)=>{rectangles.push(args);fill(...args)};
    api.nameTag(ctx,200,100,bounds.y,'Giocatore lungo','#fff');
    const [x,y,w,h]=rectangles[0];assert(y+h<=pixels.top-4,'Label must clear every sprite frame');
    for(let lane=1;lane<api.lanes.length;lane++)assert(api.lanes[lane]-api.lanes[lane-1]+y-110>=3,'Tag must clear the previous lane');
   }
  }
  for(const smaller of [0,5])assert(Math.min(...widths[1])>Math.max(...widths[smaller])*1.15,'Pickup must be visibly larger than chopper/Ape in every frame');
  assert(Math.min(...widths[2])>Math.max(...widths[1]),'Truck must be larger than pickup');
  sizes.push({scale,widths:widths.map(a=>[Math.min(...a),Math.max(...a)])});
 }
 // The shared previews must keep the same physical hierarchy.
 const previews=['chopper','pickup','truck','coupe','offroad','ape'].map(id=>visible(api.vehiclePreview(id)));
 assert(previews[1].width>previews[0].width&&previews[1].width>previews[5].width);assert(previews[2].width>previews[1].width);
 const board=createCanvas(720,520),ctx=board.getContext('2d');ctx.fillStyle='#161819';ctx.fillRect(0,0,720,520);ctx.scale(2,2);ctx.imageSmoothingEnabled=false;
 ['Chopper','Pick-up','Camion','Coupé','Fuoristrada','Ape'].forEach((name,row)=>{const x=row%2?270:90,ground=80+Math.floor(row/2)*80;const bounds=api.drawVehicle(ctx,row,0,x,ground);api.nameTag(ctx,360,x,bounds.y,name,'#d6ad75')});
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/vehicle-proportions.png',board.toBuffer('image/png'));
 console.log('PASS: rendered relative sizes, full silhouettes and clear labels for all 48 frames, capture scale and previews',JSON.stringify(sizes));
})().catch(error=>{console.error(error);process.exitCode=1});
