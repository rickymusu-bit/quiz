# Regole di consegna

## Anteprime: GIF per le modifiche dinamiche, screenshot per gli stati statici

Aggiornamento del 28/10/2026: per le modifiche dinamiche questa regola sostituisce la precedente preferenza «solo screenshot». Resta esclusa la consegna di HTML come anteprima.

Per ogni modifica visiva o funzionale a Hellscape/Fool:

- Per animazioni, movimento, transizioni ed effetti dinamici, allegare e mostrare direttamente una **GIF animata reale acquisita dal browser**, dalla stessa revisione del codice proposta, con indicazione di schermata, viewport e durata. La GIF deve permettere di giudicare movimento, continuità, ordine degli eventi e risultato finale; uno screenshot singolo non basta.
- Per gli stati statici usare screenshot reali e aggiornati. Gli screenshot possono integrare una GIF, ma non sostituirla quando la modifica è dinamica.
- **Non incorporare file HTML, iframe o anteprime HTML eseguibili nella risposta. Non allegare HTML autonomi come modalità di anteprima.**
- Se serve provare il gioco, si può fornire separatamente il collegamento al sito pubblicato o all'ambiente di test; l'anteprima richiesta resta la GIF o lo screenshot pertinente.
- Documentare le schermate fondamentali e, quando pertinenti, stati alternativi e proporzioni desktop/mobile. Non sostituire screenshot reali con mockup o immagini generate.
- Non dichiarare completata una verifica visuale senza avere realmente acquisito la GIF o gli screenshot pertinenti. Non spacciare immagini generate o animazioni illustrative per registrazioni del gioco. In caso di impedimenti, descrivere cosa non è stato possibile verificare.
- Quando l'utente chiede di procedere una cosa per volta, consegnare un singolo intervento completo e giudicabile per volta, con la relativa anteprima, senza accorpare le modifiche successive.
- Non eseguire merge senza approvazione esplicita.

Applicare la preferenza «GIF per la dinamica, screenshot per gli stati statici, nessun HTML embedded» anche agli altri siti e alle altre interfacce sviluppati per l'utente.

## Modalità di distribuzione — requisito corrente (30/10/2026)

- **Hellscape deve funzionare dal sito pubblicato via HTTP(S), attualmente GitHub Pages. L'esecuzione senza connessione Internet o da un file HTML autonomo non è richiesta.**
- La build offline e i relativi test preesistenti sono strumenti opzionali/legacy, non condizioni di accettazione né obblighi per le nuove funzionalità. Non richiedere la generazione o la consegna di un HTML offline nelle PR, nelle anteprime o nel refactoring.
- I test possono usare un pacchetto HTML autonomo come **ambiente interno di revisione grafica**, ma ciò non introduce un requisito di funzionamento offline per il prodotto; la verifica delle funzionalità del sito online resta prioritaria.
- Mantenere i salvataggi locali e la ripresa della partita nello stesso browser: non sono dipendenti dalla distribuzione offline. Non eliminare il codice legacy dell'export senza una PR dedicata e senza verificare le dipendenze dei test.

## Orientamento del gioco

- Il gioco si usa esclusivamente con schermo orizzontale (larghezza maggiore dell’altezza), sul sito e in schermo intero. In verticale o su finestra quadrata mostrare l’invito a ruotare, impedire comandi e fermare timer e animazioni. Conservare domanda, stato e pannelli aperti; tornare in orizzontale permette la ripresa esplicita della domanda. Le vecchie prove in verticale sono documentazione storica.

## Direzione grafica e fase di approvazione del ponte

