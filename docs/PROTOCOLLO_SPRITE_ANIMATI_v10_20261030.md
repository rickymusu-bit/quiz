# Protocollo operativo per sprite animati coerenti

**Versione documento:** v10  
**Ultimo aggiornamento:** 30 ottobre 2026 — Europe/Rome  
**Progetto di riferimento:** Hellscape – Fuga dall'inferno  
**Ambito:** riutilizzabile per qualsiasi personaggio, creatura, veicolo, oggetto animato o effetto collegato  
**Stato:** specifica operativa proposta; non attesta che gli asset del gioco siano già stati sostituiti o validati  
**Destinatari:** Codex, ChatGPT Work, artisti, altri agenti e sviluppatori  
**Repository:** rickymusu-bit/quiz  
**Convenzioni prevalenti:** [AGENTS.md](../AGENTS.md); in caso di conflitto prevalgono le istruzioni più recenti esplicitamente approvate dall'utente.

> **Principio guida:** uno sprite animato rappresenta **un unico soggetto articolato che evolve nel tempo**, non una serie di illustrazioni indipendenti. Le parti anatomiche, i punti di ancoraggio e la causalità degli effetti sono vincoli di produzione e di accettazione, non semplici suggerimenti stilistici.

## 1. Obiettivo e ambito

Questo protocollo disciplina due casi distinti:

1. **Da immagine di riferimento:** generare una nuova sequenza di un soggetto del quale esiste una posa o illustrazione canonica.
2. **Da animazione precedente:** generare una nuova azione (per esempio fuoco dopo camminata), conservando **identità, anatomia, proporzioni, orientamento e palette** dello sprite già approvato.

La produzione comprende analisi del riferimento, definizione dei vincoli, schema anatomico e meccanico, pose chiave disegnate, fotogrammi intermedi disegnati, effetti, verifica e integrazione. Lo schema articolare è un riferimento per l'artista, **non** l'autorizzazione a manipolare uno sprite statico con rig procedurali. Non sostituisce la direzione artistica esistente di Hellscape, non autorizza un nuovo design e non modifica autonomamente le meccaniche di gioco.

## 2. Fonti e gerarchia di riferimento

Prima di disegnare o generare fotogrammi:

1. Identificare la **versione approvata** del personaggio e, se esiste, il foglio sprite di una precedente azione; annotare percorso e revisione.
2. Isolare le caratteristiche invarianti dal materiale approvato, senza importare errori o artefatti di generazioni scartate.
3. Identificare, per l'azione richiesta, **quali parti possono muoversi** e quali connessioni rimangono obbligatorie.
4. Se due riferimenti sono incompatibili, dichiarare il conflitto e assumere come vincolante il design più recente esplicitamente approvato; non fondere automaticamente anatomie diverse.
5. Disegnare ogni fotogramma necessario come posa completa, coerente con la medesima base anatomica e con i riferimenti approvati: evitare redesign casuali, ma **non** sostituire il disegno con deformazioni o ritagli animati dello sprite originale.

La variazione di forma è consentita solo dove il materiale e la biomeccanica la giustificano. Il semplice desiderio di rendere il movimento più dinamico non autorizza deformazioni del soggetto.

### 2.1 Audit contestuale obbligatorio, prima di generare qualsiasi nuovo asset

**Non avviare la generazione di un nuovo soggetto soltanto sulla base di una descrizione astratta del personaggio.** Prima di scrivere un prompt grafico o creare pose, esaminare direttamente il gioco esistente: codice della scena, camera, screenshot reali, palette e file grafici **già approvati**. Distinguere ciò che è verificato da ciò che è ancora ipotetico. Non usare automaticamente un concept precedente non approvato come fonte canonica.

Verificare e annotare:

| Asse | Domande da risolvere prima della generazione | Conseguenza per la progettazione |
| --- | --- | --- |
| **Camera e orientamento** | Vista laterale, frontale, tre quarti o prospettica? Direzione di spostamento, inclinazione, profondità, ribaltamenti consentiti? Camera statica o a inseguimento? | Disegnare il soggetto nativamente nell'angolo compatibile con la camera; non forzare una vista inadatta con deformazioni/rotazioni |
| **Posizione e profondità** | In quali coordinate o regioni appare? Cielo, ponte, primo/secondo piano? Quale ordine di disegno (z-order), occlusione e parallasse? | Composizione e silhouette coerenti con ciò che è davanti e dietro; nessun elemento che fluttui o attraversi solidi senza motivo |
| **Ruolo funzionale** | Decorazione atmosferica, personaggio narrativo, effetto, nemico, bersaglio o elemento con collisioni? | Complessità, contrasto, numero di pose, dettaglio, volume del movimento ed evidenza visiva proporzionati al ruolo |
| **Scala e leggibilità** | Dimensioni effettive in pixel logici nel Canvas, scala visualizzata su desktop/mobile, distanza e velocità? | Disegnare dettagli che restino leggibili **alla dimensione effettiva**; non confondere la grandezza del concept con lo sprite finale |
| **Asset preesistenti** | Quali immagini/atlas, animazioni, screenshot approvati, colori, luci, contorni, grana, campionamento e stile sono già usati? | Conservare coerenza con la famiglia di asset approvata, senza inventare palette o un secondo linguaggio visivo |
| **Animazione richiesta** | Idle, volo, corsa, attacco, morte? Quali appoggi, articolazioni, vincoli, durata, loop, punti di contatto e ancoraggi? | Definire storyboard e scheletro logico prima di disegnare fotogrammi e raccordi |
| **Materiali e forze** | Pelle/membrane, metallo, ossa, pietra, gomma? Quali deformazioni sono plausibili? | Limitare elasticità, flessione e danno a materiali e condizioni appropriate |

La documentazione deve riportare il **percorso delle fonti esaminate** (asset, moduli di rendering, screenshot) e la revisione o data, indicando eventuali mancanze. Se non è possibile vedere l'asset originale, segnalarlo: non dichiarare effettuata una verifica visiva sulla base del solo nome del file.

#### 2.1.1 Scheda obbligatoria di contestualizzazione

Prima del primo concept, produrre e conservare una scheda sintetica, compilata **con dati verificati** e separando le ipotesi:

- **Soggetto e funzione:** nome, ruolo atmosferico/narrativo/gameplay, priorità nella composizione.
- **Camera:** vista, angolo di orientamento, verso di marcia e variazioni previste durante la sequenza.
- **Scena:** posizione e intervallo di coordinate, piano di profondità, possibilità di uscire dall'inquadratura, parallasse/occlusioni.
- **Scala:** dimensioni nominali nel renderer, scala di esportazione, minimo di leggibilità osservabile.
- **Riferimenti:** percorsi, revisioni, palette, livelli di dettaglio, illuminazione e campionamento degli asset canonici.
- **Anatomia/materiali:** connessioni, caratteristiche invarianti e possibilità di movimento/deformazione.
- **Azioni:** pose, cicli, frame intermedi e ancoraggi necessari.
- **Stato:** concept proposto / design approvato / keyframe approvati / sprite integrato, ciascuno distinto.

**Gate di ingresso:** se camera, ruolo, collocazione e riferimenti non sono stati controllati o le ipotesi non sono dichiarate, **non è consentito presentare il concept come pronto per il gioco**. La generazione esplorativa è possibile soltanto se esplicitamente marcata come tale, non come asset approvato.

#### 2.1.2 Caso di applicazione: diavolo volante di Hellscape

Al 29/10/2026, dal codice e dalla documentazione del repository si ricavano questi dati operativi da **riconfermare quando cambia il renderer**:

- `docs/HELLSCAPE_LAYOUT.md`: Canvas di scena **512 × 384 pixel logici**, palco di riferimento **1024 × 768**.
- `assets/hell-race.js`: funzione `flyingDevils()` con piccoli soggetti decorativi nel cielo, otto istanze; `devilPosition()` determina quota e movimento.
- Lo sprite procedurale esistente viene disegnato in un riquadro nominale **64 × 60** con scala circa **0,48–0,61**, quindi ingombro di riferimento nell'ordine di **31–39 × 29–37 pixel logici** (prima di eventuali trasparenze della sagoma).
- `assets/hell-race/infernal-world-v1.webp`, `assets/hell-race/lava-bridge-v1.webp`, `assets/hell-race/demon-actions-v1.webp`, screenshot delle scene approvate: riferimenti da ispezionare visivamente prima di dichiarare il nuovo sprite stilisticamente conforme. Il codice da solo non sostituisce la verifica delle immagini.
- **Ruolo:** sagoma atmosferica di secondo piano, non nuovo boss. Il design di riferimento deve funzionare soprattutto come silhouette con battito d'ali; ingombro e definizione devono essere calibrati sul Canvas, non sulla dimensione di una illustrazione da copertina.
- **Camera:** l'inquadratura laterale della corsa è la cornice compositiva. L'esatto angolo del personaggio va confrontato con la scena e confermato visivamente prima degli sprite definitivi. Una posa drammatica frontale a tre quarti non è automaticamente adatta.
- Durante la fase di test del concept non modificare il codice per riattivare i diavoli volanti eventualmente rimossi dalla versione di gioco in uso. L'integrazione richiede una richiesta e approvazione separate.

## 3. Invarianti anatomici e visivi

