# Hellscape — città procedurali 3D e regia di gioco

**Data:** 2026-11-25, aggiornata il 2026-11-26 e il 2026-11-27  
**Stato:** specifica di redesign approvata nella conversazione del 25 novembre 2026; la revisione del 26 novembre (rappresentazione in corsa, radar, bivi) è approvata nella conversazione del 26 novembre 2026; quella del 27 novembre (stanze, inquadratura secondo la stanza) nella conversazione del 27 novembre 2026, proposta per integrazione documentale.  
**Ambito:** nuovo gioco da tavolo digitale a turni su schermo condiviso; nessuna modifica al runtime pubblicato né al prototipo in questa PR.

## 1. Obiettivo e precedenza

La gara consiste nell'uscire da una città infernale controllata da Bafometto biomeccanico. Il mondo è tridimensionale, stilizzato e generato proceduralmente per ogni nuova partita. Il gioco non è un open world: i personaggi si spostano lungo percorsi discreti. Nessuno conosce il percorso né quanto manca alla fine: la schermata mostra un giocatore alla volta, sempre in corsa nella stanza in cui si trova (§6), e il radar soltanto i giocatori attorno a quello di turno (§3).

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
- **Radar.** Sostituisce la minimappa e non disegna caselle né percorsi. Al centro sta il giocatore di turno; gli altri giocatori sono punti nella loro posizione relativa, in linea d'aria e con orientamento fisso. La portata è limitata: chi è più lontano compare come tacca sul bordo, nella propria direzione. L'uscita compare sul radar solo quando entra nella portata, quindi fa da indizio di avvicinamento e prima non rivela né direzione né distanza. La portata va tarata insieme agli indizi ambientali.
- **Indizi dell'uscita.** L'avvicinamento all'uscita si avverte da segni ambientali nella scena di corsa: luce naturale, uccelli in volo, vegetazione. L'intensità dipende dalla minima distanza residua dalla casella corrente, per soglie grossolane (indicativamente: nessun indizio, poi luce, poi uccelli e vegetazione nelle ultime caselle) e non in modo continuo, così che non si possano contare le caselle. Prima della scelta a un bivio gli indizi non distinguono i rami. Valori delle soglie e aspetto degli indizi sono da definire con il bilanciamento e la direzione artistica.
- La nebbia di guerra è uno stato esplicito, non soltanto un effetto estetico. Scena di corsa, transizioni, HUD, radar e inquadrature speciali devono rispettarla.
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

I personaggi sono modelli 3D animati, non pedine statiche; corrono, reagiscono agli eventi e manifestano lo stato di salute. I giocatori sono in gara fra loro, quindi chi si trova in una stanza è mostrato in corsa.

### Stanze e scena di corsa

- **Ogni casella è una stanza.** È uno spazio enorme, dall'architettura omogenea, che sembra continuare all'infinito. Il riferimento di atmosfera sono le megastrutture del manga *Blame!*: scala smisurata, vuoti verticali, strutture che si perdono nella nebbia, figure minuscole, luce scarsa. Vale come ispirazione generale: non si riprendono tavole, architetture riconoscibili, personaggi o nomi dell'opera. La scena deve mostrare la megastruttura oltre al giocatore, con sagome lontanissime, vuoti e una nebbia profonda.
- **Generazione.** Tutte le stanze sono generate proceduralmente dal tema, dal distretto e dal seme, con una sequenza decorativa che non influisce sulla logica. Fanno eccezione la stanza di partenza e quella d'uscita, che sono disegnate. Ogni stanza ha un tipo di spazio, per esempio corridoio, sala, ponte sul vuoto o pozzo, una grandezza e una pendenza: salita, piano o discesa. La pendenza deriva dalla differenza di quota fra la casella e la successiva nella città generata, che resta anche la base del radar. La stanza si ripete identica dopo un periodo, senza giunture visibili, e non anticipa nulla del seguito, salvo gli indizi dell'uscita (§3).
- **Un giocatore alla volta.** La schermata mostra il giocatore di turno che corre sul posto nella sua stanza. Gli altri giocatori compaiono solo se si trovano nella stessa casella: allora corrono insieme. Il giocatore di turno è identificabile mediante HUD e segnale visivo coerente.
- **Risposta errata o tempo scaduto.** Il giocatore continua a correre nella stessa stanza: è in gara, ma non guadagna terreno. Poi tocca al giocatore successivo.
- **Risposta corretta.** Dopo il dado il personaggio accelera ed esce dalla stanza. Il resto dell'avanzamento non si mostra, e la stanza d'arrivo resta nascosta, salvo due casi:
  - **bivio attraversato:** dopo l'uscita la scena passa alla stanza del bivio, una stanza di passaggio che non è una casella (§3) ma è generata in modo coerente con la megastruttura. Il personaggio si ferma davanti agli imbocchi, due o tre passaggi con le etichette generiche e nessuna informazione sul seguito, sceglie e imbocca la strada scelta. Se l'avanzamento attraversa più bivi, le stanze si mostrano una dopo l'altra;
  - **evento legato al personaggio:** un effetto della casella d'arrivo, come il terminale di Bafometto o un evento, oppure il raggiungimento dell'uscita, si mostra e si gestisce subito, nella stanza d'arrivo.

  Poi la scena passa al giocatore del turno successivo. Se si trova nella stessa stanza del precedente, la scena non cambia.
