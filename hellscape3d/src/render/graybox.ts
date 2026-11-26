/**
 * Renderer graybox (fase 2): volumi neutri, nessun asset definitivo.
 * Disegna esclusivamente il SceneModel ricevuto; non conosce mappa né stato.
 */
import * as THREE from "three";
import type { Vec3 } from "../layout/types.ts";
import type { CameraPose } from "../director/director.ts";
import { ABYSS_Y, cameraPosition, PILLAR_WIDTH, TILE, tileScale, WALKWAY } from "../scene/dimensions.ts";
import type { SceneModel, SceneSegment } from "../scene/model.ts";
import { findOccluders, NO_OCCLUDERS, occludersKey, type Occluders } from "../scene/occlusion.ts";
import { playerColor } from "../ui/palette.ts";

export type CameraMode = "player" | "overview";

const BACKGROUND = 0x17181c;
const DISTRICT_TINT: Readonly<Record<string, number>> = {
  fondazioni: 0x8b8682,
  ponti: 0x858c96,
  abitativo: 0x8e8e89,
  motori: 0x948577,
  sommita: 0x9a9ba3,
};
/** Opacità dei volumi resi trasparenti perché nascondono il giocatore attivo. */
const OCCLUDER_OPACITY = 0.18;
const OVERVIEW_PITCH = THREE.MathUtils.degToRad(50);
const OVERVIEW_MIN_DISTANCE = 24;

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
  private pawns = new Map<string, THREE.Group>();
  private model: SceneModel | null = null;
  /** Volumi che possono nascondere la pedina: ricostruiti quando cambiano gli ostacoli. */
  private occludable = new THREE.Group();
  private occlusion: Occluders = NO_OCCLUDERS;
  private occlusionKey = "";
  private readonly faded = new Map<THREE.Material, THREE.Material>();
  private readonly terminals = new Map<string, THREE.Mesh>();
  private seatGroup: THREE.Group | null = null;
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
    terminaleActive: new THREE.MeshStandardMaterial({ color: 0x14201a, emissive: 0x3aff7a, emissiveIntensity: 2.4 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x2c2a2e, roughness: 0.7, metalness: 0.3 }),
    seatEyes: new THREE.MeshStandardMaterial({ color: 0x0a1a10, emissive: 0x39ff88, emissiveIntensity: 0.5 }),
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

  /** Ricostruisce la scena statica (caselle, passerelle, masse) e le pedine. */
  setModel(model: SceneModel): void {
    this.clearContent();
    this.terminals.clear();
    this.model = model;
    this.content.add(this.occludable);
    for (const tile of model.tiles) {
      if (tile.special) this.addSpecialMarker(tile.special, tile.position);
      if (tile.kind === "exit") this.addGate(tile.position);
    }
    this.addSegments(model.stubs, this.materials.stub, this.content);
    this.occlusion = NO_OCCLUDERS;
    this.occlusionKey = "";
    this.buildOccludable();
    this.pawns.clear();
    for (const player of model.players) this.pawns.set(player.id, this.addPlayer(player.index, player.active));
    this.setPawnPositions(Object.fromEntries(model.players.map((p) => [p.id, p.position])));
    this.stats = { tiles: model.tiles.length, walkways: model.walkways.length, stubs: model.stubs.length, masses: model.masses.length, players: model.players.length };
  }

  /**
   * Rende trasparenti i volumi fra la camera e la pedina in `focus` (§6).
   * Va chiamato dopo aver posizionato la camera; restituisce gli ostacoli trovati.
   */
  updateOcclusion(focus: Vec3): Occluders {
    if (!this.model) return NO_OCCLUDERS;
    const p = this.camera.position;
    const occlusion = findOccluders(this.model, { x: p.x, y: p.y, z: p.z }, focus);
    const key = occludersKey(occlusion);
    if (key !== this.occlusionKey) {
      this.occlusion = occlusion;
      this.occlusionKey = key;
      this.buildOccludable();
    }
    return this.occlusion;
  }

  /** Nessun volume trasparente (per inquadrature che non mostrano la pedina). */
  clearOcclusion(): Occluders {
    if (this.occlusionKey !== "") {
      this.occlusion = NO_OCCLUDERS;
      this.occlusionKey = "";
      if (this.model) this.buildOccludable();
    }
    return this.occlusion;
  }

  /** Caselle, piloni, passerelle e masse, divisi fra opachi e trasparenti secondo gli ostacoli correnti. */
  private buildOccludable(): void {
    const model = this.model!;
    this.disposeChildren(this.occludable);
    const occ = {
      tiles: new Set(this.occlusion.tiles),
      pillars: new Set(this.occlusion.pillars),
      walkways: new Set(this.occlusion.walkways),
      masses: new Set(this.occlusion.masses),
    };
    const color = new THREE.Color();
    this.addBoxes(
      model.tiles.map((tile) => {
        const scale = tileScale(tile.kind);
        const p = tile.position;
        return {
          faded: occ.tiles.has(tile.id),
          position: new THREE.Vector3(p.x, p.y - TILE.thickness / 2, p.z),
          scale: new THREE.Vector3(TILE.size * scale, TILE.thickness, TILE.size * scale),
          color: color.setHex(DISTRICT_TINT[tile.district] ?? 0x8c8f94).multiplyScalar(tile.kind === "fork" ? 1.15 : 1).clone(),
        };
      }),
      this.materials.tile,
    );
    this.addBoxes(
      model.tiles.map((tile) => {
        const p = tile.position;
        const height = p.y - TILE.thickness - ABYSS_Y;
        return { faded: occ.pillars.has(tile.id), position: new THREE.Vector3(p.x, ABYSS_Y + height / 2, p.z), scale: new THREE.Vector3(PILLAR_WIDTH, height, PILLAR_WIDTH) };
      }),
      this.materials.pillar,
    );
    this.addSegments(model.walkways, this.materials.walkway, this.occludable, occ.walkways);
    this.addBoxes(
      model.masses.map((mass, i) => ({
        faded: occ.masses.has(i),
        position: new THREE.Vector3(mass.x, (mass.top + mass.bottom) / 2, mass.z),
        scale: new THREE.Vector3(mass.width, mass.top - mass.bottom, mass.depth),
      })),
      this.materials.mass,
    );
  }

  /** Istanze di parallelepipedi, in due gruppi: opachi e trasparenti. */
  private addBoxes(boxes: { faded: boolean; position: THREE.Vector3; scale: THREE.Vector3; rotation?: THREE.Quaternion; color?: THREE.Color }[], material: THREE.Material): void {
    for (const faded of [false, true]) {
      const chosen = boxes.filter((b) => b.faded === faded);
      if (chosen.length === 0) continue;
      const mesh = new THREE.InstancedMesh(this.unitBox, faded ? this.fadedMaterial(material) : material, chosen.length);
      const matrix = new THREE.Matrix4();
      chosen.forEach((box, i) => {
        mesh.setMatrixAt(i, matrix.compose(box.position, box.rotation ?? new THREE.Quaternion(), box.scale));
        if (box.color) mesh.setColorAt(i, box.color);
      });
      mesh.castShadow = true;
      mesh.receiveShadow = !faded;
      mesh.userData.faded = faded;
      this.occludable.add(mesh);
    }
  }

  private fadedMaterial(material: THREE.Material): THREE.Material {
    let faded = this.faded.get(material);
    if (!faded) {
      faded = material.clone();
      Object.assign(faded, { transparent: true, opacity: OCCLUDER_OPACITY, depthWrite: false });
      this.faded.set(material, faded);
    }
    return faded;
  }

  /**
   * Sede di Bafometto, graybox: macchina monumentale su un pilone che sale
   * dall'abisso. È uno sfondo fisso, indipendente dall'esplorazione.
   */
  setSeat(position: Vec3): void {
    if (this.seatGroup) this.scene.remove(this.seatGroup);
    const group = new THREE.Group();
    const part = (material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, rz = 0): void => {
      const mesh = new THREE.Mesh(this.unitBox, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };
    const base = -2;
    part(this.materials.seat, 0, (ABYSS_Y + base) / 2, 0, 6, base - ABYSS_Y, 6);
    part(this.materials.seat, 0, base + 1, 0, 18, 2, 14);
    part(this.materials.seat, 0, base + 9, 0, 8, 14, 6);
    for (const side of [-1, 1]) {
      part(this.materials.seat, side * 6.5, base + 7, 0, 5, 3, 3);
      part(this.materials.seat, side * 2.4, base + 22.5, 0, 1, 6, 1, side * -0.45);
    }
    part(this.materials.seat, 0, base + 18, 0, 6, 4.5, 5);
    // Occhi rivolti verso la camera della vista a tre quarti (lato -Z).
    for (const side of [-1, 1]) part(this.materials.seatEyes, side * 1.3, base + 18.6, -2.55, 1.1, 0.6, 0.2);
    group.position.set(position.x, position.y, position.z);
    this.seatGroup = group;
    this.scene.add(group);
  }

  /** Accende gli occhi della sede o il terminale su cui Bafometto si manifesta. */
  setBafometto(presence: { kind: "seat" } | { kind: "terminal"; position: Vec3 } | null): void {
    this.materials.seatEyes.emissiveIntensity = presence?.kind === "seat" ? 3 : 0.5;
    const key = presence?.kind === "terminal" ? `${presence.position.x},${presence.position.y},${presence.position.z}` : null;
    for (const [position, mesh] of this.terminals) mesh.material = position === key ? this.materials.terminaleActive : this.materials.terminale;
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

  /** Posa della camera decisa dal CameraDirector; la direzione resta quella della vista a tre quarti. */
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
    const width = this.renderer.domElement.clientWidth,
      height = this.renderer.domElement.clientHeight;
    const inset = Math.max(0, Math.min(height * 0.6, pixels));
    if (inset < 0.5) {
      this.camera.clearViewOffset();
      this.camera.aspect = width / height;
    } else {
      this.camera.aspect = width / (height + inset);
      this.camera.setViewOffset(width, height + inset, 0, inset, width, height);
    }
    this.camera.updateProjectionMatrix();
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

  private addSegments(segments: readonly SceneSegment[], material: THREE.Material, parent: THREE.Group, faded: ReadonlySet<number> = new Set()): void {
    if (segments.length === 0) return;
    const axis = new THREE.Vector3(1, 0, 0);
    const boxes = segments.map((segment, i) => {
      const a = new THREE.Vector3(segment.a.x, segment.a.y - WALKWAY.thickness, segment.a.z);
      const b = new THREE.Vector3(segment.b.x, segment.b.y - WALKWAY.thickness, segment.b.z);
      const direction = b.clone().sub(a);
      const length = direction.length();
      return {
        faded: faded.has(i),
        position: a.clone().add(b).multiplyScalar(0.5),
        rotation: new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize()),
        scale: new THREE.Vector3(length, WALKWAY.thickness, WALKWAY.width),
      };
    });
    if (parent === this.occludable) {
      this.addBoxes(boxes, material);
      return;
    }
    const mesh = new THREE.InstancedMesh(this.unitBox, material, boxes.length);
    const matrix = new THREE.Matrix4();
    boxes.forEach((box, i) => mesh.setMatrixAt(i, matrix.compose(box.position, box.rotation, box.scale)));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  private addSpecialMarker(kind: string, p: Vec3): void {
    const material = kind === "terminale" ? this.materials.terminale : this.materials.evento;
    const marker = new THREE.Mesh(this.unitBox, material);
    if (kind === "terminale") this.terminals.set(`${p.x},${p.y},${p.z}`, marker);
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
    this.content.add(group);
    return group;
  }

  private placeCamera(target: THREE.Vector3, distance: number, pitch: number): void {
    const position = cameraPosition({ x: target.x, y: target.y, z: target.z }, distance, pitch);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(target);
    this.camera.far = distance + 250;
    this.camera.updateProjectionMatrix();
    const fog = this.scene.fog as THREE.Fog;
    fog.near = distance * 0.9;
    fog.far = distance + 90;
    this.sun.position.set(target.x - 30, target.y + 60, target.z - 15);
    this.sun.target.position.copy(target);
    const extent = Math.max(45, distance);
    Object.assign(this.sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: 300 });
    this.sun.shadow.camera.updateProjectionMatrix();
  }

  private clearContent(): void {
    this.disposeChildren(this.occludable);
    this.disposeChildren(this.content);
  }

  private disposeChildren(group: THREE.Group): void {
    for (const object of [...group.children]) {
      group.remove(object);
      if (object === this.occludable) continue;
      object.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) child.dispose();
        if (child instanceof THREE.Mesh && child.geometry !== this.unitBox) child.geometry.dispose();
      });
    }
  }

  dispose(): void {
    this.clearContent();
    this.unitBox.dispose();
    for (const material of [...Object.values(this.materials), ...this.faded.values()]) material.dispose();
    this.renderer.dispose();
  }
}