| Proprietà | Regola vincolante |
| --- | --- |
| Identità | Stesso personaggio, segni distintivi, materiali, palette, silhouette e livello di dettaglio. |
| Conteggi anatomici | Numero di teste, arti, corna, code e altri componenti stabile, salvo occlusioni fisicamente plausibili. |
| Proporzioni | Rapporti tra testa, collo, tronco, arti e articolazioni coerenti lungo tutta la sequenza; vietato squash/stretch arbitrario; eventuale deformazione solo se fisicamente plausibile per il materiale e disegnata nelle pose approvate. |
| Connessioni | Teste collegate ai colli, colli al tronco; arti collegati alle articolazioni; parti mai flottanti o saldate arbitrariamente. |
| Orientamento | Prospettiva, verso di movimento, disposizione relativa delle parti e punto di vista coerenti. |
| Scala e quadro | Stesso sistema di coordinate, scala base, centro/pivot e dimensione nominale dei frame. |
| Stile | Tratto, anti-alias/pixel art, luce, contorni e resa materica omogenei; nessun salto casuale di definizione. |
| Continuità | Posa, velocità, direzione ed eventi evolvono senza teletrasporti o cambi istantanei non narrati. |
| Integrità del canvas | Nessuna parte utile (testa, corna, coda, fiamme) viene tagliata per mancanza di margini, a meno che l'inquadratura lo richieda esplicitamente. |

**Un'occlusione non è una mutilazione:** una zampa nascosta dietro il torso può essere corretta; una zampa che ricompare sul lato sbagliato senza percorso plausibile non lo è. Nel movimento delle creature fantastiche conta la coerenza dell'anatomia *progettata*, non l'aderenza letterale all'anatomia di un animale reale.

### 3.1 Metodo di produzione obbligatorio: fotogrammi disegnati

Per **camminata, corsa, morso, attacco, presa, salto e altre azioni anatomiche complesse** usare come impostazione predefinita spritesheet costituiti da **pose disegnate individualmente**, inclusi i fotogrammi intermedi necessari. Ogni frame deve rappresentare un'anatomia intera e coerente, anche quando parti del corpo sono occluse.

**Non usare come scorciatoia per evitare di produrre fotogrammi:**
- mesh deformation, mesh warping, skinning o deformazioni dei vertici;
- rigging scheletrico automatico, rotazione di ritagli di teste/arti/mandibole, deformazione dei colli mediante pivot approssimati;
- scala non uniforme (scaleX/scaleY), skew, stretch, compressione, morphing o trasformazioni CSS/Canvas/SVG applicate a corpi o parti corporee per simulare la locomozione;
- alternanza di una o due pose statiche deformate per simulare le fasi mancanti;
- generazione automatica di frame mediante deformazione geometrica del singolo riferimento, anche se il risultato è fluido dal punto di vista temporale.

**Consentito:** tradurre o ruotare un corpo *rigido intero* in maniera coerente; aggiornare camera, fondale, livelli e particelle; ruotare ruote e componenti meccanici effettivamente articolati; riprodurre i frame disegnati con un clock appropriato. La rotazione di un pezzo **non** è un sostituto automatico delle pose anatomiche di una creatura. L'uso di rig come *scheda di progettazione* non autorizza lo skinning a runtime.

Una tecnica diversa può essere adottata solo con **approvazione esplicita e preventiva**. L'assenza di asset è un impedimento da dichiarare, non una delega implicita a introdurre fallback estetici.

### 3.2 Coerenza meccanica dei materiali

La deformazione ammissibile dipende dall'oggetto e dal materiale, non da un generico stile cartoon. Anche nelle scene stilizzate, proprietà e conseguenze delle sollecitazioni devono rimanere consistenti.

| Materiale/sistema | Movimenti e deformazioni plausibili | Errore da evitare |
| --- | --- | --- |
| Carrozzeria e telaio metallici | Spostamenti/rotazioni rigide; vibrazioni limitate, flessione locale sotto carico, piegatura o danno permanente in un urto | Allungare, schiacciare o far pulsare l'intero veicolo durante la marcia |
| Gomma e pneumatici | Rotolamento, compressione localizzata al contatto, recupero elastico e deformazione sotto carico | Deformare allo stesso modo telaio e pneumatici |
| Sospensioni, cerniere e parti articolate | Movimento relativo nei gradi di libertà del giunto, compressione/estensione prevista | Trattare l'insieme del veicolo come un unico corpo elastico |
| Tessuti, cinghie, catene | Pieghe, oscillazione, flessione e movimento rispettando vincoli e punti di fissaggio | Cambi di lunghezza o connessioni senza causa |
| Pietra, vetro e ceramica | Movimento rigido fino a frattura; frammenti con massa, inerzia e gravità | Oscillazioni gommose o collassi come fogli |
| Tessuti organici | Contrazioni muscolari, piegamenti articolari, deformazioni locali congruenti con anatomia e forze | Stretch indiscriminato di arti, colli o crani |
| Liquidi, fiamme e gas | Forma variabile, flusso, dispersione e dinamica degli effetti | Vincolarli alla silhouette rigida di un veicolo o a coordinate indipendenti dalla sorgente |

**Regola specifica per Hellscape — veicoli:** durante accelerazione, decelerazione e corsa, **lunghezza, larghezza e proporzioni della carrozzeria restano costanti**. Mostrare velocità e terreno irregolare mediante traslazione, rotazione coerente del veicolo, movimento e compressione delle sospensioni, rotazione delle ruote, polvere/scintille ed eventuale camera tracking. La carrozzeria non deve espandersi o restringersi orizzontalmente. Una collisione può produrre danni locali coerenti con sollecitazione e materiale, non una deformazione elastica globale e reversibile.

Le regole valgono per **tutti gli oggetti animati**: non solo Cerbero e veicoli ma anche ponte, portale, rottami, armi, effetti e nuovi asset. Non applicare il medesimo effetto grafico a materiali con comportamenti diversi.

## 4. Scheletro logico, coordinate e ancoraggi

Prima dei frame definire uno **schema articolare logico** (anche come scheda annotata, senza deformazione procedurale degli sprite) che elenchi:

- componenti e gerarchia padre-figlio (tronco → collo → testa → mandibola);
- punti di articolazione e gradi di libertà consentiti;
- rapporti dimensionali di riferimento;
- pivot/asse del corpo e punto di appoggio al terreno;
- ancoraggi funzionali: bocche, mani, ruote, canne di armi, ugelli, punti d'impatto;
- eventuali parti condivise, sovrapposizioni e ordine dei livelli (davanti/dietro);
- limiti di rotazione, traslazione e deformazione.

**Ogni bocca mantiene un identificatore stabile per tutta la sequenza** (per esempio bocca_sx, bocca_centrale, bocca_dx rispetto al corpo del personaggio, non alla posizione sullo schermo). L'ordine non cambia quando una testa si sovrappone a un'altra.

Formalmente, un punto di emissione in coordinate del mondo deriva dalla trasformazione della parte anatomica che lo possiede:

~~~text
p_emissione(t) = T_corpo(t) · T_collo_i(t) · T_testa_i(t) · p_bocca_locale_i
direzione(t)   = orientamento della bocca trasformato nello stesso sistema
~~~

Non inserire coordinate arbitrarie della fiammata indipendenti dalla testa. La formula è un **contratto geometrico**: non impone una specifica libreria o l'uso obbligatorio di matrici nel codice.

### 4.1 Allineamento obbligatorio degli output generativi

**Obiettivo e tolleranza.** Il generatore non garantisce che due PNG dello stesso soggetto abbiano posizione, scala e tratto identici. Dopo **ogni** generazione o retake, normalizzare il fotogramma prima delle GIF, dell'approvazione e della generazione successiva. La corrispondenza pixel per pixel al 100% non è un requisito di accettazione: contano continuità anatomica, proporzioni, identità, dettagli persistenti e resa alla scala d'uso. Una variazione lieve di texture può essere accettabile; un osso che cambia lunghezza, un giunto aggiunto o un foro che cambia lembo non diventano corretti soltanto perché piccoli.

#### 4.1.1 Riferimento e punti stabili
1. Conservare il PNG grezzo immutato e identificare il modello canonico approvato, il pivot e il canvas comune della sequenza.
2. Separare **movimento previsto** (posa, spostamento, inclinazione, prospettiva e oscillazione intenzionale) da errore del generatore. Normalizzare solo il secondo; non immobilizzare il gesto o cancellare un movimento corporeo approvato.
3. Annotare, quando visibili, almeno tre landmark non coincidenti sul corpo relativamente stabile: per esempio centro del torace, attacchi delle spalle e bacino. Usare nomi anatomici persistenti, coordinate, attendibilità e occlusioni. La testa è utile solo quando il piano la prevede stabile.
4. **Non** allineare usando estremità delle ali, coda, arti in movimento o bounding box dell'intera sagoma. La diversa apertura alare non è una diversa taglia del corpo. Un landmark occluso o poco affidabile va escluso, non inventato.
5. Confrontare sempre anche con il riferimento canonico, non soltanto con il fotogramma precedente, per evitare accumulo di deriva lungo la sequenza.

#### 4.1.2 Trasformazioni consentite e metodo
- Applicare all'**intero fotogramma** una sola trasformazione: traslazione; scala uniforme per recuperare la scala corporea; eventuale rotazione rigida solo per correggere una variazione di orientamento non prevista dal piano. Bloccare la rotazione quando deve restare invariata e non compensare un cambiamento reale di prospettiva con una rotazione 2D.
- Stimare i parametri dai landmark stabili, con adattamento manuale documentato oppure stima automatica di similitudine pesata per attendibilità. Se i punti affidabili non bastano, dichiarare l'allineamento provvisorio; non attribuirgli precisione anatomica.
- Correlazione di una regione corporea e metodi automatici di confronto immagini possono inizializzare o verificare la stima, ma non certificano anatomia o perfetta corrispondenza dei dettagli.
- Vietati scala diversa sui due assi, allineamento indipendente di teste/ali/arti, warp, morphing e altri adattamenti locali per far coincidere a forza pose incoerenti. L'allineamento non genera disegni intermedi e non sostituisce un retake.
- Trasformare con gli stessi parametri pivot e ancoraggi funzionali. Conservare separatamente la traiettoria e i movimenti corporei intenzionali della sequenza.
- Comporre le trasformazioni e ricampionare una sola volta dall'originale quando possibile; scegliere il campionamento coerente con lo stile approvato. Conservare alpha e piccoli fori. Una traslazione intera può evitare ricampionamento; se occorre una scala frazionaria, controllare perdita di dettagli e tremolio alla scala finale.
- Impostare padding/canvas comuni sull'ingombro complessivo delle pose estreme, senza tagliare ali o coda e senza ridimensionare ogni sagoma per riempire il riquadro. Conservare il medesimo riferimento geometrico per export e runtime.

