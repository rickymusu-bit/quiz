/**
 * Banche di domande della versione precedente di Hellscape (`datasets.json` e
 * `dataset/*.json` alla radice del sito). Le regole di validazione sono quelle
 * di `assets/js/datasets.js` con la copertura obbligatoria delle tre
 * difficoltà, come per una partita nuova; un test confronta i due lettori sulle
 * banche disponibili. Puro, senza browser. Le formule LaTeX si validano con
 * KaTeX come nella versione precedente (`validateMath`).
 */
import katex from "katex";
import type { Difficulty } from "../logic/types.ts";
import { mathParts } from "./math.ts";

export const DIFFICULTIES: readonly Difficulty[] = ["facile", "media", "difficile"];
/** Limite di dimensione della versione precedente. */
const MAX_BYTES = 20 * 1024 * 1024;

export interface BankQuestion {
  id: string;
  topic: string;
  topicName: string;
  difficulty: Difficulty;
  text: string;
  /** Quattro alternative, nell'ordine della banca. */
  options: string[];
  /** Indice dell'alternativa corretta nell'ordine della banca. */
  correctIndex: number;
  explanation: string;
  /** Tipologia dichiarata dalla banca (conoscenza, ragionamento, calcolo), facoltativa. */
  type: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  questions: BankQuestion[];
}

export interface CatalogEntry {
  id: string;
  name: string;
  /** Percorso relativo alla radice del sito, sempre `dataset/<nome>.json`. */
  url: string;
}

export class BankError extends Error {
  override name = "BankError";
}

function need(condition: unknown, message: string): asserts condition {
  if (!condition) throw new BankError(message);
}

/** Validazione delle formule della versione precedente: delimitatori completi, formule che KaTeX sa rendere. */
function validateMath(value: string): void {
  for (const part of mathParts(value)) {
    if (part.text !== undefined) need(!/\\[()[\]]/.test(part.text), "Delimitatori LaTeX incompleti");
    else {
      try {
        katex.renderToString(part.math!, { throwOnError: true, trust: false, strict: "ignore", maxExpand: 1000 });
      } catch (error) {
        throw new BankError(`formula non valida: ${(error as Error).message}`);
      }
    }
  }
}

function text(value: unknown, label: string): string {
  need(typeof value === "string" && value.trim() !== "", `${label}: testo vuoto o non valido`);
  return value.trim();
}

export function parseBank(id: string, source: string): QuestionBank {
  need(new TextEncoder().encode(source).length <= MAX_BYTES, "File oltre 20 MiB");
  let data: unknown;
  try {
    data = JSON.parse(source.replace(/^﻿/, ""));
  } catch {
    throw new BankError("JSON non valido: controllare virgole e barre inverse delle formule.");
  }
  const root = data as { versione?: unknown; titolo?: unknown; argomenti?: unknown };
  need(root && root.versione === 1 && Array.isArray(root.argomenti) && root.argomenti.length > 0, "Servono versione 1 e argomenti non vuoti.");
  const ids = new Set<string>(),
    topics = new Set<string>(),
    difficulties = new Set<Difficulty>();
  const questions: BankQuestion[] = [];
  for (const raw of root.argomenti as unknown[]) {
    const t = raw as { id?: unknown; nome?: unknown; domande?: unknown };
    const topic = text(t.id, "ID argomento"),
      topicName = text(t.nome, "Nome argomento");
    need(!topics.has(topic), `ID argomento ripetuto: ${topic}`);
    topics.add(topic);
    need(Array.isArray(t.domande) && t.domande.length > 0, "Argomento senza domande");
    for (const rawQuestion of t.domande as unknown[]) {
      const q = rawQuestion as { id?: unknown; difficolta?: unknown; testo?: unknown; alternative?: unknown; corretta?: unknown; spiegazione?: unknown; tipologia?: unknown };
      const qid = text(q.id, "ID domanda");
      need(!ids.has(qid), `ID domanda ripetuto: ${qid}`);
      ids.add(qid);
      const difficulty = text(q.difficolta, qid).toLowerCase() as Difficulty;
      need(DIFFICULTIES.includes(difficulty), `${qid}: difficoltà non valida`);
      difficulties.add(difficulty);
      const body = text(q.testo, qid);
      need(Array.isArray(q.alternative) && q.alternative.length === 4, `${qid}: servono quattro alternative`);
      const options = (q.alternative as unknown[]).map((a) => text(a, qid));
      need(new Set(options).size === 4, `${qid}: alternative duplicate`);
      const letter = text(q.corretta, qid).toUpperCase();
      need(/^[ABCD]$/.test(letter), `${qid}: corretta deve essere A–D`);
      need(q.spiegazione === undefined || typeof q.spiegazione === "string", `${qid}: spiegazione non valida`);
      const explanation = (q.spiegazione as string | undefined) || "";
      for (const value of [body, ...options, explanation]) {
        try {
          validateMath(value);
        } catch (error) {
          throw new BankError(`${qid}: ${(error as Error).message}`);
        }
      }
      questions.push({
        id: qid,
        topic,
        topicName,
        difficulty,
        text: body,
        options,
        correctIndex: "ABCD".indexOf(letter),
        explanation,
        type: typeof q.tipologia === "string" ? q.tipologia : "",
      });
    }
  }
  need(DIFFICULTIES.every((d) => difficulties.has(d)), "La banca deve includere domande facili, medie e difficili");
  return { id, title: typeof root.titolo === "string" ? root.titolo : "Banca domande", questions };
}

export function parseCatalog(source: string): CatalogEntry[] {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new BankError("Catalogo delle domande non valido.");
  }
  const root = data as { versione?: unknown; banche?: unknown };
  need(root && root.versione === 1 && Array.isArray(root.banche) && root.banche.length > 0, "Nessuna banca domande disponibile.");
  const ids = new Set<string>();
  return (root.banche as unknown[]).map((raw) => {
    const entry = raw as { id?: unknown; nome?: unknown; url?: unknown };
    need(typeof entry.id === "string" && entry.id.trim() !== "" && !ids.has(entry.id), "Catalogo delle domande non valido.");
    need(typeof entry.nome === "string" && entry.nome.trim() !== "", "Catalogo delle domande non valido.");
    // Solo file della cartella dataset/: niente percorsi esterni o risalite.
    need(typeof entry.url === "string" && /^dataset\/[\w.-]+\.json$/.test(entry.url), "Indirizzo della banca non valido.");
    ids.add(entry.id);
    return { id: entry.id, name: entry.nome, url: entry.url };
  });
}
