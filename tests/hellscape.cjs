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
    for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/Fool.html?start=1`);
      await page.locator('#vehicle0').waitFor();
      assert(await page.locator('#vehicle1 option[value=chopper]').evaluate(o => o.disabled));
      await page.locator('#vehicle0').selectOption('truck');
      assert(!await page.locator('#vehicle1 option[value=chopper]').evaluate(o => o.disabled));
      await page.getByRole('button', { name: /Inizia partita/ }).click();
      await page.getByRole('button', { name: 'Svela e avvia il tempo' }).waitFor();
      const cards = page.locator('.player-stack>.player-card');
      assert.equal(await cards.count(), 3);
      assert(await page.evaluate(() => document.querySelector('.player-stack').firstElementChild.dataset.team === String(game.s.respondent)));
      for (const card of await cards.all()) {
        assert(!await card.evaluate(e => e.open));
        assert(await card.locator('.player-points').isVisible());
      }
      const opened = await cards.first().getAttribute('data-team');
      const cardTops=await cards.evaluateAll(cs=>cs.map(c=>c.getBoundingClientRect().top));
      await cards.first().locator('summary').click();
      assert.deepEqual(await cards.evaluateAll(cs=>cs.map(c=>c.getBoundingClientRect().top)),cardTops);
      assert(await cards.first().locator('.lives').isVisible());
      assert(await cards.first().locator('.player-card-inventory').isVisible());
      await cards.first().locator('summary').press('Enter');
      assert(!await cards.first().evaluate(e=>e.open));
      assert.equal(await page.evaluate(()=>game.s.screen),'hidden');
      await cards.first().locator('summary').press('Enter');
      assert(await cards.first().evaluate(e=>e.open));
      assert.equal(await page.locator('.turn-order').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Statistiche degli altri giocatori', exact: true }).count(), 0);
      assert.equal(await cards.first().locator('.team-vehicle').evaluate(e => getComputedStyle(e).filter), 'grayscale(1)');
      await page.getByRole('button', { name: 'Inventario', exact: true }).click();
      assert(!(await page.locator('dialog').innerText()).includes('Ogni attacco'));
      await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await page.getByRole('button', { name: 'Svela e avvia il tempo' }).click();
      await page.evaluate(() => { game.deadline -= 15000; });
      await page.locator('.answer').nth(await page.evaluate(() => game.s.current.correct)).click();
      assert(await page.locator('main').evaluate(e => e.classList.contains('showing-movement')));
      await page.waitForTimeout(1400);
      assert.equal(await page.locator('.answer').count(), 4);
      assert.equal(await page.locator('.chosen-label,.quantity-guide').count(), 0);
      assert(await page.locator('.operation-body').evaluate(e => e.scrollHeight <= e.clientHeight + 1));
      const residual = await page.evaluate(() => game.left() / (game.s.config.seconds * 1000));
      await page.getByRole('button', { name: 'Prossima domanda', exact: true }).click();
      const from = await page.locator('.vial-liquid').evaluate(e => parseFloat(e.getAnimations().find(a => a.effect.getKeyframes().some(k => k.width !== undefined)).effect.getKeyframes()[0].width) / 100);
      assert(Math.abs(from - residual) < .001);
      assert(await page.evaluate(() => document.querySelector('.player-stack').firstElementChild.dataset.team === String(game.s.respondent)));
      assert(await page.locator(`.player-card[data-team="${opened}"]`).evaluate(e => e.open));
      await page.waitForFunction(() => document.getElementById('timer')?.dataset.refilling === 'false', {}, { timeout: 3000 });
      assert.equal(await page.locator('#timer').innerText(), '');
      await page.locator('.game-options summary').click();
      await page.getByRole('button', { name: 'Regole', exact: true }).click();
      await page.locator('#rules-section').waitFor();
      await page.getByRole('button', { name: 'Successiva', exact: true }).click();
      await page.getByRole('button', { name: 'Torna alla partita', exact: true }).click();
      assert.deepEqual(errors, []);
      console.log('PASS', width, height);
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
