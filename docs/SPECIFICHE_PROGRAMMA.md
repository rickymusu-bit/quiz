# Chi vuol essere rimandato — Specifiche del programma

Versione: **12.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Regolamento di riferimento: [REGOLAMENTO_UFFICIALE.md, v12.0.0](REGOLAMENTO_UFFICIALE.md).

## 1. Scopo e gerarchia

Questo documento raccoglie le specifiche funzionali, i vincoli tecnici e i criteri di accettazione del quiz HTML. Il regolamento definisce le regole; questo documento definisce come applicarle. La presentazione HTML è una spiegazione per la classe. In caso di contrasto prevale il regolamento; per le questioni aperte non si inventano soluzioni normative.

L'analisi iniziale è stata eseguita sul commit `4b7f285cfc4bec5507bed559ada3efa479b29e95`, leggendo il programma `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`, il regolamento HTML v9, il template e il prompt dataset v1. È una verifica del sorgente, non una certificazione funzionale in browser.

Stati dei requisiti: **presente** = riscontrato nel sorgente; **da implementare** = requisito per una futura modifica; **da decidere** = dipende da una questione DEC del regolamento. Le presenti modifiche sono documentali e non aggiornano gli HTML. **Il programma v3 e la presentazione v9 non sono conformi al regolamento 12.0.0**: vanno adeguati rotazione fissa con il solo passaggio da premio, errore/scadenza, timer, conclusione, sospensione/ripresa, spareggio, premio finale, pausa manuale e disposizione della schermata in altezza. La lettura del sorgente non equivale a una verifica in browser.

## 2. Utenti e distribuzione

- **SPEC-01 — Conduzione (presente).** Un docente conduce il gioco su un dispositivo, eventualmente proiettato. Non è un'applicazione multiplayer con accessi separati. Il docente registra nell'interfaccia la risposta comunicata dal portavoce.
- **SPEC-02 — Uso locale (presente).** Il gioco è un HTML autonomo apribile nel browser senza installazione. Dataset JSON esterno selezionato dall'utente; formule, font e risorse già inclusi devono funzionare anche offline. Non richiede account, server o accesso al registro.
- **SPEC-03 — Interfaccia (presente).** Copertina con logo e avvio, configurazione, anteprima docente, domanda nascosta, risposta a tempo, esito e riepilogo. Testi leggibili in proiezione, layout adattabile, focus visibile, comandi utilizzabili da tastiera e schermo intero con messaggio alternativo se non disponibile. Correttezza ed errore sono indicati anche dal testo, oltre al colore.

## 3. Configurazione e anteprima

| ID | Requisito | Stato |
| --- | --- | --- |
| SPEC-04 | Tre nomi di gruppo distinti senza distinzione fra maiuscole e minuscole; nomi vuoti sostituiti da nomi predefiniti | Presente |
| SPEC-05 | Caricamento e validazione del JSON prima dell'estrazione; un nuovo caricamento invalida quello precedente | Presente |
| SPEC-06 | Partita regolamentare di esattamente 33 domande ordinarie; se la banca non basta, bloccare la preparazione e indicare la carenza. Eventuali prove ridotte devono essere chiaramente distinte dalla partita regolamentare. Le domande extra dello spareggio non rientrano nelle 33 | Da adeguare: oggi consente 1–33 domande |
| SPEC-07 | Timer unico per domanda, predefinito 45 secondi e personalizzabile a interi 1–600; risposta consentita subito, nessuna fase 15+30. Lo spareggio eredita esattamente il tempo impostato per il gioco normale, senza un valore separato a 30 secondi | Da adeguare |
| SPEC-08 | Selezione degli argomenti e quote intere non negative; somma uguale al totale e quota non superiore alla disponibilità; ribilanciamento delle quote | Presente |
| SPEC-09 | Estrazione casuale senza ripetizioni di ID nella partita, nel rispetto delle quote; mescolamento di domande e alternative conservando la risposta corretta | Presente |
| SPEC-10 | Anteprima docente con domande, alternative, soluzione e spiegazione; sostituzione singola con domanda inutilizzata dello stesso argomento e difficoltà; messaggio se non disponibile | Presente |
| SPEC-11 | L'anteprima è riservata all'uso del docente prima della proiezione; non va mostrata alla classe. L'app locale non offre autenticazione o schermate private | Vincolo operativo |
| SPEC-12 | Filtro di difficoltà facile/media/difficile/misto, con disponibilità e quote ricalcolate prima di estrarre | Da implementare: oggi la difficoltà è usata nella sostituzione, manca il selettore |

Non si confondono le 100 domande per argomento della banca con le 33 estratte per una partita. Le percentuali di difficoltà e tipologia indicate nel prompt riguardano la generazione della banca e non sono garantite nell'estrazione attuale.

## 4. Contratto del dataset

**SPEC-13 — Formato compatibile del dataset ordinario (presente).** JSON UTF-8, con eventuale BOM rimosso dal lettore; `versione` numerico uguale a `1`; array `argomenti` non vuoto. Dimensione massima accettata dall'app: 20 × 1024 × 1024 byte. Un dataset non valido non deve avviare la partita.

| Livello | Campo | Contratto |
| --- | --- | --- |
| Radice | `titolo` | Testo descrittivo previsto dal prompt; il parser attuale non lo valida |
| Argomento | `id`, `nome` | Stringhe non vuote; ID argomento univoco |
| Argomento | `domande` | Array non vuoto |
| Domanda | `id` | Stringa non vuota, univoca in tutta la banca |
| Domanda | `difficolta` | `facile`, `media`, `difficile`; il parser normalizza maiuscole e spazi esterni |
| Domanda | `tipologia` | `conoscenza`, `ragionamento`, `calcolo`; richiesto editorialmente dal prompt, oggi ignorato dal parser |
| Domanda | `testo` | Stringa non vuota |
| Domanda | `alternative` | Esattamente quattro stringhe non vuote, diverse anche ignorando maiuscole/minuscole |
| Domanda | `corretta` | Lettera A, B, C o D riferita all'ordine originale; il parser normalizza le minuscole |
| Domanda | `spiegazione` | Richiesta editorialmente dal prompt; il parser attuale accetta assenza o stringa vuota |

**SPEC-14 — Formule e testo (presente).** Formule con delimitatori LaTeX inline o display compatibili con KaTeX, con barre inverse correttamente escapate nel JSON. Il caricamento verifica formule e delimitatori. I testi del dataset sono inseriti come testo e formule con `trust:false`, senza eseguire HTML o script provenienti dai quesiti.

