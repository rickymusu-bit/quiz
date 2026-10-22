'use strict';
const F=Fool,$=id=>document.getElementById(id),main=$('main');
let bank=null,prepared=null,game=null,previewIndex=0,ui='config',fitting=false,fitBlocked=false,messageTimer,inventoryCanResume=false,catalog=null,selectedBankId=null,configurationLoad=0,settingsDraft=null,setupMode=new URL(location.href).searchParams.get('settings')==='1'?'settings':'config';
const teamDraft={names:['Gruppo 1','Gruppo 2','Gruppo 3'],icons:['skull','bolt','star']};
const ICONS={skull:['☠︎','Teschio'],bolt:['ϟ','Fulmine'],star:['★','Stella'],swords:['⚔︎','Spade'],shield:['⛨','Scudo'],crown:['♛','Corona']};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function btn(text,fn,cls='',disabled=false){const b=node('button',text,cls);b.type='button';b.disabled=disabled;b.onclick=()=>act(fn);return b}
function act(fn){try{const result=fn();if(result&&typeof result.catch==='function')result.catch(e=>message(e.message))}catch(e){message(e.message)}}
function message(text){$('message').textContent=text;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('message').textContent='',10000)}
function math(el,text){for(const p of F.mathParts(text)){if(p.text!==undefined)el.append(document.createTextNode(p.text));else{const span=node('span',undefined,(p.display?'math-block':'math-inline')+' math-scroll');katex.render(p.math,span,{displayMode:p.display,trust:false,throwOnError:true,strict:'ignore',maxExpand:1000});el.append(span)}}return el}
function text(tag,value,cls){return math(node(tag,undefined,cls),value)}
function input(label,id,value,type='text'){const l=node('label',label+' '),i=node('input');i.id=id;i.type=type;i.value=value;l.append(i);return l}
function select(label,id,values,value){const l=node('label',label+' '),s=node('select');s.id=id;for(const [v,t]of values)s.append(new Option(t,v));s.value=value;l.append(s);return l}
function heading(title,sub){const p=node('section',undefined,'stack');p.append(node('h2',title));if(sub)p.append(node('p',sub,'muted'));main.append(p);return p}
async function fetchSiteText(path){
 const url=new URL(path,location.href);if(!['http:','https:'].includes(url.protocol)||url.origin!==location.origin)throw Error('Apri Fool dal sito per caricare le domande.');
 const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('Contenuti non disponibili. Controlla la connessione e riprova.');
 if(Number(response.headers.get('content-length'))>20*1024*1024)throw Error('Banca domande troppo grande.');return response.text();
}
async function loadCatalog(){
 const data=JSON.parse(await fetchSiteText('datasets.json'));
 if(data.versione!==1||!Array.isArray(data.banche)||!data.banche.length)throw Error('Nessuna banca domande disponibile sul sito.');
 const ids=new Set();for(const entry of data.banche){if(typeof entry.id!=='string'||!entry.id.trim()||ids.has(entry.id)||typeof entry.nome!=='string'||!entry.nome.trim()||typeof entry.url!=='string')throw Error('Catalogo delle domande non valido.');ids.add(entry.id);const url=new URL(entry.url,location.href);if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))throw Error('Indirizzo della banca non valido.');}
 return data.banche;
}
async function loadBank(entry){const parsed=F.parseDataset(await fetchSiteText(entry.url),katex);return {...parsed,source:entry.id};}
function persist(){if(!game)return;try{localStorage.setItem('fool-v1',JSON.stringify(game.snapshot()));return true}catch(e){message('Il browser non consente di conservare la partita. Mantieni aperta questa pagina.');return false}}
function changed(){persist();renderGame()}
function command(fn){return()=>{fn();changed()}}
function localSave(){try{return localStorage.getItem('fool-v1')}catch(e){return null}}
function offerResume(parent){if(localSave())parent.append(btn('Riprendi partita',()=>restoreGame(localSave())))}
function goHome(){persist();configurationLoad++;location.assign(new URL('./',location.href).href)}
function defaultSettings(){return {seconds:45,probability:90,difficulty:'misto',bases:{facile:100,media:200,difficile:300},quotas:balancedQuotas('misto')}}
function balancedQuotas(filter){
 const topics=[...new Set(bank.bank.map(q=>q.topic))],counts=topics.map(t=>bank.bank.filter(q=>q.topic===t&&(filter==='misto'||q.difficulty===filter)).length),values=topics.map(()=>0);let remaining=33;
 while(remaining&&values.some((n,i)=>n<counts[i]))for(let i=0;i<values.length&&remaining;i++)if(values[i]<counts[i]){values[i]++;remaining--}
 return Object.fromEntries(topics.map((t,i)=>[t,values[i]]));
}
function settingsStore(){const raw=localStorage.getItem('fool-settings-v1');if(!raw)return {version:1,profiles:{}};const data=JSON.parse(raw);if(data?.version!==1||!data.profiles||typeof data.profiles!=='object'||Array.isArray(data.profiles))throw Error('Impostazioni salvate non valide');return data}
function settingsConfig(value,names=teamDraft.names,icons=teamDraft.icons){return {seconds:value.seconds,probability:value.probability,difficulty:value.difficulty,bases:value.bases,quotas:value.quotas,names,icons}}
function savedSettings(){try{const value=settingsStore().profiles[selectedBankId];if(value){F.prepare(bank.bank,settingsConfig(value,['Gruppo 1','Gruppo 2','Gruppo 3'],['skull','bolt','star']));return value}}catch(e){message('Impostazioni non disponibili: sono stati caricati i valori predefiniti. Puoi salvarli di nuovo da Impostazioni.')}return defaultSettings()}
function rememberTeams(){for(let i=0;i<3;i++){if($('name'+i))teamDraft.names[i]=$('name'+i).value;if($('icon'+i))teamDraft.icons[i]=$('icon'+i).value}}
function teamIcon(key){const [symbol,label]=ICONS[key]||ICONS.skull;const icon=node('span',symbol,'team-icon');icon.setAttribute('role','img');icon.setAttribute('aria-label',label);return icon}
async function configure(){
 const request=++configurationLoad;ui=setupMode;game=null;main.className='';main.replaceChildren();const loading=heading(setupMode==='settings'?'Impostazioni':'Prepara Fool','Caricamento delle domande dal sito…');if(setupMode==='config')offerResume(loading);
 try{const available=await loadCatalog();if(request!==configurationLoad||ui!==setupMode)return;catalog=available;const entry=catalog.find(x=>x.id===selectedBankId)||catalog[0];selectedBankId=entry.id;
 if(!bank||bank.source!==entry.id){const loaded=await loadBank(entry);if(request!==configurationLoad||ui!==setupMode)return;bank=loaded;}
 renderConfiguration();
 }catch(e){if(request!==configurationLoad||ui!==setupMode)return;main.replaceChildren();const p=heading('Domande non disponibili',e.message);p.append(btn('Riprova',configure,'primary'),btn('Torna alla schermata iniziale',goHome));}
}
function renderConfiguration(){
 main.replaceChildren();const editing=setupMode==='settings',value=settingsDraft?.source===bank.source?settingsDraft.value:savedSettings();
 const p=heading(editing?'Impostazioni':'Prepara Fool',editing?'I parametri si applicano alle nuove partite e si conservano in questo browser. Salva prima di cambiare argomento.':'Scegli nomi, icone e argomento delle domande.');if(!editing)offerResume(p);
 const choice=select('Argomento delle domande','bank-choice',catalog.map(x=>[x.id,x.nome]),selectedBankId);choice.querySelector('select').onchange=()=>act(async()=>{rememberTeams();selectedBankId=$('bank-choice').value;bank=null;prepared=null;settingsDraft=null;await configure()});p.append(choice);
 if(!editing){
  const grid=node('div',undefined,'columns setup-teams');for(let i=0;i<3;i++){const card=node('section',undefined,'panel');const title=node('h3','Gruppo '+(i+1));const badge=teamIcon(teamDraft.icons[i]);title.prepend(badge);card.append(title,input('Nome del gruppo '+(i+1),'name'+i,teamDraft.names[i]));const icons=select('Icona del gruppo '+(i+1),'icon'+i,Object.entries(ICONS).map(([key,[symbol,name]])=>[key,symbol+' '+name]),teamDraft.icons[i]);icons.querySelector('select').onchange=()=>{teamDraft.icons[i]=$('icon'+i).value;title.replaceChild(teamIcon(teamDraft.icons[i]),title.firstChild)};card.append(icons);grid.append(card)}p.append(grid);
  const row=node('div',undefined,'row');row.append(btn('Inizia partita',()=>{rememberTeams();prepared=F.prepare(bank.bank,settingsConfig(savedSettings()));start()},'primary'),btn('Torna alla schermata iniziale',goHome));p.append(row);return;
 }
 const grid=node('div',undefined,'columns settings-grid');const time=node('section',undefined,'panel');time.append(node('h3','Tempo e bonus'),input('Secondi per domanda','seconds',value.seconds,'number'),input('Probabilità bonus (%)','probability',value.probability,'number'),select('Difficoltà','difficulty',[['misto','Misto'],['facile','Facile'],['media','Media'],['difficile','Difficile']],value.difficulty));grid.append(time);
 const bases=node('section',undefined,'panel');bases.append(node('h3','Punti base'));for(const d of ['facile','media','difficile'])bases.append(input(d,'base-'+d,value.bases[d],'number'));grid.append(bases);p.append(grid);
 const topics=node('section',undefined,'panel');topics.id='topics';topics.append(node('h3','Distribuzione delle domande'),node('p','Totale 33 domande. Le altre restano in riserva per sostituzioni e Battaglia finale.','muted'));const list=node('div');list.id='quotas';topics.append(list);p.append(topics);drawQuotas(value.quotas);$('difficulty').onchange=()=>rebalance();topics.append(btn('Ribilancia quote',rebalance));
 const row=node('div',undefined,'row');row.append(btn('Salva impostazioni',()=>{const c=readSettings();F.prepare(bank.bank,settingsConfig(c));let data;try{data=settingsStore()}catch(e){data={version:1,profiles:{}}}data.profiles[selectedBankId]=c;try{localStorage.setItem('fool-settings-v1',JSON.stringify(data))}catch(e){throw Error('Il browser non consente di salvare le impostazioni.')}settingsDraft=null;message('Impostazioni salvate per le nuove partite.');},'primary'),btn('Torna alla schermata iniziale',goHome));p.append(row);
 const teacher=node('section',undefined,'panel');teacher.append(node('h3','Anteprima docente'),node('p','Contiene le soluzioni: aprila prima di proiettare alla classe.','muted'),btn('Prepara anteprima',()=>{const value=readSettings();prepared=F.prepare(bank.bank,settingsConfig(value));settingsDraft={source:bank.source,value};previewIndex=0;preview()}));p.append(teacher);
}
function drawQuotas(quotas){const list=$('quotas'),filter=$('difficulty').value;list.replaceChildren();[...new Map(bank.bank.map(q=>[q.topic,q.topicName]))].forEach(([t,name],i)=>{const count=bank.bank.filter(q=>q.topic===t&&(filter==='misto'||q.difficulty===filter)).length;const l=input(name+' ('+count+' disponibili)','quota-'+i,quotas[t]??0,'number');l.querySelector('input').dataset.topic=t;list.append(l)});}
function rebalance(){drawQuotas(balancedQuotas($('difficulty').value))}
function number(id){const x=$(id).value.trim();if(x==='')throw Error('Compilare '+id);const n=Number(x);if(!Number.isFinite(n))throw Error('Valore numerico non valido: '+id);return n}
function readSettings(){return {seconds:number('seconds'),probability:number('probability'),difficulty:$('difficulty').value,bases:Object.fromEntries(['facile','media','difficile'].map(d=>[d,number('base-'+d)])),quotas:Object.fromEntries([...$('quotas').querySelectorAll('input')].map(i=>[i.dataset.topic,number(i.id)]))}}
function preview(){ui='preview';main.className='';main.replaceChildren();const p=heading('Anteprima docente','Soluzioni visibili: non proiettare questa schermata. È un’estrazione di esempio; ogni nuova partita estrae di nuovo le domande.');p.append(node('p','33 domande estratte · '+(prepared.eligible.length-33)+' quesiti di riserva · '+prepared.config.seconds+' secondi · bonus '+prepared.config.probability+'%'));
 const q=prepared.chosen[previewIndex];p.append(node('h3',(previewIndex+1)+'/33 — '+prepared.config.bases[q.difficulty]+' punti'),text('p',q.body,'question'));
 q.options.forEach((a,i)=>p.append(text('p','ABCD'[i]+'. '+a+(i===q.correct?' ✓':''))));p.append(text('p',q.explanation,'help'));
 const row=node('div',undefined,'row');row.append(btn('← Precedente',()=>{previewIndex--;preview()},'',previewIndex===0),btn('Successiva →',()=>{previewIndex++;preview()},'',previewIndex===32),btn('Sostituisci domanda',()=>{const ids=new Set(prepared.chosen.map(q=>q.id));const pool=prepared.bank.filter(x=>!ids.has(x.id)&&x.topic===q.topic&&x.difficulty===q.difficulty);if(!pool.length)throw Error('Nessun sostituto dello stesso argomento e difficoltà');prepared.chosen[previewIndex]=F.mix(F.shuffle(pool,Math.random)[0],Math.random);preview()}));p.append(row,btn('Torna alle impostazioni',configure));}
