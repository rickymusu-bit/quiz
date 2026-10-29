/* World/camera choreography only: no game rules, random numbers or timers. */
(function(root){
  'use strict';
  const Motion=typeof module!=='undefined'?require('./hell-motion.js'):root.FoolMotion;
  const Bridge=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const Drawings=typeof module!=='undefined'?require('./hell-cerbero-frames.js'):root.FoolCerberoFrames;
  const Throw=typeof module!=='undefined'?require('./hell-throw.js'):root.FoolThrow;
  const Finale=typeof module!=='undefined'?require('./hell-epilogue.js'):root.FoolEpilogue;
  const T=Object.freeze({lineup:1.1,capture:5.2,pursuit:1.8,bite:Drawings.capture.bite,lift:Drawings.capture.lift,release:Drawings.capture.release,impact:Drawings.capture.release+Throw.FLIGHT,hidden:Drawings.capture.release+Throw.FLIGHT+Throw.SINK,recover:3.7});
  const WIDTH=512;
  const {clamp,ease,lerp,travel}=Motion;
  function speed(t,duration,from,to){return lerp(from,to,ease(t/duration));}
  const pose=frame=>[{frame,weight:1}];
  function mixPoses(a,b,t){const weights=new Map();for(const [list,factor]of [[a,1-t],[b,t]])for(const p of list)weights.set(p.frame,(weights.get(p.frame)||0)+p.weight*factor);return [...weights].filter(([,w])=>w>.00001).map(([frame,weight])=>({frame,weight}));}
  const KEYS=Drawings.capture.angles.map(([time],frame)=>[time,frame]);
  function captureIndex(t){let frame=0;for(const [at,index] of KEYS){if(at>t)break;frame=index;}return frame;}
  function capturePose(t){return pose(captureIndex(t));}
  function captureAction(t){return t<T.bite?'approach':t<T.lift?'bite':t<T.release?'windup':t<T.impact?'flight':t<T.hidden?'sink':'recover';}
  const fallbackMetric={height:.7,mouth:{x:.93,y:.66}};
  function metrics(weights,frames){let height=0,mx=0,my=0;for(const p of weights){const m=frames?.[p.frame]||fallbackMetric;height+=m.height*p.weight;mx+=m.mouth.x*p.weight;my+=m.mouth.y*p.weight;}return{height,mouth:{x:mx,y:my}};}
  function actorPoints(demon,frames){if(typeof frames?.actorPoints==='function')return frames.actorPoints(demon);const m=metrics(demon.pose,frames),top=demon.ground-m.height*demon.width;return{mouth:{x:demon.left+m.mouth.x*demon.width,y:top+m.mouth.y*demon.width},top};}
  function defaultEntry(state,h={}){
    return {time:0,camera:{distance:0,speed:Motion.ROAD_SPEED},demon:{...Motion.CHASE,runWeight:1,pose:pose(0)},
      positions:state.groups.map((g,index)=>{const row=h.vehicleIndex?.(state,index)??index,size=h.vehicleSize?.(row)??{width:36,height:20};return {index,row,x:254+index*35,ground:270+index*25,...size};})};
  }
  function plan(state,consumed=[],pending=[],entry=null){
    const eaten=new Set(consumed),winner=state.winner,positions=entry?.positions;
    const victims=[...new Set([...pending,...state.groups.map((g,i)=>!g.out&&i!==winner?i:null).filter(i=>i!==null)])].filter(i=>i!==winner&&!eaten.has(i));
    if(winner===null&&!victims.length&&!eaten.has(state.respondent))victims.push(state.respondent);
    if(positions)victims.sort((a,b)=>positions[a].x-positions[b].x||a-b);
    const lineupEnd=winner!==null||victims.length?T.lineup:0,captureEnd=lineupEnd+victims.length*T.capture,chaseEnd=captureEnd+(winner!==null?T.pursuit:0);
    return {winner,victims,lineupEnd,captureEnd,chaseEnd,reactionStart:chaseEnd+(winner===null?0:Finale.T.sinkEnd),duration:chaseEnd+(winner===null?3.2:Finale.T.duration),entry};
  }
  function sample(p,time){
    const t=Math.max(0,time);
    if(t>=p.duration)return {phase:'done',local:p.winner===null?3.2:0};
    if(t<p.lineupEnd)return {phase:'lineup',local:t};
    if(t<p.captureEnd){const slot=Math.floor((t-p.lineupEnd)/T.capture);return {phase:'capture',slot,victim:p.victims[slot],local:t-p.lineupEnd-slot*T.capture};}
    if(t<p.chaseEnd)return {phase:'winner-chase',local:t-p.captureEnd};
    const seq=t-p.chaseEnd;
    if(p.winner!==null)return Finale.sample(seq);
    else if(t<p.duration)return {phase:'dance',local:seq};
    return {phase:'done',local:p.winner===null?3.2:3.6};
  }
  function biteAnchor(anchors){return anchors.mouths?.right??anchors.mouth;}
  function biteAngle(anchors){const d=anchors.directions?.right;return d?Math.atan2(d.y,d.x):0;}
  function captureBody(route,time){
    const t=clamp(time/T.capture)*T.capture,entry=route.entry,u=ease(t/T.bite),v=ease((t-T.recover)/(T.capture-T.recover));
    const approach=travel(Math.min(t,T.bite),T.bite,entry.camera.speed,Motion.ROAD_SPEED);
    const distance=entry.camera.distance+approach+Motion.ROAD_SPEED*Math.max(0,t-T.bite)+route.extra*v;
    const speedNow=t<T.bite?speed(t,T.bite,entry.camera.speed,Motion.ROAD_SPEED):Motion.ROAD_SPEED+route.extra*6*clamp((t-T.recover)/(T.capture-T.recover))*(1-clamp((t-T.recover)/(T.capture-T.recover)))/(T.capture-T.recover);
    const demon={left:t<T.bite?lerp(entry.demon.left,route.contact.left,u):lerp(route.contact.left,route.target.left,v),
      ground:t<T.bite?lerp(entry.demon.ground,route.contact.ground,u):lerp(route.contact.ground,route.target.ground,v),
      width:route.contact.width,runWeight:t<.65?1:t<2.15?0:lerp(0,1,v),
      animation:t<.65||t>=2.3?'walk':'capture',captureTime:t,actionFrame:captureIndex(t),pose:capturePose(t),time:entry.time+t};
    demon.worldDistance=distance+demon.left-Motion.CHASE.left;
    return{demon,camera:{distance,speed:speedNow}};
  }
  function captureRoute(entry,index,frames,{final=false}={}){
    const victim={...entry.positions[index]},width=entry.demon.width;
    const probe={left:0,ground:0,width,runWeight:0,animation:'capture',captureTime:T.bite,actionFrame:5,pose:pose(5),worldDistance:0,time:0};
    const anchors=actorPoints(probe,frames),mouth=biteAnchor(anchors),angle=biteAngle(anchors),centre=Throw.attachment(mouth,victim,0);
    const contact={left:victim.x-centre.x,ground:victim.ground-victim.height/2-centre.y,width};
    const target={left:Motion.CHASE.left,ground:final?contact.ground:Motion.CHASE.ground,width};
    const route={entry,index,victim,contact,target,extra:Math.max(0,contact.left-target.left)+8,frames,gripAngle:angle};
    const release=captureBody(route,T.release),a=actorPoints(release.demon,frames);
    route.flight=Throw.plan(victim,biteAnchor(a),biteAngle(a)-angle,release.camera,entry.time+T.release);
    return route;
  }
  function captureFrame(route,time){
    const t=Math.max(0,Math.min(T.capture,time)),entry=route.entry,{demon,camera}=captureBody(route,t);
    const anchors=actorPoints(demon,route.frames),car={...route.victim,rotation:0,visible:true};
    const attached=t>=T.bite&&t<T.release;
    if(attached){const angle=biteAngle(anchors)-route.gripAngle,centre=Throw.attachment(biteAnchor(anchors),car,angle);car.x=centre.x;car.ground=centre.y+car.height/2;car.rotation=angle;car.attached=true;}
    if(t>=T.release)Object.assign(car,Throw.sample(route.flight,entry.time+t,camera));
    const positions=entry.positions.map(p=>({...p}));positions[route.index]=car;
    return{phase:'capture',action:captureAction(t),time:entry.time+t,camera,demon,positions,anchors,
      victim:route.index,biteMouth:'right',bitten:attached,attached,airborne:!!car.airborne,sinking:!!car.sinking,
      removed:t>=T.hidden,lavaImpact:car.impact??null};
  }
  function prepare(p,entry,frames){
    const ids=[...p.victims,...(p.winner===null?[]:[p.winner])];
    // Keep every actor in its original lane. Only the hunter changes lanes.
    const targets=entry.positions.map(v=>({...v}));
    const ground=entry.demon.ground,demonLeft=entry.demon.left,lineupExtra=0;
    const lined={time:entry.time+p.lineupEnd,camera:{distance:entry.camera.distance+travel(p.lineupEnd,p.lineupEnd||1,entry.camera.speed,Motion.ROAD_SPEED),speed:Motion.ROAD_SPEED},demon:{...entry.demon,runWeight:1},positions:targets};
    let current=lined;const routes=[];
    p.victims.forEach((index,slot)=>{const route=captureRoute(current,index,frames,{final:true});routes.push(route);const end=captureFrame(route,T.capture);current={time:end.time,camera:end.camera,demon:end.demon,positions:end.positions};});
    const winner=p.winner===null?null:current.positions[p.winner];
    const escapeX=winner?Math.min(WIDTH-55-winner.width/2-6,Math.max(winner.x,WIDTH*.72)):0;
    const pursuitDemon=winner?{...current.demon,left:escapeX-winner.width/2-current.demon.width-6,ground:winner.ground,runWeight:1}:current.demon;
    const afterChase={time:entry.time+p.chaseEnd,camera:{distance:current.camera.distance+(winner?travel(T.pursuit,T.pursuit,current.camera.speed,80):0),speed:80},demon:pursuitDemon,positions:current.positions.map(v=>({...v,x:v.index===p.winner?escapeX:v.x}))};
    return {p,entry,frames,ids,ground,targets,demonLeft,lineupExtra,lined,routes,afterCaptures:current,escapeX,pursuitDemon,epilogue:winner?Finale.prepare(afterChase,p.winner):null};
  }
  function frame(route,time){
    const {p,entry}=route,s=sample(p,time),t=Math.max(0,time);let camera,demon,positions;
    if(p.winner!==null&&t>=p.chaseEnd)return Finale.frame(route.epilogue,t-p.chaseEnd);
    if(s.phase==='lineup'){
      const x=ease(t/T.lineup),y=ease((t-T.lineup*.45)/(T.lineup*.55)),d=x;
      camera={distance:entry.camera.distance+travel(t,T.lineup,entry.camera.speed,Motion.ROAD_SPEED)+route.lineupExtra*d,speed:speed(t,T.lineup,entry.camera.speed,Motion.ROAD_SPEED)+route.lineupExtra*6*clamp(t/T.lineup)*(1-clamp(t/T.lineup))/T.lineup};
      demon={...entry.demon,left:lerp(entry.demon.left,route.demonLeft,d),ground:entry.demon.ground,runWeight:lerp(entry.demon.runWeight??1,1,d)};
      positions=entry.positions.map(v=>({...v,x:lerp(v.x,route.targets[v.index].x,x),ground:lerp(v.ground,route.targets[v.index].ground,y),visible:route.ids.includes(v.index)}));
    }else if(s.phase==='capture'){
      const result=captureFrame(route.routes[s.slot],s.local);
      result.positions.forEach(v=>{if(!route.ids.includes(v.index)||p.victims.slice(0,s.slot).includes(v.index))v.visible=false;});return {...result,phase:s.phase,slot:s.slot};
    }else{
      const start=route.afterCaptures,winner=p.winner;
      const chase=Math.min(T.pursuit,Math.max(0,t-p.captureEnd)),u=ease(chase/T.pursuit);
      const chaseDistance=winner===null?0:travel(chase,T.pursuit,start.camera.speed,80);
      camera={distance:start.camera.distance+chaseDistance,speed:winner===null?start.camera.speed:speed(chase,T.pursuit,start.camera.speed,80)};
      demon=winner===null?{...start.demon}:{...start.demon,left:lerp(start.demon.left,route.pursuitDemon.left,u),ground:lerp(start.demon.ground,route.pursuitDemon.ground,u),runWeight:1};
      positions=start.positions.map(v=>({...v,visible:v.index===winner,x:v.index===winner?lerp(v.x,route.escapeX,u):v.x}));
      if(s.phase!=='winner-chase'){
        const seq=Math.max(0,t-p.chaseEnd);
        if(winner===null){camera.distance+=travel(Math.min(seq,1.2),1.2,Motion.ROAD_SPEED,0);camera.speed=speed(seq,1.2,Motion.ROAD_SPEED,0);demon.animation=camera.speed>.5?'walk':'celebrate';demon.runWeight=camera.speed>.5?1:0;}
      }
    }
    demon.worldDistance=camera.distance+demon.left-Motion.CHASE.left;
    return {phase:s.phase,local:s.local,time:entry.time+t,camera,demon,positions};
  }
  const api={T,ease,lerp,travel,pose,mixPoses,capturePose,captureIndex,captureAction,actorPoints,defaultEntry,plan,sample,captureRoute,captureFrame,prepare,frame};
  if(typeof module!=='undefined')module.exports=api;else root.FoolChase=api;
})(globalThis);
