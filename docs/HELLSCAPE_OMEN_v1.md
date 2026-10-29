# Omen, Arsenico e HUD — implementazione v1

Riferimento: specifica della PR #49. Applicazione 3.10.0, motore 2.9.0,
regolamento/salvataggi 26.0.0. Nessun merge o deploy automatico.

## Decisioni operative

- I punti sono razionali esatti, come nel motore esistente. Catene e ogni dose
  di Arsenico sottraggono `P × 11/100`: nessun arrotondamento del punteggio
  memorizzato. Solo la visualizzazione usa l’intero più vicino, metà verso
  l’alto. Esempio Arsenico: `1000 → 890 → 7921/10 → 704969/1000`.
- Catene paga il costo a carico dell’utilizzatore prima dell’attacco, anche
  se Sigillo blocca il salto. Zero punti implica costo zero; mai punti negativi.
- Arsenico cede il turno corrente con lo stesso flusso consolidato di Tributo:
  domanda nascosta riutilizzabile, domanda svelata ritirata; nessun secondo salto.
  La penalità scatta nel motore all’ingresso nella rotazione personale del
  bersaglio, prima di Catene, non al render o allo svelamento della domanda.
  Una risposta ricevuta con Malocchio non costituisce un nuovo turno personale.
  L’ingresso in un turno senza domande applica la dose una volta; il rifornimento
  successivo non la ripete. Anche i turni saltati consumano una dose.
- Una seconda dose su un bersaglio con Arsenico ancora attivo è rifiutata prima
  di consumare la copia o cedere il turno: nessun accumulo o rinnovo arbitrario.
  Sigillo conserva le protezioni esistenti, blocca Arsenico e rimuove le dosi
  pendenti quando attivato. Eliminate le parti coinvolte o entrati nell’Ultimo
  Miglio, i relativi effetti vengono rimossi secondo il ciclo esistente.
- Arsenico segue la probabilità ordinaria predefinita del catalogo (30%),
  indipendente e configurabile. Gli altri valori restano invariati.
- Antisigillo non ha estrazione, menu o attacco attivo. Il caricamento dei vecchi
  salvataggi rimuove solo le copie dismesse, le scelte pendenti e i relativi
  premi/avvisi storici; non assegna sostituti, non rigioca esiti e conserva
  punteggi, vite, domande, configurazioni degli altri Omen e inventari restanti.
  Le chiavi di persistenza e gli identificatori storici `ammo` restano compatibili.
- Livella include tutti i partecipanti attivi, anche con Sigillo, conserva il
  totale esatto e lascia intatte protezioni, vite e inventari. Anche il piano
  della cinematica include i protetti.

## HUD e grafica

Tre finestre impilate in alto, corrente per primo e in giallo. Nome e punteggio
restano visibili; il triangolo apre vite e inventario, in sovrapposizione alla
scena. Il pulsante del giocatore apre l’inventario completo. L’apertura dei
pannelli è conservata al render e alla rotazione. Il pannello delle domande è ancorato in basso e centrato nell’area di gioco;
«Svela» apre il contenuto verso l’alto, senza muovere o ridimensionare il testo.
Timer, domanda, alternative e azioni occupano la stessa viewport. Su schermi bassi «Dettagli esito» apre la
spiegazione completa e i premi in un dialogo, lasciando visibili feedback,
alternative e prossima domanda. Dopo la risposta, il testo completo del quesito
resta consultabile nello stesso dialogo. Il gameplay non richiede scorrimento; i dialoghi
di consultazione possono scorrere. Le formule lunghe conservano il controllo
orizzontale dedicato già previsto dal progetto.

Gameplay solo landscape; portrait e finestra quadrata mostrano l’invito a
ruotare e fermano comandi/timer/animazioni. Scorciatoie applicative solo nella
modalità desktop (layout stage e puntatore fine); i normali comandi accessibili
dei controlli restano disponibili. Export offline con lo stesso codice e gate.

Arsenico ha soltanto il segnaposto tratteggiato «As», anche nella notifica
animata; non è uno sprite definitivo. Il demone approvato resta in uso.
Proposte e integrazione del Cerbero junkpunk horror sono esplicitamente una
seconda fase grafica, come richiesto dalla specifica. Nessuno sprite definitivo
nuovo è generato o integrato.

## Verifiche

`npm test` include costo, soglia zero, frazioni, turno ceduto, tre dosi composte,
Catene, Malocchio, rinnovo rifiutato, eliminazioni, Ultimo Miglio, migrazione e
ripristini ripetuti; restano le regressioni di domande e punteggi esistenti.

`npm run test:omen` prova i comandi reali su desktop e landscape mobile,
568×320 incluso, DPR 1/2, HUD aperto/chiuso, portrait, nomi visibili, salvataggio,
Arsenico e export offline. Il report rigenerabile è in `artifacts/omen/`.
Le evidenze consegnate in `docs/screenshots/omen-v1/` provengono dal browser,
non da mockup. La GIF documenta l’attivazione e il passaggio dei turni.

Risultati locali della consegna: 147 test del motore superati e due archivi da
100 domande validati; 1.200 combinazioni domanda/stato/viewport senza overflow
fra 568×320, 667×375 e 844×390. Superati inoltre build, frame, portale (40
campioni offline viewport/DPR), inseguimento, movimento, finali, terreno, qualità
visiva, layout, orientamento e le componenti browser di configurazione,
inventari, ripristino, opzioni e comandi desktop. I riepiloghi e le dimensioni
misurate sono in `docs/screenshots/omen-v1/verification.json`.
