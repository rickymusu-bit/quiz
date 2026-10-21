# Chi vuol essere rimandato — Regolamento ufficiale

Versione: **5.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Autorità e ambito

Questo documento è la fonte normativa delle regole del gioco. Il programma e la presentazione HTML devono applicarlo e rappresentarlo fedelmente. Le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) traducono queste regole in requisiti verificabili, senza modificarle.

La versione 5.0.0 aggiunge una banca separata di sole domande Vero/Falso per lo spareggio, con 30 secondi per domanda. Restano valide pausa manuale, ordine casuale dello spareggio, eliminazione per errore/scadenza e conclusione della domanda già svelata dopo la campanella. Il programma HTML v3 e la presentazione v9 devono ancora essere adeguati. Le questioni non definite sono elencate in fondo: il comportamento esistente del codice non costituisce da solo una nuova regola.

Gli identificativi `REG-xx` restano stabili nelle revisioni, per collegare regole, requisiti e verifiche.

## 2. Preparazione

- **REG-01 — Gruppi.** Il professore forma tre gruppi equilibrati. La responsabilità di bilanciarne la composizione è del professore. Ogni gruppo nomina un portavoce, che comunica la risposta a nome del gruppo.
- **REG-02 — Partenza e rotazione.** Tutti partono da zero punti. Un sorteggio stabilisce il primo gruppo titolare della domanda; viene stabilita una rotazione dei tre gruppi, usata dopo un errore o un tempo scaduto.
- **REG-03 — Formato e tempo.** La fase ordinaria comprende **33 domande**, ciascuna con quattro alternative e una sola risposta corretta. Il tempo predefinito per domanda è un **unico periodo di 45 secondi**, a partire dallo svelamento; si può rispondere fin dall'inizio. Il calcolo «15 secondi per leggere + 30 per rispondere» è una stima organizzativa del docente: non è una suddivisione del tempo di gioco, non blocca le risposte e non va presentato ai giocatori come due fasi. Eventuali domande di spareggio sono aggiuntive rispetto alle 33. Un timer ordinario diverso, se impostato dal docente, va comunicato prima della partita. Per lo spareggio valgono il formato Vero/Falso e i 30 secondi stabiliti in REG-23. La modalità regolamentare non termina anticipatamente perché finisce una lezione.
- **REG-04 — Materiale consentito.** Sono consentiti solo un foglio bianco, una penna e una calcolatrice. Il foglio deve essere bianco all'inizio e può essere usato per i calcoli durante il gioco. Non si possono consultare appunti.

## 3. Domanda e turno

- **REG-05 — Scelta prima dello svelamento.** Il gruppo titolare sceglie se tenere la domanda oppure passarla a un altro gruppo a sua scelta. Testo e alternative restano nascosti durante la scelta. La scelta non deve rivelare se la domanda sarà facile o difficile per chi la riceve.
- **REG-06 — Risposta.** Nella fase ordinaria, quando il gruppo decide di rispondere, vengono mostrate la domanda e le quattro alternative e parte il timer. Nello spareggio si mostrano invece l’affermazione e le due risposte Vero/Falso, con il timer di REG-23. Il portavoce comunica la risposta scelta.
- **REG-07 — Risposta corretta.** Una risposta corretta vale +1 punto. Il gruppo può tenere la domanda successiva oppure passarla, prima di conoscerne il testo, salvo REG-08.
- **REG-08 — Tre corrette consecutive.** Dopo tre risposte corrette consecutive, il gruppo deve passare la domanda successiva a un altro gruppo a sua scelta, senza conoscerne il testo.
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
- **REG-23 — «Chi vuol essere eliminato».** In caso di parità al primo posto, partecipano allo spareggio solo i gruppi a pari merito. Si aggiungono domande extra tratte da un **dataset separato**, composto **esclusivamente da affermazioni Vero/Falso**, a cui i gruppi rispondono **a turno**. Per ciascuna domanda dello spareggio sono disponibili **30 secondi in un unico periodo**, a partire dallo svelamento dell’affermazione e delle opzioni Vero/Falso; si può rispondere immediatamente. Il tempo dello spareggio è distinto dai 45 secondi predefiniti della fase ordinaria. L’ordine iniziale dei turni viene **sorteggiato fra i soli gruppi ammessi allo spareggio** e rimane la rotazione di riferimento, saltando i gruppi eliminati. Il gruppo che **sbaglia o lascia scadere il tempo senza rispondere viene eliminato** dallo spareggio. Si continua fino a quando rimane **un solo gruppo**, che vince la partita e il premio. Questa fase si chiama **«Chi vuol essere eliminato»**. La logica della fase ordinaria che consente di tenere o passare la domanda non si applica: qui si risponde a turno. Il tempo scaduto elimina soltanto nello spareggio: nella fase ordinaria resta valido REG-09. I casi disciplinari e i rifiuti nello spareggio ancora da stabilire sono indicati in DEC-11.

