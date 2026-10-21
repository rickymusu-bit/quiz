# Chi vuol essere rimandato — Specifiche del programma

Versione: **2.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Regolamento di riferimento: [REGOLAMENTO_UFFICIALE.md, v2.0.0](REGOLAMENTO_UFFICIALE.md).

## 1. Scopo e gerarchia

Questo documento raccoglie le specifiche funzionali, i vincoli tecnici e i criteri di accettazione del quiz HTML. Il regolamento definisce le regole; questo documento definisce come applicarle. La presentazione HTML è una spiegazione per la classe. In caso di contrasto prevale il regolamento; per le questioni aperte non si inventano soluzioni normative.

L'analisi iniziale è stata eseguita sul commit `4b7f285cfc4bec5507bed559ada3efa479b29e95`, leggendo il programma `Chi_vuol_essere_rimandato_quiz_v3_20261008.html`, il regolamento HTML v9, il template e il prompt dataset v1. È una verifica del sorgente, non una certificazione funzionale in browser.

Stati dei requisiti: **presente** = riscontrato nel sorgente; **da implementare** = requisito per una futura modifica; **da decidere** = dipende da una questione DEC del regolamento. Le presenti modifiche sono documentali e non aggiornano gli HTML. **Il programma v3 e la presentazione v9 non sono conformi al regolamento 2.0.0** per errore/scadenza, timer predefinito e premio finale. Le descrizioni del comportamento esistente non autorizzano a usare le vecchie regole per una sessione 2.0.0.

## 2. Utenti e distribuzione

- **SPEC-01 — Conduzione (presente).** Un docente conduce il gioco su un dispositivo, eventualmente proiettato. Non è un'applicazione multiplayer con accessi separati. Il docente registra nell'interfaccia la risposta comunicata dal portavoce.
- **SPEC-02 — Uso locale (presente).** Il gioco è un HTML autonomo apribile nel browser senza installazione. Dataset JSON esterno selezionato dall'utente; formule, font e risorse già inclusi devono funzionare anche offline. Non richiede account, server o accesso al registro.
- **SPEC-03 — Interfaccia (presente).** Copertina con logo e avvio, configurazione, anteprima docente, domanda nascosta, risposta a tempo, esito e riepilogo. Testi leggibili in proiezione, layout adattabile, focus visibile, comandi utilizzabili da tastiera e schermo intero con messaggio alternativo se non disponibile. Correttezza ed errore sono indicati anche dal testo, oltre al colore.

## 3. Configurazione e anteprima

| ID | Requisito | Stato |
| --- | --- | --- |
| SPEC-04 | Tre nomi di gruppo distinti senza distinzione fra maiuscole e minuscole; nomi vuoti sostituiti da nomi predefiniti | Presente |
| SPEC-05 | Caricamento e validazione del JSON prima dell'estrazione; un nuovo caricamento invalida quello precedente | Presente |
| SPEC-06 | Numero intero di domande da 1 a 33; al caricamento propone il minimo fra 33 e disponibilità. La partita ordinaria è di 33 | Presente |
| SPEC-07 | Timer totale intero da 1 a 600 secondi, predefinito 45: 15 per lettura + 30 per risposta; comunicarne le variazioni prima della partita (REG-03). Fasi e blocco risposta dipendono da DEC-09 | Da adeguare: oggi predefinito 30; controllo intervallo presente |
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
| Risposta a tempo | Scadenza | Un solo esito a 0 punti, anche se la scheda era in background (da adeguare) |
| Risposta a tempo | Chiedi rifiuto | Pausa del timer e decisione docente |
| Valutazione rifiuto | Annulla / nega | Riprende il tempo residuo senza ripartire da zero |
| Valutazione rifiuto | Accetta | Scarta la domanda; passa alla successiva secondo DEC-03 |
| Esito | Prossima | Avanza una volta; conserva titolare dopo corretta o ruota dopo errore/scadenza |
| Partita in corso | Fine modulo confermata | Riepilogo finale e arresto del timer |
| Ultima domanda conclusa o rifiutata | Prosegui / rifiuto accettato | Riepilogo finale |
| Riepilogo | Nuova partita | Configurazione; i dati della partita successiva vengono azzerati all'avvio |

**SPEC-17 — Integrità delle transizioni (presente, da verificare con scenari).** Nessuna risposta doppia, punteggio doppio o avanzamento doppio. Un clic alla scadenza o dopo la scadenza equivale a tempo scaduto; il riferimento è la scadenza temporale effettiva, non il numero arrotondato mostrato dal timer.

**SPEC-18 — Domande nascoste (presente).** Nessun testo o alternativa visibile nella schermata di scelta; nessun cambio di ordine delle alternative durante la stessa domanda. Dopo l'esito mostra risposta corretta e spiegazione, se presente.

## 6. Punteggi, sanzioni e conclusione

