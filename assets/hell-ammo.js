/* Omen cinematics: consume event copies, never mutate the game or its save. */
(function (root) {
  "use strict";
  const labels = { salta: "CATENE", ruba: "TRIBUTO", svela: "MALOCCHIO",
    aura: "SIGILLO", karma: "CONTRAPPASSO", marx: "LIVELLA", ira: "FLAGELLO", arsenico: "ARSENICO", sacrificio: "SACRIFICIO" };
  const details = { salta: "Costo 11% · prossimo turno saltato", ruba: "33% dei punti · turno corrente ceduto",
    svela: "Errore: perde il valore · minimo zero", aura: "3 turni personali · nessun uso/guadagno Omen", karma: "3 turni · corretta ×2 · errore −2×",
    marx: "Punti divisi in parti uguali", ira: "−1 vita · tutte le Omen · fino a −666 pt", arsenico: "−11% per 3 turni · turno corrente ceduto", sacrificio: "−1 vita · +777 punti" };
  function plans(events, state) {
    const result = [];
    for (let n = 0; n < events.length; n++) {
      const e = events[n];
      if (e.activation && labels[e.copy?.type]) {
        const next = events.findIndex((v, i) => i > n && v.activation);
        const following = events.slice(n + 1, next < 0 ? events.length : next);
        const block = following.find(v => v.type === "aura-block" && v.source === e.source && v.ammo === e.copy.type);
        const shared = following.find(v => ["divine-wrath", "marx-redistribution"].includes(v.type));
        const targets = ["marx", "ira"].includes(e.copy.type)
          ? (shared?.groups ?? state.groups.map((g, i) => g.out ? null : i).filter(i => i !== null))
          : [Number.isInteger(e.target) ? e.target : e.source];
        result.push({ id: e.id, type: e.copy.type, source: e.source, targets,
          blocked: !!block, duration: e.copy.type === "ira" ? 2.25 : 1.8 });
      } else if (e.type === "karma-trigger") {
        result.push({ id: e.id, type: "karma", source: e.source, targets: [e.target],
          detail: "Nuova Omen: " + labels[e.ammo], duration: 1.5 });
      } else if (e.type === "spoiler-pass" || e.type === "turn-skipped" || e.type === "aura-block") {
        // Activation blocks are already part of the incoming shot; a Malocchio
        // passed later has no activation event and needs its own shield reaction.
        if (e.type === "aura-block" && result.some(p => p.blocked && p.source === e.source && p.type === e.ammo)) continue;
        result.push({ id: e.id, type: e.type === "turn-skipped" ? "salta" : e.type === "aura-block" ? "aura" : "svela",
          source: e.source, targets: [e.target], blocked: e.type === "aura-block",
          detail: e.type === "turn-skipped" ? "Turno saltato" : "Domanda ricevuta", duration: 1.5 });
      }
    }
    return result;
  }
  function createTracker() {
    let id = null, cursor = 0, queue = [], age = 0;
    return {
      sync(state) {
        if (id !== state.id || state.events.length < cursor) {
          id = state.id; cursor = state.events.length; queue = []; age = 0;
          return; // Opening a save never replays historical attacks.
        }
        queue.push(...plans(state.events.slice(cursor), state));
        cursor = state.events.length;
      },
      current: () => queue[0] ?? null,
      sample(reduced) { return queue.length ? (reduced ? .65 : Math.min(1, age / queue[0].duration)) : 0; },
      advance(delta, reduced) {
        if (!queue.length) return;
        age += Math.max(0, delta);
        if (age >= (reduced ? .45 : queue[0].duration)) { queue.shift(); age = 0; }
      },
    };
  }
  const mix = (a,b,t) => a+(b-a)*t;
  let art = null;
  let sacrificeArt = null, poisonArt = null;
  const POISON_ASSET="assets/hell-race/arsenico-v1.png";
  const SACRIFICE_ASSET = "assets/hell-race/sacrificio-v1.png";
  const cells = [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];
  function load(redraw=()=>{}) {
    if(!poisonArt&&typeof root.Image==='function'){
      poisonArt=new root.Image();poisonArt.src=root.HellscapePreviewResources?.assets?.[POISON_ASSET]||POISON_ASSET;
      poisonArt.addEventListener('load',redraw,{once:true});
    }
    if(!sacrificeArt&&typeof root.Image==="function"){
      sacrificeArt=new root.Image();sacrificeArt.src=root.HellscapePreviewResources?.assets?.[SACRIFICE_ASSET]||SACRIFICE_ASSET;
      sacrificeArt.addEventListener("load",redraw,{once:true});
    }
    if (!art && typeof root.Image === "function") {
      art = new root.Image();
      const path="assets/hell-race/ammo-relics-v1.webp";
      art.src=root.HellscapePreviewResources?.assets?.[path]||path;
      art.addEventListener("load",redraw,{once:true});
    }
    return art;
  }
  function relic(c,index,x,y,w,h,angle=0) {
    const img=load();if(!img?.complete||!img.naturalWidth)return;
    const [col,row]=cells[index],sw=img.naturalWidth/3,sh=img.naturalHeight/3;
    c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);
    c.drawImage(img,col*sw,row*sh,sw,sh,Math.round(-w/2),Math.round(-h/2),Math.round(w),Math.round(h));c.restore();
  }
  // Physical fragments, with a dark underside and an ember-lit broken face.
  function debris(c,x,y,t,seed,bone=false) {
    for(let n=0;n<9;n++) {
      const a=n*2.4+seed,age=(t+n/13)%1,r=8+age*24;
      const px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r*.6-age*12);
      c.fillStyle=bone?"#35251d":"#170f0e";c.fillRect(px-2,py-1,5,4);
      c.fillStyle=bone?"#b7a078":n%3?"#71402a":"#db6b26";c.fillRect(px-2,py-2,3,2);
    }
  }
  const clamp01=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp01(n);return n*n*(3-2*n)};
  function render(c,width,state,plan,t,positions,reduced=false) {
    c.save();
    const phase=reduced ? .6 : t,fade=reduced?1:Math.min(1,t*8,(1-t)*8);
    c.globalAlpha=fade;
    const plaqueX=["arsenico","sacrificio"].includes(plan.type)?width-130:width/2;
    // A riveted, sooty plaque shares the same iron and bone palette as the relics.
    c.fillStyle="#100e0de8";c.fillRect(plaqueX-112,62,224,55);
    c.strokeStyle="#65513a";c.lineWidth=2;c.strokeRect(plaqueX-112,62,224,55);
    for(const dx of [-107,107])for(const y of [67,112]){c.fillStyle="#897054";c.fillRect(plaqueX+dx-1,y-1,3,3);}
    c.textAlign="center";c.font="bold 16px monospace";c.fillStyle="#dfc59a";
    c.fillText(plan.blocked?"SIGILLO · BLOCCATO":labels[plan.type],plaqueX,82);
    c.font="10px monospace";c.fillStyle="#bbab91";
    c.fillText(plan.targets.map(i=>state.groups[i]?.name??"").join(" · "),plaqueX,98,208);
    c.font="9px monospace";c.fillStyle="#c6814c";
    c.fillText(plan.blocked?"Attacco neutralizzato":plan.detail??details[plan.type],plaqueX,111,208);
    const source=positions[plan.source]??positions[plan.targets[0]];
    for(const index of plan.targets) {
      const p=positions[index];if(!p)continue;
      const x=p.x,y=p.y-(p.height??25)/2,turn=reduced?0:Math.sin(t*Math.PI*2)*.07;
      const size=Math.max(40,(p.width??36)+14);
      if(plan.blocked||plan.type==="aura") {
        // Bone and riveted iron close over the vehicle, then catch stone splinters.
        const build=reduced?1:Math.min(1,t*4);
        relic(c,1,x,y,(size+14)*(1.3-.3*build),size*.83,turn-(1-build)*.4);
        relic(c,3,x,y-(1-build)*26,size+5,size*.91,-turn/2);
        if(plan.blocked)debris(c,x-size*.4,y,phase,4);
      } else if(plan.type==="arsenico") {
        const q=reduced?1:smooth(t/.5),from=source??p;
        const vx=mix(from.x,x,q),vy=mix(from.y-45,y-40,q)-(reduced?0:Math.sin(q*Math.PI)*35);
        if(poisonArt?.complete&&poisonArt.naturalWidth)c.drawImage(poisonArt,vx-22,vy-26,44,44);
        if(t>.5&&!reduced)for(let n=0;n<5;n++){
          const age=clamp01((t-.5-n*.025)/.35);c.save();c.globalAlpha*=1-age;
          c.fillStyle='#b1c271';c.fillRect(x-8+n*4,y-21+age*32,2,3);c.restore();
        }
      } else if(plan.type==="salta") {
        const close=reduced?1:Math.min(1,t*4);
        relic(c,0,x,y,size+(1-close)*24,size*.8,turn);
        debris(c,x,y+10,phase,8);
      } else if(plan.type==="sacrificio") {
        const pulse=reduced?1:1+Math.sin(t*Math.PI*4)*.035;
        const rise=reduced?1:smooth(t/.28),size=74*pulse;
        if(sacrificeArt?.complete&&sacrificeArt.naturalWidth)
          c.drawImage(sacrificeArt,x-size/2,y-88-(1-rise)*12,size,size);
        c.font="bold 12px monospace";c.fillStyle="#bc5550";c.fillText("−1 VITA",x-31,y+7);
        c.fillStyle="#dfc59a";c.fillText("+777 PT",x+36,y+7);
      } else if(plan.type==="ruba") {
        relic(c,6,x,y-24,29,25,turn);
        for(let n=0;n<4;n++){
          const q=reduced?n/4:(t*1.3+n/4)%1;
          relic(c,6,mix(x,source.x,q),mix(y-18,source.y-20,q)-Math.sin(q*Math.PI)*32,12,10,q*2);
        }
      } else if(plan.type==="svela") {
        const open=reduced?1:Math.min(1,t*5);
        relic(c,4,x,y-28-(reduced?0:Math.sin(t*Math.PI)*5),52,40*(.1+.9*open),turn);
        debris(c,x,y-16,phase,12,true);
      } else if(plan.type==="karma") {
        const rise=reduced?1:Math.min(1,t*4);
        relic(c,5,x,y-16-(1-rise)*20,50,64,reduced?0:Math.sin(t*Math.PI*2)*.08);
        c.font="bold 12px monospace";c.fillStyle="#dfc59a";c.fillText("PUNTI ×2",x,y-55);
        c.font="bold 10px monospace";c.fillStyle="#bf7868";c.fillText("ERRORE −2×",x,y+26);
      } else if(plan.type==="marx") {
        const cx=width/2,cy=210;
        // Scales are drawn once; individual tribute pouches move in, then out.
        if(index===plan.targets[0])relic(c,7,cx,cy,64,64,turn);
        for(let n=0;n<3;n++){
          const q=reduced?(n+1)/4:(t*1.4+n/3)%1,back=t>.5;
          relic(c,6,mix(back?cx:x,back?x:cx,q),mix(back?cy:y-15,back?y-15:cy,q),15,13,q);
        }
      } else if(plan.type==="ira") {
        const rise=reduced?1:Math.min(1,t*4);
        relic(c,2,x,y+4,size+16,32,turn);
        relic(c,8,x,y-12-(1-rise)*14,40,55*rise*(reduced?1:1+Math.sin(t*55+index)*.08),turn);
        debris(c,x,y+4,phase,index*7);
        c.fillStyle="#d6b18a";c.font="bold 10px monospace";c.fillText("−1 VITA",x,y-48);
      }
    }
    c.restore();
  }
  function ready(){load();return [art,sacrificeArt,poisonArt].every(img=>img?.complete&&img.naturalWidth>0);}
  const api = { plans, createTracker, render, labels, load, ready };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolAmmo = api;
})(globalThis);
