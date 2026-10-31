> **Per la futura direzione artistica e la cinematica prevale la [specifica Bafometto v1.1.0](HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.1.0_20261031.md).** Le istruzioni seguenti su Cerbero, sfondo a ponte e portale dall'alto rappresentano il progetto precedente/runtime ancora non sostituito. Questa nota **non** modifica le regole di gameplay descritte sotto.

# Hellscape — Correzioni gameplay e regia (prompt operativo per Codex)

> Aggiornamento dell’utente del 28/10/2026: per le modifiche dinamiche allegare **GIF reali del browser**, non soltanto screenshot. Per gli stati statici restano validi gli screenshot; niente HTML di anteprima. Questa richiesta prevale sui riferimenti «solo screenshot» presenti nel testo storico seguente. Procedere con [un intervento per volta](HELLSCAPE_LAVORO_SEQUENZIALE.md).

> **Stato aggiornato:** il testo seguente conserva la specifica iniziale. Le richieste successive dell’utente prevalgono: colonne scartate, ponte e portale approvati, Antisigillo al 20%, Sacrificio al 5% e +777 punti/−1 vita, Tributo immediato al 33%, nuove regole di Malocchio, Sigillo e Contrappasso. Stato integrato, prove e limiti sono nella [verifica finale](HELLSCAPE_VERIFICA_FINALE_2026-10-28.md). Non ripristinare i comportamenti storici incompatibili.

**Versione:** 1.3.0 · **Data:** 28 ottobre 2026  
**Repository:** `rickymusu-bit/quiz` · **Base di lavoro:** ramo `fix/malocchio-preview-spec-20261028` (PR contenente le prime correzioni)  
**Stato:** specifica operativa iniziale; implementazione e verifiche correnti sono tracciate nel rapporto finale e nel piano sequenziale.

> **Istruzione principale per Codex:** esamina il codice realmente presente nella head del ramo, implementa le modifiche indicate, crea o aggiorna i test, acquisisci screenshot effettivi e apri/aggiorna una PR per revisione. **Non eseguire merge autonomamente.** Non creare file HTML allegati o incorporati per l'anteprima. Non dichiarare test eseguiti se non lo sono.

## 0. Priorità e prevalenza delle richieste

Questo documento **sostituisce**, dove incompatibili, `docs/HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md`, `docs/HELLSCAPE_PORTAL.md` e le versioni precedenti delle scene finali. Conserva il resto del regolamento e l'architettura già funzionanti. Non ripristinare il portale che emerge dalla lava, la fila indiana dei perdenti, i veicoli fermi o lo spareggio a morte immediata al primo errore.

Sono **già corretti nel ramo base**, salvo regressioni:
- `AGENTS.md`: anteprime composte **solo da screenshot**, senza HTML embedded o file HTML di preview come consegna;
- `assets/js/ui.js`: durante **Malocchio** le opzioni A–D sono assenti dal DOM; visibili soltanto testo della domanda e punti;
- `assets/js/core.js`: testo di aiuto Malocchio aggiornato.

Verifica e preserva queste modifiche. Distingui problemi risolti e problemi ancora aperti nella PR.

## 1. Modifiche al regolamento — priorità P0

### 1.1 Malocchio (regressione da impedire)

Quando il giocatore attiva Malocchio su una domanda non ancora rivelata:
- mostra **solo il testo completo della domanda e il relativo punteggio**; **nessuna alternativa** (né visibile, né accessibile tramite focus, accessibilità o DOM);
- timer fermo mentre sceglie se affrontarla o passarla a un avversario; il timer completo parte alla conferma;
- dopo la conferma, mostra tutte le quattro alternative nella normale schermata di risposta;
- non permettere la rivelazione delle alternative tramite scorciatoie o controlli nascosti; niente perdita delle risposte del dataset.
- Nel round di Ultimo Miglio, al posto dei punti si mostra l'etichetta di fase: non inventare punteggi.

### 1.2 Flagello

Mantenere la logica globale già presente: Flagello **colpisce simultaneamente tutti i giocatori ancora attivi, incluso l'utilizzatore**. Per ciascuno:
1. sottrarre **una vita**; se scende a zero, eliminare secondo il motore esistente;
2. distruggere **tutte le Ammo nel suo inventario** (compresi gli oggetti appena acquisiti), senza cambiare gli inventari dei giocatori già eliminati;
3. sottrarre **fino a 666 punti**, ossia `min(666, punteggio attuale)`, con limite inferiore 0; mantenere l'aritmetica razionale esatta della distribuzione punti (Livella/Tributo) e non arrotondare lo stato;
4. non applicare Flagello due volte a nessuno; risolvere tutti gli effetti prima di determinare il vincitore o Game Over.

