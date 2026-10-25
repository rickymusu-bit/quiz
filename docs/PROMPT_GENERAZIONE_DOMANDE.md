# Fool — Prompt per la generazione delle domande

**Versione:** v1.0.1  
**Data:** 25 ottobre 2026 (Europe/Rome)  
**Ambito:** domande del gioco a squadre **Fool** nel repository `rickymusu-bit/quiz`.  
**Origine:** adattamento dei criteri didattici di `rickymusu-bit/fisica/quiz/PROMPT_GENERAZIONE_DOMANDE.md`; non è una copia del formato del quiz individuale Stringhe.

## 1. Parametri di lavoro

Prima di generare, specifica o ricava dalla richiesta approvata:

- **Banca di destinazione:** identificativo, nome e file effettivo nel catalogo `datasets.json`.
- **Argomenti:** ID e nomi già presenti nella banca; eventuali nuovi ID richiedono una modifica esplicita del catalogo o della struttura approvata.
- **Fonti didattiche:** capitoli pubblicati di Stringhe o altro materiale indicato dal docente, con versione/data quando disponibili.
- **Studenti e prerequisiti:** livello della classe, conoscenze già affrontate, eventuali strumenti aggiuntivi. In assenza di altre istruzioni: biennio della secondaria di secondo grado, foglio bianco, penna e calcolatrice di base, senza appunti.
- **Lotto:** numero richiesto di nuove domande, ripartizione per argomento, difficoltà e tipologia, e disponibilità residua di quesiti diversi.
- **Consegna:** campione per revisione, schede di revisione o JSON pronto per verifica tecnica. Non presumere che una richiesta di progettazione autorizzi l'importazione.

Per una banca nuova proponi, **senza imporla**, una distribuzione orientativa del 30% facile, 40% media e 30% difficile, compatibile con contenuti e tempi. Adatta la distribuzione per tipologia alle competenze realmente verificabili. Rispetta invece le quote e le distribuzioni di una banca esistente finché il docente non approva modifiche. Esplicita sempre i conteggi interi: non arrotondare in modo da alterare il totale.

## 2. Fonti e perimetro degli argomenti

Leggi integralmente i materiali pertinenti prima di scrivere quesiti. Individua concetti, leggi, grandezze, formule, ipotesi di validità e competenze trattate; verifica che ogni domanda sia risolvibile con le fonti assegnate e i prerequisiti dichiarati. Se una fonte necessaria è indisponibile, segnala il limite: non inventarne il contenuto.

Fool dispone di **banche** selezionate tramite `datasets.json`, ciascuna suddivisa in `argomenti` con un proprio ID e un elenco di `domande`. Conserva questa organizzazione; non trasferire il campo `category` né il vincolo «una sola categoria» del JSON di Stringhe. Più argomenti della banca possono partecipare alla medesima partita, secondo la selezione e le quote gestite dall'interfaccia.

Ogni quesito appartiene all'argomento corretto secondo la banca effettiva. Può collegare principi di altri argomenti **della stessa banca**, ma solo se già studiati e consentiti. Se una situazione richiede conoscenze esterne, fornisci le informazioni necessarie nel testo oppure sostituisci il quesito. Cambiare scenario senza cambiare operazione cognitiva non basta a creare una domanda originale.

Distribuisci il contenuto secondo l'effettivo peso didattico e le quote concordate, non automaticamente in parti uguali. Mantieni stabile l'ID di un argomento già esistente; una rinomina visibile non deve rompere gli identificativi delle domande.

## 3. Tipologia e difficoltà: due classificazioni indipendenti

La chiave `tipologia` descrive ciò che lo studente deve **fare**:

- `conoscenza`: comprendere o riconoscere concetti, grandezze, leggi e condizioni di validità, non ripetere una frase a memoria.
- `ragionamento`: dedurre, prevedere o confrontare usando principi già studiati, preferibilmente in un contesto nuovo ma completamente descritto.
- `calcolo`: ottenere una quantità tramite operazioni effettive e pertinenti. La presenza di numeri nel testo **non** trasforma una domanda concettuale in calcolo.

