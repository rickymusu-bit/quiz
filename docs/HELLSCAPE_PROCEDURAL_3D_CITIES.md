# Hellscape — città procedurali 3D e regia di gioco

**Data:** 2026-11-25, aggiornata il 2026-11-26  
**Stato:** specifica di redesign approvata nella conversazione del 25 novembre 2026; la revisione del 26 novembre (rappresentazione in corsa, minimappa, bivi) è approvata nella conversazione del 26 novembre 2026 e proposta per integrazione documentale.  
**Ambito:** nuovo gioco da tavolo digitale a turni su schermo condiviso; nessuna modifica al runtime pubblicato né al prototipo in questa PR.

## 1. Obiettivo e precedenza

La gara consiste nell'uscire da una città infernale controllata da Bafometto biomeccanico. Il mondo è tridimensionale, stilizzato e generato proceduralmente per ogni nuova partita. Il gioco non è un open world: i personaggi si spostano lungo percorsi discreti. Nessuno conosce il percorso né quanto manca alla fine: la schermata mostra un giocatore alla volta, sempre in corsa nel tratto di città in cui si trova (§6), e la minimappa soltanto le caselle già percorse (§3).

Questa specifica aggiorna per il redesign le indicazioni relative al runner, alla sequenza obbligatoria dei sei quartieri e alla rappresentazione grafica 2D/2.5D. Il runtime pubblicato, i salvataggi e gli asset storici non vengono modificati da questa PR. Le specifiche precedenti rimangono valide per gli aspetti non in conflitto; eventuali incompatibilità di regolamento non trattate qui devono essere risolte prima dell'implementazione. Riferimenti: [direzione cinematica precedente](HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.2.0_20261031.md), [regole di progetto precedenti](HELLSCAPE_PROJECT_RULES_v1.0.1_20261031.md), [README del runtime](../README.md).

## 2. Una città per partita

Il motore deve supportare più città, ciascuna con una propria identità estetica. Ogni gara si svolge interamente in una sola città. La scelta può avvenire prima della partita o mediante estrazione casuale; la modalità precisa può essere stabilita quando saranno disponibili più città.

Il solo tema da implementare nella prima fase è **Megastrutture**. Non è richiesto sviluppare le altre città, né mescolarne gli stili. Un tema definisce asset, palette, materiali, regole di assemblaggio, decorazioni, effetti atmosferici e audio, ed eventuali varianti locali di gameplay. Le regole comuni non devono essere duplicate per ogni città.

## 3. Generazione della mappa e segretezza

