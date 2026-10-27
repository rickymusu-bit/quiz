/* Hellscape cinematic: visual timing only. Never writes to game state. */
(function (root) {
  "use strict";
  const CAPTURE = 5.2,
    REACTION = 3.2;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)),
    ease = (x) => {
      x = clamp(x);
      return x * x * (3 - 2 * x);
    },
    lerp = (a, b, t) => a + (b - a) * t;
  function plan(state, consumed = [], pending = []) {
    const eaten=new Set(consumed),winner=state.winner;
    const victims=[...new Set([...pending,...state.groups
      .map((g,i)=>(!g.out&&i!==winner?i:null)).filter(i=>i!==null)])]
      .filter(i=>i!==winner&&!eaten.has(i));
    if(winner===null&&!victims.length&&!eaten.has(state.respondent))victims.push(state.respondent);
    if(winner===null){
      const captureEnd=victims.length*CAPTURE;
      return {winner,victims,captureStart:0,captureEach:CAPTURE,captureEnd,duration:captureEnd+REACTION};
    }
    const captureStart=1.1,captureEach=3.4,captureEnd=captureStart+victims.length*captureEach;
    const portalStart=Math.max(.55,captureEnd-.65),entryStart=Math.max(captureEnd,portalStart+1.55);
    const escapeEnd=entryStart+1.55;
    return {winner,victims,captureStart,captureEach,captureEnd,portalStart,entryStart,escapeEnd,duration:escapeEnd+.6};
  }
  function sample(p,time) {
    const t=Math.max(0,time);
    if(p.winner!==null&&t<p.captureStart)return {phase:'breakout',local:t};
    if(t<p.captureEnd){
      const slot=Math.floor((t-p.captureStart)/p.captureEach);
      return {phase:'capture',victim:p.victims[slot],slot,local:t-p.captureStart-slot*p.captureEach};
    }
    if(p.winner===null)return t<p.duration?{phase:'dance',local:t-p.captureEnd}:{phase:'done',local:REACTION};
    if(t<p.entryStart)return {phase:'rise',local:t-p.portalStart};
    if(t<p.escapeEnd)return {phase:'escape',local:t-p.entryStart};
    if(t<p.duration)return {phase:'arrival',local:t-p.escapeEnd};
    return {phase:'done',local:0};
  }
  // Coordinates in the generated source atlas, mapped into normalized frames.
  const anchors = [
    [405, 205, 311, 122],
    [789, 207, 709, 142],
    [1140, 152, 1085, 131],
    [1481, 121, 1420, 101],
    [367, 350, 317, 346],
    [789, 369, 711, 365],
    [1140, 462, 1108, 376],
    [1490, 475, 1480, 371],
    [0, 0, 291, 595],
    [0, 0, 679, 586],
    [0, 0, 1066, 591],
    [0, 0, 1443, 639],
    [0, 0, 269, 839],
    [0, 0, 643, 832],
    [0, 0, 1068, 891],
    [0, 0, 1401, 829],
  ];
  let atlas = null,
    art = null,
    portal = null;
  function prepare(image) {
    if (atlas) return atlas;
    if (!image?.complete || !image.naturalWidth) return null;
    const rows = [],
      sw = image.naturalWidth,
      sh = image.naturalHeight;
    for (let row = 0; row < 4; row++) {
      const top = Math.floor((row * sh) / 4),
        height = Math.floor(((row + 1) * sh) / 4) - top;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, -top);
      const raw = ctx.getImageData(0, 0, sw, height),
        labels = new Int32Array(sw * height),
        parts = [];
      let serial = 0;
      for (let start = 0; start < labels.length; start++) {
        if (labels[start] || raw.data[start * 4 + 3] < 24) continue;
        const part = {
            id: ++serial,
            count: 0,
            l: sw,
            r: 0,
            t: height,
            b: 0,
            pixels: [],
          },
          stack = [start];
        labels[start] = serial;
        while (stack.length) {
          const at = stack.pop(),
            x = at % sw,
            y = Math.floor(at / sw);
          part.pixels.push(at);
          part.count++;
          part.l = Math.min(part.l, x);
          part.r = Math.max(part.r, x);
          part.t = Math.min(part.t, y);
          part.b = Math.max(part.b, y);
          for (const next of [at - 1, at + 1, at - sw, at + sw])
            if (
              next >= 0 &&
              next < labels.length &&
              !labels[next] &&
              Math.abs((next % sw) - x) <= 1 &&
              raw.data[next * 4 + 3] >= 24
            ) {
              labels[next] = serial;
              stack.push(next);
            }
        }
        parts.push(part);
      }
      const bodies = parts
        .filter((p) => p.count > 8000)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .sort((a, b) => a.l - b.l);
      if (bodies.length !== 4)
        throw Error(
          "Demon ending atlas: expected four complete bodies in row " + row,
        );
      // Keep detached fingers/hand with the nearest body; never cut at a grid line.
      for (const part of parts) {
        if (bodies.includes(part) || part.count < 100) continue;
        const cx = (part.l + part.r) / 2;
        const body = bodies.reduce((a, b) =>
          Math.abs(cx - (a.l + a.r) / 2) < Math.abs(cx - (b.l + b.r) / 2)
            ? a
            : b,
        );
        if (part.t < body.t - 2 || part.b > body.b + 2) continue;
        body.pixels.push(...part.pixels);
        body.l = Math.min(body.l, part.l);
        body.r = Math.max(body.r, part.r);
        body.t = Math.min(body.t, part.t);
        body.b = Math.max(body.b, part.b);
      }
      bodies.forEach((body, col) => rows.push({ ...body, raw, top, row, col }));
    }
    const width = Math.max(...rows.map((p) => p.r - p.l + 1)) + 16,
      height = Math.max(...rows.map((p) => p.b - p.t + 1)) + 16;
    atlas = rows.map((p, index) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d"),
        out = ctx.createImageData(width, height),
        dx = Math.floor((width - (p.r - p.l + 1)) / 2),
        dy = height - 8 - (p.b - p.t + 1);
      for (const at of p.pixels) {
        const x = (at % sw) - p.l + dx,
          y = Math.floor(at / sw) - p.t + dy;
        out.data.set(
          p.raw.data.subarray(at * 4, at * 4 + 4),
          (y * width + x) * 4,
        );
      }
      ctx.putImageData(out, 0, 0);
      const a = anchors[index] || [0, 0, 0, 0],
        point = (x, y) => ({
          x: (x * sw) / 1536 - p.l + dx,
          y: (y * sh) / 1024 - p.top - p.t + dy,
        });
      return {
        canvas: c,
        hand: point(a[0], a[1]),
        mouth: point(a[2], a[3]),
      };
    });
    return atlas;
  }
  function load(redraw) {
    if (!art && typeof root.Image === "function") {
      art = new root.Image();
      art.decoding = "async";
      const path = "assets/hell-race/demon-ending-v1.webp";
      art.src = root.HellscapeOffline?.assets?.[path] || path;
      art.addEventListener("load", redraw, { once: true });
      art.addEventListener(
        "error",
        () => {
          art.failed = true;
          redraw();
        },
        { once: true },
      );
    }
    if(!portal&&typeof root.Image==='function'){
      portal=new root.Image();portal.decoding='async';
      const path='assets/hell-race/celestial-portal-v1.webp';
      portal.src=root.HellscapeOffline?.assets?.[path]||path;
      portal.addEventListener('load',redraw,{once:true});
      portal.addEventListener('error',()=>{portal.failed=true;redraw();},{once:true});
    }
    return art;
  }
  function actor(c, index, x, ground, width = 260) {
    const frames = prepare(art);
    if (!frames) return null;
    const f = frames[index],
      zoom = width / f.canvas.width,
      height = f.canvas.height * zoom,
      y = ground - height;
    c.drawImage(
      f.canvas,
      Math.round(x),
      Math.round(y),
      Math.round(width),
      Math.round(height),
    );
    const point = (p) => ({ x: x + p.x * zoom, y: y + p.y * zoom });
    return { hand: point(f.hand), mouth: point(f.mouth), top: y };
  }
  const captureAction = (t) =>
    t < 0.5
      ? "reach"
      : t < 0.9
        ? "grip"
        : t < 1.75
          ? "lift"
          : t < 2.45
            ? "swallow"
            : t < 3.4
              ? "chew"
              : t < 4.95
                ? "fire"
                : "recover";
  const captureFrame = (t) =>
    t < 0.5
      ? 0
      : t < 0.9
        ? 1
        : t < 1.3
          ? 2
          : t < 1.75
            ? 3
            : t < 2.45
              ? 4
              : t < 3.4
                ? Math.floor(t * 8) % 2
                  ? 6
                  : 7
                : t < 3.7
                  ? 9
                  : t < 4.9
                    ? 10
                    : 11;
  function fireBreath(
    c,
    origin,
    age,
    aim = { x: origin.x + 15, y: origin.y - 110 },
    duration = 1.45,
  ) {
    if (age < 0 || age >= duration) return;
    const envelope =
      ease(age / 0.12) * (1 - ease((age - duration + 0.25) / 0.25));
    if (!envelope) return;
    const dx = aim.x - origin.x,
      dy = aim.y - origin.y,
      distance = Math.hypot(dx, dy) || 1,
      ux = dx / distance,
      uy = dy / distance,
      nx = -uy,
      ny = ux;
    const length = distance * envelope * (1.015 + 0.045 * Math.sin(age * 38));
    const shape = (points, color, alpha) => {
      c.globalAlpha = envelope * alpha;
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) =>
        i
          ? c.lineTo(Math.round(x), Math.round(y))
          : c.moveTo(Math.round(x), Math.round(y)),
      );
      c.closePath();
      c.fill();
    };
    c.save();
    // A connected fuel stream feeds rolling, irregular flame parcels.
    for (const [factor, color, opacity] of [
      [1, "#ef741b", 0.9],
      [0.38, "#ffe9a0", 0.85],
    ]) {
      const left = [],
        right = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18,
          along = length * t * 0.9,
          spread = (1.7 + t * 4.5) * factor,
          jitter = Math.sin(age * 37 - i * 2) * t * 2;
        left.push([
          origin.x + ux * along + nx * (spread + jitter),
          origin.y + uy * along + ny * (spread + jitter),
        ]);
        right.push([
          origin.x + ux * along + nx * (-spread + jitter),
          origin.y + uy * along + ny * (-spread + jitter),
        ]);
      }
      shape([...left, ...right.reverse()], color, opacity);
    }
    for (let parcel = 0; parcel < 30; parcel++) {
      const t = (age * 2.1 + parcel * 0.071) % 1,
        along = length * t,
        swirl = Math.sin(parcel * 4.7 - age * 19) * (2 + t * 6);
      const px = origin.x + ux * along + nx * swirl,
        py = origin.y + uy * along + ny * swirl,
        radius = (2 + t * 11) * (0.8 + 0.2 * Math.sin(parcel * 7 + age * 33));
      const outline = [];
      for (let corner = 0; corner < 8; corner++) {
        const a = (corner * Math.PI) / 4,
          rag = 0.8 + 0.25 * Math.sin(corner * 5 + parcel * 3 + age * 24);
        outline.push([
          px + Math.cos(a) * radius * rag,
          py + Math.sin(a) * radius * rag,
        ]);
      }
      shape(outline, parcel % 3 ? "#f47a1c" : "#d74712", 0.75 - t * 0.2);
      shape(
        outline.map(([x, y]) => [px + (x - px) * 0.55, py + (y - py) * 0.55]),
        parcel % 2 ? "#ffd369" : "#ffaf33",
        0.85 - t * 0.2,
      );
      if (t < 0.6) {
        c.globalAlpha = envelope * 0.75;
        c.fillStyle = "#ffeab0";
        c.fillRect(
          Math.round(px - 1),
          Math.round(py - 1),
          2 + Math.round(t * 3),
          2,
        );
      }
    }
    for (let spark = 0; spark < 12; spark++) {
      const t = (age * 2.5 + spark * 0.083) % 1,
        spread = Math.sin(spark * 4 + age * 9) * t * 17;
      c.globalAlpha = envelope * (1 - t) * 0.7;
      c.fillStyle = spark % 2 ? "#ffd477" : "#f28d2b";
      c.fillRect(
        Math.round(origin.x + ux * length * t + nx * spread),
        Math.round(origin.y + uy * length * t + ny * spread),
        1,
        2,
      );
    }
    c.restore();
  }
  function capture(c, W, state, index, t, helpers, options = {}) {
    const ground = 332,
      row = helpers.vehicleIndex(state, index),
      size = helpers.vehicleSize(row),
      pose = actor(c, captureFrame(t), options.actorX ?? W * 0.12, ground);
    if (!pose) {
      helpers.demon(c, 0);
      return;
    }
    if (t < 2.45) {
      const feeding = ease((t - 1.85) / 0.6),
        p = {
          x: lerp(pose.hand.x, pose.mouth.x, feeding),
          y: lerp(pose.hand.y, pose.mouth.y, feeding),
        };
      let zoom = 0.88 * (1 - feeding * 0.7),
        tilt = lerp(-0.12, -0.65, feeding);
      if (t < 0.5) {
        const reach = ease(t / 0.5);
        p.x = lerp(options.start?.x ?? W * 0.575, pose.hand.x, reach);
        p.y = lerp(options.start ? options.start.y-size.height/2 : ground-size.height/2, pose.hand.y, reach);
        zoom = lerp(1, 0.88, reach);
      }
      c.save();
      c.translate(p.x, p.y);
      c.rotate(tilt);
      c.scale(zoom, zoom);
      // Entire vehicle passes into the fire-filled jaws; no abandoned wreck.
      if (feeding > 0.05) {
        c.beginPath();
        c.rect(
          -size.width / 2,
          -size.height / 2,
          size.width * (1 - feeding),
          size.height,
        );
        c.clip();
      }
      helpers.drawVehicle(c, row, 0, 0, size.height / 2);
      c.restore();
      if (t >= 0.5 && t < 1.9) {
        c.fillStyle = "#221b1a";
        for (let j = 0; j < 3; j++)
          c.fillRect(Math.round(p.x - 6 + j * 5), Math.round(p.y - 3), 2, 7);
      }
    }
    if(options.breath!==false)fireBreath(c, pose.mouth, t - 3.65);
  }
  function portalMotion(time) {
    return {visible:time>=0,offset:340*(1-ease(time/1.4)),rise:ease(time/1.4)};
  }
  function portalGeometry(width) {
    return {x:width-228,y:28,width:220,height:330,entry:width-101,ground:358};
  }
  function worldTravel(p,time) {
    if(p.winner===null)return 0;
    const t=clamp(time,0,p.duration),brake=Math.max(1.2,p.portalStart);
    const accelerate=x=>x<1.2?48*x+20*x*x:86.4+(x-1.2)*96;
    if(t<=brake)return accelerate(t);
    const q=Math.min(1.1,t-brake);
    return accelerate(brake)+96*(q-q*q/2.2);
  }
  function winnerMotion(p,time,width,size={width:40}) {
    const t=Math.max(0,time),g=portalGeometry(width);
    let x;
    if(t<p.captureStart)x=lerp(width*.5,width*.65,Math.pow(clamp(t/p.captureStart),2));
    else if(t<p.entryStart)x=lerp(width*.65,width*.70,clamp((t-p.captureStart)/(p.entryStart-p.captureStart)));
    else x=lerp(width*.70,g.entry+size.width*.65+6,Math.pow(clamp((t-p.entryStart)/1.55),1.6));
    return {x,visible:t<p.escapeEnd,passed:t>=p.escapeEnd,entry:g.entry};
  }
  function bridgeRupture(c,width,time) {
    if(time<0)return;
    const g=portalGeometry(width),power=ease(time/.75),cx=g.x+g.width*.51;
    const half=g.width*.48*power,top=205,bottom=350;
    c.save();
    const lava=c.createLinearGradient(0,top,0,bottom);
    lava.addColorStop(0,'#1b100c');lava.addColorStop(.65,'#541708');lava.addColorStop(1,'#c5470b');
    c.fillStyle=lava;c.strokeStyle='#a0eaff';c.lineWidth=1.2;
    c.beginPath();c.moveTo(cx-half,top);
    for(let i=0;i<10;i++)c.lineTo(cx-half+Math.sin(i*5)*6,top+i*(bottom-top)/9);
    for(let i=9;i>=0;i--)c.lineTo(cx+half+Math.sin(i*7)*6,top+i*(bottom-top)/9);
    c.closePath();c.fill();c.stroke();
    for(let i=0;i<18;i++){
      const age=time-i*.035;if(age<0||age>1.9)continue;
      const side=i%2?1:-1,start=cx+side*(25+(i%4)*14);
      const x=start+side*(22+i%5*9)*age,y=310-(35+i%6*9)*age+70*age*age;
      c.save();c.translate(x,y);c.rotate(side*age*(1+i%3));
      c.fillStyle=i%2?'#675744':'#38322c';c.strokeStyle='#8fbac0';c.lineWidth=.7;
      c.beginPath();c.moveTo(-7,-4);c.lineTo(4,-7);c.lineTo(9,0);c.lineTo(1,7);c.lineTo(-8,3);c.closePath();c.fill();c.stroke();c.restore();
    }
    c.restore();
  }
  function drawPortal(c,width,time) {
    const motion=portalMotion(time);if(!motion.visible)return;
    const g=portalGeometry(width),y=g.y+motion.offset;
    bridgeRupture(c,width,time);
    c.save();
    if(portal?.complete&&portal.naturalWidth)c.drawImage(portal,g.x,y,g.width,g.height);
    else{
      const glow=c.createLinearGradient(g.x,0,g.x+g.width,0);
      glow.addColorStop(0,'#0a3fa5');glow.addColorStop(.5,'#d9ffff');glow.addColorStop(1,'#0875e4');
      c.fillStyle=glow;c.beginPath();c.ellipse(g.x+110,y+180,83,145,0,0,Math.PI*2);c.fill();
      c.strokeStyle='#ffe2a0';c.lineWidth=12;c.stroke();
    }
    c.restore();
  }
  function drawPortalFront(c,width,time) {
    if(time<0||!portal?.complete||!portal.naturalWidth)return;
    const g=portalGeometry(width),y=g.y+portalMotion(time).offset;
    c.drawImage(portal,portal.naturalWidth*.74,0,portal.naturalWidth*.26,portal.naturalHeight,
      g.x+g.width*.74,y,g.width*.26,g.height);
  }
  function vehicleGround(state,index,h) {
    return h.position?.(state,index)?.y??(250+index*28);
  }
  function trailingPosition(p,time,width,state,index,h) {
    return {x:width*.5-ease(time/p.captureStart)*35-Math.min(20,Math.max(0,time-p.captureStart)*2),
      y:vehicleGround(state,index,h)};
  }
  function renderVictory(c,width,state,p,time,h) {
    const s=sample(p,time),portalTime=time-p.portalStart;
    drawPortal(c,width,portalTime);
    // Each unconsumed opponent stays behind the accelerating winner until its capture.
    for(let slot=0;slot<p.victims.length;slot++){
      const index=p.victims[slot],start=p.captureStart+slot*p.captureEach;
      if(time>=start)continue;
      const point=trailingPosition(p,time,width,state,index,h);
      h.drawVehicle(c,h.vehicleIndex(state,index),Math.floor(time*10)%8,point.x,point.y);
    }
    const row=h.vehicleIndex(state,p.winner),size=h.vehicleSize(row),winner=winnerMotion(p,time,width,size);
    if(winner.visible){
      const ground=vehicleGround(state,p.winner,h);
      c.save();
      if(time>=p.entryStart){c.beginPath();c.rect(0,0,winner.entry,384);c.clip();}
      // Speed streaks make the initial separation and final acceleration readable.
      c.strokeStyle=time>=p.entryStart?'#c4f7ff':'#d8b983';c.lineWidth=1;
      for(let i=0;i<4;i++){
        const length=8+i*4+Math.min(25,time*8),y=ground-size.height*.35+i*2;
        c.beginPath();c.moveTo(winner.x-size.width/2-5,y);c.lineTo(winner.x-size.width/2-5-length,y);c.stroke();
      }
      h.drawVehicle(c,row,Math.floor(time*12)%8,winner.x,ground);c.restore();
    }
    if(s.phase==='capture'){
      const start=p.captureStart+s.slot*p.captureEach;
      const initial=trailingPosition(p,start,width,state,s.victim,h);
      capture(c,width,state,s.victim,s.local,h,{start:initial,breath:false,actorX:8});
    }else if(time<p.captureEnd)h.demon(c,time);
    else actor(c,7,8,332,260);
    drawPortalFront(c,width,portalTime);
    return s.phase;
  }
  function render(c,width,state,p,time,h) {
    if(p.winner!==null)return renderVictory(c,width,state,p,time,h);
    const s=sample(p,time),ground=332;
    if(s.phase==='capture'){
      capture(c,width,state,s.victim,s.local,h);return s.phase;
    }
    const frame=s.phase==='done'?15:12+(Math.floor(s.local*5)%4);
    const bounce=s.phase==='done'?0:Math.abs(Math.sin(s.local*Math.PI*5))*7;
    actor(c,frame,lerp(width*.12,width*.3,ease(s.local/.6)),ground-bounce);
    if(s.phase==='dance')h.demonDust(c,width*.3,time,'chase',0);
    return s.phase;
  }
  function ready(winner) {
    const demonReady=!!art?.complete&&art.naturalWidth>0;
    return demonReady&&(winner===null||portal?.failed||!!portal?.complete&&portal.naturalWidth>0);
  }
  const api = {
    CAPTURE,
    plan,
    sample,
    portalMotion,
    portalGeometry,
    worldTravel,
    winnerMotion,
    ready,
    captureFrame,
    captureAction,
    fireBreath,
    load,
    prepare,
    actor,
    capture,
    render,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolEnding = api;
})(globalThis);