La chiave `difficolta` è distinta dalla tipologia:

| Livello | Conoscenza | Ragionamento | Calcolo |
|---|---|---|---|
| `facile` | Identificazione di un concetto fondamentale. | Una deduzione diretta. | Applicazione immediata con dati e unità espliciti. |
| `media` | Distinzione tra concetti vicini o condizioni di una legge. | Confronto di casi o collegamento di idee. | Scelta della relazione, una semplice conversione o trasformazione. |
| `difficile` | Limite o distinzione concettuale rilevante. | Coordinazione breve di principi e ipotesi. | Scelta autonoma di una soluzione con pochi passaggi significativi. |

Una domanda difficile non deve essere lunga o deliberatamente ambigua. Una domanda di conoscenza può essere difficile; una domanda di calcolo può essere facile. Non assegnare `calcolo` a quesiti di semplice identificazione di una frase o di una misura già riportata.

## 4. Tempo di risposta per Fool

Il regolamento corrente prevede **un solo timer di 45 secondi per domanda, predefinito e configurabile**, che parte quando il docente svela la domanda insieme alle alternative. Non esiste nel regolamento corrente una separazione obbligatoria di 15 secondi di lettura e 30 di risposta.

Progetta ogni domanda, **anche difficile**, perché uno studente preparato possa leggerla, ragionare, svolgere eventuali calcoli e scegliere una risposta entro i 45 secondi predefiniti, senza assumere la velocità di una IA. Evita testi lunghi, conti estesi e calcoli con molte conversioni. Se la richiesta prevede deliberatamente un timer diverso, calibra i nuovi quesiti sul tempo esplicitamente stabilito.

Annota nella **scheda di revisione** il tempo stimato e gli elementi che incidono sulla lettura. Una stima non prova il tempo effettivo: il docente lo valuterà in classe. **Non importare il limite di 120 secondi del quiz Stringhe.** Il gioco può prevedere pause e interventi del docente, ma non devono servire per rendere risolvibile una domanda troppo lunga.

## 5. Formulazione e rigore scientifico

Ogni quesito deve essere autonomo, chiaro, corretto, comprensibile ad alta voce e dotato di **una sola risposta corretta** nelle condizioni dichiarate. Dichiara ogni ipotesi necessaria per impedire risposte alternative legittime; elimina invece precisazioni ovvie, frasi introduttive vuote, ripetizioni e dettagli narrativi irrilevanti (principio di economia informativa).

Per i dati quantitativi, preferisci l'ordine **nome della grandezza → simbolo → valore e unità**, ad esempio «la massa dell'oggetto è m = 0,20 kg». Quando ci sono grandezze omonime, usa pedici brevi non ambigui e spiegali. Usa `T` e `ΔT` per la temperatura, `t` e `Δt` per il tempo. Verifica unità SI, segni, approssimazioni, cifre significative, arrotondamenti e notazione matematica. Per valori di modulo superiore a 9999 o non nulli inferiori a 0,001, privilegia un prefisso SI appropriato oppure la notazione scientifica leggibile, quando non si tratti di identificativi o conteggi.

Nei record JSON conserva testo sicuro e compatibile con il renderer attuale; evita HTML eseguibile e sintassi non verificata. Controlla la leggibilità di pedici, apici e formule sullo schermo utilizzato in classe. Se un quesito richiede un'immagine o un diagramma, verificane il supporto reale prima dell'importazione: non creare dipendenze da figure assenti.

## 6. Quattro alternative e soluzione

Ogni domanda presenta **esattamente quattro alternative**, con una sola corretta e tre distrattori plausibili dello stesso dominio. I distrattori devono rappresentare confusioni realistiche (grandezze, segni, unità, interpretazioni o applicazione delle leggi), non risposte assurde, duplicati o trappole grammaticali.

