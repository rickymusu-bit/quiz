# Sigillo · motore 2.7.0 / regole 24.0.0

Sigillo dura **tre turni personali**, incluso quello di attivazione. Il contatore
3 → 2 → 1 scende soltanto all’inizio dei propri turni; al quarto scade. Protegge
dagli effetti negativi delle Ammo avversarie, rimuove Catene e Tributi pendenti
e lascia invariati i punti del protetto durante Livella (ripartizione tra gli altri).
Mentre è attivo impedisce qualsiasi altro uso di Ammo e qualsiasi nuova Ammo da
risposte corrette; i punti delle risposte corrette e le copie già possedute restano.
**Flagello** colpisce comunque; **Antisigillo** distrugge la protezione in anticipo
e rimuove immediatamente anche le restrizioni. Non evita sanzioni o rischi propri.

Il campo persistito `aura` ora contiene i turni personali residui (1–3, oppure
null), anziché il vecchio numero del turno di attivazione. Le partite precedenti
con Sigillo attivo migrano a tre turni residui senza riassegnare punti o vite.

## Malocchio · motore 2.6.0 / regole 23.0.0

Malocchio mostra testo e valore della domanda senza alternative, a timer fermo.
Chi lo usa può tenerla o passarla a un altro gruppo. Alla conferma parte il timer
intero: chi risponde bene tiene tutti i punti e le Ammo ottenute; chi sbaglia o
lascia scadere il tempo perde il valore della domanda, **senza scendere sotto zero**.
Le vite restano invariate. La rotazione riparte da chi segue **l’autore di Malocchio**,
rispettando Catene ed eliminazioni, anche se ha risposto un altro gruppo.
La domanda passata non può essere ripassata né permette Ammo al destinatario.
Il rischio e l’autore persistono nei salvataggi, anche migrando una domanda aperta
nelle versioni precedenti; nessun esito storico viene riapplicato.

## Aggiornamento Ammo · motore 2.5.0 / regole 22.0.0

La richiesta aggiornata dell’utente prevale sulle specifiche storiche sotto:

- **Antisigillo:** probabilità indipendente predefinita del **20%**.
- **Sacrificio:** probabilità indipendente del **5%**; chi lo usa perde una vita e riceve **777 punti**, anche se la perdita dell’ultima vita lo elimina. Se sopravvive continua il turno.
- **Tributo:** trasferisce subito il **33% esatto dei punti attuali** dell’avversario, conservando il totale. Chi lo usa rinuncia subito al turno corrente. Sigillo blocca il furto ma il turno è comunque ceduto; Contrappasso reagisce agli attacchi non bloccati. Nessuna condivisione dei guadagni futuri per i nuovi usi.

Le probabilità restano configurabili e indipendenti. Nove tipi di Ammo in totale.
Le partite 2.4.0 migrano senza perdere vite, punteggi o avanzamento: il precedente
default Antisigillo del 30% diventa 20%, Sacrificio mancante riceve il 5%; altre
probabilità personalizzate restano invariate. Eventuali Tributi già pendenti nei
salvataggi precedenti si risolvono una sola volta secondo la vecchia regola,
senza creare effetti retroattivi durante il caricamento.

## Storico: correzioni v1.3.0 · motore 2.4.0 / regole 21.0.0

Consegna aggiornata: GIF reali del browser per animazioni e comportamenti dinamici; screenshot per gli stati statici. Vedi [AGENTS.md](AGENTS.md) e gli [interventi da affrontare uno alla volta](docs/HELLSCAPE_LAVORO_SEQUENZIALE.md).

La specifica corrente è [HELLSCAPE_CORREZIONI_CODEX_v1.3.0](docs/HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md). Le note storiche più sotto non prevalgono su questa specifica. Stato e verifiche: [rapporto v1.3.0](docs/HELLSCAPE_VERIFICA_v1.3.0.md).

Antisigillo dissipa soltanto un Sigillo attivo avversario; non è riflesso da Contrappasso. Flagello applica simultaneamente −1 vita, inventario vuoto e fino a −666 punti a tutti gli attivi. L’Ultimo Miglio conserva le vite rimaste e usa solo domande difficili nuove; ogni errore/timeout toglie una vita, completando il giro prima del verdetto.

