# Hellscape — Bafometto biomeccanico, mondo progressivo e incenerimento

**Versione:** 1.1.0 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** **nuova direzione artistica/narrativa richiesta dall'utente; NON implementata**. Identità, comportamento e principi di scena confermati; forma precisa degli artefatti e molte scelte grafiche ancora da definire.  
**Ambito:** concept del boss, ambiente, eliminazioni e uscita finale; nessun cambio a punteggi, turni, vite, Omen, salvataggi o logica di determinazione di perdente/vincitore.  
**Fonte:** decisioni della conversazione del 31/10/2026, inclusa la premessa canonica della città, il gioco dei suoi abitanti e l'ispirazione dei quartieri ai settori infernali; successive al piano Cerbero v4.2.0.  
**Protocollo:** [AGENTS.md](../AGENTS.md), [protocollo sprite v16](PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md).

> **Precedenza narrativa:** questa specifica sostituisce come piano futuro l'inseguimento di Cerbero quadrupede, l'attacco con fiammata dalla bocca, la sbandata/caduta dei veicoli nella lava e il portale che cade dall'alto. Non attesta la sostituzione degli asset o del runtime attuale: Cerbero, ponte e portale ancora presenti nel codice rimangono documentazione dello **stato implementato precedente**, non del concept da produrre. Non usare gli artwork storici di Cerbero come riferimenti canonici del nuovo Bafometto.

## 0. Storia canonica: la città e il gioco degli abitanti

### Premessa narrativa confermata dall'utente

L'**inferno è una città**, edificata con **fuoco, metallo, carne e pietra**. **Bafometto vive al centro** della città e capeggia la sua popolazione di **mostri biomeccanici**. Gli abitanti organizzano un **gioco** nel quale alcuni personaggi, alla guida di **veicoli motorizzati**, vengono messi in gara attraverso la città. La loro meta è una **porta d'uscita situata ai confini urbani**.

**Solo il primo che raggiunge e oltrepassa la porta può uscire e ottenere la salvezza.** Gli altri non si salvano. L'eliminazione è rappresentata dalla cinematica già stabilita: Bafometto solleva il veicolo perdente con il dispositivo associato a una mano e lo incenerisce con quello associato all'altra, producendo **fuoco verde sulfureo e cenere residua visibile**.

Questa premessa è il canone narrativo del nuovo Hellscape; non determina **nuove regole di vittoria** nel motore: la fuga del primo è la rappresentazione cinematografica del **vincitore effettivamente determinato dal gameplay**. Non riscrivere punteggi, turni, vite o spareggi sulla base dell'ambientazione.

### Geografia e quartieri — precisazione confermata

- Esiste **una sola città infernale**, non una serie di inferni indipendenti. La corsa attraversa i suoi **quartieri**, avanzando dal contesto urbano interno verso il **confine**, dove si trova la porta.
- **Ogni quartiere è ispirato, almeno nell'aspetto, a un determinato settore dell'inferno**: materiali, architetture, silhouette e atmosfera ne evocano il carattere. Il quartiere **rimane un pezzo della stessa città**; l'ispirazione non implica spostamenti soprannaturali tra dimensioni né cambi di gameplay.
- La transizione tra quartieri deve essere **progressiva e spazialmente continua**, seguendo l'avanzamento delle domande/turni: riconoscere l'inizio di un nuovo settore tramite l'architettura e l'ambiente senza tagli arbitrari di fondale.
- È **ancora aperta** la scelta dei settori di riferimento, il numero e l'ordine dei quartieri, la corrispondenza con eventuali tradizioni specifiche (per esempio i gironi danteschi), il punto esatto di partenza, la cartografia e il rapporto temporale con le domande.
- La residenza centrale di Bafometto e la porta sul confine sono gli **unici due riferimenti geografici canonici** già stabiliti. Non attribuire ora nomi ai quartieri o funzioni specifiche alla popolazione senza nuova decisione.
- Le creature biomeccaniche sono **abitanti e organizzatori del gioco**: il loro aspetto deve contribuire alla vita della città, ma presenza in scena, folla, spettatori e interazioni sono ancora da progettare, non comportamenti obbligatori approvati.

### Implicazioni visive e produttive

