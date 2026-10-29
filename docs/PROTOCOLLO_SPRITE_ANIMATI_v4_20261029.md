# Protocollo operativo per sprite animati coerenti

**Versione documento:** v4  
**Ultimo aggiornamento:** 29 ottobre 2026 — Europe/Rome  
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

**Divisione dei ruoli:** ChatGPT e gli strumenti di creazione/modifica immagini producono e correggono le immagini; Codex è responsabile di automazione, controlli, impacchettamento e integrazione nel motore. Codex **non** deve improvvisare il disegno anatomico tramite trasformazioni runtime. Le immagini generate dall'IA possono presentare variazioni tra frame e richiedono revisione o ritocco: non presumere coerenza automatica solo perché condividono il prompt.

| Fase | Responsabile principale | Output obbligatorio | Gate prima della fase successiva |
| --- | --- | --- | --- |
| 0. Audit del gioco | ChatGPT + Codex | Analisi reale di camera, viewport, profondità, ruolo, asset canonici, rendering, screenshot e scala finale (sezione 2.1) | Scheda contestuale verificata, ipotesi segnalate |
| 1. Brief e vincoli | ChatGPT + utente | Scheda del soggetto: identità, anatomia/parti, silhouette, materiali, palette, prospettiva, risoluzione effettiva, azioni richieste | Requisiti fissati |
| 2. Design canonico | ChatGPT + strumento immagini | Immagine di riferimento approvata e, se necessario, viste ortogonali/tre quarti e dettagli; percorso/versione asset | **Approvazione del design statico**, senza redesign nelle fasi successive |
| 3. Storyboard di una singola azione | ChatGPT | Sequenza di pose chiave e contatti: anticipazione, azione, follow-through, recupero; ordine anatomico, appoggi e ancoraggi; proposta di timing e numero di pose | Approvazione delle pose principali |
| 4. Produzione dei keyframe | ChatGPT + editing immagini | PNG delle pose principali realmente disegnate, comparabili alla reference canonica, su canvas/scala coerenti | Controllo di anatomia, proporzioni, materiali e prospettiva per ogni posa |
| 5. Fotogrammi intermedi | ChatGPT + editing/ritocco assistito | PNG di tutti i frame necessari alla fluidità; onion-skin/confronto di frame vicini; effetti indipendenti, dove utile | **Approvazione dello spritesheet visivo**; niente warp/mesh/rig come surrogato |
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
> Produci **[N]** fotogrammi disegnati con raccordi fluidi; mantieni scala e coordinate coerenti, evitando tagli, drift e salti. Rispetta i materiali: le strutture metalliche non si contraggono né si dilatano per simulare la marcia; usa ruote e sospensioni. Preferisci livelli separati per emissioni ed effetti quando possibile.  
> Presenta prima keyframe e controllo anatomico, poi sequenza completa. Verifica frame adiacenti, continuità, punti di emissione e rendering reale. Non sostituire asset approvati e non eseguire merge senza approvazione.  
> Segui AGENTS.md e consegna le evidenze effettivamente richieste dalla natura della modifica; non presentare mockup come prove runtime.

### 11.1 Parametri da valorizzare a ogni nuova azione

**Riferimento canonico;** eventuale animazione precedente; **azione;** orientamento/camera; **durata e numero di frame;** articolazioni coinvolte; **punti di origine degli effetti;** stile e risoluzione di output; **criteri di loop/raccordo;** file destinazione; **test e preview.**

I parametri mancanti si derivano dall'asset approvato e dal codice corrente quando disponibili, senza inventare coordinate o misure. Il progetto può procedere per fasi verificabili senza chiedere nuovamente dettagli già documentati.

## 12. Versioning, manutenzione e refactoring del documento

Questa sezione riguarda **il documento di lavoro**; per refactoring del codice di gioco restano autoritative le regole di AGENTS.md.

1. **Nome versionato:** PROTOCOLLO_SPRITE_ANIMATI_vN_YYYYMMDD.md, data locale Europe/Rome. Questa edizione è **v4_20261029**.
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
| v2 | 2026-10-29 | Metodo vincolante con pose disegnate; divieto di fallback tramite mesh/rig/stretch per azioni complesse; coerenza fisica dei materiali, carrozzerie rigide, gate di approvazione, controlli e refactoring della terminologia. |\n| v3 | 2026-10-29 | Workflow operativo ChatGPT → Codex dall'ideazione alla GIF reale: ruoli, asset, handoff, gate di approvazione, packaging, materiali, esempio Cerbero e veicoli. |
| v4 | 2026-10-29 | Audit obbligatorio degli asset preesistenti; orientamento della camera, posizione, profondità, ruolo, LOD e scala; scheda contestuale e gate prima della generazione; caso diavoli atmosferici Hellscape. |

---

**Versione:** v4 · **Ultimo aggiornamento:** 29 ottobre 2026 (Europe/Rome)
