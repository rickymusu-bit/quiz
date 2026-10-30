# Protocollo operativo per sprite animati coerenti

**Versione documento:** v13.0.0\
**Ultimo aggiornamento:** 30 ottobre 2026 — Europe/Rome\
**Progetto di riferimento:** Hellscape – Fuga dall'inferno\
**Ambito:** riutilizzabile per qualsiasi personaggio, creatura, veicolo, oggetto animato o effetto collegato\
**Stato:** protocollo aggiornato con vincoli fisici e biomeccanici; la presente revisione non convalida automaticamente asset o animazioni prodotti
**Destinatari:** Codex, ChatGPT Work, artisti, altri agenti e sviluppatori\
**Repository:** rickymusu-bit/quiz\
**Fonte di questa revisione:** v12.0.0 del 30/10/2026, richiesta utente di integrare fisica e biomeccanica nella progettazione del galoppo del Cerbero; riferimenti scientifici riportati al §2.2.
**Convenzioni prevalenti:** [AGENTS.md](../AGENTS.md); in caso di conflitto prevalgono le istruzioni più recenti esplicitamente approvate dall'utente.

> **Principio guida:** uno sprite animato rappresenta **un unico soggetto articolato che evolve nel tempo**, non una serie di illustrazioni indipendenti. Le parti anatomiche, i punti di ancoraggio e la causalità degli effetti sono vincoli di produzione e di accettazione, non semplici suggerimenti stilistici.

## 1. Obiettivo e ambito

Questo protocollo disciplina due casi distinti:

1. **Da immagine di riferimento:** generare una nuova sequenza di un soggetto del quale esiste una posa o illustrazione canonica.
2. **Da animazione precedente:** generare una nuova azione (per esempio fuoco dopo camminata), conservando **identità, anatomia, proporzioni, orientamento e palette** dello sprite già approvato.

La produzione comprende analisi del riferimento, scelta motivata della tecnica (§3.1), schema anatomico e meccanico, pose chiave, intermedi disegnati o calcolati dal rig validato, effetti, verifica e integrazione. Rig, disegno per fotogrammi e tecnica mista sono strumenti ammessi secondo i criteri di questa edizione. Non è autorizzato un nuovo design né un cambiamento autonomo delle meccaniche di gioco.

## 2. Fonti e gerarchia di riferimento

Per cercare sprite esistenti, consultare il [catalogo di fonti e candidati](FONTI_SPRITE_ANIMATI_v1.0.0_20261030.md). Le piste non sono asset approvati: verificare pagina dell'autore, licenza del singolo file, animazioni e compatibilità prima del riuso.

Prima di disegnare o generare fotogrammi:

1. Identificare la **versione approvata** del personaggio e, se esiste, il foglio sprite di una precedente azione; annotare percorso e revisione.
2. Isolare le caratteristiche invarianti dal materiale approvato, senza importare errori o artefatti di generazioni scartate.
3. Identificare, per l'azione richiesta, **quali parti possono muoversi** e quali connessioni rimangono obbligatorie.
4. Se due riferimenti sono incompatibili, dichiarare il conflitto e assumere come vincolante il design più recente esplicitamente approvato; non fondere automaticamente anatomie diverse.
5. Scegliere e verificare la tecnica secondo §3.1; ogni posa, disegnata o ottenuta dal rig, deve rappresentare il medesimo soggetto completo e coerente. Evitare redesign casuali e deformazioni usate per nascondere errori.

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
- **Azioni e tecnica:** pose, cicli, intermedi, ancoraggi; tecnica proposta per parte/intervallo, esito della prova §3.1 e motivazione, disegni correttivi e formato di consegna.
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

## 2.2 Modello fisico e biomeccanico — requisito obbligatorio (v13)

**Scopo.** Ogni movimento di un soggetto articolato deve avere una struttura causale prima dell'esecuzione grafica. La continuità visiva non sostituisce la plausibilità delle forze, del bilancio, dei vincoli e della locomozione. Il principio si applica ad animali, creature fantastiche, esseri umani, mezzi meccanici, ali, tentacoli, morso, presa, salti e voli. Il modello è quello del soggetto effettivo, **non necessariamente l'imitazione cieca di una specie reale**.

### 2.2.1 Scheda biomeccanica e fisica da compilare prima di A/B/M

Annotare in un file versionato:

1. **Sistema fisico:** massa relativa dei segmenti, gerarchia dei giunti, gradi di libertà, limiti articolari, orientamento della telecamera e trasformazioni di gioco; distinguere osservazione, ipotesi e stilizzazione.
2. **Azione e riferimento:** camminata, trotto, galoppo, salto, battito, presa o colpo; individuare riferimenti reali comparabili e loro limiti. Una creatura fantastica può avere anatomia diversa: esplicitare le modifiche necessarie.
3. **Forze e contatti:** gravità, reazione del suolo, attrito, attrazione/propulsione, momento angolare, centro di massa approssimativo, mani/zampe/ali che supportano il carico; identificare quando una parte tocca, lascia, afferra o perde il contatto.
4. **Timeline degli eventi:** fasi di contatto, caricamento, propulsione, swing/recupero, sospensione, compressione, estensione; ordine dei contatti per arto (non solo etichette della posa).
5. **Traiettorie:** percorso di bacino e torace, oscillazione verticale del baricentro, posizione degli appoggi nel mondo, angoli dei giunti e moto delle parti secondarie. Niente accelerazioni arbitrarie o teletrasporti tra disegni.
6. **Materiali:** rigidità relativa, ammortizzazione, tessuti flessibili, code e colli; deformazioni consentite solo se mantengono l'identità anatomica e una causa fisica.
7. **Timing:** durate non necessariamente uniformi; il numero di frame si ricava dagli eventi e dalla leggibilità alla scala reale, non da un numero preimpostato.
8. **Prova e stato:** controllo del ciclo e del suo ritorno al primo frame; esito per anatomia, contatti, masse, silhouette, ripetizioni e leggibilità; stato separato: reference / A-B approvati / M / spritesheet candidato / approvato / integrato.

**Vincolo sul punto M:** M non è necessariamente il 50% spaziale tra A e B; rappresenta un evento biomeccanico o un breakdown giustificato lungo la traiettoria temporale. Se A e B appartengono a fasi non contigue del ciclo, produrre più intermedi, non inventare una morfologia media. A e B sono riferimenti dell'identità, non licenza per un'interpolazione fisicamente impossibile.

### 2.2.2 Invarianti cinematici e dinamici

