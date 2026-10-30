/* Tie presentation observes engine transitions; never changes a match or its saves. */
(function (root) {
  'use strict';
  const DURATION = Object.freeze({intro:3.8, round:1.6, elimination:1.1, fade:.35});
  const ease = x => { x=Math.max(0,Math.min(1,x));return x*x*(3-2*x); };
  function createTracker() {
    let id=null, previous=null, pending=null, active=null, notice=null, completion=null, paused=false;
    function sync(s) {
      if(id!==s.id){id=s.id;previous=null;pending=null;active=null;notice=null;completion=null;paused=false;}
      if(previous) {
        if(previous.phase==='ordinaria' && s.phase==='pareggio')
          pending={kind:'intro',key:id+':intro',result:s.result?.id};
        else if(previous.phase==='pareggio' && s.phase==='pareggio' && s.tieRound>previous.round)
          pending={kind:'round',key:id+':round:'+s.tieRound,result:s.result?.id};
        if(previous.phase==='pareggio' && previous.result!==s.result?.id &&
            s.result && !s.result.correct && s.groups[s.result.respondent].out) {
          notice={kind:'elimination',key:id+':out:'+s.result.id,index:s.result.respondent,elapsed:0};
        }
      }
      // Keep the last elimination notice long enough for its readable card
      // and capture. Finished-game navigation is unlocked separately by UI.
      if(s.phase!=='pareggio'){pending=null;active=null;completion=null;paused=false;}
      previous={phase:s.phase,round:s.tieRound,result:s.result?.id};
    }
    function begin(s) {
      if(!pending || active || notice || s.suspended || s.phase!=='pareggio')return false;
      active={...pending,elapsed:0};pending=null;completion=null;paused=false;return true;
    }
    function finish() {
      if(!active)return;
      completion={key:active.key,result:active.result,id};active=null;paused=false;
    }
    function advance(delta,{reduced=false,captures=false}={}) {
      if(paused)return;
      if(notice){notice.elapsed+=delta;if(notice.elapsed>=DURATION.elimination){if(captures)notice.capturing=true;else notice=null;}return;}
      if(active&&!captures&&!reduced){active.elapsed+=delta;if(active.elapsed>=DURATION[active.kind])finish();}
    }
    function sample({reduced=false,captures=false}={}) {
      const item=notice||active, waiting=!!pending&&pending.kind==='intro';
      const phase=notice?(notice.capturing?'capture':'eliminated'):active?(captures?'capture':active.kind):'idle';
      const elapsed=item?.elapsed??0, duration=active?DURATION[active.kind]:0;
      const strength=active?.kind==='intro'&&!captures&&!reduced
        ? ease(elapsed/DURATION.fade)*ease((duration-elapsed)/DURATION.fade):0;
      return {key:item?.key,kind:item?.kind,phase,index:notice?.index,blocking:!!item,
        waiting,holdCapture:waiting||!!notice&&!notice.capturing,paused,reduced,elapsed,strength,
        opacity:reduced||notice||captures?1:ease(elapsed/DURATION.fade)*ease((duration-elapsed)/DURATION.fade),
        canSkip:!!active&&!captures};
    }
    return {sync,begin,advance,sample,completeCapture(){if(notice?.capturing){notice=null;paused=false;}},skip(captures=false){if(active&&!captures)finish();},
      togglePause(){if(active||notice)paused=!paused;},
      takeCompletion(){const done=completion;completion=null;return done;}};
  }
  function mount(figure,tracker,state,redraw) {
    let layer=null, signature=null;
    const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
    function update(view) {
      if(!view.blocking){layer?.remove();layer=null;signature=null;return;}
      if(!layer){layer=el('section',null,'tie-layer');layer.setAttribute('aria-label','Transizione dello Ultimo Miglio');figure.append(layer);}
      layer.dataset.phase=view.phase;
      layer.style.setProperty('--tie-opacity',String(view.opacity));
      const key=[view.key,view.phase,view.paused,view.reduced].join(':');
      if(key===signature)return;
      const focusKey=view.key+':'+view.phase, first=layer.dataset.focusKey!==focusKey;
      const control=document.activeElement?.dataset.tieAction;
      signature=key;
      const card=el('div',null,'tie-card'),heading=el('h2',view.kind==='elimination'?'ELIMINATO':
        view.kind==='round'?'NUOVO GIRO · ULTIMO MIGLIO':'ULTIMO MIGLIO','tie-heading');
      heading.tabIndex=-1;
      const status=el('p',view.phase==='capture'?'Il demone cattura il veicolo eliminato':
        view.kind==='elimination'?state.groups[view.index].name+' · '+(state.result?.option===null?'Tempo scaduto':'Risposta errata'):
        view.kind==='round'?'Giro '+state.tieRound:'Errore o tempo scaduto: −1 vita. Eliminazione a zero.','tie-rules');
      status.setAttribute('role','status');
      card.append(heading,status);
      const roster=el('ul',null,'tie-roster');
      const indices=view.kind==='elimination'?[view.index]:state.tieOrder.filter(i=>!state.groups[i].out);
      for(const index of indices){
        const group=state.groups[index],item=el('li'),name=el('strong',group.name),heart=el('span',null,'heart'+(group.out?' lost':''));
        item.dataset.team=String(index);heart.setAttribute('role','img');heart.setAttribute('aria-label',group.out?'Nessuna vita rimasta':'Una vita');
        const hearts=el('span',null,'tie-hearts'),count=root.Fool.remainingLives(state,index);
        for(let n=0;n<3;n++){const h=heart.cloneNode();h.classList.toggle('lost',n>=count);h.setAttribute('aria-label',n<count?'Vita residua':'Vita persa');hearts.append(h);}
        item.append(name,hearts,el('span',root.Fool.formatScore(group.score)+' pt','tie-points'));roster.append(item);
      }
      card.append(roster,el('p','Punti congelati · Ammo disattivate','tie-note'));
      const controls=el('div',null,'tie-controls'),pause=el('button',view.paused?'Riprendi scena':'Pausa scena');
      pause.dataset.tieAction='pause';pause.type='button';pause.onclick=()=>{tracker.togglePause();redraw();};controls.append(pause);
      if(view.canSkip){const skip=el('button',view.reduced?(view.kind==='round'?'Continua il giro':'Inizia Ultimo Miglio'):'Salta introduzione');
        skip.dataset.tieAction='skip';skip.type='button';skip.onclick=()=>{tracker.skip();redraw();};controls.append(skip);}
      card.append(controls);
      layer.replaceChildren(card);
      if(control)layer.querySelector('[data-tie-action='+control+']')?.focus({preventScroll:true});
      else if(first&&view.phase!=='capture') {
        layer.dataset.focusKey=focusKey;
        root.requestAnimationFrame(()=>{
          // A user may select a control before the scheduled title focus runs.
          if(heading.isConnected&&!document.activeElement?.closest('.tie-controls'))
            heading.focus({preventScroll:true});
        });
      }
    }
    return {update};
  }
  const api={DURATION,createTracker,mount};
  if(typeof module!=='undefined')module.exports=api;
  else root.FoolTie=api;
})(globalThis);
