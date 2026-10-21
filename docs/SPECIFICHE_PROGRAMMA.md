# Chi vuol essere rimandato — Specifiche del programma

Versione: **14.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Regolamento di riferimento: [REGOLAMENTO_UFFICIALE.md, v14.0.0](REGOLAMENTO_UFFICIALE.md).

## 1. Scopo e gerarchia

Questo documento raccoglie le specifiche funzionali, i vincoli tecnici e i criteri di accettazione del quiz HTML. Il regolamento definisce le regole; questo documento definisce come applicarle. La presentazione HTML è una spiegazione per la classe. In caso di contrasto prevale il regolamento; per le questioni aperte non si inventano soluzioni normative.

L'analisi iniziale è stata eseguita sul commit `4b7f285cfc4bec5507bed559ada3efa479b29e95`, leggendo il programma `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`, il regolamento HTML v9, il template e il prompt dataset v1. È una verifica del sorgente, non una certificazione funzionale in browser.

Stati dei requisiti: **presente** = riscontrato nel sorgente; **da implementare** = requisito per una futura modifica; **da decidere** = dipende da una questione DEC del regolamento. Le presenti modifiche sono documentali e non aggiornano gli HTML. **Il programma v3 e la presentazione v9 non sono conformi al regolamento 14.0.0**: vanno adeguati rotazione fissa con il solo passaggio da premio, errore/scadenza, timer, conclusione, sospensione/ripresa, spareggio, premio finale, pausa manuale e disposizione della schermata in altezza. La lettura del sorgente non equivale a una verifica in browser.

## 2. Utenti e distribuzione

- **SPEC-01 — Conduzione (presente).** Un docente conduce il gioco su un dispositivo, eventualmente proiettato. Non è un'applicazione multiplayer con accessi separati. Il docente registra nell'interfaccia la risposta comunicata dal portavoce.
- **SPEC-02 — Uso locale (presente).** Il gioco è un HTML autonomo apribile nel browser senza installazione. Dataset JSON esterno selezionato dall'utente; formule, font e risorse già inclusi devono funzionare anche offline. Non richiede account, server o accesso al registro.
- **SPEC-03 — Interfaccia (presente).** Copertina con logo e avvio, configurazione, anteprima docente, domanda nascosta, risposta a tempo, esito e riepilogo. Testi leggibili in proiezione, layout adattabile, focus visibile, comandi utilizzabili da tastiera e schermo intero con messaggio alternativo se non disponibile. Correttezza ed errore sono indicati anche dal testo, oltre al colore.

## 3. Configurazione e anteprima

| ID | Requisito | Stato |
| --- | --- | --- |
| SPEC-04 | Tre nomi di gruppo distinti senza distinzione fra maiuscole e minuscole; nomi vuoti sostituiti da nomi predefiniti | Presente |
| SPEC-05 | Caricamento e validazione del JSON prima dell'estrazione; un nuovo caricamento invalida quello precedente | Presente |
| SPEC-06 | 33 domande ordinarie valide, salvo vittoria anticipata dell’unico gruppo rimasto o sconfitta di tutti. Rifiuto accettato, turno saltato e quesito annullato per eliminazione del rispondente non consumano una domanda valida; prevedere sostituti nella banca | Da adeguare |
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
| Domanda nascosta | Svela ordinariamente | Mostra domanda e alternative e avvia il timer; per Svela e passa la scelta precede l’avvio del tempo |
| Risposta a tempo | Seleziona alternativa prima della scadenza | Un solo esito; valore base × moltiplicatore se corretta, 0 se errata; blocco delle alternative (da adeguare) |
| Risposta ordinaria a tempo | Scadenza | Un solo esito a 0 punti, anche se la scheda era in background (da adeguare) |
| Risposta ordinaria o spareggio | Pausa | Memorizza il residuo effettivo, ferma timer, disabilita risposte; mostra stato in pausa |
| Pausa manuale | Riprendi | Riprende il tempo residuo e riabilita le risposte, senza azzerare il timer |
| Risposta a tempo | Chiedi rifiuto | Pausa del timer e decisione docente |
| Valutazione rifiuto | Annulla / nega | Riprende il tempo residuo senza ripartire da zero |
| Valutazione rifiuto | Accetta | Sostituisce allo stesso rispondente, stesso indice valido, serie invariata, nuovo tempo intero allo svelamento; quota premio del turno invariata |
| Esito | Prossima | Avanza una domanda valida e prosegue dal successore del rispondente effettivo, anche dopo Svela e passa; salti ed eliminazioni applicati senza consumare la domanda successiva |
| Domanda ancora nascosta o esito già registrato | Sospendi alla campanella | Salvataggio e sospensione prima dello svelamento successivo; nessun premio anticipato |
| Domanda già svelata, anche in pausa o in revisione rifiuto | Richiedi sospensione alla campanella | Segna sospensione in attesa: non archivia la domanda come sospesa fra lezioni; conclude risposta/scadenza o decisione rifiuto e registra esito prima di sospendere |
| Partita sospesa fra lezioni | Riprendi | Stesse squadre, punteggi e stato di gioco; riparte prima della prossima domanda nascosta; nessuna nuova estrazione o nuovo sorteggio |
| Domanda ordinaria 33 valida conclusa | Concludi fase ordinaria | Confronta gruppi attivi: massimo unico vince; pareggio avvia spareggio, cancellando tutti gli inventari e gli effetti prima della prima domanda extra |
| Spareggio, domanda extra | Risposta corretta | Gruppo ancora in gioco; turno al successivo partecipante attivo |
| Spareggio, domanda extra | Risposta sbagliata o tempo scaduto | Elimina il gruppo; se rimane un solo gruppo, dichiara il vincitore; altrimenti prosegui a turno |
| Riepilogo | Nuova partita | Configurazione; i dati della partita successiva vengono azzerati all'avvio |