- Generare un seed casuale a ogni nuova partita e una mappa deterministica a partire da seed, tema e configurazione. Lo stesso insieme di input e versione del generatore deve riprodurre la stessa mappa.
- Generare per prima la rete logica: partenza, caselle, archi, bivi, distretti, eventi, uscita e punti di interazione pertinenti. Tutti i percorsi proposti devono consentire la fuga; evitare vicoli ciechi involontari, cicli che impediscono la progressione e lunghezze eccessive.
- A ogni bivio le alternative si presentano con etichette generiche e tematiche, per esempio «scorciatoia pericolosa» e «strada sicura», non con lunghezze o difficoltà esplicite. L'etichetta corrisponde alla posizione del ramo nell'ordine delle lunghezze **relative** verso l'uscita (più breve, intermedio se pertinente, più lungo), che resta legata alla difficoltà delle domande. Il confronto si riferisce al cammino residuo verso l'uscita, non soltanto al prossimo incrocio. In caso di successive diramazioni, usare un criterio coerente e dichiarato internamente, per esempio la minima distanza residua raggiungibile dopo aver scelto il ramo; non promettere una lunghezza esatta del percorso effettivamente seguito. Le etichette appartengono al tema della città; quella del ramo intermedio è da definire.
- I percorsi più brevi comportano domande più difficili; quelli più lunghi domande più facili. Verificare mediante simulazioni che le alternative siano plausibilmente competitive, tenendo conto di probabilità di risposta corretta, dado ed eventi. Le soglie numeriche e i profili di bilanciamento non sono ancora fissati.
- Non esporre numero di caselle residue, distanza esatta, posizione dell'uscita, né eventi futuri. Si vede soltanto la casella in cui si trova il giocatore mostrato; al bivio, l'imbocco dei rami, non il loro seguito.
- **Minimappa.** Mostra soltanto le caselle già percorse da almeno un giocatore e i tratti fra caselle consecutive percorse, senza caselle viste in anticipo né tratti verso l'ignoto. Indica la posizione di tutti i giocatori e quello attivo. Un bivio percorso compare come punto di diramazione, distinto dalle caselle, con i soli rami già imboccati. L'uscita è un nodo con un'icona propria, staccato dal grafo e in posizione simbolica fissa (per esempio sul bordo): la sua collocazione non deve suggerire direzione o distanza. Diventa una casella del grafo solo quando qualcuno la raggiunge.
- **Indizi dell'uscita.** L'avvicinamento all'uscita si avverte da segni ambientali nella scena di corsa: luce naturale, uccelli in volo, vegetazione. L'intensità dipende dalla minima distanza residua dalla casella corrente, per soglie grossolane (indicativamente: nessun indizio, poi luce, poi uccelli e vegetazione nelle ultime caselle) e non in modo continuo, così che non si possano contare le caselle. Prima della scelta a un bivio gli indizi non distinguono i rami. Valori delle soglie e aspetto degli indizi sono da definire con il bilanciamento e la direzione artistica.
- La nebbia di guerra è uno stato esplicito, non soltanto un effetto estetico. Scena di corsa, transizioni, HUD, minimappa e inquadrature speciali devono rispettarla.
- La logica interna conserva le distanze esatte necessarie al generatore; non esporle nell'interfaccia. Non si promette segretezza anti-manomissione rispetto agli strumenti di sviluppo di un browser locale.

### Turno e stato di gioco

Il giocatore attivo risponde a una domanda; se corretta, lancia il dado e avanza di conseguenza. Gli effetti ordinari delle caselle si applicano esclusivamente alla casella di arrivo, non a quelle attraversate. Il cambio di inquadratura non cambia lo stato di gioco.

**Bivi.** Il bivio non è una casella: è un punto di passaggio fra l'ultima casella prima della diramazione e la prima casella di ciascun ramo. Lo si attraversa soltanto avanzando, cioè dopo una risposta corretta e il lancio del dado. Chi lo raggiunge si ferma, sceglie la strada senza alcuna domanda e prosegue sul ramo scelto con i passi residui, fino alla casella indicata dal dado. Il bivio non conta come passo e nessun avanzamento può terminarvi: con il dado 4 e il bivio dopo 2 passi si arriva alla seconda casella del ramo. Chi termina l'avanzamento sull'ultima casella prima del bivio sceglierà durante l'avanzamento successivo. La difficoltà della domanda è sempre quella della casella in cui si trova il giocatore. La partita non comincia su un bivio.

Conservare la direzione di progetto già discussa per crediti, salute, Omen e Bafometto; non ridefinirne in questo documento prezzi, valori numerici o condizioni di vittoria e recupero non ancora formalizzate. Il nuovo modello non deve essere confuso con il punteggio e il runner attualmente pubblicati.

## 4. Pipeline di generazione grafica

Il grafo logico è la fonte di verità per la giocabilità. La rappresentazione visiva viene derivata da esso senza modificare inavvertitamente la topologia.

1. **Grafo e validazione:** genera la rete e verifica raggiungibilità, lunghezze relative, difficoltà e coerenza del tema.
2. **Layout spaziale:** colloca nodi e archi in tre dimensioni; traduce i tratti in strade sospese, corridoi, passerelle, rampe o piattaforme e i nodi importanti in piazze, hub o camere industriali. Dislivelli e attraversamenti a quote diverse non costituiscono automaticamente incroci logici.
3. **Volumi:** costruisce masse edilizie, pareti, piloni, abissi, livelli sovrapposti e collegamenti. Riserva corridoi per i personaggi, spazio per la camera e ingombri coerenti.
4. **Assemblaggio:** combina moduli 3D secondo vincoli di dimensione, orientamento, punti di aggancio, materiali e compatibilità. Verifica che le passerelle abbiano sostegni, le tubazioni si colleghino, gli accessi siano praticabili e la scenografia non ostruisca il percorso.
5. **Atmosfera:** applica palette, luci, nebbia, fumo, particelle, suoni, materiali, macchinari animati e decorazioni.

