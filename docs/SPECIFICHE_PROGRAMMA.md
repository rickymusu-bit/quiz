# Fool — Specifiche del programma

> **Aggiornamento responsive — interfaccia 1.2.0, grafica 1.3.0.** Il responsabile richiede Doom 1993, logo ufficiale allegato, sottotitolo «Solo uno sciocco pensa di vincere», menu Start/Regole e visualizzazione su mobile e desktop. Questa richiesta sostituisce il vincolo di finestra minima e l'assenza assoluta di scorrimento di SPEC-33: il layout si ridispone, può scorrere verticalmente e offre scorrimento interno alle formule molto larghe, senza tagliare testo o comandi. I dettagli dei gruppi sono espandibili su mobile. Il ridimensionamento di per sé non mette in pausa il timer; resta la protezione per un reale overflow orizzontale non gestito. Regolamento e motore sono invariati. Si vedano ASPETTO_GRAFICO.md e VERIFICHE_IMPLEMENTAZIONE.md per indicazioni e prove correnti.


> **Aggiornamento della distribuzione — interfaccia 1.1.0, su richiesta del responsabile.** Fool viene offerto solo online su GitHub Pages, senza download né selezione di file. Per la distribuzione, questa indicazione sostituisce le precedenti parti locali/offline di SPEC-02, il caricamento manuale della banca di SPEC-05 e l'esportazione/importazione locale di SPEC-30. Le banche, con lo stesso schema SPEC-13 e gli stessi ID, vengono caricate dal catalogo del sito; il rifornimento SPEC-34 consulta le banche online e accetta soltanto quesiti nuovi compatibili. Il salvataggio e la ripresa avvengono nello stesso browser, senza sincronizzazione tra dispositivi. Regolamento 18.0.1, motore e formato dei salvataggi restano invariati. Le sezioni sottostanti conservano l'analisi della precedente consegna: per distribuzione e verifiche correnti consultare README e VERIFICHE_IMPLEMENTAZIONE.md.


Versione: **18.0.1** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

Regolamento di riferimento: [REGOLAMENTO_UFFICIALE.md, v18.0.1](REGOLAMENTO_UFFICIALE.md).

## 1. Scopo, fonti e stato dell’adeguamento

Queste sono le specifiche del comportamento da implementare per **Fool**, allineate al [regolamento ufficiale v18.0.1](REGOLAMENTO_UFFICIALE.md) e alle [specifiche grafiche v1.2.1](ASPETTO_GRAFICO.md). La direzione visiva approvata è **Doom classico, con estetica pixel**; palette, font, logo e dettagli non ancora approvati restano raccolti nel documento grafico, senza inventarli qui.

Il regolamento stabilisce le regole, questo documento le traduce in stati, calcoli, comandi, salvataggi e verifiche, il documento grafico stabilisce la veste visiva. La presentazione HTML deve spiegare le medesime regole e dichiararne la versione.

**Questa revisione aggiorna i documenti; gli HTML sono esclusi su richiesta del responsabile e dovranno essere rifatti.** Le indicazioni «presente» si riferiscono soltanto all’analisi storica del programma HTML v3 al commit `4b7f285cfc4bec5507bed559ada3efa479b29e95`; non attestano conformità alle regole correnti o test in browser. SPEC e ACC restano identificativi stabili.

Le decisioni DEC-01–DEC-21 sono risolte o superate. La probabilità dei bonus è configurabile 0–100%, con valore predefinito **90%**. Le interazioni Aura/Karma sono definite in SPEC-42/43; restano da raccogliere le scelte visive.


## 2. Utenti e distribuzione

- **SPEC-01 — Conduzione (presente).** Un docente conduce il gioco su un dispositivo, eventualmente proiettato. Non è un'applicazione multiplayer con accessi separati. Il docente registra nell'interfaccia la risposta comunicata dal portavoce.
- **SPEC-02 — Uso locale (presente).** Il gioco è un HTML autonomo apribile nel browser senza installazione. Dataset JSON esterno selezionato dall'utente; formule, font e risorse già inclusi devono funzionare anche offline. Non richiede account, server o accesso al registro.
- **SPEC-03 — Interfaccia da adeguare.** Schermate coerenti con Fool e Doom classico secondo SPEC-41, leggibili in proiezione e adattate allo schermo secondo SPEC-33. Comprendere copertina, configurazione, anteprima docente, domanda nascosta, scelta Svela e passa, risposta a tempo, pausa, bonus/bersagli, sanzioni, esito, sospensione/ripresa, spareggio e riepilogo. Focus visibile e uso da tastiera; stati espressi anche con testo, non soltanto colore. L’esistenza di alcune schermate nel vecchio HTML non equivale alla realizzazione di questo requisito.

## 3. Configurazione e anteprima

| ID | Requisito | Stato |
| --- | --- | --- |
| SPEC-04 | Tre nomi di gruppo distinti senza distinzione fra maiuscole e minuscole; nomi vuoti sostituiti da nomi predefiniti | Presente |
| SPEC-05 | Caricamento e validazione del JSON prima dell'estrazione; un nuovo caricamento invalida quello precedente | Presente |
| SPEC-06 | 33 domande ordinarie valide, salvo vittoria anticipata dell’unico gruppo rimasto o sconfitta di tutti. Rifiuto accettato, turno saltato e quesito annullato per eliminazione del rispondente non consumano una domanda valida; prevedere sostituti nella banca | Da adeguare |
| SPEC-07 | Timer unico per domanda, predefinito 45 secondi e personalizzabile a interi 1–600; risposta consentita subito dopo l’avvio, nessuna fase 15+30. Avvio allo svelamento ordinario o dopo la scelta Svela e passa; spareggio eredita lo stesso tempo normale | Da adeguare |
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

## 5. Stati, turni e ordine delle operazioni

La fase di gioco (`ordinaria`, `spareggio`, `conclusa`) è distinta dalla schermata e dall’eventuale pausa. Non cambiare fase o turno per il solo fatto che si apre un dialogo o si ridisegna l’interfaccia.

