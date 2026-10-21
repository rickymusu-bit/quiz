# Chi vuol essere rimandato — Regolamento ufficiale

Versione: **9.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Autorità e ambito

Questo documento è la fonte normativa delle regole del gioco. Il programma e la presentazione HTML devono applicarlo e rappresentarlo fedelmente. Le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) traducono queste regole in requisiti verificabili, senza modificarle.

La versione 9.0.0 introduce Svela e passa, rende tutti i premi conservabili e accumulabili con uso solo nel proprio turno, e riporta lo spareggio alle domande a quattro alternative della banca ordinaria con lo stesso tempo di risposta e senza assegnazione di nuovi premi. Supera uso immediato e dataset separato Vero/Falso. Programma HTML v3 e presentazione v9 devono ancora essere adeguati.

Gli identificativi `REG-xx` restano stabili nelle revisioni, per collegare regole, requisiti e verifiche.

## 2. Preparazione

- **REG-01 — Gruppi.** Il professore forma tre gruppi equilibrati. La responsabilità di bilanciarne la composizione è del professore. Ogni gruppo nomina un portavoce, che comunica la risposta a nome del gruppo.
- **REG-02 — Partenza e rotazione fissa.** Tutti partono da zero punti. Un sorteggio stabilisce il primo gruppo; la rotazione dei tre gruppi viene dichiarata e resta fissa per la partita. Dopo ogni domanda ordinaria conclusa, con risposta corretta, errata o tempo scaduto, la domanda successiva spetta al gruppo seguente della rotazione, tenendo conto delle sanzioni con salto del turno. Una risposta corretta non conserva il turno. Senza premi attivati, salti o rifiuti, le 33 domande si distribuiscono in 11 turni per gruppo; Svela e passa può cambiare chi risponde effettivamente.
- **REG-03 — Formato e tempo.** La fase ordinaria comprende **33 domande**, ciascuna con quattro alternative e una sola risposta corretta. Il tempo predefinito per domanda è un **unico periodo di 45 secondi**, a partire dallo svelamento; si può rispondere fin dall'inizio. Il calcolo «15 secondi per leggere + 30 per rispondere» è una stima organizzativa del docente: non è una suddivisione del tempo di gioco, non blocca le risposte e non va presentato ai giocatori come due fasi. Eventuali domande di spareggio sono aggiuntive rispetto alle 33. Un timer ordinario diverso, se impostato dal docente, va comunicato prima della partita. Lo spareggio usa lo stesso formato a quattro alternative e lo stesso tempo effettivo della fase ordinaria (REG-23). La modalità regolamentare non termina anticipatamente perché finisce una lezione.
- **REG-04 — Materiale consentito.** Sono consentiti solo un foglio bianco, una penna e una calcolatrice. Il foglio deve essere bianco all'inizio e può essere usato per i calcoli durante il gioco. Non si possono consultare appunti.

## 3. Domanda e turno

