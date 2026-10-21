# Fool

Quiz di Riccardo Musumarra. **App 1.0.0**, regolamento **18.0.1** del 21/10/2026.

- Scarica e apri [Fool.html](Fool.html) nel browser: è il programma autonomo del quiz.
- Scarica e apri [Fool_regole.html](Fool_regole.html): 21 schermate delle regole per la classe, con indice, pulsanti e frecce della tastiera.
- Per giocare, carica [Dataset_termologia_100_domande_v1_20261021.json](Dataset_termologia_100_domande_v1_20261021.json), oppure una banca compatibile con il [template](Template_dataset_quiz_argomenti_v1_20261008.json). Il template contiene esempi e non basta da solo per 33 domande.

I due HTML funzionano indipendentemente, senza installazioni, server, account o CDN. Le formule e i relativi caratteri sono incorporati in Fool.html. Tenere entrambi i file nella stessa cartella permette di aprire il collegamento alle regole dalla copertina; il gioco non richiede l'altro HTML per funzionare. Non è stata attivata alcuna pubblicazione o configurazione di hosting.

## Conduzione e ripresa

Il docente usa un dispositivo e inserisce le risposte comunicate dai portavoce. Prima della proiezione, sceglie tre nomi distinti, tempo, punti base, probabilità bonus, difficoltà e quote per argomento. La somma delle quote deve essere 33. L'anteprima contiene soluzioni e spiegazioni: è riservata alla preparazione del docente, senza autenticazione separata.

Il primo gruppo è sorteggiato; la rotazione è mostrata sul tabellone. Il programma gestisce serie, bonus e bersagli vincolati, sanzioni, rifiuti, campanella, eliminazioni e Battaglia finale. Il pannello sanzioni consente di registrare tutto l'intervento su più gruppi prima di valutare il vincitore. Chiuderlo non riavvia il timer.

Usare **Salva file** e conservare il JSON della partita per la lezione successiva. L'autosalvataggio locale è aggiuntivo: il browser può limitarlo o cancellarlo. **Importa partita** o **Riprendi autosalvataggio** ripristinano lo stato senza avviare il timer. Una scelta bonus non ancora confermata conserva copia e bersaglio, senza consumi anticipati. I file di partita contengono anche le soluzioni e sono destinati al docente. I salvataggi dei vecchi HTML non sono compatibili e non vengono reinterpretati.

Alla campanella una domanda svelata deve essere conclusa; solo dopo l'esito si sospende. **Salva file** durante una risposta è un salvataggio tecnico di emergenza e non sostituisce questa regola. All'esaurimento della riserva si possono caricare quesiti con ID nuovi, nel medesimo formato, per argomenti e difficoltà selezionati. Non occorre un file Vero/Falso.

## Schermo e aspetto

Dimensioni supportate e verificate: **1280×800, 1440×900, 1920×1080 pixel CSS**, a zoom 100%. Testo operativo minimo 18 px, domande 22,5 px, alternative 18,9 px; le etichette di servizio possono essere più piccole. I contenuti operativi non vengono tagliati o ridotti sotto queste dimensioni per farli entrare. Prima dell'inizio sono verificate tutte le domande estratte con soluzioni e spiegazioni; ogni successivo quesito è verificato prima dello svelamento. Contenuti e nomi arbitrariamente lunghi possono essere segnalati come non idonei: allargare la finestra o correggere i contenuti. Se il ridimensionamento rende inidonea una risposta, il timer viene messo in pausa.

Veste provvisoria ispirata a Doom classico: pannelli scuri, bordi squadrati, griglia pixel, titoli monospaziati e accento ambra. Palette, font specifici e logo restano scelte sostituibili, non preferenze approvate. Nessun suono aggiunto. L'app non contiene risorse grafiche di Doom.

## Fonti e verifiche

- [Regolamento ufficiale](docs/REGOLAMENTO_UFFICIALE.md), autorità normativa.
- [Specifiche del programma](docs/SPECIFICHE_PROGRAMMA.md).
- [Aspetto grafico](docs/ASPETTO_GRAFICO.md).
- [Istruzioni di implementazione](docs/PROMPT_CODEX_AVVIO_HTML.md).
- [Avanzamento, tracciabilità e verifiche realmente eseguite](docs/VERIFICHE_IMPLEMENTAZIONE.md).
- [Prompt per generare dataset](Prompt_generazione_dataset_quiz_v2_20261021.txt).

I due HTML storici sono conservati **identici**, con i nomi originali, in [archivio/](archivio/). Non sono il programma o le regole attuali. [PROVENIENZA.json](PROVENIENZA.json) conserva i percorsi e gli hash originari del trasferimento da `rickymusu-bit/fisica`: non sono stati riscritti per l'archiviazione.

## Sorgenti e rigenerazione

Il motore, separato dal DOM, è in `src/engine.js`; interfaccia, stile e regole proiettate sono in `src/`. Il renderer KaTeX 0.16.22 e i font incorporati provengono dal vecchio HTML; l'avviso MIT è conservato in `vendor/LICENSE-KaTeX.txt` e nel distribuibile.

```sh
python3 tools/build.py
node tests/engine.test.js
python3 tests/browser.py
python3 tests/layout.py
```

La rigenerazione usa soltanto la libreria standard Python. I test motore usano Node; i test browser richiedono Python Playwright e Chromium (`/usr/bin/chromium`). Gli strumenti di sviluppo non servono per aprire gli HTML.