Nei vecchi salvataggi creati durante il precedente spareggio si mantiene la vita effettiva già disponibile, senza riportare in gara gli eliminati. I danni ordinari azzerati dal vecchio motore non sono ricostruibili. Un quesito facile/medio ancora aperto viene ritirato (se svelato resta in `seen` e `cancelled`) e sostituito da uno difficile sullo stesso turno, senza risposta ripetuta. I salvataggi ordinari mantengono danni, sanzioni, punteggi, domande e probabilità; Antisigillo mancante riceve il 30%.

`npm run test:v130` verifica nel browser inventario, Malocchio senza opzioni nel DOM/accessibilità, timer, Flagello, Antisigillo, cuori residui, cattura in corsia e portale. Produce screenshot PNG reali in `artifacts/v130`, con viewport e DPR nel rapporto. Non consegnare gli HTML di build come anteprima.

# Hellscape - Fuga dall’inferno

Sito: https://rickymusu-bit.github.io/quiz/

**Applicazione 3.5.0 · Motore 2.3.0 · Regolamento 20.0.0 · 27/10/2026**

Hellscape è un quiz di fisica per tre giocatori, pubblicato su GitHub Pages dal ramo `main`. Il gioco carica automaticamente i quesiti dal catalogo `datasets.json`. Le domande appartengono a banche separate, associate a materie e argomenti; non è richiesto un server applicativo.

## Struttura e sviluppo

Il refactoring parte dalla head `f2a2458` della PR #17, ancora aperta al momento del lavoro. La PR di refactoring dipende da quelle correzioni; non modifica né integra la PR #17.

Il sito funziona direttamente come archivio statico, senza compilazione obbligatoria, framework o dipendenze JavaScript scaricate a runtime. I moduli usano IIFE con esportazioni CommonJS per i test Node: `core` → `datasets` → `engine`; `loader` dipende da `datasets`; `persistence` riceve storage e motore; `ui` coordina questi moduli. Non ci sono dipendenze circolari.

- `assets/js/core.js`: costanti, frazioni esatte e funzioni condivise.
- `assets/js/engine.js`: partita, turni, timer, punteggi, Ammo, sanzioni, Ultimo Miglio, finali e validazione/migrazione dello stato. Si importa in Node senza DOM; l’API pubblica `Fool` resta disponibile.
- `assets/js/datasets.js`: parsing, validazione delle banche e notazione scientifica.
- `assets/js/loader.js`: catalogo e caricamento dal sito o dalle risorse incorporate nell’export.
- `assets/js/persistence.js`: accesso iniettato a storage, lettura/scrittura dei profili e ripresa attraverso il motore. Il sito conserva `fool-v1`, `fool-settings-v1` e il JSON esistente.
- `assets/js/ui.js`: configurazione, impostazioni, schermate, dialoghi, comandi e adattamento del palco. Lo stato dell’interfaccia è racchiuso nel modulo; `HellscapeUI` è la facciata esplicita usata dalle regressioni browser.
- `assets/css/game.css` e `assets/hellscape.css`: stili di base estratti e stili della grafica esistente, nello stesso ordine di cascata. `assets/home.css` contiene la schermata iniziale illustrata.
- `assets/hell-terrain.js`: basalto continuo, degradazione per domande completate, ossa, teschi umani e demoniaci, rottami di veicoli e geyser di lava, senza corsie visibili.
- `assets/hell-chase.js`: traiettorie pure di mondo/telecamera, fila e catture ancorate alle pose; usa la geometria condivisa del ponte.
- `assets/hell-epilogue.js`: regia pura di portale, frattura, attraversamento, sprofondamento e reazione.
- `assets/hell-portal.js`: architettura marmo/oro e luce, proiettata nello spazio del ponte.
- `assets/hell-ending.js`: composizione delle pose, occlusioni e rendering di catture, inseguimento ed epilogo, senza modificare il modello.
- `assets/hell-ammo.js`: timeline degli eventi Ammo ed effetti Canvas sui veicoli; conserva la coda visiva fra i ridisegni e ignora gli eventi storici alla ripresa di un salvataggio.
- `assets/hell-race.js`: componente Canvas separato; legge lo stato senza applicare transizioni al motore.
- `assets/vendor/katex.js` e `katex.css`: KaTeX 0.16.22 e font incorporati estratti senza riscrittura; licenza in `assets/vendor/README.md` e nell’HTML.
- `scripts/build.cjs`: copia statica e generazione dell’unico HTML offline dagli stessi sorgenti.

