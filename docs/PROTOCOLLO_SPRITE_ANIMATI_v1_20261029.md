# Protocollo operativo per sprite animati coerenti

**Versione documento:** v1  
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

La produzione comprende analisi del riferimento, definizione dei vincoli, rig/scheletro logico, pose chiave, interpolazioni, effetti, verifica e integrazione. Non sostituisce la direzione artistica esistente di Hellscape, non autorizza un nuovo design e non modifica autonomamente le meccaniche di gioco.

## 2. Fonti e gerarchia di riferimento

Prima di disegnare o generare fotogrammi:

1. Identificare la **versione approvata** del personaggio e, se esiste, il foglio sprite di una precedente azione; annotare percorso e revisione.
2. Isolare le caratteristiche invarianti dal materiale approvato, senza importare errori o artefatti di generazioni scartate.
3. Identificare, per l'azione richiesta, **quali parti possono muoversi** e quali connessioni rimangono obbligatorie.
4. Se due riferimenti sono incompatibili, dichiarare il conflitto e assumere come vincolante il design più recente esplicitamente approvato; non fondere automaticamente anatomie diverse.
5. Non ricreare da zero il soggetto per ciascun fotogramma; usare la stessa base anatomica/rig e derivare da essa le nuove pose.

Un nuovo sprite può deformarsi in modo stilizzato durante un'azione, ma le deformazioni devono essere intenzionali, continue, motivate e compatibili con l'identità del soggetto.

## 3. Invarianti anatomici e visivi

| Proprietà | Regola vincolante |
| --- | --- |
| Identità | Stesso personaggio, segni distintivi, materiali, palette, silhouette e livello di dettaglio. |
| Conteggi anatomici | Numero di teste, arti, corna, code e altri componenti stabile, salvo occlusioni fisicamente plausibili. |
| Proporzioni | Rapporti tra testa, collo, tronco, arti e articolazioni coerenti lungo tutta la sequenza; consentiti solo squash/stretch controllati e motivati. |
| Connessioni | Teste collegate ai colli, colli al tronco; arti collegati alle articolazioni; parti mai flottanti o saldate arbitrariamente. |
| Orientamento | Prospettiva, verso di movimento, disposizione relativa delle parti e punto di vista coerenti. |
| Scala e quadro | Stesso sistema di coordinate, scala base, centro/pivot e dimensione nominale dei frame. |
| Stile | Tratto, anti-alias/pixel art, luce, contorni e resa materica omogenei; nessun salto casuale di definizione. |
| Continuità | Posa, velocità, direzione ed eventi evolvono senza teletrasporti o cambi istantanei non narrati. |
| Integrità del canvas | Nessuna parte utile (testa, corna, coda, fiamme) viene tagliata per mancanza di margini, a meno che l'inquadratura lo richieda esplicitamente. |

**Un'occlusione non è una mutilazione:** una zampa nascosta dietro il torso può essere corretta; una zampa che ricompare sul lato sbagliato senza percorso plausibile non lo è. Nel movimento delle creature fantastiche conta la coerenza dell'anatomia *progettata*, non l'aderenza letterale all'anatomia di un animale reale.

## 4. Scheletro logico, coordinate e ancoraggi

Prima dei frame definire un **rig 2D**, anche solo come schema annotato, che elenchi:

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
- Non confondere **numero di disegni** con **frame rate di rendering**: il motore può aggiornare la scena a frame rate elevato interpolando o selezionando appropriatamente le pose.
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
3. **Preparare rig e ancoraggi** (almeno una scheda o tracciato con nomi persistenti).
4. **Disegnare i keyframe**; controllare anatomia, sovrapposizioni e silhouette.
5. **Generare gli intermedi** derivandoli dalle pose corrette. Confrontare sistematicamente frame adiacenti.
6. **Creare gli effetti su livelli separati**, quando tecnicamente fattibile, collegati agli ancoraggi al runtime.
7. **Montare e riprodurre l'azione** alla velocità effettiva, verificando onset, durata e recupero.
8. **Controllare la qualità** con overlay/onion skin, controlli geometrici e riproduzione integrale.
9. **Esportare e integrare** foglio sprite, eventuali effetti e metadati; non rimpiazzare asset approvati prima della revisione.
10. **Acquisire prove reali** dal browser o dalla build pertinente e preparare la PR per approvazione.

