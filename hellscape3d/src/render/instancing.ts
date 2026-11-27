/**
 * Primitive del kit trasformate in mesh istanziate, una per forma e materiale:
 * condiviso dal renderer della città e dalla scena di corsa.
 */
import * as THREE from "three";
import type { Primitive } from "../kit/kit.ts";

export interface KitMeshes {
  box: THREE.BufferGeometry;
  cylinder: THREE.BufferGeometry;
  materials: Readonly<Record<Primitive["material"], THREE.Material>>;
}

/** Mesh istanziata di primitive della stessa forma; il colore per istanza vale per il calcestruzzo. */
export function instancedMesh(primitives: readonly Primitive[], geometry: THREE.BufferGeometry, material: THREE.Material, tinted: boolean): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, primitives.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3(),
    scale = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    euler = new THREE.Euler(),
    color = new THREE.Color();
  primitives.forEach((p, i) => {
    quaternion.setFromEuler(euler.set(p.rotation.x, p.rotation.y, p.rotation.z));
    mesh.setMatrixAt(i, matrix.compose(position.set(p.position.x, p.position.y, p.position.z), quaternion, scale.set(p.scale.x, p.scale.y, p.scale.z)));
    if (tinted) mesh.setColorAt(i, color.setHex(p.color));
  });
  return mesh;
}

/** Raggruppa per forma e materiale e crea una mesh per gruppo. */
export function kitMeshes(primitives: readonly Primitive[], kit: KitMeshes): THREE.InstancedMesh[] {
  const groups = new Map<string, Primitive[]>();
  for (const p of primitives) {
    const key = `${p.shape}|${p.material}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }
  return [...groups].map(([key, group]) => {
    const [shape, material] = key.split("|") as [Primitive["shape"], Primitive["material"]];
    return instancedMesh(group, shape === "box" ? kit.box : kit.cylinder, kit.materials[material], material === "concrete");
  });
}