Verifica **ogni** alternativa: nessuna opzione errata deve risultare vera in un'interpretazione ragionevole del testo. Mantieni opzioni comparabili per lunghezza, precisione, struttura e unità. Evita «tutte le precedenti» e «nessuna delle precedenti». Varia la posizione della soluzione in maniera non prevedibile; non affidarti allo shuffle per compensare alternative scadenti.

La `spiegazione` deve dare il motivo decisivo o il passaggio essenziale del calcolo, senza ripetere inutilmente testo e opzioni. Il fatto che la spiegazione sia visibile in un esito non giustifica lo svelamento della soluzione prima della risposta.

## 7. Varietà, difficili per il Massacro e capacità della banca

Prima di aggiungere un lotto confrontalo con **tutti** i quesiti esistenti della banca: evita identici, parafrasi e varianti con i soli numeri cambiati. Diversifica i concetti e le operazioni, rispettando l'ambito svolto in classe. Non riempire artificialmente una quota: se le fonti non permettono nuove domande valide, dichiara il limite.

Il **Massacro** utilizza domande `difficile` non ancora usate nella partita; per questo verifica la capienza della banca rispetto alle domande ordinarie selezionabili e a un numero ragionevole di batterie di spareggio. Una banca di 100 domande non garantisce automaticamente scorte sufficienti per qualsiasi partita configurabile fino a 99 domande più batterie ripetute di Massacro. Segnala la capacità residua al docente, senza ripetere domande né modificare autonomamente l'estrazione del motore.

Punteggi (100/200/300 di base), moltiplicatori, bonus, sanzioni, turni e regole del Massacro appartengono **al motore e al regolamento**, non al JSON delle domande. Non inserire metadati o regole di gioco extra in ciascun quesito.

## 8. Schema esatto dell'archivio Fool

Prima di esportare, ricontrolla `datasets.json`, il file della banca di destinazione, i controlli di caricamento correnti e gli eventuali validatori. Il formato attuale è un oggetto con `versione`, `titolo` e `argomenti`; ogni argomento possiede `id`, `nome` e `domande`. Ogni domanda contiene **esattamente questi campi**:

| Campo | Significato |
|---|---|
| `id` | ID testuale univoco e stabile, coerente con l'argomento esistente. |
| `difficolta` | `facile`, `media`, `difficile`. |
| `tipologia` | `conoscenza`, `ragionamento`, `calcolo`. |
| `testo` | Domanda completa e autonoma. |
| `alternative` | Array ordinato di quattro stringhe distinte. |
| `corretta` | Lettera `A`, `B`, `C` o `D` riferita all'**ordine effettivo** di `alternative`. |
| `spiegazione` | Motivo conciso e corretto della soluzione. |

Non usare il JSON di Stringhe (`category`, `level`, `prompt`, `options`, `correct`, `explanation`). Non aggiungere alle domande campi per tempo stimato, fonti, prerequisiti o valutazioni: vanno in una **scheda di revisione separata**, a meno che lo schema Fool venga deliberatamente modificato e approvato.

Il catalogo `datasets.json` è la fonte canonica per i percorsi delle banche. Quando una banca viene sostituita, aggiorna contestualmente catalogo, test e documentazione; cancella gli archivi dismessi soltanto dopo la verifica della sostituzione, conservandone la cronologia Git. La versione del **prompt** è indipendente dal campo numerico `versione` del **dataset**: non cambiare lo schema o il valore di `versione` senza motivazione tecnica verificata.

## 9. Scheda di revisione didattica e controlli

Per ogni proposta registra **fuori dal JSON di gioco**: ID e argomento, fonti effettivamente lette, conoscenze e prerequisiti richiesti, tipologia, difficoltà e motivazione, testo, quattro alternative, lettera e soluzione, tempo stimato, competenza verificata ed eventuale ragionamento trasversale.

