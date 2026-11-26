/**
 * Caricamento nel browser delle banche della versione precedente: catalogo
 * `datasets.json` e file `dataset/*.json` della radice del sito, inclusi dalla
 * build di Vite come testo e letti con le stesse regole (`bank.ts`). Ogni
 * banca è un blocco separato, caricato solo quando serve.
 */
import catalogSource from "../../../datasets.json?raw";
import { BankError, parseBank, parseCatalog, type CatalogEntry, type QuestionBank } from "./bank.ts";

const files = import.meta.glob<string>("../../../dataset/*.json", { query: "?raw", import: "default" });

export const CATALOG: readonly CatalogEntry[] = parseCatalog(catalogSource);

export async function loadBank(entry: CatalogEntry): Promise<QuestionBank> {
  const load = files[`../../../${entry.url}`];
  if (!load) throw new BankError(`Banca ${entry.id} non trovata (${entry.url}).`);
  return parseBank(entry.id, await load());
}