- **Piede o zampa portante:** durante l'appoggio, il punto di contatto resta pressoché fisso **nel mondo**, mentre il corpo avanza e il giunto compensa. Con camera solidale al soggetto la zampa apparentemente scorre all'indietro; è scorretto bloccarla semplicemente nelle coordinate dello sprite o farla slittare rispetto al terreno senza motivo.
- **Fase di volo:** senza contatti al suolo, la traiettoria del centro di massa segue una dinamica balistica approssimata nella scena; cambi improvvisi di velocità verticale, stop a metà aria o contatti fantasma vanno corretti.
- **Impulsi:** atterraggio, frenata e spinta cambiano velocità e distribuzione del carico in corrispondenza di contatti, non per cambi casuali di sagoma; le zampe posteriori sono importanti nella spinta del galoppo veloce, mentre gli anteriori gestiscono parte rilevante della frenata e del reindirizzamento del centro di massa.
- **Articolazioni:** segmenti ossei e strutture rigide mantengono lunghezze plausibili; ginocchia, garretti, gomiti e polsi si piegano secondo la propria anatomia, anche se stilizzata. Tenere distinti arto vicino e lontano.
- **Parti secondarie:** code, criniere, lingue, colli e teste possono avere un ritardo inerziale rispetto al tronco, ma il ritardo non deve produrre disconnessioni, moti perpetui o corna che cambiano forma.
- **Periodi e loop:** le pose coprono un ciclo completo e si collegano con continuità **di posizione e, quanto ragionevolmente visibile, di velocità**; la prima e l'ultima non vanno duplicate per riempire caselle.
- **Rig/disegno:** scegliere per ciascun intervallo secondo §3.1. Se il rig invalida silhouette e occlusione, disegnare pose correttive. La trasformazione geometrica non deve sostituire la flessione del dorso né far ruotare arti intorno a pivot sbagliati.

### 2.2.3 Galoppo rotatorio a doppia sospensione — esempio operativo Cerbero

**Modello di riferimento:** quadrupede canide veloce, con adattamento esplicito al torace e ai tre colli del Cerbero. Il galoppo è un'andatura asimmetrica. Il doppio volo non è obbligatorio per tutte le specie e tutte le velocità; è associato soprattutto alle andature più rapide e a sufficiente flessione/estensione del dorso. L'ordine concreto dei contatti, il lato guida e la distribuzione delle durate possono variare: confermare con reference invece di affermare un'inesistente sequenza universalmente fissa.

Per un **ciclo di esempio** visto da destra, scegliere un lato guida e mantenerlo per il loop; la sequenza di contatti, iniziando dalla fase di volo estesa, è: **anteriore 1 → anteriore 2 → sospensione raccolta → posteriore 1 → posteriore 2 → sospensione estesa**. L'inizio è convenzionale: il ciclo è chiuso.

| Evento progettuale | Anatomia, carico e contatto | Controllo visivo |
| --- | --- | --- |
| E0: sospensione estesa | Dorso in estensione, anteriori protesi, posteriori allungati; quattro appoggi assenti | Nessuna zampa deve simulare un ancoraggio a terra |
| E1: primo contatto anteriore | Una zampa anteriore raggiunge il suolo e assorbe il carico; l'altra è sfalsata | Punto di contatto stabile nel mondo |
| E2: secondo contatto e carico anteriore | Secondo anteriore in successione; tronco e bacino procedono, arti posteriori recuperano sotto il corpo | Non confondere ginocchi e gomiti; nessun piede duplicato |
| E3: sospensione raccolta | Nessun appoggio; colonna flessa e arti raccolti; massa non sospesa magicamente a quota fissa | Distinguere raccolta dal fermo in piedi |
| E4: primo contatto posteriore | Una zampa posteriore atterra; bacino e torace iniziano a risollevarsi | Piede al suolo e reazione visibile del corpo |
| E5: secondo contatto posteriore | Seconda zampa posteriore appoggia in successione, aumenta la spinta | Non invertire i lati guida |
| E6: estensione di spinta | Posteriori si estendono con effetto su velocità e centro di massa | Collegare giunti e artigli al rispettivo arto |
| E7: distensione e rilascio | Si perde il contatto e si entra nel successivo volo esteso; le zampe si preparano a E0 | Nessun salto nel passaggio E7→E0 |

**Le otto righe sono eventi, non il numero obbligatorio di sprite.** Possibili breakdown aggiuntivi nei contatti brevi; il loop può richiedere più frame o timing diseguale.

**Riferimenti A/B già approvati:** A corrisponde alla sospensione distesa; B esprime raccolta/compressione, ma **non va automaticamente identificato con la sospensione raccolta** se la silhouette mostra zampe che toccano terra. Verificare i contatti e, se incompatibili con E3, usare B come riferimento morfologico o porlo in E4/E5 soltanto dopo la verifica. Le teste mantengono tre identità, tre colli attaccati al tronco e un'oscillazione limitata in ritardo; la coda segue il bacino. Per la fiammata e il morso usare gli ancoraggi delle bocche nella posizione trasformata di ciascun frame.

### 2.2.4 Gate di qualità, artefatti e controlli

Prima dell'approvazione dello spritesheet documentare:
- frame per frame: evento, contatto degli arti vicino/lontano, orientamento, coordinate relative degli appoggi, direzione di moto del centro di massa; i dati ipotetici sono marcati come tali;
- confronto visivo side-by-side e overlay dei riferimenti approvati su testa, torso, articolazioni, spine, coda e colori;
- verifica della **continuità delle traiettorie**, non solo del numero delle zampe; controllo del giro completo e della giuntura finale-iniziale;
- verifica di nessuna duplicazione di frame per colmare il numero richiesto; fare meno frame utili è meglio di più frame ripetuti;
- in trasparenza, un contenuto per cella senza sfondo finto a scacchi incorporato, tele/pivot comuni e nessun taglio in fase di estrazione;
- anteprima animata del foglio e, **solo per integrazione runtime**, GIF e screenshot effettivamente acquisiti dal browser secondo AGENTS.md;
- revisione mirata degli intervalli che non superano i test; non generare un intero nuovo design quando basta rifare E2→E3.

Un foglio generato da AI **non è automaticamente un modello fisico certificato**. Se l'utente lo approva visivamente ma i vincoli principali falliscono, segnalare il conflitto e proporre un retake. Le immagini concettuali non sono screenshot del gioco e non attestano integrazione. Registrare provenienza e versione di A/B/M, immagini di riferimento, seed/prompt ove disponibili, conversioni e approvazioni.

**Fonti di riferimento biomeccanico (non sprite riutilizzabili):**
- Royal Society, *Motions of the running horse and cheetah revisited: fundamental mechanics of the transverse and rotary gallop* (2008), https://pmc.ncbi.nlm.nih.gov/articles/PMC2696142/ (contatti e transizione del centro di massa).
- *Linking Gait Dynamics to Mechanical Cost of Legged Locomotion*, https://pmc.ncbi.nlm.nih.gov/articles/PMC7805771/ (galoppo, andature e doppia sospensione).
- *Rapid quadrupedal locomotion: a study of greyhound galloping mechanics*, University of Technology Sydney, https://opus.lib.uts.edu.au/handle/10453/175913 (tracciamento degli appoggi del levriero).

