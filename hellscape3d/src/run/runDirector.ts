/**
 * Regia della scena di corsa (specifica §6). Riceve gli eventi del motore e
 * decide che cosa mostrare; non tocca lo stato di gioco.
 *
 * - Risposta errata: il giocatore continua a correre nella sua stanza.
 * - Dado: il personaggio accelera ed esce dalla stanza. La stanza d'arrivo resta
 *   nascosta, salvo:
 *   - bivio attraversato: stanza di passaggio, arresto davanti alle porte,
 *     scelta (pannello del bivio), ingresso nella porta scelta;
 *   - evento all'arrivo (casella speciale): stanza d'arrivo e risoluzione;
 *   - uscita raggiunta: stanza d'uscita e fine della partita.
 * - Turno successivo: la scena passa alla stanza del giocatore di turno; se è
 *   la stessa stanza mostrata, non cambia.
 * - Inquadratura scelta con la stanza, più vicina con la domanda aperta; cambi
 *   morbidi, e per stacco con il movimento ridotto.
 */
import { BAFOMETTO_LINES, type BafomettoMoment } from "../director/bafometto.ts";
import type { Announcement } from "../director/director.ts";
import type { CityLayout } from "../layout/types.ts";
import type { GameEvent, GameState } from "../logic/state.ts";
import type { CityMap } from "../logic/types.ts";
import { blendPose, poseFor, PRESETS, type CameraPose, type PresetKind } from "./camera.ts";
import { junctionRoomOf, roomOf, type Room } from "./rooms.ts";

/** Velocità di corsa (unità/s): ordinaria, con la domanda aperta, in uscita dalla stanza. */
export const RUN_SPEED = Object.freeze({ normal: 6, question: 3, exit: 16 });

export const RUN_TIMING = Object.freeze({
  /** Dissolvenza di un cambio di stanza: metà verso il buio, metà verso la nuova stanza. */
  cut: 0.6,
  exit: 1.4,
  approach: 1.0,
  door: 1.0,
  event: 1.8,
  end: 2.6,
  intro: 2.4,
  /** Costante di tempo dei cambi di inquadratura (s). */
  camera: 0.5,
});

/** Distanza percorsa dal corridore in primo piano quando esce dalla stanza o entra in una porta. */
export const EXIT_ADVANCE = 28;

export interface RunFrame {
  room: Room;
  /** Giocatori nella scena: il primo è in primo piano. */
  runners: string[];
  activePlayerId: string;
  /** Distanza di scorrimento delle stanze ripetute. */
  distance: number;
  /** Avvicinamento alla parete di fondo (stanze con porte): 1 lontano, 0 fermo davanti alle porte. */
  approach: number;
  /** Avanzamento del corridore in primo piano (uscita dalla stanza o ingresso nella porta), da 0 a 1. */
  advance: number;
  /** Porta verso cui corre il corridore in primo piano. */
  door: number | null;
  /** Il corridore in primo piano corre (falso solo da fermo davanti alle porte). */
  running: boolean;
  camera: CameraPose;
  fade: number;
  /** Casella mostrata di ogni giocatore, per il radar. */
  cells: Record<string, string>;
}

interface Clip {
  duration: number;
  begin: (frame: RunFrame) => void;
  apply: (frame: RunFrame, u: number) => void;
}

export interface RunDirectorOptions {
  reducedMotion?: boolean;
  /** Solo sviluppo: inquadratura fissa, per confronto. */
  shot?: PresetKind;
}

const ease = (t: number): number => t * t * (3 - 2 * t);

export class RunDirector {
  private readonly map: CityMap;
  private readonly layout: CityLayout;
  private readonly reducedMotion: boolean;
  private readonly shot: PresetKind | undefined;
  private readonly frame: RunFrame;
  private readonly queue: Clip[] = [];
  private current: Clip | null = null;
  private elapsed = 0;
  private questionOpen = false;
  private speed: number = RUN_SPEED.normal;
  private readonly announcements: Announcement[] = [];
  private readonly rooms = new Map<string, Room>();

  constructor(map: CityMap, layout: CityLayout, state: GameState, options: RunDirectorOptions = {}) {
    this.map = map;
    this.layout = layout;
    this.reducedMotion = options.reducedMotion ?? false;
    this.shot = options.shot;
    const active = state.players[state.activeIndex]!;
    // Partita aperta (o ripresa) in attesa della scelta al bivio: la scena è quella a regia conclusa,
    // nella stanza del bivio con il corridore fermo davanti alle porte.
    const atFork = state.phase === "fork";
    const room = atFork ? this.junctionRoom(active.cellId) : this.cellRoom(active.cellId);
    this.frame = {
      room,
      runners: atFork ? [active.id] : this.runnersIn(state, active.cellId, active.id),
      activePlayerId: active.id,
      distance: 0,
      approach: 0,
      advance: 0,
      door: null,
      running: !atFork,
      camera: this.pose(room),
      fade: 0,
      cells: Object.fromEntries(state.players.map((p) => [p.id, p.cellId])),
    };
  }