Se il layout non è realizzabile, tentare una nuova disposizione deterministica o rigenerare la mappa entro un limite; prevedere un fallback valido anziché avviare una partita difettosa. Il mondo non è voxel e non è modificabile liberamente dai giocatori. L'architettura è scenografia giocabile costruita attorno alla rete.

## 5. Città Megastrutture

### Direzione artistica

Metropoli infernale verticale, monumentale e oppressiva. Brutalismo industriale e gotico-industriale, strutture fuori scala rispetto ai personaggi, grandi blocchi abitativi e industriali, torri, piloni, ponti sopra abissi, piattaforme, ascensori, tubazioni, turbine e cavi. L'intera città deve sembrare una macchina urbana dannata, non un castello fantasy tradizionale. Grafica stilizzata, non fotorealistica. Componenti biomeccaniche coerenti con Bafometto; evitare una mescolanza casuale di stili.

Distretti interni proposti, non città separate e non necessariamente in sequenza fissa:

| Distretto | Carattere visivo |
| --- | --- |
| Basi di fondazione | Piloni enormi, camere di sostegno, turbine, vibrazioni |
| Ponti sospesi | Passerelle, vuoti verticali, collegamenti e vertigine |
| Fasce abitative-industriali | Blocchi ripetuti, facciate, cortili e condotte |
| Zona dei motori | Macchinari giganteschi, pistoni, calore ed energia |
| Sommità / area di uscita | Architettura monumentale, livelli elevati; la porta conduce fuori dalla città |

La posizione dei distretti e dei percorsi varia con il seed; l'uscita è ai confini della città, non necessariamente alla quota massima. I distretti sono varianti di uno stesso tema, non cinque pacchetti estetici indipendenti. L'atmosfera comprende foschia, bagliori caldi, luci industriali fredde, fumo, scintille, rumori e macchinari lontani.

### Kit modulare

Kit minimo: piattaforma/pavimento, parete/facciata, pilastro, ponte/passerella, rampa o scala, ringhiera, tubo/condotto, macchina industriale, sagoma scenografica lontana. Estensioni: tetti, torri, archi di sostegno, portoni, gabbie ascensore, grate, turbine, monitor, cavi, detriti e componenti biomeccaniche.

Generare geometricamente volumi e strutture semplici; usare materiali procedurali o texture prodotte e verificate appositamente; riservare modelli dedicati a personaggi, Bafometto e macchinari complessi. Variare proporzioni, altezza, combinazioni e materiali entro regole coerenti. Le texture e gli asset devono avere provenienza e licenze documentate. I personaggi complessi richiedono rigging e animazioni; non si presuppone che un generatore di immagini produca direttamente modelli 3D utilizzabili.

## 6. Personaggi, scena di corsa e regia

I personaggi sono modelli 3D animati, non pedine statiche; corrono, reagiscono agli eventi e manifestano lo stato di salute. I giocatori sono in gara fra loro, quindi chi si trova in un tratto di percorso è mostrato in corsa.

### Scena di corsa