**SPEC-15 — Qualità editoriale (vincolo di produzione).** Una sola risposta corretta, contenuti svolti e adeguati alla classe, spiegazioni utili, calcoli compatibili con il tempo; distrattori plausibili e di lunghezza comparabile. Nessun riferimento alle lettere delle alternative nelle opzioni: il mescolamento ne cambia l'ordine. I controlli sintattici non certificano la correttezza scientifica.

**SPEC-16 — Schema condiviso (miglioramento proposto, non implementato).** Introdurre un JSON Schema versionato riutilizzato da validatore, generazione delle banche e controlli automatici. Decidere esplicitamente la compatibilità prima di rendere obbligatori campi che il parser attuale considera facoltativi.

## 5. Stati e transizioni

| Stato logico | Operazione | Risultato e vincoli |
| --- | --- | --- |
| Copertina | Avvia | Configurazione |
| Configurazione | Prepara con dati validi | Estrazione e anteprima docente |
| Anteprima | Cambia domanda / torna indietro | Sostituzione controllata / configurazione |
| Anteprima | Inizia partita | Azzera punteggi, sanzioni, eliminazioni e salti; sorteggia il primo gruppo e conserva l’ordine fisso dei turni; mostra la domanda nascosta |
| Domanda nascosta | Gruppo assegnato | Nessun passaggio libero; può attivare Svela e passa se possiede una copia e si trova nel proprio turno |
| Domanda nascosta | Svela | Mostra domanda e alternative; avvia il timer senza vincoli legati alle serie di risposte corrette |
| Risposta a tempo | Seleziona alternativa prima della scadenza | Un solo esito; valore base × moltiplicatore se corretta, 0 se errata; blocco delle alternative (da adeguare) |
| Risposta ordinaria a tempo | Scadenza | Un solo esito a 0 punti, anche se la scheda era in background (da adeguare) |
| Risposta ordinaria o spareggio | Pausa | Memorizza il residuo effettivo, ferma timer, disabilita risposte; mostra stato in pausa |
| Pausa manuale | Riprendi | Riprende il tempo residuo e riabilita le risposte, senza azzerare il timer |
| Risposta a tempo | Chiedi rifiuto | Pausa del timer e decisione docente |
| Valutazione rifiuto | Annulla / nega | Riprende il tempo residuo senza ripartire da zero |
| Valutazione rifiuto | Accetta | Scarta la domanda; passa alla successiva secondo DEC-03 |
| Esito | Prossima | Avanza una sola volta e assegna sempre la domanda al successivo gruppo disponibile nella rotazione, anche dopo una risposta corretta |
| Domanda ancora nascosta o esito già registrato | Sospendi alla campanella | Salvataggio e sospensione prima dello svelamento successivo; nessun premio anticipato |
| Domanda già svelata, anche in pausa o in revisione rifiuto | Richiedi sospensione alla campanella | Segna sospensione in attesa: non archivia la domanda come sospesa fra lezioni; conclude risposta/scadenza o decisione rifiuto e registra esito prima di sospendere |
| Partita sospesa fra lezioni | Riprendi | Stesse squadre, punteggi e stato di gioco; riparte prima della prossima domanda nascosta; nessuna nuova estrazione o nuovo sorteggio |
| Domanda ordinaria 33 conclusa (rifiuti secondo DEC-03) | Concludi fase ordinaria | Massimo unico: vincitore e riepilogo; massimo condiviso: spareggio fra i soli gruppi a pari merito |
| Spareggio, domanda extra | Risposta corretta | Gruppo ancora in gioco; turno al successivo partecipante attivo |
| Spareggio, domanda extra | Risposta sbagliata o tempo scaduto | Elimina il gruppo; se rimane un solo gruppo, dichiara il vincitore; altrimenti prosegui a turno |
| Riepilogo | Nuova partita | Configurazione; i dati della partita successiva vengono azzerati all'avvio |

**SPEC-17 — Integrità delle transizioni (presente, da verificare con scenari).** Nessuna risposta doppia, punteggio doppio o avanzamento doppio. La gestione dell’esito ordinario e dell’eliminazione nello spareggio deve essere distinta. Un clic alla scadenza o dopo la scadenza equivale a tempo scaduto; il riferimento è la scadenza temporale effettiva, non il numero arrotondato mostrato dal timer.

**SPEC-18 — Domande nascoste (presente).** Nessun testo o alternativa visibile nella schermata di scelta; nessun cambio di ordine delle alternative durante la stessa domanda. Dopo l'esito mostra risposta corretta e spiegazione, se presente.

## 6. Punteggi, sanzioni e conclusione

| ID | Requisito | Regole | Stato |
| --- | --- | --- | --- |
| SPEC-19 | Corretta = base × moltiplicatore, con eventuale Ruba punti; errore/scadenza ordinari 0. Nessuna sottrazione disciplinare. Punteggi e contatore sanzioni separati; eliminazione alla terza sanzione anche nella fase ordinaria. Rotazione tra gruppi attivi | REG-02, REG-07–REG-10 | Da adeguare |
| SPEC-20 | Rotazione fissa senza mantenimento per corretta né blocco dopo tre corrette. Nessun passaggio libero; Passa disponibile solo con una copia attivata di Svela e passa. Gestire separatamente titolare del turno e gruppo che risponde; rotazione dopo passaggio secondo DEC-17 | REG-02, REG-05, REG-08, REG-26–REG-28 | Da implementare |
| SPEC-21 | Tabellone con titolare del turno e rispondente se diverso, rotazione, punteggi, serie/moltiplicatori, inventario per gruppo con quantità dei tre premi, effetti pendenti, contatore sanzioni 0–3, stato eliminato con causa e salti da premio. Inventario visibile e comandi d’uso attivi solo nel proprio turno | REG-02, REG-08, REG-25–REG-28 | Da adeguare |
| SPEC-22 | Il docente registra una sanzione al gruppo responsabile: incremento di un contatore separato, punteggio invariato. Alla terza sanzione segna eliminazione disciplinare, esclude da turni, uso/bersagli dei premi e vittoria. Nessuna riduzione dei punti né salto disciplinare | REG-10–REG-16 | Da implementare; casi DEC-05/18/19 |
| SPEC-23 | Rifiuto con soli due motivi ammessi; decisione docente; nessun rifiuto dopo risposta o scadenza | REG-17–REG-19 | Presente; la tempestività è valutata dal docente, non dal solo stato del pulsante |
| SPEC-24 | Confrontare al termine delle 33 domande solo i punti dei gruppi non eliminati; massimo unico vincente, parità al massimo avvia REG-23. Assegnare il premio fisso 10 blu ai membri del gruppo vincitore, indipendentemente dal punteggio; rimuovere la vecchia qualifica permanente a soglia | REG-20, REG-21, REG-23 | Da implementare |
| SPEC-25 | Riepilogo definitivo con punteggi ordinari, esito dello spareggio se presente, vincitore e premio «10 blu». Spiegare il contributo alla media delle attività fuori verifica e al voto verde di fine anno; nessuna conversione punti/voto, nessuna scrittura automatica su ClasseViva né calcolo della valutazione annuale | REG-20–REG-23 | Da adeguare |