## 3. Invarianti anatomici e visivi

| Proprietà | Regola vincolante |
| --- | --- |
| Identità | Stesso personaggio, segni distintivi, materiali, palette, silhouette e livello di dettaglio. |
| Conteggi anatomici | Numero di teste, arti, corna, code e altri componenti stabile, salvo occlusioni fisicamente plausibili. |
| Proporzioni | Rapporti tra testa, collo, tronco, arti e articolazioni coerenti lungo tutta la sequenza; vietato squash/stretch arbitrario; eventuale deformazione solo se fisicamente plausibile per il materiale e verificata nelle pose approvate. |
| Connessioni | Teste collegate ai colli, colli al tronco; arti collegati alle articolazioni; parti mai flottanti o saldate arbitrariamente. |
| Orientamento | Prospettiva, verso di movimento, disposizione relativa delle parti e punto di vista coerenti. |
| Scala e quadro | Stesso sistema di coordinate, scala base, centro/pivot e dimensione nominale dei frame. |
| Stile | Tratto, anti-alias/pixel art, luce, contorni e resa materica omogenei; nessun salto casuale di definizione. |
| Continuità | Posa, velocità, direzione ed eventi evolvono senza teletrasporti o cambi istantanei non narrati. |
| Integrità del canvas | Nessuna parte utile (testa, corna, coda, fiamme) viene tagliata per mancanza di margini, a meno che l'inquadratura lo richieda esplicitamente. |

**Un'occlusione non è una mutilazione:** una zampa nascosta dietro il torso può essere corretta; una zampa che ricompare sul lato sbagliato senza percorso plausibile non lo è. Nel movimento delle creature fantastiche conta la coerenza dell'anatomia *progettata*, non l'aderenza letterale all'anatomia di un animale reale.

### 3.1 Scelta della tecnica: spritesheet da riferimenti, rig o tecnica mista

**Procedura generativa predefinita:** A/B approvati, M facoltativo, quindi spritesheet completo e retake mirati (§7.3). Non è obbligatorio provare un rig prima di applicarla. Rig e tecnica mista restano alternative documentate, quando adatte al movimento e agli strumenti.

**Rettifica esplicita delle edizioni precedenti (richiesta utente del 30/10/2026).** Il divieto generale di usare rig/mesh per produrre movimento è sostituito da una scelta motivata e da prove verificabili. Restano vietati pivot approssimati, parti scollegate, stretching di strutture rigide e deformazioni che mascherano anatomie errate. Un rig riutilizza gli stessi componenti ma **non garantisce automaticamente** anatomia, prospettiva, illuminazione o qualità.

| Condizione del movimento | Prima tecnica da valutare | Limite da verificare |
| --- | --- | --- |
| Rotazione/spostamento di segmenti con prospettiva quasi costante | Rig 2D con segmenti rigidi e giunti anatomici | Attacco, lunghezze, sovrapposizioni e assenza di effetto sagoma piatta |
| Flessione locale di membrane, pelle o tessuti | Rig con mesh e pesi controllati sulle sole parti flessibili | Stiramenti, pieghe, volume e persistenza di fori/segni |
| Comparsa di superfici nascoste o forte cambio di prospettiva/silhouette | Nuovi disegni delle pose/parti necessarie | Un rig 2D non ricostruisce ciò che la reference non mostra |
| Parti riutilizzabili e pochi passaggi difficili | Tecnica mista: rig e immagini sostitutive/correttive | Continuità al cambio di disegno, senza scatti o variazioni di identità |
| Rotazioni spaziali ampie e ricorrenti | Valutazione di modello e rig 3D | Costo di preparazione, materiali, camera e stile coerenti; non soluzione automatica |
| Fiamme, fumo, liquidi, fratture o trasformazioni | Disegni/animazione specifica degli effetti | Causalità e ancoraggi; non forzare una sagoma rigida |

**Prova prima della produzione.** Dopo l'audit e il piano di movimento, preparare i due estremi A/B. Per la generazione dello spritesheet, M è facoltativo: aggiungerlo se gli estremi non chiariscono arco, articolazioni, prospettiva o occlusioni; registrare la motivazione. Per un rig, verificare anche un breakdown rappresentativo, inizialmente schematico. Per il rig provare anche la traiettoria continua fra le pose: estremi corretti non dimostrano che il passaggio sia corretto. Mostrare il ciclo alla velocità prevista e alla scala finale, controllando:

- articolazioni, lunghezze e volumi plausibili; ossa, artigli, crani e metallo conservano la forma;
- membrane flessibili senza stiramenti gratuiti; fori e segni restano sullo stesso lembo;
- prospettiva, occlusioni, superfici visibili e illuminazione coerenti;
- silhouette leggibile, contatti, assenza di giunti scoperti, tremolio o salti;
- continuità del loop e differenze necessarie fra andata e ritorno.

**Decisione registrata:** rig se supera la prova; tecnica mista se i difetti sono locali e risolvibili con disegni correttivi; disegno per fotogrammi se il rig richiede correzioni pervasive o non conserva prospettiva e silhouette. Non fissare soglie numeriche universali: motivare l'esito con evidenze alla scala reale. Considerare anche preparazione dei livelli, ricostruzione delle parti nascoste, numero di riusi, strumenti disponibili e costo dei retake; il rig non è sempre la strada più rapida.

**Scheda di decisione.** Registrare: soggetto/azione e riferimento canonico; parti interessate; camera e cambi di prospettiva; tecnica candidata; preparazione richiesta; esito di estremi/breakdown/percorso; difetti residui; tecnica scelta e motivazione; sorgenti ed evidenze; stato dell'approvazione. Una proposta di rig non è un rig già realizzato.

**Preparazione e tracciabilità del rig.** Conservare originale, livelli separati, parti nascoste ricostruite, gerarchia, pivot anatomici, limiti, mesh/pesi, immagini alternative, curve temporali e file sorgente modificabile. Dichiarare le ricostruzioni ipotetiche. Gli elementi rigidi ruotano ai giunti; si deformano soltanto i materiali che lo consentono. Non animare l'intera ala come una paletta se la prospettiva richiede un diverso disegno.

**Produzione ed esecuzione sono scelte distinte.** Un rig può servire soltanto nell'editor ed essere esportato in PNG/atlante, senza introdurre un rig nel motore. Usare preferibilmente il formato già supportato dal gioco; un rig a runtime richiede una scelta tecnica documentata e verifiche di caricamento, prestazioni, pause, frame rate, movimento ridotto e ancoraggi. L'approvazione del protocollo non equivale all'approvazione di un nuovo asset o della sua integrazione.

