/**
 * Renderer della scena di corsa, graybox (specifica §6). Disegna la stanza e i
 * corridori secondo la presentazione della regia (RunFrame); non conosce stato
 * né mappa.
 *
 * - Stanze ripetute: copie della striscia a passo PERIOD, spostate in quota se
 *   la stanza è in pendenza; lo scorrimento segue l'inclinazione.
 * - Stanze con parete di fondo (bivio, uscita): la stanza si avvicina finché il
 *   corridore si ferma davanti alle porte; poi il corridore entra in quella
 *   scelta.
 * Il personaggio è provvisorio: volumi semplici con un ciclo di corsa
 * schematico, in attesa dei modelli definitivi.
 */
import * as THREE from "three";
import type { Vec3 } from "../layout/types.ts";
import { kitMeshes } from "../render/instancing.ts";
import { applyBottomInset } from "../render/viewOffset.ts";
import { playerColor } from "../ui/palette.ts";
import type { CameraPose } from "./camera.ts";
import { EXIT_ADVANCE, type RunFrame } from "./runDirector.ts";
import { STRIP, type RoomBuild } from "./strip.ts";

/** Lunghezza del passo: divide il periodo, così la corsa nelle stanze ripetute è periodica. */
export const STRIDE = STRIP.period / 24;
/** Copie della striscia attorno al corridore: coprono ciò che le inquadrature vedono prima della nebbia. */
const COPIES = [-3, -2, -1, 0, 1, 2, 3, 4];
/** Distanza della parete di fondo all'inizio dell'avvicinamento, oltre quella di arresto. */
const APPROACH = 24;
const BACKGROUND = 0x15161a;

interface Runner {
  group: THREE.Group;
  legs: [THREE.Object3D, THREE.Object3D];
  arms: [THREE.Object3D, THREE.Object3D];
  body: THREE.Object3D;
  ring: THREE.Object3D;
  slot: number;
}