| ID | Requisito | Regole | Stato |
| --- | --- | --- | --- |
| SPEC-19 | Punteggi interi anche negativi; corretta +1, errore/scadenza 0; sottrazioni solo per sanzioni; nessuna eliminazione. Errore/scadenza interrompono la serie e fanno ruotare il turno | REG-07, REG-09, REG-10 | Da adeguare: oggi errore/scadenza sottraggono 1 |
| SPEC-20 | Dopo la terza corretta consecutiva disabilitare lo svelamento finché il gruppo non passa | REG-08 | Presente; azzeramenti da chiarire in DEC-02 |
| SPEC-21 | Tabellone con titolare, punteggi, serie e salti; eliminare badge e stato permanente «10 blu raggiunto» | REG-02, REG-08, REG-15, REG-21 | Da adeguare: oggi mostra la vecchia qualifica a soglia |
| SPEC-22 | Sanzione scelta dal docente per uno specifico gruppo: disturbo −1; suggerimenti/proteste sanzionabili −1 e salto | REG-11–REG-16 | Presente; casi limite DEC-04–DEC-06 |
| SPEC-23 | Rifiuto con soli due motivi ammessi; decisione docente; nessun rifiuto dopo risposta o scadenza | REG-17–REG-19 | Presente; la tempestività è valutata dal docente, non dal solo stato del pulsante |
| SPEC-24 | Alla conclusione confrontare i punteggi finali e indicare il gruppo con il massimo; proporre facoltativamente il medesimo punteggio come voto blu. Nessuna qualifica permanente a 10; punteggi persi per sanzioni incidono sul risultato finale. Parità e punteggi fuori scala secondo DEC-07/08, senza soluzioni automatiche implicite | REG-20, REG-21 | Da implementare: il programma attuale usa il premio a soglia |
| SPEC-25 | Riepilogo con punteggi finali, vincitore e voto blu proposto facoltativamente; segnalare parità o punteggio fuori scala come casi da decidere. Includere numero di domande con risposta/scadenza e rifiuti; nessuna scrittura automatica su ClasseViva | REG-20–REG-22 | Da adeguare: oggi elenca i gruppi qualificati con la vecchia soglia |

Il registro eventi attuale conserva al massimo otto messaggi in memoria e ne mostra quattro. Il caricamento della pagina non ripristina una partita precedente. Salvataggio, ripresa dopo chiusura e annullamento di un'operazione non sono implementati né promessi da questa versione.

## 7. Coerenza fra documenti, programma e presentazione

**SPEC-26 — Gerarchia e manutenzione (procedura da applicare da questa edizione).** Prima di modificare le regole leggere il regolamento; prima di modificare il gioco leggere anche queste specifiche. Le scelte DEC vanno risolte dal responsabile, non dal codice. Ogni modifica deve indicare gli ID interessati e aggiornare versione, data e cronologia.

**SPEC-27 — Tracciabilità della presentazione (da implementare).** Ogni sezione HTML deve essere collegata agli ID REG pertinenti e mostrare la versione del regolamento. Le semplificazioni del linguaggio per la classe devono conservare condizioni, conseguenze ed eccezioni. L'attuale v9 non dichiara la versione di questo documento né descrive tutte le convenzioni operative.

**SPEC-28 — Dati comuni (miglioramento proposto, non implementato).** In una futura implementazione spostare parametri condivisi — gruppi, domande ordinarie, timer ordinario e sua ripartizione, punteggi e limite serie — in una configurazione strutturata validata. Il programma e la presentazione devono incorporare gli stessi valori e la stessa versione durante la generazione degli HTML, così da mantenere l'uso offline. Non aggiungere un caricamento di rete obbligatorio. Il regolamento resta la fonte semantica: un JSON di numeri non sostituisce le condizioni espresse nel testo.

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
| ACC-10 | Risultati finali A=8, B=7, C=6; in una seconda sessione A passa da 10 a 8 per sanzioni e B termina a 9 | Prima sessione: vince A, voto proposto facoltativamente 8. Seconda: vince B, voto proposto 9; nessun premio permanente per A (SPEC-24) |
| ACC-11 | Fine modulo durante risposta oppure ultima domanda rifiutata | Timer fermo, riepilogo coerente; gestione domanda in corso secondo DEC-06 (SPEC-25) |
| ACC-12 | Doppio clic, clic alla scadenza, ritorno da scheda in background | Un solo esito e un solo aggiornamento dei punti (SPEC-17) |
| ACC-13 | HTML aperti localmente senza rete; schermo piccolo e tastiera | Risorse/formule disponibili, comandi leggibili e raggiungibili (SPEC-02, SPEC-03) |
| ACC-14 | Confronto di ogni sezione della presentazione con gli ID REG | Nessuna contraddizione e versione dichiarata quando SPEC-27 sarà implementato |
| ACC-15 | Avvio con impostazioni predefinite | Tempo totale 45 secondi dallo svelamento, ripartizione dichiarata 15+30; verifica del blocco iniziale dopo DEC-09 (SPEC-07) |
| ACC-16 | Parità al primo posto oppure massimo superiore a 10, nullo o negativo | Segnalazione del caso aperto; nessuno spareggio, arrotondamento o tetto automatico non deliberato (SPEC-24, SPEC-25) |
| ACC-17 | Gruppo vincitore non accetta il voto proposto | Nessuna attribuzione automatica; la vittoria resta tale. Modalità della scelta secondo DEC-08 (REG-21, REG-22) |

## 9. Passi successivi proposti

1. Risolvere DEC-01–DEC-09 con il responsabile, inclusi pareggi, punteggi fuori scala, scelta del voto e fasi del timer.
2. Adeguare programma e presentazione al regolamento 2.0.0: errore/scadenza 0, timer 45 secondi e premio al vincitore per punteggio finale. Introdurre versione e riferimenti REG.
3. Introdurre configurazione condivisa e schema del dataset solo con una migrazione esplicita; conservare gli HTML autonomi.
4. Automatizzare gli scenari fondamentali prima di cambiare la logica del gioco. Valutare separatamente ripresa della partita e annullamento dell'ultima operazione del docente.

## 10. Versioni

Si mantengono percorsi stabili, versione interna e cronologia Git. Aggiornare qui la versione del regolamento di riferimento quando cambia. Non modificare gli hash di `PROVENIENZA.json`: descrivono i file originariamente trasferiti, non quelli creati in seguito.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Inventario iniziale, requisiti tracciabili, lacune e criteri di accettazione |
| 2.0.0 | 21/10/2026 | Allineamento dei requisiti e degli scenari al regolamento 2.0.0; vecchi HTML esplicitamente da adeguare |
