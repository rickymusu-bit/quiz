/**
 * Bafometto, presenza PROVVISORIA della vertical slice (specifica §6, §9):
 * battute mostrate nell'interfaccia all'apertura, sui terminali e a fine
 * partita.
 *
 * I testi sono segnaposto: gli interventi di Bafometto sul gioco (Omen,
 * crediti, salute) non sono ancora definiti dal regolamento.
 */

export type BafomettoMoment = "intro" | "terminal" | "end";

/** Battuta da mostrare nell'interfaccia; prodotta anche con il movimento ridotto. */
export interface Announcement {
  moment: BafomettoMoment;
  text: string;
}

/** Testi segnaposto, dichiarati come tali nell'interfaccia. */
export const BAFOMETTO_LINES: Readonly<Record<BafomettoMoment, string>> = Object.freeze({
  intro: "Benvenuti nella mia città. Cercate la porta, se ne siete capaci.",
  terminal: "Un terminale si accende: vi sto osservando.",
  end: "Uno di voi ha trovato la porta. La città si richiude sugli altri.",
});
