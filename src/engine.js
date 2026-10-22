/* Fool 1.0.0 — modello e transizioni; nessuna dipendenza dal DOM. */
(function(root){
'use strict';
const RULES='18.0.1', VERSION='1.0.0', TYPES=['salta','ruba','svela','aura','karma'];
const LABELS={salta:'Salta turno',ruba:'Ruba punti',svela:'Svela e passa',aura:'Aura',karma:'Karma'};
const clone=x=>JSON.parse(JSON.stringify(x));
function need(v,m){if(!v)throw Error(m)}
function integer(v,min,max,label){need(typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max,label+' non valido');return v}
function gcd(a,b){while(b){const t=b;b=a%b;a=t}return a<0n?-a:a}
function rational(n,d=1n){n=BigInt(n);d=BigInt(d);need(d>0n,'Denominatore non positivo');const g=gcd(n,d);return {n:String(n/g),d:String(d/g)}}
const add=(a,b)=>rational(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));
const compare=(a,b)=>{const x=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return x>0n?1:x<0n?-1:0};
const exact=a=>a.d==='1'?a.n:a.n+'/'+a.d;
function shuffle(a,random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mathParts(text){
 // Historical banks use one extra escaping layer inside delimited formulas.
 // Normalize only that layer for rendering; preserve the source bank and IDs.
 const re=/\\\\\(([\s\S]*?)\\\\\)|\\\\\[([\s\S]*?)\\\\\]|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
 const out=[];let last=0,m;while((m=re.exec(text))){if(m.index>last)out.push({text:text.slice(last,m.index)});const legacy=m[1]!==undefined||m[2]!==undefined;let formula=m[1]??m[2]??m[3]??m[4];if(legacy)formula=formula.replace(/\\\\/g,'\\');out.push({math:formula,display:m[2]!==undefined||m[4]!==undefined});last=re.lastIndex}if(last<text.length)out.push({text:text.slice(last)});return out;
}
function validateMath(text,katex){for(const p of mathParts(text)){if(p.text)need(!/\\[()[\]]/.test(p.text),'Delimitatori LaTeX incompleti');else if(katex)katex.renderToString(p.math,{throwOnError:true,trust:false,strict:'ignore',maxExpand:1000})}}
function parseDataset(text,katex){
 need(typeof text==='string'&&new TextEncoder().encode(text).length<=20*1024*1024,'File oltre 20 MiB');
 let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''))}catch(e){throw Error('JSON non valido: controllare virgole e barre inverse delle formule.')}
 need(data&&data.versione===1&&Array.isArray(data.argomenti)&&data.argomenti.length,'Servono versione 1 e argomenti non vuoti.');
 const ids=new Set(),topics=new Set(),bank=[];
 const str=(v,l)=>{need(typeof v==='string'&&v.trim(),l+': testo vuoto o non valido');return v.trim()};
 for(const t of data.argomenti){const topic=str(t.id,'ID argomento'),topicName=str(t.nome,'Nome argomento');need(!topics.has(topic),'ID argomento ripetuto: '+topic);topics.add(topic);need(Array.isArray(t.domande)&&t.domande.length,'Argomento senza domande');
 for(const q of t.domande){const id=str(q.id,'ID domanda');need(!ids.has(id),'ID domanda ripetuto: '+id);ids.add(id);const difficulty=str(q.difficolta,id).toLowerCase();need(['facile','media','difficile'].includes(difficulty),id+': difficoltà non valida');const body=str(q.testo,id);need(Array.isArray(q.alternative)&&q.alternative.length===4,id+': servono quattro alternative');const options=q.alternative.map(a=>str(a,id));need(new Set(options).size===4,id+': alternative duplicate');const letter=str(q.corretta,id).toUpperCase();need(/^[ABCD]$/.test(letter),id+': corretta deve essere A–D');need(q.spiegazione===undefined||typeof q.spiegazione==='string',id+': spiegazione non valida');const explanation=q.spiegazione||'';for(const text of [body,...options,explanation]){try{validateMath(text,katex)}catch(e){throw Error(id+': '+e.message)}}
 bank.push({id,topic,topicName,difficulty,body,options,correct:'ABCD'.indexOf(letter),explanation,type:q.tipologia||''});}}
 return {title:typeof data.titolo==='string'?data.titolo:'Banca domande',bank};
}
function config(c){
 need(Array.isArray(c.names)&&c.names.length===3,'Servono tre gruppi');const names=c.names.map((x,i)=>typeof x==='string'&&x.trim()?x.trim():'Gruppo '+(i+1));need(new Set(names.map(n=>n.toLocaleLowerCase())).size===3,'I nomi dei gruppi devono essere distinti');
 if(c.icons!==undefined)need(Array.isArray(c.icons)&&c.icons.length===3&&c.icons.every(x=>['skull','bolt','star','swords','shield','crown'].includes(x)),'Icone dei gruppi non valide');
 integer(c.seconds,1,600,'Tempo');need(typeof c.probability==='number'&&Number.isFinite(c.probability)&&c.probability>=0&&c.probability<=100,'Probabilità: inserire un numero fra 0 e 100');
 for(const d of ['facile','media','difficile'])integer(c.bases[d],1,Number.MAX_SAFE_INTEGER,'Punti '+d);
 need(['misto','facile','media','difficile'].includes(c.difficulty),'Filtro difficoltà non valido');need(c.quotas&&Object.keys(c.quotas).length,'Selezionare argomenti e quote');let sum=0;for(const v of Object.values(c.quotas))sum+=integer(v,0,33,'Quota');need(sum===33,'La somma delle quote deve essere 33');return {...clone(c),names};
}
function prepare(bank,c,random=Math.random){c=config(c);const eligible=bank.filter(q=>Object.hasOwn(c.quotas,q.topic)&&c.quotas[q.topic]>0&&(c.difficulty==='misto'||q.difficulty===c.difficulty));let chosen=[];for(const [t,n]of Object.entries(c.quotas)){const pool=eligible.filter(q=>q.topic===t);need(pool.length>=n,'Domande insufficienti per '+t);chosen.push(...shuffle(pool,random).slice(0,n))}chosen=shuffle(chosen,random).map(q=>mix(q,random));return {bank:clone(bank),config:c,chosen,eligible:eligible.map(q=>q.id)}}
function mix(q,random){const order=shuffle([0,1,2,3],random);return {...clone(q),options:order.map(i=>q.options[i]),correct:order.indexOf(q.correct)}}
class Game {
 constructor(state,{random=Math.random,now=()=>performance.now()}={}){this.s=state;this.random=random;this.now=now;this.deadline=null;this.running=false}
 static start(prepared,deps={}){const random=deps.random||Math.random;const order=shuffle([0,1,2],random);const s={format:1,rules:RULES,version:VERSION,id:'fool-'+Date.now().toString(36),revision:0,serial:0,phase:'ordinaria',screen:'hidden',config:clone(prepared.config),bank:clone(prepared.bank),eligible:prepared.eligible.slice(),queue:clone(prepared.chosen),groups:prepared.config.names.map(name=>({name,score:rational(0),streak:0,sanctions:0,out:false,cause:'',inventory:[],aura:null})),order,owner:order[0],respondent:order[0],turn:1,usedBonus:false,draftBonus:null,passLock:null,effects:[],seen:[],rejected:[],cancelled:[],valid:0,extra:0,current:null,remaining:prepared.config.seconds*1000,paused:false,pauseReason:'',panel:null,result:null,events:[],suspendAfter:false,suspended:false,winner:null,drawParticipants:[]};
 const g=new Game(s,{...deps,random});g.take();g.log('Rotazione: '+order.map(i=>s.groups[i].name).join(' → '));return g}
 uid(){return 'e'+(++this.s.serial)}
 log(message,details={}){this.s.events.push({id:this.uid(),message,...details})}
 active(){return this.s.order.filter(i=>!this.s.groups[i].out)}
 left(){return this.running?Math.max(0,this.deadline-this.now()):this.s.remaining}
 stop(){this.s.remaining=this.left();this.running=false;this.deadline=null}
 run(){need(this.s.screen==='answer'&&!this.s.panel&&!this.s.suspended,'Timer non avviabile');this.deadline=this.now()+this.s.remaining;this.running=true;this.s.paused=false;this.s.pauseReason=''}
 guard(){need(!this.s.panel&&!this.s.suspended&&this.s.phase!=='conclusa','Completare il pannello o riprendere la partita')}
 revision(expected){if(expected!==undefined)need(expected===this.s.revision,'Comando già elaborato');this.s.revision++}
 available(){const used=new Set([...this.s.seen,...this.s.queue.map(q=>q.id)]);if(this.s.current)used.add(this.s.current.id);return this.s.bank.filter(q=>this.s.eligible.includes(q.id)&&!used.has(q.id))}
 take(){const s=this.s;s.current=s.queue.shift()||null;if(!s.current){const pool=this.available();if(pool.length)s.current=mix(shuffle(pool,this.random)[0],this.random)}s.screen=s.current?'hidden':'supply';s.remaining=s.config.seconds*1000;s.paused=false;s.result=null;s.passLock=null}
 nextGroup(from){const s=this.s;let pos=s.order.indexOf(from);need(pos>=0,'Gruppo fuori rotazione');for(;;){pos=(pos+1)%s.order.length;const i=s.order[pos],g=s.groups[i];if(g.out)continue;
 // Skip effects are resolved before the next effective turn begins.
 const skip=s.effects.findIndex(e=>e.type==='salta'&&e.target===i);if(skip>=0){s.effects.splice(skip,1);this.log(g.name+' salta un turno');continue}return i}}
 newTurn(from){const s=this.s;const i=this.nextGroup(from);s.owner=i;s.respondent=i;s.turn++;s.groups[i].aura=null;s.usedBonus=false;s.draftBonus=null;this.take()}
 reveal(expected){this.guard();this.revision(expected);const s=this.s;need(s.screen==='hidden'&&s.current,'Nessuna domanda da svelare');need(!s.seen.includes(s.current.id),'Domanda già svelata');s.seen.push(s.current.id);s.screen='answer';s.remaining=s.config.seconds*1000;this.run();this.log('Svelata '+s.current.id)}
 pause(reason='manuale',discipline=false){const s=this.s;if(s.screen!=='answer'||s.paused)return;if(!discipline&&this.left()<=0){this.answer(null);return}this.stop();s.paused=true;s.pauseReason=reason}
 resume(expected){this.guard();this.revision(expected);const s=this.s;need(s.screen==='answer'&&s.paused,'Nessuna risposta in pausa');if(s.remaining<=0){s.paused=false;this.answer(null);return}this.run()}
 tick(){if(this.running&&!this.s.panel&&!this.s.suspended&&this.left()<=0)this.answer(null)}
 attack(type,source,target,id){const s=this.s,g=s.groups[target];if(g.aura!==null){this.log(LABELS[type]+' bloccato da Aura di '+g.name);return false}
 if(type!=='svela')s.effects.push({id,type,source,target});const karma=g.inventory.find(c=>c.type==='karma');if(karma){karma.type=type;karma.target=source;karma.origin=id;this.log('Karma di '+g.name+' diventa '+LABELS[type]+' solo contro '+s.groups[source].name)}return true}
 use(copyId,target,expected){this.guard();this.revision(expected);const s=this.s;need(s.phase==='ordinaria'&&['hidden','answer'].includes(s.screen)&&!s.paused&&!s.usedBonus,'Bonus non disponibile in questo momento');if(s.screen==='answer'&&this.left()<=0){this.answer(null);return}const g=s.groups[s.respondent];need(s.owner===s.respondent&&!g.out,'Solo il gruppo titolare può usare bonus');const copy=g.inventory.find(c=>c.id===copyId);need(copy&&copy.type!=='karma','Karma si trasforma automaticamente');need(copy.type!=='svela'||s.screen==='hidden','Svela e passa richiede domanda nascosta');
 if(['salta','ruba'].includes(copy.type)){need(Number.isInteger(target)&&target!==s.respondent&&s.groups[target]&&!s.groups[target].out,'Scegliere un avversario attivo');need(copy.target===null||copy.target===target,'Bersaglio Karma vincolato')}
 if(copy.type==='svela'&&copy.target!==null)need(!s.groups[copy.target].out,'Il bersaglio vincolato è eliminato');
 g.inventory=g.inventory.filter(c=>c.id!==copyId);s.usedBonus=true;s.draftBonus=null;const id=this.uid();this.log(g.name+' usa '+LABELS[copy.type],{activation:id,copy:clone(copy),target});
 if(copy.type==='aura')g.aura=s.turn;
 else if(copy.type==='svela'){s.passLock=copy.target;s.seen.push(s.current.id);s.screen='choice';s.remaining=s.config.seconds*1000}
 else this.attack(copy.type,s.respondent,target,id);
 }
 pass(target,expected){this.guard();this.revision(expected);const s=this.s;need(s.screen==='choice','Nessuna scelta in corso');need(Number.isInteger(target)&&s.groups[target]&&!s.groups[target].out,'Destinatario non valido');if(target!==s.owner){need(s.passLock===null||s.passLock===target,'Bersaglio Karma vincolato');if(this.attack('svela',s.owner,target,this.uid()))s.respondent=target}s.screen='answer';s.remaining=s.config.seconds*1000;this.run()}
 answer(option,expected){this.guard();const s=this.s;need(s.screen==='answer'&&!s.paused,'Risposte bloccate');need(option===null||Number.isInteger(option)&&option>=0&&option<4,'Alternativa non valida');this.revision(expected);const left=this.left();if(left<=0)option=null;this.stop();const i=s.respondent,g=s.groups[i],q=s.current;need(!g.out,'Gruppo eliminato');const correct=option!==null&&option===q.correct;const result={id:this.uid(),question:q.id,respondent:i,correct,option,base:null,multiplier:null,gross:rational(0),share:rational(0),beneficiaries:[],bonus:null};
 if(s.phase==='ordinaria'){
 const beneficiaries=[...new Set(s.effects.filter(e=>e.type==='ruba'&&e.target===i&&!s.groups[e.source].out).map(e=>e.source))];
 if(correct){g.streak++;const base=BigInt(s.config.bases[q.difficulty]),m=BigInt(g.streak)+9n;const gross=rational(base*m,10n),share=rational(BigInt(gross.n),BigInt(gross.d)*BigInt(beneficiaries.length+1));for(const id of [i,...beneficiaries])s.groups[id].score=add(s.groups[id].score,share);Object.assign(result,{base:String(base),multiplier:String(m)+'/10',gross,share,beneficiaries});if(this.random()<s.config.probability/100){const type=TYPES[Math.floor(this.random()*5)];const c={id:this.uid(),type,target:null,origin:result.id};g.inventory.push(c);result.bonus=clone(c)}}else g.streak=0;
 s.effects=s.effects.filter(e=>!(e.type==='ruba'&&e.target===i));s.valid++;
 }else{s.extra++;if(!correct){g.streak=0;this.eliminate(i,option===null?'Tempo scaduto nello spareggio':'Errore nello spareggio')}}
 s.result=result;s.screen='result';s.paused=false;this.log((correct?'Corretta':'Errore / tempo scaduto')+' — '+g.name,{outcome:clone(result)});this.finishCheck();if(s.suspendAfter&&s.phase!=='conclusa'){s.suspended=true;s.suspendAfter=false}
 }
 eliminate(i,cause){const s=this.s,g=s.groups[i];g.out=true;g.cause=cause;g.inventory=[];g.aura=null;s.effects=s.effects.filter(e=>e.source!==i&&e.target!==i)}
 finishCheck(){const s=this.s,active=this.active();if(active.length<=1){s.draftBonus=null;s.phase='conclusa';s.winner=active[0]??null;this.stop();s.panel=null;s.paused=false;s.pauseReason='';s.suspendAfter=false;s.suspended=false;s.screen='final';return}
 if(s.phase==='ordinaria'&&s.valid===33){let top=[active[0]];for(const i of active.slice(1)){const c=compare(s.groups[i].score,s.groups[top[0]].score);if(c>0)top=[i];else if(c===0)top.push(i)}
 if(top.length===1){s.draftBonus=null;s.phase='conclusa';s.winner=top[0];s.screen='final';s.panel=null;s.paused=false;s.pauseReason='';s.suspendAfter=false;s.suspended=false;return}
 s.draftBonus=null;s.phase='spareggio';s.drawParticipants=top;s.order=shuffle(top,this.random);s.effects=[];for(const g of s.groups){g.inventory=[];g.aura=null}s.owner=s.order[0];s.respondent=s.owner;s.turn++;s.usedBonus=false;s.queue=[];this.take();this.log('Battaglia finale: '+s.order.map(i=>s.groups[i].name).join(' → '));}}
 next(expected){this.guard();this.revision(expected);need(this.s.screen==='result','Registrare prima un esito');this.newTurn(this.s.respondent)}
 openSanctions(){need(this.s.phase!=='conclusa'&&!this.s.panel&&!this.s.suspended,'Pannello non disponibile');this.pause('sanzioni',true);this.s.panel={type:'sanctions',id:this.uid(),counts:[0,0,0],reasons:['disturbo','disturbo','disturbo']}}
 closeSanctions(apply,expected){const s=this.s;need(s.panel?.type==='sanctions','Pannello sanzioni non aperto');this.revision(expected);const p=s.panel;for(const n of p.counts)integer(n,0,3,'Sanzioni');s.panel=null;
 if(apply){for(let i=0;i<3;i++){const n=integer(p.counts[i],0,3,'Sanzioni');const g=s.groups[i];if(g.out||!n)continue;g.sanctions=Math.min(3,g.sanctions+n);g.streak=0;this.log('Sanzione a '+g.name+': '+p.reasons[i]);if(g.sanctions===3)this.eliminate(i,'Tre sanzioni')}}
 const interrupted=s.groups[s.respondent].out&&['hidden','answer','choice','supply'].includes(s.screen);this.finishCheck();if(s.phase==='conclusa')return;
 if(interrupted){this.stop();if(s.current&&s.seen.includes(s.current.id))s.cancelled.push(s.current.id);this.newTurn(s.respondent);if(s.suspendAfter){s.suspended=true;s.suspendAfter=false}}
 }
 refuse(reason){this.guard();const s=this.s;need(['answer','choice'].includes(s.screen),'Rifiuto solo dopo svelamento e prima della risposta');need(['non svolto','formattazione'].includes(reason),'Motivo non ammesso');const wasRunning=this.running;this.pause('rifiuto');need(['answer','choice'].includes(s.screen),'Domanda già conclusa');s.panel={type:'refusal',from:s.screen,wasRunning,reason}}
 decideRefusal(accept,expected){const s=this.s,p=s.panel;need(p?.type==='refusal','Nessun rifiuto da valutare');this.revision(expected);s.panel=null;
 if(!accept){s.screen=p.from;if(p.wasRunning&&s.screen==='answer')this.run();return}
 const old=s.current;s.rejected.push(old.id);this.log('Rifiuto accettato: '+old.id+' — '+p.reason);const pool=this.available().filter(q=>q.topic===old.topic&&(s.config.difficulty==='misto'||q.difficulty===s.config.difficulty));s.current=pool.length?mix(shuffle(pool,this.random)[0],this.random):null;s.screen=s.current?'hidden':'supply';s.remaining=s.config.seconds*1000;s.paused=false;s.passLock=null;
 // During a previous reveal-and-pass choice, the spent allowance stays spent;
 // replacement is assigned to the same respondent and revealed normally.
 if(s.suspendAfter){s.suspended=true;s.suspendAfter=false}
 }
 bell(){this.guard();const s=this.s;if(['answer','choice'].includes(s.screen)){s.suspendAfter=true;this.log('Campanella: concludere la domanda, poi sospendere')}else{s.suspended=true;this.stop();this.log('Partita sospesa')}}
 continueSession(){need(this.s.suspended,'Partita non sospesa');this.s.suspended=false;if(this.s.screen==='answer')this.s.paused=true}
 supply(parsed){const s=this.s;need(s.screen==='supply'&&!s.panel,'Rifornimento disponibile solo a banca esaurita');const all=new Set(s.bank.map(q=>q.id));for(const q of parsed.bank)need(!all.has(q.id),'ID già nella banca: '+q.id);const eligible=parsed.bank.filter(q=>s.config.quotas[q.topic]>0&&(s.config.difficulty==='misto'||s.config.difficulty===q.difficulty));need(eligible.length,'Nessuna domanda compatibile con gli argomenti selezionati');s.bank.push(...clone(parsed.bank));s.eligible.push(...eligible.map(q=>q.id));this.take();this.log('Banca rifornita: '+eligible.length+' quesiti')}
 snapshot(){const s=clone(this.s);s.remaining=this.left();if(s.screen==='answer'){s.paused=true;s.pauseReason='ripresa'}return s}
 static restore(raw,deps={}){const s=clone(raw);validateSave(s);if(s.screen==='answer'){s.paused=true;s.pauseReason='ripresa'}return new Game(s,deps)}
}
function validateSave(s){
 need(s&&s.format===1&&s.rules===RULES&&s.version===VERSION,'Salvataggio incompatibile');config(s.config);
 need(['ordinaria','spareggio','conclusa'].includes(s.phase)&&['hidden','answer','choice','result','supply','final'].includes(s.screen),'Stato partita non valido');
 integer(s.revision,0,Number.MAX_SAFE_INTEGER,'Revisione');integer(s.serial,0,Number.MAX_SAFE_INTEGER,'Sequenza');integer(s.turn,1,Number.MAX_SAFE_INTEGER,'Turno');integer(s.valid,0,33,'Domande valide');integer(s.extra,0,Number.MAX_SAFE_INTEGER,'Domande extra');need(typeof s.id==='string'&&s.id,'ID partita mancante');
 need(Array.isArray(s.groups)&&s.groups.length===3,'Gruppi non validi');need(s.groups.every((g,i)=>g.name===s.config.names[i]),'Nomi incoerenti');
 for(const flag of ['usedBonus','paused','suspended','suspendAfter'])need(typeof s[flag]==='boolean','Flag '+flag+' non valido');
 const group=i=>Number.isInteger(i)&&i>=0&&i<3;
 need(Array.isArray(s.order)&&s.order.length>=2&&new Set(s.order).size===s.order.length&&s.order.every(group),'Rotazione non valida');need(group(s.owner)&&group(s.respondent)&&s.order.includes(s.owner)&&s.order.includes(s.respondent),'Rispondente non valido');
 need(s.phase!=='ordinaria'||s.order.length===3,'Rotazione ordinaria incompleta');
 const copyIds=new Set();for(const g of s.groups){integer(g.streak,0,33,'Serie');integer(g.sanctions,0,3,'Sanzioni');need(typeof g.out==='boolean'&&typeof g.cause==='string','Eliminazione non valida');need(g.sanctions<3||g.out,'Terza sanzione senza eliminazione');need(g.score&&/^\d{1,300}$/.test(g.score.n)&&/^[1-9]\d{0,299}$/.test(g.score.d),'Punteggio razionale non valido');need(JSON.stringify(rational(g.score.n,g.score.d))===JSON.stringify(g.score),'Punteggio non ridotto');need(g.aura===null||Number.isInteger(g.aura)&&g.aura>0&&g.aura<=s.turn,'Aura non valida');need(Array.isArray(g.inventory),'Inventario non valido');for(const c of g.inventory){need(typeof c.id==='string'&&!copyIds.has(c.id)&&TYPES.includes(c.type)&&typeof c.origin==='string','Copia bonus non valida');copyIds.add(c.id);need(c.target===null||group(c.target)&&['salta','ruba','svela'].includes(c.type),'Vincolo Karma non valido')}
 need(!g.out||(!g.inventory.length&&g.aura===null),'Eliminato con bonus');}
 need(Array.isArray(s.bank)&&s.bank.length&&Array.isArray(s.eligible)&&Array.isArray(s.queue),'Banca non valida');
 const converted={versione:1,argomenti:[]},topics=new Map();for(const q of s.bank){need(q&&typeof q.topic==='string'&&typeof q.topicName==='string'&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,'Domanda salvata non valida');if(!topics.has(q.topic)){const t={id:q.topic,nome:q.topicName,domande:[]};topics.set(q.topic,t);converted.argomenti.push(t)}topics.get(q.topic).domande.push({id:q.id,testo:q.body,alternative:q.options,corretta:'ABCD'[q.correct],spiegazione:q.explanation,difficolta:q.difficulty})}
 const validated=parseDataset(JSON.stringify(converted),root.katex);const byId=new Map(validated.bank.map(q=>[q.id,q]));
 need(s.eligible.every(id=>byId.has(id)&&s.config.quotas[byId.get(id).topic]>0&&(s.config.difficulty==='misto'||s.config.difficulty===byId.get(id).difficulty))&&new Set(s.eligible).size===s.eligible.length,'Selezione non valida');
 const checkQ=q=>{const base=byId.get(q?.id);need(base&&s.eligible.includes(q.id)&&q.body===base.body&&q.explanation===base.explanation&&q.topic===base.topic&&q.difficulty===base.difficulty&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(x=>base.options.includes(x))&&new Set(q.options).size===4&&q.options[q.correct]===base.options[base.correct],'Domanda/soluzione salvata incoerente')};
 for(const q of s.queue)checkQ(q);if(s.current)checkQ(s.current);need(!['hidden','answer','choice','result'].includes(s.screen)||s.current,'Domanda mancante');
 need(new Set(s.queue.map(q=>q.id)).size===s.queue.length,'Coda duplicata');for(const k of ['seen','rejected','cancelled'])need(Array.isArray(s[k])&&new Set(s[k]).size===s[k].length&&s[k].every(id=>byId.has(id)),k+' non valido');
 need(s.rejected.concat(s.cancelled).every(id=>s.seen.includes(id)),'Quesito annullato mai svelato');need(s.queue.every(q=>!s.seen.includes(q.id)&&q.id!==s.current?.id),'Domande già usate in coda');need(!['answer','choice','result'].includes(s.screen)||s.seen.includes(s.current?.id),'Domanda visibile senza svelamento');need(s.screen!=='hidden'||!s.seen.includes(s.current?.id),'Domanda nascosta già usata');
 need(typeof s.remaining==='number'&&Number.isFinite(s.remaining)&&s.remaining>=0&&s.remaining<=s.config.seconds*1000,'Tempo residuo non valido');
 need(Array.isArray(s.effects),'Effetti non validi');const effectIds=new Set();for(const e of s.effects){need(['salta','ruba'].includes(e.type)&&typeof e.id==='string'&&!effectIds.has(e.id)&&group(e.source)&&group(e.target)&&e.source!==e.target&&!s.groups[e.source].out&&!s.groups[e.target].out,'Effetto non valido');effectIds.add(e.id)}
 if(s.draftBonus!==null&&s.draftBonus!==undefined){const draft=s.draftBonus;need(s.phase==='ordinaria'&&!s.usedBonus&&['hidden','answer'].includes(s.screen)&&s.groups[s.owner].inventory.some(c=>c.id===draft.copyId)&& (draft.target===null||group(draft.target)),'Scelta bonus salvata non valida')}
 need(s.passLock===null||group(s.passLock),'Bersaglio passaggio non valido');need(s.screen!=='choice'||s.usedBonus&&s.phase==='ordinaria','Scelta senza bonus');
 need(s.phase!=='spareggio'||s.groups.every(g=>!g.inventory.length&&g.aura===null)&&!s.effects.length,'Bonus presenti nello spareggio');
 need(Array.isArray(s.drawParticipants)&&s.drawParticipants.every(group),'Partecipanti spareggio non validi');need(Array.isArray(s.events)&&s.events.every(e=>typeof e.id==='string'&&typeof e.message==='string'),'Eventi non validi');
 need(s.panel===null||s.panel?.type==='sanctions'||s.panel?.type==='refusal','Pannello non valido');if(s.panel?.type==='sanctions'){need(Array.isArray(s.panel.counts)&&s.panel.counts.length===3&&s.panel.counts.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&Array.isArray(s.panel.reasons)&&s.panel.reasons.length===3&&s.panel.reasons.every(x=>typeof x==='string'),'Sanzioni pendenti non valide')}
 if(s.panel?.type==='refusal')need(['answer','choice'].includes(s.panel.from)&&typeof s.panel.wasRunning==='boolean'&&['non svolto','formattazione'].includes(s.panel.reason),'Rifiuto non valido');
 need(s.phase!=='conclusa'||s.screen==='final'&&(s.winner===null||group(s.winner)&&!s.groups[s.winner].out),'Vincitore non valido');
 if(['hidden','answer','choice'].includes(s.screen))need(!s.groups[s.respondent].out,'Rispondente eliminato in domanda aperta');
 if(s.screen==='result')need(s.result&&s.result.question===s.current.id&&s.result.respondent===s.respondent&&typeof s.result.correct==='boolean','Esito non valido');
 return s;
}
const api={RULES,VERSION,TYPES,LABELS,Game,parseDataset,validateMath,mathParts,config,prepare,mix,shuffle,rational,add,compare,exact,validateSave,clone};if(typeof module!=='undefined')module.exports=api;root.Fool=api;
})(typeof globalThis!=='undefined'?globalThis:this);
