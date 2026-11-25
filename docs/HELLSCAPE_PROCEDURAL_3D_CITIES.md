# Hellscape — città procedurali 3D e regia di gioco

**Data:** 2026-11-25  
**Stato:** specifica di redesign approvata nella conversazione del 25 novembre 2026, proposta per integrazione documentale.  
**Ambito:** nuovo gioco da tavolo digitale a turni su schermo condiviso; nessuna modifica al runtime in questa PR.

## 1. Obiettivo e precedenza

La gara consiste nell'uscire da una città infernale controllata da Bafometto biomeccanico. Il mondo è tridimensionale, stilizzato, generato proceduralmente per ogni nuova partita e osservato mediante una camera prevalentemente a tre quarti. Il gioco non è un open world: i personaggi si spostano lungo percorsi discreti.

Questa specifica aggiorna per il redesign le indicazioni relative al runner, alla sequenza obbligatoria dei sei quartieri e alla rappresentazione grafica 2D/2.5D. Il runtime pubblicato, i salvataggi e gli asset storici non vengono modificati da questa PR. Le specifiche precedenti rimangono valide per gli aspetti non in conflitto; eventuali incompatibilità di regolamento non trattate qui devono essere risolte prima dell'implementazione. Riferimenti: [direzione cinematica precedente](HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.2.0_20261031.md), [regole di progetto precedenti](HELLSCAPE_PROJECT_RULES_v1.0.1_20261031.md), [README del runtime](../README.md).

## 2. Una città per partita

Il motore deve supportare più città, ciascuna con una propria identità estetica. Ogni gara si svolge interamente in una sola città. La scelta può avvenire prima della partita o mediante estrazione casuale; la modalità precisa può essere stabilita quando saranno disponibili più città.

Il solo tema da implementare nella prima fase è **Megastrutture**. Non è richiesto sviluppare le altre città, né mescolarne gli stili. Un tema definisce asset, palette, materiali, regole di assemblaggio, decorazioni, effetti atmosferici e audio, ed eventuali varianti locali di gameplay. Le regole comuni non devono essere duplicate per ogni città.

## 3. Generazione della mappa e segretezza

- Generare un seed casuale a ogni nuova partita e una mappa deterministica a partire da seed, tema e configurazione. Lo stesso insieme di input e versione del generatore deve riprodurre la stessa mappa.
- Generare per prima la rete logica: partenza, caselle, archi, bivi, distretti, eventi, uscita e punti di interazione pertinenti. Tutti i percorsi proposti devono consentire la fuga; evitare vicoli ciechi involontari, cicli che impediscono la progressione e lunghezze eccessive.
- A ogni bivio indicare la lunghezza **relativa** dei percorsi verso l'uscita (più breve, intermedio se pertinente, più lungo) e la difficoltà delle domande. Il confronto si riferisce al cammino residuo verso l'uscita, non soltanto al prossimo incrocio. In caso di successive diramazioni, usare un criterio coerente e dichiarato internamente, per esempio la minima distanza residua raggiungibile dopo aver scelto il ramo; non promettere una lunghezza esatta del percorso effettivamente seguito.
- I percorsi più brevi comportano domande più difficili; quelli più lunghi domande più facili. Verificare mediante simulazioni che le alternative siano plausibilmente competitive, tenendo conto di probabilità di risposta corretta, dado ed eventi. Le soglie numeriche e i profili di bilanciamento non sono ancora fissati.
- Non esporre numero di caselle residue, distanza esatta, posizione precisa dell'uscita, né eventi futuri. I primi segmenti e il ramo scelto sono visibili; curve, ostacoli, dislivelli e oscurità nascondono il seguito.
- La minimappa condivisa mostra i giocatori, quello attivo e le aree già esplorate collettivamente; non mostra la rete sconosciuta né una vista globale che consenta di ricostruire le lunghezze nascoste. La nebbia di guerra è uno stato esplicito, non soltanto un effetto estetico. Anche transizioni della camera, HUD e inquadrature speciali devono rispettarlo.
- La logica interna conserva le distanze esatte necessarie al generatore; non esporle nell'interfaccia. Non si promette segretezza anti-manomissione rispetto agli strumenti di sviluppo di un browser locale.

### Turno e stato di gioco