- **Un giocatore alla volta.** La schermata mostra il giocatore attivo che corre sul posto mentre lo scenario della sua casella gli scorre intorno. Gli altri giocatori compaiono solo se si trovano nella stessa casella: allora corrono insieme. Il giocatore attivo è identificabile mediante HUD e segnale visivo coerente.
- **Una casella, un ciclo.** Ogni casella ha un tratto di scenario proprio, costruito proceduralmente dal tema, dal distretto e dal seme con il kit modulare. Il tratto scorre senza interruzioni e si ripete identico dopo un periodo, in modo che la ripetizione non mostri giunture. Lo scenario deriva soltanto dalla casella corrente e non anticipa nulla del seguito, salvo gli indizi dell'uscita (§3).
- **Avanzamento.** La corsa accelera e a ogni casella attraversata lo scenario passa al tratto della casella successiva, con un passaggio breve e continuo. All'arrivo si torna alla corsa ordinaria.
- **Risposta errata o tempo scaduto.** Il giocatore continua a correre nello stesso tratto: è in gara, ma non guadagna terreno.
- **Bivio.** Durante l'avanzamento la corsa si interrompe davanti alla diramazione. La scena mostra l'imbocco dei rami, due o tre passaggi, con le etichette generiche (§3) e nessuna informazione sul seguito. Dopo la scelta il giocatore riprende a correre sul ramo scelto con i passi residui. Nessuno resta fermo su un bivio fra un turno e l'altro.
- **Leggibilità.** Durante la domanda lo scorrimento è lento o attenuato e il pannello ha uno sfondo pieno. Con il movimento ridotto lo scenario non scorre: si mostra un'immagine ferma del tratto e i cambi di casella avvengono per stacco.

| Fase | Rappresentazione |
| --- | --- |
| Inizio turno | Stacco sulla scena di corsa del giocatore attivo, indicazione del turno |
| Domanda | Corsa rallentata, domanda sovrapposta in HTML/CSS |
| Dado | Animazione dedicata, esito leggibile |
| Avanzamento | Corsa accelerata, cambio di scenario a ogni casella |
| Bivio | Durante l'avanzamento: corsa interrotta davanti agli imbocchi, scelta fra etichette generiche, ripresa sul ramo scelto |
| Arrivo/evento | Inquadratura contestuale nella scena della casella, risoluzione dell'evento |
| Fine turno | Transizione alla scena del giocatore successivo |

Il timer della domanda non deve consumare tempo mentre la regia ne impedisce la lettura o l'interazione. Animazioni accelerabili o saltabili senza cambiare gli esiti.

### Transizioni fra giocatori

Il passaggio da un giocatore all'altro è un cambio di scena breve: dissolvenza, oscurità, fumo o interferenza, indicativamente 0,5–1 s. Se il giocatore successivo è nella stessa casella non serve cambiare scena. La transizione non sorvola la città e non mostra percorsi. I tempi sono obiettivi di prototipazione, non valori immutabili.

Bafometto può avere una sede fisica, una sala monumentale o una macchina centrale, e manifestarsi attraverso terminali, monitor o apparizioni locali nella scena di corsa. La regia passa alla sua sede per gli interventi significativi e ritorna al giocatore interessato; gli scambi frequenti, come l'acquisto di Omen, privilegiano una manifestazione locale. La sua posizione scenografica non deve essere usata per rivelare l'uscita o la topologia nascosta.

Il CameraDirector riceve eventi dal motore e gestisce scene, transizioni, interruzioni e salti. Non assegna ricompense, non consuma turni e non determina gli esiti di dado o domanda. Il motore resta l'autorità sullo stato.

## 7. Architettura tecnica proposta

La distribuzione resta un sito web statico, utilizzabile in partita locale a schermo condiviso. Non è richiesto un server per la generazione del mondo. Il runtime attuale non dipende da un renderer 3D: la transizione va sviluppata in modo incrementale, non sostituendo indiscriminatamente il progetto.

- **MapGenerator:** seed, grafo, difficoltà, vincoli, validazione; testabile senza browser.
- **CityTheme:** catalogo moduli, materiali, palette, regole di assemblaggio, atmosfera e varianti. Primo tema: MegastructuresCityTheme.
- **CityBuilder:** scenario ciclico di ogni casella, assemblaggio, validazione geometrica e caricamento della scena.
- **CameraDirector:** scene di corsa, regia e transizioni indipendenti dalla logica.
- **GameState:** posizioni, turno, eventi, inventario, salute, crediti, aree esplorate e dati di ripresa.

Stack proposto: Three.js/WebGL per rendering 3D, TypeScript e Vite per il nuovo codice, HTML/CSS per HUD, menu e domande, Blender e glTF/GLB per modelli complessi. Nessun motore fisico completo necessario: i movimenti lungo gli archi possono essere controllati da interpolazione e animazione. Queste sono scelte approvate come direzione, da verificare nel prototipo e non dipendenze già introdotte.

