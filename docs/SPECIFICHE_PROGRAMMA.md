# Chi vuol essere rimandato — Specifiche del programma

Versione: **4.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Regolamento di riferimento: [REGOLAMENTO_UFFICIALE.md, v4.0.0](REGOLAMENTO_UFFICIALE.md).

## 1. Scopo e gerarchia

Questo documento raccoglie le specifiche funzionali, i vincoli tecnici e i criteri di accettazione del quiz HTML. Il regolamento definisce le regole; questo documento definisce come applicarle. La presentazione HTML è una spiegazione per la classe. In caso di contrasto prevale il regolamento; per le questioni aperte non si inventano soluzioni normative.

L'analisi iniziale è stata eseguita sul commit `4b7f285cfc4bec5507bed559ada3efa479b29e95`, leggendo il programma `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`, il regolamento HTML v9, il template e il prompt dataset v1. È una verifica del sorgente, non una certificazione funzionale in browser.

Stati dei requisiti: **presente** = riscontrato nel sorgente; **da implementare** = requisito per una futura modifica; **da decidere** = dipende da una questione DEC del regolamento. Le presenti modifiche sono documentali e non aggiornano gli HTML. **Il programma v3 e la presentazione v9 non sono conformi al regolamento 4.0.0**: vanno adeguati errore/scadenza, timer, conclusione, sospensione/ripresa, spareggio, premio finale, pausa manuale e disposizione della schermata in altezza. La lettura del sorgente non equivale a una verifica in browser.

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
| SPEC-07 | Timer unico, predefinito 45 secondi; risposta consentita immediatamente. Nessun conteggio separato, blocco iniziale o messaggio ai giocatori «15+30». Mantenere la personalizzazione intera 1–600 secondi e comunicare il valore effettivo prima della partita | Da adeguare: oggi predefinito 30; timer unico già presente |
| SPEC-08 | Selezione degli argomenti e quote intere non negative; somma uguale al totale e quota non superiore alla disponibilità; ribilanciamento delle quote | Presente |
| SPEC-09 | Estrazione casuale senza ripetizioni di ID nella partita, nel rispetto delle quote; mescolamento di domande e alternative conservando la risposta corretta | Presente |
| SPEC-10 | Anteprima docente con domande, alternative, soluzione e spiegazione; sostituzione singola con domanda inutilizzata dello stesso argomento e difficoltà; messaggio se non disponibile | Presente |
| SPEC-11 | L'anteprima è riservata all'uso del docente prima della proiezione; non va mostrata alla classe. L'app locale non offre autenticazione o schermate private | Vincolo operativo |
| SPEC-12 | Filtro di difficoltà facile/media/difficile/misto, con disponibilità e quote ricalcolate prima di estrarre | Da implementare: oggi la difficoltà è usata nella sostituzione, manca il selettore |

Non si confondono le 100 domande per argomento della banca con le 33 estratte per una partita. Le percentuali di difficoltà e tipologia indicate nel prompt riguardano la generazione della banca e non sono garantite nell'estrazione attuale.

## 4. Contratto del dataset