**SPEC-17 — Integrità delle transizioni (presente, da verificare con scenari).** Nessuna risposta doppia, punteggio doppio o avanzamento doppio. La gestione dell’esito ordinario e dell’eliminazione nello spareggio deve essere distinta. Un clic alla scadenza o dopo la scadenza equivale a tempo scaduto; il riferimento è la scadenza temporale effettiva, non il numero arrotondato mostrato dal timer.

**SPEC-18 — Domande nascoste (presente).** Nessun testo o alternativa visibile nella schermata di scelta; nessun cambio di ordine delle alternative durante la stessa domanda. Dopo l'esito mostra risposta corretta e spiegazione, se presente.

## 6. Punteggi, sanzioni e conclusione

| ID | Requisito | Regole | Stato |
| --- | --- | --- | --- |
| SPEC-19 | Corretta = base × moltiplicatore, con eventuale Ruba punti; errore/scadenza ordinari 0. Nessuna sottrazione disciplinare. Punteggi e contatore sanzioni separati; eliminazione alla terza sanzione anche nella fase ordinaria. Rotazione tra gruppi attivi | REG-02, REG-07–REG-10 | Da adeguare |
| SPEC-20 | Rotazione fra gruppi attivi; un solo premio per turno. Dopo Svela e passa il successore si calcola dal destinatario rispondente. Salta turno cumulato salta occasioni senza consumare la domanda; niente mantenimento del turno per corretta o blocco dopo tre corrette | REG-02, REG-05, REG-08, REG-26–REG-28 | Da implementare |
| SPEC-21 | Tabellone con titolare del turno e rispondente se diverso, rotazione, punteggi, serie/moltiplicatori, inventario per gruppo con quantità dei tre premi, effetti pendenti, contatore sanzioni 0–3, stato eliminato con causa e salti da premio. Inventario visibile e comandi d’uso attivi solo nel proprio turno | REG-02, REG-08, REG-25–REG-28 | Da adeguare |
| SPEC-22 | Sanzione: pausa automatica del timer all’apertura pannello, incremento contatore e azzeramento serie, punti invariati. Alla terza eliminazione prioritaria, anche durante risposta, e cancellazione premi/effetti coinvolti. Verificare dopo l’intervento vittoria anticipata o tutti eliminati | REG-10–REG-16, REG-24 | Da implementare |
| SPEC-23 | Rifiuto tempestivo con soli due motivi ammessi; decide il docente. Accettato: sostituto allo stesso gruppo, serie invariata e stesso indice valido. Respinto: riprende residuo; nessun nuovo premio o punto per il rifiuto | REG-17–REG-19 | Da adeguare |
| SPEC-24 | Dopo ogni eliminazione/intervento disciplinare completato: zero gruppi attivi = tutti sconfitti e nessun 10; uno = vittoria anticipata con 10 blu. Altrimenti dopo 33 domande valide confrontare punti dei soli attivi e applicare eventuale spareggio | REG-10, REG-20, REG-21, REG-23 | Da implementare |
| SPEC-25 | Riepilogo definitivo con punteggi ordinari, esito dello spareggio se presente, vincitore e premio «10 blu». Spiegare il contributo alla media delle attività fuori verifica e al voto verde di fine anno; nessuna conversione punti/voto, nessuna scrittura automatica su ClasseViva né calcolo della valutazione annuale | REG-20–REG-23 | Da adeguare |

Il registro eventi attuale conserva al massimo otto messaggi in memoria e ne mostra quattro. Il programma attuale non ripristina una partita dopo il caricamento della pagina: **salvataggio e ripresa sono ora requisiti necessari, ancora da implementare** (SPEC-30). L'annullamento dell'ultima operazione resta una possibile miglioria separata.

**SPEC-30 — Sospensione e ripresa (da implementare; REG-20).** Sostituire la conclusione «fine modulo» con una sospensione. Conservare versione del regolamento e formato del salvataggio, identificativo della partita, composizione delle squadre (nomi e membri ove registrati), ordine di rotazione, titolare iniziale del turno, rispondente effettivo e riferimento per il prossimo gruppo, flag premio già usato nel turno, punteggi decimali, contatori disciplinari per gruppo, stato e causa di eliminazione, serie individuali, inventario conservabile con quantità per tipo e gruppo, attivazione o selezione bersaglio da completare, premi attivati e consumati, effetti pendenti con beneficiario e bersaglio, salti temporanei dovuti ai soli premi, tabella dei punti base effettivi, indice e stato della domanda, contatori di risposte/rifiuti, tempo residuo e impostazioni. Conservare anche le estrazioni di premio già effettuate e gli esiti associati a ciascuna risposta, per impedire nuove estrazioni alla ripresa. Salvare anche domande estratte, ordine delle alternative e risposte corrette, la banca ordinaria condivisa e l’eventuale riserva residua, ID dei quesiti già svelati in entrambe le fasi e, nello spareggio, partecipanti, eliminati, ordine dei turni e tempo effettivo ereditato dalla fase ordinaria. In caso di rifornimento validare gli ID contro l’intera banca condivisa e i quesiti già svelati; nessun caricamento separato Vero/Falso. Nessuna assegnazione del premio alla campanella. Non richiedere nominativi degli studenti per il solo funzionamento: il docente può garantire la stessa composizione usando i nomi delle squadre.

Il salvataggio deve sopravvivere alla chiusura del browser e consentire esportazione/importazione di un file locale versionato; l'autosalvataggio locale è complementare, non l'unico mezzo di ripresa. Validare integralmente un salvataggio prima di sostituire la partita attiva; un file non valido o incompatibile deve lasciare intatta la partita. Riprendere con timer fermo fino al comando del docente, senza applicare come tempo trascorso l'intervallo fra le lezioni. Per la sospensione dovuta alla campanella, una domanda già svelata va conclusa nella lezione in corso (REG-20): usare un flag «sospendi dopo questa domanda», impedire lo svelamento successivo e salvare dopo aver registrato l’esito. Se quell’esito o un’eliminazione disciplinare determina il vincitore o la sconfitta di tutti, mostrare il riepilogo definitivo; la priorità disciplinare prevale sul completamento della domanda. Se la domanda 33 produce un pareggio, salvare lo spareggio ancora da iniziare senza svelare una domanda extra. Un eventuale salvataggio tecnico di emergenza non deve essere presentato come il normale rinvio di una domanda già svelata alla campanella. Il file di partita contiene soluzioni ed è destinato al docente.

