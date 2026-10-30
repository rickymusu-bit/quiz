const { chromium } = require('playwright');
const fs = require('fs'), http = require('http'), path = require('path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (file.endsWith('/')) file += 'index.html';
    try {
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
      res.setHeader('Content-Type', type[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const [width, height] of [[1440, 900], [667,375], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);
      await page.locator('#vehicle0').waitFor();
      assert(await page.locator('#vehicle1 option[value=chopper]').evaluate(o => o.disabled));
      await page.locator('#vehicle0').selectOption('truck');
      assert(!await page.locator('#vehicle1 option[value=chopper]').evaluate(o => o.disabled));
      await page.getByRole('button', { name: /Inizia partita/ }).click();
      await page.getByRole('button', { name: 'Svela e avvia il tempo' }).waitFor();
      const turns = page.locator('.turn-order button');
      assert.equal(await turns.count(), 3);
      assert.equal(await page.locator('.player-sidebar,.player-card,.game-options').count(), 0);
      assert.equal(await page.locator('.current-player').count(), 0);
      assert.equal(await page.locator('.turn-order .life-skull').count(), 9);
      assert.equal(await page.locator('.turn-order .player-points').count(), 3);
      const current = await page.evaluate(() => HellscapeUI.game.s.respondent);
      assert.equal(await turns.first().getAttribute('data-team'), String(current));
      const other = (current + 1) % 3;
      await page.evaluate(i => HellscapeUI.game.s.groups[i].inventory.push({id:'read-only-test',type:'aura',target:null,origin:'test'}), other);
      await page.locator(`.turn-order [data-team="${other}"]`).click();
      assert.equal(await page.locator('#inventory-team').inputValue(), String(other));
      await page.locator('#dialog .ammo-round').click();
      assert(await page.locator('#ammo-info').getByRole('button', {name:'Usa',exact:true}).isDisabled());
      await page.locator('#ammo-info').getByRole('button',{name:'Chiudi',exact:true}).click();
      await page.screenshot({path:`artifacts/inventory-${width}.png`});
      await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await page.waitForTimeout(300);
      fs.mkdirSync('artifacts', {recursive:true});
      await page.screenshot({path:`artifacts/interface-${width}.png`});
      await page.getByRole('button', { name: 'Inventario', exact: true }).click();
      assert(!(await page.locator('#dialog').innerText()).includes('Ogni attacco'));
      await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await page.getByRole('button', { name: 'Svela e avvia il tempo' }).click();
      await page.locator(`.turn-order [data-team="${other}"]`).click();
      assert(!await page.evaluate(() => HellscapeUI.game.running));
      const pausedTime = await page.evaluate(() => HellscapeUI.game.left());
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => HellscapeUI.game.left()), pausedTime);
      await page.keyboard.press('Escape');
      assert(await page.evaluate(() => HellscapeUI.game.running));
      await page.getByRole('button', {name:'Opzioni',exact:true}).click();
      assert(!await page.evaluate(() => HellscapeUI.game.running));
      await page.screenshot({path:`artifacts/options-${width}.png`});
      await page.getByRole('button', {name:'Pausa',exact:true}).click();
      await page.locator(`.turn-order [data-team="${other}"]`).click();
      await page.getByRole('button', {name:'Chiudi',exact:true}).click();
      assert(!await page.evaluate(() => HellscapeUI.game.running));
      await page.getByRole('button', {name:'Opzioni',exact:true}).click();
      await page.getByRole('button', {name:'Riprendi timer',exact:true}).click();
      await page.evaluate(() => { HellscapeUI.game.deadline -= 15000; });
      await page.locator('.answer').nth(await page.evaluate(() => HellscapeUI.game.s.current.correct)).click();
      assert(await page.locator('main').evaluate(e => e.classList.contains('showing-movement')));
      assert.equal(await page.locator('.movement-cue').innerText(), 'RISPOSTA CORRETTA');
      assert(await page.locator('.movement-cue').isVisible());
      fs.mkdirSync('artifacts', {recursive:true});
      await page.screenshot({path:`artifacts/answer-animation-${width}.png`});
      await page.waitForFunction(()=>!document.body.classList.contains('showing-cinematic'),{},{timeout:10000});
      assert.equal(await page.locator('.movement-cue').count(), 0);
      assert.equal(await page.locator('.answer').count(), 4);
      const respondent=await page.evaluate(()=>HellscapeUI.game.s.result.respondent);
      assert.equal(await page.locator(`.turn-order [data-team="${respondent}"] .player-points`).innerText(),
        await page.evaluate(i=>Fool.exact(HellscapeUI.game.s.groups[i].score)+' pt',respondent));
      assert.equal(await page.locator('.chosen-label,.quantity-guide').count(), 0);
      await page.screenshot({path:`artifacts/question-${width}.png`});
      const residual = await page.evaluate(() => HellscapeUI.game.left() / (HellscapeUI.game.s.config.seconds * 1000));
      await page.getByRole('button', { name: 'Prossima domanda', exact: true }).click();
      const from = await page.locator('.vial-liquid').evaluate(e => parseFloat(e.getAnimations().find(a => a.effect.getKeyframes().some(k => k.width !== undefined)).effect.getKeyframes()[0].width) / 100);
      assert(Math.abs(from - residual) < .001);
      assert.equal(await turns.first().getAttribute('data-team'), String(await page.evaluate(() => HellscapeUI.game.s.respondent)));
      await page.waitForFunction(() => document.getElementById('timer')?.dataset.refilling === 'false', {}, { timeout: 3000 });
      assert.equal(await page.locator('#timer').innerText(), '');
      await page.getByRole('button', {name:'Opzioni',exact:true}).click();
      await page.getByRole('button', { name: 'Regole', exact: true }).click();
      await page.locator('#rules-section').waitFor();
      await page.getByRole('button', { name: 'Successiva', exact: true }).click();
      await page.getByRole('button', { name: 'Torna alla partita', exact: true }).click();
      // Every real question must keep its full correction and Next control on screen.
      for (const bank of ['termologia', 'introduzione-fisica-misura']) {
        if (bank !== 'termologia') {
          await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);
          await page.locator('#bank-choice').selectOption(bank);
          await page.getByRole('button', {name:/Inizia partita/}).click();
        }
        const layout = await page.evaluate(() => {
          const g = HellscapeUI.game, original = g.s, failures = [];
          let tallest = 0, longest = null;
          for (const q of original.bank) {
            const base=original.config.bases[q.difficulty];
            g.s = {...original, current:q, screen:'result', suspendAfter:true,
              result:{id:'layout', correct:true, option:q.correct, respondent:original.respondent,
                base:String(base), gross:Fool.rational(base), share:Fool.rational(base,3),
                beneficiaries:original.groups.map((_,i)=>i).filter(i=>i!==original.respondent),
                bonuses:Fool.TYPES.map(type=>({type}))}};
            HellscapeUI.renderGame();
            const panel=document.querySelector('.operation-body'), bounds=panel.getBoundingClientRect(),
              stage=document.querySelector('main').getBoundingClientRect(),
              next=panel.querySelector('[data-game-action=next]').getBoundingClientRect();
            if(panel.scrollHeight>panel.clientHeight+1 || panel.scrollWidth>panel.clientWidth+1 ||
              bounds.bottom>stage.bottom+1 || next.bottom>bounds.bottom+1)
              failures.push(q.id);
            if(bounds.height>tallest){tallest=bounds.height;longest=g.s;}
          }
          // Keep the longest actual correction visible for the review screenshot.
          g.s=longest;
          HellscapeUI.renderGame();
          window.__questionLayoutOriginal=original;
          return {count:original.bank.length, failures};
        });
        assert.equal(layout.count,100);
        assert.deepEqual(layout.failures,[],`${bank}: content and Next must fit without scrolling`);
        await page.screenshot({path:`artifacts/question-expanded-${bank}-${width}.png`});
        await page.evaluate(()=>{HellscapeUI.game.s=window.__questionLayoutOriginal;delete window.__questionLayoutOriginal;HellscapeUI.renderGame();});
      }
      assert.deepEqual(errors, []);
      console.log('PASS', width, height);
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
