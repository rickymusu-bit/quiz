/**
 * Vista di gioco: presentazione intercambiabile (città a tre quarti per lo
 * sviluppo, scena di corsa per il gioco). La pagina gestisce stato, domande,
 * timer, salvataggi e interfaccia; la vista riceve gli eventi del motore e
 * disegna. Nessuna vista modifica lo stato.
 */
import type { Announcement } from "../bafometto.ts";
import type { Vec3 } from "../layout/types.ts";
import type { GameEvent, GameState } from "../logic/state.ts";

export interface GameView {
  /** Regia in corso: i pannelli compaiono solo a regia ferma. */
  readonly busy: boolean;
  /** Giocatore di turno secondo la presentazione (può seguire di qualche istante lo stato). */
  readonly activePlayerId: string;
  /** Posizioni mostrate dei giocatori nella città: servono al radar. */
  readonly pawns: Readonly<Record<string, Vec3>>;
  /** Opacità della dissolvenza a nero. */
  readonly fade: number;
  /** Vista di solo sviluppo in cui i pannelli non compaiono (città rivelata). */
  readonly suppressPanels: boolean;
  enqueue(events: readonly GameEvent[], stateAfter: GameState): void;
  update(seconds: number): void;
  skip(): void;
  intro(): void;
  takeAnnouncements(): Announcement[];
  /** La domanda è visibile. */
  setQuestionOpen(open: boolean): void;
  /** Disegna lo stato presentato; `inset` è l'altezza in pixel del pannello in basso. */
  draw(seconds: number, state: GameState, inset: number): void;
  /** Posizione sullo schermo dell'imbocco del ramo `to` al bivio dopo `cellId`, se inquadrato. */
  forkAnchor(cellId: string, to: string): { x: number; y: number } | null;
  /** Tasto V: cambio d'inquadratura, se la vista lo prevede. */
  toggleMode(): void;
  /** Dati per i test e le verifiche. */
  debug(): Record<string, unknown>;
  /** Testo per la riga di sviluppo. */
  readonly label: string;
}