Il registro eventi attuale conserva al massimo otto messaggi in memoria e ne mostra quattro. Il programma attuale non ripristina una partita dopo il caricamento della pagina: **salvataggio e ripresa sono ora requisiti necessari, ancora da implementare** (SPEC-30). L'annullamento dell'ultima operazione resta una possibile miglioria separata.

**SPEC-30 — Sospensione e ripresa (da implementare; REG-20).** Sostituire la conclusione «fine modulo» con una sospensione. Conservare versione del regolamento e formato del salvataggio, identificativo della partita, composizione delle squadre (nomi e membri ove registrati), ordine di rotazione, titolare, punteggi decimali, contatori disciplinari per gruppo, stato e causa di eliminazione, serie individuali, inventario conservabile con quantità per tipo e gruppo, attivazione o selezione bersaglio da completare, premi attivati e consumati, effetti pendenti con beneficiario e bersaglio, salti temporanei dovuti ai soli premi, tabella dei punti base effettivi, indice e stato della domanda, contatori di risposte/rifiuti, tempo residuo e impostazioni. Conservare anche le estrazioni di premio già effettuate e gli esiti associati a ciascuna risposta, per impedire nuove estrazioni alla ripresa. Salvare anche domande estratte, ordine delle alternative e risposte corrette, la banca ordinaria condivisa e l’eventuale riserva residua, ID dei quesiti già svelati in entrambe le fasi e, nello spareggio, partecipanti, eliminati, ordine dei turni e tempo effettivo ereditato dalla fase ordinaria. In caso di rifornimento validare gli ID contro l’intera banca condivisa e i quesiti già svelati; nessun caricamento separato Vero/Falso. Nessuna assegnazione del premio alla campanella. Non richiedere nominativi degli studenti per il solo funzionamento: il docente può garantire la stessa composizione usando i nomi delle squadre.

Il salvataggio deve sopravvivere alla chiusura del browser e consentire esportazione/importazione di un file locale versionato; l'autosalvataggio locale è complementare, non l'unico mezzo di ripresa. Validare integralmente un salvataggio prima di sostituire la partita attiva; un file non valido o incompatibile deve lasciare intatta la partita. Riprendere con timer fermo fino al comando del docente, senza applicare come tempo trascorso l'intervallo fra le lezioni. Per la sospensione dovuta alla campanella, una domanda già svelata va conclusa nella lezione in corso (REG-20): usare un flag «sospendi dopo questa domanda», impedire lo svelamento successivo e salvare dopo aver registrato l’esito. Se quell’esito determina il vincitore, mostrare il riepilogo definitivo. Se la domanda 33 produce un pareggio, salvare lo spareggio ancora da iniziare senza svelare una domanda extra. Un eventuale salvataggio tecnico di emergenza non deve essere presentato come il normale rinvio di una domanda già svelata alla campanella. Il file di partita contiene soluzioni ed è destinato al docente.

**SPEC-31 — «Chi vuol essere eliminato» (da implementare; REG-23).** Alla parità finale al primo posto ammettere solo i gruppi a pari merito; sorteggiarne una volta l’ordine e conservarlo alla ripresa. Estrarre domande extra a quattro alternative dalla banca ordinaria condivisa (SPEC-13/34), senza ripetere quesiti già svelati. Usare lo stesso rendering e mescolamento delle alternative della fase ordinaria, conservando l’associazione con la risposta corretta. Per ogni extra avviare il tempo effettivo impostato per la partita normale, non un timer separato. Corretta: gruppo salvo e turno al successivo attivo; errore/scadenza: eliminazione. Un solo gruppo rimasto: vincitore e 10 blu. Non assegnare nuovi premi casuali nello spareggio e non eseguire estrazioni invisibili. La fase resta a eliminazione, senza una seconda gara a punti; l’uso dei premi già posseduti resta da definire in DEC-14.

Usare quesiti extra non svelati, della banca ordinaria e pertinenti agli argomenti selezionati. Il numero di extra non è limitabile a priori: prevedere rifornimento validato nello stesso formato SPEC-13 senza azzerare lo spareggio. A esaurimento sospendere e chiedere altri quesiti, senza ripetizioni silenziose o vincitori dichiarati per sola carenza di domande.


**SPEC-32 — Pulsante Pausa/Riprendi (da implementare; REG-24).** Comando del docente sempre raggiungibile durante una domanda ordinaria o extra. Alla pressione, verificare prima la scadenza effettiva: se il tempo è già scaduto, applicare l’esito della fase e non consentire di recuperare tempo tramite la pausa. Altrimenti memorizzare il residuo con precisione, fermare i tick e passare allo stato di pausa. Mostrare «In pausa» e il pulsante «Riprendi», disabilitare le alternative e l’avanzamento; nessun esito o variazione di punteggio per il solo trascorrere del tempo in pausa. Alla ripresa ricostruire la scadenza dal residuo, mantenendo domanda, ordine alternative, titolare e fase. Ripetuti clic non devono creare più timer. Lo stato resta fermo anche se si cambia scheda o si apre/chiude un dialogo; chiudere un dialogo non deve annullare una pausa manuale. I comandi sanzione restano utilizzabili durante la pausa. Non introdurre una pausa automatica all’apertura del dialogo sanzioni senza una decisione separata (DEC-06).

**SPEC-33 — Schermata di gioco interamente nel viewport (da implementare).** Nelle schermate operative di domanda nascosta, risposta, pausa ed esito, tutte le informazioni della schermata corrente e i comandi devono essere visibili contemporaneamente senza scorrimento verticale o orizzontale, né della pagina né di pannelli interni. Includere turno, contatore/fase, domanda e quattro alternative quando svelate, in entrambe le fasi, timer, Pausa/Riprendi, tabellone, rifiuto e comandi pertinenti; nell’esito includere soluzione, spiegazione disponibile e avanzamento. Non mostrare una soluzione durante la risposta per soddisfare il requisito di completezza. Ricalcolare il layout al ridimensionamento, al cambio orientamento e all’ingresso/uscita dallo schermo intero, usando l’altezza effettivamente disponibile nel browser.

