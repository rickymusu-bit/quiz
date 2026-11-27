/**
 * Schermata di avvio (provvisoria): banca di domande e argomenti, giocatori e
 * durata della domanda. Si apre quando non c'è una partita da riprendere o
 * quando se ne chiede una nuova; è precompilata con le ultime impostazioni.
 * Restituisce le impostazioni scelte; la pagina crea la partita.
 */
import type { CatalogEntry, QuestionBank } from "../questions/bank.ts";
import { MAX_PLAYERS } from "../logic/engine.ts";
import { defaultName, missingDifficulties, NAME_MAX, SECONDS_RANGE, settingsIssues, type GameSettings } from "../session.ts";

export interface SetupOptions {
  catalog: readonly CatalogEntry[];
  loadBank: (entry: CatalogEntry) => Promise<QuestionBank>;
  /** Ultime impostazioni usate, se ci sono. */
  initial: GameSettings | null;
  notice: string | null;
  /** Esiste una partita salvata da riprendere. */
  saved: boolean;
  /** Durata proposta se non ci sono impostazioni precedenti. */
  defaultSeconds: number;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function showSetup(host: HTMLElement, options: SetupOptions): Promise<GameSettings> {
  return new Promise((resolve) => {
    const form = el("form", { class: "setup", id: "setup", "aria-labelledby": "setup-title" });
    form.noValidate = true;
    form.append(el("h1", { id: "setup-title" }, "Nuova partita"));
    if (options.notice) form.append(el("p", { class: "setup-notice", role: "alert" }, options.notice));
    if (options.saved) {
      const resume = el("button", { type: "button", id: "setup-resume", class: "setup-secondary" }, "Riprendi la partita salvata");
      resume.addEventListener("click", () => {
        location.search = "";
      });
      form.append(resume);
    }

    // Banca e argomenti.
    const bankField = el("label", { class: "setup-field" });
    bankField.append(el("span", {}, "Banca di domande"));
    const bankSelect = el("select", { id: "setup-bank" });
    for (const entry of options.catalog) bankSelect.append(el("option", { value: entry.id }, entry.name));
    bankSelect.value = options.catalog.some((e) => e.id === options.initial?.bankId) ? options.initial!.bankId : options.catalog[0]!.id;
    bankField.append(bankSelect);
    const topicsField = el("fieldset", { class: "setup-topics", id: "setup-topics" });
    topicsField.append(el("legend", {}, "Argomenti"));
    const topicsList = el("div", { class: "setup-topic-list" });
    const allButton = el("button", { type: "button", class: "setup-small" }, "Tutti");
    const noneButton = el("button", { type: "button", class: "setup-small" }, "Nessuno");
    const topicsTools = el("div", { class: "setup-row" });
    topicsTools.append(allButton, noneButton);
    topicsField.append(topicsTools, topicsList);

    // Giocatori e durata.
    const playersField = el("label", { class: "setup-field" });
    playersField.append(el("span", {}, "Giocatori"));
    const count = el("select", { id: "setup-players" });
    for (let n = 1; n <= MAX_PLAYERS; n++) count.append(el("option", { value: String(n) }, String(n)));
    const initialNames = options.initial?.players.length ? options.initial.players : [defaultName(0), defaultName(1)];
    count.value = String(Math.min(MAX_PLAYERS, initialNames.length));
    playersField.append(count);
    const names = el("div", { class: "setup-names", id: "setup-names" });
    const secondsField = el("label", { class: "setup-field" });
    secondsField.append(el("span", {}, "Secondi per domanda"));
    const seconds = el("input", { id: "setup-seconds", type: "number", min: String(SECONDS_RANGE[0]), max: String(SECONDS_RANGE[1]), step: "5", inputmode: "numeric" });
    seconds.value = String(options.initial?.seconds ?? options.defaultSeconds);
    secondsField.append(seconds);

    const issues = el("p", { class: "setup-issues", id: "setup-issues", "aria-live": "polite" });
    const start = el("button", { type: "submit", id: "setup-start", class: "setup-primary" }, "Inizia la partita");
    form.append(bankField, topicsField, playersField, names, secondsField, issues, start);
    host.append(form);

    let bank: QuestionBank | null = null;
    let playerNames: string[] = [...initialNames];
    const renderNames = (): void => {
      const n = Number(count.value);
      playerNames = Array.from({ length: n }, (_, i) => playerNames[i] ?? defaultName(i));
      names.replaceChildren();
      playerNames.forEach((name, i) => {
        const label = el("label", { class: "setup-field setup-name-field" });
        label.append(el("span", {}, `Giocatore ${i + 1}`));
        const input = el("input", { class: "setup-name", type: "text", maxlength: String(NAME_MAX), autocomplete: "off" });
        input.value = name;
        input.addEventListener("input", () => {
          playerNames[i] = input.value;
          validate();
        });
        label.append(input);
        names.append(label);
      });
    };
    const selectedTopics = (): string[] => [...topicsList.querySelectorAll<HTMLInputElement>("input:checked")].map((i) => i.value);
    const settings = (): GameSettings => {
      const all = topicsList.querySelectorAll("input").length;
      const chosen = selectedTopics();
      return {
        bankId: bankSelect.value,
        // Tutti gli argomenti selezionati: elenco vuoto, così la partita segue la banca intera.
        topics: chosen.length === all ? [] : chosen,
        players: playerNames.slice(0, Number(count.value)).map((name, i) => name.trim() || defaultName(i)),
        seconds: Number(seconds.value),
      };
    };
    const validate = (): string[] => {
      if (!bank) {
        start.disabled = true;
        return ["banca in caricamento"];
      }
      const chosen = selectedTopics();
      // Un nome lasciato vuoto prende quello predefinito.
      const found = chosen.length === 0 ? ["scegli almeno un argomento"] : settingsIssues(settings(), bank);
      issues.textContent = found.length > 0 ? `Per cominciare: ${found.join("; ")}.` : "";
      start.disabled = found.length > 0;
      return found;
    };
    const loadTopics = async (): Promise<void> => {
      start.disabled = true;
      const entry = options.catalog.find((e) => e.id === bankSelect.value)!;
      bank = null;
      topicsList.replaceChildren(el("p", {}, "Caricamento…"));
      const loaded = await options.loadBank(entry);
      bank = loaded;
      const initialTopics = options.initial?.bankId === loaded.id ? options.initial.topics : [];
      const topics = [...new Map(loaded.questions.map((q) => [q.topic, q.topicName])).entries()];
      topicsList.replaceChildren();
      for (const [id, name] of topics) {
        const label = el("label", { class: "setup-topic" });
        const box = el("input", { type: "checkbox", value: id });
        box.checked = initialTopics.length === 0 || initialTopics.includes(id);
        box.addEventListener("change", () => validate());
        const total = loaded.questions.filter((q) => q.topic === id).length;
        const missing = missingDifficulties(loaded, [id]);
        label.append(box, el("span", {}, `${name} · ${total} domande${missing.length ? ` (senza ${missing.join(", ")})` : ""}`));
        topicsList.append(label);
      }
      validate();
    };
    allButton.addEventListener("click", () => {
      topicsList.querySelectorAll<HTMLInputElement>("input").forEach((i) => (i.checked = true));
      validate();
    });
    noneButton.addEventListener("click", () => {
      topicsList.querySelectorAll<HTMLInputElement>("input").forEach((i) => (i.checked = false));
      validate();
    });
    bankSelect.addEventListener("change", () => void loadTopics());
    count.addEventListener("change", () => {
      renderNames();
      validate();
    });
    seconds.addEventListener("input", () => validate());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (validate().length > 0) return;
      const chosen = settings();
      form.remove();
      resolve(chosen);
    });
    renderNames();
    void loadTopics();
    bankSelect.focus();
  });
}