Quando la tecnologia di generazione non garantisce vincoli esatti, usare una composizione controllata di elementi separati o correzioni mirate: **la qualità verificata prevale sulla comodità di generare l'intera sprite sheet in un solo passaggio**.

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
| Movimento a scatti | Correggere pose, timing, interpolazione o clock; non nascondere il problema con frame ripetuti. |
| Testa o corna tagliate | Adeguare padding o inquadratura senza rimpicciolire arbitrariamente il personaggio. |
| Qualità disomogenea | Uniformare risoluzione e stile degli asset, verificando la resa alle dimensioni effettive. |

Dopo ogni correzione ricontrollare **il frame interessato e i due adiacenti**, oltre all'animazione intera. Non cambiare spontaneamente il design, la posizione delle teste già approvata o le altre parti corrette.

## 11. Istruzione standard per agenti di generazione e Codex

> Genera una nuova sequenza animata di **[PERSONAGGIO]** che esegue **[AZIONE]**, usando **[PERCORSO/RIFERIMENTO APPROVATO]** come modello canonico e **[AZIONE PRECEDENTE, SE PRESENTE]** come riferimento di continuità.  
> Mantieni identità, anatomia, numero di parti, proporzioni, silhouette, palette, prospettiva, pivot e stile. Non ridisegnare il personaggio per ogni fotogramma.  
> Definisci rig, articolazioni, ancoraggi funzionali, pose chiave, temporizzazione e transizioni prima di generare gli intermedi. Nessuna testa o parte corporea può fluttuare o cambiare attacco senza motivazione anatomica.  
> Ogni effetto deve partire dal punto anatomico corretto e seguirlo; una fiammata parte dalla bocca relativa, non da coordinate arbitrarie. Se l'effetto è fuori posizione, correggi **l'effetto** e non spostare la parte anatomica corretta per inseguirlo.  
> Produci **[N]** fotogrammi con raccordi fluidi; mantieni la stessa scala e lo stesso sistema di coordinate, evitando tagli, drift e salti. Preferisci livelli separati per emissioni ed effetti quando possibile.  
> Presenta prima keyframe e controllo anatomico, poi sequenza completa. Verifica frame adiacenti, continuità, punti di emissione e rendering reale. Non sostituire asset approvati e non eseguire merge senza approvazione.  
> Segui AGENTS.md e consegna le evidenze effettivamente richieste dalla natura della modifica; non presentare mockup come prove runtime.

### 11.1 Parametri da valorizzare a ogni nuova azione

**Riferimento canonico;** eventuale animazione precedente; **azione;** orientamento/camera; **durata e numero di frame;** articolazioni coinvolte; **punti di origine degli effetti;** stile e risoluzione di output; **criteri di loop/raccordo;** file destinazione; **test e preview.**

I parametri mancanti si derivano dall'asset approvato e dal codice corrente quando disponibili, senza inventare coordinate o misure. Il progetto può procedere per fasi verificabili senza chiedere nuovamente dettagli già documentati.

## 12. Versioning, manutenzione e refactoring del documento

Questa sezione riguarda **il documento di lavoro**; per refactoring del codice di gioco restano autoritative le regole di AGENTS.md.

1. **Nome versionato:** PROTOCOLLO_SPRITE_ANIMATI_vN_YYYYMMDD.md, data locale Europe/Rome. Questa edizione è **v1_20261029**.
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
| v1 | 2026-10-29 | Prima stesura: invarianti, rig e ancoraggi, keyframe, causalità degli effetti, caso Cerbero, pipeline, verifica, correzione mirata, template per agenti, versioning e refactoring. |

---

**Versione:** v1 · **Ultimo aggiornamento:** 29 ottobre 2026 (Europe/Rome)