**SPEC-13 — Formato compatibile (presente).** JSON UTF-8, con eventuale BOM rimosso dal lettore; `versione` numerico uguale a `1`; array `argomenti` non vuoto. Dimensione massima accettata dall'app: 20 × 1024 × 1024 byte. Un dataset non valido non deve avviare la partita.

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
| Anteprima | Inizia partita | Azzera punteggi, serie e salti; sorteggia titolare e mostra domanda nascosta |
| Domanda nascosta | Passa | Testo ancora nascosto; cambia titolare, applica eventuali salti |
| Domanda nascosta | Svela | Mostra domanda e alternative; avvia timer, salvo passaggio obbligatorio |
| Risposta a tempo | Seleziona alternativa prima della scadenza | Un solo esito; +1 se corretta, 0 se errata; blocco delle alternative (da adeguare) |
| Risposta ordinaria a tempo | Scadenza | Un solo esito a 0 punti, anche se la scheda era in background (da adeguare) |
| Risposta ordinaria o spareggio | Pausa | Memorizza il residuo effettivo, ferma timer, disabilita risposte; mostra stato in pausa |
| Pausa manuale | Riprendi | Riprende il tempo residuo e riabilita le risposte, senza azzerare il timer |
| Risposta a tempo | Chiedi rifiuto | Pausa del timer e decisione docente |
| Valutazione rifiuto | Annulla / nega | Riprende il tempo residuo senza ripartire da zero |
| Valutazione rifiuto | Accetta | Scarta la domanda; passa alla successiva secondo DEC-03 |
| Esito | Prossima | Avanza una volta; conserva titolare dopo corretta o ruota dopo errore/scadenza |
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
| SPEC-19 | Punteggi interi anche negativi; corretta +1, errore/scadenza 0; sottrazioni solo per sanzioni; nessuna eliminazione nella fase ordinaria. Errore/scadenza interrompono la serie e fanno ruotare il turno | REG-07, REG-09, REG-10 | Da adeguare: oggi errore/scadenza sottraggono 1 |
| SPEC-20 | Dopo la terza corretta consecutiva disabilitare lo svelamento finché il gruppo non passa | REG-08 | Presente; azzeramenti da chiarire in DEC-02 |
| SPEC-21 | Tabellone con titolare, punteggi, serie e salti; eliminare badge e stato permanente «10 blu raggiunto» | REG-02, REG-08, REG-15, REG-21 | Da adeguare: oggi mostra la vecchia qualifica a soglia |
| SPEC-22 | Sanzione scelta dal docente per uno specifico gruppo: disturbo −1; suggerimenti/proteste sanzionabili −1 e salto | REG-11–REG-16 | Presente; casi limite DEC-04–DEC-06 |
| SPEC-23 | Rifiuto con soli due motivi ammessi; decisione docente; nessun rifiuto dopo risposta o scadenza | REG-17–REG-19 | Presente; la tempestività è valutata dal docente, non dal solo stato del pulsante |
| SPEC-24 | Confrontare i punti solo al termine delle 33 domande; massimo unico vincente, parità al massimo avvia REG-23. Assegnare il premio fisso 10 blu ai membri del gruppo vincitore, indipendentemente dal punteggio; rimuovere la vecchia qualifica permanente a soglia | REG-20, REG-21, REG-23 | Da implementare |
| SPEC-25 | Riepilogo definitivo con punteggi ordinari, esito dello spareggio se presente, vincitore e premio «10 blu». Spiegare il contributo alla media delle attività fuori verifica e al voto verde di fine anno; nessuna conversione punti/voto, nessuna scrittura automatica su ClasseViva né calcolo della valutazione annuale | REG-20–REG-23 | Da adeguare |

Il registro eventi attuale conserva al massimo otto messaggi in memoria e ne mostra quattro. Il programma attuale non ripristina una partita dopo il caricamento della pagina: **salvataggio e ripresa sono ora requisiti necessari, ancora da implementare** (SPEC-30). L'annullamento dell'ultima operazione resta una possibile miglioria separata.

**SPEC-30 — Sospensione e ripresa (da implementare; REG-20).** Sostituire la conclusione «fine modulo» con una sospensione. Conservare versione del regolamento e formato del salvataggio, identificativo della partita, composizione delle squadre (nomi e membri ove registrati), ordine di rotazione, titolare, punteggi, serie, salti, indice e stato della domanda, contatori di risposte/rifiuti, tempo residuo e impostazioni. Salvare anche domande estratte, ordine delle alternative e risposte corrette, banca o riserva necessaria, ID già utilizzati e, nello spareggio, partecipanti, eliminati e ordine dei turni. Nessuna assegnazione del premio alla campanella. Non richiedere nominativi degli studenti per il solo funzionamento: il docente può garantire la stessa composizione usando i nomi delle squadre.