- **Inquadratura scelta con la stanza:**
  - quando la stanza viene generata, se ne sceglie anche l'inquadratura in base alle sue caratteristiche, cioè tipo e grandezza: angolazione, inclinazione, distanza e campo visivo, variati dal seme entro intervalli per tipo. La pendenza non decide l'inquadratura. Nella stanza del bivio la camera sta alle spalle del personaggio, verso le porte;
  - il personaggio non scende sotto un'altezza minima sullo schermo, anche su mobile: oggi il 5% dell'altezza dell'immagine, valore provvisorio. La camera si avvicina mentre la domanda è aperta;
  - la camera resta sempre dallo stesso lato del percorso: il personaggio corre verso destra o dentro lo schermo, mai verso sinistra;
  - i cambi di inquadratura sono morbidi, indicativamente 0,5 s; con il movimento ridotto avvengono per stacco.
- **Leggibilità.** Durante la domanda lo scorrimento è lento o attenuato e il pannello ha uno sfondo pieno. Con il movimento ridotto la stanza non scorre: si mostra un'immagine ferma e i cambi di scena avvengono per stacco.

| Fase | Rappresentazione |
| --- | --- |
| Inizio turno | Scena della stanza del giocatore di turno, se diversa dalla precedente; indicazione del turno |
| Domanda | Corsa rallentata, camera più vicina, domanda sovrapposta in HTML/CSS |
| Dado | Animazione dedicata, esito leggibile |
| Avanzamento | Corsa accelerata fino all'uscita dalla stanza; la stanza d'arrivo resta nascosta |
| Bivio | Stanza di passaggio, camera alle spalle: arresto davanti agli imbocchi, scelta fra etichette generiche, imbocco della strada scelta |
| Evento | Stanza d'arrivo mostrata e risoluzione immediata dell'evento; all'uscita, fine della partita |
| Fine turno | Scena del giocatore successivo, o nessun cambio se è nella stessa stanza |

Il timer della domanda non deve consumare tempo mentre la regia ne impedisce la lettura o l'interazione. Animazioni accelerabili o saltabili senza cambiare gli esiti.

### Transizioni fra giocatori

Il passaggio da un giocatore all'altro è un cambio di scena breve: dissolvenza, oscurità, fumo o interferenza, indicativamente 0,5–1 s. Se il giocatore successivo è nella stessa stanza la scena non cambia. La transizione non sorvola la città e non mostra percorsi. I tempi sono obiettivi di prototipazione, non valori immutabili.

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

La mappa logica viene generata integralmente all'avvio. La scena grafica contiene la stanza corrente e, durante avanzamenti e transizioni, quella di destinazione (stanza del bivio, stanza d'arrivo con un evento, stanza del giocatore successivo); le altre possono essere scaricate senza perdere stato logico. Preparare la stanza di destinazione prima di terminare una dissolvenza o un cambio di scena; evitare schermate vuote, scatti e indiscrezioni visive.

