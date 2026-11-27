/**
 * Vista della città a tre quarti (fasi 2 e 3): oggi strumento di sviluppo per
 * giudicare mappe e kit (specifica §10). Regia, ostacoli trasparenti,
 * caricamento per settori, panoramica e città rivelata.
 */
import { CameraDirector, SHOTS, type Announcement, type Frame } from "../director/director.ts";
import type { CityLayout, Vec3 } from "../layout/types.ts";
import { publicView } from "../logic/exploration.ts";
import type { GameEvent, GameState } from "../logic/state.ts";
import type { CityMap } from "../logic/types.ts";
import { GrayboxRenderer, type CameraMode } from "../render/graybox.ts";
import { buildSceneModel, presentedView, revealAllView, type SceneModel } from "../scene/model.ts";
import { NO_OCCLUDERS, type Occluders } from "../scene/occlusion.ts";
import { citySlab, visibleRadius, type Focus } from "../scene/sectors.ts";
import type { GameView } from "./view.ts";

export interface CityViewOptions {
  reducedMotion: boolean;
  /** SOLO SVILUPPO: città intera. */
  revealAll: boolean;
  /** SOLO SVILUPPO: ostacoli opachi, per confronto. */
  occlusion: boolean;
  /** Caricamento per settori: calcolato, disattivato o con raggio forzato (sviluppo). */
  sectors: "calcolato" | "off" | number;
  overview: boolean;
}

