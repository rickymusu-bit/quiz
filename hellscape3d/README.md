# Hellscape 3D

Redesign descritto in [Città procedurali 3D e regia di gioco](../docs/HELLSCAPE_PROCEDURAL_3D_CITIES.md). Il runtime pubblicato (`index.html`, `assets/`) non usa questo codice e non viene modificato; nemmeno i salvataggi `fool-v1` e `fool-settings-v1`. Il prototipo legge, senza modificarle, le banche di domande del sito (`datasets.json`, `dataset/`); una modifica alle banche fa quindi partire anche i test del prototipo, perché la CI sceglie la verifica completa per ogni file fuori da `hellscape3d/`. La pagina di prova della fase 2 non è pubblicata.

Stato (§9 della specifica):
- **fase 1, modello logico e test:** completata;
- **fase 2, graybox 3D modulare con camera:** completata nel flusso di gioco (layout, nebbia, regia, interfaccia provvisoria, ostacoli, Bafometto provvisorio, ripresa, caricamento per settori);
- **fase 3, kit e direzione artistica:** in corso. Primo passo consegnato: kit modulare procedurale con agganci e regole di assemblaggio, a tinte neutre. Restano palette, materiali e dettagli definitivi, che dipendono da decisioni di direzione artistica.

Il codice è TypeScript con sola sintassi cancellabile. Il modello logico e il layout girano direttamente in Node (≥ 22.18) senza compilazione; la pagina di prova usa Vite e Three.js.

```sh
npm run test:hellscape3d           # controllo dei tipi e test Node (logica, layout, scena)
npm run test:hellscape3d:browser   # build Vite e verifica in Chromium, desktop e mobile orizzontale
npm run dev:hellscape3d            # http://127.0.0.1:5173/corsa.html (scena di corsa) e / (vista città, sviluppo)
npm run record:hellscape3d -- --seed graybox-1 --steps 3 --actions 14   # GIF reale in artifacts/hellscape3d/ (richiede ffmpeg)
npm test                           # suite core completa, che comprende i test Node
```

La verifica nel browser ripete in entrambe le viewport (1440×900 e 844×390) solo i controlli il cui esito dipende dallo schermo: impaginazione, inquadrature, immagini. Quelli di sola logica (timer, salvataggi, regia della città, battute di Bafometto) girano una volta, a 1440×900. Le stanze di esempio della scena di corsa sono scelte in Node, una per tipo ciclico con tutte le pendenze, più partenza e uscita.

## Moduli (`src/logic/`)

| Modulo | Responsabilità |
| --- | --- |
| `rng.ts` | sfc32 con flussi nominati derivati dal seed (`map:N`, `dice`, `simulation:N`); lo stato è serializzabile |
| `config.ts` | configurazione del generatore, valori predefiniti, `GENERATOR_VERSION` |
| `generator.ts` | MapGenerator: rete deterministica da seed, tema e configurazione; tentativi e fallback |
| `validate.ts` | validazione strutturale e di bilanciamento, ricalcolata dalle sole celle |
| `balance.ts` | turni attesi esatti (programmazione dinamica sul grafo aciclico) |
| `engine.ts`, `state.ts` | GameState, azioni, eventi e macchina a stati del turno |
| `exploration.ts` | nebbia di guerra collettiva e vista pubblica per HUD e regia |
| `persistence.ts` | salvataggio nella chiave `hellscape3d-save`, ripresa e rifiuto dei salvataggi incompatibili |
| `simulate.ts` | simulazioni Monte Carlo sul motore reale |
| `themes/` | parte logica dei temi; per ora soltanto Megastrutture (distretti e caselle speciali) |

## Graybox (fase 2, primo passo)

| Modulo | Responsabilità |
| --- | --- |
| `layout/layout.ts` | CityBuilder spaziale: posizioni 3D delle caselle, verifica degli ingombri, masse edilizie |
| `scene/model.ts` | modello puro della scena visibile, ricavato dalla vista pubblica |
| `render/graybox.ts` | renderer Three.js: istanze per caselle, passerelle, piloni e masse; camera a tre quarti |
| `main.ts`, `index.html` | pagina di prova non pubblicata |

