/**
 * Renderer graybox (fase 2): volumi neutri, nessun asset definitivo.
 * Disegna esclusivamente il SceneModel ricevuto; non conosce mappa né stato.
 */
import * as THREE from "three";
import { DEFAULT_LAYOUT_CONFIG, VIEW_DIRECTION } from "../layout/layout.ts";
import type { Vec3 } from "../layout/types.ts";
import type { SceneModel, SceneSegment } from "../scene/model.ts";

export type CameraMode = "player" | "overview";

const BACKGROUND = 0x17181c;
const DISTRICT_TINT: Readonly<Record<string, number>> = {
  fondazioni: 0x8b8682,
  ponti: 0x858c96,
  abitativo: 0x8e8e89,
  motori: 0x948577,
  sommita: 0x9a9ba3,
};
const PLAYER_COLORS = [0xd8452b, 0x2b8fd8, 0xe0b400, 0x8a3ad8, 0x2bd88a, 0xd82b9a];
const TILE = { size: 2.6, thickness: 0.5 };
const WALKWAY = { width: 1.3, thickness: 0.25 };
const PITCH = THREE.MathUtils.degToRad(50);
const PLAYER_DISTANCE = 38;

export interface RenderStats {
  tiles: number;
  walkways: number;
  stubs: number;
  masses: number;
  players: number;
}