function start(){game=F.Game.start(prepared);ui='game';try{preflight(prepared.chosen)}catch(e){game=null;ui=setupMode;renderConfiguration();throw e}persist();renderGame();}
function scoreboard(){
 const s=game.s,grid=node('div',undefined,'columns scoreboard');
 s.groups.forEach((g,i)=>{
  const t=node('section',undefined,'team'+(i===s.respondent?' active':'')+(g.out?' out':''));
  const title=node('h3',g.name);title.prepend(teamIcon(s.config.icons?.[i]||['skull','bolt','star'][i]));const status=g.out?'ELIMINATO':s.phase==='spareggio'&&!s.order.includes(i)?'FUORI SPAREGGIO':i===s.respondent?'RISPONDE':'';
  if(status)title.append(node('span',status,'team-label'));t.append(title,node('strong',F.exact(g.score)+' pt'));
  t.append(node('p','Serie '+g.streak+' · sanzioni '+g.sanctions+'/3','team-status'));
  const info=node('details');info.open=innerWidth>650;const summary=node('summary','Dettagli');summary.setAttribute('aria-label','Bonus ed effetti di '+g.name);info.append(summary,node('p','Prossima corretta ×'+((10+g.streak)/10).toFixed(2).replace('.',',')));
  const counts=F.TYPES.map(type=>[type,g.inventory.filter(c=>c.type===type).length]);const bonuses=node('ul',undefined,'bonus-list');for(const [type,n]of counts)bonuses.append(node('li',F.LABELS[type]+' ×'+n));info.append(bonuses);
  const locks=[...new Map(g.inventory.filter(c=>c.target!==null).map(c=>[c.type+':'+c.target,F.LABELS[c.type]+' solo → '+s.groups[c.target].name])).values()];
  const effects=s.effects.filter(e=>e.target===i).map(e=>F.LABELS[e.type]+' da '+s.groups[e.source].name);const details=[...locks,...effects];
  if(g.aura!==null)details.push('Aura attiva fino al prossimo turno');if(g.out)details.push(g.cause);if(details.length)info.append(node('p',details.join(' · ')));t.append(info);grid.append(t);
 });return grid;
}
function questionPoints(){return node('p',(game.s.phase==='ordinaria'?game.s.config.bases[game.s.current.difficulty]:0)+' punti','question-points')}
function gameBody(){const s=game.s,revision=s.revision,b=node('section',undefined,'operation-body'+(s.screen==='hidden'?' hidden-question':''));
 if(s.suspended){b.append(node('h2','Partita sospesa'),node('p','Riprenderete con le stesse squadre e lo stesso stato. Il timer resta fermo.'),btn('Riprendi la sessione',command(()=>game.continueSession()),'primary'));return b}
 if(s.phase==='conclusa'){b.append(node('h2',s.winner===null?'Tutti eliminati':s.groups[s.winner].name+' vince Fool!'),node('p',s.winner===null?'Nessun premio finale.':'Un 10 blu sul registro per ogni membro del gruppo vincitore.','question'),node('p','Il 10 blu fa media con compiti a casa e progetti. Queste valutazioni contribuiscono al voto verde di fine anno. La registrazione resta al docente.','help'),btn('Nuova partita',()=>{setupMode='config';history.replaceState(null,'',location.pathname);configure()}));return b}
 if(s.screen==='supply'){b.append(node('h2','Riserva esaurita'),node('p','La partita resta salvata. Controlla se sono state aggiunte nuove domande sul sito: punti e turni restano invariati.'),btn('Cerca nuove domande',refreshSupply,'primary'));return b}
 if(s.screen==='hidden'){b.append(node('div',s.phase==='spareggio'?'Battaglia finale':'Domanda '+(s.valid+1)+' di 33','eyebrow'),node('h2','Tocca a '+s.groups[s.respondent].name),questionPoints(),node('p',s.usedBonus?'Bonus del turno già usato':'Puoi usare un solo bonus in questo turno.','muted'),btn('Svela e avvia il tempo',command(()=>{assertFits(s.current);game.reveal(revision)}),'primary'));return b}
 if(s.current){b.append(questionPoints(),text('div',s.current.body,'question'));const answers=node('div',undefined,'answers');s.current.options.forEach((a,i)=>{const ab=btn('',command(()=>game.answer(i,revision)),'answer'+(s.result&&i===s.current.correct?' correct':''),s.screen!=='answer'||s.paused||!!s.panel||fitBlocked);ab.append(node('span','ABCD'[i],'letter'),text('span',a));answers.append(ab)});b.append(answers)}
 if(s.screen==='choice'){b.append(node('p','Svela e passa: scegli a timer fermo. Il tempo intero parte alla conferma.','good'));const row=node('div',undefined,'row');s.groups.forEach((g,i)=>{if(!g.out&&(i===s.owner||s.passLock===null||s.passLock===i))row.append(btn(i===s.owner?'Tieni la domanda':'Passa a '+g.name,command(()=>game.pass(i,revision))))});b.append(row)}
 if(s.screen==='answer'&&s.paused)b.append(node('p','IN PAUSA — risposte bloccate. Riprendi dal tempo residuo.','good'));
 if(s.screen==='result'){const r=s.result,ex=node('div',undefined,'solution');ex.append(node('strong',r.correct?'Risposta corretta':'Risposta errata / tempo scaduto'),text('p','Soluzione '+ 'ABCD'[s.current.correct]+': '+s.current.options[s.current.correct]),text('p',s.current.explanation));if(r.base)ex.append(node('p',r.base+' × '+r.multiplier+' = '+F.exact(r.gross)+' pt'+(r.beneficiaries.length?' · quota esatta '+F.exact(r.share)+' a '+[r.respondent,...r.beneficiaries].map(i=>s.groups[i].name).join(', '):'')));if(r.bonus)ex.append(node('p','Bonus vinto: '+F.LABELS[r.bonus.type]+' — conservato in inventario.','good'));b.append(ex)}
 return b}
