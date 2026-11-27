/**
 * Interfaccia PROVVISORIA (HTML/CSS sopra la scena): turno, domanda con esito
 * e spiegazione, dado, scelta al bivio, fine partita e radar. Mostra la presentazione,
 * non lo stato anticipato del motore: i pannelli compaiono solo a regia ferma.
 */
import type { Difficulty, RelativeLength } from "../logic/types.ts";
import type { RadarShapes } from "./radar.ts";
import { cssColor, playerColor } from "./palette.ts";
import { outcomeOf, type PresentedQuestion } from "../questions/deck.ts";

export interface HudPlayer {
  id: string;
  name: string;
  index: number;
  active: boolean;
  escaped: boolean;
}

export interface ForkChoice {
  number: number;
  to: string;
  relative: RelativeLength;
  difficulty: Difficulty;
  /** Posizione sullo schermo dell'imbocco del ramo, se inquadrato. */
  anchor: { x: number; y: number } | null;
}

export type Panel =
  | { kind: "question"; key: string; question: PresentedQuestion; remaining: number; total: number }
  /** Esito della risposta, con la spiegazione: il turno prosegue con «Continua». */
  | { kind: "feedback"; key: string; question: PresentedQuestion }
  | { kind: "roll"; key: string }
  | { kind: "fork"; key: string; choices: ForkChoice[] }
  | { kind: "ended"; key: string; winnerName: string };

export interface HudState {
  turn: number;
  players: HudPlayer[];
  panel: Panel | null;
  die: number | null;
  toast: string | null;
  /** Battuta di Bafometto in corso. */
  speech: string | null;
  dev: string;
}

export interface HudActions {
  answer(index: number): void;
  /** Chiude l'esito della risposta e applica la risposta al motore. */
  proceed(): void;
  roll(): void;
  choose(to: string): void;
  restart(): void;
  /** Riepilogo delle domande a fine partita. */
  summary(): void;
}

/**
 * Etichette generiche delle alternative al bivio (specifica §3): dicono solo
 * la posizione del ramo nell'ordine delle lunghezze relative, senza lunghezze
 * né difficoltà esplicite. Quella del ramo intermedio è PROVVISORIA.
 */