- **REG-05 — Domanda assegnata e passaggio eccezionale.** Il gruppo di turno deve rispondere alla domanda assegnata; non esiste passaggio libero. L’unica eccezione è il premio Svela e passa (REG-28), che permette di vedere una domanda e scegliere se passarla. Il rifiuto per i motivi REG-17 resta distinto.
- **REG-06 — Risposta.** Allo svelamento vengono mostrate la domanda e le quattro alternative e parte il timer, sia nella fase ordinaria sia nello spareggio. Il portavoce comunica la risposta scelta. Le scelte del premio Svela e passa seguono REG-28 e DEC-17.
- **REG-07 — Punti per risposta corretta.** Una risposta corretta assegna il valore base della domanda moltiplicato per il bonus di serie di REG-08. Il valore base resta 1 punto finché non viene approvata una tabella di punteggi per difficoltà. Dopo l’esito il turno passa comunque al gruppo successivo della rotazione.
- **REG-08 — Moltiplicatore di serie.** Ogni gruppo ha una propria serie di risposte corrette consecutive, contate nei propri turni: i turni degli avversari non interrompono la serie. Ogni corretta della serie aggiunge **10 punti percentuali** al moltiplicatore dei punti guadagnati con quella domanda. Interpretazione esplicita adottata: con n corrette nella serie, inclusa quella appena data, **M = 1 + 0,10 × n**. Quindi prima corretta ×1,10; seconda ×1,20; terza ×1,30, e così via. Il bonus è lineare, non composto: la terza corretta non vale ×1,10³. Si moltiplicano solo i punti della nuova risposta, non il punteggio totale già accumulato. Il punteggio può quindi avere decimali. Una risposta errata o il tempo scaduto interrompono la serie. L’effetto di sanzioni, rifiuti e turni saltati sulla serie resta da precisare in DEC-02. Non ci sono furti di domande né obblighi di passaggio dopo tre corrette. La condivisione del guadagno prevista da Ruba punti segue REG-27, dopo il calcolo del moltiplicatore.
- **REG-09 — Errore e tempo scaduto.** Una risposta sbagliata o il tempo scaduto senza risposta vale **0 punti**: il punteggio resta invariato. Si perdono punti **solo per una sanzione**. La domanda è conclusa e il turno della successiva passa al gruppo successivo della rotazione, tenendo conto di eventuali turni da saltare.
- **REG-10 — Nessuna eliminazione nella fase ordinaria.** Nelle 33 domande ordinarie tutti restano in gioco anche a zero punti o con punteggio negativo. I punti persi per sanzioni possono essere recuperati con risposte corrette.

## 4. Comportamento e sanzioni

| ID | Comportamento | Sanzione al gruppo responsabile |
| --- | --- | --- |
| REG-11 | Disturbare chi risponde: parlare o urlare sopra il portavoce, rumori per distrarre, battere sul banco, interrompere; insulti, prese in giro o provocazioni verso il gruppo che risponde | −1 punto |
| REG-12 | Suggerire a un altro gruppo una risposta o un indizio con parole, lettere, gesti, segnali o risposte scritte mostrate | −1 punto e salto del turno |
| REG-13 | Insulti, urla o espressioni offensive verso il professore; continuare a interrompere o insistere dopo che il professore ha chiuso la discussione | −1 punto e salto del turno |

- **REG-14 — Applicazione.** Il professore indica il comportamento sanzionato e comunica la penalità. La sanzione riguarda il gruppo di chi ha commesso l'infrazione. Per i suggerimenti, si sanziona chi suggerisce anche se chi risponde sbaglia o ignora il suggerimento.
- **REG-15 — Turno saltato.** Saltare il turno significa perdere la prossima occasione in cui il gruppo avrebbe diritto a rispondere; dopo il salto può tornare a giocare. I dettagli dei casi limite sono in §7.
- **REG-16 — Chiarimenti.** Le decisioni del professore sono definitive. Il portavoce può chiedere un chiarimento rispettoso; la richiesta in sé non è un'infrazione.

## 5. Rifiuto di una domanda

- **REG-17 — Motivi ammessi.** Si può chiedere il rifiuto solo per un argomento non ancora svolto oppure per una formattazione errata che impedisce di comprendere la domanda. La difficoltà, da sola, non è un motivo ammesso.
- **REG-18 — Tempestività.** Il rifiuto va richiesto subito, appena svelata la domanda, prima di aver provato a rispondere. Non è definita una finestra numerica in secondi: la tempestività è valutata dal docente.
- **REG-19 — Decisione.** Decide il professore. Se accetta, si passa alla domanda successiva. Le modalità tecniche attuali (pausa del timer, nessuna variazione di punti, stessa titolarità, domanda conteggiata fra quelle estratte) sono documentate nelle specifiche; gli aspetti non espliciti nel regolamento precedente sono distinti in §7.

## 6. Conclusione e riconoscimento

