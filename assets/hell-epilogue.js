/* Pure final choreography. World pixels, seconds; never writes a game or save. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'?require('./hell-motion.js'):root.FoolMotion;
  const B=typeof module!=='undefined'?require('./hell-bridge.js'):root.FoolBridge;
  const {clamp,ease,lerp,travel}=M;
  const D=Object.freeze({descent:1.9,open:.4,cross:1.2,close:.3,collapse:1.6,rage:3,fire:1.65,exhausted:1.05});
  const stages=[];let end=0;for(const [phase,duration] of Object.entries(D)){stages.push({phase:phase==='cross'?'escape':phase,start:end,end:end+duration});end+=duration;}
  // Legacy sampling hooks keep their names; they now mark descent/collapse ends.
  const T=Object.freeze(Object.fromEntries([...stages.map(s=>[s.phase+'End',s.end]),['duration',end],['riseEnd',D.descent],['sinkEnd',D.descent+D.open+D.cross+D.close+D.collapse],['brake',1.2]]));
  const GATE=Object.freeze({far:22,near:88,height:204,water:0,thickness:24,skew:1,openingFar:46,openingNear:64,openingHeight:138,bury:280});
  const pose=frame=>[{frame,weight:1}],mix=(a,b,t)=>[{frame:a,weight:1-t},{frame:b,weight:t}];
  function sample(t){for(const s of stages)if(t<s.end)return {phase:s.phase,local:Math.max(0,t-s.start)};return {phase:'done',local:0};}
  const IMPACT=D.descent;
  function portalAt(t){
    const descent=ease(t/D.descent),collapse=ease((t-T.closeEnd)/D.collapse);
    const offset=GATE.bury*(descent-1),opening=ease((t-T.riseEnd)/D.open)*(1-ease((t-T.escapeEnd)/D.close));
    return {visible:t>=0&&t<T.sinkEnd,offset,opening,passed:t>=T.escapeEnd,descent,collapse,sink:0};
  }
  function rageAt(t){
    const cycle=Math.min(D.rage-1e-8,Math.max(0,t))%1;
    const hit=.46,impact=clamp(1-Math.abs(cycle-hit)/.10);
    const anticipation=ease(cycle/.34),recover=ease((cycle-.56)/.44);
    return {cycle,impact,anticipation,pose:cycle<hit?mix(7,11,anticipation*(1-ease((cycle-.34)/.12))):mix(7,11,recover*.25*(1-ease((cycle-.82)/.18))),lift:0};
  }
  function prepare(entry,winner){
    const v=entry.positions[winner],depth=v.ground-B.TOP;
    const half=(GATE.near-GATE.far)/2,gateDepth=Math.max(half,Math.min(B.DEPTH-half,depth));
    const approach=travel(T.brake,T.brake,entry.camera.speed,48)+48*(T.openEnd-T.brake);
    const startX=B.worldX(v.x,depth,entry.camera),gateX=startX+approach+v.width/2+10;
    const basePan=travel(T.brake,T.brake,entry.camera.speed,12);
    const center=gateX-entry.camera.distance-basePan;
    const extraPan=Math.max(0,center-400);
    return {entry,winner,depth,gateDepth,startX,gateX,approach,basePan,extraPan,crossSpeed:Math.max(140,2*(v.width+GATE.thickness+24)/D.cross-48)};
  }
  function frame(route,time){
    const t=Math.max(0,time),s=sample(t),e=route.entry;
    const pan=travel(t,T.brake,e.camera.speed,12)+12*Math.max(0,t-T.brake)+route.extraPan*ease(t/T.brake);
    const camera={distance:e.camera.distance+pan,speed:lerp(e.camera.speed,12,ease(t/T.brake))+route.extraPan*6*clamp(t/T.brake)*(1-clamp(t/T.brake))/T.brake};
    const approach=t<T.brake?travel(t,T.brake,e.camera.speed,48):travel(T.brake,T.brake,e.camera.speed,48)+48*(Math.min(t,T.openEnd)-T.brake);
    const crossing=travel(Math.max(0,t-T.openEnd),D.cross,48,route.crossSpeed);
    const positions=e.positions.map(v=>({...v,visible:v.index===route.winner})),v=positions[route.winner];
    const depth=lerp(route.depth,route.gateDepth,ease(t/T.riseEnd));
    const vx=route.startX+approach+crossing,p=B.project(vx,depth,0,camera),threshold=B.project(route.gateX,depth,0,camera);
    Object.assign(v,{x:p.x,ground:p.y,clipRight:threshold.x,visible:vx-v.width/2<route.gateX,worldX:vx});
    const demonAdvance=approach+48*Math.max(0,t-T.openEnd);
    const maxLeft=route.gateX-e.demon.width-35;
    const worldLeft=e.demon.left+e.camera.distance+demonAdvance;
    // Ease into the barrier instead of crossing the salvation plane.
    const barrier=worldLeft<maxLeft-30?worldLeft:maxLeft-30+30*(1-Math.exp(-(worldLeft-maxLeft+30)/30));
    const demon={...e.demon,left:barrier-camera.distance,ground:e.demon.ground,runWeight:1,pose:pose(8)};
    demon.worldDistance=camera.distance+demon.left-M.CHASE.left;
    if(t>=T.escapeEnd){demon.runWeight=.12;demon.pose=mix(8,7,ease((t-T.escapeEnd)/.7));}
    let impact=0,fireAge=null,hitAge=null;
    if(s.phase==='rage'){const action=rageAt(s.local);demon.pose=action.pose;impact=action.impact;hitAge=action.cycle-.46;}
    else if(s.phase==='fire'){demon.pose=s.local<.25?mix(7,10,ease(s.local/.25)):pose(10);fireAge=s.local-.2;}
    else if(s.phase==='exhausted'){demon.pose=mix(10,7,ease(s.local/.35));demon.breath=1+.007*Math.sin(s.local*5)*ease(s.local/.3)*(1-ease((s.local-.8)/.25));}
    else if(s.phase==='done'){demon.pose=mix(7,11,(1+Math.sin(t*2))*.12);demon.breath=1+.006*Math.sin(t*5);}
    const sinceImpact=t-IMPACT,damage=ease(sinceImpact/.38),collapse=ease((t-T.closeEnd)/D.collapse);
    const laneDepth=route.gateDepth,half=(GATE.near-GATE.far)/2;
    const portal={...portalAt(t),anchorX:route.gateX,camera,time:e.time+t,collapseAge:t-T.closeEnd,damage,sinceImpact,geometry:{...GATE,far:laneDepth-half,near:laneDepth+half,openingFar:laneDepth-9,openingNear:laneDepth+9}};
    const bridge={anchorX:route.gateX,camera,damage,collapse,depth:laneDepth,rubble:t>=T.closeEnd,collapseAge:t-T.closeEnd,sinceImpact,time:e.time+t};
    const burst=sinceImpact>=0&&sinceImpact<.35?Math.sin(sinceImpact*49)*(1-sinceImpact/.35):0;
    const shake=impact>0?{x:Math.sin(t*67)*impact*1.3,y:Math.sin(t*79)*impact*1.1}:{x:burst*.8,y:burst*1.2};
    return {phase:s.phase,local:s.local,time:e.time+t,camera,positions,demon,portal,bridge,impact,hitAge,fireAge,shake,cleared:vx-v.width/2>=route.gateX+GATE.thickness};
  }
  const api={D,T,GATE,IMPACT,sample,portalAt,rageAt,prepare,frame};
  if(typeof module!=='undefined')module.exports=api;else root.FoolEpilogue=api;
})(globalThis);
