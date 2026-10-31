> **NOTA DI PRECEDENZA (31/10/2026):** la [nuova direzione Hellscape con Bafometto e città biomeccanica dai quartieri ispirati ai settori infernali](HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.1.0_20261031.md) sostituisce **solo per il redesign futuro** le istruzioni artistiche seguenti su Cerbero, fiammate, eliminazione per caduta nella lava, fondale fisso e portale discendente. Conservare il testo sottostante come storico e riferimento allo **stato del runtime precedente**, non come incarico di implementazione corrente. Le altre regole di gioco restano valide. Non sono stati sostituiti asset o codice.

# Hellscape — specifiche di progetto e casistiche degli asset

**Versione:** v1.0.1 · **Data:** 31 ottobre 2026 (Europe/Rome)  
**Stato:** migrazione editoriale, senza nuove approvazioni di asset né variazioni di comportamento del gioco.  
**Fonti:** `AGENTS.md` e `docs/PROTOCOLLO_SPRITE_ANIMATI_v13.0.0_20261030.md`, branch `docs/cerbero-biomeccanica-v13-20261030`; richieste già deliberate, con precedenza per le specifiche più recenti e le approvazioni puntuali.  
**Ambito:** requisiti **di Hellscape**, non regole valide per qualsiasi progetto.

Questo fascicolo conserva le istruzioni contestuali e gli esempi di produzione prima presenti nei documenti trasversali. È **un rinvio storico e operativo**: se una specifica di Hellscape successiva supera una regola qui registrata, prevale la più recente esplicitamente approvata. Le citazioni di vecchie PR, GIF o asset non costituiscono automaticamente stato aggiornato; verificare sempre la revisione corrente e i riferimenti canonici.

## 1. Specifiche di prodotto estratte da AGENTS.md (contenuto preservato; collegamenti adattati)

## Modalità di distribuzione — requisito corrente (30/10/2026)

- **Hellscape deve funzionare dal sito pubblicato via HTTP(S), attualmente GitHub Pages. L'esecuzione senza connessione Internet o da un file HTML autonomo non è richiesta.**
- L'esportazione offline e i relativi test sono stati rimossi con la PR #78. L'ambiente HTML interno di revisione grafica non costituisce una distribuzione offline del gioco; non richiedere HTML offline nelle PR o nelle anteprime.
- I test possono usare un pacchetto HTML autonomo come **ambiente interno di revisione grafica**, ma ciò non introduce un requisito di funzionamento offline per il prodotto; la verifica delle funzionalità del sito online resta prioritaria.
- Mantenere i salvataggi locali e la ripresa della partita nello stesso browser: non sono dipendenti dalla distribuzione offline. Non reintrodurre l'export offline senza una nuova richiesta esplicita. Qualsiasi modifica agli harness di revisione deve preservare test, screenshot reali e isolamento dei salvataggi.

## Orientamento del gioco

- Il gioco si usa esclusivamente con schermo orizzontale (larghezza maggiore dell’altezza), sul sito e in schermo intero. In verticale o su finestra quadrata mostrare l’invito a ruotare, impedire comandi e fermare timer e animazioni. Conservare domanda, stato e pannelli aperti; tornare in orizzontale permette la ripresa esplicita della domanda. Le vecchie prove in verticale sono documentazione storica.

## Direzione grafica e fase di approvazione del ponte

