/**
 * Geometria delle stanze della scena di corsa (specifica §6), graybox con i
 * pezzi e le tinte neutre del kit della città. Il giocatore corre sul posto
 * all'origine verso +X.
 *
 * - Stanze ripetute (corridoio, sala, ponte, pozzo, partenza): striscia
 *   periodica lungo X, con centri in [0, PERIOD). Il renderer ne affianca copie
 *   a passo PERIOD (spostate anche in quota se la stanza è in pendenza), quindi
 *   la ripetizione non ha giunture.
 * - Stanze con parete di fondo (bivio, uscita): non periodiche; la parete sta a
 *   x = WALL e il corridore vi si avvicina prima di fermarsi o di attraversarla.
 *
 * Le proporzioni seguono la grandezza della stanza: architettura smisurata
 * rispetto al personaggio, che si perde nella nebbia (riferimento di atmosfera:
 * Blame!, specifica §6).
 */
import { Builder, CONCRETE, DISTRICT_TINT, KIT, shade, type Primitive } from "../kit/kit.ts";
import { rngFromSeed, type Rng } from "../logic/rng.ts";
import type { Vec3 } from "../layout/types.ts";
import type { Room } from "./rooms.ts";

export const STRIP = Object.freeze({
  /** Periodo delle stanze ripetute, in unità di scena (12 moduli da 4). */
  period: 48,
  module: 4,
  deckWidth: 2.6,
  deckThickness: 0.35,
  /** Pendenza delle stanze in salita e in discesa. */
  slope: (12 * Math.PI) / 180,
  /** Parete di fondo delle stanze con porte, misurata dal corridore fermo. */
  wall: 16,
  /** Quota fino a cui scendono piloni e pareti: il fondo si perde nella nebbia. */
  bottom: -160,
});

export interface RoomBuild {
  room: Room;
  /** Primitive della striscia periodica (stanze ripetute) o della stanza intera (con parete di fondo). */
  primitives: Primitive[];
  periodic: boolean;
  /** Inclinazione della striscia: positiva in salita. */
  angle: number;
  /** Centri delle porte nella parete di fondo (bivio: una per ramo; uscita: una). */
  doors: Vec3[];
}

/** Angolo della stanza secondo la pendenza. */
export function roomAngle(room: Room): number {
  return room.slope === "salita" ? STRIP.slope : room.slope === "discesa" ? -STRIP.slope : 0;
}

/** Passerella con cordoli, corrimano e montanti fra x0 e x1 (periodica se copre tutto il periodo). */
function walkway(b: Builder, x0: number, x1: number, tint: number, rng: Rng): void {
  const half = STRIP.deckWidth / 2;
  b.ref = { kind: "walkway", key: "passerella" };
  for (let x = x0; x < x1 - 1e-9; x += STRIP.module) {
    const centre = x + STRIP.module / 2;
    b.box("concrete", { x: centre, y: -STRIP.deckThickness / 2, z: 0 }, { x: STRIP.module - 0.04, y: STRIP.deckThickness, z: STRIP.deckWidth }, shade(tint, 0.96 + rng.next() * 0.08));
    for (const side of [-1, 1]) {
      b.box("dark", { x: centre, y: 0.06, z: side * (half - 0.08) }, { x: STRIP.module, y: 0.12, z: 0.16 });
      b.box("metal", { x: centre, y: KIT.railingHeight, z: side * (half - 0.08) }, { x: STRIP.module, y: 0.05, z: 0.05 });
    }
  }
  const posts = Math.round((x1 - x0) / KIT.postSpacing);
  for (let i = 0; i < posts; i++) {
    for (const side of [-1, 1]) b.cylinder("metal", { x: x0 + ((i + 0.5) * (x1 - x0)) / posts, y: KIT.railingHeight / 2, z: side * (half - 0.08) }, 0.06, KIT.railingHeight);
  }
}

/** Parete smisurata parallela al percorso, con costoloni verticali e fasce orizzontali. */
function megaWall(b: Builder, x0: number, x1: number, z: number, top: number, s: number, rng: Rng): void {
  b.ref = { kind: "mass", key: `parete:${z.toFixed(1)}` };
  const thickness = 4 * s;
  b.box("concrete", { x: (x0 + x1) / 2, y: (top + STRIP.bottom) / 2, z }, { x: x1 - x0, y: top - STRIP.bottom, z: thickness }, shade(CONCRETE.mass, 0.85 + rng.next() * 0.2));
  const face = z > 0 ? z - thickness / 2 : z + thickness / 2;
  const toward = z > 0 ? -1 : 1;
  for (let x = x0; x < x1 - 1e-9; x += STRIP.module * 2) {
    b.box("concrete", { x: x + STRIP.module, y: (top + STRIP.bottom) / 2, z: face + toward * 0.8 * s }, { x: 1.2 * s, y: top - STRIP.bottom, z: 1.6 * s }, shade(CONCRETE.pillar, 0.9));
  }
  for (let y = top - 6 * s; y > -60; y -= 9 * s) b.box("dark", { x: (x0 + x1) / 2, y, z: face + toward * 1.2 * s }, { x: x1 - x0, y: 0.8 * s, z: 2.4 * s });
}