Il Sigillo non protegge da Flagello; Contrappasso non reagisce. L'effetto non richiede bersaglio. **Il Sigillo già attivo è uno stato protettivo, non un oggetto in inventario**: non cancellarlo come effetto collaterale della pulizia dell'inventario. Aggiorna aiuti, log, risultati, indicazioni UI e test. Controllare casi 0, frazioni positive inferiori a 666, 666 esatti, oltre 666; attivazione con unico sopravvissuto e autoeliminazione dell'utilizzatore.

### 1.3 Nuova Ammo: Antisigillo

Introduci il tipo `antisigillo` in modo coerente con il sistema esistente:
- bersaglia **un solo avversario attivo che abbia un Sigillo effettivamente attivo**;
- consuma un'Ammo Antisigillo e **annulla immediatamente la protezione del Sigillo** del bersaglio, che torna vulnerabile a Catene, Tributo e Malocchio;
- il Sigillo **non blocca** Antisigillo, altrimenti l'oggetto sarebbe inutile;
- non rimuove gli altri effetti e non sottrae punti o vite; un bersaglio senza Sigillo non è selezionabile e l'Ammo non deve essere consumata per tentativo invalido;
- trattarlo come **dissipazione della protezione**, non come attacco riflesso: Contrappasso non si attiva;
- probabilità indipendente **30% predefinita**, configurabile come le altre; preserva e migra i salvataggi che non hanno ancora il nuovo peso; non modificare gli altri pesi predefiniti;
- aggiungi icona/artefatto demoniaco dedicato, ben distinguibile da Sigillo a 32–48 px, nello stile terroso-metallico, con resa ad alta definizione; aggiornare inventario, legenda, guida, anteprima e test;
- se uno stato salvato contiene già un Antisigillo, validarlo correttamente; dopo migrazione di salvataggi precedenti non deve causare crash.

### 1.4 Spareggio rinominato «Ultimo Miglio»

L'espressione **Ultimo Miglio** sostituisce «spareggio» nei testi rivolti al giocatore (titoli, messaggi, schermate, audio se presente, tooltip e aiuto). Gli identificativi interni (`phase: "pareggio"`, `tieRound` ecc.) possono rimanere per la compatibilità dei salvataggi.

Regole:
- si attiva **solo dopo l'ultima domanda ordinaria**, soltanto se più giocatori attivi sono pari al primo posto, mai all'inizio con punteggi a zero;
- domanda estratta **esclusivamente tra quelle di difficoltà `difficile`**, anche se in partita ordinaria era selezionata un'altra difficoltà;
- usa domande **mai viste**, senza riutilizzi. Se finiscono, entra in stato di rifornimento con messaggio chiaro e cerca soltanto nuove domande difficili: mai ricadere su facile/media;
- ogni risposta **sbagliata o scaduta toglie esattamente una vita**. Il giocatore viene eliminato **soltanto quando esaurisce tutte le vite residue**; non eliminare al primo errore se gli rimangono vite;
- le vite residue all'ingresso dell'Ultimo Miglio sono quelle effettivamente rimaste dopo la partita ordinaria: **non azzerare danni, sanzioni o resettare a una sola vita**; renderle tutte correttamente come cuori nella UI;
- risposte corrette non aggiungono punti né Ammo. I punteggi già ottenuti rimangono congelati;
- ogni giocatore previsto nel giro deve rispondere alla propria domanda, **anche se un altro è stato eliminato prima nello stesso giro**. Al termine del giro: se resta un solo giocatore attivo, vince; nessuno: Game Over; più di uno: nuovo giro;
- proteggere `next()`, ripresa da salvataggio, rifornimento, sconfitte multiple e cambio turno da loop o turni fantasma.

**Nota di compatibilità:** il motore oggi impone 1 vita in spareggio in `remainingLives`, elimina al primo errore e azzera `damage` entrando in pareggio. È necessario correggere **insieme** `assets/js/core.js`, `assets/js/engine.js`, `assets/js/ui.js`, la validazione e la migrazione dei salvataggi e le prove in `tests/engine.test.js`/`tests/tie.test.js`. Per salvataggi già creati durante il vecchio spareggio, definire e testare una migrazione coerente; non resettare arbitrariamente vite o ripetere domande già viste. Aggiornare i version number pertinenti a seconda delle regole di repository.

## 2. Ponte e scena — priorità P1

### 2.1 Struttura fisica e architettura

