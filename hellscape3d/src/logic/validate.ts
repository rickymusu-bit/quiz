/**
 * Validazione della mappa. I controlli ricalcolano distanze ed etichette
 * dalle sole celle, senza fidarsi dei valori memorizzati.
 */
import { forkBalance } from "./balance.ts";
import { distancesToExit, hasJunction, reachableFrom, topologicalOrder } from "./graph.ts";
import { DIFFICULTY_RANK, relativeLabels } from "./labels.ts";
import type { CityThemeLogic } from "./themes/index.ts";
import type { CityMap } from "./types.ts";

export function validateStructure(map: CityMap, theme: CityThemeLogic): string[] {
  const issues: string[] = [];
  const cells = map.cells;
  const ids = Object.keys(cells);
  if (ids.length === 0) return ["mappa vuota"];

  for (const id of ids) {
    const cell = cells[id]!;
    if (cell.id !== id) issues.push(`${id}: identificativo incoerente`);
    if (new Set(cell.next).size !== cell.next.length) issues.push(`${id}: archi duplicati`);
    for (const to of cell.next) {
      if (!Object.hasOwn(cells, to)) issues.push(`${id}: arco verso cella inesistente ${to}`);
      if (to === id) issues.push(`${id}: arco verso sé stessa`);
    }
    // Il bivio segue una casella ordinaria; la partita non comincia su un bivio.
    const expected = cell.kind === "exit" ? cell.next.length === 0 : cell.kind === "start" ? cell.next.length === 1 : cell.next.length >= 1 && cell.next.length <= 3;
    if (!expected) issues.push(`${id}: ${cell.kind} con ${cell.next.length} uscite`);
    if (!theme.districts.some((d) => d.id === cell.district)) issues.push(`${id}: distretto sconosciuto ${cell.district}`);
    if (cell.special !== null) {
      if (cell.kind !== "path") issues.push(`${id}: casella speciale su ${cell.kind}`);
      if (!theme.specialKinds.some((k) => k.id === cell.special)) issues.push(`${id}: casella speciale sconosciuta ${cell.special}`);
    }
  }
  const starts = ids.filter((id) => cells[id]!.kind === "start");
  const exits = ids.filter((id) => cells[id]!.kind === "exit");
  if (starts.length !== 1 || starts[0] !== map.startId) issues.push("partenza assente o non univoca");
  if (exits.length !== 1 || exits[0] !== map.exitId) issues.push("uscita assente o non univoca");
  if (cells[map.exitId]?.district !== theme.exitDistrict) issues.push("uscita fuori dal distretto di uscita");
  if (ids.some((id) => cells[id]!.next.includes(map.startId))) issues.push("archi entranti nella partenza");
  if (issues.length > 0) return issues;

  if (!topologicalOrder(cells)) return ["la rete contiene cicli"];
  const reachable = reachableFrom(cells, map.startId);
  for (const id of ids) if (!reachable.has(id)) issues.push(`${id}: non raggiungibile dalla partenza`);
  const distances = distancesToExit(cells, map.exitId);
  for (const id of ids) {
    if (!Number.isFinite(distances[id])) issues.push(`${id}: vicolo cieco, l'uscita non è raggiungibile`);
    else if (map.distanceToExit[id] !== distances[id]) issues.push(`${id}: distanza memorizzata errata`);
  }
  if (Object.keys(map.distanceToExit).length !== ids.length) issues.push("distanze memorizzate incomplete");
  if (issues.length > 0) return issues;

  const forks = ids.filter((id) => hasJunction(cells[id]!));
  if (Object.keys(map.options).sort().join() !== forks.sort().join()) issues.push("alternative non allineate ai bivi");
  for (const forkId of forks) {
    const options = map.options[forkId] ?? [];
    const next = cells[forkId]!.next;
    if (options.map((o) => o.to).join() !== next.join()) {
      issues.push(`${forkId}: alternative non allineate agli archi`);
      continue;
    }
    const ranked = [...options].sort((a, b) => distances[a.to]! - distances[b.to]!);
    const labels = relativeLabels(ranked.length);
    ranked.forEach((option, i) => {
      if (i > 0 && distances[option.to] === distances[ranked[i - 1]!.to]) issues.push(`${forkId}: alternative di uguale lunghezza`);
      if (option.relative !== labels[i]) issues.push(`${forkId}: etichetta di lunghezza errata per ${option.to}`);
      if (option.difficulty !== cells[option.to]!.difficulty) issues.push(`${forkId}: difficoltà dichiarata diversa da quella del ramo`);
      if (i > 0 && DIFFICULTY_RANK[option.difficulty] >= DIFFICULTY_RANK[ranked[i - 1]!.difficulty]) {
        issues.push(`${forkId}: il ramo più lungo non ha domande più facili`);
      }
    });
  }

  const [minRoute, maxRoute] = map.config.routeLength;
  const shortest = distances[map.startId]!;
  const longest = distancesToExit(cells, map.exitId, "max")[map.startId]!;
  if (shortest < minRoute) issues.push(`percorso più breve troppo corto (${shortest} < ${minRoute})`);
  if (longest > maxRoute) issues.push(`percorso più lungo eccessivo (${longest} > ${maxRoute})`);
  return issues;
}

export function validateBalance(map: CityMap): string[] {
  return forkBalance(map, map.startId, map.config.answerProfile, map.config.dieFaces)
    .filter((fork) => fork.gap > map.config.balanceMaxTurnGap)
    .map((fork) => `${fork.forkId}: alternative sbilanciate (${fork.gap.toFixed(2)} turni attesi di scarto)`);
}

export function validateMap(map: CityMap, theme: CityThemeLogic): string[] {
  const structural = validateStructure(map, theme);
  return structural.length > 0 ? structural : validateBalance(map);
}
