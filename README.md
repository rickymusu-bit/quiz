# Fool

Quiz online di Riccardo Musumarra. **Interfaccia 1.1.0**, regolamento **18.0.1**.

Apri **https://rickymusu-bit.github.io/quiz/** e scegli **Avvia il quiz** o **Scopri le regole**. Non sono previsti download, installazioni o selettori di file.

## Domande già sul sito

Il gioco legge il catalogo `datasets.json` e carica automaticamente la banca selezionata dal sito. È disponibile Termologia, con 100 domande. Il docente configura tre gruppi distinti, tempo, punti base, probabilità bonus, difficoltà e quote per argomento; la somma delle quote deve essere 33. Configurazione e anteprima mostrano le soluzioni e si usano prima di proiettare alla classe.

Il catalogo contiene `versione: 1` e l'elenco `banche`, ciascuna con `id`, `nome` e `url` relativa al sito. Per aggiungere una banca, pubblicare il relativo contenuto nello schema esistente e aggiungerla al catalogo. Le domande mantengono il contratto del dataset e i loro ID originali. Il catalogo e le banche devono provenire dallo stesso sito; errori di rete o validazione bloccano l'avvio e offrono **Riprova**.

All'esaurimento della riserva, **Cerca nuove domande** verifica gli aggiornamenti delle banche online. Inserisce soltanto nuovi ID compatibili con gli argomenti e la difficoltà della partita; non ripropone le domande già note, non sovrascrive quesiti modificati e non assegna una vittoria perché mancano domande.

## Salvataggio nello stesso browser

La partita viene salvata automaticamente nel browser. **Salva nel browser** permette un salvataggio esplicito; **Riprendi partita** sulla copertina recupera l'ultima partita conservata da quel browser, mantenendo il timer fermo fino al comando del docente. Non sono presenti importazione o esportazione di file. Le partite non sono sincronizzate tra dispositivi e la cancellazione dei dati del sito elimina il salvataggio locale.

Alla campanella una domanda già svelata deve essere conclusa; solo dopo l'esito si sospende. Sanzioni prioritarie, serie, inventari e bonus vincolati, rifiuti, rotazione e Battaglia finale restano quelli del regolamento 18.0.1.

La nuova richiesta del responsabile di offrire il quiz solo online sostituisce i precedenti requisiti di distribuzione offline e scambio di file. Il motore e il formato di salvataggio restano compatibili con 1.0.0: le partite già conservate nello stesso browser vengono riprese senza modificare le regole.

## Schermo e aspetto

Dimensioni supportate e verificate: **1280×800, 1440×900, 1920×1080 pixel CSS**, a zoom 100%. Testo operativo minimo 18 px, domande 22,5 px, alternative 18,9 px; le etichette di servizio possono essere più piccole. I contenuti operativi non vengono tagliati o ridotti sotto queste dimensioni per farli entrare. Prima dell'inizio sono verificate tutte le domande estratte con soluzioni e spiegazioni; ogni successivo quesito è verificato prima dello svelamento. Contenuti e nomi arbitrariamente lunghi possono essere segnalati come non idonei: allargare la finestra o correggere i contenuti. Se il ridimensionamento rende inidonea una risposta, il timer viene messo in pausa.

Veste provvisoria ispirata a Doom classico: pannelli scuri, bordi squadrati, griglia pixel, titoli monospaziati e accento ambra. Palette, font specifici e logo restano scelte sostituibili, non preferenze approvate. Nessun suono aggiunto. L'app non contiene risorse grafiche di Doom.

## Fonti e verifiche

- [Regolamento ufficiale](docs/REGOLAMENTO_UFFICIALE.md), autorità normativa.
- [Specifiche del programma](docs/SPECIFICHE_PROGRAMMA.md).
- [Aspetto grafico](docs/ASPETTO_GRAFICO.md).
- [Istruzioni originali di implementazione](docs/PROMPT_CODEX_AVVIO_HTML.md), antecedenti alla richiesta di distribuzione solo online.
- [Avanzamento, tracciabilità e verifiche realmente eseguite](docs/VERIFICHE_IMPLEMENTAZIONE.md).
- [Prompt per generare dataset](Prompt_generazione_dataset_quiz_v2_20261021.txt).

I due HTML storici sono conservati **identici**, con i nomi originali, in [archivio/](archivio/). Non sono il programma o le regole attuali. [PROVENIENZA.json](PROVENIENZA.json) conserva i percorsi e gli hash originari del trasferimento da `rickymusu-bit/fisica`: non sono stati riscritti per l'archiviazione.

## Sorgenti e rigenerazione

Il motore, separato dal DOM, è in `src/engine.js`; interfaccia, stile e regole proiettate sono in `src/`. Il renderer KaTeX 0.16.22 e i font incorporati provengono dal vecchio HTML; l'avviso MIT è conservato in `vendor/LICENSE-KaTeX.txt` e nelle pagine del sito.

```sh
python3 tools/build.py
node tests/engine.test.js
python3 tests/browser.py
python3 tests/layout.py
python3 tests/online.py
```

La rigenerazione usa soltanto la libreria standard Python. I test motore usano Node; i test browser richiedono Python Playwright e Chromium (`/usr/bin/chromium`). Il sito generato è statico e viene pubblicato sul ramo `gh-pages`. `src/home.html` genera la pagina iniziale; `src/app.js` gestisce il caricamento online e i salvataggi nel browser.