**Vincoli specifici conservati.** Per Cerbero resta respinta la deformazione elastica della sola posa statica; le sequenze complesse già prescritte in AGENTS.md rimangono disegnate. Questa revisione introduce la valutazione del rig per nuovi movimenti e parti idonee, senza sostituire automaticamente quel lavoro. Per nuove sequenze del diavolo volante applicare il percorso generativo §7.3; rig e tecnica mista restano alternative motivate, senza sostituire automaticamente le pose già approvate.

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

Prima dei frame definire uno **schema articolare logico**, utilizzabile come riferimento di disegno o come base del rig selezionato secondo §3.1, che elenchi:

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
- Nell'allineamento degli output generativi sono vietati scala diversa sui due assi, allineamento indipendente di teste/ali/arti, warp e morphing per far coincidere a forza pose incoerenti. Questa registrazione globale è distinta dall'animazione articolata del rig validato (§3.1); non genera intermedi e non sostituisce un retake.
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

**Ordine operativo:** generazione della posa di riferimento o dello spritesheet → conservazione originale → estrazione delle celle quando presenti → allineamento globale di ogni posa → verifica anatomica e alla scala reale → GIF diagnostica o ciclo completo → approvazione dei riferimenti oppure retake e approvazione del ciclo (§7.3). L'impacchettamento finale riusa queste trasformazioni; non rimanda il primo allineamento alla fine della produzione.

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
- Non confondere **numero di disegni** con **frame rate di rendering**: tempi di esposizione, clock e interpolazione del rig validato sono distinti. L'interpolazione geometrica è ammessa nel rig scelto secondo §3.1; non è ammessa come rimedio automatico a disegni incoerenti.
- Collegare l'avanzamento dell'animazione al tempo attivo della scena, non al numero di render del dispositivo, evitando divergenze 30/60/144 Hz.
- Prevedere ingressi/uscite e raccordi tra azioni diverse, non solo cicli isolati.
- Se richiesta la modalità movimento ridotto, mantenere una posa rappresentativa senza inventare nuovi effetti o modificare lo stato di gioco.

### 5.3 Metodologia professionale: pose-to-pose, breakdown e inbetweens

**Distinguere tre tipi di disegno.** Non confondere «fotogramma centrale» con «posa che spiega il movimento»:

1. **Key / extreme pose:** le posizioni e gli eventi fondamentali che definiscono azione, silhouette, peso e intenzione (per il diavolo: ali massimamente alzate e abbassate). Sono disegni approvati, non automaticamente il primo e l'ultimo frame di un loop.
2. **Breakdown:** disegno strutturale che indica **come** si attraversa l'intervallo: arco di movimento, articolazioni, orientamento delle superfici, cambio di volume apparente, occlusioni, ritardo di coda/membrane. Può trovarsi a qualsiasi posizione temporale, **non necessariamente al 50%**. Nel percorso generativo §7.3, M è facoltativo e si approva prima dello spritesheet solo quando serve a chiarire il passaggio; non è un requisito universale.
3. **Inbetween:** disegno aggiuntivo fra key e breakdown o fra due pose già valide, per ottenere lo spacing desiderato. Lo spritesheet può produrre più intermedi insieme dopo l’approvazione dei riferimenti (§7.3). La generazione di un singolo inbetween è disponibile per riparazioni mirate (§7.4), non è la procedura predefinita.

**Blocking prima della rifinitura:** ricavare dalle pose principali una bozza dell'azione completa; verificare ritmo, silhouette, direzione e gerarchia del movimento alla **dimensione reale nel gioco**, prima di moltiplicare il numero di immagini o aggiungere texture fini. Nel rendering finale usare pose disegnate o prodotte dal rig validato secondo §3.1, verificando anatomia e materiali.

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
3. **Preparare schema articolare e ancoraggi**, scegliere la tecnica e documentare la prova §3.1 prima della produzione completa.
4. **Preparare e approvare A/B**, con M facoltativo quando serve a chiarire il movimento; controllare anatomia, sovrapposizioni e silhouette (§7.3).
5. **Generare lo spritesheet completo** dai riferimenti approvati; estrarre e allineare le pose, montare la GIF e correggere solo celle/intervalli difettosi. Per un rig scelto esplicitamente, esportare il ciclo validato. Approvare la sequenza completa prima dell’integrazione.
6. **Creare gli effetti su livelli separati**, quando tecnicamente fattibile, collegati agli ancoraggi al runtime.
7. **Montare e riprodurre l'azione** alla velocità effettiva, verificando onset, durata e recupero.
8. **Controllare la qualità** con overlay/onion skin, controlli geometrici e riproduzione integrale.
9. **Esportare e integrare** foglio sprite, eventuali effetti e metadati; non rimpiazzare asset approvati prima della revisione.
10. **Acquisire prove reali** dal browser o dalla build pertinente e preparare la PR per approvazione.

Quando il generatore non rispetta i vincoli, correggere i disegni responsabili o rivalutare la tecnica secondo §3.1. Non introdurre rig nascosti né cambiare metodo senza registrarlo. **La qualità verificata prevale sulla comodità di una generazione unica**.

### 7.1 Gate di approvazione e fallback non autorizzati

Per una **nuova animazione complessa**, procedere in due fasi verificabili:

1. **Fase artistica:** scelta della tecnica, storyboard, pose chiave, intermedi e ciclo completo; file sorgente del rig quando impiegato. Presentare i frame rappresentativi e ottenere l'approvazione **prima** di integrarli.
2. **Fase tecnica:** implementare playback, timing, transizioni, eventi, camera e collisioni sul materiale approvato; raccogliere una **GIF reale** dal browser e screenshot dei punti critici, secondo AGENTS.md.

Non dichiarare «animazione completata» perché il codice gira o supera test unitari. Se non è possibile generare i frame approvabili, fermare la parte artistica, elencare gli asset mancanti e proporre alternative **solo come opzioni da approvare**. Non sostituire tacitamente con rig, mesh, CSS transform, deformazioni, un'animazione temporanea spacciata per finale o ripetizioni di un frame.

Per correzioni minori a un effetto già approvato, evitare burocrazia inutile: aggiornare solo i frame interessati e le evidenze proporzionate al cambiamento, senza bypassare i vincoli anatomici e materiali.

### 7.2 Workflow operativo ChatGPT → Codex: dalla creazione del personaggio all'animazione

**Divisione dei ruoli:** gli strumenti grafici producono e correggono i disegni; Codex può preparare e animare un rig secondo §3.1, automatizzare controlli, esportazione e integrazione. La tecnica scelta e i limiti degli strumenti devono essere dichiarati. Le immagini generate richiedono verifica: condividere il prompt non garantisce coerenza.