  get busy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  getFrame(): RunFrame {
    return structuredClone(this.frame);
  }

  takeAnnouncements(): Announcement[] {
    return this.announcements.splice(0);
  }

  /** La domanda è visibile: corsa rallentata e camera più vicina. */
  setQuestionOpen(open: boolean): void {
    this.questionOpen = open;
  }

  /** Intervento d'apertura di Bafometto, nella stanza di partenza. */
  intro(): void {
    this.queue.push(this.holdClip(RUN_TIMING.intro, () => this.announce("intro")));
  }

  /** Accoda la presentazione degli eventi prodotti da un'azione del motore. */
  enqueue(events: readonly GameEvent[], stateAfter: GameState): void {
    for (const event of events) {
      switch (event.type) {
        case "diceRolled":
          this.queue.push(this.exitClip(event.playerId));
          break;
        case "branchChoiceRequested": {
          const room = this.junctionRoom(event.cellId);
          this.queue.push(this.cutClip(room, [event.playerId], event.playerId, { [event.playerId]: event.cellId }, 1), this.approachClip());
          break;
        }
        case "branchChosen":
          this.queue.push(this.doorClip(this.junctionDoors(event.cellId).indexOf(event.to)));
          break;
        case "arrived":
          if (event.cellId === this.map.exitId) {
            this.queue.push(this.cutClip(this.cellRoom(event.cellId), [event.playerId], event.playerId, { [event.playerId]: event.cellId }, 1), this.approachClip(), this.doorClip(0));
          } else if (event.special) {
            const moment: BafomettoMoment | null = event.special === "terminale" ? "terminal" : null;
            this.queue.push(
              this.cutClip(this.cellRoom(event.cellId), [event.playerId], event.playerId, { [event.playerId]: event.cellId }, 0),
              this.holdClip(RUN_TIMING.event, () => moment && this.announce(moment)),
            );
          }
          break;
        case "gameEnded":
          this.queue.push(this.holdClip(RUN_TIMING.end, () => this.announce("end")));
          break;
        case "turnStarted":
          this.queue.push(this.turnClip(event.playerId, stateAfter));
          break;
        default:
          break;
      }
    }
  }

  /** Avanza di `seconds`; la corsa scorre anche a regia ferma. */
  update(seconds: number): RunFrame {
    let left = Math.max(0, seconds);
    const step = Math.min(left, 0.25);
    while (true) {
      if (!this.current) {
        const next = this.queue.shift();
        if (!next) break;
        this.current = next;
        this.elapsed = 0;
        next.begin(this.frame);
      }
      const clip = this.current;
      const remaining = clip.duration - this.elapsed;
      if (left < remaining) {
        this.elapsed += left;
        clip.apply(this.frame, this.elapsed / clip.duration);
        left = 0;
        break;
      }
      left -= remaining;
      clip.apply(this.frame, 1);
      this.current = null;
    }
    this.flow(step);
    return this.getFrame();
  }

  /** Salta la regia in coda: la presentazione raggiunge subito lo stato. */
  skip(): RunFrame {
    let guard = 0;
    while (this.busy && guard++ < 1000) this.update(1e6);
    return this.getFrame();
  }

  /** Scorrimento della corsa e inquadratura, fuori dalle clip. */
  private flow(seconds: number): void {
    const question = this.questionOpen && !this.busy;
    const target = this.frame.advance > 0 && this.frame.door === null ? RUN_SPEED.exit : question ? RUN_SPEED.question : RUN_SPEED.normal;
    this.speed = this.reducedMotion ? 0 : this.speed + (target - this.speed) * Math.min(1, seconds * 4);
    if (this.frame.running && this.frame.room.kind !== "bivio" && this.frame.room.kind !== "uscita") this.frame.distance += this.speed * seconds;
    const pose = this.pose(this.frame.room, question);
    this.frame.camera = this.reducedMotion ? pose : blendPose(this.frame.camera, pose, Math.min(1, seconds / RUN_TIMING.camera));
  }

  private pose(room: Room, question = false): CameraPose {
    return poseFor(this.shot ? PRESETS[this.shot] : room.shot, { question });
  }

  private time(seconds: number): number {
    return this.reducedMotion ? 0 : seconds;
  }

  private announce(moment: BafomettoMoment): void {
    this.announcements.push({ moment, text: BAFOMETTO_LINES[moment] });
  }