/** Pilastro colossale dal fondo fino a `top`. */
function colossus(b: Builder, x: number, z: number, width: number, top: number, tint: number): void {
  b.box("concrete", { x, y: (top + STRIP.bottom) / 2, z }, { x: width, y: top - STRIP.bottom, z: width }, tint);
  b.box("dark", { x, y: top - width * 0.4, z }, { x: width * 1.25, y: width * 0.5, z: width * 1.25 });
}

/** Piloni sotto la passerella, fino al fondo. */
function deckPillars(b: Builder, x0: number, x1: number): void {
  b.ref = { kind: "pillar", key: "piloni" };
  for (let x = x0 + 6; x < x1; x += 12) {
    b.box("concrete", { x, y: (-STRIP.deckThickness + STRIP.bottom) / 2, z: 0 }, { x: 0.8, y: -STRIP.deckThickness - STRIP.bottom, z: 0.8 }, CONCRETE.pillar);
    for (let y = -STRIP.deckThickness - KIT.braceSpacing; y > -40; y -= KIT.braceSpacing) b.box("dark", { x, y, z: 0 }, { x: 1.1, y: 0.25, z: 1.1 });
  }
}

/** Architettura della stanza fra x0 e x1, secondo il tipo. */
function architecture(b: Builder, room: Room, x0: number, x1: number, rng: Rng): void {
  const s = room.size;
  switch (room.kind) {
    case "corridoio":
    case "partenza": {
      // Una parete smisurata alle spalle del percorso, travi che lo scavalcano molto in alto.
      megaWall(b, x0, x1, -7 * s, 70 * s, s, rng);
      b.ref = { kind: "mass", key: "travi" };
      for (let x = x0 + 6; x < x1; x += 12) b.box("dark", { x, y: 26 * s, z: -1.5 * s }, { x: 2 * s, y: 2.4 * s, z: 13 * s });
      if (room.kind === "partenza") {
        // Partenza, provvisoria: archi monumentali ripetuti sopra il percorso.
        b.ref = { kind: "mass", key: "archi" };
        for (let x = x0 + 12; x < x1; x += 24) {
          for (const z of [-3.2, 3.2]) b.box("concrete", { x, y: 7, z }, { x: 1.6, y: 14, z: 1.6 }, shade(CONCRETE.light, 1.05));
          b.box("concrete", { x, y: 14.5, z: 0 }, { x: 1.8, y: 1.6, z: 8 }, shade(CONCRETE.light, 1.05));
        }
      }
      break;
    }
    case "sala": {
      // File di pilastri colossali che si perdono nella nebbia.
      b.ref = { kind: "mass", key: "pilastri" };
      for (const [z, w] of [
        [-14 * s, 5 * s],
        [-36 * s, 7 * s],
        [-66 * s, 9 * s],
      ] as const) {
        for (let x = x0 + (z < -30 * s ? 12 : 0); x < x1; x += 24) colossus(b, x, z, w, 60 * s + rng.next() * 20 * s, shade(CONCRETE.mass, 0.85 + rng.next() * 0.25));
      }
      b.box("dark", { x: (x0 + x1) / 2, y: 62 * s, z: -40 * s }, { x: x1 - x0, y: 3 * s, z: 90 * s });
      break;
    }
    case "ponte": {
      // Ponte sottile sul vuoto: lontano, pareti e torri della megastruttura; cavi dall'alto.
      megaWall(b, x0, x1, -70 * s, 120 * s, s * 1.5, rng);
      b.ref = { kind: "mass", key: "torri" };
      for (let x = x0 + 8; x < x1; x += 16) colossus(b, x, -38 * s - rng.next() * 10 * s, 6 * s, 30 * s + rng.next() * 50 * s, shade(CONCRETE.mass, 0.8 + rng.next() * 0.3));
      b.ref = { kind: "walkway", key: "cavi" };
      for (let x = x0 + 4; x < x1; x += 8) b.box("metal", { x, y: 30, z: -0.9 }, { x: 0.08, y: 60, z: 0.08 });
      break;
    }
    case "pozzo": {
      // Pozzo verticale: pareti alle spalle e ai lati che salgono e scendono a perdita d'occhio, anelli di ballatoi.
      megaWall(b, x0, x1, -10 * s, 200, s, rng);
      b.ref = { kind: "mass", key: "anelli" };
      for (let y = -90; y < 150; y += 18 * s) b.box("dark", { x: (x0 + x1) / 2, y, z: -6.5 * s }, { x: x1 - x0, y: 0.8, z: 4 * s });
      break;
    }
    case "bivio":
    case "uscita":
      megaWall(b, x0, x1, -9 * s, 80 * s, s, rng);
      break;
  }
}