**SPEC-31 — «Chi vuol essere eliminato» (da implementare; REG-23).** Dopo le 33 domande valide, in caso di parità al massimo tra gruppi attivi, cancellare tutti gli inventari dei premi e tutti gli effetti pendenti (Salta turno e Ruba punti inclusi), per ogni gruppo. Solo dopo questo reset entrare nello spareggio e salvarne lo stato: la ripresa non deve recuperare premi eliminati. Sorteggiare una volta l’ordine dei partecipanti; usare quesiti non svelati della banca ordinaria a quattro alternative e lo stesso tempo impostato per la partita. Una corretta mantiene in gara e ruota; errore/scadenza eliminano. Non assegnare o consentire uso di premi. Le sanzioni continuano, azzerano la serie e alla terza eliminano con priorità. Il rifiuto accettato sostituisce allo stesso gruppo, senza cambiare la serie. Dopo l’intervento completo, un superstite vince il 10 blu; nessun superstite significa sconfitta di tutti. Nessun punto o moltiplicatore aggiuntivo nello spareggio.

Usare quesiti extra non svelati, della banca ordinaria e pertinenti agli argomenti selezionati. Il numero di extra non è limitabile a priori: prevedere rifornimento validato nello stesso formato SPEC-13 senza azzerare lo spareggio. A esaurimento sospendere e chiedere altri quesiti, senza ripetizioni silenziose o vincitori dichiarati per sola carenza di domande.


**SPEC-32 — Pausa manuale e automatica per sanzioni (da implementare; REG-24).** Comando Pausa/Riprendi sempre raggiungibile in una risposta ordinaria o extra. La pausa manuale conserva il residuo effettivo, ferma i tick e blocca risposte, mostrando «In pausa»; riprende soltanto dal residuo, senza tempo aggiuntivo o timer duplicati. Una pausa manuale alla scadenza non recupera una domanda già scaduta.

**Aprire il pannello sanzioni sospende automaticamente il timer**, se in corso. Registrare motivo e stato di provenienza della pausa: se il timer era già fermo (pausa manuale, domanda nascosta, scelta Svela e passa o esito) deve restare fermo. Alla chiusura del pannello richiedere Riprendi per il tempo ancora utilizzabile; non riavviare una domanda terminata o di un eliminato. Cambio scheda, Escape e apertura/chiusura di altri dialoghi non devono cancellare una pausa ancora attiva. Le risposte restano bloccate durante pannello e pausa.

La priorità delle sanzioni è gestita da SPEC-39: se un esito o timeout non è ancora stato registrato e arriva l’intervento disciplinare, non completare l’esito concorrente prima della sanzione. La sola apertura del pannello non incrementa sanzioni o azzera la serie: ciò avviene alla conferma della sanzione.

**SPEC-33 — Schermata di gioco interamente nel viewport (da implementare).** Nelle schermate operative di domanda nascosta, risposta, pausa ed esito, tutte le informazioni della schermata corrente e i comandi devono essere visibili contemporaneamente senza scorrimento verticale o orizzontale, né della pagina né di pannelli interni. Includere turno, contatore/fase, domanda e quattro alternative quando svelate, in entrambe le fasi, timer, Pausa/Riprendi, tabellone, rifiuto e comandi pertinenti; nell’esito includere soluzione, spiegazione disponibile e avanzamento. Non mostrare una soluzione durante la risposta per soddisfare il requisito di completezza. Ricalcolare il layout al ridimensionamento, al cambio orientamento e all’ingresso/uscita dallo schermo intero, usando l’altezza effettivamente disponibile nel browser.

Adattare disposizione di tabellone e contenuto, spaziature e dimensione dei testi al contenuto reale, comprese le formule dopo il rendering. Non soddisfare il requisito tramite `overflow:hidden`, troncamento, contenuti fuori schermo o testo ridotto fino a diventare illeggibile. Anche i dialoghi pausa/rifiuto/sanzione devono rendere raggiungibili tutti i relativi comandi. Copertina, configurazione e anteprima della banca possono scorrere: il requisito riguarda la schermata operativa del quiz.

La specifica di assenza di scorrimento richiede dimensioni minime di schermo e limiti di lunghezza del contenuto: con testi arbitrariamente lunghi e schermi arbitrariamente piccoli non si possono garantire contemporaneamente testo completo, leggibilità e assenza di scorrimento. In implementazione definire e dichiarare una matrice di dimensioni supportate e una soglia minima di leggibilità, da verificare con il docente. Prima della partita verificare tutte le domande estratte e le spiegazioni, e verificare le nuove domande extra prima di svelarle. Se una schermata non entra con testo leggibile, segnalarlo prima dello svelamento (o mettere in pausa in caso di ridimensionamento durante la risposta) e richiedere una correzione di contenuto o dimensioni disponibili, senza avviare un timer con informazioni nascoste. Non presentare un adattamento grafico come verificato finché non sono stati eseguiti i controlli visuali.


**SPEC-34 — Banca condivisa per fase ordinaria e spareggio (da implementare; REG-23).** Un solo caricamento della banca a quattro alternative nel formato SPEC-13. Il precedente contratto separato Vero/Falso è ritirato: non richiedere secondo file, risposte booleane o associazioni tra due banche. La riserva per lo spareggio è formata dai quesiti non ancora svelati della stessa banca, pertinenti alla selezione del docente. Conservare un insieme condiviso degli ID già svelati per evitare ripetizioni fra fasi.

