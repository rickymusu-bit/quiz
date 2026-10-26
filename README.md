# Hellscape - Fuga dall’inferno

Sito: https://rickymusu-bit.github.io/quiz/

**Applicazione 3.3.0 · Motore 2.2.1 · Regolamento 19.2.0 · 26/10/2026**

Hellscape è un quiz di fisica per tre giocatori, pubblicato su GitHub Pages dal ramo `main`. Il gioco carica automaticamente i quesiti dal catalogo `datasets.json`. Le domande appartengono a banche separate, associate a materie e argomenti; non è richiesto un server applicativo.

## Struttura e sviluppo

Il refactoring parte dalla head `f2a2458` della PR #17, ancora aperta al momento del lavoro. La PR di refactoring dipende da quelle correzioni; non modifica né integra la PR #17.

Il sito funziona direttamente come archivio statico, senza compilazione obbligatoria, framework o dipendenze JavaScript scaricate a runtime. I moduli usano IIFE con esportazioni CommonJS per i test Node: `core` → `datasets` → `engine`; `loader` dipende da `datasets`; `persistence` riceve storage e motore; `ui` coordina questi moduli. Non ci sono dipendenze circolari.

- `assets/js/core.js`: costanti, frazioni esatte e funzioni condivise.
- `assets/js/engine.js`: partita, turni, timer, punteggi, Ammo, sanzioni, spareggio, finali e validazione/migrazione dello stato. Si importa in Node senza DOM; l’API pubblica `Fool` resta disponibile.
- `assets/js/datasets.js`: parsing, validazione delle banche e notazione scientifica.
- `assets/js/loader.js`: catalogo e caricamento dal sito o dalle risorse incorporate nell’export.
- `assets/js/persistence.js`: accesso iniettato a storage, lettura/scrittura dei profili e ripresa attraverso il motore. Il sito conserva `fool-v1`, `fool-settings-v1` e il JSON esistente.
- `assets/js/ui.js`: configurazione, impostazioni, schermate, dialoghi, comandi e adattamento del palco. Lo stato dell’interfaccia è racchiuso nel modulo; `HellscapeUI` è la facciata esplicita usata dalle regressioni browser.
- `assets/css/game.css` e `assets/hellscape.css`: stili di base estratti e stili della grafica esistente, nello stesso ordine di cascata.
- `assets/hell-race.js`: componente Canvas separato; legge lo stato senza applicare transizioni al motore.
- `assets/vendor/katex.js` e `katex.css`: KaTeX 0.16.22 e font incorporati estratti senza riscrittura; licenza in `assets/vendor/README.md` e nell’HTML.
- `scripts/build.cjs`: copia statica e generazione dell’unico HTML offline dagli stessi sorgenti.

Servono Node 22 o successivo e Python 3.12 per i comandi di sviluppo. Il sito pubblicato non richiede Node o Python.

```sh
npm ci
python3 -m pip install -r requirements-test.txt
npm run dev             # http://127.0.0.1:8000
npm test                # motore, persistenza e 200 domande delle due banche
npm run test:frames     # 48 fotogrammi veicoli + 12 demone
npm run test:browser    # regressioni interfaccia e Canvas
npm run build           # dist/site, pubblicabile su hosting statico
npm run test:offline    # genera e verifica dist/Hellscape-offline.html
```

I test riutilizzano Chromium in `/usr/bin/chromium`; per un altro eseguibile impostare `CHROMIUM_PATH`. Se non è presente un browser, installarlo con `npx playwright install --with-deps chromium` e impostare `CHROMIUM_PATH` al percorso restituito da `node -p "require('playwright').chromium.executablePath()"`. La generazione dell’export usa soltanto librerie standard di Node.

GitHub Pages può continuare a pubblicare la radice del ramo `main`, con gli stessi URL `index.html`, `Fool.html`, `Fool_regole.html`, catalogo, dataset e asset. `npm run build` produce anche `dist/site` per altri hosting statici; non pubblica nulla e non modifica la configurazione Pages.

L’anteprima include home, gioco, regole, entrambi i dataset, script, CSS, immagini e font in **un solo HTML**. Le pagine sono incorporate in un iframe che viene ricreato alla navigazione, così timer ed eventi della pagina precedente vengono chiusi. La chiave delle partite esportate è `hellscape-offline-v1:fool-v1`; quella dei profili è `hellscape-offline-v1:fool-settings-v1`. Non legge o sovrascrive i salvataggi del sito. Il meta `hellscape-revision` e `dist/revision.json` identificano il commit generatore; gli output sono ignorati da Git e vanno rigenerati dopo ogni modifica, senza correggerli a mano.