/** Parete di fondo con `doors` porte allineate sul percorso; restituisce i centri delle porte. */
function endWall(b: Builder, doors: number, exit: boolean, s: number): Vec3[] {
  b.ref = { kind: "mass", key: "parete-fondo" };
  const spread = doors === 1 ? [0] : doors === 2 ? [-3, 3] : [-5, 0, 5];
  const width = 2.4,
    height = 3.6,
    x = STRIP.wall;
  const zs = spread.map((z) => z * Math.min(1.4, s));
  // Parete a fasce verticali, interrotta dalle porte.
  const edges = [-40, ...zs.flatMap((z) => [z - width / 2, z + width / 2]), 40];
  for (let i = 0; i < edges.length; i += 2) {
    const z0 = edges[i]!,
      z1 = edges[i + 1]!;
    b.box("concrete", { x, y: (60 * s + STRIP.bottom) / 2, z: (z0 + z1) / 2 }, { x: 3, y: 60 * s - STRIP.bottom, z: z1 - z0 }, shade(CONCRETE.mass, 0.95));
  }
  for (const z of zs) b.box("concrete", { x, y: (height + 60 * s) / 2, z }, { x: 3, y: 60 * s - height, z: width }, shade(CONCRETE.mass, 0.95));
  // Passerelle dal corridore a ciascuna porta; architravi.
  b.ref = { kind: "walkway", key: "rami" };
  for (const z of zs) {
    b.beam("concrete", { x: 0, y: -STRIP.deckThickness / 2, z: 0 }, { x, y: -STRIP.deckThickness / 2, z }, STRIP.deckThickness, STRIP.deckWidth * 0.8, CONCRETE.walkway);
    b.box(exit ? "metal" : "dark", { x: x - 1.6, y: height + 0.3, z }, { x: 0.3, y: 0.6, z: width + 0.6 });
    // Stipiti chiari: la porta si legge anche nella penombra.
    for (const side of [-1, 1]) b.box("concrete", { x: x - 1.6, y: height / 2, z: z + side * (width / 2 + 0.15) }, { x: 0.35, y: height, z: 0.3 }, shade(CONCRETE.light, 1.3));
  }
  return zs.map((z) => ({ x, y: 0, z }));
}

export function buildRoom(seed: string, room: Room): RoomBuild {
  const rng = rngFromSeed(seed, `corsa:${room.key}`);
  const b = new Builder();
  const tint = DISTRICT_TINT[room.district] ?? CONCRETE.light;
  const P = STRIP.period;
  if (room.kind === "bivio" || room.kind === "uscita") {
    // Stanza con parete di fondo: si estende all'indietro di tre periodi.
    const x0 = -3 * P;
    walkway(b, x0, 0, tint, rng);
    deckPillars(b, x0, 0);
    architecture(b, room, x0, STRIP.wall + 8, rng);
    const doors = endWall(b, room.kind === "uscita" ? 1 : room.doors, room.kind === "uscita", room.size);
    return { room, primitives: b.primitives, periodic: false, angle: 0, doors };
  }
  walkway(b, 0, P, tint, rng);
  deckPillars(b, 0, P);
  architecture(b, room, 0, P, rng);
  const angle = roomAngle(room);
  // Pendenza: la striscia si inclina restando periodica; le strutture verticali restano verticali.
  const tan = Math.tan(angle);
  // Seguono la pendenza i pezzi orizzontali lunghi lungo X: passerella, corrimano, fasce delle pareti.
  const follows = (p: Primitive): boolean => p.shape === "box" && ((p.ref.kind === "walkway" && p.scale.x > 1) || (p.scale.x >= STRIP.module * 2 && p.scale.y < 4));
  const primitives = b.primitives.map((p) => {
    const x = ((p.position.x % P) + P) % P;
    const position = { ...p.position, x, y: p.position.y + x * tan };
    return follows(p) ? { ...p, position, rotation: { ...p.rotation, z: p.rotation.z + angle }, scale: { ...p.scale, x: p.scale.x / Math.cos(angle) } } : { ...p, position };
  });
  return { room, primitives, periodic: true, angle, doors: [] };
}