Prima della partita mostrare separatamente il numero di quesiti estratti per le 33 domande e quelli disponibili come riserva; non imporre la presenza di un file Vero/Falso. La banca deve soddisfare il requisito delle 33 domande; se la riserva finisce al momento di uno spareggio, sospendere e consentire il rifornimento nel medesimo formato, verificando nuovi ID e contenuti. Non promettere un numero finito di extra sufficiente in ogni partita. Salvare banca, riserva, domande usate, impostazioni del timer e stato delle due fasi.

**SPEC-35 — Serie da seconda corretta, senza tetto (da implementare; REG-07/08).** Per ogni gruppo n parte da 0. Alla corretta ordinaria incrementare n, poi calcolare **M = 1 + 0,10 × (n − 1)** per n ≥ 1. Con n=0 il prossimo guadagno usa ×1,00; non applicare la formula ottenendo ×0,90. Sequenza: ×1,00, ×1,10, ×1,20, ×1,30, … senza tetto regolamentare o blocco a tre risposte.

Errore/scadenza ordinari e ogni sanzione confermata azzerano n. Rifiuto accettato, turno saltato, turni altrui e passaggio senza risposta non lo cambiano. La corretta di una domanda passata incrementa la serie di chi risponde, non quella di chi passa; punti ed eventuale premio seguono il rispondente. Calcolare guadagno lordo con base configurata SPEC-38 e moltiplicatore di quel gruppo; applicare poi Ruba punti, se attivo.

I predefiniti base restano 100/200/300. Tre facili consecutive valgono 100 + 110 + 120 = 330. Una media alla terza corretta vale 240, non 260. Con più Ruba punti la divisione può produrre frazioni periodiche: conservare punteggi razionali esatti, non limitarsi a centesimi interi. Con configurazioni ampie controllare la rappresentabilità, senza imporre un limite di serie. Il confronto finale usa valori esatti. Nello spareggio non si attribuiscono nuovi punti e i premi sono cancellati.

**SPEC-36 — Premi, quota per turno ed effetti (da implementare; REG-25–REG-28).** Catalogo: `salta_turno`, `ruba_punti`, `svela_e_passa`. Parametro p configurabile prima della partita come percentuale finita 0–100; validazione esplicita e nessun valore predefinito inventato se manca. Una prova di vincita dopo ciascuna corretta ordinaria, poi scelta uniforme di un solo tipo: 1/3 condizionato alla vincita, p/3 complessivo per tipo se p è espresso come probabilità. A p=0 nessun premio; p=100% un premio per corretta ordinaria. Nessuna estrazione per errore/scadenza, sanzione, sola quota Ruba punti o corrette nello spareggio. Registrare una sola volta prova ed esito, evitando nuove estrazioni con doppi clic, ridisegni o ripresa.

Accreditare il premio all’inventario conservabile e accumulabile del rispondente; nessun uso/bersaglio obbligatorio alla vincita e nessun limite inventato all’inventario. Consentire **al massimo una copia attivata per turno** complessivamente, qualunque sia il tipo. Conservare `premioUsatoNelTurno` anche se un rifiuto sostituisce il quesito, interviene una pausa o la domanda viene passata. Il passaggio non rinnova la quota: il destinatario non può contro-passare o attivare un secondo premio sulla stessa domanda. Resettare la quota solo all’avvio del turno successivo.

Svela e passa richiede domanda ancora nascosta; Salta turno e Ruba punti sono utilizzabili nel proprio turno prima o dopo lo svelamento, senza applicazione retroattiva a esiti registrati. Il turno termina con l’avanzamento al successivo: un premio appena vinto può restare in inventario o essere usato prima dell’avanzamento se la quota del turno è ancora disponibile e il tipo è legalmente attivabile. Nessuna attivazione durante pause, dialoghi disciplinari o dopo fine partita. Controllare possesso, turno, quota e bersaglio attivo anche per richieste da scorciatoia; selezione annullata prima di conferma non consuma. Conferma valida: una copia consumata, quota marcata e un solo effetto. Un tentativo non valido non consuma né copia né quota.

**Salta turno.** Ogni attivazione aggiunge un’occasione da saltare al bersaglio. Due attivazioni lecite in turni diversi o da gruppi diversi sullo stesso bersaglio si sommano. All’assegnazione, un salto consuma una sola occasione del contatore; proseguire nella rotazione fino a un gruppo disponibile, senza scartare, svelare o consumare la domanda. Il salto non azzera la serie. Verificare prima la condizione di unico superstite: non tenere aperta una partita già vinta a causa di salti pendenti.

**Ruba punti.** Consentire più effetti attivi sul medesimo bersaglio, mantenendo per ciascuno beneficiario e bersaglio. Le nuove attivazioni restano soggette a possesso, proprio turno e massimo un premio attivato per turno. Alla risposta corretta raccogliere i beneficiari attivi **distinti**, aggiungere il bersaglio e calcolare una sola volta il lordo con la nuova serie del rispondente. Con k beneficiari assegnare a ognuno dei k + 1 gruppi lordo/(k + 1), in una transazione unica. Nessun dimezzamento in cascata o premio del 50% separato per ogni effetto. Più copie dello stesso beneficiario non aumentano il numero delle quote: l’interfaccia deve segnalare l’eventuale attivazione ridondante prima del consumo, senza inventare una quota aggiuntiva. Solo il rispondente modifica la serie ed è eleggibile per l’estrazione; gli accrediti passivi non sono risposte corrette. Con A e C beneficiari su B e lordo 240: 80 ciascuno. Con unico beneficiario e lordo 120: 60 ciascuno. Su errore/scadenza nessuna quota; consumare insieme tutti gli effetti di quella risposta. Turni altrui, salti e rifiuti accettati non consumano gli effetti.

Eliminazione: cancellare inventario dell’eliminato e tutti gli effetti in cui è beneficiario o bersaglio, senza trasferirli. Se viene eliminato un beneficiario Ruba punti, conservare gli effetti degli altri beneficiari sullo stesso bersaglio; determinare le quote dagli effetti ancora validi al momento della risposta. Se è eliminato il bersaglio, cancellare tutti gli effetti su di lui. Nessun ricalcolo retroattivo di quote già accreditate. Ingresso nello spareggio: cancellare tutti gli inventari ed effetti, senza nuove assegnazioni o attivazioni. Fine partita: gli oggetti senza occasioni utili non creano nuove domande né alterano il risultato. Salvare inventari, quota di turno, selezioni in corso, effetti, estrazioni e quote già accreditate; non riapplicare nulla alla ripresa.

