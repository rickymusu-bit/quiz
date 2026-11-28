/**
 * Schermata del riepilogo a fine partita (provvisoria): risposte per
 * giocatore e per argomento, poi le domande in ordine di turno con risposta
 * data, risposta corretta e spiegazione. Si chiude con «Chiudi» o Esc.
 */
import type { GameSummary, SummaryItem, Tally } from "../questions/summary.ts";
import { mathElement } from "./math.ts";

const OUTCOME_LABELS: Readonly<Record<SummaryItem["outcome"], string>> = { correct: "corretta", wrong: "errata", timeout: "tempo scaduto" };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function tallyTable(caption: string, firstHeader: string, rows: readonly (Tally & { name: string })[], withBreakdown: boolean): HTMLTableElement {
  const table = el("table", "summary-table");
  table.append(el("caption", "", caption));
  const head = el("tr");
  const headers = withBreakdown ? [firstHeader, "Corrette", "Errate", "Scadute", "Totale"] : [firstHeader, "Corrette", "Totale"];
  for (const h of headers) {
    const th = el("th", "", h);
    th.scope = "col";
    head.append(th);
  }
  table.append(el("thead"), el("tbody"));
  table.tHead!.append(head);
  for (const row of rows) {
    const tr = el("tr");
    const th = el("th", "", row.name);
    th.scope = "row";
    tr.append(th);
    const values = withBreakdown ? [row.correct, row.wrong, row.timeout, row.total] : [row.correct, row.total];
    for (const v of values) tr.append(el("td", "", String(v)));
    table.tBodies[0]!.append(tr);
  }
  return table;
}

export function showSummary(host: HTMLElement, summary: GameSummary, onClose: () => void): void {
  const dialog = el("section", "summary");
  dialog.id = "summary";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "summary-title");
  const title = el("h1", "", "Riepilogo della partita");
  title.id = "summary-title";
  title.tabIndex = -1;
  const close = el("button", "summary-close", "Chiudi");
  close.type = "button";
  const head = el("div", "summary-head");
  head.append(title, close);
  dialog.append(head);

  if (summary.items.length === 0) dialog.append(el("p", "", "Nessuna domanda con risposta in questa partita."));
  else {
    dialog.append(tallyTable("Per giocatore", "Giocatore", summary.players, true), tallyTable("Per argomento", "Argomento", summary.topics, false));
    const list = el("ol", "summary-items");
    list.setAttribute("aria-label", "Domande in ordine di turno");
    for (const item of summary.items) {
      const li = el("li", `summary-item is-${item.outcome}`);
      li.append(
        el("p", "summary-meta", `Turno ${item.turn} · ${item.playerName} · ${item.topicName} · ${item.difficulty} · ${OUTCOME_LABELS[item.outcome]}`),
        mathElement("p", "summary-question", item.text),
        item.given === null ? el("p", "", "Nessuna risposta: tempo scaduto.") : mathElement("p", "", item.given, "Risposta data: "),
      );
      if (item.outcome !== "correct") li.append(mathElement("p", "", item.correctAnswer, "Risposta corretta: "));
      li.append(mathElement("p", "summary-explanation", item.explanation));
      list.append(li);
    }
    dialog.append(list);
  }

  const previous = document.activeElement as HTMLElement | null;
  const finish = (): void => {
    window.removeEventListener("keydown", onKey, true);
    dialog.remove();
    previous?.focus({ preventScroll: true });
    onClose();
  };
  // Esc chiude; gli altri tasti non arrivano al gioco finché il riepilogo è aperto.
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") finish();
    if (event.key !== "Tab") event.stopPropagation();
  };
  close.addEventListener("click", finish);
  window.addEventListener("keydown", onKey, true);
  host.append(dialog);
  title.focus({ preventScroll: true });
}
