# Fool — solo online

Sito: https://rickymusu-bit.github.io/quiz/

Interfaccia 1.9.0 (motore 1.2.0), regolamento 18.2.0. GitHub Pages pubblica il ramo `main`, cartella `/`.

Il sito offre il quiz e le regole direttamente nel browser. Non sono presenti pulsanti di download, selettori di file o importazione/esportazione delle partite. Le domande vengono caricate automaticamente dal catalogo `datasets.json` e dalle banche pubblicate sul sito. Il dataset rimane una risorsa interna del sito, senza collegamenti di download per l'utente.

La partita si conserva automaticamente nello stesso browser. Non viene sincronizzata su altri dispositivi; cancellare i dati del sito elimina il salvataggio locale. Il motore e le regole sono invariati.

I sorgenti e le istruzioni per rigenerare le pagine sono nel ramo `codex/fool-offline-18-0-1` e nella pull request #1. Il nome storico del ramo non descrive la distribuzione corrente, che è solo online.

## Generazione delle domande

Per generare o revisionare quesiti delle banche Fool, utilizzare [il prompt dedicato](docs/PROMPT_GENERAZIONE_DOMANDE.md), adattato dai criteri didattici di Stringhe ma conforme a tempi, classificazioni e schema JSON di Fool. Il prompt non cambia il motore né autorizza nuove domande o la pubblicazione.

## Identità e schermi

Home con logo ufficiale fornito dal responsabile, sottotitolo «Solo uno sciocco pensa di vincere» e menu verticale Start/Regole. Sfondo pixel con cielo rosso e pavimento di pietra, ispirato a Doom del 1993. Start apre direttamente la configurazione.

Home, gioco, dialoghi e regole si adattano alla larghezza della finestra, senza il precedente blocco minimo 1280×800. Su mobile i dettagli dei gruppi sono espandibili; testo e comandi possono scorrere verticalmente. Formule molto larghe scorrono nel loro riquadro. Sono stati verificati desktop, telefono, orientamento orizzontale, touch, tastiera e testi ingranditi.

Logo, sfondo e carattere sono in `assets/`, con provenienza in `assets/README.md` e licenza del carattere in `assets/vt323-license.txt`.

La home unica è `/quiz/`: «Torna alla schermata iniziale» e il logo riportano a quell’indirizzo. `Fool.html` apre la configurazione e permette la ripresa, senza una copertina interna duplicata.

Anche nelle regole è presente un pulsante esplicito «Torna alla schermata iniziale».

Il logo corrente è `assets/fool-logo.png`: le superfici blu sono ora grigio antracite/nero, con accenti arancioni e dorati conservati.

## Massacro

Dopo 33 domande si elimina il gruppo con il punteggio minimo, se ultimo univoco; in caso di parità all'ultimo posto nessun gruppo viene escluso arbitrariamente. I gruppi rimasti si sfidano con tre domande difficili consecutive ciascuno. Vince chi ne indovina di più; i gruppi ancora in parità al primo posto ripetono nuove batterie da tre. Le domande sono inedite nella partita e tratte dagli argomenti selezionati. I bonus sono disattivati. I salvataggi con regole precedenti non vengono reinterpretati automaticamente.

## Correzione Start — 1.7.2

Corretta una parentesi graffa in eccesso nella transizione del Massacro: interrompeva il parsing JavaScript e lasciava vuota la schermata aperta da Start. Nessuna modifica alle regole del Massacro. `python3 tests/start.py` controlla la sintassi degli script incorporati e l’avvio dalla home, normale e a schermo intero, con entrambe le banche e ripresa della partita. Richiede Node, Python Playwright e Chromium.

## Comandi da tastiera — 1.7.3

Con una domanda svelata, **A, B, C, D** selezionano la risposta corrispondente. Dopo l’esito, **Invio** apre la prossima domanda, ancora nascosta. Con una nuova pressione di **Invio**, si svela direttamente la domanda e si avvia il timer. Le scorciatoie sono disattivate durante pausa, sospensione, pannelli aperti, selezione bonus e scrittura nei campi; i tasti mantenuti premuti non ripetono le azioni. Invio conserva il comportamento normale su altri pulsanti o collegamenti che hanno il focus. `python3 tests/keyboard.py` verifica comandi, protezioni e ripresa anche a schermo intero.

## Comandi e correzioni — 1.8.1

Bonus e inventari sono accanto a Svela e restano disponibili con la domanda svelata. Svela, anche da Invio, mostra direttamente la domanda e avvia il timer, senza conferma intermedia.

Gli altri comandi sono raccolti nella sezione espandibile Opzioni in fondo alla partita. Riassegna punti permette di impostare il totale di un gruppo scrivendolo nella casella o usando + e − (un punto per pressione). Non è richiesto un motivo. Mostra un’anteprima e applica il totale solo dopo Conferma modifica. Conserva frazioni esatte, bonus e moltiplicatore e registra la correzione nel salvataggio. Il totale non può diventare negativo. Durante una domanda il pannello mette in pausa il timer, che il docente riprende esplicitamente da Opzioni. Nel Massacro i punti ordinari non si modificano.

`python3 tests/options.py` verifica posizione bonus, svelamento diretto, pulsanti +/−, modifica del totale e annullamento, frazioni esatte, salvataggio/ripresa e pausa del timer su desktop e a schermo intero.

## Domande configurabili e bonus indipendenti — 1.9.0

In Impostazioni si sceglie un multiplo di 3 fra 3 e 99 domande (33 predefinite), rispettando disponibilità della banca e quote degli argomenti. Anteprima, contatori e passaggio al Massacro seguono quel totale. Ogni bonus — Nope, Irpef, Spoiler, Aura e Karma — ha una probabilità indipendente, predefinita al 30%, modificabile da 0 a 100%. Per una risposta corretta si possono vincere da zero a cinque bonus distinti: tutti compaiono nell’esito e vengono evidenziati nel riquadro del gruppo. Prima di svelare si possono attivare più copie di bonus nello stesso turno; il Massacro resta senza bonus.

I vecchi salvataggi conservano domande, ordine, punteggi, timer e inventari. Quando mancano i nuovi campi, valgono 33 domande e probabilità indipendenti del 30%. Le vecchie impostazioni mantengono gli altri parametri e possono essere risalvate con i nuovi campi.

Verifiche della PR #3: `node tests/engine.test.js` per estrazioni, probabilità indipendenti, attivazioni multiple, 99 domande, Massacro e vecchi salvataggi; `python3 tests/configurable.py` per impostazioni, anteprima, risultati con cinque bonus e ripresa; regressioni `tests/start.py`, `tests/keyboard.py`, `tests/options.py`. Le probabilità non devono sommare al 100%.