export class RunScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.3, 400);
  private readonly world = new THREE.Group();
  private readonly runners = new Map<string, Runner>();
  private build: RoomBuild | null = null;
  private readonly box = new THREE.BoxGeometry(1, 1, 1);
  private readonly cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  private readonly materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.04 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x70757d, roughness: 0.45, metalness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2f3136, roughness: 0.9, metalness: 0.1 }),
  };
  private readonly gate = new THREE.MeshStandardMaterial({ color: 0x1d3a28, emissive: 0x39ff88, emissiveIntensity: 1.2 });

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(BACKGROUND);
    // Nebbia profonda: la megastruttura si perde in lontananza (specifica §6).
    this.scene.fog = new THREE.Fog(BACKGROUND, 30, 190);
    this.scene.add(new THREE.HemisphereLight(0xb8c0cc, 0x2a2018, 1.2));
    const sun = new THREE.DirectionalLight(0xffe2c0, 2.0);
    sun.position.set(-30, 80, 40);
    this.scene.add(sun, this.world);
  }

  /** Stanza da mostrare: ricostruita solo quando cambia. */
  setRoom(build: RoomBuild): void {
    if (this.build?.room.key === build.room.key) return;
    this.build = build;
    for (const child of [...this.world.children]) {
      this.world.remove(child);
      child.traverse((o) => o instanceof THREE.InstancedMesh && o.dispose());
    }
    const kit = { box: this.box, cylinder: this.cylinder, materials: this.materials };
    const copies = build.periodic ? COPIES : [0];
    for (const k of copies) {
      const copy = new THREE.Group();
      copy.position.set(k * STRIP.period, k * STRIP.period * Math.tan(build.angle), 0);
      for (const mesh of kitMeshes(build.primitives, kit)) copy.add(mesh);
      this.world.add(copy);
    }
    // Uscita: il passaggio luminoso.
    if (build.room.kind === "uscita") {
      for (const door of build.doors) {
        const light = new THREE.Mesh(this.box, this.gate);
        light.scale.set(0.2, 3.4, 2.2);
        light.position.set(door.x - 1.4, 1.7, door.z);
        this.world.add(light);
      }
    }
  }

  /** Corridori nella scena (id e indice del giocatore); il primo è in primo piano. */
  setRunners(runners: readonly { id: string; index: number; active: boolean }[]): void {
    const wanted = new Set(runners.map((r) => r.id));
    for (const [id, runner] of this.runners) {
      if (wanted.has(id)) continue;
      this.scene.remove(runner.group);
      this.runners.delete(id);
    }
    runners.forEach((r, slot) => {
      let runner = this.runners.get(r.id);
      if (!runner) {
        runner = this.makeRunner(r.index);
        this.runners.set(r.id, runner);
        this.scene.add(runner.group);
      }
      runner.slot = slot;
      runner.ring.visible = r.active;
    });
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setCameraPose(pose: CameraPose): void {
    this.camera.position.set(...pose.position);
    this.camera.fov = pose.fov;
    this.camera.lookAt(...pose.target);
    this.camera.updateProjectionMatrix();
  }

  /** Il pannello in basso non copre il corridore: l'inquadratura si centra nell'area libera, come nella città. */
  setBottomInset(pixels: number): void {
    applyBottomInset(this.camera, this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, pixels);
  }

  /** Applica la presentazione: scorrimento o avvicinamento della stanza, posizione e posa dei corridori. */
  apply(frame: Pick<RunFrame, "distance" | "approach" | "advance" | "door" | "running">): void {
    const build = this.build!;
    const tan = Math.tan(build.angle);
    const offset = ((frame.distance % STRIP.period) + STRIP.period) % STRIP.period;
    if (build.periodic) this.world.position.set(-offset, -offset * tan, 0);
    else this.world.position.set(frame.approach * APPROACH, 0, 0);
    for (const runner of this.runners.values()) {
      const lead = runner.slot === 0;
      let x = lead ? 0 : -0.9 * runner.slot,
        y = lead ? 0 : -0.9 * runner.slot * tan,
        z = lead ? 0 : -0.75 * runner.slot;
      if (lead && frame.advance > 0) {
        // Uscita dalla stanza (in avanti, lungo la pendenza) o ingresso nella porta scelta.
        const door: Vec3 | undefined = frame.door !== null ? build.doors[frame.door] : undefined;
        if (door) {
          x = (door.x + 1.5) * frame.advance;
          z = door.z * Math.min(1, frame.advance * 1.4);
        } else {
          x = EXIT_ADVANCE * frame.advance;
          y = x * tan;
        }
      }
      runner.group.position.set(x, y, z);
      runner.group.visible = !(lead && frame.door !== null && frame.advance >= 0.98);
      const stride = (offset + (lead ? frame.advance * EXIT_ADVANCE : 0)) / STRIDE + runner.slot * 0.37;
      this.pose(runner, frame.running ? stride * Math.PI * 2 : null);
    }
  }

  /** Coordinate in pixel CSS di un punto della stanza (porte del bivio), o null se fuori dall'inquadratura. */
  project(p: Vec3): { x: number; y: number } | null {
    const v = new THREE.Vector3(p.x, p.y, p.z).add(this.world.position).project(this.camera);
    if (v.z < -1 || v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
    const canvas = this.renderer.domElement;
    return { x: ((v.x + 1) / 2) * canvas.clientWidth, y: ((1 - v.y) / 2) * canvas.clientHeight };
  }

  /** Posizione delle porte della stanza (bivio), per agganciarvi i numeri delle alternative. */
  doors(): Vec3[] {
    return this.build?.doors.map((d) => ({ x: d.x, y: 3.8, z: d.z })) ?? [];
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private makeRunner(index: number): Runner {
    const colour = playerColor(index);
    const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, emissive: colour, emissiveIntensity: 0.2 });
    const group = new THREE.Group();
    const body = new THREE.Group();
    const torso = new THREE.Mesh(this.box, material);
    torso.scale.set(0.42, 0.62, 0.3);
    torso.position.y = 1.18;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), material);
    head.position.y = 1.68;
    body.add(torso, head);
    const limb = (x: number, y: number, z: number, length: number, width: number): THREE.Object3D => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      const part = new THREE.Mesh(this.box, material);
      part.scale.set(width, length, width);
      part.position.y = -length / 2;
      pivot.add(part);
      body.add(pivot);
      return pivot;
    };
    const legs: [THREE.Object3D, THREE.Object3D] = [limb(0, 0.88, 0.1, 0.86, 0.15), limb(0, 0.88, -0.1, 0.86, 0.15)];
    const arms: [THREE.Object3D, THREE.Object3D] = [limb(0, 1.44, 0.26, 0.6, 0.11), limb(0, 1.44, -0.26, 0.6, 0.11)];
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    group.add(body, ring);
    return { group, legs, arms, body, ring, slot: 0 };
  }

  /** Ciclo di corsa schematico (angolo della fase), oppure in piedi da fermo (null). */
  private pose(runner: Runner, angle: number | null): void {
    const swing = angle === null ? 0 : Math.sin(angle);
    runner.legs[0].rotation.z = swing * 0.75;
    runner.legs[1].rotation.z = -swing * 0.75;
    runner.arms[0].rotation.z = -swing * 0.8;
    runner.arms[1].rotation.z = swing * 0.8;
    runner.body.position.y = angle === null ? 0 : Math.abs(Math.cos(angle)) * 0.08;
    runner.body.rotation.z = angle === null ? 0 : -0.12;
  }
}