| Stato | Comando o evento | Comportamento richiesto |
| --- | --- | --- |
| Copertina | Avvia / Riprendi | Configurazione nuova partita oppure caricamento validato di una partita salvata |
| Configurazione | Prepara | Valida banca, tre gruppi distinti, quote, tempo, basi e probabilità; estrae 33 quesiti e prepara anteprima |
| Anteprima docente | Sostituisci / torna indietro | Sostituzione compatibile oppure configurazione; nessun dato mostrato alla classe |
| Anteprima docente | Inizia | Azzera punti, serie, sanzioni, inventari, effetti, salti ed eliminazioni; sorteggia primo gruppo, conserva rotazione e impostazioni |
| Assegnazione turno | Individua gruppo disponibile | Esclude eliminati e consuma un salto per ogni occasione saltata; nessuna domanda svelata o consumata. Poi azzera la quota bonus per il nuovo turno effettivo |
| Domanda nascosta | Svela | Mostra domanda e quattro alternative, avvia il tempo intero, abilita la risposta |
| Domanda nascosta | Attiva Svela e passa | Consuma una copia e l’unica quota bonus del turno; svela domanda e alternative con timer fermo e risposte bloccate |
| Scelta Svela e passa | Rispondi / conferma destinatario | Stessa domanda e alternative; imposta il rispondente effettivo e avvia solo ora il tempo intero |
| Domanda ordinaria, prima o dopo svelamento | Usa Salta turno / Ruba punti | Solo gruppo avente diritto nel proprio turno, copia presente e quota libera; conferma bersaglio attivo, consuma una copia e crea l’effetto. Nessuna azione retroattiva |
| Risposta ordinaria a tempo | Alternativa corretta | Esito unico: incrementa serie, calcola base × moltiplicatore, divide eventuali quote uguali, accredita e risolve effetti; poi una prova bonus ordinaria |
| Risposta ordinaria a tempo | Errore / scadenza | Zero punti, serie azzerata, nessun bonus; consuma gli effetti Ruba punti della risposta; non aggiunge sanzioni |
| Risposta in spareggio | Corretta / errore o scadenza | Corretta: resta in gara e ruota. Errore/scadenza: elimina; niente punti né bonus |
| Risposta a tempo | Pausa | Conserva residuo effettivo e blocca risposte; nessuna avanzata del tempo durante la pausa |
| Pausa | Riprendi | Riparte dal residuo nello stesso stato e con un solo timer, senza rinnovare il tempo |
| Qualunque schermata operativa | Apri pannello sanzioni | Pausa automatica se il timer corre; blocca risposte, bonus e avanzamento finché il pannello è attivo |
| Pannello sanzioni | Conferma sanzione | Prima le sanzioni: +1 contatore, serie a zero, punti invariati; a 3 elimina, cancella bonus/effetti coinvolti e valuta condizioni finali |
| Pannello sanzioni | Chiudi senza sanzionare | Nessuna modifica a serie o contatori; non annulla la pausa preesistente e non riavvia automaticamente il tempo |
| Domanda svelata senza risposta, anche nella scelta Svela e passa | Richiedi rifiuto | Stato docente di valutazione, con timer sospeso se già partito; conserva lo stato di provenienza |
| Valutazione rifiuto | Respinto / annullato | Ritorna allo stato di provenienza: se il timer non era mai partito resta fermo; se correva, usa il residuo |
| Valutazione rifiuto | Accettato | Esclude quel quesito e lo sostituisce allo stesso rispondente, stesso indice valido, serie invariata e quota bonus del turno invariata; tempo intero al nuovo svelamento |
| Esito ordinario registrato | Prossima | Passa al quesito successivo e al successore del rispondente effettivo, anche dopo passaggio; non reincrementa il contatore valido già aggiornato nell’esito. Salti/eliminazioni non consumano il quesito successivo |
| Prima dello svelamento successivo | Campanella / sospendi | Salva e sospende; la fine della lezione non assegna un vincitore |
| Domanda già svelata | Campanella | Imposta sospensione dopo la domanda, da concludere nella lezione; la priorità disciplinare e la fine anticipata prevalgono |
| Partita sospesa | Riprendi | Stesse squadre e stato salvato, timer fermo finché il docente non prosegue; nessun nuovo sorteggio, consumo o estrazione |
| Intervento disciplinare completo | Conta gruppi attivi | Zero: tutti sconfitti; uno: vince subito anche prima delle 33; altrimenti continua |
| Domanda ordinaria valida n. 33 conclusa | Concludi fase ordinaria | Confronta punteggi razionali esatti dei soli attivi; massimo unico vince, parità al primo posto avvia spareggio |
| Ingresso nello spareggio | Prepara extra | Cancella tutti gli inventari ed effetti, sorteggia una volta l’ordine dei soli partecipanti e usa riserva della banca ordinaria con lo stesso tempo |
| Riepilogo definitivo | Nuova partita | Configurazione e nuovo stato iniziale; nessun trascinamento di punti, sanzioni, bonus o salti |

**SPEC-17 — Integrità degli eventi e priorità da implementare.** Un evento logico deve poter essere applicato una sola volta: invio risposta, scadenza, estrazione, bonus, sanzione, sostituzione e avanzamento hanno identificativi o una protezione equivalente. Un ridisegno della schermata non modifica lo stato di gioco. Elaborare prima un intervento disciplinare ancora aperto; poi rivalutare se risposte, timer o azioni in attesa sono ancora leciti. L’apertura del pannello blocca nuovi invii; una terza sanzione annulla la risposta ancora pendente, non crea anche un timeout. Una risposta già definitivamente registrata non viene ricalcolata retroattivamente.

Per una risposta ordinaria valida e non annullata dalla priorità disciplinare: (1) verifica fase, stato, rispondente attivo e scadenza effettiva; (2) registra un unico esito; (3) aggiorna solo la serie del rispondente; (4) calcola il lordo e le quote esatte; (5) accredita simultaneamente e risolve tutti gli effetti relativi alla risposta; (6) esegue l’unica prova bonus prevista se corretta; (7) incrementa una sola volta il contatore delle domande valide; (8) valuta fine partita o attende Prossima. Alla domanda 33 il confronto finale avviene solo dopo tutti gli accrediti.

La durata si basa sulla scadenza temporale effettiva, non sui secondi interi mostrati. Senza intervento disciplinare prioritario, un clic alla scadenza o dopo equivale a tempo scaduto. Contatori distinti: numero di domande valide ordinarie, extra dello spareggio, quesiti svelati, rifiutati o annullati. Non usare l’indice del file estratto come unico conteggio di partita.

**SPEC-18 — Visibilità delle domande da adeguare.** Prima dello svelamento testo e alternative non sono visibili. La scelta Svela e passa è un’eccezione esplicita: domanda e alternative visibili, timer fermo e pulsanti di risposta bloccati fino alla scelta. Solo dopo un esito registrato si mostra la soluzione corretta e la spiegazione. Non rimescolare le alternative durante la stessa domanda, un passaggio, una pausa o una ripresa.


## 6. Punteggi, sanzioni e conclusione

| ID | Requisito | Regole | Stato |
| --- | --- | --- | --- |
| SPEC-19 | Corretta = base × moltiplicatore, con eventuale Ruba punti; errore/scadenza ordinari 0. Nessuna sottrazione disciplinare. Punteggi e contatore sanzioni separati; eliminazione alla terza sanzione anche nella fase ordinaria. Rotazione tra gruppi attivi | REG-02, REG-07–REG-10 | Da adeguare |
| SPEC-20 | Rotazione fra gruppi attivi; un solo bonus per turno. Dopo Svela e passa il successore si calcola dal destinatario rispondente. Salta turno cumulato salta occasioni senza consumare la domanda; niente mantenimento del turno per corretta o blocco dopo tre corrette | REG-02, REG-05, REG-08, REG-26–REG-28 | Da implementare |
| SPEC-21 | Tabellone con titolare del turno e rispondente se diverso, rotazione, punteggi, serie/moltiplicatori, inventario per gruppo con quantità dei cinque bonus, effetti pendenti, contatore sanzioni 0–3, stato eliminato con causa e salti da bonus. Inventario visibile, con tipo e bersaglio obbligato delle copie ottenute da Karma; comandi d’uso attivi solo nel proprio turno | REG-02, REG-08, REG-25–REG-28 | Da adeguare |
| SPEC-22 | Sanzione: pausa automatica del timer all’apertura pannello, incremento contatore e azzeramento serie, punti invariati. Alla terza eliminazione prioritaria, anche durante risposta, e cancellazione bonus/effetti coinvolti. Verificare dopo l’intervento vittoria anticipata o tutti eliminati | REG-10–REG-16, REG-24 | Da implementare |
| SPEC-23 | Rifiuto tempestivo con soli due motivi ammessi; decide il docente. Accettato: sostituto allo stesso gruppo, serie invariata e stesso indice valido. Respinto: riprende residuo; nessun nuovo bonus o punto per il rifiuto | REG-17–REG-19 | Da adeguare |
| SPEC-24 | Dopo ogni eliminazione/intervento disciplinare completato: zero gruppi attivi = tutti sconfitti e nessun 10; uno = vittoria anticipata con 10 blu. Altrimenti dopo 33 domande valide confrontare punti dei soli attivi e applicare eventuale spareggio | REG-10, REG-20, REG-21, REG-23 | Da implementare |
| SPEC-25 | Riepilogo definitivo con punteggi ordinari, esito dello spareggio se presente, vincitore e bonus «10 blu». Spiegare il contributo alla media delle attività fuori verifica e al voto verde di fine anno; nessuna conversione punti/voto, nessuna scrittura automatica su ClasseViva né calcolo della valutazione annuale | REG-20–REG-23 | Da adeguare |

Il registro eventi attuale conserva al massimo otto messaggi in memoria e ne mostra quattro. Il programma attuale non ripristina una partita dopo il caricamento della pagina: **salvataggio e ripresa sono ora requisiti necessari, ancora da implementare** (SPEC-30). L'annullamento dell'ultima operazione resta una possibile miglioria separata.