Servono Node 22 o successivo e Python 3.12 per i comandi di sviluppo. Il sito pubblicato non richiede Node o Python.

```sh
npm ci
python3 -m pip install -r requirements-test.txt
npm run dev             # http://127.0.0.1:8000
npm test                # motore, persistenza e 200 domande delle due banche
npm run test:frames     # 48 fotogrammi veicoli + 12 demone, proporzioni, gruppo compatto e contorno giallo
npm run test:browser    # regressioni interfaccia e Canvas
npm run test:ammo       # sette effetti Ammo, blocchi, timer, pausa e movimento ridotto
npm run test:endings    # presa, morso, fiammata e i due finali
npm run test:terrain    # progressione del terreno su desktop e Android
npm run build           # dist/site, pubblicabile su hosting statico
npm run test:offline    # genera e verifica dist/Hellscape-offline.html
npm run test:quality    # audit offline di dieci schermate, cinque viewport, DPR 1/2
npm run test:ties       # intro, eliminazioni, nuovi giri e ripresa dell’Ultimo Miglio
npm run test:portal     # portale nel mondo, ponte, attraversamento ed epilogo offline
npm run test:chase      # fila, ancoraggi, catture e inseguimento offline, cinque viewport a DPR 1/2
npm run test:motion     # locomozione offline, pausa e clock a 30/60/144 FPS
npm run test:layout     # testo e controlli nativi, 4:3, orientamento e fullscreen
```

I test riutilizzano Chromium in `/usr/bin/chromium`; per un altro eseguibile impostare `CHROMIUM_PATH`. Se non è presente un browser, installarlo con `npx playwright install --with-deps chromium` e impostare `CHROMIUM_PATH` al percorso restituito da `node -p "require('playwright').chromium.executablePath()"`. La generazione dell’export usa soltanto librerie standard di Node.

GitHub Pages può continuare a pubblicare la radice del ramo `main`, con gli stessi URL `index.html`, `Fool.html`, `Fool_regole.html`, catalogo, dataset e asset. `npm run build` produce anche `dist/site` per altri hosting statici; non pubblica nulla e non modifica la configurazione Pages.

L'[audit grafico della specifica 1.2.0](docs/HELLSCAPE_AUDIT_VISIVO.md) documenta
la correzione del ricampionamento del logo e i successivi interventi di layout
e cinematiche. Il logo illustrato viene visualizzato alla risoluzione originale,
senza la precedente conversione a 256/68 pixel. `npm run test:quality` genera
anche `dist/Hellscape-review.html`: un export autonomo con un pannello per
aprire direttamente gli scenari di revisione, compresi Ultimo Miglio e finali.
Gli scenari sostituiscono la partita dell'anteprima, nelle sole chiavi offline.
La UI del sito e il regolamento non includono quel pannello.

Il [contratto di layout condiviso](docs/HELLSCAPE_LAYOUT.md) conserva il palco
1024 × 768 e la scena 4:3. Quando il palco dovrebbe essere rimpicciolito, i
pannelli passano al layout responsive con testo leggibile e scorrimento interno,
mentre il Canvas mantiene geometria e proporzioni. Home, preparazione e regole
usano lo stesso adattamento. Questo intervento precede le nuove cinematiche.

La [PR A di locomozione](docs/HELLSCAPE_MOTION.md) collega strada, passi e
polvere allo stesso clock di scena; il pannello di revisione include lo scenario
**Corsa / locomozione** con domanda non svelata e timer fermo.

La [PR B dell’Ultimo Miglio](docs/HELLSCAPE_TIE.md) introduce finalisti e regole
solo dopo il comando successivo all’ultimo esito ordinario. Avvisi di eliminazione
precedono le catture, i nuovi giri hanno un richiamo breve e la prima domanda
rimane non svelata a timer fermo. Il pannello di revisione offre le introduzioni
a due/tre giocatori, il nuovo giro e un’eliminazione in pausa.

La [PR C di inseguimento e catture](docs/HELLSCAPE_CHASE.md) parte dalle posizioni
realmente mostrate, dispone i mezzi in fila e cattura prima il perdente arretrato.
Il veicolo segue mano e bocca senza cambiare scala; strada e passi derivano dalle
coordinate del mondo. Dopo le catture il demone recupera sul vincitore. L'export
include filmati con zero, uno o due perdenti e fotogrammi di fila, presa e bocca.
La [PR D del portale](docs/HELLSCAPE_PORTAL.md) completa l'uscita: architettura
trasversale in marmo e oro, frattura causata dall'emersione, passaggio dietro
la soglia, sprofondamento e nuovo epilogo. Solo dopo pugni, fiammata e affanno
compaiono VITTORIA e il nome reale del fuggitivo.