Adattare disposizione di tabellone e contenuto, spaziature e dimensione dei testi al contenuto reale, comprese le formule dopo il rendering. Non soddisfare il requisito tramite `overflow:hidden`, troncamento, contenuti fuori schermo o testo ridotto fino a diventare illeggibile. Anche i dialoghi pausa/rifiuto/sanzione devono rendere raggiungibili tutti i relativi comandi. Copertina, configurazione e anteprima della banca possono scorrere: il requisito riguarda la schermata operativa del quiz.

La specifica di assenza di scorrimento richiede dimensioni minime di schermo e limiti di lunghezza del contenuto: con testi arbitrariamente lunghi e schermi arbitrariamente piccoli non si possono garantire contemporaneamente testo completo, leggibilità e assenza di scorrimento. In implementazione definire e dichiarare una matrice di dimensioni supportate e una soglia minima di leggibilità, da verificare con il docente. Prima della partita verificare tutte le domande estratte e le spiegazioni, e verificare le nuove domande extra prima di svelarle. Se una schermata non entra con testo leggibile, segnalarlo prima dello svelamento (o mettere in pausa in caso di ridimensionamento durante la risposta) e richiedere una correzione di contenuto o dimensioni disponibili, senza avviare un timer con informazioni nascoste. Non presentare un adattamento grafico come verificato finché non sono stati eseguiti i controlli visuali.


**SPEC-34 — Banca condivisa per fase ordinaria e spareggio (da implementare; REG-23).** Un solo caricamento della banca a quattro alternative nel formato SPEC-13. Il precedente contratto separato Vero/Falso è ritirato: non richiedere secondo file, risposte booleane o associazioni tra due banche. La riserva per lo spareggio è formata dai quesiti non ancora svelati della stessa banca, pertinenti alla selezione del docente. Conservare un insieme condiviso degli ID già svelati per evitare ripetizioni fra fasi.

Prima della partita mostrare separatamente il numero di quesiti estratti per le 33 domande e quelli disponibili come riserva; non imporre la presenza di un file Vero/Falso. La banca deve soddisfare il requisito delle 33 domande; se la riserva finisce al momento di uno spareggio, sospendere e consentire il rifornimento nel medesimo formato, verificando nuovi ID e contenuti. Non promettere un numero finito di extra sufficiente in ogni partita. Salvare banca, riserva, domande usate, impostazioni del timer e stato delle due fasi.

**SPEC-35 — Moltiplicatore di serie (da implementare; REG-07/08).** Per ciascun gruppo conservare una serie di corrette nei propri turni. A una corretta incrementare n, calcolare M = 1 + 0,10 × n e aggiungere soltanto il valore base della domanda moltiplicato per M. I turni degli avversari non cambiano n; errore e scadenza ordinari azzerano n. Le altre interruzioni seguono DEC-02. La prima corretta vale ×1,10 come esplicitato nel regolamento; non usare silenziosamente una formula con prima corretta ×1,00. Il contatore delle sanzioni è indipendente dal moltiplicatore e dai punti; non applicare il bonus al totale già accumulato. Usare i tre valori effettivi configurati in SPEC-38: facile 100, media 200 e difficile 300 sono i predefiniti. Non usare il vecchio +1 né inserire i valori dentro ciascun quesito. Usare aritmetica decimale esatta (con base intera, incremento 10% e divisione a metà, si possono conservare centesimi interi) ed evitare errori binari, arrotondamenti a punti interi e pareggi falsi. Il confronto finale deve usare i punteggi esatti. Mostrare serie, moltiplicatore e dettaglio del guadagno. Lo spareggio resta a eliminazione: non trasformarlo in una seconda gara a punti.

**SPEC-36 — Estrazione e gestione premi (da implementare; REG-25–REG-28).** Catalogo: `salta_turno`, `ruba_punti`, `svela_e_passa`. Nella configurazione del programma esporre «Probabilità premio (%)» come numero finito da 0 a 100 compresi; rifiutare valori vuoti, non numerici o fuori intervallo, senza conversioni implicite a zero. Il valore effettivo va mostrato al docente e salvato con la partita. Il valore predefinito non è ancora stabilito: non inventarlo, richiedere un valore valido se manca. Configurare p prima dell’avvio e conservarlo alla ripresa senza reinizializzarlo.

Per ogni corretta nella fase ordinaria effettuare una sola prova di assegnazione con probabilità p/100. Se non vince, nessun premio; se vince, scegliere uniformemente un solo tipo tra quelli del catalogo e accreditare una copia. I tre tipi attuali hanno probabilità condizionata 1/3 ciascuno; se il catalogo verrà ampliato, l’equiprobabilità diventa 1/N. Non offrire pesi diversi per tipo. La probabilità complessiva per ciascun tipo attuale è p/300 se p è espresso come percentuale: per esempio p=30% dà 10% Salta turno, 10% Ruba punti, 10% Svela e passa e 70% nessun premio. Questo è un esempio, non il valore predefinito.

Con p=0% non assegnare mai premi; con p=100% assegnarne uno a ogni corretta ordinaria. Nessuna estrazione per errore/scadenza, sola quota ricevuta da Ruba punti o corretta nello spareggio. I premi non dipendono da difficoltà, serie o tipo di quesito, salvo future modifiche esplicite. Salvare probabilità, catalogo utilizzato e risultati delle estrazioni per non ripetere o alterare una vincita alla ripresa.

Registrare una volta l’estrazione, senza ripeterla per doppi clic, ridisegni, pausa o ripresa. Accreditare il premio nell’inventario del gruppo: si può conservare e accumulare, comprese copie uguali. Non richiedere subito uso o bersaglio e non bloccare l’avanzamento perché un premio vinto resta inutilizzato. Non imporre un limite alle copie non deliberato.

All’attivazione verificare possesso della copia, partita in corso e diritto d’uso nel proprio turno. Rifiutare richieste fuori turno anche se originate tramite scorciatoie. Per i premi con bersaglio, selezionarlo all’uso: annullare prima della conferma non consuma, confermare consuma una sola copia e crea un solo effetto. Numero di attivazioni nello stesso turno e finestre prima/durante/dopo risposta seguono DEC-14; non si deducono dall’accumulabilità dell’inventario. Non assegnare nuovi premi nello spareggio. L’uso delle copie già possedute e l’uso da parte di chi riceve una domanda passata restano in DEC-14/17.

Salvare inventario, acquisizioni, consumi ed eventuali attivazioni incomplete; non risorteggiare il premio alla ripresa. Gli effetti già attivati sono distinti dalle copie ancora spendibili. Svela e passa è descritto in SPEC-37.