**SPEC-37 — Svela e passa e rotazione dal destinatario (da implementare; REG-28).** Attivabile solo nel proprio turno prima dello svelamento e se nessun premio è già stato usato nel turno. Alla conferma consumare una copia e marcare la quota, poi mostrare stessa domanda e quattro alternative **con timer non avviato e risposte bloccate**. Mostrare le scelte «Rispondi» e «Passa a…», con soli destinatari attivi. Nessuna scadenza viene scalata durante la scelta.

Alla conferma di tenere o del destinatario, avviare il **tempo intero configurato** per il gruppo che risponde; non cambiare domanda, ordine delle alternative o contatore. Tenere non restituisce la copia. Un passaggio trasferisce la risposta, non genera un’altra domanda o una nuova quota premio. Il destinatario non può contro-passare o usare un altro premio sulla medesima domanda. Applicare le verifiche di eliminazione e disponibilità al bersaglio al momento della conferma; un salto pendente conserva la domanda per il successivo disponibile.

Attribuire risposta, punti, serie ed eventuale estrazione al gruppo che effettivamente risponde. Alla conclusione calcolare il successore di quel gruppo nella rotazione fissa, saltando eliminati e applicando i salti dovuti. Esempio A → B → C: A passa a C, poi il turno va ad A; non va a B per il solo fatto che A fosse il titolare originario. Conservare titolare iniziale, rispondente, scelta in corso, copia consumata, quota premio e stato di avvio timer nel salvataggio.

Un rifiuto accettato conserva gruppo rispondente e quota già usata, sostituendo il quesito senza riabilitare Svela e passa o ripartire la serie. Il nuovo timer intero parte allo svelamento del sostituto. Alla campanella una domanda già svelata con Svela e passa va comunque conclusa nella lezione, salvo eliminazione prioritaria o fine partita.

**SPEC-38 — Punti base configurabili per difficoltà (da implementare; REG-07).** In configurazione mostrare tre campi distinti:

| Campo del programma | Valore predefinito | Valore JSON della difficoltà |
| --- | --- | --- |
| Punti domanda facile | 100 | `facile` |
| Punti domanda media | 200 | `media` |
| Punti domanda difficile | 300 | `difficile` |

Il docente può modificare ciascun valore prima dell’avvio; accettare interi positivi finiti e rappresentabili esattamente nel formato razionale scelto, rifiutando input vuoti, non numerici, negativi, zero, frazioni o valori che renderebbero non esatti i calcoli della partita. Non imporre rapporti fissi 1:2:3 quando il docente personalizza i tre valori. Il dataset continua a dichiarare la difficoltà nel campo `difficolta`: non deve duplicare il punteggio della configurazione.

All’avvio conservare la tabella effettiva come parte della partita e usare quella per tutte le risposte ordinarie; la ripresa da salvataggio non deve sostituirla con i predefiniti o con le impostazioni di una nuova partita. Mostrare nell’anteprima docente il valore base e nell’esito il dettaglio **base × moltiplicatore = lordo**, con eventuale ripartizione Ruba punti successiva. Non applicare i punti base allo spareggio a eliminazione o al premio finale 10 blu. Le sanzioni non sottraggono punti: usare solo il contatore separato di SPEC-39, senza −1, −100 o penalità proporzionali.

**SPEC-39 — Priorità delle sanzioni ed eliminazione (da implementare; REG-10–REG-16).** Contatore iniziale 0 per gruppo. Apertura del pannello: pausa automatica secondo SPEC-32, senza sanzionare per la sola apertura. Ogni sanzione confermata incrementa il contatore e azzera la serie del gruppo, lasciando invariati punteggio e guadagni già registrati. Non aggiunge salti. Errori, scadenze e premi non sono sanzioni.

Le sanzioni hanno precedenza su risposte, scadenze, premi e avanzamenti ancora pendenti. Durante il pannello bloccare tali azioni; se timer o risposta competono con un intervento disciplinare non ancora concluso, risolvere prima quest’ultimo e rivalutare validità/stato del gruppo. Non applicare due volte lo stesso evento e non creare contemporaneamente esito e annullamento della stessa domanda. Un risultato già definitivamente registrato non viene reinterpretato come risposta pendente.

Alla terza sanzione eliminare immediatamente anche il gruppo che sta rispondendo: fermare il suo timer, bloccarne la risposta e non assegnare esito, punti o premio per la domanda interrotta. Conservarne i punti come storico ma escluderlo da turni, premi e vittoria. Cancellare inventario ed effetti che lo coinvolgono, inclusi beneficiario e bersaglio di Ruba punti e salti pendenti. Se si prosegue con almeno due attivi, sostituire il quesito interrotto per il successivo gruppo disponibile, senza consumare una delle 33 domande valide; non riproporre la domanda già svelata. Questa è la convenzione operativa del regolamento per gestire il quesito annullato.

Dopo l’intero intervento disciplinare, prima di rispondere, premiare o avanzare, valutare i gruppi attivi: **zero = tutti sconfitti, nessun 10; uno = vincitore immediato con 10**, anche prima delle 33; due o più = prosegue. Se lo stesso intervento conferma sanzioni a più gruppi, completarle tutte prima di dichiarare il vincitore, così l’ultimo superstite temporaneo non vince se viene anch’esso eliminato dall’intervento. Conservare sanzioni, serie e motivi di eliminazione nel salvataggio e nel passaggio allo spareggio. Un rifiuto o la campanella non possono rinviare una terza sanzione confermata.