- **REG-20 — Fine della fase ordinaria e campanella.** La fase ordinaria termina dopo le **33 domande**, non alla fine del modulo o della lezione. Se suona la campanella prima di aver concluso la partita, si sospende e si riprende la volta successiva **con le stesse squadre**, conservando punteggi e stato di avanzamento. **Se una domanda è già stata svelata, si deve rispondere a quella domanda anche dopo la campanella**, entro il tempo disponibile: prima si conclude la domanda con risposta o scadenza e se ne registra l’esito, poi si sospende prima di svelare la successiva. La campanella non ferma né rinnova il timer della domanda in corso. Se quell’esito conclude la partita, si registra il vincitore invece di sospendere una partita già terminata. La campanella non determina un vincitore né l'assegnazione del premio. La sospensione vale anche se è in corso lo spareggio.
- **REG-21 — Vittoria e premio fisso.** Dopo le 33 domande vince il gruppo con più punti. Se più gruppi sono a pari merito al primo posto, si applica REG-23. Ai membri del gruppo vincitore viene assegnato **un 10 blu sul registro**, indipendentemente dal punteggio ottenuto: vincere con 7, 10 o 12 punti dà lo stesso premio. Non è necessario raggiungere una soglia e il voto non coincide con il punteggio.
- **REG-22 — Valutazione e registro.** Il 10 blu fa media con le altre attività valutate al di fuori delle verifiche, come **compiti a casa e progetti**. L'insieme di queste valutazioni viene tramutato in **un voto verde alla fine dell'anno scolastico**. Il 10 del quiz è quindi uno dei contributi a quella valutazione, non si trasforma da solo in un 10 verde. Il programma segnala il vincitore e il premio; registrazione del 10, media e attribuzione del voto verde restano al professore. Non sono stabiliti qui pesi o arrotondamenti della media.
- **REG-23 — «Chi vuol essere eliminato».** Se dopo le 33 domande più gruppi sono a pari merito al primo posto, partecipano allo spareggio soltanto quei gruppi. Si usano domande extra **a quattro alternative già presenti nel dataset della partita**, non ancora svelate e coerenti con gli argomenti selezionati; **non serve una banca Vero/Falso separata**. Il tempo è **lo stesso impostato per il gioco normale**: 45 secondi predefiniti, oppure il tempo personalizzato effettivo della partita, in un unico periodo. L’ordine iniziale viene sorteggiato tra le squadre ammesse, poi si procede a turno saltando gli eliminati. Una corretta fa proseguire al successivo gruppo; **errore o tempo scaduto eliminano** il gruppo. Quando ne resta uno, vince la partita e il 10 blu. **Durante lo spareggio non vengono assegnati nuovi premi di gioco**, nemmeno dopo una corretta. Lo spareggio resta una fase a eliminazione, distinta dalla gara ordinaria a punti. L’uso di premi accumulati prima dello spareggio non è ancora deliberato (DEC-14): assenza di nuove assegnazioni non equivale automaticamente a vietarne o consentirne l’uso. I casi disciplinari e di rifiuto seguono DEC-11.

- **REG-24 — Pausa per richiami.** Il professore può mettere in pausa il timer per fare richiami o gestire un’interruzione. Durante la pausa il tempo residuo resta fermo e non si acquisiscono risposte. Il professore riprende la domanda con il tempo residuo, senza far ripartire da zero il tempo della fase: stesso tempo impostato per entrambe le fasi, con valore predefinito 45 secondi. La pausa non modifica punteggi, titolare o turno e si può usare anche nello spareggio. È distinta dalla sospensione della partita fra lezioni.

- **REG-25 — Premi casuali conservabili.** Dopo una risposta corretta **nella fase ordinaria** il gruppo ha una probabilità di ricevere un premio, distinta dal moltiplicatore; errore e scadenza non danno accesso all’estrazione. Catalogo: **Salta turno, Ruba punti, Svela e passa**. Tutti sono **ad azione ritardata**: il gruppo può conservarli per un momento successivo e accumularli, comprese più copie uguali. Non deve usarli o scegliere il bersaglio appena li vince. Può usarli **soltanto nel proprio turno**; il bersaglio si dichiara all’attivazione. Ogni copia si consuma all’uso, mentre l’effetto attivato può restare pendente. Non è stabilito alcun limite numerico all’inventario; accumulare copie non definisce automaticamente quante se ne possano usare nello stesso turno (DEC-14).
- **REG-26 — Premio «Salta turno».** Nel proprio turno, il gruppo può usare una copia conservata e scegliere un avversario: il bersaglio salterà il proprio prossimo turno. La copia si consuma all’attivazione e l’effetto resta pendente fino al salto. L’utilizzatore non prende il posto del bersaglio. Cumuli e gestione della domanda associata restano in DEC-15.

