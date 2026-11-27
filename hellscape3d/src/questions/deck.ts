/**
 * Domande della partita: per ogni momento di domanda (partita, turno,
 * giocatore) la domanda assegnata, l'ordine delle alternative e la risposta
 * data. Il registro si salva appena cambia, separato dal salvataggio del
 * motore, che riceve soltanto l'esito: un ricaricamento ripropone la stessa
 * domanda e non permette di rispondere di nuovo a una domanda già risposta.
 *
 * Scelta (provvisoria): fra le domande della difficoltà richiesta si prende a
 * caso, con un flusso derivato dal seme, una non ancora uscita nella partita;
 * esaurite quelle, la meno recente. Le alternative vengono rimescolate, come
 * nella versione precedente.
 */
import { rngFromSeed } from "../logic/rng.ts";
import type { KeyValueStorage } from "../logic/persistence.ts";
import type { Difficulty } from "../logic/types.ts";
import { DEFAULT_QUESTION_SECONDS } from "../ui/timer.ts";
import type { BankQuestion, QuestionBank } from "./bank.ts";

export const QUESTION_LOG_KEY = "hellscape3d-domande";
const LOG_FORMAT = "hellscape3d-domande";
/** 2: argomenti scelti e durata del timer, impostati con la partita (schermata di avvio). */
const LOG_VERSION = 2;

/** Risposta data: indice dell'alternativa nell'ordine mostrato, oppure tempo scaduto. */
export type GivenAnswer = number | "timeout";

export interface AskedQuestion {
  key: string;
  questionId: string;
  /** Ordine mostrato: `order[i]` è l'indice nella banca dell'alternativa mostrata in posizione i. */
  order: number[];
  answer: GivenAnswer | null;
}

export interface QuestionLog {
  format: typeof LOG_FORMAT;
  version: typeof LOG_VERSION;
  /** Seme della città: lega il registro alla partita salvata. */
  seed: string;
  bankId: string;
  /** Argomenti in gioco; vuoto = tutti quelli della banca. */
  topics: string[];
  /** Durata della domanda, in secondi. */
  seconds: number;
  asked: AskedQuestion[];
}

/** Domanda come la vede il giocatore. */
export interface PresentedQuestion {
  key: string;
  id: string;
  difficulty: Difficulty;
  topic: string;
  topicName: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answer: GivenAnswer | null;
}

export type AnswerOutcome = "correct" | "wrong" | "timeout";

export function newLog(seed: string, bankId: string, options: { topics?: readonly string[]; seconds?: number } = {}): QuestionLog {
  return { format: LOG_FORMAT, version: LOG_VERSION, seed, bankId, topics: [...(options.topics ?? [])], seconds: options.seconds ?? DEFAULT_QUESTION_SECONDS, asked: [] };
}

/** Domande della banca negli argomenti in gioco. */
export function inPlay(bank: QuestionBank, topics: readonly string[]): BankQuestion[] {
  return topics.length === 0 ? bank.questions : bank.questions.filter((q) => topics.includes(q.topic));
}

/** Domanda già assegnata a `key`, oppure assegnazione di una nuova (il registro restituito la contiene). */
export function ask(log: QuestionLog, bank: QuestionBank, key: string, difficulty: Difficulty): { log: QuestionLog; asked: AskedQuestion } {
  const existing = log.asked.find((a) => a.key === key);
  if (existing) return { log, asked: existing };
  // Argomenti scelti; se non hanno domande di questo livello (la schermata di avvio lo impedisce) si usa tutta la banca.
  const chosen = inPlay(bank, log.topics).filter((q) => q.difficulty === difficulty);
  const candidates = chosen.length > 0 ? chosen : bank.questions.filter((q) => q.difficulty === difficulty);
  if (candidates.length === 0) throw new Error(`Nessuna domanda ${difficulty} nella banca ${bank.id}`);
  const rng = rngFromSeed(log.seed, `domanda:${bank.id}:${key}`);
  const lastAsked = new Map<string, number>();
  log.asked.forEach((a, index) => lastAsked.set(a.questionId, index));
  const unused = candidates.filter((q) => !lastAsked.has(q.id));
  let question: BankQuestion;
  if (unused.length > 0) question = rng.pick(unused);
  else {
    const oldest = Math.min(...candidates.map((q) => lastAsked.get(q.id)!));
    question = candidates.find((q) => lastAsked.get(q.id) === oldest)!;
  }
  const asked: AskedQuestion = { key, questionId: question.id, order: rng.shuffle([0, 1, 2, 3]), answer: null };
  return { log: { ...log, asked: [...log.asked, asked] }, asked };
}

