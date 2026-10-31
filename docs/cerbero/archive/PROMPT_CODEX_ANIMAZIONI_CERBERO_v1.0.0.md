> **ARCHIVIO STORICO — NON ESEGUIRE (1 novembre 2026).** Questo prompt Codex descrive il precedente progetto di animazione di Cerbero, **interamente superato** dalla nuova direzione di Hellscape: **Bafometto biomeccanico levitante**, artefatti metallici di sospensione/incenerimento, fuoco verde sulfureo, cenere e città infernale a sei quartieri. Non avviare i gate di questo documento, non generare nuove pose di Cerbero, non riattivare fiammate dalla bocca, spinte o cadute nella lava. La fonte operativa corrente è [la specifica Hellscape v1.2.0](../../HELLSCAPE_BAFOMETTO_DIREZIONE_CINEMATICA_v1.2.0_20261031.md). Materiale conservato per tracciabilità della progettazione, **non per implementazione**.

# Prompt operativo per Codex — Animazioni del nuovo Cerbero proliferante

**Versione:** 1.0.0  
**Ultimo aggiornamento:** 2026-10-31T16:10:04+01:00 (Europe/Rome)  
**Repository destinatario:** [rickymusu-bit/quiz](https://github.com/rickymusu-bit/quiz)  
**Stato:** **ARCHIVIATO — NON OPERATIVO**. Questo era un prompt per l'avvio incrementale di Cerbero, oggi superato dalla direzione Bafometto; nessuna posa nuova approvata o animazione integrata in questa PR.  
**Fonte:** riferimento canonico approvato nella PR #103; direttive dell'utente del 31 ottobre 2026 su unica testa attiva, fiammata esclusiva e teste secondarie passive.  
**Ambito:** specifica operativa del personaggio Cerbero in Hellscape; non modifica le norme generali degli sprite.

---

## MANDATO A CODEX — TESTO STORICO, NON ESEGUIRE

Agisci come sviluppatore e responsabile dell'integrazione grafica di Hellscape. **Comincia effettivamente a implementare le animazioni del nuovo Cerbero proliferante**, conservando in modo rigoroso il design già approvato. Il primo incremento deve contenere codice e verifiche concretamente eseguibili, oltre alla necessaria analisi e documentazione. Non limitarti a stendere un piano e non anticipare gate grafici non approvati.

Lavora in modo incrementale, un gate verificabile alla volta, con branch temporaneo e PR in bozza. **Non fare merge, non sostituire il Cerbero corrente come default e non pubblicare una nuova animazione senza approvazione esplicita dell'utente.**

### 1. Documenti obbligatori e precedenza

Leggi prima di operare:

- `AGENTS.md`
- `docs/PROTOCOLLO_SPRITE_ANIMATI_v16.0.0_20261031.md`
- `docs/CERBERO_INTEGRAZIONE_MOVIMENTI_v3.0.0_20261031.md`
- `docs/HELLSCAPE_PROJECT_RULES_v1.0.1_20261031.md`
- `assets/hell-race/production/cerbero/proliferating-reference-v1/README.md`
- `assets/hell-race/production/cerbero/proliferating-reference-v1/manifest.json`
- `assets/hell-race/production/cerbero/capture-v1/PIANO_CATTURA_SPINTA_LAVA_v3.0.0_20261031.md`

Questo mandato contiene le decisioni più recenti dell'utente e **prevale sui passaggi incompatibili** delle precedenti specifiche del Cerbero: in particolare le teste secondarie non hanno movimenti volontari e il fuoco esce esclusivamente dalla bocca della testa principale. Non estendere questi vincoli anatomici a `AGENTS.md` o al protocollo generale.

### 2. Riferimento canonico invariabile

Il **solo modello visivo approvato per le nuove pose** è:

`assets/hell-race/production/cerbero/proliferating-reference-v1/reference.png`

- Immagine originale: 1536 × 1024, RGBA.
- SHA-256: `f5f5216a2b20c3b07354b3e91a00b68608c92751434abec1d303b9e1be0bab1f`.
- Non ritoccare, ricodificare, normalizzare l'alpha, ridisegnare o sovrascrivere l'originale.
- Conservare silhouette, teste, radici anatomiche, corna, piastre, catene, carne, ossa, texture e palette del concept approvato.
- La composizione tecnica approvata (pacchetto 1.0.5) usa scala **uniforme 0.174**, traslazione **x = 10, y = 159** e raster logico **768 × 576**, con ingombro del canvas disegnato di **267.264 × 178.176** unità logiche. La stima dell'appoggio non è ancora una certificazione biomeccanica. Verifica la corrispondenza fra questa anteprima e il renderer della partita.

La precedente corsa a otto frame in `assets/hell-race/production/cerbero/run-stabilized-v1/` appartiene a **un Cerbero diverso, con la precedente anatomia a tre teste**. Conservane la riproducibilità e riutilizza eventualmente solo metodologie, pipeline e codice: **non riusare quei fotogrammi come pose del nuovo Cerbero**, né considerarli suoi reference visivi.

### 3. Anatomia funzionale aggiornata

**Cerbero è un solo organismo quadrupede, massiccio e proliferante.** Le teste secondarie sono escrescenze anatomiche connesse alla massa corporea, non creature autonome.

**Testa principale attiva:** identifica nel PNG la testa più grande, con **due enormi corna ricurve, nella regione superiore destra**. È la testa dominante, detta anche *centrale* in senso anatomico/narrativo, **non** perché si trovi al centro geometrico dell'immagine. Verifica visivamente questa identificazione e annota attacchi, pivot probabili, collo, asse delle fauci e ancoraggio della bocca.

È l'**unica** testa che possa:
- ruotare/oscillare volontariamente e muovere il collo;
- aprire o chiudere attivamente le fauci;
- preparare ed eseguire la fiammata;
- recuperare la postura dopo l'emissione del fuoco.

**Teste secondarie passive:** identifica numero, radici e profondità delle altre teste direttamente dal PNG, senza imporre il vecchio numero tre. **Non** generare per loro aperture volontarie delle fauci, attacchi, morsi, fiammate o movimenti indipendenti. Possono oscillare leggermente **solo per inerzia**, restando ancorate ai tessuti e al movimento complessivo del tronco. Un'eventuale bocca già aperta nell'immagine resta parte della loro forma, non un comando di animazione. Preferisci integrarle nella massa corporea senza rig individuali, salvo necessità biomeccanica e previa verifica visiva.

**Altre strutture:** le zampe articolate sostengono e muovono la massa; la coda segue dalla base alla punta; catene e parti pendenti reagiscono a inerzia e gravità. Corna, ossa e piastre metalliche sono rigide: niente elasticità o `mesh warp` per nascondere problemi; tessuti molli flettono solo entro limiti plausibili. Evita teste flottanti, spine spostate e cambi casuali di materiali, proporzioni o identità.

### 4. Tecnica progettuale e composizione modulare

Valuta motivatamente una **soluzione ibrida**, non una scelta obbligatoria a priori:

| Modulo | Prima tecnica da valutare | Verifica determinante |
| --- | --- | --- |
| Tronco e zampe | Pose biomeccaniche disegnate, sprite frame-by-frame | Appoggi, masse, flessione del dorso e loop |
| Testa principale e collo | Rig 2D anatomico oppure pose dedicate | Superfici nascoste, pivot, connessione, occlusioni e volume |
| Teste secondarie | Movimento solidale al tronco, con minime reazioni passive | Integrità delle connessioni e identità |
| Coda, catene e pendagli | Movimento secondario su giunti realmente plausibili | Rigidità e inerzia |
| Fiammata | Effetto separato, orientato sulla bocca principale | Origine esatta del getto in ogni frame |
| Spinta | Pose apposite e animazione di contatto | Trasferimento del peso e spalla/torace contro fiancata |

La testa principale dovrebbe poter ruotare, aprire le fauci e sputare fuoco **mentre il corpo continua a correre**, senza dover rigenerare l'intero ciclo ogni volta. Tuttavia, se separare testa e collo dal PNG crea vuoti, falsi giunti, artefatti, prospettive errate o superfici impossibili, **non** forzare un rig: usa un disegno correttivo referenziato o una sequenza di pose specifica. Non tagliare e ruotare un rettangolo di pixel fingendo che sia un'articolazione.

### 5. Ordine delle animazioni

La roadmap funzionale è:

1. **Corsa** del nuovo Cerbero (primo gate operativo).
2. **Fiammata** dalla sola testa principale, mentre il corpo continua a muoversi.
3. **Avvicinamento, contatto e spinta laterale** del veicolo perdente.
4. **Raccordo verso la corsa** dopo la spinta.

La sequenza completa di eliminazione è:
**fiammata a distanza → incendio del veicolo → rallentamento → recupero del distacco → contatto e spinta laterale → caduta fuori dal ponte nella lava → ritorno alla corsa**.

**Non** implementare le precedenti catture tramite morso, presa, salto o schiacciamento. Una vecchia posa del morso, anche se storicamente approvata, non diventa automaticamente una posa per la spinta e non cambia il riferimento visivo corrente.

### 6. Primo gate eseguibile: audit, preparazione tecnica e pose A/B della corsa

**6.1 Audit reale del PNG e della scena.** Esamina direttamente il riferimento; annota testa principale, teste secondarie, articolazioni, parti rigide, gradi di libertà, centro di massa approssimativo, appoggi, orientamento, camera, palette e scala. Analizza anche ponte, occlusioni, profondità e proiezione nel codice reale. Distingui osservazioni certe, ipotesi e limiti. Crea una scheda specifica e versionata del Cerbero, senza copiare norme generali.

**6.2 Modello biomeccanico.** Progetta la corsa di un quadrupede massiccio con centro di massa, trasferimento del carico, sequenza di contatti, articolazioni, flessione del tronco, recupero e fasi di sospensione se plausibili. Non imporre automaticamente il galoppo del vecchio modello. Durante l'appoggio il piede resta coerente con il mondo e non scivola senza ragione; in volo il centro di massa segue una traiettoria plausibile. Lo stesso soggetto mantiene scala, anatomia e direzione. Le teste secondarie reagiscono solo al tronco, la testa principale può aggiungere un moto controllato.

**6.3 Preflight bloccante dell'input visivo.** Prima di **ogni** generazione di una posa nuova, accerta e documenta che il generatore riceva **davvero** `reference.png` come immagine di editing/riferimento, insieme alle ulteriori immagini indispensabili (pose A/B/M o adiacenti quando richieste). Conoscere il nome del PNG o citarne il percorso nel prompt non dimostra la consegna all'ImageGen. Se non puoi materialmente trasmettere o verificare un riferimento necessario, **ferma la generazione e chiedi all'utente**: niente ricreazioni a memoria, prompt solo descrittivi, concept alternativi, storyboard o tentativi iterati senza reference. Puoi proseguire solo con codice e verifiche indipendenti dal disegno mancante.

**6.4 Pose A e B.** Progetta due stati distinti e biomeccanicamente significativi del ciclo (per esempio sospensione distesa e raccolta/caricamento, ma scegli in base all'anatomia reale). Produci **una posa per volta** con il PNG canonico effettivamente collegato. Niente spritesheet completo, collage o sequenze durante questo gate. Verifica per ogni candidata: arti e loro attacchi, corna, forme delle teste, texture, palette, direzione, contatto, peso, pivot e coerenza del punto di vista. Allega confronto visivo con il riferimento originale e indica in modo preciso i difetti eventuali.

**6.5 STOP di approvazione.** Presenta A e B e **attendi l'approvazione esplicita dell'utente** prima di generare M, gli intermedi o lo spritesheet. Il punto M, se necessario, rappresenterà un evento fisico significativo, non una media arbitraria. Dopo l'approvazione, completa solo gli intermedi necessari, correggi localmente i frame errati, chiudi il ciclo senza scatti o duplicati e passa al post-processing. Non mescolare il lavoro del primo gate con la fiammata o la spinta.

### 7. Preparazione del runtime in parallelo al gate grafico

Senza aspettare nuovi frame, **esegui il lavoro tecnico indipendente**:
- Ispeziona `assets/hell-race.js`, `assets/hell-cerbero-gallop.js`, moduli di scena/camera/ponte, gestione delle eliminazioni e relativi test.
- Verifica lo stato reale di `Fool.html?start=1&cerberoGallop=stabilized`, che attualmente riguarda il vecchio ciclo: **non** trattarlo come prova del nuovo.
- Prepara un adattatore non invasivo, con selezione **opt-in** dei nuovi asset e fallback al runtime corrente, senza impostarlo come default.
- Mostra il PNG canonico alla scala approvata in un'anteprima **statica reale nel browser**, usando il ponte e i layer nativi; ciò verifica composizione, **non** certifica animazione o appoggi.
- Predisponi interfacce per campionamento degli spritesheet, stato dell'azione, testa principale, trasformazioni, bocca, effetti e transizioni; evita componenti superflui, duplicazioni e frame fittizi.
- Mantieni moto relativo degli attori, camera a inseguimento, occlusioni, profondità e pausa/ripresa coerenti col tempo attivo; pre-carica gli asset per evitare flash di texture o sfondi.
- Non cambiare punteggi, turni, vita, logica di eliminazione o comportamento persistito. Non eliminare codice o asset storici prima della verifica delle dipendenze.

### 8. Gate successivo: fuoco della testa principale

Dopo approvazione e completamento della corsa, progetta le pose della **sola testa dominante** per preparazione → apertura fauci → emissione → chiusura → recupero. Il getto nasce dalla **bocca principale corrente**, non dal tronco o da coordinate schermo fisse. Calcola l'ancora e il verso a ogni frame in base alla trasformazione della testa e al sistema di coordinate del mondo; rispetta occlusioni con le altre teste.

Conserva l'effetto periodico visivo esistente (attualmente ogni 60 secondi attivi, se confermato dal codice) separato dall'effetto narrativo di eliminazione. Le teste secondarie **non** sputano fuoco. Il Cerbero deve poter continuare il passo mentre emette il getto; pausa e ripresa congelano coerentemente sprite, movimento ed effetto. Nessuna penalità aggiuntiva nel gameplay.

### 9. Gate successivo: spinta e caduta nella lava

Usa il piano di cattura-spinta v3.0.0 senza reintrodurre un morso:
1. Il veicolo perdente è ancora davanti; la fiammata dalla bocca principale lo incendia.
2. **Dopo** l'accensione il veicolo rallenta e Cerbero colma il distacco attraverso velocità relative reali, senza teletrasporti.
3. Cerbero raggiunge il mezzo e lo spinge **di lato con spalla/torace**; appoggi, momento, masse e punto di contatto sono plausibili.
4. Il veicolo rigido supera il bordo ed effettua una traiettoria di caduta con gravità e inerzia; non scompare, non attraversa barriere o strutture e non cambia scala arbitrariamente.
5. Fuoco, lava, profondità, occlusioni e impatto rispettano il renderer; Cerbero recupera il passo e torna alla corsa.

La spinta va calibrata sui diversi modelli di veicoli **senza deformare le carrozzerie né spostare gli altri veicoli per liberare la scena**. Le traiettorie seguono coordinate reali del ponte, non una traslazione verticale arbitraria sullo schermo. Il rallentamento e la caduta sono rappresentazione di un'eliminazione già decisa: non introdurre nuove regole di gioco. Ogni nuovo insieme di pose richiede gate separati e approvazioni.

### 10. Post-processing e verifiche

Usa **il progetto esterno** `https://github.com/rickymusu-bit/sprites-post`, non duplicare il postprocessore in `quiz`. Verifica versione e compatibilità; per riferimento, il commit integrato in precedenza era `870e1274aee5fd42ede786cff7eec944087c7771`. Blocca il commit effettivamente usato e documentalo.

Per gli sprite verifica in particolare: tela e pivot comuni, landmark anatomici, conteggio e radici delle teste, posizione degli appoggi, contatti, palette e materiali, consistenza delle trasparenze, assenza di tagli, duplicati e deformazioni, raccordo dell'ultimo frame col primo. Preferisci meno frame validi rispetto a molti frame ripetuti. Le prove automatiche **non sostituiscono** il controllo visivo.

Per ogni integrazione dinamica, acquisisci **GIF o video effettivamente registrati dalla partita nel browser**, non GIF costruite a partire dai PNG e spacciate per runtime. Accompagna gli stati statici con screenshot reali; documenta viewport, revisione e durata. Non presentare HTML embedded o una simulazione come evidenza del gioco. Esegui le suite rilevanti, incluse le verifiche complete sulle modifiche funzionali secondo `AGENTS.md`; non dichiarare superate le CI prima di averne visto il risultato.

### 11. File, provenienza e versionamento

Conserva nella cartella di lavorazione degli asset: PNG canonici, candidati A/B/M approvati o respinti con stato chiaro, prompt **effettivamente inviati** al generatore, identificativi/versioni, metodi di input visivo, manifest, checksum, risultati di post-processing ed evidenze indispensabili. Non riscrivere retroattivamente un prompt storico e non fabbricare seed o informazioni non disponibili.

Applica versionamento **MAJOR.MINOR.PATCH**, senza aggiungere la data al numero di versione o al nome dei nuovi file. Nei file e nei metadati che lo permettono registra **data e timestamp dell'ultimo aggiornamento** in ISO 8601 con fuso esplicito. In caso di conflitto con vecchie convenzioni documentali, questa disposizione aggiornata dell'utente prevale; non alterare indiscriminatamente file storici. La revisione strutturale del protocollo si effettua a ogni versione **MAJOR**, non ogni dieci revisioni.

Tieni `main` come solo branch permanente; crea branch temporanei per gli interventi e una PR in bozza. Non eseguire merge senza approvazione, verifiche applicabili e SHA della head corrente.

### 12. Consegna del **primo** incremento — criteri di completamento

Al termine del lavoro autorizzato in questo turno consegna:

1. **Audit verificato** dell'immagine approvata, con annotazione univoca della testa principale e classificazione passiva delle altre.
2. **Scheda biomeccanica** della corsa, con appoggi, eventi, ipotesi e tecnica selezionata per corpo, testa e strutture secondarie.
3. **Esito del preflight** sul generatore, specificando come il PNG originale è stato realmente trasmesso oppure spiegando il blocco concreto.
4. **Pose A e B candidate**, soltanto se il preflight è riuscito e le immagini risultano effettivamente referenziate; chiedi approvazione visiva prima di proseguire.
5. **Adattatore tecnico opt-in** e, se possibile, screenshot reali di un rendering statico in gioco con nuova scala e livelli corretti, senza sostituzione del runtime predefinito.
6. **Test pertinenti realmente eseguiti**, stato CI noto, artefatti, limiti e regressioni osservate.
7. **PR in bozza** con riepilogo chiaro di ciò che è *approvato*, *candidato*, *implementato* e *bloccato*.

Non dichiarare la corsa, la fiammata o l'eliminazione completate se non sono davvero animate, integrate e verificate in partita. **Il primo STOP obbligatorio è l'approvazione di A e B.**

---

## Registro variazioni

- **1.0.0 — 2026-10-31T16:10:04+01:00:** prima stesura unificata per Codex. Riunisce riferimento canonico, anatomia a **una sola testa attiva**, altre teste passive, fuoco esclusivo della testa principale, locomozione, roadmap di eliminazione con spinta, workflow A/B/M, preflight del generatore, infrastruttura opt-in, post-processing indipendente, qualità, versionamento e gate di approvazione.
