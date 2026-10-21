# Chi vuol essere rimandato — Regolamento ufficiale

Versione: **3.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Autorità e ambito

Questo documento è la fonte normativa delle regole del gioco. Il programma e la presentazione HTML devono applicarlo e rappresentarlo fedelmente. Le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) traducono queste regole in requisiti verificabili, senza modificarle.

La versione 3.0.0 recepisce le decisioni del 21/10/2026: 33 domande ordinarie, sospensione alla campanella, spareggio a eliminazione, timer unico e premio fisso. Il programma HTML v3 e la presentazione v9 devono ancora essere adeguati. Le questioni non definite sono elencate in fondo: il comportamento esistente del codice non costituisce da solo una nuova regola.

Gli identificativi `REG-xx` restano stabili nelle revisioni, per collegare regole, requisiti e verifiche.

## 2. Preparazione

- **REG-01 — Gruppi.** Il professore forma tre gruppi equilibrati. La responsabilità di bilanciarne la composizione è del professore. Ogni gruppo nomina un portavoce, che comunica la risposta a nome del gruppo.
- **REG-02 — Partenza e rotazione.** Tutti partono da zero punti. Un sorteggio stabilisce il primo gruppo titolare della domanda; viene stabilita una rotazione dei tre gruppi, usata dopo un errore o un tempo scaduto.
- **REG-03 — Formato e tempo.** La fase ordinaria comprende **33 domande**, ciascuna con quattro alternative e una sola risposta corretta. Il tempo predefinito per domanda è un **unico periodo di 45 secondi**, a partire dallo svelamento; si può rispondere fin dall'inizio. Il calcolo «15 secondi per leggere + 30 per rispondere» è una stima organizzativa del docente: non è una suddivisione del tempo di gioco, non blocca le risposte e non va presentato ai giocatori come due fasi. Eventuali domande di spareggio sono aggiuntive rispetto alle 33. Un timer diverso, se impostato dal docente, va comunicato prima della partita. La modalità regolamentare non termina anticipatamente perché finisce una lezione.
- **REG-04 — Materiale consentito.** Sono consentiti solo un foglio bianco, una penna e una calcolatrice. Il foglio deve essere bianco all'inizio e può essere usato per i calcoli durante il gioco. Non si possono consultare appunti.

## 3. Domanda e turno

- **REG-05 — Scelta prima dello svelamento.** Il gruppo titolare sceglie se tenere la domanda oppure passarla a un altro gruppo a sua scelta. Testo e alternative restano nascosti durante la scelta. La scelta non deve rivelare se la domanda sarà facile o difficile per chi la riceve.
- **REG-06 — Risposta.** Quando il gruppo decide di rispondere, vengono mostrate la domanda e le quattro alternative e parte il timer. Il portavoce comunica la risposta scelta.
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

- **REG-20 — Fine della fase ordinaria e campanella.** La fase ordinaria termina dopo le **33 domande**, non alla fine del modulo o della lezione. Se suona la campanella prima di aver concluso la partita, si sospende e si riprende la volta successiva **con le stesse squadre**, conservando punteggi e stato di avanzamento. La campanella non determina un vincitore né l'assegnazione del premio. La sospensione vale anche se è in corso lo spareggio.
- **REG-21 — Vittoria e premio fisso.** Dopo le 33 domande vince il gruppo con più punti. Se più gruppi sono a pari merito al primo posto, si applica REG-23. Ai membri del gruppo vincitore viene assegnato **un 10 blu sul registro**, indipendentemente dal punteggio ottenuto: vincere con 7, 10 o 12 punti dà lo stesso premio. Non è necessario raggiungere una soglia e il voto non coincide con il punteggio.
- **REG-22 — Valutazione e registro.** Il 10 blu fa media con le altre attività valutate al di fuori delle verifiche, come **compiti a casa e progetti**. L'insieme di queste valutazioni viene tramutato in **un voto verde alla fine dell'anno scolastico**. Il 10 del quiz è quindi uno dei contributi a quella valutazione, non si trasforma da solo in un 10 verde. Il programma segnala il vincitore e il premio; registrazione del 10, media e attribuzione del voto verde restano al professore. Non sono stabiliti qui pesi o arrotondamenti della media.
- **REG-23 — «Chi vuol essere eliminato».** In caso di parità al primo posto, partecipano allo spareggio solo i gruppi a pari merito. Si aggiungono domande extra, a cui i gruppi rispondono **a turno**. Il gruppo che sbaglia viene eliminato dallo spareggio. Si continua fino a quando rimane **un solo gruppo**, che vince la partita e il premio. Questa fase si chiama **«Chi vuol essere eliminato»**. La logica della fase ordinaria che consente di tenere o passare la domanda non si applica: qui si risponde a turno. I dettagli ancora da stabilire sono indicati in DEC-10 e DEC-11.


