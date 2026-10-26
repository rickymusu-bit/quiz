# Hellscape - Fuga dall’inferno

Sito: https://rickymusu-bit.github.io/quiz/

**Applicazione 3.2.0 · Motore 2.2.1 · Regolamento 19.2.0 · 26/10/2026**

Hellscape è un quiz di fisica per tre giocatori, pubblicato su GitHub Pages dal ramo `main`. Il gioco carica automaticamente i quesiti dal catalogo `datasets.json`. Le domande appartengono a banche separate, associate a materie e argomenti; non è richiesto un server applicativo.

## Partita ordinaria

Il docente configura nomi, simboli e tre veicoli distinti per i giocatori, tempo, punteggi, difficoltà, argomenti e numero di domande (multiplo di tre da 3 a 99, predefinito 33). All'avvio viene indicato esplicitamente il numero di domande della **partita ordinaria**: lo spareggio non è un'alternativa all'inizio della partita. I vecchi profili salvati con meno di 33 domande, non marcati come scelta esplicita, vengono riportati a 33; una nuova scelta di partita breve, salvata dalle impostazioni, resta valida. Se si riprende una partita già salvata con meno di 33 domande, viene mostrato un avviso; la partita esistente non viene modificata automaticamente. Una risposta corretta assegna i **punti base della difficoltà**, senza moltiplicatori o serie; una risposta errata non sottrae punti. I punti possono essere condivisi tramite Bullo. L'ordine dei giocatori è sorteggiato e poi fisso.

Le sei **Ammo** sono **Nope, Bullo, Spoiler, Aura, Karma e Marx**. La probabilità di estrazione è indipendente per ogni tipo: 30% predefinito per i primi cinque, **15% per Marx**. Le probabilità sono configurabili singolarmente. Bullo mantiene la precedente logica di divisione del guadagno fra il rispondente e i beneficiari; l'identificativo interno `ruba` resta invariato per compatibilità. **Marx** ridistribuisce immediatamente tutti i punti già accumulati in parti identiche fra i giocatori ancora attivi, compreso quello che lo utilizza, senza creare o eliminare punti. I punteggi dei giocatori eliminati rimangono invariati. Quando il totale non è divisibile, il gioco conserva frazioni esatte. Marx non è un attacco: Aura non lo blocca e Karma non reagisce. Dopo una risposta corretta possono essere assegnate più Ammo indipendenti; nello stesso turno è possibile usarne più di una.

Alla fine delle domande previste **vince il giocatore attivo con più punti**. Se resta un solo giocatore attivo prima della fine, vince immediatamente; se tutti vengono eliminati, è Game Over.

## Spareggio a eliminazione

Lo spareggio si apre **solo in caso di parità al primo posto dopo tutte le domande della partita ordinaria**. I giocatori in testa rispondono una domanda ciascuno nell'ordine di rotazione originario. Ogni risposta errata o tempo scaduto elimina il giocatore. Il giro termina **solo dopo che tutti i giocatori ancora presenti nel giro hanno risposto**, anche quando il primo viene eliminato. Alla fine del giro, un solo superstite vince; nessun superstite produce Game Over; più superstiti iniziano un nuovo giro.

Le domande dello spareggio sono estratte fra **tutte quelle nuove del dataset**, senza vincoli di difficoltà, mantenendo il tempo della partita. Non si ripetono quesiti già mostrati; se la banca non basta, la partita attende l'aggiunta di nuovi quesiti. Durante lo spareggio il tabellone segnala che i punteggi sono congelati; non si assegnano punti né Ammo e l'esito dipende esclusivamente da risposte corrette o eliminazioni; si disattivano tutti gli effetti delle Ammo della fase ordinaria. Sanzioni, timer e sospensione restano disponibili.

## Fuga dall'Inferno — scena animata v1.1.0

Durante il quiz la scena occupa l’intero palco fisso 4:3 (1024×768): tre piloti su veicoli junkpunk/dieselpunk attraversano un paesaggio di lava inseguiti da un demone horror. Lo sfondo scorre autonomamente; quando i punti cambiano, i veicoli avanzano e possono superarsi. Le posizioni sono una rappresentazione visiva dei punteggi esatti, anche razionali dopo Marx, **non un punteggio parallelo**. I giocatori eliminati perdono terreno.

La porta dell'Inferno compare verso il completamento delle domande impostate (33 per impostazione predefinita). Durante lo spareggio i punti restano congelati e la porta rimane vicina. La schermata finale mostra il vincitore che fugge mentre il demone cattura gli altri; con Game Over senza superstiti, li cattura tutti. I finali anticipati per eliminazione funzionano senza attendere l'ultima domanda.

Il modulo `assets/hell-race.js` è un Canvas pixel-art senza dipendenze, privo di influenza sulle regole, sul timer e sui salvataggi. La grafica si interrompe quando la pagina non è visibile e rispetta la preferenza di sistema per la riduzione del movimento. L'indicazione testuale accessibile integra le figure. I sei veicoli selezionabili sono chopper (con pilota), pick-up, camion, coupé, fuoristrada e Ape a tre ruote. Sono riconoscibili per sagoma e simbolo, non per colori vistosi. Le sprite map ottimizzate sono `assets/hell-race/vehicles.webp` e `assets/hell-race/demon.webp`; il primo atlante contiene sei celle in una griglia 3×2. I punteggi, le regole e i salvataggi esistenti non vengono modificati.

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