export function present(bank: QuestionBank, asked: AskedQuestion): PresentedQuestion {
  const question = bank.questions.find((q) => q.id === asked.questionId);
  if (!question) throw new Error(`Domanda ${asked.questionId} assente dalla banca ${bank.id}`);
  return {
    key: asked.key,
    id: question.id,
    difficulty: question.difficulty,
    topic: question.topic,
    topicName: question.topicName,
    text: question.text,
    options: asked.order.map((i) => question.options[i]!),
    correctIndex: asked.order.indexOf(question.correctIndex),
    explanation: question.explanation,
    answer: asked.answer,
  };
}

/** Registra la risposta; una domanda già risposta non cambia. */
export function recordAnswer(log: QuestionLog, key: string, answer: GivenAnswer): QuestionLog {
  return { ...log, asked: log.asked.map((a) => (a.key === key && a.answer === null ? { ...a, answer } : a)) };
}

export function outcomeOf(question: Pick<PresentedQuestion, "correctIndex" | "answer">): AnswerOutcome {
  if (question.answer === null) throw new Error("Domanda senza risposta");
  return question.answer === "timeout" ? "timeout" : question.answer === question.correctIndex ? "correct" : "wrong";
}

export function saveLog(storage: KeyValueStorage, log: QuestionLog): void {
  storage.setItem(QUESTION_LOG_KEY, JSON.stringify(log));
}

/**
 * Registro della partita con seme `seed`, se presente e leggibile; null
 * altrimenti (partita nuova, registro di un'altra partita o danneggiato).
 * Le domande non più presenti nella banca indicata invalidano il registro.
 */
export function loadLog(storage: KeyValueStorage, seed: string, bank?: QuestionBank): QuestionLog | null {
  let data: unknown;
  try {
    data = JSON.parse(storage.getItem(QUESTION_LOG_KEY) ?? "null");
  } catch {
    return null;
  }
  const log = data as Partial<QuestionLog> | null;
  if (!log || log.format !== LOG_FORMAT || log.version !== LOG_VERSION || log.seed !== seed || typeof log.bankId !== "string" || !Array.isArray(log.asked)) return null;
  if (!Array.isArray(log.topics) || !log.topics.every((t) => typeof t === "string") || !(Number.isFinite(log.seconds) && log.seconds! >= 1)) return null;
  if (bank && !log.topics.every((t) => bank.questions.some((q) => q.topic === t))) return null;
  const ids = bank ? new Set(bank.questions.map((q) => q.id)) : null;
  const keys = new Set<string>();
  for (const a of log.asked as unknown[]) {
    const item = a as Partial<AskedQuestion>;
    if (typeof item.key !== "string" || keys.has(item.key) || typeof item.questionId !== "string") return null;
    keys.add(item.key);
    if (ids && !ids.has(item.questionId)) return null;
    if (!Array.isArray(item.order) || [...item.order].sort().join() !== "0,1,2,3") return null;
    const answer = item.answer;
    if (!(answer === null || answer === "timeout" || (Number.isInteger(answer) && (answer as number) >= 0 && (answer as number) < 4))) return null;
  }
  return log as QuestionLog;
}
