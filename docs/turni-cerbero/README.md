# 13 turni, scelta di Malocchio e Cerbero nella partita

## Regole

Le nuove partite durano **13 turni totali**, non tredici giri. Il numero è configurabile da 1 a 99. Ogni risposta, turno ceduto con Tributo/Arsenico, turno saltato per Catene o interruzione per eliminazione del titolare consuma un solo turno. Malocchio resta nel turno dell’autore, anche se risponde un altro giocatore. Una sostituzione o una riserva da rifornire non aggiunge turni.

Il confronto dei punti avviene alla fine del turno limite, anche quando questo è saltato o ceduto. Arsenico si applica all’inizio di un turno saltato prima del confronto finale. Un solo primo classificato vince; la parità apre l’Ultimo Miglio. Restano invariati punti, vite e regole dello spareggio.

Se la parità arriva da un salto o una rinuncia, l’introduzione si apre anche senza una schermata di esito. Alla fine conserva la prima domanda già preparata, senza avanzare al secondo partecipante.

Malocchio concede **45 secondi attivi** per tenere la domanda o assegnarla. Le alternative restano assenti dal DOM. Alla conferma o alla scadenza della scelta parte l’intero tempo di risposta configurato. Se non viene effettuata una scelta, la domanda rimane all’utilizzatore. Anche un clic arrivato dopo la scadenza rispetta questa regola. Pausa, pannelli, orientamento e salvataggio conservano il tempo residuo; la ripresa richiede un comando esplicito.

## Compatibilità

Motore 3.0.0, regolamento 27.0.0, applicazione 3.11.0. I salvataggi precedenti conservano durata e progressi in domande, punteggi, Omen e contatori; una scelta di Malocchio precedentemente senza limite riceve 45 secondi e resta in pausa alla ripresa.

Il vecchio profilo predefinito da 33 domande diventa 13 turni per una nuova partita. Tempi, punti e probabilità sono conservati; le quote degli argomenti vengono ridimensionate mantenendo le proporzioni degli argomenti selezionati. Una durata personalizzata esplicitamente salvata conserva il numero scelto, ora espresso in turni. I salvataggi delle partite già iniziate non vengono accorciati.

`completedTurns` e `turnClosed` rendono idempotente la chiusura del turno, indipendentemente dal numero di quesiti risolti. Il vecchio `turn` resta il contatore della rotazione e degli eventi. La riserva iniziale contiene al massimo una domanda per turno; le domande non utilizzate restano disponibili per sostituzioni e Ultimo Miglio. La validazione rifiuta contatori incoerenti.

## Grafica

Cerbero sputa fuoco dalle tre bocche durante la corsa: prima sequenza dopo 8 secondi attivi della scena, poi ogni 18 secondi. L’azione dura 1,8 secondi, con preparazione, emissione e recupero. Le zampe continuano a usare le otto pose disegnate del passo; teste e coda restano articolate. I getti seguono esattamente le bocche del rig. Sono riutilizzati gli atlanti approvati, senza nuovi disegni di sprite.

È un effetto visivo: non modifica punti, vite, turni, timer o generatore casuale. Pausa e sospensione congelano il tempo; movimento ridotto disattiva i getti. Catture, Omen, spareggi e finale mantengono le proprie azioni.

La home usa `assets/hellscape-cerbero-home.webp`, nuova illustrazione dal riferimento carne approvato, con sei veicoli in fuga e tre teste riconoscibili sotto il logo. L’originale generato è `exec-2ca2d6b1-cb10-4b6e-b99c-bd67bab103e0.png`, 1448×1086. Conversione WebP senza perdita, verificata confrontando tutti i pixel RGBA. Il logo mobile è dimensionato per lasciare visibili le facce. Il precedente asset della home è conservato come riferimento storico.

## Verifiche

- `npm test`: regole, turni, conteggi idempotenti, scadenze, migrazioni, punteggi e dataset.
- `npm run test:frames`: sagome, articolazioni, veicoli rigidi ed effetti.
- `npm run test:ammo`: animazioni delle nove Omen, tre viewport, pausa/ripresa, ricaricamento e dimostrazione offline.
- `python3 tests/configurable.py`: impostazioni su due banche e due viewport, durate 1/4/13/99, probabilità e vecchi profili.
- `python3 tests/tie_browser.py --quick`: Ultimo Miglio offline, avanzamento, input, pausa e ripresa.
- `python3 tests/turn_limit_browser.py`: spareggio dopo l’ultimo turno saltato o ceduto, domanda iniziale e focus, pausa e comandi su desktop/mobile e movimento ridotto; incluso in `test:ties`.
- `python3 tests/periodic_fire.py`: tre emettitori effettivi in corsa, pausa/ripresa della fiammata e movimento ridotto; incluso in `test:motion`.
- `node scripts/build.cjs --offline` e `--quality-preview`: asset incorporati e scenari di verifica aggiornati.
- `python3 scripts/review-turns-cerbero.py`: acquisizioni reali Chromium e controlli sito/offline di Malocchio, pausa, ripresa, orientamento e chiusura al tredicesimo turno.

Le GIF sono registrazioni reali del browser a 20 FPS. `fuoco-periodico.gif` mostra 3,8 secondi della corsa ordinaria. `malocchio-scadenza.gif` mostra gli ultimi 2 secondi della scelta e l’avvio del tempo intero per rispondere, configurato a 90 secondi per distinguere i due conti alla rovescia: il tempo precedente viene saltato **prima** dell’acquisizione. La finestra desktop è 1366×768, export GIF 640×360; il controllo offline usa 844×390. Revisione e impronte dei file sono nel rapporto.

Acquisizioni dal runtime `278c5c94dbdd00eb96462093acf9770f1e897339`. Il commit degli allegati aggiorna soltanto le prove e la documentazione, senza modificare i file runtime. I nuovi casi browser verificano anche la prima domanda dello spareggio dopo turno saltato o ceduto, su desktop/mobile e con movimento ridotto. Esiti locali: 170 test Node e dataset, suite frame, configurazione e Ultimo Miglio, verifica browser di Malocchio/Flagello/catture/portale, acquisizioni sito/offline e controllo degli emettitori durante pausa/ripresa riusciti.