Usare istanze per elementi ripetuti, livelli di dettaglio, riutilizzo di materiali e geometrie, culling e budget di luci/ombre/particelle. Prevedere qualità adattabile, visuale leggibile su desktop e mobile in orizzontale, HUD accessibile e movimento ridotto. Stabilire budget misurabili di memoria, tempi e frame rate dopo la misura del prototipo, senza promettere prestazioni non verificate.

## 9. Primo prototipo (vertical slice)

Realizzare esclusivamente Megastrutture:
- un kit modulare minimo e un generatore di grafo e layout;
- area iniziale, uscita, almeno un bivio con alternative di difficoltà e lunghezza relativa diversa, due o tre tipi di nodo speciale;
- un modello giocatore provvisorio con ciclo di corsa, con almeno due istanze giocabili per provare cambi turno e giocatori nella stessa casella;
- la scena di corsa con stanze cicliche generate per casella, uscita dalla stanza, stanze dei bivi, eventi all'arrivo e indizi dell'uscita provvisori;
- una scena/interfaccia provvisoria di Bafometto;
- domanda, dado, avanzamento, scelta al bivio, arrivo, cambio turno, nebbia di guerra e radar dei giocatori;
- ripresa della partita con lo stesso mondo.

Fasi suggerite: (1) modello logico e test; (2) graybox 3D modulare con camera; (3) kit e direzione artistica; (4) personaggi, Bafometto, atmosfera e ottimizzazione. Non sviluppare altre città prima di convalidare il primo tema. Non avviare un rifacimento totale del runtime in questa PR.

### Criteri di accettazione per la successiva implementazione

- Seed uguale, tema/configurazione/versione uguali: stessa mappa; seed diversi producono varietà effettiva. Test su una pluralità di seed, includendo casi limite e fallback.
- Tutti i rami offerti sono raggiungibili e coerenti con la lunghezza relativa e la difficoltà; nessuna geometria impedisce il movimento. Le alternative non sono manifestamente dominate nelle simulazioni.
- Il giocatore vede soltanto i dati autorizzati: la stanza corrente, la stanza del bivio con i suoi imbocchi, la stanza d'arrivo solo quando c'è un evento, gli indizi a soglie. HUD, radar, scena di corsa e transizioni non svelano la mappa sconosciuta; il radar mostra soltanto i giocatori e, entro la portata, l'uscita.
- Il bivio si attraversa solo avanzando: la scelta non comporta domande, il bivio non conta come passo e nessun avanzamento vi termina; i passi residui proseguono sul ramo scelto.
- Ogni stanza si ripete senza giunture visibili; l'avanzamento mostra l'uscita dalla stanza, le stanze dei bivi attraversati e gli eventi all'arrivo, mai la stanza d'arrivo senza evento; la schermata mostra il solo giocatore di turno, più chi si trova nella sua stanza; l'inquadratura è quella scelta con la stanza e il personaggio non scende sotto l'altezza minima sullo schermo.
- Transizioni funzionanti fra giocatori in caselle diverse e nella stessa casella e fra Bafometto e giocatore; nessuna perdita dello stato, doppia risoluzione, consumo di timer durante blocchi o modifica dell'esito saltando un'animazione.
- Ricaricamento conserva mondo e progressi, compresa una scelta al bivio in attesa durante un avanzamento, con i passi residui; caricamento e scaricamento degli scenari non alterano topologia e posizione dei giocatori.
- Verificare compatibilità desktop/mobile e qualità con registrazioni reali del browser, viewport e revisione secondo AGENTS.md. Nessuna evidenza di runtime è richiesta o dichiarata per la presente PR esclusivamente documentale.

## 10. Decisioni ancora aperte

Prima delle relative implementazioni, definire lunghezza/durata delle gare, numero e distribuzione dei bivi, profili di bilanciamento, valori e condizioni di salute/crediti/Omen, schema di salvataggio e migrazione, quantità degli asset e budget prestazionali. La scelta automatica o manuale della città può attendere l'introduzione della seconda città.

Aperte dalla revisione del 26 novembre:
- etichetta del ramo intermedio ed eventuali varianti delle etichette per tema;
- soglie degli indizi dell'uscita e loro aspetto;
- tipi di stanza, regole con cui vengono generati e con cui se ne sceglie l'inquadratura, grandezze; stanze di partenza e d'uscita disegnate;
- lunghezza del ciclo dello scenario e velocità di corsa nelle varie fasi, compreso il rallentamento durante la domanda;
- portata del radar, oggi provvisoria (6 caselle in linea d'aria: l'uscita compare a 6–9 caselle di percorso, in casi rari fino a 16);
- bilanciamento con la nuova regola dei bivi: va rifatto con simulazioni, perché oggi il bivio è una casella e il calcolo tiene conto della scelta a inizio turno.