## 7. Questioni aperte: non sono nuove regole

Questi punti richiedono una decisione esplicita del responsabile prima di cambiare il comportamento interessato. Nel frattempo le specifiche descrivono separatamente ciò che fa la versione attuale.

| ID | Questione da decidere | Comportamento del programma v3 |
| --- | --- | --- |
| DEC-01 | Un gruppo che riceve una domanda passata può passarla di nuovo? Serve un limite per evitare passaggi senza fine? | Può ripassarla senza un limite |
| DEC-02 | Precisare quando si azzera la serie delle tre corrette, in particolare per sanzione o rifiuto | Azzera per errore, passaggio, cambio titolare e sanzione; conserva la serie dopo rifiuto accettato se resta lo stesso titolare |
| DEC-03 | Formalizzare gli effetti del rifiuto: punti, titolare, serie, consumo della domanda o sostituzione | Nessun punto; stesso titolare salvo turni da saltare; consuma una delle domande estratte, senza sostituzione |
| DEC-04 | Formalizzare il cumulo dei turni saltati e il salto quando l'occasione deriva da un passaggio volontario | Ogni sanzione pertinente aggiunge un salto; consuma i salti anche sui passaggi volontari, procedendo nella rotazione |
| DEC-05 | Una sanzione con salto al gruppo che sta già rispondendo interrompe il turno corrente o riguarda il successivo? | Durante la risposta non interrompe; nella schermata prima dello svelamento applica subito il salto |
| DEC-06 | Durante una sanzione disciplinare si sospende il timer? | Il dialogo sanzioni non sospende il timer |
| DEC-07 | Risolta: parità al primo posto | Si applica REG-23: spareggio «Chi vuol essere eliminato»; da implementare |
| DEC-08 | Risolta: premio e punteggio | REG-21/22: 10 blu fisso al gruppo vincitore, a prescindere dai punti; sostituisce il voto facoltativo pari al punteggio |
| DEC-09 | Risolta: timer | REG-03: unico periodo di 45 secondi, risposta consentita dall'inizio |
| DEC-10 | Quale gruppo inizia lo spareggio e in quale ordine si procede? | Da decidere; l'ordine influisce sulle possibilità di vittoria nello spareggio a eliminazione immediata |
| DEC-11 | Nello spareggio il tempo scaduto elimina come una risposta sbagliata? Come si applicano sanzioni, salti del turno e rifiuti? | Da decidere prima di implementare quei casi; non estendere automaticamente l'eliminazione a eventi diversi dall'errore |
| DEC-12 | Se la campanella suona durante una domanda già svelata, si riprende dal tempo residuo o si usa una domanda sostitutiva? | La sospensione è stabilita; il trattamento della domanda svelata resta da decidere, considerando il tempo aggiuntivo di riflessione tra lezioni |


## 8. Revisioni

Si aggiorna prima questo documento per ogni variazione delle regole; poi si aggiornano specifiche, programma, presentazione e verifiche pertinenti nella stessa modifica quando viene implementata. Nessuna discrepanza viene risolta copiando automaticamente il comportamento del codice nel regolamento.

I nomi dei documenti restano stabili per non rompere i collegamenti. La versione e la data sono nel documento; Git conserva le versioni precedenti senza duplicare i file nel repository. Una variazione delle regole incrementa la versione principale; chiarimenti compatibili incrementano la secondaria; correzioni editoriali incrementano la patch.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Consolidamento iniziale del regolamento HTML v9, gerarchia delle fonti e questioni aperte |
| 2.0.0 | 21/10/2026 | Errore e scadenza senza penalità; 45 secondi predefiniti (15+30); vittoria per punteggio finale e possibilità del voto blu pari al punteggio; nuovi casi aperti |
| 3.0.0 | 21/10/2026 | 33 domande e ripresa alla lezione successiva; squadre equilibrate a cura del docente; spareggio a eliminazione; timer unico; 10 blu fisso e contributo alla valutazione verde di fine anno |