**SPEC-40 — Quote e punteggi razionali esatti (da implementare; REG-27).** La divisione in parti uguali può essere periodica: lordo 100 con due beneficiari dà 100/3 a ciascuno. Non arrotondare ciascun accredito a 33,33 perdendo 0,01, né assegnare il residuo a un gruppo rompendo l’uguaglianza. Conservare guadagni, quote e totali con numeratore/denominatore ridotti o altra rappresentazione razionale equivalente; somme, confronti finali e parità devono usare i valori esatti, non le stringhe visualizzate. Serializzare nel salvataggio numeratori/denominatori in modo da non perdere precisione e validare denominatori positivi. Eventuali importi approssimati a schermo devono essere riconoscibili come tali e permettere di consultare la quota esatta nell’esito. Eseguire tutti gli accrediti della stessa risposta insieme, prima di determinare vincitore o spareggio. La somma esatta delle quote deve essere uguale al lordo.

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
| ACC-07 | Tre facili corrette nei propri turni, con turni altrui interposti e valori predefiniti | Guadagni 100, 110 e 120, totale 330; nessun blocco a tre e nessun passaggio libero (SPEC-20/35/38) |
| ACC-08 | Richiesta tempestiva di rifiuto annullata | Timer ripreso dal residuo; nessuna variazione di punti; decisione del docente rispettata (SPEC-23) |
| ACC-09 | Disturbo, suggerimento o protesta sanzionabile | +1 sanzione solo al gruppo responsabile; punti invariati e nessun salto disciplinare. Al totale 3 eliminazione (SPEC-22/39) |
| ACC-10 | Dopo 33 valide A=800, B=700, C=600; seconda partita B vince con 1200 | Primo vincitore A, secondo B; premio sempre 10 blu, indipendente dai punti (SPEC-24/25) |
| ACC-11 | Campanella durante una domanda ordinaria o extra già svelata | La domanda prosegue con il tempo residuo; esito registrato prima di sospendere. Nessuna domanda successiva svelata; se l’esito determina il vincitore, riepilogo definitivo (SPEC-30) |
| ACC-12 | Doppio clic, clic alla scadenza, ritorno da scheda in background | Un solo esito e un solo aggiornamento dei punti (SPEC-17) |
| ACC-13 | HTML aperti localmente senza rete; schermo piccolo e tastiera | Risorse/formule disponibili, comandi leggibili e raggiungibili (SPEC-02, SPEC-03) |
| ACC-14 | Confronto di ogni sezione della presentazione con gli ID REG | Nessuna contraddizione e versione dichiarata quando SPEC-27 sarà implementato |
| ACC-15 | Avvio con impostazioni predefinite e risposta nei primi 15 secondi | Timer unico di 45 secondi, risposta accettata subito; nessuna fase «lettura» separata (SPEC-07) |
| ACC-16 | Dopo 33 valide A=800, B=800, C=500 | Spareggio con A e B; C escluso. Errore di A: vince B, premio 10 blu (SPEC-31) |
| ACC-17 | Comunicazione del premio e registrazione | Premio fisso 10 blu ai vincitori; spiegazione della media con compiti/progetti e del voto verde annuale, senza pesi o arrotondamenti inventati (REG-21/22) |
| ACC-18 | Sospendi, esporta, chiudi il browser e importa alla lezione successiva | Stesse squadre, punteggi, rotazione fissa, ordine domande/alternative, salti e stato; nessuna nuova estrazione e nessun timer avviato automaticamente (SPEC-30) |
| ACC-19 | Salvataggio malformato o versione incompatibile | Ripresa bloccata con messaggio utile; partita attiva non sovrascritta (SPEC-30) |
| ACC-20 | Tre gruppi nello spareggio; corretta, errore, ulteriore corretta | Alternanza dei gruppi attivi, nessuna permanenza del turno per la corretta, eliminato escluso; termina solo quando resta un gruppo (SPEC-31) |
| ACC-21 | Esaurimento domande extra con due gruppi ancora attivi | Sospensione per rifornire la riserva; conserva stato e non assegna il premio (SPEC-31) |
| ACC-22 | Sospendi e riprendi durante lo spareggio | Conserva partecipanti, eliminazioni, riserva e turno corrente (SPEC-30/31) |
| ACC-23 | Banca con meno di 33 domande valide iniziali | Avvio regolamentare bloccato; rifiuti o annullamenti successivi possono richiedere riserva senza cambiare il conteggio valido (SPEC-06) |
| ACC-24 | Spareggio: tempo scaduto senza risposta | Il gruppo è eliminato una sola volta; ruota al successivo attivo oppure conclude con l’unico superstite (SPEC-31) |
| ACC-25 | Avvio e successiva ripresa dello spareggio | Ordine sorteggiato solo tra i gruppi ammessi; salvataggio/ripresa conservano lo stesso ordine, senza nuovo sorteggio (SPEC-31) |
| ACC-26 | Pausa durante domanda ordinaria ed extra; attendi, cambia scheda, poi riprendi | Residuo invariato in pausa, alternative bloccate, nessun esito; riprende dal residuo con un solo timer (SPEC-32) |
| ACC-27 | Pausa alla scadenza; doppi clic su pausa/riprendi | Nessun tempo recuperato dopo la scadenza; un solo esito e nessun intervallo duplicato (SPEC-32) |
| ACC-28 | Apri pannello sanzioni con timer in corso o già in pausa | Pausa automatica se attivo; residuo preservato. Chiudere non riavvia il timer e non elimina una pausa precedente (SPEC-32/39) |
| ACC-29 | Domande e spiegazioni più lunghe della banca, formule multilinea, ridimensionamento e schermo intero | Nelle dimensioni supportate tutti i dati e comandi della schermata corrente sono completi e leggibili senza scroll o tagli; configurazione non idonea segnalata prima di iniziare o timer messo in pausa se cambia durante la risposta (SPEC-33) |
| ACC-30 | Campanella prima dello svelamento oppure dopo domanda 33 in pareggio | Salva senza svelare altro; alla ripresa mostra la prossima domanda nascosta oppure l’ingresso nello spareggio (SPEC-30) |
| ACC-31 | Un solo dataset ordinario a quattro alternative | Sufficiente per entrambe le fasi; nessun secondo file o contratto Vero/Falso richiesto (SPEC-13/34) |
| ACC-32 | Gioco normale personalizzato a 60 secondi, poi spareggio | Ogni extra ha quattro alternative e 60 secondi; con impostazioni predefinite ne ha 45. Nessun ritorno a 30 secondi (SPEC-07/31) |
| ACC-33 | Riserva, rifornimento e ripresa dello spareggio | Quesiti mai ripetuti rispetto a quelli svelati in entrambe le fasi; rifornimento nel formato ordinario e stato preservato (SPEC-30/34) |
| ACC-34 | 33 domande senza premi attivati, salti o rifiuti | Rotazione fissa e 11 turni per gruppo; passaggi da premio da verificare separatamente (SPEC-20/37) |
| ACC-35 | Sospensione/ripresa dopo una risposta corretta | Mantiene la rotazione e il prossimo titolare; nessun passaggio libero o conservazione automatica del turno; Svela e passa richiede una copia (SPEC-20/30) |
| ACC-36 | Corrette, turni altrui, poi errore e nuova corretta | Turni altrui conservano la serie, errore azzera; la corretta seguente riparte da ×1,00 (SPEC-35) |
| ACC-37 | Somma di guadagni decimali e confronto finale | Nessun arrotondamento a interi o errore di rappresentazione; premio finale resta 10 blu fisso (SPEC-19/24/35) |
| ACC-38 | Esito corretto, doppio clic, ridisegno e ripresa da salvataggio | Una sola estrazione premio e un solo accredito di punti, senza rigenerare l’esito casuale (SPEC-36) |
| ACC-39 | Uso di Salta turno su un avversario e doppio clic | Un premio consumato, un effetto destinato al prossimo turno del bersaglio; nessun furto di turno o punti. Cumulo e domanda secondo DEC-15 (SPEC-36) |
| ACC-40 | Probabilità 0% e 100%, poi risposta errata o spareggio | 0%: nessun premio; 100%: esattamente un premio a ogni corretta ordinaria. Nessuna vincita per errore/scadenza o nello spareggio (SPEC-36) |
| ACC-41 | Premio vinto, poi attivazione propria o fuori turno | Inventario incrementato senza obbligo; uso fuori turno respinto. Una sola copia per turno; Svela e passa solo a domanda nascosta (SPEC-36/37) |
| ACC-42 | A attiva Ruba punti su B, C gioca prima di B; B risponde alla sua terza corretta facile | Con base 100 lordo 120, quote 60 ciascuno; C non consuma l’effetto; solo serie di B avanza (SPEC-36) |
| ACC-43 | B sbaglia o scade il tempo alla domanda bersaglio | Nessuna quota, serie di B azzerata ed effetto consumato senza rinvio alla futura corretta (SPEC-36) |
| ACC-44 | Salva inventario, attivazione incompleta o ripartizione già eseguita | Ripristina copie, scelta ed effetti senza risorteggi, doppi consumi o accrediti (SPEC-30/36) |
| ACC-45 | Condivisione alla domanda 33 | Entrambi gli accrediti precedono il confronto finale ed eventuale spareggio (SPEC-24/36) |
| ACC-46 | Vincita di più premi, anche uguali, e ripresa da salvataggio | Quantità accumulate esatte e persistenti; nessun uso o bersaglio obbligatorio alla vincita (SPEC-30/36) |
| ACC-47 | Conferma primo premio, poi tenta secondo premio nello stesso turno | Secondo respinto senza consumo; annullare una scelta prima di confermarla non consuma copia/quota (SPEC-36) |
| ACC-48 | Svela e passa e scelta di tenere | Una copia consumata, stessa domanda e alternative, nessun passaggio obbligatorio o domanda aggiuntiva (SPEC-37) |
| ACC-49 | Rotazione A → B → C, A attiva Svela e passa e sceglie C | Scelta a timer fermo; C riceve il tempo intero, stessa domanda e alternative; risposta/serie/premio a C; il prossimo turno è A (SPEC-37) |
| ACC-50 | Salva durante la scelta Svela e passa e riprendi | Domanda e scelta ripristinate senza doppio consumo; conclusione della domanda già svelata alla campanella resta valida (SPEC-30/37) |
| ACC-51 | Ingresso nello spareggio con premi e probabilità di test al 100% | Inventari ed effetti svuotati all’ingresso, nessun uso e nessuna nuova estrazione per corrette (SPEC-31/36) |
| ACC-52 | Domande ordinarie ed extra dalla stessa banca | Quattro alternative in entrambe le fasi, risposta corretta preservata dopo il mescolamento e nessun quesito già svelato ripetuto (SPEC-31/34) |
| ACC-53 | Probabilità vuota, non numerica, infinita o fuori 0–100 | Configurazione rifiutata con messaggio chiaro; nessun valore inventato o coercizione silenziosa (SPEC-36) |
| ACC-54 | Estrazione con generatore casuale controllato | Verifica separata della probabilità di vincita e della scelta uniforme tra i tre tipi; ogni ramo assegna una sola copia. Nessun test statistico instabile usato come unica verifica (SPEC-36) |
| ACC-55 | Salva e riprendi con probabilità personalizzata | Stesso parametro e stessi esiti già sorteggiati, senza ripetizioni o ritorno a un valore predefinito (SPEC-30/36) |
| ACC-56 | Prima corretta con valori predefiniti e serie iniziale zero | Facile 100, media 200, difficile 300: moltiplicatore ×1,00. Seconda corretta ×1,10 (SPEC-35/38) |
| ACC-57 | Tabella personalizzata 150/250/400 e salvataggio/ripresa | Guadagni calcolati sui valori personalizzati; tabella persistente senza ritorno ai predefiniti (SPEC-30/38) |
| ACC-58 | Input punteggio non valido | Configurazione bloccata con messaggio utile; nessuna sostituzione silenziosa con +1 o predefiniti (SPEC-38) |
| ACC-59 | Prima e seconda sanzione con serie di corrette attiva | Contatore 1 poi 2, punti invariati e nessun salto; ogni sanzione azzera la serie (SPEC-22/35/39) |
| ACC-60 | Terza sanzione a un gruppo con il punteggio più alto | Gruppo eliminato, punteggio storico invariato e impossibilità di vincere o agire tramite premi; prossimi turni lo escludono (SPEC-39) |
| ACC-61 | Due sanzioni, sospensione/ripresa, ingresso nello spareggio e terza sanzione | Contatore conserva 2, poi arriva a 3 ed elimina; nessuna sottrazione di punti o reset tra fasi (SPEC-30/39) |
| ACC-62 | Doppio clic o ripresa dopo conferma sanzione | Un solo evento disciplinare; nessun incremento o eliminazione duplicata (SPEC-39) |
| ACC-63 | Errore ordinario, scadenza ordinaria, premio Salta turno | Nessuno dei tre eventi incrementa da solo il contatore sanzioni (SPEC-39) |
| ACC-64 | Gruppo eliminato coinvolto in effetti e tentativo di nuovo uso/bersaglio | Inventario ed effetti coinvolti cancellati; nuove operazioni respinte senza consumo di copie altrui (SPEC-36/39) |
| ACC-65 | Cinque corrette consecutive facili, base 100 | Guadagni 100, 110, 120, 130, 140; serie non bloccata a tre né moltiplicatore limitato (SPEC-35) |
| ACC-66 | Rifiuto accettato e turno saltato con serie attiva | Serie invariata; rifiuto sostituito allo stesso gruppo senza avanzare l’indice valido; salto conserva la stessa domanda per il successivo (SPEC-23/35/36) |
| ACC-67 | Due o più Salta turno sullo stesso gruppo, ottenuti con attivazioni lecite | Effetti sommati; perde altrettante occasioni, una per volta; nessuna domanda consumata e serie invariata (SPEC-36) |
| ACC-68 | A ha già Ruba punti su B e C ne attiva un secondo nel proprio turno | Attivazione di C accettata e copia consumata una volta; lordo 240 di B diviso in 80 per A, B e C (SPEC-36) |
| ACC-69 | Ruba punti attivo e B salta o ottiene un rifiuto accettato | Effetto conservato fino alla prossima risposta/scadenza valida di B (SPEC-36) |
| ACC-70 | Svela e passa: attesa nella scelta, poi tiene o passa | Timer e risposte fermi durante scelta; alla conferma parte il tempo intero e copia resta consumata (SPEC-37) |
| ACC-71 | Destinatario tenta premio o contro-passaggio dopo Svela e passa | Quota della domanda già usata: operazione respinta senza consumo. Rotazione successiva dal destinatario rispondente (SPEC-36/37) |
| ACC-72 | Terza sanzione al rispondente mentre risposta/scadenza è pendente | Sanzione prioritaria: eliminazione, nessun punto/esito/premio da quella domanda; sostituzione per il successivo se partita prosegue (SPEC-39) |
| ACC-73 | Intervento lascia uno o zero gruppi attivi prima delle 33 | Uno: vittoria immediata e 10 blu; zero: tutti sconfitti, nessun 10. Verifica dopo l’intervento disciplinare completo (SPEC-24/39) |
| ACC-74 | A e C beneficiari su B, poi A viene eliminato | Effetto A→B cancellato; C→B conservato. Alla corretta di B, lordo diviso solo tra B e C. Se B è eliminato, spariscono entrambi gli effetti (SPEC-36/39) |
| ACC-75 | Due beneficiari distinti sullo stesso bersaglio, lordo 100 | Tre quote esatte da 100/3; somma esatta 100 e nessun centesimo assegnato arbitrariamente. Classifica e salvataggio usano valori razionali (SPEC-40) |
| ACC-76 | Più copie dello stesso beneficiario sullo stesso bersaglio | Una sola quota per gruppo distinto; nessuna moltiplicazione del guadagno tramite copie duplicate (SPEC-36/40) |
| ACC-77 | Rifiuto/salto o errore del bersaglio con due effetti attivi | Rifiuto/salto conserva entrambi; errore/scadenza li consuma entrambi senza quote. Ripresa non duplica effetti o accrediti (SPEC-36) |