Salta turno: effetto sul prossimo turno del bersaglio, senza assegnarlo all’utilizzatore. Applicare una volta; cumuli e domanda associata seguono DEC-15.

Ruba punti: l’effetto attende la prossima domanda del bersaglio, non il prossimo turno globale. Se risponde correttamente, incrementare la sua serie, calcolare il guadagno lordo con il suo moltiplicatore e dividere a metà. Accreditare le due quote in un solo aggiornamento, senza assegnare prima il lordo intero al bersaglio. La somma delle quote deve uguagliare il lordo. La serie del beneficiario resta invariata e l’accredito non gli dà un’estrazione premio; il bersaglio conserva l’ordinaria possibilità di estrazione perché ha dato una corretta. Se sbaglia o scade il tempo, nessun accredito e rimozione dell’effetto, senza attendere una futura corretta. Consumare l’effetto una sola volta.

Usare centesimi interi o aritmetica decimale esatta: per esempio un guadagno lordo di 130 produce 65 per ciascuno; con base personalizzata 1, lordo 1,30 produce 0,65 per ciascuno. Mostrare nell’esito lordo, quote, beneficiario e bersaglio. Alla domanda 33 completare entrambe le quote prima del confronto finale. Non creare domande extra per utilizzare premi rimasti senza occasioni utili e non spostarli automaticamente nello spareggio; completare la regola di fine partita in DEC-16.

Cumuli sullo stesso bersaglio, rifiuti e turni saltati seguono DEC-16: non implementare dimezzamenti in cascata, più beneficiari o sovrascritture senza decisione. Salvare estrazioni, scelta bersaglio, effetti pendenti e ripartizioni eseguite; alla ripresa non riaccreditare quote.

**SPEC-37 — Svela e passa (da implementare; REG-28).** Nel proprio turno, attivare una copia conservata prima dello svelamento, consumarla e mostrare la domanda e le alternative. Solo per questa attivazione offrire «Rispondi» e «Passa a…». Se tiene, risponde lo stesso gruppo; se passa, scegliere un avversario valido e conservare la stessa domanda e lo stesso ordine delle alternative. La copia resta consumata anche se sceglie di tenere. Non estrarre una nuova domanda, non incrementare il contatore e non offrire un passaggio libero a chi non ha attivato il premio.

Conservare separatamente titolare del turno assegnato e gruppo rispondente. Completare DEC-17 prima di implementare timer della scelta, tempo del destinatario, prossimo turno, attribuzione di punti/serie/estrazioni e possibilità del destinatario di usare premi o contro-passare. Il semplice trasferimento della risposta non stabilisce automaticamente che il destinatario sia nel «proprio turno» ai fini dei premi. Salvare scelta in corso, copia consumata, titolare e destinatario per evitare doppi consumi alla ripresa.

**SPEC-38 — Punti base configurabili per difficoltà (da implementare; REG-07).** In configurazione mostrare tre campi distinti:

| Campo del programma | Valore predefinito | Valore JSON della difficoltà |
| --- | --- | --- |
| Punti domanda facile | 100 | `facile` |
| Punti domanda media | 200 | `media` |
| Punti domanda difficile | 300 | `difficile` |

Il docente può modificare ciascun valore prima dell’avvio; accettare interi positivi finiti e rappresentabili esattamente, rifiutando input vuoti, non numerici, negativi, zero, frazioni o valori che renderebbero non esatti i calcoli della partita. Non imporre rapporti fissi 1:2:3 quando il docente personalizza i tre valori. Il dataset continua a dichiarare la difficoltà nel campo `difficolta`: non deve duplicare il punteggio della configurazione.

All’avvio conservare la tabella effettiva come parte della partita e usare quella per tutte le risposte ordinarie; la ripresa da salvataggio non deve sostituirla con i predefiniti o con le impostazioni di una nuova partita. Mostrare nell’anteprima docente il valore base e nell’esito il dettaglio **base × moltiplicatore = lordo**, con eventuale ripartizione Ruba punti successiva. Non applicare i punti base allo spareggio a eliminazione o al premio finale 10 blu. Le sanzioni non sottraggono punti: usare solo il contatore separato di SPEC-39, senza −1, −100 o penalità proporzionali.

**SPEC-39 — Contatore sanzioni ed eliminazione disciplinare (da implementare; REG-10–REG-16).** Inizializzare a zero un contatore per gruppo. Il docente registra comportamento e destinatario; ogni evento confermato incrementa di uno il solo contatore. Non modificare il punteggio, non accreditare punti agli avversari e non aggiungere salti. Non azzerare automaticamente la serie di corrette per la prima o seconda sanzione: l’eventuale effetto sulla serie resta da definire in DEC-02.

Al raggiungimento di 3 segnare il gruppo come eliminato per sanzioni. Conservarne punteggio, inventario e cronologia a fini di riepilogo, ma escluderlo da turni, risposte, attivazioni e nuovi bersagli dei premi, graduatoria utile alla vittoria e ingresso nello spareggio. Visualizzare distintamente punti, sanzioni e motivo dell’eliminazione; nello spareggio distinguere eliminazione disciplinare da errore/scadenza. Errore ordinario, tempo scaduto ordinario e uso dei premi non sono sanzioni.

Conservare contatore e stato di eliminazione nel salvataggio e nel passaggio allo spareggio; nessun reset alla campanella o all’inizio di una nuova fase. Ogni sanzione confermata deve essere registrata una sola volta: doppi clic, ridisegni e ripresa non duplicano l’evento. Non permettere a un gruppo già eliminato di rientrare tramite passaggio domanda, premio o punteggio alto. Confrontare i punteggi finali solo tra gruppi ammissibili.

Terza sanzione al rispondente durante la domanda: segnare l’eliminazione e bloccare nuovi invii da quel gruppo; fermare il suo timer e richiedere la gestione docente senza inventare un esito, punto o ulteriore sanzione. Il destino della domanda segue DEC-05. Prima di automatizzare la conclusione quando resta uno o nessun gruppo prima della domanda 33, risolvere DEC-18; non applicare in modo implicito la conclusione dello spareggio alla fase ordinaria. Effetti premio pendenti che coinvolgono un eliminato seguono DEC-19.

## 7. Coerenza fra documenti, programma e presentazione

**SPEC-26 — Gerarchia e manutenzione (procedura da applicare da questa edizione).** Prima di modificare le regole leggere il regolamento; prima di modificare il gioco leggere anche queste specifiche. Le scelte DEC vanno risolte dal responsabile, non dal codice. Ogni modifica deve indicare gli ID interessati e aggiornare versione, data e cronologia.