`tests/offline.py` carica gli esatti byte dell’HTML in un contesto Chromium senza rete, controlla entrambe le banche, risposte, regole, ripresa, isolamento dei salvataggi, assenza di richieste esterne ed errori JavaScript a 1440×900, 390×844 e 844×390. Il browser gestito di questa sessione blocca gli URL `file://`: il test usa una sola risposta locale intercettata per fornire il documento e non certifica l’apertura diretta da file in quel browser. Gli screenshot vengono scritti in `artifacts/`.

Per confrontare la grafica con la base della PR #17, preparare un checkout e indicarlo a `HELLSCAPE_BASELINE=/percorso/base python3 tests/visual_parity.py` (richiede Pillow). Il test confronta pixel per pixel tre screenshot con movimento ridotto e riprende una partita salvata dal codice della base. La base non viene usata dal sito o dalla build.

## Partita ordinaria

Il docente configura nomi, simboli e tre veicoli distinti per i giocatori, tempo, punteggi, difficoltà, argomenti e numero di domande (multiplo di tre da 3 a 99, predefinito 33). All'avvio viene indicato esplicitamente il numero di domande della **partita ordinaria**: lo spareggio non è un'alternativa all'inizio della partita. I vecchi profili salvati con meno di 33 domande, non marcati come scelta esplicita, vengono riportati a 33; una nuova scelta di partita breve, salvata dalle impostazioni, resta valida. Se si riprende una partita già salvata con meno di 33 domande, viene mostrato un avviso; la partita esistente non viene modificata automaticamente. Una risposta corretta assegna i **punti base della difficoltà**, senza moltiplicatori o serie; una risposta errata non sottrae punti. I punti possono essere condivisi tramite Bullo. L'ordine dei giocatori è sorteggiato e poi fisso.

Le sei **Ammo** sono **Nope, Bullo, Spoiler, Aura, Karma e Marx**. La probabilità di estrazione è indipendente per ogni tipo: 30% predefinito per i primi cinque, **15% per Marx**. Le probabilità sono configurabili singolarmente. Bullo mantiene la precedente logica di divisione del guadagno fra il rispondente e i beneficiari; l'identificativo interno `ruba` resta invariato per compatibilità. **Marx** ridistribuisce immediatamente tutti i punti già accumulati in parti identiche fra i giocatori ancora attivi, compreso quello che lo utilizza, senza creare o eliminare punti. I punteggi dei giocatori eliminati rimangono invariati. Quando il totale non è divisibile, il gioco conserva frazioni esatte. Marx non è un attacco: Aura non lo blocca e Karma non reagisce. Dopo una risposta corretta possono essere assegnate più Ammo indipendenti; nello stesso turno è possibile usarne più di una.

Alla fine delle domande previste **vince il giocatore attivo con più punti**. Se resta un solo giocatore attivo prima della fine, vince immediatamente; se tutti vengono eliminati, è Game Over.

## Spareggio a eliminazione

Lo spareggio si apre **solo in caso di parità al primo posto dopo tutte le domande della partita ordinaria**. I giocatori in testa rispondono una domanda ciascuno nell'ordine di rotazione originario. Ogni risposta errata o tempo scaduto elimina il giocatore. Il giro termina **solo dopo che tutti i giocatori ancora presenti nel giro hanno risposto**, anche quando il primo viene eliminato. Alla fine del giro, un solo superstite vince; nessun superstite produce Game Over; più superstiti iniziano un nuovo giro.

Le domande dello spareggio sono estratte fra **tutte quelle nuove del dataset**, senza vincoli di difficoltà, mantenendo il tempo della partita. Non si ripetono quesiti già mostrati; se la banca non basta, la partita attende l'aggiunta di nuovi quesiti. Durante lo spareggio il tabellone segnala che i punteggi sono congelati; non si assegnano punti né Ammo e l'esito dipende esclusivamente da risposte corrette o eliminazioni; si disattivano tutti gli effetti delle Ammo della fase ordinaria. Sanzioni, timer e sospensione restano disponibili.

## Fuga dall'Inferno — scena animata v1.2.0

Durante il quiz la scena occupa l’intero palco fisso 4:3 (1024×768): tre piloti su veicoli junkpunk/dieselpunk attraversano un paesaggio di lava inseguiti da un demone horror. Lo sfondo scorre autonomamente; quando i punti cambiano, i veicoli avanzano e possono superarsi. Le posizioni sono una rappresentazione visiva dei punteggi esatti, anche razionali dopo Marx, **non un punteggio parallelo**. I giocatori eliminati perdono terreno.

La porta dell'Inferno compare verso il completamento delle domande impostate (33 per impostazione predefinita). Durante lo spareggio i punti restano congelati e la porta rimane vicina. La schermata finale mostra il vincitore che fugge mentre il demone cattura gli altri; con Game Over senza superstiti, li cattura tutti. I finali anticipati per eliminazione funzionano senza attendere l'ultima domanda.