| Fase | Responsabile principale | Output obbligatorio | Gate prima della fase successiva |
| --- | --- | --- | --- |
| 0. Audit del gioco | ChatGPT + Codex | Analisi reale di camera, viewport, profondità, ruolo, asset canonici, rendering, screenshot e scala finale (sezione 2.1) | Scheda contestuale verificata, ipotesi segnalate |
| 1. Brief e vincoli | ChatGPT + utente | Scheda del soggetto: identità, anatomia/parti, silhouette, materiali, palette, prospettiva, risoluzione effettiva, azioni richieste | Requisiti fissati |
| 2. Design canonico | ChatGPT + strumento immagini | Immagine di riferimento approvata e, se necessario, viste ortogonali/tre quarti e dettagli; percorso/versione asset | **Approvazione del design statico**, senza redesign nelle fasi successive |
| 3. Blocking, tecnica e timing | ChatGPT + Codex | Scelta §3.1, prova A/B e M eventuale (breakdown/percorso obbligatori se si sceglie un rig), traiettorie, X-sheet e confronto alla scala reale | Piano verificato e problemi espliciti |
| 4. Riferimenti A/B ed eventuale M | Strumenti grafici + Codex | A e B coerenti; M solo se utile; originali, allineamento §4.1 e GIF diagnostica | Approvazione esplicita di tutti i riferimenti usati prima dello spritesheet |
| 5. Spritesheet completo e correzioni | Strumenti grafici + Codex | Tavola generata da A/B ed eventuale M; celle estratte e allineate; retake mirati e GIF completa | Verifica di tutte le pose e approvazione del loop corretto; nessuna approvazione separata obbligatoria per ogni cella iniziale |
| 6. Preparazione tecnica | Codex | Asset finali impacchettati in spritesheet/atlante, metadata per frame (durata, canvas, pivot, ancoraggi, evento), nomi e versioni stabili | Controlli di dimensioni, trasparenza, margini, tagli, allineamento e riferimenti |
| 7. Implementazione runtime | Codex | Riproduzione dell'atlante, oppure rig runtime motivato §3.1; stati, eventi, ancoraggi e camera separata | Timing, input, pause, persistenza, collisioni e prestazioni |
| 8. Validazione reale e consegna | Codex + ChatGPT + utente | GIF **acquisita dal gioco nel browser**, screenshot dei punti chiave, test desktop/mobile, PR con diff ed evidenze | Approvazione esplicita **prima** del merge |

#### Regole di handoff e responsabilità

- **Una sola azione alla volta.** Un personaggio può richiedere atlas separati per idle, camminata, corsa, attacco, morso, morte e raccordi. Non costruire tutta la pipeline prima che almeno un'azione completa sia stata approvata.
- **Il riferimento approvato è immutabile per default.** Ogni nuova posa deve derivarne per identità e anatomia; eventuali variazioni del design richiedono approvazione separata.
- **Una singola immagine non è uno spritesheet funzionante.** Per azioni anatomiche complesse produrre effettivamente le pose; una griglia artificiale di duplicati o ritagli deformati non soddisfa la consegna.
- **Ritaglio e atlas non equivalgono al movimento.** L'impacchettamento non dimostra che il ciclo sia corretto; se si usa un rig, conservare sorgenti e decisione §3.1.
- **Controllo alla scala finale.** Verificare a dimensione di gioco leggibilità delle silhouette, qualità dei dettagli e continuità; il file ad alta risoluzione da solo non attesta qualità nel renderer.
- **Ancoraggi e allineamento.** Piedi, ruote e contatti utilizzano coordinate e pivot per-frame coerenti; lo spostamento nel mondo non viene disegnato duplicando coordinate nello spritesheet. Il renderer posiziona ogni frame sul medesimo riferimento.
- **Materiali prima del movimento.** Una testa/arto si articola anatomicamente; un telaio metallico si muove rigidamente, mentre le sospensioni e gli pneumatici lavorano in modo differenziato. Non trasferire squash/stretch da un soggetto organico a un veicolo.
- **Effetti su livelli separati** quando la causalità lo richiede (fiamme, polvere, scintille), ancorati a bocche, pneumatici o contatti nei singoli frame e sincronizzati con gli eventi.
- **No asset, no falso completamento.** Se ChatGPT o gli strumenti a disposizione non riescono a generare frame soddisfacenti, segnalare quali mancano; non passare automaticamente a transform CSS, mesh o rigging procedurale. Proporre un artista o un editor di sprite come soluzione produttiva, non dichiarare realizzata la sequenza.
- **Test visivi obbligatori.** I controlli automatici integrano ma non sostituiscono la revisione umana. Nessun merge finché l'utente non approva gli asset e la GIF reale di gioco.

#### Esempio concreto: Cerbero e veicoli di Hellscape

Per **Cerbero** creare distinte sequenze disegnate di locomozione, slancio, emissione di fiamme, morso/sbranamento, recupero e sprint. Ogni frame mostra teste, colli, busto e zampe connessi. La fiamma nasce da una bocca con ancoraggio identificato; l'attacco modifica corpo e postura, non solo la rotazione della testa. La telecamera segue il movimento nel mondo e deve poter risultare ferma mentre Cerbero sbrana il bersaglio: non muovere il ponte solo per fingere avanzamento.

Per **i veicoli** mantenere stabile la sagoma rigida della carrozzeria; animare ruote, sospensioni, inclinazioni del telaio e spostamento rispetto al mondo. Vietata la contrazione/dilatazione orizzontale del mezzo per simulare velocità.

### 7.3 Procedura predefinita: A/B, M facoltativo, spritesheet completo e correzioni

**Precedenza esplicita — disposizione utente del 30/10/2026.** Questo percorso sostituisce l'obbligo generale di generare e approvare ogni intermedio singolarmente. Non si parte dallo spritesheet senza riferimenti: si approvano prima A/B ed eventuale M, poi si genera la tavola completa. Le pose della tavola restano candidate fino alla verifica del ciclo.

