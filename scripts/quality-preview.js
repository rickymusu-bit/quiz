/* Review harness, embedded only by build.cjs --quality-preview.
   Uses the real engine and renderer; no production UI or save schema changes. */
(function () {
  'use strict';
  const frame = document.querySelector('iframe');
  const tools = document.createElement('details');
  tools.id = 'quality-tools';
  tools.style.cssText = 'position:fixed;right:8px;top:8px;z-index:20;max-width:90vw;padding:8px;color:#ffe2a5;background:#160d0bf5;border:1px solid #bf8850;font:16px/1.4 system-ui';
  const summary = document.createElement('summary');
  summary.textContent = 'Scenari di revisione';
  tools.append(summary);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Anteprima di audit grafico. Le nuove cinematiche sono previste nelle PR successive.';
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
  async function show(scenario) {
    tools.open = false;
    if (scenario === 'home') { await navigate('index.html'); return; }
    if (scenario === 'regole') { await navigate('Fool_regole.html'); return; }
    await navigate('Fool.html?start=1');
    await waitFor(() => frame.contentDocument.querySelector('#vehicle0'));
    const w = frame.contentWindow, d = frame.contentDocument;
    if (scenario === 'selezione') return;
    [...d.querySelectorAll('button')].find(b => b.textContent.includes('Inizia partita')).click();
    await waitFor(() => w.HellscapeUI?.game);
    const ui = w.HellscapeUI, F = w.Fool;
    const config = JSON.parse(JSON.stringify(ui.game.s.config));
    config.questionCount = 3;
    Object.keys(config.quotas).forEach(key => config.quotas[key] = 0);
    config.quotas[Object.keys(config.quotas)[0]] = 3;
    Object.keys(config.bonusWeights).forEach(key => config.bonusWeights[key] = 0);
    ui.game = F.Game.start(F.prepare(ui.game.s.bank, config, () => .25), {random:() => .25});
    const game = ui.game;
    if (['ultima', 'spareggio'].includes(scenario)) {
      for (let i = 0; i < 3; i++) {
        game.reveal();
        game.answer((game.s.current.correct + 1) % 4);
        if (i < 2) game.next();
      }
      if (scenario === 'spareggio') game.next();
    } else if (['portale', 'vittoria', 'gameover'].includes(scenario)) {
      if (scenario === 'gameover') {
        game.s.groups.forEach((_, i) => game.eliminate(i, 'Scenario di revisione'));
        game.complete(null);
      } else {
        game.eliminate(1, 'Scenario di revisione');
        game.eliminate(2, 'Scenario di revisione');
        game.complete(0);
      }
      if (scenario === 'portale') {
        const render = w.FoolEnding.render;
        w.FoolEnding.render = (...args) => {
          args[4] = args[3].captureEnd + .6;
          return render(...args);
        };
      }
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
  for (const [key, label] of Object.entries({home:'Home',selezione:'Veicoli',quiz:'Domanda / Ammo',ultima:'Ultimo esito',spareggio:'Primo turno spareggio',portale:'Portale attuale',vittoria:'Finale attuale',gameover:'Game Over',regole:'Regole'})) {
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
