/* Presentation-only travel, gait and time. Units: logical race pixels / seconds. */
(function (root) {
  'use strict';
  const ROAD_SPEED = 48, STRIDE = 64, MAX_GAP = .75, RESPONSE = .35;
  const CHASE = Object.freeze({left:8, ground:303, width:221, scale:1.3});
  const ORDER = [0, 3, 2, 1];
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function travel(t,duration,from,to){const u=clamp(t/duration);return from*duration*u+(to-from)*duration*(u*u*u-.5*u*u*u*u);}
  function gait(distance) {
    const cycle = distance / STRIDE, pose = ((cycle * 4) % 4 + 4) % 4,
      index = Math.floor(pose), fraction = pose - index;
    return {cycle, frame:ORDER[index], next:ORDER[(index + 1) % 4],
      mix:fraction * fraction * (3 - 2 * fraction)};
  }
  function roadTarget(final, phase) {
    if (!final) return phase === 'capture' ? ROAD_SPEED * .4 : ROAD_SPEED;
    if (phase === 'capture') return ROAD_SPEED * .4;
    if (phase === 'descent' || phase === 'escape' || phase === 'loading') return ROAD_SPEED * 1.25;
    return ROAD_SPEED;
  }
  class Clock {
    constructor() {
      this.time = 0; this.distance = 0; this.speed = ROAD_SPEED;
      this.last = null; this.footfalls = [];
    }
    rebase(now) { this.last = now; }
    advance(now, {blocked = false, reduced = false, target = ROAD_SPEED} = {}) {
      const dt = this.last === null ? 0 : (now - this.last) / 1000;
      this.last = now;
      if (blocked || dt <= 0 || dt > MAX_GAP) return 0;
      const oldTime = this.time;
      this.time += dt;
      // Static notices still need active time to expire in reduced-motion mode.
      if (reduced) return dt;
      const oldDistance = this.distance,
        decay = Math.exp(-dt / RESPONSE);
      // Exact integral: acceleration and travel do not depend on refresh rate.
      this.distance += target * dt + (this.speed - target) * RESPONSE * (1 - decay);
      this.speed = target + (this.speed - target) * decay;
      const step = STRIDE / 2, first = Math.floor(oldDistance / step) + 1,
        last = Math.floor(this.distance / step);
      for (let index = first; index <= last; index++) {
        // Invert the same distance integral so impacts do not drift with FPS.
        const targetDistance = index * step - oldDistance;
        const initialSpeed = (this.speed - target) / decay;
        let lo = 0, hi = dt;
        for (let iteration = 0; iteration < 24; iteration++) {
          const mid = (lo + hi) / 2;
          const travel = target * mid + initialSpeed * RESPONSE * (1 - Math.exp(-mid / RESPONSE));
          if (travel < targetDistance) lo = mid; else hi = mid;
        }
        this.footfalls.push({index, at:oldTime + (lo + hi) / 2});
      }
      this.footfalls = this.footfalls.filter(e => this.time - e.at < 1.5).slice(-7);
      return dt;
    }
    adoptTravel(distance, speed, footfalls = []) {
      this.distance=distance;this.speed=speed;this.footfalls=footfalls.slice(-7);
    }
    snapshot() {
      return {time:this.time, distance:this.distance, speed:this.speed,
        roadTime:this.distance / ROAD_SPEED, gait:gait(this.distance), footfalls:this.footfalls.slice()};
    }
  }
  class ContactTracker {
    constructor(){this.previous=null;this.footfalls=[];}
    sample(time,distance){
      const previous=this.previous;
      if(previous&&Math.abs(distance-previous.distance)<1e-7)distance=previous.distance;
      const dt=previous?(time-previous.time):0;
      if(previous&&dt>0&&dt<=MAX_GAP&&distance>=previous.distance){
        const step=STRIDE/2;
        for(let index=Math.floor(previous.distance/step)+1;index<=Math.floor(distance/step);index++)
          this.footfalls.push({index,at:previous.time+dt*(index*step-previous.distance)/(distance-previous.distance)});
      }else if(!previous||dt<0||dt>MAX_GAP||distance<previous.distance)this.footfalls=[];
      this.previous={time,distance};this.footfalls=this.footfalls.filter(e=>time-e.at<1.5).slice(-7);
      return {time,distance,roadTime:distance/ROAD_SPEED,gait:gait(distance),footfalls:this.footfalls.slice()};
    }
  }
  const api = {ROAD_SPEED, STRIDE, MAX_GAP, CHASE, clamp, ease, lerp, travel, gait, roadTarget, Clock, ContactTracker};
  if (typeof module !== 'undefined') module.exports = api;
  else root.FoolMotion = api;
})(globalThis);