1. **Generare A e B.** Definire i due estremi dello stesso soggetto e della stessa azione, con camera, proporzioni, palette, materiali e dettagli persistenti coerenti. È ammessa una tavola con due estremi oppure A seguita da B usando A come reference. Estrarre, allineare e verificare ciascuno: l'approvazione di A non approva automaticamente B. Se una posa è errata, conservare quella valida e correggere l'altra.
2. **Valutare M, senza renderlo obbligatorio.** Aggiungerlo quando serve a chiarire arco, piega delle membrane, articolazioni, cambio di faccia visibile o occlusioni. M descrive come attraversare il passaggio e non deve necessariamente coincidere con metà tempo o metà spostamento. Se A/B bastano, procedere senza M; registrare la decisione.
3. **Approvare i riferimenti.** Mostrare A/B ed eventuale M normalizzati e una GIF diagnostica. Ottenere l'approvazione dei riferimenti effettivamente usati prima di generare il ciclo. Riutilizzare approvazioni già espresse nella sessione: non richiederle di nuovo per gli stessi file invariati. L'alternanza A/B è una prova dei riferimenti, non un ciclo fluido già realizzato.
4. **Generare lo spritesheet completo.** Fornire realmente al generatore A/B e M se presente, insieme alla reference canonica. Dichiarare azione, numero di pose motivato da durata e scala finale, ordine di lettura, griglia, estremi da raggiungere, percorso, camera, proporzioni, dettagli persistenti, canvas comune, margini e alpha richiesto. Chiedere pose complete e distinte, senza sovrapposizioni, tagli, testo o cambio di design. Non promettere che il generatore copierà esattamente i riferimenti o rispetterà conteggio e griglia: controllare l'output. Se lo strumento non riceve tutte le reference, dichiararlo e predisporre una tavola di riferimento utilizzabile; non attestare input mai forniti.
5. **Estrarre, allineare e montare.** Conservare l'originale, separare le celle reali senza presumere una griglia perfetta, applicare §4.1 usando il corpo e i pivot, verificare alpha e margini, quindi produrre una GIF con tempi dichiarati. Controllare tutte le pose, gli estremi rispetto ad A/B, l'eventuale passaggio M, anatomia, materiali, palette, dettagli persistenti e raccordi. Uno spritesheet appena generato non è automaticamente approvato.
6. **Correggere lo spritesheet.** Individuare le celle difettose e preservare quelle valide. Rimuovere duplicati involontari solo se il movimento rimane continuo; distinguere un duplicato spurio da un hold intenzionale rappresentato con la durata. Riordinare pose fuori sequenza, correggere crop/padding/scala globale e palette dove giustificato; per errori anatomici, estremi mancanti o salti, rigenerare o ritoccare la sola posa/intervallo responsabile con i riferimenti e i due vicini. Non deformare parti corporee per nascondere il difetto. Se la rimozione lascia un salto, creare il frame mancante. Rigenerare l'intera tavola solo se i difetti sono diffusi, motivandolo; non reintrodurre automaticamente la produzione incrementale di tutti i frame.
7. **Approvare il ciclo corretto.** Dopo ogni revisione produrre la GIF completa aggiornata; per retake locali mostrare anche il passaggio interessato. Annotare ordine effettivo, durate, pose rimosse/sostituite e limiti residui. Ottenere l'approvazione della sequenza prima dell'integrazione. Per un movimento reversibile usare A→…→B→…→A senza duplicare gli estremi; per movimenti asimmetrici produrre il ritorno necessario (§7.4).
8. **Esportare e verificare nel gioco.** Salvare frame/atlas, metadati, prompt effettivi, riferimenti e decisioni; integrare e acquisire la GIF reale del browser secondo AGENTS.md. L'approvazione della GIF locale non attesta il corretto rendering nel motore.

**Limiti conservati.** Nessuna garanzia di corrispondenza al 100%, anatomia corretta, alpha reale o assenza di duplicati. La generazione completa è un passaggio di produzione sottoposto a correzione e revisione. Rig e tecnica mista restano disponibili secondo §3.1; non sono fallback taciti dopo un risultato insoddisfacente.

### 7.4 Riparazioni mirate, temporizzazione e verifica misurabile

**Ambito e precedenza.** Il percorso ordinario è §7.3. L'inbetweening ricorsivo è una tecnica opzionale per riparare una lacuna dello spritesheet, non un requisito prima di generarlo. Per intervalli risolti dal rig si verificano percorso e tempi senza imporre nuove generazioni.

**1. Localizzare il difetto.** Indicare frame, intervallo, riferimenti validi e problema osservato: salto, duplicato, anatomia, dettaglio scomparso o estremo non raggiunto. Non modificare A/B approvati per adattarli a una posa sbagliata.

**2. Retake del passaggio.** Se serve, generare un singolo disegno usando i due vicini validi e A/B (M quando presente). Il disegno deve essere anatomicamente corretto, non una fusione, crossfade o warp. Aggiungere un breakdown solo se chiarisce un arco ancora ambiguo.

**3. Suddivisione selettiva.** Dividere nuovamente solo l'intervallo che resta discontinuo. Non imporre potenze di due o un numero universale di pose; preservare durata complessiva, leggibilità e parti valide. Se la tavola funziona dopo estrazione, rimozione dei duplicati e allineamento, non aggiungere intermedi senza motivo.

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
- Valutare M facoltativo; approvare A/B e M se creato, poi generare lo spritesheet completo usando questi riferimenti. Verificare spalle, ossa alari, membrane, corpo, coda, testa e prospettiva in ogni cella.
- Correggere le celle difettose e rimuovere duplicati involontari solo senza lasciare salti; montare A→B→A quando reversibile, con tempi documentati e senza estremi duplicati. Il risultato del diavolo di questa sessione è un esempio pratico, non una garanzia generale del generatore.
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
| Generare più pose | A/B iniziali e spritesheet completo dopo approvazione di A/B ed eventuale M (§7.3) | Coerenza garantita, estremi esatti, conteggio, alpha, assenza di duplicati o tavola già pronta al runtime |
| Timing, pivot, tests | Il modello può **proporre** tempi/ancoraggi, non certificarli | Misura oggettiva senza landmarks e strumenti; spettano a script, editor e revisione |
| Correggere un errore | Modificare **un frame** indicando l'elemento responsabile (ala, membrana, effetto) e ciò che resta invariato | Assenza di modifiche collaterali: ogni retake va confrontato con il precedente |

**Regola delle istruzioni:** chiedere esplicitamente **una** immagine quando il gate richiede una posa, e dichiarare fase, estremi visivi, quota o orientamento richiesto e parti intoccabili. Non scrivere «16 frame», «spritesheet» o «tutte le fasi» nella richiesta che mira a un singolo disegno. Non inviare prompt generici che permettano al generatore di reinterpretare il soggetto senza ancoraggi. Quando lo strumento non accetta realmente due immagini in un'unica operazione, **non** dichiarare di aver usato entrambe; produrre una scheda di confronto o usare un editor/strumento che supporti il caso.

**Regola del retake:** dopo un esito non conforme non avanzare all’approvazione o all’integrazione; applicare prima le correzioni dello spritesheet §7.3 senza scartare le celle valide. Identificare **il difetto principale**, mantenere il riferimento corretto, riscrivere il prompt per il solo frame fallito e chiedere nuovamente la medesima posa. Limitare tentativi ripetitivi con lo stesso prompt senza nuove informazioni; se non si raggiunge la posa, segnare il blocco e usare un editor di sprite o un artista per il ridisegno prima di proseguire. Non trasformare una prova fallita in un attestato di «metodo ricorsivo non riuscito» se la procedura non è stata eseguita.

