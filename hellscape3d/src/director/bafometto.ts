/**
 * Bafometto, presenza PROVVISORIA della vertical slice (specifica §6, §9).
 *
 * La sede è una macchina monumentale nell'abisso, a distanza fissa dalla
 * partenza e dal lato -X, dove il percorso non va mai (avanza sempre lungo +X).
 * La posizione dipende soltanto dalla partenza: non rivela uscita né topologia.
 *
 * I testi sono segnaposto: gli interventi di Bafometto sul gioco (Omen,
 * crediti, salute) non sono ancora definiti dal regolamento.
 */
import type { Vec3 } from "../layout/types.ts";
import type { CameraPose } from "./director.ts";

/** Spostamento della sede rispetto alla partenza. */
export const SEAT_OFFSET: Readonly<Vec3> = Object.freeze({ x: -46, y: -4, z: 8 });
/** Semi-ingombro orizzontale della sede, per i controlli di distanza. */
export const SEAT_HALF_SIZE = 9;

export function seatPosition(start: Vec3): Vec3 {
  return { x: start.x + SEAT_OFFSET.x, y: start.y + SEAT_OFFSET.y, z: start.z + SEAT_OFFSET.z };
}

/** Inquadratura dedicata della sede: bassa e lontana, per la scala monumentale. */
export function seatPose(seat: Vec3): CameraPose {
  return { target: { x: seat.x, y: seat.y + 9, z: seat.z }, distance: 48, pitch: (24 * Math.PI) / 180 };
}

export type BafomettoMoment = "intro" | "terminal" | "end";

/** Testi segnaposto, dichiarati come tali nell'interfaccia. */
export const BAFOMETTO_LINES: Readonly<Record<BafomettoMoment, string>> = Object.freeze({
  intro: "Benvenuti nella mia città. Cercate la porta, se ne siete capaci.",
  terminal: "Un terminale si accende: vi sto osservando.",
  end: "Uno di voi ha trovato la porta. La città si richiude sugli altri.",
});