**SPEC-27 — Tracciabilità della presentazione (da implementare).** Ogni sezione HTML deve essere collegata agli ID REG pertinenti e mostrare la versione del regolamento. Le semplificazioni del linguaggio per la classe devono conservare condizioni, conseguenze ed eccezioni. L'attuale v9 non dichiara la versione di questo documento né descrive tutte le convenzioni operative.

**SPEC-28 — Dati comuni (miglioramento proposto, non implementato).** In una futura implementazione spostare parametri condivisi — gruppi, domande ordinarie, timer condiviso tra le due fasi, formato a quattro alternative comune, punteggi base, incremento del moltiplicatore di serie, parametri approvati dei premi, premio finale fisso e rotazione fissa — in una configurazione strutturata validata. Il programma e la presentazione devono incorporare gli stessi valori e la stessa versione durante la generazione degli HTML, così da mantenere l'uso offline. Non aggiungere un caricamento di rete obbligatorio. Il regolamento resta la fonte semantica: un JSON di numeri non sostituisce le condizioni espresse nel testo.

**SPEC-29 — Controlli prima di distribuire (da implementare).** Affiancare controlli automatici per punteggi, transizioni, dataset e valori condivisi a una verifica visiva della presentazione. Un controllo dei soli numeri non prova che un testo spieghi correttamente tutte le regole.

## 8. Criteri di accettazione

Questa è una lista di scenari da usare per le implementazioni successive; non dichiara test già eseguiti. Gli scenari legati a DEC si completano dopo la decisione pertinente.