function renderGame(){if(!game)return;ui='game';const s=game.s,revision=s.revision;main.className='operational';main.replaceChildren();main.append(scoreboard());const status=node('div',undefined,'statusline');status.append(node('div',(s.phase==='spareggio'?'Battaglia finale · extra '+(s.extra+1):s.phase==='conclusa'?'Fool · conclusa':'Fool · '+s.valid+'/33 concluse')+' · rotazione '+s.order.map(i=>s.groups[i].name).join(' → '),'turn'),node('div',timerText(),'timer'));status.lastChild.id='timer';main.append(status);if(s.owner!==s.respondent)main.append(node('div','Titolare: '+s.groups[s.owner].name+' · risponde: '+s.groups[s.respondent].name,'muted'));main.append(gameBody());
 const bar=node('nav',undefined,'toolbar');bar.setAttribute('aria-label','Comandi docente');if(s.phase!=='conclusa'&&!s.suspended){if(s.screen==='answer')bar.append(btn(s.paused?'Riprendi timer':'Pausa',command(()=>{if(s.paused){if(fitBlocked)throw Error('Correggere prima le dimensioni della finestra.');game.resume(revision)}else game.pause()})));if(s.screen==='result')bar.append(btn('Prossima domanda',command(()=>{game.next(revision);if(game.s.current)preflight([game.s.current])}),'primary'));bar.append(btn('Bonus e inventari',showInventory),btn('Sanzioni',command(()=>{game.openSanctions();showSanctions()})));if(['answer','choice'].includes(s.screen))bar.append(btn('Richiedi rifiuto',showRefusal));bar.append(btn('Campanella / sospendi',command(()=>game.bell())))}
 bar.append(btn('Salva nel browser',saveBrowser),btn('Schermo intero',toggleFullscreen));main.append(bar);
 if(s.suspendAfter)main.append(node('p','Campanella: concludere questa domanda, poi sospensione.','muted'));
 if(s.draftBonus&&!$('dialog').open){inventoryCanResume=false;const c=s.groups[s.owner].inventory.find(c=>c.id===s.draftBonus.copyId);if(c)selectBonus(c)}
 if(s.panel?.type==='sanctions'&&!$('dialog').open)showSanctions();else if(s.panel?.type==='refusal'&&!$('dialog').open)refusalDecision();
 requestAnimationFrame(checkFit);
}
function timerText(){if(!game)return '';const s=game.s;return (s.screen==='choice'?'Scelta · ':s.paused?'Pausa · ':'')+Math.ceil(game.left()/1000)+' s'}
function dialog(title,build){const d=$('dialog');d.replaceChildren(node('h2',title));build(d);if(!d.open)d.showModal();d.querySelector('button,input,select')?.focus();return d}
function closeDialog(){const d=$('dialog');if(d.open)d.close();}
function groupsOfInventory(g){const groups=new Map();for(const c of g.inventory){const key=c.type+':'+c.target;const a=groups.get(key)||[];a.push(c);groups.set(key,a)}return [...groups.values()]}
function showInventory(){const s=game.s;const wasRunning=game.running;inventoryCanResume=wasRunning;if(wasRunning)game.pause('inventario');persist();dialog('Bonus e inventari',d=>{
 const choose=select('Gruppo','inventory-team',s.groups.map((g,i)=>[i,g.name]),s.respondent);d.append(choose);const list=node('div',undefined,'inventory-list');d.append(list);let page=0;
 const draw=()=>{list.replaceChildren();const i=Number($('inventory-team').value),g=s.groups[i],sets=groupsOfInventory(g);const start=page*5,entries=node('ul',undefined,'bonus-inventory-list');if(sets.length)list.append(entries);for(const copies of sets.slice(start,start+5)){const c=copies[0],r=node('li',undefined,'bonus-group');r.append(node('span',F.LABELS[c.type]+' ×'+copies.length+(c.target===null?'':' · solo contro '+s.groups[c.target].name+(s.groups[c.target].out?' (eliminato)':''))));const disabled=i!==s.owner||i!==s.respondent||s.usedBonus||g.out||s.phase!=='ordinaria'||!['hidden','answer'].includes(s.screen)||s.screen==='answer'&&s.paused&&!inventoryCanResume||c.type==='karma'||c.type==='svela'&&s.screen!=='hidden'||c.target!==null&&s.groups[c.target].out;r.append(btn('Usa',()=>selectBonus(c), '',disabled));entries.append(r)}if(!sets.length)list.append(node('p','Nessun bonus conservato.'));if(sets.length>5){const nav=node('div',undefined,'row');nav.append(btn('Precedenti',()=>{page--;draw()},'',page===0),btn('Successivi',()=>{page++;draw()},'',start+5>=sets.length));list.append(nav)}};choose.querySelector('select').onchange=()=>{page=0;draw()};draw();d.append(node('p','Karma si trasforma da solo quando subisci un malus. Un solo uso per turno. Dopo aver chiuso, riprendi il timer.','muted'),btn('Chiudi',()=>{closeDialog();changed()}));});}
