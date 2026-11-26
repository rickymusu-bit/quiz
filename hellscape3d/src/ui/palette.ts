/** Colori dei giocatori, condivisi da pedine, interfaccia e radar. */
export const PLAYER_COLORS: readonly number[] = [0xd8452b, 0x2b8fd8, 0xe0b400, 0x8a3ad8, 0x2bd88a, 0xd82b9a];

export function playerColor(index: number): number {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]!;
}

export function cssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}