Progettare prima una **mappa concettuale della città**, in cui il centro abitato da Bafometto, i quartieri ispirati ai settori infernali e la porta periferica formano un percorso continuo. Ogni distretto può avere un linguaggio visivo dominante **pur mantenendo una grammatica comune** (costruzioni biomeccaniche, materiali e strada percorribile da veicoli). Non scegliere ancora automaticamente esempi come fornaci, carne/ossa o macchine di tortura come divisione definitiva.

## 1. Identità dell'antagonista — confermato

- L'antagonista diventa **Bafometto**, una **creatura biomeccanica**: materia organica e metallo sono fusi in un unico corpo, coerenti con l'inferno di fuoco, metallo, carne e pietra.
- **Levita a gambe incrociate** durante la corsa: niente galoppo, camminata, appoggi delle zampe o locomozione quadrupede.
- È minaccioso attraverso presenza, ingegneria infernale e uso di strumenti; **non lancia incantesimi** e non produce direttamente fiamme dalla bocca o dalle mani nude.
- Impiega **due dispositivi/artefatti metallici con funzioni distinte**, uno associato a ciascuna mano: il primo **solleva e mantiene sospeso il veicolo**, il secondo **ne provoca l'incenerimento**.
- **Gli artefatti potrebbero essere fusi nelle mani o costituire prolungamenti anatomici biomeccanici.** Questa è una direzione di design preferita da esplorare, **non un modello o una forma definitiva approvati**.
- **Non considerare definitive** le proposte precedenti di morsa gravitazionale ad anelli, crogiolo, turibolo, scettro, forcone, doppie manopole o catena-fornace. Ne restano soltanto i **ruoli funzionali**: sospensione e incenerimento. Non presupporre che il meccanismo sia elettromagnetico, gravitazionale, a getto o simile senza una nuova decisione.

### 1.1 Parametri estetici aperti

Disegno di testa/corna/volto, connessione tra mani e artefatti, silhouette, numero di elementi articolati, modalità tecnica dell'azione a distanza, dimensioni, materiali specifici e animazione di attivazione **da progettare e approvare**. Evitare rune, gesti di magia generica o raggi energetici gratuiti come soluzione automatica. I meccanismi possono essere fantascientifici/fantastici ma **devono comunicare una causalità materiale e biomeccanica**.

## 2. Ambiente — confermato nei principi, aperto nei dettagli

- Hellscape diventa una **corsa in veicoli motorizzati attraverso una sola città infernale progressiva di fuoco, metallo, carne e pietra**, sede del gioco organizzato dai suoi abitanti biomeccanici.
- L'ambiente **cambia man mano che si avanza nelle domande/turni** attraversando quartieri ispirati nell'aspetto a diversi settori dell'inferno; il percorso porta a una **vera porta di uscita ai confini della città**, integrata nella geografia del mondo.
- I sei veicoli esistenti rimangono il fondamento della corsa: chopper con pilota, pick-up, camion, coupé, fuoristrada, Ape.
- Lo sfondo deve comunicare **avanzamento reale e continuità spaziale**, non cinque cartoline statiche scollegate; le trasformazioni della scenografia devono accompagnare la progressione della partita. La velocità apparente e il dettaglio saranno adattati al Canvas del gioco.
- **Nessun numero di quartieri, elenco definitivo dei settori infernali di riferimento, frazione di domande per quartiere o architettura della porta è ancora approvato.** Fonderie, distretti di ferraglia, carne-pietra e cittadella/uscita sono **spunti di progettazione**, non requisiti di produzione; ogni quartiere deve comunque essere leggibile come parte della **medesima città**.
- La strada non richiede più che ogni eliminato venga spinto oltre un ponte: il layout può essere riprogettato per il nuovo mondo, mantenendo leggibilità dei veicoli, profondità, prospettiva e libertà della camera.

## 3. Eliminazione — sequenza confermata

Il gameplay **decide prima** chi è eliminato; la sequenza ne rappresenta l'esito. Si ripete a ogni eliminazione, adattata alle sei sagome senza cambiare le regole di gioco.