- La coerenza fisica della scena prevale sulla leggibilità costante dei veicoli. Strutture in primo piano possono occluderli: rispettare profondità, prospettiva, ombre, materiali e punti d’appoggio, senza spostare o abbassare gli elementi soltanto per lasciare visibili i mezzi.
- Ripartire dal progetto della strada: un ponte di metallo e pietra neri sopra un mare di lava, in stile junkpunk, gotico e horror. Le colonne decorative proposte sono scartate.
- Il ponte della seconda GIF è approvato dall’utente: preservare lava e struttura nello stesso riferimento di camera e i veicoli ingranditi al doppio. La successiva specifica Omen della PR #49 supera la fase storica di Antisigillo.
- L’animazione del portale è approvata. Il suo sprite deve essere disegnato nativamente di taglio, con spessore e prospettiva coerenti: non deformare una facciata frontale per simulare la vista laterale. Posizionare lo sprite con traslazione e scala uniforme, preservando i tempi della sequenza.
- Il portale di taglio con dettagli dorati e crollo in rocce è approvato («Ok bellissimo. Vai avanti»). La successiva richiesta autorizza la consegna delle regole Ammo: Antisigillo 20% (regola storica rimossa dalla specifica Omen della PR #49); Sacrificio 5%, −1 vita e +777 punti; Tributo trasferisce il 33% esatto dei punti attuali dell’avversario e chi lo usa rinuncia subito al turno corrente (chiarimento esplicito dell’utente).
- I dettagli del portale restano dorati: verificare che l’esportazione GIF non li sposti verso l’arancione della lava. Il crollo produce rocce e blocchi di pietra volumetrici, con gravità, piccoli rimbalzi e macerie permanenti; non fogli o ritagli piatti della facciata.

## Regola aggiornata di Malocchio

- La consegna di Sacrificio, Tributo e probabilità è approvata («Ok va bene»). Malocchio mostra testo e valore senza alternative e concede 45 secondi per scegliere se tenerla o a chi passarla. Alla scadenza resta all’utilizzatore e parte il normale tempo di risposta. Pausa, orientamento, salvataggio e ripresa conservano il residuo; chi risponde bene tiene punti e Ammo, chi sbaglia o lascia scadere il tempo perde il valore della domanda con minimo zero (chiarimento esplicito). La rotazione riparte da chi segue l’utilizzatore, anche dopo il passaggio a un altro gruppo, rispettando Catene ed eliminazioni. Salvare autore e rischio della domanda senza riapplicare esiti già registrati.

## Regola aggiornata di Sigillo

- Sigillo protegge dagli effetti negativi delle Ammo altrui, ma blocca ogni altro uso di Ammo e la loro acquisizione da risposte corrette. Flagello e Livella ignorano la protezione; Antisigillo è rimosso dalla specifica Omen della PR #49.
- Interpretazione operativa comunicata: tre turni personali, incluso quello di attivazione; contatore 3 → 2 → 1, scadenza all’inizio del quarto. Livella include il protetto nella redistribuzione. Sigillo rimuove Catene, Tributi e Arsenico pendenti e non evita sanzioni o rischi autoimposti.

## Regola aggiornata di Contrappasso

- Contrappasso è attivabile su di sé per tre turni personali, incluso quello di attivazione. Raddoppia i punti delle risposte corrette e sottrae il doppio del valore in caso di errore o timeout, con minimo zero. Non trasforma più le Ammo avversarie, non si accumula e non raddoppia i premi Ammo o i punti di altre Ammo.
- Con Malocchio conta il Contrappasso del rispondente: penalità complessiva ×2, senza sommare un ulteriore ×1. Un Sigillo successivo non annulla un rischio proprio già attivato. Preservare contatori e copie storiche nei salvataggi senza applicare bonus retroattivi.

## Specifica Omen della PR #49

- Applicare [la specifica Omen, Cerbero e layout v1](docs/HELLSCAPE_SPEC_OMEN_CERBERO_LAYOUT_v1.md), che supera le regole storiche discordanti di Catene, Antisigillo e Livella. I design della PR #51 sono approvati dall’utente («Approvo tutto, preferisco quello più rosso carne»): usare il Cerbero rosso/carnoso e la fiala Arsenico come riferimenti canonici per rig, animazioni e integrazione, seguendo il protocollo. Ultima disposizione richiesta: Opzioni in alto a sinistra e lista giocatori in alto a destra; domanda centrata in basso che si apre verso l’alto, barra del tempo sopra la domanda.

## Correzione Cerbero e veicoli

- Animare Cerbero con fotogrammi disegnati e articolazioni leggibili: camminata fluida, coda che scodinzola dalla base alla punta, tre teste con movimenti dei colli sfalsati durante il passo e fuoco che nasce dalle tre bocche. La deformazione elastica della sola posa statica è respinta.
- I veicoli sono rigidi: vietare contrazioni e dilatazioni della carrozzeria. Mostrare le irregolarità della strada con piccoli spostamenti verticali e oscillazioni delle sospensioni, conservando le proporzioni.
- Durante la partita Cerbero sputa fuoco ogni 60 secondi attivi dalle tre bocche, continuando il passo; l’effetto è soltanto visivo e segue pausa e movimento ridotto. Nella home Cerbero sostituisce il demone.
- Correzione 29/10/2026: **13 turni per giocatore**, cioè 13 giri completi da tre occasioni ciascuno (39 occasioni totali, salvo conclusione anticipata per eliminazioni). Una risposta, un turno saltato per Catene o un turno ceduto contano ciascuno come un'occasione; Malocchio non crea un'occasione aggiuntiva. Il massimo configurabile è la somma delle domande di tutte e tre le difficoltà negli argomenti selezionati divisa per il numero dei giocatori, arrotondata per difetto. Le quote degli argomenti ripartiscono **turni × giocatori domande**, non soltanto turni. La configurazione delle nuove partite usa `roundCount` (turni per giocatore), mentre le partite precedenti con `turnCount` conservano il loro vecchio limite complessivo. Non mostrare filtri di difficoltà nelle nuove partite: il livello determina soltanto i punti. Ogni banca include tutti i tre livelli; migrare i profili precedenti a difficoltà mista conservando le altre preferenze.
- Punti predefiniti delle nuove partite: facile 111, media 222, difficile 333. Conservare i valori personalizzati dei profili e delle partite salvate.

## Protocollo per sprite animati

- Per creare o modificare sequenze di sprite, utilizzare il documento versionato [Protocollo operativo per sprite animati coerenti — v8](docs/PROTOCOLLO_SPRITE_ANIMATI_v8_20261029.md) come riferimento vincolante per produzione di fotogrammi disegnati, anatomia, proprietà meccaniche dei materiali, punti di ancoraggio, continuità, effetti, limiti ai fallback e controlli. Applicare sempre le regole di consegna di questo AGENTS.md; aggiornare il link quando viene pubblicata una versione successiva del protocollo, senza duplicarne qui il contenuto.

## Refactoring e manutenzione del progetto

Queste istruzioni si applicano a **qualsiasi agente o strumento** che modifichi il repository, inclusi ChatGPT Work, Codex e interventi manuali assistiti. Non dipendono dall'ambiente di sviluppo.

- Dopo ogni modifica, valutare il debito tecnico introdotto e ripulire localmente il codice interessato, senza cambiare il comportamento richiesto.
- Dopo modifiche architetturali importanti o quando emergono duplicazioni, accoppiamento eccessivo o complessità significativa, effettuare un refactoring strutturale dei moduli coinvolti.
- Avviare una revisione complessiva solo quando la struttura del progetto lo richiede: non utilizzare il semplice numero di modifiche come soglia automatica.
- Separare responsabilità distinte (stato del gioco, turni, punteggi, ammo, UI, rendering, animazioni, persistenza) dove ciò riduce realmente la complessità. Evitare astrazioni e frammentazioni inutili.
- Eliminare codice morto, duplicazioni, CSS e asset obsoleti, verificando prima che non siano ancora referenziati.
- Mantenere `main` come unico branch permanente. Chiudere e cancellare i branch temporanei dopo il merge verificato; non eliminare branch con PR aperte o modifiche non integrate.
- Produrre di norma screenshot, GIF e log temporanei in `artifacts/` (ignorata da Git). Versionare soltanto prove visive canoniche necessarie e mantenere, quando applicabile, le ultime due revisioni utili; conservare asset approvati, originali di riferimento e indicazioni di riproduzione.
- Preservare invariati regole di gioco, interfaccia, qualità e risoluzione degli asset, prestazioni e compatibilità delle partite salvate, salvo richiesta esplicita contraria.
- Verificare il risultato con test pertinenti, inclusi test di regressione per calcolo punteggi, ammo, turnazione, spareggio, persistenza e caricamento degli asset. Non dichiarare eseguiti test che non sono stati realmente eseguiti.
- Se il refactoring è significativo, preferire una PR dedicata, distinta da nuove funzionalità, con sintesi delle modifiche e dei controlli effettuati.
- Per le modifiche visive o funzionali restano obbligatorie GIF reali o screenshot secondo la sezione precedente, senza HTML di anteprima.
- Prima di modificare AGENTS.md, verificare che la regola non esista già ed evitare duplicazioni o istruzioni contraddittorie.