Il giocatore attivo risponde a una domanda; se corretta, lancia il dado e avanza di conseguenza. Gli effetti ordinari delle caselle si applicano esclusivamente alla casella di arrivo, non a quelle attraversate. Un bivio incontrato durante l'avanzamento deve permettere la scelta prima di proseguire; la semantica esatta della difficoltà quando un turno attraversa un bivio va definita nella specifica del regolamento prima del relativo sviluppo. Il cambio di camera non cambia lo stato di gioco.

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

## 6. Personaggi e regia

I personaggi sono modelli 3D animati, non pedine statiche; camminano, reagiscono agli eventi e manifestano lo stato di salute. Il giocatore attivo è sempre identificabile mediante HUD e segnale visivo coerente. La vista ordinaria è a tre quarti, di tipo isometrico/ortografico o prospettico a seconda della leggibilità; la regia può cambiare distanza, inclinazione e campo visivo. Gli ostacoli che nascondono il personaggio attivo vengono resi temporaneamente trasparenti o tagliati, senza rivelare zone ancora sconosciute.

| Fase | Inquadratura |
| --- | --- |
| Inizio turno | Giocatore attivo e contesto locale, indicazione del turno |
| Domanda | Avvicinamento al personaggio, domanda sovrapposta in HTML/CSS |
| Dado | Inquadratura o animazione dedicata, esito leggibile |
| Avanzamento | Camera di inseguimento, campo sufficiente a leggere il percorso |
| Bivio | Visuale delle alternative locali, nessuna lunghezza esatta |
| Arrivo/evento | Inquadratura contestuale, risoluzione dell'evento |
| Fine turno | Transizione al giocatore successivo |

Il timer della domanda non deve consumare tempo mentre la regia ne impedisce la lettura o l'interazione. Orientamento coerente fra inquadrature ordinarie, rotazioni limitate e opzione movimento ridotto; animazioni accelerabili o saltabili senza cambiare gli esiti.

### Transizioni fra giocatori

- Vicini sulla stessa strada: traslazione fluida, indicativamente 0,5–1 s.
- Nello stesso distretto: breve allontanamento, traslazione e avvicinamento, indicativamente 1–1,5 s, soltanto lungo visuali già consentite.
- Lontani o separati da aree inesplorate: breve dissolvenza, oscurità, fumo o interferenza, cambio di posizione fuori campo e riapertura sul destinatario, indicativamente 0,5–1 s. Non sorvolare tutta la città né svelare nuovi percorsi.
- Interazione con Bafometto: cambio di inquadratura dedicato, con gli stessi vincoli di segretezza. I tempi sono obiettivi di prototipazione, non valori immutabili.

Bafometto può avere una sede fisica, una sala monumentale o una macchina centrale, e manifestarsi attraverso terminali, monitor o apparizioni locali. La regia passa alla sua sede per gli interventi significativi e ritorna al giocatore interessato; gli scambi frequenti, come l'acquisto di Omen, privilegiano una manifestazione locale. Nessun tragitto obbligatorio della camera fra la sede e il giocatore. La sua posizione scenografica non deve essere usata per rivelare l'uscita o la topologia nascosta.

Il CameraDirector riceve eventi dal motore e gestisce inquadrature, transizioni, interruzioni e salti. Non assegna ricompense, non consuma turni e non determina gli esiti di dado o domanda. Il motore resta l'autorità sullo stato.

## 7. Architettura tecnica proposta

La distribuzione resta un sito web statico, utilizzabile in partita locale a schermo condiviso. Non è richiesto un server per la generazione del mondo. Il runtime attuale non dipende da un renderer 3D: la transizione va sviluppata in modo incrementale, non sostituendo indiscriminatamente il progetto.

- **MapGenerator:** seed, grafo, difficoltà, vincoli, validazione; testabile senza browser.
- **CityTheme:** catalogo moduli, materiali, palette, regole di assemblaggio, atmosfera e varianti. Primo tema: MegastructuresCityTheme.
- **CityBuilder:** layout spaziale, assemblaggio, validazione geometrica e caricamento della scena.
- **CameraDirector:** regia e transizioni indipendenti dalla logica.
- **GameState:** posizioni, turno, eventi, inventario, salute, crediti, aree esplorate e dati di ripresa.