Il salvataggio deve sopravvivere alla chiusura del browser e consentire esportazione/importazione di un file locale versionato; l'autosalvataggio locale è complementare, non l'unico mezzo di ripresa. Validare integralmente un salvataggio prima di sostituire la partita attiva; un file non valido o incompatibile deve lasciare intatta la partita. Riprendere con timer fermo fino al comando del docente, senza applicare come tempo trascorso l'intervallo fra le lezioni. Per la sospensione dovuta alla campanella, una domanda già svelata va conclusa nella lezione in corso (REG-20): usare un flag «sospendi dopo questa domanda», impedire lo svelamento successivo e salvare dopo aver registrato l’esito. Se quell’esito determina il vincitore, mostrare il riepilogo definitivo. Se la domanda 33 produce un pareggio, salvare lo spareggio ancora da iniziare senza svelare una domanda extra. Un eventuale salvataggio tecnico di emergenza non deve essere presentato come il normale rinvio di una domanda già svelata alla campanella. Il file di partita contiene soluzioni ed è destinato al docente.

**SPEC-31 — «Chi vuol essere eliminato» (da implementare; REG-23).** Attivare una fase distinta alla parità al primo posto dopo le 33 domande. Ammettere soltanto i gruppi con il punteggio massimo; usare domande extra e mostrare turno e gruppi ancora in gioco. Ogni risposta corretta fa avanzare al successivo gruppo attivo; ogni risposta sbagliata o scadenza del tempo elimina il gruppo. Quando ne resta uno, termina lo spareggio e assegna a quel gruppo il premio fisso. Conservare separati punteggi ordinari ed eliminazioni; niente passaggio volontario o mantenimento della domanda dopo una risposta corretta. All’ingresso nello spareggio sorteggiare una permutazione dei soli gruppi ammessi, mostrarla al docente e usarla come rotazione, saltando gli eliminati. Conservare il sorteggio nel salvataggio e non ripeterlo a ogni giro o alla ripresa. Le sole casistiche disciplinari e di rifiuto ancora aperte seguono DEC-11.

Usare domande extra non già svelate e compatibili con gli argomenti selezionati. Poiché il numero di extra non è limitabile a priori (tutti possono continuare a rispondere bene), prevedere un rifornimento validato della riserva senza azzerare lo spareggio. Se le domande finiscono, sospendere e chiedere al docente altre domande: non ripetere silenziosamente quesiti e non dichiarare un vincitore per esaurimento della banca.


**SPEC-32 — Pulsante Pausa/Riprendi (da implementare; REG-24).** Comando del docente sempre raggiungibile durante una domanda ordinaria o extra. Alla pressione, verificare prima la scadenza effettiva: se il tempo è già scaduto, applicare l’esito della fase e non consentire di recuperare tempo tramite la pausa. Altrimenti memorizzare il residuo con precisione, fermare i tick e passare allo stato di pausa. Mostrare «In pausa» e il pulsante «Riprendi», disabilitare le alternative e l’avanzamento; nessun esito o variazione di punteggio per il solo trascorrere del tempo in pausa. Alla ripresa ricostruire la scadenza dal residuo, mantenendo domanda, ordine alternative, titolare e fase. Ripetuti clic non devono creare più timer. Lo stato resta fermo anche se si cambia scheda o si apre/chiude un dialogo; chiudere un dialogo non deve annullare una pausa manuale. I comandi sanzione restano utilizzabili durante la pausa. Non introdurre una pausa automatica all’apertura del dialogo sanzioni senza una decisione separata (DEC-06).

**SPEC-33 — Schermata di gioco interamente nel viewport (da implementare).** Nelle schermate operative di domanda nascosta, risposta, pausa ed esito, tutte le informazioni della schermata corrente e i comandi devono essere visibili contemporaneamente senza scorrimento verticale o orizzontale, né della pagina né di pannelli interni. Includere turno, contatore/fase, domanda e quattro alternative quando svelate, timer, Pausa/Riprendi, tabellone, rifiuto e comandi pertinenti; nell’esito includere soluzione, spiegazione disponibile e avanzamento. Non mostrare una soluzione durante la risposta per soddisfare il requisito di completezza. Ricalcolare il layout al ridimensionamento, al cambio orientamento e all’ingresso/uscita dallo schermo intero, usando l’altezza effettivamente disponibile nel browser.