- **REG-24 — Pausa per richiami.** Il professore può mettere in pausa il timer per fare richiami o gestire un’interruzione. Durante la pausa il tempo residuo resta fermo e non si acquisiscono risposte. Il professore riprende la domanda con il tempo residuo, senza far ripartire da zero il tempo della fase: 45 secondi predefiniti nella fase ordinaria, 30 secondi nello spareggio. La pausa non modifica punteggi, titolare o turno e si può usare anche nello spareggio. È distinta dalla sospensione della partita fra lezioni.

## 7. Questioni aperte: non sono nuove regole

Questi punti richiedono una decisione esplicita del responsabile prima di cambiare il comportamento interessato. Nel frattempo le specifiche descrivono separatamente ciò che fa la versione attuale.

| ID | Questione da decidere | Comportamento del programma v3 |
| --- | --- | --- |
| DEC-01 | Un gruppo che riceve una domanda passata può passarla di nuovo? Serve un limite per evitare passaggi senza fine? | Può ripassarla senza un limite |
| DEC-02 | Precisare quando si azzera la serie delle tre corrette, in particolare per sanzione o rifiuto | Azzera per errore, passaggio, cambio titolare e sanzione; conserva la serie dopo rifiuto accettato se resta lo stesso titolare |
| DEC-03 | Formalizzare gli effetti del rifiuto: punti, titolare, serie, consumo della domanda o sostituzione | Nessun punto; stesso titolare salvo turni da saltare; consuma una delle domande estratte, senza sostituzione |
| DEC-04 | Formalizzare il cumulo dei turni saltati e il salto quando l'occasione deriva da un passaggio volontario | Ogni sanzione pertinente aggiunge un salto; consuma i salti anche sui passaggi volontari, procedendo nella rotazione |
| DEC-05 | Una sanzione con salto al gruppo che sta già rispondendo interrompe il turno corrente o riguarda il successivo? | Durante la risposta non interrompe; nella schermata prima dello svelamento applica subito il salto |
| DEC-06 | Risolta per la pausa manuale durante i richiami; resta da decidere se aprire il dialogo sanzioni debba sospendere automaticamente | REG-24: il docente dispone di Pausa/Riprendi; non è prescritto l’avvio automatico della pausa quando apre una sanzione |
| DEC-07 | Risolta: parità al primo posto | Si applica REG-23: spareggio «Chi vuol essere eliminato»; da implementare |
| DEC-08 | Risolta: premio e punteggio | REG-21/22: 10 blu fisso al gruppo vincitore, a prescindere dai punti; sostituisce il voto facoltativo pari al punteggio |
| DEC-09 | Risolta: timer | REG-03: unico periodo di 45 secondi, risposta consentita dall'inizio |
| DEC-10 | Risolta: ordine iniziale dello spareggio | Sorteggio tra le squadre ammesse; rotazione conservata saltando gli eliminati (REG-23) |
| DEC-11 | Risolta l’eliminazione per scadenza nello spareggio; restano da precisare sanzioni, salti del turno e rifiuti nello spareggio | REG-23: errore o tempo scaduto eliminano; le altre casistiche non devono introdurre eliminazioni implicite |
| DEC-12 | Risolta: domanda già svelata alla campanella | Si conclude prima di sospendere; nessun rinvio della risposta alla lezione successiva, nessuna sostituzione dovuta alla sola campanella (REG-20) |


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
