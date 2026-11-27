/**
 * Renderer graybox della vista della città (strumento di sviluppo): volumi
 * neutri, nessun asset definitivo. Disegna esclusivamente il SceneModel
 * ricevuto; non conosce mappa né stato.
 */
import * as THREE from "three";
import type { Vec3 } from "../layout/types.ts";
import { buildKit, type Primitive } from "../kit/kit.ts";
import { ABYSS_Y, CAMERA_OPTICS, cameraPosition, fogRange, shadowExtent, SUN, WALKWAY, type CameraPose } from "../scene/dimensions.ts";
import type { SceneModel, SceneSegment } from "../scene/model.ts";
import { instancedMesh } from "./instancing.ts";
import { applyBottomInset } from "./viewOffset.ts";
import { playerColor } from "../ui/palette.ts";

export type CameraMode = "player" | "overview";

const BACKGROUND = 0x17181c;
const OVERVIEW_PITCH = THREE.MathUtils.degToRad(50);
const OVERVIEW_MIN_DISTANCE = 24;

export interface RenderStats {
  /** Primitive del kit modulare disegnate. */
  primitives: number;
  tiles: number;
  walkways: number;
  stubs: number;
  masses: number;
  players: number;
}

export class GrayboxRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(CAMERA_OPTICS.fov, 1, CAMERA_OPTICS.near, 400);
  private content = new THREE.Group();
  private sun = new THREE.DirectionalLight(0xffe2c0, 2.4);
  private stats: RenderStats = { primitives: 0, tiles: 0, walkways: 0, stubs: 0, masses: 0, players: 0 };
  private pawnLayer = new THREE.Group();
  private pawns = new Map<string, THREE.Group>();
  private readonly unitCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  /** Materiali del kit, con tinte neutre in attesa della direzione artistica. */
  private readonly kitMaterials: Readonly<Record<Primitive["material"], THREE.MeshStandardMaterial>> = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.04 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x70757d, roughness: 0.45, metalness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2f3136, roughness: 0.9, metalness: 0.1 }),
  };
  private readonly unitBox = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials = {
    stub: new THREE.MeshStandardMaterial({ color: 0x4a4d54, roughness: 0.9, transparent: true, opacity: 0.55 }),
    abyss: new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 1 }),
    gate: new THREE.MeshStandardMaterial({ color: 0x1d3a28, emissive: 0x39ff88, emissiveIntensity: 0.7 }),
    terminale: new THREE.MeshStandardMaterial({ color: 0x14201a, emissive: 0x3aff7a, emissiveIntensity: 0.5 }),
    evento: new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xff7a2a, emissiveIntensity: 0.6 }),
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(BACKGROUND);
    this.scene.fog = new THREE.Fog(BACKGROUND, 45, 120);
    this.scene.add(new THREE.HemisphereLight(0xb8c0cc, 0x2a2018, 1.1));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: SUN.shadowNear, far: SUN.shadowFar });
    this.scene.add(this.sun, this.sun.target, this.content, this.pawnLayer);
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), this.materials.abyss);
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = ABYSS_Y;
    this.scene.add(abyss);
  }

  getStats(): RenderStats {
    return { ...this.stats };
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Nuova vista presentata: scena statica (kit, segnali, portale, monconi) e pedine. */
  setModel(model: SceneModel, seed: string): void {
    this.disposeChildren(this.content);
    for (const tile of model.tiles) {
      if (tile.special) this.addSpecialMarker(tile.special, tile.position);
      if (tile.kind === "exit") this.addGate(tile.position);
    }
    this.addStubs(model.stubs);
    const kit = buildKit(model, seed);
    const groups = new Map<string, Primitive[]>();
    for (const primitive of kit.primitives) {
      const key = `${primitive.shape}|${primitive.material}`;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(primitive);
    }
    for (const [key, primitives] of groups) {
      const [shape, materialName] = key.split("|") as [Primitive["shape"], Primitive["material"]];
      const mesh = instancedMesh(primitives, shape === "box" ? this.unitBox : this.unitCylinder, this.kitMaterials[materialName], materialName === "concrete");
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.content.add(mesh);
    }
    this.disposeChildren(this.pawnLayer);
    this.pawns.clear();
    for (const player of model.players) this.pawns.set(player.id, this.addPlayer(player.index, player.active));
    this.setPawnPositions(Object.fromEntries(model.players.map((p) => [p.id, p.position])));
    this.stats = {
      primitives: kit.primitives.length,
      tiles: model.tiles.length,
      walkways: model.walkways.length,
      stubs: model.stubs.length,
      masses: model.masses.length,
      players: model.players.length,
    };
  }

  /** Posizioni delle pedine; quelle sulla stessa casella vengono affiancate. */
  setPawnPositions(positions: Readonly<Record<string, Vec3>>): void {
    const perCell = new Map<string, number>();
    for (const [id, group] of this.pawns) {
      const p = positions[id];
      if (!p) continue;
      const key = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
      const slot = perCell.get(key) ?? 0;
      perCell.set(key, slot + 1);
      const offset = slot === 0 ? 0 : (slot % 2 === 1 ? 1 : -1) * 0.7 * Math.ceil(slot / 2);
      group.position.set(p.x + offset, p.y, p.z + offset);
    }
  }

  /** Inquadratura sul giocatore di turno; la direzione resta quella della vista a tre quarti. */
  setCameraPose(pose: CameraPose): void {
    this.placeCamera(new THREE.Vector3(pose.target.x, pose.target.y, pose.target.z), pose.distance, pose.pitch);
  }

  /** Panoramica sulle sole caselle visibili. */
  frameOverview(model: SceneModel): void {
    const box = new THREE.Box3();
    for (const tile of model.tiles) box.expandByPoint(new THREE.Vector3(tile.position.x, tile.position.y, tile.position.z));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * this.camera.aspect);
    const distance = Math.max(OVERVIEW_MIN_DISTANCE, (sphere.radius + 4) / Math.sin(Math.min(vertical, horizontal)));
    this.placeCamera(sphere.center, distance, OVERVIEW_PITCH);
  }

  /**
   * Riserva `pixels` in basso (pannello dell'interfaccia): il punto inquadrato
   * resta al centro dell'area libera. Inquadratura decentrata, senza spostare
   * la camera né deformare l'immagine.
   */
  setBottomInset(pixels: number): void {
    applyBottomInset(this.camera, this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight, pixels);
  }

  /** Coordinate in pixel CSS di un punto della scena; null se dietro la camera o fuori dall'inquadratura. */
  project(p: Vec3): { x: number; y: number } | null {
    const v = new THREE.Vector3(p.x, p.y, p.z).project(this.camera);
    if (v.z < -1 || v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
    const canvas = this.renderer.domElement;
    return { x: ((v.x + 1) / 2) * canvas.clientWidth, y: ((1 - v.y) / 2) * canvas.clientHeight };
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private addShadowed(...meshes: THREE.Mesh[]): void {
    for (const mesh of meshes) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.content.add(mesh);
    }
  }

  /** Monconi di passerella verso la nebbia: semplici e scuri, fuori dal kit. */
  private addStubs(segments: readonly SceneSegment[]): void {
    if (segments.length === 0) return;
    const axis = new THREE.Vector3(1, 0, 0);
    const mesh = new THREE.InstancedMesh(this.unitBox, this.materials.stub, segments.length);
    const matrix = new THREE.Matrix4();
    segments.forEach((segment, i) => {
      const a = new THREE.Vector3(segment.a.x, segment.a.y - WALKWAY.thickness, segment.a.z);
      const b = new THREE.Vector3(segment.b.x, segment.b.y - WALKWAY.thickness, segment.b.z);
      const direction = b.clone().sub(a);
      const length = direction.length();
      const rotation = new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize());
      mesh.setMatrixAt(i, matrix.compose(a.clone().add(b).multiplyScalar(0.5), rotation, new THREE.Vector3(length, WALKWAY.thickness, WALKWAY.width)));
    });
    mesh.castShadow = true;
    this.content.add(mesh);
  }

  private addSpecialMarker(kind: string, p: Vec3): void {
    const material = kind === "terminale" ? this.materials.terminale : this.materials.evento;
    const marker = new THREE.Mesh(this.unitBox, material);
    if (kind === "terminale") marker.scale.set(0.3, 1.6, 1.1);
    else marker.scale.set(0.7, 0.7, 0.7);
    marker.position.set(p.x + (kind === "terminale" ? 0.9 : 0), p.y + marker.scale.y / 2, p.z);
    this.addShadowed(marker);
  }

  private addGate(p: Vec3): void {
    for (const dz of [-1.6, 1.6]) {
      const post = new THREE.Mesh(this.unitBox, this.materials.gate);
      post.scale.set(0.5, 4, 0.5);
      post.position.set(p.x, p.y + 2, p.z + dz);
      this.addShadowed(post);
    }
    const lintel = new THREE.Mesh(this.unitBox, this.materials.gate);
    lintel.scale.set(0.6, 0.5, 3.7);
    lintel.position.set(p.x, p.y + 4.1, p.z);
    this.addShadowed(lintel);
  }

  private addPlayer(index: number, active: boolean): THREE.Group {
    const colour = playerColor(index);
    const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, emissive: colour, emissiveIntensity: active ? 0.35 : 0.05 });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.3, 16), material);
    body.position.y = 0.65;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12), material);
    head.position.y = 1.55;
    group.add(body, head);
    if (active) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);
    }
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
    this.pawnLayer.add(group);
    return group;
  }

  private placeCamera(target: THREE.Vector3, distance: number, pitch: number): void {
    const position = cameraPosition({ x: target.x, y: target.y, z: target.z }, distance, pitch);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(target);
    this.camera.far = distance + 250;
    this.camera.updateProjectionMatrix();
    Object.assign(this.scene.fog as THREE.Fog, fogRange(distance));
    this.sun.position.set(target.x + SUN.offset.x, target.y + SUN.offset.y, target.z + SUN.offset.z);
    this.sun.target.position.copy(target);
    const extent = shadowExtent(distance);
    Object.assign(this.sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: SUN.shadowNear, far: SUN.shadowFar });
    this.sun.shadow.camera.updateProjectionMatrix();
  }

  private disposeChildren(group: THREE.Group): void {
    for (const object of [...group.children]) {
      group.remove(object);
      object.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) child.dispose();
        if (child instanceof THREE.Mesh && child.geometry !== this.unitBox && child.geometry !== this.unitCylinder) child.geometry.dispose();
      });
    }
  }

  dispose(): void {
    this.disposeChildren(this.content);
    this.disposeChildren(this.pawnLayer);
    this.unitBox.dispose();
    for (const material of [...Object.values(this.materials), ...Object.values(this.kitMaterials)]) material.dispose();
    this.unitCylinder.dispose();
    this.renderer.dispose();
  }
}