#### 4.1.3 Verifiche e decisione
Dopo la normalizzazione:
1. Misurare lo scarto residuo dei landmark affidabili (medio/quadratico e massimo, con unità), distinguendo coordinate dell'asset e pixel effettivi alla scala di gioco. Una stima visuale non va presentata come misura.
2. Verificare separatamente le proporzioni e la topologia: lunghezze relative dei segmenti, connessioni, numero di parti, volumi, attacchi delle membrane, posizione anatomica di fori e strappi. La prospettiva può cambiare la lunghezza **proiettata**; non richiedere che tutte le distanze 2D siano identiche tra pose diverse.
3. Eseguire flip/GIF del nuovo fotogramma con i vicini e onion skin sulle zone pertinenti, a vista ingrandita e alla dimensione effettiva d'uso (§5.5 e §7.6). Le ali in movimento non devono coincidere nella sovrapposizione: devono seguire l'arco previsto.
4. Calibrare tolleranze e limiti di scala/rotazione sulla sequenza, sull'attendibilità dei punti, sullo stile e sulla leggibilità reale. Registrare criterio e motivazione; niente percentuali universali o rigenerazioni per ogni differenza di pixel.
5. Esito **allineato e candidato alla revisione**, **provvisorio per dati insufficienti** oppure **respinto per incoerenza residua**. Se una sola trasformazione globale non basta a preservare le proporzioni, correggere il disegno responsabile. Non alterare il modello approvato per inseguire la posa difettosa.
6. Solo dopo il controllo tecnico, presentare la posa e la GIF per il gate artistico previsto. Una normalizzazione riuscita non costituisce approvazione automatica.

#### 4.1.4 Tracciabilità obbligatoria
Nel manifest/rapporto registrare: PNG grezzo e derivato allineato (oppure trasformazione riproducibile), hash/revisione, riferimento canonico e pose vicine, landmark e attendibilità, metodo, scala uniforme, angolo, offset, canvas/padding, pivot e ancoraggi trasformati, movimento intenzionale conservato, campionamento, scarti e unità, tolleranza motivata, GIF/onion skin, difetti residui ed esito. Distinguere controlli eseguiti e mancanti.

**Ordine operativo:** generazione → conservazione originale → allineamento globale → verifica anatomica e alla scala reale → GIF incrementale → approvazione → posa successiva. L'impacchettamento finale riusa queste trasformazioni; non rimanda il primo allineamento alla fine della produzione.

## 5. Progettare l'azione: fasi, keyframe e tempi

**Prima i keyframe, poi gli intermedi.** Per ciascuna azione descrivere:

1. **Posa di partenza:** postura approvata, bilanciamento e punto di appoggio.
2. **Anticipazione:** preparazione fisica dell'azione, con origine del movimento riconoscibile.
3. **Caricamento:** spostamento del peso, articolazioni e orientamenti.
4. **Azione principale:** evento principale con traiettoria e ancoraggi corretti.
5. **Follow-through:** inerzia, reazione e arresto progressivo.
6. **Recupero:** ritorno a una posa plausibile o raccordo con l'animazione successiva.

Per ogni fase indicare **che cosa si muove**, **che cosa rimane ancorato**, **quali eventi iniziano/terminano**, eventuali occlusioni e durata. Un esempio numerico non è un vincolo universale: numero di frame e velocità dipendono dall'azione e dal motore.

### 5.1 Esempio illustrativo di 12 frame: Cerbero sputa fuoco

| Frame | Fase | Corpo e teste | Effetti |
| --- | --- | --- | --- |
| 1–2 | Preparazione | Baricentro stabile; colli iniziano a tendersi verso i bersagli | Nessuna fiamma |
| 3–4 | Caricamento | Teste si orientano; mandibole si aprono | Nessuna fiamma prematura |
| 5–6 | Emissione | Bocche aperte; colli ancora connessi e proporzionati | Ogni getto nasce dalla propria bocca |
| 7–9 | Massima intensità | Reazione controllata e movimento continuo | Getti si estendono lungo la direzione delle rispettive bocche |
| 10 | Arresto | Inizio della chiusura delle mandibole | Le emissioni cessano alla fonte; residui possono proseguire |
| 11–12 | Recupero | Collo e testa tornano progressivamente verso la postura di partenza | Solo eventuali particelle residue separate |

La tabella descrive una **proposta di regia**, non frame già prodotti. Se i getti non sono simultanei, dichiarare esplicitamente l'ordine delle tre bocche. Non assumere che tutte le teste debbano sempre fare esattamente lo stesso movimento.

### 5.2 Fluidità

- Distribuire pose e accelerazioni per evitare spostamenti a scatti; non ottenere un rallentamento ripetendo occasionalmente frame casuali.
- Verificare velocità angolare e traslazione anche **al passaggio tra gli ultimi frame di un ciclo e i primi del successivo**, se l'azione è in loop.
- Non confondere **numero di disegni** con **frame rate di rendering**: il motore può aggiornare la scena a frame rate elevato scegliendo e temporizzando i fotogrammi disegnati. L'interpolazione del tempo, della posizione della scena o della camera **non** autorizza interpolazioni geometriche che deformino la silhouette per inventare pose mancanti.
- Collegare l'avanzamento dell'animazione al tempo attivo della scena, non al numero di render del dispositivo, evitando divergenze 30/60/144 Hz.
- Prevedere ingressi/uscite e raccordi tra azioni diverse, non solo cicli isolati.
- Se richiesta la modalità movimento ridotto, mantenere una posa rappresentativa senza inventare nuovi effetti o modificare lo stato di gioco.

### 5.3 Metodologia professionale: pose-to-pose, breakdown e inbetweens

**Distinguere tre tipi di disegno.** Non confondere «fotogramma centrale» con «posa che spiega il movimento»:

1. **Key / extreme pose:** le posizioni e gli eventi fondamentali che definiscono azione, silhouette, peso e intenzione (per il diavolo: ali massimamente alzate e abbassate). Sono disegni approvati, non automaticamente il primo e l'ultimo frame di un loop.
2. **Breakdown:** disegno strutturale che indica **come** si attraversa l'intervallo: arco di movimento, articolazioni, orientamento delle superfici, cambio di volume apparente, occlusioni, ritardo di coda/membrane. Può trovarsi a qualsiasi posizione temporale, **non necessariamente al 50%**. Per un movimento articolato importante approvare almeno il breakdown essenziale prima di chiedere molti intermedi.
3. **Inbetween:** disegno aggiuntivo fra key e breakdown o fra due pose già valide, per ottenere lo spacing desiderato. Nella fase ricorsiva (§7.4), generare **un solo inbetween per chiamata**, controllarlo, quindi decidere se dividere di nuovo uno specifico intervallo.

**Blocking prima della rifinitura:** ricavare dalle pose principali una bozza dell'azione completa; verificare ritmo, silhouette, direzione e gerarchia del movimento alla **dimensione reale nel gioco**, prima di moltiplicare il numero di immagini o aggiungere texture fini. Nel rendering finale usare pose effettivamente disegnate, senza deformazioni mesh/rig improprie (sezione 3.1).

**Principi professionali applicati con giudizio fisico:**

| Principio | Regola operativa per Hellscape |
| --- | --- |
| **Staging** | Leggibilità e gerarchia delle sagome nel campo visivo effettivo; diavoli di sfondo non possono competere con Cerbero o coprire i pannelli |
| **Solid drawing e coerenza dei volumi** | Testa, torace, ali, veicoli e giunti conservano volume prospettico e materiali lungo la sequenza; girare in prospettiva non significa cambiare taglia |
| **Arcs** | Ancorare punti guida (spalla, gomito alare, polso, punta, testa, coda) e controllare traiettorie curve o dinamiche plausibili; evitare saltelli e cambi di asse arbitrari |
| **Anticipation** | Aggiungere preparazione **quando l'azione la richiede** (salto, morso, accelerazione), non come gesto obbligatorio a ogni ciclo di volo |
| **Follow-through / overlapping action** | Distinguere moto principale e ritardo di membrane, zampe, coda o polvere; evitare parti che si fermano tutte nello stesso istante per semplice duplicazione |
| **Secondary action** | Effetti e movimenti secondari sostengono il gesto principale, non lo occultano né ne contraddicono la causalità |
| **Slow in / slow out** | Definire spacing e durata per riflettere accelerazione e frenata; **non** assumere che intervalli uguali e frame uguali producano buon easing |
| **Timing / spacing** | Separare *quando* una posa appare dalla *distanza* tra pose, decidendo la durata totale prima del numero finale di PNG |
| **Exaggeration / appeal** | Usare accentuazioni solo se servono leggibilità e ruolo visivo, senza violare anatomia, solidità e palette; non un obbligo di stile caricaturale |
| **Squash & stretch** | Solo dove le proprietà fisiche e l'approvazione artistica lo consentono; non deformare carrozzerie metalliche, ponte o ossa per mascherare pose mancanti |

In pratica, la progettazione delle pose è **pose-to-pose** per creature e oggetti articolati. Una progressione **straight-ahead** può essere appropriata per effetti imprevedibili (fumo, fluidi, detriti), purché sorgenti e materiali rispettino i vincoli già fissati.

### 5.4 Exposure sheet/timeline: prima il tempo, poi il numero dei disegni