**Layout.** La rete viene scomposta in corridoi e bivi. Il percorso avanza sempre lungo X, con svolte di 90° verso ±Z e rampe di 1,5 unità; le caselle distano 4 unità. Dalla casella prima di un bivio partono i rami: il più breve procede diritto e diventa una passerella sopraelevata; gli altri escono di lato, procedono paralleli e rientrano, eventualmente a una quota più bassa. I rami sono percorsi su griglia: se lo scarto rispetto al ramo breve è dispari, l'ultimo passo è diagonale. Così nessuna casella cade a metà di un angolo, dove disterebbe dalla precedente solo 2,83 unità e le piastrelle si sovrapporrebbero.

Ogni disposizione viene verificata: distanza minima fra caselle, passerelle che non si toccano né attraversano caselle (salvo 3,5 unità di dislivello), lunghezza dei tratti e pendenza. Se 12 tentativi falliscono si usa la disposizione rettilinea, valida per costruzione e verificata comunque. Su 300 città di prova è servita una volta. Il layout usa i flussi pseudocasuali `layout:N` e `decor:masses`, separati da quelli della logica, e non modifica la mappa. Le masse edilizie restano ad almeno 4,5 unità dal percorso; dal lato della camera sono più basse del percorso, per non coprirlo.

**Nebbia di guerra nella scena.** Il renderer disegna solo il modello della scena, costruito dalla vista pubblica: caselle esplorate, passerelle fra caselle esplorate, masse entro 16 unità da esse e, per ogni tratto che prosegue nella nebbia, un moncone pari al 40% della passerella. La direzione del moncone è l'unico dato non pubblico usato, ed è visibile solo per quel 40%. Un test verifica che nessun identificativo di cella nascosta compaia nel modello in alcun momento della partita.

**Pagina di prova.** Senza parametri riprende la partita salvata; se non c'è, apre la schermata di avvio, che `?new=1` apre comunque. Parametri **solo per sviluppo e test**, che saltano la schermata: `?seed=…` e `?steps=N` (azioni automatiche iniziali), che avviano una partita nuova, `?view=overview` (panoramica delle zone esplorate) e `?reveal=all`, che mostra l'intera città **solo per lo sviluppo**, per giudicare il layout. Tasti: 1–4 risposte e alternative, Invio chiude l'esito della risposta e lancia il dado, Spazio o S saltano la regia, F accelera ×3, V cambia inquadratura, A esegue un'azione automatica (sviluppo). `?motion=reduced` attiva il movimento ridotto, `?timer=S` impone la durata della domanda al posto di quella della partita, `?bank=ID` sceglie la banca di domande di una partita avviata con `?seed=`, `?test=1` espone ai test la risposta corretta. Le azioni automatiche simulano le risposte con il profilo provvisorio.

## Pedine animate e regia (fase 2, secondo passo)

`director/director.ts` contiene il CameraDirector, puro e indipendente da Three.js. Riceve gli eventi prodotti dal motore e li trasforma in clip di presentazione. Lo stato è già deciso quando le clip vengono accodate: accelerare (F, ×3) o saltare la regia (S, oppure Spazio mentre è in corso) cambia solo ciò che si vede. A regia conclusa pedine, celle mostrate e giocatore attivo coincidono sempre con lo stato.

| Evento del motore | Presentazione |
| --- | --- |
| inizio turno di un altro giocatore | transizione verso la sua pedina (vedi sotto) |
| domanda | avvicinamento al personaggio, 0,6 s |
| dado | inquadratura di inseguimento, 0,4 s |
| avanzamento | camminata lungo le passerelle, 0,32 s per casella, con la camera che segue |
| bivio | inquadratura del bivio e delle sole alternative locali, 0,7 s |
| arrivo su casella speciale | breve pausa, 0,5 s |
| fine partita | inquadratura della porta d'uscita, 1,2 s |

Le transizioni fra giocatori dipendono dalla distanza calcolata sulla sola rete già mostrata. Fino a 4 passi è una traslazione (0,7 s). Fino a 12 passi nello stesso distretto la camera si allontana, trasla e si riavvicina (1,25 s). Negli altri casi, compresi i giocatori non collegati da zone esplorate, c'è una dissolvenza a nero: la camera cambia posizione solo a schermo oscurato (0,8 s), senza sorvolare la città. I tempi stanno negli intervalli indicativi della specifica e restano obiettivi di prototipazione.