| Stato | Azione |
| --- | --- |
| E0 — Isolamento | I **superstiti accelerano ed escono dall'inquadratura**. La telecamera resta sul **Bafometto levitante e sul veicolo perdente**, tenendoli entrambi leggibili. |
| E1 — Avvicinamento | Bafometto avanza **levitando a gambe incrociate** e si porta a distanza di azione. **Non** riprendere automaticamente la vecchia distanza di tre lunghezze del veicolo, che era un parametro proposto per Cerbero. |
| E2 — Sospensione | Bafometto attiva il **dispositivo con funzione di sollevamento**, collegato a una mano. Il veicolo si solleva gradualmente dalla strada, **rimane sospeso e immobilizzato**; fisica/rigidità delle sagome credibili, nessuna rotazione arbitraria. |
| E3 — Attivazione | Bafometto aziona il **dispositivo inceneritore collegato all'altra mano**; i due strumenti possono essere integrati nel corpo. La forma dell'attivazione e il meccanismo di trasferimento dell'effetto **non sono ancora definiti**. |
| E4 — Fuoco verde | Il veicolo sospeso viene avvolto da un **fuoco verde sulfureo**, cromaticamente distinto dal fuoco ambientale ordinario. Il verde è una scelta stilistica infernale, non una pretesa di realismo chimico della combustione dello zolfo. |
| E5 — Incenerimento | L'**intero veicolo e il giocatore** si carbonizzano, perdono consistenza e **si disgregano visibilmente in cenere**; il bersaglio non deve svanire in una dissolvenza semplice né precipitare nella lava. |
| E6 — Cenere residua | Dopo l'estinzione dell'effetto **la cenere rimane visibile**, con un residuo riconoscibile. La proposta di lasciarla cadere e depositarsi sulla strada è promettente ma i tempi di rilascio, massa del cumulo e persistenza lungo il percorso sono **da calibrare/approvare**. |
| E7 — Ripresa | Bafometto disattiva gli strumenti e torna alla levitazione d'inseguimento; la telecamera rientra fluidamente sui superstiti. |

### 3.1 Requisiti grafici

- L'**incenerimento** è più importante della semplice esplosione: progressione leggibile **incendio verde → annerimento/carbonizzazione → crepe e frammentazione → particelle di cenere → residuo finale**. Questa progressione è una proposta esecutiva coerente con la richiesta di cenere effettiva; il dettaglio dei frame resta da approvare.
- La **cenere deve essere resa chiaramente visibile** anche su display piccoli e distinguibile dalla polvere/fuliggine ambientale; niente sparizione immediata dell'intero mezzo senza conseguenze.
- Palette iniziale proposta, **non ancora campionata su asset definitivi**: verde scuro `#385900`, verde sulfureo `#76CD1B`, verde chiaro `#BDFF50`, nucleo pallido `#F1FFC3`; da validare con l'illuminazione dell'inferno. L'unico vincolo cromatico approvato è **fuoco verde sulfureo**.
- Animare separatamente corpo e mani/artefatti, dispositivo di sospensione, avvolgimento verde, deformazione/disgregazione **solo durante la distruzione** e cenere. Le normali carrozzerie restano rigide, senza mesh warp.
- **Niente** presa con le fauci, spinta fisica, fiammata dalla bocca, sbandata laterale, testacoda o caduta nella lava come esito di eliminazione.
- La camera dell'eliminazione resta **continua**, con Bafometto e veicolo presenti fino all'esito; nessun taglio per mascherare difetti di morphing. La cinepresa può adattare dolcemente posizione e zoom.

### 3.2 Tempi e produzione

Non fissare i 9/10 secondi menzionati nei brainstorming precedenti come requisito. Definire le durate con un **animatic**, poi transizioni **evento-dipendenti** (sollevamento completato, dispositivo attivato, combustione consumata, cenere residua resa visibile). Verificare 30/60/144 FPS quando pertinente, pausa/ripresa, movimento ridotto e browser reale. Il veicolo e il giocatore restano una sola entità di gioco eliminata; la frantumazione è soltanto visiva.

## 4. Finale — direzione confermata, coreografia da completare