Per ogni azione creare un **foglio dei tempi** (X-sheet semplificato o manifest equivalente) con: ID della posa, fase (key/breakdown/inbetween), tempo di comparsa, durata di esposizione in ms, coordinate o angoli guida quando verificabili, ancoraggi, eventi e collegamento al prompt/revisione. Il documento deve permettere a Codex di riprodurre il ciclo senza decidere arbitrariamente una velocità costante.

- **On ones / on twos** sono convenzioni tradizionali: un disegno esposto per uno o due intervalli della timeline; **non** prescrivono di produrre 24 o 12 PNG al secondo. Nel gioco utilizzare durate in ms, indipendenti dal refresh display.
- **Holds**: mantenere intenzionalmente una posa può enfatizzare anticipazione o estremi; indicare il tempo di mantenimento, senza aggiungere copie dello stesso file PNG.
- **Spacing**: più pose vicine nello stesso tempo rendono il moto localmente più lento; il ritmo dipende anche dal tempo di esposizione. Non confondere densità spaziale, numero di file e frequenza di rendering.
- **Loop**: verificare raccordo di posizione **e** tendenza di velocità; evitare doppia esposizione involontaria degli estremi nella riproduzione ping-pong.
- **Inversione del movimento**: riutilizzare gli stessi PNG in ordine inverso solo se postura, deformazione di membrane e follow-through lo rendono credibile; consentire un timing distinto per la risalita.
- **Effetti e contatti**: annotare gli istanti dei suoni, fiamme, polvere, impatti e momenti di contatto in modo sincronizzato con le pose.

Un ciclo con pochi disegni ben temporizzati può essere migliore di uno con molte pose incoerenti. Il generatore non deve decidere autonomamente numero dei frame, speed curve o collocazione di eventi senza un brief o una motivazione esplicita.

### 5.5 Controlli di disegno professionali: flip, onion skin e silhouette

Dopo la normalizzazione obbligatoria di ogni output (§4.1), controllare ogni key, breakdown e inbetween:

1. Eseguire **flip/alternanza rapida** tra pose adiacenti e controllo **onion skin** semitrasparente su corpo e giunti. Lo scopo è scoprire drift del pivot, parti che cambiano lunghezza, tremolio di contorni e salti tra livelli.
2. Sovrapporre landmark/traiettorie nella medesima referenza geometrica; dichiarare quando i landmark sono annotati manualmente o solo stimati. Il generatore di immagini **non** fornisce automaticamente uno scheletro verificato.
3. Valutare la **silhouette** senza micro-dettagli, la direzione della luce e la leggibilità nel fondale effettivo; controllare il soggetto ingrandito per gli errori e ridotto alla dimensione logica di gioco per l'uso reale.
4. Controllare l'**ingombro delle pose estreme prima dell'esportazione** (ali, punte, corna, code, fiamme); aggiungere padding e poi verificare davvero l'alfa, senza confondere la finta scacchiera con la trasparenza.
5. Confrontare un primo **blocking GIF** delle pose chiave con la timeline prevista, prima di produrre inbetweens. La GIF locale è prova del materiale grafico, **non** prova del runtime.

## 6. Effetti: causalità, origine, direzione, sincronizzazione

Gli effetti hanno un **generatore** fisico o narrativo visibile. Alcune regole analoghe:

| Effetto | Ancoraggio necessario |
| --- | --- |
| Fiamma sputata | Interno della bocca dalla quale è emessa |
| Proiettile | Bocca della canna dell'arma |
| Colpo con un artiglio | Artiglio che colpisce, poi punto di contatto |
| Polvere di corsa | Terreno in corrispondenza dell'appoggio |
| Scintilla di impatto | Punto effettivo di contatto |
| Scia di veicolo | Punto di scarico, pneumatico o altra origine dichiarata |

La direzione iniziale deriva dall'orientamento dell'ancoraggio, con eventuale successiva dinamica indipendente (gravità, vento, traiettoria balistica) **solo dopo l'emissione**. Nessun effetto può comparire prima dell'evento che lo causa, salvo anticipazioni esplicitamente progettate e riconoscibili.

### 6.1 Regola inderogabile delle correzioni

Se una fiamma nasce in un punto sbagliato:

1. mantenere la testa nel punto approvato;
2. individuare la bocca effettiva in quel frame;
3. **spostare o rigenerare la fiamma** affinché parta da quella bocca;
4. adattare la direzione del getto all'orientamento anatomico;
5. verificare i frame prima e dopo.

**Non spostare la testa verso una fiamma disegnata male.** Non spostare colli, zampe o altri elementi già corretti solo per nascondere l'errore. Correggere il minimo elemento responsabile, preservando la continuità dell'intera sequenza.

### 6.2 Cerbero: tre bocche, tre origini

Per ciascuna testa definire un ancoraggio distinto. In ogni frame con emissione, controllare che:

- il getto sinistro nasca dalla **bocca della testa sinistra**, anche quando è più bassa rispetto alle altre;
- il getto centrale nasca dalla bocca centrale;
- il getto destro nasca dalla bocca destra;
- le tre sorgenti rimangano allineate alle tre bocche durante qualsiasi rotazione o traslazione;
- nessuna terza fiamma appaia in un punto vuoto soltanto perché lì era stata disegnata in un precedente tentativo.

La distinzione sinistra/centro/destra è **anatomica**, riferita alla creatura; annotare la corrispondenza con la vista sullo schermo per evitare inversioni.

## 7. Pipeline di produzione

1. **Analizzare gli asset già approvati** e registrare i riferimenti. Non prendere come nuova fonte una variante respinta.
2. **Bloccare gli invarianti:** anatomia, rapporti dimensionali, stile, camera, pivot e palette.
3. **Preparare schema articolare e ancoraggi** (almeno una scheda o tracciato con nomi persistenti), senza introdurre skinning o mesh animate come metodo sostitutivo.
4. **Disegnare i keyframe**; controllare anatomia, sovrapposizioni e silhouette.
5. **Disegnare gli intermedi** usando riferimenti anatomici costanti e keyframe approvati; non generarli deformando la singola immagine statica. Confrontare sistematicamente frame adiacenti.
6. **Creare gli effetti su livelli separati**, quando tecnicamente fattibile, collegati agli ancoraggi al runtime.
7. **Montare e riprodurre l'azione** alla velocità effettiva, verificando onset, durata e recupero.
8. **Controllare la qualità** con overlay/onion skin, controlli geometrici e riproduzione integrale.
9. **Esportare e integrare** foglio sprite, eventuali effetti e metadati; non rimpiazzare asset approvati prima della revisione.
10. **Acquisire prove reali** dal browser o dalla build pertinente e preparare la PR per approvazione.

Quando la tecnologia di generazione non garantisce vincoli esatti, eseguire correzioni mirate ai **disegni dei frame**, eventualmente componendo livelli statici coerenti; non usare la composizione per introdurre un rig deformabile nascosto. **La qualità verificata prevale sulla comodità di generare l'intera spritesheet in un solo passaggio**.

### 7.1 Gate di approvazione e fallback non autorizzati

Per una **nuova animazione complessa**, procedere in due fasi verificabili:

1. **Fase artistica:** storyboard, pose chiave, fotogrammi intermedi e spritesheet completo. Presentare i frame rappresentativi e ottenere l'approvazione **prima** di integrarli.
2. **Fase tecnica:** implementare playback, timing, transizioni, eventi, camera e collisioni sul materiale approvato; raccogliere una **GIF reale** dal browser e screenshot dei punti critici, secondo AGENTS.md.

Non dichiarare «animazione completata» perché il codice gira o supera test unitari. Se non è possibile generare i frame approvabili, fermare la parte artistica, elencare gli asset mancanti e proporre alternative **solo come opzioni da approvare**. Non sostituire tacitamente con rig, mesh, CSS transform, deformazioni, un'animazione temporanea spacciata per finale o ripetizioni di un frame.

Per correzioni minori a un effetto già approvato, evitare burocrazia inutile: aggiornare solo i frame interessati e le evidenze proporzionate al cambiamento, senza bypassare i vincoli anatomici e materiali.

### 7.2 Workflow operativo ChatGPT → Codex: dalla creazione del personaggio all'animazione

**Divisione dei ruoli:** ChatGPT e gli strumenti di creazione/modifica immagini producono e correggono **una posa per volta** per anatomie articolate; Codex è responsabile di automazione, controlli, impacchettamento e integrazione nel motore. Codex **non** deve improvvisare il disegno anatomico tramite trasformazioni runtime. Le immagini generate dall'IA possono presentare variazioni tra frame e richiedono revisione o ritocco: non presumere coerenza automatica solo perché condividono il prompt.

| Fase | Responsabile principale | Output obbligatorio | Gate prima della fase successiva |
| --- | --- | --- | --- |
| 0. Audit del gioco | ChatGPT + Codex | Analisi reale di camera, viewport, profondità, ruolo, asset canonici, rendering, screenshot e scala finale (sezione 2.1) | Scheda contestuale verificata, ipotesi segnalate |
| 1. Brief e vincoli | ChatGPT + utente | Scheda del soggetto: identità, anatomia/parti, silhouette, materiali, palette, prospettiva, risoluzione effettiva, azioni richieste | Requisiti fissati |
| 2. Design canonico | ChatGPT + strumento immagini | Immagine di riferimento approvata e, se necessario, viste ortogonali/tre quarti e dettagli; percorso/versione asset | **Approvazione del design statico**, senza redesign nelle fasi successive |
| 3. Blocking, key e timing | ChatGPT | Storyboard, estremi A/B, silhouette, traiettorie/landmark e **X-sheet** (durate, eventi, direzione, easing); anticipazione/follow-through se pertinenti | Approvazione del piano di movimento e dei tempi |
| 4. Key e breakdown incrementali | ChatGPT + editing immagini | **Un PNG alla volta**: A, B, poi breakdown; prompt/reference, originale immutato, normalizzazione e rapporto §4.1, GIF §7.6 | Verifica tecnica e artistica della posa allineata e del percorso prima di procedere |
| 5. Inbetweening selettivo | ChatGPT + editing/ritocco assistito | **Un frame per chiamata** fra pose approvate; flip/onion skin, refiner solo sugli intervalli critici, aggiornamento X-sheet e report difetti | **Approvazione dei singoli PNG e del loop locale**; niente warp/mesh/rig come surrogato |
| 6. Preparazione tecnica | Codex | Asset finali impacchettati in spritesheet/atlante, metadata per frame (durata, canvas, pivot, ancoraggi, evento), nomi e versioni stabili | Controlli di dimensioni, trasparenza, margini, tagli, allineamento e riferimenti |
| 7. Implementazione runtime | Codex | Riproduzione dei frame disegnati, macchina a stati, transizioni, effetti legati agli ancoraggi, velocità e spostamento nel mondo, telecamera separata | Test di timing indipendente da FPS, input, pause, persistenza, collisioni |
| 8. Validazione reale e consegna | Codex + ChatGPT + utente | GIF **acquisita dal gioco nel browser**, screenshot dei punti chiave, test desktop/mobile, PR con diff ed evidenze | Approvazione esplicita **prima** del merge |