| ID | Scenario | Risultato atteso |
| --- | --- | --- |
| ACC-01 | Avvio con tre nomi e dataset validi | Tre gruppi a zero; un titolare sorteggiato; domanda nascosta (SPEC-04, SPEC-18) |
| ACC-02 | JSON malformato, ID duplicati, tre alternative o LaTeX non valido | Messaggio utile e avvio bloccato (SPEC-05, SPEC-13, SPEC-14) |
| ACC-03 | Quote insufficienti, somma errata o timer fuori intervallo | Preparazione bloccata senza partita parziale (SPEC-06–SPEC-09) |
| ACC-04 | Estrazione e sostituzione in anteprima | Quote rispettate, nessun ID duplicato; sostituzione stesso argomento/difficoltà o messaggio di indisponibilità (SPEC-09, SPEC-10) |
| ACC-05 | Risposta corretta dopo mescolamento delle alternative | Valore base × moltiplicatore aggiunto una sola volta; soluzione coerente e turno al successivo disponibile (SPEC-09/17/19/20/35) |
| ACC-06 | Errore o nessuna risposta ordinaria | Punteggio invariato, serie azzerata e turno al successivo disponibile; nessuna estrazione premio o penalità automatica (SPEC-19/35/36) |
| ACC-07 | Tre facili corrette nei propri turni, con turni altrui interposti e impostazioni predefinite | Guadagni 110, 120 e 130, totale 360; nessun blocco o passaggio libero. Esempio senza premi attivi (SPEC-20/35/38) |
| ACC-08 | Richiesta tempestiva di rifiuto annullata | Timer ripreso dal residuo; nessuna variazione di punti; decisione del docente rispettata (SPEC-23) |
| ACC-09 | Disturbo, suggerimento o protesta sanzionabile | +1 sanzione solo al gruppo responsabile; punti invariati e nessun salto disciplinare. Al totale 3 eliminazione (SPEC-22/39) |
| ACC-10 | Dopo 33 domande A=8, B=7, C=6; in una seconda partita B vince con 12 | Prima partita: vince A e il premio è 10 blu. Seconda: vince B e il premio è ancora 10 blu; nessuna conversione dei punti (SPEC-24/25) |
| ACC-11 | Campanella durante una domanda ordinaria o extra già svelata | La domanda prosegue con il tempo residuo; esito registrato prima di sospendere. Nessuna domanda successiva svelata; se l’esito determina il vincitore, riepilogo definitivo (SPEC-30) |
| ACC-12 | Doppio clic, clic alla scadenza, ritorno da scheda in background | Un solo esito e un solo aggiornamento dei punti (SPEC-17) |
| ACC-13 | HTML aperti localmente senza rete; schermo piccolo e tastiera | Risorse/formule disponibili, comandi leggibili e raggiungibili (SPEC-02, SPEC-03) |
| ACC-14 | Confronto di ogni sezione della presentazione con gli ID REG | Nessuna contraddizione e versione dichiarata quando SPEC-27 sarà implementato |
| ACC-15 | Avvio con impostazioni predefinite e risposta nei primi 15 secondi | Timer unico di 45 secondi, risposta accettata subito; nessuna fase «lettura» separata (SPEC-07) |
| ACC-16 | Dopo 33 domande A=8, B=8, C=5 | Avvia «Chi vuol essere eliminato» con A e B; C non partecipa. Risposta sbagliata di A: A eliminato, vince B, premio 10 blu (SPEC-31) |
| ACC-17 | Comunicazione del premio e registrazione | Premio fisso 10 blu ai vincitori; spiegazione della media con compiti/progetti e del voto verde annuale, senza pesi o arrotondamenti inventati (REG-21/22) |
| ACC-18 | Sospendi, esporta, chiudi il browser e importa alla lezione successiva | Stesse squadre, punteggi, rotazione fissa, ordine domande/alternative, salti e stato; nessuna nuova estrazione e nessun timer avviato automaticamente (SPEC-30) |
| ACC-19 | Salvataggio malformato o versione incompatibile | Ripresa bloccata con messaggio utile; partita attiva non sovrascritta (SPEC-30) |
| ACC-20 | Tre gruppi nello spareggio; corretta, errore, ulteriore corretta | Alternanza dei gruppi attivi, nessuna permanenza del turno per la corretta, eliminato escluso; termina solo quando resta un gruppo (SPEC-31) |
| ACC-21 | Esaurimento domande extra con due gruppi ancora attivi | Sospensione per rifornire la riserva; conserva stato e non assegna il premio (SPEC-31) |
| ACC-22 | Sospendi e riprendi durante lo spareggio | Conserva partecipanti, eliminazioni, riserva e turno corrente (SPEC-30/31) |
| ACC-23 | Carica banca con meno di 33 domande | Modalità regolamentare bloccata con indicazione della carenza (SPEC-06) |
| ACC-24 | Spareggio: tempo scaduto senza risposta | Il gruppo è eliminato una sola volta; ruota al successivo attivo oppure conclude con l’unico superstite (SPEC-31) |
| ACC-25 | Avvio e successiva ripresa dello spareggio | Ordine sorteggiato solo tra i gruppi ammessi; salvataggio/ripresa conservano lo stesso ordine, senza nuovo sorteggio (SPEC-31) |
| ACC-26 | Pausa durante domanda ordinaria ed extra; attendi, cambia scheda, poi riprendi | Residuo invariato in pausa, alternative bloccate, nessun esito; riprende dal residuo con un solo timer (SPEC-32) |
| ACC-27 | Pausa alla scadenza; doppi clic su pausa/riprendi | Nessun tempo recuperato dopo la scadenza; un solo esito e nessun intervallo duplicato (SPEC-32) |
| ACC-28 | Apri e chiudi una sanzione mentre è attiva la pausa manuale | Il timer resta fermo fino a Riprendi; la sanzione è registrata correttamente (SPEC-32) |
| ACC-29 | Domande e spiegazioni più lunghe della banca, formule multilinea, ridimensionamento e schermo intero | Nelle dimensioni supportate tutti i dati e comandi della schermata corrente sono completi e leggibili senza scroll o tagli; configurazione non idonea segnalata prima di iniziare o timer messo in pausa se cambia durante la risposta (SPEC-33) |
| ACC-30 | Campanella prima dello svelamento oppure dopo domanda 33 in pareggio | Salva senza svelare altro; alla ripresa mostra la prossima domanda nascosta oppure l’ingresso nello spareggio (SPEC-30) |
| ACC-31 | Un solo dataset ordinario a quattro alternative | Sufficiente per entrambe le fasi; nessun secondo file o contratto Vero/Falso richiesto (SPEC-13/34) |
| ACC-32 | Gioco normale personalizzato a 60 secondi, poi spareggio | Ogni extra ha quattro alternative e 60 secondi; con impostazioni predefinite ne ha 45. Nessun ritorno a 30 secondi (SPEC-07/31) |
| ACC-33 | Riserva, rifornimento e ripresa dello spareggio | Quesiti mai ripetuti rispetto a quelli svelati in entrambe le fasi; rifornimento nel formato ordinario e stato preservato (SPEC-30/34) |
| ACC-34 | 33 domande senza premi attivati, salti o rifiuti | Rotazione fissa e 11 turni per gruppo; passaggi da premio da verificare separatamente (SPEC-20/37) |
| ACC-35 | Sospensione/ripresa dopo una risposta corretta | Mantiene la rotazione e il prossimo titolare; nessun passaggio libero o conservazione automatica del turno; Svela e passa richiede una copia (SPEC-20/30) |
| ACC-36 | Corrette nei propri turni interrotte dai turni altrui, poi errore | La serie cresce solo per le proprie corrette; errore azzera. La corretta seguente riparte da ×1,10 (SPEC-35) |
| ACC-37 | Somma di guadagni decimali e confronto finale | Nessun arrotondamento a interi o errore di rappresentazione; premio finale resta 10 blu fisso (SPEC-19/24/35) |
| ACC-38 | Esito corretto, doppio clic, ridisegno e ripresa da salvataggio | Una sola estrazione premio e un solo accredito di punti, senza rigenerare l’esito casuale (SPEC-36) |
| ACC-39 | Uso di Salta turno su un avversario e doppio clic | Un premio consumato, un effetto destinato al prossimo turno del bersaglio; nessun furto di turno o punti. Cumulo e domanda secondo DEC-15 (SPEC-36) |
| ACC-40 | Probabilità 0% e 100%, poi risposta errata o spareggio | 0%: nessun premio; 100%: esattamente un premio a ogni corretta ordinaria. Nessuna vincita per errore/scadenza o nello spareggio (SPEC-36) |
| ACC-41 | Premio appena vinto, poi uso nel proprio turno o tentativo fuori turno | Premio conservato nell’inventario senza uso/bersaglio obbligatori; uso fuori turno respinto; bersaglio scelto solo all’attivazione consentita (SPEC-36) |
| ACC-42 | A attiva Ruba punti su B, C gioca prima di B, poi B guadagna lordo 130 | C non consuma l’effetto; B e A ricevono 65 ciascuno. Serie di B avanza, serie di A invariata (SPEC-36) |
| ACC-43 | B sbaglia o scade il tempo alla domanda bersaglio | Nessuna quota, serie di B azzerata ed effetto consumato senza rinvio alla futura corretta (SPEC-36) |
| ACC-44 | Salva inventario, attivazione incompleta o ripartizione già eseguita | Ripristina copie, scelta ed effetti senza risorteggi, doppi consumi o accrediti (SPEC-30/36) |
| ACC-45 | Condivisione alla domanda 33 | Entrambi gli accrediti precedono il confronto finale ed eventuale spareggio (SPEC-24/36) |
| ACC-46 | Vincita di più premi, anche uguali, e ripresa da salvataggio | Quantità accumulate esatte e persistenti; nessun uso o bersaglio obbligatorio alla vincita (SPEC-30/36) |
| ACC-47 | Attivazione fuori turno oppure selezione bersaglio confermata/annullata nel proprio turno | Fuori turno respinta; annullamento non consuma; conferma consuma una copia e crea un solo effetto (SPEC-36) |
| ACC-48 | Svela e passa e scelta di tenere | Una copia consumata, stessa domanda e alternative, nessun passaggio obbligatorio o domanda aggiuntiva (SPEC-37) |
| ACC-49 | Svela e passa e scelta destinatario | Stessa domanda trasferita, titolare e rispondente distinti; timer, premi e rotazione secondo DEC-17 (SPEC-37) |
| ACC-50 | Salva durante la scelta Svela e passa e riprendi | Domanda e scelta ripristinate senza doppio consumo; conclusione della domanda già svelata alla campanella resta valida (SPEC-30/37) |
| ACC-51 | Corretta in spareggio con probabilità premi forzata al 100% nel test | Nessuna estrazione o accredito di nuovi premi; inventario invariato per il solo esito corretto (SPEC-31/36) |
| ACC-52 | Domande ordinarie ed extra dalla stessa banca | Quattro alternative in entrambe le fasi, risposta corretta preservata dopo il mescolamento e nessun quesito già svelato ripetuto (SPEC-31/34) |
| ACC-53 | Probabilità vuota, non numerica, infinita o fuori 0–100 | Configurazione rifiutata con messaggio chiaro; nessun valore inventato o coercizione silenziosa (SPEC-36) |
| ACC-54 | Estrazione con generatore casuale controllato | Verifica separata della probabilità di vincita e della scelta uniforme tra i tre tipi; ogni ramo assegna una sola copia. Nessun test statistico instabile usato come unica verifica (SPEC-36) |
| ACC-55 | Salva e riprendi con probabilità personalizzata | Stesso parametro e stessi esiti già sorteggiati, senza ripetizioni o ritorno a un valore predefinito (SPEC-30/36) |
| ACC-56 | Prima risposta corretta con i tre valori predefiniti, serie iniziale zero | Facile 110, media 220, difficile 330: valori base 100/200/300 moltiplicati per ×1,10 (SPEC-35/38) |
| ACC-57 | Tabella personalizzata 150/250/400 e salvataggio/ripresa | Guadagni calcolati sui valori personalizzati; tabella persistente senza ritorno ai predefiniti (SPEC-30/38) |
| ACC-58 | Input punteggio non valido | Configurazione bloccata con messaggio utile; nessuna sostituzione silenziosa con +1 o predefiniti (SPEC-38) |
| ACC-59 | Prima e seconda sanzione con punti base predefiniti o personalizzati | Contatore 1 poi 2, punteggi invariati; nessuna sottrazione o salto (SPEC-22/38/39) |
| ACC-60 | Terza sanzione a un gruppo con il punteggio più alto | Gruppo eliminato, punteggio storico invariato e impossibilità di vincere o agire tramite premi; prossimi turni lo escludono (SPEC-39) |
| ACC-61 | Due sanzioni, sospensione/ripresa, ingresso nello spareggio e terza sanzione | Contatore conserva 2, poi arriva a 3 ed elimina; nessuna sottrazione di punti o reset tra fasi (SPEC-30/39) |
| ACC-62 | Doppio clic o ripresa dopo conferma sanzione | Un solo evento disciplinare; nessun incremento o eliminazione duplicata (SPEC-39) |
| ACC-63 | Errore ordinario, scadenza ordinaria, premio Salta turno | Nessuno dei tre eventi incrementa da solo il contatore sanzioni (SPEC-39) |
| ACC-64 | Gruppo eliminato selezionato come rispondente, bersaglio o utilizzatore premio | Operazione respinta, nessun consumo o accredito implicito; effetti preesistenti secondo DEC-19 (SPEC-39) |