**SPEC-30 — Sospensione e ripresa (da implementare; REG-20).** Sostituire la conclusione «fine modulo» con una sospensione. Conservare versione del regolamento e formato del salvataggio, identificativo della partita, composizione delle squadre (nomi e membri ove registrati), ordine di rotazione, titolare iniziale del turno, rispondente effettivo e riferimento per il prossimo gruppo, flag bonus già usato nel turno, punteggi razionali esatti di SPEC-40, contatori disciplinari per gruppo, stato e causa di eliminazione, serie individuali, inventario con quantità per tipo e gruppo, copie trasformate da Karma con identità propria, tipo ottenuto e gruppo attaccante ammesso, attivazione o selezione bersaglio da completare, bonus attivati e consumati, effetti pendenti con beneficiario e bersaglio, eventuale protezione Aura attivata con i parametri deliberati, salti temporanei dovuti ai soli bonus, tabella dei punti base effettivi, indice e stato della domanda, contatori di risposte/rifiuti, tempo residuo e impostazioni. Conservare anche le estrazioni di bonus già effettuate e gli esiti associati a ciascuna risposta, per impedire nuove estrazioni alla ripresa. Salvare anche domande estratte, ordine delle alternative e risposte corrette, la banca ordinaria condivisa e l’eventuale riserva residua, ID dei quesiti già svelati in entrambe le fasi e, nello spareggio, partecipanti, eliminati, ordine dei turni e tempo effettivo ereditato dalla fase ordinaria. In caso di rifornimento validare gli ID contro l’intera banca condivisa e i quesiti già svelati; nessun caricamento separato Vero/Falso. Nessuna assegnazione del bonus alla campanella. Non richiedere nominativi degli studenti per il solo funzionamento: il docente può garantire la stessa composizione usando i nomi delle squadre.

Il salvataggio deve sopravvivere alla chiusura del browser e consentire esportazione/importazione di un file locale versionato; l'autosalvataggio locale è complementare, non l'unico mezzo di ripresa. Validare integralmente un salvataggio prima di sostituire la partita attiva; un file non valido o incompatibile deve lasciare intatta la partita. Riprendere con timer fermo fino al comando del docente, senza applicare come tempo trascorso l'intervallo fra le lezioni. Per la sospensione dovuta alla campanella, una domanda già svelata va conclusa nella lezione in corso (REG-20): usare un flag «sospendi dopo questa domanda», impedire lo svelamento successivo e salvare dopo aver registrato l’esito. Se quell’esito o un’eliminazione disciplinare determina il vincitore o la sconfitta di tutti, mostrare il riepilogo definitivo; la priorità disciplinare prevale sul completamento della domanda. Se la domanda 33 produce un pareggio, salvare lo spareggio ancora da iniziare senza svelare una domanda extra. Un eventuale salvataggio tecnico di emergenza non deve essere presentato come il normale rinvio di una domanda già svelata alla campanella. Il file di partita contiene soluzioni ed è destinato al docente.

Il salvataggio deve distinguere i seguenti dati, senza ricavarli dalle sole etichette dell’interfaccia:

| Dato logico | Vincolo |
| --- | --- |
| Versioni e impostazioni | Formato salvataggio, regolamento 18.0.1, tabella basi, tempo e p effettivi; nessuna sostituzione con default alla ripresa |
| Fase e schermata | Fase ordinaria/spareggio/conclusa distinta da domanda nascosta, scelta, risposta, esito, pausa e dialogo |
| Turno | Identificativo del turno, titolare iniziale, rispondente effettivo e riferimento per la rotazione successiva |
| Quota bonus | Un flag comune al turno; passa e rifiuto non lo rinnovano |
| Domanda | ID, testo, ordine delle alternative, risposta corretta, stato già svelata e indice della domanda valida |
| Conteggi | Valide ordinarie, extra, rifiuti e annullamenti distinti; la stessa domanda non produce due incrementi |
| Timer | Durata e residuo; stato non ancora avviato/in corso/in pausa; motivi di pausa e schermata di ritorno |
| Gruppi | Punteggio razionale, serie, sanzioni, stato attivo/eliminato e causa; squadra/composizione invariata |
| Bonus ed effetti | Quantità inventario, beneficiari/bersagli per ogni effetto, contatori salti, attivazioni in corso e copie già consumate |
| Riserva ed eventi | Banca condivisa, ID svelati non riutilizzabili, estrazioni bonus e accrediti già applicati |
| Conclusione/sospensione | Richiesta di sospensione dopo domanda, eventuale vincitore o sconfitta di tutti; nessuna riapertura implicita di una partita conclusa |

Validare coerenza dei dati oltre al JSON: gruppo rispondente esistente, inventari e salti non negativi, serie non negativa, nessun bonus utilizzabile nello spareggio, quota coerente con l’attivazione e punteggi razionali con denominatore positivo. Un salvataggio di una vecchia versione non va reinterpretato automaticamente come compatibile con le nuove regole: migrazione esplicita oppure messaggio di incompatibilità, senza sovrascrivere la partita attiva.

**SPEC-31 — «Battaglia finale» (da implementare; REG-23).** Dopo le 33 domande valide, in caso di parità al massimo tra gruppi attivi, cancellare tutti gli inventari dei bonus e tutti gli effetti pendenti (Salta turno e Ruba punti inclusi), per ogni gruppo. Solo dopo questo reset entrare nello spareggio e salvarne lo stato: la ripresa non deve recuperare bonus eliminati. Sorteggiare una volta l’ordine dei partecipanti; usare quesiti non svelati della banca ordinaria a quattro alternative e lo stesso tempo impostato per la partita. Una corretta mantiene in gara e ruota; errore/scadenza eliminano. Non assegnare o consentire uso di bonus. Le sanzioni continuano, azzerano la serie e alla terza eliminano con priorità. Il rifiuto accettato sostituisce allo stesso gruppo, senza cambiare la serie. Dopo l’intervento completo, un superstite vince il 10 blu; nessun superstite significa sconfitta di tutti. Nessun punto o moltiplicatore aggiuntivo nello spareggio.

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

Errore/scadenza ordinari e ogni sanzione confermata azzerano n. Rifiuto accettato, turno saltato, turni altrui e passaggio senza risposta non lo cambiano. La corretta di una domanda passata incrementa la serie di chi risponde, non quella di chi passa; punti ed eventuale bonus seguono il rispondente. Calcolare guadagno lordo con base configurata SPEC-38 e moltiplicatore di quel gruppo; applicare poi Ruba punti, se attivo.

I predefiniti base restano 100/200/300. Tre facili consecutive valgono 100 + 110 + 120 = 330. Una media alla terza corretta vale 240, non 260. Con più Ruba punti la divisione può produrre frazioni periodiche: conservare punteggi razionali esatti, non limitarsi a centesimi interi. Con configurazioni ampie controllare la rappresentabilità, senza imporre un limite di serie. Il confronto finale usa valori esatti. Nello spareggio non si attribuiscono nuovi punti e i bonus sono cancellati.

**SPEC-36 — Bonus, quota per turno ed effetti (da implementare; REG-25–REG-28).** Catalogo: `salta_turno`, `ruba_punti`, `svela_e_passa`, `aura`, `karma`. Parametro p configurabile prima della partita come percentuale finita 0–100; valore predefinito **90%** e validazione esplicita. Con impostazioni predefinite ciascuno dei cinque tipi ha probabilità complessiva 18% per corretta ordinaria. Una prova di vincita dopo ciascuna corretta ordinaria, poi scelta uniforme di un solo tipo: 1/5 condizionato alla vincita, p/5 complessivo per tipo se p è espresso come probabilità. A p=0 nessun bonus; p=100% un bonus per corretta ordinaria. Nessuna estrazione per errore/scadenza, sanzione, sola quota Ruba punti o corrette nello spareggio. Registrare una sola volta prova ed esito, evitando nuove estrazioni con doppi clic, ridisegni o ripresa.

Karma non si attiva come un attacco generico: la trasformazione passiva è definita in SPEC-43 e non usa la quota del turno. Solo l’uso successivo del bonus trasformato consuma una copia e la quota comune, verificando il bersaglio vincolato.

Accreditare il bonus all’inventario conservabile e accumulabile del rispondente; nessun uso/bersaglio obbligatorio alla vincita e nessun limite inventato all’inventario. Consentire **al massimo una copia attivata per turno** complessivamente, qualunque sia il tipo. Conservare `bonusUsatoNelTurno` anche se un rifiuto sostituisce il quesito, interviene una pausa o la domanda viene passata. Il passaggio non rinnova la quota: il destinatario non può contro-passare o attivare un secondo bonus sulla stessa domanda. Resettare la quota solo all’avvio del turno successivo.

