/* World/camera choreography only: no game rules, random numbers or timers. */
(function(root){
  'use strict';
  const Motion=typeof module!=='undefined'?require('./hell-motion.js'):root.FoolMotion;
  const Bridge=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const T=Object.freeze({lineup:1.1,capture:5.2,pursuit:1.8,grip:.9,lift:1.2,mouth:2.05,swallow:2.45,hidden:3.05,recover:3.7});
  const GAP=74, WIDTH=512;
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},lerp=(a,b,t)=>a+(b-a)*t;
  function travel(t,duration,from,to){const u=clamp(t/duration);return from*duration*u+(to-from)*duration*(u*u*u-.5*u*u*u*u);}
  function speed(t,duration,from,to){return lerp(from,to,ease(t/duration));}
  const pose=frame=>[{frame,weight:1}];
  function mixPoses(a,b,t){const weights=new Map();for(const [list,factor]of [[a,1-t],[b,t]])for(const p of list)weights.set(p.frame,(weights.get(p.frame)||0)+p.weight*factor);return [...weights].filter(([,w])=>w>.00001).map(([frame,weight])=>({frame,weight}));}
  const KEYS=[[0,0],[T.grip,1],[T.lift,1],[1.65,2],[T.mouth,3],[T.swallow,4],[T.hidden,4],[3.4,6],[T.recover,7],[4.25,8],[T.capture,8]];
  function capturePose(t){for(let i=1;i<KEYS.length;i++)if(t<KEYS[i][0])return mixPoses(pose(KEYS[i-1][1]),pose(KEYS[i][1]),ease((t-KEYS[i-1][0])/(KEYS[i][0]-KEYS[i-1][0])));return pose(8);}
  function captureAction(t){return t<T.grip?'approach':t<T.lift?'grip':t<T.mouth?'lift':t<T.hidden?'swallow':t<T.recover?'chew':'recover';}
  const fallbackMetric={height:.59,hand:{x:.9,y:.50},mouth:{x:.74,y:.32}};
  function metrics(weights,frames){let height=0,hx=0,hy=0,mx=0,my=0;for(const p of weights){const m=frames?.[p.frame]||fallbackMetric;height+=m.height*p.weight;hx+=m.hand.x*p.weight;hy+=m.hand.y*p.weight;mx+=m.mouth.x*p.weight;my+=m.mouth.y*p.weight;}return {height,hand:{x:hx,y:hy},mouth:{x:mx,y:my}};}
  function actorPoints(demon,frames){const m=metrics(demon.pose,frames),top=demon.ground-m.height*demon.width;return {hand:{x:demon.left+m.hand.x*demon.width,y:top+m.hand.y*demon.width},mouth:{x:demon.left+m.mouth.x*demon.width,y:top+m.mouth.y*demon.width},top};}
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
    return {winner,victims,lineupEnd,captureEnd,chaseEnd,reactionStart:chaseEnd+(winner===null?0:2.2),duration:chaseEnd+(winner===null?3.2:8.4),entry};
  }
  function sample(p,time){
    const t=Math.max(0,time);
    if(t<p.lineupEnd)return {phase:'lineup',local:t};
    if(t<p.captureEnd){const slot=Math.floor((t-p.lineupEnd)/T.capture);return {phase:'capture',slot,victim:p.victims[slot],local:t-p.lineupEnd-slot*T.capture};}
    if(t<p.chaseEnd)return {phase:'winner-chase',local:t-p.captureEnd};
    const seq=t-p.chaseEnd;
    if(p.winner!==null){if(seq<.55)return {phase:'rise',local:seq};if(seq<2.2)return {phase:'escape',local:seq-.55};if(seq<2.95)return {phase:'roar',local:seq-2.2};if(seq<4.8)return {phase:'fire',local:seq-2.95};if(seq<8.4)return {phase:'rage',local:seq-4.8};}
    else if(t<p.duration)return {phase:'dance',local:seq};
    return {phase:'done',local:p.winner===null?3.2:3.6};
  }
  function captureRoute(entry,index,frames,{recenter=0,final=false,last=false,celebrate=false}={}){
    const victim={...entry.positions[index]},width=entry.demon.width,m=metrics(pose(1),frames);
    const contact={left:victim.x-m.hand.x*width,ground:victim.ground-victim.height/2+(m.height-m.hand.y)*width,width};
    const planted=4*(T.recover-T.grip),recoveryLeft=contact.left-planted;
    const target={left:celebrate?recoveryLeft-travel(T.capture-T.recover,T.capture-T.recover,4,0):final&&last?recoveryLeft+12:Motion.CHASE.left,ground:Motion.CHASE.ground,width};
    const extra=celebrate?0:Math.max(recenter,Math.max(0,recoveryLeft-target.left))+(recenter||recoveryLeft>target.left?8:0);
    return {entry,index,victim,contact,target,extra,recenter,frames,endSpeed:celebrate?0:final?24:Motion.ROAD_SPEED,last,final,celebrate};
  }
  function captureFrame(route,time){
    const t=Math.max(0,Math.min(T.capture,time)),entry=route.entry,u=ease(t/T.grip),v=ease((t-T.recover)/(T.capture-T.recover));
    let left,ground,cameraDistance,cameraSpeed,runWeight;
    const approach=travel(T.grip,T.grip,entry.camera.speed,4);
    if(t<T.grip){left=lerp(entry.demon.left,route.contact.left,u);ground=lerp(entry.demon.ground,route.contact.ground,u);cameraDistance=entry.camera.distance+travel(t,T.grip,entry.camera.speed,4);cameraSpeed=speed(t,T.grip,entry.camera.speed,4);runWeight=1-u;}
    else if(t<T.recover){left=route.contact.left-4*(t-T.grip);ground=route.contact.ground;cameraDistance=entry.camera.distance+approach+4*(t-T.grip);cameraSpeed=4;runWeight=0;}
    else {left=lerp(route.contact.left-4*(T.recover-T.grip),route.target.left,v);ground=lerp(route.contact.ground,route.target.ground,v);cameraDistance=entry.camera.distance+approach+4*(T.recover-T.grip)+travel(t-T.recover,T.capture-T.recover,4,route.endSpeed)+route.extra*v;cameraSpeed=speed(t-T.recover,T.capture-T.recover,4,route.endSpeed)+route.extra*6*clamp((t-T.recover)/(T.capture-T.recover))*(1-clamp((t-T.recover)/(T.capture-T.recover)))/(T.capture-T.recover);runWeight=ease((t-4.1)/(T.capture-4.1));}
    const demon={left,ground,width:route.contact.width,pose:capturePose(t),runWeight};
    if(route.celebrate&&t>=T.recover){
      demon.left=route.contact.left-4*(T.recover-T.grip)-travel(t-T.recover,T.capture-T.recover,4,0);
      demon.runWeight=0;demon.pose=t<4.8?mixPoses(pose(9),pose(10),ease((t-T.recover)/.25)):mixPoses(pose(10),pose(8),ease((t-4.8)/.4));
    }
    const anchors=actorPoints(demon,route.frames),car={...route.victim,rotation:0,visible:t<T.hidden};
    if(t>=T.grip&&t<T.mouth){car.x=anchors.hand.x;car.ground=anchors.hand.y+car.height/2;car.rotation=-.12*ease((t-T.grip)/(T.lift-T.grip));}
    else if(t>=T.mouth&&t<T.swallow){const feed=ease((t-T.mouth)/(T.swallow-T.mouth));car.x=lerp(anchors.hand.x,anchors.mouth.x+car.width/2,feed);car.ground=lerp(anchors.hand.y,anchors.mouth.y,feed)+car.height/2;car.rotation=lerp(-.12,0,feed);}
    else if(t>=T.swallow){const feed=ease((t-T.swallow)/(T.hidden-T.swallow));car.x=anchors.mouth.x+car.width/2-(car.width+2)*feed;car.ground=anchors.mouth.y+car.height/2;car.clip=anchors.mouth.x;}
    const positions=entry.positions.map(p=>({...p,x:p.x-(p.index===route.index?0:route.recenter*v)}));
    positions[route.index]=car;
    demon.worldDistance=cameraDistance+demon.left-Motion.CHASE.left;
    return {phase:'capture',action:captureAction(t),time:entry.time+t,camera:{distance:cameraDistance,speed:cameraSpeed},demon,positions,anchors,victim:route.index,touching:t>=T.grip-.12&&t<T.mouth,gripped:t>=T.grip&&t<T.mouth,swallowing:t>=T.swallow&&t<T.hidden,swallowed:t>=T.hidden,flameAge:route.celebrate?t-T.recover:null};
  }
  function prepare(p,entry,frames){
    const ids=[...p.victims,...(p.winner===null?[]:[p.winner])],maxHeight=Math.max(16,...ids.map(i=>entry.positions[i].height));
    const ground=(Bridge.TOP+Bridge.BOTTOM)/2+maxHeight/2,front=Math.max(ids.length===1?350:280+GAP*(ids.length-1),p.winner===null?0:entry.positions[p.winner].x);
    const targets=entry.positions.map(v=>({...v}));ids.forEach((index,i)=>{targets[index]={...targets[index],x:front-GAP*(ids.length-1-i),ground};});
    const firstContact=ids.length?targets[ids[0]].x-metrics(pose(1),frames).hand.x*entry.demon.width:entry.demon.left;
    const demonLeft=Math.max(Motion.CHASE.left,Math.min(entry.demon.left,firstContact-35));
    const lineupExtra=p.lineupEnd?Math.max(0,entry.demon.left-demonLeft,...ids.map(i=>entry.positions[i].x-targets[i].x))+8:0;
    const lined={time:entry.time+p.lineupEnd,camera:{distance:entry.camera.distance+travel(p.lineupEnd,p.lineupEnd||1,entry.camera.speed,24)+lineupExtra,speed:24},demon:{...entry.demon,left:demonLeft,ground:Motion.CHASE.ground,runWeight:1},positions:targets};
    let current=lined;const routes=[];
    p.victims.forEach((index,slot)=>{const route=captureRoute(current,index,frames,{recenter:slot<p.victims.length-1?GAP:0,final:true,last:slot===p.victims.length-1,celebrate:p.winner===null&&slot===p.victims.length-1});routes.push(route);const end=captureFrame(route,T.capture);current={time:end.time,camera:end.camera,demon:end.demon,positions:end.positions};});
    const winner=p.winner===null?null:current.positions[p.winner];
    const escapeX=winner?Math.min(WIDTH-55-winner.width/2-6,Math.max(winner.x,WIDTH*.72)):0;
    const pursuitDemon=winner?{...current.demon,left:escapeX-winner.width/2-current.demon.width-6,ground:Motion.CHASE.ground,runWeight:1}:current.demon;
    return {p,entry,frames,ids,ground,targets,demonLeft,lineupExtra,lined,routes,afterCaptures:current,escapeX,pursuitDemon};
  }
  function frame(route,time){
    const {p,entry}=route,s=sample(p,time),t=Math.max(0,time);let camera,demon,positions;
    if(s.phase==='lineup'){
      const x=ease(t/T.lineup),y=ease((t-T.lineup*.45)/(T.lineup*.55)),d=x;
      camera={distance:entry.camera.distance+travel(t,T.lineup,entry.camera.speed,24)+route.lineupExtra*d,speed:speed(t,T.lineup,entry.camera.speed,24)+route.lineupExtra*6*clamp(t/T.lineup)*(1-clamp(t/T.lineup))/T.lineup};
      demon={...entry.demon,left:lerp(entry.demon.left,route.demonLeft,d),ground:lerp(entry.demon.ground,Motion.CHASE.ground,d),runWeight:lerp(entry.demon.runWeight??1,1,d)};
      positions=entry.positions.map(v=>({...v,x:lerp(v.x,route.targets[v.index].x,x),ground:lerp(v.ground,route.targets[v.index].ground,y),visible:route.ids.includes(v.index)}));
    }else if(s.phase==='capture'){
      const result=captureFrame(route.routes[s.slot],s.local);
      result.positions.forEach(v=>{if(!route.ids.includes(v.index)||p.victims.slice(0,s.slot).includes(v.index))v.visible=false;});return {...result,phase:s.phase,slot:s.slot};
    }else{
      const start=route.afterCaptures,winner=p.winner;
      const chase=Math.min(T.pursuit,Math.max(0,t-p.captureEnd)),u=ease(chase/T.pursuit);
      const chaseDistance=winner===null?0:travel(chase,T.pursuit,start.camera.speed,80);
      camera={distance:start.camera.distance+chaseDistance,speed:winner===null?start.camera.speed:speed(chase,T.pursuit,start.camera.speed,80)};
      demon=winner===null?{...start.demon}:{...start.demon,left:lerp(start.demon.left,route.pursuitDemon.left,u),ground:Motion.CHASE.ground,runWeight:1};
      positions=start.positions.map(v=>({...v,visible:v.index===winner,x:v.index===winner?lerp(v.x,route.escapeX,u):v.x}));
      if(s.phase!=='winner-chase'){
        const seq=Math.max(0,t-p.chaseEnd);
        if(winner===null){camera.distance+=travel(seq,.6,camera.speed,0);camera.speed=speed(seq,.6,camera.speed,0);}
        else {
          if(seq<2.2){camera.distance+=travel(seq,2.2,80,60);camera.speed=speed(seq,2.2,80,60);}
          else {camera.distance+=travel(2.2,2.2,80,60)+travel(seq-2.2,.6,60,0);camera.speed=speed(seq-2.2,.6,60,0);}
          const v=positions[winner];v.x=lerp(route.escapeX,WIDTH+45,ease((seq-.55)/1.5));v.visible=seq<2.2&&v.x-v.width/2<WIDTH-55;
          demon.left=seq<2.2?Math.min(route.pursuitDemon.left+12*ease(seq/2.2),v.x-v.width/2-demon.width-6):route.pursuitDemon.left+12;
        }
      }
    }
    demon.worldDistance=camera.distance+demon.left-Motion.CHASE.left;
    return {phase:s.phase,local:s.local,time:entry.time+t,camera,demon,positions};
  }
  const api={T,GAP,ease,lerp,travel,pose,mixPoses,capturePose,captureAction,actorPoints,defaultEntry,plan,sample,captureRoute,captureFrame,prepare,frame};
  if(typeof module!=='undefined')module.exports=api;else root.FoolChase=api;
})(globalThis);
