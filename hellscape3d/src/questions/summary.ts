/**
 * Riepilogo delle domande a fine partita (provvisorio), ricavato soltanto dal
 * registro delle domande e dalla banca: per giocatore, per argomento e
 * l'elenco in ordine di turno. Le domande senza risposta (partita interrotta
 * su una domanda aperta) non vi compaiono.
 */
import type { Difficulty } from "../logic/types.ts";
import type { QuestionBank } from "./bank.ts";
import { outcomeOf, present, type AnswerOutcome, type QuestionLog } from "./deck.ts";

export interface Tally {
  correct: number;
  wrong: number;
  timeout: number;
  total: number;
}

export interface SummaryItem {
  turn: number;
  playerId: string;
  playerName: string;
  topicName: string;
  difficulty: Difficulty;
  text: string;
  /** Risposta data, nel testo mostrato; null se il tempo è scaduto. */
  given: string | null;
  correctAnswer: string;
  outcome: AnswerOutcome;
  explanation: string;
}

export interface GameSummary {
  players: (Tally & { id: string; name: string })[];
  topics: (Tally & { topic: string; name: string })[];
  items: SummaryItem[];
}

const emptyTally = (): Tally => ({ correct: 0, wrong: 0, timeout: 0, total: 0 });

function count(tally: Tally, outcome: AnswerOutcome): void {
  tally[outcome]++;
  tally.total++;
}

/** Turno e giocatore dalla chiave della domanda (`seme:q:turno:giocatore`, vedi `questionKey`). */
export function parseQuestionKey(key: string): { turn: number; playerId: string } | null {
  const parts = key.split(":");
  const playerId = parts.at(-1),
    turn = Number(parts.at(-2));
  return parts.length >= 4 && parts.at(-3) === "q" && playerId && Number.isInteger(turn) ? { turn, playerId } : null;
}

export function summarize(log: QuestionLog, bank: QuestionBank, players: readonly { id: string; name: string }[]): GameSummary {
  const byPlayer = new Map(players.map((p) => [p.id, { id: p.id, name: p.name, ...emptyTally() }]));
  const byTopic = new Map<string, Tally & { topic: string; name: string }>();
  const items: SummaryItem[] = [];
  for (const asked of log.asked) {
    if (asked.answer === null) continue;
    const where = parseQuestionKey(asked.key);
    const player = where && byPlayer.get(where.playerId);
    if (!where || !player) continue;
    const question = present(bank, asked);
    const source = bank.questions.find((q) => q.id === question.id)!;
    const outcome = outcomeOf(question);
    count(player, outcome);
    const topic = byTopic.get(source.topic) ?? { topic: source.topic, name: source.topicName, ...emptyTally() };
    count(topic, outcome);
    byTopic.set(source.topic, topic);
    items.push({
      turn: where.turn,
      playerId: player.id,
      playerName: player.name,
      topicName: source.topicName,
      difficulty: question.difficulty,
      text: question.text,
      given: question.answer === "timeout" ? null : question.options[question.answer as number]!,
      correctAnswer: question.options[question.correctIndex]!,
      outcome,
      explanation: question.explanation,
    });
  }
  // Argomenti nell'ordine della banca; domande in ordine di turno, poi di giocatore.
  const topicOrder = [...new Set(bank.questions.map((q) => q.topic))];
  const playerOrder = players.map((p) => p.id);
  return {
    players: [...byPlayer.values()],
    topics: [...byTopic.values()].sort((a, b) => topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic)),
    items: items.sort((a, b) => a.turn - b.turn || playerOrder.indexOf(a.playerId) - playerOrder.indexOf(b.playerId)),
  };
}