- La progressione visiva culmina **al confine della città**, dove si trova la **porta d'uscita già appartenente al mondo**. **Non c'è più un portale che cade dall'alto**, né un portale che sale dalla lava e poi si distrugge.
- Il vincitore raggiunge e **supera la porta/soglia di fuga** con il proprio veicolo.
- Il comportamento dettagliato di Bafometto davanti alla porta, l'apertura/chiusura della soglia, l'eventuale colpo degli artefatti, i movimenti camera e l'inquadratura della scritta VITTORIA **sono ancora da progettare**. Non riutilizzare automaticamente ruggito/fiammata verticale/frenata davanti alle macerie del Cerbero.
- Da conservare come principio: il vincitore sfugge all'antagonista e il finale non modifica retroattivamente il vincitore determinato dal motore di gioco.

## 5. Produzione e criteri di accettazione

1. **Riferimento Bafometto**: creare concept statici della creatura biomeccanica a gambe incrociate, visivamente nel mondo fuoco–metallo–carne–pietra; approvare la silhouette prima dello sprite.
2. **Mani/artefatti**: esplorare **almeno** una soluzione con artefatti fusi nelle mani senza impegnarsi a una forma prefissata; mostrare chiaramente due funzioni separate e la causalità a distanza. Il numero di alternative da presentare è una scelta produttiva, non un nuovo requisito dell'utente.
3. **Eliminazione pilota**: test con un mezzo reale del gioco: levitazione del boss, sospensione del mezzo, accensione verde, incenerimento completo, cenere persistente leggibile e raccordo ai superstiti.
4. **Scenografia progressiva**: progettare la topologia di una **città unica**, centro di Bafometto → quartieri ispirati ai settori infernali → porta al confine; definire sistema di transizione, strada e progressione; solo dopo realizzare i fondali e la porta definitiva.
5. **Finale**: storyboard separato della porta di uscita; nessun asset/animazione del vecchio portale usato automaticamente come template.
6. **QA**: sei veicoli, visibilità camera, gerarchie degli elementi, assenza di artefatti grafici, pausa/ripresa, dimensioni schermo, prestazioni, stato del gioco invariato. Anteprime di runtime solo da registrazioni del browser; i concept non ne costituiscono prova.
7. **Ambito corrente**: revisione documentale; non eliminare asset originali approvati e non modificare gameplay o fare merge fino all'approvazione esplicita.

## 6. Decisioni e idee obsolete da non riutilizzare

| Superato | Nuova direzione |
| --- | --- |
| Cerbero a più teste come antagonista futuro | Bafometto biomeccanico levitante a gambe incrociate |
| Inseguimento con galoppo e contatto | Avanzamento in levitazione e controllo a distanza tramite artefatti |
| Fiammata dalla bocca, urto, spinta, sbandata, caduta nella lava | Sospensione del veicolo e **incenerimento verde in cenere residua** |
| Turibolo, crogiolo, scettro, morsa ad anelli come artefatti «definitivi» | Nessuna forma ancora approvata; **possibile fusione nelle mani** |
| Solo ponte/lava come fondale costante | **Città unica** e progressiva, quartieri che evocano settori dell'inferno nell'aspetto |
| Portale che cade dall'alto e crolla dopo l'attraversamento | **Porta finale integrata nel percorso** |

**Conservazione:** asset Cerbero e documentazione precedente rimangono recuperabili per tracciabilità e per descrivere l'attuale codice fino alla migrazione; non sono istruzioni artistiche attive. Questa specifica è la **sola fonte corrente per la nuova direzione narrativa**, oltre alle regole trasversali.

## Registro

- **1.1.0 — 2026-10-31:** definisce l'inferno come **città** di mostri biomeccanici guidati da Bafometto, residente al centro; gli abitanti organizzano il gioco dei concorrenti motorizzati, del quale **solo il primo alla porta periferica** ottiene la salvezza. I **quartieri** richiamano visivamente diversi **settori dell'inferno** pur restando una città continua. Specifica i punti ancora aperti senza inventare geografia, tassonomia o nuove regole di vittoria. Nessuna modifica runtime.
- **1.0.0 — 2026-10-31:** sostituzione dell'antagonista con Bafometto biomeccanico levitante, strumenti metallici potenzialmente fusi nelle mani; sostituzione della caduta nella lava con sospensione e incenerimento **verde sulfureo** che lascia cenere; ambiente progressivo fuoco–metallo–carne–pietra; uscita come porta fisica del mondo; rimozione dalle istruzioni attive delle vecchie cinematiche Cerbero e portale volante. Nessuna modifica runtime o approvazione di asset nuovi implicita.