L’anteprima include home, gioco, regole, entrambi i dataset, script, CSS, immagini e font in **un solo HTML**. Le pagine sono incorporate in un iframe che viene ricreato alla navigazione, così timer ed eventi della pagina precedente vengono chiusi. La chiave delle partite esportate è `hellscape-offline-v1:fool-v1`; quella dei profili è `hellscape-offline-v1:fool-settings-v1`. Non legge o sovrascrive i salvataggi del sito. Il meta `hellscape-revision` e `dist/revision.json` identificano il commit generatore; gli output sono ignorati da Git e vanno rigenerati dopo ogni modifica, senza correggerli a mano.

`tests/offline.py` carica gli esatti byte dell’HTML in un contesto Chromium senza rete, controlla entrambe le banche, risposte, regole, ripresa, isolamento dei salvataggi, assenza di richieste esterne ed errori JavaScript a 1440×900, 390×844 e 844×390. Il browser gestito di questa sessione blocca gli URL `file://`: il test usa una sola risposta locale intercettata per fornire il documento e non certifica l’apertura diretta da file in quel browser. Gli screenshot vengono scritti in `artifacts/`.

Per confrontare la grafica con la base della PR #17, preparare un checkout e indicarlo a `HELLSCAPE_BASELINE=/percorso/base python3 tests/visual_parity.py` (richiede Pillow). Il test confronta pixel per pixel tre screenshot con movimento ridotto e riprende una partita salvata dal codice della base. È una verifica del solo refactoring: la successiva correzione approvata delle proporzioni dei mezzi e della posizione dei nomi produce differenze visive intenzionali rispetto alla PR #17. La base non viene usata dal sito o dalla build.

## Partita ordinaria

L’arbitro infernale configura nomi, simboli e tre veicoli distinti per i giocatori, tempo, punteggi, difficoltà, argomenti e numero di domande (multiplo di tre da 3 a 99, predefinito 33). All'avvio viene indicato esplicitamente il numero di domande della **partita ordinaria**: l’Ultimo Miglio non è un'alternativa all'inizio della partita. I vecchi profili salvati con meno di 33 domande, non marcati come scelta esplicita, vengono riportati a 33; una nuova scelta di partita breve, salvata dalle impostazioni, resta valida. Se si riprende una partita già salvata con meno di 33 domande, viene mostrato un avviso; la partita esistente non viene modificata automaticamente. Una risposta corretta assegna i **punti base della difficoltà**, senza moltiplicatori o serie; una risposta errata non sottrae punti. I punti possono essere condivisi tramite Tributo. L'ordine dei giocatori è sorteggiato e poi fisso.

Le otto **Ammo** sono **Catene, Tributo, Malocchio, Sigillo, Contrappasso, Livella, Flagello e Antisigillo**. La probabilità di estrazione è indipendente per ogni tipo: 30% predefinito per i primi cinque, **15% per Livella e 5% per Flagello**. Antisigillo ha una probabilità indipendente predefinita del 30%. Le probabilità sono configurabili singolarmente. Tributo mantiene la precedente logica di divisione del guadagno fra il rispondente e i beneficiari; l'identificativo interno `ruba` resta invariato per compatibilità. **Livella** ridistribuisce immediatamente tutti i punti già accumulati in parti identiche fra i giocatori ancora attivi, compreso quello che lo utilizza, senza creare o eliminare punti. I punteggi dei giocatori eliminati rimangono invariati. Quando il totale non è divisibile, il gioco conserva frazioni esatte. Livella non è un attacco: Sigillo non lo blocca e Contrappasso non reagisce. Dopo una risposta corretta possono essere assegnate più Ammo indipendenti; nello stesso turno è possibile usarne più di una.

Alla fine delle domande previste **vince il giocatore attivo con più punti**. Se resta un solo giocatore attivo prima della fine, vince immediatamente; se tutti vengono eliminati, è Game Over.

### Animazioni delle Ammo