Adattare disposizione di tabellone e contenuto, spaziature e dimensione dei testi al contenuto reale, comprese le formule dopo il rendering. Non soddisfare il requisito tramite `overflow:hidden`, troncamento, contenuti fuori schermo o testo ridotto fino a diventare illeggibile. Anche i dialoghi pausa/rifiuto/sanzione devono rendere raggiungibili tutti i relativi comandi. Copertina, configurazione e anteprima della banca possono scorrere: il requisito riguarda la schermata operativa del quiz.

La specifica di assenza di scorrimento richiede dimensioni minime di schermo e limiti di lunghezza del contenuto: con testi arbitrariamente lunghi e schermi arbitrariamente piccoli non si possono garantire contemporaneamente testo completo, leggibilità e assenza di scorrimento. In implementazione definire e dichiarare una matrice di dimensioni supportate e una soglia minima di leggibilità, da verificare con il docente. Prima della partita verificare tutte le domande estratte e le spiegazioni, e verificare le nuove domande extra prima di svelarle. Se una schermata non entra con testo leggibile, segnalarlo prima dello svelamento (o mettere in pausa in caso di ridimensionamento durante la risposta) e richiedere una correzione di contenuto o dimensioni disponibili, senza avviare un timer con informazioni nascoste. Non presentare un adattamento grafico come verificato finché non sono stati eseguiti i controlli visuali.


## 7. Coerenza fra documenti, programma e presentazione

**SPEC-26 — Gerarchia e manutenzione (procedura da applicare da questa edizione).** Prima di modificare le regole leggere il regolamento; prima di modificare il gioco leggere anche queste specifiche. Le scelte DEC vanno risolte dal responsabile, non dal codice. Ogni modifica deve indicare gli ID interessati e aggiornare versione, data e cronologia.

**SPEC-27 — Tracciabilità della presentazione (da implementare).** Ogni sezione HTML deve essere collegata agli ID REG pertinenti e mostrare la versione del regolamento. Le semplificazioni del linguaggio per la classe devono conservare condizioni, conseguenze ed eccezioni. L'attuale v9 non dichiara la versione di questo documento né descrive tutte le convenzioni operative.

**SPEC-28 — Dati comuni (miglioramento proposto, non implementato).** In una futura implementazione spostare parametri condivisi — gruppi, domande ordinarie, timer unico ordinario, punteggi, premio fisso e limite serie — in una configurazione strutturata validata. Il programma e la presentazione devono incorporare gli stessi valori e la stessa versione durante la generazione degli HTML, così da mantenere l'uso offline. Non aggiungere un caricamento di rete obbligatorio. Il regolamento resta la fonte semantica: un JSON di numeri non sostituisce le condizioni espresse nel testo.

**SPEC-29 — Controlli prima di distribuire (da implementare).** Affiancare controlli automatici per punteggi, transizioni, dataset e valori condivisi a una verifica visiva della presentazione. Un controllo dei soli numeri non prova che un testo spieghi correttamente tutte le regole.

## 8. Criteri di accettazione

Questa è una lista di scenari da usare per le implementazioni successive; non dichiara test già eseguiti. Gli scenari legati a DEC si completano dopo la decisione pertinente.

