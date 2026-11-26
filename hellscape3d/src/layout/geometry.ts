/** Geometria in pianta (piano XZ) per i controlli di ingombro. */
import type { Vec3 } from "./types.ts";

export function distance2D(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function pointSegmentDistance2D(p: Vec3, a: Vec3, b: Vec3): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const length2 = dx * dx + dz * dz;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length2));
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

function orientation(a: Vec3, b: Vec3, c: Vec3): number {
  return Math.sign((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x));
}

function segmentsCross2D(a: Vec3, b: Vec3, c: Vec3, d: Vec3): boolean {
  const o1 = orientation(a, b, c),
    o2 = orientation(a, b, d),
    o3 = orientation(c, d, a),
    o4 = orientation(c, d, b);
  return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}

export function segmentDistance2D(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  if (segmentsCross2D(a, b, c, d)) return 0;
  return Math.min(
    pointSegmentDistance2D(a, c, d),
    pointSegmentDistance2D(b, c, d),
    pointSegmentDistance2D(c, a, b),
    pointSegmentDistance2D(d, a, b),
  );
}

/** Distanza verticale fra gli intervalli di quota di due tratti (0 se si sovrappongono). */
export function verticalGap(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  const low1 = Math.min(a.y, b.y),
    high1 = Math.max(a.y, b.y),
    low2 = Math.min(c.y, d.y),
    high2 = Math.max(c.y, d.y);
  return Math.max(0, low2 - high1, low1 - high2);
}

export function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