Durante la camminata le celle compaiono quando la pedina le raggiunge con lo sguardo, nello stesso ordine del motore, e non al momento del lancio. Con `?motion=reduced`, o con la preferenza di sistema per il movimento ridotto, la regia è istantanea. La direzione di vista resta sempre la stessa: la camera cambia distanza e inclinazione, mai orientamento.

## Interfaccia provvisoria e radar (fase 2, terzo passo; radar dal 26 novembre)

`ui/` contiene un'interfaccia HTML/CSS sopra la scena, provvisoria. I pannelli compaiono solo a regia ferma, quindi mostrano sempre la presentazione e non lo stato anticipato del motore. Sono pulsanti reali, raggiungibili da tastiera, con il primo elemento già selezionato.

- **Turno:** numero del turno, giocatore attivo secondo la presentazione e elenco dei giocatori con i colori delle pedine.
- **Domanda:** presa dalle banche della versione precedente (vedi «Domande»), con difficoltà e argomento; risposta con clic o tasti 1–4, poi esito con spiegazione.
- **Timer** (`ui/timer.ts`): 45 secondi, il valore predefinito della versione precedente, ancora provvisorio. Scorre solo con la domanda visibile, a regia ferma e con la pagina in primo piano; alla scadenza la risposta vale come tempo scaduto. La domanda viene creata solo quando diventa visibile, quindi la regia non può consumarne il tempo.
- **Dado:** pulsante (o Invio) dopo la risposta corretta; il risultato resta visibile durante la camminata.
- **Bivio:** alternative ordinate dalla più breve alla più lunga, con lunghezza relativa e difficoltà (tasti 1–3). Gli stessi numeri compaiono nella scena sugli imbocchi dei rami, con il colore della difficoltà.
- **Fine partita:** nome di chi è uscito e pulsante per una nuova città.
- **Radar** (`ui/radar.ts`, specifica §3): sostituisce la minimappa e non disegna caselle né percorsi. Al centro c'è il giocatore di turno, contornato di chiaro; gli altri giocatori sono punti nella loro posizione relativa. Le distanze sono in linea d'aria sul piano orizzontale e l'orientamento è fisso, come la camera della vista a tre quarti. La portata è di 24 unità, cioè 6 caselle in linea d'aria, valore provvisorio. Chi è più lontano compare come tacca sul bordo nella propria direzione, chi è nella stessa casella si affianca al centro. L'uscita, un portale verde, compare solo quando entra nella portata. Su 200 città compare quando mancano in mediana 7 caselle di percorso, nel 90% dei casi al massimo 9, al massimo 16 dove un ramo passa vicino all'uscita. Il radar riceve solo le posizioni delle pedine e dell'uscita.

Su schermi bassi (mobile orizzontale) pannelli e radar si riducono. Il tasto A esegue un'azione automatica, solo per lo sviluppo.

## Ostacoli davanti alla camera (fase 2, quarto passo)

`scene/occlusion.ts` individua i volumi disegnati (caselle, piloni, passerelle, masse) attraversati dal segmento fra la camera e la pedina attiva, ai piedi o alla testa. Il renderer li sposta in istanze con materiale semitrasparente (opacità 0,18) e ricostruisce questa parte della scena solo quando l'insieme degli ostacoli cambia. Poiché si disegnano solo zone già mostrate, guardare attraverso un ostacolo non rivela nulla di inesplorato. Dimensioni dei volumi e posizione della camera stanno in `scene/dimensions.ts`, condiviso da renderer e calcolo.

Su 20 città, in oltre 14 000 fotogrammi di partita simulata, la pedina attiva risulta coperta nell'1,5% dei casi, sempre da elementi del percorso e mai da masse edilizie: la regola che le tiene basse dal lato della camera funziona. Il caso tipico è la passerella sopraelevata del ramo breve che passa davanti a una pedina sul ramo laterale più basso.

Quando un pannello occupa la parte bassa dello schermo, l'inquadratura si decentra (`setViewOffset`) in modo che il punto inquadrato resti al centro dell'area libera, senza spostare la camera né deformare l'immagine. Il passaggio è graduale, istantaneo con il movimento ridotto. `?occlusion=off` disattiva le trasparenze, solo per confronto.

## Bafometto provvisorio (fase 2, quinto passo)

`director/bafometto.ts` e il regista danno a Bafometto una presenza provvisoria, secondo la specifica (§6):