Il modulo `assets/hell-race.js` è un Canvas pixel-art senza dipendenze, privo di influenza sulle regole, sul timer e sui salvataggi. La grafica si interrompe quando la pagina non è visibile e rispetta la preferenza di sistema per la riduzione del movimento. L'indicazione testuale accessibile integra le figure. I sei veicoli selezionabili sono chopper (con pilota), pick-up, camion, coupé, fuoristrada e Ape a tre ruote. Sono riconoscibili per sagoma e simbolo, non per colori vistosi. Le nuove sprite map animate, il portale e il panorama sono descritti in [assets/hell-race/README.md](assets/hell-race/README.md). Ogni mezzo ha otto pose; il demone ha sequenze distinte di corsa, attacco e morso. I punteggi, le regole e i salvataggi esistenti non vengono modificati.

## Interfaccia e salvataggi

La home, la schermata di gioco e le regole sono responsive per desktop, tablet e smartphone. Il riepilogo di ciascun giocatore e il suo inventario mostrano **solo i tipi di Ammo effettivamente posseduti**, con una **icona pixel-art per ogni unità posseduta**, diversa per forma e materiale (Nope: corde; Bullo: cartuccia da fucile; Spoiler: mirino; Aura: giubbotto antiproiettile; Karma: granata; Marx: bomba). Nessuna cifra sostituisce le icone; restano visibili i nomi dei tipi e le etichette accessibili. Il comando per il fullscreen mostra **Schermo intero** o **Esci da schermo intero** in funzione dello stato del browser, anche quando il gioco è aperto in un iframe dalla home.

La schermata iniziale offre **Nuova partita** e mostra **Riprendi partita** quando in questo browser è presente una partita salvata ancora in corso. La ripresa apre direttamente il gioco, mantenendo il timer fermo. Preparare una nuova partita conserva il salvataggio precedente fino alla conferma di **Inizia partita**.

La partita viene salvata automaticamente in `localStorage` nello stesso browser. La versione 2.2.1 migra i salvataggi 2.0.0 e 2.1.0, conservando i punteggi e le probabilità già impostate. Quando una probabilità Marx non è presente, viene applicato il nuovo valore di default del **15%**; una probabilità già salvata (anche 30%) non viene sovrascritta. Il numero di domande predefinito resta **33**. Le partite precedenti in fase ordinaria (motore 1.2.0 / regole 18.2.0) possono essere riprese conservando punteggi e domande, senza moltiplicatori futuri. I vecchi spareggi del Massacro non vengono convertiti, perché hanno regole incompatibili.

## Contenuto e verifiche

- `Fool.html`: struttura della pagina e caricamento dei moduli; mantiene il suo URL pubblico.
- `assets/ammo-sprites-48.png`: sei icone originali in pixel art, sprite sheet PNG trasparente da 48 px per icona.
- `Fool_regole.html`: regolamento proiettabile in classe.
- `dataset/`, `datasets.json`: banche pubblicate e catalogo.
- `docs/PROMPT_GENERAZIONE_DOMANDE.md`: istruzioni per creare quesiti.
- `tests/engine.test.js`: test del motore, del nuovo spareggio e delle estrazioni.
- `tests/configurable.py`, `tests/options.py`, `tests/keyboard.py`, `tests/start.py`: test di interfaccia (richiedono Playwright/Chromium per la modalità browser).
- `tests/verify_datasets.py`: controlli di conformità delle banche.

Eseguire `node --test tests/engine.test.js` e `python3 tests/verify_datasets.py` per i test senza browser.

## Comandi e lettura delle domande

Ogni giocatore sceglie nome e stemma; i personaggi sono temporaneamente esclusi dalla preparazione e dal gioco. Nella fase ordinaria le tre vite sono rappresentate da cuori: ogni sanzione spegne un cuore; a zero il giocatore è eliminato. All’ingresso nello spareggio, ogni partecipante a pari merito mostra un solo cuore, che perde quando è eliminato per risposta errata o tempo scaduto. Le sanzioni disciplinari già ricevute restano registrate.

Dopo l’esito restano evidenti la risposta scelta e quella corretta. In **Opzioni** si trovano **Scorciatoie da tastiera** e **Domanda precedente**. Quest’ultimo comando permette di consultare gli esiti già registrati senza cambiare punti, turni o Ammo; ferma il timer, che si riprende esplicitamente. L’ordine delle alternative viene conservato nei nuovi esiti salvati. Per i vecchi salvataggi si recupera la domanda corrente, mentre gli esiti più vecchi privi dell’ordine delle alternative non sono ricostruibili.

Le formule note sono presentate con frazioni e pedici matematici. Nelle soluzioni, **Grandezze e simboli** spiega che una grandezza fisica è una proprietà misurabile ed elenca significati e unità dei simboli dell’argomento. La legenda appare dopo la risposta per non anticipare risposte a quesiti sulle unità. Le banche e i testi dei salvataggi restano coerenti.

