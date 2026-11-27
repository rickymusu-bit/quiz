/**
 * Renderer della scena di corsa, prototipo graybox (specifica §6): il
 * giocatore corre sul posto all'origine, verso +X, mentre la striscia della
 * sua casella scorre verso −X e si ripete con periodo STRIP.period.
 *
 * Quattro inquadrature da confrontare prima di scegliere (decisione aperta
 * della specifica): laterale, laterale angolata, tre quarti, alle spalle.
 * Il personaggio è provvisorio: volumi semplici con un ciclo di corsa
 * schematico, in attesa dei modelli definitivi.
 */
import * as THREE from "three";
import type { Primitive } from "../kit/kit.ts";
import { kitMeshes } from "../render/instancing.ts";
import { applyBottomInset } from "../render/viewOffset.ts";
import { ABYSS_Y } from "../scene/dimensions.ts";
import { playerColor } from "../ui/palette.ts";
import { STRIP } from "./strip.ts";

export type RunCamera = "laterale" | "angolata" | "trequarti" | "spalle";
export const RUN_CAMERAS: readonly RunCamera[] = ["laterale", "angolata", "trequarti", "spalle"];

/** Posizione della camera e punto guardato, rispetto al corridore all'origine. */
export const CAMERA_SHOTS: Readonly<Record<RunCamera, { position: [number, number, number]; target: [number, number, number]; fov: number }>> = {
  laterale: { position: [1.5, 1.5, 11], target: [1.5, 1.1, 0], fov: 40 },
  angolata: { position: [5.6, 2.6, 10.2], target: [1.6, 1.0, 0], fov: 40 },
  trequarti: { position: [8.4, 7.2, 9.0], target: [1.2, 0.6, 0], fov: 40 },
  spalle: { position: [-6.5, 3.0, 1.2], target: [6, 1.3, 0], fov: 55 },
};

/** Velocità di corsa (unità/s) e lunghezza del passo: il ciclo del passo divide il periodo, così tutta la scena è periodica. */
export const RUN = Object.freeze({ speed: 6, stride: STRIP.period / 24 });
/** Copie della striscia da −2 a +3 periodi: coprono ciò che le quattro camere vedono prima della nebbia. */
const COPIES = [-2, -1, 0, 1, 2, 3];
const BACKGROUND = 0x17181c;

interface Runner {
  group: THREE.Group;
  legs: [THREE.Object3D, THREE.Object3D];
  arms: [THREE.Object3D, THREE.Object3D];
  body: THREE.Object3D;
  phase: number;
}

export class RunScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.3, 200);
  private readonly world = new THREE.Group();
  private readonly runners: Runner[] = [];
  private readonly box = new THREE.BoxGeometry(1, 1, 1);
  private readonly cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  private readonly materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.04 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x70757d, roughness: 0.45, metalness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2f3136, roughness: 0.9, metalness: 0.1 }),
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(BACKGROUND);
    this.scene.fog = new THREE.Fog(BACKGROUND, 18, 70);
    this.scene.add(new THREE.HemisphereLight(0xb8c0cc, 0x2a2018, 1.2));
    const sun = new THREE.DirectionalLight(0xffe2c0, 2.2);
    sun.position.set(-20, 40, 25);
    this.scene.add(sun, this.world);
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 1 }));
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = ABYSS_Y;
    this.scene.add(abyss);
  }

  /** Scenario della casella: copie affiancate della striscia periodica. */
  setStrip(primitives: readonly Primitive[]): void {
    for (const child of [...this.world.children]) {
      this.world.remove(child);
      child.traverse((o) => o instanceof THREE.InstancedMesh && o.dispose());
    }
    for (const k of COPIES) {
      const copy = new THREE.Group();
      copy.position.x = k * STRIP.period;
      for (const mesh of kitMeshes(primitives, { box: this.box, cylinder: this.cylinder, materials: this.materials })) copy.add(mesh);
      this.world.add(copy);
    }
  }

  /** Corridori: il primo è il giocatore di turno; gli altri nella stessa casella corrono affiancati, un po' più indietro. */
  setRunners(indices: readonly number[]): void {
    for (const runner of this.runners.splice(0)) this.scene.remove(runner.group);
    indices.forEach((index, slot) => {
      const runner = this.makeRunner(index, slot === 0);
      runner.group.position.set(slot === 0 ? 0 : -0.9 * slot, 0, slot === 0 ? 0 : -0.75 * slot);
      runner.phase = slot * 0.37;
      this.runners.push(runner);
      this.scene.add(runner.group);
    });
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setCamera(kind: RunCamera): void {
    const shot = CAMERA_SHOTS[kind];
    this.camera.position.set(...shot.position);
    this.camera.fov = shot.fov;
    this.camera.lookAt(...shot.target);
    this.camera.updateProjectionMatrix();
  }

  /** Il pannello in basso non copre il corridore: l'inquadratura si centra nell'area libera, come nella città. */
  setBottomInset(pixels: number): void {
    applyBottomInset(this.camera, this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, pixels);
  }

  /**
   * Distanza percorsa `distance` (unità di scena): scorrimento della striscia e
   * fase del passo. Due distanze che differiscono di un periodo danno la stessa immagine.
   */
  setDistance(distance: number): void {
    const offset = ((distance % STRIP.period) + STRIP.period) % STRIP.period;
    this.world.position.x = -offset;
    for (const runner of this.runners) this.pose(runner, (offset / RUN.stride + runner.phase) * Math.PI * 2);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private makeRunner(index: number, active: boolean): Runner {
    const colour = playerColor(index);
    const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, emissive: colour, emissiveIntensity: active ? 0.3 : 0.08 });
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
    group.add(body);
    if (active) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.04;
      group.add(ring);
    }
    return { group, legs, arms, body, phase: 0 };
  }

  /** Ciclo di corsa schematico: gambe e braccia in opposizione, rimbalzo e inclinazione in avanti. */
  private pose(runner: Runner, angle: number): void {
    const swing = Math.sin(angle);
    runner.legs[0].rotation.z = swing * 0.75;
    runner.legs[1].rotation.z = -swing * 0.75;
    runner.arms[0].rotation.z = -swing * 0.8;
    runner.arms[1].rotation.z = swing * 0.8;
    runner.body.position.y = Math.abs(Math.cos(angle)) * 0.08;
    runner.body.rotation.z = -0.12;
  }
}