function selectBonus(copy){const s=game.s,revision=s.revision;s.draftBonus=s.draftBonus||{copyId:copy.id,target:null};persist();dialog('Attiva '+F.LABELS[copy.type],d=>{let target=null;if(['salta','ruba'].includes(copy.type)){const candidates=s.groups.map((g,i)=>[i,g]).filter(([i,g])=>i!==s.owner&&!g.out&&(copy.target===null||copy.target===i));if(!candidates.length)throw Error('Nessun bersaglio valido');d.append(select('Bersaglio','bonus-target',candidates.map(([i,g])=>[i,g.name]),s.draftBonus.target??candidates[0][0]));$('bonus-target').onchange=()=>{s.draftBonus.target=Number($('bonus-target').value);persist()};}d.append(node('p','La conferma consuma una copia e l’unico bonus del turno, anche se Aura blocca l’attacco.'));d.append(btn('Conferma uso',()=>{if($('bonus-target'))target=Number($('bonus-target').value);const paused=s.paused;if(s.screen==='answer'&&paused)s.paused=false;try{game.use(copy.id,target,revision)}catch(e){if(paused)s.paused=true;throw e}if(s.screen==='answer'&&paused){if(inventoryCanResume)game.run();else{s.paused=true;s.pauseReason='ripresa'}}closeDialog();changed()},'primary'),btn('Annulla',()=>{s.draftBonus=null;closeDialog();changed()}));});}
function showSanctions(){const s=game.s,revision=s.revision;dialog('Sanzioni — decisione del docente',d=>{d.append(node('p','Timer fermo. Registra tutto l’intervento prima di confermare. Le sanzioni azzerano la serie, senza sottrarre punti. Alla terza il gruppo è eliminato.'));const grid=node('div',undefined,'columns');s.groups.forEach((g,i)=>{const p=node('section',undefined,'panel');p.append(node('h3',g.name+' · '+g.sanctions+'/3'));if(g.out)p.append(node('p','Eliminato'));else{p.append(input('Nuove sanzioni','sanction-'+i,s.panel.counts[i],'number'),select('Motivo','reason-'+i,[['disturbo','Disturbo / offese ad altri gruppi'],['suggerimento','Suggerimenti'],['protesta','Offese / interruzioni al docente']],s.panel.reasons[i]));}grid.append(p)});d.append(grid,btn('Conferma intervento',()=>{for(let i=0;i<3;i++)if($('sanction-'+i)){s.panel.counts[i]=number('sanction-'+i);s.panel.reasons[i]=$('reason-'+i).value}game.closeSanctions(true,revision);closeDialog();changed()},'primary'),btn('Chiudi senza sanzionare',()=>{game.closeSanctions(false,revision);closeDialog();changed()}));});}
function showRefusal(){const s=game.s;const wasPaused=s.paused;if(game.running)game.pause('valutazione rifiuto');dialog('Richiesta di rifiuto',d=>{d.append(node('p','Solo subito dopo lo svelamento, prima di tentare una risposta. La tempestività la valuta il docente. La difficoltà non è un motivo ammesso.'),select('Motivo','refusal-reason',[['non svolto','Argomento non ancora svolto'],['formattazione','Formattazione incomprensibile']],'non svolto'),btn('Sottoponi al docente',()=>{if(!wasPaused&&s.screen==='answer')game.run();game.refuse($('refusal-reason').value);persist();refusalDecision()}),btn('Annulla',()=>{closeDialog();if(!wasPaused&&s.screen==='answer'&&s.paused)game.run();changed()}));});}
function refusalDecision(){dialog('Valutazione del rifiuto',d=>{d.append(node('p','Motivo: '+game.s.panel.reason+'. Accettando, il quesito viene escluso e sostituito allo stesso gruppo, con tempo intero al nuovo svelamento.'),btn('Accetta e sostituisci',()=>{game.decideRefusal(true,game.s.revision);closeDialog();if(game.s.current)preflight([game.s.current]);changed()},'primary'),btn('Respingi / annulla richiesta',()=>{game.decideRefusal(false,game.s.revision);closeDialog();changed()}));});}
async function toggleFullscreen(){
 if(document.fullscreenElement&&typeof document.exitFullscreen==='function')return document.exitFullscreen();
 if(typeof document.documentElement.requestFullscreen==='function')return document.documentElement.requestFullscreen();
 message('Puoi continuare a giocare in questa finestra: il browser non supporta lo schermo intero.');
}
function saveBrowser(){if(persist())message('Partita salvata. Per riprenderla, apri questo sito nello stesso browser.');}
async function refreshSupply(){
 const currentGame=game;const available=await loadCatalog();const known=new Map(currentGame.s.bank.map(q=>[q.id,q]));const additions=new Map();
 for(const entry of available){const parsed=await loadBank(entry);for(const q of parsed.bank){const original=known.get(q.id)||additions.get(q.id);if(original){if(JSON.stringify(original)!==JSON.stringify(q))throw Error('Una domanda già presente è stata modificata. La partita resta invariata.');}else additions.set(q.id,q);}}
 if(game!==currentGame||game.s.screen!=='supply')return;
 const bank=[...additions.values()].filter(q=>game.s.config.quotas[q.topic]>0&&(game.s.config.difficulty==='misto'||q.difficulty===game.s.config.difficulty));
 if(!bank.length)throw Error('Non sono ancora disponibili nuove domande per questa partita. Puoi riprovare dopo l’aggiornamento del sito.');
 game.supply({bank});preflight([game.s.current].filter(Boolean));changed();
}
function restoreGame(raw){const next=F.Game.restore(JSON.parse(raw.replace(/^\uFEFF/,'')));game=next;closeDialog();changed();message('Partita ripristinata. Nessun timer avviato automaticamente.');}
function hasOverflow(root){
 return [...root.querySelectorAll('*')].some(e=>{
  if(e.closest('.katex-mathml'))return false;
  const scroll=e.closest('.math-scroll');if(scroll&&scroll!==e)return false;
  const r=e.getBoundingClientRect(),style=getComputedStyle(e);
  if(style.position==='absolute'||style.display==='none'||r.width===0&&r.height===0)return false;
  return r.right>innerWidth+1||r.left< -1;
 })||root.scrollWidth>root.clientWidth+2;
}
function fitProbe(q){const oldScreen=game.s.screen,oldQ=game.s.current,oldResult=game.s.result;game.s.current=q;game.s.screen='result';game.s.result={correct:true,respondent:game.s.respondent,base:String(game.s.config.bases[q.difficulty]),multiplier:'10/10',gross:F.rational(100),share:F.rational(100,3),beneficiaries:[(game.s.respondent+1)%3,(game.s.respondent+2)%3],bonus:{type:'svela'}};
 main.className='operational';main.replaceChildren(scoreboard());const status=node('div','Fool · controllo completo domanda e spiegazione','statusline');main.append(status,gameBody());const bar=node('nav',undefined,'toolbar');for(const label of ['Prossima domanda','Bonus e inventari','Sanzioni','Campanella / sospendi','Salva nel browser','Schermo intero'])bar.append(btn(label,()=>{}));main.append(bar);const fits=!hasOverflow(main);game.s.screen=oldScreen;game.s.current=oldQ;game.s.result=oldResult;return fits;}