**Karma:** ogni attacco non bloccato trasforma una sola copia; le altre restano Karma per attacchi successivi. La copia trasformata si usa solo contro l’attaccante. **Marx:** non è un attacco; Aura non lo blocca e Karma non si trasforma, anche con più copie in inventario.

| Tasti nel gioco | Comando |
| --- | --- |
| Invio | Svela / prossima domanda |
| A, B, C, D | Scegli risposta |
| P | Pausa / riprendi timer |
| I | Inventario |
| S | Sanzioni |
| V | Riassegna punti |
| L | Sospendi / riprendi sessione |
| ← | Consulta domanda precedente |
| O | Apri / chiudi Opzioni |
| K | Salva |
| F | Schermo intero |
| H | Schermata iniziale |
| F1, ? | Guida completa |
| Tab, Maiusc+Tab | Naviga tra i comandi |
| Invio, Spazio | Attiva il comando selezionato |
| Esc | Chiudi inventario, guida o consultazione |

Nei pannelli decisionali si conferma o annulla con i pulsanti, raggiungibili con Tab e Invio. Le scorciatoie non intervengono durante la scrittura e rispettano pause e blocchi del gioco.

Nella home: **N** nuova partita, **R** riprendi, **G** regole, **I** impostazioni, **F** schermo intero. Le regole supportano frecce, Pagina su/giù, Inizio e Fine. `tests/experience.py` verifica le nuove funzioni e le scorciatoie con Chromium su desktop e smartphone orizzontale.

Il rifiuto delle domande è rimosso dal motore, dai comandi e dal regolamento. Un vecchio salvataggio con una richiesta in corso viene ripreso sulla stessa domanda, senza sostituzione e con timer fermo.

## Interfaccia Hellscape 3.2.0

La scena riempie lo schermo di gioco in rapporto 4:3, centrato e ridimensionato senza ritaglio in entrambe le orientazioni. La colonna sinistra contiene le tre schede collassabili dei giocatori; la finestra a destra contiene la domanda. Dopo la risposta la domanda scompare per 1,25 secondi, lasciando vedere il movimento, poi appare la correzione con spiegazione; con movimento ridotto l’intervallo è 0,4 secondi. La prossima domanda aggiorna entrambe le finestre. Le tre schede restano consultabili durante il turno, senza fermare il timer. Domanda, quattro alternative e spiegazione restano visibili insieme; la finestra cresce in altezza e il pulsante successivo segue il testo senza sovrapposizioni. Vite e spostamenti rappresentano le regole esistenti: un errore ordinario mantiene i punti, una sanzione toglie una vita.

Percorsi `Fool.html`, API del motore e chiavi dei salvataggi conservati per compatibilità. Nessuna modifica a regole, dataset o formato dei salvataggi.

I veicoli scelti sono disabilitati negli altri selettori e tornano disponibili quando vengono liberati. La personalizzazione include nome e veicolo. Le animazioni degli esiti non aggiungono scritte. Il pannello Inventario contiene soltanto oggetti, bersagli e comandi; le spiegazioni sono accessibili da Regole nelle Opzioni. La consultazione del regolamento ferma il timer. Opzioni include Salva e Torna alla home; all’uscita si sceglie Salva ed esci, Esci senza salvare oppure Annulla.

Per ogni modifica all’interfaccia consegnare un’anteprima HTML offline e allegare in chat screenshot aggiornati prima dell’approvazione.

Il tempo è rappresentato soltanto da una fiala orizzontale di liquido rosso: si svuota secondo il tempo residuo del motore, si ferma in pausa e si riempie alla domanda successiva. Nessun conto alla rovescia numerico. L’ordine delle schede segue i turni, con il rispondente attuale in cima.

Al comando Prossima domanda, la fiala si riempie dal livello residuo della domanda precedente fino al pieno in 750 ms. Il conteggio parte soltanto quando si svela la domanda. La preferenza di sistema per il movimento ridotto disattiva il riempimento animato. Gli stemmi non sono mostrati: il riquadro usa come sfondo il veicolo selezionato in scala di grigi. Le icone nei salvataggi precedenti restano soltanto per compatibilità.

Le tre schede sono impilate in ordine ciclico, con il giocatore corrente sempre in cima e illuminato da un contorno giallo. Da chiuse mostrano nome e punteggio numerico; da aperte mostrano soltanto vite e inventario. Apertura e chiusura sono indipendenti e si conservano durante la partita. Rimossi la lista separata dei turni e il comando delle statistiche dalle Opzioni.

L’apertura delle schede espande il contenuto sopra quelle sottostanti senza spostarle. La scheda aperta o selezionata più di recente passa davanti alle altre, anche con la tastiera.
