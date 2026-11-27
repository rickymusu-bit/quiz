/**
 * Stanze della scena di corsa (specifica §6). Ogni casella è una stanza enorme
 * e apparentemente infinita: tipo di spazio, grandezza e pendenza. La stanza
 * del bivio è una stanza di passaggio, non una casella. Partenza e uscita sono
 * stanze disegnate (qui in versione graybox provvisoria).
 *
 * Tutto dipende da seme, casella e distretto, con un flusso decorativo che non
 * tocca la logica; la pendenza viene dalla città generata, la stessa del radar.
 * L'inquadratura nasce con la stanza, dalle sue caratteristiche (camera.ts).
 */
import type { CityLayout } from "../layout/types.ts";
import { rngFromSeed } from "../logic/rng.ts";
import type { CityMap } from "../logic/types.ts";
import { generateShot, type RoomShot } from "./camera.ts";

export type RoomKind = "corridoio" | "sala" | "ponte" | "pozzo" | "bivio" | "partenza" | "uscita";
export type Slope = "salita" | "piano" | "discesa";

export interface Room {
  /** Identità della stanza: la casella, o `bivio:<casella>` per la stanza di passaggio dopo una casella. */
  key: string;
  cellId: string;
  kind: RoomKind;
  slope: Slope;
  /** Grandezza relativa dello spazio: guida le proporzioni dell'architettura e la distanza della camera. */
  size: number;
  district: string;
  /** Solo per la stanza del bivio: numero di passaggi. */
  doors: number;
  /** Inquadratura scelta con la stanza. */
  shot: RoomShot;
}

/** Tipi generati, con il peso per distretto (provvisorio): i distretti sono varianti dello stesso tema. */
const WEIGHTS: Readonly<Record<string, Readonly<Record<"corridoio" | "sala" | "ponte" | "pozzo", number>>>> = {
  fondazioni: { corridoio: 2, sala: 3, ponte: 1, pozzo: 2 },
  ponti: { corridoio: 1, sala: 1, ponte: 4, pozzo: 1 },
  abitativo: { corridoio: 4, sala: 2, ponte: 1, pozzo: 1 },
  motori: { corridoio: 2, sala: 3, ponte: 1, pozzo: 2 },
  sommita: { corridoio: 2, sala: 2, ponte: 2, pozzo: 1 },
};
/** Grandezza di base per tipo, poi variata del ±20%. */
const SIZE: Readonly<Record<RoomKind, number>> = { corridoio: 1, sala: 1.6, ponte: 1.4, pozzo: 1.8, bivio: 1.3, partenza: 1.3, uscita: 1.5 };
/** Differenza di quota oltre la quale il tratto è in salita o in discesa. */
const SLOPE_THRESHOLD = 0.3;

export function slopeOf(map: CityMap, layout: CityLayout, cellId: string): Slope {
  const cell = map.cells[cellId]!;
  if (cell.next.length !== 1) return "piano";
  const dy = layout.positions[cell.next[0]!]!.y - layout.positions[cellId]!.y;
  return dy > SLOPE_THRESHOLD ? "salita" : dy < -SLOPE_THRESHOLD ? "discesa" : "piano";
}

export function roomOf(map: CityMap, layout: CityLayout, cellId: string): Room {
  const cell = map.cells[cellId]!;
  const rng = rngFromSeed(map.seed, `stanza:${cellId}`);
  let kind: RoomKind;
  if (cell.kind === "start") kind = "partenza";
  else if (cell.kind === "exit") kind = "uscita";
  else {
    const weights = WEIGHTS[cell.district] ?? WEIGHTS.abitativo!;
    const entries = Object.entries(weights) as [RoomKind, number][];
    let roll = rng.next() * entries.reduce((sum, [, w]) => sum + w, 0);
    kind = entries.find(([, w]) => (roll -= w) < 0)?.[0] ?? entries[0]![0];
  }
  const size = SIZE[kind] * (0.8 + rng.next() * 0.4);
  return { key: cellId, cellId, kind, slope: slopeOf(map, layout, cellId), size, district: cell.district, doors: 0, shot: generateShot(kind, size, rng) };
}

/** Stanza di passaggio del bivio dopo `cellId`: non è una casella e non vi si termina l'avanzamento. */
export function junctionRoomOf(map: CityMap, cellId: string): Room {
  const cell = map.cells[cellId]!;
  if (cell.next.length < 2) throw new Error(`Nessun bivio dopo ${cellId}`);
  const rng = rngFromSeed(map.seed, `bivio:${cellId}`);
  const size = SIZE.bivio * (0.85 + rng.next() * 0.3);
  return { key: `bivio:${cellId}`, cellId, kind: "bivio", slope: "piano", size, district: cell.district, doors: cell.next.length, shot: generateShot("bivio", 1, rng) };
}