**Tracciabilità reale:** salvare il **testo di istruzione esplicito** e i riferimenti realmente forniti; se il servizio non espone il prompt interno o altri parametri, dichiarare il limite nel log, senza inventare un prompt retrospettivo. L'output del generatore è un **candidato da validare**; Codex controlla bitmap/tempi/packing e l'utente approva i risultati artistici. Queste condizioni valgono anche quando il modello produce immagini visivamente persuasive.

### 7.6 GIF dei riferimenti, dello spritesheet e dei retake (30/10/2026)

La disposizione precedente sulle GIF dopo ogni fotogramma è applicata al nuovo flusso: GIF diagnostica per A/B ed eventuale M; una GIF del ciclo per ogni spritesheet generato o corretto; dettaglio del passaggio per i retake locali. Non occorre una consegna separata per ciascuna cella estratta dalla stessa tavola.

Per il rig, mostrare la prova dopo ogni revisione significativa del movimento e per ogni nuova posa chiave candidata; il campionamento automatico di molti frame nello stesso export non richiede una GIF diversa per ciascun campione. Conservare la GIF del ciclo completo effettivo e l'origine degli output. Questa prova resta distinta dalla registrazione del browser dopo l'integrazione.

- Dopo ogni revisione di A/B o M mostrare la GIF diagnostica pertinente prima del gate dei riferimenti. Dopo la generazione o correzione dello spritesheet mostrare il ciclo completo ricavato dalle celle effettive, e per un retake locale anche i due vicini. Non imporre GIF/approvazioni separate per tutti gli intermedi prodotti insieme.
- Prima di ogni GIF di output generativi eseguire l'allineamento globale obbligatorio del §4.1: riferimenti corporei stabili, scala uniforme, padding comuni e trasformazioni documentate. Non adattare separatamente arti o sagome per mascherare difetti.
- Nelle GIF diagnostiche dei PNG nessuna dissolvenza, morphing o warp per fingere fotogrammi mancanti. Distinguere l'alternanza di due estremi dal ciclo completo. Per prove di rig mostrare il movimento effettivamente calcolato dal rig validato, dichiarandolo e conservandone il sorgente; nessuna interpolazione inventata per nascondere errori.
- Documentare PNG sorgenti, versione, stato candidato/respinto/approvato, ordine, durate, scala e correzioni. Mostrare anche i tentativi respinti quando servono a capire il difetto. La GIF locale non sostituisce la GIF browser dopo l'integrazione.
- Confrontare esplicitamente lunghezza e numero dei segmenti delle ali e degli arti, dimensioni del corpo e topologia delle membrane. Fori, strappi e segni distintivi seguono lo stesso lembo di membrana tra pose; non spariscono o si rigenerano casualmente.
- Dopo un difetto tecnico o anatomico, segnare la posa respinta e non usarla come base approvata per gli intermedi. Correggere il riferimento se la richiesta modifica anche il design; poi ottenere l'approvazione della revisione.

## 8. Asset, struttura tecnica e metadati

La consegna può comprendere, secondo le necessità:

- reference sheet canonico e sua revisione;
- scheda di rig/ancoraggi con identificatori non ambigui; se si usa un rig, sorgente modificabile, livelli, mesh/pesi, limiti e curve temporali secondo §3.1;
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
4. Procedere per checkpoint secondo §§3.1 e 7.3–7.4: A/B, M eventuale, approvazione dei riferimenti, spritesheet completo, correzioni mirate e approvazione del ciclo. Tracciare ogni tentativo e la corrispondenza fra tavola, celle estratte e retake. Rig e tecnica mista seguono la decisione registrata.
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

**README obbligatorio.** Documentare tecnica scelta, prova §3.1, eventuale generazione A/B congiunta e relativi esiti individuali, soggetto e azione, ruolo, posizione e piano della scena, orientamento della camera, scala effettiva, immagine canonica, limiti anatomici, stato (concept / A / B / M / ciclo / integrazione), decisioni di approvazione e problemi noti. Non descrivere «approvato» un candidato soltanto perché è stato generato.

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

**Manifest e collegamenti.** `manifest.json` collega ogni PNG al suo prompt ID quando generativo, riferimento sorgente, versione, SHA ove disponibile, stato e posizioni/durate previste. Per PNG esportati da rig registrare invece sorgente e revisione del rig, configurazione, tempo campionato, immagini alternative e impostazioni di esportazione: non inventare prompt di generazione per output calcolati. Ogni frame approvato deve avere una catena navigabile **input → prompt → PNG candidato → verifica → approvazione → atlas/loop**. Per la generazione multiposa, più celle possono condividere lo stesso prompt e lo stesso originale: registrare indice/crop della cella, allineamento, ID di eventuali retake e approvazione del ciclo; non inventare una generazione o un’approvazione separata per ogni cella. Per le generazioni ricorsive, dichiarare anche l'intervallo padre (A–B, A–M ecc.).

**Politica di pulizia.** Durante la PR, conservare i PNG candidati collegati a prompt e valutazioni per rendere possibili ispezioni e riproduzioni. Prima del merge rimuovere duplicati identici, output intermedi obsoleti e file voluminosi privi di valore, ma conservare nel `main` **i prompt rilevanti, i frame approvati, i fallimenti diagnostici essenziali e il resoconto delle decisioni**. Se una candidata respinta è indispensabile per capire un errore, non cancellarla senza una copia o un riferimento durevole: dopo l'eliminazione del branch non fare affidamento su commit irraggiungibili. La cronologia Git non sostituisce un registro di prompt accurato.

**Gate di pubblicazione.** La presenza di un pacchetto di file non attesta il completamento: nessun merge e nessuna sostituzione di asset in uso senza verifiche tecniche, test alla dimensione reale, evidenze visive e approvazione. Non committare un artefatto fittizio per soddisfare la struttura richiesta; segnalare le voci non ancora disponibili.

## 9. Verifiche e criteri di accettazione

### 9.1 Ispezione visiva obbligatoria