Ogni uso confermato mostra materiali illustrati horror, gotici e junkpunk, ricavati da un atlante raster: Catene serra maglie di ferro corroso con lucchetto a teschio; Tributo muove sacche di monete maledette; Malocchio apre un occhio di carne fra palpebre d'osso; Sigillo chiude una gabbia di ossa e ferraglia; Contrappasso usa uno specchio gotico infranto; Livella raccoglie e ripartisce il tributo con una bilancia d'ossa; Flagello rompe il basalto e fa eruttare fuoco. Gli attacchi bloccati producono schegge sul Sigillo. Le eliminazioni da Flagello vengono animate dopo il colpo collettivo.

Durante gli effetti i pannelli lasciano visibile la corsa e il timer resta fermo; `P` permette la pausa manuale durante una domanda aperta. Con movimento ridotto viene mostrata una posa statica per 450 ms. Le animazioni leggono gli eventi già risolti dal motore: non consumano altre munizioni e non vengono ripetute ricaricando un salvataggio. `npm run test:ammo` controlla desktop, Android verticale e orizzontale; `node tests/ammo_animation.cjs --offline` verifica gli stessi effetti nell'HTML esportato senza rete.

## Ultimo Miglio

L’Ultimo Miglio si apre **solo in caso di parità al primo posto dopo tutte le domande della partita ordinaria**. I giocatori in testa rispondono una domanda ciascuno nell'ordine di rotazione originario. Ogni risposta errata o tempo scaduto sottrae esattamente una vita; il giocatore è eliminato solo a zero. Le vite residue, sanzioni e danni ordinari restano invariati all’ingresso. Il giro termina **solo dopo che tutti i giocatori ancora presenti nel giro hanno risposto**, anche quando il primo viene eliminato. Alla fine del giro, un solo superstite vince; nessun superstite produce Game Over; più superstiti iniziano un nuovo giro.

Le domande dell’Ultimo Miglio sono estratte fra **quelle difficili mai viste del dataset**, indipendentemente dal filtro ordinario, mantenendo il tempo della partita. Non si ripetono quesiti già mostrati; se la banca non basta, la partita attende l'aggiunta di nuovi quesiti difficili. Durante l’Ultimo Miglio il tabellone segnala che i punteggi sono congelati; non si assegnano punti né Ammo e l'esito dipende esclusivamente da risposte corrette o eliminazioni; si disattivano tutti gli effetti delle Ammo della fase ordinaria. Sanzioni, timer e sospensione restano disponibili.

## Fuga dall'Inferno — scena animata v1.5.0

Durante il quiz la scena occupa l’intero palco fisso 4:3 (1024×768): tre piloti su veicoli junkpunk/dieselpunk attraversano un paesaggio di lava inseguiti da un demone horror. Lo sfondo scorre autonomamente; quando i punti cambiano, i veicoli avanzano e possono superarsi. Le posizioni sono una rappresentazione visiva dei punteggi esatti, anche razionali dopo Livella, **non un punteggio parallelo**. I veicoli dei giocatori eliminati vengono afferrati e inghiottiti dal demone. La fiammata verso l’alto precede la danza nel Game Over.

Il portale neoclassico bianco e oro emerge dalla lava davanti al vincitore e rompe i bordi del ponte. Il raccordo centrale rimane percorribile; il mezzo e il pilota attraversano la luce azzurra senza cambiare scala. Solo quando l'intera sagoma è oltre la struttura, il portale sprofonda e il raccordo cede. Il demone batte entrambi i pugni tre volte, sputa una fiammata e resta brevemente ansimante; infine compare VITTORIA con il nome reale del fuggitivo. Senza vincitore restano cattura, fiammata e danza del Game Over, senza portale. Gli attori già divorati non ricompaiono.

Il modulo `assets/hell-race.js` è un Canvas pixel-art senza dipendenze, privo di influenza sulle regole, sul timer e sui salvataggi. La grafica si interrompe quando la pagina non è visibile e rispetta la preferenza di sistema per la riduzione del movimento. L'indicazione testuale accessibile integra le figure. I sei veicoli selezionabili sono chopper (con pilota), pick-up, camion, coupé, fuoristrada e Ape a tre ruote. Sono riconoscibili per sagoma e simbolo, non per colori vistosi. Le nuove sprite map animate, il portale e il panorama sono descritti in [assets/hell-race/README.md](assets/hell-race/README.md). Ogni mezzo ha otto pose; il demone ha sequenze distinte di corsa, attacco e morso. I punteggi, le regole e i salvataggi esistenti non vengono modificati.