## 9. Passi successivi

Le decisioni DEC-01–DEC-19 sono risolte o superate dal regolamento 14.0.0; non continuare a usare le precedenti righe «da decidere» come blocchi per implementare quanto approvato. I dettagli tecnici reversibili vanno scelti in coerenza con i requisiti e verificati.

1. Adeguare il motore del gioco: punteggi base configurabili, serie da seconda corretta senza tetto, rotazione dal rispondente, rifiuti sostituiti e salti cumulabili senza consumo domanda.
2. Implementare un premio per turno, inventario, tre premi equiprobabili con p configurabile, Ruba punti simultanei con divisione in parti uguali per gruppi distinti e cancellazioni su eliminazione/ingresso spareggio.
3. Implementare pannello sanzioni con pausa automatica e precedenza disciplinare, azzeramento serie, terza sanzione eliminatoria, vittoria anticipata e sconfitta di tutti.
4. Integrare salvataggio/ripresa, layout verificato senza scorrimento e presentazione allineata alla stessa versione. Il default di p non è stato scelto: il programma può richiedere un valore prima dell’avvio.
5. Eseguire gli scenari pertinenti alla logica e i controlli visuali; le tabelle di questa edizione sono specifiche di verifica, non risultati di test già eseguiti.

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
| 13.0.0 | 21/10/2026 | Decisioni premi/turni consolidate, moltiplicatore corretto da seconda risposta senza tetto, sanzioni prioritarie e pausa automatica, rifiuti sostituiti e cancellazioni effetti |
| 14.0.0 | 21/10/2026 | Ruba punti simultanei e quote uguali per gruppi distinti; calcolo razionale esatto, gestione duplicati ed eliminazione selettiva dei beneficiari |