Svela e passa richiede domanda ancora nascosta; Salta turno e Ruba punti sono utilizzabili nel proprio turno prima o dopo lo svelamento, senza applicazione retroattiva a esiti registrati. Il turno termina con l’avanzamento al successivo: un bonus appena vinto può restare in inventario o essere usato prima dell’avanzamento se la quota del turno è ancora disponibile e il tipo è legalmente attivabile. Nessuna attivazione durante pause, dialoghi disciplinari o dopo fine partita. Controllare possesso, turno, quota e bersaglio attivo anche per richieste da scorciatoia; selezione annullata prima di conferma non consuma. Conferma valida: una copia consumata e quota marcata; applicare un solo effetto, salvo blocco da Aura che consuma comunque copia e quota senza applicare il malus. Un tentativo non valido non consuma né copia né quota.

**Salta turno.** Ogni attivazione aggiunge un’occasione da saltare al bersaglio. Due attivazioni lecite in turni diversi o da gruppi diversi sullo stesso bersaglio si sommano. All’assegnazione, un salto consuma una sola occasione del contatore; proseguire nella rotazione fino a un gruppo disponibile, senza scartare, svelare o consumare la domanda. Il salto non azzera la serie. Verificare prima la condizione di unico superstite: non tenere aperta una partita già vinta a causa di salti pendenti.

**Ruba punti.** Consentire più effetti attivi sul medesimo bersaglio, mantenendo per ciascuno beneficiario e bersaglio. Le nuove attivazioni restano soggette a possesso, proprio turno e massimo un bonus attivato per turno. Alla risposta corretta raccogliere i beneficiari attivi **distinti**, aggiungere il bersaglio e calcolare una sola volta il lordo con la nuova serie del rispondente. Con k beneficiari assegnare a ognuno dei k + 1 gruppi lordo/(k + 1), in una transazione unica. Nessun dimezzamento in cascata o bonus del 50% separato per ogni effetto. Più copie dello stesso beneficiario non aumentano il numero delle quote: l’interfaccia deve segnalare l’eventuale attivazione ridondante prima del consumo, senza inventare una quota aggiuntiva. Solo il rispondente modifica la serie ed è eleggibile per l’estrazione; gli accrediti passivi non sono risposte corrette. Con A e C beneficiari su B e lordo 240: 80 ciascuno. Con unico beneficiario e lordo 120: 60 ciascuno. Su errore/scadenza nessuna quota; consumare insieme tutti gli effetti di quella risposta. Turni altrui, salti e rifiuti accettati non consumano gli effetti.

Eliminazione: cancellare inventario dell’eliminato e tutti gli effetti in cui è beneficiario o bersaglio, senza trasferirli. Se viene eliminato un beneficiario Ruba punti, conservare gli effetti degli altri beneficiari sullo stesso bersaglio; determinare le quote dagli effetti ancora validi al momento della risposta. Se è eliminato il bersaglio, cancellare tutti gli effetti su di lui. Nessun ricalcolo retroattivo di quote già accreditate. Ingresso nello spareggio: cancellare tutti gli inventari ed effetti, senza nuove assegnazioni o attivazioni. Fine partita: gli oggetti senza occasioni utili non creano nuove domande né alterano il risultato. Salvare inventari, quota di turno, selezioni in corso, effetti, estrazioni e quote già accreditate; non riapplicare nulla alla ripresa.

La disponibilità dei comandi deve seguire lo stato del motore, non il solo aspetto del pulsante:

| Comando | Condizioni di abilitazione |
| --- | --- |
| Risposta A/B/C/D | Timer di risposta avviato, non in pausa, nessun pannello sanzioni, rispondente attivo; scelta Svela e passa già confermata |
| Svela e passa | Fase ordinaria, proprio turno, domanda nascosta, copia posseduta, quota bonus ancora libera |
| Salta turno / Ruba punti | Fase ordinaria, proprio turno, copia e quota disponibili, nessuna pausa/intervento, bersaglio avversario attivo, nessun esito modificato retroattivamente |
| Tieni / Passa a… | Solo scelta prodotta da Svela e passa attivato; non sono passaggi liberi |
| Pausa / Riprendi | Risposta in corso o pausa effettiva, rispettivamente; Riprendi non deve avviare il timer di una scelta mai conclusa |
| Rifiuta | Domanda svelata e nessuna risposta/esito già registrato; la tempestività e il motivo sono valutati dal docente |
| Prossima | Esito già applicato una sola volta, nessun intervento prioritario aperto e partita non conclusa |
| Pannello sanzioni | Sempre raggiungibile mentre la partita è in corso; sospende il timer, non conferma automaticamente una sanzione |
| Salva / sospendi | Conserva lo stato completo; la sospensione fra lezioni attende la domanda svelata, salvo priorità disciplinare o fine partita |

L’indisponibilità di un comando deve valere anche per tastiera e richieste ripetute. Un comando rifiutato non modifica punti, quota, inventario, timer o domanda.

**SPEC-37 — Svela e passa e rotazione dal destinatario (da implementare; REG-28).** Attivabile solo nel proprio turno prima dello svelamento e se nessun bonus è già stato usato nel turno. Alla conferma consumare una copia e marcare la quota, poi mostrare stessa domanda e quattro alternative **con timer non avviato e risposte bloccate**. Mostrare le scelte «Rispondi» e «Passa a…», con soli destinatari attivi. Nessuna scadenza viene scalata durante la scelta.

Alla conferma di tenere o del destinatario, avviare il **tempo intero configurato** per il gruppo che risponde; non cambiare domanda, ordine delle alternative o contatore. Tenere non restituisce la copia. Un passaggio trasferisce la risposta, non genera un’altra domanda o una nuova quota bonus. Il destinatario non può contro-passare o usare un altro bonus sulla medesima domanda. Applicare le verifiche di eliminazione e disponibilità al bersaglio al momento della conferma; un salto pendente conserva la domanda per il successivo disponibile.

Attribuire risposta, punti, serie ed eventuale estrazione al gruppo che effettivamente risponde. Alla conclusione calcolare il successore di quel gruppo nella rotazione fissa, saltando eliminati e applicando i salti dovuti. Esempio A → B → C: A passa a C, poi il turno va ad A; non va a B per il solo fatto che A fosse il titolare originario. Conservare titolare iniziale, rispondente, scelta in corso, copia consumata, quota bonus e stato di avvio timer nel salvataggio.

Un rifiuto accettato conserva gruppo rispondente e quota già usata, sostituendo il quesito senza riabilitare Svela e passa o ripartire la serie. Il nuovo timer intero parte allo svelamento del sostituto. Alla campanella una domanda già svelata con Svela e passa va comunque conclusa nella lezione, salvo eliminazione prioritaria o fine partita.

**SPEC-38 — Punti base configurabili per difficoltà (da implementare; REG-07).** In configurazione mostrare tre campi distinti:

| Campo del programma | Valore predefinito | Valore JSON della difficoltà |
| --- | --- | --- |
| Punti domanda facile | 100 | `facile` |
| Punti domanda media | 200 | `media` |
| Punti domanda difficile | 300 | `difficile` |

Il docente può modificare ciascun valore prima dell’avvio; accettare interi positivi finiti e rappresentabili esattamente nel formato razionale scelto, rifiutando input vuoti, non numerici, negativi, zero, frazioni o valori che renderebbero non esatti i calcoli della partita. Non imporre rapporti fissi 1:2:3 quando il docente personalizza i tre valori. Il dataset continua a dichiarare la difficoltà nel campo `difficolta`: non deve duplicare il punteggio della configurazione.

All’avvio conservare la tabella effettiva come parte della partita e usare quella per tutte le risposte ordinarie; la ripresa da salvataggio non deve sostituirla con i predefiniti o con le impostazioni di una nuova partita. Mostrare nell’anteprima docente il valore base e nell’esito il dettaglio **base × moltiplicatore = lordo**, con eventuale ripartizione Ruba punti successiva. Non applicare i punti base allo spareggio a eliminazione o al premio finale 10 blu. Le sanzioni non sottraggono punti: usare solo il contatore separato di SPEC-39, senza −1, −100 o penalità proporzionali.

**SPEC-39 — Priorità delle sanzioni ed eliminazione (da implementare; REG-10–REG-16).** Contatore iniziale 0 per gruppo. Apertura del pannello: pausa automatica secondo SPEC-32, senza sanzionare per la sola apertura. Ogni sanzione confermata incrementa il contatore e azzera la serie del gruppo, lasciando invariati punteggio e guadagni già registrati. Non aggiunge salti. Errori, scadenze e bonus non sono sanzioni.