- **REG-27 — Premio «Ruba punti».** Nel proprio turno, il gruppo può usare una copia conservata e scegliere un avversario. La copia si consuma all’attivazione; l’effetto riguarda **la prossima domanda del bersaglio**, non una domanda di un altro gruppo che gioca prima. Se il bersaglio risponde correttamente, il guadagno di quella risposta si divide **a metà** tra bersaglio e gruppo utilizzatore. Si calcola prima il guadagno con il moltiplicatore del bersaglio, poi si assegna il 50% a ciascuno: per esempio 1,30 punti diventano 0,65 a testa. Non si toccano i punti già accumulati. La quota ricevuta non incrementa la serie del beneficiario e non genera per lui un’estrazione premio. Se il bersaglio sbaglia o lascia scadere il tempo, non ci sono punti da dividere e l’effetto termina comunque; non attende una futura corretta. Rifiuti, turni saltati e più effetti sullo stesso bersaglio restano da precisare in DEC-16.

- **REG-28 — Premio «Svela e passa».** Nel proprio turno, il gruppo può usare una copia conservata per **svelare la domanda assegnata e poi decidere** se rispondere o passarla a un altro gruppo a sua scelta. Il passaggio è facoltativo e avviene conoscendo la domanda. La copia si consuma all’attivazione anche se il gruppo decide di tenere la domanda. Senza una copia attivata non è consentito passare. Timer, contromosse del destinatario e rotazione dopo il passaggio restano da precisare in DEC-17.

## 7. Questioni aperte: non sono nuove regole

Questi punti richiedono una decisione esplicita del responsabile prima di cambiare il comportamento interessato. Nel frattempo le specifiche descrivono separatamente ciò che fa la versione attuale.

| ID | Questione da decidere | Comportamento del programma v3 |
| --- | --- | --- |
| DEC-01 | Risolta l’assenza di passaggio libero; eccezione Svela e passa | Il passaggio richiede REG-28; eventuali contro-passaggi seguono DEC-17 |
| DEC-02 | Serie per il moltiplicatore: restano da definire gli effetti di sanzioni, rifiuti e turni saltati | REG-08: serie individuale nei propri turni, errore/scadenza la interrompono; i turni altrui non la azzerano |
| DEC-03 | Formalizzare gli effetti del rifiuto accettato: consumo della domanda o sostituzione e titolare successivo, in coerenza con la rotazione fissa | Il vecchio programma conserva il titolare e consuma una domanda; non è ancora una decisione per il nuovo flusso |
| DEC-04 | Formalizzare il cumulo dei turni saltati nella rotazione fissa | Il vecchio programma accumula salti; i passaggi volontari non esistono più |
| DEC-05 | Una sanzione con salto al gruppo che sta già rispondendo interrompe il turno corrente o riguarda il successivo? | Durante la risposta non interrompe; nella schermata prima dello svelamento applica subito il salto |
| DEC-06 | Risolta per la pausa manuale durante i richiami; resta da decidere se aprire il dialogo sanzioni debba sospendere automaticamente | REG-24: il docente dispone di Pausa/Riprendi; non è prescritto l’avvio automatico della pausa quando apre una sanzione |
| DEC-07 | Risolta: parità al primo posto | Si applica REG-23: spareggio «Chi vuol essere eliminato»; da implementare |
| DEC-08 | Risolta: premio e punteggio | REG-21/22: 10 blu fisso al gruppo vincitore, a prescindere dai punti; sostituisce il voto facoltativo pari al punteggio |
| DEC-09 | Risolta: timer | REG-03: unico periodo di 45 secondi, risposta consentita dall'inizio |
| DEC-10 | Risolta: ordine iniziale dello spareggio | Sorteggio tra le squadre ammesse; rotazione conservata saltando gli eliminati (REG-23) |
| DEC-11 | Risolta l’eliminazione per scadenza nello spareggio; restano da precisare sanzioni, salti del turno e rifiuti nello spareggio | REG-23: errore o tempo scaduto eliminano; le altre casistiche non devono introdurre eliminazioni implicite |
| DEC-12 | Risolta: domanda già svelata alla campanella | Si conclude prima di sospendere; nessun rinvio della risposta alla lezione successiva, nessuna sostituzione dovuta alla sola campanella (REG-20) |
| DEC-13 | Probabilità di premio e distribuzione dei tre tipi | Da stabilire; nessuna percentuale o equiprobabilità implicita |
| DEC-14 | Conservazione, accumulo e uso solo nel proprio turno sono definiti; restano numero di premi per corretta, attivazioni per turno, finestra esatta d’uso e uso in spareggio di premi già accumulati | Nessun nuovo premio assegnato nello spareggio; uso delle copie già possedute ancora da decidere. Bersaglio scelto all’attivazione |
| DEC-15 | Più premi Salta turno sullo stesso bersaglio si cumulano? La domanda del turno saltato si scarta o resta per il successivo gruppo? | Da stabilire insieme alle sanzioni che fanno saltare il turno; nessun trasferimento del turno a chi usa il premio |
| DEC-16 | Come si gestiscono più Ruba punti sullo stesso bersaglio, rifiuti, turni saltati o premi senza future occasioni utili a fine partita? | Da definire; nessun dimezzamento in cascata o trasferimento implicito di effetti nello spareggio |
| DEC-17 | Svela e passa: timer durante la scelta, tempo del destinatario, prossimo turno, attribuzione di serie/punti/estrazioni e possibilità per il destinatario di usare premi propri | Distinguere titolare del turno assegnato e gruppo che risponde; nessun contro-passaggio o riavvio timer implicito |