- Ripristinare **pilastri portanti del ponte** visibili sotto la carreggiata, ancorati nella lava, con prospettiva, parallasse e occlusioni corrette.
- **Rimuovere completamente la ringhiera**, attualmente visibile soltanto su un lato. Non sostituirla con una ringhiera simmetrica.
- Disporre **colonne gotiche in rovina su entrambi i lati**: pietra fratturata, basi, capitelli, sezioni crollate, distanziamento naturale non perfettamente ripetitivo. Le colonne restano ai bordi e non coprono i veicoli né le alternative.
- Distribuire sulla carreggiata **ossa, teschi, frammenti di pietra, rottami metallici e residui di veicoli**: casualità riproducibile/seed, proporzioni fisiche plausibili, densità non eccessiva, contrasto leggibile su asfalto quasi carbone. Nessun overlay che nasconda ruote, veicoli, giocatore corrente.
- Integrare i danni nel piano del ponte, seguendo la prospettiva; non usare pattern che sembrino sospesi nell'aria; mantenere performance e continuità del movimento.

### 2.2 Qualità uniforme degli asset

Attualmente i dettagli dei veicoli risultano troppo pixelati rispetto alla home e a elementi ad alta risoluzione. L'obiettivo **non** è aumentare semplicemente CSS width o interpolare un'immagine minuscola:
- eseguire audit risoluzione **sorgente → sprite/atlante → canvas → dimensione effettiva su schermo**, per veicoli, demone, detriti, ponte, portale, icone, titoli e home;
- rigenerare/refinire gli asset insufficienti a **risoluzione nativa adeguata** per la massima dimensione effettiva e il DPR target, mantenendo il design dieselpunk/junkpunk terroso e metallico e le silhouette approvate dei sei veicoli;
- correggere atlas crop, bordi trasparenti, clipping, coordinate di frame, `imageSmoothingEnabled`, filtri e scale che degradano i dettagli. Mantenere i dettagli del davanti e del retro dei veicoli, senza parti scomparse o invertite;
- 4:3 logico coerente su ogni schermata, qualità allineata tra logo e gioco; canvas adattabile ad Android e desktop senza esplosione di memoria. Usare DPR effettivo con limite ragionevole e profiling, non moltiplicare indiscriminatamente le texture;
- se c'è una stilizzazione pixel-art intenzionale, renderla **coerente** e leggibile, ma non lasciare i veicoli involontariamente sgranati.

## 3. Animazione continua del demone — priorità P1

- Nessun movimento «a scatti», fermo immagine o salto di posizione. Usare `requestAnimationFrame` con delta-time e interpolazioni dipendenti dal tempo, non dal numero di frame; separare locomozione, avanzamento in avanti, spostamento laterale e animazione degli arti.
- Il demone e **tutti i veicoli ancora in gioco continuano a muoversi** anche durante catture, fine partita, transizioni e fuga; non fermare la carreggiata/scorrimento per simulare una pausa.
- Durante una cattura, **non allineare i perdenti in fila indiana** dietro il vincitore. Ogni veicolo mantiene la sua corsia; il demone individua la corsia del bersaglio, si sposta fluidamente verso di essa, accelera per raggiungere il veicolo in marcia e lo cattura.
- Coreografia possibile e preferita: breve rincorsa in corsia → **fiammata direzionale leggibile** (con luce sulle superfici) → presa fisica e **inghiottimento completo** del veicolo con transizione di sprite credibile → demone prosegue senza stop. Non lasciare veicoli mangiati visibili o duplicati. Usare suono solo se già previsto e controllabile.
- Catture multiple in sequenza senza teletrasporto o collisioni di corsia; gestire primo/ultimo bersaglio senza riordinare i giocatori; non tagliare testa o arti del demone ai bordi dell'atlante.
- La scena e la logica di vittoria devono restare separate: la coreografia non determina il risultato del quiz. Se più veicoli restano in fuga, la loro velocità continua; il vincitore si stacca progressivamente.

## 4. Portale di salvezza — priorità P1

Questa versione **sostituisce esplicitamente** la precedente richiesta del portale che esce dalla lava.