Controlli obbligatori prima della consegna:

1. Risolvi indipendentemente la domanda finale e verifica la corrispondenza della lettera con l'alternativa esatta.
2. Ricontrolla operazioni, condizioni, simboli, unità e distrattori; elimina ambiguità e alternative equivalenti.
3. Confronta con tutta la banca i quesiti identici o concettualmente ripetuti; controlla la copertura degli argomenti.
4. Verifica che `tipologia` e `difficolta` descrivano davvero il quesito (in particolare `calcolo` richiede un calcolo).
5. Valuta prudenzialmente lettura e soluzione nei 45 secondi predefiniti.
6. Verifica JSON ben formato, campi consentiti, ID non duplicati, quattro alternative, lettera corretta, quote e compatibilità con il caricatore Fool.
7. Quando il lavoro include modifiche al sito o alla banca integrata, esegui i test pertinenti del repository, inclusi i controlli di estrazione, selezione argomenti, difficoltà e Massacro. Riporta solo verifiche realmente eseguite.

I test automatici non dimostrano da soli che una domanda sia adeguata a una classe. L'approvazione didattica resta del docente.

## 10. Procedura ChatGPT, docente e Codex

**Fase 1 — Progettazione.** Leggi fonti, banca attuale e impostazioni. Se non è approvato uno stile di riferimento per il nuovo argomento, proponi un **campione di nove domande** (tre tipologie × tre difficoltà, soltanto dove didatticamente sensate), con schede per la revisione.

**Fase 2 — Revisione del docente.** Il docente decide su chiarezza, rigore, difficoltà, varietà e durata. Salva le correzioni e il campione effettivamente approvato come riferimenti stabili; non supporre approvazioni tacite.

**Fase 3 — Nuovi lotti.** Codex può produrre lotti indicativamente da 25–30 quesiti o della dimensione richiesta, esclusivamente sulla base di fonti e campioni approvati. Conserva ID esistenti, non sovrascrivere quesiti senza richiesta e separa archivio di gioco e schede di revisione.

**Fase 4 — Verifica tecnica e didattica.** Confronta il lotto con la banca completa, controlla lo schema e i test effettivamente applicabili. L'obiettivo corrente dei due dataset è **100 domande per banca**: non importare automaticamente il target di Stringhe (100 per livello, 300 per categoria), non moltiplicare le banche né generare nuove domande non richieste.

**Fase 5 — Integrazione.** Prepara un ramo Git separato e una PR in bozza, con elenco dei file cambiati, riepilogo dei controlli e dati conservati. L'approvazione delle domande **non** autorizza da sola merge o pubblicazione su GitHub Pages: attendi autorizzazione esplicita.

ChatGPT e Codex non devono presumere di condividere automaticamente tutte le decisioni: prompt, campione approvato e stato della lavorazione devono restare nel repository.

## 11. Versionamento e manutenzione di questo prompt

Adotta `MAJOR.MINOR.PATCH` con versioni indipendenti dai dataset: PATCH per correzioni compatibili, MINOR per nuove istruzioni compatibili, MAJOR per cambiamenti incompatibili o sostanziali. A **ogni aggiornamento** controlla duplicazioni, coerenza, riferimenti, obsolescenza, prolissità e rinvii interessati. Prima di **ogni MAJOR** esegui un refactoring strutturale completo; eseguilo anche quando problemi strutturali importanti lo richiedano o su richiesta esplicita, indipendentemente dalla versione.

Il refactoring che preserva le regole **non** obbliga di per sé ad aumentare MAJOR; scegli il livello in base alle modifiche effettive. Prima di consolidare cambiamenti sostanziali segnala i conflitti e chiedi approvazione. Non creare copie storiche numerate: usa la cronologia Git. Questa sezione non autorizza la generazione di lotti né l'aggiornamento o la pubblicazione del sito.
