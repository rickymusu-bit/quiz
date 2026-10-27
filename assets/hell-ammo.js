/* Ammo cinematics: consume event copies, never mutate the game or its save. */
(function (root) {
  "use strict";
  const labels = { salta: "CATENE", ruba: "TRIBUTO", svela: "MALOCCHIO",
    aura: "SIGILLO", karma: "CONTRAPPASSO", marx: "LIVELLA", ira: "FLAGELLO" };
  const colors = { salta: "#b7c6d8", ruba: "#ffd568", svela: "#c79aff",
    aura: "#82e4de", karma: "#e99eff", marx: "#f6c76e", ira: "#ff885b" };
  const details = { salta: "Prossimo turno saltato", ruba: "Prossimo guadagno condiviso",
    svela: "Scelta del destinatario", aura: "Protezione attiva", karma: "Munizione trasformata",
    marx: "Punti divisi in parti uguali", ira: "Tutti perdono una vita" };
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
          detail: "Nuova Ammo: " + labels[e.ammo], duration: 1.5 });
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
  const mix = (a, b, t) => a + (b - a) * t;
  function line(c, points, color, width = 2) {
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = "miter";
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y))); c.stroke();
  }
  function ring(c, x, y, radius, color) {
    const points = Array.from({ length: 9 }, (_, i) => [x + Math.cos(i * Math.PI / 4) * radius, y + Math.sin(i * Math.PI / 4) * radius]);
    line(c, points, "#1a1024", 5); line(c, points, color);
  }
  function coin(c, x, y) {
    c.fillStyle = "#704025"; c.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 9);
    c.fillStyle = "#ffd568"; c.fillRect(Math.round(x) - 3, Math.round(y) - 4, 6, 7);
    c.fillStyle = "#fff0b0"; c.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 4);
  }
  function eye(c, x, y, color) {
    line(c, [[x-23,y],[x-12,y-10],[x+12,y-10],[x+23,y],[x+12,y+10],[x-12,y+10],[x-23,y]], "#211329", 7);
    line(c, [[x-23,y],[x-12,y-10],[x+12,y-10],[x+23,y],[x+12,y+10],[x-12,y+10],[x-23,y]], color, 3);
    c.fillStyle = "#fff0c8"; c.fillRect(x-6,y-7,12,14);
    c.fillStyle = "#281335"; c.fillRect(x-2,y-6,4,12);
  }
  function shield(c, x, y, color, grow = 1) {
    const points = [[-27,-22],[0,-32],[27,-22],[23,11],[0,27],[-23,11],[-27,-22]].map(([dx,dy])=>[x+dx*grow,y+dy*grow]);
    c.fillStyle = "#17383a88"; c.beginPath(); points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py)); c.fill();
    line(c, points, "#0b2529", 6); line(c, points, color, 3);
    line(c, [[x-9,y],[x,y+8],[x+13,y-12]], color, 3);
  }
  function render(c, width, state, plan, t, positions, reduced = false) {
    const color = colors[plan.type], pulse = reduced ? 1 : Math.sin(Math.PI * Math.min(1, t * 1.8));
    c.save();
    // One quiet title plate, without flashes over the road or the vehicles.
    c.fillStyle = "#100c17e8"; c.fillRect(width/2-112, 65, 224, 56);
    c.fillStyle = color; c.fillRect(width/2-112, 65, 3, 56);
    c.textAlign = "center"; c.font = "bold 16px monospace";
    c.fillText(plan.blocked ? "SIGILLO · BLOCCATO" : labels[plan.type], width/2, 84);
    c.font = "10px monospace"; c.fillStyle = "#f5e8d8";
    const names = plan.targets.map(i=>state.groups[i]?.name ?? "").join(" · ");
    c.fillText(names, width/2, 100, 208);
    c.font = "9px monospace"; c.fillStyle = color;
    c.fillText(plan.blocked ? "Attacco neutralizzato" : plan.detail ?? details[plan.type], width/2, 114, 208);
    const source = positions[plan.source] ?? positions[plan.targets[0]];
    for (const index of plan.targets) {
      const p = positions[index]; if (!p) continue;
      const x = Math.round(p.x), y = p.y - 24;
      c.globalAlpha = reduced ? 1 : Math.min(1, t * 8, (1-t)*7);
      if (plan.blocked) {
        shield(c,x,y,"#82e4de");
        if (!reduced && t < .65) {
          const q = Math.min(1,t/.4);
          const px = mix(source.x,x-30,q), py = mix(source.y-28,y,q);
          ring(c,px,py,5,color);
          for(let n=0;n<5;n++) line(c,[[x-30,y],[x-38-n*4,y-16+n*8]],color);
        }
      } else if (plan.type === "salta") {
        const reach = reduced ? 1 : Math.min(1,t*4);
        for (let n=0;n<9;n++) {
          const dx=-35+n*8, dy=(n%2?4:0);
          line(c,[[x+dx,y-4],[x+dx+4,y-9],[x+dx+10,y-4],[x+dx+4,y+1],[x+dx,y-4]],color,3);
        }
        line(c,[[x-29,y-25*reach],[x-29,y+19],[x+29,y+19],[x+29,y-25*reach]],"#64758c",3);
        c.fillStyle="#e4b96a"; c.fillRect(x-6,y-8,12,13); c.fillStyle="#41314a"; c.fillRect(x-1,y-5,3,5);
      } else if (plan.type === "ruba") {
        for (let n=0;n<6;n++) {
          const q = reduced ? n/6 : (t*1.5+n/6)%1;
          coin(c,mix(x,source.x,q),mix(y-12,source.y-36,q)-Math.sin(q*Math.PI)*48);
        }
        ring(c,x,y,32,color);
      } else if (plan.type === "svela") {
        const lift = reduced ? 0 : (1-Math.min(1,t*4))*22;
        eye(c,x,y-33-lift,color);
        for(let n=-1;n<=1;n++) line(c,[[x+n*13,y-15],[x+n*8,y+8]],"#9f6ed1",1);
      } else if (plan.type === "aura") {
        shield(c,x,y,color,reduced?1:.7+.3*pulse);
        ring(c,x,y,37,color);
      } else if (plan.type === "karma") {
        ring(c,x,y,34,color); eye(c,x,y-25,color);
        const q = reduced ? .6 : Math.min(1,t*1.5);
        const px=mix(x,source.x,q),py=mix(y,source.y-25,q)-Math.sin(q*Math.PI)*44;
        line(c,[[x,y],[px,py]],color,2);
        line(c,[[px-6,py-5],[px,py],[px-6,py+5]],color,3);
      } else if (plan.type === "marx") {
        const center={x:width/2,y:225};
        line(c,[[x,y-12],[center.x,center.y]],"#b58346",2);
        for(let n=0;n<3;n++) {
          const q = reduced ? (n+1)/4 : (t*1.2+n/3)%1;
          coin(c,mix(t<.5?x:center.x,t<.5?center.x:x,q),mix(t<.5?y-12:center.y,t<.5?center.y:y-12,q));
        }
        line(c,[[x-12,y-32],[x+12,y-32]],color,3); line(c,[[x-12,y-25],[x+12,y-25]],color,3);
      } else if (plan.type === "ira") {
        const reach = reduced ? 1 : Math.min(1,t*3);
        line(c,[[x-8,132],[x+8,170],[x-7,199],[x+8,226],[x,y-8]],"#6a282a",9);
        line(c,[[x-8,132],[x+8,170],[x-7,199],[x+8,226],[x,mix(226,y-8,reach)]],"#ffe1a0",3);
        ring(c,x,y+6,16+20*(reduced ? .5 : t),color);
        c.fillStyle="#ffb285"; c.font="bold 13px monospace"; c.fillText("−1 VITA",x,y-43);
      }
    }
    c.restore();
  }
  const api = { plans, createTracker, render, labels };
  if (typeof module !== "undefined") module.exports = api;
  else root.FoolAmmo = api;
})(globalThis);
