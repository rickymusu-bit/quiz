(function(){
  'use strict';
  const labels={salta:'Catene',ruba:'Tributo',svela:'Malocchio',aura:'Sigillo',karma:'Contrappasso',marx:'Livella',ira:'Flagello',antisigillo:'Antisigillo'};
  const descriptions={salta:'Catene di ferro corroso si serrano sul veicolo, con un lucchetto a teschio.',ruba:'Una sacca di monete maledette indica il tributo sul prossimo guadagno.',svela:'Un occhio di carne, osso e ferro si apre sopra il dannato.',aura:'Un ossario e una gabbia di ferro proteggono il veicolo.',karma:'Uno specchio gotico spezzato trasforma la munizione e la vincola all’attaccante.',marx:'Una bilancia di ossa e ferraglia raccoglie e ripartisce il tributo.',ira:'Tutti perdono una vita, tutte le Ammo e fino a 666 punti.',antisigillo:'Un cuneo di ferro spezza il Sigillo attivo: la protezione è dissipata.'};
  const state={id:'ammo-showcase',valid:8,respondent:0,groups:[0,1,2].map(i=>({name:'Dannato '+(i+1),score:{n:'0',d:'1'},out:false})),config:{bases:{facile:100,media:200,difficile:300},questionCount:33,vehicles:['chopper','pickup','ape']},events:[]};
  let serial=0,sequence=0,timer=null;
  const stage=document.getElementById('stage'),buttons=document.getElementById('ammo-buttons'),description=document.getElementById('effect-description');
  function draw(){stage.replaceChildren(FoolHellRace.createStage(state));}
  function stop(){sequence++;clearTimeout(timer);}
  function play(type){
    const id='demo-'+(++serial);
    state.events.push(type==='karma'?{id,type:'karma-trigger',source:1,target:0,ammo:'salta'}:{id,activation:id,copy:{type},source:0,target:['salta','ruba','antisigillo'].includes(type)?1:null});
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