Le sanzioni hanno precedenza su risposte, scadenze, bonus e avanzamenti ancora pendenti. Durante il pannello bloccare tali azioni; se timer o risposta competono con un intervento disciplinare non ancora concluso, risolvere prima quest’ultimo e rivalutare validità/stato del gruppo. Non applicare due volte lo stesso evento e non creare contemporaneamente esito e annullamento della stessa domanda. Un risultato già definitivamente registrato non viene reinterpretato come risposta pendente.

Alla terza sanzione eliminare immediatamente anche il gruppo che sta rispondendo: fermare il suo timer, bloccarne la risposta e non assegnare esito, punti o bonus per la domanda interrotta. Conservarne i punti come storico ma escluderlo da turni, bonus e vittoria. Cancellare inventario ed effetti che lo coinvolgono, inclusi beneficiario e bersaglio di Ruba punti e salti pendenti. Se si prosegue con almeno due attivi, sostituire il quesito interrotto per il successivo gruppo disponibile, senza consumare una delle 33 domande valide; non riproporre la domanda già svelata. Questa è la convenzione operativa del regolamento per gestire il quesito annullato.

Dopo l’intero intervento disciplinare, prima di rispondere, premiare o avanzare, valutare i gruppi attivi: **zero = tutti sconfitti, nessun 10; uno = vincitore immediato con 10**, anche prima delle 33; due o più = prosegue. Se lo stesso intervento conferma sanzioni a più gruppi, completarle tutte prima di dichiarare il vincitore, così l’ultimo superstite temporaneo non vince se viene anch’esso eliminato dall’intervento. Conservare sanzioni, serie e motivi di eliminazione nel salvataggio e nel passaggio allo spareggio. Un rifiuto o la campanella non possono rinviare una terza sanzione confermata.


**SPEC-40 — Quote e punteggi razionali esatti (da implementare; REG-27).** La divisione in parti uguali può essere periodica: lordo 100 con due beneficiari dà 100/3 a ciascuno. Non arrotondare ciascun accredito a 33,33 perdendo 0,01, né assegnare il residuo a un gruppo rompendo l’uguaglianza. Conservare guadagni, quote e totali con numeratore/denominatore ridotti o altra rappresentazione razionale equivalente; somme, confronti finali e parità devono usare i valori esatti, non le stringhe visualizzate. Serializzare nel salvataggio numeratori/denominatori in modo da non perdere precisione e validare denominatori positivi. Eventuali importi approssimati a schermo devono essere riconoscibili come tali e permettere di consultare la quota esatta nell’esito. Eseguire tutti gli accrediti della stessa risposta insieme, prima di determinare vincitore o spareggio. La somma esatta delle quote deve essere uguale al lordo.


**SPEC-41 — Nome e riferimento grafico (da implementare).** Usare **Fool** come nome visibile del gioco nella copertina, nel titolo del documento HTML/browser, nei menu, nei riepiloghi e nella presentazione delle regole. Per la veste grafica seguire [ASPETTO_GRAFICO.md](ASPETTO_GRAFICO.md), mantenendo separati requisiti approvati e dettagli ancora da definire. L’ispirazione a Doom classico e l’estetica pixel non modificano logica di gioco, leggibilità, funzionamento offline o layout operativo richiesti dalle altre specifiche. Usare Fool nei documenti, nel prompt e nei titoli dei dataset. Gli HTML esistenti e i loro nomi rimangono invariati su richiesta del responsabile, in attesa di rifacimento; mantenere validi i riferimenti e la provenienza. Repository, ID e schema non cambiano. Conservare lo spareggio «Battaglia finale».

**SPEC-42 — Aura fino al prossimo turno (da implementare; REG-29).** Aura è uno dei cinque tipi equiprobabili: 1/5 condizionato alla vincita, p/5 complessivo per una corretta ordinaria. Possesso della copia e protezione sono stati distinti. Conferma di attivazione nel proprio turno: consuma una copia e la quota bonus e attiva la protezione fino all’evento di **inizio del prossimo turno dello stesso gruppo**, non al termine del giro generale o del turno di un avversario. Non disattivarla al primo attacco. All’inizio del turno successivo rimuovere la protezione prima delle nuove azioni.

Usare un riferimento all’avanzamento dei turni, non una scadenza in secondi: pause, pannello sanzioni, fine lezione e salvataggio/ripresa non accorciano né rinnovano la durata. Salvare gruppo protetto, turno di attivazione e condizione di scadenza; non estendere la protezione solo perché si riprende il gioco.

Le sanzioni restano prioritarie, azzerano la serie e alla terza eliminano anche un protetto. Eliminazione e ingresso nello spareggio cancellano Aura. Attivazione facoltativa nel proprio turno: nessuna protezione automatica dal solo possesso. Bloccare solo nuovi attacchi; non rimuovere effetti già registrati, anche se pendenti. Svela e passa ricevuto è un malus: con Aura attiva il trasferimento viene bloccato, la domanda resta a chi la stava passando e il timer intero parte quando la scelta è conclusa. Consumo del bonus offensivo e della quota del suo utilizzatore confermati anche in caso di blocco; nessun effetto o evento Karma per il bersaglio protetto. Un’altra copia Aura può essere attivata nel nuovo turno dopo la scadenza, con la quota comune. Mostrare stato e scadenza della protezione.

**SPEC-43 — Karma passivo e bonus vincolato (da implementare; REG-30).** Mantenere `karma` fra i cinque tipi equiprobabili estratti. Una copia Karma posseduta resta in attesa di un nuovo malus effettivamente applicato al possessore da un bonus avversario; non consultare una storia arbitraria degli attacchi precedenti e non offrirne l’attivazione manuale per colpire tutti gli avversari.

Alla trasformazione registrare l’evento originale, il gruppo colpito e il gruppo autore dell’attacco. Sostituire la copia Karma nell’inventario con una copia del tipo di bonus negativo ricevuto, dotata di **bersaglio consentito uguale all’attaccante originale**. Conservare la provenienza: le copie vincolate non sono intercambiabili con quelle libere dello stesso tipo. La trasformazione è un evento automatico distinto dall’uso di un bonus, può avvenire nel turno altrui e non modifica `bonusUsatoNelTurno`. Elaborarla una sola volta per l’evento e per **una sola copia Karma posseduta**, anche con più copie in inventario, evitando duplicati da ridisegno, pausa e ripresa.

Non annullare il malus originale: applicarne normalmente gli effetti al gruppo che lo subisce. Non eseguire un attacco di ritorno immediato, non cancellare o ricalcolare punti già registrati e non incrementare la serie. Le sanzioni non attivano Karma. Un attacco totalmente bloccato da Aura non è un effetto subito e non trasforma una copia. Il momento è l’applicazione dell’effetto al bersaglio: registrazione del salto pendente o del vincolo Ruba punti, oppure trasferimento effettivo di Svela e passa. Non attendere il successivo salto o accredito e non trasformare una seconda copia alla risoluzione. Svela e passa ricevuto trasforma un Karma in Svela e passa vincolato al mittente. Per più copie equivalenti usare un ordine stabile degli ID; non duplicare trasformazioni dopo caricamento.

La copia trasformata rimane conservabile per un uso successivo. Nel proprio turno, con quota libera e nella finestra lecita per il tipo ottenuto, il gruppo può usarla **solo contro l’attaccante registrato**, ancora attivo. Non offrire altri bersagli né aggirare il vincolo tramite scorciatoie o salvataggi modificati. Se l’autore è eliminato, segnalare copia senza bersaglio valido; non convertirla in un bonus libero. Un tentativo non valido non consuma copia o quota.

Esempio: B possiede un Karma e riceve Salta turno da A. Il salto resta su B; il Karma diventa una copia Salta turno di B vincolata ad A. In un successivo turno di B, l’uso consuma la quota e fa saltare il prossimo turno di A. Altro esempio: B riceve Ruba punti da A; la copia trasformata, quando attivata lecitamente, permette a B di applicare Ruba punti soltanto ad A, con B beneficiario e con la ripartizione generale fra gruppi distinti.