function assertFits(q){if(!fitProbe(q)){renderGame();throw Error('Il quesito '+q.id+' contiene un elemento troppo largo. Controlla il contenuto prima di proseguire.')}renderGame()}
function preflight(questions){fitting=true;try{for(const q of questions)if(!fitProbe(q)){renderGame();throw Error('Adattamento non idoneo per '+q.id+'. Controlla il contenuto prima di iniziare.')}fitBlocked=false;}finally{fitting=false;renderGame()}}
function checkFit(){if(!game||fitting||ui!=='game'||$('dialog').open)return;for(const el of main.querySelectorAll('.math-scroll')){if(el.scrollWidth>el.clientWidth+1)el.tabIndex=0;else el.removeAttribute('tabindex')}const operational=!game.s.suspended&&game.s.phase!=='conclusa';fitBlocked=operational&&hasOverflow(main);$('fit-warning').hidden=!fitBlocked;if(fitBlocked&&game.running){game.pause('dimensioni schermo');persist();renderGame()}}
$('fit-warning').append(node('h2','Contenuto da adattare'),node('p','Timer fermo: un elemento supera la larghezza disponibile. Controlla il contenuto o ricontrolla il layout prima di riprendere.'),btn('Schermo intero',toggleFullscreen),btn('Ricontrolla',()=>{fitBlocked=false;$('fit-warning').hidden=true;renderGame()}),btn('Salva nel browser',saveBrowser));
$('dialog').addEventListener('cancel',e=>{e.preventDefault();message('Usa i pulsanti del pannello per completare o annullare la decisione.');});
window.addEventListener('resize',()=>{if(ui==='game')requestAnimationFrame(checkFit)});
window.addEventListener('beforeunload',persist);
setInterval(()=>{if(!game||ui!=='game')return;const old=game.s.screen;game.tick();if(old!==game.s.screen){changed();return}if($('timer'))$('timer').textContent=timerText()},100);
setInterval(persist,3000);
if(new URL(location.href).searchParams.get('start')==='1')history.replaceState(null,'',location.pathname);
act(configure);