### Stato del prototipo rispetto alla revisione del 26 novembre

Il prototipo in `hellscape3d/` implementa la regola dei bivi di questa revisione: bivio come punto di passaggio nel generatore e nel motore, salvataggi del formato precedente conservati a parte, bilanciamento rifatto; inoltre il radar al posto della minimappa. La pagina `corsa.html` implementa in graybox la scena di corsa con le stanze: stanze generate con l'inquadratura scelta insieme alla stanza, uscita dalla stanza, stanze dei bivi, eventi all'arrivo, etichette generiche al bivio. La pagina `index.html` mostra la stessa partita nella vista della città, come strumento di sviluppo. Le modifiche vanno fatte per passi giudicabili:
1. bivio come punto di passaggio nel generatore e nel motore (fatto);
2. radar al posto della minimappa (fatto);
3. scena di corsa in graybox: stanze cicliche generate per casella con inquadratura secondo la stanza, giocatori nella stessa stanza, uscita dalla stanza, stanze dei bivi con imbocchi ed etichette, eventi all'arrivo, movimento ridotto (fatto in graybox nella pagina `corsa.html`, con stanze di partenza e d'uscita provvisorie);
4. indizi dell'uscita provvisori.

Restano utili generatore, motore, salvataggi, domande, kit modulare e radar. La vista della città a tre quarti resta come strumento di sviluppo per giudicare le mappe. Transizioni di camera nella città, ostacoli trasparenti e caricamento per settori perdono il loro scopo nel gioco: si rimuovono, dopo aver verificato le dipendenze, quando la scena di corsa li avrà sostituiti.

## Registro delle variazioni

- 2026-11-25: consolidamento delle decisioni approvate nella conversazione sul redesign: mappe procedurali, informazione parziale, 3D stilizzato, una città per gara, Megastrutture come primo tema, generazione modulare e regia dinamica.
- 2026-11-26: rappresentazione in corsa al posto della vista a tre quarti come schermata di gioco (un giocatore alla volta, insieme se nella stessa casella, scenario ciclico per casella); minimappa delle sole caselle percorse con l'uscita come nodo simbolico staccato; indizi dell'uscita a soglie; bivi raggiunti solo avanzando, con scelta all'arrivo, senza domanda e con etichette generiche; stato del prototipo e passi di adeguamento.
- 2026-11-26, correzione: il bivio non è una casella ma un punto di passaggio fra due caselle. Si sceglie durante l'avanzamento, senza domanda; non conta come passo, non vi si termina l'avanzamento e i passi residui proseguono sul ramo scelto. Sostituisce la regola della voce precedente, che permetteva di fermarsi sul bivio e conservare la scelta fra un turno e l'altro.
- 2026-11-26, minimappa: sostituita da un radar centrato sul giocatore di turno, con gli altri giocatori come punti e l'uscita visibile solo entro la portata. Non si disegnano caselle né percorsi.
- 2026-11-27, stanze: ogni casella è una stanza enorme e apparentemente infinita, con *Blame!* come riferimento di atmosfera, generata proceduralmente tranne partenza e uscita. Chi risponde giusto esce dalla stanza e la stanza d'arrivo resta nascosta; si mostrano invece le stanze dei bivi attraversati, stanze di passaggio che non sono caselle, e gli eventi all'arrivo, gestiti subito. Poi la scena passa al giocatore successivo, e non cambia se è nella stessa stanza. Inquadratura secondo la stanza: laterale in salita, a tre quarti in piano e in discesa, posteriore al bivio, con distanza secondo la grandezza e altezza minima del personaggio sullo schermo.
- 2026-11-27, inquadratura: scelta quando la stanza viene generata, in base alle sue caratteristiche (tipo e grandezza), al posto delle regole su salita, piano e discesa; camera alle spalle nella stanza del bivio; altezza minima del personaggio portata al 5% dell'immagine.
