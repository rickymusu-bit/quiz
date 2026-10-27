'use strict';
const {createCanvas}=require('@napi-rs/canvas'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root={matchMedia:()=>({matches:false})};
const source=fs.readFileSync(path.join(__dirname,'../assets/hell-race.js'),'utf8').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { vehicleDust, demonDust, dustPuff, dirtChip, flyingDevils };');
const math=Object.create(Math);math.random=()=>{throw Error('Dust must not consume game RNG')};
vm.runInNewContext(source,{window:root,Math:math,document:{createElement:()=>createCanvas(1,1)}});const dust=root.FoolHellRace;
function render(fn){const canvas=createCanvas(360,180),c=canvas.getContext('2d');c.globalAlpha=.7;const alpha=c.globalAlpha;fn(c);assert.equal(c.globalAlpha,alpha,'Effect must restore canvas opacity');return canvas;}
function pixels(canvas){return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;}
for(const type of ['vehicle','demon','sky']){
 const paint=(c,t)=>type==='vehicle'?dust.vehicleDust(c,260,145,t,2):type==='demon'?dust.demonDust(c,150,t,'chase',0):dust.flyingDevils(c,360,t);
 const a=render(c=>paint(c,2)),b=render(c=>paint(c,2)),later=render(c=>paint(c,2.16));
 assert.deepEqual(pixels(a),pixels(b),'Same clock must reproduce frozen dust');assert.notDeepEqual(pixels(a),pixels(later),'Dust must evolve with motion');
 let calls=0;render(c=>{const fill=c.fillRect.bind(c);c.fillRect=(...args)=>{calls++;assert(args.every(Number.isFinite));fill(...args)};paint(c,1e8)});
 assert(calls<350,'Long sessions must not accumulate particles');
}
// A cloud dissipates entirely after its lifetime, including its ground shadow.
const gone=createCanvas(360,180),gc=gone.getContext('2d');dust.dustPuff(gc,200,145,1.3,1.2,12,30,4);assert(!pixels(gone).some(v=>v));
// Show isolated vehicle trails and heavy foot impacts over successive moments.
const board=createCanvas(960,420),ctx=board.getContext('2d');ctx.fillStyle='#171514';ctx.fillRect(0,0,960,420);ctx.font='16px monospace';
for(let frame=0;frame<4;frame++){
 const t=2+frame*.16;ctx.save();ctx.translate(frame*240,0);ctx.fillStyle='#e7c594';ctx.fillText('t + '+(frame*.16).toFixed(2)+' s',10,22);
 ctx.fillStyle='#332b25';ctx.fillRect(0,150,240,2);ctx.fillRect(0,360,240,2);
 dust.vehicleDust(ctx,205,150,t,2);ctx.save();ctx.translate(10,227);dust.demonDust(ctx,90,t,'chase',0);ctx.restore();ctx.restore();
}
fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../artifacts/dust-sequence.png'),board.toBuffer('image/png'));
console.log('PASS: evolving dust, deterministic freeze, bounded particles, lifetime and isolated canvas state; no game RNG');

const sky=render(c=>dust.flyingDevils(c,360,4)),sd=pixels(sky);for(let y=174;y<180;y++)assert(!sd.slice(y*360*4,(y+1)*360*4).some(v=>v),'Flying devils stay in the distant sky');