| ID | Scenario | Risultato atteso |
| --- | --- | --- |
| ACC-01 | Avvio con tre nomi e dataset validi | Tre gruppi a zero; un titolare sorteggiato; domanda nascosta (SPEC-04, SPEC-18) |
| ACC-02 | JSON malformato, ID duplicati, tre alternative o LaTeX non valido | Messaggio utile e avvio bloccato (SPEC-05, SPEC-13, SPEC-14) |
| ACC-03 | Quote insufficienti, somma errata o timer fuori intervallo | Preparazione bloccata senza partita parziale (SPEC-06–SPEC-09) |
| ACC-04 | Estrazione e sostituzione in anteprima | Quote rispettate, nessun ID duplicato; sostituzione stesso argomento/difficoltà o messaggio di indisponibilità (SPEC-09, SPEC-10) |
| ACC-05 | Risposta corretta dopo mescolamento delle alternative | +1 una sola volta, soluzione coerente, prossima domanda al titolare (SPEC-09, SPEC-17, SPEC-19) |
| ACC-06 | Errore o nessuna risposta | Punteggio invariato, serie interrotta e prossima domanda al successivo disponibile; nessuna penalità automatica (SPEC-19) |
| ACC-07 | Terza corretta consecutiva con altre domande disponibili | Svelamento bloccato e scelta di un altro gruppo (SPEC-20) |
| ACC-08 | Richiesta tempestiva di rifiuto annullata | Timer ripreso dal residuo; nessuna variazione di punti; decisione del docente rispettata (SPEC-23) |
| ACC-09 | Disturbo, suggerimento o protesta sanzionabile | Penalità al gruppo selezionato, indipendente dall'esito altrui; salto secondo DEC-04/05 (SPEC-22) |
| ACC-10 | Dopo 33 domande A=8, B=7, C=6; in una seconda partita B vince con 12 | Prima partita: vince A e il premio è 10 blu. Seconda: vince B e il premio è ancora 10 blu; nessuna conversione dei punti (SPEC-24/25) |
| ACC-11 | Campanella durante una domanda ordinaria o extra già svelata | La domanda prosegue con il tempo residuo; esito registrato prima di sospendere. Nessuna domanda successiva svelata; se l’esito determina il vincitore, riepilogo definitivo (SPEC-30) |
| ACC-12 | Doppio clic, clic alla scadenza, ritorno da scheda in background | Un solo esito e un solo aggiornamento dei punti (SPEC-17) |
| ACC-13 | HTML aperti localmente senza rete; schermo piccolo e tastiera | Risorse/formule disponibili, comandi leggibili e raggiungibili (SPEC-02, SPEC-03) |
| ACC-14 | Confronto di ogni sezione della presentazione con gli ID REG | Nessuna contraddizione e versione dichiarata quando SPEC-27 sarà implementato |
| ACC-15 | Avvio con impostazioni predefinite e risposta nei primi 15 secondi | Timer unico di 45 secondi, risposta accettata subito; nessuna fase «lettura» separata (SPEC-07) |
| ACC-16 | Dopo 33 domande A=8, B=8, C=5 | Avvia «Chi vuol essere eliminato» con A e B; C non partecipa. Risposta sbagliata di A: A eliminato, vince B, premio 10 blu (SPEC-31) |
| ACC-17 | Comunicazione del premio e registrazione | Premio fisso 10 blu ai vincitori; spiegazione della media con compiti/progetti e del voto verde annuale, senza pesi o arrotondamenti inventati (REG-21/22) |
| ACC-18 | Sospendi, esporta, chiudi il browser e importa alla lezione successiva | Stesse squadre, punteggi, ordine domande/alternative, salti, serie e stato; nessuna nuova estrazione e nessun timer avviato automaticamente (SPEC-30) |
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

## 9. Passi successivi proposti

1. Risolvere i casi ancora aperti DEC-01–DEC-05, l’automatismo residuo in DEC-06 e le casistiche residue in DEC-11. DEC-07–DEC-10 e DEC-12 sono risolte; la scadenza eliminatoria in DEC-11 è definita.
2. Adeguare programma e presentazione: 33 domande, errore/scadenza ordinari a 0, timer unico 45 secondi, sospensione/ripresa dopo aver concluso la domanda svelata, spareggio con ordine casuale e scadenza eliminatoria, 10 blu fisso, Pausa/Riprendi e layout in altezza senza scorrimento. Introdurre versione e riferimenti REG.
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
