/**
 * Renderer graybox (fase 2): volumi neutri, nessun asset definitivo.
 * Disegna esclusivamente il SceneModel ricevuto; non conosce mappa né stato.
 */
import * as THREE from "three";
import type { Vec3 } from "../layout/types.ts";
import type { CameraPose } from "../director/director.ts";
import { buildKit, massKey, tileKey, walkwayKey, type KitResult, type Primitive } from "../kit/kit.ts";
import { ABYSS_Y, CAMERA_OPTICS, cameraPosition, fogRange, shadowExtent, SUN, WALKWAY } from "../scene/dimensions.ts";
import type { SceneModel, SceneSegment } from "../scene/model.ts";
import { elementKey, indexSectors, isLoaded, updateLoadedSectors, type Focus, type SectorIndex } from "../scene/sectors.ts";
import { findOccluders, NO_OCCLUDERS, occludersKey, type Occluders } from "../scene/occlusion.ts";
import { playerColor } from "../ui/palette.ts";

export type CameraMode = "player" | "overview";

const BACKGROUND = 0x17181c;
/** Opacità dei volumi resi trasparenti perché nascondono il giocatore attivo. */
const OCCLUDER_OPACITY = 0.18;
const OVERVIEW_PITCH = THREE.MathUtils.degToRad(50);
const OVERVIEW_MIN_DISTANCE = 24;

export interface RenderStats {
  /** Primitive del kit modulare disegnate. */
  primitives: number;
  /** Primitive del kit della vista presentata, caricate o no. */
  totalPrimitives: number;
  tiles: number;
  walkways: number;
  stubs: number;
  masses: number;
  players: number;
  loadedSectors: number;
  occupiedSectors: number;
  /** Ricostruzioni della scena statica dall'avvio e durata dell'ultima. */
  builds: number;
  lastBuildMs: number;
}