#### Regole di handoff e responsabilità

- **Una sola azione alla volta.** Un personaggio può richiedere atlas separati per idle, camminata, corsa, attacco, morso, morte e raccordi. Non costruire tutta la pipeline prima che almeno un'azione completa sia stata approvata.
- **Il riferimento approvato è immutabile per default.** Ogni nuova posa deve derivarne per identità e anatomia; eventuali variazioni del design richiedono approvazione separata.
- **Una singola immagine non è uno spritesheet funzionante.** Per azioni anatomiche complesse produrre effettivamente le pose; una griglia artificiale di duplicati o ritagli deformati non soddisfa la consegna.
- **Ritaglio e atlas non equivalgono al disegno.** Codex può automatizzare import, crop, padding, ordinamento dei PNG, naming, packing e generazione di JSON, ma non è autorizzato a creare movimento piegando o scalando le parti del soggetto.
- **Controllo alla scala finale.** Verificare a dimensione di gioco leggibilità delle silhouette, qualità dei dettagli e continuità; il file ad alta risoluzione da solo non attesta qualità nel renderer.
- **Ancoraggi e allineamento.** Piedi, ruote e contatti utilizzano coordinate e pivot per-frame coerenti; lo spostamento nel mondo non viene disegnato duplicando coordinate nello spritesheet. Il renderer posiziona ogni frame sul medesimo riferimento.
- **Materiali prima del movimento.** Una testa/arto si articola anatomicamente; un telaio metallico si muove rigidamente, mentre le sospensioni e gli pneumatici lavorano in modo differenziato. Non trasferire squash/stretch da un soggetto organico a un veicolo.
- **Effetti su livelli separati** quando la causalità lo richiede (fiamme, polvere, scintille), ancorati a bocche, pneumatici o contatti nei singoli frame e sincronizzati con gli eventi.
- **No asset, no falso completamento.** Se ChatGPT o gli strumenti a disposizione non riescono a generare frame soddisfacenti, segnalare quali mancano; non passare automaticamente a transform CSS, mesh o rigging procedurale. Proporre un artista o un editor di sprite come soluzione produttiva, non dichiarare realizzata la sequenza.
- **Test visivi obbligatori.** I controlli automatici integrano ma non sostituiscono la revisione umana. Nessun merge finché l'utente non approva gli asset e la GIF reale di gioco.

#### Esempio concreto: Cerbero e veicoli di Hellscape

Per **Cerbero** creare distinte sequenze disegnate di locomozione, slancio, emissione di fiamme, morso/sbranamento, recupero e sprint. Ogni frame mostra teste, colli, busto e zampe connessi. La fiamma nasce da una bocca con ancoraggio identificato; l'attacco modifica corpo e postura, non solo la rotazione della testa. La telecamera segue il movimento nel mondo e deve poter risultare ferma mentre Cerbero sbrana il bersaglio: non muovere il ponte solo per fingere avanzamento.

Per **i veicoli** mantenere stabile la sagoma rigida della carrozzeria; animare ruote, sospensioni, inclinazioni del telaio e spostamento rispetto al mondo. Vietata la contrazione/dilatazione orizzontale del mezzo per simulare velocità.

### 7.3 Strategia di generazione: una posa per volta come default

**Precedenza esplicita (rettifica della v5):** per personaggi, creature, anatomie complesse e veicoli con parti articolate **non** richiedere al generatore l'intero spritesheet come prima operazione. Il flusso autorizzato è: design canonico → key/extremes A e B **una per volta** → breakdown che definisce la traiettoria → singoli inbetweens ricorsivi, uno per chiamata → verifica → atlante. **Non saltare i gate** per produrre più velocemente un output finale.

**Quando è ammessa una generazione multiposa?** Solo come studio esplorativo esplicitamente etichettato (non come asset approvato) oppure per sequenze elementari/effetti non anatomici dopo valutazione dei rischi, **mai** al posto della generazione incrementale concordata per un asset. Anche una griglia molto convincente non equivale a una verifica di continuità anatomica.

**Output del singolo passaggio:** un PNG del soggetto completo e isolato, senza scena, testo o griglia; preferire il canale alpha reale quando disponibile e verificabile. Orientamento, proporzioni, camera e stile devono essere coerenti col riferimento. Normalizzare scala, pivot e canvas secondo §4.1 prima del confronto, senza pretendere identità pixel per pixel. Salvare reference, prompt effettivo, risultato e criterio di accettazione nella cartella per-asset definita in §8.1 **prima del passo successivo**.

**Atlante finale:** soltanto dopo aver approvato i singoli PNG, Codex li ordina, riusa l'allineamento già verificato secondo §4.1, controlla margini comuni, esporta atlas e JSON di tempi/ancoraggi, produce GIF locale e verifica alpha/ritagli. La riproduzione nel gioco sarà attestata da **GIF registrata dal browser** come da AGENTS.md.

**Soglia di fallimento:** sfondo illustrato invece di alpha, redesign, arti flottanti, estremo non raggiunto, più pose quando se ne richiedeva una, parti tagliate o anatomia errata = **tentativo respinto**, non «quasi pronto». Correggere un solo vincolo difettoso per iterazione; conservare errore e prompt per tracciabilità. Non produrre una nuova tavola di 12–16 pose come rimedio a una singola posa fallita.

### 7.4 Inbetweening ricorsivo adattivo e verifica misurabile

**Ambito e precedenza.** Questa è la **procedura ordinaria obbligatoria** per azioni articolate (§7.3): key pose A/B prima, breakdown espliciti, poi generazione ricorsiva di singoli inbetweens, un'immagine per chiamata. Il metodo della v5 basato su un'intera spritesheet generata subito è superato per queste azioni. Non è necessario generare tutti i frame in una sola richiesta. Per cicli reversibili semplici è sufficiente disegnare una sola tratta e riprodurla anche al contrario; per azioni non reversibili disegnare tratte distinte.

**1. Pose estreme.** Disegnare e approvare A e B, per esempio ali in massima elevazione e massima discesa. Annotare reference, camera, pivot, articolazioni, materiali, angoli e coordinate indicative. Le due pose devono riguardare **lo stesso identico soggetto** e la medesima vista.

**2. Breakdown prima degli intermedi.** Pianificare e approvare la posa di passaggio che esplicita l'arco anatomico fra A e B; successivamente generare M fra due pose di riferimento approvate come *nuovo disegno anatomicamente corretto*, non come fusione, crossfade, interpolazione dei pixel o mesh warping. La posizione temporale di M può essere 50%, 25%, 70% o altra frazione motivata dalla dinamica; **metà del tempo non implica metà dello spostamento**.

**3. Suddivisione selettiva.** Analizzare A→M e M→B e ripetere solo dove esistono discontinuità o lacune visivamente rilevanti. Non imporre suddivisioni uniformi o potenze di due: negli intervalli lenti si possono usare più pose ravvicinate o durate più lunghe, in quelli rapidi meno pose o durate più brevi, purché leggibilità, continuità e tempo totale siano preservati.

**4. Inversione quando lecita.** Per un battito d'ali semplificato e dichiaratamente reversibile usare A→…→B→…→A, riutilizzando i frame intermedi all'indietro **senza duplicare gli estremi nel ciclo**. La risalita può avere timing differente dalla discesa. Se aerodinamica, piegamento delle membrane, inerzia, anticipazione o follow-through richiedono pose differenti, l'inversione è un prototipo e occorre disegnare il ritorno separatamente.

**5. Separare geometria e timing.** Il numero di immagini non determina da solo velocità e accelerazione: conta la successione delle pose **insieme** alla loro durata e distanza. Registrare durata per-frame o timestamp indipendenti dalla frequenza di refresh, ed evitare di aggiungere immagini per simulare uno stop che può essere una posa mantenuta. La fluidità non è massimizzare gli FPS o il numero di disegni.

**6. Valutazione con misure e giudizio umano.** Utilizzare controlli oggettivi quando l'informazione è verificabile, segnando espressamente il livello di affidabilità:

| Controllo | Misura o evidenza | Limite e uso |
| --- | --- | --- |
| Integrità dei file | PNG RGBA con alfa, dimensioni uniformi, bordo senza ritagli, asset caricabili | Automatizzabile; non dimostra anatomia |
| Proporzioni e topologia | Distanze fra landmark annotati di spalle, colli, giunti alari, punte, busto; conteggio e connessioni | Richiede annotazione o stima robusta dei landmark; non dedurre articolazioni dalla sola bounding box |
| Continuità geometrica | Spostamento di landmark tra due pose nel tempo, rotazioni e differenze di sagoma/area | Differenze di silhouette sono *segnali di revisione*, non automaticamente difetti |
| Velocità/accelerazione | Differenze prime e seconde di posizione/angolo divise per il tempo effettivo per-frame | Calibrare con la dinamica desiderata; salti bruschi possono essere intenzionali |
| Loop | Continuità fra ultimi/primi frame e assenza di duplicazioni o pause inattese agli estremi | Verificare anche la continuità dei movimenti, non solo la posizione |
| Materiali | Stabilità delle parti rigide, deformazione consentita delle membrane, articolazioni e contatti | Controllo semiautomatico + supervisione visiva |
| Scala e ruolo | Test nell'inquadratura reale alle dimensioni d'uso e su fondo contrastante | Essenziale per un diavolo di sfondo; misure su file grande non bastano |
| Evidenza dinamica | GIF ricavata esattamente dai PNG e, dopo integrazione, **GIF acquisita dal browser** | Distinguere la prova locale dal test nel motore di gioco |

**7. Criterio di raffinamento.** Aggiungere un frame soltanto per colmare una lacuna identificata (intervallo con spostamento eccessivo, anatomia implausibile, accelerazione discontinua, sfarfallio, salto di scala, loop sbagliato). Documentare il difetto, la modifica e l'esito. Se un intervallo appare già fluido alla scala reale e passa i controlli, **non** aggiungere fotogrammi senza necessità. Le soglie non devono essere numeri universali arbitrari; stabilirle da un ciclo modello approvato o con prove alla scala del gioco.

**8. Gate tecnico e artistico distinti.** I controlli automatici possono respingere file corrotti o incoerenti e segnalare sospette discontinuità; non possono certificare da soli anatomia, peso, aerodinamica o qualità stilistica. La revisione umana approva la resa delle azioni, non dovrebbe essere usata per compensare errori tecnici evidenti.

#### Applicazione di prova al diavolo volante

- Analizzare la sequenza preesistente e registrare il risultato come **baseline**, distinguendo dati calcolati da valutazioni artistiche.
- Selezionare due estremi anatomicamente corretti (ali alte/ali basse); se la sequenza preesistente non ne contiene uno, **non spacciarla per completa** e creare il nuovo estremo.
- Generare almeno una posa mediana effettiva fra i due estremi approvati; verificare spalle, ossa alari, membrane, corpo, coda, testa e prospettiva.
- Costruire un primo loop con riproduzione in avanti e all'indietro, timestamp documentati e senza frame estremi duplicati nel passaggio.
- Produrre estrazione PNG, GIF e report di misure/limiti; **nessuna integrazione nel gioco e nessun merge prima dell'approvazione**.

### 7.5 Capacità e limiti operativi del generatore di immagini

Le istruzioni sono formulate in base a ciò che un generatore di immagini **può tentare**, senza attribuirgli strumenti o garanzie non disponibili:

| Compito | Uso ammesso del generatore | Cosa NON considerare garantito |
| --- | --- | --- |
| Creare una posa singola | Generare un'immagine completa descrivendo anatomia, vista, angoli e silhouette | Riprodurre esattamente il modello approvato o una posa insolita al primo tentativo |
| Modificare una reference | Usare la figura canonica come input visivo quando lo strumento supporta immagini di riferimento/edizioni | Mantenere perfettamente pixel, scala, pivot, palette e numero delle parti |
| Generare un inbetween | Fornire **entrambe** le pose approvate e l'intento di movimento, chiedendo **una sola** posa intermedia disegnata | Interpolazione geometrica esatta al tempo t, movimento 3D corretto o determinismo |
| Fondo trasparente | Richiedere PNG con alpha quando supportato | L'alpha reale: verificare il file, non fidarsi della scacchiera apparente |
| Controllare traiettoria | Descrivere spalle/giunti, archi e occlusioni, eventualmente aggiungere una scheda di costruzione | Obbedienza millimetrica, coordinate verificabili o vincoli biomeccanici incorporati |
| Generare più pose | Possibile per **bozzetti esplorativi** oppure effetti semplici non articolati | Una spritesheet pronta o un set di frame indipendenti con anatomia garantita |
| Timing, pivot, tests | Il modello può **proporre** tempi/ancoraggi, non certificarli | Misura oggettiva senza landmarks e strumenti; spettano a script, editor e revisione |
| Correggere un errore | Modificare **un frame** indicando l'elemento responsabile (ala, membrana, effetto) e ciò che resta invariato | Assenza di modifiche collaterali: ogni retake va confrontato con il precedente |

**Regola delle istruzioni:** chiedere esplicitamente **una** immagine quando il gate richiede una posa, e dichiarare fase, estremi visivi, quota o orientamento richiesto e parti intoccabili. Non scrivere «16 frame», «spritesheet» o «tutte le fasi» nella richiesta che mira a un singolo disegno. Non inviare prompt generici che permettano al generatore di reinterpretare il soggetto senza ancoraggi. Quando lo strumento non accetta realmente due immagini in un'unica operazione, **non** dichiarare di aver usato entrambe; produrre una scheda di confronto o usare un editor/strumento che supporti il caso.

**Regola del retake:** dopo un esito non conforme non avanzare alla fase successiva. Identificare **il difetto principale**, mantenere il riferimento corretto, riscrivere il prompt per il solo frame fallito e chiedere nuovamente la medesima posa. Limitare tentativi ripetitivi con lo stesso prompt senza nuove informazioni; se non si raggiunge la posa, segnare il blocco e usare un editor di sprite o un artista per il ridisegno prima di proseguire. Non trasformare una prova fallita in un attestato di «metodo ricorsivo non riuscito» se la procedura non è stata eseguita.

**Tracciabilità reale:** salvare il **testo di istruzione esplicito** e i riferimenti realmente forniti; se il servizio non espone il prompt interno o altri parametri, dichiarare il limite nel log, senza inventare un prompt retrospettivo. L'output del generatore è un **candidato da validare**; Codex controlla bitmap/tempi/packing e l'utente approva i risultati artistici. Queste condizioni valgono anche quando il modello produce immagini visivamente persuasive.

### 7.6 GIF incrementale obbligatoria a ogni fotogramma (30/10/2026)

Disposizione utente: «per ogni fotogramma che crei produci una GIF che mostra la transizione da uno all'altro».

- Dopo ogni PNG candidato nuovo o corretto, prima di chiedere approvazione o generare il successivo, produrre e mostrare una GIF ricavata dai PNG effettivi: alternanza della nuova posa e del riferimento/adiacente pertinente e, quando disponibile, sequenza progressiva aggiornata. Per gli inbetween mostrare entrambi i vicini.
- Prima di ogni GIF eseguire l'allineamento globale obbligatorio del §4.1: riferimenti corporei stabili, scala uniforme, padding comuni e trasformazioni documentate. Non adattare separatamente arti o sagome per mascherare difetti.
- Nessuna dissolvenza, morphing, mesh o deformazione per simulare fotogrammi mancanti. Distinguere una GIF diagnostica a due estremi, che può mostrare salti, dal loop finale con timing approvato.
- Documentare PNG sorgenti, versione, stato candidato/respinto/approvato, ordine, durate, scala e correzioni. Mostrare anche i tentativi respinti quando servono a capire il difetto. La GIF locale non sostituisce la GIF browser dopo l'integrazione.
- Confrontare esplicitamente lunghezza e numero dei segmenti delle ali e degli arti, dimensioni del corpo e topologia delle membrane. Fori, strappi e segni distintivi seguono lo stesso lembo di membrana tra pose; non spariscono o si rigenerano casualmente.
- Dopo un difetto tecnico o anatomico, segnare la posa respinta e non usarla come base approvata per gli intermedi. Correggere il riferimento se la richiesta modifica anche il design; poi ottenere l'approvazione della revisione.

## 8. Asset, struttura tecnica e metadati

La consegna può comprendere, secondo le necessità:

- reference sheet canonico e sua revisione;
- scheda di rig/ancoraggi con identificatori non ambigui;
- keyframe approvati e sprite sheet finale con frame omogenei;
- livelli separati per fuoco, particelle, impatti e altre emissioni;
- metadati per durata dei frame, pivot, origine, bounding box e ancoraggi;
- anteprima reale animata, screenshot degli stati chiave e rapporto di verifica;
- indicazione esplicita di **asset sostituiti**, **asset mantenuti** e **nuovi asset**.

Il formato dei metadati è scelto secondo lo stack effettivamente presente; un possibile **schema illustrativo, non ancora implementato**, è:

~~~json
{
  "character": "cerbero",
  "action": "fire_breath",
  "source_reference": "PERCORSO_E_REVISIONE_DA_COMPILARE",
  "frame_size": [0, 0],
  "origin": "pivot_corpo",
  "frames": [
    {
      "index": 1,
      "duration_ms": 0,
      "anchors": {
        "mouth_left": [0, 0],
        "mouth_center": [0, 0],
        "mouth_right": [0, 0]
      },
      "events": []
    }
  ]
}
~~~

**I valori a zero sono placeholder, non coordinate valide per il gioco.** Codex deve derivare valori reali dagli asset accettati. Non imporre questo schema se il renderer attuale dispone già di un sistema equivalente.

Rispettare trasparenza, padding di sicurezza, ordinamento dei livelli, qualità percepita uniforme e risoluzione coerente con il progetto. Non alterare manualmente build/artefatti generati se la pipeline li ricrea.

### 8.1 Repository per ogni asset animato: branch temporaneo e fascicolo di produzione

Questa procedura è **vincolante** quando si crea, si modifica o si rigenera un asset animato (diavolo volante, Cerbero, veicolo, effetto o altro). Si applica a ChatGPT, Codex, Work e operatori manuali.