## Interfaccia e salvataggi

La home, la schermata di gioco e le regole sono responsive per desktop, tablet e smartphone. Gli inventari dei giocatori mostrano **solo i tipi di Ammo effettivamente posseduti**, con una **icona pixel-art per ogni unità posseduta**, diversa per forma e materiale (Catene: manette e catena in ferro; Tributo: borsa di monete; Malocchio: bulbo deforme con iridi multiple; Sigillo: scudo runico; Contrappasso: teschio bifronte; Livella: bilancia con teschi; Flagello: mazza ferrata avvolta in stoffa borgogna). Nessuna cifra sostituisce le icone. I nomi appaiono al passaggio del puntatore; clic o tocco aprono una finestra con nome e spiegazione; le probabilità compaiono soltanto nelle impostazioni. La consultazione non consuma l’oggetto: nell’inventario proprio si sceglie Usa e poi si conferma. I vincoli di Contrappasso compaiono nella finestra. Nomi e conteggi restano accessibili ai lettori di schermo. Il comando per il fullscreen mostra **Schermo intero** o **Esci da schermo intero** in funzione dello stato del browser, anche quando il gioco è aperto in un iframe dalla home.

La schermata iniziale offre **Nuova partita** e mostra **Riprendi partita** quando in questo browser è presente una partita salvata ancora in corso. La ripresa apre direttamente il gioco, mantenendo il timer fermo. Preparare una nuova partita conserva il salvataggio precedente fino alla conferma di **Inizia partita**.

La partita viene salvata automaticamente in `localStorage` nello stesso browser. La versione 2.4.0 migra i salvataggi 2.3.0 e 2.0.0, 2.1.0, 2.2.0 e 2.2.1, conservando i punteggi e le probabilità già impostate. Quando una probabilità Livella non è presente, viene applicato il nuovo valore di default del **15%**; una probabilità già salvata (anche 30%) non viene sovrascritta. Quando Flagello manca, viene aggiunta al 5%; i vecchi salvataggi ricevono zero danni da Ammo e conservano le vite effettive. Il numero di domande predefinito resta **33**. Le partite precedenti in fase ordinaria (motore 1.2.0 / regole 18.2.0) possono essere riprese conservando punteggi e domande, senza moltiplicatori futuri. I vecchi spareggi del Massacro non vengono convertiti, perché hanno regole incompatibili.

## Contenuto e verifiche

- `Fool.html`: struttura della pagina e caricamento dei moduli; mantiene il suo URL pubblico.
- `assets/ammo-hellscape-v2.png`: sette nuove icone pixel art infernali in una tavola PNG da 48 px per icona, con trasparenza e sagome differenziate.
- `Fool_regole.html`: regolamento della gara dei dannati.
- `dataset/`, `datasets.json`: banche pubblicate e catalogo.
- `docs/PROMPT_GENERAZIONE_DOMANDE.md`: istruzioni per creare quesiti.
- `tests/engine.test.js`: test del motore, del nuovo Ultimo Miglio e delle estrazioni.
- `tests/configurable.py`, `tests/options.py`, `tests/keyboard.py`, `tests/start.py`: test di interfaccia (richiedono Playwright/Chromium per la modalità browser).
- `tests/verify_datasets.py`: controlli di conformità delle banche.

Eseguire `node --test tests/engine.test.js` e `python3 tests/verify_datasets.py` per i test senza browser.

## Comandi e lettura delle domande

Ogni giocatore sceglie nome e stemma; i personaggi sono temporaneamente esclusi dalla preparazione e dal gioco. Nella fase ordinaria le tre vite sono rappresentate da cuori: ogni sanzione spegne un cuore; a zero il giocatore è eliminato. All’ingresso nell’Ultimo Miglio, ogni partecipante mantiene i cuori rimasti: un errore o timeout ne spegne esattamente uno, con eliminazione soltanto a zero. Le sanzioni disciplinari già ricevute restano registrate.

Dopo l’esito restano evidenti la risposta scelta e quella corretta. In **Opzioni** si trovano **Scorciatoie da tastiera** e **Domanda precedente**. Quest’ultimo comando permette di consultare gli esiti già registrati senza cambiare punti, turni o Ammo; ferma il timer, che si riprende esplicitamente. L’ordine delle alternative viene conservato nei nuovi esiti salvati. Per i vecchi salvataggi si recupera la domanda corrente, mentre gli esiti più vecchi privi dell’ordine delle alternative non sono ricostruibili.

