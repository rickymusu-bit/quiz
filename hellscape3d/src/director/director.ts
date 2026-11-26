/**
 * CameraDirector (specifica §6): traduce gli eventi del motore in una
 * sequenza di clip di presentazione (camminata delle pedine, inquadrature,
 * transizioni fra giocatori). È puro e indipendente da Three.js.
 *
 * Non modifica lo stato di gioco e non decide esiti: lo stato è già stato
 * calcolato dal motore quando le clip vengono accodate. Accelerare o saltare
 * le clip cambia soltanto ciò che si vede, e al termine la presentazione
 * coincide sempre con lo stato.
 *
 * Durante la presentazione le celle si rivelano quando la pedina le
 * raggiunge con lo sguardo, nello stesso ordine del motore.
 */
import { forwardWithin } from "../logic/graph.ts";
import type { GameEvent, GameState } from "../logic/state.ts";
import type { CityMap } from "../logic/types.ts";
import type { CityLayout, Vec3 } from "../layout/types.ts";
import { BAFOMETTO_LINES, seatPose, seatPosition, type BafomettoMoment } from "./bafometto.ts";

export interface CameraPose {
  target: Vec3;
  distance: number;
  /** Inclinazione in radianti sopra l'orizzonte. */
  pitch: number;
}

export interface Frame {
  pawns: Record<string, Vec3>;
  camera: CameraPose;
  /** Opacità della dissolvenza a nero, da 0 a 1. */
  fade: number;
  /** Celle esplorate già mostrate, ordinate: sempre un sottoinsieme di quelle dello stato. */
  explored: string[];
  /** Giocatore attivo secondo la presentazione (può seguire di qualche istante lo stato). */
  activePlayerId: string;
  /** Manifestazione di Bafometto in corso: nella sede o su un terminale locale. */
  bafometto: BafomettoPresence | null;
}

export type BafomettoPresence = { kind: "seat" } | { kind: "terminal"; cellId: string };

/** Battuta di Bafometto da mostrare nell'interfaccia; prodotta anche con il movimento ridotto. */
export interface Announcement {
  moment: BafomettoMoment;
  text: string;
}

export type TransitionKind = "near" | "district" | "far";

export interface DirectorOptions {
  reducedMotion?: boolean;
}

const deg = (d: number): number => (d * Math.PI) / 180;

/** Inquadrature di riferimento. I tempi sono obiettivi di prototipazione (§6). */
export const SHOTS = Object.freeze({
  ordinary: { distance: 38, pitch: deg(50) },
  question: { distance: 26, pitch: deg(40) },
  follow: { distance: 32, pitch: deg(48) },
  fork: { distance: 40, pitch: deg(56) },
  exit: { distance: 30, pitch: deg(38) },
});

export const TIMING = Object.freeze({
  /** Secondi per casella durante la camminata. */
  step: 0.32,
  question: 0.6,
  roll: 0.4,
  fork: 0.7,
  special: 0.5,
  exit: 1.2,
  /** Dissolvenza verso la sede e ritorno, per ciascun passaggio. */
  seatFade: 0.35,
  seatHold: 2.4,
  terminalHold: 1.6,
  transition: { near: 0.7, district: 1.25, far: 0.8 } as Readonly<Record<TransitionKind, number>>,
});

/** Distanza massima, in passi sulla rete esplorata, per una traslazione semplice. */
export const NEAR_STEPS = 4;
/** Distanza massima, nello stesso distretto, per l'allontanamento con traslazione. */
export const DISTRICT_STEPS = 12;

/**
 * Tipo di transizione fra due caselle, valutato solo sulla rete già mostrata:
 * vicini sulla stessa strada → traslazione; stesso distretto → allontanamento,
 * traslazione e avvicinamento; lontani o non collegati da zone esplorate → dissolvenza.
 */
export function classifyTransition(map: CityMap, explored: ReadonlySet<string>, fromId: string, toId: string): TransitionKind {
  if (fromId === toId) return "near";
  const neighbours = new Map<string, string[]>();
  for (const id of explored) {
    for (const to of map.cells[id]?.next ?? []) {
      if (!explored.has(to)) continue;
      (neighbours.get(id) ?? neighbours.set(id, []).get(id)!).push(to);
      (neighbours.get(to) ?? neighbours.set(to, []).get(to)!).push(id);
    }
  }
  const depth = new Map<string, number>([[fromId, 0]]);
  const queue = [fromId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === toId) break;
    for (const next of neighbours.get(id) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, depth.get(id)! + 1);
        queue.push(next);
      }
    }
  }
  const steps = depth.get(toId);
  if (steps === undefined) return "far";
  if (steps <= NEAR_STEPS) return "near";
  if (steps <= DISTRICT_STEPS && map.cells[fromId]!.district === map.cells[toId]!.district) return "district";
  return "far";
}

