/* Hellscape cinematic: visual timing only. Never writes to game state. */
(function (root) {
  "use strict";
  const C=typeof module!=="undefined"?require('./hell-chase.js'):root.FoolChase;
  const F=typeof module!=="undefined"?require('./hell-epilogue.js'):root.FoolEpilogue;
  const P=typeof module!=="undefined"?require('./hell-portal.js'):root.FoolPortal;
  const B=typeof module!=="undefined"?require('./hell-bridge.js'):root.FoolBridge;
  const CAPTURE=C.T.capture,plan=C.plan,sample=C.sample,captureAction=C.captureAction;
  const ease=C.ease,lerp=C.lerp;
  const K=typeof module!=="undefined"?require('./hell-cerbero.js'):root.FoolCerbero;
  function prepare(image){return K.prepare(image);}
  function load(redraw){P.load(redraw);return K.load(redraw);}
  function actor(c,index,x,ground,width=260){return K.render(c,{left:x,ground,width,pose:[{frame:index,weight:1}],runWeight:0});}
  const captureFrame=t=>C.capturePose(t).reduce((a,b)=>a.weight>b.weight?a:b).frame;
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
  function poseMetrics(){return K.metrics();}
  function paintActor(c,W,demon,h,travel){return K.render(c,demon,travel);}
  function paintVehicle(c,state,v,h,travel) {
    if(v.visible===false)return;
    c.save();
    if(v.clip!==undefined){c.beginPath();c.rect(v.clip,0,1024,384);c.clip();}
    if(v.clipRight!==undefined){c.beginPath();c.rect(0,0,Math.max(0,v.clipRight),384);c.clip();}
    c.translate(v.x,v.ground-v.height/2);c.rotate(v.rotation||0);
    h.drawVehicle(c,v.row,Math.floor((travel?.roadTime??0)*10+v.index*2)%8,0,v.height/2);
    c.restore();
  }
  function paintPart(c,W,demon,h,travel,point,width,height){
    c.save();c.beginPath();c.rect(point.x-width/2,point.y-height/2,width,height);c.clip();paintActor(c,W,demon,h,travel);c.restore();
  }
  function paintFrame(c,W,state,f,h){
    const travel=h.travelFor?.(f.time,f.demon.worldDistance)??{time:f.time,distance:f.demon.worldDistance,roadTime:f.demon.worldDistance/48,footfalls:[]};
    const held=f.victim!==undefined&&(f.touching||f.action==='swallow');
    const cars=f.positions.filter(v=>v.visible!==false&&!(held&&v.index===f.victim));
    for(const v of cars.filter(v=>v.ground<=f.demon.ground))paintVehicle(c,state,v,h,travel);
    h.runDust?.(c,f.demon,travel);
    paintActor(c,W,f.demon,h,travel);
    if(held){const v=f.positions[f.victim];paintVehicle(c,state,v,h,travel);
      if(f.touching)paintPart(c,W,f.demon,h,travel,f.anchors.hand,Math.min(9,v.width*.32),Math.min(12,v.height*.5));
      else if(f.swallowing)paintPart(c,W,f.demon,h,travel,f.anchors.mouth,7,v.height+5);}
    for(const v of cars.filter(v=>v.ground>f.demon.ground))paintVehicle(c,state,v,h,travel);
    if(f.flameAge!==null&&f.flameAge!==undefined){
      const duration=f.flameDuration??1.2;
      const anchors=K.geometry(f.demon,travel);
      const mouth=anchors.mouths.center,direction=anchors.directions.center;
      const length=Math.max(35,Math.hypot(f.flameAim.x-mouth.x,f.flameAim.y-mouth.y));
      const aim={x:mouth.x+direction.x*length,y:mouth.y+direction.y*length};
      fireBreath(c,mouth,f.flameAge,aim,duration);
      if(f.flameAge>0&&f.flameAge<duration){
        const target=aim,glow=c.createRadialGradient(target.x,target.y,0,target.x,target.y,48);
        glow.addColorStop(0,'#ffb84a66');glow.addColorStop(1,'#ff7b1800');c.save();c.globalCompositeOperation='screen';c.fillStyle=glow;c.fillRect(target.x-48,target.y-48,96,96);c.restore();
      }
    }
    B.front(c,W,f.camera);
    h.onFrame?.(f,travel);return f;
  }
  function capturePlan(entry,index){return C.captureRoute(entry,index,poseMetrics());}
  function renderCapture(c,W,state,route,time,h){return paintFrame(c,W,state,C.captureFrame(route,time),h);}
  // Public single-capture entry point; normal play supplies its actual previous frame.
  const standaloneCaptures=new WeakMap();
  function capture(c,W,state,index,t,h){
    let routes=standaloneCaptures.get(state);if(!routes){routes=new Map();standaloneCaptures.set(state,routes);}
    if(!routes.has(index))routes.set(index,capturePlan(h.entry??C.defaultEntry(state,h),index));
    return renderCapture(c,W,state,routes.get(index),t,h);
  }
  const portalMotion=F.portalAt,rageMotion=F.rageAt;
  function impactDust(c,d,age){
    if(age===null||age<0||age>.45)return;
    const feet=K.geometry(d).feet;
    c.save();
    for(const foot of [feet.front_near,feet.front_far])for(let i=0;i<14;i++){
      const x=foot.x,spread=(i-6.5)*(2+age*13),y=foot.y-2-Math.sin(age/.45*Math.PI)*(3+i%4*3);
      c.globalAlpha=(1-age/.45)*.65;c.fillStyle=i%3?'#ae9271':'#544b42';
      c.fillRect(Math.round(x+spread),Math.round(y),2+i%3,2+i%2);
    }c.restore();
  }
  const sceneRoutes=new WeakMap();
  function resolve(p,state,h){
    if(!sceneRoutes.has(p))sceneRoutes.set(p,C.prepare(p,p.entry??h.entry??C.defaultEntry(state,h),poseMetrics()));
    return sceneRoutes.get(p);
  }
  function frame(p,state,time,h={}){return C.frame(resolve(p,state,h),time);}
  function render(c,W,state,p,time,h){
    const route=resolve(p,state,h),f=C.frame(route,time),s=sample(p,time);
    if(['lineup','capture','winner-chase'].includes(s.phase)){paintFrame(c,W,state,f,h);return s.phase;}
    const d=f.demon,ground=d.ground,winner=p.winner;
    if(winner!==null){
      const travel=h.travelFor?.(f.time,d.worldDistance);
      paintVehicle(c,state,f.positions[winner],h,travel);
      h.runDust?.(c,d,travel);paintActor(c,W,d,h,travel);
      impactDust(c,d,f.hitAge??null);
      if(f.fireAge!==null&&f.fireAge!==undefined){
        const rig=K.geometry(d,travel);
        for(const side of K.heads){
          const mouth=rig.mouths[side],direction=rig.directions[side];
          fireBreath(c,mouth,f.fireAge,{x:mouth.x+direction.x*145,y:mouth.y+direction.y*145},F.D.fire-.35);
        }
      }
      P.front(c,f.portal);B.debris(c,f.bridge,true);
      B.front(c,W,f.camera);
      h.onFrame?.(f,travel);
    }else{
      const age=Math.max(0,time-p.chaseEnd),cycle=age*5,index=12+Math.floor(cycle)%4,next=12+(Math.floor(cycle)+1)%4;
      d.pose=C.mixPoses(d.pose,C.mixPoses(C.pose(index),C.pose(next),ease(cycle%1)),ease(age/.4));d.runWeight=.12;
      d.ground=ground-Math.abs(Math.sin(age*Math.PI*5))*7;
      const travel=h.travelFor?.(f.time,d.worldDistance);paintActor(c,W,d,h,travel);B.front(c,W,f.camera);h.onFrame?.(f,travel);
    }
    return s.phase;
  }
  const api = {
    CAPTURE,
    plan,
    sample,
    portalMotion,
    rageMotion,
    captureFrame,
    captureAction,
    fireBreath,
    load,
    prepare,
    actor,
    poseMetrics,
    capturePlan,
    renderCapture,
    frame,
    capture,
    render,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolEnding = api;
})(globalThis);
