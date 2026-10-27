const {createCanvas,loadImage}=require('@napi-rs/canvas'),vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{const images={};for(const [k,f]of Object.entries({vehicles:'vehicles-drive-v1',demon:'demon-actions-v1',world:'infernal-world-v1',portal:'portal-flames-v1'}))images[k]=await loadImage('assets/hell-race/'+f+'.webp');
const root={FoolLayout:require('../assets/hell-layout.js'),__sheets:images,matchMedia:()=>({matches:false})},document={createElement:()=>createCanvas(1,1)};
let js=fs.readFileSync('assets/hell-race.js','utf8').replace('const sheets = { vehicles: null, demon: null, world: null, portal: null };','const sheets = root.__sheets;').replace('root.FoolHellRace = { createStage, vehiclePreview };','root.FoolHellRace = { createStage, vehiclePreview, atlasRow };');vm.runInNewContext(js,{window:root,document});
const board=createCanvas(4*440,3*330),ctx=board.getContext('2d');ctx.fillStyle='#161819';ctx.fillRect(0,0,board.width,board.height);
for(let row=0;row<3;row++){const frames=root.FoolHellRace.atlasRow('demon',row);assert.equal(frames.length,4);frames.forEach((img,i)=>{
 assert.equal(img.width,frames[0].width);assert.equal(img.height,frames[0].height);
 const data=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let count=0,left=img.width,right=0;
 for(let n=0;n<img.width*img.height;n++)if(data[n*4+3]>32){count++;left=Math.min(left,n%img.width);right=Math.max(right,n%img.width)}
 assert(count>35000,'A frame must contain the complete demon, including horns, head and jaw');
 assert(left>=4&&right<img.width-4,'Silhouette must retain transparent horizontal padding');
 assert(right-left>frames[0].width*.65,'Entire body and head must remain visible');
 ctx.drawImage(img,i*440,row*330);
 })}
if(process.env.DEMON_CONTACT_SHEET)fs.writeFileSync(process.env.DEMON_CONTACT_SHEET,board.toBuffer('image/png'));
console.log('PASS: all 12 demon frames contain complete padded silhouettes');
})().catch(error=>{console.error(error);process.exitCode=1});
