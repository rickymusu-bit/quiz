/* Review harness, embedded only by build.cjs --quality-preview.
   Uses the real engine and renderer; no production UI or save schema changes. */
(function () {
  'use strict';
  const frame = document.querySelector('iframe');
  const tools = document.createElement('details');
  tools.id = 'quality-tools';
  tools.style.cssText = 'position:fixed;right:8px;top:8px;z-index:20;max-width:90vw;max-height:calc(100dvh - 16px);overflow:auto;overscroll-behavior:contain;box-sizing:border-box;padding:8px;color:#ffe2a5;background:#160d0bf5;border:1px solid #bf8850;font:16px/1.4 system-ui';
  const summary = document.createElement('summary');
  summary.textContent = 'Scenari di revisione';
  tools.append(summary);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Anteprima completa: locomozione, Ultimo Miglio, inseguimento, portale e nuovo epilogo.';
  const waitFor = async test => {
    const deadline = performance.now() + 15000;
    while (!test()) {
      if (performance.now() > deadline) throw Error('Caricamento scenario non riuscito');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };
  async function navigate(route) {
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, {once:true}));
    HellscapePreview.navigate(route);
    await loaded;
  }
  let rendererDocument = null, endingRender = null, endingFrame = null, scenarioSerial = 0;
  async function show(scenario) {
    tools.open = false;
    if (scenario === 'home') { await navigate('index.html'); return; }
    if (scenario === 'regole') { await navigate('Fool_regole.html'); return; }
    if (scenario === 'selezione' || !frame.contentWindow.HellscapeUI)
      await navigate('Fool.html?start=1');
    await waitFor(() => frame.contentWindow.HellscapeUI &&
      (frame.contentWindow.HellscapeUI.game || frame.contentDocument.querySelector('#vehicle0')));
    const w = frame.contentWindow, d = frame.contentDocument;
    if (scenario === 'selezione') return;
    if (!w.HellscapeUI.game)
      [...d.querySelectorAll('button')].find(b => b.textContent.includes('Inizia partita')).click();
    await waitFor(() => w.HellscapeUI?.game);
    const ui = w.HellscapeUI, F = w.Fool;
    ui.game.stop();
    if (rendererDocument !== d) { rendererDocument = d; endingRender = w.FoolEnding.render; endingFrame = w.FoolEnding.frame; }
    w.FoolEnding.render = endingRender;
    w.FoolEnding.frame = endingFrame;
    const config = JSON.parse(JSON.stringify(ui.game.s.config));
    config.questionCount = 3;
    Object.keys(config.quotas).forEach(key => config.quotas[key] = 0);
    config.quotas[Object.keys(config.quotas)[0]] = 3;
    Object.keys(config.bonusWeights).forEach(key => config.bonusWeights[key] = 0);
    ui.game = F.Game.start(F.prepare(ui.game.s.bank, config, () => .25), {random:() => .25});
    const game = ui.game;
    game.s.id += "-review-" + (++scenarioSerial);
    if(['inseguimento-2','inseguimento-1','inseguimento-0','fila-finale','presa-finale','bocca-finale'].includes(scenario)){
      game.s.groups.forEach((g,i)=>g.score=F.rational([1000,600,200][i]));
      if(scenario==='inseguimento-1')game.eliminate(2,'Già divorato nello scenario');
      if(scenario==='inseguimento-0'){game.eliminate(1,'Già divorato nello scenario');game.eliminate(2,'Già divorato nello scenario');}
      ui.changed();await new Promise(resolve=>w.requestAnimationFrame(resolve));
      if(['fila-finale','presa-finale','bocca-finale'].includes(scenario)){
        const at=p=>p.lineupEnd+(scenario==='fila-finale'?0:scenario==='presa-finale'?1.05:2.75);
        const render=w.FoolEnding.render,frame=w.FoolEnding.frame;
        w.FoolEnding.frame=(...args)=>{args[2]=at(args[0]);return frame(...args)};
        w.FoolEnding.render=(...args)=>{args[4]=at(args[3]);return render(...args)};
      }
      game.complete(0);
    } else if (['intro-spareggio','intro-due','giro-spareggio','eliminazione-spareggio'].includes(scenario)) {
      game.s.config.bases = {facile:100,media:100,difficile:100};
      ui.changed();
      for(let i=0;i<3;i++){
        game.reveal();game.answer(scenario==='intro-due'&&i<2?game.s.current.correct:(game.s.current.correct+1)%4);
        ui.changed();if(i<2){game.next();ui.changed();}
      }
      w.FoolHellRace.beginTie(game.s);ui.changed();
      if(['giro-spareggio','eliminazione-spareggio'].includes(scenario)){
        await waitFor(()=>d.querySelector('[data-tie-action=skip]'));
        d.querySelector('[data-tie-action=skip]').click();
        await waitFor(()=>game.s.screen==='hidden');
        if(scenario==='giro-spareggio'){
          for(let i=0;i<3;i++){game.reveal();game.answer(game.s.current.correct);ui.changed();if(i<2){game.next();ui.changed();}}
          w.FoolHellRace.beginTie(game.s);ui.changed();
        }else{
          game.s.groups[game.s.respondent].damage=2-game.s.groups[game.s.respondent].sanctions;game.reveal();game.answer((game.s.current.correct+1)%4);ui.changed();w.FoolHellRace.pauseTie();
        }
      }
    } else if (['ultima', 'spareggio'].includes(scenario)) {
      for (let i = 0; i < 3; i++) {
        game.reveal();
        game.answer((game.s.current.correct + 1) % 4);
        if (i < 2) game.next();
      }
      if (scenario === 'spareggio') game.next();
    } else if (['portale','emersione','frattura','attraversamento','sprofondamento','pugni','fiammata-finale','affanno','vittoria','gameover'].includes(scenario)) {
      if (scenario === 'gameover') {
        game.s.groups.forEach((_, i) => game.eliminate(i, 'Scenario di revisione'));
        game.complete(null);
      } else {
        game.eliminate(1, 'Scenario di revisione');
        game.eliminate(2, 'Scenario di revisione');
        game.complete(0);
      }
      if (!['vittoria','gameover'].includes(scenario)) {
        const render=w.FoolEnding.render,sampleFrame=w.FoolEnding.frame,T=w.FoolEpilogue.T;
        const stamp={emersione:.6,frattura:T.descentEnd+.15,portale:T.openEnd+.02,attraversamento:T.openEnd+.6,
          sprofondamento:T.closeEnd+.7,pugni:T.sinkEnd+.46,'fiammata-finale':T.rageEnd+.8,affanno:T.fireEnd+.65}[scenario];
        w.FoolEnding.frame=(...args)=>{args[2]=args[0].chaseEnd+stamp;return sampleFrame(...args)};
        w.FoolEnding.render=(...args)=>{args[4]=args[3].chaseEnd+stamp;return render(...args)};
      }
    } else if (scenario === 'corsa') {
      // The unrevealed question keeps the real timer stopped while the scene runs.
    } else {
      game.reveal();
      game.pause('Revisione grafica');
      game.s.groups[game.s.owner].inventory = F.TYPES.map((type, i) => ({id:'review-'+i,type,target:null,origin:'review'}));
    }
    ui.changed();
    await waitFor(() => w.FoolEnding.prepare(w.FoolEnding.load(() => {})) !== null);
    await d.fonts.ready;
  }
  let busy = false;
  for (const [key, label] of Object.entries({home:'Home',selezione:'Veicoli',quiz:'Domanda / Omen',corsa:'Corsa / locomozione',ultima:'Ultimo esito',spareggio:'Primo turno Ultimo Miglio','intro-spareggio':'Intro Ultimo Miglio (3)','intro-due':'Intro Ultimo Miglio (2)','giro-spareggio':'Nuovo giro','eliminazione-spareggio':'Eliminazione (in pausa)','inseguimento-2':'Inseguimento: 2 perdenti','inseguimento-1':'Inseguimento: 1 perdente','inseguimento-0':'Inseguimento: solo vincitore','fila-finale':'Fotogramma: corsie','presa-finale':'Fotogramma: presa','bocca-finale':'Fotogramma: bocca',emersione:'Portale: discesa',frattura:'Ponte: frattura',portale:'Portale: aperto',attraversamento:'Portale: attraversamento',sprofondamento:'Portale: crollo',pugni:'Epilogo: pugni','fiammata-finale':'Epilogo: fiammata',affanno:'Epilogo: affanno',vittoria:'Vittoria',gameover:'Game Over',regole:'Regole'})) {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = 'min-height:44px;padding:8px;margin:4px;font:inherit';
    button.onclick = async () => {
      if (busy) return;
      busy = true;
      try { await show(key); status.textContent = label; }
      catch (error) { status.textContent = error.message; tools.open = true; }
      finally { busy = false; }
    };
    tools.append(button);
  }
  tools.append(status);
  document.body.append(tools);
  window.HellscapeQuality = {show};
})();
