> Documento storico. Per regole, corsie, portale dall’alto e crollo si applica [la specifica v1.3.0](HELLSCAPE_CORREZIONI_CODEX_v1.3.0.md).

# Hellscape — Regia cinematografica, inseguimento finale e spareggio

**Versione documento:** 1.2.0  
**Data:** 27 ottobre 2026  
**Destinazione:** `docs/HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md`  
**Stato:** specifica da implementare e verificare, **non** descrizione di funzionalità già realizzate  
**Progetto:** [Hellscape – Fuga dall'inferno](../README.md)

> **Obiettivo.** Uniformare la qualità percepita e la nitidezza di tutte le risorse visive (partendo dal logo della home), mantenendo lo standard di palco 4:3; completare la transizione cinematografica tra partita ordinaria e spareggio a eliminazione; correggere la locomozione del demone; rifare l'inseguimento finale e l'uscita dall'inferno attraverso un portale monumentale, integrandoli nel motore grafico esistente senza alterare il regolamento.

## 1. Vincoli di progetto

1. **Non riscrivere il gioco:** il motore di punteggi, eliminazioni, turni, Ammo, timer e spareggio resta fonte autorevole dello stato; le animazioni *osservano* lo stato e non determinano chi vinca.
2. **Rispettare le regole esistenti:** lo spareggio parte **solo** dopo tutte le domande ordinarie e **solo se vi è parità al primo posto** tra giocatori ancora attivi; l'inizio della partita con punteggi tutti a zero non lo attiva. Nello spareggio tutti i partecipanti del giro ancora previsti devono rispondere, anche dopo eliminazioni precedenti nel giro. Un errore o il tempo scaduto eliminano; nessun punto/Ammo; se sopravvivono più giocatori si svolge un altro giro; se nessuno sopravvive è Game Over.
3. **Continuità narrativa:** un giocatore già eliminato e il cui mezzo è già stato inghiottito non deve ricomparire; il vincitore non può essere catturato; in Game Over non appare il portale di vittoria.
4. **Coerenza visiva:** pixel art horror/dieselpunk, veicoli dalla sagoma distinguibile e toni terrosi/metallici; il portale è eccezionalmente luminoso con **pietra bianca, azzurro, blu e oro**. Non ripetere indiscriminatamente la palette del fuoco.
5. **Fluidità:** animazioni temporizzate con una sorgente coerente, frame indipendenti dal refresh rate, niente rallentamenti ottenuti saltando frame.
6. **Consegna:** screenshot realmente acquisiti e anteprima scaricabile **della stessa revisione** per ogni intervento visivo o funzionale, come richiesto da `AGENTS.md`; PR separabili e **nessun merge senza approvazione**.
7. **Compatibilità:** desktop e Android, panorama/ritratto dove applicabile, salvataggi e caricamento, schermata 4:3 del gioco, modalità offline e `prefers-reduced-motion`.

## 2. Stato attuale: punti di integrazione da ispezionare

I riferimenti sono orientativi e devono essere verificati sulla head del ramo in cui Codex lavora:

| Area | Modulo esistente | Indicazione |
| --- | --- | --- |
| Motore di gioco e spareggio | `assets/js/engine.js` | Fasi `ordinaria`, `pareggio`, `conclusa`; mantenere invariato il regolamento. |
| Coordinamento UI / schermata finale | `assets/js/ui.js` | Intercettare le **transizioni di fase**, non un semplice ridisegno; mostrare la vittoria solo dopo la fine del filmato. |
| Scena di corsa / Canvas / clock | `assets/hell-race.js` | Posizione, rendering, interpolazioni, `roadPhase`, coda delle eliminazioni, `foolanimationchange`, `foolendingcomplete`. |
| Timeline finale / attori | `assets/hell-ending.js` | Evolvere il piano `plan`, le fasi `capture`, `rise`, `escape`, `roar`, `fire`, `rage` e il portale esistente; evitare due finali concorrenti. |
| Geometria del ponte | `assets/hell-bridge.js` | Riferimenti geometrici di piano stradale, parapetti, fascia e lava; condividere le coordinate necessarie. |
| Ambiente | `assets/hell-terrain.js` | Scorrimento del paesaggio, progressione e dettagli del terreno. |
| Sprite | `assets/hell-race/` | Riutilizzare asset esistenti dove adeguati e aggiungere i fotogrammi effettivamente necessari. |
| Test / build | `tests/`, `package.json`, `scripts/build.cjs` | Non modificare manualmente gli artefatti generati in `dist/`. |

**Nota tecnica verificata:** la scena corrente usa un Canvas bidimensionale con convenzioni di prospettiva/pseudo-profondità definite da asset e geometria del ponte. **Non introdurre una falsa prospettiva 3D autonoma solo per il portale**: la nuova struttura deve adottare esattamente lo stesso linguaggio spaziale e la medesima proiezione dei veicoli e del ponte. Il portale attuale è disegnato in un punto fisso dello schermo: rivedere questa scorciatoia se impedisce l'integrazione prospettica.

## 3. Macchina a stati cinematografica

Le animazioni sono **presentation-only**. Lo stato salvato resta quello del motore; lo stato delle cutscene è effimero e ricostruibile senza ripetere effetti irreversibili. Preferire un clock di scena e transizioni esplicite, non `setTimeout` indipendenti.

### 3.1 Transizione a spareggio

`NORMAL_QUESTION_RESULT → TIE_DETECTED → TIE_INTRO → TIE_READY → TIE_QUESTION → TIE_ELIMINATION (eventuale) → TIE_NEXT_TURN / TIE_NEXT_ROUND → ENDING`.

### 3.2 Finale con vincitore

`WINNER_DECLARED → LINEUP → DEMON_ACCELERATION → CAPTURE_LOSER_N (0–2, solo se ancora presenti) → WINNER_CHASE → PORTAL_EMERGENCE → BRIDGE_BREAK → PORTAL_OPEN → WINNER_CROSSING → PORTAL_SINKING → DEMON_RAGE → DEMON_EXHAUSTED → VICTORY_TITLE → DONE`.

Le fasi possono **sovrapporsi in un'unica timeline** quando ciò migliora la regia: per esempio l'emersione inizia mentre il vincitore si avvicina; la rottura segue l'urto del portale. Le sovrapposizioni non devono invertire l'ordine causale.

### 3.3 Game Over

`ALL_OUT → FINAL_CAPTURE_IF_NEEDED → DEMON_VICTORY → GAME_OVER_TITLE → DONE`. Nessun passaggio per la scena del portale e nessun annuncio di vittoria di un giocatore.

### 3.4 Contratto degli eventi

- Attivare le cutscene **una sola volta per effettiva transizione** (`ordinaria → pareggio`, `pareggio → conclusa`, `ordinaria → conclusa`), non ad ogni render o ripresa del browser.
- Separare `engine.phase` da `cinematic.phase`; non aggiungere una quarta fase logica al motore se non strettamente necessario.
- I controlli non devono avanzare domande né lasciare correre il timer mentre una transizione blocca la scena; alla fine dell'intro la prima domanda di spareggio rimane non svelata e il timer è fermo finché il normale comando di svelamento non lo avvia.
- Non inviare l'evento finale di animazione prima che il titolo di vittoria o Game Over sia pronto; evitare dispatch multipli di `foolendingcomplete`.
- Garantire un percorso statico accessibile per `prefers-reduced-motion` senza perdere informazioni né bloccare il gioco.

## 4. Transizione animata: domande ordinarie → spareggio

### 4.1 Condizione di attivazione

Dopo l'**ultimo esito** della partita ordinaria, il motore valuta i punteggi. Se esiste **parità al primo posto** tra due o tre giocatori attivi, l'interfaccia avvia la transizione cinematografica. Se esiste un vincitore unico, passare direttamente al finale; se tutti sono eliminati, Game Over.

Non avviare l'intro quando la partita comincia con punteggi pari a zero. Non annunciare lo spareggio prima che l'ultimo esito sia stato effettivamente registrato.

### 4.2 Coreografia (proposta principale)

1. **Ultima risposta.** Lascia leggere l'esito finale della domanda ordinaria secondo il normale flusso dell'interfaccia. Appena l'utente prosegue, oscura/ritira gradualmente il pannello delle domande, mantenendo in vista i veicoli e il ponte.
2. **Cambio di atmosfera.** Il rumore visivo della corsa si riduce, il demone avanza nell'inquadratura con una posa minacciosa, la telecamera stringe *lievemente* sul ponte con un movimento fluido. Non cambiare le dimensioni degli sprite senza un corrispondente adattamento delle coordinate e delle occlusioni.
3. **Presentazione dei contendenti.** Evidenzia **solo** i due o tre giocatori in parità al primo posto, riportandone i nomi. Gli altri, se il motore li ha esclusi, non devono più figurare tra i concorrenti dello spareggio; se l'eliminazione comporta un'animazione di cattura, completarla prima di dichiarare lo spareggio pronto.
4. **Titolo forte e breve.** Sul palco compare `SPAREGGIO A ELIMINAZIONE`, seguito da `Un errore o il tempo scaduto ti eliminano`. Il titolo si apre/chiude con transizione breve in stile pixel-art infernale, **non** con un'interruzione istantanea.
5. **Regole visibili.** I punti restano visibili ma sono marcati come **congelati**; niente Ammo disponibili o assegnabili; compare **un cuore** per ciascun partecipante allo spareggio. Conservare le sanzioni già registrate, senza reimpostarle illegalmente.
6. **Ritorno all'interfaccia domanda.** La camera torna dolcemente al framing di gioco, i pannelli riappaiono e viene presentato il primo giocatore nell'ordine già determinato dal motore. La domanda non è ancora svelata e il timer resta fermo.

**Durata:** breve e leggibile; parametrizzare le durate dei passaggi (non inserire tempi rigidi sparsi in molti moduli). Dare priorità all'assenza di attese inutili. Se necessario, prevedere un solo comando **Salta introduzione** che termini il filmato senza saltare stati di gioco, eliminazioni o domande.

### 4.3 Eliminazioni e turnazione durante lo spareggio

- In caso di errore o tempo scaduto, **prima** visualizzare chiaramente l'esito `ELIMINATO` e la perdita dell'unico cuore, **poi** animare il demone che intercetta e inghiotte quel veicolo: non far sparire il mezzo prima della presa. La cattura già esistente può essere riutilizzata e migliorata.
- Gli altri concorrenti rimangono in corsa e non cambiano corsia/posizione con un salto; il pannello del prossimo giocatore arriva soltanto quando termina l'effetto previsto.
- Quando il primo del giro è eliminato, **l'ultimo giocatore previsto nel giro deve comunque rispondere**: il filmato non deve interferire con questa regola.
- Se più concorrenti sopravvivono, mostrare un breve passaggio `NUOVO GIRO DI SPAREGGIO`, con eventuale indicazione del numero di giro; non ripetere l'intro lunga.
- Se tutti vengono eliminati, mostrare Game Over; se rimane un solo superstite **alla fine del giro previsto**, avviare la sequenza di vittoria.
- Gestire correttamente pausa, cambio scheda, ripresa della partita e modalità riduzione movimento: mai lasciare un timer attivo dietro un overlay o riprodurre due volte una cattura.

### 4.4 Accettazione della transizione

La transizione passa i test solo se: appare esclusivamente nel caso previsto; i nomi corrispondono agli effettivi finalisti; il primo quesito di spareggio non viene consumato senza interazione; non vengono assegnati punti/Ammo; i giocatori eliminati non tornano; il timer parte soltanto con il svelamento; l'interfaccia è utilizzabile da mobile e desktop; il focus accessibile non resta dentro un pannello nascosto.

## 5. Inseguimento finale: formazione e divoramento degli sconfitti

### 5.1 Regia generale

Durante le domande, i veicoli possono trovarsi in posizioni diverse in **larghezza** sul ponte. Nella cutscene finale non far zigzagare il demone tra corsie: scegliere la soluzione più robusta, **fila indiana**, così ogni cattura è una fase leggibile di un unico inseguimento.

1. Il vincitore accelera verso il lato/direzione di fuga già stabiliti dalla scena.
2. I veicoli ancora presenti convergono verso una **stessa traccia centrale compatibile con la proiezione del ponte**, mediante interpolazione morbida della posizione laterale.
3. Occupano posizioni successive lungo il senso di marcia: **vincitore in testa, poi gli sconfitti**. Mantenere distanze leggibili e un ordine di profondità corretto.
4. Il demone accelera da dietro e raggiunge **prima l'ultimo mezzo**, poi l'eventuale penultimo. Durante le prese la corsa può rallentare localmente ma non diventare una sequenza di teleport o pause rigide.
5. Ciascuna cattura: avvicinamento → contatto → presa fisica → trasporto del veicolo alla bocca → chiusura delle fauci → scomparsa completa del veicolo **solo dopo l'inghiottimento** → ripresa dell'inseguimento.
6. Gli sconfitti già divorati **prima** del finale non vengono ricreati per rispettare il numero teorico di partecipanti. Gestire zero, uno o due sconfitti residui.
7. Una volta eliminati gli eventuali superstiti sconfitti, il demone punta il vincitore e sembra recuperare terreno; il vincitore accelera verso il portale e si salva **appena in tempo**.

### 5.2 Correttezza del movimento

- Non confondere **spostamento nel mondo**, **spostamento relativo alla telecamera** e **velocità della texture/strada**. Devono derivare da coordinate e trasformazioni coerenti.
- Il ciclo di locomozione del demone deve essere accoppiato alla **distanza effettiva percorsa** (fase dei passi proporzionale a distanza/lunghezza passo), con interpolazione della posa e velocità di corsa modulabile. Una variazione di velocità modifica la cadenza progressivamente.
- Per le zampe in appoggio, contenere lo scivolamento apparente; sincronizzare oscillazione di busto, testa, braccia e impatti al suolo.
- Non rallentare riducendo i FPS, usando `setInterval`, saltando frame o quantizzando la fase. Usare `requestAnimationFrame`/delta time o il clock condiviso già presente; gestire delta anomali dopo ritorno in foreground.
- Verificare in particolare che **testa, corna e arti** non siano tagliati dagli estremi di sprite sheet, clip del Canvas o contenitori CSS durante corsa, afferramento e rabbia.
- Il demone deve sembrare **enorme, pesante e minaccioso**, non frenetico; accelerazione e rincorsa devono essere avvertibili soprattutto dal guadagno di posizione rispetto ai veicoli.

### 5.3 Collisioni e visibilità

- Durante la presa, la posizione del veicolo deve essere agganciata a un **anchor** della mano o delle fauci e aggiornata con la posa dell'attore, non interpolata separatamente in modo da attraversarlo.
- Disegnare arti davanti o dietro il veicolo secondo il contatto effettivo: evitare compenetrazioni improprie e mezzi ancora visibili fuori dalla bocca dopo l'inghiottimento.
- Le dimensioni relative restano coerenti con ponte, camion, Ape, chopper con pilota, fuoristrada, pick-up e coupé; niente cambi improvvisi di scala.
- Nessun sangue/splatter è richiesto: il tono horror deriva da silhouette, massa, dinamica e impatto.

## 6. Portale neoclassico: geometria, prospettiva ed emersione

### 6.1 Aspetto e scala

Il portale è una **struttura architettonica** gigantesca, con colonne, architrave, frontone e cornici neoclassiche, in pietra chiara con dettagli dorati; nella soglia luce **bianca, azzurra e blu**. Deve contrastare in modo evidente con lava, carbone, basalto, metallo e rovine dell'inferno.

- **Più largo dell'intera sezione trasversale del ponte**, e sufficientemente alto da accogliere il mezzo vincitore attraverso l'apertura.
- Non un anello magico, non un varco sci-fi, non una porta decorativa incollata allo schermo.
- Struttura solida: peso visivo, ombre sui fianchi, profondità di colonne e trabeazione, soglia attraversabile. La luce non deve annullare i contorni pixel-art.

### 6.2 Regola inderogabile: rispettare la prospettiva della scena

Il ponte esistente ha un proprio sistema visuale bidimensionale/pseudo-tridimensionale, una direzione di marcia, quote del piano stradale e livelli di occlusione. Il portale **deve essere disegnato nello stesso spazio/proiezione**, anziché sovrapporre uno sprite frontalmente alla telecamera.

Requisiti verificabili:

1. **Orientamento:** il vano attraversabile è disposto **trasversalmente alla direzione di marcia**, così il veicolo può entrarvi seguendo la traiettoria e senza girarsi artificialmente; colonne, facciata e spessore adottano l'angolo suggerito dalla proiezione già usata dalla scena.
2. **Dimensionamento:** calcolare scala e larghezza apparente a partire dalla stessa trasformazione spaziale adottata per ponte e veicoli. Se il renderer usa una proiezione 2.5D semplificata, rispettarla: non inventare un punto di fuga incompatibile.
3. **Ancoraggio:** il portale nasce da **un punto nello spazio del mondo** davanti al vincitore, non da coordinate fisse dello schermo; il suo movimento sul Canvas risponde correttamente alla telecamera e allo scorrimento.
4. **Base immersa:** le fondazioni rimangono al livello del **lago di lava**, come quelle dei pilastri del ponte. Mentre emerge, la base è ancora immersa; non galleggia nell'aria e non sembra poggiare *sopra* il manto stradale.
5. **Occlusione:** parapetti, bordo vicino, bordo lontano, pilastri e detriti coprono/sono coperti dalle parti appropriate del portale, secondo la profondità. La soglia deve poter nascondere gradualmente il veicolo mentre la attraversa.
6. **Coerenza geometrica:** il portale non cambia misteriosamente proporzioni durante la risalita, non oscilla rispetto ai punti di contatto, non taglia il suolo senza distruggerlo; frontone e colonne mantengono allineamento e solidità.
7. **Niente clipping:** l'inquadratura mostra la monumentalità del portale senza tagli indesiderati, salvo occlusioni intenzionali dei suoi elementi architettonici.

### 6.3 Emersione e distruzione fisicamente leggibile del ponte

1. Il portale emerge **verticalmente dal lago di lava**, dall'alto della struttura visibile verso la posizione definitiva, con progressione di accelerazione/decelerazione coerente con una massa enorme.
2. L'emersione produce turbolenza della lava: onde, spruzzi, bagliori e detriti, mantenendo distinguibili portale e ponte.
3. Quando l'architettura interseca la struttura del ponte, **l'impatto causa la rottura**: deformazione o sollevamento, fratture che si propagano, sezioni del parapetto e impalcato che cedono, detriti che precipitano nel lago.
4. La frattura deve avere **un nesso causale visibile** con la geometria e il moto del portale, non un semplice dissolve o una crepa casuale lontana dalla zona di contatto.
5. **Passaggio possibile:** non rompere anticipatamente l'unico tratto che il vincitore deve percorrere. Mantenere un raccordo/soglia fisicamente credibile fino all'attraversamento; la distruzione può interessare bordi e sezioni esterne o posteriori.
6. Se necessario, implementare una rappresentazione del ponte in segmenti per il finale; il danno puramente cinematografico **non altera** la giocabilità ordinaria né richiede nuova fisica di collisione nel motore quiz.
7. Il portale si illumina e **si apre dopo aver completato l'emersione** o in stretta successione leggibile. L'apertura non deve sembrare una semplice comparsa improvvisa dello sprite.

## 7. Attraversamento, sprofondamento ed epilogo

1. **Ultima accelerazione.** Il demone è vicino; il vincitore accelera sulla porzione di ponte percorribile verso la soglia. Evitare accelerazioni istantanee e cambi di verso.
2. **Attraversamento.** Il mezzo entra nella luce **in profondità**: parte anteriore, abitacolo e posteriore scompaiono progressivamente dietro il piano della soglia o nella luce, con occlusioni coerenti; la sagoma non si limita a dissolversi davanti al portale. Per il chopper, anche il pilota attraversa insieme al mezzo.
3. **Chiusura/sprofondamento.** Solo dopo che il vincitore è scomparso integralmente, la soglia si richiude/perde luce e il portale **sprofonda nella lava**. La discesa segue la stessa geometria dell'emersione in senso inverso, mantenendo l'orientamento; onde e bagliori reagiscono al movimento. Il ponte spezzato resta danneggiato.
4. **Rabbia del demone.** La telecamera torna sul demone, che guarda il punto della scomparsa; il demone si ferma, manifesta incredulità/frustrazione, si china e **batte violentemente entrambi i pugni a terra** più volte. Ogni colpo ha anticipazione, impatto, scuotimento misurato dell'inquadratura, polvere e frammenti del ponte.
5. **Fiammata.** Il demone spalanca le fauci e **sputa una grande fiammata per rabbia**; la fiamma esce dalla bocca, ha direzione/ampiezza leggibili e non lo attraversa. L'espressione rimane furiosa.
6. **Sconfitta.** Dopo la fiammata il demone resta **immobile e ansimante per un breve istante**, sconfitto e frustrato davanti al ponte distrutto. Non aggiungere un secondo ruggito o altri gesti che allunghino inutilmente l'epilogo.
7. **Titolo soltanto ora.** Compare `VITTORIA` con sottotitolo **`[Nome del giocatore] è fuggito dall'inferno!`**. Nome estratto dallo stato reale della partita, non hardcoded. Il titolo non deve sovrapporsi alle animazioni precedenti.

**Raccordo con il finale esistente:** la versione corrente usa un ruggito, una fiammata e una fase di rabbia con tempistiche diverse; **sostituire e riordinare**, evitando di riprodurre in aggiunta la vecchia coreografia dopo questa sequenza.

## 8. Regia, rendering e gestione temporale

### 8.1 Coordinate condivise

Si raccomanda di distinguere chiaramente:

- `world`: progressione lungo la strada, posizione laterale sul ponte e altezza dalla lava;
- `camera`: inquadratura, eventuale inseguimento/zoom e traslazione;
- `screen`: pixel Canvas derivati dalla trasformazione comune;
- `actorPose`: animazione del corpo e ancoraggi di mani, bocca e piedi.

Non è obbligatorio introdurre un motore 3D. Una trasformazione 2D/2.5D condivisa tra gli attori è preferibile a simulazioni elaborate scollegate dagli asset esistenti.

### 8.2 Clock della scena

- Un clock monotono della cutscene determina timeline, transizioni, veicoli, demone, ponte, portale, effetti e telecamera; consentire campionamento deterministico a un tempo specifico per screenshot/test.
- La cadenza dei passi dipende dalla **distanza percorsa rispetto al piano del ponte**; il solo timer dei fotogrammi non deve produrre corsa sul posto.
- Assicurarsi che durante un finale il fondo/ponte non si congelino mentre gli attori continuano a correre, salvo precisa scelta della telecamera compensata dalle loro coordinate. La versione corrente aggiorna `roadPhase` in condizioni differenti tra gara e finale: controllare questo punto.
- Evitare salti temporali al ritorno dalla scheda nascosta; rispettare pausa e riduzione del movimento.
- Definire un insieme piccolo di durate configurabili, evitando `magic numbers` ripetuti.

### 8.3 Ordine di disegno e clipping

Definire livelli espliciti per lava/fondazioni, ponte distante, personaggi, parapetto vicino, detriti e portale; le occlusioni possono dipendere dall'interazione. Clippare intenzionalmente solo dove la geometria lo richiede, **mai** con un rettangolo statico che tagli testa o corna del demone o frontone del portale.

### 8.4 Modalità e asset

- Preferire sprite/sheet compatibili con il renderer corrente e riutilizzare i moduli esistenti; se servono nuovi asset, nominarli/attribuirli nel README pertinente e caricarli correttamente anche nell'export offline.
- Le prestazioni devono restare fluide sugli smartphone; non generare migliaia di particelle o filtri costosi per ogni frame.
- In `prefers-reduced-motion` le transizioni diventano brevi pose illustrative/titoli statici, ma la logica di avanzamento e l'accessibilità restano corrette.

## 9. Casi funzionali obbligatori

| Scenario | Risultato richiesto |
| --- | --- |
| Partita appena avviata: tutti a 0 | Nessuno spareggio anticipato. |
| Fine domande ordinarie, primo unico | Finale di vittoria diretto, nessuna intro spareggio. |
| Parità al primo tra due; terzo con meno punti | Il terzo è escluso secondo il motore, cattura gestita una volta, intro con i soli due finalisti. |
| Parità al primo tra tre | Intro con tre finalisti, un cuore ciascuno. |
| Primo del giro sbaglia | Eliminato/catturato, ma gli altri ancora previsti **rispondono**. |
| Due superstiti rispondono correttamente | Nuovo giro di spareggio, nessuna dichiarazione prematura del vincitore. |
| Tutti eliminati nel giro | Game Over, nessun portale. |
| Vittoria con due perdenti residui | Fila indiana, demone mangia ultimo e penultimo, poi insegue il vincitore. |
| Vittoria con un solo perdente residuo | Una sola cattura; nessun veicolo fantasma. |
| Vittoria senza altri veicoli | Saltare la fase delle catture, non crearne di nuove. |
| Giocatore già divorato in fase ordinaria/spareggio | Non riappare nel finale. |
| Portale emerge e rompe il ponte | Base immersa nella lava, prospettiva/occlusioni coerenti, accesso ancora percorribile. |
| Vincitore attraversa | Veicolo e pilota interamente oltre soglia prima della discesa. |
| Portale sprofonda | Demone reagisce **dopo** la scomparsa; quindi compare VITTORIA. |
| Tab nascosta/pausa/ripresa | Niente doppie catture, salto di timeline o timer inavvertitamente attivo. |
| Mobile / viewport ridotti | Nessun clipping di demone, portale, nomi, pulsanti e pannelli. |
| Movimento ridotto | Informazioni narrative comprensibili e nessun blocco di interazione. |

## 10. Test, screenshot e artefatti di revisione

Prima di proporre il merge:

1. Eseguire i test pertinenti già previsti (`npm test`, `npm run test:frames`, `npm run test:endings`, `npm run test:browser`, `npm run test:offline`) **quando l'ambiente li supporta**; documentare ogni comando eseguito e gli eventuali limiti, senza dichiarare test non svolti.
2. Aggiungere test automatici per il trigger **unico** dell'intro spareggio, timer fermo, ordine completo di un giro, assenza di punteggi/Ammo, ordine delle catture, discesa successiva all'attraversamento e emissione singola dell'evento di completamento.
3. Predisporre un metodo di **campionamento deterministico** del filmato a timestamp predefiniti, così test e screenshot catturano le stesse fasi anche senza aspettare una partita completa.
4. Mostrare screenshot aggiornati delle fasi: **ultima domanda / intro spareggio / primo turno spareggio / cattura del perdente / fila indiana / accelerazione demone / emersione del portale / rottura del ponte / attraversamento / sprofondamento / pugni e fiammata / VITTORIA**.
5. Produrre **un'anteprima scaricabile dalla stessa revisione** degli screenshot, idealmente HTML autonomo offline; includere almeno uno scenario di spareggio e uno scenario di vittoria. Un video/GIF può aiutare, ma **non sostituisce** l'anteprima interattiva.
6. Verificare manualmente il senso di prospettiva e il contatto portale-ponte con una sequenza di frame consecutivi; uno screenshot isolato non basta a provare il movimento.
7. Creare PR con riepilogo, modifiche alle regole (attese: **nessuna**), screenshot, anteprima, test eseguiti e problemi noti. **Non eseguire merge o pubblicazione senza approvazione.**

## 11. Piano di implementazione suggerito

Le seguenti PR sono sequenziali, per ridurre regressioni e rendere verificabili i cambiamenti:

1. **PR A — locomozione e spazio di scena:** unificare movimento e cadenza del demone con strada/telecamera; risolvere head-clipping e discontinuità, senza cambiare i risultati della gara.
2. **PR B — transizione di spareggio:** introdurre intro e messaggi/animazioni di eliminazione con blocco controllato dell'UI, rispettando il motore esistente.
3. **PR C — inseguimento e catture:** convergenza in fila, accelerazione del demone e presa/inghiottimento sequenziale dei perdenti residui.
4. **PR D — portale, ponte ed epilogo:** architettura neoclassica prospetticamente corretta, comparsa dalla lava e rottura, attraversamento, sprofondamento, rabbia e titolo finale.

È lecito unire PR vicine solo se il codice e i test dimostrano che restano comprensibili; evitare un gigantesco refactoring non correlato. Fare refactoring dei moduli toccati quando necessario, secondo `AGENTS.md`.

## 12. Standard unico di risoluzione e adattamento dell’interfaccia

### 12.1 Dimensioni di riferimento

**Decisione progettuale:** mantenere un **palco logico di riferimento 1024 × 768 (4:3)** per le schermate del gioco, comprese home, selezione dei veicoli, quiz ordinario, spareggio, cutscene e schermata conclusiva. Questo vincolo riguarda **layout e proporzioni, non la qualità degli asset**: è vietato trattare 1024 × 768, o il Canvas interno 512 × 384, come limite massimo della risoluzione delle immagini. Preservare orientamento e proiezione della scena di corsa. Non migrare automaticamente a 16:9.

- **Scene Canvas:** il renderer esistente impiega una larghezza interna di 512 pixel in almeno una pipeline. Trattarla come una **scelta implementativa da verificare**, non come uno standard estetico obbligatorio per tutto il gioco. Il riferimento di coordinate può restare 512 × 384 anche con un buffer fisico più grande o asset molto più definiti, purché coordinate e hitbox non cambino. Non alterare indiscriminatamente pixel-art già nitida; evitarne però l’ingrandimento sfocato. Le illustrazioni ad alta definizione e i loghi devono mantenere la loro nitidezza indipendentemente dal Canvas.
- **Unità:** distinguere esplicitamente coordinate logiche di palco, pixel della texture/sprite, coordinate CSS, pixel fisici del display e coordinate mondo (ponte/veicoli/portale). Evitare valori hard-coded che mischiano questi sistemi.
- **Un solo contratto di layout:** tutte le sottosequenze e schermate inquadrate nel palco devono utilizzare le stesse dimensioni logiche e la stessa conversione a schermo; la timeline del finale e la transizione allo spareggio non possono cambiare arbitrariamente rapporto d’aspetto o scala.
- **Nitidezza:** applicare `image-rendering: pixelated` o nearest-neighbor **solo** alle risorse dichiaratamente pixel-art; non imporlo globalmente alla home, al logo, alle immagini illustrate, alle decorazioni ad alta definizione o ai testi. Per le illustrazioni utilizzare il campionamento appropriato; per gli sprite pixel-art privilegiare scale intere dove possibile. Non troncare asset per forzare scale intere.

### 12.2 Responsive: distinguere palco e pannelli UI

**Risoluzione logica fissa non significa dimensione CSS fissa.** La pagina deve poter essere fruita su monitor 16:9, tablet e smartphone senza imporre una finestra fisica 1024 × 768.

1. **Palco della corsa/cutscene:** usare scaling uniforme `min(viewportWidth/1024, viewportHeight/768)` nell’area disponibile, sempre **4:3**, centrato. Lo spazio residuo può diventare bordo/letterbox a tema; mai stirare per riempire 16:9 o 20:9, mai `object-fit: cover` con ritaglio di demone, portale o veicoli.
2. **Schermate interattive e testi:** mantenere lo stesso design reference **1024 × 768**, ma consentire reflow responsive di pulsanti, testo, selezioni, inventari e modali quando il dispositivo è stretto. Non ridurre l’intera UI di un fattore 0,38 sul telefono rendendola illeggibile. I pannelli possono andare sotto il palco o occupare uno scorrimento controllato, mentre il Canvas resta 4:3.
3. **Mobile:** conservare aree touch adeguate, testi leggibili, rispetto delle safe area e nessuno scorrimento orizzontale involontario; le scorciatoie da tastiera restano disponibili solo in contesti desktop secondo le regole esistenti.
4. **Fullscreen:** ingrandire uniformemente il palco entro l’area visibile e preservare 4:3, anziché cambiare dimensioni logiche o ritagliare la scena. Il comportamento dei controlli deve restare accessibile.
5. **Home/regole/selezione:** uniformare proporzioni, allineamenti, margini, font e scaling degli elementi illustrati al sistema di riferimento, senza forzare i testi lunghi dentro un Canvas a risoluzione rigida.

### 12.3 Portale e composizione cinematografica

Il portale più largo del ponte deve **rimanere in prospettiva anche quando cambia la dimensione CSS del palco**: proiettare la geometria nello stesso mondo 2.5D del ponte e trasformarla successivamente nella risoluzione logica 1024 × 768. Il suo dimensionamento rispetto ai pilastri, alla strada e al veicolo non deve dipendere dalla larghezza reale del browser. In caso di restringimento del viewport, **non** ricalcolare la sua posizione in coordinate CSS indipendenti. Evitare clipping durante risalita, frattura del ponte, attraversamento e sprofondamento.

### 12.4 Implementazione e verifica

- Verificare **prima** come il progetto gestisce attualmente palco 4:3, Canvas raster 512 px di larghezza, CSS e viewport; conservare quanto è già conforme e correggere solo le incoerenze. Non introdurre una seconda pipeline di rendering o ridisegnare tutti gli asset senza necessità.
- Centralizzare dimensioni, ratio, matrice di trasformazione e scaling nel modulo più adatto, con un’unica fonte autorevole utilizzata da scena, UI e test; non duplicare le costanti in CSS e JavaScript senza una strategia esplicita.
- Testare almeno: **1920 × 1080, 1366 × 768, 1024 × 768, 844 × 390 e 390 × 844**, oltre a fullscreen, cambio orientamento e densità di pixel diverse. Controllare palco completo, leggibilità, focus, dimensioni dei controlli e posizione degli sprite.
- Confrontare screenshot di schermata iniziale, selezione veicolo, domanda, spareggio, portale alla massima emersione e schermata VITTORIA. Lo stesso soggetto deve mantenere geometria e proporzioni in ogni viewport, a parità di stato e timestamp.
- Trattare lo standard visivo come intervento preparatorio alle cutscene. Se la normalizzazione richiede cambiamenti sostanziali, dedicare una **PR preliminare di risoluzione/layout** con test di regressione e anteprima scaricabile, prima delle PR di animazione. Non fare merge senza approvazione.


### 12.5 Correzione di obiettivo: uniformità della definizione VISIVA, non solo dei pixel del palco

**Chiarimento di requisito dell'utente (vincolante per questa versione):** il problema non è soltanto il rapporto 4:3. Oggi alcuni elementi appaiono molto più definiti di altri; l'esempio evidente è la **home**, la cui illustrazione sembra più dettagliata e nitida del titolo/logo `HELLSCAPE`. **Lo scopo è portare gli elementi più deboli al livello qualitativo degli elementi già riusciti. Non ridurre la definizione delle immagini migliori per pareggiarle verso il basso.**

La dimensione in pixel, da sola, **non misura** il dettaglio visivo. Una grande immagine può essere un bitmap piccolo già ingrandito, una texture sfocata o un disegno stilisticamente grossolano. Il rapporto tra pixel originali, dimensione *effettiva* di visualizzazione, device-pixel-ratio, algoritmo di campionamento, nitidezza degli spigoli, trattamento del testo e coerenza del linguaggio figurativo deve essere analizzato **sui fotogrammi realmente renderizzati**, non ricavato dal nome del file.

**Riscontro dal markup del repository al momento della stesura:** `index.html` dichiara `assets/hellscape-chase.webp` a `1448 × 1086` e `assets/hellscape-logo.webp` a `2172 × 724`. Sono dimensioni dichiarate nell'HTML, **non** una misurazione indipendente della qualità dei file. Il CSS `assets/home.css` fa convivere l'illustrazione e il wordmark e contiene inoltre una regola `image-rendering: pixelated` per l'eventuale variante `.pixel-wordmark`. Controllare in DevTools **quali classi sono davvero applicate**, il `naturalWidth`/`naturalHeight`, i pixel CSS occupati, i filtri, la composizione e il risultato a diverse densità dello schermo prima di attribuire la causa a un asset specifico.

**Standard qualitativo richiesto:** la home e tutte le altre interfacce devono apparire come prodotti dello stesso gioco, con medesima cura di disegno, contorni, materiali, illuminazione, contrasto e rifinitura tipografica. La scena può mantenere una grammatica *pixel-art horror/dieselpunk* per i personaggi e il gameplay, ma non deve contenere asset palesemente sfocati, sgranati, ingranditi male o con un livello di rifinitura anomalo rispetto ai vicini. Uniformità qualitativa **non significa necessariamente tutti gli asset con identica griglia di pixel o identico filtro**.

### 12.6 Audit visuale e intervento prioritario sul logo iniziale

**Fase obbligatoria prima di rigenerare asset:** creare un inventario **di tutti gli elementi grafici visibili**: home, wordmark/loghi, menu, titoli e font, pulsanti, icone Ammo, veicoli, demone, ponte, lava, paesaggio, portale, schermate di domanda, intro spareggio, finali e Game Over. Per ciascuno rilevare:

1. percorso/selector e funzione; tipo (raster, vettoriale, CSS, font, Canvas sprite);
2. dimensioni intrinseche reali e dimensioni CSS/Canvas di visualizzazione a DPR 1 e 2;
3. eventuale upscaling/downscaling, interpolazione/`image-rendering`, sfocature/filter, compressione e alpha;
4. **qualità percepita in screenshot** nel contesto, non solo rapporto matematico di risoluzione;
5. classe di intervento: **OK / migliorare rendering / ricreare asset**, con una priorità motivata.

**Priorità 1 — home:** confrontare `assets/hellscape-chase.webp` e `assets/hellscape-logo.webp` alle effettive dimensioni d'uso, anche su smartphone e full screen. Verificare se il logo appare meno definito per scarsa qualità originale, bordi sgranati, texture non curate, styling incongruente, filtri o ridimensionamenti. **Intervenire sul wordmark mantenendo scritta `HELLSCAPE`, gerarchia e atmosfera infernale, ma portando contorni, volume, materiali metallici/rocciosi, luce e dettagli allo stesso livello di cura dell'illustrazione.** Non sostituire il logo con semplice testo generico o con un effetto pixelato grossolano. Se è opportuno ricostruirlo, preferire un file master vettoriale quando il risultato è realmente vettoriale, oppure un raster ad alta definizione con trasparenza e dimensioni adeguate agli usi; la conversione in SVG di un bitmap incorporato **non** ne aumenta la definizione. Conservare la silhouette e la leggibilità della parola a dimensioni ridotte.

**Priorità 2 — resto dell'interfaccia e scena:** normalizzare gli elementi realmente difettosi. Conservare gli asset già riusciti; sostituire solo quelli che falliscono l'audit. Dove si mantenga pixel-art, armonizzare dimensione dei pixel visibili, tecnica di shading, palette, contorni e livello di dettaglio **tra sprite comparabili**. Per sfondi illustrati e loghi high-definition mantenere contorni nitidi con campionamento adatto. Per Canvas, valutare un buffer scalato sul `devicePixelRatio` soltanto se migliora chiaramente la resa e le prestazioni, conservando coordinate logiche e comportamento di input; non confondere buffer più grande con aggiunta automatica di dettaglio agli sprite originali.

**Divieti:** non applicare un filtro di sharpening artificiale a tutto il sito, non alzare soltanto le dimensioni dei file con upscale automatico e dichiarare risolto il problema, non introdurre un mix casuale di illustrato realistico, low-res sfocato e pixel-art grezza, non rinominare o cancellare gli originali prima di verifica comparativa e approvazione.

### 12.7 Revisione visiva e criteri di accettazione della qualità

Consegnare **prima/dopo affiancati** e screenshot reali dalla **stessa versione** dell'anteprima scaricabile per:

- home integrale e ritaglio 100% / 200% di illustrazione + logo;
- menu/icone/testi (almeno desktop e Android);
- veicoli/demone/ponte/lava su Canvas e confronto fra asset vicini;
- intro spareggio, portale alla massima emersione, titolo VITTORIA.

**Accettazione:** nessun elemento principale è significativamente più sfocato o con qualità della rasterizzazione inferiore ai vicini senza un'intenzionale e documentata scelta artistica. Contorni coerenti, gerarchia leggibile, nessun alone/cucitura/ritaglio introdotto, tempi di caricamento e fluidità non peggiorati sensibilmente, export HTML offline integro. Testare DPR 1/2 e viewport desktop/mobile; non è sufficiente verificare il file originale nel visualizzatore d'immagini. Segnalare le differenze estetiche inevitabilmente soggettive e sottoporre alla revisione dell'utente **prima del merge**.

**Sequenza PR raccomandata:** separare una **PR di audit e correzione qualità grafica** (iniziare dal logo) dalla PR di uniformità layout 4:3, e poi dalle PR cinematografiche; così non si confondono bug di scaling con scelte illustrative. Se l'audit mostra che una correzione grafica dipende dal renderer, integrare solo quella dipendenza e documentarla.

## 13. Istruzione breve da fornire a Codex

> Leggi e applica integralmente `docs/HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md` e `AGENTS.md`. Prima di modificare il codice verifica lo stato corrente del repository e mappa le funzioni effettive nei moduli `assets/hell-race.js`, `assets/hell-ending.js`, `assets/hell-bridge.js`, `assets/js/engine.js` e `assets/js/ui.js`. Procedi prima dalla **PR di risoluzione/layout** se lo standard della sezione 12 non è ancora rispettato; altrimenti inizia dalla **PR A** del piano di implementazione. Conserva le regole del motore e i salvataggi. Per ogni PR mostra screenshot effettivi e un'anteprima HTML scaricabile della medesima revisione, i test eseguiti e gli eventuali limiti. **Non fare merge senza la mia approvazione.**

---

### Cronologia delle versioni

- **1.2.0 — 27/10/2026:** chiarito che l’uniformità richiesta riguarda la definizione percepita degli asset, non soltanto la risoluzione 4:3; aggiunti audit grafico globale, priorità al logo rispetto all’illustrazione della home, standard di rendering per asset illustrati e pixel-art, confronto prima/dopo e PR preliminare di qualità visiva.
- **1.1.0 — 27/10/2026:** aggiunto standard grafico unico 1024 × 768 (4:3), raster pixel-art di riferimento 512 × 384, scaling responsive, requisiti di leggibilità su smartphone e test di visual parity.
- **1.0.0 — 27/10/2026:** prima specifica consolidata per locomozione del demone, finale con catture, portale in prospettiva, frattura del ponte, sprofondamento, epilogo e passaggio allo spareggio a eliminazione.