Salvare ID della copia, tipo ottenuto, possessore, ID dell’attaccante ammesso ed evento di origine, oltre ai consumi e agli effetti successivi. Alla ripresa non trasformare nuovamente lo stesso Karma né perdere il vincolo. Eliminazione del possessore e ingresso nello spareggio cancellano anche le copie trasformate. Svela e passa ricevuto è un malus; per ogni applicazione si trasforma una sola copia Karma. Non ripristinare turni già conclusi. Aggiornare icone/etichette per mostrare chiaramente «tipo — solo contro gruppo X», senza scegliere ora uno stile visivo non approvato.



## 7. Coerenza fra documenti, programma e presentazione

**SPEC-26 — Gerarchia e manutenzione (procedura da applicare da questa edizione).** Prima di modificare le regole leggere il regolamento; prima di modificare il gioco leggere anche queste specifiche. Le scelte DEC vanno risolte dal responsabile, non dal codice. Ogni modifica deve indicare gli ID interessati e aggiornare versione, data e cronologia.

**SPEC-27 — Tracciabilità della presentazione (da implementare).** Ogni sezione HTML deve essere collegata agli ID REG pertinenti e mostrare la versione del regolamento. Le semplificazioni del linguaggio per la classe devono conservare condizioni, conseguenze ed eccezioni. L'attuale v9 non dichiara la versione di questo documento né descrive tutte le convenzioni operative.

**SPEC-28 — Dati comuni (miglioramento proposto, non implementato).** In una futura implementazione spostare parametri condivisi — gruppi, domande ordinarie, timer condiviso tra le due fasi, formato a quattro alternative comune, punteggi base, incremento del moltiplicatore di serie, parametri approvati dei bonus, premio finale fisso e rotazione fissa — in una configurazione strutturata validata. Il programma e la presentazione devono incorporare gli stessi valori e la stessa versione durante la generazione degli HTML, così da mantenere l'uso offline. Non aggiungere un caricamento di rete obbligatorio. Il regolamento resta la fonte semantica: un JSON di numeri non sostituisce le condizioni espresse nel testo.

**SPEC-29 — Controlli prima di distribuire (da implementare).** Affiancare controlli automatici per punteggi, transizioni, dataset e valori condivisi a una verifica visiva della presentazione. Un controllo dei soli numeri non prova che un testo spieghi correttamente tutte le regole.

## 7.1. Copertura delle regole nelle specifiche

| Regola | Comportamento da implementare | Riferimenti |
| --- | --- | --- |
| REG-01 | Tre squadre equilibrate a cura del docente e portavoce | SPEC-01, SPEC-04 |
| REG-02 | Rotazione e disponibilità dei gruppi | SPEC-20, SPEC-36, SPEC-37 |
| REG-03 | 33 valide, quattro alternative e tempo effettivo comune alle fasi | SPEC-06, SPEC-07, SPEC-13, SPEC-31 |
| REG-04 | Materiale consentito comunicato nella presentazione | SPEC-27 |
| REG-05 | Nessun passaggio libero; eccezione con bonus | SPEC-18, SPEC-20, SPEC-37 |
| REG-06 | Svelamento, timer e risposta del portavoce | SPEC-01, SPEC-07, SPEC-17, SPEC-37 |
| REG-07 | Punti base configurabili e attribuzione al rispondente | SPEC-19, SPEC-35, SPEC-38 |
| REG-08 | Serie, reset e crescita dalla seconda corretta senza tetto | SPEC-35 |
| REG-09 | Errore/scadenza ordinari senza punti o sanzione | SPEC-17, SPEC-19, SPEC-35 |
| REG-10 | Priorità, eliminazione, vittoria anticipata e sconfitta di tutti | SPEC-22, SPEC-24, SPEC-39 |
| REG-11 | Disturbo registrato come sanzione | SPEC-22, SPEC-39 |
| REG-12 | Suggerimento attribuito al gruppo responsabile | SPEC-22, SPEC-39 |
| REG-13 | Protesta sanzionabile senza confonderla con chiarimento | SPEC-22, SPEC-39 |
| REG-14 | Applicazione docente, niente sottrazione punti | SPEC-22, SPEC-39 |
| REG-15 | Salto da bonus distinto da eliminazione | SPEC-20, SPEC-36, SPEC-39 |
| REG-16 | Decisioni del docente e richiesta rispettosa di chiarimento | SPEC-01, SPEC-27 |
| REG-17 | Solo i due motivi ammessi per il rifiuto | SPEC-23 |
| REG-18 | Rifiuto tempestivo prima della risposta | SPEC-23, SPEC-27 |
| REG-19 | Sostituzione allo stesso gruppo e serie invariata | SPEC-23, SPEC-34, SPEC-35 |
| REG-20 | Campanella, conclusione domanda e ripresa | SPEC-24, SPEC-30, SPEC-39 |
| REG-21 | Vincitore ammissibile e 10 blu fisso | SPEC-24, SPEC-25, SPEC-40 |
| REG-22 | Comunicazione della valutazione, registrazione manuale | SPEC-25, SPEC-27 |
| REG-23 | Spareggio con banca comune, niente bonus, eliminazione | SPEC-31, SPEC-34, SPEC-39 |
| REG-24 | Pausa manuale e automatica per sanzioni | SPEC-32 |
| REG-25 | Parametro p, equiprobabilità, inventario e un uso per turno | SPEC-30, SPEC-36 |
| REG-26 | Salta turno cumulabile senza consumo domanda | SPEC-20, SPEC-36 |
| REG-27 | Ruba punti simultanei e quote uguali per gruppi distinti | SPEC-36, SPEC-40 |
| REG-28 | Scelta a timer fermo e rotazione dal destinatario | SPEC-18, SPEC-20, SPEC-37 |
| REG-29 | Aura fino all’inizio del turno successivo; solo nuovi attacchi, compreso Svela e passa; consumo dell’attacco bloccato | SPEC-36, SPEC-42 |
| REG-30 | Karma si trasforma al malus subito; bonus conservato vincolato all’attaccante. Una copia per malus all’applicazione, incluso Svela e passa | SPEC-36, SPEC-43 |

## 7.2. Riferimento grafico e leggibilità

Nome e riferimento visivo sono definiti in SPEC-41 e ASPETTO_GRAFICO.md v1.2.1. Il layout operativo di SPEC-33 deve includere anche inventario, stato di quota bonus, destinatario della domanda, contatori sanzioni e beneficiari Ruba punti, quando pertinenti. Il pixel style non autorizza font illeggibili o formule rasterizzate indistinguibili. Le decisioni grafiche ancora aperte restano nel documento grafico.

## 8. Criteri di accettazione

Questa è una lista di scenari da usare per l’implementazione; non dichiara test già eseguiti. Gli scenari applicano le decisioni consolidate del regolamento, non le varianti superate presenti nella cronologia.