export const BRANCH_LABELS: Readonly<Record<RelativeLength, string>> = { "piu-breve": "Scorciatoia pericolosa", intermedio: "Via incerta", "piu-lungo": "Strada sicura" };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class Hud {
  private readonly turn: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly die: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly speech: HTMLElement;
  private readonly dev: HTMLElement;
  private readonly badges: HTMLElement;
  private readonly radar: HTMLCanvasElement;
  private readonly actions: HudActions;
  /** Valore iniziale diverso da qualunque chiave, così il primo aggiornamento nasconde anche un pannello vuoto. */
  private panelKey: string | null = null;
  private turnKey = "";
  private timerBar: HTMLElement | null = null;
  private timerText: HTMLElement | null = null;

  constructor(root: HTMLElement, actions: HudActions) {
    this.actions = actions;
    this.turn = root.appendChild(element("section", "hud-turn"));
    this.turn.setAttribute("aria-live", "polite");
    this.radar = root.appendChild(element("canvas", "hud-radar"));
    this.radar.setAttribute("role", "img");
    this.radar.setAttribute("aria-label", "Radar: gli altri giocatori attorno a quello di turno; l'uscita compare quando è vicina");
    this.die = root.appendChild(element("div", "hud-die"));
    this.die.setAttribute("aria-live", "polite");
    this.toast = root.appendChild(element("div", "hud-toast"));
    this.speech = root.appendChild(element("figure", "hud-speech"));
    this.speech.setAttribute("role", "status");
    this.speech.setAttribute("aria-live", "polite");
    this.toast.setAttribute("role", "status");
    this.badges = root.appendChild(element("div", "hud-badges"));
    this.panel = root.appendChild(element("section", "hud-panel"));
    this.dev = root.appendChild(element("div", "hud-dev"));
  }

  update(state: HudState): void {
    this.renderTurn(state);
    this.renderPanel(state.panel);
    this.die.textContent = state.die === null ? "" : `Dado: ${state.die}`;
    this.die.hidden = state.die === null;
    this.toast.textContent = state.toast ?? "";
    this.toast.hidden = state.toast === null;
    if (this.speech.dataset.text !== (state.speech ?? "")) {
      this.speech.dataset.text = state.speech ?? "";
      this.speech.replaceChildren();
      if (state.speech) {
        this.speech.append(element("figcaption", "hud-speech-who", "Bafometto · testo provvisorio"), element("blockquote", "hud-speech-text", state.speech));
      }
    }
    this.speech.hidden = state.speech === null;
    this.dev.textContent = state.dev;
    this.renderBadges(state.panel);
    if (state.panel?.kind === "question" && this.timerBar && this.timerText) {
      const fraction = state.panel.remaining / state.panel.total;
      this.timerBar.style.transform = `scaleX(${fraction})`;
      this.timerBar.classList.toggle("is-low", fraction <= 0.25);
      this.timerText.textContent = `${Math.ceil(state.panel.remaining)} s`;
    }
  }

  /** Disegna il radar; restituisce i punti disegnati (per i test). */
  drawRadar(shapes: RadarShapes): RadarShapes {
    const canvas = this.radar;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
    if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
    const g = canvas.getContext("2d")!;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, width, height);
    const { center: c, radius: r } = shapes;
    // Quadrante: disco, anello a metà portata e mirino.
    g.beginPath();
    g.arc(c.x, c.y, r, 0, Math.PI * 2);
    g.fillStyle = "rgba(14, 22, 18, 0.9)";
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = "rgba(120, 200, 150, 0.55)";
    g.stroke();
    g.lineWidth = 1;
    g.strokeStyle = "rgba(120, 200, 150, 0.22)";
    g.beginPath();
    g.arc(c.x, c.y, r / 2, 0, Math.PI * 2);
    g.moveTo(c.x - r, c.y);
    g.lineTo(c.x + r, c.y);
    g.moveTo(c.x, c.y - r);
    g.lineTo(c.x, c.y + r);
    g.stroke();
    // Uscita entro la portata: portale stilizzato.
    if (shapes.exit) {
      const { x, y } = shapes.exit;
      g.strokeStyle = "#39ff88";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x - 5, y + 6);
      g.lineTo(x - 5, y - 1);
      g.arc(x, y - 1, 5, Math.PI, 0);
      g.lineTo(x + 5, y + 6);
      g.stroke();
      g.fillStyle = "rgba(57, 255, 136, 0.35)";
      g.fill();
    }
    // Altri giocatori: punti, o tacche sul bordo se fuori portata; chi è nella stessa casella del giocatore di turno si affianca.
    let beside = 0;
    for (const p of shapes.players) {
      if (p.active) continue;
      g.fillStyle = cssColor(playerColor(p.index));
      if (p.onEdge) {
        const angle = Math.atan2(p.y - c.y, p.x - c.x);
        g.beginPath();
        g.moveTo(c.x + Math.cos(angle) * (r + 1), c.y + Math.sin(angle) * (r + 1));
        g.lineTo(c.x + Math.cos(angle + 0.12) * (r - 9), c.y + Math.sin(angle + 0.12) * (r - 9));
        g.lineTo(c.x + Math.cos(angle - 0.12) * (r - 9), c.y + Math.sin(angle - 0.12) * (r - 9));
        g.closePath();
        g.fill();
        continue;
      }
      const shift = Math.hypot(p.x - c.x, p.y - c.y) < 4 ? 7 * ++beside : 0;
      g.beginPath();
      g.arc(p.x + shift, p.y, 4, 0, Math.PI * 2);
      g.fill();
    }
    const active = shapes.players.find((p) => p.active)!;
    g.beginPath();
    g.arc(active.x, active.y, 5, 0, Math.PI * 2);
    g.fillStyle = cssColor(playerColor(active.index));
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = "#fff1c2";
    g.stroke();
    return shapes;
  }

  private renderTurn(state: HudState): void {
    const key = JSON.stringify([state.turn, state.players]);
    if (key === this.turnKey) return;
    this.turnKey = key;
    this.turn.replaceChildren();
    const active = state.players.find((p) => p.active);
    this.turn.append(element("div", "hud-turn-title", `Turno ${state.turn}${active ? ` · tocca a ${active.name}` : ""}`));
    const list = element("ul", "hud-players");
    for (const player of state.players) {
      const item = element("li", `hud-player${player.active ? " is-active" : ""}${player.escaped ? " is-escaped" : ""}`);
      const dot = element("span", "hud-dot");
      dot.style.background = cssColor(playerColor(player.index));
      item.append(dot, element("span", "", `${player.name}${player.escaped ? " · uscito" : ""}`));
      list.append(item);
    }
    this.turn.append(list);
  }

  private renderPanel(panel: Panel | null): void {
    const key = panel?.key ?? "";
    if (key === this.panelKey) return;
    this.panelKey = key;
    this.panel.replaceChildren();
    this.timerBar = this.timerText = null;
    this.panel.hidden = panel === null;
    if (!panel) return;
    if (panel.kind === "question") {
      this.panel.setAttribute("aria-label", "Domanda");
      const head = element("div", "hud-question-head");
      head.append(element("span", `hud-difficulty is-${panel.question.difficulty}`, `${panel.question.difficulty} · ${panel.question.topicName}`));
      this.timerText = head.appendChild(element("span", "hud-timer-text"));
      const track = element("div", "hud-timer");
      this.timerBar = track.appendChild(element("div", "hud-timer-bar"));
      const options = element("div", "hud-options");
      panel.question.options.forEach((option, index) => {
        const button = element("button", "hud-option", `${index + 1}. ${option}`);
        button.type = "button";
        button.addEventListener("click", () => this.actions.answer(index));
        options.append(button);
      });
      this.panel.append(head, track, element("p", "hud-question-text", panel.question.text), options);
      options.querySelector("button")?.focus({ preventScroll: true });
    } else if (panel.kind === "feedback") {
      const q = panel.question;
      const outcome = outcomeOf(q);
      this.panel.setAttribute("aria-label", "Esito della risposta");
      const title = outcome === "correct" ? "Risposta corretta" : outcome === "wrong" ? "Risposta errata: il turno passa" : "Tempo scaduto: il turno passa";
      const heading = element("p", `hud-outcome is-${outcome}`, title);
      heading.setAttribute("role", "status");
      const details = element("div", "hud-solution");
      if (outcome === "wrong") details.append(element("p", "hud-answer is-chosen", `Hai risposto: ${q.options[q.answer as number]}`));
      if (outcome !== "correct") details.append(element("p", "hud-answer is-correct", `Risposta corretta: ${q.options[q.correctIndex]}`));
      if (q.explanation) details.append(element("p", "hud-explanation", q.explanation));
      const button = element("button", "hud-primary", "Continua (Invio)");
      button.type = "button";
      button.addEventListener("click", () => this.actions.proceed());
      this.panel.append(heading, details, button);
      button.focus({ preventScroll: true });
    } else if (panel.kind === "roll") {
      this.panel.setAttribute("aria-label", "Lancio del dado");
      const button = element("button", "hud-primary", "Lancia il dado (Invio)");
      button.type = "button";
      button.addEventListener("click", () => this.actions.roll());
      this.panel.append(element("p", "hud-question-text", "Puoi avanzare."), button);
      button.focus({ preventScroll: true });
    } else if (panel.kind === "fork") {
      this.panel.setAttribute("aria-label", "Scelta al bivio");
      const options = element("div", "hud-options");
      for (const choice of panel.choices) {
        const button = element("button", `hud-option is-${choice.difficulty}`, `${choice.number}. ${BRANCH_LABELS[choice.relative]}`);
        button.type = "button";
        button.addEventListener("click", () => this.actions.choose(choice.to));
        options.append(button);
      }
      this.panel.append(element("p", "hud-question-text", "Bivio: scegli la strada."), options);
      options.querySelector("button")?.focus({ preventScroll: true });
    } else {
      this.panel.setAttribute("aria-label", "Fine partita");
      const summary = element("button", "hud-primary hud-summary", "Riepilogo della partita");
      summary.type = "button";
      summary.addEventListener("click", () => this.actions.summary());
      const button = element("button", "hud-option hud-restart", "Nuova città");
      button.type = "button";
      button.addEventListener("click", () => this.actions.restart());
      const buttons = element("div", "hud-options");
      buttons.append(summary, button);
      this.panel.append(element("p", "hud-question-text", `${panel.winnerName} ha raggiunto la porta: è uscito dalla città.`), buttons);
      summary.focus({ preventScroll: true });
    }
  }

  private renderBadges(panel: Panel | null): void {
    this.badges.replaceChildren();
    if (panel?.kind !== "fork") return;
    for (const choice of panel.choices) {
      if (!choice.anchor) continue;
      const badge = element("span", `hud-badge is-${choice.difficulty}`, String(choice.number));
      badge.style.left = `${choice.anchor.x}px`;
      badge.style.top = `${choice.anchor.y}px`;
      badge.setAttribute("aria-hidden", "true");
      this.badges.append(badge);
      this.clearOfHud(badge);
    }
  }

  /**
   * Sposta l'etichetta di una porta fuori dagli altri elementi dell'interfaccia
   * (dado, turno, radar, avvisi, pannello), con lo spostamento più breve fra le
   * quattro direzioni che la lascia dentro lo schermo, per non allontanarla
   * dalla sua porta più del necessario.
   */
  private clearOfHud(badge: HTMLElement): void {
    const GAP = 6;
    const obstacles = [this.turn, this.die, this.radar, this.toast, this.speech, this.panel]
      .filter((e) => !e.hidden && e.getClientRects().length > 0)
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    let left = parseFloat(badge.style.left),
      top = parseFloat(badge.style.top);
    for (let pass = 0; pass < obstacles.length; pass++) {
      const r = badge.getBoundingClientRect();
      const hit = obstacles.find((o) => r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top);
      if (!hit) return;
      const moves = [
        { dx: hit.right + GAP - r.left, dy: 0 },
        { dx: -(r.right - hit.left + GAP), dy: 0 },
        { dx: 0, dy: hit.bottom + GAP - r.top },
        { dx: 0, dy: -(r.bottom - hit.top + GAP) },
      ].filter((m) => r.left + m.dx >= 0 && r.right + m.dx <= window.innerWidth && r.top + m.dy >= 0 && r.bottom + m.dy <= window.innerHeight);
      const best = moves.sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)))[0];
      if (!best) return;
      left += best.dx;
      top += best.dy;
      badge.style.left = `${left}px`;
      badge.style.top = `${top}px`;
    }
  }
}