Separare le sequenze casuali della logica da quelle puramente decorative; non permettere che modifiche grafiche alterino dadi o mappa. Persistenza: conservare seed, tema, versione del generatore e stato sufficiente a riprodurre la partita anche dopo ricaricamento; gestire esplicitamente la compatibilità delle versioni del generatore e dei salvataggi. I vecchi salvataggi del runner non vanno sovrascritti o interpretati automaticamente come partite del nuovo modello.

## 8. Prestazioni e accessibilità

La mappa logica viene generata integralmente all'avvio. La scena grafica contiene il tratto della casella corrente e, durante avanzamenti e transizioni, quello di destinazione; gli altri possono essere scaricati senza perdere stato logico. Preparare il tratto di destinazione prima di terminare una dissolvenza o un cambio di casella; evitare schermate vuote, scatti e indiscrezioni visive.

Usare istanze per elementi ripetuti, livelli di dettaglio, riutilizzo di materiali e geometrie, culling e budget di luci/ombre/particelle. Prevedere qualità adattabile, visuale leggibile su desktop e mobile in orizzontale, HUD accessibile e movimento ridotto. Stabilire budget misurabili di memoria, tempi e frame rate dopo la misura del prototipo, senza promettere prestazioni non verificate.

## 9. Primo prototipo (vertical slice)

Realizzare esclusivamente Megastrutture:
- un kit modulare minimo e un generatore di grafo e layout;
- area iniziale, uscita, almeno un bivio con alternative di difficoltà e lunghezza relativa diversa, due o tre tipi di nodo speciale;
- un modello giocatore provvisorio con ciclo di corsa, con almeno due istanze giocabili per provare cambi turno e giocatori nella stessa casella;
- la scena di corsa con scenario ciclico per casella, cambio di scenario durante l'avanzamento e indizi dell'uscita provvisori;
- una scena/interfaccia provvisoria di Bafometto;
- domanda, dado, avanzamento, scelta al bivio, arrivo, cambio turno, nebbia di guerra e minimappa delle caselle percorse;
- ripresa della partita con lo stesso mondo.

Fasi suggerite: (1) modello logico e test; (2) graybox 3D modulare con camera; (3) kit e direzione artistica; (4) personaggi, Bafometto, atmosfera e ottimizzazione. Non sviluppare altre città prima di convalidare il primo tema. Non avviare un rifacimento totale del runtime in questa PR.

### Criteri di accettazione per la successiva implementazione

- Seed uguale, tema/configurazione/versione uguali: stessa mappa; seed diversi producono varietà effettiva. Test su una pluralità di seed, includendo casi limite e fallback.
- Tutti i rami offerti sono raggiungibili e coerenti con la lunghezza relativa e la difficoltà; nessuna geometria impedisce il movimento. Le alternative non sono manifestamente dominate nelle simulazioni.
- Il giocatore vede soltanto i dati autorizzati: la casella corrente, gli imbocchi del bivio e gli indizi a soglie. HUD, minimappa, scena di corsa e transizioni non svelano la mappa sconosciuta; la minimappa contiene soltanto caselle percorse e l'uscita in posizione simbolica.
- Il bivio si attraversa solo avanzando: la scelta non comporta domande, il bivio non conta come passo e nessun avanzamento vi termina; i passi residui proseguono sul ramo scelto.
- Lo scenario di ogni casella si ripete senza giunture visibili e cambia a ogni casella attraversata; la schermata mostra il solo giocatore attivo, più chi si trova nella sua casella.
- Transizioni funzionanti fra giocatori in caselle diverse e nella stessa casella e fra Bafometto e giocatore; nessuna perdita dello stato, doppia risoluzione, consumo di timer durante blocchi o modifica dell'esito saltando un'animazione.
- Ricaricamento conserva mondo e progressi, compresa una scelta al bivio in attesa durante un avanzamento, con i passi residui; caricamento e scaricamento degli scenari non alterano topologia e posizione dei giocatori.
- Verificare compatibilità desktop/mobile e qualità con registrazioni reali del browser, viewport e revisione secondo AGENTS.md. Nessuna evidenza di runtime è richiesta o dichiarata per la presente PR esclusivamente documentale.