export class CityView implements GameView {
  private readonly map: CityMap;
  private readonly layout: CityLayout;
  private readonly options: CityViewOptions;
  private readonly renderer: GrayboxRenderer;
  private readonly director: CameraDirector;
  private readonly slab;
  private frame: Frame;
  private mode: CameraMode;
  private builtKey = "";
  private builtSize = "";
  private model: SceneModel | null = null;
  private occluders: Occluders = NO_OCCLUDERS;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, map: CityMap, layout: CityLayout, state: GameState, options: CityViewOptions) {
    this.canvas = canvas;
    this.map = map;
    this.layout = layout;
    this.options = options;
    this.slab = citySlab(layout);
    this.renderer = new GrayboxRenderer(canvas);
    this.director = new CameraDirector(map, layout, state, { reducedMotion: options.reducedMotion });
    this.renderer.setSeat(this.director.seatPosition);
    this.frame = this.director.getFrame();
    this.mode = options.overview ? "overview" : "player";
  }

  get busy(): boolean {
    return this.director.busy;
  }
  get activePlayerId(): string {
    return this.frame.activePlayerId;
  }
  get pawns(): Readonly<Record<string, Vec3>> {
    return this.frame.pawns;
  }
  get fade(): number {
    return this.frame.fade;
  }
  get suppressPanels(): boolean {
    return this.options.revealAll;
  }
  get label(): string {
    const sectors = typeof this.options.sectors === "number" ? ` · SETTORI r=${this.options.sectors}` : "";
    return `vista città${this.options.revealAll ? " · CITTÀ RIVELATA" : ""}${sectors} · V vista`;
  }

  enqueue(events: readonly GameEvent[], stateAfter: GameState): void {
    this.director.enqueue(events, stateAfter);
  }
  update(seconds: number): void {
    this.frame = this.director.update(seconds);
  }
  skip(): void {
    this.frame = this.director.skip();
  }
  intro(): void {
    this.director.intro();
  }
  takeAnnouncements(): Announcement[] {
    return this.director.takeAnnouncements();
  }
  setQuestionOpen(): void {}
  toggleMode(): void {
    this.mode = this.mode === "player" ? "overview" : "player";
  }

  forkAnchor(_cellId: string, to: string): { x: number; y: number } | null {
    return this.mode === "player" ? this.renderer.project(this.layout.positions[to]!) : null;
  }

  private buildModel(state: GameState): SceneModel {
    const view = { ...publicView(this.map, state), activePlayerId: this.frame.activePlayerId };
    return buildSceneModel(this.map, this.layout, this.options.revealAll ? revealAllView(this.map, view) : presentedView(this.map, view, this.frame.explored));
  }

  /**
   * Fuochi del caricamento per settori: il punto inquadrato, con il raggio che
   * la sua inquadratura può mostrare o ombreggiare, e ogni pedina, destinazione
   * possibile di un cambio di turno, con il raggio della più ampia delle
   * inquadrature ordinarie. In panoramica e con la città rivelata si carica tutto.
   */
  private sectorFoci(aspect: number): Focus[] | null {
    if (this.options.sectors === "off" || this.options.revealAll || this.mode === "overview") return null;
    const forced = typeof this.options.sectors === "number" ? this.options.sectors : null;
    const target = this.frame.camera.target;
    const foci: Focus[] = [{ x: target.x, z: target.z, radius: forced ?? visibleRadius(this.frame.camera, aspect, this.slab) }];
    for (const pawn of Object.values(this.frame.pawns)) {
      const radius = forced ?? Math.max(...Object.values(SHOTS).map((shot) => visibleRadius({ target: pawn, ...shot }, aspect, this.slab)));
      foci.push({ x: pawn.x, z: pawn.z, radius });
    }
    return foci;
  }

  draw(_seconds: number, state: GameState, inset: number): void {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    const size = `${width}x${height}`;
    if (size !== this.builtSize) {
      this.renderer.resize(width, height);
      this.builtSize = size;
    }
    const key = `${this.frame.explored.join()}|${this.frame.activePlayerId}|${this.options.revealAll}`;
    if (key !== this.builtKey || !this.model) {
      this.model = this.buildModel(state);
      this.renderer.setModel(this.model, this.map.seed);
      this.builtKey = key;
    }
    this.renderer.setPawnPositions(this.frame.pawns);
    if (this.mode === "overview") this.renderer.frameOverview(this.model);
    else this.renderer.setCameraPose(this.frame.camera);
    // Settori caricati: si aggiornano prima del disegno, quindi un fotogramma non mostra mai un settore mancante.
    this.renderer.updateSectors(this.sectorFoci(width / Math.max(1, height)));
    // Il pannello in basso non copre il giocatore: l'inquadratura si centra nell'area libera.
    this.renderer.setBottomInset(this.mode === "player" ? inset : 0);
    // Gli ostacoli fra camera e giocatore attivo diventano trasparenti; sulla sede di Bafometto la pedina non è inquadrata.
    if (this.options.occlusion) {
      this.occluders = this.frame.bafometto?.kind === "seat" ? this.renderer.clearOcclusion() : this.renderer.updateOcclusion(this.frame.pawns[this.frame.activePlayerId]!);
    }
    this.renderer.setBafometto(
      this.frame.bafometto?.kind === "terminal" ? { kind: "terminal", position: this.layout.positions[this.frame.bafometto.cellId]! } : this.frame.bafometto,
    );
    this.renderer.render();
  }

  debug(): Record<string, unknown> {
    const sectors = this.options.sectors;
    return {
      view: "citta",
      mode: this.mode,
      revealAll: this.options.revealAll,
      shown: [...this.frame.explored],
      rendered: this.model?.tiles.map((t) => t.id) ?? [],
      loadedTiles: this.renderer.loadedTiles(),
      loadedSectors: this.renderer.loadedSectors(),
      sectors,
      occluders: { tiles: this.occluders.tiles.length, pillars: this.occluders.pillars.length, walkways: this.occluders.walkways.length, masses: this.occluders.masses.length },
      occluderIds: [...this.occluders.tiles, ...this.occluders.pillars],
      bafometto: this.frame.bafometto,
      seat: this.director.seatPosition,
      cameraTarget: this.frame.camera.target,
      activeScreen: this.renderer.project(this.frame.pawns[this.frame.activePlayerId]!),
      pawns: this.frame.pawns,
      stats: this.renderer.getStats(),
    };
  }
}
