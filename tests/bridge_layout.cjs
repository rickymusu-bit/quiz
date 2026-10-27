'use strict';
const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const bridge=require('../assets/hell-bridge.js');
(async()=>{
 const image=await loadImage('assets/hell-race/vehicles-drive-v1.webp');
 const root={FoolLayout:require('../assets/hell-layout.js'),__sheets:{vehicles:image},FoolBridge:bridge,matchMedia:()=>({matches:false})};
 const source=fs.readFileSync('assets/hell-race.js','utf8').replace('const sheets = { vehicles: null, demon: null, world: null, portal: null };','const sheets=root.__sheets;').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace={packPosition};');
 vm.runInNewContext(source,{window:root,document:{createElement:()=>createCanvas(1,1)}});
 const names=['chopper','pickup','truck','coupe','offroad','ape'];let count=0;
 for(const a of names)for(const b of names.filter(n=>n!==a))for(const d of names.filter(n=>n!==a&&n!==b)){
  const s={groups:[0,1,2].map(()=>({score:{n:'0',d:'1'}})),config:{vehicles:[a,b,d],bases:{facile:100,media:200,difficile:300}}};
  const poses=[0,1,2].map(i=>root.FoolHellRace.packPosition(s,i,0,null,2));
  assert(poses[0].y-poses[0].height>=bridge.TOP,'First silhouette stays on deck');
  assert(poses[2].y<=bridge.BOTTOM,'Last silhouette stays on deck');
  for(let i=1;i<3;i++)assert(poses[i].y-poses[i].height-poses[i-1].y>=bridge.GAP-.001,'Full sprite boxes never overlap, including tied scores');
  assert(poses[2].y-poses[0].y<80,'The pack remains compact');
  assert(poses.every(p=>p.x===poses[0].x),'Tied scores stay level');count++;
 }
 console.log('PASS:',count,'vehicle triples, full silhouette separation and narrow deck bounds');
})().catch(e=>{console.error(e);process.exitCode=1});