Le formule note sono presentate con frazioni e pedici matematici. Nelle soluzioni, **Grandezze e simboli** spiega che una grandezza fisica è una proprietà misurabile ed elenca significati e unità dei simboli dell’argomento. La legenda appare dopo la risposta per non anticipare risposte a quesiti sulle unità. Le banche e i testi dei salvataggi restano coerenti.

**Contrappasso:** ogni attacco non bloccato trasforma una sola copia; le altre restano Contrappasso per attacchi successivi. La copia trasformata si usa solo contro l’attaccante. **Livella:** non è un attacco; Sigillo non lo blocca e Contrappasso non si trasforma, anche con più copie in inventario.

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

## Interfaccia Hellscape 3.5.0

La scena riempie il palco 4:3, centrato e ridimensionato senza ritaglio su desktop e smartphone in entrambe le orientazioni. I tre veicoli corrono ravvicinati; nessun nome è disegnato sopra i mezzi. Una sagoma gialla segue ogni fotogramma del veicolo di turno. La scena è libera da riquadri accanto ai veicoli; nome, punti esatti e vite di ciascun giocatore sono raccolti nella turnazione.

Il pannello in alto al centro offre **Inventario** e **Svela e avvia il tempo**. Dopo la risposta scompare per 1,25 secondi, lasciando vedere il movimento, poi mostra domanda, alternative e correzione con spiegazione e comando successivo. Con movimento ridotto l’intervallo è 0,4 secondi. Il pannello cresce in altezza secondo il contenuto, senza scorrimento interno o limiti che nascondano spiegazione, ricompense e pulsante Prossima domanda.

In basso a destra, **Turnazione** contiene nome, punti esatti e cuori di tutti e tre i giocatori: il rispondente attuale è sempre il primo ed evidenziato in giallo. Cliccando un nome si apre il suo inventario; le Ammo degli altri giocatori restano consultabili e non utilizzabili. Chiudi o Esc tornano al gioco. La consultazione ferma temporaneamente il timer e lo riprende alla chiusura soltanto se prima era in corsa, conservando le pause manuali.

In basso a sinistra rimane soltanto **Opzioni**, che apre una finestra con pausa/ripresa, sanzioni, riassegnazione punti, sospensione della gara, consultazione delle domande precedenti, scorciatoie, salvataggio, schermo intero, regole e ritorno alla home. Anche questa finestra conserva lo stato precedente del timer. La scelta **Pausa** mantiene il timer fermo dopo la chiusura. I pannelli decisionali e il regolamento mantengono la pausa fino alla ripresa esplicita.

Il tempo è rappresentato da una fiala orizzontale di liquido rosso: si svuota secondo il tempo residuo, si ferma in pausa e si riempie dal livello residuo al pieno in 750 ms alla domanda successiva. Il conteggio parte soltanto quando si svela la domanda. La preferenza di sistema per il movimento ridotto disattiva il riempimento animato. Le icone dei giocatori nei salvataggi precedenti restano per compatibilità.

Percorsi pubblici, API del motore e chiavi dei salvataggi sono conservati. Nessuna modifica a regole, dataset o formato dei salvataggi. I veicoli già scelti sono disabilitati negli altri selettori e tornano disponibili quando vengono liberati. All’uscita si sceglie Salva ed esci, Esci senza salvare oppure Annulla.

Per ogni modifica all’interfaccia consegnare un’anteprima HTML offline e allegare in chat screenshot aggiornati prima dell’approvazione.

La schermata iniziale usa `assets/hellscape-chase.webp`: i sei veicoli selezionabili sono visti frontalmente mentre fuggono verso chi guarda, con il demone alle loro spalle e proporzioni e sagome distinte. `assets/hellscape-logo.webp` è il titolo HELLSCAPE in metallo scolpito e incandescente, nello stile Doom del precedente logo FOOL, con sfondo trasparente. Lo stesso titolo compare nelle intestazioni di preparazione e regolamento. Illustrazione e logo sono generati dai riferimenti del gioco e convertiti in WebP senza perdita; gli originali sono conservati nell’ambiente di lavoro. Il sottotitolo «fuggi dall'inferno» è centrato sopra HELLSCAPE. I comandi della home rimangono sotto la scena, compreso Riprendi quando è disponibile un salvataggio. Tutte le immagini e il font del menu sono incorporati nell’HTML offline dagli stessi sorgenti.