## 10. Decisioni ancora aperte

Prima delle relative implementazioni, definire lunghezza/durata delle gare, numero e distribuzione dei bivi, profili di bilanciamento, valori e condizioni di salute/crediti/Omen, schema di salvataggio e migrazione, quantità degli asset e budget prestazionali. La scelta automatica o manuale della città può attendere l'introduzione della seconda città.

Aperte dalla revisione del 26 novembre:
- etichetta del ramo intermedio ed eventuali varianti delle etichette per tema;
- soglie degli indizi dell'uscita e loro aspetto;
- angolo della camera nella scena di corsa: laterale, come la cornice compositiva del runner precedente nelle [regole di progetto](HELLSCAPE_PROJECT_RULES_v1.0.1_20261031.md), alle spalle o a tre quarti; va scelto prima dei modelli e delle animazioni definitive dei personaggi;
- lunghezza del ciclo dello scenario e velocità di corsa nelle varie fasi, compreso il rallentamento durante la domanda;
- forma della minimappa e posizione del nodo dell'uscita: decisa la disposizione reale delle caselle percorse. L'uscita è in una posizione fissa in alto a sinistra, la direzione in cui avanza in generale il percorso con l'orientamento della minimappa. La proposta approvata indicava «in alto a destra» per un errore sull'orientamento: la posizione resta da confermare;
- bilanciamento con la nuova regola dei bivi: va rifatto con simulazioni, perché oggi il bivio è una casella e il calcolo tiene conto della scelta a inizio turno.

### Stato del prototipo rispetto alla revisione del 26 novembre

Il prototipo in `hellscape3d/` implementa due parti di questa revisione. La prima è la regola dei bivi: bivio come punto di passaggio nel generatore e nel motore, salvataggi del formato precedente conservati a parte, bilanciamento rifatto. La seconda è la minimappa delle sole caselle percorse, con i bivi come punti di diramazione e l'uscita come simbolo fisso. Per il resto implementa ancora la versione precedente: mostra la città a tre quarti con tutti i giocatori e le alternative del bivio con lunghezza relativa e difficoltà esplicite. Le modifiche vanno fatte per passi giudicabili:
1. bivio come punto di passaggio nel generatore e nel motore (fatto);
2. minimappa delle sole caselle percorse con l'uscita simbolica (fatto);
3. scena di corsa in graybox: scenario ciclico per casella, giocatori nella stessa casella, bivio con imbocchi ed etichette, movimento ridotto;
4. indizi dell'uscita provvisori.

Restano utili generatore, motore, salvataggi, domande, kit modulare e minimappa. La vista della città a tre quarti resta come strumento di sviluppo per giudicare le mappe. Transizioni di camera nella città, ostacoli trasparenti e caricamento per settori perdono il loro scopo nel gioco: si rimuovono, dopo aver verificato le dipendenze, quando la scena di corsa li avrà sostituiti.

## Registro delle variazioni

- 2026-11-25: consolidamento delle decisioni approvate nella conversazione sul redesign: mappe procedurali, informazione parziale, 3D stilizzato, una città per gara, Megastrutture come primo tema, generazione modulare e regia dinamica.
- 2026-11-26: rappresentazione in corsa al posto della vista a tre quarti come schermata di gioco (un giocatore alla volta, insieme se nella stessa casella, scenario ciclico per casella); minimappa delle sole caselle percorse con l'uscita come nodo simbolico staccato; indizi dell'uscita a soglie; bivi raggiunti solo avanzando, con scelta all'arrivo, senza domanda e con etichette generiche; stato del prototipo e passi di adeguamento.
- 2026-11-26, correzione: il bivio non è una casella ma un punto di passaggio fra due caselle. Si sceglie durante l'avanzamento, senza domanda; non conta come passo, non vi si termina l'avanzamento e i passi residui proseguono sul ramo scelto. Sostituisce la regola della voce precedente, che permetteva di fermarsi sul bivio e conservare la scelta fra un turno e l'altro.