- **Sede:** una macchina monumentale in graybox su un pilone che sale dall'abisso, con occhi verdi che si accendono quando parla. Sta a distanza fissa dalla partenza (−46, −4, +8), dal lato −X dove il percorso non va mai. La posizione dipende solo dalla partenza, quindi non rivela uscita né topologia. Un test verifica su 80 città che resti lontana da percorso e masse.
- **Interventi significativi** (apertura di una partita nuova, fine partita): dissolvenza, inquadratura della sede, battuta, dissolvenza e ritorno al giocatore o all'uscita. Nessun tragitto della camera fra sede e giocatore e nessuna cella rivelata.
- **Scambi frequenti** (arrivo su una casella «Terminale di Bafometto»): manifestazione locale, senza passare dalla sede. Il terminale si illumina, la camera si avvicina e compare la battuta.
- **Battute:** testi segnaposto in un riquadro dichiarato «testo provvisorio», mostrati per 3,5 s anche con il movimento ridotto, che invece rende istantanee le inquadrature. Gli effetti di Bafometto sul gioco (Omen, crediti, salute) non sono ancora definiti dal regolamento.

`?intro=off` disattiva l'apertura.

## Ripresa della partita (fase 2, sesto passo)

`session.ts` decide all'avvio fra ripresa e partita nuova, usando il salvataggio della fase 1 (`logic/persistence.ts`, chiave `hellscape3d-save`):

- **Ripresa:** senza parametri la pagina riprende la partita salvata. Il mondo viene ricostruito da seme, configurazione e versione del generatore e confrontato con l'impronta salvata; lo stato è quello del motore. L'apertura di Bafometto non si ripete e compare l'avviso «Partita ripresa».
- **Schermata di avvio** (`ui/setup.ts`, provvisoria): si apre senza salvataggio, con `?new=1` e con «Nuova città» a fine partita. Si scelgono banca di domande, argomenti (tutti, per impostazione), da uno a sei giocatori con i nomi (un nome vuoto diventa «Dannato N») e durata della domanda, da 10 a 300 secondi. Non si comincia se gli argomenti scelti non hanno domande di tutti e tre i livelli. Il seme della città è casuale. Le scelte si salvano con la partita, nel registro delle domande, così una ripresa usa la stessa durata e gli stessi argomenti; le ultime usate (`hellscape3d-impostazioni`) precompilano la schermata successiva. Se esiste una partita salvata, la schermata propone di riprenderla.
- **Partita nuova:** «Inizia la partita» nella schermata di avvio; per sviluppo e test `?seed=` o `?steps=` la avviano subito. Sostituisce il salvataggio.
- **Quando si salva:** all'avvio di una partita nuova e dopo ogni azione, prima e indipendentemente dalla regia.
- **Salvataggio incompatibile** (versione, generatore o impronta diversi, dati non validi): non si perde. Viene copiato in `hellscape3d-save-scartato` e si apre la schermata di avvio con un avviso. I salvataggi del gioco pubblicato (`fool-v1`, `fool-settings-v1`) non vengono toccati. È il caso dei salvataggi fatti prima del bivio come punto di passaggio (formato 1, generatore 1.0.0): il formato attuale è il 2.
- **Timer della domanda:** il tempo residuo si salva ogni mezzo secondo e alla chiusura della pagina (`hellscape3d-domanda`), legato a partita, turno e giocatore. Ricaricare non restituisce tempo; una domanda già scaduta scade al primo fotogramma.
- **Senza `localStorage`:** la partita funziona, con l'avviso che non potrà essere ripresa.

Lo script di registrazione accetta `--reload-after N` per ricaricare la pagina dopo N azioni e registrare la ripresa.

## Kit modulare (fase 3, primo passo)

`kit/kit.ts` trasforma il modello della scena in primitive (parallelepipedi e cilindri) raggruppate per elemento, secondo il kit minimo della specifica (§5). È puro e indipendente da Three.js; il renderer le disegna con istanze, tre materiali neutri (calcestruzzo, metallo, scuro) e le rende trasparenti per intero quando il loro elemento nasconde la pedina.

