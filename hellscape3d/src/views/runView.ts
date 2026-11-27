/**
 * Vista della scena di corsa (specifica §6): la schermata di gioco. Un
 * giocatore alla volta corre nella stanza della sua casella; la regia della
 * corsa decide uscite, stanze dei bivi, eventi e cambi di stanza.
 */
import type { Announcement } from "../bafometto.ts";
import type { CityLayout, Vec3 } from "../layout/types.ts";
import type { GameEvent, GameState } from "../logic/state.ts";
import type { CityMap } from "../logic/types.ts";
import { poseFor, PRESETS, type PresetKind } from "../run/camera.ts";
import { junctionRoomOf, roomOf, type Room } from "../run/rooms.ts";
import { RUN_SPEED, RunDirector, type RunFrame } from "../run/runDirector.ts";
import { RunScene } from "../run/runScene.ts";
import { buildRoom, type RoomBuild } from "../run/strip.ts";
import type { GameView } from "./view.ts";

export interface RunViewOptions {
  reducedMotion: boolean;
  /** SOLO SVILUPPO: inquadratura fissa, per confronto. */
  shot?: PresetKind;
  /** SOLO SVILUPPO: stanza mostrata al posto di quella della regia (`ID` o `bivio:ID`), per le anteprime. */
  preview?: string;
  /** SOLO TEST: istante fisso della corsa (s), inquadratura senza interpolazione. */
  fixedTime?: number;
}

export class RunView implements GameView {
  private readonly map: CityMap;
  private readonly layout: CityLayout;
  private readonly options: RunViewOptions;
  private readonly scene: RunScene;
  private readonly director: RunDirector;
  private readonly builds = new Map<string, RoomBuild>();
  private frame: RunFrame;
  private readonly canvas: HTMLCanvasElement;
  private builtSize = "";
  private questionOpen = false;
  private readonly previewRoom: Room | null;

  constructor(canvas: HTMLCanvasElement, map: CityMap, layout: CityLayout, state: GameState, options: RunViewOptions) {
    this.canvas = canvas;
    this.map = map;
    this.layout = layout;
    this.options = options;
    this.scene = new RunScene(canvas);
    this.director = new RunDirector(map, layout, state, options.shot ? { reducedMotion: options.reducedMotion, shot: options.shot } : { reducedMotion: options.reducedMotion });
    this.frame = this.director.getFrame();
    const preview = options.preview;
    this.previewRoom = !preview ? null : preview.startsWith("bivio:") && map.options[preview.slice(6)] ? junctionRoomOf(map, preview.slice(6)) : map.cells[preview] ? roomOf(map, layout, preview) : null;
  }

  get busy(): boolean {
    return this.director.busy;
  }
  get activePlayerId(): string {
    return this.frame.activePlayerId;
  }
  get pawns(): Readonly<Record<string, Vec3>> {
    return Object.fromEntries(Object.entries(this.frame.cells).map(([id, cell]) => [id, this.layout.positions[cell]!]));
  }
  get fade(): number {
    return this.frame.fade;
  }
  get suppressPanels(): boolean {
    return false;
  }
  get label(): string {
    return `scena di corsa · stanza ${this.room().kind}, ${this.room().slope}${this.options.shot ? ` · camera fissa ${this.options.shot}` : ""}`;
  }

  enqueue(events: readonly GameEvent[], stateAfter: GameState): void {
    this.director.enqueue(events, stateAfter);
  }
  update(seconds: number): void {
    this.director.setQuestionOpen(this.questionOpen);
    this.frame = this.director.update(this.options.fixedTime === undefined ? seconds : 0);
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
  setQuestionOpen(open: boolean): void {
    this.questionOpen = open;
  }
  toggleMode(): void {}

  private room(): Room {
    return this.previewRoom ?? this.frame.room;
  }

  private buildFor(room: Room): RoomBuild {
    let build = this.builds.get(room.key);
    if (!build) this.builds.set(room.key, (build = buildRoom(this.map.seed, room)));
    return build;
  }

  forkAnchor(cellId: string, to: string): { x: number; y: number } | null {
    if (this.frame.room.key !== `bivio:${cellId}`) return null;
    const door = this.scene.doors()[this.director.junctionDoors(cellId).indexOf(to)];
    return door ? this.scene.project(door) : null;
  }

  draw(_seconds: number, state: GameState, inset: number): void {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    const size = `${width}x${height}`;
    if (size !== this.builtSize) {
      this.scene.resize(width, height);
      this.builtSize = size;
    }
    const room = this.room();
    this.scene.setRoom(this.buildFor(room));
    const index = new Map(state.players.map((p, i) => [p.id, i]));
    const runners = this.previewRoom ? [this.frame.activePlayerId] : this.frame.runners;
    this.scene.setRunners(runners.map((id) => ({ id, index: index.get(id)!, active: id === this.frame.activePlayerId })));
    const fixed = this.options.fixedTime;
    const still = fixed !== undefined || this.previewRoom !== null;
    // Anteprima o istante fisso: inquadratura esatta della stanza, senza interpolazione.
    const question = this.questionOpen && !this.director.busy;
    this.scene.setCameraPose(still ? poseFor(this.options.shot ? PRESETS[this.options.shot] : room.shot, { question }) : this.frame.camera);
    this.scene.setBottomInset(inset);
    const presented = fixed !== undefined ? { ...this.frame, distance: fixed * RUN_SPEED.normal, approach: 0, advance: 0, door: null, running: true } : this.frame;
    this.scene.apply(this.previewRoom ? { ...presented, approach: 0, advance: 0, door: null } : presented);
    this.scene.render();
  }

  debug(): Record<string, unknown> {
    const room = this.room();
    return {
      view: "corsa",
      room: { key: room.key, kind: room.kind, slope: room.slope, size: room.size, cellId: room.cellId },
      runners: [...this.frame.runners],
      distance: this.frame.distance,
      approach: this.frame.approach,
      advance: this.frame.advance,
      door: this.frame.door,
      running: this.frame.running,
      presentedCells: { ...this.frame.cells },
      pawns: this.pawns,
    };
  }
}