**Branch e PR**
1. Prima di generare il primo candidato dell'asset, creare un **branch temporaneo** dal `main` aggiornato, nominato `asset/<soggetto>-<azione>-vN` (per esempio `asset/diavolo-volante-volo-v1`). Un branch per asset/azione coerente, **non** uno per ogni fotogramma; le altre lavorazioni rimangono isolate.
2. Creare una PR **in bozza** per consentire il monitoraggio della cronologia dei commit. Il branch non è permanente e la PR rimane non mergiata fino all'approvazione esplicita dell'utente.
3. Prima di qualunque nuova generazione, salvare nel branch **il prompt che verrà effettivamente inviato**, associato alla sua versione e ai file di riferimento. Dopo l'esito, salvare il risultato, i dati disponibili del generatore e la valutazione. Non aggiornare retroattivamente il testo per farlo sembrare conforme al risultato.
4. Eseguire le generazioni in maniera **incrementale**, rispettando §7.4: A, B, poi **un** intermedio M alla volta; ogni tentativo come nuova versione tracciata. La presenza della cartella non autorizza a ripiegare su una spritesheet completa.
5. Terminati i controlli, approvazione esplicita → merge della PR → eliminazione del branch temporaneo. **Solo `main` rimane permanente.** In caso di lavoro abbandonato, chiudere la PR e valutare quali registrazioni o immagini occorra preservare nel `main` prima di cancellare il branch.

**Struttura standard da creare nel branch** (adattare solo quando il repository usa già una struttura equivalente; non duplicare asset canonicali):

~~~text
assets/hell-race/production/<slug-asset>/
├── README.md
├── manifest.json
├── references/
│   └── <design-canonico-e-contesto>.png
├── prompts/
│   ├── 001_posa_A.md
│   ├── 002_posa_B.md
│   ├── 003_posa_M.md
│   └── ...
├── candidates/
│   ├── 001_posa_A_v1.png
│   ├── 002_posa_B_v1.png
│   ├── 003_posa_M_v1.png
│   └── ...
├── approved/
│   ├── pose_A.png
│   ├── pose_B.png
│   └── <intermedi-approvati>.png
├── spritesheet/
│   ├── <asset>_sheet_v1.png
│   ├── <asset>_sheet_v1.json
│   └── <asset>_loop_verifica.gif
└── reports/
    ├── verifica_tecnica_v1.md
    └── verifica_loop_v1.md
~~~

`references/` può contenere una copia controllata o un **rimando verificabile** a un asset già presente, con path e SHA/versione; non serve duplicare grandi file. `approved/` contiene **solo** immagini esplicitamente approvate. Le GIF locali provano il loop dei PNG, mentre la GIF catturata dal browser è richiesta **dopo l'integrazione**, come da AGENTS.md.

**README obbligatorio.** Documentare soggetto e azione, ruolo, posizione e piano della scena, orientamento della camera, scala effettiva, immagine canonica, limiti anatomici, stato (concept / A / B / M / ciclo / integrazione), decisioni di approvazione e problemi noti. Non descrivere «approvato» un candidato soltanto perché è stato generato.

**Prompt: registrazione rigorosa e riproducibile.** Ogni `prompts/NNN_<fase>.md` deve indicare:

| Campo | Contenuto |
| --- | --- |
| Identificatore e obiettivo | ID progressivo immutabile, fase A/B/M, intervallo temporale o posizione, versione |
| Input | Percorsi e revisioni di **tutte** le immagini di riferimento; per M indicare in modo esplicito A e B |
| Istruzione inviata | **Testo esatto del prompt esplicito effettivamente passato allo strumento**, senza parafrasi o revisioni retroattive |
| Parametri disponibili | Modello/servizio se noto, impostazioni disponibili (trasparenza, dimensioni, seed se esposto), data, tool e ID generazione quando restituiti |
| Output | Percorso esatto del PNG prodotto, dimensioni, trasparenza verificata, hash SHA-256 se calcolabile |
| Esito | candidato / respinto / approvato; difetti identificati, controlli eseguiti, decisione e riferimento ai commit/PR |
| Correzione | Nuovo tentativo collegato al precedente; che cosa cambia e perché, preservando il prompt storico |

Se il generatore combina automaticamente contesto visivo o istruzioni non esposte, **non affermare di aver registrato il prompt interno completo**: salvare fedelmente l'istruzione esplicita disponibile e indicare quali dettagli dell'elaborazione non sono accessibili. Se il prompt esatto di un risultato storico non è recuperabile, marcarlo **«prompt non disponibile»**; una ricostruzione non può essere presentata come originale.

**Manifest e collegamenti.** `manifest.json` collega ogni PNG al suo prompt ID, riferimento sorgente, versione, SHA ove disponibile, stato e posizioni/durate previste. Ogni frame approvato deve avere una catena navigabile **input → prompt → PNG candidato → verifica → approvazione → atlas/loop**. Per le generazioni ricorsive, dichiarare anche l'intervallo padre (A–B, A–M ecc.).

**Politica di pulizia.** Durante la PR, conservare i PNG candidati collegati a prompt e valutazioni per rendere possibili ispezioni e riproduzioni. Prima del merge rimuovere duplicati identici, output intermedi obsoleti e file voluminosi privi di valore, ma conservare nel `main` **i prompt rilevanti, i frame approvati, i fallimenti diagnostici essenziali e il resoconto delle decisioni**. Se una candidata respinta è indispensabile per capire un errore, non cancellarla senza una copia o un riferimento durevole: dopo l'eliminazione del branch non fare affidamento su commit irraggiungibili. La cronologia Git non sostituisce un registro di prompt accurato.

**Gate di pubblicazione.** La presenza di un pacchetto di file non attesta il completamento: nessun merge e nessuna sostituzione di asset in uso senza verifiche tecniche, test alla dimensione reale, evidenze visive e approvazione. Non committare un artefatto fittizio per soddisfare la struttura richiesta; segnalare le voci non ancora disponibili.

## 9. Verifiche e criteri di accettazione

### 9.1 Ispezione visiva obbligatoria

- [ ] La stessa identità è riconoscibile in tutti i frame.
- [ ] Il numero di teste e arti è coerente (incluse le occlusioni).
- [ ] Proporzioni e lunghezze relative non cambiano accidentalmente.
- [ ] Nessuna testa o parte corporea fluttua senza connessione.
- [ ] La prospettiva e i punti di appoggio sono coerenti.
- [ ] La sequenza anatomica complessa è composta da frame realmente disegnati; non da parti ruotate/deformate per sostituire i disegni.
- [ ] Il comportamento di ogni oggetto è coerente con i materiali: nessuno squash/stretch orizzontale della carrozzeria o delle strutture rigide.
- [ ] Deformazioni, danni e oscillazioni hanno origine fisica leggibile e conseguenze coerenti.
- [ ] Ogni effetto nasce nel punto corretto, nel momento corretto.
- [ ] Gli effetti seguono i rispettivi ancoraggi durante il movimento.
- [ ] I frame intermedi non hanno salti visivi o deformazioni gratuite.
- [ ] Nessuna parte necessaria è tagliata dal canvas.
- [ ] Primo/ultimo frame e transizioni tra azioni sono raccordati.
- [ ] Stile, palette, dettaglio e nitidezza sono uniformi.
- [ ] La sequenza riprodotta alla velocità reale risulta fluida.

### 9.2 Verifiche automatiche consigliate (quando realizzabili)

- Dimensioni, alpha, padding, numero di frame, nomi e metadati validi.
- Ancoraggi esistenti per ogni frame che li richiede; identificatori stabili.
- All'inizio di un evento di emissione: origine dell'effetto coincidente con l'ancoraggio entro la tolleranza geometrica esplicitamente definita.
- Discontinuità di centro, pivot e angoli superiori a soglie calibrate sulla specifica azione segnalate, non corrette automaticamente a tentativi.
- Asset caricate correttamente, rendering e velocità indipendenti dal frame rate.
- Nessuna regressione sui meccanismi già presenti: motore, salvataggi, animazioni approvate, UI e prestazioni.
- Analisi mirata delle trasformazioni non uniformi (`scaleX`, `scaleY`, `skew`), mesh, vertex warp e runtime rig sugli sprite per **segnalare a revisione** possibili violazioni; non vietare automaticamente l'uso legittimo di queste tecniche per UI, effetti e componenti deformabili autorizzati.

I test di componenti connessi e sagome isolate sono **ausiliari**: non dimostrano da soli che l'anatomia sia corretta. Occorre una verifica visiva della sequenza. Soglie numeriche non arbitrarie devono essere determinate sui riferimenti reali.

### 9.3 Evidenze da consegnare per Hellscape

Seguire **AGENTS.md**: per animazioni, movimento e transizioni, **GIF animata reale acquisita dal browser** sulla stessa revisione; screenshot reali per stati statici. Nessun HTML incorporato o file HTML allegato come anteprima. Indicare viewport, durata, revisione e se la prova è desktop o mobile. Non dichiarare controlli che non sono stati eseguiti. Se è stato prodotto solo il documento e nessun asset è stato modificato, dichiararlo: **non fabbricare una falsa GIF**.

Nessun merge senza esplicita approvazione dell'utente.

## 10. Riparazione di errori senza redesign

Classificare il difetto in modo causale:

| Difetto | Riparazione |
| --- | --- |
| Fiamma lontana dalla bocca | Agganciare il getto alla bocca; non muovere la testa per inseguire il getto. |
| Testa flottante | Ripristinare l'attacco collo/testa e il percorso articolare, preservando la posa canonica. |
| Arto scomparso o duplicato | Ricostruire continuità e corretto ordinamento/occlusione, senza cambiare numero di arti. |
| Forma differente tra frame | Riprendere proporzioni dal rig approvato; rigenerare solo i frame difettosi. |
| Movimento a scatti | Correggere disegni intermedi, timing o clock; non nascondere il problema con frame ripetuti o warp elastico. |
| Morso con testa ruotata o staccata | Ridisegnare la sequenza di pose complete, incluse mandibola, collo e busto, senza ritagli e rotazioni artificiali. |
| Veicolo che si allunga/accorcia durante la marcia | Eliminare lo squash/stretch e animare ruote, sospensioni e posizione/orientamento del corpo rigido. |
| Testa o corna tagliate | Adeguare padding o inquadratura senza rimpicciolire arbitrariamente il personaggio. |
| Qualità disomogenea | Uniformare risoluzione e stile degli asset, verificando la resa alle dimensioni effettive. |