export class GrayboxRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(CAMERA_OPTICS.fov, 1, CAMERA_OPTICS.near, 400);
  private content = new THREE.Group();
  private sun = new THREE.DirectionalLight(0xffe2c0, 2.4);
  private stats: RenderStats = { primitives: 0, totalPrimitives: 0, tiles: 0, walkways: 0, stubs: 0, masses: 0, players: 0, loadedSectors: 0, occupiedSectors: 0, builds: 0, lastBuildMs: 0 };
  /** Pedine: sempre presenti, fuori dal caricamento per settori. */
  private pawnLayer = new THREE.Group();
  private sectorIndex: SectorIndex | null = null;
  /** Settori caricati; `null` = vista presentata per intera. */
  private loaded: ReadonlySet<string> | null = null;
  private loadedKey = "*";
  private staticDirty = false;
  private presence: { kind: "seat" } | { kind: "terminal"; position: Vec3 } | null = null;
  private pawns = new Map<string, THREE.Group>();
  private model: SceneModel | null = null;
  /** Volumi che possono nascondere la pedina: ricostruiti quando cambiano gli ostacoli. */
  private occludable = new THREE.Group();
  private occlusion: Occluders = NO_OCCLUDERS;
  private occlusionKey = "";
  private readonly faded = new Map<THREE.Material, THREE.Material>();
  private readonly terminals = new Map<string, THREE.Mesh>();
  private readonly unitCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  /** Materiali del kit, con tinte neutre in attesa della direzione artistica. */
  private readonly kitMaterials: Readonly<Record<Primitive["material"], THREE.MeshStandardMaterial>> = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.04 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x70757d, roughness: 0.45, metalness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2f3136, roughness: 0.9, metalness: 0.1 }),
  };
  private kit: KitResult | null = null;
  private primitiveCount = 0;
  private seatGroup: THREE.Group | null = null;
  private readonly unitBox = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials = {
    stub: new THREE.MeshStandardMaterial({ color: 0x4a4d54, roughness: 0.9, transparent: true, opacity: 0.55 }),
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

  /**
   * Nuova vista presentata: kit costruito sull'intera vista (poi filtrato per
   * settore) e pedine. La scena statica si ricostruisce al prossimo
   * `updateSectors` o `render`.
   */
  setModel(model: SceneModel, seed: string): void {
    this.model = model;
    this.kit = buildKit(model, seed);
    this.sectorIndex = indexSectors(model, this.kit.primitives);
    this.occlusion = NO_OCCLUDERS;
    this.occlusionKey = "";
    this.disposeChildren(this.pawnLayer);
    this.pawns.clear();
    for (const player of model.players) this.pawns.set(player.id, this.addPlayer(player.index, player.active));
    this.setPawnPositions(Object.fromEntries(model.players.map((p) => [p.id, p.position])));
    this.staticDirty = true;
  }

  /**
   * Settori da tenere caricati attorno ai fuochi; `null` carica la città
   * presentata per intero. Ricostruisce la scena statica solo se l'insieme cambia.
   */
  updateSectors(foci: readonly Focus[] | null): void {
    if (!this.sectorIndex) return;
    const next = foci === null ? null : updateLoadedSectors(this.loaded ?? this.sectorIndex.occupied, this.sectorIndex.occupied, foci);
    const key = next === null ? "*" : [...next].sort().join(";");
    if (key !== this.loadedKey) {
      this.loaded = next;
      this.loadedKey = key;
      this.staticDirty = true;
    }
    this.ensureBuilt();
  }

  /** Caselle della vista presentata attualmente disegnate. */
  loadedTiles(): string[] {
    if (!this.model || !this.sectorIndex) return [];
    return this.model.tiles.filter((t) => isLoaded(this.sectorIndex!.elements.get(`tile:${tileKey(t.id)}`), this.loaded)).map((t) => t.id);
  }

  /** Settori caricati (tutti quelli occupati se il caricamento per settori è disattivato). */
  loadedSectors(): string[] {
    return [...(this.loaded ?? this.sectorIndex?.occupied ?? [])].sort();
  }

  private ensureBuilt(): void {
    if (this.staticDirty) this.rebuildStatic();
  }

  /** Segnali, portale, monconi e kit dei soli settori caricati. */
  private rebuildStatic(): void {
    const model = this.model!,
      index = this.sectorIndex!;
    const started = performance.now();
    this.clearContent();
    this.terminals.clear();
    this.content.add(this.occludable);
    for (const tile of model.tiles) {
      if (!isLoaded(index.tiles.get(tile.id), this.loaded)) continue;
      if (tile.special) this.addSpecialMarker(tile.special, tile.position);
      if (tile.kind === "exit") this.addGate(tile.position);
    }
    const stubs = model.stubs.filter((_, i) => isLoaded(index.stubs[i], this.loaded));
    this.addStubs(stubs);
    this.buildOccludable();
    this.applyPresence();
    this.staticDirty = false;
    const loadedElement = (key: string): boolean => isLoaded(index.elements.get(key), this.loaded);
    this.stats = {
      primitives: this.primitiveCount,
      totalPrimitives: this.kit!.primitives.length,
      tiles: model.tiles.filter((t) => loadedElement(`tile:${tileKey(t.id)}`)).length,
      walkways: model.walkways.filter((w) => loadedElement(`walkway:${walkwayKey(w)}`)).length,
      stubs: stubs.length,
      masses: model.masses.filter((m) => loadedElement(`mass:${massKey(m)}`)).length,
      players: model.players.length,
      loadedSectors: this.loaded?.size ?? index.occupied.size,
      occupiedSectors: index.occupied.size,
      builds: this.stats.builds + 1,
      lastBuildMs: performance.now() - started,
    };
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
      if (!this.staticDirty) this.buildOccludable();
    }
    return this.occlusion;
  }

  /** Nessun volume trasparente (per inquadrature che non mostrano la pedina). */
  clearOcclusion(): Occluders {
    if (this.occlusionKey !== "") {
      this.occlusion = NO_OCCLUDERS;
      this.occlusionKey = "";
      if (this.model && !this.staticDirty) this.buildOccludable();
    }
    return this.occlusion;
  }

  /**
   * Kit modulare (caselle, piloni, passerelle, masse), diviso fra opaco e
   * trasparente secondo gli ostacoli correnti: si rende trasparente l'intero
   * modulo dell'elemento che nasconde la pedina.
   */
  private buildOccludable(): void {
    const model = this.model!;
    this.disposeChildren(this.occludable);
    const index = this.sectorIndex!;
    const faded = new Set<string>([
      ...this.occlusion.tiles.map((id) => `tile:${tileKey(id)}`),
      ...this.occlusion.pillars.map((id) => `pillar:${tileKey(id)}`),
      ...this.occlusion.walkways.map((i) => `walkway:${walkwayKey(model.walkways[i]!)}`),
      ...this.occlusion.masses.map((i) => `mass:${massKey(model.masses[i]!)}`),
    ]);
    const groups = new Map<string, Primitive[]>();
    let drawn = 0;
    for (const primitive of this.kit!.primitives) {
      if (!isLoaded(index.elements.get(elementKey(primitive.ref)), this.loaded)) continue;
      drawn++;
      const isFaded = faded.has(`${primitive.ref.kind}:${primitive.ref.key}`);
      const key = `${primitive.shape}|${primitive.material}|${isFaded}`;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(primitive);
    }
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(),
      scale = new THREE.Vector3(),
      quaternion = new THREE.Quaternion(),
      euler = new THREE.Euler(),
      color = new THREE.Color();
    for (const [key, primitives] of groups) {
      const [shape, materialName, isFaded] = key.split("|") as [Primitive["shape"], Primitive["material"], string];
      const material = this.kitMaterials[materialName];
      const mesh = new THREE.InstancedMesh(shape === "box" ? this.unitBox : this.unitCylinder, isFaded === "true" ? this.fadedMaterial(material) : material, primitives.length);
      primitives.forEach((p, i) => {
        quaternion.setFromEuler(euler.set(p.rotation.x, p.rotation.y, p.rotation.z));
        mesh.setMatrixAt(i, matrix.compose(position.set(p.position.x, p.position.y, p.position.z), quaternion, scale.set(p.scale.x, p.scale.y, p.scale.z)));
        if (materialName === "concrete") mesh.setColorAt(i, color.setHex(p.color));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = isFaded !== "true";
      mesh.userData.faded = isFaded === "true";
      this.occludable.add(mesh);
    }
    this.primitiveCount = drawn;
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
    this.presence = presence;
    this.applyPresence();
  }

  private applyPresence(): void {
    const presence = this.presence;
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
    if (this.model) this.ensureBuilt();
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
        if (child instanceof THREE.Mesh && child.geometry !== this.unitBox && child.geometry !== this.unitCylinder) child.geometry.dispose();
      });
    }
  }

  dispose(): void {
    this.clearContent();
    this.disposeChildren(this.pawnLayer);
    this.unitBox.dispose();
    for (const material of [...Object.values(this.materials), ...Object.values(this.kitMaterials), ...this.faded.values()]) material.dispose();
    this.unitCylinder.dispose();
    this.renderer.dispose();
  }
}