Le regole raccontano la gara organizzata dai diavoli per diletto: tre dannati su veicoli scassati fuggono da un demone brutale e famelico verso un portale che riporta nel mondo dei viventi, ma lascia passare una sola persona. Rimossi voti, registro e riferimenti scolastici; le decisioni di gara fanno capo all’arbitro infernale. Punti, vite, turni, Ammo, sanzioni e Ultimo Miglio mantengono gli stessi effetti. Le impostazioni contengono soltanto Generali e Argomenti: l’anteprima delle soluzioni per il docente e il relativo codice sono rimossi.

Il comando **Riprendi partita** è presente soltanto nella home quando esiste un salvataggio valido. La preparazione di una nuova partita non mostra un secondo pulsante di ripresa e conserva la partita già salvata.

**Flagello** consuma una munizione e toglie simultaneamente una vita a ogni dannato ancora in gara, compreso chi la usa. Sanzione e Flagello consumano la stessa riserva di cuori: la sanzione colpisce un solo giocatore, Flagello tutti. Distrugge tutte le Ammo di ciascun giocatore attivo e sottrae fino a 666 punti senza scendere sotto zero; conserva il Sigillo attivo dei superstiti. Non richiede bersaglio e non viene bloccata da Sigillo né trasformata da Contrappasso. Tutte le eliminazioni si risolvono prima di decretare il vincitore; se non resta nessuno, è Game Over. Se chi la usa perde l’ultimo cuore durante una domanda, la domanda viene annullata senza esito e il turno avanza. Nell’Ultimo Miglio non si usano Ammo e una sanzione sottrae una vita e si viene eliminati soltanto a zero.

Otto diavoli in silhouette animano il cielo lontano della corsa, con sagome di pochi pixel, battito d’ali lento e deriva leggera. La loro animazione usa soltanto l’orologio grafico, resta sopra il terreno e rispetta pausa, scheda nascosta e movimento ridotto. Non usa il generatore casuale del gioco. `tests/hell_dust.cjs` verifica anche questi spettatori; `tests/ammo.py` verifica descrizioni al tocco/clic, consumo solo dopo conferma, vite condivise, ripresa e blocco delle scorciatoie dietro la finestra.

Durante avanzamenti, catture e finali animati scompaiono domanda, timer, turnazione, Opzioni, messaggi e finestre aperte con i relativi sfondi oscuranti: resta soltanto la scena Canvas. I pannelli ricompaiono quando l’azione termina. La durata delle catture segue la timeline effettiva, comprese masticazione e fiammata; eventuali eliminazioni consecutive restano senza interruzioni dell’interfaccia. Se un’azione avviene con una domanda aperta, il timer viene fermato temporaneamente e riprende dal residuo con comandi aggiornati. La pausa manuale con P interrompe anche la cattura e rende disponibili i controlli; P la riprende. `tests/cinematic_ui.py` verifica l’intero ciclo su desktop e Android.

## Ponte sulla lava e anteprima diretta

La superficie carrabile è un ponte sospeso di basalto e ferro: 110 pixel logici di profondità, contro i precedenti 181 del terreno, con un lago di lava visibile sui due lati. Le sagome complete dei tre veicoli determinano le posizioni trasversali: almeno 4 pixel logici fra i riquadri degli sprite, anche con camion, pick-up e fuoristrada affiancati. La scala di corsa è 0,62; le anteprime di scelta conservano la dimensione precedente. Lo scarto massimo di avanzamento orizzontale scende da 236 a 156 pixel; la curva dei punteggi rimane logaritmica.

`Ammo-preview.html` offre sette pulsanti, «Riproduci tutte», «Guarda il ponte» e due gruppi di veicoli, senza dover iniziare una partita né ottenere munizioni. `npm run preview:ammo` genera `dist/Hellscape-Ammo.html`, un unico file autonomo con gli stessi asset e renderer del gioco. Non accede ai salvataggi. I test `bridge_layout.cjs` verificano tutte le 120 combinazioni ordinate di tre veicoli distinti, mentre `gothic_preview.cjs` prova i pulsanti, le animazioni, il movimento ridotto e l'assenza di richieste esterne nell'HTML senza rete.
