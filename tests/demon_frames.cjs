const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{const images={};for(const [k,f]of Object.entries({vehicles:'vehicles-drive-v1',demon:'demon-actions-v1',world:'infernal-world-v1',portal:'portal-flames-v1'}))images[k]=await loadImage('assets/hell-race/'+f+'.webp');
const root={FoolMotion:require('../assets/hell-motion.js'),FoolLayout:require('../assets/hell-layout.js'),__sheets:images,matchMedia:()=>({matches:false})},document={createElement:()=>createCanvas(1,1)};
let js=fs.readFileSync('assets/hell-race.js','utf8').replace('const sheets = { vehicles: null, demon: null, world: null, portal: null };','const sheets = root.__sheets;').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { createStage, vehiclePreview, atlasRow, drawChaser };');vm.runInNewContext(js,{window:root,document});
const board=createCanvas(4*440,3*330),ctx=board.getContext('2d');ctx.fillStyle='#161819';ctx.fillRect(0,0,board.width,board.height);
for(let row=0;row<3;row++){const frames=root.FoolHellRace.atlasRow('demon',row);assert.equal(frames.length,4);frames.forEach((img,i)=>{
 assert.equal(img.width,frames[0].width);assert.equal(img.height,frames[0].height);
 const data=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let count=0,left=img.width,right=0,top=img.height,bottom=0;
 for(let n=0;n<img.width*img.height;n++)if(data[n*4+3]>32){count++;left=Math.min(left,n%img.width);right=Math.max(right,n%img.width);top=Math.min(top,Math.floor(n/img.width));bottom=Math.max(bottom,Math.floor(n/img.width))}
 assert(count>35000,'A frame must contain the complete demon, including horns, head and jaw');
 assert(left>=4&&right<img.width-4,'Silhouette must retain transparent horizontal padding');
 assert(top>=4&&bottom<img.height-4,'Horns and feet retain vertical padding through every pose');
 assert(right-left>frames[0].width*.65,'Entire body and head must remain visible');
 ctx.drawImage(img,i*440,row*330);
 })}
// Render the actual transformed chase at endpoints and intermediate poses.
for(let sample=0;sample<16;sample++){
 const canvas=createCanvas(512,384),c=canvas.getContext('2d'),distance=sample*4;
 root.FoolHellRace.drawChaser(c,{time:distance/48,roadTime:distance/48,gait:root.FoolMotion.gait(distance),footfalls:[]});
 const data=c.getImageData(0,0,512,384).data;let l=512,r=0,t=384,b=0;
 for(let at=0;at<512*384;at++)if(data[at*4+3]>24){const x=at%512,y=Math.floor(at/512);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
 assert(l>=8&&r<230&&t>0&&b<=303,'Complete chase stays in its stage margins');
 assert(r-l>180&&b-t>120,'Framing preserves the huge demon scale');
}
if(process.env.DEMON_CONTACT_SHEET)fs.writeFileSync(process.env.DEMON_CONTACT_SHEET,board.toBuffer('image/png'));
console.log('PASS: all 12 demon frames contain complete padded silhouettes');
})().catch(error=>{console.error(error);process.exitCode=1});