interface Clip {
  duration: number;
  /** Prepara la clip partendo dalla presentazione corrente. */
  begin(frame: Frame): void;
  /** Applica lo stato della clip all'avanzamento u ∈ [0, 1]. */
  apply(frame: Frame, u: number): void;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });
const ease = (t: number): number => t * t * (3 - 2 * t);
const clonePose = (pose: CameraPose): CameraPose => ({ target: { ...pose.target }, distance: pose.distance, pitch: pose.pitch });
const cloneFrame = (frame: Frame): Frame => ({
  pawns: Object.fromEntries(Object.entries(frame.pawns).map(([id, p]) => [id, { ...p }])),
  camera: clonePose(frame.camera),
  fade: frame.fade,
  explored: [...frame.explored],
  activePlayerId: frame.activePlayerId,
  bafometto: frame.bafometto ? { ...frame.bafometto } : null,
});

function addExplored(frame: Frame, ids: readonly string[]): void {
  if (ids.length === 0) return;
  const set = new Set(frame.explored);
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) {
      set.add(id);
      changed = true;
    }
  }
  if (changed) frame.explored = [...set].sort();
}

export class CameraDirector {
  private readonly map: CityMap;
  private readonly layout: CityLayout;
  private readonly reducedMotion: boolean;
  private frame: Frame;
  private readonly queue: Clip[] = [];
  private current: Clip | null = null;
  private elapsed = 0;
  private readonly announcements: Announcement[] = [];
  private readonly seat: Vec3;

  constructor(map: CityMap, layout: CityLayout, state: GameState, options: DirectorOptions = {}) {
    this.map = map;
    this.layout = layout;
    this.reducedMotion = options.reducedMotion ?? false;
    const active = state.players[state.activeIndex]!;
    this.frame = {
      pawns: Object.fromEntries(state.players.map((p) => [p.id, { ...this.at(p.cellId) }])),
      camera: { target: { ...this.at(active.cellId) }, ...SHOTS.ordinary },
      fade: 0,
      explored: [...state.explored],
      activePlayerId: active.id,
      bafometto: null,
    };
    this.seat = seatPosition(this.at(map.startId));
  }

  /** Posizione della sede di Bafometto (dipende solo dalla partenza). */
  get seatPosition(): Vec3 {
    return { ...this.seat };
  }

  /** Battute prodotte dalla regia dall'ultima chiamata. */
  takeAnnouncements(): Announcement[] {
    return this.announcements.splice(0);
  }

  /** Intervento d'apertura di Bafometto, dalla sua sede. */
  intro(): void {
    this.queue.push(this.seatClip("intro", (frame) => ({ target: { ...frame.pawns[frame.activePlayerId]! }, ...SHOTS.ordinary })));
  }

  get busy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  getFrame(): Frame {
    return cloneFrame(this.frame);
  }

