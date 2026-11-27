/**
 * Inquadratura decentrata: riserva `pixels` in basso (pannello
 * dell'interfaccia) e centra l'immagine nell'area libera, senza spostare la
 * camera né deformare l'immagine. Condivisa da città e scena di corsa.
 */
import type * as THREE from "three";

export function applyBottomInset(camera: THREE.PerspectiveCamera, width: number, height: number, pixels: number): void {
  const inset = Math.max(0, Math.min(height * 0.6, pixels));
  if (inset < 0.5) {
    camera.clearViewOffset();
    camera.aspect = width / height;
  } else {
    camera.aspect = width / (height + inset);
    camera.setViewOffset(width, height + inset, 0, inset, width, height);
  }
  camera.updateProjectionMatrix();
}

/** Altezza, dal fondo della finestra, occupata dal pannello visibile dell'interfaccia. */
export function panelInset(): number {
  const panel = document.querySelector<HTMLElement>(".hud-panel");
  if (!panel || panel.hidden) return 0;
  return Math.max(0, window.innerHeight - panel.getBoundingClientRect().top);
}