| ID | Scenario | Risultato atteso |
| --- | --- | --- |
| ACC-01 | Avvio con tre nomi e dataset validi | Tre gruppi a zero; un titolare sorteggiato; domanda nascosta (SPEC-04, SPEC-18) |
| ACC-02 | JSON malformato, ID duplicati, tre alternative o LaTeX non valido | Messaggio utile e avvio bloccato (SPEC-05, SPEC-13, SPEC-14) |
| ACC-03 | Quote insufficienti, somma errata o timer fuori intervallo | Preparazione bloccata senza partita parziale (SPEC-06–SPEC-09) |
| ACC-04 | Estrazione e sostituzione in anteprima | Quote rispettate, nessun ID duplicato; sostituzione stesso argomento/difficoltà o messaggio di indisponibilità (SPEC-09, SPEC-10) |
| ACC-05 | Risposta corretta dopo mescolamento delle alternative | Valore base × moltiplicatore aggiunto una sola volta; soluzione coerente e turno al successivo disponibile (SPEC-09/17/19/20/35) |
| ACC-06 | Errore o nessuna risposta ordinaria | Punteggio invariato, serie azzerata e turno al successivo disponibile; nessuna estrazione bonus o penalità automatica (SPEC-19/35/36) |
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
| ACC-34 | 33 domande senza bonus attivati, salti o rifiuti | Rotazione fissa e 11 turni per gruppo; passaggi da bonus da verificare separatamente (SPEC-20/37) |
| ACC-35 | Sospensione/ripresa dopo una risposta corretta | Mantiene la rotazione e il prossimo titolare; nessun passaggio libero o conservazione automatica del turno; Svela e passa richiede una copia (SPEC-20/30) |
| ACC-36 | Corrette, turni altrui, poi errore e nuova corretta | Turni altrui conservano la serie, errore azzera; la corretta seguente riparte da ×1,00 (SPEC-35) |
| ACC-37 | Somma di guadagni decimali e confronto finale | Nessun arrotondamento a interi o errore di rappresentazione; premio finale resta 10 blu fisso (SPEC-19/24/35) |
| ACC-38 | Esito corretto, doppio clic, ridisegno e ripresa da salvataggio | Una sola estrazione bonus e un solo accredito di punti, senza rigenerare l’esito casuale (SPEC-36) |
| ACC-39 | Uso di Salta turno su un avversario e doppio clic | Un bonus consumato, un effetto destinato al prossimo turno del bersaglio; nessun furto di turno o punti. Cumulo e domanda secondo DEC-15 (SPEC-36) |
| ACC-40 | Probabilità 0% e 100%, poi risposta errata o spareggio | 0%: nessun bonus; 100%: esattamente un bonus a ogni corretta ordinaria. Nessuna vincita per errore/scadenza o nello spareggio (SPEC-36) |
| ACC-41 | Bonus vinto, poi attivazione propria o fuori turno | Inventario incrementato senza obbligo; uso fuori turno respinto. Una sola copia per turno; Svela e passa solo a domanda nascosta (SPEC-36/37) |
| ACC-42 | A attiva Ruba punti su B, C gioca prima di B; B risponde alla sua terza corretta facile | Con base 100 lordo 120, quote 60 ciascuno; C non consuma l’effetto; solo serie di B avanza (SPEC-36) |
| ACC-43 | B sbaglia o scade il tempo alla domanda bersaglio | Nessuna quota, serie di B azzerata ed effetto consumato senza rinvio alla futura corretta (SPEC-36) |
| ACC-44 | Salva inventario, attivazione incompleta o ripartizione già eseguita | Ripristina copie, scelta ed effetti senza risorteggi, doppi consumi o accrediti (SPEC-30/36) |
| ACC-45 | Condivisione alla domanda 33 | Entrambi gli accrediti precedono il confronto finale ed eventuale spareggio (SPEC-24/36) |
| ACC-46 | Vincita di più bonus, anche uguali, e ripresa da salvataggio | Quantità accumulate esatte e persistenti; nessun uso o bersaglio obbligatorio alla vincita (SPEC-30/36) |
| ACC-47 | Conferma primo bonus, poi tenta secondo bonus nello stesso turno | Secondo respinto senza consumo; annullare una scelta prima di confermarla non consuma copia/quota (SPEC-36) |
| ACC-48 | Svela e passa e scelta di tenere | Una copia consumata, stessa domanda e alternative, nessun passaggio obbligatorio o domanda aggiuntiva (SPEC-37) |
| ACC-49 | Rotazione A → B → C, A attiva Svela e passa e sceglie C | Scelta a timer fermo; C riceve il tempo intero, stessa domanda e alternative; risposta/serie/bonus a C; il prossimo turno è A (SPEC-37) |
| ACC-50 | Salva durante la scelta Svela e passa e riprendi | Domanda e scelta ripristinate senza doppio consumo; conclusione della domanda già svelata alla campanella resta valida (SPEC-30/37) |
| ACC-51 | Ingresso nello spareggio con bonus e probabilità di test al 100% | Inventari ed effetti svuotati all’ingresso, nessun uso e nessuna nuova estrazione per corrette (SPEC-31/36) |
| ACC-52 | Domande ordinarie ed extra dalla stessa banca | Quattro alternative in entrambe le fasi, risposta corretta preservata dopo il mescolamento e nessun quesito già svelato ripetuto (SPEC-31/34) |
| ACC-53 | Probabilità vuota, non numerica, infinita o fuori 0–100 | Configurazione rifiutata con messaggio chiaro; nessun valore inventato o coercizione silenziosa (SPEC-36) |
| ACC-54 | Estrazione con generatore casuale controllato | Verifica separata della probabilità di vincita e della scelta uniforme tra i cinque tipi; ogni ramo assegna una sola copia. Nessun test statistico instabile usato come unica verifica (SPEC-36) |
| ACC-55 | Salva e riprendi con probabilità personalizzata | Stesso parametro e stessi esiti già sorteggiati, senza ripetizioni o ritorno a un valore predefinito (SPEC-30/36) |
| ACC-56 | Prima corretta con valori predefiniti e serie iniziale zero | Facile 100, media 200, difficile 300: moltiplicatore ×1,00. Seconda corretta ×1,10 (SPEC-35/38) |
| ACC-57 | Tabella personalizzata 150/250/400 e salvataggio/ripresa | Guadagni calcolati sui valori personalizzati; tabella persistente senza ritorno ai predefiniti (SPEC-30/38) |
| ACC-58 | Input punteggio non valido | Configurazione bloccata con messaggio utile; nessuna sostituzione silenziosa con +1 o predefiniti (SPEC-38) |
| ACC-59 | Prima e seconda sanzione con serie di corrette attiva | Contatore 1 poi 2, punti invariati e nessun salto; ogni sanzione azzera la serie (SPEC-22/35/39) |
| ACC-60 | Terza sanzione a un gruppo con il punteggio più alto | Gruppo eliminato, punteggio storico invariato e impossibilità di vincere o agire tramite bonus; prossimi turni lo escludono (SPEC-39) |
| ACC-61 | Due sanzioni, sospensione/ripresa, ingresso nello spareggio e terza sanzione | Contatore conserva 2, poi arriva a 3 ed elimina; nessuna sottrazione di punti o reset tra fasi (SPEC-30/39) |
| ACC-62 | Doppio clic o ripresa dopo conferma sanzione | Un solo evento disciplinare; nessun incremento o eliminazione duplicata (SPEC-39) |
| ACC-63 | Errore ordinario, scadenza ordinaria, bonus Salta turno | Nessuno dei tre eventi incrementa da solo il contatore sanzioni (SPEC-39) |
| ACC-64 | Gruppo eliminato coinvolto in effetti e tentativo di nuovo uso/bersaglio | Inventario ed effetti coinvolti cancellati; nuove operazioni respinte senza consumo di copie altrui (SPEC-36/39) |
| ACC-65 | Cinque corrette consecutive facili, base 100 | Guadagni 100, 110, 120, 130, 140; serie non bloccata a tre né moltiplicatore limitato (SPEC-35) |
| ACC-66 | Rifiuto accettato e turno saltato con serie attiva | Serie invariata; rifiuto sostituito allo stesso gruppo senza avanzare l’indice valido; salto conserva la stessa domanda per il successivo (SPEC-23/35/36) |
| ACC-67 | Due o più Salta turno sullo stesso gruppo, ottenuti con attivazioni lecite | Effetti sommati; perde altrettante occasioni, una per volta; nessuna domanda consumata e serie invariata (SPEC-36) |
| ACC-68 | A ha già Ruba punti su B e C ne attiva un secondo nel proprio turno | Attivazione di C accettata e copia consumata una volta; lordo 240 di B diviso in 80 per A, B e C (SPEC-36) |
| ACC-69 | Ruba punti attivo e B salta o ottiene un rifiuto accettato | Effetto conservato fino alla prossima risposta/scadenza valida di B (SPEC-36) |
| ACC-70 | Svela e passa: attesa nella scelta, poi tiene o passa | Timer e risposte fermi durante scelta; alla conferma parte il tempo intero e copia resta consumata (SPEC-37) |
| ACC-71 | Destinatario tenta bonus o contro-passaggio dopo Svela e passa | Quota della domanda già usata: operazione respinta senza consumo. Rotazione successiva dal destinatario rispondente (SPEC-36/37) |
| ACC-72 | Terza sanzione al rispondente mentre risposta/scadenza è pendente | Sanzione prioritaria: eliminazione, nessun punto/esito/bonus da quella domanda; sostituzione per il successivo se partita prosegue (SPEC-39) |
| ACC-73 | Intervento lascia uno o zero gruppi attivi prima delle 33 | Uno: vittoria immediata e 10 blu; zero: tutti sconfitti, nessun 10. Verifica dopo l’intervento disciplinare completo (SPEC-24/39) |
| ACC-74 | A e C beneficiari su B, poi A viene eliminato | Effetto A→B cancellato; C→B conservato. Alla corretta di B, lordo diviso solo tra B e C. Se B è eliminato, spariscono entrambi gli effetti (SPEC-36/39) |
| ACC-75 | Due beneficiari distinti sullo stesso bersaglio, lordo 100 | Tre quote esatte da 100/3; somma esatta 100 e nessun centesimo assegnato arbitrariamente. Classifica e salvataggio usano valori razionali (SPEC-40) |
| ACC-76 | Più copie dello stesso beneficiario sullo stesso bersaglio | Una sola quota per gruppo distinto; nessuna moltiplicazione del guadagno tramite copie duplicate (SPEC-36/40) |
| ACC-77 | Rifiuto/salto o errore del bersaglio con due effetti attivi | Rifiuto/salto conserva entrambi; errore/scadenza li consuma entrambi senza quote. Ripresa non duplica effetti o accrediti (SPEC-36) |
| ACC-78 | Aggiornamento dell’identità visiva | Nome Fool coerente nelle schermate e nella presentazione; direzione grafica verificata contro ASPETTO_GRAFICO.md senza alterare regole, file storici o compatibilità dei dati (SPEC-41) |
| ACC-79 | Domanda rifiutata durante scelta Svela e passa, poi rifiuto respinto | Ritorno alla scelta con timer mai avviato, senza risposta abilitata o nuovo consumo bonus (SPEC-17/18/23/37) |
| ACC-80 | Esito ordinario, ripetuti Prossima e ripresa dal salvataggio | Contatore valido incrementato solo all’esito, mai due volte dall’avanzamento; prossimo gruppo e quota corretti (SPEC-17/30) |
| ACC-81 | Ripresa con punteggi frazionari, più beneficiari, bonus usato e pausa attiva | Valori razionali, effetti, quota e residuo identici, senza credito, estrazione o timer automatico aggiuntivo (SPEC-30/36/40) |
| ACC-82 | Confronto di regolamento, specifiche, grafica e presentazione | Tutte le 30 regole coperte, con interazioni Aura/Karma definite, versioni fonti dichiarate, nome Fool e Doom classico; niente regole superate reintrodotte dal vecchio HTML (SPEC-26/27/41) |
| ACC-83 | Estrazione bonus dopo definizione completa di Aura | Cinque rami equiprobabili condizionati alla vincita; probabilità complessiva p/5 per ciascuno (SPEC-36/42) |
| ACC-84 | Sanzione a gruppo con Aura attiva | Protezione non blocca la sanzione: contatore incrementato, serie azzerata e terza sanzione eliminatoria (SPEC-39/42) |
| ACC-85 | Inventario Aura, attivazione e ingresso spareggio | Possesso distinto dalla protezione; uso solo nel proprio turno con quota comune; protezione e copie cancellate allo spareggio. Durata fino al prossimo turno, blocco dei soli nuovi attacchi e consumo dell’attacco bloccato (SPEC-42) |
| ACC-86 | Aura attivata; più attacchi e turni avversari prima del prossimo turno proprio | Protezione ancora attiva fino all’inizio del prossimo turno del protetto; non si consuma al primo attacco (SPEC-42) |
| ACC-87 | Inizio prossimo turno del protetto, anche dopo sospensione/ripresa | Aura scade prima delle nuove azioni; nessun rinnovo o scadenza per tempo reale (SPEC-30/42) |
| ACC-88 | B possiede Karma e A applica Salta turno a B | Malus originale su B conservato; una copia Karma trasformata nel tipo con bersaglio A, senza uso della quota e senza attacco immediato (SPEC-43; caso di una sola copia) |
| ACC-89 | Uso successivo della copia ottenuta da Karma | Solo nel proprio turno e con quota libera, bersaglio soltanto l’attaccante originale; altri bersagli respinti senza consumo (SPEC-36/43) |
| ACC-90 | Trasformazione passiva fuori turno dopo aver già usato un bonus nel turno precedente | Nessuna violazione del limite: la trasformazione non è un’attivazione e non consuma quote. L’uso della copia resta un bonus per turno (SPEC-43) |
| ACC-91 | Sanzione, malus precedente al possesso o attacco interamente bloccato da Aura | Nessuna trasformazione Karma per il solo verificarsi di uno di questi eventi (SPEC-39/42/43) |
| ACC-92 | Salva/riprendi con copia Karma trasformata e attaccante poi eliminato | Tipo, provenienza e bersaglio conservati senza doppia trasformazione; copia non utilizzabile contro altri gruppi (SPEC-30/43) |
| ACC-93 | Nuova partita senza personalizzazione della probabilità | p=90%; cinque tipi equiprobabili, ciascuno al 18% complessivo per corretta (SPEC-36) |
| ACC-94 | Aura attivata con Salta turno e Ruba punti già pendenti | Effetti preesistenti conservati; nuovi attacchi bloccati con consumo della copia offensiva e della quota (SPEC-42) |
| ACC-95 | Svela e passa verso gruppo con Aura attiva | Passaggio bloccato, copia offensiva e quota consumate; domanda al mittente, nessuna trasformazione Karma nel protetto (SPEC-37/42/43) |
| ACC-96 | Gruppo con due Karma riceve un malus non bloccato | Una sola copia trasformata all’applicazione; l’altra resta Karma; nessuna seconda trasformazione alla risoluzione (SPEC-43) |
| ACC-97 | Trasferimento Svela e passa a gruppo con Karma e senza Aura attiva | Domanda trasferita e una copia trasformata in Svela e passa vincolato al mittente (SPEC-43) |
| ACC-98 | Possesso Aura senza attivazione | Nessuna immunità automatica; attivazione facoltativa solo nel proprio turno con quota disponibile (SPEC-42) |

