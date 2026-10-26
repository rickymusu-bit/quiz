/* Fool — Fuga dall'Inferno v1.1.0 (2026-10-26): scena pixel-art illustrativa.
   Nessuna modifica al motore, ai punteggi o ai salvataggi. */
(function (root) {
  'use strict';
  const H = 156, lanes = [75, 107, 139];
  const colors = ['#d6ad75', '#be7554', '#b4a08c'];
  const VEHICLES = ['chopper', 'pickup', 'truck', 'coupe', 'offroad', 'ape'];
  const sheets = { vehicles: null, demon: null };
  // These are deliberately two atlases, not six independent network requests.
  if (typeof root.Image === 'function') {
    for (const key of Object.keys(sheets)) {
      const img = new root.Image();
      img.decoding = 'async';
      img.src = 'assets/hell-race/' + key + '.webp';
      img.addEventListener('load', () => live?.redraw?.(), { once: true });
      sheets[key] = img;
    }
  }
  const imageReady = img => !!img && img.complete && img.naturalWidth > 0;
  const reduce = root.matchMedia('(prefers-reduced-motion: reduce)');
  let live = null, last = null, roadPhase = 0, roadLastTime = null;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const r = (c, x, y, w, h, color) => {
    c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const line = (c, x, y, w, color) => r(c, x, y, w, 2, color);
  function scoreRatio(groups, index) {
    const score = groups[index].score;
    let top = { n: '0', d: '1' };
    for (const g of groups) {
      if (BigInt(g.score.n) * BigInt(top.d) > BigInt(top.n) * BigInt(g.score.d)) top = g.score;
    }
    if (top.n === '0') return 0;
    const a = BigInt(score.n) * BigInt(top.d) * 10000n;
    const b = BigInt(score.d) * BigInt(top.n);
    return clamp(Number(a / b) / 10000, 0, 1);
  }
  function positionScore(state, index) {
    const relative = scoreRatio(state.groups, index);
    const score = state.groups[index].score;
    const n = BigInt(score.n), d = BigInt(score.d);
    const base = BigInt(Math.max(...Object.values(state.config.bases || { standard: 300 })));
    const ref = (base * BigInt(state.config.questionCount || 33)) / 5n || 1n;
    const absolute = Number((n * 100000n) / (n + d * ref)) / 100000;
    return .4 * relative + .6 * absolute;
  }
  function bitmap(c, x, y, lines, palette, size) {
    lines.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = palette[row[i]];
        if (color) r(c, x + i * size, y + j * size, size, size, color);
      }
    });
  }
  const vehicles = [
    ['            11111       ',
     '      3333333111144     ',
     '   333333333311111144   ',
     '  3332222333332222244  ',
     '  3222222222222222224  ',
     '  3555333333333355533  ',
     '   555  66      66  55 ',
     '       6666    6666    '],
    ['             44         ',
     '         1121444        ',
     '       111111114        ',
     '  333  222222233333     ',
     ' 3333332222223333333    ',
     '  555533333333555533    ',
     '   6666       6666      ',
     '    66         66       '],
    ['     1444      1444     ',
     '  1111444  1111444     ',
     '  111111111111111144    ',
     '  33333322223333333333  ',
     '  32222222222222222333 ',
     '  35553333333333555333 ',
     '   6666 66 66  6666    ',
     '    66 666666   66     ']
  ];
  function racer(c, x, y, i, tick, g, scale = 2) {
    if (scale <= 0) return;
    const unit = Math.max(1, Math.round(scale));
    const vehicle = vehicles[i % vehicles.length];
    const palette = { '1': '#312b34', '2': colors[i], '3': '#74584c',
      '4': '#e8a750', '5': '#d7b89a', '6': '#141117' };
    const left = Math.round(x - 25 * unit), top = Math.round(y - 8 * unit);
    // Fumo, polvere e calore continuano a muoversi anche con i PNG statici.
    if (imageReady(sheets.vehicles)) {
      const chosen = VEHICLES.indexOf(g.vehicle || ''); 
      const id = chosen < 0 ? i % VEHICLES.length : chosen;
      const col = id % 3, row = Math.floor(id / 3);
      const destW = scale < 2 ? 47 : 64, destH = scale < 2 ? 28 : 38;
      const destX = Math.round(x - destW * .50);
      const destY = Math.round(y - destH * .68 + Math.sin(tick * 13 + i) * .8);
      for (let j = 0; j < 3; j++) {
        const dist = (tick * 27 + j * 13) % 38;
        r(c, destX - 5 - dist, destY + destH * .58 + j * 2, 4 + j, 2 + j, j % 2 ? '#4e3830' : '#9d4830');
      }
      c.drawImage(sheets.vehicles, col * 72, row * 44, 72, 44, destX, destY, destW, destH);
      if (g.out) {
        c.fillStyle = '#0b0908aa';
        c.fillRect(destX, destY, destW, destH);
        r(c, destX + destW * .47, destY + 4, 4, 4, '#da572b');
      }
      return;
    }
    // Fallback minimale se la rete impedisce il caricamento degli asset.
    // Tubature incandescenti e fumo.
    for (let j = 0; j < 3; j++) {
      const dist = (tick * 24 + j * 13) % 31;
      r(c, left - 5 - dist, top + 3 + j * 3, 3 + j, 2 + j, j % 2 ? '#5e4743' : '#c56339');
    }
    bitmap(c, left, top, vehicle, palette, unit);
    // Tre piloti con casco, maschera e occhialoni, distinti dai loro mezzi.
    const headX = left + (i === 1 ? 11 : 12) * unit;
    r(c, headX - unit, top - 2 * unit, 5 * unit, 4 * unit, '#291923');
    r(c, headX, top - 4 * unit, 4 * unit, 4 * unit,
      i === 0 ? '#a94b42' : i === 1 ? '#d2a266' : '#c9c2a0');
    r(c, headX + 2 * unit, top - 2 * unit, 2 * unit, unit, '#f5d282');
    r(c, headX + 2 * unit, top - unit, unit, unit, '#10111a');
    const wobble = Math.floor(tick * 9) % 2;
    r(c, left + 7 * unit, top + (7 + wobble) * unit, 5 * unit, unit, '#23191c');
    r(c, left + 18 * unit, top + (7 + wobble) * unit, 4 * unit, unit, '#23191c');
    if (g.out) {
      r(c, left + 6 * unit, top + 3 * unit, 12 * unit, 3 * unit, '#211a20');
      r(c, left + 10 * unit, top, 3 * unit, 3 * unit, '#ff663e');
    }
  }
  function background(c, W, tick, progress) {
    c.fillStyle = '#2c101b'; c.fillRect(0, 0, W, H);
    r(c, 0, 0, W, 23, '#180b19');
    r(c, 0, 23, W, 17, '#431622');
    r(c, 0, 40, W, 30, '#6a2420');
    // Astro color zolfo.
    r(c, W * .72, 6, 33, 33, '#e26b34');
    r(c, W * .72 + 5, 11, 23, 23, '#ffbc64');
    // Vulcani e fumarole in parallasse lento.
    const offset = (tick * 6) % 180;
    for (let x = -220 - offset; x < W + 180; x += 180) {
      for (let j = 0; j < 36; j++) {
        const top = 64 - j * .9;
        r(c, x + j * 2, top, 145 - j * 4, 2, '#27121a');
      }
      r(c, x + 74, 18, 12, 42, '#2b1920');
      r(c, x + 76, 8, 8, 14, '#775044');
      r(c, x + 77, 5, 6, 6, '#e58448');
    }
    for (let j = 0; j < 20; j++) {
      const x = ((j * 113 - tick * (8 + (j % 3) * 8)) % (W + 50) + W + 50) % (W + 50);
      r(c, x, (j * 31) % 57, 2, 2, j % 2 ? '#cc6036' : '#ef9d4f');
    }
    // Colate laviche oltre la strada.
    r(c, 0, 66, W, 7, '#101018');
    for (let x = -60 - (tick * 28) % 54; x < W; x += 54) {
      r(c, x, 65, 29, 3, '#fa7533');
      r(c, x + 9, 69, 12, 2, '#e4a143');
    }
    r(c, 0, 73, W, H - 73, '#1c1c24');
    for (const y of [89, 121]) {
      line(c, 0, y, W, '#4a3839');
      for (let x = -(tick * 92) % 42; x < W; x += 42) r(c, x, y, 21, 2, '#bb6040');
    }
    for (let x = -(tick * 74) % 46; x < W; x += 46) {
      r(c, x, 151, 22, 2, '#7d4540');
      r(c, x + 14, 143, 3, 2, '#413039');
    }
    // La porta appare solo nell'ultima parte della partita.
    if (progress > .7) {
      const enter = smooth((progress - .7) / .3);
      const x = W + 65 - enter * 134;
      gate(c, x, 24, tick, false);
    }
  }
  function gate(c, x, y, tick, open) {
    // Portale in pietra basalto/ottone, con una luce celeste in contrasto col rosso infernale.
    r(c, x - 6, y + 8, 70, 128, '#100f1e');
    r(c, x + 5, y + 18, 46, 118, open ? '#fff0b1' : '#d5632c');
    r(c, x + 12, y + 24, 31, 110, open ? '#fff6d6' : '#ef9a43');
    r(c, x - 13, y + 9, 16, 127, '#706968');
    r(c, x + 53, y + 9, 16, 127, '#706968');
    r(c, x - 15, y + 3, 83, 15, '#928573');
    r(c, x - 5, y - 5, 65, 10, '#a89173');
    for (let j = 0; j < 5; j++) {
      line(c, x - 13, y + 22 + j * 23, 15, '#352c36');
      line(c, x + 53, y + 22 + j * 23, 15, '#352c36');
    }
    if (open || Math.sin(tick * 5) > .5) {
      r(c, x + 20, y + 37, 6, 64, '#ffe6aa');
    }
  }
  function demon(c, tick, x = 32, shade = '#9b2831') {
    if (imageReady(sheets.demon)) {
      const bounce = Math.sin(tick * 4.5) * 2.5;
      const stretch = Math.sin(tick * 5.5) * 2;
      c.drawImage(sheets.demon, Math.round(x - 27), Math.round(13 + bounce), 147, 117 + stretch);
      return;
    }
    const y = 12 + Math.round(Math.sin(tick * 4) * 2);
    // Sagoma di un demone enorme, con corna, artigli e fauci animate.
    r(c, x + 5, y + 33, 45, 103, '#210d1b');
    r(c, x + 11, y + 17, 37, 55, shade);
    r(c, x + 2, y + 1, 11, 37, '#b5503b');
    r(c, x + 5, y - 5, 7, 28, '#e09a58');
    r(c, x + 43, y + 1, 11, 37, '#b5503b');
    r(c, x + 44, y - 5, 7, 28, '#e09a58');
    r(c, x + 18, y + 38, 8, 8, '#ffe164');
    r(c, x + 36, y + 38, 8, 8, '#ffe164');
    r(c, x + 21, y + 40, 3, 3, '#1b0a16');
    r(c, x + 39, y + 40, 3, 3, '#1b0a16');
    r(c, x + 18, y + 53, 29, 14 + Math.round((Math.sin(tick * 7) + 1) * 2), '#0d0814');
    for (let i = 0; i < 5; i++) r(c, x + 20 + i * 5, y + 53, 3, 5, '#e7b88e');
    for (let i = 0; i < 4; i++) r(c, x + 23 + i * 5, y + 65, 3, 5, '#e7b88e');
    r(c, x - 10, y + 89, 18, 26, shade);
    r(c, x + 47, y + 87, 22, 31, shade);
    for (let i = 0; i < 3; i++) {
      r(c, x - 12 + i * 5, y + 114, 4, 13, '#d58a55');
      r(c, x + 49 + i * 6, y + 116, 5, 13, '#d58a55');
    }
  }
  function nameTag(c, W, x, y, name, color) {
    const tag = String(name).slice(0, 16);
    c.font = 'bold 10px monospace';
    const width = Math.min(W - 6, c.measureText(tag).width + 9);
    const lx = clamp(x - width / 2, 2, W - width - 2);
    r(c, lx, y - 31, width, 13, '#0c0e19');
    r(c, lx, y - 31, 3, 13, color);
    c.fillStyle = '#f6ead3';
    c.fillText(tag, lx + 6, y - 21);
  }
  function scene(c, W, state, sec, final, previous, reduced, roadTime) {
    const total = Math.max(1, Number(state.config.questionCount || 33));
    const progress = state.phase === 'pareggio' || state.phase === 'conclusa' ? 1 : clamp(state.valid / total, 0, 1);
    const motion = reduced ? 0 : roadTime;
    background(c, W, motion, final ? 1 : progress);
    const ended = final ? (reduced ? 5.2 : sec) : 0;
    const escape = smooth((ended - .25) / 2.8);
    if (final) gate(c, W - 112, 18, motion, true);
    let demonX = 15;
    if (final) demonX = 15 + smooth((ended - 1) / 3.4) * Math.max(70, W * .44);
    demon(c, motion, demonX);
    state.groups.forEach((group, i) => {
      const configuredVehicle = state.config.vehicles?.[i] || ['chopper', 'pickup', 'ape'][i];
      const visualGroup = { ...group, vehicle: configuredVehicle };
      const ratio = positionScore(state, i);
      const dest = W * (.36 + .22 * ratio) + 12 * progress;
      const start = previous ? W * (.36 + .22 * previous[i]) + 12 * progress : dest;
      let x = start + (dest - start) * smooth(sec / .9);
      let unit = 2;
      let visible = true;
      if (!final && group.out) x = Math.min(x, 125);
      if (final) {
        if (i === state.winner) {
          x += escape * (W - x - 55);
          if (ended >= 3.1) visible = false;
        } else {
          const victims = state.groups.map((g, j) => j).filter(j => j !== state.winner);
          const order = victims.indexOf(i);
          const consumed = smooth((ended - 1.65 - order * 1.1) / .7);
          x += (demonX + 23 - x) * consumed;
          if (consumed > .85) unit = 1;
          if (consumed >= 1) visible = false;
        }
      }
      if (visible) {
        racer(c, x, lanes[i], i, motion, visualGroup, unit);
        nameTag(c, W, x, lanes[i] - 13, group.name, colors[i]);
      }
    });
    if (final && ended > 3.6) {
      c.font = 'bold 17px monospace';
      c.fillStyle = '#f7e2af';
      const message = state.winner === null ? 'NESSUNO È FUGGITO' : 'FUGA RIUSCITA';
      c.fillText(message, clamp((W - c.measureText(message).width) / 2, 7, W - 170), 27);
    }
  }
  function createStage(state, final = false) {
    if (live) root.cancelAnimationFrame(live.frame);
    const fig = document.createElement('figure');
    fig.className = 'hell-race' + (final ? ' hell-race-final' : '');
    const canvas = document.createElement('canvas');
    canvas.height = H;
    canvas.width = 700;
    canvas.setAttribute('aria-hidden', 'true');
    fig.appendChild(canvas);
    const caption = document.createElement('figcaption');
    caption.className = 'hell-race-caption';
    caption.textContent = final
      ? (state.winner === null ? 'Nessun giocatore è riuscito a fuggire dall’Inferno.' : state.groups[state.winner].name + ' fugge dall’Inferno. Gli altri vengono catturati dal demone.')
      : 'Fuga dall’Inferno: le posizioni dei tre veicoli seguono i punteggi. La porta si avvicina con il procedere delle domande.';
    fig.appendChild(caption);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return fig;
    ctx.imageSmoothingEnabled = false;
    const next = state.groups.map((g, i) => positionScore(state, i));
    const old = last?.key === state.id && !final ? last.x : null;
    const previous = old;
    last = { key: state.id, x: next };
    const record = { frame: 0, canvas };
    live = record;
    const start = performance.now(), reduced = reduce.matches;
    let freeze = 0, oldTime = start;
    const draw = now => {
      if (live !== record || !canvas.isConnected) return;
      const width = Math.max(320, Math.round((canvas.clientWidth || 700) / (canvas.clientHeight || 160) * H));
      if (canvas.width !== width) canvas.width = width;
      ctx.imageSmoothingEnabled = false;
      const elapsed = (now - start) / 1000;
      const stop = state.paused || state.suspended || document.hidden;
      if (stop) freeze += Math.max(0, (now - oldTime) / 1000);
      oldTime = now;
      if (roadLastTime !== null && !stop && !reduced) roadPhase += clamp((now - roadLastTime) / 1000, 0, .06);
      roadLastTime = now;
      scene(ctx, width, state, Math.max(0, elapsed - freeze), final, previous, reduced, final ? elapsed : roadPhase);
      if (!reduced && (!final || elapsed < 5.8)) record.frame = root.requestAnimationFrame(draw);
    };
    record.redraw = () => {
      if (live !== record || !canvas.isConnected) return;
      root.cancelAnimationFrame(record.frame);
      record.frame = root.requestAnimationFrame(draw);
    };
    record.frame = root.requestAnimationFrame(draw);
    return fig;
  }
  root.FoolHellRace = { createStage };
})(window);
