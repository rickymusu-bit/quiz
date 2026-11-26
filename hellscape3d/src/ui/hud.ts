/**
 * Interfaccia PROVVISORIA (HTML/CSS sopra la scena): turno, domanda fittizia,
 * dado, scelta al bivio, fine partita e minimappa. Mostra la presentazione,
 * non lo stato anticipato del motore: i pannelli compaiono solo a regia ferma.
 */
import type { Difficulty, RelativeLength } from "../logic/types.ts";
import type { MinimapShapes } from "./minimap.ts";
import { cssColor, playerColor } from "./palette.ts";
import type { FakeQuestion } from "./questions.ts";

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
  | { kind: "question"; key: string; question: FakeQuestion; remaining: number; total: number }
  | { kind: "roll"; key: string }
  | { kind: "fork"; key: string; choices: ForkChoice[] }
  | { kind: "ended"; key: string; winnerName: string };

export interface HudState {
  turn: number;
  players: HudPlayer[];
  panel: Panel | null;
  die: number | null;
  toast: string | null;
  dev: string;
}

export interface HudActions {
  answer(index: number): void;
  roll(): void;
  choose(to: string): void;
  restart(): void;
}

const RELATIVE_LABELS: Readonly<Record<RelativeLength, string>> = { "piu-breve": "Più breve", intermedio: "Intermedio", "piu-lungo": "Più lungo" };
const DIFFICULTY_TEXT: Readonly<Record<Difficulty, string>> = { facile: "domande facili", media: "domande medie", difficile: "domande difficili" };

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
  private readonly dev: HTMLElement;
  private readonly badges: HTMLElement;
  private readonly minimap: HTMLCanvasElement;
  private readonly actions: HudActions;
  private panelKey = "";
  private turnKey = "";
  private timerBar: HTMLElement | null = null;
  private timerText: HTMLElement | null = null;

  constructor(root: HTMLElement, actions: HudActions) {
    this.actions = actions;
    this.turn = root.appendChild(element("section", "hud-turn"));
    this.turn.setAttribute("aria-live", "polite");
    this.minimap = root.appendChild(element("canvas", "hud-minimap"));
    this.minimap.setAttribute("role", "img");
    this.minimap.setAttribute("aria-label", "Minimappa delle zone esplorate");
    this.die = root.appendChild(element("div", "hud-die"));
    this.die.setAttribute("aria-live", "polite");
    this.toast = root.appendChild(element("div", "hud-toast"));
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
    this.dev.textContent = state.dev;
    this.renderBadges(state.panel);
    if (state.panel?.kind === "question" && this.timerBar && this.timerText) {
      const fraction = state.panel.remaining / state.panel.total;
      this.timerBar.style.transform = `scaleX(${fraction})`;
      this.timerBar.classList.toggle("is-low", fraction <= 0.25);
      this.timerText.textContent = `${Math.ceil(state.panel.remaining)} s`;
    }
  }

  /** Disegna la minimappa; restituisce le celle disegnate (per i test). */
  drawMinimap(shapes: MinimapShapes): string[] {
    const canvas = this.minimap;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
    if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
    const g = canvas.getContext("2d")!;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, width, height);
    g.lineCap = "round";
    g.strokeStyle = "rgba(200, 200, 205, 0.75)";
    g.lineWidth = Math.max(1.5, shapes.scale * 0.6);
    for (const [a, b] of shapes.edges) {
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }
    g.strokeStyle = "rgba(200, 200, 205, 0.3)";
    g.setLineDash([2, 3]);
    for (const [a, b] of shapes.stubs) {
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }
    g.setLineDash([]);
    const size = Math.max(3, shapes.scale * 1.6);
    for (const cell of shapes.cells) {
      g.fillStyle = cell.kind === "exit" ? "#39ff88" : cell.kind === "fork" ? "#d9d9de" : "#9a9ca3";
      const s = cell.kind === "fork" || cell.kind === "exit" ? size * 1.3 : size;
      g.fillRect(cell.x - s / 2, cell.y - s / 2, s, s);
    }
    for (const player of shapes.players) {
      g.beginPath();
      g.arc(player.x, player.y, player.active ? 5 : 3.5, 0, Math.PI * 2);
      g.fillStyle = cssColor(playerColor(player.index));
      g.fill();
      if (player.active) {
        g.lineWidth = 2;
        g.strokeStyle = "#fff1c2";
        g.stroke();
      }
    }
    return shapes.cells.map((c) => c.id);
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
      head.append(element("span", `hud-difficulty is-${panel.question.difficulty}`, panel.question.difficulty));
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
    } else if (panel.kind === "roll") {
      this.panel.setAttribute("aria-label", "Lancio del dado");
      const button = element("button", "hud-primary", "Lancia il dado (Invio)");
      button.type = "button";
      button.addEventListener("click", () => this.actions.roll());
      this.panel.append(element("p", "hud-question-text", "Risposta corretta: puoi avanzare."), button);
      button.focus({ preventScroll: true });
    } else if (panel.kind === "fork") {
      this.panel.setAttribute("aria-label", "Scelta al bivio");
      const options = element("div", "hud-options");
      for (const choice of panel.choices) {
        const button = element("button", `hud-option is-${choice.difficulty}`, `${choice.number}. ${RELATIVE_LABELS[choice.relative]} · ${DIFFICULTY_TEXT[choice.difficulty]}`);
        button.type = "button";
        button.addEventListener("click", () => this.actions.choose(choice.to));
        options.append(button);
      }
      this.panel.append(element("p", "hud-question-text", "Bivio: scegli il percorso. La lunghezza è indicata solo in modo relativo."), options);
      options.querySelector("button")?.focus({ preventScroll: true });
    } else {
      this.panel.setAttribute("aria-label", "Fine partita");
      const button = element("button", "hud-primary", "Nuova città");
      button.type = "button";
      button.addEventListener("click", () => this.actions.restart());
      this.panel.append(element("p", "hud-question-text", `${panel.winnerName} ha raggiunto la porta: è uscito dalla città.`), button);
      button.focus({ preventScroll: true });
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
    }
  }
}