  /** Accoda la presentazione degli eventi prodotti da un'azione del motore. */
  enqueue(events: readonly GameEvent[], stateAfter: GameState): void {
    const sight = stateAfter.rules.sightRange;
    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;
      switch (event.type) {
        case "turnStarted":
          this.queue.push(this.turnClip(event.playerId));
          break;
        case "questionRequested":
          this.queue.push(this.cameraClip(TIMING.question, (f) => ({ target: f.pawns[event.playerId]!, ...SHOTS.question })));
          break;
        case "diceRolled":
          this.queue.push(this.cameraClip(TIMING.roll, (f) => ({ target: f.pawns[event.playerId]!, ...SHOTS.follow })));
          break;
        case "moved": {
          const next = events[i + 1];
          const revealed = next?.type === "explored" ? next.cellIds : [];
          if (next?.type === "explored") i++;
          this.queue.push(this.walkClip(event.playerId, event.path, revealed, sight));
          break;
        }
        case "explored":
          this.queue.push(this.instantClip((f) => addExplored(f, event.cellIds)));
          break;
        case "branchChoiceRequested":
          this.queue.push(this.cameraClip(TIMING.fork, () => this.forkPose(event.cellId)));
          break;
        case "arrived":
          if (event.special === "terminale") this.queue.push(this.terminalClip(event.cellId));
          else if (event.special) this.queue.push(this.holdClip(TIMING.special));
          break;
        case "gameEnded": {
          const exitPose = (): CameraPose => ({ target: this.at(this.map.exitId), ...SHOTS.exit });
          this.queue.push(this.cameraClip(TIMING.exit, exitPose), this.seatClip("end", exitPose));
          break;
        }
        default:
          break;
      }
    }
  }

  /** Avanza di `seconds`. Restituisce la presentazione aggiornata. */
  update(seconds: number): Frame {
    let left = Math.max(0, seconds);
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
        clip.apply(this.frame, clip.duration === 0 ? 1 : this.elapsed / clip.duration);
        break;
      }
      left -= remaining;
      clip.apply(this.frame, 1);
      this.current = null;
    }
    return this.getFrame();
  }

  /** Salta tutta la regia in coda: la presentazione raggiunge subito lo stato. */
  skip(): Frame {
    return this.update(Number.POSITIVE_INFINITY);
  }

  private at(id: string): Vec3 {
    const position = this.layout.positions[id];
    if (!position) throw new Error(`Posizione mancante per ${id}`);
    return position;
  }

  private time(seconds: number): number {
    return this.reducedMotion ? 0 : seconds;
  }

  private instantClip(effect: (frame: Frame) => void): Clip {
    return { duration: 0, begin: () => {}, apply: (frame, u) => u >= 1 && effect(frame) };
  }

  private holdClip(seconds: number): Clip {
    return { duration: this.time(seconds), begin: () => {}, apply: () => {} };
  }

  /** Movimento di camera con interpolazione morbida verso una posa calcolata all'avvio. */
  private cameraClip(seconds: number, pose: (frame: Frame) => CameraPose): Clip {
    let from: CameraPose, to: CameraPose;
    return {
      duration: this.time(seconds),
      begin: (frame) => {
        from = clonePose(frame.camera);
        to = clonePose(pose(frame));
      },
      apply: (frame, u) => {
        const t = ease(u);
        frame.camera = { target: lerpVec(from.target, to.target, t), distance: lerp(from.distance, to.distance, t), pitch: lerp(from.pitch, to.pitch, t) };
      },
    };
  }

  /**
   * Intervento significativo: dissolvenza, inquadratura della sede, battuta,
   * dissolvenza e ritorno. Nessun tragitto della camera fra sede e giocatore.
   */
  private seatClip(moment: BafomettoMoment, back: (frame: Frame) => CameraPose): Clip {
    const fade = this.time(TIMING.seatFade);
    const hold = this.time(TIMING.seatHold);
    const total = 4 * fade + hold;
    let from: CameraPose, to: CameraPose;
    let announced = false;
    return {
      duration: total,
      begin: (frame) => {
        from = clonePose(frame.camera);
        to = back(frame);
        announced = false;
      },
      apply: (frame, u) => {
        const t = u * total;
        const announce = (): void => {
          if (announced) return;
          announced = true;
          this.announcements.push({ moment, text: BAFOMETTO_LINES[moment] });
        };
        if (total === 0 || u >= 1) {
          announce();
          frame.camera = clonePose(to);
          frame.fade = 0;
          frame.bafometto = null;
          return;
        }
        if (t < fade) {
          frame.fade = ease(t / fade);
          frame.camera = clonePose(from);
        } else if (t < 3 * fade + hold) {
          announce();
          frame.bafometto = { kind: "seat" };
          frame.camera = seatPose(this.seat);
          frame.fade = t < 2 * fade ? ease(1 - (t - fade) / fade) : t < 2 * fade + hold ? 0 : ease((t - 2 * fade - hold) / fade);
        } else {
          frame.bafometto = null;
          frame.camera = clonePose(to);
          frame.fade = ease(1 - (t - 3 * fade - hold) / fade);
        }
      },
    };
  }

  /** Scambio frequente: manifestazione locale sul terminale, senza passare dalla sede. */
  private terminalClip(cellId: string): Clip {
    const move = this.time(TIMING.question);
    const total = move + this.time(TIMING.terminalHold);
    let from: CameraPose;
    const to: CameraPose = { target: this.at(cellId), ...SHOTS.question };
    return {
      duration: total,
      begin: (frame) => {
        from = clonePose(frame.camera);
        frame.bafometto = { kind: "terminal", cellId };
        this.announcements.push({ moment: "terminal", text: BAFOMETTO_LINES.terminal });
      },
      apply: (frame, u) => {
        const t = ease(total === 0 ? 1 : Math.min(1, (u * total) / Math.max(move, 1e-9)));
        frame.camera = { target: lerpVec(from.target, to.target, t), distance: lerp(from.distance, to.distance, t), pitch: lerp(from.pitch, to.pitch, t) };
        frame.bafometto = u >= 1 ? null : { kind: "terminal", cellId };
      },
    };
  }

  /** Bivio: inquadratura delle sole alternative locali, già esplorate. */
  private forkPose(forkId: string): CameraPose {
    const points = [forkId, ...this.map.cells[forkId]!.next].map((id) => this.at(id));
    const centre = points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length, z: acc.z + p.z / points.length }), { x: 0, y: 0, z: 0 });
    return { target: centre, ...SHOTS.fork };
  }

  /** Cambio di giocatore attivo con la transizione adatta alla distanza (§6). */
  private turnClip(playerId: string): Clip {
    let kind: TransitionKind = "near";
    let from: CameraPose, to: CameraPose;
    let switchActive = false;
    const clip: Clip = {
      duration: 0,
      begin: (frame) => {
        switchActive = frame.activePlayerId !== playerId;
        const fromCell = this.cellAt(frame.pawns[frame.activePlayerId]!);
        const toCell = this.cellAt(frame.pawns[playerId]!);
        kind = switchActive ? classifyTransition(this.map, new Set(frame.explored), fromCell, toCell) : "near";
        clip.duration = switchActive ? this.time(TIMING.transition[kind]) : 0;
        from = clonePose(frame.camera);
        to = { target: { ...frame.pawns[playerId]! }, ...SHOTS.ordinary };
      },
      apply: (frame, u) => {
        if (u >= 0.5 || clip.duration === 0) frame.activePlayerId = playerId;
        if (kind === "far" && clip.duration > 0) {
          // Dissolvenza: buio, cambio di posizione fuori campo, riapertura. Nessun sorvolo della città.
          frame.fade = u < 0.5 ? ease(u / 0.5) : ease((1 - u) / 0.5);
          frame.camera = clonePose(u < 0.5 ? from : to);
          if (u >= 1) frame.fade = 0;
          return;
        }
        const t = ease(u);
        const lift = kind === "district" ? Math.sin(Math.PI * u) * 12 : 0;
        frame.camera = { target: lerpVec(from.target, to.target, t), distance: lerp(from.distance, to.distance, t) + lift, pitch: lerp(from.pitch, to.pitch, t) };
      },
    };
    return clip;
  }

  /** Camminata lungo le passerelle; le celle si rivelano allo stesso passo del motore. */
  private walkClip(playerId: string, path: readonly string[], revealed: readonly string[], sight: number): Clip {
    const pending = new Set(revealed);
    const revealAt: string[][] = path.map((cellId) => {
      const visible = forwardWithin(this.map.cells, cellId, sight).filter((id) => pending.has(id));
      for (const id of visible) pending.delete(id);
      return visible;
    });
    // Celle annunciate ma non attribuibili (non dovrebbe accadere): rivelate all'arrivo.
    if (pending.size > 0 && revealAt.length > 0) revealAt[revealAt.length - 1]!.push(...pending);
    const points: Vec3[] = [];
    let cameraFrom: CameraPose;
    return {
      duration: this.time(TIMING.step * path.length),
      begin: (frame) => {
        points.length = 0;
        points.push({ ...frame.pawns[playerId]! }, ...path.map((id) => this.at(id)));
        cameraFrom = clonePose(frame.camera);
      },
      apply: (frame, u) => {
        const progress = u * path.length;
        const index = Math.min(path.length - 1, Math.floor(progress));
        const position = u >= 1 ? points[points.length - 1]! : lerpVec(points[index]!, points[index + 1]!, progress - index);
        frame.pawns[playerId] = position;
        // Ogni casella è rivelata quando la pedina ha percorso metà del tratto che vi conduce.
        for (let k = 0; k < path.length; k++) if (progress >= k + 0.5 || u >= 1) addExplored(frame, revealAt[k]!);
        const blend = ease(Math.min(1, progress / 0.6));
        frame.camera = {
          target: lerpVec(cameraFrom.target, position, blend),
          distance: lerp(cameraFrom.distance, SHOTS.follow.distance, blend),
          pitch: lerp(cameraFrom.pitch, SHOTS.follow.pitch, blend),
        };
      },
    };
  }

  /** Casella corrispondente alla posizione di una pedina ferma. */
  private cellAt(position: Vec3): string {
    let best = "";
    let bestDistance = Infinity;
    for (const [id, p] of Object.entries(this.layout.positions)) {
      const d = Math.hypot(p.x - position.x, p.y - position.y, p.z - position.z);
      if (d < bestDistance) {
        bestDistance = d;
        best = id;
      }
    }
    return best;
  }
}