Il punteggio base per difficoltà resta da definire. Il furto di domande è escluso; Svela e passa è un passaggio consentito da un premio.

## 8. Revisioni

Si aggiorna prima questo documento per ogni variazione delle regole; poi si aggiornano specifiche, programma, presentazione e verifiche pertinenti nella stessa modifica quando viene implementata. Nessuna discrepanza viene risolta copiando automaticamente il comportamento del codice nel regolamento.

I nomi dei documenti restano stabili per non rompere i collegamenti. La versione e la data sono nel documento; Git conserva le versioni precedenti senza duplicare i file nel repository. Una variazione delle regole incrementa la versione principale; chiarimenti compatibili incrementano la secondaria; correzioni editoriali incrementano la patch.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Consolidamento iniziale del regolamento HTML v9, gerarchia delle fonti e questioni aperte |
| 2.0.0 | 21/10/2026 | Errore e scadenza senza penalità; 45 secondi predefiniti (15+30); vittoria per punteggio finale e possibilità del voto blu pari al punteggio; nuovi casi aperti |
| 3.0.0 | 21/10/2026 | 33 domande e ripresa alla lezione successiva; squadre equilibrate a cura del docente; spareggio a eliminazione; timer unico; 10 blu fisso e contributo alla valutazione verde di fine anno |
| 4.0.0 | 21/10/2026 | Pausa manuale per richiami; ordine casuale dello spareggio; scadenza eliminatoria nello spareggio; domanda svelata conclusa anche dopo la campanella |
| 5.0.0 | 21/10/2026 | Spareggio con dataset separato di sole domande Vero/Falso e timer unico di 30 secondi; distinti formato e tempo delle due fasi |
| 6.0.0 | 21/10/2026 | Rotazione fissa anche dopo risposta corretta; aboliti passaggi volontari e obbligo dopo tre corrette; punteggi per difficoltà e bonus restano proposte |
| 7.0.0 | 21/10/2026 | Eliminati furti; moltiplicatore lineare +10% per corretta della serie; premi casuali e primo premio Salta turno, con parametri ancora aperti |
| 8.0.0 | 21/10/2026 | Ruba punti con metà del prossimo guadagno del bersaglio; Salta turno e Ruba punti immediati con bersaglio dichiarato, senza conservazione |
| 9.0.0 | 21/10/2026 | Premi conservabili/accumulabili e uso solo nel proprio turno; Svela e passa; spareggio con dataset ordinario, quattro alternative, stesso timer e nessun nuovo premio |