- [ ] La stessa identità è riconoscibile in tutti i frame.
- [ ] Il numero di teste e arti è coerente (incluse le occlusioni).
- [ ] Proporzioni e lunghezze relative non cambiano accidentalmente.
- [ ] Nessuna testa o parte corporea fluttua senza connessione.
- [ ] La prospettiva e i punti di appoggio sono coerenti.
- [ ] Tecnica motivata secondo §3.1; pose e percorso verificati. Il rig conserva articolazioni, materiali, prospettiva e dettagli; gli intervalli disegnati conservano anatomia e continuità.
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
| Forma differente tra frame | Confrontare con il modello canonico; correggere il disegno difettoso oppure pivot, pesi o immagini alternative del rig. Ricontrollare i frame che dipendono dalla modifica. |
| Movimento a scatti | Identificare se dipende da disegni, curve del rig, timing o clock; correggere la causa e verificare il percorso, senza warp elastico che mascheri l'errore. |
| Morso con testa ruotata o staccata | Ridisegnare la sequenza di pose complete, incluse mandibola, collo e busto, senza ritagli e rotazioni artificiali. |
| Veicolo che si allunga/accorcia durante la marcia | Eliminare lo squash/stretch e animare ruote, sospensioni e posizione/orientamento del corpo rigido. |
| Testa o corna tagliate | Adeguare padding o inquadratura senza rimpicciolire arbitrariamente il personaggio. |
| Qualità disomogenea | Uniformare risoluzione e stile degli asset, verificando la resa alle dimensioni effettive. |

Dopo ogni correzione ricontrollare **il frame interessato e i due adiacenti**, oltre all'animazione intera. Non cambiare spontaneamente il design, la posizione delle teste già approvata o le altre parti corrette.

## 11. Istruzione standard per agenti di generazione e Codex

> Genera una nuova sequenza animata di **[PERSONAGGIO]** che esegue **[AZIONE]**, usando **[PERCORSO/RIFERIMENTO APPROVATO]** come modello canonico e **[AZIONE PRECEDENTE, SE PRESENTE]** come riferimento di continuità.\
> Mantieni identità, anatomia, numero di parti, proporzioni, silhouette, palette, prospettiva, pivot e stile. Non ridisegnare il personaggio per ogni fotogramma.\
> Applica il percorso generativo predefinito §7.3; se scegli rig o tecnica mista secondo §3.1, registra motivazione e prova con estremi, breakdown e percorso. Definisci giunti anatomici, materiali, ancoraggi e tempi; conserva i sorgenti del rig. Nessuna parte deve fluttuare, cambiare attacco o allungarsi senza una causa plausibile.\
> Ogni effetto deve partire dal punto anatomico corretto e seguirlo; una fiammata parte dalla bocca relativa, non da coordinate arbitrarie. Se l'effetto è fuori posizione, correggi **l'effetto** e non spostare la parte anatomica corretta per inseguirlo.\
> Genera A e B coerenti, aggiungi M solo se serve a chiarire il passaggio, quindi ottieni l'approvazione di tutti i riferimenti usati. Genera lo spritesheet completo fornendo realmente tali immagini; estrai e allinea le celle, controlla anatomia, estremi e duplicati, monta la GIF e correggi solo pose/intervalli difettosi preservando quelli validi. Non imporre la generazione singola di tutti gli intermedi. L'approvazione dei riferimenti non approva la tavola: mostra e fai approvare il ciclo corretto prima dell'integrazione. La coerenza non è garantita dal generatore.\
> Presenta prima keyframe e controllo anatomico, poi sequenza completa. Verifica frame adiacenti, continuità, punti di emissione e rendering reale. Non sostituire asset approvati e non eseguire merge senza approvazione.\
> Segui AGENTS.md e consegna le evidenze effettivamente richieste dalla natura della modifica; non presentare mockup come prove runtime.

### 11.1 Parametri da valorizzare a ogni nuova azione

**Riferimento canonico;** eventuale animazione precedente; **tecnica scelta e prova §3.1; modalità di produzione A/B §7.3; azione;** orientamento/camera; **durata totale e X-sheet, numero di pose motivato per la richiesta dello spritesheet, M facoltativo;** key/breakdown e articolazioni coinvolte; **punti di origine degli effetti;** stile e risoluzione di output; **criteri di loop/raccordo;** file destinazione; **test e preview.**

I parametri mancanti si derivano dall'asset approvato e dal codice corrente quando disponibili, senza inventare coordinate o misure. Il progetto può procedere per fasi verificabili senza chiedere nuovamente dettagli già documentati.

## 12. Versioning, manutenzione e refactoring del documento

Questa sezione riguarda **il documento di lavoro**; per refactoring del codice di gioco restano autoritative le regole di AGENTS.md.

1. **Nome versionato:** PROTOCOLLO_SPRITE_ANIMATI_vMAJOR.MINOR.PATCH_YYYYMMDD.md secondo AGENTS.md. Questa edizione è **v12.0.0_20261030**, successiva alla v11.0.0; non rinominare retroattivamente le edizioni precedenti.
2. **Numerazione progressiva:** le revisioni sostanziali producono un **nuovo file** con versione successiva. Non sovrascrivere la versione precedente per un cambiamento sostanziale; i ripristini generano una versione successiva, senza decrementare N.
3. **Piccole correzioni:** refusi, punteggiatura o collegamenti senza variazioni di significato possono essere corretti nella stessa versione, tracciando il commit.
4. **Data e stato:** aggiornare data locale, versione, stato e registro modifiche quando nasce una nuova edizione. Distinguere proposta, approvazione e implementazione.
5. **Conservazione:** mantenere direttamente nella cartella di lavoro **ultima e penultima versione** del documento; le versioni più vecchie rimangono rintracciabili nella cronologia Git. Per v10 usare la revisione `afae26867311d25b8c608f7693c4b9f809c66142`, nella quale il file è ancora presente. Per v8/v9 del protocollo, i rimandi di provenienza nel fascicolo del diavolo si riferiscono alla revisione storica `bc96436cebbd6979c871cae36f66475bfbbdf3a1`, dove tali file restano recuperabili; i prompt storici non vanno riscritti. Non cancellare documenti storici di altra famiglia.
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
| v11.0.0 | 2026-10-30 | Scelta motivata rig/disegno/tecnica mista con prova agli estremi e nel percorso; materiali e file sorgenti; rig in produzione distinto da runtime; coppia A/B congiunta ammessa con verifica individuale, senza garanzie di coerenza; conservati allineamento, GIF, vincoli Cerbero e approvazioni. Aggiornati pipeline, prompt e controlli per eliminare i divieti generali superati. |
| v12.0.0 | 2026-10-30 | Nuovo flusso predefinito richiesto dall’utente: A/B, M facoltativo, approvazione dei riferimenti, generazione dello spritesheet completo, estrazione/allineamento e correzioni mirate, quindi approvazione della GIF del ciclo e prova runtime. Inbetweening ricorsivo opzionale per riparazioni; rimossi obblighi contraddittori di singolo intermedio e M universale. Conservati rig alternativi, anatomia, materiali, prompt, versioning e gate di integrazione/merge. |

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

**Versione:** v12.0.0 · **Ultimo aggiornamento:** 30 ottobre 2026 (Europe/Rome)