- La coerenza fisica della scena prevale sulla leggibilità costante dei veicoli. Strutture in primo piano possono occluderli: rispettare profondità, prospettiva, ombre, materiali e punti d’appoggio, senza spostare o abbassare gli elementi soltanto per lasciare visibili i mezzi.
- Ripartire dal progetto della strada: un ponte di metallo e pietra neri sopra un mare di lava, in stile junkpunk, gotico e horror. Le colonne decorative proposte sono scartate.
- Il ponte della seconda GIF è approvato dall’utente: preservare lava e struttura nello stesso riferimento di camera e i veicoli ingranditi al doppio. La successiva specifica Omen della PR #49 supera la fase storica di Antisigillo.
- L’animazione del portale è approvata. Il suo sprite deve essere disegnato nativamente di taglio, con spessore e prospettiva coerenti: non deformare una facciata frontale per simulare la vista laterale. Posizionare lo sprite con traslazione e scala uniforme, preservando i tempi della sequenza.
- Il portale di taglio con dettagli dorati e crollo in rocce è approvato («Ok bellissimo. Vai avanti»). La successiva richiesta autorizza la consegna delle regole Ammo: Antisigillo 20% (regola storica rimossa dalla specifica Omen della PR #49); Sacrificio 5%, −1 vita e +777 punti; Tributo trasferisce il 33% esatto dei punti attuali dell’avversario e chi lo usa rinuncia subito al turno corrente (chiarimento esplicito dell’utente).
- I dettagli del portale restano dorati: verificare che l’esportazione GIF non li sposti verso l’arancione della lava. Il crollo produce rocce e blocchi di pietra volumetrici, con gravità, piccoli rimbalzi e macerie permanenti; non fogli o ritagli piatti della facciata.

## Regola aggiornata di Malocchio

- La consegna di Sacrificio, Tributo e probabilità è approvata («Ok va bene»). Malocchio mostra testo e valore senza alternative e concede 45 secondi per scegliere se tenerla o a chi passarla. Alla scadenza resta all’utilizzatore e parte il normale tempo di risposta. Pausa, orientamento, salvataggio e ripresa conservano il residuo; chi risponde bene tiene punti e Ammo, chi sbaglia o lascia scadere il tempo perde il valore della domanda con minimo zero (chiarimento esplicito). La rotazione riparte da chi segue l’utilizzatore, anche dopo il passaggio a un altro gruppo, rispettando Catene ed eliminazioni. Salvare autore e rischio della domanda senza riapplicare esiti già registrati.

## Regola aggiornata di Sigillo

- Sigillo protegge dagli effetti negativi delle Ammo altrui, ma blocca ogni altro uso di Ammo e la loro acquisizione da risposte corrette. Flagello e Livella ignorano la protezione; Antisigillo è rimosso dalla specifica Omen della PR #49.
- Interpretazione operativa comunicata: tre turni personali, incluso quello di attivazione; contatore 3 → 2 → 1, scadenza all’inizio del quarto. Livella include il protetto nella redistribuzione. Sigillo rimuove Catene, Tributi e Arsenico pendenti e non evita sanzioni o rischi autoimposti.

## Regola aggiornata di Contrappasso

- Contrappasso è attivabile su di sé per tre turni personali, incluso quello di attivazione. Raddoppia i punti delle risposte corrette e sottrae il doppio del valore in caso di errore o timeout, con minimo zero. Non trasforma più le Ammo avversarie, non si accumula e non raddoppia i premi Ammo o i punti di altre Ammo.
- Con Malocchio conta il Contrappasso del rispondente: penalità complessiva ×2, senza sommare un ulteriore ×1. Un Sigillo successivo non annulla un rischio proprio già attivato. Preservare contatori e copie storiche nei salvataggi senza applicare bonus retroattivi.

## Specifica Omen della PR #49

- Applicare [la specifica Omen, Cerbero e layout v1](HELLSCAPE_SPEC_OMEN_CERBERO_LAYOUT_v1.md), che supera le regole storiche discordanti di Catene, Antisigillo e Livella. I design della PR #51 sono approvati dall’utente («Approvo tutto, preferisco quello più rosso carne»): usare il Cerbero rosso/carnoso e la fiala Arsenico come riferimenti canonici per rig, animazioni e integrazione, seguendo il protocollo. Ultima disposizione richiesta: Opzioni in alto a sinistra e lista giocatori in alto a destra; domanda centrata in basso che si apre verso l’alto, barra del tempo sopra la domanda.

## Correzione Cerbero e veicoli

- Animare Cerbero con fotogrammi disegnati e articolazioni leggibili: camminata fluida, coda che scodinzola dalla base alla punta, tre teste con movimenti dei colli sfalsati durante il passo e fuoco che nasce dalle tre bocche. La deformazione elastica della sola posa statica è respinta.
- I veicoli sono rigidi: vietare contrazioni e dilatazioni della carrozzeria. Mostrare le irregolarità della strada con piccoli spostamenti verticali e oscillazioni delle sospensioni, conservando le proporzioni.
- Durante la partita Cerbero sputa fuoco ogni 60 secondi attivi dalle tre bocche, continuando il passo; l’effetto è soltanto visivo e segue pausa e movimento ridotto. Nella home Cerbero sostituisce il demone.
- Correzione 29/10/2026: **13 turni per giocatore**, cioè 13 giri completi da tre occasioni ciascuno (39 occasioni totali, salvo conclusione anticipata per eliminazioni). Una risposta, un turno saltato per Catene o un turno ceduto contano ciascuno come un'occasione; Malocchio non crea un'occasione aggiuntiva. Il massimo configurabile è la somma delle domande di tutte e tre le difficoltà negli argomenti selezionati divisa per il numero dei giocatori, arrotondata per difetto. Le quote degli argomenti ripartiscono **turni × giocatori domande**, non soltanto turni. La configurazione delle nuove partite usa `roundCount` (turni per giocatore), mentre le partite precedenti con `turnCount` conservano il loro vecchio limite complessivo. Non mostrare filtri di difficoltà nelle nuove partite: il livello determina soltanto i punti. Ogni banca include tutti i tre livelli; migrare i profili precedenti a difficoltà mista conservando le altre preferenze.
- Punti predefiniti delle nuove partite: facile 111, media 222, difficile 333. Conservare i valori personalizzati dei profili e delle partite salvate.

## 2. CI e comandi della suite Hellscape (testo preservato)

## Controlli CI e copertura (30/10/2026)

- La CI deve mantenere la verifica completa del gioco sulle modifiche funzionali, inclusi motore, finale, spareggio, layout, Omen, persistenza, animazioni e asset. I test di scenario possono essere suddivisi in shard, mai omessi: l'unione deve coincidere con la suite integrale.
- Le modifiche limitate a documentazione, regole degli agenti, `.gitignore` e materiale storico in `docs/` possono usare una verifica breve del solo impatto. In caso di classificazione incerta o errore del rilevamento, eseguire la CI completa.
- Conservare `npm run test:browser`, `npm run test:ties` e `npm run test:chase` come comandi integrali riproducibili localmente. Non allegare HTML autonomi come anteprime; caricare screenshot, GIF e rapporti pertinenti, privilegiando gli artefatti necessari per la revisione.

## 3. Archivio di evidenze specifico (testo preservato)

- L'archivio `docs/review-archive/20261030/` conserva byte per byte le evidenze uniche dei sette branch `review/*` precedenti; il manifesto `docs/REVIEW_EVIDENCE_ARCHIVE_v1.0.0_20261030.md` ne registra SHA e provenienza. Non eliminare i branch prima che il merge dell'archivio sia verificato e il workflow abbia ricontrollato tutti i blob, le modifiche e gli SHA delle head.

## 4. Casi e vincoli dell'animazione estratti dal protocollo sprite v13

### 4.1 Audit del diavolo volante

**Titolo nella fonte:** 2.1.2 Caso di applicazione: diavolo volante di Hellscape**

Al 29/10/2026, dal codice e dalla documentazione del repository si ricavano questi dati operativi da **riconfermare quando cambia il renderer**:

- `docs/HELLSCAPE_LAYOUT.md`: Canvas di scena **512 × 384 pixel logici**, palco di riferimento **1024 × 768**.
- `assets/hell-race.js`: funzione `flyingDevils()` con piccoli soggetti decorativi nel cielo, otto istanze; `devilPosition()` determina quota e movimento.
- Lo sprite procedurale esistente viene disegnato in un riquadro nominale **64 × 60** con scala circa **0,48–0,61**, quindi ingombro di riferimento nell'ordine di **31–39 × 29–37 pixel logici** (prima di eventuali trasparenze della sagoma).
- `assets/hell-race/infernal-world-v1.webp`, `assets/hell-race/lava-bridge-v1.webp`, `assets/hell-race/demon-actions-v1.webp`, screenshot delle scene approvate: riferimenti da ispezionare visivamente prima di dichiarare il nuovo sprite stilisticamente conforme. Il codice da solo non sostituisce la verifica delle immagini.
- **Ruolo:** sagoma atmosferica di secondo piano, non nuovo boss. Il design di riferimento deve funzionare soprattutto come silhouette con battito d'ali; ingombro e definizione devono essere calibrati sul Canvas, non sulla dimensione di una illustrazione da copertina.
- **Camera:** l'inquadratura laterale della corsa è la cornice compositiva. L'esatto angolo del personaggio va confrontato con la scena e confermato visivamente prima degli sprite definitivi. Una posa drammatica frontale a tre quarti non è automaticamente adatta.
- Durante la fase di test del concept non modificare il codice per riattivare i diavoli volanti eventualmente rimossi dalla versione di gioco in uso. L'integrazione richiede una richiesta e approvazione separate.

### 4.2 Galoppo del Cerbero

**Titolo nella fonte:** 2.2.3 Galoppo rotatorio a doppia sospensione — esempio operativo Cerbero**

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

### 4.3 Sequenza del fuoco

**Titolo nella fonte:** 5.1 Esempio illustrativo di 12 frame: Cerbero sputa fuoco**

| Frame | Fase | Corpo e teste | Effetti |
| --- | --- | --- | --- |
| 1–2 | Preparazione | Baricentro stabile; colli iniziano a tendersi verso i bersagli | Nessuna fiamma |
| 3–4 | Caricamento | Teste si orientano; mandibole si aprono | Nessuna fiamma prematura |
| 5–6 | Emissione | Bocche aperte; colli ancora connessi e proporzionati | Ogni getto nasce dalla propria bocca |
| 7–9 | Massima intensità | Reazione controllata e movimento continuo | Getti si estendono lungo la direzione delle rispettive bocche |
| 10 | Arresto | Inizio della chiusura delle mandibole | Le emissioni cessano alla fonte; residui possono proseguire |
| 11–12 | Recupero | Collo e testa tornano progressivamente verso la postura di partenza | Solo eventuali particelle residue separate |

La tabella descrive una **proposta di regia**, non frame già prodotti. Se i getti non sono simultanei, dichiarare esplicitamente l'ordine delle tre bocche. Non assumere che tutte le teste debbano sempre fare esattamente lo stesso movimento.

### 4.4 Tre bocche

**Titolo nella fonte:** 6.2 Cerbero: tre bocche, tre origini**

Per ciascuna testa definire un ancoraggio distinto. In ogni frame con emissione, controllare che:

- il getto sinistro nasca dalla **bocca della testa sinistra**, anche quando è più bassa rispetto alle altre;
- il getto centrale nasca dalla bocca centrale;
- il getto destro nasca dalla bocca destra;
- le tre sorgenti rimangano allineate alle tre bocche durante qualsiasi rotazione o traslazione;
- nessuna terza fiamma appaia in un punto vuoto soltanto perché lì era stata disegnata in un precedente tentativo.

La distinzione sinistra/centro/destra è **anatomica**, riferita alla creatura; annotare la corrispondenza con la vista sullo schermo per evitare inversioni.

### 4.5 Cerbero e veicoli

**Titolo nella fonte:** Esempio concreto: Cerbero e veicoli di Hellscape**

Per **Cerbero** creare distinte sequenze disegnate di locomozione, slancio, emissione di fiamme, morso/sbranamento, recupero e sprint. Ogni frame mostra teste, colli, busto e zampe connessi. La fiamma nasce da una bocca con ancoraggio identificato; l'attacco modifica corpo e postura, non solo la rotazione della testa. La telecamera segue il movimento nel mondo e deve poter risultare ferma mentre Cerbero sbrana il bersaglio: non muovere il ponte solo per fingere avanzamento.

Per **i veicoli** mantenere stabile la sagoma rigida della carrozzeria; animare ruote, sospensioni, inclinazioni del telaio e spostamento rispetto al mondo. Vietata la contrazione/dilatazione orizzontale del mezzo per simulare velocità.

### 4.6 Diavolo volante: prova

**Titolo nella fonte:** Applicazione di prova al diavolo volante**

- Analizzare la sequenza preesistente e registrare il risultato come **baseline**, distinguendo dati calcolati da valutazioni artistiche.
- Selezionare due estremi anatomicamente corretti (ali alte/ali basse); se la sequenza preesistente non ne contiene uno, **non spacciarla per completa** e creare il nuovo estremo.
- Valutare M facoltativo; approvare A/B e M se creato, poi generare lo spritesheet completo usando questi riferimenti. Verificare spalle, ossa alari, membrane, corpo, coda, testa e prospettiva in ogni cella.
- Correggere le celle difettose e rimuovere duplicati involontari solo senza lasciare salti; montare A→B→A quando reversibile, con tempi documentati e senza estremi duplicati. Il risultato del diavolo di questa sessione è un esempio pratico, non una garanzia generale del generatore.
- Produrre estrazione PNG, GIF e report di misure/limiti; **nessuna integrazione nel gioco e nessun merge prima dell'approvazione**.

### 4.7 Evidenze specifiche

**Titolo nella fonte:** 9.3 Evidenze da consegnare per Hellscape**

Seguire **AGENTS.md**: per animazioni, movimento e transizioni, **GIF animata reale acquisita dal browser** sulla stessa revisione; screenshot reali per stati statici. Nessun HTML incorporato o file HTML allegato come anteprima. Indicare viewport, durata, revisione e se la prova è desktop o mobile. Non dichiarare controlli che non sono stati eseguiti. Se è stato prodotto solo il documento e nessun asset è stato modificato, dichiararlo: **non fabbricare una falsa GIF**.

Nessun merge senza esplicita approvazione dell'utente.

### 4.8 Vincoli di rig e metodi

**Vincoli specifici conservati.** Per Cerbero resta respinta la deformazione elastica della sola posa statica; le sequenze complesse già prescritte in AGENTS.md rimangono disegnate. Questa revisione introduce la valutazione del rig per nuovi movimenti e parti idonee, senza sostituire automaticamente quel lavoro. Per nuove sequenze del diavolo volante applicare il percorso generativo §7.3; rig e tecnica mista restano alternative motivate, senza sostituire automaticamente le pose già approvate.

### 4.9 Veicoli e rigidità

**Regola specifica per Hellscape — veicoli:** durante accelerazione, decelerazione e corsa, **lunghezza, larghezza e proporzioni della carrozzeria restano costanti**. Mostrare velocità e terreno irregolare mediante traslazione, rotazione coerente del veicolo, movimento e compressione delle sospensioni, rotazione delle ruote, polvere/scintille ed eventuale camera tracking. La carrozzeria non deve espandersi o restringersi orizzontalmente. Una collisione può produrre danni locali coerenti con sollecitazione e materiale, non una deformazione elastica globale e reversibile.

## 5. Correzioni locali di sprite: applicazione specifica Hellscape

Il protocollo generale v15, §7.7, contiene le regole universali per maschere e ritagli. Per il postprocessing usare l'applicazione indipendente [sprites-post](https://github.com/rickymusu-bit/sprites-post), integrata e verificata al commit `870e1274`. I manuali operativi di estrazione, editor e correzione mascherata appartengono al repository del tool; i requisiti specifici di Cerbero, veicoli e altre scene restano in Hellscape. Non duplicare qui la pipeline.

## 6. Fonti e mantenimento

- **Metodo generale:** [protocollo sprite v15](PROTOCOLLO_SPRITE_ANIMATI_v15.0.0_20261031.md).
- **Norme trasversali:** [AGENTS.md](../AGENTS.md).
- **Specifiche esistenti:** [Omen/Cerbero/layout](HELLSCAPE_SPEC_OMEN_CERBERO_LAYOUT_v1.md), [cinematiche](HELLSCAPE_SPEC_CINEMATICHE_v1.2.0.md) e successive revisioni; non sostituire tali documenti senza un audit delle precedenze.
- **Produzione cattura veicoli:** la PR #96 contiene un piano dedicato, non mergiato al momento dell'estrazione; non interpretare questo fascicolo come implementazione di quel piano.
- **Postprocessing:** tool separato nel [repository sprites-post](https://github.com/rickymusu-bit/sprites-post) alla revisione [870e1274](https://github.com/rickymusu-bit/sprites-post/commit/870e1274aee5fd42ede786cff7eec944087c7771); utilizzarlo come dipendenza di sviluppo, non di esecuzione del gioco.
- Non riportare nuove prescrizioni specifiche in AGENTS.md o nel protocollo generale: aggiornarle nella specifica dell'asset/gioco interessato. La cronologia delle versioni conserva i riferimenti storici.
