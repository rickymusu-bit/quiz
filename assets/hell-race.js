/* Hellscape — scena continua con raster adattivo e atlanti nativi.
   Nessuna modifica al motore, ai punteggi o ai salvataggi. */
(function (root) {
  'use strict';
  const {rasterWidth: RACE_WIDTH, rasterHeight: H} = root.FoolLayout.reference;
  const motion = root.FoolMotion;
  const lanes = [282, 316, 350];
  const colors = ['#d6ad75', '#be7554', '#b4a08c'];
  const VEHICLES = ['chopper', 'pickup', 'truck', 'coupe', 'offroad', 'ape'];
  // Widths in logical race pixels; preserve each complete silhouette's aspect ratio.
  const vehicleWidths = [44, 58, 62, 54, 56, 40];
  const sheets = { vehicles: null, world: null };
  const files = { vehicles: 'vehicles-drive-v1.webp', world: 'infernal-world-v1.webp' };
  // Shared atlases are decoded once; every state uses the same images.
  if (typeof root.Image === 'function') {
    for (const key of Object.keys(sheets)) {
      const img = new root.Image();
      img.decoding = 'async';
      const assetPath = 'assets/hell-race/' + files[key];
      img.src = root.HellscapeOffline?.assets?.[assetPath] || assetPath;
      img.addEventListener('load', () => live?.redraw?.(), { once: true });
      sheets[key] = img;
    }
  }
  const imageReady = img => !!img && img.complete && img.naturalWidth > 0;
  const frameBounds = new Map();
  // One shared crop for each animation row prevents jitter between poses.
  function frameRect(key, columns, rows, row, frame) {
    const img=sheets[key],cw=img.naturalWidth/columns,ch=img.naturalHeight/rows,rowTop=row*ch;
    const cacheKey = key + ':' + row;
    if (!frameBounds.has(cacheKey)) {
      const work = document.createElement('canvas');work.width=img.naturalWidth;work.height=img.naturalHeight;
      const ctx=work.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
      const pixels=ctx.getImageData(0,0,work.width,work.height).data;
      let left=cw,top=ch,right=0,bottom=0;
      for(let f=0;f<columns;f++)for(let y=0;y<Math.floor(ch);y++)for(let x=0;x<Math.floor(cw);x++){
        const a=pixels[(Math.floor(rowTop+y)*work.width+Math.floor(f*cw+x))*4+3];
        if(a>24){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1)}
      }
      frameBounds.set(cacheKey,right>left?[left,top,right-left,bottom-top]:[0,0,cw,ch]);
    }
    const [x,y,w,h]=frameBounds.get(cacheKey);return [frame*cw+x,rowTop+y,w,h];
  }
  const animationRows=new Map();
  // Generated artwork is not a uniform grid. Identify whole silhouettes before
  // sampling animation frames, rather than slicing through wheels and bumpers.
  function vehicleRow(row){return atlasRow('vehicles',row)}
  function atlasRow(key,row){
    const cacheKey=key+':'+row;
    if(animationRows.has(cacheKey))return animationRows.get(cacheKey);
    const img=sheets[key],columns=8;
    const bands=[[70,245],[255,435],[440,625],[650,790],[800,960],[985,1165]];
    const referenceHeight=1254;
    const top=Math.floor(bands[row][0]*img.naturalHeight/referenceHeight),height=Math.ceil((bands[row][1]-bands[row][0])*img.naturalHeight/referenceHeight),width=img.naturalWidth;
    const work=document.createElement('canvas');work.width=width;work.height=height;
    const ctx=work.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,-top);
    const raw=ctx.getImageData(0,0,width,height),labels=new Int32Array(width*height),components=[];
    let id=0;
    for(let start=0;start<labels.length;start++){
      if(labels[start]||raw.data[start*4+3]<32)continue;
      id++;const stack=[start];labels[start]=id;let count=0,left=width,right=0;
      while(stack.length){const at=stack.pop(),x=at%width;count++;left=Math.min(left,x);right=Math.max(right,x);
        for(const next of [at-1,at+1,at-width,at+width])if(next>=0&&next<labels.length&&!labels[next]&&Math.abs(next%width-x)<=1&&raw.data[next*4+3]>=32){labels[next]=id;stack.push(next)}
      }
      if(count>1000)components.push({id,left,right});
    }
    const pieces=components.sort((a,b)=>a.left-b.left).flatMap(part=>{
      const count=Math.max(1,Math.round((part.right-part.left+1)/(width/columns)));
      return Array.from({length:count},(_,i)=>({...part,min:part.left+i*(part.right-part.left+1)/count,max:part.left+(i+1)*(part.right-part.left+1)/count}));
    });
    if(pieces.length!==columns)throw Error(key+' atlas: unexpected silhouette count for row '+row);
    const frames=pieces.map(part=>{
      const pixels=[];let l=width,t=height,r=0,b=0;
      for(let at=0;at<labels.length;at++){const x=at%width,y=Math.floor(at/width);
        if(labels[at]===part.id&&x>=part.min&&x<part.max){pixels.push(at);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
      }
      return {pixels,l,t,r,b};
    });
    // An outer-edge pose is truncated in the source art: reuse a complete pose.
    frames.forEach((frame,i)=>{if(frame.r>=width-1)frames[i]=frames[Math.max(0,i-1)]});
    const frameWidth=Math.max(...frames.map(f=>f.r-f.l+1))+8,
      frameHeight=Math.max(...frames.map(f=>f.b-f.t+1))+8;
    const result=frames.map(frame=>{
      const canvas=document.createElement('canvas');canvas.width=frameWidth;canvas.height=frameHeight;
      const c=canvas.getContext('2d'),out=c.createImageData(frameWidth,frameHeight),dx=Math.floor((frameWidth-(frame.r-frame.l+1))/2),dy=frameHeight-4-(frame.b-frame.t+1);
      for(const at of frame.pixels){const x=at%width-frame.l+dx,y=Math.floor(at/width)-frame.t+dy;out.data.set(raw.data.subarray(at*4,at*4+4),(y*frameWidth+x)*4)}
      c.putImageData(out,0,0);return canvas;
    });
    animationRows.set(cacheKey,result);return result;
  }
  function sprite(c,key,columns,rows,row,frame,x,y,width,height){
    if(!imageReady(sheets[key]))return false;
    const animated=key==='vehicles';
    const image=animated?atlasRow(key,row)[frame]:sheets[key];
    const rect=animated?[0,0,image.width,image.height]:frameRect(key,columns,rows,row,frame),scale=Math.min(width/rect[2],height/rect[3]);
    const w=rect[2]*scale,h=rect[3]*scale;
    c.drawImage(image,...rect,x+(width-w)/2,y+height-h,w,h);return true;
  }
  function vehicleSize(row, scale = 2) {
    const frame = vehicleRow(row)[0];
    const width = vehicleWidths[row] * (scale < 2 ? .65 : (root.FoolBridge?.RACE_SCALE ?? 1.24));
    return { width, height: width * frame.height / frame.width };
  }
  function drawVehicle(c, row, frame, x, ground, scale = 2) {
    // The source atlas varies body length between drawings. A single canonical
    // metal body is used in motion, outlines, captures and previews.
    frame = 0;
    const size = vehicleSize(row, scale);
    const bounds = { x: x - size.width / 2, y: ground - size.height,
      width: size.width, height: size.height };
    sprite(c, 'vehicles', 8, 6, row, frame, bounds.x, bounds.y, bounds.width, bounds.height);
    return bounds;
  }
  function vehiclePreview(id){
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
    canvas.width=320;canvas.height=180;
    const paint=()=>{const c=canvas.getContext('2d');c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,160,90);const row=Math.max(0,VEHICLES.indexOf(id)),size=vehicleSize(row);
      // One common preview scale retains the same relative sizes as the race.
      const zoom=1.35/(root.FoolBridge?.RACE_SCALE ?? 1.24); sprite(c,'vehicles',8,6,row,0,80-size.width*zoom/2,86-size.height*zoom,size.width*zoom,size.height*zoom)};
    if(imageReady(sheets.vehicles))paint();else sheets.vehicles?.addEventListener('load',paint,{once:true});
    return canvas;
  }
  const reduce = root.matchMedia('(prefers-reduced-motion: reduce)');
  const ammo = root.FoolAmmo?.createTracker();
  const tie = root.FoolTie?.createTracker();
  let live = null, last = null, clock = new motion.Clock(), clockId = null;
  let visualState = null;
  // Browsers can suspend RAF even for a brief tab switch; discard that gap explicitly.
  document.addEventListener?.('visibilitychange', () => clock.rebase(performance.now()));
  document.addEventListener?.('foolorientation',()=>{clock.rebase(performance.now());live?.redraw?.();});
  function syncVisual(state, final) {
    if (!visualState || visualState.id !== state.id) {
      const consumed = state.groups.map((g,i)=>g.out&&!(final&&state.winner===null&&i===state.respondent)?i:null).filter(i=>i!==null);
      visualState={id:state.id,outs:state.groups.map(g=>g.out),consumed:new Set(consumed),queue:[],plan:null,elapsed:0,key:null,completed:false,frame:null,entry:null,paused:false,contacts:new motion.ContactTracker()};
    }
    state.groups.forEach((g,i)=>{if(g.out&&!visualState.outs[i]&&!visualState.consumed.has(i))visualState.queue.push({index:i,start:null});});
    visualState.outs=state.groups.map(g=>g.out);
    const key=final?state.id+':'+state.winner:null;
    if(final&&visualState.key!==key){visualState.plan=root.FoolEnding.plan(state,[...visualState.consumed],visualState.queue.map(q=>q.index));visualState.elapsed=0;visualState.key=key;visualState.completed=false;visualState.entry=null;}
    return visualState;
  }
  function endingHelpers(state) {
    return {vehicleIndex:(s,i)=>Math.max(0,VEHICLES.indexOf(s.config.vehicles?.[i]||['chopper','pickup','ape'][i])),
      vehicleSize:row=>imageReady(sheets.vehicles)?vehicleSize(row):{width:50,height:40},
      drawVehicle:(...args)=>{if(imageReady(sheets.vehicles))return drawVehicle(...args)},
      entry:visualState?.entry,
      runDust:(c,d,t)=>{if(t)root.FoolCerbero.dust(c,d,t);},
      travelFor:(time,distance)=>visualState.contacts.sample(time,distance),
      onFrame:(frame,travel)=>{visualState.frame=frame;visualState.lastTravel=travel;if(frame.removed)visualState.consumed.add(frame.victim);},
      demon:(c)=>drawChaser(c,clock.snapshot())};
  }
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const r = (c, x, y, w, h, color) => {
    c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const line = (c, x, y, w, color) => r(c, x, y, w, 2, color);
  // Absolute logarithmic scale: equal scores always share the same distance,
  // regardless of opponents or vehicles. Each early point has more visual impact.
  // Full visible advance is capped at five maximum-value answers.
  function positionScore(state, index) {
    const score = state.groups[index].score;
    const n = BigInt(score.n), d = BigInt(score.d);
    const maxBase = BigInt(Math.max(1, ...Object.values(state.config.bases || { standard: 300 })));
    // BigInt first: handles exact fractional points and huge totals without overflow.
    // 1_000_000 subdivisions per maximum-value answer, capped at five answers.
    const scaled = n * 1000000n / (d * maxBase);
    const capped = scaled > 5000000n ? 5000000n : scaled;
    return Math.log1p(Number(capped) / 1000000) / Math.log(6);
  }
  const ADVANCE_SECONDS = 1.55;
  const RACE_START_X = 254;
  const RACE_SPAN_X = 156;
  function bitmap(c, x, y, lines, palette, size) {
    lines.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = palette[row[i]];
        if (color) r(c, x + i * size, y + j * size, size, size, color);
      }
    });
  }
  const vehicles = [
    ['            11111       ',
     '      3333333111144     ',
     '   333333333311111144   ',
     '  3332222333332222244  ',
     '  3222222222222222224  ',
     '  3555333333333355533  ',
     '   555  66      66  55 ',
     '       6666    6666    '],
    ['             44         ',
     '         1121444        ',
     '       111111114        ',
     '  333  222222233333     ',
     ' 3333332222223333333    ',
     '  555533333333555533    ',
     '   6666       6666      ',
     '    66         66       '],
    ['     1444      1444     ',
     '  1111444  1111444     ',
     '  111111111111111144    ',
     '  33333322223333333333  ',
     '  32222222222222222333 ',
     '  35553333333333555333 ',
     '   6666 66 66  6666    ',
     '    66 666666   66     ']
  ];
  // Analytical particles: time alone determines their position. No game RNG,
  // particle backlog or independent timers, so pause and reduced motion stay exact.
  const dustNoise = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  function dustPuff(c, x, ground, age, life, size, drift, seed, strength = 1) {
    if (age < 0 || age >= life) return;
    const t = age / life, swell = Math.sqrt(t), fade = Math.min(1, t * 7) * Math.pow(1 - t, 1.4);
    const radius = size * (.28 + swell * .85);
    const px = x - drift * age, py = ground - 1 - size * swell * (.55 + dustNoise(seed) * .45);
    // Broken silhouettes and translucent overlapping lobes, never a solid square.
    for (let lobe = 0; lobe < 4; lobe++) {
      const spread = dustNoise(seed + lobe * 3), w = Math.max(2, radius * (1.05 + spread));
      const h = Math.max(1, radius * (.45 + dustNoise(seed + lobe + 9) * .45));
      const dx = (spread - .5) * radius * 1.8, dy = -dustNoise(seed + lobe + 17) * radius * .55;
      c.globalAlpha = Math.min(.38, fade * strength * (lobe === 0 ? .34 : .22));
      r(c, px + dx - w / 2, py + dy - h, w, h, lobe % 2 ? '#8b6c4e' : '#b08b61');
      if (lobe === 1) {
        c.globalAlpha *= .5;
        r(c, px + dx - w / 2 + 1, py + dy - h, Math.max(1, w - 2), 1, '#d2ae77');
      }
    }
    // Low, darker dust rolling across the road, beneath the airborne cloud.
    c.globalAlpha = fade * strength * .18;
    r(c, px - radius, ground - 2, radius * 2, 2, '#594434');
  }
  function dirtChip(c, x, ground, age, life, seed, power = 1, direction = -1) {
    if (age < 0 || age >= life) return;
    const t = age / life, vx = 15 + dustNoise(seed) * 32;
    const lift = (5 + dustNoise(seed + 4) * 10) * power;
    const px = x + direction * vx * age, py = ground - 1 - 4 * lift * t * (1 - t);
    const size = (dustNoise(seed + 8) > .7 ? 2 : 1) * power;
    c.globalAlpha = (1 - t * t) * .8;
    r(c, px, py - size, size, size, '#654935');
    r(c, px, py - size, size, 1, '#a47c50');
  }
  function vehicleDust(c, rear, ground, tick, row, scale = 1) {
    const weight = [.65, 1.1, 1.45, .85, 1.2, .7][row];
    const rate = 11, serial = Math.floor(tick * rate);
    c.save();
    for (let i = 0; i < 16; i++) {
      const birth = serial - i, seed = birth + row * 101;
      const age = tick - birth / rate;
      const life = .9 + dustNoise(seed + 3) * .45;
      dustPuff(c, rear, ground, age, life, (5 + dustNoise(seed + 6) * 4) * weight * scale,
        (30 + dustNoise(seed + 12) * 15) * scale, seed, .85);
      if (i < 10) dirtChip(c, rear + 2, ground, age, .35 + dustNoise(seed + 7) * .25, seed, scale);
    }
    c.restore();
  }
  function racer(c, x, y, i, tick, g, scale = 2) {
    if (scale <= 0) return;
    const unit = Math.max(1, Math.round(scale));
    const vehicle = vehicles[i % vehicles.length];
    const palette = { '1': '#312b34', '2': colors[i], '3': '#74584c',
      '4': '#e8a750', '5': '#d7b89a', '6': '#141117' };
    const left = Math.round(x - 25 * unit), top = Math.round(y - 8 * unit);
    // Fumo, polvere e calore continuano a muoversi anche con i PNG statici.
    if (imageReady(sheets.vehicles)) {
      const chosen = VEHICLES.indexOf(g.vehicle || ''); 
      const id = chosen < 0 ? i % VEHICLES.length : chosen;
      const size = vehicleSize(id, scale);
      const destW = size.width, destH = size.height;
      const destX = Math.round(x - destW * .50);
      const destY = Math.round(y - destH);
      vehicleDust(c, destX + destW * .16, y - 1, tick + i * .37, id, scale < 2 ? .65 : 1);
      const bounds = drawVehicle(c,id,Math.floor(tick*10+i*2)%8,x,y,scale);
      if (g.out) {
        c.fillStyle = '#0b0908aa';
        c.fillRect(destX, destY, destW, destH);
        r(c, destX + destW * .47, destY + 4, 4, 4, '#da572b');
      }
      return bounds;
    }
    // Fallback minimale se la rete impedisce il caricamento degli asset.
    vehicleDust(c, left + 5 * unit, y + unit, tick + i * .37, i % VEHICLES.length, scale < 2 ? .65 : 1);
    bitmap(c, left, top, vehicle, palette, unit);
    // Tre piloti con casco, maschera e occhialoni, distinti dai loro mezzi.
    const headX = left + (i === 1 ? 11 : 12) * unit;
    r(c, headX - unit, top - 2 * unit, 5 * unit, 4 * unit, '#291923');
    r(c, headX, top - 4 * unit, 4 * unit, 4 * unit,
      i === 0 ? '#a94b42' : i === 1 ? '#d2a266' : '#c9c2a0');
    r(c, headX + 2 * unit, top - 2 * unit, 2 * unit, unit, '#f5d282');
    r(c, headX + 2 * unit, top - unit, unit, unit, '#10111a');
    const wobble = Math.floor(tick * 9) % 2;
    r(c, left + 7 * unit, top + (7 + wobble) * unit, 5 * unit, unit, '#23191c');
    r(c, left + 18 * unit, top + (7 + wobble) * unit, 4 * unit, unit, '#23191c');
    if (g.out) {
      r(c, left + 6 * unit, top + 3 * unit, 12 * unit, 3 * unit, '#211a20');
      r(c, left + 10 * unit, top, 3 * unit, 3 * unit, '#ff663e');
    }
    return { x: left, y: top - 4 * unit, width: 50 * unit, height: 24 * unit };
  }
  const devilFrames=new Map();
  function devilFrame(frame) {
    if(devilFrames.has(frame))return devilFrames.get(frame);
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=180;
    const c=canvas.getContext('2d'),flap=Math.sin(frame/16*Math.PI*2)*7;
    c.translate(96,72);c.scale(3,3);
    const shade=c.createLinearGradient(0,-18,0,25);
    shade.addColorStop(0,'#301815');shade.addColorStop(.55,'#160c0c');shade.addColorStop(1,'#281411');
    c.fillStyle=shade;
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      c.beginPath();c.moveTo(2,-1);
      c.bezierCurveTo(8,-7,17,-13+flap,29,-10+flap);
      c.quadraticCurveTo(24,-4+flap,26,3+flap*.35);
      c.quadraticCurveTo(19,-1,17,7+flap*.2);
      c.quadraticCurveTo(12,2,10,10);
      c.quadraticCurveTo(7,4,3,6);c.closePath();c.fill();
      c.strokeStyle='#603326';c.lineWidth=.45;c.globalAlpha=.65;
      for(const [tx,ty] of [[28,-10+flap],[25,3+flap*.35],[17,7+flap*.2]]){
        c.beginPath();c.moveTo(3,0);c.quadraticCurveTo(10,-5,tx,ty);c.stroke();
      }
      c.globalAlpha=1;
      c.beginPath();c.moveTo(2,-6);c.quadraticCurveTo(10,-11,7,-18);
      c.quadraticCurveTo(6,-11,1,-10);c.closePath();c.fill();
      c.beginPath();c.moveTo(2,5);c.lineTo(5,13);c.lineTo(3,18);
      c.lineTo(8,17);c.lineTo(7,14);c.lineTo(7,10);c.lineTo(4,3);c.closePath();c.fill();
      c.restore();
    }
    c.beginPath();c.ellipse(0,-6,3.4,4.6,0,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(-3,-3);c.quadraticCurveTo(-5,3,-2,9);
    c.lineTo(2,9);c.quadraticCurveTo(5,3,3,-3);c.closePath();c.fill();
    c.strokeStyle='#291412';c.lineWidth=1.8;c.lineCap='round';
    c.beginPath();c.moveTo(0,7);c.bezierCurveTo(-1,15,17,13,13,23);c.stroke();
    c.beginPath();c.moveTo(13,26);c.lineTo(9,20);c.lineTo(16,21);c.closePath();c.fill();
    // Rasterize once at the same source density as the illustrated scene assets.
    // Subtle grain and wing ribs keep the distant silhouettes from looking like flat icons.
    c.globalCompositeOperation='source-atop';
    for(let n=0;n<160;n++){
      const x=((n*37)%173)/3-28,y=((n*71)%137)/3-17;
      c.fillStyle=n%3?'#77402c55':'#09070888';c.fillRect(x,y,.3,.4);
    }
    devilFrames.set(frame,canvas);return canvas;
  }
  function devilPosition(index,width,time) {
    const span=width+90,slot=(index+.5)*span/8;
    return {x:((slot+time*2)%span+span)%span-45,
      y:25+((index*3)%8)*17+Math.sin(time*.65+index*2)*1.4,
      size:.48+(index%3)*.065};
  }
  function flyingDevils(c,W,time) {
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    for(let i=0;i<8;i++){
      const p=devilPosition(i,W,time),direction=i%2?-1:1;
      const frame=((Math.floor(time*5.5+i*2.3)%16)+16)%16;
      const image=devilFrame(frame);
      c.save();c.translate(p.x,p.y);c.scale(direction*p.size,p.size);
      c.globalAlpha=1;
      c.drawImage(image,-32,-24,64,60);c.restore();
    }
    c.restore();
  }

  function background(c, W, tick, progress, effectTime=tick, ending=null) {
    const layers=ending?.bridge?{damage:ending.bridge,
      behind:()=>root.FoolPortal.back(c,ending.portal)}:null;
    if(root.FoolBridge?.environment(c,W,H,tick,effectTime)){
      flyingDevils(c,W,effectTime);
      root.FoolBridge.draw(c,W,tick,progress,null,effectTime,layers);
      return;
    }
    if(imageReady(sheets.world)){
      const img=sheets.world;
      // Distant architecture and foreground scroll at different velocities.
      for(const [sy,sh,dy,dh,speed] of [[0,.63,0,190,5],[.74,.26,365,19,48]]){
        const tw=W*2,offset=(tick*speed)%tw;
        for(let x=-offset;x<W;x+=tw)c.drawImage(img,0,img.naturalHeight*sy,img.naturalWidth,img.naturalHeight*sh,Math.floor(x),dy,tw,dh);
      }
      flyingDevils(c,W,effectTime);
      if(root.FoolBridge)root.FoolBridge.draw(c,W,tick,progress,img,effectTime,layers);
      else if(root.FoolTerrain)root.FoolTerrain.draw(c,W,tick,progress,img,effectTime);
      else{c.fillStyle='#161614';c.fillRect(0,184,W,181);}
      return;
    }

    c.save();c.scale(1,H/156);
    c.fillStyle = '#2c101b'; c.fillRect(0, 0, W, 156);
    r(c, 0, 0, W, 23, '#180b19');
    r(c, 0, 23, W, 17, '#431622');
    r(c, 0, 40, W, 30, '#6a2420');
    // Astro color zolfo.
    r(c, W * .72, 6, 33, 33, '#e26b34');
    r(c, W * .72 + 5, 11, 23, 23, '#ffbc64');
    // Vulcani e fumarole in parallasse lento.
    const offset = (tick * 6) % 180;
    for (let x = -220 - offset; x < W + 180; x += 180) {
      for (let j = 0; j < 36; j++) {
        const top = 64 - j * .9;
        r(c, x + j * 2, top, 145 - j * 4, 2, '#27121a');
      }
      r(c, x + 74, 18, 12, 42, '#2b1920');
      r(c, x + 76, 8, 8, 14, '#775044');
      r(c, x + 77, 5, 6, 6, '#e58448');
    }
    for (let j = 0; j < 20; j++) {
      const x = ((j * 113 - tick * (8 + (j % 3) * 8)) % (W + 50) + W + 50) % (W + 50);
      r(c, x, (j * 31) % 57, 2, 2, j % 2 ? '#cc6036' : '#ef9d4f');
    }
    // Colate laviche oltre la strada.
    r(c, 0, 66, W, 7, '#101018');
    for (let x = -60 - (tick * 28) % 54; x < W; x += 54) {
      r(c, x, 65, 29, 3, '#fa7533');
      r(c, x + 9, 69, 12, 2, '#e4a143');
    }
    r(c, 0, 73, W, 156 - 73, '#1c1c24');
    c.restore();
    flyingDevils(c,W,effectTime);
    if(root.FoolBridge)root.FoolBridge.draw(c,W,tick,progress,null,effectTime,layers);
    else if(root.FoolTerrain)root.FoolTerrain.draw(c,W,tick,progress,null,effectTime);
  }
  function drawChaser(c,travel,advance=0,breath=null){drawChaserAt(c,travel,{...motion.CHASE,left:motion.CHASE.left+advance},true,breath);}
  function drawChaserAt(c,travel,geometry,dust=true,breath=null){
    root.FoolCerbero.load(()=>live?.redraw?.());
    const body={...geometry,runWeight:1,pose:[{frame:8,weight:1}],worldDistance:travel.distance,time:travel.time,
      animation:breath?.active?'fire':'walk',movingFire:true,actionTime:breath?.age??0};
    const rig=root.FoolCerbero.render(c,body,travel);
    if(rig&&breath?.active)for(const id of root.FoolCerbero.heads)
      root.FoolCerbero.flame(c,id,breath.emissionAge,rig.heads[id],1.3);
    if(dust)root.FoolCerbero.dust(c,body,travel);
  }

  const outlineFrames=new Map();
  function vehicleOutline(c, row, frame, x, ground) {
    frame = 0;
    if (!imageReady(sheets.vehicles)) return;
    const source = vehicleRow(row)[frame], key = row + ':' + frame;
    let mask = outlineFrames.get(key);
    if (!mask) {
      mask = document.createElement('canvas');
      mask.width = source.width; mask.height = source.height;
      const ctx = mask.getContext('2d');
      ctx.drawImage(source, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffe044';
      ctx.fillRect(0, 0, mask.width, mask.height);
      outlineFrames.set(key, mask);
    }
    const size = vehicleSize(row), left = Math.round(x - size.width / 2),
      top = Math.round(ground - size.height), w = Math.round(size.width), h = Math.round(size.height);
    for (const [dx, dy] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[-1,1],[1,-1],[1,1]])
      c.drawImage(mask, left + dx, top + dy, w, h);
  }
  function packPosition(state, index, progress, previous, sec, W = RACE_WIDTH) {
    // No per-lane horizontal offset: tied players have the exact same x.
    const scale = W / RACE_WIDTH, ratio = positionScore(state, index);
    const dest = (RACE_START_X + RACE_SPAN_X * ratio) * scale;
    const start = previous
      ? (RACE_START_X + RACE_SPAN_X * previous[index]) * scale
      : dest;
    const sizes=state.groups.map((g,i)=>{
      const row=Math.max(0,VEHICLES.indexOf(state.config.vehicles?.[i]||['chopper','pickup','ape'][i]));
      return imageReady(sheets.vehicles)?vehicleSize(row):{width:36,height:28};
    });
    const grounds=root.FoolBridge?.grounds(sizes.map(s=>s.height))??lanes;
    return { x: start + (dest - start) * smooth(sec / ADVANCE_SECONDS), y: grounds[index], ...sizes[index] };
  }
  function normalFrame(state,positions,travel,advance=0){
    return {time:travel.time,camera:{distance:travel.distance,speed:travel.speed},
      demon:{...motion.CHASE,left:motion.CHASE.left+advance,runWeight:1,pose:[{frame:0,weight:1}],worldDistance:travel.distance+advance},
      positions:positions.map((p,index)=>({...p,index,ground:p.y,row:Math.max(0,VEHICLES.indexOf(state.config.vehicles?.[index]||['chopper','pickup','ape'][index])),visible:!visualState?.consumed.has(index)}))};
  }
  function copyFrame(frame){return JSON.parse(JSON.stringify(frame));}
  function scene(c,W,state,sec,final,previous,reduced,travel){
    const total=Math.max(1,Number(state.config.roundCount!==undefined
      ? state.config.roundCount*state.groups.length
      : state.config.turnCount||state.config.questionCount||33));
    const turnBased=state.config.roundCount!==undefined||state.config.turnCount!==undefined;
    const progress=root.FoolTerrain?root.FoolTerrain.progress(state)
      :clamp((turnBased?state.completedTurns:state.valid)/total,0,1);
    const positions=state.groups.map((g,i)=>packPosition(state,i,progress,previous,sec,W));
    const shot=ammo?.current(),queue=visualState?.queue||[];
    const tieView=tie?.sample({reduced,captures:queue.length>0}),hold=tieView?.holdCapture;
    const E=root.FoolEnding,ready=E&&imageReady(E.load(()=>live?.redraw?.()));
    const backgroundAt=(distance,frame=null)=>background(c,W,reduced?0:distance/motion.ROAD_SPEED,progress,reduced?0:travel.time,frame);
    if(!hold&&!shot&&final&&E){
      if(!ready){backgroundAt(travel.distance);endingHelpers(state).demon(c,0);return E.load(()=>{})?.failed?'done':'loading';}
      if(!visualState.entry){
        visualState.entry=copyFrame(visualState.frame||normalFrame(state,positions,travel));
        visualState.entry.time=travel.time-visualState.elapsed;
        visualState.plan=E.plan(state,[...visualState.consumed],queue.map(q=>q.index),visualState.entry);
      }
      const time=reduced?visualState.plan.duration:visualState.elapsed,helpers=endingHelpers(state);
      const sampled=E.frame(visualState.plan,state,time,helpers);
      c.save();if(!reduced&&sampled.shake)c.translate(sampled.shake.x,sampled.shake.y);
      backgroundAt(sampled.camera.distance,sampled);
      const phase=E.render(c,W,state,visualState.plan,time,helpers);c.restore();return phase;
    }
    if(!hold&&!shot&&queue.length&&E){
      if(reduced||E.load(()=>{})?.failed){for(const item of queue)visualState.consumed.add(item.index);queue.length=0;}
      else if(ready){
        while(queue.length){
          const item=queue[0];
          if(item.start===null){
            const entry=copyFrame(visualState.frame||normalFrame(state,positions,travel));entry.time=travel.time;
            item.route=E.capturePlan(entry,item.index);item.start=travel.time;
          }
          const age=Math.max(0,travel.time-item.start);
          if(age>=E.CAPTURE){
            const end=root.FoolChase.captureFrame(item.route,E.CAPTURE);
            const footsteps=visualState.contacts.sample(end.time,end.demon.worldDistance).footfalls;
            clock.adoptTravel(end.camera.distance,end.camera.speed,footsteps);travel=clock.snapshot();
            visualState.consumed.add(item.index);queue.shift();
          }else{
            const frame=root.FoolChase.captureFrame(item.route,age);backgroundAt(frame.camera.distance);
            E.renderCapture(c,W,state,item.route,age,endingHelpers(state));return 'capture';
          }
        }
      }
    }
    backgroundAt(travel.distance);
    const movement=reduced?0:travel.roadTime;
    const order=state.groups.map((g,i)=>i).sort((a,b)=>positions[a].y-positions[b].y);
    for(const i of order){
      const group=state.groups[i],awaitingCapture=hold&&queue.some(q=>q.index===i);
      if(group.out&&!awaitingCapture&&!(shot?.type==='ira'&&shot.targets.includes(i)))continue;
      const vehicle=state.config.vehicles?.[i]||['chopper','pickup','ape'][i],p=positions[i],row=Math.max(0,VEHICLES.indexOf(vehicle));
      const ride=reduced?{heave:0,pitch:0}:motion.suspension(travel.distance,p.x,p.width);
      c.save();c.translate(p.x,p.y+ride.heave);c.rotate(ride.pitch);
      if(i===state.respondent||(tieView?.blocking&&tieView.kind!=='elimination'&&state.tieOrder.includes(i)))vehicleOutline(c,row,0,0,0);
      racer(c,0,0,i,movement,{...group,vehicle},2);c.restore();
    }
    const staticTravel=reduced?{...travel,time:0,footfalls:[]}:travel;
    const breath=!reduced&&!shot&&!hold&&state.phase==='ordinaria'?root.FoolCerbero.periodicFire(travel.time):null;
    drawChaser(c,staticTravel,(tieView?.strength??0)*10,breath);
    if(visualState)visualState.frame=normalFrame(state,positions,travel,(tieView?.strength??0)*10);
    if(shot)root.FoolAmmo.render(c,W,state,shot,ammo.sample(reduced),positions,reduced);
    root.FoolBridge?.front(c,W,{distance:travel.distance});
    if(shot)return 'ammo';
    if(hold)return tieView.blocking?'eliminated':'race';
    return queue.length?'capture':tieView?.blocking?'tie-intro':'race';
  }

  function createStage(state, final = false) {
    if (live) root.cancelAnimationFrame(live.frame);
    ammo?.sync(state);
    tie?.sync(state);
    root.FoolAmmo?.load(()=>live?.redraw?.());
    root.FoolBridge?.load(()=>live?.redraw?.());
    if(root.FoolEnding){syncVisual(state,final);root.FoolEnding.load(()=>live?.redraw?.());}
    const fig = document.createElement('figure');
    fig.className = 'hell-race' + (final ? ' hell-race-final' : '');
    if(final)fig.dataset.endingPhase='loading';
    const canvas = document.createElement('canvas');
    canvas.height = H;
    canvas.width = RACE_WIDTH;
    canvas.setAttribute('aria-hidden', 'true');
    fig.appendChild(canvas);
    const caption = document.createElement('figcaption');
    caption.className = 'hell-race-caption';
    caption.textContent = final
      ? (state.winner === null ? 'Cerbero afferra l’ultimo veicolo con una bocca e lo scaraventa nella lava, dove affonda. Nessun giocatore è fuggito.' : state.groups[state.winner].name + ' attraversa il portale che emerge dal terreno. Gli altri veicoli sono gettati nella lava con un morso. Dopo il crollo del varco Cerbero sputa fuoco da tutte e tre le bocche.')
      : 'Fuga dall’Inferno: le posizioni dei tre veicoli seguono i punteggi. La porta si avvicina con il procedere dei turni.';
    fig.appendChild(caption);
    const ammoStatus = document.createElement('span');
    ammoStatus.className = 'ammo-status';
    ammoStatus.setAttribute('role','status');
    fig.appendChild(ammoStatus);
    const sceneControls=document.createElement('div');sceneControls.className='scene-controls';sceneControls.hidden=true;
    const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.setAttribute('aria-keyshortcuts','P');
    pauseButton.onclick=()=>fig.dispatchEvent(new CustomEvent('foolscenepause',{bubbles:true}));sceneControls.append(pauseButton);fig.append(sceneControls);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return fig;
    ctx.imageSmoothingEnabled = false;
    if (clockId !== state.id) { clock = new motion.Clock(); clockId = state.id; last = null; }
    const start = performance.now(), reduced = reduce.matches;
    fig.dataset.motion = reduced ? 'reduced' : 'full';
    clock.rebase(start);
    const next = state.groups.map((g, i) => positionScore(state, i));
    // Preserve the displayed position across UI rebuilds, including a partial score tween.
    if (!last || last.key !== state.id) last = {key:state.id, x:next, from:next, at:clock.time};
    if (next.some((ratio,i)=>Math.abs(ratio-last.x[i])>.000001)) {
      const mix = smooth((clock.time-last.at)/ADVANCE_SECONDS);
      last = {key:state.id, x:next, from:last.x.map((ratio,i)=>last.from[i]+(ratio-last.from[i])*mix), at:clock.time};
    }
    if (reduced) last.from = next; // A static score update is already visually complete.
    const previous = last.from, tweenStart = last.at;
    const moving = !reduced && clock.time - tweenStart < ADVANCE_SECONDS && previous.some((ratio,i)=>Math.abs(ratio-next[i])>.000001);
    const record = { frame: 0, canvas, phase:final?'loading':'race',pauseable:false };
    const tieLayer=root.FoolTie?.mount(fig,tie,state,()=>record.redraw?.());
    live = record;
    const blocked = () => state.suspended || (state.paused && state.pauseReason !== 'animazione');
    fig.dataset.animationBusy = String(!blocked() && (!!tie?.sample().blocking || !!ammo?.current() || (!reduced && ((final && !visualState?.completed) || (!tie?.sample().holdCapture && visualState?.queue.length > 0) || moving))));
    let phase = final ? 'loading' : visualState?.queue.length ? 'capture' : 'race';
    let lastPaint=null;
    const draw = now => {
      if (live !== record || !canvas.isConnected) return;
      if(root.FoolLayout?.portrait){clock.rebase(now);record.frame=root.requestAnimationFrame(draw);return;}
      // Bound fill rate on DPR displays; all motion still uses elapsed time.
      if(lastPaint!==null&&now-lastPaint<1000/30-.5){record.frame=root.requestAnimationFrame(draw);return;}
      lastPaint=now;
      const width = RACE_WIDTH;
      // Match CSS size and effective DPR, bounded to 1536×1152 (7 MiB RGBA).
      const rasterScale=Math.max(1,Math.min(1536/width,canvas.getBoundingClientRect().width/width*Math.min(2,root.devicePixelRatio||1)));
      const rasterWidth=Math.round(width*rasterScale),rasterHeight=Math.round(H*rasterScale);
      if(canvas.width!==rasterWidth||canvas.height!==rasterHeight){canvas.width=rasterWidth;canvas.height=rasterHeight;}
      ctx.setTransform(canvas.width/width,0,0,canvas.height/H,0,0);
      ctx.imageSmoothingEnabled = true;ctx.imageSmoothingQuality='high';
      const stop = blocked() || document.hidden || tie?.sample().paused || visualState?.paused;
      const delta = clock.advance(now, {blocked:stop, reduced,
        target:tie?.sample().blocking&&phase!=='capture'?motion.ROAD_SPEED*.35:motion.roadTarget(final, phase)});
      if(ammo?.current()&&!stop)ammo.advance(delta,reduced);
      const shot = ammo?.current();
      fig.dataset.ammo = shot?.type ?? '';
      if(ammoStatus.dataset.event !== (shot?.id ?? '')) {
        ammoStatus.dataset.event = shot?.id ?? '';
        ammoStatus.textContent = shot ? (shot.blocked ? 'Sigillo: attacco bloccato' : root.FoolAmmo.labels[shot.type]) + ' · ' + shot.targets.map(i=>state.groups[i].name).join(', ') : '';
      }
      tie?.advance(delta,{reduced,captures:visualState?.queue.length>0});
      if(final&&visualState?.plan&&!shot&&!stop&&!tie?.sample().holdCapture&&imageReady(root.FoolEnding.load(()=>live?.redraw?.())))visualState.elapsed+=delta;
      const elapsed = clock.time - tweenStart;
      const view=tie?.sample({reduced,captures:visualState?.queue.length>0});
      const zoom=1+(view?.strength??0)*.015;
      ctx.save();ctx.translate(width/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-width/2,-H/2);
      phase=scene(ctx, width, state, reduced ? ADVANCE_SECONDS : elapsed, final, previous, reduced, clock.snapshot());
      ctx.restore();
      if((final&&phase==='done')||(!final&&!visualState?.queue.length))tie?.completeCapture();
      if(view?.strength){ctx.fillStyle='rgba(9,5,14,'+(view.strength*.22)+')';ctx.fillRect(0,0,width,H);}
      const updated=tie?.sample({reduced,captures:visualState?.queue.length>0});
      if(updated){fig.dataset.tiePhase=updated.phase;tieLayer.update(updated);}
      if(final&&fig.dataset.endingPhase!==phase){fig.dataset.endingPhase=phase;if(phase==='done'&&!visualState.completed){for(const index of visualState.plan?.victims||[])visualState.consumed.add(index);visualState.completed=true;fig.dispatchEvent(new CustomEvent('foolendingcomplete',{bubbles:true}));}}
      const busy = !!tie?.sample().blocking || (!blocked() && (phase === 'ammo' || (!reduced && (final ? phase !== 'done' : phase === 'capture' || (moving && elapsed < ADVANCE_SECONDS)))));
      if(fig.dataset.animationBusy !== String(busy)) {
        fig.dataset.animationBusy = String(busy);
        fig.dispatchEvent(new CustomEvent('foolanimationchange',{bubbles:true,detail:{busy,phase}}));
      }
      record.phase=phase;
      record.pauseable=!blocked()&&(final?phase!=='done':phase==='capture');
      sceneControls.hidden=!record.pauseable||!!tie?.sample().blocking;
      const label=visualState?.paused?'Riprendi scena':'Pausa scena';
      if(pauseButton.textContent!==label)pauseButton.textContent=label;
      const complete=tie?.takeCompletion();
      if(complete)fig.dispatchEvent(new CustomEvent('fooltiecomplete',{bubbles:true,detail:complete}));
      if (live === record && (tie?.sample().blocking || ammo?.current() || !reduced)) record.frame = root.requestAnimationFrame(draw);
    };
    record.redraw = () => {
      if (live !== record || !canvas.isConnected) return;
      root.cancelAnimationFrame(record.frame);
      record.frame = root.requestAnimationFrame(draw);
    };
    record.frame = root.requestAnimationFrame(draw);
    return fig;
  }
  root.FoolHellRace = { createStage, vehiclePreview };
  root.FoolHellRace.beginTie = state => tie?.begin(state) ?? false;
  root.FoolHellRace.tieStatus = () => tie?.sample() ?? {blocking:false};
  root.FoolHellRace.pauseTie = () => {tie?.togglePause();live?.redraw?.();};
  root.FoolHellRace.canPauseScene = () => !!live?.pauseable;
  root.FoolHellRace.pauseScene = () => {if(visualState&&live?.pauseable){visualState.paused=!visualState.paused;live.redraw?.();}};
  root.FoolHellRace.presentationSnapshot = () => JSON.parse(JSON.stringify({phase:live?.phase,plan:visualState?.plan,frame:visualState?.frame,consumed:[...(visualState?.consumed||[])]}));
  root.FoolHellRace.motionSnapshot = () => clock.snapshot();
})(window);
