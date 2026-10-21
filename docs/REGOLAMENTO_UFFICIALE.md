# Chi vuol essere rimandato — Regolamento ufficiale

Versione: **1.0.0** · Data: **21/10/2026** · Responsabile: **Riccardo Musumarra**

## 1. Autorità e ambito

Questo documento è la fonte normativa delle regole del gioco. Il programma e la presentazione HTML devono applicarlo e rappresentarlo fedelmente. Le [specifiche del programma](SPECIFICHE_PROGRAMMA.md) traducono queste regole in requisiti verificabili, senza modificarle.

La prima edizione consolida il regolamento HTML v9 presente nel repository. Non certifica che il programma e la presentazione siano già conformi a ogni requisito delle specifiche. Le questioni non definite sono elencate in fondo: il comportamento esistente del codice non costituisce da solo una nuova regola.

Gli identificativi `REG-xx` restano stabili nelle revisioni, per collegare regole, requisiti e verifiche.

## 2. Preparazione

- **REG-01 — Gruppi.** La classe si divide in tre gruppi. Ogni gruppo nomina un portavoce, che comunica la risposta a nome del gruppo.
- **REG-02 — Partenza e rotazione.** Tutti partono da zero punti. Un sorteggio stabilisce il primo gruppo titolare della domanda; viene stabilita una rotazione dei tre gruppi, usata dopo un errore o un tempo scaduto.
- **REG-03 — Formato ordinario.** La partita ordinaria comprende 33 domande, ciascuna con quattro alternative e una sola risposta corretta. Il tempo ordinario è di 30 secondi per domanda, a partire dallo svelamento. Il programma attuale consente sessioni ridotte e un timer diverso: sono varianti organizzative che il docente deve comunicare prima dell'inizio, anche nella presentazione se usata per quella sessione.
- **REG-04 — Materiale consentito.** Sono consentiti solo un foglio bianco, una penna e una calcolatrice. Il foglio deve essere bianco all'inizio e può essere usato per i calcoli durante il gioco. Non si possono consultare appunti.

## 3. Domanda e turno

- **REG-05 — Scelta prima dello svelamento.** Il gruppo titolare sceglie se tenere la domanda oppure passarla a un altro gruppo a sua scelta. Testo e alternative restano nascosti durante la scelta. La scelta non deve rivelare se la domanda sarà facile o difficile per chi la riceve.
- **REG-06 — Risposta.** Quando il gruppo decide di rispondere, vengono mostrate la domanda e le quattro alternative e parte il timer. Il portavoce comunica la risposta scelta.
- **REG-07 — Risposta corretta.** Una risposta corretta vale +1 punto. Il gruppo può tenere la domanda successiva oppure passarla, prima di conoscerne il testo, salvo REG-08.
- **REG-08 — Tre corrette consecutive.** Dopo tre risposte corrette consecutive, il gruppo deve passare la domanda successiva a un altro gruppo a sua scelta, senza conoscerne il testo.
- **REG-09 — Errore e tempo scaduto.** Una risposta sbagliata o il tempo scaduto senza risposta vale −1 punto. La domanda è conclusa e il turno della successiva passa al gruppo successivo della rotazione, tenendo conto di eventuali turni da saltare.
- **REG-10 — Nessuna eliminazione.** Tutti restano in gioco anche a zero punti o con punteggio negativo. I punti persi possono essere recuperati con risposte corrette.

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

- **REG-20 — Fine della sessione.** La sessione termina alla fine delle domande oppure alla fine del modulo, dichiarata dal docente. Il raggiungimento dei 10 punti da parte di un gruppo non termina la sessione.
- **REG-21 — 10 blu.** Il 10 blu sul registro ClasseViva spetta solo ai membri dei gruppi che hanno raggiunto almeno 10 punti entro la conclusione. Più gruppi possono ottenere il riconoscimento: il successo di uno non esclude gli altri. Il requisito è aver raggiunto la soglia, anche se il punteggio scende successivamente.
- **REG-22 — Registro.** Il programma segnala i gruppi che hanno raggiunto la soglia. L'assegnazione del voto sul registro resta un'operazione del docente.

Non si introduce un vincitore unico né uno spareggio: il regolamento HTML v9 non li definisce. L'indicazione precedente «vince il primo a 10» non è compatibile con la prosecuzione prevista qui e non è adottata.

## 7. Questioni aperte: non sono nuove regole

Questi punti richiedono una decisione esplicita del responsabile prima di cambiare il comportamento interessato. Nel frattempo le specifiche descrivono separatamente ciò che fa la versione attuale.

| ID | Questione da decidere | Comportamento del programma v3 |
| --- | --- | --- |
| DEC-01 | Un gruppo che riceve una domanda passata può passarla di nuovo? Serve un limite per evitare passaggi senza fine? | Può ripassarla senza un limite |
| DEC-02 | Precisare quando si azzera la serie delle tre corrette, in particolare per sanzione o rifiuto | Azzera per errore, passaggio, cambio titolare e sanzione; conserva la serie dopo rifiuto accettato se resta lo stesso titolare |
| DEC-03 | Formalizzare gli effetti del rifiuto: punti, titolare, serie, consumo della domanda o sostituzione | Nessun punto; stesso titolare salvo turni da saltare; consuma una delle domande estratte, senza sostituzione |
| DEC-04 | Formalizzare il cumulo dei turni saltati e il salto quando l'occasione deriva da un passaggio volontario | Ogni sanzione pertinente aggiunge un salto; consuma i salti anche sui passaggi volontari, procedendo nella rotazione |
| DEC-05 | Una sanzione con salto al gruppo che sta già rispondendo interrompe il turno corrente o riguarda il successivo? | Durante la risposta non interrompe; nella schermata prima dello svelamento applica subito il salto |
| DEC-06 | Durante una sanzione disciplinare si sospende il timer? Alla fine del modulo una domanda in corso è annullata senza punti? | Il dialogo sanzioni non sospende il timer; la chiusura del modulo non attribuisce punti alla domanda ancora in corso |

## 8. Revisioni

Si aggiorna prima questo documento per ogni variazione delle regole; poi si aggiornano specifiche, programma, presentazione e verifiche pertinenti nella stessa modifica quando viene implementata. Nessuna discrepanza viene risolta copiando automaticamente il comportamento del codice nel regolamento.

I nomi dei documenti restano stabili per non rompere i collegamenti. La versione e la data sono nel documento; Git conserva le versioni precedenti senza duplicare i file nel repository. Una variazione delle regole incrementa la versione principale; chiarimenti compatibili incrementano la secondaria; correzioni editoriali incrementano la patch.

| Versione | Data | Modifica |
| --- | --- | --- |
| 1.0.0 | 21/10/2026 | Consolidamento iniziale del regolamento HTML v9, gerarchia delle fonti e questioni aperte |