## 9. Passi successivi

Le decisioni DEC-01–DEC-21 sono risolte o superate dal regolamento 18.0.1. Implementare le regole correnti e verificare SPEC-42/43. I dettagli tecnici reversibili vanno scelti in coerenza con i requisiti. Gli HTML esistenti restano esclusi da questa revisione, in attesa di rifacimento.

1. Adeguare il motore del gioco: punteggi base configurabili, serie da seconda corretta senza tetto, rotazione dal rispondente, rifiuti sostituiti e salti cumulabili senza consumo domanda.
2. Implementare un bonus per turno, inventario, cinque bonus equiprobabili con p configurabile, Ruba punti simultanei con divisione in parti uguali per gruppi distinti e cancellazioni su eliminazione/ingresso spareggio.
3. Implementare pannello sanzioni con pausa automatica e precedenza disciplinare, azzeramento serie, terza sanzione eliminatoria, vittoria anticipata e sconfitta di tutti.
4. Integrare salvataggio/ripresa, layout verificato senza scorrimento e presentazione allineata alla stessa versione. Il default di p è 90%, configurabile da 0% a 100%, come stabilito dal regolamento 18.0.1.
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
| 14.1.0 | 21/10/2026 | Nome Fool e fonte separata delle specifiche grafiche con riferimento Doom; nuova verifica di coerenza dell’identità |
| 14.1.1 | 21/10/2026 | Precisato il riferimento grafico Doom classico con estetica pixel; riferimento al documento grafico 1.1.0 |
| 15.0.0 | 21/10/2026 | Consolidamento delle specifiche rispetto al regolamento 14.0.1 e grafica 1.1.0: stati, comandi, priorità, conteggi validi, salvataggi razionali e copertura di tutte le regole |
| 15.1.0 | 21/10/2026 | Catalogo di quattro premi equiprobabili e requisiti di Aura; tutela disciplinare invariata, durata e interazioni ancora aperte in DEC-20 |
| 16.0.0 | 21/10/2026 | Aura fino al prossimo turno con scadenza persistente; Karma come quinto premio equiprobabile e requisiti di cronologia, con perimetro di copia da definire |
| 17.0.0 | 21/10/2026 | Karma passivo: copia trasformata dal malus subito, bersaglio obbligato all’attaccante, quota distinta fra trasformazione e uso, provenienza persistente |
| 18.0.0 | 21/10/2026 | Nome Fool; premi di gioco denominati bonus; probabilità predefinita 90%; interazioni Aura e Karma definite, una sola copia trasformata per malus |
| 18.0.1 | 21/10/2026 | Spareggio rinominato «Battaglia finale»; meccaniche invariate |
