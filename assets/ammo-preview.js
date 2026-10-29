(function(){
  'use strict';
  const labels={salta:'Catene',ruba:'Tributo',svela:'Malocchio',aura:'Sigillo',karma:'Contrappasso',marx:'Livella',ira:'Flagello',antisigillo:'Antisigillo',sacrificio:'Sacrificio'};
  const descriptions={salta:'Catene di ferro corroso si serrano sul veicolo, con un lucchetto a teschio.',ruba:'Sacche di monete trasferiscono il 33% dei punti; chi usa Tributo cede subito il turno.',svela:'Un occhio di carne, osso e ferro svela la domanda senza alternative: chi sbaglia perde il valore, fino a zero; la rotazione resta ancorata a chi lo usa.',aura:'Un ossario e una gabbia di ferro proteggono per 3 turni personali: niente uso o guadagno Ammo; Flagello e Antisigillo passano.',karma:'Uno specchio gotico si innalza sul giocatore: per 3 turni punti doppi alle corrette e penalità doppia agli errori.',marx:'Una bilancia di ossa e ferraglia raccoglie e ripartisce il tributo.',ira:'Tutti perdono una vita, tutte le Ammo e fino a 666 punti.',antisigillo:'Un cuneo biforcuto di ferro colpisce il Sigillo: osso e ferraglia si spezzano, lasciando il bersaglio vulnerabile.',sacrificio:'Un calice di ferro, oro e osso accompagna il sacrificio: −1 vita e +777 punti a chi lo usa.'};
  const state={id:'ammo-showcase',valid:8,respondent:0,groups:[0,1,2].map(i=>({name:'Dannato '+(i+1),score:{n:'0',d:'1'},out:false})),config:{bases:{facile:100,media:200,difficile:300},questionCount:33,vehicles:['chopper','pickup','ape']},events:[]};
  let serial=0,sequence=0,timer=null;
  const stage=document.getElementById('stage'),buttons=document.getElementById('ammo-buttons'),description=document.getElementById('effect-description');
  function draw(){stage.replaceChildren(FoolHellRace.createStage(state));}
  function stop(){sequence++;clearTimeout(timer);}
  function play(type){
    const id='demo-'+(++serial);
    state.events.push({id,activation:id,copy:{type},source:0,target:['salta','ruba','antisigillo'].includes(type)?1:null});
    draw();description.textContent=labels[type]+': '+descriptions[type];
    for(const b of buttons.children)b.setAttribute('aria-pressed',String(b.dataset.type===type));
  }
  for(const [type,label] of Object.entries(labels)){
    const b=document.createElement('button');b.textContent=label;b.dataset.type=type;b.setAttribute('aria-pressed','false');
    b.onclick=()=>{stop();play(type)};buttons.append(b);
  }
  document.getElementById('play-all').onclick=()=>{stop();const key=sequence,types=Object.keys(labels);let index=0;
    const next=()=>{if(key!==sequence||index===types.length)return;play(types[index++]);timer=setTimeout(next,matchMedia('(prefers-reduced-motion: reduce)').matches?1100:2800)};next();};
  document.getElementById('bridge-only').onclick=()=>{stop();state.id='bridge-'+(++serial);draw();description.textContent='Il ponte stretto sospeso sul lago di lava. Le sagome dei tre mezzi restano separate.';for(const b of buttons.children)b.setAttribute('aria-pressed','false');};
  document.getElementById('vehicles').onchange=e=>{stop();state.id='vehicles-'+(++serial);state.config.vehicles=e.target.value==='large'?['pickup','truck','offroad']:['chopper','pickup','ape'];draw();};
  draw();
})();