export class GrayboxRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  private content = new THREE.Group();
  private sun = new THREE.DirectionalLight(0xffe2c0, 2.4);
  private stats: RenderStats = { tiles: 0, walkways: 0, stubs: 0, masses: 0, players: 0 };
  private readonly unitBox = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials = {
    tile: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 }),
    walkway: new THREE.MeshStandardMaterial({ color: 0x7d8087, roughness: 0.8, metalness: 0.1 }),
    stub: new THREE.MeshStandardMaterial({ color: 0x4a4d54, roughness: 0.9, transparent: true, opacity: 0.55 }),
    pillar: new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.9 }),
    mass: new THREE.MeshStandardMaterial({ color: 0x45474d, roughness: 0.95 }),
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
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 200 });
    this.scene.add(this.sun, this.sun.target, this.content);
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), this.materials.abyss);
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = DEFAULT_LAYOUT_CONFIG.abyssY;
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

  setModel(model: SceneModel, mode: CameraMode): void {
    this.clearContent();
    const tiles = model.tiles;
    const tileMesh = new THREE.InstancedMesh(this.unitBox, this.materials.tile, Math.max(1, tiles.length));
    const pillarMesh = new THREE.InstancedMesh(this.unitBox, this.materials.pillar, Math.max(1, tiles.length));
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    tiles.forEach((tile, i) => {
      const scale = tile.kind === "fork" ? 1.4 : tile.kind === "start" || tile.kind === "exit" ? 1.6 : 1;
      const p = tile.position;
      matrix.compose(new THREE.Vector3(p.x, p.y - TILE.thickness / 2, p.z), new THREE.Quaternion(), new THREE.Vector3(TILE.size * scale, TILE.thickness, TILE.size * scale));
      tileMesh.setMatrixAt(i, matrix);
      tileMesh.setColorAt(i, color.setHex(DISTRICT_TINT[tile.district] ?? 0x8c8f94).multiplyScalar(tile.kind === "fork" ? 1.15 : 1));
      const height = p.y - TILE.thickness - DEFAULT_LAYOUT_CONFIG.abyssY;
      matrix.compose(new THREE.Vector3(p.x, DEFAULT_LAYOUT_CONFIG.abyssY + height / 2, p.z), new THREE.Quaternion(), new THREE.Vector3(0.7, height, 0.7));
      pillarMesh.setMatrixAt(i, matrix);
      if (tile.special) this.addSpecialMarker(tile.special, p);
      if (tile.kind === "exit") this.addGate(p);
    });
    tileMesh.count = tiles.length;
    pillarMesh.count = tiles.length;
    this.addShadowed(tileMesh, pillarMesh);
    this.addSegments(model.walkways, this.materials.walkway);
    this.addSegments(model.stubs, this.materials.stub);

    const massMesh = new THREE.InstancedMesh(this.unitBox, this.materials.mass, Math.max(1, model.masses.length));
    model.masses.forEach((mass, i) => {
      matrix.compose(new THREE.Vector3(mass.x, (mass.top + mass.bottom) / 2, mass.z), new THREE.Quaternion(), new THREE.Vector3(mass.width, mass.top - mass.bottom, mass.depth));
      massMesh.setMatrixAt(i, matrix);
    });
    massMesh.count = model.masses.length;
    this.addShadowed(massMesh);

    const perCell = new Map<string, number>();
    for (const player of model.players) {
      const key = `${player.position.x},${player.position.z}`;
      const slot = perCell.get(key) ?? 0;
      perCell.set(key, slot + 1);
      this.addPlayer(player.position, player.index, player.active, slot);
    }
    this.stats = { tiles: tiles.length, walkways: model.walkways.length, stubs: model.stubs.length, masses: model.masses.length, players: model.players.length };
    this.frame(model, mode);
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

  private addSegments(segments: readonly SceneSegment[], material: THREE.Material): void {
    if (segments.length === 0) return;
    const mesh = new THREE.InstancedMesh(this.unitBox, material, segments.length);
    const matrix = new THREE.Matrix4();
    const axis = new THREE.Vector3(1, 0, 0);
    segments.forEach((segment, i) => {
      const a = new THREE.Vector3(segment.a.x, segment.a.y - WALKWAY.thickness, segment.a.z);
      const b = new THREE.Vector3(segment.b.x, segment.b.y - WALKWAY.thickness, segment.b.z);
      const direction = b.clone().sub(a);
      const length = direction.length();
      const rotation = new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize());
      matrix.compose(a.clone().add(b).multiplyScalar(0.5), rotation, new THREE.Vector3(length, WALKWAY.thickness, WALKWAY.width));
      mesh.setMatrixAt(i, matrix);
    });
    this.addShadowed(mesh);
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

  private addPlayer(p: Vec3, index: number, active: boolean, slot: number): void {
    const colour = PLAYER_COLORS[index % PLAYER_COLORS.length]!;
    const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, emissive: colour, emissiveIntensity: active ? 0.35 : 0.05 });
    const offset = slot === 0 ? 0 : (slot % 2 === 1 ? 1 : -1) * 0.7 * Math.ceil(slot / 2);
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
    group.position.set(p.x + offset, p.y, p.z + offset);
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = true;
    });
    this.content.add(group);
  }

  /** Vista a tre quarti sul giocatore attivo, oppure panoramica sulle sole caselle visibili. */
  private frame(model: SceneModel, mode: CameraMode): void {
    let target = new THREE.Vector3(model.focus.x, model.focus.y, model.focus.z);
    let distance = PLAYER_DISTANCE;
    if (mode === "overview" && model.tiles.length > 0) {
      const box = new THREE.Box3();
      for (const tile of model.tiles) box.expandByPoint(new THREE.Vector3(tile.position.x, tile.position.y, tile.position.z));
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      target = sphere.center;
      const vertical = THREE.MathUtils.degToRad(this.camera.fov) / 2;
      const horizontal = Math.atan(Math.tan(vertical) * this.camera.aspect);
      distance = Math.max(PLAYER_DISTANCE * 0.6, (sphere.radius + 4) / Math.sin(Math.min(vertical, horizontal)));
    }
    const offset = new THREE.Vector3(VIEW_DIRECTION.x * Math.cos(PITCH), Math.sin(PITCH), VIEW_DIRECTION.z * Math.cos(PITCH)).multiplyScalar(distance);
    this.camera.position.copy(target).add(offset);
    this.camera.lookAt(target);
    this.camera.far = distance + 250;
    this.camera.updateProjectionMatrix();
    this.scene.fog = new THREE.Fog(BACKGROUND, distance * 0.9, distance + 90);
    this.sun.position.set(target.x - 30, target.y + 60, target.z - 15);
    this.sun.target.position.copy(target);
    const extent = Math.max(45, distance);
    Object.assign(this.sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: 300 });
    this.sun.shadow.camera.updateProjectionMatrix();
  }

  private clearContent(): void {
    for (const object of [...this.content.children]) {
      this.content.remove(object);
      object.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) child.dispose();
        if (child instanceof THREE.Mesh && child.geometry !== this.unitBox) child.geometry.dispose();
      });
    }
  }

  dispose(): void {
    this.clearContent();
    this.unitBox.dispose();
    for (const material of Object.values(this.materials)) material.dispose();
    this.renderer.dispose();
  }
}