## 9. Passi successivi proposti

1. Risolvere gli effetti della serie in DEC-02, il caso DEC-03 e la gestione della domanda in DEC-05, l’automatismo residuo in DEC-06, i casi residui DEC-11 e i casi dei premi DEC-14–DEC-17 e le eliminazioni in DEC-18/19. DEC-04 è superata: niente salti disciplinari. DEC-13 è risolta: probabilità configurabile e tipi equiprobabili. Conservazione e accumulo sono approvati, con uso solo nel proprio turno; l’obbligo di uso immediato è superato. Il passaggio libero resta escluso; Svela e passa è l’eccezione con premio. I punti base per difficoltà sono ora definiti e configurabili (SPEC-38); le sanzioni sono un contatore separato con eliminazione a 3, senza punti sottratti (SPEC-39). DEC-07–DEC-10 e DEC-12 sono risolte; la scadenza eliminatoria in DEC-11 è definita.
2. Adeguare programma e presentazione: 33 domande con rotazione fissa dopo ogni esito, senza passaggi liberi né limite delle tre corrette, con eccezione Svela e passa, errore/scadenza ordinari a 0, timer unico 45 secondi, sospensione/ripresa dopo aver concluso la domanda svelata, spareggio con banca ordinaria condivisa, quattro alternative, stesso tempo normale, nessun nuovo premio, ordine casuale e scadenza eliminatoria, 10 blu fisso, Pausa/Riprendi e layout in altezza senza scorrimento. Introdurre versione e riferimenti REG.
3. Introdurre configurazione condivisa e schema del dataset con una migrazione esplicita, conservando gli HTML autonomi; aggiungere uno schema versionato del salvataggio.
4. Automatizzare gli scenari fondamentali, inclusi chiusura/ripresa e spareggio. Valutare separatamente l'annullamento dell'ultima operazione del docente.

## 10. Versioni

Si mantengono percorsi stabili, versione interna e cronologia Git. Aggiornare qui la versione del regolamento di riferimento quando cambia. Non modificare gli hash di `PROVENIENZA.json`: descrivono i file originariamente trasferiti, non quelli creati in seguito.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Inventario iniziale, requisiti tracciabili, lacune e criteri di accettazione |
| 2.0.0 | 21/10/2026 | Allineamento dei requisiti e degli scenari al regolamento 2.0.0; vecchi HTML esplicitamente da adeguare |
| 3.0.0 | 21/10/2026 | Requisiti per 33 domande, sospensione persistente e ripresa, spareggio a eliminazione, timer unico e premio fisso; nuovi scenari di verifica |
| 4.0.0 | 21/10/2026 | Pausa/Riprendi e schermata operativa in altezza; sorteggio dello spareggio e scadenza eliminatoria; sospensione alla campanella dopo la domanda svelata |
| 5.0.0 | 21/10/2026 | Contratto e caricamento della banca Vero/Falso separata; timer spareggio 30 secondi; salvataggio delle due banche e verifiche per fase |
| 6.0.0 | 21/10/2026 | Rotazione fissa dopo ogni domanda; eliminati passaggi e blocco delle tre corrette; aggiornati salvataggio e scenari; bonus e punteggi variabili non ancora deliberati |
| 7.0.0 | 21/10/2026 | Serie e moltiplicatore decimale, inventario ed estrazione premi, Salta turno, esclusione furti; parametri casuali e d’uso ancora da definire |
| 8.0.0 | 21/10/2026 | Premi con bersaglio immediato; Ruba punti con ripartizione esatta del prossimo guadagno, esiti, salvataggio e nessun inventario spendibile |
| 9.0.0 | 21/10/2026 | Inventario accumulabile e uso solo nel proprio turno; Svela e passa; spareggio con banca e timer ordinari e senza nuove assegnazioni di premi |
| 10.0.0 | 21/10/2026 | Parametro probabilità 0–100%, estrazione uniforme del tipo, singolo premio per corretta e controlli su configurazione/salvataggio |
| 11.0.0 | 21/10/2026 | Configurazione dei punti base 100/200/300, calcolo per difficoltà, salvataggio dei valori ed esempi aggiornati; sanzioni non riscalate |
| 12.0.0 | 21/10/2026 | Sanzioni separate dai punti, eliminazione disciplinare a 3, persistenza e ammissibilità alla vittoria; nuovi scenari e casi limite |