| Elemento | Moduli |
| --- | --- |
| Casella | lastra, piastra di calpestio, travi incrociate, ringhiera sul perimetro; lampioni agli spigoli di partenza e uscita |
| Pilone | capitello, fusto, anelli di controvento ogni 7 unità |
| Passerella | piano di calpestio, cordoli, montanti e corrimano, condotto sotto il piano |
| Massa edilizia | corpo, marcapiani ogni 3,5 unità, costoloni agli spigoli, macchinari e serbatoi sul tetto, tubazione in facciata (solo nei 32 m alti: più in basso c'è la nebbia) |

**Agganci.** Ogni passerella si aggancia al bordo della piattaforma nel punto in cui la sua direzione esce dal quadrato della casella. La ringhiera corre sul perimetro e si interrompe solo entro 0,9 unità da quei punti. In piano il piano di calpestio va da aggancio ad aggancio. In pendenza sale da centro a centro, come una rampa che entra sulle piattaforme, e cordoli e corrimano seguono la stessa inclinazione. Così il dislivello di 1,5 unità non si concentra nel tratto libero fra i bordi: lì avrebbe prodotto scalette quasi verticali.

**Stabilità.** Le varianti dipendono dal seme e dall'identità di ogni elemento, non da quante celle sono visibili, quindi un elemento non cambia aspetto esplorando. I monconi verso la nebbia aprono la ringhiera come farebbe la passerella completa. L'unica eccezione è voluta: dove arriva un ramo ancora nascosto la ringhiera resta chiusa, altrimenti l'apertura rivelerebbe il ramo, e si apre quando il ramo viene esplorato. La città intera di `graybox-1` conta circa 1 700 primitive, assemblate in pochi millisecondi.

**Non ancora:** sagome lontane (con la nebbia attuale non sarebbero visibili), palette, materiali e texture, illuminazione, macchinari animati. Sono decisioni di direzione artistica.

## Scena di corsa e stanze (specifica §6, passo 3)

`corsa.html` è la partita con la scena di corsa, cioè la schermata di gioco prevista dalla specifica. `index.html` mostra la stessa partita nella vista della città a tre quarti, che resta uno strumento di sviluppo. Le due pagine condividono motore, domande, timer, salvataggio e interfaccia (`main.ts`) e differiscono solo per la vista (`views/runView.ts`, `views/cityView.ts`): nessuna delle due modifica lo stato.

- **Stanze** (`run/rooms.ts`). Ogni casella è una stanza con un tipo (corridoio, sala, ponte sul vuoto, pozzo), una grandezza e una pendenza (salita, piano, discesa). Il tipo è estratto con pesi provvisori per distretto, da un flusso decorativo del seme. La pendenza viene dalla quota della casella successiva nella città generata. Partenza e uscita hanno stanze proprie, provvisorie in attesa di quelle disegnate. La stanza del bivio è una stanza di passaggio, non una casella, con una porta per ramo.
- **Geometria** (`run/strip.ts`). Usa i pezzi e le tinte neutre del kit, in scala da megastruttura: pareti, pilastri colossali, torri e pozzi che scendono fino a −160 e si perdono nella nebbia. Le stanze ripetute sono strisce periodiche di 48 unità; in pendenza restano periodiche, con le strutture verticali sempre verticali. Bivio e uscita hanno una parete di fondo con le porte: stipiti chiari al bivio, varco luminoso all'uscita.
- **Regia** (`run/runDirector.ts`):
  - risposta errata: si continua a correre nella stessa stanza;
  - dado: il personaggio accelera ed esce dalla stanza, e la stanza d'arrivo resta nascosta;
  - bivio attraversato: stanza del bivio con camera posteriore, arresto davanti alle porte, scelta con i numeri sulle porte (a metà del vano; se un numero cadrebbe su dado, turno, radar o pannello, si sposta del minimo necessario), ingresso nella porta scelta;
  - casella speciale all'arrivo: stanza d'arrivo e risoluzione, con la battuta di Bafometto per il terminale;
  - uscita: avvicinamento al varco e fine della partita;
  - turno successivo: cambio di stanza con dissolvenza, ma nessun cambio se il giocatore di turno è nella stanza già mostrata;
  - movimento ridotto: stanza ferma e cambi per stacco.
- **Inquadratura** (`run/camera.ts`): scelta quando la stanza viene generata, in base a tipo e grandezza. Angolazione, inclinazione, distanza e campo visivo sono estratti dal seme entro intervalli per tipo, provvisori:
  - corridoio di profilo e vicino alla parete;
  - sala larga e a tre quarti;
  - ponte dall'alto, per il vuoto;
  - pozzo dal basso o dall'alto;
  - bivio alle spalle, verso le porte.

  La pendenza non decide l'inquadratura. Il personaggio non scende sotto il 5% dell'altezza dell'immagine, valore provvisorio. Con la domanda aperta la camera si avvicina e la corsa rallenta. La camera resta dal lato +Z del percorso e i cambi sono morbidi (0,5 s).
- **Etichette del bivio** (tutte le viste): «Scorciatoia pericolosa», «Via incerta» (provvisoria), «Strada sicura», senza lunghezze né difficoltà esplicite.
- **Parametri solo di sviluppo** in `corsa.html`:
  - `?camera=laterale|angolata|trequarti|spalle` fissa l'inquadratura, per confronto;
  - `?anteprima=ID` o `bivio:ID` mostra una stanza;
  - `?t=S` fissa l'istante, per i test.

Verifiche: test Node su stanze, geometria, inquadrature (per tipo, dal lato del percorso, altezza minima) e regia (stanza d'arrivo mai mostrata senza evento, nessuna dissolvenza se la stanza non cambia, movimento ridotto, salto equivalente). Nel browser, desktop e mobile:
- per ogni tipo di stanza incontrato l'immagine si ripete identica dopo un periodo ed è diversa a metà;
- in una partita giocata, a regia ferma la scena è sempre nella stanza del giocatore di turno, oppure nella stanza del bivio con le porte segnalate;
- con il movimento ridotto la stanza resta ferma.

**Non ancora:** stanze di partenza e d'uscita disegnate, varietà e regole di generazione definitive delle stanze, distanze e altezza minima tarate su dispositivi reali, modelli e animazioni dei personaggi, direzione artistica.

## Domande (banche della versione precedente)

Le domande vengono dalle banche del sito, le stesse della versione precedente: il catalogo `datasets.json` e i file `dataset/*.json` alla radice del repository, oggi Termologia e Introduzione alla fisica e alla misura, 100 domande ciascuna. La build di Vite le include come testo, una banca per blocco, caricato solo quando serve. Nessun file delle banche viene modificato.

- **Lettura** (`questions/bank.ts`): stesse regole di `assets/js/datasets.js`, comprese quattro alternative distinte, lettera A–D, tre difficoltà presenti e ID non ripetuti. Un test carica il vecchio lettore e verifica che i due producano la stessa banca. Unica differenza: le formule LaTeX non sono ancora rese dal prototipo 3D, quindi una banca che le contiene viene rifiutata con un messaggio. Le banche attuali non ne contengono.
- **Scelta** (`questions/deck.ts`, provvisoria): la difficoltà è quella decisa dal motore, cioè dal ramo. Fra le domande di quel livello se ne sceglie a caso, con un flusso derivato dal seme, una non ancora uscita nella partita; esaurite quelle, la meno recente. Le alternative vengono rimescolate, come nella versione precedente. Sono in gioco gli argomenti scelti nella schermata di avvio; se a quelli mancasse un livello, cosa che la schermata impedisce, si attinge all'intera banca.
- **Esito:** dopo la risposta compaiono esito, risposta data, risposta corretta e spiegazione. Il motore riceve l'esito con «Continua» (Invio), quindi il turno non passa prima che si sia letta la soluzione.
- **Registro** (`hellscape3d-domande`): per ogni momento di domanda (turno e giocatore) registra la domanda assegnata, l'ordine delle alternative e la risposta, con banca, argomenti, durata della domanda e seme della partita. Si salva a ogni cambiamento. Un ricaricamento ripropone la stessa domanda, o il suo esito se si era già risposto, e non permette una seconda risposta. Una partita nuova apre un registro nuovo; una ripresa usa la banca con cui la partita era cominciata. Un registro del formato precedente, senza argomenti né durata, non viene riletto: la partita ripresa prosegue con un registro nuovo, tutti gli argomenti e la durata predefinita.
- **Banca:** scelta nella schermata di avvio; con `?seed=` (sviluppo) `?bank=ID`, altrimenti la prima del catalogo.

**Non ancora:** rendering delle formule (KaTeX nella versione precedente); riepilogo delle domande a fine partita. La durata del timer resta da fissare nel regolamento.

## Caricamento per settori (§8)

`scene/sectors.ts` divide il piano in settori di 16 unità. La scena grafica contiene solo gli elementi dei settori caricati, attorno al punto inquadrato e a ogni pedina, che è una possibile destinazione di un cambio di turno. Il kit si costruisce sull'intera vista presentata e poi si filtra, quindi un elemento ricaricato riappare identico. Scaricare toglie solo la grafica: mappa, stato, esplorazione, salvataggio e radar non leggono i settori. Le pedine non vengono mai scaricate. I settori si aggiornano prima di ogni disegno, quindi nessun fotogramma mostra un settore mancante, nemmeno alla fine di una dissolvenza. Con l'isteresi un settore entra entro il raggio e si scarica solo oltre il raggio più 16 unità.

**Raggio calcolato, non scelto a mano.** Per il punto inquadrato il raggio è la massima distanza orizzontale dei volumi che possono comparire nell'immagine o proiettarvi un'ombra. Sono il tronco di piramide della camera, fino alla profondità in cui la nebbia copre tutto, e la camera d'ombra del sole, entrambi tagliati alla fascia di quote della città. Per le pedine vale il raggio della più ampia delle inquadrature ordinarie. Ottica, nebbia e ombra vengono da `scene/dimensions.ts`, la stessa fonte del renderer. I test confrontano il calcolo con i volumi di three.js e verificano, fotogramma per fotogramma, che il solo fuoco della camera tenga caricato tutto ciò che può comparire.

**Effetto attuale: nessuno scaricamento.** Con la nebbia attuale il raggio va da circa 80 unità (bivio) a 150 (sede di Bafometto), mentre la diagonale delle caselle di una città non supera 115 unità (40 semi). Nei test resta caricato il 100% dei settori occupati. Il meccanismo diventerà efficace da solo quando la nebbia sarà più corta o le città più grandi: la distanza della nebbia è una scelta di atmosfera, rinviata con le altre decisioni artistiche. Per verificarlo oggi, `?sectors=R` (solo sviluppo) forza un raggio più corto, e allora si vedono comparire i settori. `?sectors=off` carica sempre la città intera, per confronto.

Verifiche nel browser: con il raggio calcolato l'immagine del canvas coincide pixel per pixel con quella della città intera. Con `sectors=4` una partita avanzata scarica davvero parte della città, ma esplorazione, posizioni, turno e radar restano identici a quelli della stessa partita senza settori, e le caselle delle pedine restano sempre disegnate. Ogni cambio dei settori caricati ricostruisce l'intera scena statica: in quella prova circa 44 ricostruzioni in 24 azioni, la più lenta sotto 7 ms in WebGL software. Per le dimensioni attuali basta. Se una città più grande lo rendesse lento, si passerà a gruppi separati per settore.

## Rete generata

Sequenza di corridoi e bivi; i rami di ogni bivio (2 o 3) si ricongiungono all'inizio del corridoio successivo. Il bivio non è una casella (specifica §3): l'ultima casella di un corridoio ha come successive le prime caselle dei rami, e le alternative (`options`) sono indicizzate da quella casella. Il generatore è alla versione 2.0.0; le mappe della 1.0.0, in cui il bivio era una casella, non sono più riproducibili. La rete è aciclica, ogni cella è raggiungibile dalla partenza e raggiunge l'uscita. Il ramo più corto ha domande difficili, il più lungo facili, l'eventuale intermedio medie. La lunghezza relativa si basa sulla minima distanza residua verso l'uscita dopo la scelta, come indicato dalla specifica. Le lunghezze di due rami dello stesso bivio differiscono di almeno due caselle.

Gli identificativi delle celle sono opachi e assegnati da una permutazione casuale: non rivelano l'ordine di costruzione né le distanze. L'uscita è nel distretto «Sommità», gli altri distretti si distribuiscono in base al seed. A parità di seed, tema, configurazione e versione del generatore la mappa è identica; l'impronta (`fingerprint`) lo verifica.

Se nessuno dei tentativi (6 per impostazione predefinita) supera la validazione completa, si usa una disposizione prudente che deve almeno superare quella strutturale; altrimenti viene sollevato un errore invece di avviare una partita difettosa. Su 1000 seed di prova non è mai servito il fallback.

### Bilanciamento

Per ogni bivio si calcolano i turni attesi dalla partenza imponendo ciascun ramo, con scelta ottimale agli altri bivi. Lo scarto fra le alternative non deve superare 0,6 turni. Il generatore sceglie le lunghezze costruendo la rete all'indietro dall'uscita, così che il valore a valle sia già noto.

Il bivio si attraversa soltanto avanzando, a dado già lanciato: il calcolo assume che il giocatore scelga il ramo conoscendo i passi residui. Il valore di un ramo si misura da un tratto virtuale a monte, perché chi entra nel ramo porta con sé i passi residui del dado: è ciò che rende competitivi i rami difficili.

Misure con la regola attuale (bivio come punto di passaggio): su 1000 semi lo scarto massimo fra i rami di un bivio è 0,51 turni attesi e il fallback non è mai servito. Su 40 mappe, con 4000 partite simulate per strategia, «sempre il più breve», «sempre il più lungo» e «casuale» differiscono in mediana del 2,8% di turni medi e al massimo del 7,1%. La strategia migliore cambia da una mappa all'altra: su 40 mappe, con 1000 partite, 21 volte «sempre il più lungo», 16 «sempre il più breve», 3 «casuale». Con la regola precedente, in cui il bivio era una casella, gli stessi valori erano 2% e 6%. Il massimo è più alto perché una strategia fissa somma gli scarti di 2–3 bivi. Stringere la soglia di selezione (0,3 o 0,2 turni) non dà differenze distinguibili dal rumore statistico. Le soglie restano quindi invariate in attesa dei profili di bilanciamento definitivi (§10).

Il calcolo dipende dal profilo ipotetico di risposta corretta (facile 0,85, media 0,65, difficile 0,45) e ignora gli effetti delle caselle speciali, non ancora definiti. Andrà ripetuto quando profili ed effetti saranno decisi.

## Turno e segretezza

Fasi: `question` → (`roll` se la risposta è corretta) → movimento → arrivo → turno successivo. Un bivio attraversato sospende il movimento (`fork`) fino alla scelta del ramo, senza domanda; il bivio non conta come passo e poi si consumano i passi residui. Il motore è l'unica autorità: `applyAction` non modifica lo stato ricevuto, rifiuta le azioni fuori fase (niente doppie risoluzioni) e il dado dipende solo dallo stato del suo flusso, non dalle animazioni.

`publicView` contiene soltanto celle esplorate, archi fra celle esplorate, l'indicazione che un percorso prosegue nella nebbia e, al bivio, lunghezza relativa e difficoltà delle alternative. Non contiene distanze, seed, impronta, configurazione né stato del dado. L'esplorazione è collettiva: ogni casella attraversata rivela le due successive, quindi le alternative di un bivio sono sempre visibili quando lo si raggiunge. Come previsto dalla specifica, non c'è protezione contro chi ispeziona il browser.

## Regole provvisorie da approvare

La specifica (§3, §10) lascia aperte queste decisioni. Le scelte seguenti servono solo a rendere il modello eseguibile e sono isolate nel motore e nella configurazione:

1. La difficoltà della domanda è quella della casella su cui inizia il turno. Il bivio segue la specifica (§3): si attraversa soltanto avanzando, si sceglie il ramo senza domanda, non conta come passo e nessun avanzamento vi termina.
2. Risposta errata o tempo scaduto: nessun movimento.
3. Dado a sei facce; i passi oltre l'uscita si perdono; vince il primo che esce e la partita termina.
4. Caselle speciali di Megastrutture: «Terminale di Bafometto» ed «Evento industriale». Producono l'evento d'arrivo, ma senza effetti finché salute, crediti e Omen non saranno formalizzati.
5. Dimensioni della gara: 2–3 bivi, corridoi di 2–4 caselle, ramo lungo di 7–12, percorso più breve fra 15 e 35 passi, più lungo fino a 50 (su 1000 seed). Un giocatore solitario impiega in media 10–20 turni per uscire (simulazioni con le tre strategie su 40 mappe).
6. Da 1 a 6 giocatori (la simulazione usa il giocatore singolo; il prototipo almeno due).

## Non ancora realizzato

Budget misurabili di memoria, tempi e frame rate (§8): da fissare con misure su dispositivi reali, perché il rendering WebGL software della CI non è rappresentativo. Nelle fasi successive: direzione artistica, personaggi, Bafometto e durata definitiva del timer. Il motore riceve solo l'esito della risposta.