  private cellRoom(cellId: string): Room {
    let room = this.rooms.get(cellId);
    if (!room) this.rooms.set(cellId, (room = roomOf(this.map, this.layout, cellId)));
    return room;
  }

  private junctionRoom(cellId: string): Room {
    const key = `bivio:${cellId}`;
    let room = this.rooms.get(key);
    if (!room) this.rooms.set(key, (room = junctionRoomOf(this.map, cellId)));
    return room;
  }

  /** Porte della stanza del bivio, nell'ordine del pannello: dal ramo più breve al più lungo. */
  junctionDoors(cellId: string): string[] {
    const order = { "piu-breve": 0, intermedio: 1, "piu-lungo": 2 } as const;
    return [...this.map.options[cellId]!].sort((a, b) => order[a.relative] - order[b.relative]).map((o) => o.to);
  }

  /** Giocatori nella casella, con quello indicato per primo. */
  private runnersIn(state: GameState, cellId: string, first: string): string[] {
    const here = state.players.filter((p) => p.cellId === cellId && !p.escaped).map((p) => p.id);
    return [first, ...here.filter((id) => id !== first)].filter((id, i, all) => all.indexOf(id) === i && here.includes(id));
  }

  private holdClip(seconds: number, begin: () => void = () => {}): Clip {
    return { duration: this.time(seconds), begin, apply: () => {} };
  }

  /**
   * Cambio di stanza con dissolvenza: a metà, nel buio, la scena passa alla
   * nuova stanza e la camera alla sua inquadratura.
   */
  private cutClip(room: Room, runners: string[], active: string, cells: Record<string, string>, approach: number): Clip {
    let switched = false;
    const change = (frame: RunFrame): void => {
      if (switched) return;
      switched = true;
      Object.assign(frame, { room, runners, activePlayerId: active, approach, advance: 0, door: null, running: true });
      Object.assign(frame.cells, cells);
      frame.camera = this.pose(room);
    };
    return {
      duration: this.time(RUN_TIMING.cut),
      begin: () => {
        switched = false;
      },
      apply: (frame, u) => {
        if (this.reducedMotion || u >= 0.5) change(frame);
        frame.fade = this.reducedMotion || u >= 1 ? 0 : u < 0.5 ? u * 2 : (1 - u) * 2;
      },
    };
  }

  /** Il corridore in primo piano accelera ed esce dalla stanza; poi la scena resta senza di lui. */
  private exitClip(playerId: string): Clip {
    return {
      duration: this.time(RUN_TIMING.exit),
      begin: () => {},
      apply: (frame, u) => {
        frame.advance = ease(u);
        if (u >= 1) {
          frame.runners = frame.runners.filter((id) => id !== playerId);
          frame.advance = 0;
        }
      },
    };
  }

  /** Avvicinamento alla parete di fondo, fino all'arresto davanti alle porte. */
  private approachClip(): Clip {
    return {
      duration: this.time(RUN_TIMING.approach),
      begin: (frame) => {
        frame.approach = 1;
        frame.running = true;
      },
      apply: (frame, u) => {
        frame.approach = 1 - ease(u);
        if (u >= 1) frame.running = frame.room.kind !== "bivio";
      },
    };
  }

  /** Il corridore in primo piano corre verso la porta scelta e la attraversa. */
  private doorClip(door: number): Clip {
    return {
      duration: this.time(RUN_TIMING.door),
      begin: (frame) => {
        frame.door = door;
        frame.running = true;
      },
      apply: (frame, u) => {
        frame.advance = ease(u);
      },
    };
  }

  /**
   * Turno successivo: stanza della casella del giocatore di turno, con chi vi si
   * trova; nessun cambio se la scena mostra già quella stanza.
   */
  private turnClip(playerId: string, state: GameState): Clip {
    const player = state.players.find((p) => p.id === playerId)!;
    const room = this.cellRoom(player.cellId);
    const runners = this.runnersIn(state, player.cellId, playerId);
    const cells = Object.fromEntries(state.players.map((p) => [p.id, p.cellId]));
    const cut = this.cutClip(room, runners, playerId, cells, 0);
    let sameRoom = false;
    const clip: Clip = {
      duration: cut.duration,
      begin: (frame) => {
        sameRoom = frame.room.key === room.key;
        if (!sameRoom) return cut.begin(frame);
        // Stessa stanza: niente dissolvenza né attesa; chi è appena uscito non c'è più.
        clip.duration = 0;
        Object.assign(frame, { runners, activePlayerId: playerId });
        Object.assign(frame.cells, cells);
      },
      apply: (frame, u) => {
        if (!sameRoom) cut.apply(frame, u);
      },
    };
    return clip;
  }
}
