# Fool

Sito: https://rickymusu-bit.github.io/quiz/

**Applicazione 2.2.1 · Motore 2.2.1 · Regolamento 19.2.0 · 26/10/2026**

Fool è un quiz di fisica per tre giocatori, pubblicato su GitHub Pages dal ramo `main`. Il gioco carica automaticamente i quesiti dal catalogo `datasets.json`. Le domande appartengono a banche separate, associate a materie e argomenti; non è richiesto un server applicativo.

## Partita ordinaria

Il docente configura nomi e simboli dei giocatori, tempo, punteggi, difficoltà, argomenti e numero di domande (multiplo di tre da 3 a 99, predefinito 33). All'avvio viene indicato esplicitamente il numero di domande della **partita ordinaria**: lo spareggio non è un'alternativa all'inizio della partita. I vecchi profili salvati con meno di 33 domande, non marcati come scelta esplicita, vengono riportati a 33; una nuova scelta di partita breve, salvata dalle impostazioni, resta valida. Se si riprende una partita già salvata con meno di 33 domande, viene mostrato un avviso; la partita esistente non viene modificata automaticamente. Una risposta corretta assegna i **punti base della difficoltà**, senza moltiplicatori o serie; una risposta errata non sottrae punti. I punti possono essere condivisi tramite Bullo. L'ordine dei giocatori è sorteggiato e poi fisso.

Le sei **Ammo** sono **Nope, Bullo, Spoiler, Aura, Karma e Marx**. La probabilità di estrazione è indipendente per ogni tipo: 30% predefinito per i primi cinque, **15% per Marx**. Le probabilità sono configurabili singolarmente. Bullo mantiene la precedente logica di divisione del guadagno fra il rispondente e i beneficiari; l'identificativo interno `ruba` resta invariato per compatibilità. **Marx** ridistribuisce immediatamente tutti i punti già accumulati in parti identiche fra i giocatori ancora attivi, compreso quello che lo utilizza, senza creare o eliminare punti. I punteggi dei giocatori eliminati rimangono invariati. Quando il totale non è divisibile, il gioco conserva frazioni esatte. Marx non è un attacco: Aura non lo blocca e Karma non reagisce. Dopo una risposta corretta possono essere assegnate più Ammo indipendenti; nello stesso turno è possibile usarne più di una.

Alla fine delle domande previste **vince il giocatore attivo con più punti**. Se resta un solo giocatore attivo prima della fine, vince immediatamente; se tutti vengono eliminati, è Game Over.

## Spareggio a eliminazione

Lo spareggio si apre **solo in caso di parità al primo posto dopo tutte le domande della partita ordinaria**. I giocatori in testa rispondono una domanda ciascuno nell'ordine di rotazione originario. Ogni risposta errata o tempo scaduto elimina il giocatore. Il giro termina **solo dopo che tutti i giocatori ancora presenti nel giro hanno risposto**, anche quando il primo viene eliminato. Alla fine del giro, un solo superstite vince; nessun superstite produce Game Over; più superstiti iniziano un nuovo giro.

Le domande dello spareggio sono estratte fra **tutte quelle nuove del dataset**, senza vincoli di difficoltà, mantenendo il tempo della partita. Non si ripetono quesiti già mostrati; se la banca non basta, la partita attende l'aggiunta di nuovi quesiti. Durante lo spareggio il tabellone segnala che i punteggi sono congelati; non si assegnano punti né Ammo e l'esito dipende esclusivamente da risposte corrette o eliminazioni; si disattivano tutti gli effetti delle Ammo della fase ordinaria. Sanzioni, rifiuti motivati, timer e sospensione restano disponibili.

## Interfaccia e salvataggi

La home, la schermata di gioco e le regole sono responsive per desktop, tablet e smartphone. Il riepilogo di ciascun giocatore e il suo inventario mostrano **solo i tipi di Ammo effettivamente posseduti**, con una **icona pixel-art per ogni unità posseduta**, diversa per forma e materiale (Nope: corde; Bullo: cartuccia da fucile; Spoiler: mirino; Aura: giubbotto antiproiettile; Karma: granata; Marx: bomba). Nessuna cifra sostituisce le icone; restano visibili i nomi dei tipi e le etichette accessibili. Il comando per il fullscreen mostra **Schermo intero** o **Esci da schermo intero** in funzione dello stato del browser, anche quando il gioco è aperto in un iframe dalla home.

La schermata iniziale offre **Nuova partita** e mostra **Riprendi partita** quando in questo browser è presente una partita salvata ancora in corso. La ripresa apre direttamente il gioco, mantenendo il timer fermo. Preparare una nuova partita conserva il salvataggio precedente fino alla conferma di **Inizia partita**.

La partita viene salvata automaticamente in `localStorage` nello stesso browser. La versione 2.2.1 migra i salvataggi 2.0.0 e 2.1.0, conservando i punteggi e le probabilità già impostate. Quando una probabilità Marx non è presente, viene applicato il nuovo valore di default del **15%**; una probabilità già salvata (anche 30%) non viene sovrascritta. Il numero di domande predefinito resta **33**. Le partite precedenti in fase ordinaria (motore 1.2.0 / regole 18.2.0) possono essere riprese conservando punteggi e domande, senza moltiplicatori futuri. I vecchi spareggi del Massacro non vengono convertiti, perché hanno regole incompatibili.

## Contenuto e verifiche

- `Fool.html`: interfaccia e motore incorporato.
- `assets/ammo-sprites-48.png`: sei icone originali in pixel art, sprite sheet PNG trasparente da 48 px per icona.
- `Fool_regole.html`: regolamento proiettabile in classe.
- `dataset/`, `datasets.json`: banche pubblicate e catalogo.
- `docs/PROMPT_GENERAZIONE_DOMANDE.md`: istruzioni per creare quesiti.
- `tests/engine.test.js`: test del motore, del nuovo spareggio e delle estrazioni.
- `tests/configurable.py`, `tests/options.py`, `tests/keyboard.py`, `tests/start.py`: test di interfaccia (richiedono Playwright/Chromium per la modalità browser).
- `tests/verify_datasets.py`: controlli di conformità delle banche.

Eseguire `node --test tests/engine.test.js` e `python3 tests/verify_datasets.py` per i test senza browser.

## Comandi e lettura delle domande

Ogni giocatore sceglie uno stemma con un personaggio pixel art abbinato: Spettro (teschio), Volt (fulmine), Nova (stella), Duellante (spade), Guardiano (scudo), Monarca (corona). I tre personaggi compaiono sotto le domande. Le tre vite sono rappresentate da cuori: ogni sanzione spegne un cuore; a zero il giocatore è eliminato.

Dopo l’esito restano evidenti la risposta scelta e quella corretta. **Domanda precedente** permette di consultare gli esiti già registrati senza cambiare punti, turni o Ammo; ferma il timer, che si riprende esplicitamente. L’ordine delle alternative viene conservato nei nuovi esiti salvati. Per i vecchi salvataggi si recupera la domanda corrente, mentre gli esiti più vecchi privi dell’ordine delle alternative non sono ricostruibili.

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
| R | Richiedi rifiuto |
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
