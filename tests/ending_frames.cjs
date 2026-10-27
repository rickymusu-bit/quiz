'use strict';
const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const root={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/hell-ending.js'),'utf8'),{globalThis:root,document:{createElement:()=>createCanvas(1,1)}});
 const image=await loadImage(path.join(__dirname,'../assets/hell-race/demon-ending-v1.webp')),frames=root.FoolEnding.prepare(image);
 assert.equal(frames.length,16);const board=createCanvas(frames[0].canvas.width*4,frames[0].canvas.height*4),ctx=board.getContext('2d');ctx.fillStyle='#171514';ctx.fillRect(0,0,board.width,board.height);
 frames.forEach((f,index)=>{const {width,height}=f.canvas,raw=f.canvas.getContext('2d').getImageData(0,0,width,height).data;let left=width,right=0,top=height,bottom=0,count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(raw[(y*width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  assert(count>15000,'Complete body required in every pose');assert(left>=8&&right<width-8&&top>=8&&bottom<height-7,'Every pose retains transparent padding');
  for(const point of (index<8?[f.hand,f.mouth]:[f.mouth])){assert(point.x>=0&&point.x<width&&point.y>=0&&point.y<height,'Hand and mouth anchors stay inside their pose');}
  ctx.drawImage(f.canvas,index%4*width,Math.floor(index/4)*height);
 });fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../artifacts/demon-ending-contact.png'),board.toBuffer('image/png'));
 const flame=createCanvas(240,240),fc=flame.getContext('2d');fc.globalAlpha=.7;const alpha=fc.globalAlpha;root.FoolEnding.fireBreath(fc,{x:120,y:200},.6);assert.equal(fc.globalAlpha,alpha);const fd=fc.getImageData(0,0,240,240).data;let top=240,bottom=0;for(let y=0;y<240;y++)for(let x=0;x<240;x++)if(fd[(y*240+x)*4+3]>24){top=Math.min(top,y);bottom=Math.max(bottom,y)}assert(top<110&&bottom<=210,'Fire must rise above the mouth');fc.clearRect(0,0,240,240);root.FoolEnding.fireBreath(fc,{x:120,y:200},2);assert(!fc.getImageData(0,0,240,240).data.some(v=>v));
 const state={winner:0,respondent:2,groups:[{name:'A',out:false},{name:'B',out:false},{name:'C',out:false}]};
 const helper={vehicleIndex:()=>0,vehicleSize:()=>({width:44,height:36}),drawVehicle:()=>{},gate:()=>{},demon:()=>{},demonDust:()=>{},nameTag:()=>{throw Error('Names must not be drawn during capture or escape')}};
 const ep=root.FoolEnding.plan(state);for(let t=0;t<ep.duration;t+=.13)root.FoolEnding.render(fc,512,state,ep,t,helper);
 for(const t of [.1,.5,1]){const admitted=[];root.FoolEnding.render(fc,512,state,ep,ep.entryStart+t,{...helper,vehicleIndex:(s,i)=>i,drawVehicle:(ctx,row)=>admitted.push(row)});assert.deepEqual(admitted,[state.winner],'Only the winner can pass the portal');}
 fc.clearRect(0,0,240,240);root.FoolEnding.fireBreath(fc,{x:40,y:120},.6,{x:220,y:120},1.85);const jet=fc.getImageData(0,0,240,240).data;let right=0;for(let y=0;y<240;y++)for(let x=0;x<240;x++)if(jet[(y*240+x)*4+3]>100)right=Math.max(right,x);assert(right>210,'Flamethrower must reach its portal target');
 console.log('PASS: no cinematic player names; 16 complete ending poses; mouth/hand anchors; upward flame direction, lifetime and canvas isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
