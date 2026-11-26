/**
 * Modello della scena visibile: elenco puro di elementi da disegnare, ricavato
 * dalla vista pubblica e dal layout. Il renderer non legge altro, quindi la
 * nebbia di guerra si verifica qui, senza browser.
 */
import type { PublicView } from "../logic/exploration.ts";
import type { CityMap, CellKind } from "../logic/types.ts";
import { distance2D } from "../layout/geometry.ts";
import type { CityLayout, Mass, Vec3 } from "../layout/types.ts";

export interface SceneTile {
  id: string;
  kind: CellKind;
  district: string;
  special: string | null;
  position: Vec3;
}

export interface SceneSegment {
  from: string;
  a: Vec3;
  b: Vec3;
}

export interface ScenePlayer {
  id: string;
  index: number;
  active: boolean;
  escaped: boolean;
  position: Vec3;
}

export interface SceneModel {
  tiles: SceneTile[];
  walkways: SceneSegment[];
  /** Tratti di passerella che si interrompono nella nebbia verso celle non esplorate. */
  stubs: SceneSegment[];
  masses: Mass[];
  players: ScenePlayer[];
  /** Posizione del giocatore attivo, punto inquadrato dalla vista ordinaria. */
  focus: Vec3;
}

/** Frazione di passerella disegnata verso una cella non esplorata. */
export const STUB_FRACTION = 0.4;
/** Raggio entro il quale le masse edilizie compaiono attorno alle caselle visibili. */
export const MASS_REVEAL_RADIUS = 16;

export function buildSceneModel(map: CityMap, layout: CityLayout, view: PublicView): SceneModel {
  const visible = new Set(view.cells.map((c) => c.id));
  const at = (id: string): Vec3 => {
    const position = layout.positions[id];
    if (!position) throw new Error(`Posizione mancante per ${id}`);
    return position;
  };
  const tiles = view.cells.map((cell) => ({ id: cell.id, kind: cell.kind, district: cell.district, special: cell.special, position: at(cell.id) }));
  const walkways: SceneSegment[] = [];
  const stubs: SceneSegment[] = [];
  for (const cell of view.cells) {
    for (const to of cell.next) walkways.push({ from: cell.id, a: at(cell.id), b: at(to) });
    if (cell.continuesIntoFog) {
      // Unico dato non pubblico usato: la direzione del prossimo tratto, disegnato solo in parte.
      for (const to of map.cells[cell.id]!.next) {
        if (visible.has(to)) continue;
        const a = at(cell.id),
          b = at(to);
        stubs.push({ from: cell.id, a, b: { x: a.x + (b.x - a.x) * STUB_FRACTION, y: a.y + (b.y - a.y) * STUB_FRACTION, z: a.z + (b.z - a.z) * STUB_FRACTION } });
      }
    }
  }
  const masses = layout.masses.filter((mass) => tiles.some((tile) => distance2D(tile.position, { x: mass.x, y: 0, z: mass.z }) <= MASS_REVEAL_RADIUS));
  const players = view.players.map((player, index) => ({
    id: player.id,
    index,
    active: player.id === view.activePlayerId,
    escaped: player.escaped,
    position: at(player.cellId),
  }));
  const focus = players.find((p) => p.active)!.position;
  return { tiles, walkways, stubs, masses, players, focus };
}

/**
 * SOLO PER SVILUPPO: vista con tutte le celle rivelate, per giudicare il layout
 * completo. Non deve essere raggiungibile dall'interfaccia di gioco.
 */
export function revealAllView(map: CityMap, view: PublicView): PublicView {
  return {
    ...view,
    cells: Object.values(map.cells)
      .map((cell) => ({ id: cell.id, kind: cell.kind, district: cell.district, special: cell.special, next: [...cell.next], continuesIntoFog: false }))
      .sort((a, b) => (a.id < b.id ? -1 : 1)),
  };
}

/**
 * Vista limitata alle celle già mostrate dalla regia (sottoinsieme di quelle
 * esplorate): archi e indicazione di nebbia vengono ricalcolati su quel
 * sottoinsieme, così che le caselle compaiano quando la pedina le vede.
 */
export function presentedView(map: CityMap, view: PublicView, shown: readonly string[]): PublicView {
  const allowed = new Set(view.cells.map((c) => c.id));
  const visible = new Set(shown.filter((id) => allowed.has(id)));
  return {
    ...view,
    cells: view.cells
      .filter((cell) => visible.has(cell.id))
      .map((cell) => ({
        ...cell,
        next: cell.next.filter((to) => visible.has(to)),
        continuesIntoFog: map.cells[cell.id]!.next.some((to) => !visible.has(to)),
      })),
  };
}