1. Il portale **scende dall'alto**, allineato prospetticamente alla strada, davanti al veicolo vincitore, e **incide un solco nel ponte** nell'impatto. La base si incastra nella carreggiata, che mostra spaccature e detriti; i pilastri sottostanti e le colonne laterali rimangono spazialmente coerenti.
2. Portale **neoclassico**, con palette di **azzurro, bianco e oro**, ben distinta da inferno, carbone e lava. Scala monumentale ma **passaggio largo soltanto per un veicolo alla volta**: non un arco più largo dell'intera carreggiata.
3. La prospettiva del portale deve reagire allo spostamento di camera e alla profondità della scena. Evitare aspetto di immagine 2D incollata sopra la pista.
4. Il vincitore **attraversa il portale continuando a guidare**, senza arrestarsi e senza essere raggiunto dal demone. Camera/effetti mostrano chiaramente il passaggio.
5. **Dopo il passaggio**, il portale **crolla**, lasciando **macerie permanenti sul ponte** e il solco visibile. Non sprofonda nella lava né svanisce senza residui.
6. Il demone non oltrepassa il portale, e dopo il crollo manifesta frustrazione con una reazione fisica fluida che non congeli l'ambiente circostante.

## 5. File del repository da controllare

- Regole e stato: `assets/js/core.js`, `assets/js/engine.js`, `assets/js/ui.js`, persistenza, `tests/engine.test.js`, `tests/tie.test.js`;
- Ammo e icone: `assets/hell-ammo.js`, `assets/ammo-preview.js`, atlas ammo e test dedicati;
- regia: `assets/hell-race.js`, `assets/hell-chase.js`, `assets/hell-ending.js`, `assets/hell-epilogue.js`, `assets/hell-tie.js`;
- ponte e portale: `assets/hell-bridge.js`, `assets/hell-portal.js`, `assets/hell-terrain.js`, `assets/hell-layout.js`, atlanti `assets/hell-race/`;
- rendering/layout: `Fool.html`, CSS, `scripts/build.cjs`; verifica il build offline ma **non allegare l'HTML** come anteprima;
- aggiornare `README.md`, `AGENTS.md` solo se necessario, e disambiguare specifiche storiche obsolete.

Non inventare moduli o asset: ispezionare prima la struttura effettiva, ripulire codice morto e duplicazioni senza rifare il progetto da zero.

## 6. Verifiche e criteri di accettazione

**Test automatici indispensabili:**
- Malocchio: niente alternative nel DOM/focus/accessibility tree fino alla scelta; question text + punti sì; risposta disponibile dopo conferma; timer corretto e passaggio a un altro giocatore.
- Flagello: tre effetti contemporanei su tutti gli attivi compreso autore; inventario svuotato; vite -1; punti decrementati al massimo di 666 e mai negativi; frazioni esatte; gestione di chi si elimina da solo.
- Antisigillo: bersaglio solo se protetto, bersaglio non valido non consuma Ammo, protezione rimossa, successivi attacchi normali, persistenza, probabilità, renderer icon.
- Ultimo Miglio: entra solo al termine della partita in parità; **solo difficili**, mai già viste; vite residue preservate, errore/timeout -1 vita, eliminazione solo a zero; tutte le risposte del giro restano dovute, Game Over se nessun superstite; rifornimento filtra difficili, restore verificato.
- Movimento: campionamento della posizione del demone su più frame con delta-time variabile e controlli per discontinuità/ritagli; cattura in corsia senza immobilizzazione di veicoli o sfondo, nessuna duplicazione di sprite.
- Portale: compare dall'alto, solco, attraversamento, crollo e macerie, una sola corsia di passaggio, ordine degli eventi; colonne e pilastri su entrambi i lati, assenza della ringhiera originale.
- Test esistenti `npm test`, browser, frames, build/offline: correggere aspettative obsolete; dichiarare esplicitamente i test non eseguibili e il motivo.

**Screenshot reali, non HTML embedded**, dalla stessa revisione della PR, almeno:
1. partita ordinaria con veicoli e ponte (pilastri, ossa, rottami, colonne gotiche);
2. Malocchio prima della scelta, senza opzioni;
3. Antisigillo e Flagello (inventario/punteggi/vite);
4. Ultimo Miglio con più cuori e una domanda difficile;
5. cattura con fiammata e demone nella corsia del bersaglio;
6. discesa e impatto del portale, attraversamento e portale crollato con macerie;
7. confronto desktop 4:3 e mobile.

Gli screenshot devono essere file PNG/JPEG acquisiti dal browser; **non** generazioni illustrative spacciate per test, non esportazione di una pagina HTML come preview, non iframe. Metti i riferimenti agli screenshot nella PR e mostrali per l'approvazione.

**Ordine di lavoro suggerito:** P0 motore + test → P1 audit asset/ponte → locomozione e catture → portale → test regressione, screenshot e refactoring finale. Dividi in PR tematiche se utile, ma non fare merge senza approvazione.

**Consegna finale di Codex:** riepilogo puntuale implementato/non implementato, percorsi modificati, test e risultati verificabili, screenshot, link PR, eventuali limitazioni. Nessuna dichiarazione di lavoro completato basata solo su mockup.
