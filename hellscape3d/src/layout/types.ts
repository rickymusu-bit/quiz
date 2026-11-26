/** Tipi del layout spaziale. Nessuna dipendenza dal motore grafico. */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Massa edilizia decorativa: parallelepipedo che sale dal fondo dell'abisso. */
export interface Mass {
  x: number;
  z: number;
  width: number;
  depth: number;
  bottom: number;
  top: number;
}

export interface LayoutConfig {
  /** Distanza fra caselle consecutive. */
  step: number;
  turnChance: number;
  rampChance: number;
  rampHeight: number;
  maxHeight: number;
  /** Sopraelevazione del ramo più breve di un bivio (passerella sospesa). */
  bridgeLift: number;
  /** Abbassamento possibile dei rami laterali (passaggio inferiore). */
  lowerDrop: number;
  minCellSpacing: number;
  edgeClearance: number;
  /** Separazione verticale che consente a due tratti di incrociarsi in pianta. */
  verticalClearance: number;
  maxSlope: number;
  maxAttempts: number;
  massSpacing: number;
  massClearance: number;
  abyssY: number;
}

export interface CityLayout {
  layoutVersion: string;
  positions: Record<string, Vec3>;
  masses: Mass[];
  attempt: number;
  usedFallback: boolean;
}
