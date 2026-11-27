/**
 * Vista della città a tre quarti: strumento di sviluppo per giudicare mappe e
 * kit (specifica §10), non schermata di gioco. Mostra lo stato così com'è,
 * senza regia: pedine sulle loro caselle, celle esplorate, camera fissa sul
 * giocatore di turno; in alternativa panoramica o città rivelata.
 */
import type { Announcement } from "../bafometto.ts";
import type { CityLayout, Vec3 } from "../layout/types.ts";
import { publicView } from "../logic/exploration.ts";
import type { GameEvent, GameState } from "../logic/state.ts";
import type { CityMap } from "../logic/types.ts";
import { GrayboxRenderer, type CameraMode } from "../render/graybox.ts";
import { CITY_SHOT } from "../scene/dimensions.ts";
import { buildSceneModel, presentedView, revealAllView, type SceneModel } from "../scene/model.ts";
import type { GameView } from "./view.ts";

export interface CityViewOptions {
  /** SOLO SVILUPPO: città intera. */
  revealAll: boolean;
  overview: boolean;
}

export class CityView implements GameView {
  private readonly map: CityMap;
  private readonly layout: CityLayout;
  private readonly options: CityViewOptions;
  private readonly renderer: GrayboxRenderer;
  private readonly canvas: HTMLCanvasElement;
  private state: GameState;
  private mode: CameraMode;
  private builtKey = "";
  private builtSize = "";
  private model: SceneModel | null = null;

  constructor(canvas: HTMLCanvasElement, map: CityMap, layout: CityLayout, state: GameState, options: CityViewOptions) {
    this.canvas = canvas;
    this.map = map;
    this.layout = layout;
    this.options = options;
    this.state = state;
    this.renderer = new GrayboxRenderer(canvas);
    this.mode = options.overview ? "overview" : "player";
  }

  /** Nessuna regia: la vista coincide sempre con lo stato. */
  get busy(): boolean {
    return false;
  }
  get activePlayerId(): string {
    return this.state.players[this.state.activeIndex]!.id;
  }
  get pawns(): Readonly<Record<string, Vec3>> {
    return Object.fromEntries(this.state.players.map((p) => [p.id, this.layout.positions[p.cellId]!]));
  }
  get fade(): number {
    return 0;
  }
  get suppressPanels(): boolean {
    return this.options.revealAll;
  }
  get label(): string {
    return `vista città (sviluppo)${this.options.revealAll ? " · CITTÀ RIVELATA" : ""} · V vista`;
  }

  enqueue(_events: readonly GameEvent[], stateAfter: GameState): void {
    this.state = stateAfter;
  }
  update(): void {}
  skip(): void {}
  intro(): void {}
  takeAnnouncements(): Announcement[] {
    return [];
  }
  setQuestionOpen(): void {}
  toggleMode(): void {
    this.mode = this.mode === "player" ? "overview" : "player";
  }

  forkAnchor(_cellId: string, to: string): { x: number; y: number } | null {
    return this.mode === "player" ? this.renderer.project(this.layout.positions[to]!) : null;
  }

  private buildModel(state: GameState): SceneModel {
    const view = publicView(this.map, state);
    return buildSceneModel(this.map, this.layout, this.options.revealAll ? revealAllView(this.map, view) : presentedView(this.map, view, state.explored));
  }

  draw(_seconds: number, state: GameState, inset: number): void {
    this.state = state;
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    const size = `${width}x${height}`;
    if (size !== this.builtSize) {
      this.renderer.resize(width, height);
      this.builtSize = size;
    }
    const key = `${state.explored.join()}|${this.activePlayerId}|${state.players.map((p) => p.cellId).join()}|${this.options.revealAll}`;
    if (key !== this.builtKey || !this.model) {
      this.model = this.buildModel(state);
      this.renderer.setModel(this.model, this.map.seed);
      this.builtKey = key;
    }
    if (this.mode === "overview") this.renderer.frameOverview(this.model);
    else this.renderer.setCameraPose({ target: this.pawns[this.activePlayerId]!, ...CITY_SHOT });
    // Il pannello in basso non copre il giocatore: l'inquadratura si centra nell'area libera.
    this.renderer.setBottomInset(this.mode === "player" ? inset : 0);
    this.renderer.render();
  }

  debug(): Record<string, unknown> {
    return {
      view: "citta",
      mode: this.mode,
      revealAll: this.options.revealAll,
      shown: [...this.state.explored],
      rendered: this.model?.tiles.map((t) => t.id) ?? [],
      activeScreen: this.renderer.project(this.pawns[this.activePlayerId]!),
      pawns: this.pawns,
      stats: this.renderer.getStats(),
    };
  }
}
