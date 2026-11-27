/**
 * Scena di corsa (specifica §6), prototipo graybox: lo scenario di una casella
 * come striscia periodica lungo X. Il giocatore corre sul posto all'origine e
 * la striscia scorre verso −X; ogni primitiva ha il centro in [0, PERIOD) e il
 * renderer ne affianca copie a passo PERIOD, quindi la ripetizione non ha
 * giunture. Usa i pezzi e le tinte neutre del kit della città.
 *
 * Il contenuto dipende soltanto da seme, casella e distretto: non anticipa
 * nulla del percorso successivo.
 */
import { Builder, CONCRETE, DISTRICT_TINT, KIT, shade, type Primitive } from "../kit/kit.ts";
import { rngFromSeed } from "../logic/rng.ts";
import { ABYSS_Y } from "../scene/dimensions.ts";

export const STRIP = Object.freeze({
  /** Periodo della striscia in unità di scena (12 moduli da 4). */
  period: 48,
  module: 4,
  deckWidth: 2.6,
  deckThickness: 0.35,
  pillarSpacing: 12,
});

/** Profondità (Z negativa: lontano dalla camera laterale) e altezze delle masse sullo sfondo. */
const BACKDROP = Object.freeze({ near: -9, far: -46, count: 9 });

export function buildStrip(seed: string, cellId: string, district: string): Primitive[] {
  const rng = rngFromSeed(seed, `corsa:${cellId}`);
  const b = new Builder();
  const P = STRIP.period,
    half = STRIP.deckWidth / 2;
  const tint = DISTRICT_TINT[district] ?? CONCRETE.light;

  // Passerella: piano, cordoli, montanti e corrimano su entrambi i lati, condotto sotto il piano.
  b.ref = { kind: "walkway", key: `corsa:${cellId}` };
  for (let x = 0; x < P; x += STRIP.module) {
    const centre = x + STRIP.module / 2;
    b.box("concrete", { x: centre, y: -STRIP.deckThickness / 2, z: 0 }, { x: STRIP.module - 0.04, y: STRIP.deckThickness, z: STRIP.deckWidth }, shade(tint, 0.96 + rng.next() * 0.08));
    for (const side of [-1, 1]) {
      b.box("dark", { x: centre, y: 0.06, z: side * (half - 0.08) }, { x: STRIP.module, y: 0.12, z: 0.16 });
      b.box("metal", { x: centre, y: KIT.railingHeight, z: side * (half - 0.08) }, { x: STRIP.module, y: 0.05, z: 0.05 });
    }
    b.box("dark", { x: centre, y: -STRIP.deckThickness - 0.25, z: -half * 0.45 }, { x: STRIP.module, y: 0.35, z: 0.35 });
  }
  const posts = Math.round(P / KIT.postSpacing);
  for (let i = 0; i < posts; i++) {
    for (const side of [-1, 1]) b.cylinder("metal", { x: (i * P) / posts, y: KIT.railingHeight / 2, z: side * (half - 0.08) }, 0.06, KIT.railingHeight);
  }

  // Piloni fino all'abisso, con anelli di controvento.
  b.ref = { kind: "pillar", key: `corsa:${cellId}` };
  for (let x = STRIP.pillarSpacing / 2; x < P; x += STRIP.pillarSpacing) {
    const top = -STRIP.deckThickness;
    b.box("concrete", { x, y: (top + ABYSS_Y) / 2, z: 0 }, { x: 0.8, y: top - ABYSS_Y, z: 0.8 }, CONCRETE.pillar);
    for (let y = top - KIT.braceSpacing; y > ABYSS_Y; y -= KIT.braceSpacing) b.box("dark", { x, y, z: 0 }, { x: 1.1, y: 0.25, z: 1.1 });
  }

  // Masse sullo sfondo, a profondità e altezze diverse: con la prospettiva danno la parallasse.
  b.ref = { kind: "mass", key: `corsa:${cellId}` };
  for (let i = 0; i < BACKDROP.count; i++) {
    const width = 5 + rng.next() * 9,
      depth = 5 + rng.next() * 8;
    const x = ((i + rng.next() * 0.6) * P) / BACKDROP.count;
    const z = BACKDROP.near - rng.next() * (BACKDROP.near - BACKDROP.far) - depth / 2;
    const top = -2 + rng.next() * 26;
    const massTint = shade(CONCRETE.mass, 0.85 + rng.next() * 0.3);
    b.box("concrete", { x, y: (top + ABYSS_Y) / 2, z }, { x: width, y: top - ABYSS_Y, z: depth }, massTint);
    for (let y = top - KIT.floorSpacing; y > top - 20 && y > ABYSS_Y; y -= KIT.floorSpacing) {
      b.box("dark", { x, y, z }, { x: width + 0.3, y: 0.25, z: depth + 0.3 });
    }
    if (rng.chance(0.5)) b.cylinder("metal", { x: x + width * 0.2, y: top + 0.9, z: z + depth * 0.2 }, Math.min(width, depth) * 0.3, 1.8);
  }

  // Tubazioni lungo la passerella, sotto il piano, a profondità media.
  b.ref = { kind: "mass", key: `corsa-tubi:${cellId}` };
  for (const [z, y] of [
    [-4.5, -3.5],
    [-6, -6.5],
  ] as const) {
    for (let x = 0; x < P; x += STRIP.module) b.box("metal", { x: x + STRIP.module / 2, y, z }, { x: STRIP.module, y: 0.45, z: 0.45 });
  }

  // Centri riportati nel periodo: la striscia è periodica per costruzione.
  return b.primitives.map((p) => ({ ...p, position: { ...p.position, x: ((p.position.x % P) + P) % P } }));
}