Dopo ogni correzione ricontrollare **il frame interessato e i due adiacenti**, oltre all'animazione intera. Non cambiare spontaneamente il design, la posizione delle teste già approvata o le altre parti corrette.

## 11. Istruzione standard per agenti di generazione e Codex

> Genera una nuova sequenza animata di **[PERSONAGGIO]** che esegue **[AZIONE]**, usando **[PERCORSO/RIFERIMENTO APPROVATO]** come modello canonico e **[AZIONE PRECEDENTE, SE PRESENTE]** come riferimento di continuità.  
> Mantieni identità, anatomia, numero di parti, proporzioni, silhouette, palette, prospettiva, pivot e stile. Non ridisegnare il personaggio per ogni fotogramma.  
> Definisci schema articolare *solo come riferimento di disegno*, ancoraggi funzionali, pose chiave, temporizzazione e transizioni prima di **disegnare** gli intermedi. Non usare mesh, skinning, rig runtime, rotate/scaleX/scaleY/skew di ritagli corporei come sostituti dello spritesheet. Nessuna testa o parte corporea può fluttuare o cambiare attacco senza motivazione anatomica.  
> Ogni effetto deve partire dal punto anatomico corretto e seguirlo; una fiammata parte dalla bocca relativa, non da coordinate arbitrarie. Se l'effetto è fuori posizione, correggi **l'effetto** e non spostare la parte anatomica corretta per inseguirlo.  
> Per azioni articolate **produci una sola posa per generazione**: estremi A e B, breakdown e poi inbetween solo negli intervalli necessari; non chiedere una spritesheet intera per saltare l'approvazione. Produci il numero finale di fotogrammi realmente richiesto dal blocking e dall'X-sheet, con raccordi fluidi; mantieni scala e coordinate coerenti, evitando tagli, drift e salti. Rispetta i materiali: le strutture metalliche non si contraggono né si dilatano per simulare la marcia; usa ruote e sospensioni. Preferisci livelli separati per emissioni ed effetti quando possibile.  
> Presenta prima keyframe e controllo anatomico, poi sequenza completa. Verifica frame adiacenti, continuità, punti di emissione e rendering reale. Non sostituire asset approvati e non eseguire merge senza approvazione.  
> Segui AGENTS.md e consegna le evidenze effettivamente richieste dalla natura della modifica; non presentare mockup come prove runtime.

### 11.1 Parametri da valorizzare a ogni nuova azione

**Riferimento canonico;** eventuale animazione precedente; **azione;** orientamento/camera; **durata totale e X-sheet, senza fissare a priori il numero di PNG;** key/breakdown e articolazioni coinvolte; **punti di origine degli effetti;** stile e risoluzione di output; **criteri di loop/raccordo;** file destinazione; **test e preview.**

I parametri mancanti si derivano dall'asset approvato e dal codice corrente quando disponibili, senza inventare coordinate o misure. Il progetto può procedere per fasi verificabili senza chiedere nuovamente dettagli già documentati.

## 12. Versioning, manutenzione e refactoring del documento

Questa sezione riguarda **il documento di lavoro**; per refactoring del codice di gioco restano autoritative le regole di AGENTS.md.

1. **Nome versionato:** PROTOCOLLO_SPRITE_ANIMATI_vN_YYYYMMDD.md, data locale Europe/Rome. Questa edizione è **v10_20261030**.
2. **Numerazione progressiva:** le revisioni sostanziali producono un **nuovo file** (v2, v3, …). Non sovrascrivere la versione precedente per un cambiamento sostanziale; i ripristini generano una versione successiva, senza decrementare N.
3. **Piccole correzioni:** refusi, punteggiatura o collegamenti senza variazioni di significato possono essere corretti nella stessa versione, tracciando il commit.
4. **Data e stato:** aggiornare data locale, versione, stato e registro modifiche quando nasce una nuova edizione. Distinguere proposta, approvazione e implementazione.
5. **Conservazione:** mantenere direttamente nella cartella di lavoro **ultima e penultima versione** del documento; le versioni più vecchie rimangono rintracciabili nella cronologia Git. Non cancellare documenti storici di altra famiglia.
6. **Refactoring editoriale continuo:** dopo aggiornamenti significativi eliminare duplicazioni, sezioni obsolete, contraddizioni, rimandi rotti e istruzioni ormai superate; preservare tutte le regole ancora valide.
7. **Refactoring strutturale:** programmare una revisione di struttura **al più tardi a ogni decima versione sostanziale** (v10, v20, …), anticipandola se il documento diventa complesso. Una correzione ortografica non fa avanzare il contatore.
8. **No regressioni normative:** la riorganizzazione editoriale non può cancellare vincoli approvati né cambiarne significato. Prima di sostituire un criterio segnalare esplicitamente il conflitto con le istruzioni precedenti.
9. **AGENTS.md:** conservarlo come fonte delle regole trasversali, con un semplice rimando a questo protocollo; evitare di copiarvi tutte le prescrizioni. Se cambia il nome della versione corrente, aggiornare il rimando.
10. **Workflow:** preferire branch e PR con riepilogo, differenze e verifiche; approvazione esplicita prima del merge. Le specifiche non equivalgono alla loro implementazione.

### 12.1 Registro delle revisioni

| Versione | Data Europe/Rome | Modifica |
| --- | --- | --- |
| v1 | 2026-10-29 | Prima stesura: invarianti, scheletro logico e ancoraggi, keyframe, causalità degli effetti, caso Cerbero, pipeline, verifica, correzione mirata, template per agenti, versioning e refactoring. |
| v2 | 2026-10-29 | Metodo vincolante con pose disegnate; divieto di fallback tramite mesh/rig/stretch per azioni complesse; coerenza fisica dei materiali, carrozzerie rigide, gate di approvazione, controlli e refactoring della terminologia. |
| v3 | 2026-10-29 | Workflow operativo ChatGPT → Codex dall'ideazione alla GIF reale: ruoli, asset, handoff, gate di approvazione, packaging, materiali, esempio Cerbero e veicoli. |
| v4 | 2026-10-29 | Audit obbligatorio degli asset preesistenti; orientamento della camera, posizione, profondità, ruolo, LOD e scala; scheda contestuale e gate prima della generazione; caso diavoli atmosferici Hellscape. |
| v5 | 2026-10-29 | Generazione diretta di spritesheet PNG RGBA trasparenti come procedura predefinita; ritaglio dei frame, loop GIF di controllo, verifica alpha e criteri per correggere atlanti illustrativi imperfetti. |
| v6 | 2026-10-29 | Inbetweening ricorsivo adattivo, doppio estremo A/B, inversione del tratto quando giustificata, timing non uniforme, controlli oggettivi e gate tecnico/artistico, test col diavolo volante. |
| v7 | 2026-10-29 | Branch temporaneo dedicato a ogni asset/azione; struttura standard cartelle; logging rigoroso prompt e riferimenti; manifest PNG, versioning, verifiche, approvazioni, PR e pulizia dopo merge. |
| v8 | 2026-10-29 | Integra pose-to-pose professionale, key/breakdown/inbetween, archi, volumi, timing/X-sheet, onion skin e controllo silhouette; rettifica generazione multiposa predefinita: una posa per volta con limiti IA espliciti e retake mirati. |
| v9 | 2026-10-30 | GIF diagnostica dopo ogni PNG, allineamento su pivot e controllo di lunghezze e topologia delle membrane. |
| v10 | 2026-10-30 | Normalizzazione obbligatoria dopo ogni generazione: landmark corporei, trasformazioni globali, tolleranze alla scala reale, controlli anatomici separati e tracciabilità. Revisione strutturale: regole di allineamento centralizzate in §4.1 e rinvii coerenti nelle fasi operative, senza cambiare i gate. Corretto ordine del registro revisioni e separatore storico. |

### 12.2 Fonti professionali usate nella revisione v8

Letture di riferimento consultate il 29/10/2026; **fonti sul metodo di animazione**, non attestazioni della capacità o affidabilità di uno specifico generatore IA:

- [Toon Boom Learn — Straight Ahead and Pose-to-Pose Principle](https://learn.toonboom.com/modules/animation-principles/topic/straight-ahead-and-pose-to-pose-principle): key, breakdown, inbetween, timing e spacing.
- [Toon Boom Harmony — About Marked Drawings](https://docs.toonboom.com/help/harmony-21/advanced/paperless-animation/about-mark-drawing.html): breakdown, archi di movimento, follow-through, retake di key e inbetween.
- [Toon Boom Harmony — About Timing](https://docs.toonboom.com/help/harmony-24/premium/timing/about-timing.html): timeline, X-sheet, esposizione e durata dei disegni.
- [Adobe — 12 Principles of Animation](https://www.adobe.com/creativecloud/animation/discover/principles-of-animation.html): anticipation, staging, arcs, overlapping action, slow in/out, ecc.
- [Krita Manual — Animation with Krita](https://docs.krita.org/en/user_manual/animation.html): animazione frame-by-frame, onion skin, timeline, keyframe e controllo dei contatti.
- [Aseprite Documentation — Animation](https://aseprite.com/docs/animation/): durata per-frame, onion skin, riproduzione inversa e tag di sequenze.
- [Aseprite Documentation — Sprite Structure](https://aseprite.com/docs/sprite/): frame, livelli, cels e durata in millisecondi.

---

**Versione:** v10 · **Ultimo aggiornamento:** 30 ottobre 2026 (Europe/Rome)
