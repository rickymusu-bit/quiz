/**
 * Timer della domanda. Scorre soltanto quando la domanda è leggibile e
 * interagibile: mai durante la regia, con la pagina nascosta o in pausa (§6).
 */
export class QuestionTimer {
  private total: number;
  private left: number;
  private fired = false;

  /** `remaining` permette di riprendere una domanda dopo un ricaricamento, senza restituire tempo. */
  constructor(seconds: number, remaining: number = seconds) {
    if (!(seconds > 0)) throw new RangeError("Durata del timer non valida");
    this.total = seconds;
    this.left = Number.isFinite(remaining) ? Math.max(0, Math.min(seconds, remaining)) : seconds;
  }

  get remaining(): number {
    return this.left;
  }

  get duration(): number {
    return this.total;
  }

  get expired(): boolean {
    return this.left <= 0;
  }

  /** Avanza solo se `running`; restituisce true una sola volta, alla scadenza. */
  tick(seconds: number, running: boolean): boolean {
    if (!running || this.fired) return false;
    this.left = Math.max(0, this.left - Math.max(0, seconds));
    if (this.left === 0) {
      this.fired = true;
      return true;
    }
    return false;
  }
}

/** Durata PROVVISORIA della domanda, in secondi: il valore predefinito della versione precedente; il regolamento non la definisce ancora. */
export const DEFAULT_QUESTION_SECONDS = 45;