Stack proposto: Three.js/WebGL per rendering 3D, TypeScript e Vite per il nuovo codice, HTML/CSS per HUD, menu e domande, Blender e glTF/GLB per modelli complessi. Nessun motore fisico completo necessario: i movimenti lungo gli archi possono essere controllati da interpolazione e animazione. Queste sono scelte approvate come direzione, da verificare nel prototipo e non dipendenze già introdotte.

Separare le sequenze casuali della logica da quelle puramente decorative; non permettere che modifiche grafiche alterino dadi o mappa. Persistenza: conservare seed, tema, versione del generatore e stato sufficiente a riprodurre la partita anche dopo ricaricamento; gestire esplicitamente la compatibilità delle versioni del generatore e dei salvataggi. I vecchi salvataggi del runner non vanno sovrascritti o interpretati automaticamente come partite del nuovo modello.

## 8. Prestazioni e accessibilità

La mappa logica viene generata integralmente all'avvio, la scena grafica per settori attorno al giocatore attivo e alle destinazioni delle transizioni. Le zone lontane possono essere scaricate senza perdere stato logico. Preparare il settore di destinazione prima di terminare una dissolvenza; evitare schermate vuote, scatti e indiscrezioni visive.

Usare istanze per elementi ripetuti, livelli di dettaglio, riutilizzo di materiali e geometrie, culling e budget di luci/ombre/particelle. Prevedere qualità adattabile, visuale leggibile su desktop e mobile in orizzontale, HUD accessibile e movimento ridotto. Stabilire budget misurabili di memoria, tempi e frame rate dopo la misura del prototipo, senza promettere prestazioni non verificate.

## 9. Primo prototipo (vertical slice)

Realizzare esclusivamente Megastrutture:
- un kit modulare minimo e un generatore di grafo e layout;
- area iniziale, uscita, almeno un bivio con alternative di difficoltà e lunghezza relativa diversa, due o tre tipi di nodo speciale;
- un modello giocatore provvisorio, con almeno due istanze giocabili per provare cambi turno vicini e lontani;
- una scena/interfaccia provvisoria di Bafometto;
- domanda, dado, avanzamento, scelta, arrivo, cambio turno, nebbia di guerra e minimappa;
- ripresa della partita con lo stesso mondo.

Fasi suggerite: (1) modello logico e test; (2) graybox 3D modulare con camera; (3) kit e direzione artistica; (4) personaggi, Bafometto, atmosfera e ottimizzazione. Non sviluppare altre città prima di convalidare il primo tema. Non avviare un rifacimento totale del runtime in questa PR.

### Criteri di accettazione per la successiva implementazione

- Seed uguale, tema/configurazione/versione uguali: stessa mappa; seed diversi producono varietà effettiva. Test su una pluralità di seed, includendo casi limite e fallback.
- Tutti i rami offerti sono raggiungibili e coerenti con la lunghezza relativa e la difficoltà; nessuna geometria impedisce il movimento. Le alternative non sono manifestamente dominate nelle simulazioni.
- Il giocatore vede soltanto i dati autorizzati dal sistema di esplorazione; HUD, minimappa, camera, dissolvenze e tagli di geometria non svelano la mappa sconosciuta.
- Camera funzionante fra due giocatori vicini e lontani e fra Bafometto e giocatore; nessuna perdita dello stato, doppia risoluzione, consumo di timer durante blocchi o modifica dell'esito saltando un'animazione.
- Ricaricamento conserva mondo e progressi; caricamento/scaricamento dei settori conserva la topologia e la posizione dei giocatori.
- Verificare compatibilità desktop/mobile e qualità con registrazioni reali del browser, viewport e revisione secondo AGENTS.md. Nessuna evidenza di runtime è richiesta o dichiarata per la presente PR esclusivamente documentale.

## 10. Decisioni ancora aperte

Prima delle relative implementazioni, definire lunghezza/durata delle gare, numero e distribuzione dei bivi, profili di bilanciamento, regole di domanda ai bivi, valori e condizioni di salute/crediti/Omen, schema di salvataggio e migrazione, quantità degli asset e budget prestazionali. La scelta automatica o manuale della città può attendere l'introduzione della seconda città.

## Registro delle variazioni

- 2026-11-25: consolidamento delle decisioni approvate nella conversazione sul redesign: mappe procedurali, informazione parziale, 3D stilizzato, una città per gara, Megastrutture come primo tema, generazione modulare e regia dinamica.
